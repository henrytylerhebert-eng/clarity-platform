# Implementation Sequence

**Artifact status:** All proposed diagrams, schemas, commands, examples, and code-like contracts in this file are **Proposed and unverified** unless a statement is explicitly classified otherwise.


## Sequence overview

The requested "initial slice" is one production-shaped capability delivered through small independently verifiable pull requests. Do not attempt the entire package in one unreviewable change.

```text
S0 Decisions/preflight
S1 Contracts and state machines
S2 Additive transactional/event schema
S3 Admission handoff vertical command
S4 Post-admission UR commands
S5 Episode-day and UR queue projector
S6 Minimal de-identified mart and metrics
S7 API queries and frontend workspaces
S8 Hardening and controlled pilot
```

Exact paths are proposed from supplied documentation and must be reconciled with the live tree.

## S0 — Decisions and repository preflight

### Goal

Resolve blocking architecture/product decisions and map this package to live repository patterns.

### Likely files

- `docs/architecture/ADR-0012-api-architecture.md`
- new ADRs under `docs/architecture/`
- `docs/decisions/OPEN_DECISIONS.md`
- `IMPLEMENTATION_STATUS.md`
- roadmap docs

### Changes

Documentation only.

### Dependencies

Tyler/product owner, security/technical owner, metric steward.

### Tests

None; run `git diff --check`.

### Security/privacy gates

API boundary, tenancy, de-identification, role map.

### Completion evidence

Accepted decisions with named owners and statuses.

### Rollback

Revert docs; no runtime impact.

## S1 — Domain contracts and deterministic logic

### Goal

Add episode, post-admission UR, event-envelope, and metric-definition contracts without persistence/API/UI.

### Likely files/packages

- `packages/domain-contracts/src/episode/`
- `packages/domain-contracts/src/utilization-review/`
- `packages/domain-contracts/src/analytics/`
- package barrel exports/tests
- `contracts/` or `docs/implementation/` if repository stores machine contracts elsewhere

### Schema/API/UI

- TypeScript/Zod enums/interfaces;
- state machines;
- event payload schemas;
- coverage/risk derivation pure functions;
- metric definitions marked draft;
- no API route or UI.

### Dependencies

Exact ID/type/error conventions; current Zod/test patterns.

### Tests

Validation, state transitions, day derivation, no-data semantics, correction chain.

### Security/privacy gates

No direct identifiers in analytics payload schemas; server-owned fields excluded from command input.

### Completion evidence

Focused tests and full baseline pass; no runtime behavior.

### Rollback

Remove unused exports/files.

## S2 — Additive transactional/event persistence

### Goal

Introduce new operational aggregates and governed event/delivery persistence.

### Likely files/packages

- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_episode_ur_event_spine/`
- new repository/gateway packages or adapters following current pattern
- database integration tests

### Schema/API/UI

Add models from `schema/proposed-transactional-model.prisma` after merge mapping. No routes/UI.

### Dependencies

Existing Organization/User/Case/Coverage/Authorization/Audit/Idempotency table names and transaction helper.

### Tests

- migration clean/upgrade;
- org predicates;
- relation validation;
- immutable event repository;
- event/delivery uniqueness;
- transaction failure injection.

### Security/privacy gates

Organization ID every row; database privileges plan; no mart yet.

### Completion evidence

Prisma validation/generate, migration review, integration tests, zero orphan rows.

### Rollback

Keep additive schema unused; revert application adapter.

## S3 — Admission handoff vertical command

### Goal

Create a governed episode from an accepted case in one atomic command.

### Likely files/packages

- `packages/episode-service/`
- existing/new Prisma episode gateway
- `packages/api-service/` only after ADR-0012 decision
- `packages/domain-contracts`
- focused service/API tests

### Schema/API/UI

- `RecordAdmissionHandoff`;
- case/episode link;
- admission audit/event/delivery;
- optional API route;
- no analytics dashboard.

### Dependencies

Accepted-case query/authority, exact case version and facility configuration.

### Tests

Authorization, tenant, scope, idempotency, concurrency, atomicity, already-linked case, missing timezone.

### Security/privacy gates

Verified principal only; no client org/actor; source refs same case/org.

### Completion evidence

Synthetic accepted case → episode/event/audit; cross-tenant denial.

### Rollback

Disable route/flag; data remains auditable.

## S4 — Post-admission UR commands

### Goal

Record episode authorization, concurrent review/day decisions, gaps, assignments, and corrections.

### Likely files/packages

- `packages/utilization-review-service/`
- Prisma gateway/repository
- domain contracts
- API routes/tests if boundary approved

### Schema/API/UI

Controlled commands only. No direct queue row or metric write.

### Dependencies

Episode from S3; source coverage/authorization linkage decision.

### Tests

State transitions, date ranges, overlaps, denial reasons, gap lifecycle, corrections, scope/concurrency/idempotency.

### Security/privacy gates

Minimal text; no member identifiers; actor/scope server-derived.

### Completion evidence

Synthetic event stream and immutable correction chain.

### Rollback

Disable routes; retain source facts/events.

## S5 — Episode-day and UR queue projector

### Goal

Build deterministic server-owned operational read models.

### Likely files/packages

- `packages/analytics-service/src/projectors/`
- worker entry point under current package convention
- projection repositories
- `EpisodeDay`/`UrQueueItemProjection` tables or approved views
- worker tests/runbook

### Schema/API/UI

- event delivery claim/checkpoint;
- episode-day materialization;
- coverage/risk derivation;
- queue projection;
- no public analytics yet.

### Dependencies

S2–S4, facility timezone, event ordering/retry policy.

### Tests

Replay, duplicates, crash/retry, poison event, correction, late event, per-tenant isolation.

### Security/privacy gates

Worker least privilege; queue contains only minimum necessary.

### Completion evidence

Empty projection rebuild equals expected synthetic fixture result.

### Rollback

Stop worker; source events intact.

## S6 — Minimal de-identified mart and metric snapshots

### Goal

Prove the PHI boundary and calculate V1 metrics from allowlisted facts.

### Likely files/packages

- SQL migration for `analytics` schema
- `packages/analytics-service/src/deidentification/`
- `packages/analytics-service/src/metrics/`
- metric definition files
- privacy tests

### Schema/API/UI

- dimensions/facts;
- tokenization port;
- snapshots/recompute;
- no patient-level dashboard query.

### Dependencies

Approved pilot de-identification policy, key-management port, metric status/owners.

### Tests

Prohibited fields, token scope, metric fixtures, no data, correction lineage, DB role separation.

### Security/privacy gates

Mandatory privacy review; cross-org disabled.

### Completion evidence

Synthetic facts/snapshots with no direct identifiers and exact expected calculations.

### Rollback

Stop worker/revoke reader; rebuildable schema retained.

## S7 — API queries and frontend workspaces

### Goal

Expose the operational queue and aggregate authorization-risk dashboard through the authenticated API and separate module navigation.

### Likely files/packages

- `packages/api-service/`
- query services/repositories
- `app/src/workspaces/AdmissionHandoff.tsx` or verified equivalent
- `app/src/workspaces/UtilizationReview.tsx`
- `app/src/workspaces/AuthorizationRisk.tsx`
- shared API client/types/components
- navigation/router
- UI tests

### Schema/API/UI

- queue, episode detail, aggregate, provenance queries;
- Admission Handoff UI if not in S3;
- UR queue/detail/gap UI;
- Authorization Risk dashboard;
- state/error matrix;
- no direct browser event/mart writes.

### Dependencies

S3–S6; ADR-0012/route framework accepted.

### Tests

API auth/pagination/freshness; UI states/accessibility; no PHI in aggregate DOM/response; feature flags.

### Security/privacy gates

Role matrix, response allowlists, cache policy, aggregate privacy review.

### Completion evidence

End-to-end synthetic scenario and screenshots/state evidence.

### Rollback

Disable server/client flags; keep command/event state.

## S8 — Hardening and controlled pilot

### Goal

Meet production prerequisites before any real PHI.

### Likely files

Provider/deployment/CI configuration, security/operations docs, RLS migration, runbooks.

### Changes

Managed identity, production RLS, DB roles, observability, backup/restore, immutability, performance, incident handling.

### Dependencies

Hosting/provider and security decisions.

### Tests

RLS, restore, load baselines, session revocation, security headers/rate limits, privacy telemetry review.

### Security/privacy gates

Formal sign-offs.

### Completion evidence

Pilot readiness checklist; no unsupported outcome claims.

### Rollback

Provider-specific deployment rollback and feature disablement.

## Later slices

Only after V1 evidence:

- discharge/continuity;
- census/bed events;
- clinical quality/documentation;
- staffing/payroll;
- finance/rates/revenue;
- executive intelligence;
- approved cross-facility/organization aggregation;
- agency export/acknowledgement;
- external EHR/payer adapters;
- predictive/forecasting work only with separate validation and governance.

## Proposed repository placement

| Concern | Proposed path | Verification needed |
|---|---|---|
| Episode contracts | `packages/domain-contracts/src/episode/` | current barrel/naming |
| UR contracts | `packages/domain-contracts/src/utilization-review/` | current domain layout |
| Analytics contracts | `packages/domain-contracts/src/analytics/` | avoid collision with prototype events |
| Episode commands | `packages/episode-service/` | package scaffolding conventions |
| UR commands | `packages/utilization-review-service/` | existing authorization-service boundary |
| Projectors/metrics | `packages/analytics-service/` | worker/package conventions |
| Exports later | `packages/reporting-service/` | do not create in first PR without need |
| HTTP | `packages/api-service/` | Fastify/node decision and route registry |
| Prisma | `prisma/schema.prisma` | exact models/relations |
| UI | `app/src/workspaces/...` | actual router/workspace structure |
| ADRs | `docs/architecture/` | next ADR number |
| Implementation contracts | `docs/implementation/` | current docs convention |
| Tests | package colocated + `tests/` | current integration harness |

## Files expected in first coding PR (S1 only)

After preflight, likely:

- `packages/domain-contracts/src/episode/index.ts`
- `packages/domain-contracts/src/episode/episodeSchemas.ts`
- `packages/domain-contracts/src/episode/episodeStateMachine.ts`
- `packages/domain-contracts/src/episode/*.test.ts`
- `packages/domain-contracts/src/utilization-review/index.ts`
- `packages/domain-contracts/src/utilization-review/authorizationSchemas.ts`
- `packages/domain-contracts/src/utilization-review/documentationGapStateMachine.ts`
- `packages/domain-contracts/src/utilization-review/episodeDayDerivation.ts`
- corresponding tests
- `packages/domain-contracts/src/analytics/eventEnvelope.ts`
- `packages/domain-contracts/src/analytics/metricDefinition.ts`
- package barrel exports
- accepted ADR/implementation contract docs

Codex must not create these exact paths blindly if the repository uses another convention.
