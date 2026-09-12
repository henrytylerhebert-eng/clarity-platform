# Inpatient Rev Ops implementation plan

Status: Patient-day and onboarding/field slices merged in PRs #49 and #50 after
synthetic verification. Census-upload reconciliation merged in PR #51. Month-end readiness/closing is
implemented and locally verified, pending code review and merge; wider roadmap remains proposed. Product owner and functional reviewer: Tyler. Current test evidence:
[month-close verification record](../testing/REV_OPS_MONTH_CLOSE_VERIFICATION.md).

Inputs: [product definition](../product/INPATIENT_REV_OPS_PRODUCT_DEFINITION.md),
[systems map](../product/INPATIENT_REV_OPS_SYSTEMS_MAP.md), and
[workbook requirements/source map](../../reporting-metrics-rebuild-package/INPATIENT_REV_OPS_CANDIDATE_REQUIREMENTS.md).

This is the detailed execution proposal for the analytics/Rev Ops lane, not a
replacement platform roadmap. Priority remains in the
[Implementation Roadmap](IMPLEMENTATION_ROADMAP.md); actual capability status
remains in [IMPLEMENTATION_STATUS.md](../../IMPLEMENTATION_STATUS.md).

## Delivery principle

Architect horizontally. Implement vertically. Validate end-to-end. Expand only
after proof. Tyler's ten years of use establishes the owner-reported functional
baseline. Proof concerns a faithful, secure and improved software replacement;
it does not require repeating discovery of whether the existing workflow is useful.

The first deliverable is one complete persisted workflow:

**Set up hospital → import and approve patient-day budget → record daily actuals
→ reconcile a correction → view a traceable budget comparison.**

## Repository starting point

Planning inspection used local `main` at
`0acc9fcd2b57a339bef52d3170623e37547266b2`, which is 18 commits behind the cached
`origin/main`. No live fetch or upstream reconciliation was performed. Existing
uncommitted Rev Ops documentation is preserved. Before coding, confirm the
current target branch and inspect its actual implementation.

| Existing surface | Reuse assessment required |
|---|---|
| `app/` | Extend the existing frontend conventions. Local role selection/localStorage cannot serve as authoritative tenant access or durable Rev Ops storage. |
| `packages/auth-service/` | Assess principal resolution and the chosen runtime identity boundary. |
| `packages/case-repository/` | Assess tenant context, repository adapters and audit patterns. |
| `packages/domain-contracts/` | Reuse validation conventions and accepted identity boundaries. Add contracts only within approved implementation scope. |
| `packages/api-service/` | Resolve applicable ADR-0012/OD-5 runtime boundary before new API routes. |
| `prisma/schema.prisma` | Map existing organization/facility and persistence relationships before proposing migrations. |
| Existing tests and quality scripts | Extend focused behavior tests; do not infer production readiness from existing foundations. |

This inspection locates reuse candidates; it does not verify that these surfaces
already satisfy the planned workflow. No runtime tests were run for this plan.

## Work package 0 — Specify the replacement contract

Deliver a bounded implementation brief and synthetic expected-results fixtures.

- With Tyler, confirm patient-day meaning, census cutoff/timezone, transfer
  treatment, fiscal calendar and the source of aggregate daily actuals.
- Identify intended behavior where the sample workbook has broken references
  or inconsistent labels. Record each intentional correction to the baseline.
- Define monthly budget comparison versus month-to-date comparison. Do not
  assume monthly targets can be evenly prorated without an approved rule.
- Agree roles that may configure, import, approve, correct and view/export.
- Map tenant, facility, custom-field, audit and persistence needs across the
  whole product without implementing future modules.
- Identify applicable architecture/open decisions, especially OD-5 and OD-6,
  in the [canonical decision register](../decisions/OPEN_DECISIONS.md).

Exit evidence: Tyler-reviewed calculation examples, an explicit scope, acceptance
checks and an implementation target. Architecture/security choices needed by
that target are recorded through the existing process. Other modules' open
questions do not block this bounded patient-day slice.

## Work package 1 — Implement the complete patient-day slice

The following increments belong to one vertical slice. None alone is a completed
product capability. Use small cohesive commits and draft PRs where requested.

| Increment | Implementation work | Focused evidence |
|---|---|---|
| 1A. Hospital setup | Persist organization/facility/unit configuration and server-authorized finance/census access using accepted architecture. Support two synthetic tenants. | Correct facility membership; forged/cross-tenant identifiers rejected. |
| 1B. Scoped customization | Add one typed cost-center dropdown on budget lines, including scope, validation and definition history. Build only the machinery needed by this slice. | Valid/invalid values, required-field behavior, rename/archive history and access denial. |
| 1C. Budget import and approval | Upload CSV/XLSX through the approved runtime; map the supplied budget shape; preview errors/duplicates/subtotals; reconcile detail and approve an immutable version. | Repeat import does not inflate totals; partial failures are visible; approval permissions and version immutability hold. |
| 1D. Daily actuals and corrections | Enter/import synthetic aggregate patient-day records by date/facility/unit, with source, actor and correction reason. | Conflicting sources require reconciliation; repeat input does not duplicate days; correction history survives reload. |
| 1E. Comparison and drill-down | Show actual days, approved budget, explicitly defined variance, cutoff, completeness and provenance. | Expected arithmetic matches fixtures; missing days remain missing; budget unchanged by actual corrections. |
| 1F. End-to-end hardening | Exercise the persisted flow through the UI and server, including authorization and export if delivered. | Full journey, direct unauthorized requests, restart persistence, source trace and failure recovery. |

