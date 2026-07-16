# Codex Prompt - Clarity Command Center MVP Prototype

## Mission

Develop the existing Clarity Crisis Ops prototype into a stakeholder-reviewable Command Center MVP.

This is not a production build. It is a proof-of-concept surface that explains the platform, demonstrates the workflow, and lets stakeholders give concrete feedback on features, terminology, roles, and roadmap priority.

## Current Repository

- Repository: `/Users/tylerhebert/Documents/clarity-platform`
- Remote: `https://github.com/henrytylerhebert-eng/clarity-platform.git`
- Prototype app: `app/`
- Canonical product roadmap: `docs/04-build-roadmap.md`
- Integrated platform roadmap: `docs/roadmap/IMPLEMENTATION_ROADMAP.md`
- Source materials: `reference/` and `reference/source-documents/`

## Non-Negotiable Guardrails

- Use fake synthetic/demo data only.
- Do not import source documents as live app data.
- Keep clinical, medical necessity, and legal outputs as drafts.
- Keep legal clocks and statutory language counsel-validation gated.
- Insurance and benefits status must be visible but must not block clinical workflow.
- Do not claim final medical necessity, statutory validity, InterQual, MCG, or criteria compliance.
- Mark unmeasured outcomes as `No measurements found`.
- Mark unknown or unvalidated claims as `Unknown`.
- Do not build production auth, RLS, EHR/CAD/RMS integration, payer criteria engines, real PHI workflows, or production legal form generation in this phase.

## Command Center MVP Goal

The Command Center should answer four stakeholder questions on one screen:

1. What is Clarity?
2. What does each tool or feature do?
3. What problem does it solve and for whom?
4. How does the feature fit into the workflow and product roadmap?

## Required Prototype Surface

Add or maintain a Command Center workspace that includes:

1. **Operational case table**
   - Active case
   - Current stage
   - Clinical lane status
   - Financial lane status
   - Packet completeness
   - Clock/escalation status
   - Click-through to case overview

2. **POC feature map**
   - Feature/tool name
   - What it does
   - Problem solved
   - Primary users
   - Correlated workflow

3. **Stakeholder roadmap feedback board**
   - MVP / phase label
   - Product promise
   - Feedback question
   - Current status

4. **Role-aware review**
   - Field responder
   - Central intake coordinator
   - Clinician reviewer
   - UR / benefits specialist
   - Receiving facility
   - Charge nurse
   - Compliance / legal officer
   - Executive / program director

## Feature Map Baseline

Use these as the initial POC feature definitions:

| Feature | What it does | Problem solved | Primary users | Workflow |
|---|---|---|---|---|
| Case Queue | Shows active synthetic cases with status and gaps. | Replaces scattered tracking. | Intake, clinicians, compliance. | Referral -> queue -> overview. |
| Guided Intake | Captures structured assessment and source-linked risk. | Reduces retyping and unsupported risk claims. | Field, intake, clinicians. | New case -> facts -> sources -> risk. |
| Medical Necessity Draft | Shows review-gated support and missing data. | Prevents unsupported determinations. | Clinicians, UR. | Assessment -> draft -> review. |
| Legal Status Draft | Tracks legal status, clocks, and counsel warnings. | Makes legal uncertainty explicit. | Clinicians, compliance. | Facts -> draft -> counsel validation. |
| Packet Preview | Creates a read-only packet from canonical facts. | Avoids rebuilding the story. | Intake, facilities, clinicians. | Reviewed facts -> packet -> send. |
| Routing Response | Simulates accept, decline, request info, waitlist. | Captures facility response reasons. | Facilities, intake, executives. | Packet -> response -> status. |
| Custody Ledger | Verifies material event hashes. | Proves chain-of-custody concept. | Compliance, legal, pilot reviewers. | Event -> hash -> verify. |
| Milieu Bedboard | Shows placement compatibility and overrides. | Separates bed availability from safe placement. | Charge nurse, clinical leadership. | Candidate -> compatibility -> decision. |
| Reporting Metrics Stub | Emits future-safe operating events. | Keeps UR reporting company-agnostic. | UR, operations, analytics. | Event -> export -> later metrics. |

## Product Roadmap Baseline

| Phase | Product promise | Feedback needed | Status |
|---|---|---|---|
| MVP 0.1 | Prove the intake spine. | Can a case move from referral to packet without retyping? | Built in prototype. |
| MVP 0.2 | Add command center, role focus, routing, and bedboard demo. | Which role view or feature is most credible, confusing, or missing? | Built in prototype. |
| POC Pilot | Validate workflow with synthetic stakeholder walkthroughs. | What would teams rename, remove, or require before shadow use? | Next. |
| MVP 0.3 | Add measured command metrics and UR reporting substrate. | Which metrics matter locally and which should be standard? | Planned. |
| Production Readiness | Add backend, auth, PHI controls, integrations, and validated governance. | Which gates are mandatory before live data? | Parking lot until POC evidence. |

## Implementation Instructions

1. Verify repo identity with `pwd`, `git remote -v`, `git status --short --branch`, and `git rev-parse HEAD`.
2. Read any repo-local `AGENTS.md` if present.
3. Inspect existing `app/src/workspaces/CommandCenter.tsx`, `app/src/domain/roles.ts`, and `app/README.md`.
4. Preserve existing workflow behavior and tests.
5. Add stakeholder explanation content as data-driven UI, not marketing hero content.
6. Keep the UI dense and operational.
7. Add or update tests for the command center feature map and roadmap board.
8. Run:
   - `npm test`
   - `npm run build`
   - `npm run smoke`
   - `npm audit --omit=dev`

## Definition Of Done

- Command Center works as both an operational dashboard and stakeholder review surface.
- Feature map explains what each tool does, what problem it solves, for whom, and how it fits the workflow.
- Roadmap board is easy for POC stakeholders to react to.
- No production claims or unvalidated clinical/legal assertions are introduced.
- Tests/build pass, or failures are reported with exact commands and errors.
