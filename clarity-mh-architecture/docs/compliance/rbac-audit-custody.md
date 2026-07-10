# RBAC, Audit, and Custody Architecture

## Role model

### System roles

- `super_admin`
- `org_admin`
- `facility_admin`
- `intake_director`
- `lead_intake_clinician`
- `intake_coordinator`
- `business_office`
- `psychiatrist_reviewer`
- `ur_reviewer`
- `mobile_crisis_clinician`
- `law_enforcement_user`
- `coroner_user`
- `receiving_facility_user`
- `transport_coordinator`
- `compliance_auditor`
- `read_only_research_exporter`

## Permission groups

### Intake

- create case
- view assigned case
- update referral info
- update clinical intake draft
- attach source reference
- submit for review

### Clinical review

- review assessment
- request more info
- set clinician risk level
- sign clinical recommendation
- lock assessment

### Legal instrument

- create legal draft
- review legal status
- sign legal instrument
- void legal instrument
- transmit legal packet
- view legal audit trail

### Business office

- update insurance profile
- update benefit verification
- update authorization status
- view financial fields

### Routing

- create broadcast
- send packet
- respond as facility
- accept/decline/request info
- view limited packet

### Audit/compliance

- view audit logs
- export audit report
- verify custody chain
- manage redaction workflow

## Audit logging

Every write creates AuditLog:

- actor ID
- organization ID
- patient/case ID if applicable
- action
- entity type
- entity ID
- previous value hash
- new value hash
- timestamp
- IP/user agent if available
- reason/comment if sensitive

## Custody ledger vs. audit log

AuditLog captures all system writes.

CustodyLedgerEvent captures legally/materially important record custody events:

- legal instrument created
- legal instrument signed
- packet hash sealed
- media reference attached
- redaction applied
- packet transmitted
- facility response received
- acceptance receipt issued
- export generated
- custody chain verified

## Hash-chain design

Each custody event includes previous event hash. This creates a tamper-evident chain.

Requirements:

- canonical JSON serialization
- SHA-256 event hash
- immutable event rows after creation
- append-only custody ledger
- separate correction events instead of edits
- artifact content hash stored at time of sealing

## Redaction workflow

Redaction must be a new derivative artifact, not a mutation of the original.

Entities:

- original artifact
- redacted artifact
- redaction reason
- redaction steward
- fields redacted
- timestamp
- hash of redacted artifact
- custody ledger event

## Data segmentation

Recommended tenant isolation:

- organization ID on all tenant-owned rows
- facility-level scope for facility users
- case assignment scope for intake users
- receiving-facility limited view on packets only
- research exports must use de-identified data only

## Minimum production controls

- SSO or strong MFA
- row-level security
- encrypted storage
- BAA-covered infrastructure
- least-privilege access
- immutable audit logs
- retention configuration
- incident response plan
- CJIS posture if law enforcement integrations touch CJIS systems
- HIPAA and 42 CFR Part 2 posture for SUD data where applicable
