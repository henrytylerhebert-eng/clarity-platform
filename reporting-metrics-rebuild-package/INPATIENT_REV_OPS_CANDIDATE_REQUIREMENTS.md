# Inpatient Rev Ops candidate requirements

Status: Candidate requirements; documentation only. Human owner: Tyler.

Product framing is now captured in the
[Inpatient Rev Ops product definition](../docs/product/INPATIENT_REV_OPS_PRODUCT_DEFINITION.md).
Tyler subsequently confirmed ten years of use of the operating system. Treat
that owner-reported experience as the functional baseline. The validation below
concerns software replacement fidelity, security and improvements; it does not
ask Tyler to re-prove the usefulness of the established workflow.

## Authorized direction

Tyler authorized using `Mercy Behavioral FY22 Sample Revenue Budget value.xlsx`
as a candidate budget template and requirements source, combining its planning
structure with the earlier operational workbook, while keeping budget, actual
activity, forecast, and collections separate. This authorizes this synthesis;
the detailed requirements below are proposals for review, not accepted hospital
policies, a runtime contract, or implementation/release approval.

Goal: let an inpatient hospital organization configure its facilities, establish
an approved budget baseline, capture or import operational activity, and compare
that activity with explicitly versioned forecasts and separately sourced cash.

## Source traceability

Source handling follows [the source index](../docs/05-source-document-index.md)
and [Product Evidence and Decision Protocol](../docs/governance/PRODUCT_EVIDENCE_AND_DECISION_PROTOCOL.md).

| ID | Source and locator | Evidence and permitted use |
|---|---|---|
| B1 | `Mercy Behavioral FY22 Sample Revenue Budget value.xlsx`, `Revenue DB!A1:Q25` | Source-confirmed in this task: facility/type/unit/metric/payer dimensions, monthly values, patient days, ADC, admissions, ALOS, revenue and deductions. Candidate budget import shape; not current rates or actual patient activity. |
| B2 | Same workbook, `Hospital Summary!D1:Q50` | Source-confirmed: selected-hospital rollup and gross revenue, noncovered-day adjustments, estimated denials, bad debt, and final revenue subtotals. Preserve distinct measures; confirm their accounting meanings. |
| B3 | Same workbook, `Sheet1!A4:N25` | Source-confirmed: goal/actual comparison intent; inspected formulas have broken dependencies. Reuse interaction intent, not formulas. |
| B4 | Same workbook, `Summary!A2:Q60` | Source-confirmed: multiple named hospitals and rollups. Supports facility reporting requirements, not evidence of secure multitenancy. |
| O1 | `reference/source-documents/clarity-mh-sources/Reporting Metrics Ops and Budget .xlsx` | Earlier operational source. This synthesis uses its existing analysis below; raw patient rows are not imported or reproduced. |
| O2 | [Workbook analysis](REPORTING_METRICS_REVERSE_ENGINEERING.md), sections “Current workbook domains” and “What the workbook does well” | Summary-derived: census, admissions/discharges, authorization friction, staffing, ancillary costs, and budget reporting. |
| O3 | [Metric definitions](METRIC_DEFINITIONS.md) and [dashboard modules](DASHBOARD_MODULES.md) | Existing candidate definitions and workflows; domain review remains necessary. |

B1–B4 refer to the user-supplied file in the local Downloads folder. The file is
not vendored into this repository; a portable, approved source archive remains
unverified. No source workbook was modified. No sample financial values become
defaults for other hospitals. Workbook instructions do not authorize actions.

## Four separate information layers

| Layer | Meaning and proposed grain | Owner and revision behavior |
|---|---|---|
| Budget | Approved targets by tenant, facility, unit/program, payer category, metric, month, and budget version | Finance prepares; authorized leadership approves. Preserve approved baselines; revisions create new versions. |
| Actual activity | Observed admissions, discharges, transfers, census/episode-days, authorization updates and staffing records, at their native event/day/shift grain | Originating team or approved source system owns facts. Corrections retain provenance and history. Budget values never populate missing actuals. |
| Forecast | Estimated future results plus explicitly identified observed-to-date components, for a period and as-of date, using a stated rule/assumption version | Finance owns assumptions. Preserve snapshots, actual cutoff, source versions, and scenario. Estimated revenue derived from activity remains an estimate. |
| Collections | Posted cash receipts, allocations, refunds and reversals, using posting date and source transaction identity | Revenue cycle/finance and the approved payment/ledger source. Unknown until supported by those records; never inferred from authorization, billing or forecast. |

