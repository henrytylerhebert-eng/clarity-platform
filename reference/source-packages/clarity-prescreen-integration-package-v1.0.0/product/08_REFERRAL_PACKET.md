# Referral Packet Builder

## Product distinction

- **Prescreen assessment:** What is happening, what was observed or reported, and what requires review?
- **Referral packet:** What supporting records and evidence accompany the referral?

They share a case but remain separately versioned.

## Generic maximum packet envelope

### Identity and referral

- demographics/face sheet;
- referral source and contact;
- current location;
- requested program/level of care;
- reason for referral.

### Clinical and behavioral

- recent nursing/progress notes;
- behavioral documentation supporting the referral;
- psychiatric or provider evaluation when available;
- history and physical when available;
- most recent provider visit note;
- diagnoses as reported/documented;
- risk/safety documentation.

### Orders, medications, and treatment

- provider order for evaluation/treatment when required;
- current medication list;
- MAR — Medication Administration Record;
- TAR — Treatment Authorization Request;
- recent medication changes;
- PRN use and response when relevant.

### Medical and nursing

- labs;
- vital signs;
- falls;
- wounds;
- oxygen;
- mobility and ADLs;
- diet/swallowing;
- medical devices;
- infection-control and other precautions;
- current observation/supervision needs.

### Legal, consent, and custody

- OPC/PEC/CEC or other legal documents;
- guardianship/tutorship/caretaker evidence;
- consent/application records;
- custody and transport authority;
- privacy/disclosure authorization when required.

### Placement and continuity

- return-to-originating-facility confirmation;
- alternative placement plan;
- family/support contacts;
- discharge/continuity considerations;
- transport needs.

## Requirement states

- `NOT_STARTED`
- `REQUESTED`
- `RECEIVED`
- `UNDER_REVIEW`
- `ACCEPTED_FOR_PACKET`
- `MISSING`
- `UNAVAILABLE_WITH_REASON`
- `NOT_APPLICABLE_WITH_AUTHORITY`
- `NEEDS_CLARIFICATION`
- `STALE`
- `SUPERSEDED`

## Requiredness

- hard requirement for named target;
- conditional requirement;
- requested when available;
- supporting/non-blocking;
- prohibited from collection;
- not applicable.

## Packet version

A packet version contains:

- target facility/program and readiness target;
- assessment version;
- included document versions;
- requirement status snapshot;
- unresolved-item explanations;
- source profile/rule versions;
- creator and creation time;
- hash/manifest;
- transmission history.

Adding or replacing a document after submission creates a new packet version or supplement. It does not mutate a packet already transmitted.

## Readiness targets

- Ready for Central Intake review.
- Ready for authorized practitioner review.
- Ready for facility routing.
- Ready for transport planning.
- Ready for receiving handoff.

A requirement may block one target but not another.
