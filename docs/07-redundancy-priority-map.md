# Redundancy And Priority Map

Date: 2026-07-08

## Purpose

This document explains what is duplicative, what is complementary, and what should be prioritized or parked.

The current platform materials are not "wrong" because they repeat. The risk is that repeated ideas appear at different levels of maturity. This map turns repetition into a clean build hierarchy.

## Redundancy Summary

### Repeated But Core

These ideas appear across many documents and should be treated as canonical:

- One continuous case record.
- One capture producing multiple reviewed outputs.
- Guided intake with field and clinical modes.
- Source-linked facts.
- Medical necessity draft.
- Louisiana legal status and instrument workflow.
- Hash-chain custody ledger.
- Referral packet generation.
- Closed-loop facility response.
- Clinical and financial lanes running in parallel.
- Clinician review and counsel validation guardrails.

Interpretation:

- Repetition here is useful confirmation.
- These are not redundant noise.
- These form the v0.1 spine.

### Repeated But Over-Scoped

These ideas are valid but appear too early in some handoff docs:

- Command center.
- Full central intake dashboard.
- Milieu bedboard.
- Analytics dashboards.
- Reporting metrics rebuild package.
- AI/MCP layer.
- Payer criteria packs.
- Form-pack manager.
- Public treatment finder.
- Integrations.

Interpretation:

- These are complementary modules, not v0.1 dependencies.
- They should inform data model extensibility but not block the first build.

### Duplicative Documents

| Area | Duplicate locations | Decision |
| --- | --- | --- |
| Product thesis | `README.md`, `docs/01-project-architecture.md`, `clarity-mh-architecture/docs/product/00-product-thesis.md` | Keep canonical thesis in `docs/01-project-architecture.md`; use generated thesis as supporting language. |
| Roadmap | `docs/04-build-roadmap.md`, `clarity-mh-architecture/docs/product/03-mvp-scope.md`, `clarity-mh-architecture/implementation/epics-and-issues.md` | Use `docs/04-build-roadmap.md` as priority authority; generated epics are backlog candidates. |
| Data model | `docs/03-data-model.md`, `clarity-mh-architecture/schema/prisma.schema.prisma`, `clarity-mh-architecture/types/clarity-mh.types.ts` | Use `docs/03-data-model.md` as concept model; generate final schema after stack decision. |
| Source index | `docs/05-source-document-index.md`, `clarity-mh-architecture/docs/source-index.md` | Use `docs/05-source-document-index.md` as canonical source index. |
| Workflow docs | `docs/01-project-architecture.md`, `clarity-mh-architecture/docs/workflows/*` | Use generated workflow docs as detail references beneath canonical architecture. |
| Guardrails | `docs/01-project-architecture.md`, `clarity-mh-architecture/docs/compliance/*`, acceptance tests | Preserve all; turn into tests during implementation. |
| Prototype | `Clarity MH /clarity-epec.jsx`, `clarity-mh-architecture/prototype/clarity-epec.prototype.jsx`, `clarity-mh-architecture/sources/clarity-epec.jsx` | Treat as reference only until production model exists. |
| Reporting metrics | `Clarity MH /Reporting Metrics Ops and Budget .xlsx`, `reporting-metrics-rebuild-package/*`, roadmap metrics sections | Treat rebuild package as company-agnostic operating-intelligence context; do not make it Clarity-specific. |

## Complementary Material By Theme

### Organization And Operating Model

Strongest sources:

- Centralized intake SOP.
- Assessment procedure manual.
- Architecture command-center docs.

How it informs Clarity:

- Defines roles, stages, handoff points, SLAs, escalation logic, and KPI categories.
- Helps Clarity as an organization understand who the product must serve: intake director, lead clinician, coordinator, business office, psychiatrist, UR, receiving facility, coroner, transport, compliance.

Priority:

- Use role and stage model now.
- Build full command center later.

### Market And Buyer Context

Strongest sources:

- `clarity-holistic-synthesis.md`
- `clarity-competitive-landscape-epec.md`

How it informs Clarity:

- Avoid stale bed registry as first product.
- Position request-broadcast and legal custody as a sharper wedge.
- Understand competitors as systems to integrate with or outflank, not simply copy.

Priority:

- Request-broadcast concept is priority.
- Full competitor-response feature set is market-informed later.

### Clinical Workflow

Strongest sources:

- `CIA Comp initial Assesment guidance .md`
- `intake-assessment-policy-procedure-manual.txt`
- Clinical safety guardrails.

How it informs Clarity:

- Assessment sections.
- Age branching.
- Collateral needs.
- Risk and functional documentation.
- Missing facts and pitfall guards.
- Medical necessity draft structure.

