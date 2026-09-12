# Inpatient Rev Ops first-slice build contract

First-slice rules approved by Tyler. Implementation is locally verified with
synthetic data; see the [verification record](../testing/REV_OPS_PATIENT_DAY_VERIFICATION.md).
This does not approve production use or the later product lanes.

## Confirmed by Tyler

| Decision | Requirement |
|---|---|
| Census cutoff | Midnight. |
| Budget comparison | Provide both full-month budget comparison and phased target comparison. |
| Actual entry | Support upload and optional manual entry. Both use the same validation and reporting definitions. |
| Roles | Administrator delegates responsibilities using the previously discussed basic role structure. |
| Examples | Create synthetic data using the existing sample structures. Do not copy actual patient records. |
| Technical review | Inspect newer upstream work and assess existing foundations. |

## First complete workflow

An administrator configures a synthetic hospital, unit, timezone, delegated
finance/census roles and a cost-center field. Finance uploads a patient-day
budget, resolves mappings and approves a version. A census user uploads daily
actuals or enters them manually, resolves a conflict/correction, and sees both
budget comparisons with history and completeness indicators.

The slice uses aggregate daily patient-day records. Event-level admission,
discharge and transfer counting is a later expansion. Upload support does not
itself settle those event rules or establish live system integration.

## Approved first-slice rules

Tyler confirmed all three pending choices: end-of-day labeling, accountable
correction/reopening permissions, and uniform phasing with optional custom targets.

- Use each facility's configured IANA timezone. Synthetic examples use
  `America/Chicago`; do not force that timezone on every hospital.
- Label a daily census record by the date whose end-of-day midnight snapshot it
  represents, with the explicit cutoff instant stored. Event-level
  admission/discharge-at-midnight and transfer attribution remain outside this slice.
- Show full-month budget, MTD actuals, actual-minus-full-month-budget, phased
  target through cutoff and actual-minus-phased-target as separately named values.
  Full-month variance during an incomplete month is not an end-of-month forecast.
- Default to a uniform daily budget; hospital setup may
  use a finance-defined daily profile. Require daily targets to sum to the monthly
  target. Custom profiles are optional.
- Delegate import, actual entry, correction, budget approval and period reopening
  as distinct permissions scoped to facilities. The administrator maps these to
  staff; basic role names are starting templates rather than hard-coded authority.
- An authorized census correction records prior value, new value, reason, actor
  and source. Manual edits and uploads never silently overwrite each other.
- Identical repeat submissions are no-ops; conflicting values enter review.
  Authorized corrections supersede prior records while retaining their history.
- Closed periods reject routine changes. Only a delegated reopening authority
  can reopen with a reason and audit record. Reclosing preserves the revision.
  Budget amendments create new approved versions rather than edit a baseline.

The administrator delegates correction and reopening separately. Users without
those permissions are denied. Reasons and responsible users are retained.

## Synthetic reference month

Fixtures: [daily actuals and budget](examples/rev-ops-first-slice-synthetic.csv).
All names, counts and targets are invented. This is a requirements example, not
an application seed or executable contract. No source financial amounts or
patient identifiers are reproduced.

The CSV is a combined reference fixture: `monthly_budget` repeats as context,
not as additive daily budget data. Read one distinct budget per tenant/facility/
unit/period, validate repeated values agree, and never sum that column. Tenant
keys identify test scenarios only; production authorization comes from the
trusted principal, not an upload field.

February 2028 is a leap month. Tenant A, Harbor Demo Hospital, Adult unit has a
monthly budget of 290 patient days: 10 per day under this example's uniform
phasing. The reporting cutoff is the end of February 7 in the configured
facility timezone. Tenant B intentionally has the same facility/unit labels.

