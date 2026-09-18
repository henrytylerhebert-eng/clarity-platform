# `clarity_dev` rebuild and isolation proof — 2026-09-18

**Phase:** Housekeeping Phase 3B, Gate B (owner decisions OD-HK3-001, -003, -005, -006).
**Authority:** Gate B plan, plus an explicit in-chat owner authorization limited to the
**local** `clarity_dev` database on this machine. No hosted, Supabase, shared or external
database was touched.
**Evidence baseline:** `origin/main` at `f9c4eb8` (merge of PR #107, Gate A). That SHA is the
commit these claims were checked against, not a claim to be the newest commit.

## Preflight

| Check | Result |
|---|---|
| PR #107 state | `MERGED`, merge commit `f9c4eb8`, ancestor of `origin/main` |
| Working context | fresh worktree at `origin/main`, clean tree |
| Disposable-DB guard on main | `assertDisposableDatabase()` in `tests/integration/helpers/harness.ts`; marker set by `scripts/with-ephemeral-database.ts` and `.github/workflows/ci.yml` |
| Cleanup coverage test on main | `tests/unit/tenant-cleanup-coverage.test.ts` — 5/5 passed |
| Target | `DATABASE_URL` host `localhost:5432`, database `clarity_dev` |
| Connections / writers | 0 connections; no `api:dev`, Prisma Studio or test-runner processes |

### Pre-destruction real-data safety audit (aggregates only)

All zero: non-synthetic organizations; organization names not `Synthetic…`; PatientTokens
outside the `synthetic-` prefix or missing `SYNTHETIC_ONLY`; users outside `@example.test`;
cases outside synthetic organizations; FacilityProfiles in non-synthetic organizations;
orphan FacilityProfiles; Network rows with non-synthetic tenants.

28 cases have ids without the `synthetic-` prefix (`case-outbox-<uuid>` 13,
`syn-ps-api-case-<uuid>` 7, `syn-ps-api-case-replay-<uuid>` 7, `SYN-API-CASE-0001` 1). All 28
sit in synthetic organizations, reference existing `SYNTHETIC_ONLY` tokens, and are produced by
named test/dev code (`tests/integration/prescreen-api.test.ts`, `devMain.ts`). Phase 3A
recorded the same split (1,164 of 1,192 synthetic-prefixed). **Not ambiguous; no stop.**

## Backup (rollback artifact)

| Field | Value |
|---|---|
| Path | `/Users/tylerhebert/clarity-db-backups/clarity_dev-pre-phase3b-gate-b-20260918T222316Z.dump` (outside the repository, mode 600, never committed) |
| Created | 2026-09-18T22:23:16Z, `pg_dump` 18.4, custom format, exit 0 |
| Size | 1,091,117 bytes |
| SHA-256 | `2ece8ea0177a710d7ab0aad56654705e492efd142cb0b6ff7a89fd9475cec375` (re-verified immediately before the drop) |
| Validity | `pg_restore --list` exit 0, 545 TOC entries, 69 `TABLE DATA` entries including `_prisma_migrations` and all nine `Network*` tables. Full restore into a scratch database reproduced every count exactly (below); scratch database then dropped. |

## Before state (captured just before the drop)

69 public tables. 27 ledger rows, all finished, none rolled back. Against the repository:

- **Ledger-only (orphans):** `20260720002049_packet11_persistence`,
  `20260720014914_network_review_append_only_audit`.
- **Repo-only (pending):** `20260917000100_iop_program_binding`.
- **`applied_steps_count = 0`:** `20260719222634_prescreen_phase3_persistence`,
  `20260719222650_prescreen_persistence_rls`, `20260913212932_rev_ops_rate_release_registry`
  (the documented hotfix flow).
- `IopSourceIntegration.programId` **absent**; 3 indexes on that table, none on `programId`.
- `synthetic-org-api-dev` dependents: 8 users, 45 AuthSessions, 90 AuditEvents, 1 case, 1
  PatientToken, 3 FacilityProfiles, 1 IopSourceIntegration, 1 IopReconciliationImport, 5
  exception reviews, 1 close receipt, 1 RevOpsWorkspace, 1 RevOpsChange, and 11 Assurance rows.

## Rebuild actions executed

1. `dropdb` local `clarity_dev`.
2. `createdb` local `clarity_dev` (0 public tables).
3. `prisma migrate deploy` from the `origin/main` worktree — exit 0, "All migrations have been
   successfully applied."
4. `npm run api:dev` twice (start → ready → stop), recreating `synthetic-org-api-dev` through
   its existing idempotent upsert path.

Not done, by design: no `_prisma_migrations` edits, no off-main migrations, no restore of old
rows, no restore of the dump into the new database.

## Canonical migration proof

| Assertion | Result |
|---|---|
| Ledger rows / distinct names | 26 / 26 |
| Ledger set vs `prisma/migrations/` | identical (empty `diff`) |
| Orphan entries | 0 |
| Unfinished / rolled back / with logs | 0 / 0 / 0 |
| `applied_steps_count = 0` | 0 |
| `prisma migrate status` | "26 migrations found … Database schema is up to date!" |
| `prisma validate` | valid |
| `20260917000100_iop_program_binding` | exactly one finished ledger row |
| `IopSourceIntegration.programId` | present, `text`, `NOT NULL` — matches `programId String` in Prisma |
| Program-binding index | `IopSourceIntegration_organizationId_programId_active_idx` on (`organizationId`, `programId`, `active`) — matches `@@index([organizationId, programId, active])` |
| Tables | 60 = 59 Prisma models (`schema.prisma` + `assurance.prisma`) + `_prisma_migrations` |
| Legacy `Network*` tables | **0 of 9** present; 0 tables matching `network%` |

**Residual drift found (not a replay failure).** `prisma migrate diff` from the clean replay to
the full `prisma/` schema folder exits 2 on **names only**: 10 Assurance foreign keys are
hand-named in migration SQL (`…_case_fkey`), and 10 Assurance / IOP-reconciliation index names
exceed PostgreSQL's 63-byte identifier limit and are truncated differently from Prisma's own
shortening. No table, column, type, nullability or indexed-column difference exists. The
cause is the migration chain itself, so it reproduces on every clean replay, including CI.
Fixing it is a schema/migration change and out of Gate B scope. It needs its own issue; filing
that issue was blocked in-session and is left to the owner.

## Dev fixture proof

| | Seed run 1 | Seed run 2 |
|---|---|---|
| Organization | 1 (`synthetic-org-api-dev`) | 1 |
| User / PatientToken / Case / LegalStatusRecord | 8 / 1 / 1 / 1 | 8 / 1 / 1 / 1 |
| FacilityProfile / IopSourceIntegration | 2 / 1 (`programId = IOP_PROGRAM_001`) | 2 / 1 |
| RevOpsRateRelease | 2 | 2 |
| Assurance case / participants / applicability / sources / documents / expectations | 1 / 3 / 1 / 2 / 2 / 1 | identical |

The second invocation changed nothing, so the seed is idempotent. The old database had more rows
under the same tenant (a third FacilityProfile, an AssuranceEvaluation, RevOps workspace/change,
IOP import/review/receipt rows, 45 AuthSessions, 90 AuditEvents). Those came from developer
activity through the running API, not from seed code, and were intentionally not restored.

**`synthetic-org-api-dev` is the only sanctioned persistent organization in `clarity_dev`**
(OD-HK3-003). Any other organization appearing there is residue.

Post-rebuild real-data audit: every check zero.

## Isolation proof — three sequential runs

Persistent `clarity_dev` was fingerprinted as the row count of **every** public table (60)
plus MD5 of the ledger (`name || checksum`) and of the ordered organization ids. Each run was
`npm run test:integration` with `DATABASE_URL` unset in the calling shell.

| Run | Result | Ephemeral cluster | Cluster destroyed | Persistent fingerprint |
|---|---|---|---|---|
| 1 | 32 files / 276 tests passed | `127.0.0.1:58220` | yes | unchanged |
| 2 | 32 / 276 passed | `127.0.0.1:58490` | yes | unchanged |
| 3 | 32 / 276 passed | `127.0.0.1:58640` | yes | unchanged |

## Isolation proof — concurrent worktrees

Two worktrees, both at `f9c4eb8`, ran `npm run test:integration` at the same time
(17:38:09 → 17:38:39 local, both).

| Worktree | Result | Cluster | Data directory |
|---|---|---|---|
| A (`claude/gate-b-precondition-3497e1`) | 32 / 276 passed | `:58835` | `…/T/clarity-ephemeral-db-BodA3A` |
| B (`claude/phase3b-gate-b`) | 32 / 276 passed | `:58836` | `…/T/clarity-ephemeral-db-CNlKHI` |

A process listing taken mid-run showed both clusters live at once. Each is a separate
`initdb` cluster, so each has its own migration ledger. `tests/integration/migration-integrity.test.ts`,
which asserts exact ledger/repository set equality, passed in both. Both data directories
were removed afterwards. The persistent fingerprint was unchanged.

## Dispositions

- **Issue #24:** closure criteria met. The exact historical 2026-09-13 trigger was **not**
  uniquely recoverable: Gate A.5 reproduced two distinct mechanisms (cleanup exception; process
  termination before `afterAll`) that leave the same residue signature. Closure rests on
  removing the operating path either mechanism needed, not on a proven root cause.
- **Issue #31:** closure criteria met. The rebuilt ledger contains only current-`main`
  migrations, and database-writing tests run on per-run disposable clusters.
- **`codex/om/sync-main` (local):** retired with `git branch -d` after re-pointing its upstream
  to `origin/recovery/machine-only/2026-09-17/codex/om/sync-main`. That ref holds the exact local
  tip `49637a9`, so Git itself confirmed containment before deleting. Still preserved:
  `origin/codex/om/sync-main` (`f831939`), all 8 `recovery/machine-only/2026-09-17/*` refs (both
  off-main migrations are reachable from them), ADR-0015, and
  `docs/decisions/NETWORK_ENRICHMENT_REAL_DATA_INCIDENT.md`. No remote ref was deleted.

## Other observations

- An unrelated PostgreSQL cluster runs from `~/Documents/Clarity-RevOps-Local-Proof/2026-09-06/pg`
  on port 55439. Gate B did not touch it.

## Not claimed

Production readiness, HIPAA compliance, working external integrations, or any change to a
hosted/Supabase database. The 2026-09-13 residue mechanism is still **UNKNOWN**.
