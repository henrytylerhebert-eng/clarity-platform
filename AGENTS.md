# AGENTS.md (Clarity repository operating instructions)

## Global Codex Guidance

- Read this file first, then `README.md`, `ARCHITECTURE.md`, and related domain docs before proposing changes.
- Begin with workspace verification:
  - `pwd`
  - `git remote -v`
  - `git status --short --branch`
  - `git rev-parse HEAD`
- Treat the repository and test outputs as source of truth.
- Preserve user changes. Do not revert unrelated edits.
- Do not invent requirements, user needs, constraints, or outcomes. Mark unknowns as `[Unknown]` or `[Unverified]`.
- Before promoting product, implementation, roadmap, release, or measurement status, apply `docs/governance/PRODUCT_EVIDENCE_AND_DECISION_PROTOCOL.md`: output is not evidence; speed is not progress; automation is not understanding; polish is not trust.

## Scope for this repo

- **Verified implemented surface**: `app/`, `packages/*-service`, `packages/domain-contracts`, `prisma/schema.prisma`.
- **Reference surface (read-only/for context)**: `reference/`.
- **Primary truth for behavior**: working code in `app/`, `packages/*`, `prisma/`, `tests/` and docs in `docs/`.

## Default operating mode

- Default to **COACH MODE**.
- Show `PROMPT CHECK` before substantial work with:
  - `Status` (`READY` / `ADJUSTED` / `NEEDS_DECISION`)
  - `Goal`, `Adjusted scope`, `Constraints`, `Done when`, `Assumptions`
- Use `NEEDS DECISION` only when a missing assumption could materially change architecture/security/product outcome.
- Ask only up to 3 focused questions when blocked.

## Request evaluation (required before action)

For each request, evaluate:

1. Goal
2. Context
3. Constraints (privacy, safety, performance, UX, scope, data, security)
4. Deliverable
5. Completion criteria
6. Verification
7. Ambiguity
8. Downstream impact

## Working brief format

When a request is improved, rewrite in this compact structure:

- Goal
- Relevant context
- Required work
- Constraints
- Non-goals
- Deliverables
- Done when
- Verification

## Execution rules

- Inspect relevant implementation before editing.
- Prefer existing patterns and local abstractions.
- Keep changes focused and reversible.
- Avoid unrelated refactors and dependency churn.
- Do not add API contracts/services/integrations without explicit user approval.
- Do not commit/modify real PHI/PII or secrets.
- Do not expose secrets or `.env` values.

## Verification-first posture

- Use existing commands first for this repo:
  - `npm test`
  - `cd app && npm test`
  - `cd app && npm run smoke`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run prisma:validate`
  - `npm run prisma:generate`
  - `npm run api:dev`
- Never claim completion without verification results.
- Clearly separate passing checks from checks not run.
- Label unknown/blocked checks as `[Unverified]` or `[Unknown]`.

## Development and architecture notes

- Frontend (prototype) is localStorage-backed and not production-authenticated.
- Backend/API scaffolding exists; production tenancy/enforcement and full integration surfaces are staged via ADR roadmap.
- Keep `reference/` immutable unless explicitly directed.
- `AGENTS.md` should be treated as policy; do not ignore these guardrails.
- Product Studio is a read-only evidence/status projection until server-owned registry, authorization, audit, tenancy, and release-control decisions are recorded and verified.

## Response format for completed work

Use:

1. Completed
2. Files affected
3. Verification
4. Decisions and tradeoffs
5. Unverified or remaining risks
6. Recommended next move
7. Prompt lesson

## FAST MODE / PLAN / SHOW REWRITE

- `FAST MODE`: compact prompt check unless a blocker exists.
- `PLAN ONLY`: no edits, only plan.
- `SHOW REWRITE`: show original + rewritten brief side by side.

## Security and governance reminders

- Keep synthetic-only boundaries intact.
- No autonomous clinical/legal/financial/placement decisions.
- No assumptions about deployment state unless verified.
- Surface legal/clinical/security/integration open decisions as explicit blockers.

## Template usage (for future lanes)

- Use [docs/AGENTS_TEMPLATE.md](docs/AGENTS_TEMPLATE.md) for standard lanes.
  When launching a named reusable/persistent/domain role under the proposed
  operating model, also complete the execution-contract section in
  [docs/AGENTS_TEMPLATE.quickfill.md](docs/AGENTS_TEMPLATE.quickfill.md); the
  full template does not replace that authorization record.
- Use [docs/AGENTS_TEMPLATE.quickfill.md](docs/AGENTS_TEMPLATE.quickfill.md) for urgent lanes that need fast scoping.

## Domain-aware agent entry gate

- Start with
  [docs/developer-handoff/AI_NATIVE_DOMAIN_AGENT_REPOSITORY_PREPARATION.md](docs/developer-handoff/AI_NATIVE_DOMAIN_AGENT_REPOSITORY_PREPARATION.md).
- The only proposed first experiment is the read-only repository-review role
  defined in
  [docs/agents/PRESCREEN_INVARIANT_VERIFIER_CHARTER.md](docs/agents/PRESCREEN_INVARIANT_VERIFIER_CHARTER.md).
  It is not a product AI agent and is not authorized until OD-15 and its
  prompt-approval record are approved. That approval can authorize only DEV-R1's
  bounded read-only trial, not code modification or other agent roles.
- Any reusable, persistent, or temporary domain-aware role under this proposed
  model, and any separately proposed code-modifying agent role, must complete
  the agent execution contract in
  [docs/AGENTS_TEMPLATE.quickfill.md](docs/AGENTS_TEMPLATE.quickfill.md).
  An ordinary user-directed Codex/Claude session is outside this role gate only
  when it is **not** assigned domain-aware code or shared-contract
  modification. Any one-off, temporary, reusable, or persistent agent assigned
  such modification must complete this gate, a separate approval record, and a
  bounded work package. Direct user authorization defines task scope but does
  not waive the gate for domain-changing work.
- If typecheck or tests resolve a package, generated client, migration ledger,
  or configuration outside the target worktree, stop. Do not use that result
  to authorize code modification.
- Do not relocate or dispatch through `agents/bridge/` until OD-16 is decided.
