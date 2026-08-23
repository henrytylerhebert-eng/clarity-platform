---
status: Approved (owner approval 2026-07-29)
owner: Tyler Hebert
version: 1.1.0
created: 2026-07-29
last_amended: 2026-07-29
scope: development tooling only — NOT product AI agents
related_adrs: ADR-0017 (accepted, agent operating model and bridge retirement)
related_docs:
  - docs/governance/AI_GOVERNANCE.md
  - docs/governance/HUMAN_APPROVAL_GATES.md
  - docs/governance/PRODUCT_EVIDENCE_AND_DECISION_PROTOCOL.md
  - docs/developer-handoff/CLAUDE_OPERATING_MANUAL.md
supersedes: agents/bridge/PROTOCOL.md — decision accepted (ADR-0017); the physical
  quarantine is Stage 0.2 and is HELD pending PR #30, so bridge files and their
  README/package-script entry points are still present on disk. Treat the bridge as
  retired guidance, but do not assume its paths are gone yet.
---

# AI Operating Model Plan

## Scope boundary (read first)

This plan governs **development-tooling agents** — agents that read diffs, verify
invariants, and reconcile status documents in this repository. It does **not**
authorize, describe, or relax the rules for **product AI agents** that would act on
case data.

Those remain governed exclusively by
[AI_GOVERNANCE.md](AI_GOVERNANCE.md) and
[HUMAN_APPROVAL_GATES.md](HUMAN_APPROVAL_GATES.md), where the position is unchanged:
**zero product agents are implemented or running, and none may run without a
contract.** Nothing in this plan is a step toward product agents, and no role defined
here may read, write, or reason about case data, evidence content, clinical or legal
rule semantics, or any live system.

The **R1 and R2** specifications below satisfy AI_GOVERNANCE.md's contract requirement
in form — explicit tool allowlist, prohibited actions, required output, human-review
rule — because that is the right bar for any agent in this repository, product or not.

**T1 does not yet have a contract, and this plan does not pretend otherwise.** Stage 3
defines T1 only by a charter and a work-package template; it has no tool allowlist and
no output schema. AI_GOVERNANCE.md §21-23 requires both and states that no agent may run
without a contract. Authoring T1's full contract and obtaining owner approval is
therefore an explicit **Stage 3 entry gate** (see Stage 3), not a formality to be
back-filled once an unblocked work package makes Stage 3 look eligible.

## Why this plan is small

An assessment on 2026-07-29 evaluated whether this repository could be organized
around persistent, domain-aware agents owning product areas. It concluded **no**, on
two independent lines of repository evidence:

