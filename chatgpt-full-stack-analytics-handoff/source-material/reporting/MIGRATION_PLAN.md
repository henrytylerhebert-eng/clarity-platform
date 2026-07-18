# Migration Plan

## Phase 0 — Preserve and protect

1. Treat the uploaded workbook as a legacy reference artifact.
2. Do not use it as a live system of record.
3. Identify and secure PHI-bearing sheets.
4. Extract formula inventory and metric definitions.
5. Confirm with operators which formulas are still valid.

## Phase 1 — Build the data spine

Implement:

- facility
- program
- patient identity boundary
- episode
- admission event
- discharge event
- episode_day
- census_snapshot
- payer
- payer_contract_rate
- ur_authorization
- staffing_actual
- iop_attendance
- budget_line

## Phase 2 — Rebuild metrics

Implement:

- IP census metrics
- revenue projection
- UR denied/approved days
- payer mix
- IOP attendance/income
- staffing budget variance
- agency cost
- budget vs actual

Add unit tests for every metric.

## Phase 3 — Dashboards

Build:

- executive overview
- bed board
- UR dashboard
- revenue forecast
- staffing dashboard
- IOP dashboard
- intake/referral command center

## Phase 4 — Forecasting

Add:

- expected discharges
- pending admissions
- LOS assumptions
- payer mix assumptions
- denial risk assumptions
- revenue forecast
- capacity forecast

## Phase 5 — Export layer

Generate:

- Excel reports,
- PDF executive packet,
- board report,
- UR summary,
- referral/source demand report.

The export layer must consume the same API/metric layer as the dashboard.
