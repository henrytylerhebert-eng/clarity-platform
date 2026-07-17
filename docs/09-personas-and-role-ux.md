# Clarity Personas And Role-Adaptive UX

Date: 2026-07-08

This document is the canonical definition of Clarity's stakeholder personas and the UX customizations each one gets. The implementation lives in `app/src/domain/roles.ts` (workspace scoping, missions) and `app/src/domain/roleFocus.ts` (per-role focus KPIs). Role scoping in the prototype is demo modeling only — it is not authentication, and production RBAC/RLS remains in the parking lot per `04-build-roadmap.md`.

## Design Rules For Role-Adaptive UX

1. **One canonical case record, many lenses.** Personas never get different data models — only different projections, emphasis, and actions over the same spine.
2. **Scope by subtraction, not duplication.** A persona sees a subset of the same workspaces; we never fork a workspace per persona. New personas are config entries, not new code paths.
3. **Land the user on their job.** Each persona has a default workspace that answers "what should I do right now."
4. **Focus strip answers "is anything on fire."** Every persona gets 2–4 live KPIs computed from case state, tuned to what they are accountable for.
5. **The custody ledger is visible to everyone.** Trust is the product; no persona loses sight of the chain of custody.
6. **Review gates follow the persona.** Field capture is Draft; clinical language requires clinician review; statutory language requires counsel validation. The UI must say who owes the next review, in that persona's vocabulary.
7. **Financial lane never blocks the clinical lane** — enforced in both the coordinator and UR views.
8. **Escalation is visible to the role that can act on it.** Breached clocks surface to central intake, compliance, and executives; milieu risk surfaces to the charge nurse.
9. **Training is a universal workspace.** Every implemented persona sees Training & SOPs because onboarding, SOP practice, competency evidence, and review-gate literacy are required before a role-specific workflow is credible.

## Implemented Personas (v0.2)

### 1. Field Responder (law enforcement / mobile crisis)

- **Context:** On scene, stressed environment, phone or tablet, no clinical training, minutes not hours.
- **Mission:** Capture the story once, on scene, without clinical jargon.
- **Workspaces:** New Case → Guided Intake → Case Overview → Custody Ledger. Lands on **New Case**.
- **UX customizations:**
  - **Field mode** intake: reduced plain-language field set (presenting problem, what happened, danger to self/others, who else knows, family/environment stressors). Clinical fields (formulation, MSE, psychiatric history, level-of-care) are hidden, not deleted — the record is shared with the clinical team.
  - Source-linked risk capture stays available (what they saw/heard, from whom).
  - Pitfall guards phrased as prompts ("guardian not yet reached"), not clinical judgments.
- **Guardrails:** Everything captured is Draft; nothing this persona enters becomes a clinical or legal determination.
- **Focus KPIs:** My case stage · Collateral status · Active pitfall guards.

### 2. Central Intake Coordinator

- **Context:** Desk role running many cases at once; the SOP owner. Dual monitors, dense tables.
- **Mission:** Keep every case moving; escalate before clocks breach.
- **Workspaces:** Everything except the bedboard. Lands on **Command Center**.
- **UX customizations:** Pipeline table with stage, parallel clinical/financial lanes, live SLA clocks, packet completeness vs 95% target, escalation highlighting. Click-through to any case workspace.
- **Guardrails:** Clock targets displayed as configurable demo values, never statutory truth.
- **Focus KPIs:** Breached clocks · Due-soon clocks · Packets below 95% · Awaiting facility response.

### 3. Clinician Reviewer (crisis assessor / medical director)

- **Context:** Licensed clinician doing full assessments and signing off drafts. In v0.2 the assessor and the reviewing clinician share one role; they split when a sign-off workflow lands (see Deferred).
- **Mission:** Turn drafts into clinically defensible documentation.
- **Workspaces:** Queue, Overview, Guided Intake (clinical mode), Medical Necessity, Legal Status, Ledger. Lands on **Case Queue**.
- **UX customizations:** Full clinical field set including risk formulation, MSE, histories, protective factors, lower-level-of-care. Prohibited-language guard blocks proprietary criteria claims. Review-status badges everywhere.
- **Guardrails:** No output claims "meets InterQual/MCG" or "admission is medically necessary" without qualified human review.
- **Focus KPIs:** Items needing clinician review · Missing risk formulations.

### 4. UR / Benefits Specialist (support role)

- **Context:** Runs insurance verification and payer documentation in parallel with clinical work. Bridge to the v0.3 reporting-metrics module.
- **Mission:** Clear the financial lane without ever blocking the clinical lane.
- **Workspaces:** Command Center (financial lane), Queue, Overview, Medical Necessity, Ledger. Lands on **Command Center**.
- **UX customizations:** Financial-lane clocks, verification status per encounter, medical-necessity missing-items lists (their documentation-gap queue).
- **Guardrails:** Verification status is informational to clinical staff; the workflow never gates screening on benefits.
- **Focus KPIs:** Verification pending · Financial clocks running · Documentation gaps.

### 5. Receiving Facility Admissions Coordinator

