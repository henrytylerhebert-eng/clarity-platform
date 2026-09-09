# Workbook Platform Resume Handoff — 2026-09-08

## Current handoff — updated 2026-09-09

Tyler accepted the Dunder Mifflin workbook and authorized MVP/interface updates, full workbook parity, and real financial-rate implementation. The [acceptance record](../product/RESTORED_WORKBOOK_ACCEPTANCE.md) closes the prior baseline gate. Proceed with development; do not request acceptance again.

The [build plan](../roadmap/WORKBOOK_BASELINE_IOP_REVIEW_BUILD_PLAN.md) retains the synthetic persisted IOP review increment and permits parallel official-rate sourcing and calculation implementation. All mapped parity gaps remain in the authorized MVP scope.

## Checkout state recorded at the September 8 stop

- Main checkout: `/Users/tylerhebert/Documents/clarity-platform`, branch `codex/om/iop-source-adapter-decision`, commit `a44596a4704ca1039ac6c639fe5963f5c911b0d3`.
- Main checkout has user-owned edits to implementation, decision, workbook, roadmap, and reference artifacts. Do not overwrite or revert them.
- Planning worktree: `/Users/tylerhebert/.codex/worktrees/clarity-workbook-platform-map`, branch `codex/om/workbook-platform-map`, based on the same commit.
- The planning artifacts were subsequently committed as `0b48655c06bb37eba5d9947b4f6fda2945e4cd82`; the MVP definition/interface update followed as `eb8be0831daed8cce84bbc81bb3cd727a11e3669`. Verify current HEAD and dirty state before resuming; these are historical pointers, not a current cleanliness claim.

## Established facts

- The accepted workbook hash is `6e81bd61950c244e607ed03f8b0f13e1a4d0bea366ee7ad7cc54c053ef90de26`; the September 9 read-only hash check matches it.
- Earlier native mutation evidence belongs to a different workbook hash. Native recalculation/reopen/mutation tests have not been rerun in the acceptance update. That verification gap does not reverse the owner's acceptance or prohibit development.
- Structural map validation passed: 34 functions, 24 records, 39 workbook rules, 40 acceptance scenarios, and 62 physical sheets. Runtime tests were not rerun during mapping.
- The IOP client is a local preview surface. The separate API and persistence layers exist, but the visible UI does not yet invoke the persisted review workflow.
- Current IOP hardening gaps include program-to-snapshot authorization, program-level tenant enforcement, server-derived close identity in the client path, and approved reopen/supersession behavior.

## Boundaries for the next session

- Synthetic patient and operating fixtures only. Official financial-rate references and deterministic calculations are now authorized. Private payer contracts and facility factors must be supplied or remain explicit missing inputs.
- Do not add PHI or assert a production deployment.
- Preserve the distinction between activity, documentation audit, charge linkage, budget, forecast, collections, and actuals.
- Workbook acceptance is complete. Remaining real source-system connection and production/privacy decisions apply only to those effects.

## First actions on resume

```bash
cd /Users/tylerhebert/.codex/worktrees/clarity-workbook-platform-map
git status --short --branch
git rev-parse HEAD
sed -n '1,240p' docs/roadmap/WORKBOOK_BASELINE_IOP_REVIEW_BUILD_PLAN.md
sed -n '1,220p' docs/product/WORKBOOK_TO_PLATFORM_WORKFLOW_MAP.md
```

Then read the current acceptance record and implement the next work package with focused verification. Keep the IOP and financial lanes coordinated through the shared function map; do not promote unimplemented parity to complete.
