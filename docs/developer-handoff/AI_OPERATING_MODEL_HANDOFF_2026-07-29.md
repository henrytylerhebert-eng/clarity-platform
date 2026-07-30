---
status: Handoff — read before continuing this thread of work
owner: Tyler Hebert
version: 1.0.0
created: 2026-07-29
related_docs:
  - docs/governance/AI_OPERATING_MODEL_PLAN.md
  - docs/architecture/ADR-0017-agent-operating-model-and-bridge-retirement.md
related_prs: "#33, #36"
related_issues: "#34, #35"
---

# Handoff: AI operating model plan — Stage 0 in progress

Read this first if you're picking up the AI-native operating-model work. It
tells you what already happened, what's open, and the traps that cost time
last session.

## One-paragraph summary

An assessment concluded persistent domain-aware agents are wrong for this
repo (shared-kernel monolith, and the three-agent bridge already failed at
this once — see `agents/bridge/LEDGER.md`). The owner approved a smaller
plan instead: two reusable read-only/narrow-write roles (R1 verifier, R2
status steward) and one temporary per-package role (T1), governed by
`docs/governance/AI_OPERATING_MODEL_PLAN.md` and decided in
[ADR-0017](../architecture/ADR-0017-agent-operating-model-and-bridge-retirement.md).
Stage 0 (preparation) is partially done. **Do not start Stage 1 (the R1
trial) until Stage 0 is fully landed** — the plan's stage gates are load-bearing,
not decorative.

## What's already open — check these before doing anything