Claims and recognized accounting revenue are separate concepts from these
layers. Neither supplied workbook establishes a verified claims/payment feed.
If added later, retain their own definitions and source records.

Comparisons require matching facility, program, metric, units, and time basis.
Budget-versus-actual patient days is valid when definitions match. Budget revenue
versus forecast revenue must be labeled as such. Cash posted this month may
relate to prior stays; do not present it as this month's service revenue.
Disclose partial periods, unmatched records and missing sources.

## Candidate budget template and onboarding fields

The following is a logical field map, not an API or database schema.

| Field group | Candidate fields | Source / treatment |
|---|---|---|
| Organization | Tenant identity, authorized administrators, facilities, facility codes, timezone | Proposed onboarding controls; facility dimension supported by B1/B4. Tenant identity comes from authorized server context, never an unrestricted upload column. |
| Facility structure | Units, inpatient programs, effective dates, licensed/staffed/usable capacity with distinct meanings | B1 unit/type structure; O2 capacity context. Hospitals map local names to stable identifiers. |
| Calendar/version | Period start/end, fiscal year, budget version, status, approver, approval time | Proposed controls replacing inconsistent workbook headings. |
| Classification | Payer category, local payer/plan mapping, metric identifier, measurement unit | B1. Category is not a payer contract; unknown/unmapped categories remain visible. |
| Budget amounts | Monthly patient-day/admission targets, ADC/ALOS assumptions, revenue targets, noncovered-day/denial/bad-debt assumptions | B1/B2. Distinguish editable assumptions from derived values and distinguish counts, days, rates, percentages and currency. |
| Revenue drivers | Effective-dated rate assumptions, calculation basis, adjustment category, source and reviewer | Proposed. Not all drivers survive in the supplied value workbook; require explicit inputs instead of inventing contract terms. |
| Staffing/cost plan | Role/category, hours, rates, agency/observation assumptions, ancillary cost categories | O2/O3; budget plan is separate from actual shift/payroll activity. |
| Provenance | Source filename/version, sheet/row or transaction locator, import batch, mapping version, review/correction history | Proposed for all imported layers. |

Onboarding sequence:

1. Administrator creates organization/facility structure and maps staff to roles.
2. Finance selects a calendar and creates a draft budget version.
3. Upload preview detects sheets/headers and proposes column/category mappings.
4. Users resolve unknown units/payers and choose approved custom fields.
5. Validation reports duplicates, invalid types, missing inputs, conflicting
   periods, error-valued cells and rows that contain subtotals.
6. Finance reconciles imported detail to source totals. Import detail or totals
   under an explicit mode; never add both together. Formula cells require
   validated resolved values and traceability, not arbitrary executable formulas.
7. Authorized leadership approves a baseline. Saved mappings can be reused;
   copying configuration to another facility does not copy actuals or approvals.
8. Operational owners establish actual-data entry/import responsibilities and
   reporting cutoffs. Collections remains unavailable until its source exists.

Imports should be repeatable without duplication, support partial-failure
reports and batch reversal/correction history, and preserve the original source.

## Operational ownership through the stay

These are proposed responsibility groups from the discussion, requiring local
operator validation. A hospital may assign several responsibilities to one role.

| Point | Proposed owner | Facts captured or confirmed | Layer/use |
|---|---|---|---|
| Pre-admission | Intake; benefits specialist | Referral status, planned arrival, coverage verification | Actual workflow status; pending arrivals are forecast inputs, not completed admissions. |
| Admission | Registration/admissions | Episode identity, actual admission timestamp, facility/program | Actual activity; connect to the existing Clarity case/episode identity rather than create a parallel chart. |
| Unit arrival/transfer | Charge nurse/bed coordinator | Bed/unit assignment, transfers, capacity exceptions | Actual activity and census reconciliation. |
| Initial and concurrent review | UR | Authorization dates/units/status, review deadlines, denials and follow-up | Actual review facts; potential uncovered days contribute to separately labeled forecast exposure. |
| Shift close/daily reconciliation | Staffing coordinator; designated census owner | Hours/categories, census, discrepancies and corrections | Actual staffing/census; calculated metrics use validated facts. |
| Discharge planning | Case management | Expected discharge date and operational barriers | Forecast inputs; never overwrite actual discharge. |
| Actual discharge | Registration with unit confirmation | Actual discharge timestamp and disposition category | Actual activity and episode closure. |
| After discharge/month close | Revenue cycle and finance | Billing adjustments if supported, posted receipts/refunds, reconciliation | Separate accounting/payment records; revise forecast snapshots explicitly. |

