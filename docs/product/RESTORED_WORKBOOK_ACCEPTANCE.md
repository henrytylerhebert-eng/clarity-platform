# Restored workbook acceptance and platform reconciliation

Review packet · 2026-09-08 · Synthetic only · Operational acceptance pending

This packet implements the owner's sequence: workbook acceptance, workbook-to-platform reconciliation, then roadmap correction before connectors. It supplements the [original workflow and reuse map](WORKBOOK_TO_PLATFORM_WORKFLOW_MAP.md); it does not replace the [canonical implementation status](../../IMPLEMENTATION_STATUS.md), [roadmap](../roadmap/IMPLEMENTATION_ROADMAP.md), or [open decisions](../decisions/OPEN_DECISIONS.md).

## Exact review baseline

Workbook task: `Review WB 2.0`, task ID `01a0828f-894b-74b1-adc9-903347636313`.
Local artifact root: `/Users/tylerhebert/.codex/visualizations/2026/09/08/01a0828f-894b-74b1-adc9-903347636313`.
Workbook relative to that root: `outputs/dunder-mifflin-restored-2026/Dunder Mifflin Hospital - Restored Operations 2026.xlsx`.

| Evidence | Finding | Acceptance consequence |
|---|---|---|
| Current binary, read-only ZIP/XML and SHA-256 inspection | 62 sheets; hash `6e81bd61950c244e607ed03f8b0f13e1a4d0bea366ee7ad7cc54c053ef90de26` | Current candidate, not yet the accepted baseline |
| `restoration-final-save.json` | Reports PASS, 43 checks, 30 examples, 32 mutation assertions, clean native reopen; hash `67892ab3fb25c8f2af313779e46c75235c08262f4f13a47bd221bab8ccbe96de` | Historical evidence applies to a different binary; do not transfer PASS to the current file |
| `restoration-native-verification.json` | Records 32/32 assertions, restored inputs, final 43/43 checks and 30/30 examples | Inspected saved evidence, not tests rerun in this audit |
| `restoration-formula-preservation.json` | Reports 213,027 expected and actual formulas, no missing/changed/added formulas | Historical preservation check; current calculation and formula parity remain unverified |
| `outputs/workbook-restoration-plan/feature-restoration-map.csv` | F01–F30, with N01–N39 specifications | Planning evidence. Its “Current gap” describes the pre-restoration workbook, not today's implementation |

The prior task's 60-sheet description differs from the current 62-sheet file, which includes `Sheet1` and `Sheet2`. Their presence alone does not explain the hash change. First pin a review copy, inspect the change, recalculate and reopen it in Excel, and produce a verification receipt tied to its final hash. Do not modify the legacy workbook to resolve this. Larger-scale workbook growth remains unverified; command-roundtrip timings are not a scalability benchmark.

The [current sheet dependency inventory](evidence/RESTORED_WORKBOOK_SHEET_DEPENDENCIES.csv)
contains all 62 sheet names, visibility, formula counts and direct explicit sheet
references extracted without saving Excel or copying cell values. Structured-table
references, named ranges, indirect references and manual handoffs are not expanded;
the workflow relationships below include proposed semantic links and must not be
mistaken for a complete calculation graph. The two generic sheets require an explicit
keep/remove disposition during A01, without assuming they are empty.

Code inspected at `a44596a4704ca1039ac6c639fe5963f5c911b0d3`. “Reuse” below identifies existing code, not newly passing runtime tests or accepted workbook parity. Applied contract rates remain fictional test inputs. Regulatory-reference sheets are not approval to implement reimbursement rules.

## Feature-to-platform reconciliation

All 30 restoration feature IDs are accounted for below. Sheet names are current candidate destinations; existence is not functional acceptance. R01–R07 refer to exact code and test links in the original map. New reuse references follow this table.

