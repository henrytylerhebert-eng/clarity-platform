# Operating MVP verification — September 9, 2026

## Completed

Built working screens and calculations from the accepted Dunder Mifflin 2026 workbook. Source acceptance remains closed; this record reports application implementation evidence.

- 31 source tables, 28,301 synthetic records; 20 tables have correctable inputs, two preserve signed receipt/allocation history, nine are read-only report snapshots.
- Independent monthly/annual calculations cover all 47 numeric MONTHLY outputs, plus additional attendance and invoice measures. The source caches serve as comparisons, not the calculator.
- Authenticated database persistence for input corrections, payer/service/contract additions and report snapshots. Each mutation records actor, reason and revision; stale writes fail.
- Operations screens support year/month selection, domain navigation, search, pagination, typed corrections, new registry records, exceptions and preserved reports.
- Official Louisiana inpatient per-diem scenarios use 566 July 2025 rows and 560 July 2026 rows, retaining source row/date/type/rate and archive hashes. Dates crossing July 1 use separate releases. Missing and ambiguous rows are unpriced.
- Commercial/Medicare Advantage/managed-Medicaid scenario terms distinguish payer, plan, network, funding, facility, program, payment basis and effective dates. These calculators support per-day/service/case and percentage-of-charges methods.
- Medicare FY2026 wage-adjusted federal base component is calculated from official inputs and explicitly labeled as a component. Public scenarios do not bind the hospital or post ledger values.

## Files and architecture

- UI: `app/src/workspaces/RevOps.tsx`, `OperatingWorkbook.tsx`, `operatingWorkbook.css`, `RevOpsPricing.tsx` and focused UI tests. Payment data is loaded when the Rates tab opens.
- Domain/calculations: `packages/domain-contracts/src/operatingWorkbook.ts`, `revOpsPricing.ts`; `packages/rev-ops-service/src/operatingWorkbook.ts`, `pricing.ts`.
- API/persistence: `packages/api-service/src/operatingWorkbookRoutes.ts`, API registration/startup; `packages/case-repository/src/operatingWorkbookGateway.ts` and existing gateway projection.
- Data: `data/synthetic-revops/`, `data/public-rates/`; reproducible read-only extraction in `scripts/extract-operating-workbook.py`.
- Tests: `tests/unit/operating-workbook.test.ts`, `tests/unit/rev-ops-pricing.test.ts`, `tests/integration/operating-workbook.test.ts`.

The implementation extends the existing tenant-scoped `RevOpsWorkspace.state` and append-only `RevOpsChange` journal. It adds no parallel authentication system or new database migration. The operating dataset is fetched through its authenticated route, not returned by the aggregate workspace-list projection. Imported source records and original formula/report snapshots remain distinguishable from platform additions and recalculated summaries.

## Verification

- 34 operating engine tests passed, including 47 numeric metrics × 13 periods = **611 matching comparisons**.
- 18 financial scenario/source tests passed. All 1,126 normalized Louisiana rows were independently compared to the archived official workbooks, including effective dates and integer cents.
- Three real-database authenticated integration tests passed: load/no-overwrite, accountable edit/reload, preserved snapshots, stale revisions, existing command compatibility, tenant isolation, delegated reads/admin writes, immutable receipts, durable registry additions and duplicate rejection.
- All 94 frontend tests passed, including 11 operating UI tests.
- Full repository TypeScript check, ESLint and app build passed. Vite retains a 500 kB chunk advisory: the initial JavaScript chunk is 551.11 kB (152.98 kB gzip); payment tools load separately at 281.89 kB (26.93 kB gzip). No database schema change was made; migration validation and the entire backend regression suite were not rerun.
- All 10 existing dedicated RevOps browser journeys passed (five desktop, five mobile; 1.6 minutes). Their sign-in helper now explicitly selects Comparison and the February 2028 scenario instead of relying on the former default screen/year. Assertions for leap-day completeness, reconciliation, access revocation, corrections, close/export and custom-field history remain intact. Command: `cd app && npm run smoke -- --config playwright.revops.config.ts`.
- Live desktop/mobile inspection verified populated annual data, month filtering, horizontally scrollable tables, a usable correction dialog, budget edit/reload/reversal, saved January report, a new synthetic PPO registry record, and the Medicare base-component result for scenario wage index 1. The synthetic budget was restored to its accepted value after the test.

Review reproduced and corrected blank ancillary cost reducing invoice balances, blank hours becoming zero, coverage status failing to invalidate financial totals, and percentage inputs accepting whole percentages as fractions. Their regression cases pass. Coordinated UR edits remain possible; inconsistent day buckets produce a visible exception until reconciled.

## Decisions and tradeoffs

This is an implemented local operating slice, not a declaration of full F01–F30/X01–X04 parity. Original formula columns and nine detailed reports remain source snapshots; the operational summaries recalculate. Existing aggregate census/staffing close controls are retained as their own workflow. An operating report snapshot preserves results and issues and does **not** close a financial period.

The current synthetic dataset uses the existing JSON workspace persistence pattern. Pagination/search are client-side after authorized loading. Production-scale indexing, concurrency/load benchmarks, normalized record storage and broad performance claims remain unverified. A successful app build is not production readiness.

The local demonstration workspace received a metadata-only update after extraction field types were corrected. Existing values, prior correction history and the saved report were preserved; the schema update was separately recorded in the revision journal.

## Remaining work and next move

The owner-selected Louisiana hospital's provider IDs and applicable facility inputs are still pending. Full IPF/FY2027/OPPS/IOP/SBH pricing, verified financial-rate application to service records, patient benefit liability and private commercial terms remain incomplete. Payer registry and synthetic applied-contract records persist; the separate public/contract scenario forms are session-only and provide JSON evidence export.

New encounter/visit/staffing entry flows, signed receipt posting/reversals/reallocations, consolidated financial close, independent IOP audit integration, full benefit/assistance/geographic/report parity and generalized future-year ingestion remain MVP work. No source-system connection or production deployment is claimed.

Next: bind the supplied hospital identifiers to the sourced payment profile, then implement and independently verify the next complete payment method before applying those results to operating service records.

## Prompt lesson

Acceptance authorizes implementation; a scope banner does not implement a workflow. New claims must link working screens, persisted records, calculation behavior and test evidence.
