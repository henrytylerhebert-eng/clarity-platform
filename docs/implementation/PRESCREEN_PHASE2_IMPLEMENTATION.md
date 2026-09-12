# Prescreen Phase 2 implementation (command service + in-memory gateway)

**Date:** 2026-07-19 · **ADR:** ADR-0013 · **Package:** `packages/prescreen-service`
**Approved scope:** controlled prescreen command service and in-memory gateway only.

## Historical scope and later implementation

The scope and test results below describe the July 19 Phase 2 slice. Phase 3
subsequently merged in PR #32; current `packages/api-service/src/devMain.ts`
wires `PrismaPrescreenGateway`. See the [persistence test manifest](../testing/PRESCREEN_PERSISTENCE_TEST_MANIFEST.md)
for its dated evidence. Phase 2's in-memory/no-API statements are historical
slice boundaries, not a description of the current platform. This recovery
reran no prescreen tests.

## What was built

| File | Responsibility |
|---|---|
| `src/commands.ts` | Strict Zod envelopes for the six mutating commands and the readiness view; prescreen actor schema with free-form role codes (synthetic-only; see role-mapping decision packet) |
| `src/permissions.ts` | Injected role policy type, `SYNTHETIC_PRESCREEN_TEST_POLICY`, permission assertion raised before any read |
| `src/errors.ts` | Stable error classes, each carrying a `PRESCREEN_ERROR_CODES` code; non-revealing not-found messages |
| `src/canonical.ts` | Recursive key-sorted canonical JSON + SHA-256 (fixes the reference package's nested-body fingerprint defect) |
| `src/gateway.ts` | `PrescreenGateway` contract: atomic per-command methods, tenant-scoped snapshots, audit/outbox/idempotency inspection |
| `src/inMemoryPrescreenGateway.ts` | Stage-then-commit in-memory implementation: all validation before any mutation; audit event + outbox envelope + idempotency record commit with the state change or not at all |
| `src/prescreenCommandService.ts` | The single controlled path: parse → policy → gateway |

Contracts consumed from Phase 1 (`@clarity/domain-contracts`): encounter/assessment
state machines, pathway derivation (medical-stabilization precedence),
packet-readiness evaluation, event envelope schema (six adopted event types),
`AppendOnlyAuditLog` + `assertNoRestrictedFields`.

## Behavior proven by tests (tests/unit/prescreen-service.test.ts, 25 tests)

All fourteen owner completion criteria are covered — see
`docs/testing/PRESCREEN_SERVICE_TEST_MANIFEST.md` for the mapping.

## Honest boundaries

- **In-memory only.** Nothing survives a process restart. No durability is
  claimed; the outbox records envelopes and delivers nothing.
- **Same-organization synthetic operation.** Submission records a target and
  receiving organization as intent; the receiving organization gains no read
  path (proven by test). Cross-organization receipt/sharing is deferred.
- **Synthetic role policy.** No production roles were created or mapped;
  production mapping is an open decision packet.
- **No API, no UI, no Prisma, no migrations, no Product Studio, no feature
  flags, no deployment surface.** `git diff` touches only the new package,
  its tests, docs, `package-lock.json` (workspace link), and status records.
- **Deviation noted:** event payloads use hashes instead of the package
  catalog's illustrative free-text fields (audit-metadata invariant wins).
- **recordedTime = occurredAt** in the in-memory gateway for determinism; a
  persistence adapter must stamp server time (Phase 3 concern).

## Verification (this session, local)

- Focused: 25/25 prescreen-service tests (25 after post-merge review hardening); 35/35 prescreen-contract tests.
- Root suite: 328/328. App suite: 64/64 (unchanged by this slice).
- `npm run typecheck`, `npm run lint`, `npx prisma validate`: pass.
- Prisma schema untouched (`git diff --stat prisma/` is empty).

## What Phase 3 receives

The exact atomic write set per command (encounter, assessment versions,
requirements, submission record, idempotency record, audit event, outbox
row, version-bump predicate), the stable error surface, and the canonical
fingerprint rule — all as executable specification, gated behind the
separate provider-backed Cloud SQL/RLS verification.
