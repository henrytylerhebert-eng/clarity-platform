# Clarity AGENTS Template (Reusable Feature Lane)

Use this template for new feature lanes so every lane starts with the same protocol.

| Choose this template when... | Use instead when... |
| --- | --- |
| The lane needs full planning, cross-cutting detail, or review traceability. | Use `docs/AGENTS_TEMPLATE.quickfill.md` for urgent, tightly scoped work. |

## 1) Lane header

- Lane name:
- Date:
- Requested by:
- Related issue/PR/thread:
- Branch:
- Reviewer(s):

## 2) Protocol mode

- Mode: COACH (default) | FAST | PLAN ONLY | SHOW REWRITE
- Status classification:
  - READY
  - ADJUSTED
  - NEEDS DECISION

## 3) Target context (read + validate before edits)

- Repo path:
- Relevant area(s): [ ] API [ ] UI [ ] Auth [ ] DB [ ] Deployment [ ] Docs
- Preflight run:
  - `pwd`
  - `git remote -v`
  - `git status --short --branch`
  - `git rev-parse HEAD`
- Docs reviewed:
  - `README.md`
  - `ARCHITECTURE.md`
  - `IMPLEMENTATION_STATUS.md`
  - `docs/governance/PRODUCT_EVIDENCE_AND_DECISION_PROTOCOL.md` when changing product, implementation, roadmap, release, measurement, or Product Studio status:
  - lane-relevant ADR(s):
  - lane-relevant `docs/` paths:
- Contract/data sources:
  - `packages/domain-contracts`
  - `prisma/schema.prisma`
  - API service contracts
  - Tests (`tests/` + relevant app tests)

## 4) Prompt check (required before substantial work)

### PROMPT CHECK
- Goal:
- Adjusted scope:
- Constraints:
- Done when:
- Assumptions:
  - [Inference]
  - [Unverified]

## 5) Optimized working brief (if adjusted)

### Goal

### Relevant context

### Required work

### Constraints

### Non-goals

### Deliverables

### Done when

### Verification

## 6) Lane plan (especially for larger changes)

- Step 1:
- Step 2:
- Step 3:
- Risks / rollback:
- Cross-cutting impact:

## 7) Track-specific execution sections

### 7.1 API / API+UI lane
- Endpoint changes:
- Request/response schema changes:
- Permission/rbac changes:
- Frontend API call updates:
- Error handling and status mapping:
- Contract or test updates required:

### 7.2 Auth readiness lane
- auth provider/provider-port touchpoints:
- actor/role sourcing assumptions:
- session and revocation checks:
- tenant boundary checks:
- principal-to-actor invariants:
- privileged-path controls:

### 7.3 Deployment lane
- Runtime target:
- Required env vars:
- Health/data migration requirements:
- Rollout plan:
- Observability/logging expectations:
- Rollback steps:

## 8) Verification checklist

- Unit: [ ]
- Integration: [ ]
- Contract: [ ]
- UI/flow smoke: [ ]
- Type/lint: [ ]
- Schema/database checks:
- Security/regression checks:
- Accessibility/UX checks:
- Command(s) run + output summary:

## 9) Response format (mandatory)

When reporting completion, use:

1. Completed
2. Files affected
3. Verification
4. Decisions and tradeoffs
5. Unverified or remaining risks
6. Recommended next move
7. Prompt lesson

## 10) Safety + governance reminders

- No fabricated facts.
- No secrets in outputs, logs, or code.
- Output is not evidence; speed is not progress; automation is not understanding; polish is not trust.
- Keep synthetic-only boundaries intact.
- Never claim completion without verification.
- No autonomous clinical/legal/financial/placement decisions.
- Never edit immutable reference artifacts unless explicitly approved.

## 11) Notes (lane-specific)
- Unknowns / blockers:
- Open decisions:
- Stakeholder validation needed:

## Proposed historical evaluation supplement

For review of the unapproved DEV-R1 experiment, the optional execution-contract
fields are in [the quick-fill template](AGENTS_TEMPLATE.quickfill.md#10-proposed-dev-r1-evaluation-contract).
Completing a template does not approve the experiment or amend ADR-0017.
