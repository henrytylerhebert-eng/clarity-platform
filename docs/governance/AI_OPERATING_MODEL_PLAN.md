---
status: Proposed (requires owner approval)
owner: Tyler Hebert
version: 1.0.0
created: 2026-07-29
scope: development tooling only — NOT product AI agents
related_adrs: ADR-0015 (proposed, bridge retirement)
related_docs:
  - docs/governance/AI_GOVERNANCE.md
  - docs/governance/HUMAN_APPROVAL_GATES.md
  - docs/governance/PRODUCT_EVIDENCE_AND_DECISION_PROTOCOL.md
  - docs/developer-handoff/CLAUDE_OPERATING_MANUAL.md
supersedes: agents/bridge/PROTOCOL.md (three-agent bridge, retired)
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

The agent specifications below do satisfy AI_GOVERNANCE.md's contract requirement in
form — explicit tool allowlist, prohibited actions, required output, human-review rule
— because that is the right bar for any agent in this repository, product or not.

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

Also remove `bridge:doctor` / `bridge:status` / `bridge:test` from `package.json`, and
update the **Bridge** bullet in `IMPLEMENTATION_STATUS.md` to record retirement.

**Acceptance:** no live path (`package.json`, `AGENTS.md`, `CLAUDE.md`) references a
running bridge.

**ADR: yes — ADR-0015.** This retires a previously adopted operating model, and the
evidence for why belongs in the decision record.

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

### 0.4 Add the enum-sync test (recommended)

**Problem (verified):** `CLAUDE.md` requires `domain-contracts` enum arrays to mirror
`prisma/schema.prisma`, and the contract files carry comments saying so — but **no test
enforces it.** A desync is silent and system-wide. This is the highest-likelihood
unguarded breakage path in the repository.

**Change:** `tests/unit/contract-schema-enum-sync.test.ts` — parse the schema's enum
blocks, compare against the exported arrays in `domain-contracts` (`roles.ts`,
`caseStateMachine.ts`, `evidence.ts`, `benefits.ts`, `authorization.ts`,
`documents.ts`, `legalStatus.ts`, `workstreams.ts`), assert set equality per enum with
a maintained allowlist for arrays that intentionally do not mirror a schema enum.

**Why in Stage 0:** it converts a review-enforced invariant into a machine-enforced
one, which reduces what R1 must reason about. Preparation that shrinks the agent's job
is the right kind of preparation.

**Acceptance:** test passes; deliberately desyncing one enum locally makes it fail.

**ADR:** not needed — enforces an already-documented invariant.

---

## Stage 1 — R1: Invariant Verifier

**Location:** `.claude/agents/invariant-verifier.md` (project subagent, committed via
PR).
**Tools:** `Read`, `Grep`, `Glob`, `Bash`. **No `Edit`, no `Write`** — the read-only
property is enforced by the tool allowlist, not by instruction.
**Human review rule:** every finding is triaged by the owner; R1 never fixes, commits,
or merges.

### Contract

```markdown
You verify a diff against the Clarity Platform's architecture invariants. You are
read-only: you never edit, commit, or merge. You do not judge product scope — that
is the owner's. Report findings; do not fix them.

## Load first
1. CLAUDE.md — invariants and truth-discipline rules
2. The ADRs governing the touched area (docs/architecture/ADR-00NN-*.md)
3. The diff under review
4. The touched package's commands.ts / permissions.ts / <x>CommandService.ts
5. The area's manifest in docs/testing/

## Verify each invariant. Report VERIFIED / VIOLATED / NOT CHECKED with file:line.

1. ONE PRISMA PACKAGE — only packages/case-repository/src/* and
   tests/integration/helpers/harness.ts may import @prisma/client.
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

- **Go** — ≥4 of 6 recovered **including finding #1**; PR #26 aliasing flagged; live-PR
  precision ≥0.5 with triage ≤20 minutes.
- **No-go, stop** — <3 of 6 recovered; precision <0.3; triage costs more than the fix
  PRs did; or **any confident-but-wrong tenancy claim** (an unreliable safety reviewer
  is worse than none).
- **Ambiguous** (2–3 of 6, or #1 missed but others found) — one prompt revision, one
  re-run, then decide. Not an open-ended tuning loop.

---

## Stage 2 — R2: Session Continuity Steward

**Entry:** R1 stable across ≥3 PRs.
**Location:** `.claude/agents/session-steward.md`.
**Tools:** `Read`, `Grep`, `Glob`, `Bash`, `Edit` — write access restricted by contract
to exactly three targets; every run is reviewed before commit.

```markdown
You reconcile Clarity's durable status artifacts with what ACTUALLY ran this session.
You may edit ONLY: IMPLEMENTATION_STATUS.md, the CLAUDE.md project-state block, and
docs/testing/*_TEST_MANIFEST.md. Never product code, schema, contracts, or ADR content.

THE ONE RULE THAT OVERRIDES EVERYTHING: never record a test count, "passing", or
"verified" that was not produced by a command run in this session. If a suite did not
run, say it did not run. If you cannot confirm a count, write [Unverified].
Violating this rule ends your role.

Steps:
1. Collect what ran: exact commands and exact outputs from this session.
2. Update IMPLEMENTATION_STATUS.md's single Current State block: branch, HEAD, counts,
   what ran, what did not, residue check. Move any superseded record to the history
   appendix — never delete it.
3. Update the CLAUDE.md project-state block only if the phase, decisions, open
   decisions, or next action actually changed.
4. Update affected test manifests, preserving their honest-gaps sections.
5. Run: graphify update .
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

**Entry — all three required:** R1 and R2 stable; a completed work-package template
approved by the owner; and **an actually unblocked package.**

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
