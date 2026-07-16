# Clarity Crisis Ops Prototype (v0.2)

Local React + TypeScript prototype of the Clarity behavioral-health crisis platform. It demonstrates the full demo journey from the handoff spec: guided intake → medical necessity and legal drafts → hash-sealed referral packet → simulated facility routing → central intake command center → milieu-aware bedboard → role-specific Training & SOPs, with every material step written to a hash-chained custody ledger.

## Run

```bash
npm install
npm run dev      # http://127.0.0.1:5173
npm test         # vitest unit tests (domain logic)
npm run smoke    # playwright end-to-end suite (desktop + mobile)
npm run build    # typecheck + production build
```

## Scope and guardrails

- **Demo data only. No production PHI.** All cases, facilities, and occupants are fake. State lives in `localStorage`; "Reset demo data" reseeds.
- **Legal clocks are configurable demo values, not statutory truth.** Louisiana PEC/OPC/CEC language and timing require counsel validation before any enforcement in software.
- **Clinical outputs are review-gated drafts.** The prohibited-language guard blocks claims like "meets InterQual" or "admission is medically necessary" without qualified human review.
- **Bed availability is not safe placement.** Bedboard compatibility rules are demo heuristics pending clinical validation; the charge nurse decision is final and overrides require a documented reason.
- No authentication, backend, or integrations — deliberately out of scope for the prototype (see `../docs/04-build-roadmap.md` parking lot).

## Stakeholder segments

The sidebar "Viewing as" selector scopes workspaces per stakeholder role, defined in `src/domain/roles.ts`: field responder, central intake coordinator, clinician reviewer, receiving facility, and charge nurse (plus an unscoped demo view). Adding or reshaping a segment is a config change in that one file — workspaces are self-contained components, so no workspace code changes are needed. This is demo role modeling per the handoff spec, **not** authentication; production RBAC/RLS stays in the parking lot.

Every role also sees **Training & SOPs**. That workspace turns the read-only SOP/context docs into synthetic onboarding paths, SOP checklists, competency evidence, PEC chain-of-custody practice, and source-boundary warnings for each position. It is training guidance only: clinical, legal, HR, credentialing, statutory, and production-policy approvals remain out of scope until reviewed by qualified humans.

## POC command center review

The **Command Center** is now both an operational dashboard and a stakeholder walkthrough surface. It includes a POC feature map explaining what each tool does, what problem it solves, who it serves, and the correlated workflow, plus a roadmap feedback board that stakeholders can mark as must-have, helpful, confusing, missing, or later.

Supporting artifacts:

- `../docs/developer-handoff/COMMAND_CENTER_MVP_PROMPT.md` — paste-ready continuation prompt for future Codex work.
- `../docs/roadmap/POC_STAKEHOLDER_FEEDBACK_ROADMAP.md` — stakeholder-readable roadmap and feedback guide.

## Layout

- `src/domain/` — canonical case spine: types, seed scenarios, hash-chained custody ledger, pitfall guard engine, compliance clocks, packet builder, bedboard placement rules, role training plans. Unit-tested.
- `src/workspaces/` — one component per workspace (queue, command center, intake, medical necessity, legal, packet, routing, bedboard, ledger, Training & SOPs).
- `smoke/` — Playwright specs covering the closed-loop journey.

Baseline transfer timing, acceptance rates, and packet completeness rates: **No measurements found** — these remain unknown until piloted.