Tenant scope comes from trusted server identity, not freely editable upload
columns. Use secure file handling and bounded import limits. Preserve source
locators; do not execute uploaded workbook formulas/macros as application code.

For this slice, daily aggregate actuals are a migration entry path. Label their
origin and reconciliation basis. Do not imply an EHR connection or combine them
with episode-derived totals for the same scope. Forecast and collections remain
unavailable rather than filled with illustrative operational values.

## Work package 2 — Prove the replacement end-to-end

Run the complete journey with two synthetic organizations containing overlapping
facility names and dates. Evidence must include:

1. Hospital setup, field configuration, budget preview/approval, actual entry,
   correction and report drill-down completed through the supported interface.
2. Reconciliation to the agreed workbook examples and independent totals;
   detail/subtotal imports cannot double count.
3. Direct cross-tenant, wrong-facility and wrong-role access attempts denied for
   every supported read/write/import/export operation.
4. Leap-year, partial-period, missing-day, duplicate-input, source-conflict and
   rejected-row cases handled without silently substituting zero.
5. Approved budget unchanged by actuals; corrected activity retains prior values,
   source, actor and reason. Reload/restart preserves committed records.
6. Renamed or archived custom fields preserve historical meaning and permissions.
7. Migration/recovery behavior tested against a disposable local environment
   when schema changes are part of the slice.

Run relevant focused tests first, then applicable existing commands:
`npm test`, `npm run test:app`, `npm run lint`, `npm run typecheck`,
`npm run prisma:validate`, `npm --workspace app run build`, and
`npm --workspace app run smoke`. Use `npm run prisma:generate` when generated
client types change. These are planned checks, not passing results.

Record commands, failures, skipped checks, source revision and residual risks.
Have Tyler walk through the replacement using the same task as the workbook.
Measure time, repeated entry, assistance and discrepancies; agree improvement
thresholds before claiming success. No measurements found yet for the replacement.

Exit gate: functional parity and intentional corrections accepted, security and
durability checks pass, material defects resolved, and the first workflow is
usable as a synthetic software slice. Passing this gate does not authorize real
patient data, production deployment or automatic hospital cutover.

## Later vertical slices — conditional expansion

Proposed dependency order; schedules and commitments remain Unknown.

| Slice | Complete workflow | Dependencies and acceptance focus |
|---|---|---|
| Episode/census reconciliation | Admission → transfer → discharge → reconciled daily census | Existing Clarity identities and approved day-count rules; no duplicate episodes or aggregate/event double counting. |
| UR exposure | Record authorization → due review → updated status → resolved exception | Qualified UR ownership; approved units versus dates; no automatic care/discharge decisions. |
| Revenue forecasting | Configure sourced rates → apply activity/assumptions → review adjustments → save forecast | Finance-approved definitions; uncovered-day/denial/bad-debt overlap; unknown rates; reproducible snapshots. |
| Staffing and cost | Import/enter shift activity → reconcile categories/cost → compare with plan | Source ownership, rate effective dates, overtime/agency/observation treatment and no duplicate hours. |
| Collections | Import posted receipts → allocate/reconcile → process reversal → report cash | Verified ledger/payment source; posting/service-period separation; unique transactions and audit. |
| Organization rollups | Reconcile multiple facilities → compare aligned metrics → export | Compatible definitions/calendars; role-aware rollups; ratios recomputed from appropriate totals. |

Each slice repeats specification, full implementation, end-to-end verification
and owner review. Integrations are separate scoped work; manual/import proof does
not establish provider connectivity. Expand custom-field types only as actual
workflows need them rather than build an unrestricted form platform upfront.

## Controlled pilot and cutover

After synthetic proof, separately establish approved hosting/identity, tenancy,
patient-data handling, retention, observability, backups/recovery and release
controls. Use the [risk register](../decisions/RISK_REGISTER.md) and existing
governance; this plan is not approval for production data.

Run a bounded parallel comparison with the existing operating process. The
designated owner reconciles differences and signs off before cutover. Preserve
the historical workbook baseline and a defined fallback. If reporting is
incorrect or inaccessible, suspend affected imports/use, preserve audit/source
records, and follow tested restoration or corrective-migration procedures;
do not erase business history to undo a release.

## Immediate next action

Tyler's subsequent answers and generated synthetic examples are recorded in the
[first-slice build contract](../product/INPATIENT_REV_OPS_FIRST_SLICE_BRIEF.md).
That brief also records a live upstream fetch and separates confirmed decisions
from proposed correction, date-label and phasing rules.

The patient-day implementation and synthetic acceptance checks are complete;
see the verification record for precise passing checks and production limitations.
Production and improvement measurements remain outside that proof.
Tyler authorized the next hospital onboarding/custom-field slice and confirmed
fields belong in both setup and data entry. Follow its
[bounded brief](../product/INPATIENT_REV_OPS_ONBOARDING_FIELDS_BRIEF.md).
That slice merged in PR #50 after review; see the
[evidence record](../testing/REV_OPS_ONBOARDING_FIELDS_VERIFICATION.md).
Census-upload reconciliation merged in PR #51 after scoped review and synthetic
verification. The next owner-approved workflow is
[month-end readiness and accountable close](../product/INPATIENT_REV_OPS_MONTH_CLOSE_BRIEF.md).
Implementation and local verification are complete; review full-calendar readiness,
selected-budget binding, receipt atomicity and preserved history before merging.
See the [evidence record](../testing/REV_OPS_MONTH_CLOSE_VERIFICATION.md).
Preserve the same sequence: architecture across the product, one complete workflow,
end-to-end proof, then expansion. No production deployment is included.
