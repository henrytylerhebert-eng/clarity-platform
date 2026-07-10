# Claude Code Handoff - Clarity Crisis Platform

## Mission

Build the first working prototype of the Clarity behavioral-health crisis platform.

The prototype should demonstrate a continuous case journey:

1. Field or referral intake.
2. Guided assessment with age branching and pitfall guards.
3. Legal/custody documentation scaffold.
4. Transfer packet generation.
5. Hospital accept/decline response.
6. Central intake dashboard.
7. Milieu-aware bedboard recommendation view.

## Product Principle

Do not build a generic CRM, generic bed board, or generic form builder.

Build a behavioral-health crisis workflow where one canonical case record generates clinical, legal, transfer, payer, and operational outputs.

## First Build Target

Build a local web prototype with realistic seeded demo data.

Preferred implementation:

- Next.js or Vite React app.
- TypeScript.
- Local JSON seed data or Supabase if already configured.
- Clean component boundaries.
- No production authentication required for prototype, but model roles clearly.

If using Supabase:

- Create schema from `03-data-model.md`.
- Use row-level security-ready role concepts, even if not fully enforced in prototype.

## Required Screens

### 1. Intake Workspace

Must include:

- Case creation.
- Field mode / clinical mode toggle.
- Patient demographics.
- Referral source.
- Legal status.
- Presenting problem.
- Observed risk behaviors.
- SI / HI / psychosis / intoxication fields.
- Collateral sources.
- Age-band branching.
- Pitfall guard panel.
- Save case.

### 2. Legal / Custody Workspace

Must include:

- Draft statutory instrument scaffold.
- Required facts checklist.
- Attestation/signature placeholder.
- Legal-clock panel.
- Ledger event preview.
- Clear warning that exact Louisiana statutory timing requires counsel validation.

### 3. Transfer Packet Workspace

Must include:

- Packet completeness checklist.
- Included artifacts list.
- Medical necessity draft.
- Narrative summary.
- Risk formulation.
- Media/document attachment placeholders.
- Generate packet action.

### 4. Receiving Facility Portal

Must include:

- Incoming packet list.
- Case summary.
- Accept / decline / request info buttons.
- Decline reason codes.
- Acceptance receipt event.

### 5. Central Intake Command Center

Must include:

- Referral pipeline using the SOP stages.
- SLA clocks.
- Parallel clinical and financial lanes.
- Packet completeness status.
- Escalation flags.

### 6. Milieu Bedboard

Must include:

- Unit rooms and beds.
- Patient acuity profiles.
- Roommate compatibility flags.
- Adjacency/geography flags.
- Unit-level acuity roll-up.
- Staffing/observation load summary.
- Accept/override recommendation logging.

## Required Data Concepts

Use these concepts even if the first prototype stores them locally:

- Case.
- Person / patient.
- User.
- Organization.
- Role.
- Assessment.
- Assessment answer.
- Risk formulation.
- Legal instrument.
- Ledger event.
- Compliance clock.
- Packet.
- Packet artifact.
- Facility referral.
- Facility response.
- Bed.
- Unit.
- Placement recommendation.
- Placement decision.
- Consent.
- Redaction.

## Seed Demo Scenario

Create at least four demo cases:

1. Adult PEC scenario with SI risk and incomplete risk formulation that triggers a pitfall guard.
2. Geriatric patient with abrupt confusion requiring delirium prompt.
3. Youth case requiring guardian/collateral and means-restriction prompts.
4. Inpatient bedboard scenario where the suggested available bed is flagged due to roommate or adjacency risk.

Create at least two receiving facilities:

- One accepts.
- One declines with reason code.

Create at least one central intake dashboard state with:

- Referral-to-screening clock active.
- Insurance verification running in parallel.
- Packet completion below 95%.
- One escalated delay.

## Design Requirements

Tone:

- Clinical, calm, operational.
- Not marketing-heavy.
- Not decorative.

UI:

- Dense but readable.
- Clear status indicators.
- Tabs or sidebar for workspaces.
- Tables for pipeline and bedboard.
- Badges for risk and compliance status.
- No hero page.

Important:

- Use existing UI patterns if this is added to an existing repo.
- Do not overbuild authentication, billing, integrations, or production security in the first prototype.
- Do not hard-code uncertain legal clocks as legal truth. Mark as configurable and counsel-review required.

## Success Criteria

The prototype is successful if a reviewer can understand:

- How a field intake becomes a clinical/hospital packet.
- How Clarity protects the chain of custody.
- How legal and compliance clocks are tracked.
- How transfer acceptance/decline becomes closed-loop.
- How the bedboard uses acuity/milieu risk rather than bed availability alone.

## Verification Checklist

Run:

- Typecheck.
- Lint, if configured.
- Unit tests, if added.
- Build.

Then manually verify:

- Intake mode branching works.
- Pitfall guards appear for seeded scenarios.
- Transfer response changes referral status.
- Clock statuses render.
- Bedboard flags risky placements.
- Override logging is visible.

Report:

- Changed files.
- Commands run.
- Failures.
- Skipped checks.
- Unknowns.

