# Personas, Roles, and Capabilities

## Role model principles

- Role names are configurable; capabilities are canonical.
- Assignment, organization, facility, program, case relationship, and legal authority all affect access.
- Frontend role lenses are not authorization.
- A user may hold multiple roles, but capabilities remain explicit.
- System administrator does not silently inherit clinical or case authority.

## Primary roles

### Crisis response officer / law-enforcement officer

**Contributes:** scene observations, safety conditions, patient statements, collateral, custody details, OPC execution, handoff.  
**May:** start a case, complete authorized sections, attach records, request Central Intake review, record custody events.  
**May not by default:** diagnose, decide admission, declare capacity, sign clinical findings outside scope, access unrelated cases.

### Prescreen assessor — private hospital

**Contributes:** guided assessment, risk facts, mental-status observations, referral narrative, packet assembly.  
**May:** create/edit draft, review, attest, submit, supplement, communicate with Central Intake.  
**May not by default:** record final facility acceptance or legal authority unless separately credentialed.

### Prescreen assessor — public/community team

Same core assessment capability with organization-specific escalation, legal, and handoff pathways. The product must not assume the assessor belongs to the receiving hospital.

### Central Intake coordinator

**Contributes:** packet review, gap identification, task assignment, clinical/legal presentation, facility routing, response capture, transport coordination.  
**May:** accept a submission for review, request specific information, assign tasks, route authorized reviews, assemble packet versions.  
**May not:** substitute for the accepting practitioner, medical-clearance provider, legal signer, or receiving nurse.

### Clinical reviewer / accepting practitioner

**Contributes:** documented human review and authorized decision.  
**May:** request information, record suitability/admission decision within authority, record rationale and conditions.  
**May not:** rely on opaque system output or alter the assessor’s attested narrative silently.

### Medical-clearance provider

**Contributes:** examination, findings, tests, treatment, medical disposition, transfer constraints.  
**May:** record the facility-recognized clearance/review status.  
**May not:** automatically decide behavioral-health admission unless authorized.

### Legal/coroner authority

**Contributes:** instrument issuance/execution, legal status, expiration, examination, release or continuation.  
**May:** perform only actions authorized by jurisdiction and role configuration.

### Sending nurse

**Contributes:** nursing report, MAR, TAR, precautions, mobility, oxygen, wounds, falls, last doses, current condition.  
**May:** reconcile and attest the handoff information within scope.

### Receiving nurse

**Contributes:** receipt, reconciliation, arrival condition, discrepancies, admission handoff.  
**May:** acknowledge custody and document discrepancies; does not rewrite source history.

### Transport coordinator

**Contributes:** arrangement, provider, ETA, authorization check, destination confirmation.  
**May:** select only qualified providers returned by server policy.

### Transport provider / law enforcement

**Contributes:** pickup, transport authority, personnel, vehicle/category, departure, arrival, custody transfer, exceptions.  
**May:** view only the minimum transport packet and safety information authorized for the trip.

### Parent, guardian, tutor, caretaker, or public custodian

**Contributes:** identity, authority evidence, consent or application where permitted, collateral, accompaniment.  
**Capability:** document-specific and rule-driven; no universal “sign all” capability.

### Facility onboarding specialist

**Contributes:** candidate policy mappings, workflow configuration, testing evidence.  
**May:** draft profiles; may not activate unapproved clinical/legal rules.

### Facility profile approver

**Contributes:** approval, effective date, scope, supersession.  
**Must be:** an authorized owner for the applicable clinical, legal, operational, privacy, or transport domain.

## Capability groups

- `PRESCREEN_CREATE`
- `PRESCREEN_EDIT_DRAFT`
- `PRESCREEN_ATTEST`
- `PRESCREEN_SUPPLEMENT`
- `PRESCREEN_VIEW_SOURCE`
- `PACKET_REQUEST_ITEM`
- `PACKET_ACCEPT_ITEM`
- `CENTRAL_INTAKE_REVIEW`
- `CLINICAL_REVIEW_RECORD`
- `LEGAL_INSTRUMENT_RECORD`
- `FACILITY_RESPONSE_RECORD`
- `TRANSPORT_PLAN_CREATE`
- `TRANSPORT_CUSTODY_ACCEPT`
- `CONSENT_RECORD`
- `FACILITY_PROFILE_DRAFT`
- `FACILITY_PROFILE_APPROVE`
- `AUDIT_VIEW`
- `AGGREGATE_TREND_VIEW`

Concrete mappings are in `contracts/role-permission-matrix.csv`.
