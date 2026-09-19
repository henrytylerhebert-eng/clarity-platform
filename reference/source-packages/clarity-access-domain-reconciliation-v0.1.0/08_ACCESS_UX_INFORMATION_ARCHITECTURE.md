# Access UX Information Architecture

**Status:** PROPOSED_ARCHITECTURE

## Top-level Access experience

The operational Access product should not expose every bounded context as a peer navigation item.

### Proposed top-level areas

1. **My Work**
2. **Patients / Access Cases**
3. **Referrals**
4. **Reports / Oversight** — later and role-limited
5. **Learning & Practice** — separate product area
6. **Scenario Lab** — explicit simulation mode
7. **Internal / Developer** — hidden from operational users

## Patient / Access Case view

A case view should answer:

- Where is the person in the journey?
- What is known?
- What is missing?
- What needs my attention?
- Who owns each next action?
- What are we waiting on?
- Which parallel workstreams are open?
- What decisions have been made?
- Why?
- What happens next?

## Example

```text
PATIENT / ACCESS CASE

Current phase:
Prescreen — waiting for information

Next milestone:
Qualified review

MY WORK
- Obtain missing collateral
- Confirm current legal-status source

WAITING ON
- Clinical review — assigned
- Benefits verification — in progress

PARALLEL LANES
Clinical       In progress
Medical        Complete
Legal          Needs information
Benefits       In progress
Authorization  Not started
Placement      Not started
Transport      Not started

WHY?
3 rules currently affect progression

TIMELINE
Referral created
Prescreen started
Collateral requested
...
```

## Role home principles

### Central Intake
Home is coordination:
- cases by phase;
- blocked cases;
- overdue work;
- missing information;
- waiting on reviewer/facility;
- next action ownership.

Do not present every professional workbench as Central Intake's personal workspace.

### Clinician
Home is review work:
- assessments awaiting review;
- contradictions requiring clinical classification;
- clinical documentation tasks;
- work returned for clarification.

### Benefits / UR
Home is financial work:
- coverage verification;
- authorization preparation;
- unresolved documentation requirements;
- follow-up.

### Receiving Admissions
Home is inbound facility review:
- referrals;
- packet gaps;
- responses due;
- accepted / declined / waitlisted.

### Nurse
Home is nursing-specific pre-admission/handoff work.

### Compliance / Legal
Home is qualified legal/compliance review and history.

## Modes

### Operational mode
No demo-role switcher.
No invented financial data.
No reset button.
No tamper simulation.
No mock patients unless the entire environment is clearly labeled Demo.

### Scenario Lab
Explicitly synthetic.
Load scenario.
Select role lens.
Change facts.
Re-run rules.
Inspect expected vs actual behavior.

### Learning & Practice
Training scenarios, competency practice, and role onboarding.

### Internal / Developer
Fixture browser, Product Studio, implementation maturity, raw diagnostics.
