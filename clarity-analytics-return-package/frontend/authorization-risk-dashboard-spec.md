# Authorization-Risk Dashboard Specification

**Status:** Proposed and unverified. This is a de-identified, tenant-scoped operational-analytics surface. It does not provide a cross-organization benchmark, a regulator export, or a payer/clinical decision.

## 1. User and supported decisions

Primary users:

- UR manager: identify where authorization-day exposure and review workload are accumulating;
- program/facility leader: understand aggregate operational burden and data quality;
- facility executive with approved aggregate capability: monitor approved metrics without patient-level access.

Supported decisions:

1. Which authorized facility/program/unit and period has the largest count of approved, denied, pending, expired, or at-risk episode days?
2. Which controlled risk or documentation-gap categories account for that burden?
3. Is the data fresh, complete, eligible, and based on an approved metric definition?
4. Should an authorized operational user open the already-filtered UR queue for human follow-up?

Not supported:

- deciding medical necessity or authorization;
- predicting admission/discharge/placement;
- ranking patients with an opaque model;
- comparing organizations without approved benchmark governance;
- making denial-reduction, margin, or outcome claims when no measurements exist.

## 2. Data boundary

Dashboard responses contain:

- tenant-authorized facility/program/unit labels or surrogate IDs;
- approved metric values/statuses;
- controlled payer category only when authorized and suppression-safe;
- controlled risk/gap categories;
- period/grain;
- freshness, completeness, quality, definition, and suppression metadata.

They do not contain:

- patient name, MRN, DOB, address, phone, email, SSN, or raw person ID;
- episode token or review/gap token in aggregate responses;
- note/document text, payer reference, representative name, or correction narrative;
- raw event payload;
- employee-level staffing/payroll data;
- another organization's unsanctioned data.

A chart-to-queue link passes controlled filters only. Patient/episode rows are resolved by a separately authorized operational API.

## 3. Route and API

```text
/operations/authorization-risk
GET /api/v1/analytics/authorization-risk
```

Proposed query parameters:

```text
facilityId=<authorized UUID>
programId=<authorized UUID, optional>
unitId=<authorized UUID, optional>
periodStart=YYYY-MM-DD
periodEnd=YYYY-MM-DD
grain=DAY|WEEK|MONTH
dimension=NONE|PROGRAM|UNIT|PAYER_CATEGORY|RISK_REASON|GAP_CATEGORY
metricKeys=ur.approved_patient_days,...
```

Rules:

- `organizationId` is never accepted from the browser as an authority claim;
- period and grain are bounded by server policy;
- only approved dimensions for each metric definition are accepted;
- unsupported draft metrics are omitted or returned with explicit `DEFINITION_NOT_APPROVED` metadata, never calculated ad hoc;
- no cross-organization selector exists in the initial slice;
- server applies primary and complementary suppression before response;
- conditional GET/ETag may be used; responses are private/no shared cache.

## 4. Response view model

```ts
// Proposed and unverified.
interface AuthorizationRiskDashboardResponse {
  data: {
    scope: {
      organizationLabel: string;
      facilityId: string;
      facilityLabel: string;
      programId: string | null;
      programLabel: string | null;
      unitId: string | null;
      unitLabel: string | null;
      timezone: string;
    };
    period: {
      startDate: string;
      endDate: string;
      grain: "DAY" | "WEEK" | "MONTH";
    };
    status:
      | "READY"
      | "NO_MEASUREMENTS_FOUND"
      | "PARTIAL"
      | "STALE"
      | "SUPPRESSED"
      | "ERROR";
    summary: MetricResult[];
    trend: Array<{
      bucketStart: string;
      bucketEnd: string;
      results: MetricResult[];
    }>;
    breakdowns: Array<{
      dimension: string;
      dimensionValue: string;
      results: MetricResult[];
    }>;
  };
  meta: DashboardMetadata;
}

interface MetricResult {
  metricKey: string;
  metricName: string;
  definitionVersion: string;
  definitionStatus: "APPROVED";
  value: number | null;
  numerator: number | null;
  denominator: number | null;
  unit: "patient days" | "gaps" | "reviews" | "percent";
  resultStatus:
    | "VALUE"
    | "ZERO"
    | "NO_MEASUREMENTS_FOUND"
    | "INSUFFICIENT_DENOMINATOR"
    | "SUPPRESSED"
    | "PARTIAL"
    | "STALE";
  caveat: string | null;
  suppression: {
    status:
      | "NOT_APPLICABLE"
      | "NOT_SUPPRESSED"
      | "PRIMARY_SUPPRESSED"
      | "COMPLEMENTARY_SUPPRESSED";
    reason: string | null;
  };
}

interface DashboardMetadata {
  requestId: string;
  correlationId: string;
  asOf: string;
  computedAt: string | null;
  staleAfter: string | null;
  sourceWatermark: string | null;
  sourceCoverage: {
    status: "COMPLETE" | "PARTIAL" | "UNKNOWN";
    expectedSourceCount: number | null;
    reportingSourceCount: number | null;
    missingSourceLabels: string[];
  };
  completenessPercent: number | null;
  dataQuality: {
    status: "VALID" | "VALID_WITH_WARNINGS" | "PENDING_REVIEW" | "BLOCKED";
    issueCountsByCode: Record<string, number>;
  };
  recompute: {
    runId: string | null;
    reason: string | null;
    correctionApplied: boolean;
  };
  disclaimer: string;
}
```

