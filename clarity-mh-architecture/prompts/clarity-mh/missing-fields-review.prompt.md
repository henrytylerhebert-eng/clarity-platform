# Missing Fields Review Prompt

Review the provided intake/assessment data and identify missing facts that would weaken clinical review, legal packet completion, medical necessity documentation, or referral routing.

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

- Critical missing facts
- Important but non-blocking missing facts
- Age-specific missing facts
- Legal-status missing facts
- Medical suitability missing facts
- Suggested next questions