Priority:

- Assessment shape and pitfall guards are priority.
- Final clinical policy, scoring, and LOC determinations require clinical review.

### Legal And Custody Workflow

Strongest sources:

- `clarity-competitive-landscape-epec.md`
- ePEC prototype.
- Chain-of-custody workflow docs.

How it informs Clarity:

- Legal status review.
- Legal instrument draft.
- Attestation and signature workflow.
- Hash sealing.
- Custody ledger.
- Acceptance receipt.

Priority:

- Draft and custody workflow are priority.
- Production legal enforcement, statutory clocks, e-sign validity, and form language are counsel-gated parking lot until validated.

### Transfer And Routing

Strongest sources:

- Request-broadcast workflow.
- Holistic synthesis.
- SOP packet/handoff steps.

How it informs Clarity:

- Packet readiness.
- Facility capability profile.
- Live case broadcast.
- Accept/decline/request-info response.
- Decline reason analytics.

Priority:

- Simulated referral response is priority.
- Network-scale routing analytics are v0.2+.

### Bedboard And Inpatient Operations

Strongest sources:

- Research/product scope synthesis.
- Architecture docs.

How it informs Clarity:

- Bed availability alone is not enough.
- Milieu, roommate compatibility, adjacency, staffing, and observation load matter.

Priority:

- Keep as a differentiating future module.
- Do not build before the intake-to-packet-to-response spine.

### Reporting Metrics And Utilization Review Excellence

Strongest sources:

- `reporting-metrics-rebuild-package/REPORTING_METRICS_REVERSE_ENGINEERING.md`
- `reporting-metrics-rebuild-package/SUSTAINABLE_MODEL_ARCHITECTURE.md`
- `reporting-metrics-rebuild-package/METRIC_DEFINITIONS.md`
- `reporting-metrics-rebuild-package/DASHBOARD_MODULES.md`
- `reporting-metrics-rebuild-package/MIGRATION_PLAN.md`

How it informs Clarity:

- Clarity events can feed reusable utilization review and operating-intelligence metrics.
- Metrics should not be trapped in monthly workbook tabs.
- UR excellence is a stronger first lens than generic dashboards.
- PHI-bearing details should remain separated from aggregate executive reporting.

Priority:

- Add to v0.3 as a company-agnostic module.
- Prioritize UR work queue, auth risk, denied days, days at risk, documentation gaps, and payer/program denial summaries.
- Keep predictive denial scoring and proprietary criteria automation in the parking lot.

## Well-Developed Features To Prioritize

1. Canonical case spine.
2. Guided intake.
3. Field/clinical mode split.
4. Source references.
5. Age branching.
6. Pitfall guards.
7. Medical necessity draft.
8. Legal status and legal instrument draft.
9. Custody ledger.
10. Referral packet preview.
11. Facility referral and response simulation.
12. Parallel clinical and financial lanes.
13. Guardrail tests for AI, legal clocks, clinical review, and prohibited criteria language.

## Useful But Not First

1. Command center.
2. SLA dashboard.
3. Packet completeness dashboard.
4. Facility capability profiles.
5. Decline reason analytics.
6. Staff training mode.
7. Assessment competency checklist.
8. Form-pack manager.
9. Redaction workflow.
10. Consent and sharing grants.
11. Pilot metrics export.
12. Reporting metrics rebuilder for utilization review excellence.

## Parking Lot

1. Production legal form enforcement.
2. Louisiana statutory-clock enforcement.
3. E-signature vendor integration.
4. Live hospital network transmission.
5. Real EHR/CAD/RMS/HIE integrations.
6. Full payer criteria engine.
7. InterQual/MCG integration.
8. ASAM/LOCUS/CALOCUS scoring.
9. Autonomous diagnosis.
10. Autonomous level-of-care determination.
11. Autonomous legal certification.
12. Statewide bed registry.
13. Public treatment finder.
14. Multi-state legal packs.
15. Production Part 2 consent engine.
16. Predictive denial scoring.
17. Proprietary criteria automation.
18. Multi-company benchmark marketplace.

## Clean Build Doctrine

Build Clarity as an organization around the spine, not around features.

The organization-level understanding should be:

- Clarity is not a bed board.
- Clarity is not a generic intake form.
- Clarity is not an AI clinician.
- Clarity is not a payer criteria engine.
- Clarity is a source-linked crisis intake and custody workbench that produces reviewed outputs and closed-loop routing evidence.
- Reporting Metrics Rebuilder is a separate, company-agnostic operating-intelligence module that can consume Clarity events without becoming Clarity-specific.
