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
- Crisis Ops remains a mixed prototype: most workspaces use synthetic local state, while Case Status, Legal Status actions, and IOP Reconciliation can cross a verified API boundary. The demo persona control is navigation-only and never grants backend authority.

## Stakeholder segments

The sidebar **Demo view** control scopes navigation for stakeholder walkthroughs, defined in `src/domain/roles.ts`: field responder, central intake coordinator, clinician reviewer, receiving facility, charge nurse, UR/benefits, compliance, and executive (plus an unscoped demo view). This is prototype persona modeling, **not** authentication. Verified backend identity is shown separately and backend permissions remain authoritative.

Every role also sees **Training & SOPs**. That workspace turns the read-only SOP/context docs into synthetic onboarding paths, SOP checklists, competency evidence, PEC chain-of-custody practice, and source-boundary warnings for each position. It is training guidance only: clinical, legal, HR, credentialing, statutory, and production-policy approvals remain out of scope until reviewed by qualified humans.

## Command center

The **Command Center** is an operational synthetic overview of case stage, clinical and financial lanes, packet state, clocks, and escalations. Product feature maps and roadmap-feedback content live in documentation rather than competing with the operational Home surface.

Supporting planning artifacts remain available outside the runtime:

- `../docs/developer-handoff/COMMAND_CENTER_MVP_PROMPT.md`
- `../docs/roadmap/POC_STAKEHOLDER_FEEDBACK_ROADMAP.md`

## Layout

- `src/domain/` — canonical case spine: types, seed scenarios, hash-chained custody ledger, pitfall guard engine, compliance clocks, packet builder, bedboard placement rules, role training plans. Unit-tested.
- `src/workspaces/` — one component per workspace (queue, command center, intake, medical necessity, legal, packet, routing, bedboard, ledger, Training & SOPs).
- `smoke/` — Playwright specs covering the closed-loop journey.

Baseline transfer timing, acceptance rates, and packet completeness rates: **No measurements found** — these remain unknown until piloted.
