# Clarity Analytics Return Package

**Package status:** Proposed and unverified  
**Prepared from:** `chatgpt-full-stack-analytics-handoff` snapshot dated 2026-07-18  
**Repository snapshot named by the handoff:** `clarity-platform`, branch `main`, observed HEAD `8af3e69d0f7d057d2ed903c78f3e7428b131e492`  
**Evidence boundary:** The live repository was not available in this review. All file placement, model names, imports, route wiring, and migration details must be preflighted against the dirty working tree before editing.

## Purpose

This package defines a build-ready product and technical boundary for a separable **Hospital Operations and Outcomes Intelligence** module that begins at admission handoff and shares a governed event spine with Clarity's existing **Access and Admission Orchestration** domain.

The recommended first production-shaped capability is deliberately narrow:

1. convert an accepted case into a tenant-scoped episode;
2. record episode-day facts without an EHR dependency;
3. record post-admission authorization reviews and day-level decisions;
4. derive approved, denied, pending, expired, and at-risk day states;
5. record and resolve documentation gaps;
6. build a server-owned utilization-review queue;
7. expose a PHI-minimized authorization-risk dashboard;
8. preserve immutable audit, provenance, correction, and recomputation history;
9. enforce verified-principal, role, organization, facility, program, and unit scope;
10. prove behavior with synthetic fixtures and focused tests.

The package does **not** claim that production hosting, production identity, live integrations, production RLS, operational outcomes, benchmarks, or regulator authorization exist.

## Recommended architecture in one paragraph

Accept ADR-0012's direction to evolve `packages/api-service` into the sole authenticated public API boundary, but keep analytics processing behind that boundary as a separate internal worker/runtime and package set. Native operational commands write transactional state, append a governed event, append audit evidence, and enqueue projection delivery atomically in PostgreSQL. A worker creates rebuildable operational projections and a separate de-identified analytics mart. The React client reads operational work queues and aggregate metrics only through authenticated API queries; it never writes event or analytics tables directly. Start with one PostgreSQL cluster and separate schemas/database roles, then split the analytics store only when scale, residency, isolation, or operational ownership requires it.

## Package map

| Path | Purpose |
|---|---|
| `00_EXECUTIVE_RECOMMENDATION.md` | Recommended architecture, alternatives, contradictions, and approval boundary |
| `01_SOURCE_AND_ASSUMPTION_REGISTER.md` | Source hierarchy and claim classifications |
| `02_PRODUCT_AND_WORKFLOW_DESIGN.md` | Product boundary, stakeholder workflows, lifecycle, and decision support |
| `03_SYSTEM_ARCHITECTURE.md` | Bounded contexts, runtime topology, command/event/query flow, and ADR proposals |
| `04_DOMAIN_AND_EVENT_MODEL.md` | Entities, ownership, lifecycles, event envelope, correction model, and event catalog guidance |
| `05_DATA_COLLECTION_ADAPTERS.md` | Native, FHIR/HL7, payer, staffing, batch, attestation, and agency adapter contracts |
| `06_SECURITY_TENANCY_AND_GOVERNANCE.md` | Authorization, tenant scope, RLS, de-identification, benchmark, and export governance |
| `07_API_AND_SERVICE_CONTRACTS.md` | Command/query contracts, errors, idempotency, pagination, freshness, and package boundaries |
| `08_UX_INFORMATION_ARCHITECTURE.md` | Top-level navigation and role-specific information architecture |
| `09_WORKSPACE_SPECIFICATIONS.md` | Detailed admission, UR, episode, documentation, audit, and dashboard workspace behavior |
| `10_METRIC_REGISTRY.md` | Versioned metric definitions and first-slice measures |
| `11_ANALYTICS_MART_AND_DEIDENTIFICATION.md` | PHI-to-mart flow, SQL mart design, suppression, recomputation, and exports |
| `12_MIGRATION_AND_BACKFILL_PLAN.md` | Additive migrations, no-workbook backfill rule, rollout, and correction/backfill controls |
| `13_TEST_AND_VERIFICATION_PLAN.md` | Unit, integration, API, projection, tenancy, privacy, UI, and acceptance tests |
| `14_OBSERVABILITY_DEPLOYMENT_AND_ROLLBACK.md` | Logs, metrics, traces, deployment sequence, rollback, and runbooks |
| `15_IMPLEMENTATION_SEQUENCE.md` | Small independently verifiable slices mapped to proposed repository paths |
| `16_RISK_AND_DECISION_REGISTER.md` | Risks, unresolved questions, and explicit owner decisions |
| `17_CODEX_EXECUTION_HANDOFF.md` | Final Codex prompt for the first approved implementation slice |
| `contracts/` | JSON Schema, OpenAPI-style YAML, event catalog, authorization matrix, metric schema |
| `schema/` | Proposed Prisma fragment, analytics SQL, and source mappings |
| `frontend/` | Navigation, UR queue, dashboard, and state/error specifications |
| `examples/` | Synthetic, non-PHI example events and query response |

## Status vocabulary

- **Confirmed** — stated by the supplied handoff or canonical snapshot documentation.
- **Inferred** — a reasoned conclusion from multiple supplied sources.
- **Proposed** — a recommended design not shown as implemented.
- **Unknown** — not established by the supplied evidence.
- **Needs decision** — implementation should stop until an authorized owner chooses or approves the option.

## Non-negotiable guardrails

- No autonomous clinical, admission, discharge, placement, legal, or authorization decisions.
- No browser-to-event-store, browser-to-mart, or browser-to-database writes.
- No legacy workbook as a system of record or metric-definition authority.
- No raw PHI in executive dashboards, benchmark datasets, or regulator exports.
- No cross-organization aggregation without explicit authority, purpose, cohort policy, and audit.
- No outcome or improvement claim without measured, approved evidence.
- No silent mutation of historical events, metric snapshots, or correction history.
- No assumption that current frontend role selection is production authorization.
- No assumption that any integration, deployment, or production security control exists.

## Implementation use

Codex should begin with `17_CODEX_EXECUTION_HANDOFF.md`, then verify the repository against `01_SOURCE_AND_ASSUMPTION_REGISTER.md` and `15_IMPLEMENTATION_SEQUENCE.md`. The proposed Prisma and API contracts are review targets, not a claim that they merge or compile unchanged.
