# Reporting Metrics Ops + Budget Rebuild Package

Prepared for the Clarity MH / hospital intelligence rebuild.

This package reverse-engineers the uploaded workbook at a structural level and translates it into a sustainable operating model for inpatient, IOP, utilization review, bed board, revenue, staffing, and executive dashboard use.

## Files

- [Inpatient Rev Ops product definition](../docs/product/INPATIENT_REV_OPS_PRODUCT_DEFINITION.md) — product scope grounded in Tyler's ten-year operating experience, shared architecture, user workflows and the first complete software replacement slice.
- `INPATIENT_REV_OPS_CANDIDATE_REQUIREMENTS.md` — candidate synthesis of the operational workbook and FY22 sample budget: separate budget, actual activity, forecast and collections; hospital onboarding, custom fields, ownership and acceptance checks. Documentation only, not implementation authorization.
- `REPORTING_METRICS_REVERSE_ENGINEERING.md` — what the workbook currently does, where the logic lives, and what breaks.
- `SUSTAINABLE_MODEL_ARCHITECTURE.md` — target architecture, data model, metric layer, and dashboard modules.
- `CODEX_REBUILD_PROMPT.md` — paste this into Codex when you are ready to implement.
- `SCHEMA_BLUEPRINT.sql` — relational schema starter.
- `METRIC_DEFINITIONS.md` — durable formula definitions.
- `DASHBOARD_MODULES.md` — dashboard rebuild plan.
- `MIGRATION_PLAN.md` — phased rebuild sequence.
- `sheet_summary.csv` — workbook sheet audit.
- `sheet_dependency_edges.csv` — formula dependency map.
- `formula_inventory.csv` — formula-only inventory. No raw patient values included.
- `reporting-metrics-rebuild-audit.xlsx` — spreadsheet audit workbook.

## Important PHI note

The source workbook appears to contain patient-level rows in revenue, admissions, and IOP attendance tabs. This package does **not** reproduce raw patient names or row-level patient values. The rebuild should separate PHI-bearing clinical data from de-identified business intelligence.
