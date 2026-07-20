# Release, Deployment, and Rollback

## Environments

- Local: synthetic only.
- CI: ephemeral services and deterministic fixtures.
- Integration: synthetic/de-identified partner simulations.
- Staging: production-like controls and approved test identities.
- Production: only after release gates.

## Release gates

1. Product owner approves slice scope.
2. Architecture/ADR decisions accepted.
3. Clinical/legal review for any enforced workflow rule.
4. Security/privacy threat model and controls accepted.
5. Tests/lint/typecheck/build/schema validation pass.
6. Migrations reviewed and backup/restore evidence available.
7. Observability dashboards and alerts active.
8. Runbook, rollback, and incident contacts verified.
9. Synthetic/staging acceptance scenarios pass.
10. Feature exposure is server-authorized and scoped to pilot organizations.

## Deployment order

1. Backward-compatible database migration.
2. API/service code with feature inaccessible.
3. Worker/projection code.
4. Configuration/profile seed approved for pilot.
5. Client code.
6. Controlled server-side exposure to pilot.
7. Monitor and verify.

## Rollback triggers

- cross-tenant or unauthorized exposure;
- lost/corrupted attestation or custody history;
- profile/rule misapplication;
- material transport qualification error;
- unredacted PHI in logs;
- unrecoverable projection divergence;
- migration integrity failure;
- safety workflow defect.

## Rollback actions

- disable server-side exposure;
- stop asynchronous consumers if they worsen state;
- roll back application version;
- preserve append-only audit/outbox;
- restore database only through approved plan;
- mark incorrect profiles suspended/superseded;
- recompute projections from corrected events;
- notify clinical/legal/security owners as required.

## Feature flags

Flags control exposure, not authorization or safety. A disabled UI action cannot substitute for a server policy.
