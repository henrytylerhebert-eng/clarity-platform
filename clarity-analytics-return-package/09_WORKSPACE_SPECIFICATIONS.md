# Workspace Specifications

## 1. Admission Handoff

### Users

Admissions coordinator, authorized receiving-facility clinician/administrative actor, or equivalent capability holder.

### Goal

Record that an already accepted patient was admitted and create the governed episode without re-entering the referral story.

### Entry

- accepted case action;
- handoff task;
- deep link from facility response/acceptance;
- not available when the case lacks accepted authority or user scope.

### Information hierarchy

1. **Acceptance source** — facility response/authority, recorded by/when, status.
2. **Receiving destination** — facility, program, unit, timezone.
3. **Admission fact** — admitted time and source method.
4. **Handoff references** — packet version, custody/transport event, coverage/readiness links.
5. **Exceptions** — missing configuration, conflicting existing episode, stale case.
6. **Attestation and submit**.

### Fields

| Field | Source/default | Editable? | Rule |
|---|---|---:|---|
| case identifier/display | case | no | minimum necessary |
| accepted facility | accepted response | normally no | mismatch requires approved correction path |
| facility/program/unit | canonical configuration | yes within scope | hierarchy validated server-side |
| facility timezone | facility | no | required |
| admitted at | human/source | yes | timezone explicit |
| packet version | case | select approved | reference only |
| custody event | case | select verified | optional according to policy |
| coverage/source authorization | case | link | no member IDs |
| attestation | user | yes | required |

### Actions

- `Record admission`;
- `Return to case`;
- `View acceptance provenance`;
- no accept/decline clinical action;
- no patient placement recommendation.

### Success

Show episode ID, service date, event ID, source references, and `Open episode`. A projection-pending message may appear until the UR read model is ready.

### States

- loading source case;
- not ready;
- stale case version;
- already handed off;
- conflicting active episode;
- missing facility timezone/configuration;
- unauthorized scope;
- submit in progress;
- idempotent replay;
- command saved, projection pending;
- partial source references;
- corrected admission.

### Accessibility/responsive

Sectioned single-column form on mobile; acceptance source and attestation are always visible before submit; errors focus the section heading and field.

## 2. My UR Work / UR Work Queue

Detailed component-level specification is in `frontend/ur-work-queue-spec.md`.

### Users

UR specialist, UR manager, approved program leader.

### Goal

Identify and complete the next human review/documentation action from deterministic due dates and source facts.

### Table columns

- episode/patient display token or permitted operational label;
- facility/program/unit;
- payer display/category;
- coverage outcome;
- approved through;
- days at risk;
- next review due;
- open documentation gaps;
- top risk reason(s);
- assigned owner;
- data quality/correction state;
- last calculated.

### Primary row actions

- `Open review`;
- `Record payer outcome`;
- `Add documentation gap`;
- `Assign`;
- `View provenance`.

No direct `Mark safe`, `Approve`, `Deny`, or `Change priority` button exists.

### Filters

Scope, owner, due window, outcome, risk reason, gap category, payer, level of care, quality, corrected/late.

### Sort

Server-owned default priority. Users may select approved alternative sorts, but server preserves stable cursor ordering.

### Detail drawer

- current outcome and risk flags;
- requested/approved/denied/pending date ranges;
- upcoming review;
- gap summary by controlled category;
- source and correction indicators;
- primary action.

### States

- loading skeleton with stable column widths;
- no work matches filters;
- queue projection pending;
- stale queue with last-safe data retained;
- partial source coverage;
- source disagreement requiring review;
- late event pending recomputation;
- corrected row with before/current indicator;
- unauthorized scope;
- dependency unavailable;
- row changed while open;
- assignment conflict.

## 3. Episode Utilization Review Detail

### Users

UR specialist/manager; scoped clinical/HIM users see a restricted variant.

### Header

- episode operational display;
- status;
- facility/program/unit;
- admission time/service date;
- payer/coverage display;
- assigned owner;
- freshness/quality/correction indicators.

### Tabs/sections

1. **Timeline** — reviews, outcomes, gaps, corrections.
2. **Authorization** — request and decision ranges.
3. **Episode days** — service date, coverage outcome, risk flags, lineage.
4. **Documentation gaps** — controlled workflow.
5. **Provenance** — event source, effective/recorded time, correction chain.
6. **Case handoff reference** — read-only link, subject to access.

### Record review flow

1. select review type;
2. enter requested range and due time;
3. record source method/reference;
4. select pending/approved/denied/withdrawn;
5. add one or more date-range decisions;
6. add controlled gaps;
7. review derived impact preview;
8. attest and submit.

The impact preview is advisory and labeled as a projection; the server remains authoritative.

### Conflict handling

- overlapping conflicting day outcomes → block and explain;
- source disagreement → permit save only into pending-review/quarantine path if policy allows;
- stale version → reload comparison; never overwrite;
- correction → target exact event/version and show lineage.

## 4. Documentation Gaps

### Users

