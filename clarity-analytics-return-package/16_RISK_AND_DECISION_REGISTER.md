# Risk and Decision Register

## Risk register

| ID | Risk | Likelihood | Impact | Mitigation | Owner/status |
|---|---|---|---|---|---|
| R-001 | API expansion occurs before ADR-0012 is resolved | High | High | owner decision; port/accept adapter before routes | Needs decision |
| R-002 | Requested UR slice silently displaces canonical Product Studio next step | High | Medium | explicit roadmap approval | Tyler |
| R-003 | New models duplicate existing Prisma entities/fields | Medium | High | live schema preflight and staged mapping | Engineering |
| R-004 | Pre-admission authorization semantics are broken by post-admission changes | Medium | High | separate episode-owned aggregate and linkage | Product/engineering decision |
| R-005 | Case-to-episode linkage permits duplicate active episodes | Medium | High | invariant, idempotency, concurrency, owner-approved transfer/readmission rules | Product |
| R-006 | Facility/program/unit/timezone master data is missing or inconsistent | High | High | block derivation; configuration owner; mapping quality state | Operations/product |
| R-007 | Cross-tenant access via ID, join, cache, or aggregate | Medium | Critical | principal-derived org, predicates, RLS, cache scope, exhaustive tests | Security/engineering |
| R-008 | UI role selection is treated as authorization | Medium | Critical | API/domain enforcement; capability-driven UI only | Engineering/security |
| R-009 | Aggregate endpoint leaks PHI or allows patient inference | Medium | Critical | separate mart/query, response allowlist, suppression, privacy tests | Privacy/security |
| R-010 | Free-text gap/correction content enters logs or mart | High | High | controlled categories, bounded text, drop from mart, log allowlist | Product/security |
| R-011 | Event and operational state commit separately | Medium | High | same transaction append/audit/delivery | Engineering |
| R-012 | Duplicate/out-of-order events corrupt projections | High later | High | source uniqueness, active chain, idempotent projectors, replay tests | Engineering |
| R-013 | Correction branches create ambiguous truth | Medium | High | expected active version, single supersession branch, quarantine | Governance/engineering |
| R-014 | Metric definitions canonize workbook errors | High | High | draft registry, steward approval, fixture tests | Metric owner |
| R-015 | Denial-rate denominator is ambiguous | High | Medium | distinctly named draft rate; no display until approval | UR/finance owner |
| R-016 | `at-risk` is double-counted as an outcome | High | Medium | separate risk flags from coverage status; UI caveat | Product/data |
| R-017 | Projection lag makes queue/dashboard misleading | Medium | High | freshness metadata, last-safe data, alerting, source watermark | Operations |
| R-018 | Mart credentials permit excess PHI access | Medium | Critical | separate roles, restricted tokenization port, grant tests | Security/DBA |
| R-019 | De-identification policy is insufficient or unapproved | High | Critical | keep cross-org/export disabled; formal approval | Privacy/security |
| R-020 | Small cells reveal individuals | Medium | Critical | approved suppression/complementary policy | Privacy |
| R-021 | `SYSTEM_ADMIN` silently bypasses domain policy | Medium | High | explicit capabilities; denial tests | Security/product |
| R-022 | Raw external payload retention expands liability | Medium | High | minimum retention, restricted staging, policy decision | Privacy/operations |
| R-023 | Projector poison event blocks all tenants | Medium | High | isolation/quarantine/retry strategy | Engineering |
| R-024 | Shared database analytics harms transactional performance | Low initially | High | separate schema/roles/process, query plans, split trigger | Architecture |
| R-025 | Additive schema cannot be rolled back cleanly | Medium | Medium | feature rollback and forward fix; migration review | Engineering/DBA |
| R-026 | Production readiness is inferred from local tests | High | High | explicit production gate and evidence checklist | Owner |
| R-027 | Outcome/ROI claims appear without measurement | Medium | High | `No measurements found`; content review | Product/marketing |
| R-028 | Agency export is built without jurisdiction authority | Low first slice | Critical | no route/service until approved report contract | Compliance/legal |
| R-029 | Healthcare workflow language is treated as legal/clinical truth | Medium | High | configuration-not-truth, human review, qualified approval | Clinical/legal |
| R-030 | Excessive first PR becomes unreviewable | High | High | implementation slices S0–S8 | Engineering lead |

Likelihood/impact are qualitative planning judgments, not measured risk scores.

## Decision log

### D-001 — Public API boundary

- **Status:** Needs decision.
- **Recommended:** Accept ADR-0012 direction, evolve existing `packages/api-service` to Fastify before adding episode/UR routes.
- **Alternative:** Explicitly accept `node:http` for pilot with identical thin-adapter constraints.
- **Do not:** create a second public API or route around authentication.

