# Decision Log

| ID | Decision | Status | Consequence |
|---|---|---|---|
| PSD-001 | Prescreen is a bounded context connected to the existing case spine. | Recommended | Avoids overloading Guided Intake while preserving case identity and evidence. |
| PSD-002 | The field assessment and referral packet are separate but linked artifacts. | Accepted product direction | Assessment answers “what is happening”; packet answers “what evidence accompanies it.” |
| PSD-003 | Assessment changes after attestation create a supplement or new version. | Accepted product direction | Original statements remain auditable. |
| PSD-004 | Willingness, orientation, capacity review, legal status, and transport authority are separate. | Accepted product direction | Prevents unsafe one-checkbox logic. |
| PSD-005 | Formal-voluntary eligibility is unavailable at prescreen when any orientation domain is not oriented. | Owner decision; configurable | Routes to authorized review without declaring the final admission status. |
| PSD-006 | Noncontested identification and noncontested admission authorization are separate events. | Recommended | Prescreen may identify; authorized hospital role decides. |
| PSD-007 | Facility and jurisdiction rules are versioned profiles with provenance and approval. | Recommended | Enables plug-and-play onboarding without hard-coded policy. |
| PSD-008 | OPC/PEC/CEC pathways require qualified secured transport under the active profile. | Owner decision; local approval required | Blocks unapproved transport choices. |
| PSD-009 | Transport broker and actual carrier are separate records. | Recommended | Preserves accountability for brokered trips. |
| PSD-010 | Trend analysis is operational and aggregate; it may not determine individual capacity or legal status. | Accepted product direction | Supports planning without automating regulated judgment. |
| PSD-011 | Integration contracts are canonical; adapters translate REST, FHIR, HL7, files, and manual entry. | Recommended | Keeps the product system-agnostic. |
| PSD-012 | Browser clients never write directly to persistence or analytics tables. | Existing Clarity boundary | Commands pass through authenticated server services. |
| PSD-013 | Raw patient source images are excluded from this package. | Required | Prevents PHI propagation. |
| PSD-014 | First repository slice is synthetic, read/write inside controlled service boundaries, with no deployment. | Recommended | Creates independently verifiable progress. |
