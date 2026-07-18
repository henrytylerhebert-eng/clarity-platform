# Source and Assumption Register

## Review boundary

**Confirmed:** Every root handoff document was read before this architecture was proposed:

- `CHATGPT_MASTER_PROMPT.md`
- `README.md`
- `01_VERIFIED_CURRENT_STATE.md`
- `02_TARGET_PRODUCT_SCOPE.md`
- `03_DATA_COLLECTION_AND_GOVERNANCE.md`
- `04_INTEGRATION_CONTRACT.md`
- `05_REQUIRED_RETURN_PACKAGE.md`
- `SOURCE_MANIFEST.md`

The included canonical repository and reporting snapshots were then reviewed in the source hierarchy below.

**Unknown:** The live repository working tree, exact current files, exact Prisma model names, exact role enums, package exports, route registration, local environment, and uncommitted changes were not available. The handoff explicitly says the working tree was modified at packaging time. Codex must treat the live tree as the implementation source of truth.

## Source hierarchy applied

| Rank | Source class | Files used | Treatment |
|---:|---|---|---|
| 1 | Live implementation | Not supplied | Must be inspected by Codex before edits |
| 2 | Canonical repository snapshot | `source-material/repo/*` | Primary evidence for current patterns and status |
| 3 | Reporting definitions/blueprints | `source-material/reporting/*` | Design input; not transactional authority |
| 4 | Workbook reverse engineering | Included only as redacted analysis/summary | Context; formulas require validation |
| 5 | This package | All return-package files | Proposed and unverified |

## Material claim register

