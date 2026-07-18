# API and Service Contracts

## Boundary rules

- The browser uses only authenticated API routes.
- The API authenticates, validates transport input, maps errors, and delegates.
- Domain authorization and business rules remain in services/policies.
- Operational commands never accept caller-supplied organization, actor, role, event classification, or metric value.
- Analytics ingestion is private/internal.
- Operational work-queue and aggregate metric queries use separate contracts.
- All code below is **Proposed and unverified**.

The complete OpenAPI-style contract is in `contracts/api-contracts.yaml`.

## Route map

### Commands

| Method | Route | Capability | Result |
|---|---|---|---|
| `POST` | `/api/v1/cases/{caseKey}/admission-handoffs` | `episode.admissionHandoff.create` | episode/admission created |
| `POST` | `/api/v1/episodes/{episodeId}/authorizations` | `ur.authorization.open` | post-admission authorization opened |
| `POST` | `/api/v1/episode-authorizations/{authorizationId}/reviews` | `ur.review.record` | review and optional day decisions recorded |
| `POST` | `/api/v1/authorization-reviews/{reviewId}/corrections` | `ur.review.correct` | correction event appended |
| `POST` | `/api/v1/episodes/{episodeId}/documentation-gaps` | `ur.gap.record` | gap recorded |
| `POST` | `/api/v1/documentation-gaps/{gapId}/acknowledgements` | `ur.gap.manage` | gap acknowledged |
| `POST` | `/api/v1/documentation-gaps/{gapId}/resolutions` | `ur.gap.manage` | gap resolved/disputed/reopened |
| `POST` | `/api/v1/episodes/{episodeId}/ur-assignments` | `ur.assignment.manage` | assignment changed |

### Queries

| Method | Route | Capability | Data class |
|---|---|---|---|
| `GET` | `/api/v1/episodes/{episodeId}` | `episode.readOperational` | operational PHI |
| `GET` | `/api/v1/episodes/{episodeId}/utilization-review` | `episode.readOperational` + UR read | operational PHI |
| `GET` | `/api/v1/ur/work-queue` | `ur.queue.read` | minimum-necessary operational |
| `GET` | `/api/v1/analytics/authorization-risk` | `analytics.authorizationRisk.read` | aggregate/de-identified |
| `GET` | `/api/v1/audit/events/{eventId}/provenance` | `audit.provenance.read` | scoped provenance |
| `GET` | `/api/v1/analytics/metric-definitions/{metricKey}` | analytics read | non-PHI definition metadata |

No direct `POST /events`, `POST /metrics`, or `PATCH /queue-items` public route exists.

## Common headers

### Mutating requests

- `Authorization: Bearer …`
- `Content-Type: application/json`
- `Idempotency-Key: <opaque 8–128 character key>`
- `X-Correlation-Id: <optional approved identifier>`

The server returns `X-Request-Id` and the canonical correlation ID.

### Query requests

- `Authorization`
- optional `If-None-Match` for projection/metric ETag
- no organization header

## Error shape

```ts
export interface ApiError {
  error: {
    code:
      | "AUTHENTICATION_REQUIRED"
      | "PERMISSION_DENIED"
      | "RESOURCE_NOT_FOUND"
      | "SCOPE_NOT_ALLOWED"
      | "VALIDATION_FAILED"
      | "CONCURRENCY_CONFLICT"
      | "IDEMPOTENCY_KEY_REUSED"
      | "ADMISSION_HANDOFF_NOT_READY"
      | "SOURCE_DISAGREEMENT"
      | "DATA_QUALITY_REVIEW_REQUIRED"
      | "PROJECTION_NOT_READY"
      | "METRIC_DEFINITION_NOT_APPROVED"
      | "INTERNAL_ERROR";
    message: string;
    requestId: string;
    correlationId: string;
    retryable: boolean;
    fieldErrors?: Array<{
      path: string;
      code: string;
      message: string;
    }>;
  };
}
```

Messages are non-revealing and contain no PHI or source text.

## Admission handoff contract

### Request

```http
POST /api/v1/cases/CASE-SYN-1001/admission-handoffs
Idempotency-Key: handoff-syn-1001-v1
Content-Type: application/json
```

```json
{
  "expectedCaseVersion": 7,
  "acceptedFacilityResponseId": "11111111-1111-4111-8111-111111111111",
  "facilityId": "22222222-2222-4222-8222-222222222222",
  "programId": "33333333-3333-4333-8333-333333333333",
  "unitId": "44444444-4444-4444-8444-444444444444",
  "admittedAt": "2026-07-18T20:15:00-05:00",
  "sourcePacketVersionId": "55555555-5555-4555-8555-555555555555",
  "sourceCustodyEventId": "66666666-6666-4666-8666-666666666666",
  "attestation": {
    "statement": "I am recording an admission authorized by the receiving facility.",
    "method": "FACILITY_WORKFLOW"
  }
}
```

