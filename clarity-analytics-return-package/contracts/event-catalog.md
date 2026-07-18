# Event Catalog

**Status:** Proposed and unverified.  
**Envelope:** `analytics-event-envelope.schema.json`  
**Versioning:** Event name is stable; incompatible payload changes increment event type version and schema version. Consumers must reject/quarantine unsupported required versions rather than guessing.

## Event design rules

- Past-tense facts only.
- Commands are not events.
- Native events are appended in the same transaction as source state and audit.
- Events contain source IDs/references, not copied document/note text.
- `effectiveAt` is the business time; `recordedAt` is when Clarity accepted the fact.
- Corrections/reversals are new events that target one active event.
- Derived events never become the operational source of truth.
- Metric eligibility is server-owned.
- Event payloads use canonical IDs/codes and retain mapping lineage.
- No event authorizes a clinical, admission, discharge, placement, legal, or payer decision.

## Initial catalog summary

| Event type | Aggregate owner | Classification | Source or derived | Metric eligible | First slice |
|---|---|---|---|---:|---:|
| `CASE_ADMISSION_HANDOFF_COMPLETED.v1` | Case | PHI_OPERATIONAL | source | no | yes |
| `EPISODE_CREATED.v1` | Episode | PHI_OPERATIONAL | source | no | yes |
| `ADMISSION_RECORDED.v1` | Episode | PHI_OPERATIONAL | source | yes | yes |
| `EPISODE_DAY_OPENED.v1` | EpisodeDay | PSEUDONYMIZED/PHI_OPERATIONAL | derived from source facts | yes | yes |
| `EPISODE_DAY_CORRECTED.v1` | EpisodeDay | PHI_OPERATIONAL | source correction | yes | yes |
| `EPISODE_AUTHORIZATION_OPENED.v1` | EpisodeAuthorization | PHI_OPERATIONAL | source | no | yes |
| `AUTHORIZATION_REVIEW_RECORDED.v1` | AuthorizationReview | PHI_OPERATIONAL | source | yes | yes |
| `AUTHORIZATION_REVIEW_CORRECTED.v1` | AuthorizationReview | PHI_OPERATIONAL | source correction | yes | yes |
| `AUTHORIZATION_DAY_DECISION_RECORDED.v1` | AuthorizationReview | PHI_OPERATIONAL | source | yes | yes |
| `DOCUMENTATION_GAP_RECORDED.v1` | DocumentationGap | PHI_OPERATIONAL | source | yes | yes |
| `DOCUMENTATION_GAP_STATUS_CHANGED.v1` | DocumentationGap | PHI_OPERATIONAL | source | yes | yes |
| `UR_ASSIGNMENT_CHANGED.v1` | Episode | PHI_OPERATIONAL | source | no | yes |
| `EPISODE_DAY_AUTHORIZATION_STATE_DERIVED.v1` | EpisodeDay | PSEUDONYMIZED | derived | yes | yes |
| `DATA_QUALITY_ISSUE_RAISED.v1` | DataQualityIssue | PHI_OPERATIONAL | derived/review | no | yes |
| `DATA_QUALITY_ISSUE_RESOLVED.v1` | DataQualityIssue | PHI_OPERATIONAL | source/review | no | yes |
| `METRIC_SNAPSHOT_CALCULATED.v1` | MetricSnapshot | DEIDENTIFIED_AGGREGATE | derived | no | yes |
| `DISCHARGE_RECORDED.v1` | Episode | PHI_OPERATIONAL | source | yes later | later |
| `EPISODE_PROGRAM_TRANSFER_RECORDED.v1` | Episode | PHI_OPERATIONAL | source | yes later | later |
| `CENSUS_STATUS_RECORDED.v1` | EpisodeDay/Operations | PHI_OPERATIONAL | source | yes later | later |
| `EXPORT_GENERATED.v1` | ExportRun | DEIDENTIFIED_AGGREGATE | derived | no | later |
| `EXPORT_ATTESTED.v1` | ExportRun | DEIDENTIFIED_AGGREGATE | source | no | later |
| `EXPORT_ACKNOWLEDGED.v1` | ExportRun | DEIDENTIFIED_AGGREGATE | source | no | later |

