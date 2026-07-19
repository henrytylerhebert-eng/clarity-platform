# Communications and Tasks

## Purpose

Phone calls remain part of crisis work. Clarity makes the request, outcome, ownership, and follow-up visible so the case does not depend on memory or repeated calls.

## Communication model

Every communication record includes:

- organization and case scope;
- initiating actor and role;
- recipient organization, role, and person when known;
- method: phone, secure message, fax, Direct, portal, in-person, radio, system integration;
- purpose code;
- occurred time and recorded time;
- summary and outcome;
- acknowledgement or receipt;
- linked task, document, packet, review, or transport plan;
- next action and responsible party;
- PHI classification;
- source/channel identifier;
- correction or supersession reference.

## Structured request types

- `REQUEST_COLLATERAL`
- `REQUEST_MEDICAL_CLEARANCE`
- `REQUEST_LABS`
- `REQUEST_MAR`
- `REQUEST_TAR`
- `REQUEST_NURSING_NOTES`
- `REQUEST_PROVIDER_ORDER`
- `REQUEST_LEGAL_DOCUMENT`
- `REQUEST_GUARDIAN_AUTHORITY`
- `REQUEST_CLINICAL_REVIEW`
- `REQUEST_LEGAL_REVIEW`
- `REQUEST_FACILITY_REVIEW`
- `REQUEST_BED_CONFIRMATION`
- `REQUEST_TRANSPORT`
- `REQUEST_RECEIVING_HANDOFF`
- `REQUEST_OTHER_INFORMATION`

## Task states

```text
OPEN -> ACKNOWLEDGED -> IN_PROGRESS -> COMPLETED
  |          |              |
  |          |              +-> BLOCKED
  |          +-> DECLINED_WITH_REASON
  +-> CANCELLED

OPEN/ACKNOWLEDGED/IN_PROGRESS/BLOCKED -> ESCALATED
```

## Ownership rules

- Every open task has one accountable owner role and organization.
- A task may have contributors but not multiple ambiguous owners.
- Reassignment requires a reason and preserves history.
- External waits remain visibly external and do not count as internal staff failure by default.
- Due dates may be policy-based, request-based, or manually set; source is shown.
- Overdue status is derived server-side from the approved rule and event time.

## Communication timeline behavior

The timeline shows:

- request created;
- channel used;
- transmission result;
- receipt/acknowledgement;
- response;
- document or answer received;
- task completion;
- escalation and reason.

## Failure states

- recipient unknown;
- channel unavailable;
- transmission failed;
- receipt not confirmed;
- duplicate message;
- stale contact data;
- unauthorized content;
- integration timeout;
- response received without matching request.

## Security

- Do not log full message bodies in infrastructure logs.
- Apply minimum necessary content templates.
- Encrypt messages and attachments in transit and at rest.
- Expire external secure links.
- Audit access, resend, download, and acknowledgement.
- Prevent a communication channel from changing domain state without an authenticated command or governed ingestion event.
