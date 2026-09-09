# Workbook Baseline and IOP Review Build Plan

**Status:** Authorized development — owner accepted the workbook on 2026-09-09. Synthetic patient/operating data; full workbook parity and sourced financial-rate implementation are in scope.

## Objective

Implement the accepted restored-workbook operating model in the platform. The first IOP increment is a persisted reconciliation review that can be authenticated, reviewed, closed, and audited. Public financial-rate sourcing and calculation work can proceed alongside it; full parity remains the delivery target.

This plan is based on the [workbook-to-platform workflow map](../product/WORKBOOK_TO_PLATFORM_WORKFLOW_MAP.md), its [acceptance matrix](../testing/WORKBOOK_PLATFORM_ACCEPTANCE_MATRIX.md), and the [IOP source-adapter decision packet](../product/IOP_SOURCE_ADAPTER_DECISION_PACKET.md).

## Gate 0: owner acceptance completed

Tyler explicitly accepted **Dunder Mifflin Hospital - Restored Operations 2026** on 2026-09-09 and authorized MVP/interface updates, workbook parity, and real financial-rate implementation. The [acceptance record](../product/RESTORED_WORKBOOK_ACCEPTANCE.md) identifies the accepted SHA-256 `6e81bd61950c244e607ed03f8b0f13e1a4d0bea366ee7ad7cc54c053ef90de26`; a fresh hash check matches it.

The prior prohibition on starting implementation is superseded. Earlier native mutation results belong to a different binary and remain historical. A same-artifact native rerun is still unverified; retain it as a verification task without reopening owner acceptance.

Implement against the accepted formulas and examples. Resolve substantive rule ambiguities at the affected behavior, record the chosen rule and expected result, and continue independent work.

## Synthetic IOP golden cases

| Case | Expected evidence |
| --- | --- |
| Enrollment and frequency | A participant can move from three to two to one group per week; an active program with `PENDING` census has zero enrolled participants. |
| Attendance denominator | Ten scheduled events with eight attended, one cancelled, and one no-show produce 8 attended of 9 expected. An unscheduled activity is not absent. |
| Operating activity | Two sessions, five distinct participants, ten participant units, five participant-days, and one non-group service remain distinct measures. |
| Group target | Eight attended against ten expected produces 80%; target, owner, and version are retained as configuration evidence. |
| Independent audit and charges | Activity remains recorded when a note audit or charge linkage is missing; exceptions are visible and prevent a clean close. |
| Late source change | A post-cutoff source change preserves the prior receipt and enters the next review cycle; reopening or supersession follows an approved policy. |

## Selected first implementation

Build a synthetic IOP reconciliation review that hardens and joins the existing contract, persistence, API, and preview surfaces.

Included:

- Bind each imported or reviewed snapshot to organization, facility, program, source version, cutoff, and idempotency evidence.
- Enforce program-scoped authorization for import, read, review, and close; confirm a request program matches the snapshot program.
- Replace the local typed-reviewer close path with an authenticated persisted API workflow. Retain preview status until that integration is complete.
- Define a close, reopen, and supersession policy. If no policy is approved, block reopening after close.
- Add database controls for tenant scope and append-only receipt history.
- Add fixtures and tests for every golden case and for cross-tenant, cross-facility, and cross-program access attempts.
- Record the implementation evidence and unresolved decisions in the existing decision and roadmap artifacts.

Outside this first IOP increment, but authorized in the full MVP:

- Official financial-rate sources, effective-dated payer/plan/contract applicability and deterministic payment calculations.
- Remaining workbook IP/IOP operating measures, staffing/costs, budgets, invoices, collections, forecasting, and management reporting.

Boundaries retained:

- Live clinical/operational source-system connections, credential setup, and production-record imports require their own scope. Official public rate-file acquisition and ingestion are authorized financial implementation work.
- Real PHI and production release. Synthetic note/charge linkage and financial behavior are permitted for implementation and verification.
- Autonomous clinical, compliance, financial, or placement decisions.

## Parallel financial work

Start the payer/rate lane from the accepted financial functions F07–F12, F21–F24, and F30. Record official source and effective period, preserve payer category versus product/network/contract distinctions, implement the supported payment methods, and test missing inputs, overlaps, boundary dates, and worked calculations. Private commercial terms and facility-specific factors remain required inputs where applicable. Rate support is complete only for the named, tested method and applicability; a national reference rate is not an all-payer facility reimbursement result.

Integrate those calculations with service activity as each activity slice becomes available. Budget, forecast, billed amounts, and posted collections remain independent of modeled payment. IOP completion is not a prerequisite for source acquisition or rate-engine work.

## Work packages

| Order | Package | Deliverable | Completion proof |
| --- | --- | --- | --- |
| 1 | Decision record | Approved source, cutoff, close/reopen, and reviewer-identity rules | Decision owner and status recorded in `docs/decisions/OPEN_DECISIONS.md`. |
| 2 | Contract and persistence | Program-bound snapshot, receipt, review, and exception contracts plus migration | Contract tests and migration validation demonstrate retained source and tenant fields. |
| 3 | Gateway and routes | Program authorization, idempotency, lifecycle, and audit behavior | Route and gateway tests prove forbidden scopes fail closed. |
| 4 | Client integration | Authenticated review, exception resolution, and close workflow | UI invokes persisted API and displays server-derived reviewer and lifecycle state. |
| 5 | Golden-case proof | Synthetic fixture suite and acceptance evidence | All six cases pass with reconciled counts and visible exceptions. |
| 6 | Evidence closeout | Updated map, acceptance matrix, implementation status, and handoff | Reviewer can trace each delivered behavior to a requirement and test. |

## Acceptance criteria

- A user cannot read, import, review, or close a snapshot outside their organization, facility, or program.
- Every receipt records source identifier, source version, cutoff, received time, and idempotency basis.
- Activity counts remain visible when documentation or charge linkage is incomplete; the resulting exception blocks clean closure.
- Closure is attributable to a server-derived reviewer and immutable review event.
- A closed snapshot cannot silently change; an approved reopen or supersession creates traceable successor evidence.
- The UI does not present local preview state as persisted approval.
- Every golden case has an automated contract, gateway/route, or client test appropriate to the behavior.

## Verification sequence

Run focused tests after each package, then run the repository's applicable typecheck, migration validation, and app build. Record skipped checks as unverified. No performance measurements are planned in this slice.

Before coding, re-read the workbook map, acceptance matrix, current [open decisions](../decisions/OPEN_DECISIONS.md), and [accepted workbook record](../product/RESTORED_WORKBOOK_ACCEPTANCE.md).

## Resume order

1. Use the owner-accepted workbook baseline; Gate 0 is closed.
2. Start the IOP increment and financial-rate lane; record only unresolved decisions affecting each concrete behavior.
3. Inspect the current IOP contract, repository gateway, API routes, migration, and client before editing.
4. Implement one work package at a time with its focused tests.
5. Update evidence artifacts only after the corresponding behavior and tests pass.
