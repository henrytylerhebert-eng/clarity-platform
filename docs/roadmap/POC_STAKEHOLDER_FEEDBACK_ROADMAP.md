# POC Stakeholder Feedback Roadmap

## Purpose

This roadmap is written for proof-of-concept conversations, not internal engineering planning. Use it to help stakeholders describe what they see, what they would rename, what they would remove, what they would need before shadow use, and which features feel most valuable.

All examples must use synthetic cases only. Any claim about outcome improvement, transfer speed, acceptance rate, documentation quality, or utilization-review performance is `Unknown` until measured.

## Stakeholder Feedback Method

For each walkthrough, ask reviewers to mark every feature as one of:

- **Must have:** needed for a credible pilot.
- **Helpful:** useful, but not required for first pilot.
- **Confusing:** unclear label, workflow, or responsibility.
- **Missing:** stakeholder expected this but did not see it.
- **Later:** valuable, but not needed for proof of concept.

Also ask:

- What would your team call this?
- Who would own this step in your real workflow?
- What existing tool or handoff would this replace?
- What could go wrong if this were used too early?
- What evidence would make you trust it?

## MVP 0.1 - Intake Spine

**Product promise:** A crisis referral can become a structured assessment, source-linked risk findings, medical-necessity draft, legal-status draft, referral packet preview, custody ledger, and simulated facility response without retyping the story.

**Primary reviewers:**

- Field responders
- Intake coordinators
- Clinician reviewers
- Receiving facilities
- Compliance/legal reviewers

**Feedback questions:**

- Can you follow the case from referral to packet without losing the story?
- Are the draft labels clear enough?
- Are missing facts obvious at the right time?
- Does the source-linking model feel useful or burdensome?
- Which facts should be required before packet generation?

**Status:** Built in local prototype.

## MVP 0.2 - Command Center, Role Workflow, And Training

**Product promise:** Intake leadership can see active cases, parallel clinical/financial lanes, packet completeness, demo clocks, escalations, routing status, role-focused workspaces, custody verification, and role-specific onboarding/SOP training.

**Primary reviewers:**

- Central intake coordinators
- UR / benefits specialists
- Program directors
- Compliance/legal reviewers
- Charge nurses

**Feedback questions:**

- Does the Command Center show the right things first?
- Which column, badge, or status would your team rename?
- Does the clinical lane stay independent from insurance/benefits?
- Does the role selector match real stakeholder responsibilities?
- Does each role's onboarding path match the SOP detail your team would expect?
- Which competency evidence would supervisors accept before shadow use?
- Are clock/escalation warnings helpful or too risky without legal validation?

**Status:** Built in local prototype.

## POC Pilot - Stakeholder Walkthroughs

**Product promise:** Clarity can be reviewed with synthetic cases by real operational stakeholders before any live-data design decision.

**Primary reviewers:**

- 2-3 intake or crisis operations stakeholders
- 1 clinician reviewer
- 1 UR / benefits stakeholder
- 1 compliance/legal reviewer if available

**Feedback questions:**

- Would this reduce duplicated documentation?
- Would this make handoffs clearer?
- What is the minimum safe pilot workflow?
- What should remain manual?
- What must be validated before live data?

**Status:** Next.

## MVP 0.3 - Metrics And Utilization Review Excellence

**Product promise:** The reporting-metrics-rebuilder becomes a company-agnostic operating-intelligence substrate, first geared around utilization review excellence.

**Primary reviewers:**

- UR leaders
- Program directors
- Operations analysts
- Finance/revenue-cycle stakeholders

**Feedback questions:**

- Which metrics are decision-useful without being punitive?
- Which values must stay `Unknown` until measured locally?
- Which event definitions should be reusable across organizations?
- What would make the metrics credible enough for a pilot report?

**Status:** Planned. No reporting dashboard in the current prototype.

## Production Readiness - Parking Lot Until POC Evidence

**Product promise:** Add production backend, authentication, RBAC/RLS, PHI controls, integrations, legal/clinical validation, audit hardening, and deployment controls only after the workflow is validated.

**Primary reviewers:**

- Technical leadership
- Security/compliance leadership
- Clinical/legal owners
- Deployment owner

**Feedback questions:**

- Which controls are mandatory before live data?
- Which integrations are truly required for pilot?
- Which claims require legal review?
- Which claims require clinical review?
- Which risks would block deployment?

**Status:** Parking lot until POC feedback creates evidence.

## Feature Feedback Register

| Feature | What stakeholders should react to | Current status |
|---|---|---|
| Case Queue | Does this show the right triage list? | Built |
| Command Center | Does it show leadership the right operational picture? | Built |
| Guided Intake | Are the questions and source-linking usable? | Built |
| Medical Necessity Draft | Are review gates and missing facts clear? | Built |
| Legal Status Draft | Are counsel warnings and clock placeholders clear? | Built |
| Packet Preview | Does it avoid retyping while staying draft-gated? | Built |
| Routing Response | Are response options and decline reasons realistic? | Built |
| Custody Ledger | Is the hash-chain explanation understandable? | Built |
| Milieu Bedboard | Does it reflect safe placement concerns beyond bed availability? | Built as demo |
| Training & SOPs | Can each position be onboarded with built-in SOP practice and competency evidence? | Built as review-gated training |
| Reporting Metrics Rebuilder | Which UR metrics should be company-agnostic? | Stub only |

## Evidence Boundaries

- Baseline transfer timing: `No measurements found`.
- Acceptance rate improvement: `No measurements found`.
- Documentation error reduction: `No measurements found`.
- Legal validity: `Unknown` until counsel review.
- Clinical safety/appropriateness: `Unknown` until clinician review.
- Market fit: `Unknown` until stakeholder feedback.