| Features | Workbook workflow and connected sheets | Reuse | Remaining platform parity / owner review |
|---|---|---|---|
| F01 | `INDEX` → owning input/report sheets; `README` | Existing workspace navigation patterns | Workbook-to-workspace navigation and return/drill-down parity unverified; operations walks each route |
| F02–F03 | `PATIENTS` → `ENCOUNTERS` → `STATE_MIX`, `MONTHLY` | R04 episode identity and admission persistence | Admission snapshots, readmission identity, geography/Unknown totals not connected to Rev Ops |
| F04–F06 | `ENCOUNTERS` → `INPATIENT` → `MONTHLY`, `MANAGEMENT_REPORT` | R01/R02 aggregate census, calendar, correction and close; R04 episode facts | Event-derived census, capacity denominator, month-overlap and discharge-cohort ALOS parity not established |
| F07–F10 | `ENCOUNTERS`, `SERVICE_LEDGER`, `PAYERS`, `SERVICES`, `CONTRACT_RATES`, `BENEFIT_REVIEW`, `ASSISTANCE` → `PAYER_ACTIVITY` → `MONTHLY` | R04/R05 episode/benefit facts; R02 revision patterns | No connected patient-month valuation, effective-rate or benefit-day financial engine in the inspected Rev Ops surface; finance approves definitions |
| F11–F12 | `ENCOUNTERS`, `UR_PAYER`, `PAYER_ACTIVITY` → `PAYER_MIX`, `MONTHLY` | R04 authorization review persistence; R05 preparation workflow | Payer-day reconciliation, Unknown denominator and physician/UR report parity not established; source-reported authorizations remain distinct from readiness |
| F13–F16 | `IOP_ROSTER`, `IOP_SESSIONS`, `SESSION_ATTENDANCE`, `IOP_VISITS` → `IOP_GRID`, `IOP`, `SERVICE_LEDGER`, `ANCILLARY`, `MONTHLY` | R08 synthetic link checks and persisted review/close; R02 period patterns | Enrollment/frequency history, scheduled denominator, therapist/session grain, meals and daily rollup remain to reconcile. Existing IOP UI is an in-memory preview, not the persisted route's client |
| F17–F20 | `SETUP`, `STAFF_STANDARDS`, `STAFF_DETAIL` → `STAFFING`, `STAFF_REPORT`, `MONTHLY` | R09 aggregate staffing comparison; R02 correction patterns | Role detail, disjoint paid/productive categories, agency/one-to-one costing and rolling windows are not supplied by the aggregate comparison |
| F21 | `BUDGET`, activity ledgers, `STAFF_REPORT` → `MONTHLY`, `DASHBOARD` | R02 approved count budgets and phased comparisons | Typed dollar/hour/program budgets and financial variance parity are additional behavior, not a custom-field configuration |
| F22 | `ANCILLARY`, activity quantities → `INVOICES`, `MONTHLY` | R02/R06 provenance and reviewed-output patterns | Invoice line/rate/credit/lease calculations require a separate typed model and finance review |
| F23 | `COLLECTIONS` → `RECEIPT_ALLOCATIONS` → modeled balances/reports | R02 immutable-history pattern only | `compareRevOps` returns `collections: null`; cash, reversal and allocation reconciliation not implemented by census close |
| F24 | `FORECAST`, rate/payer assumptions → `MONTHLY`, `DASHBOARD` | R02 rule/version patterns only | `compareRevOps` returns `forecast: null`; independent forecast engine and actual/cash non-interference remain open |
| F25 | `MONTHLY`, `PAYER_MIX`, `STATE_MIX`, `STAFF_REPORT` → `MANAGEMENT_REPORT`, `DASHBOARD` | R02 narrow census reporting; R06 receipt export | Full executive scorecard, weighted YTD ratios and input drill-down parity not established |
| F26–F28 | `DEFINITIONS`, `FORMULA_CATALOG`, `SOURCE_FORMULAS`, `SOURCE_MAP`, `FEATURE_MAP`, `DECISIONS`, `CORRECTIONS`, `CHECKS`, `EXAMPLES`, `PRESSURE_TEST` | R02 governed corrections; R06 receipt snapshots; existing focused test suites | Bind each accepted formula/example to a platform test and version; Excel correction rows do not establish immutable audit history |
| F29 | Owning detail/configuration tables → dependent reports | R06 bounded import checks, R01 persistence patterns | Table growth, validation expansion and capacity evidence must be tested separately in workbook and platform |
| F30 | `MEDICARE_REFERENCE`, `IPF_FACTORS`, `BENEFITS_REFERENCE`, `LA_*` → reference/rule review | R05 source/benefit review concepts only | Facility-specific rule applicability and payment amounts require qualified review; no production payment claim |