- **Context:** External counterparty at a hospital; sees only what was sent to them. Needs to decide fast with limited time.
- **Mission:** Respond fast with a reason the network can learn from.
- **Workspaces:** Packet Preview (read), Routing Response, Ledger. Lands on **Routing Response**.
- **UX customizations:** Minimal three-item navigation; accept / decline / request-info / waitlist with required decline reason codes; acceptance produces a ledger receipt.
- **Guardrails:** Declines without a reason code are rejected — decline analytics are a v0.2 roadmap feature and need the data.
- **Focus KPIs:** Incoming packets · Responses on record.

### 6. Charge Nurse (Inpatient Operations)

- **Context:** Unit floor, interrupted constantly; safety-critical decisions; the human who is accountable for the milieu.
- **Mission:** Place for milieu safety, not just bed availability.
- **Workspaces:** Milieu Bedboard, Case Overview, Ledger. Lands on **Bedboard**.
- **UX customizations:** Unit/room/bed grid with occupant acuity, aggression/elopement/SI flags, unit acuity roll-up vs ceiling, staffing observation load (1:1 / Q15 counts). Recommendation panel with explainable flags; hard stops disable one-click accept; override requires a typed reason and is ledger-logged.
- **Guardrails:** Recommendations are advisory; charge nurse decision is final; compatibility heuristics are marked pending clinical validation.
- **Focus KPIs:** Available beds · Pending placements · Units over acuity ceiling.

### 7. Compliance / Legal Officer (support role)

- **Context:** Periodic auditor and counsel liaison rather than daily operator.
- **Mission:** Prove the chain of custody; flag anything counsel has not validated.
- **Workspaces:** Ledger, Command Center, Queue, Legal Status. Lands on **Custody Ledger**.
- **UX customizations:** Chain verification (verify/tamper detection), counsel-validation queue, breach visibility across all cases.
- **Guardrails:** Statutory wording and clock durations are flagged "counsel validation required" until validated; this persona owns clearing that flag (workflow deferred).
- **Focus KPIs:** Counsel validation queue · Breached clocks · Custody events.

### 8. Executive / Program Director (support role)

- **Context:** Wants throughput, risk, and pilot evidence — not case detail. Read-focused.
- **Mission:** See throughput and risk at a glance; measure before claiming improvement.
- **Workspaces:** Command Center, Queue, Ledger. Lands on **Command Center**.
- **UX customizations:** Counts and outcomes only; the focus strip deliberately shows "Baseline outcomes: No measurements found" until real measurements exist. Full metrics dashboard is the v0.3 reporting module.
- **Guardrails:** Evidence posture — never display an improvement claim without a measured baseline.
- **Focus KPIs:** Active cases · Accepted/declined · Breached clocks · Baseline outcomes (No measurements found).

## Defined, Not Yet Implemented

- **Referring ED / community clinician (v0.3):** submits a referral with a mini-packet; portal-lite UX similar to receiving facility but outbound. Needs the request-broadcast expansion.
- **Transport coordinator (v0.3):** sees accepted cases awaiting movement, transport clock, custody handoff events. Needs transport status objects on the case spine.
- **Assessor vs reviewer split (v0.3):** separate "performs assessment" from "signs off" once a sign-off/attestation workflow exists.
- **Guardian / family portal (parking lot):** consent-gated visibility; blocked on the 42 CFR Part 2 consent engine.

## How To Add Or Reshape A Persona

1. Add a `RoleDefinition` in `app/src/domain/roles.ts` (id, label, mission, workspace subset, landing workspace).
2. Add a KPI branch in `app/src/domain/roleFocus.ts` (2–4 chips computed from `AppState`).
3. Run the role invariants test (`roles.test.ts`) — it enforces: default workspace within scope, ledger always visible, segmented roles narrower than the full set.
4. No workspace component changes should be required. If a persona seems to need a forked workspace, that is a signal the workspace needs a props-level mode (like intake's field/clinical), not a copy.

## Production Mapping (later)

Role → RBAC role claims; workspace scope → route guards + RLS policies from `03-data-model.md`; focus KPIs → org-configurable dashboards; per-org config adds statutory pack (state), facility capability profiles, and payer rule packs on top of the same persona registry.

## Onboarding And SOP Training Layer

Implemented in `app/src/domain/training.ts` and `app/src/workspaces/TrainingSops.tsx`.

The Training & SOPs workspace translates the read-only assessment-training and ePEC chain-of-custody context into synthetic role practice. It does not import source documents as live app data and does not certify any SOP as final policy. Each role gets:

- onboarding outcome;
- SOP checklist;
- practice workflow;
- competency evidence;
- review gates;
- linked operational workspaces.

Source posture:

- assessment-training protocol: summary derived, requires clinical review;
- ePEC chain-of-custody workflow: summary derived, requires legal review;
- persona and role UX map: source confirmed, product review.

The training layer is company-agnostic by design. Organization-specific statutory packs, HR records, credentialing evidence, and production SOP approval workflows remain parked until governance and qualified human review are complete.
