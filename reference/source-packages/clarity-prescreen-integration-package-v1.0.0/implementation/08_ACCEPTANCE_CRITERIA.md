# Product Acceptance Criteria

## Field assessor

- Can start a minimal case without completing the full form.
- Can record direct observation, patient report, collateral, document source, unknown, and not assessed.
- Can record person/place/time/situation separately.
- Can see that willingness does not equal formal-voluntary eligibility.
- Can review the exact submitted assessment.
- Cannot edit an attested version; can create a supplement.
- Can see what Central Intake requested and who owns the response.

## Central Intake

- Receives a structured submission with source and version.
- Can identify missing packet items without reconstructing the case.
- Can request one specific item or answer with owner/due time.
- Can distinguish internal and external waits.
- Can create a packet version tied to exact assessment/document versions.
- Can route to authorized review without impersonating the reviewer.

## Authorized reviewer/facility

- Sees source, uncertainty, contradictions, and packet provenance.
- Can request information or record a response within authority.
- Decision records include reviewer authority, time, rationale/conditions.
- No opaque score or autonomous recommendation is presented as a decision.

## Transport/custody

- OPC/PEC/CEC configured paths do not return family/self/rideshare as selectable.
- Server explains provider qualification/disqualification.
- Broker and actual carrier are distinct.
- Missing/expired authority, destination, credentials, service area, or capability blocks dispatch.
- Custody sequence records pickup, transfer, departure, arrival, documents, and named receiver.

## Configuration

- Source policy document/version/location is visible for every active rule.
- AI-extracted requirements remain drafts.
- Required approvals and synthetic tests block activation.
- Historical cases retain the rule version used.
- Expired/suspended profiles create visible states.

## Accessibility

- All primary workflows are keyboard-complete.
- Errors and status are announced and not color-only.
- Mobile layout supports field use.
- Unknown/not-assessed is explicit.
- Interrupted drafts recover without silent data loss.

## Safety

- No autonomous clinical/legal/admission/transport decision.
- No financial block on emergency clinical review.
- No raw PHI in aggregate trends or infrastructure logs.
- Cross-tenant access and identifier enumeration tests pass.