**1. This is a shared-kernel monolith with domain-shaped modules, not a set of bounded
contexts.** Five surfaces are touched by essentially every feature:
`prisma/schema.prisma` (one file, 38 models, 45 enums), `packages/domain-contracts`
(55 inbound import references), `packages/case-repository` (5,117 LOC, gateways for
every domain, sole Prisma boundary), `packages/api-service/src/server.ts` (375 LOC,
all domains' routes), and `tests/` (36 files in one flat tree, one test command). A
per-domain agent cannot complete a normal feature without writing to at least three of
them. Domain agents would serialize on the kernel, not work in parallel beside it.

**2. This repository already ran the multi-agent experiment, and it failed on
coordination, not on code quality.** The `agents/bridge/` ledger records a three-agent
protocol (orchestrator / executor / reviewer) active 2026-07-16 → 2026-07-19. Landing
**one** work package (S2 persistence) took **three dispatch attempts** (MSG-0030 →
MSG-0033 → MSG-0045) across a hung MCP gateway (MSG-0032, MSG-0036), an orchestrator
watcher pointed at a *different repository* (MSG-0027), duplicate dispatch of the same
task by a second orchestrator (MSG-0031), a session recovery (MSG-0043/0044), and a
stale-context failure in which an agent reported against an old branch and described
already-accepted ADRs as still pending (MSG-0038). The owner intervened twice. Of 52
ledger messages, the large majority are coordination, health checks, and failure
recovery. The bridge has been silent since 2026-07-19T00:58.

**What has demonstrably worked instead is independent review.** Commit `346ee85`
records *six findings from external reviewers on PR #23*, including a **cross-tenant
information disclosure** (an in-memory store keyed without `organizationId` let a
duplicate-id check reveal that another organization had used an id). PR #26 caught a
tenant-key **delimiter-aliasing** bug. PRs #20, #21, #25, #26, and #27 are all
post-merge corrections to work that had already been reported as verified.

**Therefore: persistence belongs in knowledge artifacts and contracts, not in agent
identity.** This repository already reconstructs context reliably from `CLAUDE.md`,
`IMPLEMENTATION_STATUS.md`, 14 ADRs, and per-slice test manifests. The investment is
to make that substrate cheaper to load and harder to go stale, and to strengthen the
one loop already finding security-relevant defects.

## Amendment 1 — 2026-07-29

Discovered while executing Stage 0, on the same day the plan was approved. Recorded
here because it corrects the plan's own evidence base.

**The plan's premise that work here is sequential and single-lane was wrong.** It was
inferred from `main`'s linear history and the dormant bridge. In fact five PRs were open
concurrently — #18, #29, #30 (42 commits ahead), #32, #33 — with substantial unmerged
work.

**The shared-kernel conclusion is strengthened, not weakened.** The collisions the
assessment predicted are already occurring. But the observed parallelism is one owner
across several tool sessions, not independent maintainers, and active collisions argue
for *governing shared surfaces and reducing concurrent lanes* — not for adding
autonomous agents. The [stopping rule](#the-stopping-rule) still requires a genuine
second maintainer or a truly decoupled surface; concurrent branches driven by one person
do not satisfy it.

**Two shared surfaces were missed by the original five-choke-point analysis, and both
are actively drifting:**

| Surface | Evidence (2026-07-29) | Consequence |
|---|---|---|
| **Sequential ADR numbering** | Three collisions in flight: ADR-0014 claimed by `claude/clarity-network-enrichment-f10807` though already merged as prescreen role mapping; ADR-0015 on `codex/om/sync-main`; ADR-0016 on `claude/prescreen-phase3-persistence` | `CLAUDE.md`'s "check `docs/architecture/` for the next free number" is only correct against **merged** history. Allocation must fetch/query open PR refs before checking all refs: `git fetch origin '+refs/pull/*/head:refs/remotes/origin/pr/*' --prune`, then `git log --all --name-only -- "docs/architecture/ADR-*"` |
| **One local `clarity_dev`, shared by 16 git worktrees** | The database held **16** applied migrations while this branch carried 12; the extra four (`prescreen_phase3_persistence`, `prescreen_persistence_rls`, `packet11_persistence`, `network_review_append_only_audit`) came from unmerged branches | `tests/integration/migration-integrity.test.ts` fails on an otherwise clean branch. **A local suite result is not by itself evidence about the branch under test.** CI's ephemeral Postgres is unaffected and is the authority |

**Consequences for the roles defined below.** R1 must treat ADR-number allocation and
migration-ledger drift as shared-surface checks, not local ones. R2 must never record a
local suite count without noting shared-database state. Both are folded into the
contracts as written.

**Also corrected:** the plan's Verification note that `npm install` alone repairs a
worktree's stale `node_modules`. It does, but the root `allowScripts` config blocks
Prisma's postinstall, so `npx prisma generate` is required afterward or DB-backed suites
fail on a stale client.

## Topology

Three roles. No persistent domain agents, no orchestrator, no inter-agent channel.

| ID | Name | Model | Writes? | Purpose |
|---|---|---|---|---|
| **R1** | Invariant Verifier | Reusable | **No** | Pre-PR verification against the six architecture invariants and the truth-discipline rules |
| **R2** | Session Continuity Steward | Reusable | 3 files only | Reconcile status artifacts with what actually ran |
| **T1** | Bounded Slice Implementer | Temporary, per package | In-scope files | Implement one approved work package |

Human owner (Tyler) holds every decision right: product strategy, scope, business-rule
and compliance interpretation, schema and contract changes, role/permission mapping,
tenant-isolation posture, risk acceptance, production access, and release approval.
Agents recommend. Agents never silently redefine the product, alter a business rule,
or accept risk.

## Stages

| Stage | Goal | Entry gate | Exit gate | Burden |
|---|---|---|---|---|
| **0. Preparation** | Context path loads clean in ≤7 files | This plan approved | No contradictions at session open | Low |
| **1. R1 trial** | Prove independent verification pays for itself | Stage 0 done | ≥4/6 blind findings + live-PR precision ≥0.5 | Low |
| **2. R2 addition** | Stop status-doc drift | R1 stable ≥3 PRs | Zero drift at 3 consecutive session opens | Low |
| **3. T1 formalization** | Bounded implementation under a written charter | R1+R2 stable **and** an unblocked work package exists | One package lands with no post-merge fix PR | Moderate |

Stage 3 is the intended terminal state. See [The stopping rule](#the-stopping-rule).

---

## Stage 0 — Preparation

Tasks 0.1–0.3 are required before any agent work. Task 0.4 is strongly recommended and
independently valuable.

### 0.1 Collapse `IMPLEMENTATION_STATUS.md` to one current-state block

**Problem (verified):** the file carries three stacked `As of 2026-07-19` headers with
divergent counts (343/343, 333/333, 268/268). Any reader must currently infer which is
authoritative.

**Change:** one `## Current State` block at the top — branch, HEAD, counts, what was
actually run. Move prior dated blocks verbatim under
`## Verification history (historical — not current)`. Keep the existing buckets
(Completed / Scaffolded / Documented only / Blocked / Not started) unchanged.

**Acceptance:** a reader answers "what is true right now" from the first 30 lines with
no cross-referencing.

**ADR:** not needed — presentation of existing facts, no decision.

**Status: HELD.** PR #30 adds ~50 lines to this file. Restructuring it now guarantees a
conflict. Start after #30 merges or closes.

### 0.2 Quarantine `agents/bridge/`

**Problem (verified):** the directory documents a live-looking operating model that has
been dormant since 2026-07-19T00:58. `PROTOCOL.md` describes roles nobody fills,
`npm run bridge:*` scripts remain in `package.json`, and MSG-0027 records the watcher
pointing at a different repository. An agent loading repository context today can
reasonably conclude an orchestrator is running.

**Change:** move `agents/bridge/` → `docs/experiments/2026-07-agent-bridge/`,
preserving `LEDGER.md` and all 52 messages **unchanged as evidence**. Add a `README.md`
there headed:

> **Status: abandoned experiment. Preserved as evidence, not as an operating model.**
> Three-agent bridge (orchestrator / executor / reviewer), active 2026-07-16 →
> 2026-07-19, retired 2026-07-DD. Landing one work package required three dispatch
> attempts (MSG-0030 → MSG-0033 → MSG-0045), a duplicate dispatch (MSG-0031), a
> stale-branch misroute (MSG-0038), infrastructure failures (MSG-0032, MSG-0036), and
> two owner interventions. Do not treat any file here as current guidance.

**Every live entry point must go, not just the directory.** Verified inventory as of
2026-07-29 — a partial quarantine leaves broken paths that still advertise the retired
model:

| Location | Reference |
|---|---|
| `package.json` | `bridge:doctor`, `bridge:status`, `bridge:test` scripts |
| `README.md:99` | directs developers to `agents/bridge/PROJECT_CONFIGURATION.md` and `PROTOCOL.md` |
| `README.md:114-115` | documents `npm run bridge:status` / `bridge:test` |
| `agent_bridge/` (root, separate wake-layer dir) | `BRIDGE_SAFETY.md`, `antigravity_outbox.md`, `claude_outbox.md`, `bridge_rules.md` all cite `agents/bridge/` as the system of record |
| `IMPLEMENTATION_STATUS.md` | **Bridge** bullet describes the watcher as `listener=running` |
| `AGENTS.md`, `CLAUDE.md` | check for residual references |

Decide `agent_bridge/`'s fate explicitly: it is the notification mirror for the retired
canonical mailbox, so it should be quarantined alongside rather than left pointing at a
moved directory.

**Acceptance:** a repo-wide search returns no live reference to a running bridge and no
broken path to the moved directory:

```bash
grep -rn "agents/bridge\|bridge:doctor\|bridge:status\|bridge:test" \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=docs/experiments .
```

Every remaining hit must be inside `docs/experiments/2026-07-agent-bridge/` or an
explicitly historical record.

**ADR: yes — [ADR-0017](../architecture/ADR-0017-agent-operating-model-and-bridge-retirement.md)**
(written 2026-07-29). Not 0015: ADR-0015 and ADR-0016 were already allocated on unmerged
branches. See [Amendment 1](#amendment-1--2026-07-29).

**Status: HELD.** PR #30 (`codex/om/sync-main`, 42 commits) modifies
`agents/bridge/LEDGER.md`, so moving the directory now is a move/edit conflict against
that work. Start after #30 merges or closes.

### 0.3 Add a work-package template

**Change:** `docs/governance/WORK_PACKAGE_TEMPLATE.md`:

```text
# Work Package: <name>
Approved by: <owner> on <date>     ADR (if shared contract touched): <ADR-00NN | none>
Goal: <one sentence>
In scope — files/packages: <explicit list>
Prohibited paths (require an ADR): prisma/schema.prisma · domain-contracts enum
  arrays · new case-repository gateways · new api-service routes · cross-package
  refactors
Acceptance evidence required:
  [ ] tests written AND run this session — exact counts: ____
  [ ] npm run lint · npm run typecheck · npm test · npx prisma validate — all pass
  [ ] zero synthetic residue in clarity_dev
  [ ] R1 verdict attached, including its "not checked" list
  [ ] docs updated (implementation doc + test manifest with honest gaps)
Explicitly NOT claimed: <list>
Open questions / blocked on: <list>
```

**Acceptance:** template exists and is referenced from `CLAUDE.md`'s Workflow section.

**ADR:** not needed.

**Status: partially HELD.** The new file is conflict-free, but the `CLAUDE.md` reference
is not — PR #30 edits that file. Land the template with #30's `CLAUDE.md` change, or
after it.

### 0.4 Add the enum-sync test (recommended)

**Problem (verified):** `CLAUDE.md` requires `domain-contracts` enum arrays to mirror
`prisma/schema.prisma`, and the contract files carry comments saying so — but **no test
enforces it.** A desync is silent and system-wide. This is the highest-likelihood
unguarded breakage path in the repository.

**Change:** `tests/unit/contract-schema-enum-sync.test.ts` — parse the schema's enum
blocks and compare membership against the exported arrays, asserting set equality.

**Coverage must be driven from the schema, not from a hand-picked file list.** An
earlier draft of this section named eight contract files, which would have left
`episode.ts` and `utilizationReview.ts` unchecked — `EPISODE_STATUSES`,
`CASE_EPISODE_RELATIONSHIPS`, the authorization-review enums, `DENIAL_REASON_CODES`,
and the documentation-gap enums could all have desynced while the suite passed and
Stage 0 reported the invariant as machine-enforced. The implemented test instead
enumerates **every** enum in `schema.prisma` and requires each to be classified as
either mirrored (32 pairs, spanning all contract files) or explicitly not mirrored
(13, each with a stated reason), so a newly added enum fails until classified.

**Why in Stage 0:** it converts a review-enforced invariant into a machine-enforced
one, which reduces what R1 must reason about. Preparation that shrinks the agent's job
is the right kind of preparation.

**Acceptance:** test passes; deliberately desyncing one enum locally makes it fail.

**ADR:** not needed — enforces an already-documented invariant.

---

## Stage 1 — R1: Invariant Verifier

**Location:** `.claude/agents/invariant-verifier.md` (project subagent, committed via
PR).
**Tools:** `Read`, `Grep`, `Glob`, `Bash`. **No `Edit`, no `Write`.**

**Read-only is NOT tool-enforced, and this plan previously claimed otherwise.** `Bash`
can write, delete, and run `git` mutations through redirection and shell commands, so
withholding `Edit`/`Write` narrows the surface but does not close it. `Bash` is retained
because R1's truth-discipline job requires actually running `lint`, `typecheck`, the test
suite, and `git log` — a verifier that cannot reproduce a claimed test count cannot check
the claim. The residual risk is therefore real and is mitigated structurally rather than
by assertion:

- **R1 runs in a throwaway git worktree at the commit under review**, never in a working
  worktree. Any accidental mutation is discarded with the worktree.
- The contract forbids writes explicitly, and the owner reviews every run's output.
- R1 never has credentials to push, merge, or publish.

If a genuinely read-only shell becomes available, drop `Bash` for a constrained runner
and this caveat can be removed.

**Human review rule:** every finding is triaged by the owner; R1 never fixes, commits,
or merges.

### Contract

```markdown
You verify a diff against the Clarity Platform's architecture invariants. You are
read-only: you never edit, commit, or merge. You do not judge product scope — that
is the owner's. Report findings; do not fix them.

## Load first
0. AGENTS.md — repository policy, evidence labels, security boundaries
1. CLAUDE.md — invariants and truth-discipline rules. It does not override
   AGENTS.md repository policy; any conflict with AGENTS.md is a finding.
   CLAUDE.md precedence is limited to Claude-specific manual tailoring.
2. The ADRs governing the touched area (docs/architecture/ADR-00NN-*.md)
3. The diff under review
4. The touched package's commands.ts / permissions.ts / <x>CommandService.ts
5. The area's manifest in docs/testing/

## Verify each invariant. Report VERIFIED / VIOLATED / NOT CHECKED with file:line.

1. ONE PRISMA PACKAGE — only packages/case-repository/src/*,
   tests/integration/helpers/harness.ts, and scripts/seed.ts may import
   @prisma/client. scripts/seed.ts:1 has imported it directly since the repository
   foundation; it is a known, approved, pre-existing exception, NOT a violation to
   report. Flag any *new* importer outside these three.
2. COMMAND PATTERN — every new command: strict Zod envelope (unknown fields
   rejected) -> explicit injected role policy over exact UserRole enum values (never
   "admin" shorthand) -> ONE transaction containing: tenant-scoped read, state machine
   evaluated on the FRESH row, conditional versioned UPDATE, atomic audit event,
   idempotency record. A failed command must leave zero residue.
3. TENANCY IN EVERY PREDICATE — every query and write predicate includes
   organizationId. A record id is never authorization. Cross-tenant misses return
   non-revealing errors. Check specifically for composite/derived keys that could
   ALIAS across tenants (e.g. string-concatenated keys where an id may contain the
   delimiter) and for in-memory stores keyed without organizationId.
4. AUDIT — append-only, passes the restricted-identifier guard. Metadata carries
   hashes and field NAMES only: never source text, file bytes, or raw filenames.
5. IMMUTABILITY BY CONSTRUCTION — where required (evidence originalText/category,
   document versions, attested assessments), no change-set TYPE may express the
   forbidden update. A runtime check is not sufficient.
6. CONTRACTS — additions live in packages/domain-contracts and stay pure; enum
   arrays mirror prisma/schema.prisma exactly.

## Also verify
- Actor-type mapping: every actor type a command accepts must be expressible in the
  event envelope. Flag any accepted actor that would fail envelope validation.
- Version-citing commands must reference the CURRENT version, not any historical one.
- Gateway reads must not hand callers mutable references to internal state.
- Derived-value inputs must be persisted and hash-covered if the derivation must be
  reconstructable later.
- TRUTH DISCIPLINE: any test count, "passing", or "verified" claim in the diff or its
  docs must be reproducible. Flag claims you cannot reproduce. Flag any claim of
  production readiness, HIPAA compliance, working external integrations, or approved
  clinical/legal rules.
- PROHIBITED PATHS without a cited ADR: prisma/schema.prisma, domain-contracts enum
  arrays, new case-repository gateways, new api-service routes.

## Shared-surface checks (must be run against ALL refs, not just merged history)
- ADR NUMBER COLLISION: a new ADR number must be free across every ref, not only
  docs/architecture/ on this branch. Fetch/query open PR refs first; `git log --all`
  only examines refs already present locally and does not contact GitHub.
  Do NOT reduce to bare numbers and `sort -u` — that collapses each number to one
  line and so hides precisely the duplicate being looked for. (An earlier version of
  this plan did exactly that and could not have detected any collision.) Compare
  distinct FILENAMES per number instead:
    git fetch origin '+refs/pull/*/head:refs/remotes/origin/pr/*' --prune
    git log --all --name-only --pretty=format: -- "docs/architecture/ADR-*" \
      | grep -oE "ADR-[0-9]{4}[^[:space:]]*" | sort -u \
      | awk 'match($0, /ADR-[0-9]{4}/) {
               n = substr($0, RSTART, RLENGTH)
               seen[n] = seen[n] "\n    " $0; count[n]++
             }
             END { for (n in count) if (count[n] > 1) print "COLLISION " n ":" seen[n] }'
  Verified 2026-07-29: this reports `COLLISION ADR-0014` with both
  `ADR-0014-network-enrichment-contracts.md` and
  `ADR-0014-prescreen-role-mapping-and-api-slice.md`, which the bare-number pipeline
  did not surface. To pick the next free number, take the highest number seen across
  all refs and add one — `main` alone is not sufficient, since 0015-0017 existed only
  on unmerged branches while `main`'s latest was 0014. Treat a duplicate as a VIOLATION.
- MIGRATION LEDGER DRIFT: the shared local clarity_dev is used by many worktrees and
  may hold migrations from other branches. If migration-integrity fails, report it as
  ENVIRONMENTAL drift with the extra migration names — do NOT report it as a defect in
  the diff, and do NOT suggest resetting the database (owner decision, destructive).
- A local suite result is not by itself evidence about the branch under test. Say which
  database it ran against and whether its ledger matched the branch.

## Output
For each finding: severity (Critical / High / Medium / Low), file:line, the concrete
failure scenario (inputs -> wrong outcome), and the invariant breached.
Then: an explicit "NOT CHECKED" list — anything you could not verify and why.
Escalate immediately, as Critical: any suspected cross-tenant path, any PHI/PII/secret,
any weakening of assertLocalClarityDevDatabase.
State your confidence. An uncertain finding labeled uncertain is useful; a confident
wrong finding about tenancy is worse than silence.
```

### Trial protocol

**Step 1 — blind replay of PR #23.** Current `HEAD` already contains the fixes, so R1
must never read the fixed files. Run against a detached worktree at the pre-fix commit:

```bash
git worktree add /tmp/r1-replay-pr23 ad1b7e9
```

Point R1 at that path only; keep `346ee85` out of its context; remove the worktree
afterward.

**Scorecard — the six findings recorded in `346ee85`.** Grade blind.

| # | Finding | Severity | Found? |
|---|---|---|---|
| 1 | In-memory assessment store not tenant-scoped → duplicate-id check discloses that another organization used an id | **Critical** | ☐ |
| 2 | `AGENT`/`SYSTEM` command actors unmapped to the envelope's `SERVICE` type → envelope validation fails mid-command | High | ☐ |
| 3 | `SubmitPrescreen` accepts any immutable assessment version → a superseded parent can be submitted after a supplement | High | ☐ |
| 4 | Routing inputs not persisted or hash-covered → derived pathways unreconstructable after attestation | Medium | ☐ |
| 5 | Gateway reads return shallow references → callers mutate internal state through nested objects | Medium | ☐ |
| 6 | `canonicalStringify` mishandles `toJSON`-bearing objects | Low | ☐ |

**Step 2 — replay PR #26** (`1470e00`) from a worktree at its parent: does R1 flag that
an `organizationId:assessmentVersionId` string key **aliases across tenants** when an
id contains `:`? This is the sharpest test of invariant 3 and the defect class with the
worst consequence.

**Step 3 — one live PR.** Run R1 before the owner's self-review. Owner triages every
finding as **real / style / false**, and logs minutes spent.

### Stage 1 gate

The recovery-count bands are mutually exclusive and cover every outcome, so the same
result can never satisfy two branches:

- **Go** — **≥4 of 6** recovered **including finding #1**; PR #26 aliasing flagged;
  live-PR precision ≥0.5 with triage ≤20 minutes.
- **Ambiguous** — **2 or 3 of 6** recovered; or ≥4 recovered but #1 missed; or the
  seeded recovery criteria are met but live-PR precision is ≥0.3 and <0.5; or no
  live-PR findings are reported, leaving precision undefined. One prompt revision,
  one re-run, then decide. Not an open-ended tuning loop.
- **No-go, stop** — **≤1 of 6** recovered; or live-PR precision is defined and <0.3;
  or triage costs more than the fix PRs did; or **any confident-but-wrong tenancy
  claim** (an unreliable safety reviewer is worse than none).

The non-count no-go conditions (precision, triage cost, a false tenancy claim) override
a Go or Ambiguous count. A verifier that finds defects but also invents them is not
usable.

---

## Stage 2 — R2: Session Continuity Steward

**Entry:** R1 stable across ≥3 PRs.
**Location:** `.claude/agents/session-steward.md`.
**Tools:** `Read`, `Grep`, `Glob`, `Bash`, `Edit` — write access restricted by contract
to exactly four declared target groups (`IMPLEMENTATION_STATUS.md`, the `CLAUDE.md`
project-state block, `docs/testing/*_TEST_MANIFEST.md`, and the generated
`graphify-out/` tree); every run is reviewed before commit. Whoever authors
`.claude/agents/session-steward.md` must carry all four — a three-target summary would
silently drop graph maintenance — and must preserve the graph determinism rule below.

```markdown
You reconcile Clarity's durable status artifacts with what ACTUALLY ran this session.
You may edit ONLY: IMPLEMENTATION_STATUS.md, the CLAUDE.md project-state block,
docs/testing/*_TEST_MANIFEST.md, and the generated graphify-out/ tree (graph.json,
manifest.json, GRAPH_REPORT.md, cache) produced by the graph step below — graph files
are inside the boundary only when generated deterministically from the canonical
checkout or from tooling that normalizes/excludes worktree-dependent paths. Never
product code, schema, contracts, or ADR content. If graphify would key output by an
active worktree path, nested .claude/.codex worktree, absolute path, or mtime-sensitive
manifest entry, report `GRAPH_SKIPPED_NON_CANONICAL_WORKTREE` and do not commit
graphify-out changes.

THE ONE RULE THAT OVERRIDES EVERYTHING: never record a test count, "passing", or
"verified" that was not produced by a command run in this session. If a suite did not
run, say it did not run. If you cannot confirm a count, write [Unverified].
Violating this rule ends your role.

Steps:
1. Collect what ran: exact commands and exact outputs from this session. Record WHICH
   database DB-backed suites ran against, and whether its migration ledger matched this
   branch — the local clarity_dev is shared across worktrees and drifts. A count from a
   drifted database is [Unverified] for this branch.
2. Update IMPLEMENTATION_STATUS.md's single Current State block: branch, HEAD, counts,
   what ran, what did not, residue check. Move any superseded record to the history
   appendix — never delete it.
3. Update the CLAUDE.md project-state block only if the phase, decisions, open
   decisions, or next action actually changed.
4. Update affected test manifests, preserving their honest-gaps sections.
5. Update the graph only from the repository's declared canonical checkout, or from a
   graphify mode/config that normalizes paths and excludes nested/generated worktrees.
   If neither condition is true, skip the graph update, record
   `GRAPH_SKIPPED_NON_CANONICAL_WORKTREE`, and do not commit graphify-out changes.
6. Report: completed items, then THE SINGLE next action.
7. List every claim you could not verify.
```

**Protocol:** R2 runs at session close for 3 consecutive sessions. Measure
**status-drift incidents at the next session open** (contradiction, stale count, or
wrong next action).

**Gate:** zero drift across 3 opens and zero unverified claims → keep. Any fabricated
or unverifiable claim → **retire R2 immediately**; the repository's first hard rule
outranks the convenience.

---

## Stage 3 — T1: Bounded Slice Implementer

**Entry — all four required:** R1 and R2 stable; a completed work-package template
approved by the owner; **an actually unblocked package**; and **T1's full agent contract
authored and owner-approved** — an explicit tool allowlist, prohibited actions, required
output schema, and human-review rule, per AI_GOVERNANCE.md §21-23. The charter below is
not a contract. Until that contract exists and is approved, T1 may not run, regardless
of how eligible the other three conditions look.

As of 2026-07-29 nothing qualifies: prescreen Phase 3 persistence is gated on the
provider-backed Cloud SQL/RLS verification, the cross-organization submission/receipt
model is an open owner packet, and prescreen UI scope is undecided. **Do not start
Stage 3 by relaxing this gate** — select the work when it unblocks.

**Model:** temporary, per package. Reconstructs context per the load order every time;
retains nothing between packages.

**Charter (fixed):** implement exactly the approved work package, inside the named
files, following the command-pattern template. Prohibited without a cited ADR:
`prisma/schema.prisma`, `domain-contracts` enum arrays, new `case-repository`
gateways, new `api-service` routes, cross-package refactors. Definition of done is the
template's acceptance list, R1 clean, CI `verify` green, owner merge.

**Gate:** the package lands with **no post-merge fix PR.** A post-merge fix means the
loop is not yet trustworthy — run one more package before drawing a conclusion.

---

## The stopping rule

**Stage 3 is the intended terminal state, not a milestone toward something larger.**

Expanding to persistent domain agents requires a second genuine work lane — a real
second maintainer, or a truly decoupled surface such as a separate UI application with
its own tests and no kernel writes. Absent that, expansion buys coordination cost
against illusory parallelism: `prisma/schema.prisma`, `packages/domain-contracts`,
`packages/case-repository`, `packages/api-service/src/server.ts`, and the flat `tests/`
tree serialize the work regardless of how many agents exist.

This rule is recorded here because it will be most tempting to ignore at the moment
Stage 3 succeeds.

## Explicitly not in this plan

Persistent domain, feature, or workflow agents · an orchestrator or coordination owner
· any inter-agent messaging channel (tried; retired) · an integration-owner agent ·
separate security, data, release, observability, or acceptance roles · per-domain
charters or knowledge packages · an agent registry · any role that reads or writes
production, sends external messages, touches case data, or reasons about clinical or
legal rule semantics.

## Context reconstruction (all roles)

Fixed load order. Code wins over documentation on any conflict; record the conflict
rather than silently adopting either side.

0. `AGENTS.md` — repository policy. It states it "should be treated as policy; do not
   ignore these guardrails," and carries the workspace-verification steps, the evidence
   protocol (`[Unknown]` / `[Unverified]` labels), the scoped surfaces, and the
   security boundaries. Load it first. Where it conflicts with `CLAUDE.md`, AGENTS.md
   remains authoritative for repository policy; record the conflict instead of
   following the weaker rule. CLAUDE.md precedence is limited to Claude-specific
   manual tailoring.
1. `CLAUDE.md` — operating rules, project-state block, house terminology
2. `git status` (must be clean) + `git log -15` + current branch
3. `IMPLEMENTATION_STATUS.md` — **the topmost dated block only**
4. Relevant ADRs (`docs/architecture/`)
5. Target package `commands.ts` / `permissions.ts` / `<x>CommandService.ts`
6. The area's test manifest in `docs/testing/`, then the test files
7. `graphify query "<question>"` for relationship questions instead of broad grep

**Before opening any PR**, check whether another lane moved a shared surface:

```bash
git log --oneline -20 -- prisma/schema.prisma packages/domain-contracts \
  packages/case-repository packages/api-service/src/server.ts
```

**Before allocating an ADR number**, fetch/query open PR refs, then check every ref —
not just this branch. Merged history alone is insufficient; three collisions existed on
2026-07-29, and `git log --all` only sees refs already present locally:

```bash
git fetch origin '+refs/pull/*/head:refs/remotes/origin/pr/*' --prune
git log --all --name-only --pretty=format: -- "docs/architecture/ADR-*" \
  | grep -oE "ADR-[0-9]{4}[^[:space:]]*" | sort -u
```

**Before trusting a DB-backed suite result**, confirm the shared local `clarity_dev`
ledger matches this branch — 16 worktrees share it:

```bash
ls prisma/migrations | grep -c '^2'   # compare against _prisma_migrations rows
```

**Do not implement when:** the slice's ADR is missing or contradicts the code; the work
touches a prohibited path without an approved ADR; test counts cannot be reproduced; or
the work depends on an open `OD-n` or decision packet.

## Metrics ledger

Tracked from Stage 1 onward, one row per PR. Speed is not a metric.

| Metric | Baseline | Target | Source |
|---|---|---|---|
| Escaped-defect rate (post-merge fix PRs per feature PR) | ~1.0 across the prescreen chain — PRs #20, #25, #26, #27 following #17/#19/#23 (directional, from git history) | <0.5 | `git log` |
| R1 recall on replay | — | ≥4/6, including finding #1 | scorecard above |
| R1 precision | — | ≥0.5 | owner triage |
| **Invariant-breach escapes to `main`** | **2 realized** (PR #25 unscoped store, PR #26 key aliasing) | **0** | R1 + external reviewers |
| Claim reproducibility | — | 100% | session runs |
| Status-drift at session open | recurring | 0 | session open |
| Owner triage minutes per PR | — | ≤20, trending down | owner |
| Coordination messages per landed package | ~3 dispatches + ~10 recovery for one package (bridge) | ≤2 | — |

## What this plan does not claim

It does not claim production readiness, HIPAA compliance, clinical or legal
correctness, or that any rule content in this repository is approved. It does not claim
that R1, R2, or T1 will work — Stage 1 exists to find out, and the stop conditions are
binding. All thresholds are proposed and require owner approval. The escaped-defect
baseline is directional, read from commit history, not a measured rate. No product AI
agent is authorized, described, or implied.