### Response `201`

```json
{
  "data": {
    "episodeId": "77777777-7777-4777-8777-777777777777",
    "sourceCaseId": "88888888-8888-4888-8888-888888888888",
    "status": "ACTIVE",
    "admittedAt": "2026-07-18T20:15:00-05:00",
    "serviceDate": "2026-07-18",
    "episodeVersion": 1,
    "governedEventId": "99999999-9999-4999-8999-999999999999"
  },
  "meta": {
    "requestId": "req_...",
    "correlationId": "corr_...",
    "idempotentReplay": false
  }
}
```

## Open episode authorization

```json
{
  "expectedEpisodeVersion": 1,
  "sourceCoverageId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "sourcePreAdmissionAuthorizationId": null,
  "levelOfCare": "INPATIENT_PSYCHIATRIC",
  "requirement": "REQUIRED",
  "effectiveStartDate": "2026-07-18",
  "attestation": {
    "method": "HUMAN_VERIFICATION",
    "sourceReferenceToken": "PAYER-REF-SYNTHETIC"
  }
}
```

The server verifies that the coverage/source authorization belongs to the same organization and case/episode. It does not accept payer member identifiers in this contract.

## Record authorization review

```json
{
  "expectedAuthorizationVersion": 2,
  "reviewType": "CONCURRENT",
  "requestedStartDate": "2026-07-19",
  "requestedEndDate": "2026-07-21",
  "dueAt": "2026-07-19T15:00:00-05:00",
  "decisionStatus": "PENDING",
  "payerReferenceToken": "SYN-REVIEW-42",
  "source": {
    "method": "PHONE",
    "effectiveAt": "2026-07-18T14:20:00-05:00"
  },
  "dayDecisions": [
    {
      "startDate": "2026-07-19",
      "endDate": "2026-07-21",
      "outcome": "PENDING",
      "denialReasonCode": null
    }
  ],
  "documentationGaps": [
    {
      "categoryCode": "MISSING_PROGRESS_NOTE",
      "dueAt": "2026-07-19T12:00:00-05:00",
      "operationalSummary": null
    }
  ]
}
```

### Validation

- date ranges are inclusive and start ≤ end;
- day decisions fall within the requested range unless a correction reason permits otherwise;
- overlapping conflicting outcomes are rejected or quarantined;
- denial reason is required for denied ranges;
- unrestricted unknown fields are rejected;
- the client cannot provide actor, organization, event ID, metric eligibility, or queue priority.

## Correct authorization review

A correction targets an event, not just a mutable row:

```json
{
  "expectedReviewVersion": 3,
  "supersedesEventId": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  "reasonCode": "PAYER_DATE_RANGE_CORRECTED",
  "reason": "Synthetic correction; approved-through date was recorded one day short.",
  "replacement": {
    "decisionStatus": "APPROVED",
    "dayDecisions": [
      {
        "startDate": "2026-07-19",
        "endDate": "2026-07-22",
        "outcome": "APPROVED",
        "denialReasonCode": null
      }
    ]
  }
}
```

The reason field is PHI operational data and is excluded from analytics/logs.

## Documentation-gap commands

### Record

```json
{
  "expectedEpisodeVersion": 4,
  "sourceAuthorizationReviewId": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  "categoryCode": "MISSING_PHYSICIAN_ORDER",
  "dueAt": "2026-07-19T10:00:00-05:00",
  "assignedRole": "CLINICIAN_REVIEWER",
  "assignedUserId": null,
  "operationalSummary": null
}
```

### Resolve/dispute/reopen

```json
{
  "expectedGapVersion": 2,
  "action": "RESOLVE",
  "resolutionCode": "DOCUMENT_COMPLETED",
  "sourceDocumentId": "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  "attestation": "I verified the required document is complete."
}
```

Allowed actions are policy/state-machine controlled; the route is not a generic patch.

## UR assignment

```json
{
  "expectedAssignmentVersion": 1,
  "assignedUserId": "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  "reasonCode": "SHIFT_ASSIGNMENT"
}
```

The queue priority and reason codes are not client-settable.

## UR work-queue query

```http
GET /api/v1/ur/work-queue?facilityId=...&programId=...&status=OPEN&dueBefore=2026-07-20T00:00:00-05:00&pageSize=50&cursor=...
```

