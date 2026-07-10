# Codex Prompt 01 — Phase 1 Data Spine

Implement Phase 1 only.

Build the Clarity MH data spine, domain types, validation schemas, custody ledger hashing utility, demo seed data, and tests.

Required entities:

- Organization
- Facility
- User
- Patient
- IntakeCase
- Encounter
- Assessment
- AssessmentSection
- MentalStatusExam
- RiskFinding
- SourceReference
- MedicalNecessitySnapshot
- LegalInstrument
- CustodyLedgerEvent
- Transmission
- FacilityResponse
- ReferralPacket
- AuditLog
- AIOutput

Rules:

- Demo data only.
- No real PHI.
- No proprietary criteria language.
- No autonomous diagnosis or LOC decision.
- Medical necessity is a draft snapshot of documented facts.
- Every major write should have an auditable event path.
- Custody events must be hash-chain verifiable.

Add or adapt tests for:

- custody hash verification
- forbidden language guardrails
- medical necessity snapshot generation from source-grounded facts
- missing required fields
