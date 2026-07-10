# Epics and Implementation Issues

## Epic 1 — Repo and architecture setup

### Issue 1.1 — Inspect current repo

Acceptance criteria:

- Framework identified.
- Existing routes listed.
- Existing DB/auth/test setup listed.
- Existing ePEC prototype reviewed if present.
- Gap report created at `docs/implementation/repo-inspection.md`.

### Issue 1.2 — Add architecture docs to repo

Acceptance criteria:

- `docs/clarity-mh/` exists.
- Product thesis, module architecture, workflows, guardrails, and MVP scope are added.
- README references architecture docs.

## Epic 2 — Data spine

### Issue 2.1 — Add domain types

Acceptance criteria:

- Core enums and DTOs added.
- No PHI in tests.
- Typecheck passes.

### Issue 2.2 — Add database schema

Acceptance criteria:

- Patient, IntakeCase, Encounter, Assessment, RiskFinding, SourceReference, MedicalNecessitySnapshot, LegalInstrument, CustodyLedgerEvent, Transmission, FacilityResponse, ReferralPacket, AuditLog exist.
- Migrations run locally.
- Demo seed data is fake.

### Issue 2.3 — Add audit log service

Acceptance criteria:

- All writes route through audit helper or trigger.
- Tests prove audit rows are created.

### Issue 2.4 — Add custody hash service

Acceptance criteria:

- Canonical JSON hashing implemented.
- Previous-hash chaining implemented.
- Verification returns valid/invalid.
- Tests cover tampered payload detection.

## Epic 3 — Intake case workflow

### Issue 3.1 — `/cases` list

Acceptance criteria:

- Shows active demo cases.
- Filters by status, age group, legal status, owner.

### Issue 3.2 — `/cases/new`

Acceptance criteria:

- Creates fake/demo case.
- Captures referral source, patient display name, location, presenting concern.
- Starts SLA timestamps.
- Creates audit event.

### Issue 3.3 — Guided call coach

Acceptance criteria:

- Progressive intake sections implemented.
- Facts map to structured assessment fields.
- Source references can be attached.
- Missing facts flagged.

## Epic 4 — Assessment and medical necessity

### Issue 4.1 — Assessment form

Acceptance criteria:

- Captures risk, MSE, medical suitability, substance use, function, collateral.
- Age-specific sections appear based on age group.
- Save draft works.

### Issue 4.2 — Medical necessity snapshot

Acceptance criteria:

- Snapshot generated from structured facts.
- Draft language avoids “meets criteria.”
- Missing items display.
- Clinician review required.

## Epic 5 — Legal instrument layer

### Issue 5.1 — Legal status module

Acceptance criteria:

- Legal status can be set.
- OPC/PEC/CEC draft records can be created.
- Deadline config exists but is marked counsel-validation-required.

### Issue 5.2 — Legal instrument signing and hash seal

Acceptance criteria:

- Draft can be signed only by authorized role.
- Signed artifact hash is created.
- Custody ledger event is created.
- Signed version is locked.

## Epic 6 — Routing and packet

### Issue 6.1 — Referral packet builder

Acceptance criteria:

- Packet preview combines assessment, medical necessity snapshot, legal status, source references.
- Packet can be hash-sealed.

### Issue 6.2 — Request-broadcast simulation

Acceptance criteria:

- Facility directory supports capability filters.
- Send simulated request.
- Facility response can be accept/decline/request info.
- Decline reason required.
- Response logged in custody ledger.

## Epic 7 — AI/MCP support

### Issue 7.1 — AI output model and mock provider

Acceptance criteria:

- Prompt templates loaded.
- Mock provider returns draft output.
- Output requires clinician review.
- Source references required.

### Issue 7.2 — Missing fields assistant

Acceptance criteria:

- Flags missing risk, collateral, medical suitability, lower LOC fields.
- Does not infer facts.

## Epic 8 — Analytics

### Issue 8.1 — Command center

Acceptance criteria:

- SLA cards display.
- Packet completeness displays.
- Legal deadlines display.
- Facility response timers display.

### Issue 8.2 — KPI dashboard

Acceptance criteria:

- Referral-to-screening, intake-to-admission, insurance verification time, packet completeness, conversion, decline reasons tracked.
