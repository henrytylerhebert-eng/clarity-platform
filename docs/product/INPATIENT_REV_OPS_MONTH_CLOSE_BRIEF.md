# Rev Ops — month-end readiness and accountable close

Status: owner-approved, implemented and locally verified with synthetic data,
September 7, 2026; pending code review and merge. Baseline: PR #51
merge `dc43505`. Synthetic-only. This brief authorizes one bounded workflow;
merge, deployment and expansion remain separate decisions.

## Goal and workflow

For one hospital/unit and month: inspect full-month readiness and an approved
budget, resolve missing census dates by manual entry or upload, close with a
reason, inspect the fixed receipt, reopen with a reason, correct and close again.
Every closing preserves the previous receipt.

## Approved rules and implementation choices

- Use the actual calendar: 28/29-day February, 30/31-day months. Reuse existing
  month-length and facility-midnight conventions. Never count a missing day as zero.
- Require one actual for every calendar date and an approved budget. The report's
  partial cutoff does not shorten the close requirement. Explicit zero is valid.
- Allow selection of any approved budget version for that month; default to the
  latest approved version. The UI submits the reviewed budget ID and workspace
  revision. Draft, foreign-month and nonexistent budgets cannot be selected.
- Recheck current tenant/workspace permissions, completeness, budget and revision
  on the server. Existing `periodClose` and `periodReopen` permissions apply.
- A close reason and reopen reason are required (trimmed 3–1,000 characters).
  Closing captures actuals and their revision/source snapshots, the entire
  selected approved budget, variance, actor/time/reason, unit/timezone, workspace
  revision and closing sequence. Save the closed state and receipt atomically.
- Reopening does not modify receipts. A later close captures a new version and
  links the previous closing revision. Existing write locks and import replay
  behavior remain intact. A fresh retry of an already-closed month returns the
  existing receipt without creating another; stale writes remain rejected.
- Legacy closed periods remain closed and readable with an explicit missing-receipt
  label; do not manufacture historical snapshots. Reopen/reclose follows new rules.
- No new endpoint, database schema, migration or dependency was added. Extend the
  existing comparison and command contracts, domain service and append-only journal.
  Readiness is live information; a saved closing receipt is historical evidence.

## Synthetic acceptance and verification

February 2028 requires 29 dates. With 28 dates recorded at 10 each and February 29
missing, known total is 280 but close is blocked. Record February 29 as zero;
close against budget 290 produces actuals 280 and variance -10. Reopen, correct
February 29 to five and close again: 285, variance -5, with the first receipt
unchanged. February 2027 requires exactly 28 dates. Also cover 30/31-day months,
valid February 29 in 2000, invalid dates, daily target lengths and sums.

Exercise unauthorized and cross-tenant access, forged receipt fields, missing or
unapproved budgets, stale views after corrections/approval/grant changes, concurrent
closes, injected journal failure after workspace update, repeat close, legacy closed
periods, reopen and preserved snapshots after changes. Prove UI/API/DB/restart
behavior and readable desktop/mobile receipts. Run focused tests then root/app,
lint, typecheck, build and the dedicated Rev Ops browser suite.

## Non-goals and completion

No forecasts, collections, episode counting, rollups, exports, new field types,
production identity or data, deployment, calendar exceptions or CI maintenance.
No measurements found for efficiency or error reduction. Complete when the
bounded workflow has recorded passing evidence and a reviewable draft PR.

Evidence: [verification record](../testing/REV_OPS_MONTH_CLOSE_VERIFICATION.md).
