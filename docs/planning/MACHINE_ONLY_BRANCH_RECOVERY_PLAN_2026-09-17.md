# Machine-Only Branch Recovery Plan


> **PRESERVATION NOTE — added 2026-09-18 (Housekeeping Phase 1).** Authored
> 2026-09-17 in an untracked working tree; committed to Git for the first time on
> 2026-09-18. **This plan has since been executed.** All eight
> `recovery/machine-only/2026-09-17/*` refs were verified present on `origin` on
> 2026-09-18, and each listed source branch tip is reachable from its recovery ref.
> **Do not re-run the Phase 1 push.** Retained as the execution record and as the
> method reference (stable patch-ID comparison) for future machine-only audits.
> Never delete the `recovery/machine-only/*` refs. Context:
> [`../recovery/2026-09-18-housekeeping-phase-1-truth-reconciliation.md`](../recovery/2026-09-18-housekeeping-phase-1-truth-reconciliation.md).

**Status:** Execution plan for Claude. This document does not authorize merge, deployment, branch deletion beyond the named contained branch, or force-push.

**Primary objective:** Make all 8 machine-only branch tips, covering 26 branch-patch occurrences and 18 unique machine-only patch identities, durable on `origin` before branch maintenance continues.

**Repository:** `/Users/tylerhebert/Documents/clarity-platform`

**Verified local state at planning time:** `claude/clarity-marketing-strategy-a135e7` at `5f22f6ea83f344335007e004cb3591cd1a3d9384`, with three untracked planning/architecture files. Other linked worktrees exist, including active Claude and temporary worktrees. Treat all worktree content as owned and preserve it.

## Why this is first

Stable patch-ID comparison found **26 branch-patch occurrences across 8 local branches that are not represented by any `origin/*` ref**. Because the packet branches share scope-ledger ancestry, those occurrences represent **18 unique commits/patch identities**. A disk loss would remove all eight packet tips. This is a durability problem before it is a rebase or cleanup problem.

Raw `git rev-list` counts can be higher because a local commit may have a different SHA while its patch is already present remotely. Use stable patch IDs for the 18-unique-patch acceptance check, branch-specific coverage for the 26 occurrences, and exact branch-tip SHAs for the backup-ref acceptance check.

## Frozen recovery ledger

| Local source branch | Machine-only patches | Patch commit SHAs |
|---|---:|---|
| `claude/clarity-build-to-goal-operating-doc-011dc7` | 2 | `7037e76`, `5f1f081` |
| `codex/claritymarketingmanualskillsandtraining` | 1 | `1bfd783` |
| `codex/om/bridge-memory-visualizer` | 5 | `9650879`, `83b7b21`, `1ad3fc9`, `91bef08`, `aa1ba1a` |
| `codex/om/directory-operations` | 4 | `990da94`, `170a6b1`, `91bef08`, `aa1ba1a` |
| `codex/om/journey-poc` | 5 | `33b7412`, `52f29d4`, `ecdc56a`, `91bef08`, `aa1ba1a` |
| `codex/om/prescreen-integration` | 4 | `30dae23`, `e63acdd`, `91bef08`, `aa1ba1a` |
| `codex/om/scope-ledger` | 3 | `dec1bdb`, `91bef08`, `aa1ba1a` |
| `codex/om/sync-main` | 2 | `49637a9`, `8c3d02d` |

The rows total 26 patch occurrences and 18 unique commits/patch identities. Shared commits `91bef08` and `aa1ba1a` appear in several branch histories; the stable patch check and branch-tip backup verification must both pass. Do not collapse the branch backups merely because some ancestry is shared: each tip preserves a different packet boundary.

## Collaboration ownership

Use one Claude coordinator as the only actor allowed to fetch, create remote refs, change branch configuration, or delete the named archive candidate. Parallel agents may perform read-only audits after the coordinator freezes the initial ledger:

1. **Recovery verifier:** Recompute stable patch IDs, source tip SHAs, and proposed destination refs. Check GitHub workflow push filters and report whether creating recovery refs will trigger CI.
2. **Branch-context reviewer:** Check PR and merge history for the eight source branches, especially PR #30 and `codex/om/sync-main`. Recommend later integration paths without changing refs.
3. **Worktree and cleanup reviewer:** Record every worktree's branch, HEAD, and dirty state; reconfirm the `docs/session-close-2026-07-29` containment and the platform-tree remote/upstream relationship.

All auditors return evidence to the coordinator. They must not switch branches, edit files, stash, rebase, push, delete refs, or share a mutable worktree. The coordinator reconciles the reports and performs mutations serially. If delegation is unavailable, run the same three audits sequentially.

## Phase 0: Freeze and preflight

