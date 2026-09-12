# Housekeeping execution and recovery record — 2026-09-12

This records the owner's authorized preservation, reconciliation, feature-branch
pushes and draft reviews. No PR was merged, no unique work was deleted, and no
production, clinical, legal, or financial-readiness status was promoted.

## Recovery and primary checkout

The verified local recovery directory is
`~/Documents/clarity-recovery/20260912T203908Z/`. Its `manifest.json` records every
original worktree/HEAD, each dirty path/status/size/SHA-256, and all 65 original local
branch refs with exact object IDs. `RESTORE.md` explains deliberate restoration into
a new checkout; separate staged/unstaged binary patches preserve their distinction.

- 48 non-generated dirty paths copied and hash-verified.
- An additional 29 generated graph paths preserved separately.
- All 65 original branch refs included in `all-local-branches.bundle`;
  `git bundle verify` and `git bundle list-heads` match the manifest.
- Bundle size: 18,637,877 bytes.
- Bundle SHA-256: `e2630f1212863ba7ef7c5e9fd6f4b4e08c37de4b7c533b67de2d99d7325afe50`.
- The backup remains local recovery material; no candidate file or bundle was
  uploaded wholesale. Original dirty worktrees were retained unchanged.

Clean main was fast-forwarded from `c5e41132aabdf0d13f984400015cc1ca19082e03` to
`35f16eb63ae0953b15802edb62fdfeb6f8795bfa` (22 commits), incorporating already-merged
PRs #51–53. No direct main commit/push was made by this pass.

The independent local visualizer repository is preserved additionally in
`visualizer-preservation/`: `preservation.json`, a bundle covering detached HEAD
`bbc7c3eac00dc4c89d9607f3a041ea11d0e2d1ec` and both named refs, plus an archive of
81 source/artifact files. The original nested repository, dependencies and outputs
remain in place. Bundle SHA-256:
`a325eeeb8cae23ac789c12d84818273925d12b45d12b62c45e5a5d4e948fb228`.
This supplements, without replacing, the original 65-ref preservation manifest.

## Reviewed work packages

