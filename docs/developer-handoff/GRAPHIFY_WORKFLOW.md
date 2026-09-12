# Local Graphify workflow

Decision recorded: 2026-09-12, during the owner-authorized housekeeping pass for
[issue #40](https://github.com/henrytylerhebert-eng/clarity-platform/issues/40).

## Retention policy

`graphify-out/` is a local derived artifact, ignored by Git. Each worktree owns its
graph, caches, generated reports, and path/mtime manifests. Do not force-add them.
The graph is optional discovery context; source files, tests, and canonical decision
records remain authoritative.

This removes absolute-worktree-path churn from reviews without changing Graphify's
file format or query tools. It does not claim deterministic graph generation. The
tradeoff is that a fresh clone needs its own graph before querying it. A curated,
source-verified finding belongs in an ordinary domain document or test manifest,
not in a committed copy of the generated report.

## Maintain and query

Use the installed `graphify` command from the intended checkout. Check its help
before relying on options: the CLI and separately installed skill can have different
versions. Do not run install or upgrade commands merely to refresh a graph.

```sh
graphify --help
graphify update .
graphify query "prescreen" --graph graphify-out/graph.json
git status --short
git ls-files graphify-out
```

`graphify update` is the CLI's code-only update path (no LLM). Do not substitute
`graphify extract`, which may send source to a configured model provider, without
separate authorization for that extraction. Keep `.claude/worktrees/`, external
Codex worktrees, dependencies, build outputs, and `graphify-out/` outside source
scope. If a fresh graph cannot be built or scope cannot be confirmed, report it as
unverified and use direct source inspection; application checks do not depend on a
graph. `git ls-files graphify-out` must print no paths.

## Existing worktrees and recovery

The housekeeping commit untracks generated files with `git rm --cached`; it does
not erase local graph files from its working directory. Other original worktrees
are retained during reconciliation. When checking out this commit elsewhere, Git
may remove formerly tracked generated files, so preserve any needed local report
first. Dirty or unique work is never discarded as part of that transition.

The pre-cleanup tracked graph remains available at commit
`35f16eb63ae0953b15802edb62fdfeb6f8795bfa`, for example:

```sh
git show 35f16eb63ae0953b15802edb62fdfeb6f8795bfa:graphify-out/GRAPH_REPORT.md
```

All pre-cleanup local branch refs and dirty files were also preserved in the
2026-09-12 local recovery bundle and hash manifest. That archive is local recovery
material, not a package to upload or promote wholesale.

## Verification boundary

A tracked-source search found no graph consumers in `app/`, `packages/`, `scripts/`,
`tests/`, `agents/`, `agent_bridge/`, or `.github/`. Existing lint ignores already
exclude `graphify-out/`. Graph queries still operate on a supplied local graph path;
untracking does not remove that capability. No app API, database, dependencies, or
clinical/legal behavior changes in this slice.

Historical audit inventories and checksums describe their original snapshots and
remain unchanged. The issue is resolved by this branch's retention policy; GitHub
issue closure is deferred until the reviewed PR is merged.

Checks run on 2026-09-12:

- All 917 previously tracked graph artifacts remained byte-for-byte unchanged in
  the housekeeping worktree after untracking; all 917 paths are ignored.
- `git ls-files graphify-out` returns no paths.
- `graphify query prescreen --graph graphify-out/graph.json --budget 50` succeeds
  against the preserved local graph. This checks query availability, not freshness.
- Code-only `graphify update . --no-cluster` succeeds in two isolated synthetic Git
  checkouts with different absolute paths; both create a local graph while leaving
  zero unstaged or untracked Git changes.
- `git diff --check` and `git diff --cached --check` pass. No app runtime code changed;
  application/database checks are left to the PR's CI and reported separately.
- The installed CLI warns that its skill is version 0.2.2 while its package is
  0.8.16. No global skill/package installation was changed by this housekeeping.