1. Run the repository preflight and read the closest `AGENTS.md`.
2. Record `pwd`, remotes, current branch/HEAD/status, `git worktree list --porcelain`, and `git status --short --branch` for every linked worktree.
3. Record the exact tip SHA of each source branch in the frozen ledger. If any tip differs from the planning snapshot, recompute its machine-only patch list and update the execution ledger before pushing.
4. Run one `git fetch origin` without pruning. Do not fetch PR refs with `--prune`, because this recovery pass must not remove local tracking evidence.
5. Recompute remote reachability and stable patch coverage. If any of the 18 unique patches has become reachable from a remote ref, record the containing remote ref and update both the unique-patch and branch-occurrence risk counts. Still preserve each distinct source branch tip unless an existing remote ref contains that exact tip.
6. Confirm the proposed recovery destination refs do not already exist. If any exists at another SHA, stop for that branch and choose a new dated suffix; never overwrite it.

## Phase 1: Publish dated recovery refs

Create new remote branches under this explicit namespace:

| Local source | New remote recovery branch |
|---|---|
| `claude/clarity-build-to-goal-operating-doc-011dc7` | `recovery/machine-only/2026-09-17/claude/clarity-build-to-goal-operating-doc-011dc7` |
| `codex/claritymarketingmanualskillsandtraining` | `recovery/machine-only/2026-09-17/codex/claritymarketingmanualskillsandtraining` |
| `codex/om/bridge-memory-visualizer` | `recovery/machine-only/2026-09-17/codex/om/bridge-memory-visualizer` |
| `codex/om/directory-operations` | `recovery/machine-only/2026-09-17/codex/om/directory-operations` |
| `codex/om/journey-poc` | `recovery/machine-only/2026-09-17/codex/om/journey-poc` |
| `codex/om/prescreen-integration` | `recovery/machine-only/2026-09-17/codex/om/prescreen-integration` |
| `codex/om/scope-ledger` | `recovery/machine-only/2026-09-17/codex/om/scope-ledger` |
| `codex/om/sync-main` | `recovery/machine-only/2026-09-17/codex/om/sync-main` |

Push exact local refs to those new destination refs. Prefer one `git push --atomic origin` containing all eight explicit source-to-destination refspecs. Use no wildcard, no `--force`, no deletion refspec, and no `-u`. An atomic failure changes nothing; inspect the error before retrying.

Use this exact atomic push after Phase 0 confirms every source and destination:

```bash
git push --atomic origin \
  refs/heads/claude/clarity-build-to-goal-operating-doc-011dc7:refs/heads/recovery/machine-only/2026-09-17/claude/clarity-build-to-goal-operating-doc-011dc7 \
  refs/heads/codex/claritymarketingmanualskillsandtraining:refs/heads/recovery/machine-only/2026-09-17/codex/claritymarketingmanualskillsandtraining \
  refs/heads/codex/om/bridge-memory-visualizer:refs/heads/recovery/machine-only/2026-09-17/codex/om/bridge-memory-visualizer \
  refs/heads/codex/om/directory-operations:refs/heads/recovery/machine-only/2026-09-17/codex/om/directory-operations \
  refs/heads/codex/om/journey-poc:refs/heads/recovery/machine-only/2026-09-17/codex/om/journey-poc \
  refs/heads/codex/om/prescreen-integration:refs/heads/recovery/machine-only/2026-09-17/codex/om/prescreen-integration \
  refs/heads/codex/om/scope-ledger:refs/heads/recovery/machine-only/2026-09-17/codex/om/scope-ledger \
  refs/heads/codex/om/sync-main:refs/heads/recovery/machine-only/2026-09-17/codex/om/sync-main
```

If the server does not support atomic push, push the eight explicit recovery refs one at a time without force, record each successful destination SHA immediately, and continue only with destinations that were absent during preflight. Never redirect `codex/om/sync-main` to its existing remote branch during recovery.

Do not set the local branches' upstreams to the recovery refs. These refs are durable recovery anchors, not integration targets.

## Phase 2: Prove the risk is removed

1. Fetch `origin` again without pruning.
2. For each of the eight mappings, verify that the local source tip SHA exactly equals its `origin/recovery/machine-only/2026-09-17/...` destination SHA.
3. Verify every listed patch commit is an ancestor of at least one recovery destination appropriate to its source packet.
4. Rerun stable patch-ID comparison against all `origin/*` refs. Acceptance result: **0 of the 18 unique patch identities and 0 of the 26 branch-patch occurrences remain absent from remote refs**.
5. Confirm no source branch moved, no upstream configuration changed, no worktree content changed, and no commits were created locally.
6. Capture the push output, destination refs/SHAs, CI runs triggered (if any), and verification results in the completion ledger.

Do not call this complete merely because `git push` returned success. Completion requires the fetched remote-tracking refs and exact SHA comparisons above.

## Phase 3: Reconcile `codex/om/sync-main`

Only begin after Phase 2 passes.