UR, clinician reviewer, HIM, nursing documentation roles, managers by scope.

### Views

- `Assigned to me`;
- `Open by due date`;
- `By controlled category`;
- `Disputed`;
- `Recently resolved`;
- `Awaiting correction/review`.

### Card/table contents

- episode display;
- category;
- due/age;
- originating review;
- assigned role/user;
- status;
- source object presence;
- correction/quality state;
- no note text in list.

### Detail

- approved operational summary if allowed;
- source references;
- event timeline;
- actions permitted by capability and current state;
- attestation and resolution code.

### Actions

Acknowledge, assign, start, resolve, dispute, reopen, cancel, correct. Each is a controlled transition.

### States

- no gaps;
- assigned source removed/superseded;
- document completed but projection pending;
- source disagreement;
- overdue;
- resolved after due date;
- correction under review;
- unauthorized source document.

## 5. Authorization Risk Dashboard

Detailed component-level specification is in `frontend/authorization-risk-dashboard-spec.md`.

### Users

UR manager, facility/program leader, executive with approved aggregate scope.

### Goal

Understand aggregate authorization-day and documentation workload without exposing patient identity or implying payer/clinical decisions.

### Header

- selected organization/facility/program/unit scope;
- period and grain;
- freshness;
- source coverage;
- definition versions;
- quality/recomputation indicator.

### Summary cards

- approved patient days;
- denied patient days;
- pending patient days;
- expired patient days;
- at-risk patient days;
- open documentation gaps;
- concurrent reviews due.

`At-risk` is explicitly labeled as potentially overlapping coverage outcomes.

### Visuals

- coverage outcomes over time;
- risk reasons over time;
- approved-through expiration bands;
- documentation-gap categories;
- payer/program controlled dimension table;
- data-quality panel.

### Drill-down

- aggregate segment → filtered aggregate table;
- operational queue link appears only for users with `ur.queue.read`;
- no patient row returned from the analytics endpoint.

### No-measurement state

Display:

> No measurements found  
> Eligible episode-day and authorization-review events have not been calculated for this scope and period.

Do not show seven zero cards.

### Insufficient denominator

For rate metrics:

> Not enough eligible decisioned days to calculate this measure.

### Suppression

Show `Suppressed by approved cohort policy`; do not reveal suppressed value through totals, tooltips, exports, or complementary categories.

## 6. Audit and Corrections

### Users

Compliance/audit, data steward, authorized operational corrector.

### Goal

Inspect immutable event history, understand active versus superseded facts, and initiate/approve controlled corrections.

### Contents

- event type/schema version;
- aggregate and scope;
- effective/recorded/received times;
- actor/source identity;
- payload summary with role-based redaction;
- payload hash;
- quality/review/metric eligibility;
- correlation/causation;
- original/correction/reversal chain;
- affected projections/metric snapshots;
- recompute run status.

### Actions

- request correction;
- record correction, when authorized;
- approve/reject data-quality exception;
- requeue failed projection, operations-only later;
- no delete/edit event action.

### States

- original active;
- corrected/superseded;
- ambiguous branch quarantined;
- late event accepted;
- recomputation queued/running/failed/completed;
- source payload unavailable by retention policy;
- redacted field;
- unauthorized event.

## 7. Metric Definition Drawer/Registry

### First slice

Read-only definition drawer from dashboard.

### Later governed workspace

Draft, review, approve, retire definitions. It must show:

- key/version;
- plain definition;
- numerator/denominator;
- grain;
- source events;
- exclusions;
- code calculation reference;
- owner/reviewer;
- effective date;
- test evidence;
- impacted dashboards/exports;
- prior version comparison.

No arbitrary SQL editing in the browser for the first stage.

## 8. Hospital Operations, Staffing, Finance, Executive, Regulatory

These are later workspaces, not placeholders that imply live data.

When navigable before implementation, show:

- `Not available in this build`, or
- `No measurements found` only if the query contract exists and no data exists.

Do not populate synthetic KPI cards in a surface presented as operational.

## Shared state behavior

See `frontend/state-and-error-matrix.md` for the exhaustive matrix.

### Loading

- skeletons preserve layout;
- last-safe aggregate may remain visible with `Refreshing`;
- disable duplicate command submit while request is active;
- no indefinite spinner without request ID/retry.

### Empty

Differentiate:

- no entities exist;
- no entities match filters;
- no eligible metric facts;
- all values suppressed;
- source coverage missing;
- user lacks scope.

### Error

- show machine-readable support/request ID;
- preserve user-entered form data where safe;
- distinguish retryable dependency failure from validation;
- never expose raw server error or PHI.

### Stale

- show timestamp/watermark;
- explain source/worker lag;
- allow safe operational actions only if command services can verify current versions;
- query staleness never relaxes authorization.

### Correction

- display active value;
- show prior value only to authorized roles;
- link correction event/reason;
- state whether metrics were recomputed.

### Review/attestation

- show exactly who/what needs review;
- block only the dependent action;
- do not imply a clinical/legal/payer conclusion.
