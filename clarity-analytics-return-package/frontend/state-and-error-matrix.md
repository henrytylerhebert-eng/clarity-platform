# UI State and Error Matrix

**Status:** Proposed and unverified. Copy, API codes, retry policy, and component placement must be reconciled with the live repository's design system and error conventions.

## 1. State-model rule

Clarity must not collapse materially different states into `0`, a blank card, an empty table, or a generic error. The server owns factual status; the client renders it without inference.

Canonical aggregate result states:

- `VALUE`;
- `ZERO`;
- `NO_MEASUREMENTS_FOUND`;
- `INSUFFICIENT_DENOMINATOR`;
- `SUPPRESSED`;
- `PARTIAL`;
- `STALE`;
- `ERROR`.

Canonical operational data states:

- loading;
- ready/current;
- empty/no matching work;
- projection pending;
- stale;
- partial source coverage;
- source disagreement;
- late-arriving;
- correction/supersession;
- review/attestation required;
- unauthorized/not found;
- command validation/conflict/idempotent replay;
- integration/projector failure.

## 2. Cross-surface presentation matrix

| Condition | Admission Handoff | UR Queue / Episode Detail | Authorization-Risk Dashboard | Audit/Provenance | Required behavior |
|---|---|---|---|---|---|
| initial loading | source-summary/form skeleton | queue/detail skeleton | card/chart/table skeleton | timeline skeleton | Clear previous tenant/scope data before render; labelled busy state. |
| background refresh | preserve non-edited source summary | retain rows; do not reorder active edit | retain last safe values with `Updating…` | retain timeline | Never cover stale PHI with an opaque loader that can flash across scope. |
| no operational records | `No accepted cases require an admission handoff.` | `No utilization-review work is currently open for this scope.` | not applicable unless no governed measurements | `No audit events match the selected filters.` | Distinguish from filtered empty and no permission. |
| filters yield no match | `No handoffs match these filters.` | `No utilization-review work matches this scope and filter.` | `No measurements found` only if API says no eligible facts; otherwise no matching breakdown rows | `No events match these filters.` | Offer clear filters; never widen scope automatically. |
| aggregate zero | not applicable | queue summary may be zero after complete query | render `0` only with `ZERO` status | not applicable | Include freshness/coverage/definition metadata. |
| no measurements | not applicable | not an operational queue state | `No measurements found.` | provenance may show no metric run | No value, trend, benchmark, or implied conclusion. |
| insufficient denominator | not applicable | not an operational queue state | `Not enough eligible data to calculate this measure.` | show definition/quality if authorized | Do not display percent; numerator/denominator only if privacy permits. |
| suppressed | not applicable | no patient-list suppression; access policy applies | `Value suppressed under the approved privacy policy.` | authorized steward may see policy/lineage, not broad users | Remove value, rank, tooltip, complement leakage, export. |
| projection pending | `Admission recorded. Utilization-review views are still processing.` | `Recorded work is still being processed.` | `Measurements are still processing.` | show accepted event/delivery status if authorized | Command success remains success; retry read, not command. |
| stale | source-case version warning before submit | retain last safe rows; mark stale; restrict unsafe edits | retain last safe values only when API marks safe | display checkpoint lag | State exact as-of time; never claim current. |
| partial coverage | show missing optional source references | show coverage banner and per-item warnings | every affected result labelled `Partial` | show source coverage details | State reporting/expected sources safely; no complete claim. |
| source disagreement | block or route to reconciliation when admission fact conflicts | queue item marked review-required | exclude/pending per definition; show quality warning | show both source references/active resolution | No silent source precedence. |
| late arrival | show only if handoff source arrives after fact/correction path | item badge plus affected date | recompute badge/window | event effective/recorded times | Append and recompute; do not rewrite original time. |
| corrected/superseded | current active admission plus correction indicator | active version + correction chain | active recomputed result + indication | full immutable chain | Original remains immutable; ordinary UI avoids showing superseded value as active. |
| review required | attestation section blocks submit | controlled action and reason | metric pending/excluded | reviewer state visible | No autonomous completion. |
| unauthorized scope | `You do not have access to this scope.` | same, or non-revealing not found for resource | page-level access state | same | Do not leak resource existence, labels, counts, or source names. |
| integration/projector failure | native handoff may still work; optional sources marked unavailable | retain safe view; disable version-dependent actions | retain safe stale view or error state | failure metadata redacted | No raw payload/error/PHI; retry service process safely. |
| session expired | clear PHI and protect unsent fields per policy | clear PHI cache/drawers | clear protected aggregate cache as configured | clear restricted detail | Re-authenticate; do not silently submit after session restoration. |

## 3. API error-to-UI mapping

