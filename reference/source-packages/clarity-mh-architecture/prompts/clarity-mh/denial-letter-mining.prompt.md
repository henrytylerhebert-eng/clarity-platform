# Denial Letter Mining Prompt

Analyze a de-identified denial letter and extract documentation patterns that should improve future intake templates.

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

- Denial reason stated
- Missing documentation pattern
- Related intake fields
- Template improvement recommendation
- Suggested training note
- Do not reproduce proprietary payer criteria beyond short provided excerpts
