# Legal Instrument Draft Review Prompt

Review a draft OPC/PEC/CEC packet for missing source-grounded facts. Do not provide legal advice. Do not certify legality.

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

- Instrument type
- Stated legal status
- Source-backed statutory-ground facts
- Missing required fields for internal review
- Deadline/clock fields needing counsel-configured validation
- Signature/attestation fields present
- Packet readiness: draft / needs more info / ready for authorized human review
