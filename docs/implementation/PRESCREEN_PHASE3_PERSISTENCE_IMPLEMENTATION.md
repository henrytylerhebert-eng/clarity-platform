# Prescreen Phase 3 Persistence — Implementation Notes (ADR-0016)

Owner-authorized local bounded slice (2026-07-19): the prescreen command
service moves from the in-memory gateway to a Prisma adapter against local
`clarity_dev`. Provider-backed Cloud SQL/RLS verification remains a
separate, non-waived gate. Companion docs: ADR-0016,
`docs/testing/PRESCREEN_PERSISTENCE_TEST_MANIFEST.md`.

## What changed, by layer

1. **Contract (`packages/domain-contracts/src/prescreenCommands.ts`).**
   Command envelopes, error classes, canonical serialization
   (`canonicalStringify`, `prescreenFingerprintBody`), parsed command
   shapes, and gateway result contracts moved here from `prescreen-service`
   (which re-exports them unchanged — no import path breaks, `instanceof`
   identities preserved). Same placement as the S2 admission command.

2. **Service (`packages/prescreen-service`).** `PrescreenGateway` and
   `PrescreenCommandService` are Promise-based; enforcement order is
   unchanged (strict parse → role policy before any read → gateway).
   `InMemoryPrescreenGateway` bodies are untouched; both gateways now hash
   the same canonical fingerprint body.

3. **Schema (2 migrations).** `prescreen_phase3_persistence`: four
   tenant-scoped tables (encounters with a real `caseId` FK + optimistic
   `version`; assessment versions with per-tenant domain-id uniqueness and
   Json value objects; packet requirements unique per
   org × encounter × code; submissions unique per encounter), six enums
   mirroring the Phase 1 arrays, and one nullable
   `CommandIdempotencyRecord.requestFingerprint` column.
   `prescreen_persistence_rls`: ENABLE + FORCE row security with the
   transaction-local `app.current_organization_id` policy (OD-6 shape).
   Applied via the Prisma hotfix flow because of the issue #31 ledger
   contention; the DDL itself is Prisma-generated from the schema delta.

4. **Adapter (`packages/case-repository/src/prescreenGateway.ts`).**
   `PrismaPrescreenGateway` — one `withTenantContext` transaction per
   command: namespaced idempotency lookup
   (`prescreen/<command>/<actorId>/<key>`, fingerprint replay/conflict) →
   tenant-scoped fresh read → shared domain state machine → conditional
   versioned `updateMany` → governed-event row storing the full prescreen
   envelope + outbox row + append-only audit event + idempotency record.
   Replays reconstruct the original result from the fingerprint-verified
   body plus the stored `objectId`/`resultVersion`; unique-index races are
   re-read and classified identically. `recordedTime` is server-stamped.

5. **Wiring.** The 9 HTTP integration tests and the dev server
   (`devMain.ts`) run on the Prisma gateway; prescreen state now survives a
   dev-server restart. API fixtures create the real synthetic cases the FK
   ruling requires; the shared harness cleans the four new tables.

## Behavioral divergences from Phase 2 (deliberate, ruled)

- `StartPrescreenEncounter` requires an existing same-organization case;
  the miss is non-revealing (`RESOURCE_NOT_FOUND`).
- Encounter ids are server-generated cuids, not `pre_syn_N` (opaque to the
  API contract).
- Envelope `recordedTime` is server time, as the Phase 2 comment
  anticipated for a persistence adapter.

## Session verification (2026-07-19)

`npm run lint`, `npm run typecheck`, `npx prisma validate`, and `npm test`
all ran and passed: root suite **353/353** (38 files) across three
consecutive runs — 27 prescreen unit, 9 prescreen HTTP (Prisma-backed), 10
persistence proofs. Zero synthetic residue from this session's runs
(harness-scoped cleanup); the pre-existing residue tracked by issue #24 was
left in place.

## Honest gaps

See the test manifest's list: local-only evidence; superuser dev connection
bypasses RLS (proof used a NOBYPASSRLS role; runtime-role deployment
gated); fresh-ledger replay not re-run; no outbox dispatcher for prescreen
events; no cross-org capability, UI, external consumers, production or
compliance claims.
