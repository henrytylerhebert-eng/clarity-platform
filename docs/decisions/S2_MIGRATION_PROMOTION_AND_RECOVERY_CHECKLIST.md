---
status: Proposed operational checklist; production owner and technical review required
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

## Evidence Required For Acceptance

- Migration output and status result.
- Fresh-database replay result from the CI/release environment.
- Backup/restore or provider-equivalent evidence.
- Post-migration schema and bounded test results.
- Named incident/recovery owner and unresolved-risk record.

No production promotion or restore evidence is currently claimed by this
document.

## Current Local Evidence

The local synthetic database currently reports all ten repository migrations
up to date through `npx prisma migrate status`. This is local verification only;
it is not promotion, backup, restore, or production evidence.
