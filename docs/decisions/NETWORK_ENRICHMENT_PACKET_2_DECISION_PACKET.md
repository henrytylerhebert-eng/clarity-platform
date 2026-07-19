---
status: Review packet opened; service implementation paused until all decisions are approved
owner: Tyler / product owner with technical lead, security, and product review
date: 2026-07-19
data_boundary: synthetic only
related_records:
  - docs/developer-handoff/S1_REVIEW_AND_ACCEPTANCE_RECORD.md
  - docs/developer-handoff/S2_REVIEW_AND_ACCEPTANCE_RECORD.md
  - docs/developer-handoff/UNCOMMITTED_WORK_REVIEW_PACKETS_2026-07-19.md
  - PR #29 (claude/clarity-network-enrichment-f10807)
  - packages/domain-contracts/src/networkEnrichment.ts
  - packages/domain-contracts/src/index.ts
  - tests/unit/network-enrichment-contracts.test.ts
---

# Network Enrichment Packet 2: Review Gate Before Service Implementation

## Purpose

The contracts slice in PR #29 is implemented and verified. Packet 2 is a focused
decision packet for the next implementation lane (`packages/network-enrichment-service`
or equivalent service/runtime work). This packet blocks any persistence,
runtime route, worker, or production egress work until each decision is approved.

## Scope

This packet only reviews the following four gating decisions:

1. Reviewer role mapping and authority model.
2. Canonical ownership for enriched entities.
3. ADR-0014 threshold, freshness, and policy acceptance posture.
4. External enrichment worker authorization and execution boundary.

This packet does not authorize:

- production database migration or schema ownership changes,
- outbox delivery and external webhooks,
- HTTP/API route additions,
- real data ingestion, or
- any live placement/autonomous clinical or legal decisions.

## Packet 2 Decision Matrix

### Decision outcome (approved for Packet 2 execution)

1. Reviewer-role mapping: **Option A approved** (existing `UserRole` mapping with explicit aliases).
2. Canonical ownership: **Option A approved** (reuse canonical `Organization` / `FacilityProfile`; store enrichment metadata as separate enrichment provenance where needed).
3. ADR-0014 policy defaults: **Option A approved** (accept proposed defaults as operational baseline with scheduled review).
4. External enrichment worker: **Option A approved** (no worker in Packet 2; review-only, synthetic-only scope only).

| # | Decision | Options | Current posture | Required owner action |
|---:|---|---|---|---|
| 1 | Reviewer-role mapping (`networkEnrichment` source role → platform `UserRole`) | A) Map to existing `UserRole` with explicit alias table (e.g., compliance, clinical reviewer, operations) and reject unknown values. B) Introduce new user-role enum values specific to enrichment workflows. C) Keep mapping in review-only shim until service is designed. | Open. The report noted partial overlap only with `COMPLIANCE_REVIEWER` in reviewed roles. | Approve one stable mapping set before adding review-submit/approve/reject commands. |
| 2 | Canonical ownership model for enriched entities | A) Reuse existing canonical entities (`Organization`, `FacilityProfile`) and store enrichment metadata separately. B) Create dedicated network-enrichment tables and migrate canonical references later. C) Keep entirely out-of-band (contracts+fixtures only). | Open. PR summary noted no schema change yet; persistence remains unimplemented by design. | Approve whether to extend canonical ownership now, defer, or keep split ownership with a follow-up ADR. |
| 3 | ADR-0014 acceptance defaults | A) Approve proposed defaults as current policy constants. B) Approve with regional/source overrides and stricter change-control. C) Reject defaults until external review and recalibration complete. | Open. Contract artifacts are ready; policy knobs are not yet production-approved. | Approve the default policy baseline, or require overrides/guardrails before service code is enabled. |
| 4 | External enrichment worker / egress | A) No worker (contracts and admin review only). B) Add worker after explicit security + operations approval for source fetch, credential storage, and audit scope. C) Decline worker and keep enrichment manual/queue-only. | Open. Egress and worker are intentionally not implemented in PR #29. | Approve a mode: `OFF`, `GATED`, or `ALWAYS`, with owner, audit, and secret-management rules in writing. |

## Required Packets Before Packet 2 Approval

- Confirm service-level role authorization matrix with least privilege.
- Clarify whether canonical facilities should be treated as authoritative destination records.
- Lock thresholds (`freshness`, conflict handling, reviewer confidence thresholds, review routing).
- Define worker execution scope (if any), logging, retry policy, and secret custody.

## Owner Approval Record

- Decision: `[x] Approve Packet 2 for implementation`  `[ ] Revise`  `[ ] Defer`
- Blocker Checklist:
  - [x] Reviewer-role mapping approved: **Option A**
  - [x] Canonical ownership path approved: **Option A**
  - [x] ADR-0014 policy posture approved: **Option A**
  - [x] Worker boundary approved: **Option A**
- Decision status by item:
  - 1) Reviewer-role mapping: **Approved**
  - 2) Canonical ownership: **Approved**
  - 3) ADR-0014 policy defaults: **Approved**
  - 4) Worker/egress boundary: **Approved**
- Owner: Tyler / product owner
- Date: 2026-07-19
- Gate note: All four checkboxes must be checked before any `packages/network-enrichment-service` work starts.

## Safe Next-Step Sequence (for Packet 2 execution)

Execution scope document: `docs/decisions/NETWORK_ENRICHMENT_PACKET_2_EXECUTION_SCOPE.md`

1. Resolve all four decisions and update this packet with explicit owner signatures.
2. Open a separate bounded Packet 2 execution plan naming only files for service/domain gates.
3. Re-run `npm run lint`, `npm run typecheck`, `npm run test` on touched packages.
4. Stage and commit only Packet 2 after implementation remains synthetic-only unless explicitly approved for external scope.
