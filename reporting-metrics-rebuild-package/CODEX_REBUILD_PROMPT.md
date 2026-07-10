# CODEX MASTER PROMPT — Rebuild Reporting Metrics Ops and Budget into Sustainable Clarity Ops Intelligence

## Mission

You are working in an existing Clarity MH / hospital-intelligence codebase.

Your job is to convert a legacy Excel workbook used for inpatient, IOP, utilization review, staffing, revenue, budget, and operational dashboard tracking into a sustainable software architecture.

Do **not** recreate the workbook as a pile of monthly spreadsheet tabs.

Build the durable system underneath it.

## Source context

The uploaded workbook was structurally analyzed and contains:

- 44 sheets,
- 3933 formula cells,
- 278 cached formula-error cells,
- monthly inpatient revenue tabs,
- monthly staffing tabs,
- monthly IOP attendance tabs,
- inpatient daily census,
- IOP daily census,
- YTD executive summary,
- admissions origin tracking,
- ancillary invoice calculations,
- budget-to-actual tracking.

The workbook appears to mix PHI-bearing patient-level rows with aggregate business metrics. Treat PHI separation as a critical architectural requirement.

## Product goal

Build **Clarity Ops Intelligence**, a dashboard/data layer for:

1. inpatient operations,
2. IOP operations,
3. centralized intake,
4. bed board tracking,
5. utilization review,
6. revenue forecasting,
7. staffing and agency cost control,
8. budget vs actual,
9. market demand intelligence.

## Critical rebuild principle

Replace monthly sheets with date-indexed fact tables.

Current anti-pattern:

- Jan Revenue, Feb Revenue, Mar Revenue...
- Staffing January, Staffing February...
- Jan IOP Attend, Feb IOP Attend...

Target:

- `episode`
- `episode_day`
- `admission_event`
- `discharge_event`
- `census_snapshot`
- `iop_attendance`
- `ur_authorization`
- `revenue_event`
- `staffing_actual`
- `budget_line`
- `metric_snapshot`

## Guardrails

1. Do not store patient names in executive/business dashboards.
2. Do not use real PHI in seed data.
3. Do not hard-code payer rates inside UI components.
4. Do not hard-code monthly logic.
5. Do not claim formulas are clinically or financially validated until a human operator verifies them.
6. Build a tested metric layer.
7. Every metric should have a clear numerator, denominator, period, facility, program, and source table.
8. Preserve export-to-Excel as an output layer, not as the source of truth.

## First task

Inspect the repository and report:

1. framework,
2. database/ORM,
3. current dashboard routes,
4. existing Clarity MH entities,
5. existing auth/RBAC,
6. current test setup,
7. where this ops-intelligence module should live.

Then implement the smallest useful vertical slice:

### Phase 1 vertical slice

Build:

- schema/types for facility, program, episode, episode_day, payer, ur_authorization, revenue_event, census_snapshot;
- seed demo data only;
- metric functions for admissions, discharges, patient days, ADC, occupancy, ALOS, projected revenue, denial rate;
- an executive dashboard route;
- a simple UR work queue route;
- tests for each metric.

## Required files to create or update

Recommended paths:

```text
/docs/ops-intelligence/
  workbook-reverse-engineering.md
  metric-definitions.md
  data-model.md
  dashboard-modules.md
  phi-boundary.md

/src/lib/ops-intelligence/
  metrics.ts
  schemas.ts
  seed.ts

/src/app/ops-intelligence/
  page.tsx

/src/app/ops-intelligence/ur/
  page.tsx
```

Adapt paths to the existing repo framework.

## Minimum metrics to implement

- admissions
- discharges
- patient days
- ADC
- occupancy
- ALOS
- payer mix
- approved days
- denied days
- denial rate
- projected revenue
- net projected revenue
- agency cost
- IOP attendance days

## Data model

Use `SCHEMA_BLUEPRINT.sql` and `SUSTAINABLE_MODEL_ARCHITECTURE.md` from this package as the implementation guide.

## Acceptance criteria

1. Tests pass.
2. Demo seed data contains no real names or PHI.
3. Dashboard renders key metrics.
4. Metric functions are null-safe.
5. Denominator-zero cases return null or 0 by explicit policy, not `#DIV/0`.
6. No formula references are hard-coded to a month sheet.
7. Payer rates are versioned in data.
8. UR denied days and approved days are tracked as structured records.
9. Bed/census logic is separate from revenue logic.
10. Export design is documented but not required in Phase 1.

## Final response from Codex should include

1. What was implemented.
2. Files changed.
3. How to run.
4. How to test.
5. Any assumptions.
6. Next issues.
