# Assessment Training and Procedure Protocol

## Source status

This protocol is derived from `sources/intake-assessment-policy-procedure-manual.txt`.

Use it as a training and procedural source for Clarity MH intake and assessment workflows. It should guide scripts, workflow steps, competency checks, and EMR documentation patterns.

It is not a final clinical policy, legal opinion, or autonomous clinical decision engine. Facility leadership, licensed clinical reviewers, compliance, and Louisiana counsel should validate the final version before production use.

## Purpose

The assessment protocol standardizes how intake staff prepare for, conduct, document, and follow up after behavioral-health assessments.

The Clarity implementation should use this protocol to support:

- consistent staff communication,
- complete intake preparation,
- structured assessment documentation,
- safe handling of suicide/self-harm and danger-to-others topics,
- coordinated handoff to physicians, reviewers, payers, and treatment teams,
- parallel benefits verification without delaying clinical screening,
- staff training and annual competency checks.

## Operating principles

- Assessment is a clinical workflow supported by software, not replaced by software.
- Scripts are training aids and should be adapted to patient context.
- Deviations from procedure should be documented and reviewable.
- Clinical conclusions, diagnoses, level-of-care recommendations, and legal certifications require qualified human review.
- Financial and insurance work may be documented early but must not block emergency screening or stabilizing action.
- Demo, training, and test data must not contain real PHI.

## Phase 1: Pre-Assessment Procedure

### Objectives

- Reduce no-shows and incomplete information.
- Prepare staff, forms, and assessment environment.
- Establish a welcoming and organized first contact.
- Collect preliminary information without delaying urgent clinical screening.

### Procedure steps

1. Confirm appointment or referral details when the workflow is scheduled rather than emergent.
2. Coordinate with reception or front-desk staff about expected assessments.
3. Provide patient/inquiry forms when appropriate.
4. Review forms for completeness and note missing items.
5. Review prior inquiry information before the assessment.
6. Prepare a private and clinically appropriate assessment room or virtual setting.
7. Prepare required clinical, consent, legal-status, and intake forms.
8. Confirm staff understand available programs and referral pathways.
9. Greet the patient and/or family clearly and respectfully.
10. Decide whether family/collateral involvement should occur jointly, separately, or later.
11. Capture payment and coverage information when available.
12. Start benefits verification as a parallel lane, not a clinical gate.

### Clarity product support

The product should provide:

- pre-assessment checklist,
- referral-source capture,
- patient-location capture,
- receptionist/front-desk handoff note,
- form completeness indicator,
- assessment-readiness status,
- collateral/family involvement plan,
- benefits-verification lane with non-blocking status,
- audit event for preparation completion.

## Phase 2: During Assessment Procedure

### Objectives

- Build rapport.
- Understand the presenting crisis in the patient's or caller's own words.
- Capture risk, functioning, mental status, medical suitability, and collateral facts.
- Identify missing facts and source references.
- Create a structured assessment draft for licensed review.

### Procedure steps

1. Begin with rapport and orientation to the assessment.
2. Use open-ended questions to understand why the person is seeking help now.
3. Ask the patient or caller to describe the main issue in their own words.
4. Assess impact on functioning across life domains.
5. Ask direct safety questions about self-harm, suicide, harm to others, grave disability, and immediate danger.
6. Capture observed symptoms and mental status.
7. Record psychiatric history, prior hospitalization, treatment history, and medication history.
8. Capture substance use, intoxication, withdrawal, and medical suitability concerns.
9. Identify support system, living situation, work/school functioning, and environmental stressors.
10. Capture collateral sources and reliability.
11. Document lower levels of care considered when relevant.
12. Summarize next steps as a draft plan pending required clinical review.

### Required Clarity assessment domains