| API code | HTTP class | Surface behavior | User copy | Retry/action | Telemetry rule |
|---|---:|---|---|---|---|
| `AUTHENTICATION_REQUIRED` | 401 | clear protected state; authentication prompt | `Your session has ended. Sign in again to continue.` | re-authenticate | request ID only; no PHI/form payload |
| `PERMISSION_DENIED` | 403 | page/action access state | `You are not authorized to perform this action.` | return/cancel | capability key may be logged server-side, not sensitive resource contents |
| `SCOPE_NOT_ALLOWED` | 403 | clear denied scope data | `You do not have access to this scope.` | choose an authorized scope | no denied labels/counts |
| `RESOURCE_NOT_FOUND` | 404 | shared non-revealing not-found | `The requested record is unavailable.` | return to authorized list | do not distinguish absent from forbidden |
| `VALIDATION_FAILED` | 422 | preserve allowed input; field summary and inline links | field-specific safe messages | correct and submit | no raw narrative/source text in client error telemetry |
| `CONCURRENCY_CONFLICT` | 409 | block overwrite; fetch current version/comparison | `This record changed after you opened it.` | review/reload and retry intentionally | log versions/IDs only under approved controls |
| `IDEMPOTENCY_KEY_REUSED` | 409 | do not resubmit different body under same key | `This submission key was already used for different information.` | generate new key after review | body hashes server-side; no payload in client log |
| `ADMISSION_HANDOFF_NOT_READY` | 409/422 | show readiness reasons from controlled codes | `The admission handoff is not ready to record.` | return to source tasks | no clinical/legal source text in generic telemetry |
| `SOURCE_DISAGREEMENT` | 409/422 | route to controlled reconciliation/review | `The recorded sources disagree and require review.` | inspect provenance if authorized | source IDs/hashes restricted |
| `DATA_QUALITY_REVIEW_REQUIRED` | 409/422 | save only to approved review path or block | `This information requires data-quality review.` | open quality details | controlled issue code only |
| `PROJECTION_NOT_READY` | 202/409/503 by route contract | command remains successful; read shows processing | `The latest recorded work is still being processed.` | retry read/refresh | checkpoint IDs/redacted status only |
| `METRIC_DEFINITION_NOT_APPROVED` | 409/422 | no value rendered | `This measure is not approved for use.` | steward workflow only | definition key/version safe; no calculated value |
| `CURSOR_INVALID` | 400/409 | reset page after user notice | `The work list changed. The first page has been reloaded.` | reload first page | no cursor contents |
| `RATE_LIMITED` | 429 | retain safe view; pause automatic retry | `Too many requests. Try again shortly.` | bounded retry with server guidance | request ID and route only |
| `INTERNAL_ERROR` | 500 | safe generic state; retain explicit stale result only if provided | `Clarity could not complete this request.` | retry/support reference | request/correlation ID; redact payload/PHI |
| `SERVICE_UNAVAILABLE` | 503 | stale/offline status | `This service is temporarily unavailable.` | manual or bounded retry | no cascading raw dependency errors |

Exact HTTP mappings should follow repository conventions; the error code and non-revealing behavior are the stable contract.

## 4. Command lifecycle matrix

| Phase | UI control | Data behavior | Accessibility |
|---|---|---|---|
| idle | primary action available only when locally complete and server-permitted | no speculative event/metric writes | button name describes command |
| submitting | disable duplicate submit; allow safe cancel only if request not sent per implementation | send idempotency key + expected version | `Saving…` announced |
| accepted | show canonical response, event/reference token where permitted | invalidate affected queries; poll/read projection separately | success heading/live message; focus to confirmation |
| idempotent replay | show original accepted result | no duplicate invalidation loop | announce `Already recorded; original result shown.` |
| validation failed | preserve safe input | no optimistic source-state mutation | focus error summary then field |
| concurrency conflict | lock current draft from overwrite; show current version | discard optimistic mutation; fetch comparison | announce conflict and next action |
| committed, projection pending | success plus processing state | source record remains authoritative | do not call it an error |
| failed before commit | form remains editable | no source/event/audit write expected; server verifies transaction | safe error summary |
| unknown network outcome | do not generate a new idempotency key automatically | retry exact request with same key or query outcome endpoint if available | explain verification; avoid duplicate action |

## 5. Aggregate result rendering contract

| Result status | Value field | Card/chart behavior | Comparison behavior |
|---|---|---|---|
| `VALUE` | non-null | render value and unit | compare only to compatible definition/scope/coverage |
| `ZERO` | `0` | render explicit zero | valid comparison allowed if compatible |
| `NO_MEASUREMENTS_FOUND` | null | render state label; no zero-height data mark | none |
| `INSUFFICIENT_DENOMINATOR` | null | render explanatory label | none |
| `SUPPRESSED` | null | render suppression label; remove hover/rank/export | none; apply complementary suppression |
| `PARTIAL` | nullable by policy | label value/series/row partial; show coverage | comparison generally omitted unless policy approves |
| `STALE` | nullable last-safe value | label exact as-of/stale time; no current claim | comparison omitted by default |
| `ERROR` | null unless explicit last-safe envelope | safe error; definition/status metadata may remain | none |

