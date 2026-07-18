# Utilization-Review Work Queue Specification

**Status:** Proposed and unverified. The queue is a server-owned operational projection, not a client-maintained task list and not an autonomous authorization decision engine.

## 1. User and decision

Primary users: UR specialist and UR manager. Authorized clinician/HIM contributors enter through linked documentation-gap views rather than receiving the full queue by default.

The queue supports one decision:

> Which already-identified episode authorization review, day exposure, documentation gap, source disagreement, or correction requires authorized human follow-up next?

It does not decide medical necessity, payer approval, admission, discharge, legal status, or placement.

## 2. Projection ownership

```text
operational commands/events
  -> UR projector validates supported event version
  -> deterministic risk/status rules
  -> UrQueueItemProjection upsert
  -> API applies actor capability and scope
  -> browser renders and invokes controlled commands
```

The browser cannot set `priorityScore`, `priorityTier`, `serverSortKey`, risk codes, source watermark, or projection version. User actions may claim/reassign/snooze/resolve through named commands; the server recomputes the item.

## 3. Queue item contract

```ts
// Proposed and unverified.
interface UrQueueItem {
  queueItemId: string;
  version: number;
  episode: {
    episodeId: string;
    displayToken: string;
    admittedAt: string;
    facilityId: string;
    programId: string | null;
    unitId: string | null;
  };
  episodeDay: {
    episodeDayId: string;
    serviceDate: string;
    dayOrdinal: number;
  } | null;
  authorization: {
    authorizationId: string | null;
    coverageStatus:
      | "APPROVED"
      | "DENIED"
      | "PENDING"
      | "EXPIRED"
      | "UNREQUESTED"
      | "NOT_REQUIRED"
      | "UNKNOWN";
    approvedThroughDate: string | null;
    nextReviewDueAt: string | null;
    payerDisplay: string | null;
  };
  reasonCodes: Array<
    | "AUTHORIZATION_PENDING"
    | "AUTHORIZATION_EXPIRED"
    | "AUTHORIZATION_EXPIRING"
    | "DENIED_DAY"
    | "DOCUMENTATION_GAP"
    | "REVIEW_DUE"
    | "REVIEW_OVERDUE"
    | "SOURCE_DISAGREEMENT"
    | "DATA_QUALITY_REVIEW"
    | "CORRECTION_REVIEW"
  >;
  riskCodes: string[];
  documentation: {
    openGapCount: number;
    highestSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
    nextDueAt: string | null;
  };
  assignment: {
    assignedToActorId: string | null;
    assignedToDisplay: string | null;
    status: "OPEN" | "CLAIMED" | "SNOOZED" | "RESOLVED" | "VOIDED";
    snoozedUntil: string | null;
  };
  priority: {
    tier: number;
    score: number;
    explanationCodes: string[];
  };
  quality: {
    status: "VALID" | "VALID_WITH_WARNINGS" | "PENDING_REVIEW" | "QUARANTINED";
    issueCodes: string[];
    corrected: boolean;
    lateArriving: boolean;
  };
  freshness: {
    sourceWatermark: string;
    projectedAt: string;
    staleAfter: string;
    state: "FRESH" | "STALE" | "UNKNOWN";
  };
  allowedActions: string[];
}
```

The API may omit fields the actor is not permitted to see. `allowedActions` is advisory for rendering; command authorization is repeated server-side.

## 4. Deterministic ordering

Default server ordering is stable and documented:

1. unresolved `DENIED_DAY` or critical source disagreement;
2. overdue review or expired authorization;
3. due within the approved operational window;
4. high/critical documentation gap due;
5. pending/expiring risk;
6. data-quality/correction review;
7. oldest `agingStartedAt`;
8. stable queue item ID tie-breaker.

Exact scoring weights and due windows are **Needs decision**. Until approved, the implementation should use ordered categorical tiers with explainable reason codes rather than an opaque model. The client may request an approved alternate sort such as due time or admission date, but it cannot submit a score.

