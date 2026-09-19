---
status: proposed disposition ledger
owner: Tyler Hebert / product owner
last_verified: 2026-09-19
verification_commit: 8da2f1533e7e36c3fec980ab39b46cf57d4bf613
---

# Worktree disposition ledger

## Scope

This is a read-only inventory and recommended disposition for every registered
Clarity worktree observed on 2026-09-19. It preserves work. It does not delete
a branch, remove a worktree, change an upstream, or decide which historical
packet should be integrated.

`CLEAN` means no Git-tracked or untracked files were returned by
`git status --porcelain` at the snapshot. It does not mean current, reviewed,
merged, or safe to remove.

| ID | Location / branch | SHA | Observed state | Disposition and next action |
|---|---|---|---|---|
| W01 | Shared checkout — `claude/slice-3-journey-phase` | `49dccd2` | `.codex/` contains only local environment registrations (`version`, `name`, and `script`); no repository references or sensitive-pattern matches were observed | **Local runtime state selected.** The narrow `/.codex/environments/` ignore rule prevents it from entering source control. |
| W02 | Coordination worktree — `codex/om/coordination-baseline` | current PR #113 head | Clean | **Active.** Keep through PR #113 review and merge; remove only by a later explicit cleanup action. |
| W03 | `/private/tmp/clarity-clpr-post-merge-acceptance` — `codex/om/clpr-post-merge-acceptance` | `7afe508` | Clean, old baseline | **Parked reference.** Verify its PR/merge coverage before any retirement. |
| W04 | `/private/tmp/clarity-iop-production-readiness` — `codex/om/iop-production-readiness` | `7afe508` | Clean, old baseline | **Parked reference.** Recover only a reviewed patch for an approved synthetic IOP package. |
| W05 | `/private/tmp/clarity-pr97-fix` — local `main` | `7afe508` | Clean, stale local main | **Parked.** Do not treat as canonical `main`; remove only after owner confirms it has no retained local purpose. |
| W06 | `/private/tmp/clarity-synthetic-p2` — `codex/om/synthetic-iop-p2-records` | `0cf273d` | Clean, old baseline | **Parked reference.** Reconcile against accepted P2 evidence before any patch recovery. |
| W07 | Antigravity checkout — `initialize_worktree` | `7afe508` | Clean | **Parked external-tool lane.** No reuse or mutation without a handoff card. |
| W08 | Claude `kind-feistel-35b3d1` — `claude/transition-matrix-repo-trace-1560e5` | `7afe508` | Clean | **Parked reference.** Its name suggests research only; purpose remains `[Unknown]`. |
| W09 | Claude `local-branch-maintenance-661f22` | `7afe508` | Clean | **Parked maintenance reference.** Do not run cleanup from it. |
| W10 | Claude `nice-leavitt-39bae7` — detached | `7afe508` | Clean | **Parked detached checkout.** Require owner confirmation before removal. |
| W11 | Claude `phase3b-test-isolation` — `claude/phase3b-gate-b` | `7afe508` | Clean | **Parked evidence reference.** Keep while historical Gate B evidence is cited. |
| W12 | Claude `recursing-goldwasser-0189a9` — `claude/munnder-diffline-familiarize-17e3d9` | `7afe508` | Clean | **Parked Munnder lane.** Assign a bounded implementer/verifier role before reuse. |
| W13 | `/Users/tylerhebert/Documents/worktrees/clarity-docs` — detached | `7afe508` | Clean | **Parked detached checkout.** Purpose is `[Unknown]`; retain pending owner review. |
| W14 | `/Users/tylerhebert/Documents/worktrees/clarity-floor` — detached | `7afe508` | Clean | **Parked detached checkout.** Purpose is `[Unknown]`; retain pending owner review. |
| W15 | Product definition reconciliation — `codex/om/product-definition-reconciliation` | `334e90d` | Clean | **Parked reference.** This is a separate product-definition packet and must not be folded into RevOps or Access work without a decision. |
| W16 | `/Users/tylerhebert/Documents/worktrees/clarity-verify` — detached | `7afe508` | Clean | **Parked verification checkout.** Retain until owner confirms no current verification run depends on it. |

## W01 disposition evidence

The owner selected the local-runtime-artifact disposition. The three-file
`.codex/environments/` directory contains only `version`, `name`, and `script`
keys; no repository references or sensitive-pattern matches were observed. The
files are intentionally not copied into this ledger. The narrow ignore rule is
limited to `/.codex/environments/`, so a future repository-owned `.codex/`
artifact is not silently hidden.

## Retirement gate

A future cleanup package may retire a worktree only when it records all of:

- exact path, branch or detached SHA, and upstream;
- clean status captured immediately before removal;
- PR, merge, recovery-ref, or owner decision proving the retained value is
  elsewhere;
- confirmation that no active task or local tool session owns the checkout; and
- the removal command and post-removal `git worktree list` evidence.

Until then, the safe disposition is **parked**, not deleted.