| ID | Classification | Material statement | Evidence or rationale | Implementation consequence |
|---|---|---|---|---|
| SRC-001 | Confirmed | The product currently centers on referral through admission transition. | `01_VERIFIED_CURRENT_STATE.md`; repo `README.md`; `PRODUCT_VISION.md` | Add a separate post-admission module; do not overload the intake Command Center |
| SRC-002 | Confirmed | The frontend prototype is React/TypeScript and largely localStorage/synthetic. | `01_VERIFIED_CURRENT_STATE.md`; repo `README.md` | New production state must be server-owned |
| SRC-003 | Confirmed | Controlled command/service packages and Prisma-backed adapters exist for case, document, evidence, benefits, authorization, and auth. | `IMPLEMENTATION_STATUS.md` | Preserve service/package and command patterns |
| SRC-004 | Confirmed | A narrow authenticated `node:http` API spike exists. | `IMPLEMENTATION_STATUS.md`; ADR-0012 implementation note | Do not assume Fastify is already implemented |
| SRC-005 | Confirmed | ADR-0012 remains Proposed and recommends Fastify. | ADR-0012 | Owner approval required before route expansion |
| SRC-006 | Confirmed | The current analytics event export is a local prototype seam, not a durable server event store. | `01_VERIFIED_CURRENT_STATE.md` | Build a governed event ledger/outbox rather than reusing local browser events as authority |
| SRC-007 | Confirmed | The reporting SQL is a reporting-only starter schema. | `01_VERIFIED_CURRENT_STATE.md`; `SOURCE_MANIFEST.md`; SQL header | It must not replace canonical Prisma workflow state |
| SRC-008 | Confirmed | Production hosting, managed identity, production-wide RLS, observability, live integrations, and measured outcomes are not established. | `IMPLEMENTATION_STATUS.md`; handoff README | All production readiness remains gated |
| SRC-009 | Confirmed | Financial readiness may not block emergency clinical review. | `CASE_WORKFLOW.md`; product vision | UR risk is advisory/workflow support, never admission or care priority automation |
| SRC-010 | Confirmed | No autonomous clinical, legal, admission, discharge, placement, or authorization decisions are allowed. | Master prompt; product vision; governance handoff | All commands require authorized human or deterministic administrative processing |
| SRC-011 | Confirmed | The receiving facility is the primary user; intake staff are not assumed to be nurses. | `INTAKE_TO_ADMISSION_WORKFLOW.md` | Capability-based role design; no nurse-only assumption |
| SRC-012 | Confirmed | Physician acceptance/delegation rules are facility-specific and require clinical/legal review. | `INTAKE_TO_ADMISSION_WORKFLOW.md` | Admission handoff consumes an already authorized acceptance; it does not decide acceptance |
| SRC-013 | Confirmed | The initial reporting lens should be utilization-review excellence. | `reporting-metrics-rebuilder.md` | First dashboard/queue centers on authorization state and documentation gaps |
| SRC-014 | Confirmed | The legacy workbook mixes PHI and aggregate logic and has formula errors. | reverse-engineering report and summary | Never backfill directly or present workbook formulas as canonical |
| SRC-015 | Confirmed | The reporting architecture calls for a PHI store and de-identified mart. | sustainable architecture; handoff governance | Create explicit zones, database roles, lineage, and suppression metadata |
| SRC-016 | Inferred | Pre-admission authorization preparation and post-admission concurrent UR are different aggregates. | Existing authorization service is preparation-only; target requires recurring reviews/day states | Add episode-owned authorization entities linked to source readiness records |
| SRC-017 | Inferred | The intake case remains the historical access aggregate after admission. | Product boundary and case spine | Link, do not transform or overwrite the case into an episode |
| SRC-018 | Inferred | At-risk status should be a risk dimension, not a mutually exclusive coverage outcome. | Approved-through dates can be valid while expiration is near | Model `coverageStatus` separately from `riskState` to prevent double counting |
| SRC-019 | Inferred | A server-owned queue should be a projection, not client-authored state. | Controlled-command pattern and initial-slice requirement | Queue changes only when source commands/events change; assignments use a controlled command |
| SRC-020 | Proposed | Use a transactional governed-event ledger plus delivery/checkpoint records in the same PostgreSQL cluster initially. | Balances atomicity and operational simplicity | Preserves future broker/database split |
| SRC-021 | Proposed | Use separate runtime processes for API and projectors even when sharing a repository and database. | Failure isolation and independently observable lag | Deployment can scale/rollback processes independently |
| SRC-022 | Proposed | Use a separate analytics schema and database role for de-identified facts. | PHI/mart boundary | Prevent API command role from writing mart tables directly |
| SRC-023 | Proposed | Require exact facility IANA timezone; derive service date at the facility boundary. | Company-agnostic requirement; SQL blueprint default is unsafe | No global timezone default in production |
| SRC-024 | Proposed | Use code-owned, versioned metric implementations referenced by a governed registry for the first slice. | Avoid arbitrary runtime SQL and unvalidated workbook formulas | Every snapshot records definition version and source watermark |
| SRC-025 | Proposed | Return 404 for cross-tenant object references and 403 for known in-scope role denial. | Identifier-enumeration risk and ADR error taxonomy | Requires security-owner approval and tests |
| SRC-026 | Unknown | Exact current `UserRole` values and role-to-scope mapping. | Not present in supplied source | Capability names in this package must be mapped during preflight |
| SRC-027 | Unknown | Exact canonical organization/facility/program/unit/person models. | Live Prisma not supplied | Do not create duplicates until schema inspection |
| SRC-028 | Unknown | Whether one case can create multiple episodes or one episode can link multiple cases. | Not specified | Recommended first rule is one accepted case to at most one active episode; owner must approve |
| SRC-029 | Unknown | Production identity provider and session-to-scope claims. | Explicit open decision | Pilot cannot be declared production-ready |
| SRC-030 | Unknown | Approved de-identification method, small-cell threshold, retention, deletion, and date policy. | Explicit handoff questions | Cross-org and agency outputs remain disabled |
| SRC-031 | Unknown | Applicable agency reports and jurisdictions. | Explicit handoff question | No agency export implementation in first slice |
| SRC-032 | Unknown | Valid operator-approved metric formulas and payer-specific definitions. | Workbook formulas unvalidated | Metrics remain `DRAFT` until steward approval |
| SRC-033 | Unknown | Baseline denial, margin, transfer, or other outcomes. | `No measurements found` evidence boundary | UI must not claim improvement |
| SRC-034 | Needs decision | Whether to change roadmap priority from Product Studio projection to UR/episode vertical slice. | Canonical roadmap conflicts with requested handoff | Tyler approval required |
| SRC-035 | Needs decision | Fastify versus continuing `node:http`. | ADR-0012 unresolved | Codex must not deepen the API without decision |
| SRC-036 | Needs decision | Shared database/schema plus RLS versus stronger tenant isolation. | ADR-0012 reversal trigger | Controls and migration depend on decision |
| SRC-037 | Needs decision | Separate episode authorization aggregate versus expanding existing authorization model. | Boundary is inferred, not owner-approved | Approve before schema migration |
| SRC-038 | Needs decision | Metric definition owner and denial-rate denominator. | Source definitions are ambiguous | Do not display an approved denial rate until resolved |
| SRC-039 | Needs decision | Cross-organization authority and benchmark cohort policy. | Governance requirement | No cross-org route or table is enabled by default |
| SRC-040 | Needs decision | Free-text documentation-gap content policy. | It can contain PHI and sensitive clinical detail | First slice should prefer controlled categories and minimal operational text |

