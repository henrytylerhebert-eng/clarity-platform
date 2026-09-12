# Dunder Mifflin Hospital RevOps MVP

**Product baseline accepted by Tyler: September 9, 2026.** Full workbook parity and real financial-rate implementation are authorized development scope. The earlier census-only definition is superseded. Runtime completion is tracked independently in [implementation status](../../IMPLEMENTATION_STATUS.md).

## Outcome

Translate **Dunder Mifflin Hospital – Restored Operations 2026** into a configurable hospital operations and finance platform: admissions and census, IOP, staffing, payer/service valuation, budgets, expenses, collections, forecasts, management reporting, and accountable reconciliation.

The [acceptance record](RESTORED_WORKBOOK_ACCEPTANCE.md) closes the owner acceptance gate. Its technical evidence notes remain available for traceability and do not require another blanket workbook approval before implementation. The [workflow map](WORKBOOK_TO_PLATFORM_WORKFLOW_MAP.md) supplies 30 workbook functions, four platform workflows, records, rules, code references, and acceptance scenarios.

## Full MVP scope and current coverage

| Domain | Accepted functions | Currently available | Remaining implementation |
| --- | --- | --- | --- |
| Admissions and inpatient operations | F02–F06 | Loaded synthetic identities/stays, validated corrections, event-derived patient days, admissions/discharges, ADC, occupancy, LOS and census exceptions | New-admission workflows and fully recalculated geographic/detail reports. |
| IOP operations and audit | F13–F16, X04 | Enrollment, visits, sessions and participant records; editable inputs; live attendance, enrollment averages, meals and service counts | Connected independent documentation/charge audit, persisted review/close UI, new operating-record entry workflows. |
| Payers, rates and service valuation | F07–F12, F30 | Durable payer/service/effective-contract registries with add/correct; synthetic service valuation; official Louisiana per-diem scenarios; Medicare base-component calculator | Verified hospital binding, complete IPF/FY2027/OPPS/SBH methods and official-rate-to-ledger posting. Benefits/assistance detail remains reference snapshots. |
| Staffing and labor costs | F17–F20 | Role/program hours and dated standards; recalculated labor, agency, one-to-one, training/PTO, HPPD, budgets and variances | New staffing-day ingestion, full staff-report layouts and consolidated review controls. |
| Budgets, invoices and collections | F21–F23 | Editable 2026 revenue/labor budgets and ancillary/invoice inputs; recalculated expenses, invoice balance, cash/allocation totals and modeled outstanding | New posted receipts, reversals/reallocations and integrated financial close. Imported signed cash history is immutable. |
| Forecast and management reporting | F24–F25 | Editable independent forecast assumptions/mix, monthly/annual results, 47 source comparisons and durable report snapshots | Full management-report export/layout parity and consolidated financial closing. |
| Setup, definitions and quality | F01, F26–F29, X01 | Authenticated domain navigation, 31 source tables, input validation, feed exceptions, accountable edits, tenant/revision tests and 611 golden comparisons | Generalized future-year import/settings and measured large-workspace scaling; full function-level acceptance remains open. |
| Import, reconciliation and close | X02–X03 | Accepted-source import, preserved formula references, source hash, audit revisions and report snapshots; existing aggregate close/export retained | General workbook ingestion and consolidated financial/IOP close. Saving a report does not close a financial period. |

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

The imported operating workspace supports the accepted 2026 year. Existing aggregate census controls retain other reporting years, including leap years. Generalized future-year workbook ingestion remains within the MVP backlog. Payment schedules use their actual effective dates and payment-system date basis, rather than assigning one rate to an entire calendar year.

## Build order and completion

Use the P0–P7 dependency sequence in the [workflow map](WORKBOOK_TO_PLATFORM_WORKFLOW_MAP.md) and [full tree](WORKBOOK_PLATFORM_FULL_TREE.md). Owner baseline acceptance is complete. The existing IOP work package remains a useful increment; financial source/contract/version work can proceed alongside it, with integrated valuation following the activity records it consumes.

MVP acceptance requires:

1. Every F01–F30 and X01–X04 row linked to its records, rules, user workflow, code and an executable acceptance result. A changed requirement needs an explicit owner disposition.
2. Agreed workbook examples and cross-sheet reconciliations reproduced from platform records, including the full synthetic 2026 year. Remaining native-workbook test gaps are evidence tasks, not a repeated acceptance request.
3. Financial methods independently checked against applicable official examples/pricers or documented contract calculations, including effective-date boundaries, missing provider inputs and ambiguous contracts.
4. Tenant/facility/program isolation, accountable corrections, duplicate/replay controls and historical close reproduction verified for each new record type.
5. Forecast, actual activity, approved budget, calculated allowance and posted cash remain separately identifiable in the interface and exports.

Current implementation: `/rev-ops` opens the working Operations screen after sign-in, with the accepted year loaded into the local database. Input corrections and registry additions persist with server-derived actor identity and revisions. The Rates tab contains sourced calculators, with explicit unsupported methods. See [runtime verification and remaining gaps](../testing/REVOPS_OPERATING_MVP_VERIFICATION.md). Local operating records remain synthetic; source-system connection and production release remain separately scoped work.