### D-002 — Analytics runtime placement

- **Status:** Recommended.
- **Decision:** Separate internal worker/process and package boundary; same PostgreSQL cluster with separate schema/roles for first pilot.
- **Split trigger:** scale, residency, isolation, performance, operational ownership.

### D-003 — Roadmap priority

- **Status:** Needs Tyler approval.
- **Recommended:** Authorize S0–S7 UR/episode vertical capability before or instead of the planned Product Studio projection.
- **Constraint:** Product Studio remains read-only and out of scope.

### D-004 — Case/episode relationship

- **Status:** Needs decision.
- **Recommended:** case remains access aggregate; explicit source link; one active admission-source episode per accepted case in V1.

### D-005 — Post-admission authorization

- **Status:** Needs decision.
- **Recommended:** new episode-owned authorization/review aggregate linked to existing pre-admission readiness, with no automatic migration.

### D-006 — Authorization day model

- **Status:** Recommended.
- **Decision:** date-range decisions are source facts; episode-day coverage is derived; at-risk is separate risk dimension.

### D-007 — Governed event spine

- **Status:** Recommended.
- **Decision:** state + audit + event + delivery + idempotency in one transaction; immutable event with correction chain; replayable projectors.

### D-008 — UR queue ownership

- **Status:** Recommended.
- **Decision:** queue is a server-owned projection; user actions modify source review/gap/assignment state through commands.

### D-009 — PHI/mart boundary

- **Status:** Needs privacy/security approval.
- **Recommended:** operational PHI in canonical store; de-identified allowlisted mart in separate schema/role; no identity/free text.

### D-010 — Tenant model

- **Status:** Needs decision.
- **Recommended pilot:** one database, shared operational schema, organization on every row, application predicates, PostgreSQL RLS before real PHI.
- **Reversal:** database/schema per tenant if mandated.

### D-011 — Fine-grained scope

- **Status:** Recommended.
- **Decision:** facility/program/unit grants are verified-principal scope; requested filters only narrow scope.

### D-012 — Cross-organization aggregation

- **Status:** Disabled/needs governance.
- **Decision:** no ordinary route; separate aggregate grant/schema after authority, suppression, and audit.

### D-013 — Metric implementation

- **Status:** Recommended.
- **Decision:** code-owned calculators referenced by versioned registry for V1; no arbitrary browser SQL.

### D-014 — Denial rate

- **Status:** Needs metric-owner decision.
- **Recommended:** use a clearly named decisioned-day rate only after approval; do not silently use workbook denominator.

### D-015 — Facility timezone

- **Status:** Needs source owner.
- **Recommended:** required IANA timezone per facility; no production default.

### D-016 — Corrections

- **Status:** Recommended.
- **Decision:** append correction/reversal; preserve original; recompute affected projections/snapshots.

### D-017 — External integrations

- **Status:** Deferred.
- **Decision:** define ports/mappings now; no EHR/payer/payroll/regulator dependency in V1.

### D-018 — Production authorization

- **Status:** Unknown.
- **Decision:** synthetic only until managed identity, RLS, hosting, backup, observability, retention, and security/privacy review are evidenced.

## Decisions Tyler must approve

1. The roadmap change to prioritize the post-admission UR vertical capability.
2. ADR-0012 final API framework/boundary.
3. Case-to-episode cardinality and transfer/readmission exceptions.
4. Separate episode-owned authorization aggregate.
5. Exact product/module name and navigation boundary.
6. Metric owners and which draft metrics may appear.
7. Facility/program/unit/timezone source of truth.
8. Pilot tenant/isolation model.
9. Whether aggregate analytics is enabled before the full de-identification governance package.
10. Who owns privacy/security, clinical, legal, and operational approvals.

## Decisions for specialized owners

### Security/privacy

- IdP and claims;
- RLS/DB roles;
- tokenization/key management;
- exact date handling;
- small-cell policy;
- retention/deletion/legal hold;
- raw payload retention;
- break-glass, if any;
- cross-org authority.

### UR/operations/finance metric owners

- authorization requirement semantics;
- review due/expiration thresholds;
- denied/approved/pending range precedence;
- denial categories;
- denial-rate denominator;
- gap categories and resolution codes;
- metric approval status.

### Clinical/legal

- facility admission authority/configuration;
- any facility criteria or documentation rule;
- language that could imply care or authorization decisions;
- agency/jurisdiction requirements.

### Engineering/operations

- package/path mapping;
- migration strategy;
- worker leasing/order;
- deployment provider;
- backup/restore;
- observability/SLOs;
- performance split triggers.
