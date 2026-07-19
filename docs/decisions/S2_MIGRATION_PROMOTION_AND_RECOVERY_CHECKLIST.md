---
status: Recommended operating design; production owner and technical/operations acceptance required
owner: Technical and operations owners
date: 2026-07-19
data_boundary: synthetic only
related_decisions: OD-6, OD-9, ADR-0012, S2 persistence decision packet
---

# S2 Migration Promotion And Recovery Checklist

## Purpose

Provide a forward-only promotion and recovery procedure for the additive S2
migration without claiming production readiness. Prisma down-migrations are
not treated as recovery evidence.

## Scope

The checklist applies to `prisma/migrations/20260718231432_s2_episode_persistence`
and any later additive migration. It does not authorize deployment, a
production database, destructive schema changes, or live tenant data.

## Ownership Model

| Responsibility | Owner | Boundary |
|---|---|---|
| Migration artifact and compatibility review | Technical lead / repository maintainer | Owns the commit, migration ordering, Prisma validation, and backward-compatible application contract |
| Promotion execution | Named release or operations owner | Runs the approved migration job and records the database, release commit, role, timestamps, output, and warnings |
| Pre/post verification | Independent verification owner and CI/release job | Runs read-only status/schema checks and bounded smoke tests; does not approve its own production exception |
| Recovery decision | Technical owner plus operations owner | Chooses forward fix, application rollback, or provider restore after inspecting actual database state |
| Data-impact approval | Human project owner | Required for restore, data loss, tenant impact, or any scope change |
| Security/RLS review | Named security reviewer | Required for role, policy, tenant-context, or break-glass changes |

No single application request, repository gateway, or delivery worker may act
as the migration or recovery owner.

## Selected Provider Target

- Provider: Google Cloud SQL for PostgreSQL
- Region: `us-central1`
- Connection mode: direct connection
- Human approval owner: Tyler Hebert / Clarity product owner
- Promotion and recovery operator: `[Pending named operations operator]`

The local verifier is complete, but a Cloud SQL change window, backup/restore
point, service account, and named operations operator are not yet available in
the local session.

## Promotion Preconditions

- [ ] Release commit, branch, and migration set are recorded.
- [ ] Worktree is clean and the exact artifact is reproducible from the commit.
- [ ] `npm run prisma:validate` passes.
- [ ] A backup or provider-equivalent restore point is confirmed by the
      operations owner.
- [ ] Application code is backward-compatible with the pre-migration schema,
      or an approved restore plan exists.
- [ ] The migration has been applied to a disposable database from zero and
      the root safety suite has passed. `[Unverified]` until CI/OD-9 provides
      this repeatable job.
- [ ] Named technical and operations owners are available for the change
      window.

## Promotion Sequence

1. Freeze unrelated schema and application changes for the release window.
2. Record the database identifier, backup/restore point, release commit, and
   migration list.
3. Run the explicit release migration job with `prisma migrate deploy`.
4. Verify migration status and inspect the expected tables, indexes, and
   constraints using read-only checks.
5. Run the bounded smoke checks and confirm outbox rows remain `PENDING`.
6. Record start/end times, operator role, result, and any warnings.

Promotion is forward-only. Release jobs use `prisma migrate deploy` against the
approved database and release artifact. They do not use `migrate dev`,
`migrate reset`, or an ad hoc SQL copy of migration contents. Applied migration
files and checksums are treated as immutable release evidence.

## Failure And Recovery

- Stop the release job on a failed migration or failed post-migration check.
- Do not apply a destructive down-migration as an emergency rollback.
- If application code is backward-compatible, roll back application code
  independently and preserve the forward schema.
- If the schema or data state cannot safely support the prior application,
  use the provider-approved restore procedure and record the restore point,
  impact, validation, and owner sign-off.
- Any forward-fix migration requires a new reviewed migration and a new
  verification record.

If a migration fails or its final state is uncertain, the operator freezes the
change window and records the observed `_prisma_migrations` row, database
state, provider logs, and release output before taking another action. Do not
assume that a failed command means no statements applied, and do not use
`prisma migrate resolve` or a destructive down-migration as an unreviewed
repair. The recovery owner must explicitly choose one of:

1. Resume the same immutable migration only when the provider and migration
   state prove that Prisma can safely continue it.
2. Roll back application code while preserving the forward schema when the
   prior application remains compatible.
3. Apply a reviewed forward-fix migration when the schema is valid but the
   intended state needs correction.
4. Restore the provider-approved backup/restore point when the schema or data
   state cannot safely support either application rollback or forward repair.

## Evidence Required For Acceptance

- Migration output and status result.
- Fresh-database replay result from the CI/release environment.
- Backup/restore or provider-equivalent evidence.
- Post-migration schema and bounded test results.
- Named incident/recovery owner and unresolved-risk record.

The acceptance record must link each item to the exact release commit and
command output. A local `clarity_dev` result may satisfy a synthetic test
fixture check, but it cannot satisfy provider backup/restore, production
promotion, or incident-recovery evidence.

No production promotion or restore evidence is currently claimed by this
document.

## Current Local Evidence

The local synthetic database currently reports all twelve repository migrations
up to date through `npx prisma migrate status`, including
`20260719011500_s2_active_admission_guard` and
`20260719123000_od6_episode_persistence_rls`. This is local verification only;
it is not promotion, backup, restore, or production evidence.

The repeatable local verifier `npm run migration:recovery:local` proves a fresh
local replay, a custom-format `pg_dump`, and a `pg_restore` into a second
disposable local database. The current run reported
`LOCAL_REPLAY migrations=12 episode_table=t` and
`LOCAL_RESTORE migrations=12 episode_table=t`. This advances local recovery
evidence only; it does not substitute for provider-managed backup/restore or a
production change window.

## Deterministic Local Migration Evidence

Run the read-only integration check from the repository root:

```bash
npx vitest run tests/integration/migration-integrity.test.ts
```

The check is hard-guarded to local `clarity_dev`. It verifies that every
repository migration directory appears in `_prisma_migrations` with a
successful, non-rolled-back record, and that the H3 active-admission index is
present with its unique `sourceCaseId` and `status = 'ACTIVE'` predicate. The
OD-6 integration check separately proves the local RLS policy boundary and
transaction-local context behavior.
This proves local migration integrity only; it does not prove fresh-database
replay in CI, provider backup/restore, production promotion, or recovery.
