# Collateral Question Generator Prompt

Generate questions for family, outpatient provider, school, law enforcement, or ED staff based only on missing facts in the case.

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

## Output format

- Questions for family/caregiver
- Questions for patient
- Questions for ED/medical staff
- Questions for outpatient provider
- Questions for law enforcement/mobile crisis
- Questions for school/court if relevant