- Identifying information or pseudonymized training identity.
- Referral source and current location.
- Presenting problem and crisis timeline.
- Suicide/self-harm risk.
- Homicide/violence risk.
- Grave disability/self-neglect.
- Mental status exam.
- Psychosis, mania, mood symptoms, paranoia, delusions, hallucinations.
- Substance use and withdrawal/intoxication.
- Medical suitability and active medical concerns.
- Psychiatric history and prior treatment.
- Functional impairment and life-domain impact.
- Social, family, school/work, legal, and environmental context.
- Collateral contacts and source reliability.
- Protective factors.
- Lower levels of care considered.
- Missing information.

### Script posture

The source protocol contains useful rapport and safety scripts. Clarity should convert those scripts into role-aware coaching prompts.

Use safer product language:

- "working clinical impression" instead of unsupported "diagnosis",
- "draft recommendation for clinician review" instead of final treatment recommendation,
- "documentation supports review for" instead of "patient meets criteria",
- "benefits verification pending; does not block clinical screening" instead of financial gating language.

## Phase 3: Post-Assessment Procedure

### Objectives

- Ensure care coordination.
- Share case information with appropriate reviewers and treatment partners.
- Prioritize follow-up.
- Reconfirm payment/coverage information without disrupting clinical flow.
- Identify resources or alternate pathways when needed.
- Preserve a defensible record of decisions and handoffs.

### Procedure steps

1. Prepare a concise case presentation for physicians, reviewers, UR, payers, or treatment team members.
2. Prioritize follow-up calls based on urgency and treatment plan.
3. Bring complex or unresolved cases to staff review.
4. Reconfirm benefits and payment information as appropriate.
5. Identify additional resources, grants, payment supports, or lower-level care options where relevant.
6. Document handoff, packet contents, reviewer decisions, and next actions.

### Clarity product support

The product should provide:

- case-presentation summary,
- treatment-team handoff summary,
- payer/UR summary,
- follow-up task queue,
- staff-review flag,
- resource/referral options,
- packet completeness score,
- audit and custody ledger events for material handoffs.

## EMR and record integration

The protocol expects forms and assessment documents to become part of the medical record.

Clarity should support:

- structured assessment export,
- referral packet export,
- legal instrument export,
- source-reference preservation,
- artifact hashing,
- EMR-ready summary fields,
- integration adapters later, not live integrations in Phase 1.

## EMTALA and Louisiana Mental Health Code education

The source protocol identifies EMTALA and Louisiana Mental Health Code education as training requirements.

Training should emphasize:

- emergency screening and stabilizing action must not be delayed by insurance or payment status,
- transfer decisions require appropriate medical screening, stability/capability considerations, and documentation,
- Louisiana legal-status workflows must preserve due process and required documentation,
- exact statutory trigger events, deadlines, electronic signatures, and form language require counsel validation before production enforcement.

## Staff competency and annual review

The source protocol includes an annual post-assessment test concept.

Clarity should support a training mode or competency checklist covering:

- pre-assessment preparation,
- forms reviewed before assessment,
- major life areas for function/dysfunction,
- safety/risk questions,
- substance use severity questions,
- clinical-need documentation factors,
- common patient barriers to recommended care,
- steps for working through barriers,
- when involuntary-commitment workflow should be escalated,
- how to explain insurance and benefits after assessment without implying financial gating.

## Product implications

Add or preserve these workflow features:

- training-mode scripts for pre-assessment, assessment, and post-assessment,
- checklist completion tracking,
- deviations-from-protocol notes,
- source-linked clinical facts,
- missing-facts guardrails,
- non-blocking benefits lane,
- case-presentation generator,
- follow-up task scheduler,
- staff-review queue,
- annual competency evidence.

## Safety caveats

Do not implement the source protocol in a way that:

- lets the system diagnose independently,
- lets the system make final treatment recommendations,
- lets the system certify medical necessity,
- uses financial status to block clinical screening,
- hard-codes Louisiana statutory deadlines without counsel validation,
- stores real patient names, phone numbers, insurance IDs, or other PHI in demo data.