## Shared TypeScript helpers

> Proposed and unverified.

```ts
type DateOnly = string; // validated YYYY-MM-DD
type Uuid = string;

interface DateRange {
  startDate: DateOnly;
  endDate: DateOnly; // inclusive
}

interface SourceReference {
  type: string;
  id: string;
  version: string | null;
  hash: string | null;
}
```

## 1. `CASE_ADMISSION_HANDOFF_COMPLETED.v1`

### Owner and purpose

Case and Access records that the case's admission handoff has been completed. It does not create the episode's authoritative admission fact; it references the episode event created atomically.

### Aggregate/subject

- aggregate: `CASE`;
- subject: case and episode IDs;
- classification: `PHI_OPERATIONAL`;
- metric eligibility: `EXCLUDED_POLICY`.

### Payload

```ts
interface CaseAdmissionHandoffCompletedV1 {
  caseId: Uuid;
  episodeId: Uuid;
  acceptedFacilityResponseId: Uuid;
  admissionEventId: Uuid;
  sourcePacketVersionId: Uuid | null;
  sourceCustodyEventId: Uuid | null;
  resultingCaseVersion: number;
}
```

### Invariants

- same organization as episode;
- accepted response belongs to case;
- event is atomically paired/correlated with `ADMISSION_RECORDED.v1`;
- no patient demographics or document text.

## 2. `EPISODE_CREATED.v1`

### Purpose

Records creation of the post-admission aggregate.

```ts
interface EpisodeCreatedV1 {
  episodeId: Uuid;
  sourceCaseId: Uuid;
  relationship: "ADMISSION_SOURCE";
  facilityId: Uuid;
  programId: Uuid;
  unitId: Uuid | null;
  facilityTimezone: string;
  status: "ACTIVE";
  resultingEpisodeVersion: number;
}
```

Metric eligibility is excluded; admission counts use `ADMISSION_RECORDED`.

## 3. `ADMISSION_RECORDED.v1`

### Purpose

Canonical source fact that an authorized human/system recorded admission.

```ts
interface AdmissionRecordedV1 {
  episodeId: Uuid;
  sourceCaseId: Uuid;
  admissionRecordId: Uuid;
  acceptedFacilityResponseId: Uuid;
  facilityId: Uuid;
  programId: Uuid;
  unitId: Uuid | null;
  facilityTimezone: string;
  admittedAt: string;
  serviceDate: DateOnly;
  sourcePacketVersionId: Uuid | null;
  sourceCustodyEventId: Uuid | null;
  attestationCode: "AUTHORIZED_ADMISSION_RECORDED";
}
```

### Metric use

- admission count later;
- opens episode-day materialization;
- no conclusion about appropriateness or legal/clinical acceptance.

### Correction

A correction may replace admission time/destination only through an approved episode correction command. It must identify affected episode-day range and recomputation.

## 4. `EPISODE_DAY_OPENED.v1`

### Purpose

Records the server-derived existence of a facility-local service date for an active episode.

```ts
interface EpisodeDayOpenedV1 {
  episodeDayId: Uuid;
  episodeId: Uuid;
  serviceDate: DateOnly;
  patientDay: boolean;
  facilityId: Uuid;
  programId: Uuid;
  unitId: Uuid | null;
  facilityTimezone: string;
  generationReason: "ADMISSION" | "DAILY_ROLLOVER" | "BACKFILL";
  sourceAdmissionEventId: Uuid;
  derivationVersion: string;
}
```

### Invariants

- no browser command directly creates this event;
- service date is derived with approved facility timezone;
- idempotent per active episode/service date/projection version;
- `BACKFILL` requires a recorded run and authorization.

## 5. `EPISODE_DAY_CORRECTED.v1`

### Purpose

