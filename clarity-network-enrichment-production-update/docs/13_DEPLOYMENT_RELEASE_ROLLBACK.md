# Deployment, Release and Rollback

## Environments

- local: synthetic fixtures only;
- CI: ephemeral database and mocked source adapters;
- staging: approved public sources and synthetic/internal test records;
- pilot production: one approved tenant/facility cohort;
- general production: only after security, clinical/legal governance and operational review.

## Release sequence

1. Backward-compatible database migration.
2. RLS and migration verification.
3. Deploy API/services with feature disabled.
4. Run health/readiness and cross-tenant tests.
5. Enable candidate ingestion for internal reviewers only.
6. Enable controlled approvals.
7. Enable role-scoped approved directory reads.
8. Enable limited source adapters by allowlist.
9. Expand tenants only after pilot review.

## Feature flags

- `networkEnrichmentContracts`
- `networkEnrichmentCandidateIngestion`
- `networkEnrichmentReviewQueue`
- `networkEnrichmentCanonicalApproval`
- `networkEnrichmentLiveSources`
- `networkDirectoryOperationalUse`

Flags must be server-enforced and tenant-scoped.

## Rollback

- Disable live-source and approval flags first.
- Roll back application version independently from schema.
- Keep migrations backward-compatible for at least one application version.
- Never delete audit, candidate or decision history during rollback.
- Suspend affected canonical fields and restore the prior version through a new supersession event.
