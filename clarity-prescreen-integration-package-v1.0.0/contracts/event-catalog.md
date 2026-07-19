# Prescreen Event Catalog

All events use `prescreen-event-envelope.schema.json`. Payload examples are synthetic and contain no PHI.

| Event type | Aggregate | Trigger | Minimum payload |
|---|---|---|---|
| `PRESCREEN_ENCOUNTER_STARTED` | PrescreenEncounter | Rapid case start accepted | encounterId, caseId, currentLocation, referralSourceType |
| `RAPID_SAFETY_SCREEN_RECORDED` | PrescreenEncounter | Safety answers saved | immediateMedicalEmergency, immediateDanger, protocolActivated |
| `ASSESSMENT_DRAFT_SAVED` | AssessmentVersion | Draft command committed | assessmentVersionId, versionNumber, changedSectionCodes |
| `SOURCE_STATEMENT_RECORDED` | AssessmentVersion | Source-linked statement added | statementId, sourceId, questionCode, valueState |
| `ORIENTATION_OBSERVED` | AssessmentVersion | Four-domain observation recorded | observedAt, person, place, time, situation, sourceId |
| `PATIENT_WILLINGNESS_RECORDED` | AssessmentVersion | Willingness state recorded | willingness, observedAt, sourceId |
| `POSSIBLE_PATHWAY_DERIVED` | PrescreenEncounter | Deterministic gate reevaluated | pathway, reasons, ruleVersionIds |
| `EMERGENCY_PROTOCOL_ACTIVATED` | PrescreenEncounter | User invokes approved protocol | triggerCode, protocolReference, responsibleOrganization |
| `ASSESSMENT_ATTESTED` | AssessmentVersion | Assessor attests version | assessmentVersionId, attestedBy, attestedAt, contentHash |
| `ASSESSMENT_SUPPLEMENTED` | AssessmentVersion | Post-attestation supplement committed | parentVersionId, supplementVersionId, reason, changedPaths |
| `PRESCREEN_SUBMITTED` | PrescreenEncounter | Attested version sent to named target | assessmentVersionId, target, receivingOrganizationId |
| `PRESCREEN_ACKNOWLEDGED` | PrescreenEncounter | Central Intake acknowledges receipt | submissionId, acknowledgedBy, acknowledgedAt |
| `INFORMATION_REQUESTED` | WorkflowTask | Structured request created | taskId, requestType, ownerRole, dueAt, requirementCode |
| `TASK_ACKNOWLEDGED` | WorkflowTask | Owner acknowledges | taskId, actorId, acknowledgedAt |
| `TASK_COMPLETED` | WorkflowTask | Request resolved | taskId, resolutionType, linkedObjectIds |
| `TASK_ESCALATED` | WorkflowTask | Approved escalation occurs | taskId, escalationRule, escalatedTo, reason |
| `PACKET_REQUIREMENT_STATE_CHANGED` | ReferralPacket | Requirement state changes | requirementCode, previousState, newState, documentVersionId |
| `REFERRAL_PACKET_VERSION_CREATED` | ReferralPacket | Immutable packet manifest created | packetVersionId, assessmentVersionId, target, manifestHash |
| `PACKET_TRANSMITTED` | ReferralPacket | Approved transmission attempted | packetVersionId, destination, channel, transmissionId |
| `PACKET_RECEIPT_RECORDED` | ReferralPacket | Receipt/acknowledgement recorded | transmissionId, receivedAt, receivingActor |
| `AUTHORIZED_REVIEW_RECORDED` | AuthorizedReview | Human review committed | reviewType, reviewerId, authorityRuleId, outcome, rationalePresent |
| `FACILITY_RESPONSE_RECORDED` | FacilityRouting | Facility response committed | packetVersionId, response, reasonCode, conditions |
| `FACILITY_PROFILE_DRAFTED` | FacilityAdmissionProfile | Profile draft created | profileId, version, sourceDocumentVersionIds |
| `FACILITY_PROFILE_APPROVED` | FacilityAdmissionProfile | Required approval recorded | profileId, approvalType, approverId, approvedAt |
| `FACILITY_PROFILE_ACTIVATED` | FacilityAdmissionProfile | All gates pass and effective date reached | profileId, version, effectiveFrom |
| `TRANSPORT_PLAN_CREATED` | TransportPlan | Plan command committed | transportPlanId, legalStatus, destinationFacilityId |
| `TRANSPORT_PROVIDER_QUALIFIED` | TransportPlan | Server evaluates provider | providerId, status, conditionCodes, ruleVersionIds, verifiedAt |
| `TRANSPORT_DISPATCH_ACCEPTED` | TransportPlan | Actual carrier accepts | arrangerId, actualCarrierId, acceptedAt, ETA |
| `PATIENT_TAKEN_INTO_CUSTODY` | TransportPlan | Authorized custody starts | authorityType, instrumentId, actor/agency, occurredAt |
| `CUSTODY_TRANSFERRED` | TransportPlan | Responsibility changes | fromParty, toParty, occurredAt, documentTransferStatus |
| `TRANSPORT_DEPARTED` | TransportPlan | Departure recorded | origin, occurredAt, actualCarrierId |
| `TRANSPORT_ARRIVED` | TransportPlan | Arrival recorded | destination, occurredAt |
| `RECEIVING_CUSTODY_ACCEPTED` | TransportPlan | Named receiver accepts | receivingActor, occurredAt, discrepancies |
| `TRANSPORT_EXCEPTION_RECORDED` | TransportPlan | Delay/exception documented | exceptionCode, authority, reason, alternatePlan |
| `EVENT_CORRECTED` | Any | Append-only correction | correctedEventId, correctionReason, replacementEventId |

## Publication rules

- Events are appended only after the operational transaction commits.
- Transactional outbox publication is idempotent.
- Consumers deduplicate by `eventId`.
- Unknown event/schema versions fail closed and enter a dead-letter workflow.
- PHI-bearing payloads are not published to aggregate analytics consumers.
- Events supporting analytics are minimized and de-identified through a governed transformation.