The client rejects an impossible shape such as `NO_MEASUREMENTS_FOUND` with a numeric value and routes it to a contract-error state rather than guessing.

## 6. Data-quality, freshness, and correction badges

Badges are independent dimensions:

- outcome: approved/denied/pending/expired/not required/unknown;
- risk: due, overdue, expiring, gap, source disagreement;
- quality: valid, warning, pending review, blocked/quarantined;
- freshness: fresh, stale, unknown;
- history: corrected/superseded/late-arriving.

Never merge these into one generic red/yellow/green status. Each badge has visible text, icon, accessible name, definition, and source timestamp where applicable.

## 7. Stale-data policy

### Operational surfaces

- stale queue/detail can be displayed only with explicit API metadata;
- commands that require a verifiable current version may be disabled until refreshed;
- the last safe response remains scoped to the same subject/capability/scope;
- auto-refresh uses bounded backoff and does not move active focus/edit.

### Aggregate surfaces

- `computedAt`, `sourceWatermark`, `staleAfter`, source coverage, and definition version are visible;
- a newly computed snapshot over missing sources is `PARTIAL`, not fresh/complete;
- stale and partial may coexist; the response and UI must represent both metadata dimensions;
- no silently cached cross-session/cross-tenant values.

## 8. Correction and late-arrival states

| State | Active fact/result | Historical access | User action |
|---|---|---|---|
| correction proposed but not accepted | original remains active | proposal visible to authorized reviewer | accept/reject through controlled command if approved |
| correction accepted | replacement active | original and link immutable | view chain; downstream recompute status |
| downstream recompute pending | operational replacement active; aggregate old value labelled pending/stale or withheld | lineage available to auditor | refresh/status |
| recompute complete | latest eligible snapshot active | prior snapshot retained | view recompute metadata |
| late event accepted | effective-time fact appended | recorded/effective difference visible | review quality if threshold exceeded |
| conflicting late event | current fact not silently changed | both sources linked | reconciliation required |

## 9. Form validation conventions

- error summary at top with links to fields;
- inline error uses controlled, non-PHI copy;
- server errors override client assumptions;
- dates state timezone and inclusive/exclusive semantics;
- overlapping authorization ranges identify controlled date fields, not source narrative;
- unknown enum/source mappings cannot be forced into a misleading allowed value;
- attestation checkboxes/statements are versioned and cannot be pre-checked;
- generated assistance is clearly labelled and requires human confirmation.

## 10. Cache, logging, and telemetry state rules

1. Query keys include authenticated subject/capability revision and authorized scope.
2. Scope/session change cancels queries and purges PHI state.
3. Service workers/shared browser caches must not persist PHI unless an explicit security design approves it.
4. Client telemetry records route, state/error code, duration, request ID, safe scope class, and synthetic/test flag—never patient identifiers, source text, payer references, event payloads, or form bodies.
5. Screenshots/session replay tools are disabled or strictly redacted on PHI surfaces unless approved.
6. Aggregate values may still be sensitive business data; logging/export follows tenant policy.
7. Error messages supplied by dependencies are mapped to controlled codes before reaching the browser.

## 11. Component/state-machine placement to verify

```text
app/src/components/async/AsyncBoundary.tsx
app/src/components/errors/ApiErrorState.tsx
app/src/components/data-status/DataStatusBanner.tsx
app/src/components/data-status/MetricResultState.tsx
app/src/components/data-status/FreshnessBadge.tsx
app/src/components/data-status/QualityBadge.tsx
app/src/components/data-status/CorrectionBadge.tsx
app/src/api/apiError.ts
app/src/api/queryCachePolicy.ts
packages/domain-contracts/src/analytics/resultStates.ts
```

Prefer existing repository primitives; do not add a duplicate error/state library without review.

## 12. Focused test matrix

Minimum focused tests:

- every aggregate state shape and impossible-shape rejection;
- no stale previous-tenant flash during scope change;
- session expiration clears PHI;
- non-revealing 403/404 behavior;
- validation summary/focus and screen-reader association;
- idempotent replay versus duplicate submission;
- concurrency conflict never overwrites current data;
- command committed/projection pending shown as success + processing;
- partial and stale metadata represented independently;
- suppression removes values, ranks, tooltips, complements, and exports;
- corrections display active/superseded status and recompute state;
- auto-refresh does not reorder focused/edited queue item;
- no PHI in URL, page title, telemetry, error capture, local persistence, or fixture snapshots;
- `No measurements found` appears for empty synthetic dashboard data and no benchmark claim is rendered.