### Response

```ts
interface UrWorkQueueResponse {
  data: Array<{
    itemId: string;
    episodeId: string;
    patientDisplay: {
      mode: "TOKEN" | "OPERATIONAL_LABEL";
      value: string;
    };
    facilityId: string;
    programId: string;
    unitId: string | null;
    payerDisplay: string | null;
    coverageStatus: EpisodeDayCoverageStatus;
    riskCodes: EpisodeDayRiskCode[];
    approvedThroughDate: string | null;
    nextReviewDueAt: string | null;
    daysAtRisk: number;
    openDocumentationGapCount: number;
    topGapCategories: string[];
    assignedUserId: string | null;
    priorityBand: "CRITICAL" | "HIGH" | "NORMAL" | "REVIEW";
    reasonCodes: string[];
    sourceWatermark: string;
    calculatedAt: string;
    version: number;
  }>;
  page: {
    nextCursor: string | null;
    pageSize: number;
  };
  meta: OperationalQueryMeta;
}
```

### Pagination

Cursor is opaque and encodes the stable server sort:

```text
priorityBand DESC
overdue DESC
dueAt ASC NULLS LAST
oldestIssueAt ASC
episodeId ASC
```

Cursor versioning is server-owned. Invalid/expired cursor returns `400 VALIDATION_FAILED`.

## Authorization-risk aggregate query

```http
GET /api/v1/analytics/authorization-risk?facilityId=...&programId=...&periodStart=2026-07-01&periodEnd=2026-07-31&grain=DAY
```

### Response metadata

```ts
interface AnalyticsQueryMeta {
  generatedAt: string;
  sourceWatermark: string | null;
  freshness: {
    state: "FRESH" | "STALE" | "UNKNOWN";
    maximumLagSeconds: number | null;
    staleAfterSeconds: number;
  };
  coverage: {
    state: "COMPLETE" | "PARTIAL" | "UNKNOWN" | "NO_DATA";
    includedSources: string[];
    missingSources: string[];
  };
  metricDefinitions: Array<{
    metricKey: string;
    version: string;
    status: "APPROVED" | "DRAFT";
  }>;
  quality: {
    state: "VALID" | "VALID_WITH_WARNINGS" | "PENDING_REVIEW";
    issueCodes: string[];
  };
  suppression: {
    applied: boolean;
    policyVersion: string | null;
    reason: string | null;
  };
  correction: {
    includesRecomputedHistory: boolean;
    latestRecomputeRunId: string | null;
  };
}
```

### No data response

HTTP `200`, not `404`:

```json
{
  "data": {
    "status": "NO_MEASUREMENTS_FOUND",
    "series": [],
    "summary": {
      "approvedPatientDays": null,
      "deniedPatientDays": null,
      "pendingPatientDays": null,
      "expiredPatientDays": null,
      "atRiskPatientDays": null,
      "openDocumentationGaps": null,
      "concurrentReviewsDue": null
    }
  },
  "meta": {
    "generatedAt": "2026-07-18T21:00:00Z",
    "sourceWatermark": null,
    "freshness": {
      "state": "UNKNOWN",
      "maximumLagSeconds": null,
      "staleAfterSeconds": 900
    },
    "coverage": {
      "state": "NO_DATA",
      "includedSources": [],
      "missingSources": []
    },
    "metricDefinitions": [],
    "quality": {
      "state": "VALID",
      "issueCodes": []
    },
    "suppression": {
      "applied": false,
      "policyVersion": null,
      "reason": null
    },
    "correction": {
      "includesRecomputedHistory": false,
      "latestRecomputeRunId": null
    }
  }
}
```

## Provenance query

The provenance route returns only events/fields the principal may see.

```ts
interface ProvenanceResponse {
  data: {
    eventId: string;
    eventType: string;
    schemaVersion: string;
    aggregateType: string;
    aggregateId: string;
    effectiveAt: string;
    recordedAt: string;
    actorDisplay: string;
    sourceSystem: string;
    sourceEventId: string | null;
    qualityState: DataQualityState;
    reviewState: string;
    metricEligibility: string;
    correctionChain: Array<{
      eventId: string;
      kind: "ORIGINAL" | "CORRECTION" | "REVERSAL";
      supersedesEventId: string | null;
      recordedAt: string;
      reasonCode: string | null;
    }>;
    payloadSummary: Record<string, unknown>;
  };
  meta: {
    redactedFields: string[];
  };
}
```

No unrestricted raw source payload is returned.

