# Local Branch Maintenance Plan


> **PRESERVATION NOTE — added 2026-09-18 (Housekeeping Phase 1).** Authored
> 2026-09-17 in an untracked working tree; committed to Git for the first time on
> 2026-09-18. **Not executed.** Its recovery prerequisite is now satisfied — see the
> preservation note in
> [`MACHINE_ONLY_BRANCH_RECOVERY_PLAN_2026-09-17.md`](MACHINE_ONLY_BRANCH_RECOVERY_PLAN_2026-09-17.md).
> The branch counts below are a 2026-09-17 snapshot and are already stale: a
> 2026-09-18 audit counted 64 local branches and 99 remote branches. Refresh every
> count before acting. Branch disposition is **Housekeeping Phase 2** and is not
> authorized by this document.

**Status:** Plan only; no branches changed by this document.
**Snapshot date:** 2026-09-17. Branch counts below use local `origin/*` tracking refs and must be refreshed before acting.

> **Recovery prerequisite:** Execute and verify [MACHINE_ONLY_BRANCH_RECOVERY_PLAN_2026-09-17.md](MACHINE_ONLY_BRANCH_RECOVERY_PLAN_2026-09-17.md) before any rebase, fast-forward, or branch cleanup in this plan. The machine-only patch risk takes priority over lag maintenance.

## Goal

Reconcile local branch state without losing useful work, rewriting shared history unexpectedly, or creating overlapping Claude work. The initial scan found **63 local branches**: **19 behind** their configured upstream, **13 with no upstream**, and **1 whose configured upstream is gone**. The behind count is not a rebase count.

## Working rules

- Start with a non-mutating inventory of the repository, branch, HEAD, every linked worktree, remotes, and upstream configuration. Then run `git fetch origin` once to refresh local tracking refs; do not use `git fetch --prune` for this pass.
- Refresh the branch ledger after fetch. Record for each branch: upstream, ahead/behind counts, worktree path and cleanliness, unique commits, whether the unique content is already upstream, active PR/review state if available, intended owner/use, and proposed disposition.
- Classify each branch as **fast-forward**, **rebase candidate**, **keep as-is**, **archive candidate**, **gone-upstream review**, or **needs owner decision**. A behind-only branch is generally a fast-forward candidate, not a rebase. No-upstream branches are not comparable until their intended base is identified.
- Inspect the unique commits and active PR/review state before rebasing any diverged branch. A branch name or commit message alone does not prove that work is still wanted.
- Keep the current marketing worktree's untracked `docs/architecture/CLARITY_PLATFORM_TREE.md` and `docs/planning/WORK_TO_BE_DONE.md` intact. The `main` branch is checked out separately at `/private/tmp/clarity-pr97-fix`; inspect that worktree and its purpose before updating it. The `codex/om/synthetic-iop-p2-records` worktree has a modification to `prisma/assurance.prisma`; do not disturb it.
- Do not run `reset --hard`, `clean`, automatic stash, branch deletion, remote deletion, push, or force push as part of this plan. Do not commit or stage this plan or unrelated files.
- Before any local rebase, create a named backup ref for the branch's current commit. Rebase only clean, still-wanted branches, one at a time, in the branch's existing worktree or a dedicated clean worktree. No two workers may mutate Git refs or share a worktree concurrently.
- If a branch is dirty, checked out in an uninspected worktree, has an active/shared review, has an unclear base, or hits a conflict with unclear resolution, record the blocker and leave it unchanged. Continue independent branches.
- Validate each action with status, branch/upstream relation, commit graph, and diff review. Run focused tests only when a rebase changes code or resolves code conflicts. Do not infer PR merge, push, or remote synchronization from a local rebase.

## Initial queue from the local snapshot

This is a review order, not authorization to rewrite every branch. Refresh the facts first.

### First: protect active work and establish the base

1. `claude/clarity-marketing-strategy-a135e7` — current worktree; 1 ahead / 11 behind. Preserve the two untracked documents above; inspect the one unique commit and review state before deciding whether to rebase.
2. `main` — 6 behind `origin/main`, checked out in `/private/tmp/clarity-pr97-fix` and clean at the last inspection. Confirm the worktree's purpose; if still appropriate, fast-forward only. Never rebase `main`.

### Next: inspect diverged branches (8 total, including the current branch above)

Each has one local commit and is behind its recorded base. Identify its unique commit and PR/review state before deciding whether it remains active. If evidence confirms the work is still wanted and the branch is safe to rewrite locally, back it up and rebase it separately.

| Branch | Upstream | Ahead / behind |
|---|---|---:|
| `codex/om/prescreen-source-package-fix` | `origin/codex/om/prescreen-source-package-fix` | 1 / 10 |
| `codex/om/admission-replay-active-check` | `origin/codex/om/admission-replay-active-check` | 1 / 14 |
| `codex/om/admission-race-fix-review` | `origin/codex/om/sync-main` | 1 / 80 |
| `codex/om/directory-crm-prototype` | `origin/codex/om/sync-main` | 1 / 80 |
| `codex/om/operations-backbone-review` | `origin/codex/om/sync-main` | 1 / 80 |
| `codex/om/prescreen-contract-review` | `origin/codex/om/sync-main` | 1 / 80 |
| `codex/om/clarity-worktree-review-hold` | `origin/main` | 1 / 178 |