**R08:** [sample contract and link validator](../../packages/domain-contracts/src/iopReconciliation.ts), [import/close contract](../../packages/domain-contracts/src/iopReconciliationImport.ts), [persistence gateway](../../packages/case-repository/src/iopReconciliationGateway.ts), [authenticated routes](../../packages/api-service/src/iopReconciliationRoutes.ts), [preview UI](../../app/src/workspaces/IopReconciliation.tsx). Reuse stable source provenance, exception reviews and close receipts. The sample has one service date, plan frequency and attendance-to-note/charge/billable IDs; it does not establish schedule compliance, distinct therapist sessions or monetary reconciliation. Test targets: [persistence](../../tests/integration/iop-reconciliation-persistence.test.ts), [link checks](../../tests/unit/iop-reconciliation-sample.test.ts), [import](../../tests/unit/iop-reconciliation-import.test.ts).

**R09:** [Rev Ops service](../../packages/rev-ops-service/src/index.ts) `staffingComparison` selects approved effective rules, reports missing dates, and sums actual hours versus census × target-hours-per-census. This is reusable aggregate comparison code, not complete workbook staffing parity. Test target: [Rev Ops integration](../../tests/integration/rev-ops.test.ts).

## Acceptance walkthrough and required receipt

Every row starts **PENDING**. Record workbook hash, cutoff/timezone, feature IDs, exact input/output cells, expected/actual value and unit, formula/rule version, reviewer identity/role, review time, disposition and evidence. Record old/new values and reason for corrections. No response or a passing arithmetic check counts as owner acceptance. Unmatched events require a reviewed exception with reason and disposition; a reviewed HOLD is not a matched or billable event.

| Review | Required synthetic exercise | Owner |
|---|---|---|
| A01 Baseline | Resolve fingerprint mismatch; recalculate, rerun checks/examples/mutations, restore inputs, save/reopen; hash final file | Technical reviewer, identity pending |
| A02 Census | Readmission, open stay, month-end discharge, explicit zero vs missing; census → days → ADC/ALOS and capacity denominators | Census owner + Tyler |
| A03 IOP daily handoff | 12 enrolled, 10 scheduled, 8 attended, 2 no-shows gives 80% scheduled attendance. Trace roster/plan → participant events → grid → daily IOP summary. Separate 2 sessions, 10 participant units and 5 patient-days for the same five people. Trace payable meals separately | IOP director + clinical reviewer |
| A04 IOP exceptions | Three-to-two-to-one plan history; inpatient interruption and new enrollment; missing/orphan/late notes, charges and EMR lines. Trace independent note reviewer and every exception through close cutoff | IOP director + revenue cycle |
| A05 Staffing | Role hours → productive/paid totals → HPPD and costs; agency and one-to-one attributes must not double-count hours | Staffing + finance |
| A06 Money | Cross-month valuation, missing/overlapping rates, signed invoice credit, cash reversal/overallocation. Budget/forecast edits must leave activity and cash unchanged | Finance |
| A07 Reports and growth | Recompute weighted YTD ratios, retain Unknown payer/geography, navigate to contributors; append records beyond existing ranges and verify dependent formulas/validation | Operations + technical reviewer |

After A01, owner walkthroughs can accept a bounded feature subset while explicitly excluding unresolved features. Full workbook acceptance requires dispositions for F01–F30 and all walkthroughs. Actual review identities, dates and dispositions remain pending; this packet does not fabricate a signed receipt.

## Next bounded platform proof after acceptance

Proposed, not implementation authorization: turn the accepted A03/A04 examples into golden cases for one synthetic IOP program and reporting period. Trace enrollment/frequency → scheduled/attended events → session/participant/day totals → daily summary → note audit → charge/EMR exceptions. Preserve each metric's grain and cutoff, and reuse R08 review/close persistence where it fits. First agree the gaps in the existing sample contract; do not silently add endpoints or treat a browser preview receipt as server persistence.

Exit evidence: workbook and platform agree on accepted outputs and exception sets; corrections and late events preserve prior close evidence; missing inputs remain explicit; named reviewers accept the workflow. Then select the smallest implementation gap from this proof. Source-adapter selection and program authorization/RLS remain subsequent gates, documented in the [source decision packet](IOP_SOURCE_ADAPTER_DECISION_PACKET.md). No connector or real import is authorized by workbook acceptance.
