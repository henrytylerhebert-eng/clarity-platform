# Dunder Mifflin Hospital RevOps MVP

**Product baseline accepted by Tyler: September 9, 2026.** Full workbook parity and real financial-rate implementation are authorized development scope. The earlier census-only definition is superseded. Runtime completion is tracked independently in [implementation status](../../IMPLEMENTATION_STATUS.md).

## Outcome

Translate **Dunder Mifflin Hospital – Restored Operations 2026** into a configurable hospital operations and finance platform: admissions and census, IOP, staffing, payer/service valuation, budgets, expenses, collections, forecasts, management reporting, and accountable reconciliation.

The [acceptance record](RESTORED_WORKBOOK_ACCEPTANCE.md) closes the owner acceptance gate. Its technical evidence notes remain available for traceability and do not require another blanket workbook approval before implementation. The [workflow map](WORKBOOK_TO_PLATFORM_WORKFLOW_MAP.md) supplies 30 workbook functions, four platform workflows, records, rules, code references, and acceptance scenarios.

## Full MVP scope and current coverage

| Domain | Accepted functions | Currently available | Remaining implementation |
| --- | --- | --- | --- |
| Admissions and inpatient operations | F02–F06 | Aggregate daily census; adjacent encounter foundation | Linked identities and admissions, geography, event/census reconciliation, discharges, ADC, occupancy, LOS. |
| IOP operations and audit | F13–F16, X04 | Synthetic review preview and separate persisted API | Enrollment/frequency, schedule and attendance, group/session/participant units, meals, independent audit and charge/EMR reconciliation, connected review/close. |
| Payers, rates and service valuation | F07–F12, F30 | Published workbook reference releases and adjacent benefits/UR contracts | Payer/plan registry, sourced effective rates, payment methods, patient-month allowances, benefit history, assistance and UR reporting. |
| Staffing and labor costs | F17–F20 | One daily hours measure and approved target comparison | Role hours, staffing budgets, rolling variances, agency/one-to-one costs, training/PTO, productive-hour definitions and wages. |
| Budgets, invoices and collections | F21–F23 | Versioned approved patient-day budgets | Compatible revenue/labor budgets, ancillary/AP and leases, posted receipts, allocations, refunds/reversals and balances. |
| Forecast and management reporting | F24–F25 | Existing aggregate comparisons | Independent scenarios, monthly/YTD charts, source drill-through and consolidated reports. |
| Setup, definitions and quality | F01, F26–F29, X01 | Hospital/unit setup, delegated permissions, custom fields and history | Full navigation, metric/rule definitions, correction/source decisions, parity/regression suite and measured growth. |
| Import, reconciliation and close | X02–X03 | Bounded count uploads, conflict review, census/staffing close/reopen receipts and exports | Workbook-to-record import, source/version links at all grains, financial and IOP exceptions, consolidated close and reports. |

These rows define the MVP completion target. A missing workflow is remaining work within the MVP; it cannot be omitted merely because the present prototype lacks it. Legacy worksheet layout need not be copied, but operating behavior, examples, formulas, definitions, reports, navigation and reconciliation must be accounted for.

## Real financial-rate implementation

Implementation includes public Medicare and Louisiana Medicaid schedules and payment methods, and commercial payer contracts with the correct plan, provider, service, network, unit, effective interval and source version. Public rate inputs can be used with synthetic activity; synthetic patients do not require fictional payment rules.

Tyler selected a **specific Louisiana hospital profile** and will provide its provider identifier. Record Medicare CCN, applicable Medicaid provider identifiers and facility/program characteristics when supplied; do not substitute an assumed hospital. Facility-specific results depend on those inputs. Rate-source, versioning, contract and calculation work can proceed now.

The [financial-rate implementation specification](REVOPS_FINANCIAL_RATE_IMPLEMENTATION.md) defines official sources, effective-date rules and verification requirements. Workbook fictional applied contracts remain labeled examples. Real commercial rates require the relevant contract terms; public Medicare and Medicaid references do not supply them.

Each calculation must retain the payment method/version, authoritative inputs, selected provider/contract, applicable date basis, contributing service units, rounding policy and result trace. Missing or conflicting applicability produces a visible unresolved result. No generic flat-rate fallback may silently replace an unimplemented payment method.

## Data and calculation semantics

- Actual activity records what occurred, with source, scope and correction history.
- Budget records an approved target in explicit units/currency and a version.
- Service valuation calculates an allowance under the selected payment method; adjustments and benefit liability have separate evidence.
- Forecast records an as-of scenario, assumptions, and estimated remaining activity.
- Collections record posted cash, allocations and reversals, with posting dates distinct from service dates.
- Operational closing receipts document a review and remain distinct from payment receipts.

The baseline year is 2026. Other years remain selectable, including leap years. Payment schedules use their actual effective dates and payment-system date basis, rather than assigning one rate to an entire calendar year.

## Build order and completion

Use the P0–P7 dependency sequence in the [workflow map](WORKBOOK_TO_PLATFORM_WORKFLOW_MAP.md) and [full tree](WORKBOOK_PLATFORM_FULL_TREE.md). Owner baseline acceptance is complete. The existing IOP work package remains a useful increment; financial source/contract/version work can proceed alongside it, with integrated valuation following the activity records it consumes.

MVP acceptance requires:

1. Every F01–F30 and X01–X04 row linked to its records, rules, user workflow, code and an executable acceptance result. A changed requirement needs an explicit owner disposition.
2. Agreed workbook examples and cross-sheet reconciliations reproduced from platform records, including the full synthetic 2026 year. Remaining native-workbook test gaps are evidence tasks, not a repeated acceptance request.
3. Financial methods independently checked against applicable official examples/pricers or documented contract calculations, including effective-date boundaries, missing provider inputs and ambiguous contracts.
4. Tenant/facility/program isolation, accountable corrections, duplicate/replay controls and historical close reproduction verified for each new record type.
5. Forecast, actual activity, approved budget, calculated allowance and posted cash remain separately identifiable in the interface and exports.

Current implementation: the interface shows accepted full scope and coverage, defaults reporting to January 2026, and retains existing authenticated operations. The broader operating modules and rate engines require implementation and their own test evidence. Local development continues with synthetic operational records; source-system connection and production release remain separately scoped work.