Corrects a source service-day fact or its placement/program context. The original remains immutable.

```ts
interface EpisodeDayCorrectedV1 {
  episodeDayId: Uuid;
  episodeId: Uuid;
  serviceDate: DateOnly;
  replacement: {
    patientDay: boolean;
    facilityId: Uuid;
    programId: Uuid;
    unitId: Uuid | null;
  };
  reasonCode:
    | "ADMISSION_TIME_CORRECTED"
    | "DISCHARGE_TIME_CORRECTED"
    | "PROGRAM_TRANSFER_CORRECTED"
    | "SOURCE_RECONCILIATION";
}
```

Envelope correction kind must be `CORRECTION`.

## 6. `EPISODE_AUTHORIZATION_OPENED.v1`

### Purpose

Creates a post-admission authorization lifecycle linked to an episode and, where applicable, pre-admission readiness.

```ts
interface EpisodeAuthorizationOpenedV1 {
  episodeAuthorizationId: Uuid;
  episodeId: Uuid;
  sourceCoverageId: Uuid | null;
  sourcePreAdmissionAuthorizationId: Uuid | null;
  levelOfCare: string;
  requirement: "REQUIRED" | "NOT_REQUIRED" | "UNKNOWN";
  effectiveStartDate: DateOnly;
  status: "OPEN";
}
```

### Invariants

- source references belong to the same organization/case;
- does not submit or decide authorization;
- `UNKNOWN` requires review and is not metric eligible until resolved according to policy.

## 7. `AUTHORIZATION_REVIEW_RECORDED.v1`

### Purpose

Records a human-performed initial/concurrent/other review interaction.

```ts
interface AuthorizationReviewRecordedV1 {
  authorizationReviewId: Uuid;
  episodeAuthorizationId: Uuid;
  episodeId: Uuid;
  reviewType:
    | "INITIAL"
    | "CONCURRENT"
    | "RETROSPECTIVE"
    | "PEER_TO_PEER"
    | "APPEAL";
  requestedRange: DateRange;
  dueAt: string | null;
  decisionStatus:
    | "PENDING"
    | "APPROVED"
    | "DENIED"
    | "WITHDRAWN"
    | "UNKNOWN";
  payerReferenceToken: string | null;
  sourceMethod: "PHONE" | "PORTAL_VIEWED_BY_HUMAN" | "FAX" | "SECURE_MESSAGE" | "DOCUMENT" | "OTHER_CONTROLLED";
  resultingReviewVersion: number;
}
```

### Payload exclusions

- no member/group/policy numbers;
- no representative name in analytics payload;
- no unrestricted call narrative;
- no proprietary criteria.

## 8. `AUTHORIZATION_REVIEW_CORRECTED.v1`

### Purpose

Replaces one active review event.

```ts
interface AuthorizationReviewCorrectedV1 {
  authorizationReviewId: Uuid;
  episodeAuthorizationId: Uuid;
  episodeId: Uuid;
  replacement: AuthorizationReviewRecordedV1;
  reasonCode:
    | "PAYER_DATE_RANGE_CORRECTED"
    | "PAYER_OUTCOME_CORRECTED"
    | "DUPLICATE_REVIEW"
    | "SOURCE_RECONCILIATION"
    | "DATA_ENTRY_ERROR";
}
```

Envelope correction fields are required. The active projection ignores the superseded review payload after correction is accepted.

## 9. `AUTHORIZATION_DAY_DECISION_RECORDED.v1`

### Purpose

Records one explicit inclusive date range and payer/reviewer-reported outcome.

```ts
interface AuthorizationDayDecisionRecordedV1 {
  authorizationDayDecisionId: Uuid;
  authorizationReviewId: Uuid;
  episodeAuthorizationId: Uuid;
  episodeId: Uuid;
  decisionRange: DateRange;
  outcome: "APPROVED" | "DENIED" | "PENDING";
  denialReasonCode:
    | "MISSING_AUTHORIZATION"
    | "LATE_REVIEW"
    | "DOCUMENTATION_GAP"
    | "LEVEL_OF_CARE_NOT_SUPPORTED"
    | "ELIGIBILITY_OR_COVERAGE"
    | "OTHER_CONTROLLED"
    | null;
  sourceReviewEventId: Uuid;
}
```

