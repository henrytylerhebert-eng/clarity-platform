# ADR-0016: Prescreen Phase 3 Persistence (Local Bounded Slice)

- **Status:** Accepted (owner-authorized 2026-07-19)
- **Owner ruling:** local-only Phase 3 persistence authorized on the same
  terms as the S2 episode-persistence slice; explicitly NOT provider-backed
  Cloud SQL verification, which remains a separate, non-waived gate.
- **Numbering note:** this ADR takes 0016, not 0015. Merged `main` holds
  ADR-0014 (prescreen role mapping); open PR #29 also claims ADR-0014 for
  network-enrichment contracts and PR #30 references ADR-0015. 0015 is left
  free so the network-enrichment branch can renumber onto it without a
  third collision.

## Context

Phase 2 (ADR-0013) shipped the prescreen command service against an
in-memory gateway: seven commands, a production role policy (ADR-0014),
seven HTTP routes, and 74 tests — all on state destroyed by a process
restart. Every other service in the repository already has a Prisma
gateway. The owner authorized making prescreen state durable against local
`clarity_dev` only.

## Decisions

1. **Async gateway contract.** `PrescreenGateway` and
   `PrescreenCommandService` became Promise-based so the in-memory test
   double and the Prisma adapter share one interface. The in-memory bodies
   are unchanged (no interior awaits — no interleaving window).

2. **Contracts moved to `domain-contracts`.** Command envelopes, error
   classes, canonical serialization, parsed shapes, and result contracts
   moved to `packages/domain-contracts/src/prescreenCommands.ts` (the S2
   `AdmissionHandoffCommand` placement), re-exported unchanged by
   `prescreen-service`. This keeps the one-Prisma-package invariant: the
   adapter imports contracts only, and throws the SAME error classes the
   API layer matches with `instanceof`. `domain-contracts` stays
   runtime-pure — the SHA-256 wrappers live with the callers.

3. **Four tenant-scoped tables** (`PrescreenEncounter`,
   `PrescreenAssessmentVersion`, `PrescreenPacketRequirement`,
   `PrescreenSubmission`), enums mirroring the Phase 1 contract arrays.
   Assessment answers/sources/orientation are immutable value objects
   stored as `Json` and covered by the content hash — not relationally
   queried in this slice. The assessment domain id is unique **per tenant**
   (`organizationId, assessmentVersionId`), preserving the proven
   no-cross-tenant-disclosure property. Encounter ids are server-generated.

4. **Real case linkage (owner-ruled).** `PrescreenEncounter.caseId` is a
   foreign key to `BehavioralHealthCase`; `StartPrescreenEncounter`
   verifies tenant-scoped existence inside the transaction. An absent case
   and another tenant's case produce one indistinguishable
   `RESOURCE_NOT_FOUND`. This is a deliberate divergence from Phase 2's
   unvalidated string, recorded here.

5. **Idempotency: extend the shared table (owner-ruled).** One nullable
   `requestFingerprint` column was added to `CommandIdempotencyRecord`
   (existing rows/services untouched). The stored key is namespaced —
   `prescreen/<command>/<actorId>/<key>` — so Phase 2's
   org × actor × command × key scoping survives the table's
   `(organizationId, idempotencyKey)` uniqueness. The fingerprint is the
   shared canonical body (ADR-0014 §5 `occurredAt` exclusion), now a single
   function both gateways hash. Replays reconstruct the ORIGINAL result
   from the fingerprint-verified body plus stored `objectId`/version — no
   live row is consulted, so a replay reports the original outcome even
   after further transitions. A lost insert race is re-read and classified
   with the same rules.

6. **Outbox: reuse GovernedEvent + OutboxRecord (owner-ruled).** The full
   prescreen envelope (`clarity.prescreen.event`, six command-coupled event
   types) is stored in `GovernedEvent.envelope` with routing columns
   mapped and `correctionKind = "NONE"` / `metricEligibility =
   "NOT_APPLICABLE"`. This is **storage reuse, not event-vocabulary
   expansion**: the accepted S2 event vocabulary is unchanged, no consumer
   is added, and outbox rows stay PENDING (no dispatcher runs for them).
   `recordedTime` is server-stamped; `eventTime` stays the command's
   server-stamped `occurredAt`.

7. **Transaction shape** (`PrismaPrescreenGateway`, in
   `packages/case-repository` — the one Prisma package): namespaced
   idempotency lookup → tenant-scoped fresh read → the same domain-contract
   state machine the in-memory gateway uses → conditional versioned
   `updateMany({ id, organizationId, version })` → governed event + outbox
   row + append-only audit event + idempotency record, all in one
   `withTenantContext` transaction. A failed command commits nothing and
   does not consume its key (proven by test).

8. **RLS.** Migration `prescreen_persistence_rls` mirrors the OD-6 shape:
   ENABLE + FORCE row security on the four tables with the
   transaction-local `app.current_organization_id` policy, failing closed
   when the setting is absent. Defense in depth — the application still
   derives tenancy from the authenticated principal on every predicate.

9. **Migration application (deviation, tracked).** Local `clarity_dev`'s
   ledger contains two applied migrations whose files exist only on the
   unmerged network-enrichment branch, so `prisma migrate dev` offered only
   a destructive reset. The two prescreen migrations were applied with the
   documented hotfix flow (`prisma migrate diff` → `db execute` →
   `migrate resolve --applied`); the DDL was generated by Prisma itself
   from the schema delta. The contention is issue #31; the
   migration-integrity test now asserts its stated intent (every repository
   migration applied, none rolled back) while tolerating the foreign
   ledger entries until #31 is resolved.

## Verified this session (2026-07-19)

Root suite **353/353** (three consecutive full runs), including 27
prescreen unit tests, 9 prescreen HTTP integration tests **running on the
Prisma gateway**, and 10 new persistence tests (durability across a
separate client, cross-connection replay, nested-body conflict,
exactly-one-winner concurrency, zero-residue failure atomicity, real
non-revealing case linkage, tenant-scoped ids, audit/outbox/idempotency
lockstep, no source text persisted, fail-closed RLS under a NOBYPASSRLS
role). Lint, typecheck, `prisma validate` pass. The dev server
(`devMain.ts`) now runs on the persistent gateway.

## Explicitly NOT claimed

- Provider-backed Cloud SQL/RLS verification (separate, non-waived gate);
  production migration promotion; runtime-role deployment (the local dev
  connection is a superuser and bypasses RLS — the RLS proof used a
  dedicated NOBYPASSRLS role).
- Fresh-database replay of the full migration ledger was not re-run this
  session.
- Cross-organization submission/receipt, external event delivery or any
  dispatcher for prescreen outbox rows, prescreen UI, roles beyond the two
  ruled equivalences, PMHNP scope configuration, clinical/legal approval of
  rule content, production readiness, HIPAA compliance.
