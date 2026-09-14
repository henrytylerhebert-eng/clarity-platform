---
status: Integrated draft — pending product-owner review
owner: Tyler
version: 1.1.0
last_integrated: 2026-09-12
source_artifacts:
  - reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/MASTER_ARCHITECTURE.md (§1–5, §26)
  - reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/README copy.md
  - README.md (Jul 8 packet), docs/01-project-architecture.md §1–2
  - reference/source-packages/clarity-mh-architecture/docs/product/00-product-thesis.md
  - docs/product/INPATIENT_REV_OPS_PRODUCT_DEFINITION.md
  - docs/product/WORKBOOK_TO_PLATFORM_WORKFLOW_MAP.md
unresolved_conflicts: "C-1 residual (docs/repository-audit/03_CONFLICT_REGISTER.md); missing 01-product-vision/PRODUCT_REQUIREMENTS.md from package"
related_requirements: REQ-001…REQ-014 (REQUIREMENTS_TRACEABILITY)
related_adrs: ADR-0001
---

# Clarity — Product Portfolio Vision

Clarity is a behavioral-health product portfolio with two connected products:
**Clarity Access** for referral-to-care-transition work and **Clarity Operations &
Revenue Intelligence** for the hospital operating workflow that follows.

It does not replace professional judgment. It creates a structured environment in which qualified people can see the **source, uncertainty, rule, owner, deadline, and history** behind each material action.

## Product 1: Clarity Access

**Purpose.** Turn fragmented behavioral-health referrals into structured,
source-linked, clinically reviewable, legally traceable, and financially informed
care pathways.

**For.** Crisis and central-intake teams, field responders, clinician reviewers,
benefits/UR teams, receiving facilities, compliance/legal reviewers, and inpatient
leaders.

**Problem.** The referral story is repeated across calls, documents, spreadsheets,
and handoffs. Parallel clinical, legal, financial, routing, and placement work loses
its shared source, owner, uncertainty, and history.

**How it works.** One case spine connects structured intake, source-linked evidence,
missing-fact review, parallel workstreams, human-reviewed drafts, packet generation,
simulated routing, and a custody/audit ledger. The local prototype is a synthetic
proof of this flow; live system integration and real-world use are not implemented.

## Product 2: Clarity Operations & Revenue Intelligence

**Purpose.** Give hospital organizations a configurable operating workspace that
connects daily activity, approved budgets, future forecasts, and separately sourced
collections without collapsing them into one number.

**For.** Hospital administrators, census owners, finance/revenue-cycle teams,
staffing coordinators, UR, case management, and regional leadership.

**Problem.** The operating model is often carried by interdependent workbooks.
Duplicate entry, manual reconciliation, unclear definitions, mutable corrections,
and mixed financial layers make it hard to explain what happened and what action is
next.

**How it works.** An organization configures facilities, access, calendars, and local
fields; approved budgets and observed activity enter through controlled manual or
import workflows; users reconcile conflicts and corrections; reports and closing
receipts retain their source, period, metric, version, and history. Forecasts and
collections are distinct future modules, not values inferred from activity or budget.
The current synthetic implementation is a bounded patient-day, reconciliation, close,
staffing, and export slice; full workbook parity and financial operations remain staged.

The detailed [Operations & Revenue Intelligence definition](INPATIENT_REV_OPS_PRODUCT_DEFINITION.md)
and [workbook workflow map](WORKBOOK_TO_PLATFORM_WORKFLOW_MAP.md) govern the product
envelope and parity claims.

## Shared trust layer

The products share organization/facility boundaries, role-aware access, source
provenance, explicit uncertainty, versioning, correction history, human approval, and
audit receipts. Training & SOPs, Command Center, evidence views, and governance are
cross-product capabilities, not separate customer products.

## Core questions every workflow must answer

What is documented? What is the source? What is missing, stale, or contradictory?
What can proceed now, what is blocked, and by which rule? Who owns the next action,
and which qualified person must approve it? What happened after the decision? What can
the organization learn?

## Non-negotiable product boundaries

- No autonomous clinical, legal, admission, discharge, placement, or authorization decisions.
- Financial readiness never blocks emergency clinical review; no opaque payer-weighted priority score.
- A benefits quote is never presented as a payment guarantee.
- Historical payer memory is labeled historical and unconfirmed for the current patient.
- No real PHI in any prototype; synthetic data only until formal security/privacy review.
- Approved budget, actual activity, forecast, and posted collections are distinct data
  layers; a calculation or a workbook cell cannot silently turn one into another.

## Commercial hypotheses (unvalidated)

Positioning and packaging remain owner decisions. Any claim about time saved, rework,
verification/authorization cycle time, packet quality, access, denials, audit,
financial performance, or ROI requires measurement. **Pricing and ROI remain
hypotheses**; the package's `14-commercial-model/` detail was not locally available.
