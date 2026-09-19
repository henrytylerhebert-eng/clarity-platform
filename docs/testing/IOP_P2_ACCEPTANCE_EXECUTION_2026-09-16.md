# P2 synthetic IOP acceptance execution — 2026-09-16

**Revision:** `81fe4bff63c4f8130cdfa50f93e4aabd367a5111`
**Data boundary:** synthetic/de-identified only. No external source, credentials, connector, PHI, or production environment was used.

This is an execution record for the Phase 2 scenarios in the [workbook platform acceptance matrix](WORKBOOK_PLATFORM_ACCEPTANCE_MATRIX.md). A passing unit, UI, or gateway test is credited only for the behavior it directly demonstrates. It does not promote a scenario to accepted parity when its required records or controls are absent.

## Evidence run

| Command | Result | Demonstrated scope |
| --- | --- | --- |
| `npm test -- --run tests/unit/iop-reconciliation-sample.test.ts tests/unit/iop-reconciliation-import.test.ts` | Passed: 5 tests | Synthetic source-link gaps, one reviewed exception per gap, orphan downstream event visibility, cutoff retention, and close rejection when an exception is missing. |
| `npm --workspace app test -- IopReconciliation.test.tsx` | Passed: 2 tests | Browser client blocks submission without a verified session; mocked API flow displays reviewed synthetic close evidence. This does not prove HTTP connectivity. |
| `npm run test:ephemeral -- node node_modules/vitest/vitest.mjs run tests/integration/iop-reconciliation-persistence.test.ts` | Passed: 3 tests | Fresh local PostgreSQL migrations, idempotent synthetic import, authenticated exception review/close, underprivileged denial, and non-revealing cross-tenant denial. |

Fixture hashes used by the unit tests:

| Fixture | SHA-256 |
| --- | --- |
| `docs/product/evidence/IOP_ATTENDANCE_RECONCILIATION_SYNTHETIC_SAMPLE.json` | `955b5ff9af32d5c9f146c8fcb0af94ab39bf4b02ad56959a8e4dba1cb8bfa3c7` |
| `docs/product/evidence/IOP_ATTENDANCE_RECONCILIATION_SYNTHETIC_IMPORT.json` | `d10b66707c3e23be5578e4f2d7722fdc6d3d5acfb41244caac0678487f0f20ab` |

## Scenario outcomes

<a id="at13"></a>
### AT13 — enrollment and prescribed-frequency history

**Outcome: EXECUTED_BLOCKED.** The synthetic fixture and contract retain enrollment references and surface missing plan linkage, but the current model does not hold effective-dated 3 → 2 → 1 prescribed-frequency history, structured expected occurrences, or inpatient-to-IOP step-down relationships. The complete matrix stimulus therefore cannot run. No clinical frequency decision is inferred.

<a id="at14"></a>
### AT14 — attendance denominator and calendar reconciliation

**Outcome: EXECUTED_BLOCKED.** The existing tests prove attendance/link exceptions and reviewed closure behavior, but there is no controlled expected-schedule model against which to execute 8 attended, 1 cancelled, and 2 no-show events. An unscheduled enrolled person cannot be evaluated as required. The UI test is a mocked API client test and does not close this gap.

<a id="at15"></a>
### AT15 — sessions, participant units, patient-days, and group target

**Outcome: EXECUTED_BLOCKED.** The reconciliation contract distinguishes attendance links from note, charge, and EMR-billable evidence. It does not implement the required session aggregate, participant-unit totals, configurable group target with owner/version, or the invalid `group units > total services` rejection. The 2-session / 5-service / 80% target scenario cannot run.

<a id="at16"></a>
### AT16 — payable meal quantities

**Outcome: EXECUTED_BLOCKED.** The current IOP model has no delivered-meal, reviewed-nonpayable, or contract-eligibility records. The 12 delivered minus 2 reviewed-nonpayable arithmetic and negative/over-delivered rejection cannot run. Workbook arithmetic is not treated as payment authorization.

