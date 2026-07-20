# Prescreen Persistence Test Manifest (Phase 3, ADR-0016)

**File:** `tests/integration/prescreen-persistence.test.ts` — 10 tests, run
against local `clarity_dev` (guarded by `assertLocalClarityDevDatabase`).
All assertions are scoped to the run's synthetic tenants; cleanup is
deterministic via the shared harness (extended to the four prescreen
tables). Session verification 2026-07-19: 10/10, and the full root suite
353/353 across three consecutive runs.

## What each test proves

| # | Test | Proof |
|---|------|-------|
| 1 | durability across a separate client | start→draft→attest written by one `PrismaClient` is fully visible to a brand-new client: status, version, caseId, contentHash, answers survive — a restart loses nothing |
| 2 | cross-connection replay | the same body with a LATER `occurredAt` replays (`replayed: true`, same objectId/version) through a different connection; first write wins for stored times (ADR-0014 §5) |
| 3 | replay writes nothing; nested-body conflict | a replay leaves every org-scoped count unchanged; changing only a deeply nested field under the same key raises `IDEMPOTENCY_KEY_REUSED` and also writes nothing |
| 4 | exactly-one-winner concurrency | two concurrent versioned drafts: exactly one fulfills, the other raises `PRESCREEN_VERSION_CONFLICT`; the encounter advances exactly one version |
| 5 | zero-residue failure atomicity | a failing attest changes no row in any table (encounters, assessments, requirements, submissions, audit, governed events, outbox, idempotency) and its key succeeds later — the failure never consumed it |
| 6 | real, non-revealing case linkage | an absent case and another tenant's case fail `StartPrescreenEncounter` with one indistinguishable error |
| 7 | tenant-scoped assessment ids | organization B reuses A's `assessmentVersionId` without collision or disclosure; each org resolves its own row |
| 8 | lockstep side effects | each successful command adds exactly one audit event, one governed-event row, one outbox row, and one idempotency record; readiness derives named blockers from the persisted requirement |
| 9 | no source text persisted | serialized audit metadata and stored envelopes never contain the narrative, presenting concern, or location strings — hashes and field names only |
| 10 | fail-closed RLS | with the RLS migration applied: a NOLOGIN NOSUPERUSER NOBYPASSRLS role sees zero rows without `app.current_organization_id`, cannot update across tenants with it, and reads its own tenant normally |

## Companion coverage run in the same session

- 27 prescreen unit tests (in-memory gateway; awaited, behavior unchanged).
- 9 prescreen HTTP integration tests now running on `PrismaPrescreenGateway`
  (`tests/integration/prescreen-api.test.ts`) — same-org flow, forgery 400s,
  role policy 403s, cross-tenant 404s, replay/conflict 200/409 over real
  HTTP with DB-backed auth.

## Honest gaps

- **Local only.** Nothing here is provider-backed Cloud SQL/RLS evidence;
  that gate is untouched and still required before any production posture.
- The application's own dev connection is a superuser and would bypass RLS;
  the RLS proof uses a dedicated runtime role. Runtime-role deployment for
  the app connection remains gated (same posture as OD-6).
- Fresh-database replay of the full migration ledger was not re-run this
  session; the two prescreen migrations were applied via the hotfix flow
  because of the issue #31 ledger contention.
- Replay reconstruction is verified for same-session and cross-connection
  retries; no test kills a process mid-transaction (Postgres atomicity is
  relied on for crash semantics).
- No dispatcher consumes prescreen outbox rows; delivery is out of scope.
- No UI, no cross-organization capability, no external consumers.
