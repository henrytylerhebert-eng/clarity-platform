# ePEC / OPC / CEC Chain-of-Custody Workflow

## Purpose

Create a digital legal-instrument layer for Louisiana behavioral health crisis holds that is:

- statutorily mappable
- role-bound
- signature-ready
- hash-sealed
- auditable
- transferable
- court/DA/hospital-ready

## Core entities

- LegalInstrument
- LegalInstrumentVersion
- Attestation
- SignatureEvent
- CustodyLedgerEvent
- EvidenceArtifact
- Transmission
- FacilityResponse
- AcceptanceReceipt
- RedactionEvent
- ExportPacket

## Lifecycle

### 1. Legal status opened

Trigger:

- Intake user selects legal status or receives legal paperwork.

System actions:

- create `LegalInstrument` or `LegalStatusReview`
- create `CustodyLedgerEvent: legal_status_opened`
- assign required role for review
- start applicable configured clocks

### 2. Legal draft created

Instrument types:

- OPC
- PEC
- CEC
- voluntary consent
- legal status note

System actions:

- create draft version
- map facts from assessment to legal fields
- require source references for statutory grounds
- show missing legal fields
- prevent signing when required fields are missing

### 3. Attestation and signature

Signer role examples:

- credible person
- physician
- qualified examiner
- coroner
- licensed clinician where legally allowed
- receiving facility representative

System actions:

- capture signer identity
- capture role
- capture timestamp
- capture attestation text version
- hash artifact payload
- create signature event
- lock signed version

### 4. Hash-chain ledger event

Every custody event includes:

- event ID
- case ID
- event type
- actor ID
- actor role
- timestamp
- artifact IDs
- previous event hash
- event payload hash
- resulting event hash

Hash formula:

```txt
hash = sha256(canonical_json({event_type, actor_id, timestamp, artifact_hashes, payload}) + previous_hash)
```

### 5. Transmission

Transmission routes:

- secure API
- SFTP
- encrypted email
- fax fallback
- printed handoff fallback

System actions:

- bind packet version to transmission
- hash packet
- send to destination
- record destination
- record delivery status
- create custody event

### 6. Facility response

Response types:

- accept
- decline
- request_more_info
- unable_to_review
- no_response_timeout

Decline reasons:

- no bed
- age mismatch
- acuity too high
- medical exclusion
- payer exclusion
- legal paperwork incomplete
- missing medical clearance
- missing risk documentation
- other

System actions:

- create response record
- bind to packet version
- timestamp receiver
- create acceptance receipt if accepted
- preserve decline history if rerouted

### 7. CEC / second review path

After admission or legally required trigger:

- create CEC review task
- show clock
- independent review
- sign or discharge-forthwith pathway
- hash-seal CEC packet

## Legal caveat

This package does not certify statutory deadlines, attestation wording, or electronic signature validity. All trigger events, clocks, form language, and signature rules require Louisiana counsel validation before production use.

## Verification command concept

The UI should include a “Verify Custody Chain” action that:

1. loads all ledger events in sequence,
2. recomputes every event hash,
3. verifies previous-hash continuity,
4. verifies artifact hashes,
5. returns `verified`, `broken`, or `incomplete`.
