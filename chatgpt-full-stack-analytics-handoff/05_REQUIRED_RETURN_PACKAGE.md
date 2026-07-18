# Required ChatGPT Return Package

Return a folder named `clarity-analytics-return-package` with this structure:

```text
clarity-analytics-return-package/
  README.md
  00_EXECUTIVE_RECOMMENDATION.md
  01_SOURCE_AND_ASSUMPTION_REGISTER.md
  02_PRODUCT_AND_WORKFLOW_DESIGN.md
  03_SYSTEM_ARCHITECTURE.md
  04_DOMAIN_AND_EVENT_MODEL.md
  05_DATA_COLLECTION_ADAPTERS.md
  06_SECURITY_TENANCY_AND_GOVERNANCE.md
  07_API_AND_SERVICE_CONTRACTS.md
  08_UX_INFORMATION_ARCHITECTURE.md
  09_WORKSPACE_SPECIFICATIONS.md
  10_METRIC_REGISTRY.md
  11_ANALYTICS_MART_AND_DEIDENTIFICATION.md
  12_MIGRATION_AND_BACKFILL_PLAN.md
  13_TEST_AND_VERIFICATION_PLAN.md
  14_OBSERVABILITY_DEPLOYMENT_AND_ROLLBACK.md
  15_IMPLEMENTATION_SEQUENCE.md
  16_RISK_AND_DECISION_REGISTER.md
  17_CODEX_EXECUTION_HANDOFF.md
  contracts/
    analytics-event-envelope.schema.json
    event-catalog.md
    api-contracts.yaml
    authorization-matrix.csv
    metric-definition.schema.json
  schema/
    proposed-transactional-model.prisma
    proposed-analytics-blueprint.sql
    source-to-canonical-mappings.md
  frontend/
    navigation-and-role-map.md
    ur-work-queue-spec.md
    authorization-risk-dashboard-spec.md
    state-and-error-matrix.md
  examples/
    synthetic-admission-event.json
    synthetic-authorization-review-event.json
    synthetic-documentation-gap-event.json
    synthetic-dashboard-response.json
```

## Content Requirements

### Executive recommendation

Provide one recommended architecture, alternatives considered, tradeoffs, and the decisions needed before implementation.

### Source and assumption register

Classify every material claim as `Confirmed`, `Inferred`, `Proposed`, `Unknown`, or `Needs decision`.

### Architecture

Include diagrams for:

- bounded contexts;
- referral-to-episode transition;
- command/event/query flow;
- PHI-to-analytics data flow;
- deployment topology;
- tenancy and cross-organization aggregation.

### Contracts

Contracts must be concrete enough to review for implementation. Include error shapes, idempotency, versioning, pagination, freshness, suppression, and authorization behavior.

### UX

Specify role, user goal, information hierarchy, actions, filters, table/card contents, drill-downs, provenance, correction indicators, responsive behavior, accessibility, and all non-happy-path states.

### Implementation sequence

Break delivery into small independently verifiable slices. For every slice list:

- goal;
- files or packages likely affected;
- schema/API/UI changes;
- dependencies;
- tests;
- security and privacy gates;
- completion evidence;
- rollback boundary.

### Codex execution handoff

Produce a final implementation prompt for the first approved slice. It must instruct Codex to preflight the repository, preserve dirty work, inspect current patterns, avoid unrelated changes, and stop at unresolved architectural or security decisions.

## Quality Bar

- No generic dashboard language without entity, metric, source, role, and decision definitions.
- No unsupported production-readiness claims.
- No fabricated metrics or benchmarks.
- No raw PHI in examples.
- No autonomous regulated decisions.
- No direct browser-to-analytics writes.
- No silent cross-tenant aggregation.
- No duplicated system of record.
- No workbook formulas treated as canonical without operator validation.

