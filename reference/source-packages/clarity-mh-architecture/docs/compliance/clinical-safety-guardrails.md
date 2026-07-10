# Clinical Safety Guardrails

## Product category

Clarity MH is clinical workflow software and clinical decision support.

It is not:

- an autonomous diagnostic engine
- an autonomous level-of-care determiner
- an autonomous suicide-risk predictor
- a replacement for clinician judgment
- a licensed proprietary criteria engine unless later licensed

## Required language posture

Use:

- “draft for clinician review”
- “documentation indicates”
- “available facts support review for”
- “missing information”
- “source-referenced summary”
- “clinician recommendation pending/finalized”

Avoid:

- “patient meets criteria”
- “admission is medically necessary”
- “inpatient is required” unless signed by clinician
- “InterQual says” unless licensed and integrated
- “MCG says” unless licensed and integrated
- “ASAM score” unless licensed and validated
- “LOCUS score” unless licensed and validated

## AI guardrails

AI may:

- summarize provided facts
- identify contradictions
- flag missing fields
- draft questions
- draft narrative language
- extract source references
- prepare export summaries

AI may not:

- invent facts
- infer risk as fact
- assign final risk level
- diagnose
- determine level of care
- certify legal criteria
- sign legal instruments
- lock notes
- remove clinician review

## Clinical review states

Every clinical output should have one of these states:

- `draft`
- `needs_more_information`
- `ready_for_clinician_review`
- `clinician_reviewed`
- `signed_locked`
- `voided`

AI outputs cannot move directly to `signed_locked`.

## Source grounding

Every important clinical claim must link to a source reference:

- patient report
- collateral report
- clinician observation
- prior record
- lab/vital/medical record
- legal document
- media reference
- referral document

Unsupported statements are stored as `unverified` or `needs_source`.

## Human-in-the-loop rules

Requires licensed clinician review:

- final risk level
- diagnosis/provisional diagnosis
- level-of-care recommendation
- medical necessity statement
- legal hold certification
- discharge recommendation
- safety plan finalization

Requires legal/counsel validation before production:

- statutory deadline triggers
- e-signature acceptance
- form attestation text
- coroner workflow
- DA/court export packet format
- redaction policies
- records retention rules
