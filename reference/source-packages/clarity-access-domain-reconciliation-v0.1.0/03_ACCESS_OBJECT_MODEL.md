# Access Object Model

**Status:** PROPOSED_ARCHITECTURE

## Core relationship

```text
Patient
  │
  ├── Access Case
  │     ├── Prescreen Encounter(s)
  │     ├── Assessment Version(s)
  │     ├── Work Items
  │     ├── Facility Referral(s)
  │     │      └── Facility Decision(s)
  │     └── Transfer / Handoff
  │
  └── Episode(s) after admission
```

## Definitions

### Patient
The person.

Current repository analogue:
`PatientToken`.

### Access Case
One effort to obtain an appropriate disposition/admission for the person.

Current repository analogue:
`BehavioralHealthCase`.

A future rename is not authorized by this package. This definition is conceptual.

### Prescreen Encounter
One prescreen/reassessment instance within the Access Case.

Current implementation:
`PrescreenEncounter`.

An Access Case may have multiple prescreen/reassessment events over time.

### Assessment Version
Versioned assessment content linked to a Prescreen Encounter.

Current implementation:
`PrescreenAssessmentVersion`.

### Work Item
**PROPOSED_ARCHITECTURE.**

Represents required next work.

Candidate fields:
- id;
- organizationId;
- accessCaseId;
- journeyPhase;
- workType;
- ownerRole;
- assignedUserId;
- status;
- requiredBefore;
- dependencies;
- sourceRuleIds;
- completionEvidence;
- decisionAuthority;
- createdAt;
- completedAt.

This concept should not be implemented until explicitly approved.

### Facility Referral
A referral/packet sent or prepared for a target receiving facility.

Current implementation analogue:
`Referral`.

There may be multiple facility referrals within one Access Case.

### Facility Decision
A facility-specific response.

Acceptance is not admission.

### Episode
The actual episode of care after admission.

Current implementation:
`Episode`, linked back to the source case and acceptance identity.

## Key invariants

- Patient identity and Access Case are not interchangeable.
- A Prescreen Encounter is not the whole Access Case.
- A Facility Referral is not the whole Access Case.
- Acceptance is not admission.
- Episode begins after an admission event/decision that meets the approved workflow.
- Detailed bounded-context states remain within their domains.
- Cross-tenant references are never authorization.
