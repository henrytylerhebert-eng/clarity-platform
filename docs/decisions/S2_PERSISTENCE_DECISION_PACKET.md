---
status: Implementation approved within bounded synthetic-only S2 scope; production hardening remains gated
owner: Tyler/product owner, technical lead, security reviewer
date: 2026-07-18
data_boundary: synthetic only
related_records:
  - docs/developer-handoff/S1_REVIEW_AND_ACCEPTANCE_RECORD.md
  - docs/decisions/OPEN_DECISIONS.md
  - docs/architecture/ADR-0002-canonical-data-model.md
  - docs/architecture/ADR-0012-api-architecture.md
  - prisma/schema.prisma
---

# S2 Persistence Decision Packet

## Purpose

This packet prepares the decisions required for S2 persistence. It is not an execution prompt and does not authorize Prisma changes, migrations, service code, API routes, workers, or deployment work.

S2 should begin only after the S1 review record is accepted and the decisions below are resolved by the appropriate owners.

## Proposed S2 Boundary

If approved, S2 would persist the following synthetic-only operational facts:

- Episodes and case-to-episode links.
- Episode-owned authorizations and authorization reviews.
- Inclusive authorization day decisions.
- Documentation gaps and controlled status history.
- Correction and supersession chains.
- Governed event envelopes.
- Transactional outbox records for governed events.
- Thin Prisma gateways and deterministic service tests for these boundaries.

S2 would not include HTTP routes, API framework decisions, projection workers, analytics marts, dashboards, frontend changes, Product Studio, external integrations, deployment configuration, or production feature flags.

ADR-0012 remains unresolved and is outside this packet's implementation scope.

## Decision Matrix

| # | Decision | Proposed S2 default | Owner / evidence required | Status |
|---:|---|---|---|---|
| 1 | Episode-to-case cardinality | One accepted case creates at most one active `ADMISSION_SOURCE` episode in S2. Transfers/readmissions require explicit relationships and remain additive. | Product owner + technical lead; domain review | Needs decision |
| 2 | Facility/program/unit ownership | Resolve IDs against canonical organization-owned records. Do not create duplicate facility hierarchy records in the new tables. Unit remains nullable where the source does not provide one. | Technical lead + operations; schema mapping | Needs decision |
| 3 | Facility timezone source/versioning | Store the explicit facility-configuration source reference and version used for service-date derivation. Never infer from browser, server, or organization name. | Technical lead + operations; timezone correction policy | Needs decision |
| 4 | Transactional tables versus governed event tables | Keep operational facts in transactional tables and append governed event rows separately. Store event lineage and outbox linkage without treating derived events as operational truth. | Technical lead + security; accepted data-boundary design | Needs decision |
| 5 | Correction and supersession persistence | Preserve original rows/events. Add explicit supersession links, controlled correction reason, version checks, and one active branch per correction family. | Technical lead + compliance; correction invariants and tests | Needs decision |
| 6 | Idempotency and optimistic concurrency | Mutating persistence commands require an idempotency key and expected aggregate/version value. Replays return the original result without duplicate facts/events. | Technical lead; align with existing command-service pattern | Needs decision |
| 7 | Audit and outbox transaction boundary | Persist the source mutation, audit event, governed event, and outbox record atomically where they share a transaction boundary. | Technical lead + security; failure and retry policy | Needs decision |
| 8 | Tenant enforcement and RLS timing | Enforce organization scope in every gateway predicate in S2. Decide whether database RLS is introduced in S2 or remains a separately gated hardening slice. | Security reviewer + technical lead; OD-6 update | Needs decision |
| 9 | Additive migration and rollback | Use additive tables/indexes/enums only. Define forward rollback or restore procedure before migration approval; do not rely on destructive down-migrations for production recovery. | Technical lead + security; migration and restore review | Needs decision |
| 10 | Repository service boundary | Preferred: add thin Prisma gateways and deterministic service tests, with no HTTP/runtime layer. Decide whether command services are included now or deferred until the persistence contract stabilizes. | Technical lead; package ownership and test plan | Needs decision |

## Required S2 Design Artifacts

Before implementation begins, prepare and accept:

1. Entity and relationship map for episode, authorization, review, day decision, documentation gap, governed event, and outbox records.
2. Organization/facility/program/unit ownership map tied to existing canonical schema records.
3. Versioning, idempotency, correction, and active-supersession invariants.
4. Transaction boundary and failure/retry sequence for source fact, audit, governed event, and outbox persistence.
5. Tenant enforcement decision, including the RLS timing decision.
6. Additive migration and rollback/restore plan.
7. Deterministic persistence test matrix, including cross-organization rejection and replay behavior.
8. Explicit S2 approval record in the canonical decision/ADR locations.

## Security And Governance Gates

- Synthetic data only.
- No payer member identifiers, PHI, secrets, or external endpoints.
- No autonomous clinical, legal, admission, discharge, placement, or authorization decisions.
- Server-owned fields such as organization, actor, roles, event classification, metric eligibility, and queue priority cannot be caller-authored.
- Corrections remain append-only and auditable.
- Draft metrics remain unapproved and are not operational measurements.
- ADR-0012 API/hosting decisions are not silently resolved by S2.

## Owner Acceptance Record

Recorded on 2026-07-18 from the owner's acceptance of the technical review recommendation.

- Episode-to-case: one accepted case creates at most one active `ADMISSION_SOURCE` episode in S2; transfers and readmissions remain additive relationships.
- Ownership: reuse existing organization-owned `Organization` and `FacilityProfile` records; do not create duplicate facility hierarchy records. Program and unit references remain nullable/source-owned until a canonical hierarchy decision exists.
- Timezone: use an explicit facility-configuration source reference with version/effective-date lineage; never infer timezone from browser, server, or organization name.
- Truth layers: keep operational facts in transactional tables, governed event rows append-only and separate, and outbox persistence linked to the source mutation.
- Corrections: preserve originals and create explicit correction/supersession relationships with reason and version checks.
- Reliability: require idempotency keys and expected aggregate/version values for mutating commands; replays return the original result.
- Atomicity: persist source mutation, audit event, governed event, and outbox record atomically where they share one transaction.
- Tenancy: enforce organization predicates in every S2 gateway and test cross-organization rejection. RLS remains a separately gated OD-6 hardening decision.
- Migration: additive schema only with documented forward recovery or restore procedure; no destructive down-migration as production recovery evidence.
- Repository boundary: implement thin Prisma gateways and deterministic tests only; defer command services and all HTTP/runtime work until the persistence contract stabilizes.

This authorizes the bounded S2 persistence implementation described above. It does not authorize production data, deployment, RLS rollout, external integrations, workers, analytics marts, dashboards, frontend changes, Product Studio changes, or feature flags.

## Acceptance Gate

S2 implementation is ready within the accepted bounded scope because:

- S1 acceptance is recorded by Tyler/product owner.
- All ten decisions above have an owner decision, rationale, and evidence path in this packet.
- Any affected ADR or canonical open decision is updated.
- Security review covers tenant enforcement, audit/outbox atomicity, correction history, and migration recovery.
- The final S2 scope explicitly excludes HTTP, workers, marts, UI, integrations, deployment, and Product Studio.

## Owner Decision

- Decision: `[x] Proceed with bounded S2 persistence implementation`  `[ ] Revise packet`  `[ ] Defer`
- Owner: Tyler / product owner
- Date: 2026-07-18
- Notes: Keep implementation synthetic-only and runtime-free. Production hosting, RLS, and operational readiness remain separate gates.