| Package | Review surface | Disposition |
|---|---|---|
| Workbook operating slice | [Draft #58](https://github.com/henrytylerhebert-eng/clarity-platform/pull/58), `codex/om/workbook-platform-map` | Five earlier local commits preserved and pushed; CSV line endings and stale planning projections corrected. A reproduced same-selection bug has its own runtime fix/regressions. Accepted workbook/source boundaries retained. |
| API path/role recovery | [Draft #56](https://github.com/henrytylerhebert-eng/clarity-platform/pull/56), `codex/om/api-path-role-recovery` | Small malformed-path and role-order idempotency fixes recovered onto current main with failing-before/passing-after tests. Original dirty source worktree retained. |
| Local analysis artifact retention | [Draft #57](https://github.com/henrytylerhebert-eng/clarity-platform/pull/57), `codex/om/graphify-local-artifacts` | 917 generated graph artifacts and one orphan visualizer gitlink untracked while original local files/history are retained. Ignored local graph generation/query replaces path-dependent tracked caches. Issue #40 closes only after merge. |
| Governance/operating assurance | [Draft #59](https://github.com/henrytylerhebert-eng/clarity-platform/pull/59), `codex/om/governance-document-recovery` | Historical proposals recovered with current dispositions. Governance OD-20–24 and operating-assurance OD-25–27 follow workbook OD-18/19 without collisions; documentation is stacked on #58 to preserve accepted workbook decisions. Pending approvals and paused product work remain unchanged. |
| Network contract kernel | [Existing draft #48](https://github.com/henrytylerhebert-eng/clarity-platform/pull/48) | Normally merged current main into its feature branch and pushed; still only 10 contract/docs/fixture files relative to main. No #30 service/API/UI imported. |
| Ephemeral verification tooling | [Draft #60](https://github.com/henrytylerhebert-eng/clarity-platform/pull/60), `codex/om/ephemeral-verification-recovery` | Runner recovered and repaired independently of the API fix and historical six-document WP-10/WP-11 packet. Source-resolution config omitted after confirming worktree-local resolution without it. |

All 48 original non-generated paths have an explicit
[path disposition](2026-09-12-source-path-dispositions.json): 32 reconciled through
#59, two recovered through #56, two through #60, ten intentionally held, one
unnecessary source alias omitted, and one old gateway patch superseded by current
main. Reconciliation recovers relevant content against current truth; it does not
mean every original dirty file was copied unchanged or committed. Additional new
regression tests and recovery documents are outside those original 48 paths.

Each PR has its own scope, implementation status, verification, and review limits.
Green checks are evidence for the named revision, not for an untested combination
of all candidate branches. No draft is described as deployed or production-ready.

## Verification receipts

| Package/revision | Verified result |
|---|---|
| Workbook `14bafd0` | 587 root tests, 96 app tests, 10/10 desktop/mobile RevOps browser checks, lint/typecheck/build, Prisma validation/generation, and all 19 migrations pass. The first browser run reproduced a reselection defect; the fix and two regression tests pass. [CI 34718033335](https://github.com/henrytylerhebert-eng/clarity-platform/actions/runs/34718033335) succeeded. |
| API `ce502ed` | Five regressions failed on main before recovery and pass after; 37 focused tests, 537 root tests, 81 app tests, lint/typecheck/schema checks pass. [CI 34717931704](https://github.com/henrytylerhebert-eng/clarity-platform/actions/runs/34717931704) succeeded. |
| Governance stack `7edf9ab` | 23 YAML/frontmatter blocks, 111 local links, unique decision IDs, preserved workbook OD-15–19/status bytes and source recovery hashes verified. [CI 34718301208](https://github.com/henrytylerhebert-eng/clarity-platform/actions/runs/34718301208) on workbook base `14bafd0` succeeded, including root/app tests and configured schema, migration, lint, typecheck and audit gates. |
| Local analysis artifacts `feb7ed8` | All 917 Graphify file bytes and 81 separately archived visualizer source/artifact files remain unchanged. Two isolated code-only graph generations, a local graph query, ignore/tracking checks, and gitlink cleanup reproduction pass. [CI 34718557505](https://github.com/henrytylerhebert-eng/clarity-platform/actions/runs/34718557505) passed with 532 root and 81 app tests plus configured quality/database gates; the missing-submodule-URL cleanup error is absent. |
| Ephemeral tooling `c20a04d` | Actual PostgreSQL run: 547/547 root tests, including 15 lifecycle tests; 81/81 app tests, lint/typecheck/schema/diff checks pass. Real wrapped failure returns 7, SIGINT returns 130, SIGTERM returns 143, and two parallel runs use separate ports and complete. All owned directories removed and ports closed; signal-target processes stopped. Compiler resolution finds 176 source files and zero foreign-worktree files without adding the old source alias. CI is recorded on [draft #60](https://github.com/henrytylerhebert-eng/clarity-platform/pull/60). |
| Network kernel `98cd67e` | 28 focused contract tests, 560 root tests, 81 app tests, quality/build/schema and 19 migrations pass. Seven kernel/schema/fixture files remain byte-identical to the prior contract-only revision. [CI 34718172791](https://github.com/henrytylerhebert-eng/clarity-platform/actions/runs/34718172791) succeeded. |

The API/workbook, tooling/workbook and tooling/governance branches combine without textual conflict in `git merge-tree`;
this is not an integrated runtime test. Existing multi-role idempotency records
created with the old unsorted role array may still conflict on replay; no stored
record migration was authorized or applied. The workbook's existing bundle-size
warning remains. Local database verification used separate disposable instances;
the developer's live database and app processes were retained.

## Independent marketing/acceptance reconciliation

The unpushed `codex/claritymarketingmanualskillsandtraining` branch at `1bfd783`
remains preserved and held. Its pending-acceptance language conflicts with the
September 9 owner acceptance recorded by workbook commit `512a760` and retained in
#58. That later accepted record governs workbook development; do not reintroduce
its superseded acceptance block when recovering useful dependency inventory.

The accepted restored workbook has 62 sheets and its current SHA-256 was verified:
`6e81bd61950c244e607ed03f8b0f13e1a4d0bea366ee7ad7cc54c053ef90de26`.

The marketing commit instead mutates the separate 44-sheet legacy reference
`reference/source-documents/clarity-mh-sources/Reporting Metrics Ops and Budget .xlsx`:
1,633,140 to 2,071,228 bytes, different sheet order and cell XML. The legacy hashes are:

- Main: `9051cfcb50a58fd52fea85852c69acaf675c135630bf6926fc2594f5393264c5`.
- Marketing: `611e1a299d991716d5520d805ff8e9f693e050a397a30f76894a3866203613cb`.

Specific edit authority, formula-semantic reconciliation, and source/privacy
provenance remain Unknown. No legacy workbook bytes were replaced or pushed by
this pass. This is a separate source reconciliation, not a reason to reopen the
accepted restored-workbook decision or block unrelated synthetic development.

## Independent dependency review

[#54](https://github.com/henrytylerhebert-eng/clarity-platform/pull/54) at `9d165dc`
changes only the API csv-parse declaration and matching lockfile resolution, from
6.2.1 to 7.0.2. The active importer uses `csv-parse/sync` with array rows, bounded
record size, raw/info metadata, and strict column counts; it does not use the
`columns` object-mapping option. Its existing exact-head CI run
[34338648010](https://github.com/henrytylerhebert-eng/clarity-platform/actions/runs/34338648010)
passed on September 9: 532 root tests, 81 app tests, lint/typecheck/schema/migrations,
and the configured high-severity audit gate. No actionable compatibility defect was
found in the bounded diff/caller review. No local dependency change or merge made.

[#55](https://github.com/henrytylerhebert-eng/clarity-platform/pull/55) at `d4bc63c`
updates root/app Vitest from 3.2.6 to 5.0.0 and its lockfile package family. This is a
major test-tool update; the PR's release notes identify Node 22/Vite 6.4 minima, and
Clarity CI selects Node 24 while the app declares Vite 6.4.3. Root/app test config
and mock usages were inspected; no direct deprecated `@vitest/runner` or sequential
suite API use was found in the searched implementation/tests. Existing exact-head CI
[34440528140](https://github.com/henrytylerhebert-eng/clarity-platform/actions/runs/34440528140)
passed on September 10 with 532 root and 81 app tests plus quality/schema/migration
and audit steps. No actionable finding in that review scope. No merge made.

Those CI executions are prior runs inspected during this pass, not tests rerun
locally today. `git merge-tree` reports that the two dependency branches combine
without a textual conflict; combined runtime behavior remains unverified. Recheck
current-head CI when later accepted code changes their bases.

## PR #30 replacement disposition

The remote head remains `f831939` and its full current-base diff contains 2,483
paths, including 2,064 generated graph paths. [PR #30](https://github.com/henrytylerhebert-eng/clarity-platform/pull/30)
stays open and held; this pass does not claim its runtime accepted or discard its
history. The two extra local commits `8c3d02d` and `49637a9` remain preserved on
`codex/om/sync-main` and in the recovery bundle, without a blind push into #30.

| Slice | Current disposition |
|---|---|
| Network contracts, schemas and fixtures | #48 is the sole retained contract-only review path. |
| Generated graph/cache churn | Replaced by the reviewed local-artifact policy in #57, not cherry-picked from #30. |
| Old prescreen donor-root package/contracts | Preserve as historical source; canonical prescreen work landed through separate PRs #19–32. Do not replay the donor fork over it. |
| Network service, persistence/outbox, API and UI | Held for separately scoped runtime review. The two extra local API/UI commits depend on this unaccepted runtime and are not standalone housekeeping fixes. |
| Legacy bridge, tools, CSV directory and donor packages | Preserve; use accepted ADR-0017/reference boundaries. Do not promote generated or real-world directory material as synthetic canonical app data. |

The bounded API recovery #56 comes from the separate prescreen worktree; it does not
implicitly approve #30's network APIs. Physical bridge retirement and new network
runtime authority remain outside this housekeeping disposition.

## Local retirement and original worktrees

33 redundant local aliases were retired using `git branch -d` in nine batches of
at most four. Each tip still exactly matched its backup ref, was an ancestor of
current origin/main, had no registered checkout and no open PR. No force-delete,
remote deletion, or unique-commit deletion was used. Exact restoration names/IDs
are recorded in [retired refs](2026-09-12-retired-local-refs.json) and the local
bundle. All original worktree directories remain present.

Active app task/CWD and process checks found current activity on the primary and
workbook checkouts, not the retired unbound refs. Clean detached older worktrees
still contain ignored local settings, and one contains an ignored environment
file; those directories were retained rather than deleting configuration based on
an empty `git status`. Contents of environment files were not inspected or exposed.

Original dirty source lanes, the marketing branch, unmatched historical refs, and
all remote branches remain preserved. Retiring a local alias does not mean a
historical proposal or unmerged runtime was accepted.
