# Integration Contract

## Existing Repository Patterns to Preserve

- React/TypeScript frontend under `app/src`.
- Role-adaptive workspace navigation.
- Domain contracts and state machines under `packages/domain-contracts`.
- Controlled command paths in service packages.
- Explicit authorization policy and actor identity.
- Organization scoping in persistence predicates.
- Optimistic concurrency where state can change.
- Idempotency and correlation identifiers for commands.
- Append-only audit events.
- Human review gates for clinical, legal, financial, and placement outputs.
- Synthetic fixtures separated from canonical state.

## Proposed Bounded Contexts

ChatGPT should evaluate and refine these boundaries:

| Context | Responsibility |
| --- | --- |
| Case and Access | Referral-through-acceptance workflow |
| Admission and Episode | Admission handoff, episode lifecycle, discharge |
| Authorization and UR | Reviews, status, episode-day coverage, denials, gaps |
| Hospital Operations | Census, bed-status events, patient days, throughput |
| Workforce | Staffing actuals, budget rules, agency and observation burden |
| Finance | Contract assumptions, revenue projections, adjustments |
| Analytics | Event ingestion, facts/dimensions, metric registry, snapshots |
| Reporting | Role projections, exports, submissions, acknowledgements |

## API Boundary Requirements

- Browser clients must not write directly to analytics tables.
- Operational commands must use authenticated server-owned services.
- Analytics ingestion must validate schema, tenant scope, provenance, idempotency, and event time.
- Queries must enforce role, organization, facility, program, and aggregation scope.
- Aggregate endpoints must return freshness, completeness, definition version, and suppression metadata.
- The API must distinguish transactional commands from analytics queries and exports.
- No mutation, publication, feature-flag, or deployment control should be added to Product Studio before server authorization and audit boundaries exist.

## Initial End-to-End Slice

```text
Accepted referral
-> authorized admission command
-> episode created
-> ADMISSION_RECORDED event
-> authorization review recorded
-> episode-day authorization state derived
-> documentation gap recorded/resolved
-> UR queue projection updated
-> authorization-risk metrics calculated
-> role-scoped dashboard query
-> audit and provenance visible
```

## Required UX States

Every workspace design must account for:

- loading;
- no data;
- no measurements found;
- insufficient denominator;
- stale data;
- partial source coverage;
- source disagreement;
- late-arriving data;
- corrected/superseded data;
- unauthorized scope;
- integration failure;
- export pending/failed/acknowledged;
- review or attestation required.

## Suggested Repository Placement for Evaluation

These paths are proposals, not instructions to modify without review:

- `packages/domain-contracts/src/analytics/`
- `packages/episode-service/`
- `packages/utilization-review-service/`
- `packages/analytics-service/`
- `packages/reporting-service/`
- `app/src/workspaces/AdmissionHandoff.tsx`
- `app/src/workspaces/UtilizationReview.tsx`
- `app/src/workspaces/HospitalOperations.tsx`
- `app/src/workspaces/ExecutiveIntelligence.tsx`
- `prisma/schema.prisma` or a separately approved analytics schema/runtime
- `docs/architecture/` for ADRs
- `docs/implementation/` for implementation contracts
- `docs/testing/` for test manifests

ChatGPT must compare these suggestions with existing package conventions before recommending exact placement.