## Explicit contradictions

### API framework and timing

- **Current implementation:** `packages/api-service` uses `node:http`.
- **ADR-0012:** recommends evolving that package to Fastify before adding routes.
- **Target request:** requires several new operational and analytics endpoints.

**Resolution:** Treat Fastify acceptance/porting as a prerequisite decision. Do not create a second public API package.

### Roadmap priority

- **Current roadmap:** resolve ADR-0012, then build a server-owned read-only Product Studio projection.
- **Target request:** prioritize post-admission episode/UR analytics.

**Resolution:** Record a product-owner-approved sequence change. Keep Product Studio read-only and out of scope.

### Transactional versus reporting model

- **Current Prisma:** canonical transactional foundation.
- **Reporting SQL:** reporting-only tables including PHI identity, episode, days, staffing, revenue, metrics.
- **Target architecture:** operational commands plus governed events plus a de-identified mart.

**Resolution:** Put new operational aggregates in canonical Prisma after schema preflight. Use a separate analytics schema for minimized facts. Do not copy the blueprint wholesale.

### Authorization grain

- **Existing service:** pre-admission preparation/readiness, with submission intentionally unreachable in the current phase.
- **Reporting SQL:** one `ur_authorization` row with total approved/denied days.
- **Target:** recurring reviews, day-level states, pending/expired/risk, corrections.

**Resolution:** Create a linked post-admission authorization aggregate with review and day-allocation facts.

### Audit and correction

- **Current services:** append-only audit events and optimistic concurrency.
- **Reporting SQL:** minimal generic `audit_log`.
- **Target:** immutable event/provenance, supersession, late arrival, recomputation.

**Resolution:** Extend the current audit pattern and add a governed event ledger; do not introduce a competing generic audit table.

## Assumptions used only to make contracts concrete

These assumptions are **Proposed and unverified** and must be checked:

- UUID identifiers remain compatible with the current schema.
- Organization ID is available on the verified principal and every tenant-owned command.
- Existing `CommandIdempotencyRecord` can be reused or extended instead of duplicated.
- Current audit helpers can accept organization-level and episode-level subjects.
- API errors can expose a stable machine code without exposing PHI or cross-tenant existence.
- The frontend has a workspace/navigation registry that can add a second top-level module.
- PostgreSQL supports an additional analytics schema and separate roles in the selected deployment.
- A facility timezone can be sourced from canonical facility configuration before episode-day derivation is enabled.