1. Treat `origin/codex/om/sync-main` as shared history. Do not push the local tip to it and do not force-update it.
2. Inspect PR #30 state, its head/base SHAs, reviews, and whether patches `8c3d02d` and `49637a9` remain intended and unmerged.
3. Compare both commits with current `origin/main` and the relevant network-enrichment implementation. Record overlap, conflicts, obsolete assumptions, and required tests.
4. If the work is still wanted, create a new clean integration branch from current `origin/main`, replay only the two reviewed patches, run focused tests plus required repo checks, and open a draft PR with explicit implemented/scaffolded/deferred status. Preserve the recovery ref permanently through review.
5. If the work is obsolete or already superseded, record that decision with evidence and leave the recovery ref available. Do not delete the local or recovery branch in this execution.

## Phase 4: Classify the other seven recovered packets

For each packet, compare its source tip with current `origin/main`, merged PRs, and active branches. Assign one disposition:

- **Open a draft PR:** still wanted, coherent, independently verifiable work.
- **Rebuild from current main:** still wanted but too old or conflict-heavy; replay reviewed patches on a new branch while retaining the recovery ref.
- **Superseded:** content already implemented differently; document the evidence and retain the recovery ref until owner review.
- **Reference/archive:** useful historical packet that should not be merged; document why and retain its recovery ref.
- **Needs owner decision:** purpose or authority is unclear.

Do not merge multiple packets solely because they share `91bef08` and `aa1ba1a`. Preserve the original synthetic-only, reference-package, and governance boundaries. Do not treat remote backup as product acceptance, implementation completion, merge, release, or deployment.

## Phase 5: Resolve the two smaller branch findings

### `docs/session-close-2026-07-29`

1. Fetch and verify that its tip is fully contained in current `origin/main`, and confirm PR #43 is merged.
2. Confirm the branch is not checked out in any worktree and has no uncommitted work associated with it.
3. Archive locally with safe deletion only: `git branch -d docs/session-close-2026-07-29`. Do not use `-D`. Its remote branch is already gone; do not recreate or delete a remote ref.
4. Record the deleted local ref's former SHA and the containing `origin/main` SHA so recovery remains auditable.

### `claude/platform-tree-architecture-audit-794b95`

1. Verify the local and remote branch SHAs and ahead/behind relationship after fetch.
2. Set the existing remote as its upstream with `git branch --set-upstream-to=origin/claude/platform-tree-architecture-audit-794b95 claude/platform-tree-architecture-audit-794b95`.
3. Verify the configured upstream and tracking relation. Do not rebase or merge it as part of this configuration fix.

## Stop conditions

Stop only the affected branch and continue safe independent work when:

- a source tip changes after the ledger is frozen;
- a destination recovery ref already exists at a different SHA;
- a worktree is dirty and the next action would touch it;
- patch identity or remote containment cannot be proven;
- a push requires force or deletion;
- PR ownership, intended base, or conflict resolution is unclear;
- CI or branch-protection behavior creates an unexpected external effect.

Never use `reset --hard`, `clean`, automatic stash, force-push, branch deletion other than the verified `git branch -d` above, or concurrent Git mutations.

## Completion criteria

Claude may report this recovery complete only when:

- all eight recovery destinations exist on `origin` at the exact frozen local tip SHAs;
- stable patch comparison proves none of the frozen 18 unique patch identities or 26 branch-patch occurrences is machine-only;
- every linked worktree retains its starting content and status;
- `codex/om/sync-main` was not updated directly;
- the session-close branch was safely deleted only after current containment proof, or was left unchanged with a documented blocker;
- the platform-tree branch has the correct upstream configured, or was left unchanged with a documented mismatch;
- the final report separates remote backup, local configuration, archive cleanup, draft PR work, merge state, and deployment state.

## Required final report

Report:

1. Starting repo/branch/HEAD and all dirty worktrees.
2. The eight local source tips and eight recovery destination refs/SHAs.
3. Stable patch risk before and after (`18 unique / 26 branch occurrences -> 0` expected).
4. Push method, any partial failures, and CI triggered.
5. `sync-main` PR/context finding and next integration recommendation.
6. Disposition recommendation for each of the other seven packets.
7. Session-close archive result and containment evidence.
8. Platform-tree upstream result.
9. Commands/checks run, failures, skipped checks, and remaining `[Unknown]` or `[Unverified]` items.

## Copy/paste execution prompt for Claude

> Execute `docs/planning/MACHINE_ONLY_BRANCH_RECOVERY_PLAN_2026-09-17.md` as the coordinator. Preserve the current dirty worktrees and freeze the eight source tips before changing remote state. You may delegate only the three read-only audits defined in the plan; you alone perform fetches, pushes, branch configuration, and the one permitted safe local archive action, serially. First publish all eight exact source tips under the dated `recovery/machine-only/2026-09-17/...` namespace using explicit non-force refspecs, then fetch and prove exact remote SHA equality and stable patch coverage of `18 unique / 26 branch occurrences -> 0`. Do not update `origin/codex/om/sync-main`, rebase, merge, force-push, clean, reset, or stash. After durability is proven, reconcile the two `sync-main` patches through PR review, classify the other seven packets, safely archive `docs/session-close-2026-07-29` only after fresh containment proof, and configure the existing platform-tree remote as its upstream. Stop only affected branches on ambiguity and finish with the required evidence report.
