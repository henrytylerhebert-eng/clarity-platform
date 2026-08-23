# ADR-0017: Development-agent operating model and retirement of the three-agent bridge

- **Status:** Accepted (owner approval 2026-07-29)
- **Decides:** `docs/governance/AI_OPERATING_MODEL_PLAN.md`
- **Retires:** `agents/bridge/PROTOCOL.md` and the three-agent bridge
- **Scope:** development tooling only — does **not** touch product AI agents,
  which remain governed solely by `docs/governance/AI_GOVERNANCE.md` and
  `docs/governance/HUMAN_APPROVAL_GATES.md`

> **Numbering note.** This ADR is 0017, not 0015. ADR-0015 was allocated on
> `codex/om/sync-main` (network-enrichment remediation) and ADR-0016 on
> `claude/prescreen-phase3-persistence`, both unmerged at the time of writing.
> A third collision exists: `claude/clarity-network-enrichment-f10807` claims
> ADR-0014, which is already merged as prescreen role mapping. Sequential ADR
> numbering is therefore itself an ungoverned shared surface — recorded in
> Consequences below.

## Context

A 2026-07-29 assessment evaluated whether this repository could be organized
around persistent, domain-aware agents owning product areas, coordinating
through shared contracts.

Two lines of repository evidence answered no.

