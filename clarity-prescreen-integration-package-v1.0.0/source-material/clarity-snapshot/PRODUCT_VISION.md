---
status: Integrated draft — pending product-owner review
owner: TBD
version: 1.0.0
last_integrated: 2026-07-10
source_artifacts:
  - reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/MASTER_ARCHITECTURE.md (§1–5, §26)
  - reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/README copy.md
  - README.md (Jul 8 packet), docs/01-project-architecture.md §1–2
  - reference/source-packages/clarity-mh-architecture/docs/product/00-product-thesis.md
unresolved_conflicts: "C-1 residual (docs/repository-audit/03_CONFLICT_REGISTER.md); missing 01-product-vision/PRODUCT_REQUIREMENTS.md from package"
related_requirements: REQ-001…REQ-014 (REQUIREMENTS_TRACEABILITY)
related_adrs: ADR-0001
---

# Clarity — Product Vision

Clarity is a behavioral-health **case-intelligence and access-orchestration platform** for the operational space between referral receipt and care transition: document intake, evidence review, clinical and legal support, benefits verification, authorization, placement, transport, custody, communication, and audit.

It does not replace professional judgment. It creates a structured environment in which qualified people can see the **source, uncertainty, rule, owner, deadline, and history** behind each material action.

## Two generations, one product

- **Umbrella vision (Clarity AI, Jul 10 master architecture):** turn fragmented behavioral-health referrals into structured, source-linked, clinically reviewable, legally traceable, and financially informed care pathways.
- **Launch wedge (Clarity Crisis Platform, Jul 8):** Louisiana-first crisis intake — guided intake coaching (field and clinical modes), statutory instrument execution (PEC/OPC/CEC), one-capture/many-output packet generation, hash-chained custody ledger, secure referral/transfer/acceptance, compliance clocks, milieu-aware bedboard.

The wedge is the deepest-specified and only implemented slice (see `app/`); the umbrella adds the payer stack (insurance extraction → eligibility → benefits verification → authorization → patient financial education → payer memory) as **parallel workstreams on the same case spine** — expansion, not restart (database-artifact `INTEGRATION_PLAN.md`).

## Core questions every case must answer

What is documented? What is the source? What is missing, stale, or contradictory? What can proceed now, what is blocked, and by which rule? Who owns the next action, and which qualified person must approve it? What happened after the decision? What can the organization learn?

## Non-negotiable product boundaries

- No autonomous clinical, legal, admission, discharge, placement, or authorization decisions.
- Financial readiness never blocks emergency clinical review; no opaque payer-weighted priority score.
- A benefits quote is never presented as a payment guarantee.
- Historical payer memory is labeled historical and unconfirmed for the current patient.
- No real PHI in any prototype; synthetic data only until formal security/privacy review.

## Commercial hypotheses (unvalidated)

Positioning: "behavioral-health case intelligence and access orchestration." Potential Core/Professional/Enterprise packaging. Value measured through time, touches, rework, verification/authorization cycle time, packet quality, access, denials, and audit. **Pricing and ROI remain hypotheses**; the package's `14-commercial-model/` detail was not locally available.
