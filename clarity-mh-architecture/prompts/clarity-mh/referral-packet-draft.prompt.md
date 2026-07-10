# Referral Packet Draft Prompt

Draft a receiving-facility referral packet summary.

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

1. Patient/referral context
2. Presenting crisis
3. Safety/risk summary
4. MSE summary
5. Medical suitability
6. Substance use
7. Medications
8. Legal status
9. Collateral
10. Requested level of care / placement need as clinician-review language
11. Missing information
