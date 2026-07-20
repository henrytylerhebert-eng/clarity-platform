# Migration and Backfill Plan

## Principles

- Additive first.
- No raw source-form import.
- No completed patient assessment in this package is a migration source.
- Existing localStorage prototype data is not presumed canonical.
- Historical imports require owner approval, source mapping, PHI review, and reconciliation.

## Phase 0 — Protect current state

- Record branch, HEAD, dirty files, database migration state, and test baseline.
- Export schema only; do not copy production data.
- Identify local prototype data and label it synthetic/demo.

## Phase 1 — Add prescreen tables

- Encounter, assessment version, answer/source, orientation, idempotency, outbox.
- Add indexes and organization scope.
- Keep new feature dark and inaccessible except tests.

## Phase 2 — Add communications/tasks and packet tables

- Add task/communication and packet version/requirements/transmission.
- No backfill unless an existing canonical object can be mapped without ambiguity.

## Phase 3 — Add transport/configuration

- Provider profile, credentials, plan, custody events, facility profile, consent rule.
- Seed only synthetic/reference configuration marked non-production.

## Historical data strategy

Possible sources:

- existing Clarity synthetic cases;
- approved de-identified training cases;
- external source-system extracts after governance approval.

Every import batch records:

- source system/file/document;
- mapping version;
- import actor and time;
- row/object result;
- rejection reason;
- correction/replay history;
- count reconciliation.

## Backfill rules

- Do not infer missing values.
- Blank remains unknown/not assessed.
- Do not create an attested assessment without an actual historical attestation source.
- Do not create a legal instrument, consent, medical clearance, or facility decision from narrative text alone.
- Do not mark packet items accepted without evidence of the exact document/version.
- Do not create transport custody events from an invoice or broker record alone.

## Rollback

- Application can ignore additive tables behind a server-side exposure flag.
- Migrations remain backward compatible through at least one release.
- Destructive rollback requires a verified backup/restore plan.
- Profile activation can be rolled back by superseding to a prior approved version; historical case evaluations remain unchanged.
