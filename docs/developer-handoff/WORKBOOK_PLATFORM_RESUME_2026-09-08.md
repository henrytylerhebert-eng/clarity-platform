# Workbook Platform Resume Handoff — 2026-09-08

## Stop point

Planning is complete for tonight. No runtime implementation was started.

The next bounded build is documented in [WORKBOOK_BASELINE_IOP_REVIEW_BUILD_PLAN.md](../roadmap/WORKBOOK_BASELINE_IOP_REVIEW_BUILD_PLAN.md): accept the exact workbook baseline first, then build a synthetic persisted IOP review flow.

## Checkout state

- Main checkout: `/Users/tylerhebert/Documents/clarity-platform`, branch `codex/om/iop-source-adapter-decision`, commit `a44596a4704ca1039ac6c639fe5963f5c911b0d3`.
- Main checkout has user-owned edits to implementation, decision, workbook, roadmap, and reference artifacts. Do not overwrite or revert them.
- Planning worktree: `/Users/tylerhebert/.codex/worktrees/clarity-workbook-platform-map`, branch `codex/om/workbook-platform-map`, based on the same commit.
- The planning worktree contains the workbook map, evidence exports, acceptance matrix, build plan, and this handoff. It is intentionally uncommitted.

## Established facts

- The current candidate workbook hash is `6e81bd61950c244e607ed03f8b0f13e1a4d0bea366ee7ad7cc54c053ef90de26`.
- Earlier native mutation evidence belongs to a different workbook hash. The candidate must be recalculated, reopened, and mutation-tested before acceptance.
- Structural map validation passed: 34 functions, 24 records, 39 workbook rules, 40 acceptance scenarios, and 62 physical sheets. Runtime tests were not rerun during mapping.
- The IOP client is a local preview surface. The separate API and persistence layers exist, but the visible UI does not yet invoke the persisted review workflow.
- Current IOP hardening gaps include program-to-snapshot authorization, program-level tenant enforcement, server-derived close identity in the client path, and approved reopen/supersession behavior.

## Boundaries for the next session

- Synthetic fixtures only. Do not add real connector, credential, or import behavior.
- Do not add PHI or assert a production deployment.
- Preserve the distinction between activity, documentation audit, charge linkage, budget, forecast, collections, and actuals.
- Begin with Gate 0 in the build plan. Do not call the workbook baseline accepted until the hash mismatch is resolved.

## First actions on resume

```bash
cd /Users/tylerhebert/.codex/worktrees/clarity-workbook-platform-map
git status --short --branch
git rev-parse HEAD
sed -n '1,240p' docs/roadmap/WORKBOOK_BASELINE_IOP_REVIEW_BUILD_PLAN.md
sed -n '1,220p' docs/product/WORKBOOK_TO_PLATFORM_WORKFLOW_MAP.md
```

Then review the concurrent restored-workbook acceptance packet in the main checkout, resolve Gate 0, and select the first work package before changing code.