`at risk` overlaps a coverage status. An approved day may still be at risk because the next review is overdue; `at risk` must never replace the coverage outcome.

## 5. Page hierarchy

### Header

- `Utilization Review` / `My UR Work` title;
- current authorized scope;
- `Updated <time>` and freshness state;
- source coverage/data-quality banner;
- compact disclaimer that the queue supports human review;
- refresh action.

### Summary strip

Operational counts for the exact filtered queue response:

- open;
- overdue;
- denied-day items;
- expired authorization;
- due today;
- unassigned;
- source/correction review.

These are queue counts, not published outcome metrics. If projection state is incomplete, label counts `Partial` and explain coverage.

### Filter bar

- facility/program/unit within grants;
- `My work`, `Unassigned`, `All permitted`;
- reason code;
- coverage status;
- due window;
- payer category/display where permitted;
- gap category/severity;
- quality/review state;
- corrected/late-arriving;
- text search only over approved display token/reference fields, never global raw PHI.

Filters use controlled values from server metadata. The URL may retain safe filter codes and scope IDs but not patient names, MRN, payer references, or note text.

### Queue table: desktop

| Column | Contents | Behavior |
|---|---|---|
| Priority | tier plus text explanation | not color-only; tooltip/drawer explains reasons |
| Episode | minimum-necessary display token and admitted date | link only with episode-read capability |
| Service day | date and ordinal | facility timezone stated |
| Coverage | approved/denied/pending/expired/not required/unknown | outcome separate from risk chips |
| Risk / reason | up to two chips plus `+n` | full controlled list in detail drawer |
| Review due | due time and overdue duration | server time; timezone shown |
| Documentation | gap count/highest severity/next due | no note text |
| Payer | approved display/category | absent when scope/policy does not allow |
| Owner | assignee/unassigned | manager can reassign if permitted |
| Quality | warning/correction/late state | links to provenance/quality detail if authorized |
| Actions | one primary and overflow | derived from allowed actions and current version |

Pinned columns: priority, episode, due, action. User column preferences may be persisted only as non-PHI settings.

### Mobile cards

Each card keeps:

- episode display token;
- coverage outcome;
- top reason/risk;
- due/overdue time;
- gap count;
- assignment;
- freshness/quality warning;
- primary action.

Secondary details open a full-screen sheet. Do not force horizontal table scrolling.

## 6. Row/detail drawer

The drawer is a query surface, not a copy of every episode field.

1. current authorization status and effective dates;
2. review timeline with effective and recorded times;
3. current day decisions and conflicts;
4. controlled documentation gaps;
5. source/review/attestation metadata;
6. data-quality and correction chain;
7. permitted actions;
8. provenance link.

Sensitive source references may be masked or omitted. Free-text correction narratives never appear in queue list telemetry and require explicit detail permission.

## 7. Actions and command behavior

| Action | Capability | Contract behavior |
|---|---|---|
| Open episode | `episode.readOperational` | fresh server query; route guard repeated |
| Record review | `ur.review.record` | modal/page with expected authorization version and idempotency key |
| Correct review | `ur.review.correct` | exact superseded event/version and reason required |
| Record gap | `ur.gap.manage` | controlled category/source; no note text copy |
| Resolve/respond to gap | gap capability | evidence reference/attestation; expected gap version |
| Claim | queue assignment capability | expected queue/assignment version |
| Reassign | manager assignment capability | reason and target within scope |
| Snooze | approved policy/capability | reason and finite `snoozedUntil`; risk remains visible in audit |
| Refresh | queue read | conditional GET/ETag; does not mutate priority |

While an edit is open, background refresh may update other rows but must not replace or reorder the active row. On submit conflict, present a field-level/current-version comparison and require intentional retry; never last-write-wins.

## 8. API binding

```http
GET /api/v1/ur/work-queue?facilityId=...&programId=...&assignment=ME&reason=REVIEW_OVERDUE&limit=50&cursor=...
```

Response requirements:

