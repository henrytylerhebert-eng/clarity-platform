# Prescreen Phase 2 implementation (command service + in-memory gateway)

**Date:** 2026-07-19 · **ADR:** ADR-0013 · **Package:** `packages/prescreen-service`
**Approved scope:** controlled prescreen command service and in-memory gateway only.

**Current amendment:** ADR-0014 later added an owner-approved production role
policy for exactly `INTAKE_COORDINATOR` and `PHYSICIAN_REVIEWER` and exposed
the service through seven authenticated same-organization HTTP routes. The
gateway on `main` remains in-memory. Current verification belongs in
`IMPLEMENTATION_STATUS.md`; the counts at the end of this document are
historical evidence from the Phase 2 implementation session.

## What was built

| File | Responsibility |
|---|---|
| `src/commands.ts` | Strict Zod envelopes for the six mutating commands and the readiness view; prescreen actor schema with free-form role codes. Synthetic-only use is repository policy, not a PHI-ready schema guarantee; see ADR-0014 for the production role mapping. |
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

## Behavior covered by tests

The current files contain 27 prescreen-service tests and 38 prescreen-contract
tests. See `docs/testing/PRESCREEN_SERVICE_TEST_MANIFEST.md`; API coverage is
separately mapped in `docs/testing/PRESCREEN_API_TEST_MANIFEST.md`.

All fourteen owner completion criteria are covered — see
`docs/testing/PRESCREEN_SERVICE_TEST_MANIFEST.md` for the mapping.

## Honest boundaries

- **In-memory only.** Nothing survives a process restart. No durability is
  claimed; the outbox records envelopes and delivers nothing.
- **Same-organization synthetic operation.** Submission records a target and
  receiving organization as intent; the receiving organization gains no read
  path (proven by test). Cross-organization receipt/sharing is deferred.
- **Production role policy is narrow.** ADR-0014 maps exactly
  `INTAKE_COORDINATOR` and `PHYSICIAN_REVIEWER` for the same-organization
  slice; external roles and PMHNP configuration remain deferred.
- **API exists; persistence and UI do not on `main`.** Seven authenticated
  same-organization routes use the in-memory gateway. There are no prescreen
  Prisma models/migrations on `main`, no UI, no Product Studio/feature-flag
  control, and no deployment claim.
- **Deviation noted:** event payloads use hashes instead of the package
  catalog's illustrative free-text fields (audit-metadata invariant wins).
- **recordedTime = occurredAt** in the in-memory gateway for determinism; a
  persistence adapter must stamp server time (Phase 3 concern).

## Verification history (Phase 2 implementation session; not current)

- Focused: 25/25 prescreen-service tests (25 after post-merge review hardening); 35/35 prescreen-contract tests.
- Root suite: 328/328. App suite: 64/64 (unchanged by this slice).
- `npm run typecheck`, `npm run lint`, `npx prisma validate`: pass.
- Prisma schema untouched (`git diff --stat prisma/` is empty).

## What Phase 3 receives

The exact atomic write set per command (encounter, assessment versions,
requirements, submission record, idempotency record, audit event, outbox
row, version-bump predicate), the documented error surface with a known
transition-to-HTTP mapping gap (`R-18`/`TP-05` in the preparation packet), and
the canonical fingerprint rule — all as executable specification, gated
behind the separate provider-backed Cloud SQL/RLS verification.