| Example | Expected result |
|---|---|
| Tenant A Feb 1–7 actuals: 9, 10, 11, 10, 12, 8, 10 | MTD actuals 70; full budget 290; actual minus full budget -220; phased target 70; phased variance 0. |
| Correct Feb 6 from 8 to 9 | MTD actuals 71; full-budget variance -219; phased variance +1. Original entry retained; approved budget still 290. |
| Upload the original file again after correction | No additional patient days; do not restore the superseded 8 silently. Report existing/reconciled records. |
| Remove Feb 4 before reconciliation | Known-day total 60 with one missing day; seven-day completeness fails. Do not present a complete MTD variance or infer a zero census. |
| Tenant B Feb 1–7: 5 per day; monthly budget 145 | MTD 35; phased target 35; phased variance 0. Tenant A results unchanged. |
| Unapproved synthetic transfer attribution example: move one counted day from Adult to Geri | Facility total unchanged; unit counts change by -1/+1. Requires agreed attribution rule before event-level implementation. |
| Attempt a correction in a closed period | Denied until an authorized reopening is recorded. |
| Unauthorized tenant/facility/approval access | Denied through direct requests as well as UI. |

Future episode-count fixtures need Tyler's precise admission/discharge-day and
transfer rules. The aggregate month above can be used now without inventing them.

## Current technical evidence

Live `git fetch origin` completed during this review. Local HEAD remains
`0acc9fcd2b57a339bef52d3170623e37547266b2`; fetched upstream tip is identified by
commit `a7ece3a` (PR #47 merge), 18 commits ahead. No merge, pull, reset or branch
switch was performed. Existing documentation edits remain intact.

Upstream includes prescreen Phase 3 persistence (PR #32), gateway/RLS migrations,
integration/restart tests and ADR-0016, plus the admission replay missing-episode
fix (PR #47). ADR-0017 addresses the development-agent operating model. These
are inspected repository artifacts; tests were not rerun during this review.

Reuse candidates: authentication principal resolution, transaction-local
organization context, Prisma repositories, audit patterns and persistence-test
harnesses. New Rev Ops facility permissions, budget versions, import handling,
custom fields and comparison flow still need scoped implementation. Existing
prescreen persistence does not prove Rev Ops works or is production-ready.

Before coding, reconcile onto a branch based on current upstream while preserving
the documentation work, inspect applicable ADRs in full, and confirm the runtime
and database boundary. The existing open-decision register still lists OD-5
(API boundary) and OD-6 (provider/session/security details); do not infer their
resolution from prescreen code alone.

## Acceptance and next move

### Implementation preparation record

The working checkout has now been moved to
`codex/om/rev-ops-patient-days`, based on fetched upstream
`a7ece3a00e15db19565ea3c69d561e1d907eafe7`. All uncommitted documentation was
preserved; no merge or deployment was performed. This supersedes the local-HEAD
description in the historical technical inspection above.

Current baseline checks: five tests passed across
`tests/unit/episode-persistence-gateway.test.ts` and
`tests/workflow/authorization.test.ts`; `npm run typecheck` passed. These prove
only that focused existing baseline, not Rev Ops functionality or database/RLS
behavior. Integration, browser and restart checks remain unrun for this slice.

ADR-0012's accepted direction requires the thin Fastify adapter before adding
product routes, preserving existing verified-principal contracts. Prisma access
remains in `packages/case-repository`; new Rev Ops persistence must extend that
boundary. ADR-0017 favors a bounded implementer and independent verification,
not parallel module-owning agents.

### Approval and implementation outcome

Tyler approved all three pending choices and emphasized accountability for
accurate, efficient work. The scoped workflow is implemented and tested locally.
The historical inspection and baseline checks above are retained as dated
preparation, superseded by the current [verification record](../testing/REV_OPS_PATIENT_DAY_VERIFICATION.md).

Budget and actual activity remain separate. Forecast, collections and event-level
stay counting are deferred. No production deployment or production data use is
claimed. The owner walkthrough is complete; PR #49 merged after the import
security fixes and latest-head verification. Next: the
[onboarding/custom-fields slice](INPATIENT_REV_OPS_ONBOARDING_FIELDS_BRIEF.md),
with fields in both setup and data entry as Tyler selected.