| # | What | State | Your move |
|---|---|---|---|
| [PR #33](https://github.com/henrytylerhebert-eng/clarity-platform/pull/33) | Plan doc + ADR-0017, approved, 7 review findings fixed | Open, mergeable, 0 unresolved threads | Merge when CI unblocks (see #34) |
| [PR #36](https://github.com/henrytylerhebert-eng/clarity-platform/pull/36) | Stage 0.4 enum-sync test | Open, mergeable | Merge when CI unblocks (see #34) |
| [Issue #34](https://github.com/henrytylerhebert-eng/clarity-platform/issues/34) | `npm audit --audit-level=high` fails on every PR (brace-expansion, postcss) | Open, **blocks all merges** | Fix this or nothing merges. Out of Stage 0's scope by design — do it as its own `chore:` PR, precedent is PR #14 |
| [Issue #35](https://github.com/henrytylerhebert-eng/clarity-platform/issues/35) | Schema `CaseStatus` has two values (`MEDICAL_TRANSFER_REQUIRED`, `RETURNED_FOR_MORE_INFORMATION`) with zero TypeScript representation | Open, owner decision needed | Don't fix without an owner ruling on transition semantics — see the issue |

**Check these are still current before trusting this table** — `gh pr list --state open`, `gh issue list --state open`. This doc is a snapshot from 2026-07-29.

## Stage 0 status — what's done, what's HELD, why

Full detail is in the plan doc's Stage 0 section. Short version:

- **0.1 (collapse `IMPLEMENTATION_STATUS.md`)** — HELD
- **0.2 (quarantine `agents/bridge/`)** — HELD
- **0.3 (work-package template)** — partially HELD (new file is free; the `CLAUDE.md` reference isn't)
- **0.4 (enum-sync test)** — **done**, PR #36

0.1–0.3 are HELD because **[PR #30](https://github.com/henrytylerhebert-eng/clarity-platform/pull/30)** (`codex/om/sync-main`, 42 commits) touches the exact four files those tasks rewrite: `IMPLEMENTATION_STATUS.md` (+50 lines), `CLAUDE.md`, `package.json`, `agents/bridge/LEDGER.md`. Starting them now guarantees a conflict. **Check whether #30 has merged or closed before starting 0.1–0.3.** If it's still open, they're still HELD — ask the owner rather than guessing at a merge order.

Stage 0.2's move is bigger than "move the directory" — the plan doc has a verified inventory table of every live reference (`README.md:99`, `README.md:114-115`, the whole root `agent_bridge/` wake-layer dir, the `bridge:*` npm scripts, `IMPLEMENTATION_STATUS.md`'s Bridge bullet). Use that table; a partial quarantine leaves broken paths advertising a retired model.

## Things that cost real time last session — don't rediscover these

1. **Worktree `node_modules` goes stale when a new workspace package is added on another branch.** Symptom: `npm run typecheck` reports dozens of errors in `../../../packages/<something>/*` — the `../../../` prefix means it resolved *up* into the parent checkout's currently-checked-out branch, not this worktree's code. Fix: `npm install` in the worktree, then `npx prisma generate` (the root `allowScripts` config blocks Prisma's postinstall). Verify with `diff <(ls packages) <(ls node_modules/@clarity/)`.

2. **The local `clarity_dev` database is shared by every git worktree on this machine** (16, as of 2026-07-29 — check `git worktree list`). It accumulates migrations from whichever branches have run DB-backed tests recently, so `tests/integration/migration-integrity.test.ts` can fail on a perfectly clean branch just because another worktree applied a migration your branch doesn't have. Before treating a local test failure as a real defect: compare `ls prisma/migrations | grep -c '^2'` against what the test says is actually applied. **CI's ephemeral Postgres doesn't have this problem** — it's the real gate, not your local run.

3. **ADR numbers collide across unmerged branches.** `docs/architecture/` on `main` is not the full picture — three ADR-number collisions existed simultaneously on 2026-07-29 (0014 claimed twice, 0015, 0016 each on different unmerged branches). Before allocating a number: `git log --all --name-only --pretty=format: -- "docs/architecture/ADR-*" | grep -oE "ADR-[0-9]{4}" | sort -u | tail -5`. This ADR is 0017 for exactly this reason.

4. **`gemini-code-assist` has been sunset** — it posted on PR #33 that its consumer GitHub integration has stopped reviewing entirely. `chatgpt-codex-connector` is the only automated external reviewer left, and it has been finding real, substantive issues (all 7 findings on PR #33 were valid, including one that falsified a safety claim the plan itself had made about R1's read-only property). Don't skip triaging its comments.

5. **There are more open PRs than `main`'s linear history suggests.** The original assessment assumed sequential, single-lane work from reading `main` alone. Wrong — check `gh pr list --state open` at the start of any session; there were 5 concurrent open PRs on 2026-07-29 (#18, #29, #30, #32, #33, now also #36).

## If you're continuing Stage 0

1. `gh pr list --state open` — is #30 merged/closed yet?
2. If yes: do 0.1–0.3 following the plan doc exactly (it has the file-level acceptance checks). Re-run the shared-surface checks in §"Amendment 1" of the plan before touching anything.
3. If no: don't start 0.1–0.3. Either wait, or ask the owner whether to force the merge order.
4. Either way, issue #34 blocks every merge — consider fixing that first regardless of #30's state, since it's independent and unblocks both open PRs immediately.

## If you're starting Stage 1 (the R1 trial)

Not until **Stage 0.1–0.3** are merged to `main`. Those three are the required
gate; **0.4 (the enum-sync test) is strongly recommended, not required** — the
plan is explicit about that, so do not treat a pending 0.4 as a blocker. (0.4 in
fact landed in PR #36, so this is moot in practice, but the criteria matter if
anyone re-runs the sequence.)

The plan's R1 contract in `AI_OPERATING_MODEL_PLAN.md` was hardened against two
false-positive traps found in review — it now knows `scripts/seed.ts:1` is an
approved `@prisma/client` exception, and it loads `AGENTS.md` before `CLAUDE.md`.
Use the contract as written; don't reconstruct it from memory, it's had several
rounds of correction.

**Replay the VULNERABLE parent revisions, never the fixes.** This is easy to get
backwards and it silently destroys the experiment: `346ee85` and `1470e00` are
the commits that *removed* the defects, so pointing R1 at either leaves nothing
to find and records a false no-go.

- **PR #23:** create the worktree at **`ad1b7e9`** (the parent) and keep
  `346ee85` out of R1's context entirely. Six known findings, graded blind
  against the plan's scorecard.
- **PR #26:** create the worktree at **the parent of `1470e00`**, and check
  whether R1 flags the aliasing defect.

Both scorecards live in the plan — use those, don't invent new test cases.

## Source of truth

`docs/governance/AI_OPERATING_MODEL_PLAN.md` is the plan, and it self-amends (see its "Amendment 1" section) — treat it as more current than this handoff for anything it covers. This handoff is a map to *what's open and what to check*, not a restatement of the plan's content. If they disagree, the plan wins; update this handoff or delete it once Stage 0 fully lands.