- stable opaque cursor;
- `hasNextPage` and `nextCursor`;
- authorized scope echo;
- applied filter echo;
- server sort key/version;
- `asOf`, source watermark, projected time, stale-after;
- completeness/source coverage;
- data-quality counts;
- no total count unless cheaply and correctly computed;
- no unauthorized result count leakage.

Cursor semantics: opaque, scoped, signed or server-validated, and invalidated when sort/profile version changes. A cursor cannot be replayed into another organization/scope.

Recommended cache key includes session subject, capability revision, organization/facility/program/unit, filters, projection version, and cursor. PHI responses are not shared/publicly cached.

## 9. Non-happy-path states

| State | Visible copy | User action |
|---|---|---|
| loading first page | labelled table/card skeleton | none; keep heading/filter controls available |
| refreshing | retain safe rows; `Updating…` | continue reading; editing row remains stable |
| no matches | `No utilization-review work matches this scope and filter.` | clear filters |
| no work in scope | `No utilization-review work is currently open for this scope.` | refresh or change authorized scope |
| projection pending | `Recorded work is still being processed.` | refresh; provenance link if authorized |
| stale projection | `This queue may not include the latest recorded work.` | refresh; view status details |
| partial coverage | `Some configured sources have not reported for this period.` | view source coverage |
| source disagreement | item remains visible with review-required state | open reconciliation/provenance |
| correction pending | show current active fact and correction badge | authorized reviewer opens chain |
| unauthorized scope | `You do not have access to this scope.` | return to authorized landing |
| resource hidden/removed | non-revealing not found | return to queue |
| integration/projector failure | retain last safe result, mark stale, disable actions whose version cannot be verified | retry refresh; support reference |
| command validation error | keep input; field-linked errors | correct and resubmit |
| concurrency conflict | do not overwrite; compare/reload | reload current version |
| idempotent replay | show original success outcome | close/return |
| session expired | purge displayed PHI and cached pages | re-authenticate |

## 10. Loading and privacy behavior

- Never show rows from a previous tenant while a new scope loads.
- Clear drawer and selected row on scope/capability change.
- Avoid PHI in client logs, analytics telemetry, error reporting, page title, URL, or persisted local state.
- Copy-to-clipboard actions are excluded from the initial slice unless explicitly approved and audited.
- Print/export is absent from the initial queue.
- No raw event payload is available from the browser.

## 11. Accessibility

- semantic table with sortable-header announcements;
- keyboard row actions without hover dependency;
- focus moves to drawer heading and returns to originating row;
- live-region announcement for refresh, row movement, save, projection pending, and conflict;
- status/risk/quality use label + icon, never color only;
- due times include date, clock time, and timezone in accessible text;
- mobile card order matches visual/DOM order;
- auto-refresh never steals focus or silently reorders the focused row;
- reduced motion respected.

## 12. Proposed component placement

```text
app/src/workspaces/UtilizationReview.tsx
app/src/features/ur-queue/UrQueuePage.tsx
app/src/features/ur-queue/UrQueueFilters.tsx
app/src/features/ur-queue/UrQueueTable.tsx
app/src/features/ur-queue/UrQueueCardList.tsx
app/src/features/ur-queue/UrQueueItemDrawer.tsx
app/src/features/ur-queue/UrQueueDataStatus.tsx
app/src/features/ur-queue/useUrQueueQuery.ts
app/src/features/ur-queue/urQueueTypes.ts
```

Verify and adapt to existing repository conventions; do not create a parallel component architecture.

## 13. Focused completion evidence

1. deterministic projector tests for every reason/status/correction combination;
2. server authorization and tenant-scope tests, including enumeration resistance;
3. cursor isolation/stability tests;
4. stale/partial/projection-pending response tests;
5. no-PHI telemetry and cache tests;
6. keyboard/mobile/accessibility tests;
7. command idempotency and concurrency tests;
8. proof the client cannot submit priority/risk/tenant/actor fields;
9. synthetic fixture screenshots showing labels `Synthetic` and no benchmark claims;
10. exact source event and projection watermark visible in authorized provenance detail.
