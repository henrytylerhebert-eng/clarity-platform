# Workbook Baseline and IOP Review Build Plan

**Status:** Planned. Synthetic-only. No runtime implementation authority.

## Objective

Accept one exact restored-workbook baseline, approve synthetic IOP golden cases, then build the smallest durable platform loop: a persisted IOP reconciliation review that can be authenticated, reviewed, closed, and audited.

This plan is based on the [workbook-to-platform workflow map](../product/WORKBOOK_TO_PLATFORM_WORKFLOW_MAP.md), its [acceptance matrix](../testing/WORKBOOK_PLATFORM_ACCEPTANCE_MATRIX.md), and the [IOP source-adapter decision packet](../product/IOP_SOURCE_ADAPTER_DECISION_PACKET.md).

## Gate 0: accept the workbook baseline

No platform implementation begins until all of the following are recorded against the same file hash:

1. Select the review workbook and decide whether empty `Sheet1` and `Sheet2` remain in the governed artifact.
2. Recalculate, save, reopen, and formula-scan that exact file.
3. Rerun the restored-input mutation cases against that same file.
4. Have the IOP owner approve the expected results for the synthetic cases below.
5. Select the bounded first implementation gap.

The concurrent restored-workbook acceptance packet in the main checkout currently records a hash mismatch between the candidate workbook and earlier native mutation evidence. Resolve that mismatch before treating the baseline as accepted.

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

Not included:

- Real source connectors, imports, credentials, or production data.
- PHI, notes, charges, billing, reimbursement, payroll, cash, forecasting, or production release.
- Autonomous clinical, compliance, financial, or placement decisions.

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

Before coding, re-read the workbook map, acceptance matrix, current [open decisions](../decisions/OPEN_DECISIONS.md), and the accepted workbook packet in the main checkout.

## Resume order

1. Resolve Gate 0 against the current candidate workbook hash.
2. Record the owner decisions required for the selected IOP review behavior.
3. Inspect the current IOP contract, repository gateway, API routes, migration, and client before editing.
4. Implement one work package at a time with its focused tests.
5. Update evidence artifacts only after the corresponding behavior and tests pass.
