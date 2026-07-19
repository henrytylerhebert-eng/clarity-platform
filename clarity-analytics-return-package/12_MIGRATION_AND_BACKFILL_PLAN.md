# Migration and Backfill Plan

**Artifact status:** All proposed diagrams, schemas, commands, examples, and code-like contracts in this file are **Proposed and unverified** unless a statement is explicitly classified otherwise.


## Migration principles

- Preserve the dirty working tree and current passing behavior.
- Use additive, backward-compatible database changes first.
- Do not rewrite existing case, authorization-readiness, audit, or prototype data in place.
- Do not import the legacy workbook as canonical data.
- Do not require EHR, payer, staffing, or regulator integration.
- Keep new routes/navigation behind server- and client-side feature flags.
- Deploy migrations explicitly, not on application startup.
- Retain rollback compatibility for at least one prior application version where feasible.
- Use synthetic fixtures only until production security approval.

## Preflight before schema design

Codex must inspect:

1. `git status --short`, branch, HEAD, and uncommitted changes;
2. root `package.json`, workspace tooling, TypeScript configs, test scripts;
3. `packages/domain-contracts` exports, IDs, Zod conventions, error taxonomy, state machines;
4. implemented service/gateway patterns;
5. `packages/api-service` actual adapter and ADR-0012 state;
6. `prisma/schema.prisma`, migrations, organization/user/case/coverage/authorization/audit/idempotency models;
7. current role enums and authorization policies;
8. frontend router/navigation/workspace patterns;
9. synthetic fixture conventions;
10. current test/database cleanup helpers.

If any proposed model duplicates an existing canonical entity, stop and revise the mapping.

## Migration sequence

### Phase M0 — Owner decisions and ADRs

No code migration.

- accept API framework/boundary;
- approve roadmap priority;
- approve case-to-episode rule;
- approve separate post-admission authorization aggregate;
- identify facility/program/unit/timezone source;
- map roles/capabilities;
- approve initial metric owners/status;
- approve de-identification/mart pilot policy.

Completion evidence: accepted ADRs/decision log.

### Phase M1 — Contracts only

Add:

- episode and UR domain types/schemas/state machines;
- governed event envelope schema;
- event catalog;
- metric definitions as draft;
- tests for validation and state transitions.

No database or UI behavior.

Rollback: remove new unused package exports.

### Phase M2 — Additive transactional schema

Add new tables/enums/indexes for:

- episode;
- case-episode link;
- admission record;
- episode authorization/review/day decision;
- documentation gap;
- UR assignment;
- governed event;
- event delivery/projected-event/checkpoint;
- data-quality issue;
- optional episode-day/queue projection.

Do not alter existing authorization readiness semantics. Add scalar source IDs first; add verified relations/FKs only after exact model/table names are known.

Migration checks:

- `prisma format`;
- `prisma validate`;
- `prisma generate`;
- migration SQL review;
- existing tests unchanged;
- new integration tests;
- zero production data assumed.

Rollback: application feature flag off; schema remains additive. Destructive down migration is not required for immediate rollback.

### Phase M3 — Admission handoff command

- read accepted case under organization scope;
- atomically create episode/link/admission/audit/event/delivery/idempotency;
- no UI yet or minimal test harness;
- add API route after ADR boundary is accepted.

Rollback: disable route/feature; retain created synthetic rows/events.

### Phase M4 — UR commands

- open episode authorization;
- record review and date-range decisions;
- record/transition gap;
- assign UR owner;
- correction command;
- append events/audit atomically.

Rollback: disable routes; no analytics dependency for source data integrity.

### Phase M5 — Projection worker

- derive episode days;
- derive coverage status/risk;
- build queue projection;
- process correction/late event;
- checkpoints/retries/quarantine;
- replay command.

Run in shadow mode first. Compare projector results to deterministic fixture expectations.

Rollback: stop worker; source operational state/events remain intact; rebuild later.

### Phase M6 — Minimal mart

Create analytics schema/roles/tables and project only allowlisted V1 fields.

- no patient identity;
- no free text;
- tokenized episode key;
- daily UR facts;
- draft/approved metric definitions;
- snapshots and recompute lineage.

Run shadow calculations. Dashboard remains disabled until privacy checks pass.

Rollback: stop mart worker, revoke analytics reader, keep source state.

### Phase M7 — Queries and UI

- UR operational queue endpoint/workspace;
- authorization-risk aggregate endpoint/dashboard;
- provenance drawer;
- all non-happy-path states;
- feature flags scoped by tenant/role.

Rollback: disable flags/routes; no source data rollback.

