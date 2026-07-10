# Acceptance Tests

## Safety tests

1. AI output cannot be marked final.
2. AI output must include `requiresClinicianReview: true`.
3. Guardrail test fails if generated text includes “meets InterQual”, “meets MCG”, “meets ASAM”, “meets LOCUS”, or “admission is medically necessary” without clinician-signed source.
4. No demo data contains realistic SSNs, real phone numbers, or real patient names.
5. Clinical screening can start while insurance status is unknown.
6. Financial lane cannot set case status to declined before clinical screening.

## Data tests

1. Case creation creates AuditLog.
2. Assessment update creates AuditLog.
3. LegalInstrument signature creates CustodyLedgerEvent.
4. Transmission creates CustodyLedgerEvent.
5. FacilityResponse creates CustodyLedgerEvent.
6. Custody chain verifies when untouched.
7. Custody chain fails verification when payload is tampered.

## Workflow tests

1. Create case from family call.
2. Complete guided intake.
3. Save assessment draft.
4. Add suicide/self-harm risk finding.
5. Add source reference from family collateral.
6. Generate medical necessity snapshot draft.
7. Create PEC draft.
8. Hash-seal legal instrument after authorized signature.
9. Build referral packet.
10. Broadcast to two demo facilities.
11. One facility declines with reason.
12. One facility accepts and issues receipt.
13. Verify custody ledger.

## UI tests

1. `/cases` loads.
2. `/cases/new` creates case.
3. `/cases/[caseId]` shows status strip.
4. `/cases/[caseId]/call-coach` saves progress.
5. `/cases/[caseId]/assessment` shows missing required fields.
6. `/cases/[caseId]/medical-necessity` shows draft + missing facts.
7. `/cases/[caseId]/legal` shows legal status and deadlines.
8. `/cases/[caseId]/routing` shows facility responses.
9. `/cases/[caseId]/packet` renders packet.
10. `/cases/[caseId]/custody-ledger` verifies hash chain.
