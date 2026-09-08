# Rev Ops — operational census receipt review and export

Status: implementation authorized by Tyler, September 8, 2026; local synthetic
verification complete; pending review. Not merged, deployed or authorized for a real-hospital pilot.
Baseline: PR #52 (`c9a00bd`). Evidence: [verification record](../testing/REV_OPS_EXPORT_VERIFICATION.md).

## Goal and workflow

For one hospital/unit and month, select an existing original or revised closing
receipt, review its recorded facts, then download a values-only Excel workbook.
Reopening and correcting the month preserves prior receipts. This is an operational
census report; budget, actual activity, forecast and collections remain separate.

1. An administrator explicitly grants `receiptExport` for the workspace, including
   to themselves if needed. Viewing/managing the workspace alone does not grant it.
2. Open the latest closing receipt from Comparison, or a previous receipt in History.
3. Review the server projection and observed current/superseded/reopened status.
4. Download using the reviewed receipt hash and workspace revision. Stale reviews
   require refreshing; revoked authority prevents delivery.
5. Repeat after correction/reclose, or select the preserved original.

## Metric decision (OD-15)

Tyler approved the following definition for future receipts:

```yaml
metric_code: DAILY_MIDNIGHT_CENSUS
metric_label: Daily Midnight Census Count
definition_version: '1.0'
definition: >-
  Number of inpatients assigned to the selected hospital/unit at the facility's
  designated local midnight census time, attributed to the calendar day that just ended.
timezone: America/Chicago
census_local_time: '00:00'
service_date_rule: PRIOR_CALENDAR_DAY
```

The synthetic example uses America/Chicago. Each new receipt snapshots its actual
configured workspace timezone, historical hospital/unit identity and this first-class
metric object. Monthly actuals are labeled **Sum of Daily Midnight Census Counts**.
Legacy receipts without the object disclose **Definition not recorded**, including
when compared with a new receipt. No historical definition is backfilled.

Hospital-specific rules remain independently unknown: included statuses,
observation, leave/pass, transfer-at-midnight, unit assignment, midnight admission/
discharge and temporary closure. The snapshot retains separate `inclusion_rule_version`,
`effective_from` and rule slots as null, with `validation_status: unverified`.
This slice does not provide a rule editor, effective-date registry or encounter
counting engine. Unsupported future metric contracts fail export validation until
explicitly supported. Hospital validation is required before claiming equivalence
to inpatient service days, billed days or revenue measures.

## Budget decision (OD-16)

Retain the existing approved-budget selection behavior. Export the exact budget
saved in the receipt, including its daily targets; never recalculate or substitute
a later approval. Actual-minus-budget variance and percentage are arithmetic only;
a zero budget has no variance percentage. The workbook explicitly discloses that
the budget has no independently validated metric contract.

Predecessor-budget inheritance, separate baseline-change reasons and independent
approval remain proposed future policy, not silently implemented here.

## Export controls (OD-17)

- Current tenant, facility, active identity, view and explicit export permission
  are checked by the server. Session and workspace grants are checked again before
  delivery; stale workspace revision rejects generation/delivery.
- Export does not mutate census revisions. Existing AuditEvent persistence records
  `requested`, `generated_delivery_authorized` and `failed`, with server-generated
  request ID, actor, receipt identity/hash, template, timestamp and output byte count
  when available. No event claims the file was opened or retained. Audit failure
  prevents delivery. A process crash may leave a request without a terminal event.
- No persistent output files, public URLs or export cache. Responses are no-store.
  Files saved by the browser are outside server control.
- Allowlist: historical hospital/unit names, IDs, dates, numeric counts/targets,
  approvals and actor IDs, source kinds/checksums/physical row references.
  Source filenames, paths, free-text reasons and all custom-field values/labels
  (including cost center) are withheld. Complete source receipts remain unchanged.
- Literal cells only: no formulas, hyperlinks, macros, hidden sheets, external
  connections or embedded sources. Dates are typed Excel dates; UTC cutoffs are
  explicitly labeled. Zero is a value, not missing data.
- Source hash: SHA-256 of recursively key-sorted JSON with array order preserved,
  including withheld fields. It identifies recorded content, not authenticity or
  byte-identical XLSX files. Observation/export metadata can differ across requests.
- Receipt JSON capped at 262,144 bytes in SQL before transfer. Recursive limits:
  20,000 nodes, depth 16, 128 array entries/object keys, 4,096 bytes per string.
  Complete 28/29/30/31-date receipts required; maximum 4,096 output cells and 1 MiB
  XLSX. Oversize/malformed historical data fails without truncation.
- Synchronous generation: at most two active exports per API process and one per
  tenant within that process. A generation exceeding ten seconds is rejected after
  generation; this is not worker cancellation or a distributed limiter.
- Reuses JSON receipts, existing tenant transactions and AuditEvent writer. No
  migration, new service or dependency. Audit retention/privileged tamper protection,
  distributed throttling and real-data field classification remain production gates.

## Workbook layout

| Sheet | Content |
|---|---|
| Summary | Metric, actual/budget/variance, percentage, calendar completeness, explicit zeros, observed status and scope disclosures |
| Daily activity | Service date, count, value/explicit-zero state, revision, UTC cutoff, actor/time and safe source reference |
| Selected budget | Saved budget ID, amount, approval, source and captured daily targets |
| Closing receipt | Historical identity, metric definition/rule unknowns, original revision and hash; separately labeled observed context |
| Sources | Safe aliases, kinds and checksums; raw names withheld |
| Revision comparison | Predecessor/selected actuals, budgets, variances and changed dates; separate metric disclosures |
| Export event | Requester, request ID, generation time and delivery limitation |

Revision comparison appears only when a saved predecessor exists. Legacy periods
without receipts cannot provide historical exports and retain the existing explanation.

## Acceptance and remaining gate

Synthetic February 2028: original 280 actual / 290 budget / -10 variance, February
29 explicitly zero; revised 285 / 290 / -5 with February 29 five. Original facts and
hash survive reclose, repeated export and restart. Cover legacy definitions, zero
budget, complete calendars, tenant/revocation denials, malformed/oversize receipts,
literal spreadsheet text, failed audit and desktop/mobile download. See the linked
evidence record for checks actually run and limitations.

The previously revised offline sample used three legacy receipts and 86 daily rows;
its absent metric definitions remain absent. Runtime exports are separate artifacts.

Review authorization, snapshot fidelity, bounds and audit outcomes before merge.
No forecasts, collections, patient-level data, accounting integration, multi-hospital
rollups, new approval hierarchy, deployment or real-hospital pilot. No measurements
found for efficiency gains or error reduction.
