# Durable Metric Definitions

These definitions translate the workbook's embedded spreadsheet behavior into a reusable metric layer.

## Inpatient metrics

| Metric | Durable Definition | Notes |
|---|---|---|
| Admissions | `count(admission_event)` grouped by date/program/facility | Replaces monthly admission blocks |
| Discharges | `count(discharge_event)` grouped by date/program/facility | Drives ALOS and throughput |
| Patient Days | `sum(episode_day.patient_day_flag)` | Use midnight census or episode-day expansion |
| ADC | `patient_days / days_in_period` | Use calendar days for IP; operating days where appropriate |
| Occupancy | `ADC / licensed_or_available_beds` | Separate licensed, staffed, and usable beds |
| ALOS | `sum(discharge_los_days) / count(discharges)` | Use discharge cohort |
| Revenue Days | Days eligible for billing based on payer/rate logic | Version by payer contract |
| Projected Revenue | `sum(revenue_days × rate)` minus rule-based adjustments | Do not hard-code rates |
| Net Projected Revenue | `projected_revenue - denial_adjustments - indigent_care - interrupted_stay_adjustments` | Match workbook intent |
| Revenue per Patient Day | `net_projected_revenue / patient_days` | Margin signal |

## UR metrics

| Metric | Durable Definition | Notes |
|---|---|---|
| Approved Days | `sum(ur_authorization.approved_days)` | By payer, physician, program |
| Denied Days | `sum(ur_authorization.denied_days)` | Track denial category |
| Denial Rate | `denied_days / requested_or_reviewed_days` | Null-safe denominator |
| Days at Risk | Patient days without active auth or with auth expiring soon | Live dashboard alert |
| Auth Expiration Risk | Auth expiration date within threshold | Useful for concurrent review queue |
| Process Denials | Denials caused by missing authorization, late review, documentation gaps | Should feed workflow improvement |

## IOP metrics

| Metric | Durable Definition | Notes |
|---|---|---|
| Enrolled Census | Count of active IOP enrollments by day | Replaces daily enrolled row |
| Attendance Days | Sum attended units/days | From attendance events |
| Average Daily Attendance | `attendance_days / operating_days` | Use schedule calendar |
| Absent Days | Sum scheduled-but-absent events | Tracks no-show burden |
| Group Count | Sum group attendance units or sessions | Align with billing model |
| IOP Revenue | Attendance/group units × payer/program rate | Versioned rates |

## Staffing metrics

| Metric | Durable Definition | Notes |
|---|---|---|
| Budget Hours | Role-based daily budget or ratio rule | May vary by census band |
| Actual Hours | Regular + overtime + agency + PRN hours | Source payroll/schedule |
| Over/Under Budget | `actual_hours - budget_hours` | By role/date |
| Agency Cost | `agency_hours × agency_rate` | Rate table, not hard-coded |
| 1:1 Observation Cost | `one_to_one_hours × applicable_rate` | Acuity burden |
| Labor per Patient Day | `labor_cost / patient_days` | Margin signal |

## Finance metrics

| Metric | Durable Definition | Notes |
|---|---|---|
| Budget Variance | `actual - budget` | By month/service line |
| Ancillary Cost | Variable patient-day cost + fixed monthly fee | Housekeeping/laundry/dietary/meals |
| Contribution View | Net revenue - variable staffing - ancillary cost | Useful next-stage margin model |
