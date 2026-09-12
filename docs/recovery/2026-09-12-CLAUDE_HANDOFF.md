# Clarity housekeeping handoff — 2026-09-12

## Mission

Take over Clarity cleanup from a preserved, reviewable state. Keep the repository clear, commit only bounded reviewed changes, push normal feature branches, and avoid new technical debt. Do not merge pull requests, force-push, delete original worktrees, delete remote branches, or overwrite source evidence without explicit owner approval.

## Start here

1. Read `AGENTS.md`, `README.md`, `ARCHITECTURE.md`, and `docs/governance/PRODUCT_EVIDENCE_AND_DECISION_PROTOCOL.md`.
2. Run `pwd`, `git remote -v`, `git status --short --branch`, `git rev-parse HEAD`, and `git worktree list --porcelain` before changes.
3. Read `docs/recovery/2026-09-12-housekeeping-execution.md` and `docs/recovery/2026-09-12-source-path-dispositions.json` before touching recovered or historical work.

`main` is clean at `35f16eb63ae0953b15802edb62fdfeb6f8795bfa`, matching `origin/main`. It was fast-forwarded 22 commits during this cleanup. Do not rebase or reset original worktrees.

## Preservation boundary

The recovery set is `~/Documents/clarity-recovery/20260912T203908Z/`.

- `manifest.json` records 65 original local refs and 15 original worktree paths.
- `all-local-branches.bundle` is verified; SHA-256: `e2630f1212863ba7ef7c5e9fd6f4b4e08c37de4b7c533b67de2d99d7325afe50`.
- All 48 original non-generated dirty paths and their snapshots match recorded hashes.
- 33 redundant local aliases were safely retired only after backup and ancestry checks; exact names and IDs are in `2026-09-12-retired-local-refs.json`.
- The separate local visualizer repository is preserved in `visualizer-preservation/`; do not recreate its broken parent gitlink or invent a submodule remote.

Original worktrees, the marketing source mutation, historical handoffs, and all unique work stay preserved. A clean `git status` is never authority to remove one of those directories.

## Published draft work

All listed heads are pushed, draft, and have passing exact-head CI. Their checks support only their own revision, not an untested combined merge.

| Order | Draft | Branch / head | Scope and next action |
|---|---|---|---|
| 1 | #58 | `codex/om/workbook-platform-map` / `14bafd0` | Synthetic workbook operations, CSV normalization, planning projection refresh, same-selection regression fix, browser and database verification. Review and merge only with owner approval. |
| 2 | #59 | `codex/om/governance-document-recovery` / `7edf9ab` | Stacked on #58. Retarget to main only after #58 merges, then rerun CI. Keep pending/paused states and dated provenance. |
| independent | #56 | `codex/om/api-path-role-recovery` / `ce502ed` | Malformed-path and stable role-order idempotency fixes. Existing persisted records with old unsorted multi-role arrays are not migrated. |
| independent | #57 | `codex/om/graphify-local-artifacts` / `feb7ed8` | Resolves Graphify issue #40 through local artifact policy and removes the unconfigured visualizer gitlink. Local graph/visualizer bytes and history are preserved. |
| independent | #60 | `codex/om/ephemeral-verification-recovery` / `c20a04d` | Opt-in disposable PostgreSQL verification runner. It intentionally omits the old TypeScript source alias after proving worktree-local resolution. Windows remains unsupported. |
| independent | #48 | `codex/om/network-enrichment-contract-kernel` / `98cd67e` | Contract/docs/fixture-only network path. Keep it contract-only; do not import PR #30 runtime work. |
| record | #61 | `codex/om/housekeeping-recovery-record` / current branch | Preservation, path dispositions, and this handoff. |

Drafts #54 and #55 are dependency updates. They were reviewed independently and have passing CI, but reconsider them separately against the then-current main; do not batch them with feature work merely to reduce PR count.

## Explicit holds

- PR #30 remains open and held. Its network service, persistence/outbox, API, UI, bridge, tools, donor packages, and generated churn do not have authority to merge. #48 is the sole contract-only replacement slice.
- `codex/claritymarketingmanualskillsandtraining` remains unpushed and held. It mutates the distinct 44-sheet legacy workbook under `reference/`; formula semantics, provenance, and edit authority are Unknown. The accepted 62-sheet workbook record on #58 remains governing.
- Ten original dirty paths remain intentionally held as historical/proposed/stale policy material. The per-path disposition is in the JSON record above. Do not bulk-import old WP-10/WP-11 handoffs or stale policy/runtime descriptions.
- Do not turn prototype/localStorage surfaces into production behavior, add new integrations, or promote product/governance claims without recorded decisions and evidence.

## Practical cleanup rules

1. Work from a clean isolated worktree. Stage only the reviewed slice.
2. Before branch/worktree retirement, repeat recovery verification, verify no active session/CWD depends on it, and remove only refs that are backed up, ununique, unattached, and not an open PR head. Use small batches with `git branch -d`; never force deletion. Retain original directories until reconciliation is independently verified.
3. Keep generated Graphify output and the visualizer local and ignored. Do not commit `graphify-out/`, recreate the visualizer gitlink, or add a guessed `.gitmodules`.
4. Keep immutable `reference/` source files unchanged unless the owner specifically authorizes a source reconciliation.
5. For every change, run focused checks then relevant lint/typecheck/schema/test commands. Report exact results, skipped checks, and residual risks. Passing CI is revision-specific.
6. Make small commits that state what changed, why, and whether it is implemented or scaffolded. Push normally with upstream tracking. Draft PRs need Objective, Scope, Files changed, Implementation status, Risks/open questions, Alignment check, and Validation.

## Recommended next moves

1. Review #58 as the primary functional slice; resolve only concrete review findings.
2. After #58 is owner-approved and merged, retarget #59 to main and rerun CI.
3. Review #56, #57, #60, and #48 independently. Merge decisions remain owner actions.
4. Review #54 and #55 as dependency-only changes after the accepted feature base is known.
5. Do not reopen PR #30 or the marketing source mutation as a housekeeping shortcut. Scope either one as a new evidence-led decision if the owner requests it.
6. Only after accepted work is reconciled and active-session checks are repeated, retire additional redundant worktrees/branches in small recoverable groups.

## Evidence links

- `docs/recovery/2026-09-12-housekeeping-execution.md` — recovery record, CI receipts, marketing reconciliation, dependency review, and PR #30 disposition.
- `docs/recovery/2026-09-12-source-path-dispositions.json` — all 48 original dirty paths, each assigned once as reconciled, recovered, held, omitted, or superseded.
- `docs/recovery/2026-09-12-retired-local-refs.json` — exact retired local aliases and recovery references.

Treat `Unknown` as a real state. Preserve source truth, keep claims bounded to evidence, and leave not-yet-reviewed work held rather than folding it into a convenient merge.
