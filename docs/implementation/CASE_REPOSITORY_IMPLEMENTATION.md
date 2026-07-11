---
status: Implemented and verified against clarity_dev
owner: TBD
version: 1.0.0
last_integrated: 2026-07-11
source_artifacts:
  - packages/domain-contracts/src/organizationScope.ts (contract, corrected)
  - packages/domain-contracts/src/audit.ts (audit contract)
  - prisma/schema.prisma + migration 20260710233252_initial_clarity_foundation
unresolved_conflicts: "caseKey maps to the row primary key (global uniqueness) — see Limitations"
related_requirements: REQ-001, REQ-002, REQ-003 (CASE_CREATED / CASE_STATUS_CHANGED / CASE_WORKSTREAM_CHANGED)
related_adrs: ADR-0001, ADR-0002
---

# Case Repository Implementation

First real persistence capability: a Prisma-backed, tenant-scoped implementation of the `CaseRepository` contract with atomic audit recording, verified against the migrated local PostgreSQL database `clarity_dev`.

## Contract implemented

`CaseRepository<PersistedCase>` from `@clarity/domain-contracts`, implemented by `PrismaCaseRepository` in `packages/case-repository/`:

- `create(organizationId, data, actor, options?)`
- `findByKey(organizationId, caseKey)`
- `listForOrganization(organizationId)`
- `transitionStatus(organizationId, caseKey, to, actor, options?)`
- `updateWorkstream(organizationId, caseKey, workstream, to, actor, options?)`

### Contract corrections (documented, minimal)

The pre-existing contract was **synchronous** and had only create/find/list. That was impossible to implement against Prisma (async I/O) and impossible to port the persisted state-transition baselines to. Corrections made in `organizationScope.ts` (with an in-code changelog comment):

1. Methods return `Promise`s.
2. Every mutation takes an `AuditActor` — the audit contract requires actor type and id on every event, so the interface must carry it.
3. `transitionStatus` / `updateWorkstream` added. They introduce **no new domain semantics** — they persist the existing pure state machines (`canTransitionCase`, `canTransitionWorkstream`), which are revalidated inside the transaction.
4. `assertNoRestrictedFields` exported from `audit.ts` so the persistence layer reuses the same guard the in-memory log used.

No other contract or schema change was needed; **no new migration was generated**.

## Tenant-scoping strategy

The tenant identifier is `organizationId` (the established schema field; no second tenant concept introduced).

- Reads: `findFirst({ where: { id: caseKey, organizationId } })` — the tenant is in the database predicate; a case id alone is never sufficient.
- Writes: `updateMany({ where: { id, organizationId, <expected prior state> } })` — the tenant condition is enforced **in the write itself**, plus optimistic concurrency on the prior state (count ≠ 1 aborts the transaction).
- Lists: `findMany({ where: { organizationId } })`.
- Cross-tenant misses are indistinguishable from nonexistent cases: `findByKey` returns `undefined` either way; mutations throw the same `CaseNotFoundError` message either way (verified by test).
- Duplicate-key errors (`P2002`) are rethrown as a generic "key is unavailable" that does not confirm where the key is in use.
- Audit rows carry `organizationId` and are queried tenant-scoped in tests.

## Transaction boundaries and audit behavior

Every mutation runs in one `prisma.$transaction`:

```text
scoped read → state-machine validation → scoped conditional write → audit insert → scoped re-read
```

- Audit actions come from the REQ vocabulary: `CASE_CREATED`, `CASE_STATUS_CHANGED`, `CASE_WORKSTREAM_CHANGED`.
- Events include organizationId, caseId, actorType/actorId, action, objectType/objectId, optional reason, metadata (as `modelMetadata` JSON), and an explicit `timestamp` from an injectable clock (`now: () => Date`, defaulting to system time; tests inject a deterministic ticking clock).
- `previousStateHash`/`newStateHash` are **not** populated — the current contract does not require them (the schema fields are nullable); noted as future work when the hash-ledger concept from `app/` graduates.
- The restricted-field guard runs before the insert, inside the transaction: metadata containing member IDs, Medicare numbers, policy numbers, SSNs, or credentials aborts the entire mutation.
- Append-only: the repository layer exposes no update or delete of audit rows anywhere. Failure-path tests prove a failing audit write rolls back both case creation and status transitions.
- Read operations write no audit events (contract does not require it).

