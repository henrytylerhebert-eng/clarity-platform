# Clarity Inpatient Operations and Revenue Intelligence

Product definition v0.1 — owner review draft

Product owner and operating subject-matter expert: Tyler.
Visual companion: [systems map](INPATIENT_REV_OPS_SYSTEMS_MAP.md).
Execution proposal: [implementation plan](../roadmap/INPATIENT_REV_OPS_IMPLEMENTATION_PLAN.md).
Artifact scope: product definition. Runtime, release and deployment status remain
governed by [IMPLEMENTATION_STATUS.md](../../IMPLEMENTATION_STATUS.md).

## 1. Product purpose and foundation

Provide hospital organizations with a configurable inpatient operations and
revenue workspace that connects daily activity, approved budgets, revenue
forecasts and separately sourced collections across their facilities.

Tyler reports using the underlying workbook-based operating system for ten
years. That experience is the functional baseline for modernization. This
product is intended to preserve established working practices while reducing
duplicate entry, spreadsheet maintenance and reporting friction.

The ten-year history is owner-reported operational evidence. Quantified time
savings, error reduction and financial improvements for the software replacement
have not been measured. No measurements found. These distinctions do not require
re-proving the hospital need before product definition or development planning.

The operating workbook supplies daily workflow and metrics. The sample revenue
budget supplies monthly planning dimensions and financial rollups. Its damaged
references and inconsistent labels are migration issues to resolve with Tyler;
they do not invalidate the established operating model.

## 2. Evidence and authority

| Basis | Treatment in this definition |
|---|---|
| Tyler's explicit direction | Combine the two workbooks; keep budget, actual activity, forecast and collections separate; support multitenant onboarding and custom fields. |
| Tyler's operating experience | Primary functional context for intended workflow and interpretation of legacy calculations. Local hospital role mapping can vary. |
| Sample budget inspection | Source-confirmed monthly location/type/unit/metric/payer structure and summary intent, with formula limitations recorded in the source map. |
| Existing operational workbook analysis | Summary-derived workflow evidence; trace specific calculations to the original before implementation parity checks. |
| Software requirements below | Proposed translation of the agreed direction. Detailed permissions, acceptance criteria and slice scope remain reviewable design choices. |

The [candidate source and requirements map](../../reporting-metrics-rebuild-package/INPATIENT_REV_OPS_CANDIDATE_REQUIREMENTS.md)
contains workbook locators and migration findings. Source workbooks remain
unchanged; sample financial inputs are not universal hospital defaults.

