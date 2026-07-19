# Clarity AGENTS Quick-Fill (Urgent Lanes)

Use this when you need a fast start; fill missing items with `[TODO]`.

| Choose this template when... | Use instead when... |
| --- | --- |
| The lane is urgent, tightly scoped, and can be reviewed from a compact brief. | Use `docs/AGENTS_TEMPLATE.md` for full planning, cross-cutting detail, or review traceability. |

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

## 6) Track sections
- API/API+UI:
- Auth readiness:
- Deployment:

## 7) Risks + decisions
- Risks:
- Tradeoffs:
- Open questions:

## 8) Verification
- [ ] Unit
- [ ] Integration
- [ ] Type/lint
- [ ] API smoke/test
- [ ] Deployment check
- [ ] Evidence/status gate checked
- Commands run:

## 9) Completion response format
1. Completed
2. Files affected
3. Verification
4. Decisions and tradeoffs
5. Unverified risks
6. Recommended next move
7. Prompt lesson