## Mapping strategy

Centralized in `mappers.ts`:

- `caseKey` ↔ row primary key `id` (client-supplied; see Limitations).
- Eight workstream statuses ↔ eight typed columns via the `WORKSTREAM_COLUMNS` table.
- Enum values are validated against the contract arrays in **both** directions — a row value outside the contract throws instead of leaking.
- `openedAt`/`closedAt` surfaced as `Date`/`Date | null`; `closedAt` is stamped when a case transitions to `CLOSED`.
- Prisma types never cross the package boundary; domain contracts stay Prisma-free.
- No raw SQL in the implementation (the test harness uses one parametrizable `_prisma_migrations` existence check).

## Database test isolation

- Guard: `assertLocalClarityDevDatabase()` refuses any database other than `clarity_dev` on localhost, and the harness verifies the foundation migration is applied before any write.
- Isolation model: **namespaced synthetic records with deterministic cleanup** (an established option). Each test file creates its own tenants (`synthetic-org-a-<uuid>` …) so parallel files and repeated runs cannot collide; `dispose()` deletes only records belonging to those tenant ids, FK-safe order.
- Verified after the full run: zero `synthetic-org-%` organizations, zero cases, zero audit events remain in `clarity_dev`.
- All test data is synthetic (`SYNTHETIC_ONLY` patient tokens, `example.test` emails).

## Error behavior

Plain `Error`s consistent with the existing contract style, plus one named subclass `CaseNotFoundError` for the uniform miss. Invalid transitions reuse the exact messages of the pure state machines ("Invalid case transition: X -> Y").

## Known limitations

1. **`caseKey` is globally unique**, not per-organization unique, because it maps to the primary key. Two tenants cannot use the same caseKey; the failure mode is a generic non-confirming error. A per-org `@@unique([organizationId, caseKey])` column is the right fix when a schema change is next warranted (OD-8 scope).
2. `AuditEvent.caseId` has `onDelete: Cascade` in the schema — deleting a case row via raw access would delete its audit trail. The repository exposes no delete, but DB-level append-only enforcement (triggers/permissions) does not exist yet.
3. State hashes, assigned users, documents, evidence, and all other case relations are untouched — this issue persists the case spine only.
4. No connection pooling/lifecycle management beyond a plain `PrismaClient` — service-runtime concerns arrive with the first service.
5. Concurrency protection is optimistic (prior-state predicate); no row locking. Adequate for the current single-writer reality.

## Files changed

| File | Purpose |
|---|---|
| `packages/domain-contracts/src/organizationScope.ts` | Contract correction: async, AuditActor, two mutation methods |
| `packages/domain-contracts/src/audit.ts` | Export `assertNoRestrictedFields` |
| `packages/case-repository/package.json` | New workspace package |
| `packages/case-repository/src/prismaClient.ts` | Client factory + clarity_dev test guard |
| `packages/case-repository/src/mappers.ts` | Row↔domain mapping, enum validation |
| `packages/case-repository/src/auditWriter.ts` | Injectable append-only audit writer |
| `packages/case-repository/src/prismaCaseRepository.ts` | The repository implementation |
| `packages/case-repository/src/index.ts` | Package exports |
| `tests/integration/helpers/harness.ts` | Two-tenant DB harness, namespaced cleanup, ticking clock |
| `tests/integration/{case-repository,tenant-isolation,audit-persistence,synthetic-seed}.test.ts` | 30 DB-backed tests |
| `tsconfig.json`, `vitest.config.ts`, `package-lock.json` | Workspace wiring |
| `docs/implementation/CASE_REPOSITORY_IMPLEMENTATION.md`, `docs/testing/CASE_REPOSITORY_TEST_MANIFEST.md`, `IMPLEMENTATION_STATUS.md` | Documentation |
