# Executive Brief

## Problem

Clarity Access currently contains useful functionality, but its user experience reflects the order in which features were discovered rather than one coherent patient journey.

The inspected repository shows:

- a Crisis Ops UI with 18 workspaces;
- a separate persisted Prescreen bounded context;
- multiple synthetic fixture systems;
- training and developer tools mounted alongside operational-looking screens;
- frontend and backend state vocabularies with overlapping but non-identical lifecycle concepts;
- a Central Intake persona that can see almost every workspace;
- prototype benefit/authorization displays that are derived from synthetic case-id logic rather than patient-source records.

## Product correction

**Clarity Access should be organized around a seven-stage patient journey:**

1. Referral
2. Prescreen
3. Qualified Review
4. Facility Review
5. Pre-Admission
6. Transfer / Handoff
7. Admission

Admission transitions the person out of Access and into an Episode.

Parallel workstreams such as clinical, medical, legal, evidence, benefits, authorization, placement, and transport should not be presented as sequential patient stages.

## Architecture correction

Use:

**Patient → Access Case → Prescreen Encounter → Referral → Acceptance → Episode**

with bounded contexts retaining their detailed state machines.

Expose a simple user-facing `JourneyPhase` projection rather than creating another giant state machine.

## Rule correction

Do not build a single branching mega-tree.

Use small versioned rules:

**Facts → Rule Evaluation → Possible Pathways / Blocks / Missing Information / Required Work → Human Decision → State Transition**

## Role correction

Separate:

- SEE
- DO
- REVIEW
- DECIDE
- OWN

A coordinator may own progress and see a clinical task without being authorized to perform or approve it.

## Synthetic-data correction

Synthetic data is required for safe development.

The problem is not synthetic data. The problem is **unclassified synthetic data rendered as though it were operational state**.

Create explicit fixture classes:

- Scenario fixtures
- UX fixtures
- Training fixtures
- Engineering fixtures

Operational-looking screens should never invent clinical, financial, or operational facts merely to look populated.

## Implementation posture

No Access refactor should begin until repository housekeeping is complete and this package has been reconciled against the cleaned baseline.
