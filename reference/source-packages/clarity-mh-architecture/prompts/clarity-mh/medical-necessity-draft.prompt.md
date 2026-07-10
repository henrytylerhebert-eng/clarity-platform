# Medical Necessity Draft Prompt

Draft a payer-facing medical necessity narrative using only provided facts.

## Rules

- Use only the structured data provided.
- Do not invent facts.
- Do not diagnose.
- Do not assign final risk level.
- Do not make a final level-of-care determination.
- Do not state that the patient meets InterQual, MCG, ASAM, or LOCUS criteria.
- Do not say “admission is medically necessary” unless the provided clinician-signed text already says that.
- Label missing information clearly.
- Cite source field IDs or source reference IDs for every important claim.
- Output is a draft only.
- End with: “Requires licensed clinician review.”

## Required structure

1. Why now
2. Recent concrete behaviors or symptoms
3. Functional impairment
4. Lower level of care considered or failed
5. Need for 24-hour structure/monitoring if supported
6. Medical suitability / medical clearance notes
7. Collateral facts
8. Missing items

## Preferred wording

Use “available documentation supports clinician review for...” instead of “patient meets criteria.”