The required synthetic no-data example is `examples/synthetic-dashboard-response.json`.

## 5. Initial metric cards

Render only definitions whose current version is approved for the selected scope.

| Order | Metric key | Label | Important presentation rule |
|---:|---|---|---|
| 1 | `ur.approved_patient_days` | Approved patient days | May overlap at-risk days; state this in definition/caveat. |
| 2 | `ur.denied_patient_days` | Denied patient days | Requires explicit day-level denial allocation. |
| 3 | `ur.pending_patient_days` | Pending patient days | Never style or describe as denied. |
| 4 | `ur.expired_patient_days` | Expired patient days | Definition/payer policy caveat visible. |
| 5 | `ur.at_risk_patient_days` | At-risk patient days | Overlapping flag, not an outcome bucket; do not sum with outcome cards. |
| 6 | `ur.open_documentation_gap_count` | Open documentation gaps | Controlled category only; no source text. |
| 7 | `ur.concurrent_reviews_due_count` | Concurrent reviews due | One per authorization, not per queue reason. |

`ur.denied_decisioned_day_rate` remains hidden while its denominator/minimum denominator are `Needs decision` or definition status is not approved.

### Card anatomy

- metric label and unit;
- value or exact non-value state;
- period change only if a valid approved comparable prior period exists; otherwise omit;
- status badge: fresh/partial/stale/suppressed;
- definition version link;
- caveat icon/text;
- optional `View filtered work` action only for users with queue capability.

Never show `0` when status is missing, insufficient, suppressed, partial without a valid value, stale without a valid retained value, or blocked.

## 6. Trend visualization

Recommended initial chart: accessible grouped/stacked bars or lines by time bucket for mutually exclusive coverage outcomes:

- approved;
- denied;
- pending;
- expired;
- unknown/not-classifiable only if approved and useful.

`At risk` is a separate line/overlay or separate panel because it overlaps outcome categories. The chart must never visually imply the outcomes plus at-risk sum to total days.

Chart requirements:

- exact values available in an adjacent/expandable data table;
- labels/tooltips include definition version and result status;
- missing/suppressed buckets display a gap/suppression marker, not zero-height bars;
- keyboard navigation and screen-reader summary;
- no animated rearrangement on auto-refresh;
- print/export absent in initial slice.

## 7. Breakdown panel

One controlled breakdown at a time:

- program;
- unit;
- payer category;
- risk reason;
- documentation-gap category.

Dimension availability is the intersection of:

1. actor aggregate scope;
2. metric definition allow-list;
3. sufficient source coverage;
4. suppression safety;
5. approved organization policy.

Rows include dimension label, metric results, result/suppression status, freshness, and a safe `View filtered work` link where authorized. Sort by selected metric value only among unsuppressed comparable values; suppressed rows remain labelled and must not be inferable through totals/complements.

## 8. Definition and provenance drawer

Every metric opens a drawer with:

- metric key/name/version/status/owner;
- plain-language description;
- grain and unit;
- numerator and denominator;
- inclusions/exclusions;
- source event types/fact tables;
- risk threshold/configuration reference;
- late-arrival/correction policy;
- quality requirements;
- suppression policy reference;
- calculation reference/version;
- computed time, event watermark, recompute run;
- source coverage/completeness;
- correction/recalculation indicator;
- caveats and evidence/approval references.

Aggregate users do not see raw event IDs or source payloads. Audited lineage access is a separate capability/workspace.

## 9. Scope and period controls

### Scope

- facility required for initial dashboard;
- program/unit optional when granted;
- selector options are server-authorized;
- changing scope clears prior chart/card data before loading to prevent cross-scope flash;
- no `All organizations` option.

### Period

Suggested presets: current 7 days, prior 7 days, current month, prior month, custom bounded range. Exact default/range limits are `Needs decision`.

