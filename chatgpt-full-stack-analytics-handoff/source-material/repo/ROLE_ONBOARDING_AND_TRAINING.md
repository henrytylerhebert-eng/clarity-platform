# Role Onboarding And SOP Training

Status: Implemented in local prototype as review-gated training guidance.

## Purpose

Clarity should be able to onboard and train each position around the same crisis workflow: capture the story once, preserve source-linked facts, keep clinical/legal outputs draft until reviewed, produce a packet, record routing response, and verify custody.

The v0.2 prototype implements this as a **Training & SOPs** workspace. It is company-agnostic and uses synthetic cases only.

## Source Boundaries

| Source area | Product use | Source status | Review status |
| --- | --- | --- | --- |
| Assessment training protocol | Pre-assessment, during-assessment, post-assessment, handoff, competency, annual review training patterns | Summary derived | Requires clinical review |
| ePEC chain-of-custody workflow | Legal-status draft practice, hash-chain verification, packet transfer receipts, counsel warnings | Summary derived | Requires legal review |
| Persona and role UX map | Role-specific onboarding and workspace scoping | Source confirmed | Product review |

Source documents remain read-only context. They are not imported as live app data and do not become final SOP, legal policy, clinical policy, HR credentialing evidence, or production form logic.

## Implemented Position Training

| Position | Training outcome | Built-in practice | Key guardrails |
| --- | --- | --- | --- |
| Field responder | Create a case and capture field-mode facts without making clinical/legal determinations. | New Case -> Guided Intake -> source-linked risk -> Custody Ledger | Draft, Unknown, Needs clinician review |
| Central intake coordinator | Run the command center, monitor lanes, escalate packet gaps, route packets. | Command Center -> Case Overview -> Packet Preview -> Routing Response | Demo clocks only, benefits never blocks clinical flow |
| Clinician reviewer | Review assessment, formulation, medical-necessity support, and prohibited criteria language. | Guided Intake clinical mode -> Medical Necessity -> Legal Status | No InterQual/MCG claims, no final medical necessity |
| UR / benefits specialist | Identify documentation gaps and future-safe utilization events. | Command Center -> Medical Necessity -> Ledger | No payment guarantee, no clinical block |
| Receiving facility | Review packet and record structured response with reason codes. | Packet Preview -> Routing Response -> Ledger | Decline reason required, no production facility data |
| Charge nurse | Evaluate milieu placement and document override rationale. | Milieu Bedboard -> Case Overview -> Ledger | Advisory recommendation, override requires reason |
| Compliance / legal officer | Verify custody chain and identify counsel-validation gaps. | Legal Status -> Custody Ledger -> Command Center | Counsel validation required, draft legal instrument |
| Executive / program director | Use POC feedback without unsupported performance claims. | Command Center -> Case Queue -> Ledger -> roadmap feedback | No measurements found, Unknown, parking lot |

## SOP Phases

1. **Pre-assessment procedure:** referral source, location, presenting concern, safety context, collateral plan, benefits as parallel lane.
2. **During-assessment procedure:** structured domains, source-linked risks, collateral reliability, missing-fact guardrails.
3. **Post-assessment procedure:** case presentation, draft medical necessity, draft legal status, packet completeness, follow-up tasks.
4. **EMTALA and state-code education:** legal-clock and statutory-language literacy with counsel-validation warnings.
5. **Annual competency evidence:** synthetic scenario completion, supervisor signoff placeholder, required refresh date.

## PEC Chain-Of-Custody Training Path

1. Open legal status as a draft with counsel-review warning.
2. Create instrument draft without final statutory or form claims.
3. Capture attestation/signature readiness as pending validation.
4. Seal material events into the custody ledger with previous-hash continuity.
5. Transmit packet preview and retain packet hash.
6. Record facility response, receipt, decline reason, or information request.
7. Route CEC or second-review steps as future legal workflow, not automated v0.2 decisioning.

## POC Feedback Questions

- Which position needs more detail before the workflow feels trainable?
- Which SOP step should be mandatory, optional, or parked?
- Which competency evidence would a supervisor actually accept?
- Which terms should be renamed for your organization?
- Which parts require legal, clinical, compliance, HR, or operational approval before pilot use?