The seven branches in the table plus the current marketing branch above make eight diverged branches in total. The four branches tracking `origin/codex/om/sync-main` are separate work items. Compare each unique commit independently; do not treat them as one shared branch or rebase them as a batch.

### Then: fast-forward or leave the other 10 behind-only branches

These, plus `main` above, showed no local commits ahead of the configured upstream (11 behind-only branches total), so rebasing is not indicated. If still needed, fast-forward only after confirming the branch/worktree is safe to update. If stale or superseded, leave it unchanged and recommend archive review instead.

| Branch | Upstream | Behind |
|---|---|---:|
| `chore/ai-operating-model-stage0` | `origin/chore/ai-operating-model-stage0` | 8 |
| `claude/prescreen-phase3-persistence` | `origin/claude/prescreen-phase3-persistence` | 10 |
| `codex/om/network-enrichment-contract-kernel` | `origin/codex/om/network-enrichment-contract-kernel` | 18 |
| `codex/om/api-path-role-recovery` | `origin/codex/om/api-path-role-recovery` | 42 |
| `codex/om/graphify-local-artifacts` | `origin/codex/om/graphify-local-artifacts` | 47 |
| `codex/om/ephemeral-verification-recovery` | `origin/codex/om/ephemeral-verification-recovery` | 52 |
| `codex/om/housekeeping-recovery-record` | `origin/codex/om/housekeeping-recovery-record` | 56 |
| `claude/clarity-housekeeping-handoff-2c1e00` | `origin/claude/clarity-housekeeping-handoff-2c1e00` | 60 |
| `codex/drive-pattern-parking-lot` | `origin/main` | 179 |
| `codex/ai-agent-readiness` | `origin/main` | 185 |

The two very old branches based on `origin/main` should get PR/unique-commit review before deciding to fast-forward or retain them. A numerical lag alone is not a reason to rebase.

## Other branches to reconcile

- `docs/session-close-2026-07-29` tracks a deleted remote branch (`[gone]`). Inspect its unique commits and PR/history; keep it or propose archiving it. Do not recreate the remote automatically.
- These 13 branches have no configured upstream and were not included in the behind count: `claude/ai-operating-model-handoff-7c884e`, `claude/clarity-build-to-goal-operating-doc-011dc7`, `claude/commercial-deployment-package-e32784`, `claude/graphify-progress-review-f535e6`, `claude/platform-tree-architecture-audit-794b95`, `claude/repo-product-intelligence-a4a509`, `codex/claritymarketingmanualskillsandtraining`, `codex/om/bridge-memory-visualizer`, `codex/om/directory-operations`, `codex/om/journey-poc`, `codex/om/prescreen-integration`, `codex/om/scope-ledger`, and `pr-84-review`. Identify their base and purpose from commit graph, worktree, and PR evidence; do not guess an upstream.
- Branches that are equal to or ahead of their upstream are outside this lag queue. Include them in the inventory for preservation, but do not change them just to make the counts uniform.

## Claude collaboration plan

Use one coordinator and a single shared branch ledger. After one fetch and a frozen inventory snapshot, if parallel agents are available, assign **read-only audits only**:

1. **Active worktrees:** current marketing branch, `main`, and status/purpose of every linked worktree, with special care for dirty worktrees listed above.
2. **Diverged branches:** inspect the eight unique commits, their bases, and PR/review state; report rebase / keep / owner-decision recommendations branch by branch.
3. **Behind-only and exceptional branches:** inspect the 11 behind-only branches, the gone-upstream branch, and 13 no-upstream branches; recommend fast-forward / keep / archive / base-identification actions.

Each auditor returns evidence and proposed dispositions to the coordinator; auditors do not edit files, switch branches, rebase, move refs, or push. The coordinator reconciles duplicate or conflicting findings in the ledger. After audit, the coordinator alone performs supported local fast-forwards or rebases, **serially**, using one clean worktree per branch. If Claude cannot delegate, use these same three read-only passes sequentially. This avoids parallel Git mutations and overlapping ownership.

## Completion record

For every branch, report: starting and ending SHA, upstream/base, initial and final ahead/behind state, worktree path/status, disposition, backup-ref name if rewritten, unique commits preserved, conflicts and their resolution, focused verification, PR/review state, and any remaining owner decision. Explicitly separate completed local updates from pushes, merges, deletions, or archive decisions; none of those external or destructive actions is included here.

## Copy/paste handoff for Claude

> Follow `docs/planning/LOCAL_BRANCH_MAINTENANCE_PLAN_2026-09-17.md`. First do the fresh inventory and read-only classification; the recorded counts may be stale. Preserve all dirty/untracked work and inspect every linked worktree. Use the collaboration plan: parallelize only disjoint read-only audits, then have one coordinator maintain the ledger and perform local fast-forwards/rebases one branch at a time. Rebase only a clean, still-wanted diverged branch after reviewing its unique commit and PR/review context; back up its original ref first. Fast-forward behind-only branches only when they are still needed and safe. Do not rebase `main`, and do not push, force-push, merge, delete, prune, reset, clean, or stash. Leave unclear, dirty, shared, stale, and conflicted branches unchanged and document the reason. Finish with the per-branch completion record and a compact summary of what changed locally, what remains, and checks performed.
