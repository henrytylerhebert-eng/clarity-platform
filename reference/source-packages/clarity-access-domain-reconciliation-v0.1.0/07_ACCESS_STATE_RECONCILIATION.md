# Access State Reconciliation

**Status:** PROPOSED_ARCHITECTURE

## Problem

The current repository contains overlapping lifecycle vocabularies:

- frontend `CaseStage`;
- backend `CaseStatus`;
- `PrescreenEncounterStatus`;
- parallel workstream statuses;
- Episode status.

The user should not need to understand all of them.

## Proposed solution

Create a **user-facing projection**, not another competing state machine:

```text
JourneyPhase =
  REFERRAL
  PRESCREEN
  QUALIFIED_REVIEW
  FACILITY_REVIEW
  PRE_ADMISSION
  TRANSFER_HANDOFF
  ADMITTED
```

## Projection principles

- Detailed bounded-context status remains authoritative in its domain.
- `JourneyPhase` summarizes where the Access process is operationally centered.
- Workstreams remain visible in parallel.
- Exception states add context to the phase rather than inventing a new screen.
- The projection must be deterministic and tested.

## Example

```text
Journey phase:
PRESCREEN

Case status:
INFORMATION_INCOMPLETE

Prescreen:
NEEDS_INFORMATION

Clinical:
IN_PROGRESS

Medical:
READY

Legal:
NOT_APPLICABLE

Benefits:
IN_PROGRESS

User-facing:
"Prescreen — waiting for information"
```

## Draft mapping

| Journey phase | Likely current states feeding the projection |
|---|---|
| REFERRAL | DRAFT / early INTAKE_IN_PROGRESS |
| PRESCREEN | INTAKE_IN_PROGRESS / DOCUMENTS_PENDING / INFORMATION_INCOMPLETE plus active Prescreen states |
| QUALIFIED_REVIEW | EVIDENCE_REVIEW / CLINICAL_REVIEW / LEGAL_REVIEW / BENEFITS_REVIEW / AUTHORIZATION_PREPARATION |
| FACILITY_REVIEW | PACKET_PREPARATION / READY_FOR_ROUTING / ROUTING_IN_PROGRESS / FACILITY_RESPONSE_PENDING |
| PRE_ADMISSION | ACCEPTED plus unresolved pre-admission requirements |
| TRANSFER_HANDOFF | TRANSPORT_PENDING / HANDOFF_IN_PROGRESS |
| ADMITTED | TRANSFER_COMPLETE when admission/episode creation criteria are satisfied |

This table is a starting mapping only. It must be reconciled against actual command semantics before implementation.

## Prescreen mapping

Prescreen statuses such as:
- DRAFT;
- ATTESTED;
- SUBMITTED;
- CENTRAL_INTAKE_REVIEW;
- NEEDS_INFORMATION;
- AUTHORIZED_REVIEW;
- FACILITY_ROUTING;
- TRANSPORT_PLANNING;
- HANDED_OFF;
- REDIRECTED;
- DECLINED;
- CANCELLED;

should remain Prescreen-domain truth.

The journey projection consumes them. It does not replace them.

## Test requirement

For every scenario:
- assert bounded-context states;
- assert workstream states;
- assert user-facing JourneyPhase;
- assert user-facing explanation.

No JourneyPhase should be inferred solely from which screen happens to be open.
