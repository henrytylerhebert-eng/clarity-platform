# Reporting Metrics Rebuilder

Date: 2026-07-08

## Purpose

`reporting-metrics-rebuilder` is a company-agnostic operating-intelligence module.

It should not be built as a Clarity-only hospital spreadsheet clone. It should be a reusable model for rebuilding fragile operational workbooks into:

- source-protected reference artifacts,
- normalized operating data,
- a metric calculation layer,
- utilization review excellence dashboards,
- executive exports,
- PHI-safe analytics marts.

Clarity can use it, but Clarity should not own its assumptions. The module should work for any behavioral-health or healthcare operating organization that needs durable utilization review, census, payer, staffing, revenue, and referral intelligence.

## Source Package

Local package:

- `reporting-metrics-rebuild-package/`

Key files:

- `REPORTING_METRICS_REVERSE_ENGINEERING.md`
- `SUSTAINABLE_MODEL_ARCHITECTURE.md`
- `METRIC_DEFINITIONS.md`
- `DASHBOARD_MODULES.md`
- `MIGRATION_PLAN.md`
- `SCHEMA_BLUEPRINT.sql`
- `CODEX_REBUILD_PROMPT.md`
- `analysis_summary.json`
- `formula_inventory.csv`
- `sheet_dependency_edges.csv`
- `sheet_summary.csv`
- `reporting-metrics-rebuild-audit.xlsx`

The workbook and audit outputs are source/context material. Treat them as read-only.

## Product Position

The module answers:

> How does patient demand turn into census, staffing burden, authorization risk, patient days, revenue, margin pressure, and budget variance?

For Clarity, this sits beside the core crisis-intake spine as an analytics and operating-excellence layer.

For a company-agnostic product, this becomes:

> A repeatable way to convert manual healthcare operating workbooks into trustworthy utilization review and operating intelligence.

## Utilization Review Excellence Lens

The first domain lens should be utilization review excellence, not generic reporting.

Core UR questions:

- Which episodes have authorization risk?
- Which days are approved, denied, pending, expired, or at risk?
- Which denials are preventable process failures?
- Which documentation gaps are causing payer friction?
- Which payers, physicians, programs, or referral sources create the most review burden?
- Which concurrent reviews are due soon?
- Which denied days create revenue leakage?
- Which intake or packet gaps predict downstream denial risk?

Core UR outcomes:

- Fewer preventable denied days.
- Faster concurrent review preparation.
- Cleaner payer-ready documentation.
- Earlier identification of authorization gaps.
- Better handoff between intake, clinical documentation, UR, and finance.
- Better executive visibility into preventable revenue leakage.

## Company-Agnostic Design Rules

1. Do not hard-code company names, facility names, payers, rates, workbook sheet names, or year-specific logic into the product model.
2. Treat the source workbook as a legacy reference artifact, not a system of record.
3. Separate PHI-bearing clinical/episode data from aggregate analytics.
4. Use configurable dimensions: organization, facility, program, unit, payer, contract, revenue class, denial category, staff role, and referral source.
5. Use event/fact tables instead of monthly tabs.
6. Build metric definitions once and reuse them in dashboards, exports, and reports.
7. Version payer contracts, authorization rules, staffing ratios, and budget assumptions.
8. Mark any benchmark or improvement claim as `Unknown` unless measured in the current implementation.

## Relationship To Clarity

Clarity is the workflow/custody product.

Reporting Metrics Rebuilder is the operating-intelligence product.

They should share a common event spine but remain separable.

### Complementary To Clarity v0.1

Clarity v0.1 creates source-linked crisis/intake facts, legal drafts, packet previews, and facility responses.

Reporting Metrics Rebuilder should consume event data later. It should not block the v0.1 intake spine.

### Strong Fit With Clarity v0.2/v0.3

The module becomes useful when Clarity has:

- cases,
- assessments,
- packet completeness,
- facility referrals,
- facility responses,
- authorization status,
- admission/discharge events,
- census snapshots,
- denied/approved day events.

## Core Data Spine

For a company-agnostic rebuild, the minimum reusable data model is:

- Organization
- Facility
- Program
- Unit
- PatientIdentityBoundary or PersonToken
- Episode
- AdmissionEvent
- DischargeEvent
- EpisodeDay
- CensusSnapshot
- ReferralSource
- Payer
- PayerContractRate
- Authorization
- AuthorizationReview
- Denial
- DocumentationGap
- StaffingActual
- StaffingBudgetRule
- IOPAttendance
- BudgetLine
- AncillaryCost
- MetricSnapshot
- ExportRun

## Priority Metrics

### UR excellence metrics

- Approved days.
- Denied days.
- Denial rate.
- Days at risk.
- Authorization expiration risk.
- Process-related denials.
- Documentation-gap count.
- Concurrent reviews due.
- Payer-specific denial burden.
- Physician/program denial summaries.

### Operating metrics

- Admissions.
- Discharges.
- Patient days.
- ADC.
- Occupancy.
- ALOS.
- Payer mix.
- Referral conversion.
- Lost referral reasons.

### Financial metrics

- Revenue days.
- Projected revenue.
- Net projected revenue.
- Denied-day adjustment.
- Revenue per patient day.
- Budget variance.

### Staffing metrics

- Budget hours.
- Actual hours.
- Over/under budget.
- Agency hours and cost.
- One-to-one observation burden.
- Labor per patient day.

## Dashboard Priority

### Priority build

1. UR work queue.
2. Authorization risk dashboard.
3. Denied/approved days dashboard.
4. Documentation gap dashboard.
5. Payer and program denial summaries.

### Market-informed next

1. Executive overview.
2. Intake/referral command center.
3. Revenue forecast.
4. Staffing dashboard.
5. IOP dashboard.

### Parking lot

1. Predictive denial scoring.
2. Automated payer portal integration.
3. Proprietary criteria integrations.
4. Real-time payroll integration.
5. Board-ready automated narrative generation.
6. Multi-company benchmark marketplace.

## Claim Status

| Claim | Status | Use |
| --- | --- | --- |
| Workbook contains a manually operated hospital intelligence system. | `source-confirmed` | Rebuild thesis. |
| Workbook has 44 sheets, 3,933 formula cells, and 278 formula/cached error cells. | `source-confirmed` | Fragility evidence. |
| Workbook mixes patient-level rows with aggregate finance/operations. | `source-confirmed` | PHI boundary requirement. |
| Workbook tracks UR risk through approved/denied days, payer categories, physician summaries, and flags. | `source-confirmed` | UR excellence module. |
| Monthly tabs should be replaced by vertical fact tables. | `source-confirmed` | Data-model rule. |
| Rebuilt system should use a PHI clinical store plus de-identified analytics mart. | `source-confirmed` | Architecture rule. |
| Denial reductions, margin improvements, or transfer-time improvements have been measured in this environment. | `unknown` | No measurements found. |
| Payer-specific criteria logic can be automated safely. | `requires clinical review` | Parking lot until validated. |
| Proprietary criteria systems can be copied or embedded. | `requires legal review` | Do not implement without licensing/approval. |

## Roadmap Placement

Add to the platform roadmap as:

- `v0.2/v0.3 company-agnostic operating-intelligence module`
- priority lens: utilization review excellence
- source package: read-only
- first build surface: UR work queue and authorization risk metrics

Do not let this module displace the Clarity v0.1 intake spine.

