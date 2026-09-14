# Clarity AGENTS Quick-Fill (Urgent Lanes)

Use this when you need a fast start; fill missing items with `[TODO]`.

| Choose this template when... | Use instead when... |
| --- | --- |
| The lane is urgent, tightly scoped, and can be reviewed from a compact brief. | Use `docs/AGENTS_TEMPLATE.md` for full planning, cross-cutting detail, or review traceability, but still attach §6 below for a named reusable/persistent/domain role under the proposed operating model. |

## 1) Lane header
- Lane:
- Date:
- Requestor:
- Branch/issue:

## 2) Protocol + request status
- Mode: [COACH | FAST | PLAN ONLY | SHOW REWRITE]
- Request status: [READY | ADJUSTED | NEEDS DECISION]

## 3) Verified scope
- Target areas: [ ] API [ ] API+UI [ ] Auth [ ] Deployment [ ] DB [ ] Docs
- Repo preflight run:
  - `pwd`
  - `git remote -v`
  - `git status --short --branch`
  - `git rev-parse HEAD`
- Relevant docs read:
  - README / ARCHITECTURE / implementation docs / ADRs
  - Product evidence protocol if changing status, release, measurement, roadmap, or Product Studio claims

## 4) PROMPT CHECK
- Goal:
- Constraints:
- Done when:
- Assumptions:
  - [Inference] ...
  - [Unverified] ...

## 5) Required work
- What to change:
- What not to change (Non-goals):
- Files:

## 6) Agent execution contract

Required when launching a named reusable, persistent, or temporary
domain-aware role under the proposed operating model, and for any separately
proposed code-modifying agent role. An ordinary user-directed Codex/Claude
session is outside this role gate only when it is not assigned domain-aware
code or shared-contract modification. Any one-off, temporary, reusable, or
persistent agent assigned such modification must complete this contract and a
separate approval record. Direct user authorization defines task scope but
does not waive the gate for domain-changing work.

- Agent ID / role:
- Mode: [READ-ONLY REVIEW | PREP-ONLY WRITE | APPROVED IMPLEMENTATION]
- Model provider / exact exposed model identifier and version:
- Inference runtime / tool-harness identifier and version:
- Reasoning and sampling configuration (or Unknown):
- System/developer/role prompt bundle and tool-manifest hashes:
- Exact source archive/tree and sanitized/live context hashes:
- Evaluation manifest ID and hash (historical evaluation, otherwise N/A with reason):
- Authorization source / approval record:
- Approval state: [PENDING | APPROVED | REJECTED | EXPIRED]
- Approved scope and date:
- Human owner:
- Integration owner:
- Independent verifier:
- Exact permitted base/head identifiers (synthetic IDs for historical replay;
  verifier retains source mapping externally):
- Allowed tools:
- Allowed paths:
- Prohibited tools/actions/paths:
- Required source context:
- Required output schema:
- Validation and acceptance evidence:
- Stop and escalation conditions:
- Human-review rule:

For a role governed by this section, if any required field is `[TODO]` or
blank, or approval state is not `APPROVED`, that role may not run. Selecting a
mode or naming an owner does not self-authorize work. A human may continue
manual discovery and complete the contract. A shared contract, schema,
migration, API route, role policy, tenant boundary, or product rule requires
its named human approval before implementation.

## 7) Track sections
- API/API+UI:
- Auth readiness:
- Deployment:

## 8) Risks + decisions
- Risks:
- Tradeoffs:
- Open questions:

## 9) Verification
- [ ] Unit
- [ ] Integration
- [ ] Type/lint
- [ ] API smoke/test
- [ ] Deployment check
- [ ] Evidence/status gate checked
- [ ] Dependency paths resolve inside the target worktree
- [ ] Database migration ledger matches the target checkout, when applicable
- Commands run:

## 10) Completion response format
1. Completed
2. Files affected
3. Verification
4. Decisions and tradeoffs
5. Unverified risks
6. Recommended next move
7. Prompt lesson