## Service interfaces

```ts
export interface EpisodeCommandService {
  recordAdmissionHandoff(
    actor: Actor,
    command: RecordAdmissionHandoffCommand,
  ): Promise<RecordAdmissionHandoffResult>;
}

export interface UtilizationReviewCommandService {
  openEpisodeAuthorization(
    actor: Actor,
    command: OpenEpisodeAuthorizationCommand,
  ): Promise<OpenEpisodeAuthorizationResult>;

  recordAuthorizationReview(
    actor: Actor,
    command: RecordAuthorizationReviewCommand,
  ): Promise<RecordAuthorizationReviewResult>;

  correctAuthorizationReview(
    actor: Actor,
    command: CorrectAuthorizationReviewCommand,
  ): Promise<CorrectAuthorizationReviewResult>;

  recordDocumentationGap(
    actor: Actor,
    command: RecordDocumentationGapCommand,
  ): Promise<RecordDocumentationGapResult>;

  transitionDocumentationGap(
    actor: Actor,
    command: TransitionDocumentationGapCommand,
  ): Promise<TransitionDocumentationGapResult>;

  assignUrOwner(
    actor: Actor,
    command: AssignUrOwnerCommand,
  ): Promise<AssignUrOwnerResult>;
}
```

```ts
export interface UrQueryService {
  getWorkQueue(
    principal: VerifiedPrincipal,
    query: UrWorkQueueQuery,
  ): Promise<UrWorkQueueResponse>;

  getEpisodeUrDetail(
    principal: VerifiedPrincipal,
    episodeId: string,
  ): Promise<EpisodeUrDetail>;
}

export interface AnalyticsQueryService {
  getAuthorizationRisk(
    principal: VerifiedPrincipal,
    query: AuthorizationRiskQuery,
  ): Promise<AuthorizationRiskResponse>;
}
```

## Transaction contract

A successful command transaction writes:

1. aggregate state;
2. version increment;
3. append-only audit event;
4. governed event;
5. event delivery;
6. idempotency result.

Any failure rolls back all six. Object storage is not required in this slice.

## Idempotency

### Command key scope

Unique by:

```text
organizationId + actorId (or sourceId) + commandType + idempotencyKey
```

Stored request hash prevents key reuse with different input.

### Event source uniqueness

External events are unique by:

```text
sourceSystem + sourceTenantKey + sourceEventId + sourceEventVersion
```

Native governed event IDs are created inside the command transaction.

## Optimistic concurrency

- commands include `expectedVersion`;
- repository update predicate includes organization, entity ID, and expected version;
- zero updated rows → non-revealing not-found or concurrency conflict after safe scoped check;
- corrections also require the expected active event/review version;
- projectors use event/process uniqueness rather than user-facing version.

## Freshness and staleness

- operational queue response carries `sourceWatermark` and `calculatedAt`;
- aggregate response carries event watermark, calculation time, expected source coverage, and stale policy;
- stale does not mean incorrect; the UI explains the lag;
- `PROJECTION_NOT_READY` is used only when the read model cannot safely serve any result;
- otherwise return data with `STALE`/`PARTIAL` metadata.

## HTTP status mapping

| Condition | Status |
|---|---:|
| created command | 201 |
| successful transition/query | 200 |
| no measurements | 200 |
| malformed/unknown fields | 400 |
| no/invalid session | 401 |
| in-scope role/capability denied | 403 |
| cross-tenant or absent object | 404 |
| concurrency/idempotency conflict | 409 |
| valid shape but unmet domain requirement | 422 |
| rate limit | 429 |
| retryable dependency failure | 503 |
| unexpected error | 500 |

## Caching

- operational PHI endpoints: private/no-store unless approved otherwise;
- aggregate endpoint: private, short-lived ETag/cache keyed by principal scope and query;
- no shared CDN caching of authenticated PHI/tenant analytics;
- correction/recompute updates ETag/version.

## Internal worker contracts

```ts
export interface GovernedEventProjector {
  readonly name: string;
  readonly version: string;
  supports(event: GovernedEventEnvelope): boolean;
  project(
    event: GovernedEventEnvelope,
    tx: ProjectionTransaction,
  ): Promise<ProjectionResult>;
}

export interface MetricCalculator {
  readonly metricKey: string;
  readonly definitionVersion: string;
  calculate(
    scope: MetricScope,
    period: MetricPeriod,
    facts: MetricFactReader,
  ): Promise<MetricCalculation>;
}
```

Projectors and calculators are deterministic for the same active event set, definition version, scope, and period.
