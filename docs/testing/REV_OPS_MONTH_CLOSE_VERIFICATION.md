# Rev Ops month-end readiness and closing verification

Date: September 7, 2026. Branch: `codex/om/rev-ops-month-close`.
Code commits: `7ac7454` (backend/contracts/tests), `9c71155` (UI/browser tests).
Base: PR #51 merge `dc43505a49a3616b59c3dfc9c8fe838439a6fe9f`.
Status: implemented and locally verified with synthetic data; pending code review
and owner merge decision. No production deployment or cutover approval.
Scope: [owner-approved brief](../product/INPATIENT_REV_OPS_MONTH_CLOSE_BRIEF.md).

## Implemented workflow and boundaries

A reviewer selects a hospital/unit, month and approved budget. Full-month readiness
shows the actual calendar length, recorded and missing dates, known activity,
approved budget and variance. A partial report cutoff cannot shorten the close
requirement. Zero is recorded activity; missing remains missing. Closing requires
all dates and an approved budget, with existing period-close permission and a
trimmed reason. The UI submits the reviewed budget ID and workspace revision.

The server recomputes readiness, checks tenant/permissions and uses the existing
revision guard. Closed state and a fixed receipt are written in one transaction.
The receipt freezes the selected budget, daily actual/source/field snapshots,
actual revision ordinals, total/variance, unit/timezone, actor/time/reason and
closing sequence. Reopening preserves every receipt; closing again creates a new
receipt linked to the previous closing revision. A fresh repeat close returns the
existing receipt without another write; stale submissions still reject.

The existing journal stores receipts; no schema, migration, endpoint, service
package or dependency was added. Comparison reads restrict receipt revision to the
workspace revision read in that transaction. The history view renders prior
receipts. Legacy closed periods remain readable without fabricated receipts;
reopen/reclose requires current readiness. Accepted import replay remains unchanged.
Budget, actual activity, forecast and collections remain separate.

## Passing checks

All database commands used the isolated synthetic loopback `clarity_dev` database
on port 55439. No production database or real hospital records were accessed.

| Command/check | Result |
|---|---|
| `DATABASE_URL=<isolated URL> npm test` | 512 tests / 48 files passed. |
| `npm --workspace app test` | 76 tests / 13 files passed. |
| `API_PORT=4316 npx playwright test --config app/playwright.revops.config.ts` | Ten desktop/mobile journeys passed, including month close and all eight existing Rev Ops journeys. |
| `npm run lint` / `npm run typecheck` | Passed; root and app types checked. |
| `npm --workspace app run build` | Passed. |
| `DATABASE_URL=<isolated URL> npm run prisma:validate` | Passed; no schema or migration change. |
| `npm audit --audit-level=high` | Zero vulnerabilities. |
| `git diff --check` / staged Gitleaks | Passed / no leaks found. |

Calendar cases cover February 2027 (28), February 2028 (29), February 2000 (29),
April (30) and January (31), plus impossible dates and invalid daily-target length.
Existing facility-midnight/DST tests remain passing. Readiness, budget target
lengths/sums and closing use the existing calendar function.

The synthetic leap-month case initially records 28 dates at ten days each:
known actuals 280, February 29 missing, close blocked even though the seven-day
comparison is complete. A recorded zero completes the month. Closing against
budget 290 produces actuals 280, variance -10, receipt #1. Reopen, correct February
29 to five and close against the same approved budget: 285, variance -5, receipt
#2. The original receipt remains exactly unchanged, including original custom
field labels/values after a definition rename. An alternative approved budget
of 300 does not change the explicitly selected closing budget of 290.

API regressions verify missing/draft/unknown budgets, missing dates, entry-only
and cross-tenant denial, forged receipt/actor/totals, stale corrections and budget
approvals, changed grants, revoked access, concurrent closes, period write locks,
reopen authority, repeat close and legacy periods. Failure injection observes a
successful database workspace update then fails closing-receipt creation; the
whole state and journal roll back, and retry produces receipt #1. No partial
closed flag or accepted receipt survives failure.

Client tests verify reasons, selected budget/revision, missing-day/budget gates,
stale/permission gates, legacy labeling, historical snapshots, and removal of the
previous close review while a newly selected budget loads. Browser checks exercise
upload of 28 dates, manual zero, close, reopen, correction, second close, replay,
ordinary February, reload and historical receipt inspection. Screenshots were
visually inspected; no browser errors or mobile overflow were reported.

## Debugging and compatibility

Initial typechecking found readonly test-command arrays and an incomplete synthetic
principal fixture; both fixtures were corrected. A mobile browser run exposed a
selection/loading race: the old close form remained briefly while the approved
budget changed, then reset the entered reason. The UI now immediately clears the
comparison/close review on hospital, month or budget selection. A client regression
and the final desktop/mobile journeys pass with this behavior.

Older lock/replay tests deliberately closed partial months. Their fixtures now
explicitly record the remaining dates and approve a budget before exercising the
lock. The reconciliation browser case uses a grant change to exercise stale
preview rejection without closing an incomplete month. The dedicated month-close
journey and API cases now cover close/reopen staleness and completeness.

The original unmodified four-sheet fictional Scranton–Pawnee XLSX also passed a
fresh upload/approval/correction/replay run in workspace
`cmtrnmvs40007svg9aqpi6pnv`: budget 290, actuals 70 then 71, retained source/history,
reload and fresh API read; no browser errors or mobile overflow. The incomplete
month remains open under the new rule. Proof: `month-close-original-sample/` and
`month-close-original-sample.log` in the same local proof directory.

## Restart evidence

A real API stop/restart preserved complete workspace, journal, leap-month and
ordinary-February comparison/receipt objects for both completed browser workspaces:

| Workspace | Workspace revision | History entries | February 2028 receipt | February 2027 receipt |
|---|---:|---:|---:|---:|
| `cmtrnlalx003vsvndtt3rzf7k` (desktop) | 14 | 14 | revision 10, close #2 | revision 14, close #1 |
| `cmtrnlkn6008dsvndylb9eu2l` (mobile) | 14 | 14 | revision 10, close #2 | revision 14, close #1 |

Each original leap-month receipt remains in history at revision 7. Four fresh
repeat-close requests after restart returned the original receipts and made no
state or journal changes. A separate integration check used a fresh Prisma client.

Local proof is outside Git at
`/Users/tylerhebert/Documents/Clarity-RevOps-Local-Proof/2026-09-07`:
`month-close-root-tests.log`, `month-close-browser.log`,
`month-close-full-browser/`, `month-close-restart-before.json`,
`month-close-restart-after.json`, and `month-close-restart.mjs`.
No workbook binary, browser trace or session token is committed.

## Review and remaining gates

Review the stricter close rule, selected-budget/revision binding, transaction and
receipt snapshots, legacy behavior and permissions before merging. The draft PR
records staged secret scanning and final-head CI. No migration recovery rerun is
needed because the schema/migrations are unchanged. The unrelated broad app smoke
suite was not rerun; all dedicated Rev Ops journeys and root/app suites passed.

This proof does not establish production identity, provider connectivity, PHI
readiness, production load or hospital cutover. No measurements found for time
saved, error reduction or scale. Calendar exceptions, future-period restrictions,
exports, forecasts, collections and further expansion remain outside this slice.