### Rules

- denial reason required for `DENIED`;
- denial reason null for approved/pending;
- overlapping contradictory active ranges produce quality issue; V1 does not guess;
- numeric approved/denied totals are derived, not source fields.

## 10. `DOCUMENTATION_GAP_RECORDED.v1`

```ts
interface DocumentationGapRecordedV1 {
  documentationGapId: Uuid;
  episodeId: Uuid;
  sourceAuthorizationReviewId: Uuid | null;
  categoryCode:
    | "MISSING_PROGRESS_NOTE"
    | "MISSING_PHYSICIAN_ORDER"
    | "MISSING_TREATMENT_PLAN"
    | "MISSING_RISK_UPDATE"
    | "MISSING_DISCHARGE_PLAN"
    | "MISSING_SIGNATURE_OR_ATTESTATION"
    | "INCONSISTENT_LEVEL_OF_CARE_SUPPORT"
    | "PAYER_REQUESTED_CLARIFICATION"
    | "OTHER_CONTROLLED";
  status: "OPEN";
  dueAt: string | null;
  assignedRole: string | null;
  assignedUserId: string | null;
  hasOperationalSummary: boolean;
}
```

The event does not include the summary text. The operational entity may hold approved minimum text in the PHI zone.

## 11. `DOCUMENTATION_GAP_STATUS_CHANGED.v1`

```ts
interface DocumentationGapStatusChangedV1 {
  documentationGapId: Uuid;
  episodeId: Uuid;
  previousStatus:
    | "OPEN" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED"
    | "DISPUTED" | "REOPENED" | "CANCELLED";
  newStatus:
    | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED"
    | "DISPUTED" | "REOPENED" | "CANCELLED";
  resolutionCode:
    | "DOCUMENT_COMPLETED"
    | "SOURCE_VERIFIED"
    | "NOT_APPLICABLE"
    | "DUPLICATE"
    | "DISPUTED_BY_OWNER"
    | "OTHER_CONTROLLED"
    | null;
  sourceDocumentId: Uuid | null;
  resultingGapVersion: number;
}
```

## 12. `UR_ASSIGNMENT_CHANGED.v1`

```ts
interface UrAssignmentChangedV1 {
  episodeId: Uuid;
  previousAssignedUserId: Uuid | null;
  assignedUserId: Uuid | null;
  assignedRole: string | null;
  reasonCode: "SHIFT_ASSIGNMENT" | "PROGRAM_ASSIGNMENT" | "MANAGER_REASSIGNMENT" | "UNASSIGNED";
  resultingAssignmentVersion: number;
}
```

Assignment affects ownership/display, not the coverage outcome or priority score.

## 13. `EPISODE_DAY_AUTHORIZATION_STATE_DERIVED.v1`

### Purpose

Records projection evidence for the active episode-day authorization state. Operational source facts remain the authorization/review/day-decision events.

```ts
interface EpisodeDayAuthorizationStateDerivedV1 {
  episodeDayId: Uuid;
  episodeId: Uuid;
  serviceDate: DateOnly;
  coverageStatus:
    | "NOT_REQUIRED"
    | "APPROVED"
    | "DENIED"
    | "PENDING"
    | "EXPIRED"
    | "UNREQUESTED"
    | "UNKNOWN";
  riskCodes: Array<
    | "REVIEW_DUE_SOON"
    | "REVIEW_OVERDUE"
    | "AUTH_EXPIRES_SOON"
    | "AUTH_EXPIRED"
    | "DOCUMENTATION_GAP"
    | "SOURCE_DISAGREEMENT"
    | "DATA_INCOMPLETE"
  >;
  approvedThroughDate: DateOnly | null;
  nextReviewDueAt: string | null;
  openDocumentationGapCount: number;
  activeSourceEventIds: Uuid[];
  activeSourceChainHash: string;
  derivationVersion: string;
  calculatedAt: string;
}
```