- facility timezone shown next to dates;
- inclusive date semantics in definition drawer;
- future dates rejected except an explicitly approved forecast surface, which is not in this slice;
- comparison periods omitted unless definition and source coverage are comparable.

## 10. Complete state model

### Loading

Show labelled skeletons matching cards/chart/table. Keep scope/period controls disabled only as necessary. Never render the prior tenant's values underneath a loading overlay.

### No measurements found

Page banner and cards:

> **No measurements found**  
> No eligible governed event data was available for this scope, period, and approved definition.

Actions: adjust authorized scope/period; open data-status details. Do not recommend a performance conclusion.

### Zero

Show `0` only when the calculation completed over eligible, complete-enough data and the metric's true result is zero. Label source coverage/freshness normally.

### Insufficient denominator

> Not enough eligible data to calculate this measure.

Display numerator/denominator only if suppression policy permits. Do not render a percentage.

### Suppressed

> Value suppressed under the approved privacy policy.

Do not expose value, numerator, denominator, complementary cells, sortable rank, tooltip leakage, or downloadable data.

### Partial coverage

Retain valid values only if policy allows and label every affected card/chart/table `Partial`. Show reporting/expected source count and safe source labels. Do not present as complete.

### Stale

Retain last safe value with `Stale as of <time>` only when the API explicitly returns it as safe. Otherwise show no value. Provide freshness details and manual refresh.

### Corrected/recomputed

Show `Recomputed after correction` with run time and definition version. Normal users see the active result; authorized auditors can inspect lineage. Do not silently replace a historical screenshot/export claim.

### Definition not approved

Metric is not rendered as a value. An analytics steward may see a governance-only notice; ordinary users see no speculative card.

### Error

Retain last safe result only if supplied with explicit stale/error metadata. Show a non-PHI support reference. Never infer zero.

### Unauthorized

Return a page-level non-revealing access state; do not leak whether the scope has data or what its labels/counts are.

## 11. Responsive layout

### Desktop

- scope/period/status header;
- 3–4 card grid;
- full-width outcome trend;
- risk/gap breakdown table;
- right-side definition drawer.

### Tablet

- two-card grid;
- horizontal chart with accessible table below;
- filters in a labelled drawer;
- definition drawer becomes modal sheet.

### Mobile

- one-card stack;
- chart defaults to summarized accessible list/table with optional visualization;
- breakdown rows become cards;
- sticky scope/period summary, not a dense filter toolbar;
- no patient-level route is revealed to aggregate-only users.

## 12. Accessibility

Target WCAG 2.2 AA subject to repository standard:

- semantic headings and regions (`Summary`, `Trend`, `Breakdown`, `Data status`);
- metric status expressed in text, icon, and accessible description;
- charts have data tables and meaningful summaries;
- focus managed for definition drawer;
- keyboard-complete filters and drill links;
- no color-only outcome/risk distinction;
- sufficient contrast and zoom/reflow;
- live-region announcement after filters recalculate;
- reduced motion;
- suppressed/missing values announced by state, not as blank or zero.

## 13. Proposed component placement

```text
app/src/workspaces/AuthorizationRisk.tsx
app/src/features/authorization-risk/AuthorizationRiskPage.tsx
app/src/features/authorization-risk/AuthorizationRiskFilters.tsx
app/src/features/authorization-risk/MetricCard.tsx
app/src/features/authorization-risk/CoverageOutcomeTrend.tsx
app/src/features/authorization-risk/RiskBreakdownTable.tsx
app/src/features/authorization-risk/MetricDefinitionDrawer.tsx
app/src/features/authorization-risk/DashboardDataStatus.tsx
app/src/features/authorization-risk/useAuthorizationRiskQuery.ts
app/src/features/authorization-risk/authorizationRiskTypes.ts
```

Adapt to current repository conventions after preflight.

## 14. Focused completion evidence

1. API contract tests distinguish value, zero, no measurements, insufficient denominator, suppressed, partial, stale, and error.
2. Aggregate-only actors cannot retrieve episode tokens or use queue drill-through.
3. Cross-tenant and cross-organization queries are denied and non-revealing.
4. Definition allow-list/version and suppression are server enforced.
5. At-risk values are visually/semantically separate from outcome buckets.
6. Draft denial-rate metric is absent.
7. Synthetic environment displays `No measurements found` until eligible events are projected; no fabricated benchmark appears.
8. Correction/late-arrival recomputation updates active snapshots while retaining lineage.
9. Accessibility tests cover cards, chart table, filter changes, drawer, and all non-value states.
10. Browser telemetry/logging contains no PHI or raw metric lineage identifiers.