**The repository is a shared-kernel monolith with domain-shaped modules, not a
set of bounded contexts.** Five surfaces are touched by essentially every
feature: `prisma/schema.prisma` (one file, 38 models, 45 enums);
`packages/domain-contracts` (55 inbound import references);
`packages/case-repository` (5,117 LOC, the only *package* permitted to import
`@prisma/client`, holding a gateway for every domain — `scripts/seed.ts:1` is a
known pre-existing exception outside the package boundary);
`packages/api-service/src/server.ts` (375 LOC, all domains' routes); and
`tests/` (36 files in one flat tree behind a single runner). A per-domain agent cannot complete an ordinary feature without
writing to at least three of them, so domain agents would serialize on the
kernel rather than work in parallel beside it.

**The multi-agent experiment already ran here, and failed on coordination
rather than on code quality.** `agents/bridge/` records a three-agent protocol
(Antigravity orchestrator, Claude executor, Codex reviewer) active
2026-07-16 → 2026-07-19, with an append-only 52-message ledger. Landing one
work package — S2 persistence — took three dispatch attempts (MSG-0030 →
MSG-0033 → MSG-0045) across:

- a hung MCP gateway that interrupted the first dispatch (MSG-0032, MSG-0036);
- an orchestrator file-mirror watcher pointed at a **different repository**
  (MSG-0027);
- duplicate dispatch of the same approved task by a second orchestrator
  (MSG-0031);
- a session recovery (MSG-0043, MSG-0044);
- a **stale-context failure** in which an agent reported against an old branch
  and described already-accepted ADRs as still pending (MSG-0038).

The owner intervened directly twice (MSG-0041, and the 2026-07-18T23:10:30
mass close). Of 52 ledger messages, the large majority are coordination,
health checks, and failure recovery. The bridge has been silent since
2026-07-19T00:58 and its watcher never pointed at this repository.

**What has demonstrably worked instead is independent review.** Commit
`346ee85` records six findings from external reviewers on PR #23, including a
cross-tenant information disclosure — an in-memory store keyed without
`organizationId`, letting a duplicate-id check reveal that another
organization had used an id. PR #26 caught a related tenant-key aliasing
defect where a `:`-delimited composite key could collide across tenants. PRs
#20, #21, #25, #26, and #27 are all post-merge corrections to work previously
reported as verified.

**One of the two external reviewers has since been withdrawn.** On PR #33
`gemini-code-assist` posted that the consumer version on GitHub "has been
sunset" and that all code review activity has ceased. `chatgpt-codex-connector`
remains and reviewed PR #33 substantively — seven findings, all valid,
including that a claimed read-only tool boundary was unenforceable because the
role retained shell access, and that `scripts/seed.ts` already breaks the
one-Prisma-package rule the verifier was told to enforce.

This halves the repository's independent-review capacity and strengthens rather
than weakens the case for R1: the loop that has been catching cross-tenant and
fail-open defects now rests on a single external service that could be
withdrawn on the same notice.

## Decision

### 1. Retire the three-agent bridge

The bridge is retired as an operating model. `agents/bridge/` moves to
`docs/experiments/2026-07-agent-bridge/` with the `LEDGER.md` and all 52
messages preserved **unchanged as evidence**, headed by an
abandoned-experiment notice. The `bridge:doctor`, `bridge:status`, and
`bridge:test` scripts are removed from `package.json`.

No inter-agent messaging channel replaces it. Agents report to the owner.

### 2. Persistence lives in knowledge artifacts and contracts, not agent identity

This repository already reconstructs working context reliably from
`CLAUDE.md`, `IMPLEMENTATION_STATUS.md`, the ADR set, and per-slice test
manifests, and 14 ADRs accumulated without any persistent agent holding them.
The bridge's persistent identities produced stale context and duplicate
dispatch. Investment therefore goes into making the artifact substrate cheaper
to load and harder to go stale — not into standing agent identities.

### 3. Minimum topology: two reusable roles and one temporary role

| ID | Role | Model | Writes? |
|---|---|---|---|
| R1 | Invariant Verifier | Reusable | **Forbidden by contract, NOT tool-enforced** — see below |
| R2 | Session Continuity Steward | Reusable | Four declared write-target groups only |
| T1 | Bounded Slice Implementer | Temporary, per work package | In-scope files only |

R1's read-only property is **not** enforced by the tool allowlist. `Edit` and
`Write` are withheld, but `Bash` is retained — R1's truth-discipline job
requires actually running `lint`, `typecheck`, the suite, and `git log`, since a
verifier that cannot reproduce a claimed test count cannot check the claim — and
`Bash` can write or delete through redirection and shell commands. Withholding
`Edit`/`Write` narrows the surface; it does not close it.

The residual risk is real and is mitigated structurally rather than by
assertion: R1 runs in a **throwaway git worktree** at the commit under review so
any accidental mutation is discarded, its contract forbids writes explicitly,
the owner triages every finding, and R1 holds no credential to push, merge, or
publish. See `AI_OPERATING_MODEL_PLAN.md`, Stage 1, for the full residual-risk
statement, which this ADR must not restate more confidently than it is written
there.

No persistent domain, feature, or workflow agent. No orchestrator. No
coordination owner. No integration-owner agent. Independent verification stays
structurally separate from implementation: R1 never fixes, commits, or merges,
and CI `verify` plus external PR reviewers remain the authority.

### 4. Human decision rights are unchanged and not delegable

Product strategy, scope, business-rule and compliance interpretation, schema
and migration changes, contract-breaking changes, role and permission mapping,
tenant-isolation posture, risk acceptance, production access, and release
approval remain with the owner. Agents recommend; agents never silently
redefine the product, alter a business rule, or accept risk.

### 5. Staged adoption with binding stop conditions

Stage 0 preparation, then an R1 trial scored against the six documented PR #23
findings, then R2, then T1. Stage 3 is the intended terminal state.
`AI_OPERATING_MODEL_PLAN.md` holds the gates and stop conditions; they are
binding, not advisory.

### 6. What this ADR does NOT decide

It does not authorize any product AI agent, and does not relax
`AI_GOVERNANCE.md`, under which zero product agents are implemented and none
may run without a contract. No role defined here may read or write case data,
reason about clinical or legal rule semantics, touch production, or send
external messages.

## Consequences

- The bridge's protocol files stop being loadable as current guidance. Their
  evidentiary value is preserved deliberately: the ledger is the best local
  record of why multi-agent coordination was rejected.
- **Two shared surfaces are now known to be ungoverned, and both are actively
  drifting.** They were missed by the original five-choke-point analysis:
  - **Sequential ADR numbering.** Three collisions are in flight (ADR-0014
    claimed twice, 0015, 0016). Concurrent branches allocate the next number
    independently, so the "check `docs/architecture/` for the next free
    number" rule in `CLAUDE.md` is only correct against merged history.
  - **The single local `clarity_dev` database, shared by 16 git worktrees.**
    On 2026-07-29 it held 16 applied migrations while `main` carried 12; the
    extra four came from unmerged branches. This makes
    `tests/integration/migration-integrity.test.ts` fail on an otherwise clean
    branch, so a local suite result is not by itself evidence about the branch
    under test.
- The assessment's premise that work here is sequential and single-lane was
  wrong: five PRs were open concurrently with 42+ unmerged commits. The
  shared-kernel conclusion is strengthened rather than weakened — the
  collisions it predicted are already occurring — but the observed parallelism
  is one owner across several tool sessions, not independent maintainers, and
  the collisions argue for governing shared surfaces and reducing concurrent
  lanes, not for adding autonomous agents.
- Adopting R1 adds a pre-PR verification step and therefore some owner triage
  cost. The plan's metrics exist to detect the case where that cost exceeds the
  defects prevented, and Stage 1's stop conditions end the experiment rather
  than escalate it.

## Alternatives considered

- **Persistent domain agents (one per bounded context).** Rejected: the shared
  kernel makes the boundaries false, and the parallelism gained would be
  illusory because every lane serializes on the same five surfaces.
- **Workflow agents owning an end-to-end user journey.** Rejected: highest
  context-loading burden of any model, and it crosses all five shared surfaces
  by construction.
- **Repair and continue the bridge.** Rejected: the failures were
  coordination-structural, not incidental, and the human authority the protocol
  depends on collapses onto one person who was already intervening manually.
- **Do nothing.** Rejected in part: the review loop is producing
  security-relevant findings, and leaving dormant bridge infrastructure in the
  live context path is itself a stale-context hazard.

## Honesty statement

Not claimed: that R1, R2, or T1 will work — Stage 1 exists to test that, and
its stop conditions are binding. Not claimed: any measured productivity,
defect-rate, or cost improvement; the escaped-defect baseline in the plan is
read from commit history and labeled directional, not measured. Not claimed:
production readiness, HIPAA compliance, malware protection, working external
integrations, or approved clinical or legal rules. No product AI agent is
authorized, described, or implied by this decision. Synthetic data only.