This definition complements [Clarity's product vision](PRODUCT_VISION.md) and
[product requirements](PRODUCT_REQUIREMENTS.md). It does not replace the case
spine, clinical record or existing governance. Status promotion follows the
[Product Evidence and Decision Protocol](../governance/PRODUCT_EVIDENCE_AND_DECISION_PROTOCOL.md).

## 3. Users and jobs

| User/responsibility | Job the product supports |
|---|---|
| Organization administrator | Set up facilities, users, access, local terminology and configuration. |
| Hospital administrator | Review census, capacity, operating exceptions, budget variance and forecast drivers. |
| Admissions/registration | Record or confirm episode openings, admission/discharge timestamps and facility/program assignments. |
| Benefits and utilization review | Maintain coverage verification, authorization status, review deadlines, noncovered-day exposure and denial follow-up. |
| Nursing operations/census owner | Confirm bed/unit movements, reconcile census and record capacity exceptions. |
| Staffing coordinator | Record or reconcile hours, agency use, overtime and observation staffing. |
| Case management | Maintain expected discharge and operational barriers without replacing actual discharge facts. |
| Finance/revenue cycle | Maintain budget versions, rate assumptions, adjustments, reconciliation and source-backed payment records. |
| Regional leadership | Compare and aggregate authorized facilities using aligned definitions and periods. |

These are responsibility groups, not mandatory job titles or fixed staffing
requirements. Onboarding assigns a primary owner, backup and update deadline to
each active workflow. A person may hold multiple authorized responsibilities.

## 4. Product modules and boundaries

| Module | User-facing result | Boundary |
|---|---|---|
| Organization setup | Guided facility/unit setup, users, role assignments and fiscal calendars | Configuration stays within the authorized organization. |
| Imports and mappings | Reusable workbook/CSV mappings, previews, row-level validation and reconciliation | Imported records retain provenance; errors and unmatched items remain visible. |
| Budget planning | Monthly targets by facility, unit/program, payer category and metric; approved versions | Actuals never overwrite approved baselines. |
| Daily inpatient operations | Admissions, discharges, transfers, census and capacity with correction history | Reuse existing case/episode identities; no parallel clinical chart. |
| Authorization work queue | Review deadlines, approved units/dates, unresolved exposure and follow-up owners | Supports qualified UR decisions; does not submit payer requests or promise payment. |
| Revenue forecast | Traceable expected revenue and adjustments by period and as-of date | Estimates remain visibly distinct from billing, recognized revenue and cash. |
| Staffing and operating cost | Actual versus planned hours/costs and labor per patient day | Source-backed accounting and staffing definitions; no autonomous staffing decisions. |
| Leadership reporting | Facility/unit trends, budget comparisons, drill-down and authorized rollups | Reports disclose freshness, missing coverage, period and measure definitions. |
| Collections reconciliation | Posted receipts, allocations, refunds and reversals when a source is available | No payment source means unavailable, not zero collections. |

These describe the product envelope, not a promise to implement every module in
the first slice. Inpatient is the initial focus. IOP/PHP structures in the budget
remain source context for possible later expansion.

## 5. Four distinct data layers

| Layer | Grain and purpose | Revision behavior |
|---|---|---|
| Budget | Monthly approved targets keyed by organization, facility, unit/program, payer category, metric and version | Draft, reviewed and approved baselines; amendments create new versions. |
| Actual activity | Observed events, daily census/episode-day facts, authorization updates and shift activity | Corrections retain original provenance, responsible user and reason. |
| Forecast | Period estimates with an as-of date, actual cutoff, scenario and assumption/rule version | Preserve snapshots; show observed-to-date and estimated remaining components separately. |
| Collections | Posted transactions and allocations with posting dates, source identifiers and reversals | Preserve payment history; corrections and refunds do not rewrite operating history. |

Actual patient activity multiplied by an assumed rate is estimated revenue, not
verified accounting revenue. Claims and recognized revenue need their own source
definitions if supported later. Cash received this month may relate to earlier
stays; posting-period cash cannot be silently compared with service-period
revenue as if they were the same measure.

Every comparison identifies metric, units, scope, period, cutoff and versions.
Show unavailable or incomplete data explicitly. The sample's noncovered-day,
denial and bad-debt categories remain distinct, with rules that prevent counting
the same reduction twice.

## 6. Hospital setup and onboarding

The intended experience is administrator-led setup without code changes.

1. Create the organization and facilities; set timezone, fiscal calendar,
   facility codes and authorized administrators.
2. Configure units/programs and distinguish licensed, staffed and usable beds.
3. Assign responsibilities and facility access; define primary/backup owners.
4. Choose the inpatient template and map local payer/program terminology.
5. Finance uploads a budget or enters monthly targets; the product proposes
   mappings for confirmation and identifies ambiguous periods or labels.
6. Preview valid, rejected and unmatched rows. Resolve duplicate keys, error
   values, units, missing dimensions and detail-versus-subtotal conflicts.
7. Reconcile a sample period and approve a budget version. Preserve mapping,
   source and approval history.
8. Configure actual-data collection and correction workflows. Enable only
   workflows with identified owners and usable data sources.

Setup can be saved and resumed. Configuration can be copied to another facility
with review; copied settings do not transfer actual records, permissions or
budget approvals. Operational activation is distinct from approval for real
patient data or production deployment.

## 7. Data ownership during a stay

| Stage | Entry/review owner | Information and downstream use |
|---|---|---|
| Referral/pre-admission | Intake; benefits | Referral and coverage status. Pending arrival informs forecasting, not completed admissions. |
| Admission | Registration | Actual episode/admission facts start operational tracking. |
| Arrival and transfers | Nursing operations | Unit/bed movements and capacity exceptions support census. |
| Initial/concurrent review | UR | Authorization updates, deadlines, denied units and follow-up status support exposure review. |
| Shift close/day close | Staffing coordinator; census owner | Reconcile staffing hours, census and missing/contradictory activity. |
| Discharge planning | Case management | Expected discharge and barriers inform estimates. |
| Discharge | Registration with unit confirmation | Actual discharge closes the operational stay under configured policy. |
| Post-discharge/month close | Revenue cycle; finance | Reconcile supported adjustments and payments without changing the budget baseline. |

Staff enter or confirm source facts. The product calculates derived metrics.
Approved imports/integrations reduce duplicate entry; users resolve exceptions.
Expected and actual dates remain different fields. Financial readiness must not
block emergency clinical review or determine clinical care or discharge.

## 8. Shared architecture and customization

Architect horizontally: define shared identity, organization/facility scoping,
permissions, record provenance, calendar/metric semantics, versioning, import
controls, audit and custom-field definitions across the product. Implement
these capabilities only as required by a complete vertical workflow.

Proposed tenancy is one hospital organization with multiple facilities and
units/programs. Users see only authorized facilities and fields. Enforcement
must apply on the server to reads, writes, imports, exports, jobs and aggregates.
A filter or hidden screen is not access control. Platform administration must
not imply routine access to all hospital records; any support access needs an
explicit, audited policy.

Use existing Clarity identity, case/episode, authorization and audit boundaries
where applicable. Concrete architecture, schemas and adapters require the
normal [architecture decision process](../../ARCHITECTURE.md). This document
does not select a new stack or authorize new APIs/services.

Custom fields extend designated record types. Each has a stable identity, type,
label, organization/facility scope, allowed values, validation, sensitivity,
view/edit permissions, reporting behavior and required-at-workflow-point rule.
An example is a finance-owned cost-center dropdown on budget lines.

Core tenant, facility, episode, metric, date and version identities cannot be
replaced by arbitrary fields. Renaming preserves history; used fields are
archived. Changes to types/options preserve interpretation of old records.
Custom fields cannot silently change calculations or permissions. Reviewed
calculation rules are independently versioned.

## 9. Reporting and data quality behavior

- Every KPI provides its definition, period, source, freshness and completeness.
- Drill-down explains an aggregate without granting new access to patient data.
- Import previews distinguish detail from rollup rows to avoid double counting.
- Repeated imports do not duplicate activity; batch corrections are traceable.
- Conflicting manual/import values enter a reconciliation workflow; the newest
  value does not automatically become truth without a defined source policy.
- Calendar logic respects leap years, facility timezone and partial periods.
- Budget planning ratios remain separate from actual discharge-cohort ALOS.
- Missing rates, authorizations or source coverage do not become plausible zero
  values. Explain the affected result and the responsible follow-up role.
- Exports use the same definitions and access boundaries as on-screen reports.

## 10. First complete implementation slice

Proposed slice: **hospital setup through patient-day budget comparison**.

A hospital administrator configures a facility and unit, assigns finance and
census users, and creates a facility-scoped cost-center field. Finance imports
and approves a synthetic monthly patient-day budget. The census owner records
or imports daily aggregate actual patient days, resolves a correction, and sees
a traceable actual-versus-budget comparison. Authorized leadership views it.

The aggregate daily entry is a bounded migration path, not evidence of a live
episode-event integration. Its source and reconciliation basis remain explicit;
do not ingest aggregate and episode-derived counts for the same scope twice.

The slice includes persistence, server-enforced tenant/facility access,
validation, correction history and import reconciliation across two synthetic
tenants. It is not just a screen demonstration. Forecast and collections are
outside this slice and must not display invented values.

| Acceptance check | Required evidence |
|---|---|
| Complete user workflow | A user completes setup, import, approval, actual entry and comparison with persisted results. |
| Calculation fidelity | Synthetic reference examples agreed with Tyler reconcile to the intended workbook logic; intentional repairs are documented. |
| Layer separation | Actual entry/correction leaves the approved budget unchanged; the report identifies versions and cutoffs. |
| Duplicate/error handling | Repeat uploads do not inflate counts; invalid/error/subtotal rows are surfaced before acceptance. |
| Tenancy and role enforcement | Direct unauthorized requests fail across tenants/facilities and across read/write/export paths supported by the slice. |
| Customization | Required cost-center values validate; renamed/archived fields retain history and permissions. |
| Traceable corrections | Corrected daily activity updates the comparison and retains source, actor, reason and prior value. |
| Calendar and missing data | Leap-year and incomplete-month fixtures produce the agreed results; missing days are flagged rather than treated as zero. |

Validate end-to-end means proving the replacement faithfully supports the
established workflow, safeguards hospital boundaries and delivers the intended
improvements. It is not a new test of whether the longstanding workflow is useful.

## 11. Expansion and evaluation

Expand only after the slice's acceptance evidence is reviewed. Candidate next
workflows are episode/census reconciliation, UR exposure, revenue forecasting,
staffing/cost and source-backed collections. Their ordering belongs in the
[canonical roadmap](../roadmap/IMPLEMENTATION_ROADMAP.md), not this definition.

For replacement quality, compare the same task and period using the workbook
and software: completion time, repeated entry, reconciliation discrepancies,
unresolved exceptions and assistance required. Agree success thresholds with
Tyler and pilot users before making improvement claims. Historical workflow use
does not establish software usability, tenant security or current performance.

## 12. Review questions and non-goals

Before implementing the relevant slice, resolve the following details with the
named responsibility. Record resulting material decisions in
[OPEN_DECISIONS.md](../decisions/OPEN_DECISIONS.md); this is an elicitation list,
not a second decision register.

| Detail to confirm | Reviewer / effect |
|---|---|
| Intended baseline year, fiscal periods and meaning of historical sample values | Tyler/finance; determines import mappings and parity fixtures. |
| Day-count, transfer and census cutoff conventions; aggregate actual source | Tyler/operations; determines first-slice calculations and reconciliation. |
| Budget approval and correction responsibilities at each hospital | Hospital administration/finance; determines permissions. |
| Meaning of gross/net revenue and overlapping deduction categories; rate sources | Tyler/finance/UR; required before forecasting. |
| Source of collections, posting/allocations and reversals | Revenue cycle/finance; required before cash reporting. |
| Production identity, tenant architecture, retention, patient-data access and support policy | Technical/security owners; required before applicable production use. |
| Pilot organization, pricing, commercial packaging and rollout schedule | Product owner; currently Unknown. |

First-slice non-goals: live EHR/payer/payroll connections, claims submission,
payment processing, clinical documentation, automated care/placement decisions,
IOP/PHP delivery and full revenue-cycle replacement. No real patient data is
required for the synthetic implementation proof.

## 13. Delivery boundary

This artifact defines the product and a proposed first slice. It does not claim
implementation, promotion to build-ready, deployment or operational cutover.
The existing [risk register](../decisions/RISK_REGISTER.md), architecture records
and implementation status remain authoritative. Workbook source material is
preserved; no source dataset is copied into application fixtures.

Next deliverable: a bounded first-slice implementation brief that incorporates
Tyler's agreed day-count rules and synthetic reconciliation examples, then maps
them to current Clarity code and accepted architecture.