### Phase M8 — Pilot hardening

- managed identity;
- production DB roles/RLS;
- logs/metrics/traces;
- backup/restore;
- audit/event immutability;
- security/privacy review;
- accessibility and performance;
- runbooks.

No production PHI before completion.

## Backfill policy

### Legacy workbook

**Prohibited as an automatic backfill source.**

The workbook is:

- read-only reference;
- PHI-sensitive;
- structurally fragile;
- formula-error-bearing;
- not current canonical operational data;
- not an approved metric authority.

No script should parse it into episode, authorization, payer, staffing, or metric tables.

### Existing Clarity cases

Possible future backfill:

- accepted/admitted synthetic prototype cases may be transformed into synthetic episodes for tests/demos;
- live/real cases, if any later exist, require a source-ownership and consent/retention review;
- never infer admission solely from packet sent or facility response;
- require explicit admission evidence/attestation.

### Existing authorization readiness

Do not migrate pre-admission records into post-admission reviews automatically.

Potential controlled linkage:

```text
EpisodeAuthorization.sourcePreAdmissionAuthorizationId
```

Create the episode authorization only when:

- episode exists;
- authorized human confirms the active coverage/level of care;
- source record belongs to same organization/case;
- requirement is not silently changed;
- linkage event and audit are written.

## Synthetic fixture strategy

### Fixture set

At minimum:

1. admitted episode with authorization not required;
2. approved through future date, no risk;
3. approved but expires soon;
4. pending concurrent review;
5. explicit denied date;
6. expired/unrequested day;
7. open documentation gap;
8. corrected approved-through date;
9. late-arriving payer decision;
10. conflicting overlap quarantined;
11. cross-tenant mirror identifiers for denial tests;
12. no-data organization.

All identifiers, names, references, and dates are clearly synthetic.

### Fixture loading

Use existing synthetic fixture conventions. Do not call normal production routes to bypass authorization in tests unless the repository's test harness already provides an approved actor. Test-only loaders must not ship in production bundles.

## Data reconciliation

For every migration/backfill run, record:

- run ID/version;
- source type and hash;
- row/event counts;
- accepted/rejected/quarantined counts;
- organization/facility scope;
- earliest/latest effective date;
- mappings used;
- actor/attester;
- errors;
- rollback/cleanup procedure.

## Index plan

Verify with query plans after data exists. Initial proposed indexes:

- episode `(organization_id, facility_id, status, admitted_at)`;
- unique case episode link `(organization_id, case_id, relationship)` for first-slice invariant;
- review `(organization_id, episode_authorization_id, due_at, decision_status)`;
- day decision `(organization_id, authorization_review_id, start_date, end_date)`;
- gap `(organization_id, episode_id, status, due_at)`;
- governed event `(organization_id, aggregate_type, aggregate_id, recorded_at)`;
- unique source event key;
- delivery `(status, available_at, lease_expires_at)`;
- episode day `(organization_id, facility_id, service_date, coverage_status)`;
- queue projection `(organization_id, facility_id, priority_band, due_at, episode_id)`;
- mart facts `(organization_id, service_date, facility_key, program_key)`.

Do not add speculative indexes without explaining write cost and query evidence.

## Schema compatibility

- add nullable fields before making them required;
- populate configuration/timezone before enabling episode-day derivation;
- use explicit enum migration review because PostgreSQL enum rollback can be difficult;
- consider string/check constraints if current schema conventions avoid database enums;
- do not rename existing authorization states;
- do not change current audit semantics without migration/test evidence;
- preserve old API adapter until ported routes pass contract tests.

## Feature flags

Proposed server flags:

- `episodeAdmissionHandoff`
- `postAdmissionUtilizationReview`
- `urProjectionWorker`
- `urAnalyticsMart`
- `urWorkQueue`
- `authorizationRiskDashboard`

Flags must not bypass authorization. A disabled flag returns a stable unavailable response or omits navigation.

## Rollout order

1. schema and contracts;
2. command services;
3. event ledger/delivery;
4. worker shadow mode;
5. mart shadow mode;
6. internal/test queries;
7. selected synthetic tenant;
8. authorized pilot tenant with synthetic data;
9. security gate;
10. real-data pilot only after approval.

## Rollback boundary

The preferred rollback is application/feature rollback, not destructive data rollback.

- disable UI/routes;
- stop workers;
- revert application version;
- keep additive tables/events;
- do not delete audit/history;
- correct bad facts with events after the fixed version is deployed;
- restore database only for approved catastrophic recovery, not ordinary business correction.