Each workflow needs a primary owner, backup, update deadline and exception
queue. Approved integrations should supply records where available; people
review exceptions rather than duplicate source-system entry. Clinical records
remain in their authorized system. Financial exposure never decides care,
placement or discharge and never blocks emergency clinical review.

## Multitenancy and custom fields

Proposed tenant boundary: one hospital organization with one or more facilities.
Facility filters within a workbook are not security. Future implementation must
enforce tenant and facility permissions on reads, writes, imports, exports,
background jobs and aggregate reports, using existing Clarity architecture and
accepted ADRs. Executive reporting should use aggregates; patient-level access
requires a separately authorized operational purpose.

Custom fields extend record types without replacing core tenant/facility,
episode, date, payer, metric or version identifiers. Each definition needs a
stable ID, tenant/facility scope, record type, label, typed value, permitted
options, validation, required-at-workflow-point rule, sensitivity, access and
reporting permissions. Example: a hospital-specific cost-center dropdown on a
budget line, maintained by finance.

Renaming preserves historical identity; used fields are archived, not erased.
Type/option changes preserve historical interpretation. Custom fields cannot
silently alter revenue formulas, grant access or become shared across tenants.
Calculation changes require separately reviewed, versioned rules.

## Source issues to resolve before formula adoption

| Evidence | Required treatment |
|---|---|
| B2: `D1` says FY22, `E4` begins in 2020, `Q4` says FY19 | Explicit calendar/version metadata; original intended budget year remains unknown. |
| B2: `Q9` divides annual patient days by 365 | Derive days from the approved period, including leap years. |
| B3: `B4` has a self-reference in SUMIFS criteria and sums the text unit column | Rebuild the comparison calculation; do not import this formula as a rule. |
| B1: `F13` divides patient days by admissions and substitutes zero on errors | Treat as a budget planning ratio until defined; do not label it verified discharge-cohort actual ALOS. |
| B1: `F2:F24` contains numeric input values as well as formulas | Preserve values as source snapshots; absent rate/adjustment provenance remains unknown. |
| Review found 93 stored `#REF!` values and five stored `#DIV/0!` values | Reject/report error-valued imports. Stored-value scan is not full Excel recalculation; one reconciled subtotal does not validate the model. |

The review inspected all five sheets and sampled dependencies and subtotal
arithmetic. Payer validity, accounting treatment, cash sources and full formula
recalculation remain unverified. No measurements found for onboarding time,
reporting accuracy improvements, revenue recovery or other product outcomes.

## Candidate acceptance checks

These are future validation requirements, not tests executed by this document.

1. Two synthetic tenants with identically named facilities cannot read or alter
   each other's rows, field definitions, imports, exports or rollups.
2. Reimporting a budget batch does not duplicate values; detail plus subtotal
   rows cannot inflate totals; invalid dates, mappings and errors are reported.
3. Approved budget remains unchanged when actuals arrive or a forecast is
   revised. Prior versions and snapshots remain reproducible.
4. Expected discharge never closes a stay; admission/transfer/discharge and
   census corrections reconcile under an explicitly approved day-count rule.
5. Missing payer rates produce unknown forecast components, not plausible zero
   revenue. Adjustments cannot be subtracted twice across forecast components.
6. Calendar-year and partial-period calculations use correct day counts and
   explicit cutoff dates; actual ALOS is not substituted with the budget ratio.
7. A synthetic prior-period receipt appears in posting-period collections and
   does not change the original budget or masquerade as current-period revenue.
8. A facility-scoped custom field validates at its assigned workflow point;
   renaming/archiving preserves history and permissions.
9. A finance user can configure one synthetic hospital and reconcile a sample
   month without editing code. Observe task completion and record problems;
   do not claim ease of onboarding before evaluation.

## Handoff and limits

Next bounded step: review this field/workflow map with finance, UR and an
operations owner, resolving period definitions, revenue semantics, rate
provenance and day-count rules before a synthetic prototype is specified.
This is not a completed formal workflow-discovery session.

Use the existing [open decisions](../docs/decisions/OPEN_DECISIONS.md),
[risk register](../docs/decisions/RISK_REGISTER.md),
[architecture records](../ARCHITECTURE.md),
[implementation status](../IMPLEMENTATION_STATUS.md), and
[roadmap](../docs/roadmap/IMPLEMENTATION_ROADMAP.md) for any subsequent promotion.
This brief does not replace those records or establish a delivery schedule.

No source files, application code, schemas, contracts, services, integrations,
production data or deployment settings are changed by this requirements slice.