### Rules

- risk codes unique and sorted by canonical order;
- event is reproducible from active source events/config version;
- `at risk` is derived from risk codes, not this event's coverage status;
- downstream mart drops source event IDs and retains lineage hash/sequence.

## 14. Data-quality events

### `DATA_QUALITY_ISSUE_RAISED.v1`

```ts
interface DataQualityIssueRaisedV1 {
  dataQualityIssueId: Uuid;
  affectedAggregateType: string;
  affectedAggregateId: Uuid;
  issueCode: string;
  severity: "WARNING" | "ERROR";
  status: "OPEN";
  affectedEventIds: Uuid[];
  blocksMetricEligibility: boolean;
  reviewRole: string | null;
}
```

### `DATA_QUALITY_ISSUE_RESOLVED.v1`

```ts
interface DataQualityIssueResolvedV1 {
  dataQualityIssueId: Uuid;
  status: "RESOLVED" | "ACCEPTED_WITH_WARNING" | "REJECTED_SOURCE";
  resolutionCode: string;
  correctionEventId: Uuid | null;
}
```

The resolution text, if any, remains restricted operational data.

## 15. `METRIC_SNAPSHOT_CALCULATED.v1`

```ts
interface MetricSnapshotCalculatedV1 {
  metricSnapshotId: Uuid;
  metricKey: string;
  definitionVersion: string;
  scope: {
    organizationId: Uuid;
    facilityId: Uuid | null;
    programId: Uuid | null;
    unitId: Uuid | null;
  };
  periodStart: DateOnly;
  periodEnd: DateOnly;
  grain: string;
  status:
    | "CALCULATED"
    | "NO_MEASUREMENTS_FOUND"
    | "INSUFFICIENT_DENOMINATOR"
    | "SUPPRESSED"
    | "PENDING_REVIEW";
  value: number | null;
  numeratorValue: number | null;
  denominatorValue: number | null;
  sourceWatermark: string | null;
  sourceFactCount: number;
  qualityState: string;
  suppressionPolicyVersion: string | null;
  recomputeRunId: Uuid;
}
```

Classification is `DEIDENTIFIED_AGGREGATE`. This event does not contain row-level tokens.

## Later lifecycle events

### `DISCHARGE_RECORDED.v1`

Requires a future discharge command, source, disposition mapping, continuity/review policy, and clinical/legal review where applicable. It is not implemented by the initial slice.

### `EPISODE_PROGRAM_TRANSFER_RECORDED.v1`

Records facility/program/unit change with effective time and source; recalculates service-day scope.

### `CENSUS_STATUS_RECORDED.v1`

Supports hospital operations/bedboard later. It must not be inferred from the legacy workbook.

### Export events

`EXPORT_GENERATED`, `EXPORT_ATTESTED`, `EXPORT_SUBMITTED`, `EXPORT_ACKNOWLEDGED`, `EXPORT_REJECTED`, and `EXPORT_CORRECTED` require an approved reporting/jurisdiction contract and are disabled.

## Event version compatibility

### Compatible change

- add optional field with defined default/absence semantics;
- expand non-breaking documentation;
- add a new event type.

### Incompatible change

- change field meaning/type;
- make optional field required;
- change enum semantics;
- change date range from inclusive to exclusive;
- change metric eligibility or correction behavior.

Incompatible changes increment the event type version and schema version. Projectors declare supported versions.

## Event ordering

- total event sequence is useful for delivery/watermarks;
- business order uses effective time plus active correction chain;
- aggregate version prevents concurrent source mutations;
- source events can arrive out of effective-time order;
- projectors must not assume recorded order equals clinical/operational order.

## Event retention and access

Retention is unknown. Runtime application roles cannot update/delete. Provenance queries apply field-level redaction and tenant/scope authorization.