<a id="at34"></a>
### AT34 — documentation, charge, and EMR reconciliation close

**Outcome: EXECUTED_PARTIAL_NOT_ACCEPTED.** The evidence run proves that a synthetic import records stable source/cutoff data, unresolved exceptions block close, authenticated reviews are retained, and cross-tenant/underprivileged operations fail closed. The browser test also prevents unauthenticated submission, but its API is mocked.

The complete scenario remains unaccepted because program-scoped authorization is not implemented, an audit author versus independent reviewer is not modeled or tested, and director/program grants remain undecided. A reviewed exception does not create a billable, compliance determination, or source-system fact.

## Runner repair discovered during execution

The first isolated run applied all migrations and passed its three assertions, then failed in teardown because the ephemeral runner generated Prisma from `prisma/schema.prisma` only. The repository's canonical Prisma configuration is the multi-file `prisma/` directory, where `assurance.prisma` defines the migrated assurance models referenced by the common test harness. Revision `81fe4bf` corrects the runner and local migration-recovery command to use that directory. The rerun passed and cleaned up its temporary database.

`tests/unit/ephemeral-database-runner.test.ts` has one remaining local failure in its SIGINT lifecycle assertion: macOS returned `kill EPERM` when the test tried to signal its process group. Fourteen tests in that file passed. This is separate from the schema repair and is not counted as acceptance evidence. `npm run typecheck` remains blocked by missing local `react-router-dom` types in unrelated app files.

## Decision boundary

No real-source decision follows from this record. The next eligible work is to implement and test the missing synthetic records and controls for AT13–AT16 and the remaining AT34 conditions; source ownership, privacy, program authorization, and tenancy/RLS approvals remain required before any real import.

## Follow-up synthetic-contract validation — 2026-09-19

The operational-record contract was extended and verified with:

```bash
npm test -- --run tests/unit/iop-operational.test.ts
```

Result: **1 test file / 3 tests passed.** The scenario retains an ended IOP
episode, an inpatient interval, an IOP return, and effective-dated 3 → 2 → 1
plan versions. It also represents two enrolled participants, an active pending
referral, eleven scheduled visits (8 attended, 1 approved cancellation, 2
no-shows), one unscheduled person, two sessions/five service units, the
8-of-10 group planning target, and 12 delivered minus 2 reviewed-nonpayable
meals.

The contract now rejects a predecessor from another person, plan use outside
its effective range, inconsistent scheduled/unscheduled outcomes, and services
that do not reconcile to an attended visit at the same enrollment and date.
Group units are derived only from positive service lines and are therefore a
subset of total service units by construction. These are synthetic contract
controls; they do not determine clinical frequency, eligibility, staffing,
payment, billing, or source truth.

AT13–AT16 remain **EXECUTED_PENDING_OWNER_ACCEPTANCE**. This follow-up does
not establish a production attendance grid, controlled operational writeback,
real-source provenance, or the AT34 documentation/charge/billable review
controls.


## Follow-up AT34 synthetic-control validation — 2026-09-19

The persisted synthetic workflow now stores a distinct stable `auditId` for
each note-audit record. The import contract requires that audit ID to have its
own `NOTE_AUDIT` source record/version; it no longer treats a note ID as audit
source identity. A focused unit run (8 tests) and an isolated migrated
PostgreSQL run (5 tests) prove that a self-reviewed audit remains an explicit
`note_audit_not_independent` exception, its author/reviewer/record identities
are retained, a compliance reviewer can record a reviewed exception, and that
reviewer cannot import or close. An organization admin can close only after the
exception review, with the authenticated closer and source cutoff retained.

AT34 remains **EXECUTED_PARTIAL_NOT_ACCEPTED**. The browser test still mocks
the API client, program-grant authority remains a recorded decision, and no
real source, connector, provider-backed program grant/RLS proof, clinical
compliance decision, or billable/payment inference was made.
