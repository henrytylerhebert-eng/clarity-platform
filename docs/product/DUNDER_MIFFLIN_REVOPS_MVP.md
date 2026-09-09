# Dunder Mifflin Hospital RevOps MVP

**Status:** Implemented local synthetic prototype boundary. This document does not accept the workbook baseline, authorize a live connector, or approve production use.

## MVP outcome

Give a Dunder Mifflin Hospital operations team one reviewed monthly operating loop: configure a hospital/unit, set an approved patient-day budget, record or import daily midnight census actuals, compare activity with the budget, review staffing hours, and close or reopen the period with retained receipt history.

The MVP uses the restored [Dunder Mifflin Hospital – Restored Operations 2026](../product/WORKBOOK_TO_PLATFORM_WORKFLOW_MAP.md) as operating-model evidence. The exact workbook baseline still requires the hash, recalculation, reopen, and mutation gate in the [build plan](../roadmap/WORKBOOK_BASELINE_IOP_REVIEW_BUILD_PLAN.md).

## Included workflow

| Step | User result | Evidence retained |
| --- | --- | --- |
| 1. Configure | Administrator creates a synthetic hospital/unit, timezone, cost-center field, and delegated access. | Workspace version and permission history. |
| 2. Set budget | Finance enters or imports a monthly patient-day target and approves a version. | Approved baseline, source metadata, and approval identity. |
| 3. Record activity | Census owner enters or imports daily midnight patient-day actuals and corrects mistakes with a reason. | Actual history, source, cutoff, actor, and correction reason. |
| 4. Review | Team sees full-month and phased budget comparisons plus staffing-hours comparison. | Selected period, approved budget version, completeness, and comparison result. |
| 5. Reconcile and close | Reviewer resolves import differences, closes a complete period, reopens only with permission, and exports a receipt. | Immutable close/reopen and export history. |

## Explicit boundaries

The MVP keeps these facts separate:

- **Actual activity:** observed daily patient days.
- **Budget:** approved monthly patient-day target and daily phasing.
- **Staffing:** supplied hours against an approved hours-per-census target.

Forecast, collections, payer-plan rates, claim adjudication, clinical documentation, IOP note audits, charge slips, and real-source imports are not part of this MVP. A blank, incomplete, or unavailable source is not treated as zero.

## Workbook connection

The MVP directly supports the first verified operating path in the workbook map: daily census/patient-days, monthly actual-versus-budget comparisons, staffing-hours comparison, source-aware reconciliation, and reviewed close history. It is not full workbook parity.

The next expansion remains the synthetic persisted IOP review slice: enrollment/frequency, attendance, activity, independent note audit, charge-linkage exceptions, and controlled close behavior. It starts only after the workbook acceptance gate and owner decisions are complete.

## Acceptance checks for this MVP

- A workspace is isolated to the verified organization and delegated hospital/unit permissions.
- An approved budget is immutable; amendments create a later version.
- Daily actuals retain source, cutoff, actor, and correction history.
- Incomplete periods and unresolved reconciliation exceptions prevent a clean close.
- A close, reopen, and export preserve receipt history and server-derived reviewer identity.
- The interface identifies this as a synthetic Dunder Mifflin Hospital proof, not a live financial or clinical system.
