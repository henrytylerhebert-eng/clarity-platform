---
status: needs-cross-functional-decision
data_boundary: synthetic-only
implementation_effect: none
related_artifacts:
  - docs/product/IOP_SOURCE_INVENTORY_AND_PERMISSION_MATRIX.md
  - docs/product/IOP_AUTHENTICATED_SOURCE_IMPORT_PATH.md
  - docs/product/IOP_ATTENDANCE_HANDOFF_VALIDATION.md
---

# IOP source-adapter decision packet

## Decision requested

Before any non-synthetic import is designed, name the authoritative export for each IOP handoff, approve its source owner, and confirm that its IDs, versions, and cutoff semantics can support reconciliation. A source file alone is not approval to import.

This packet approves no connector, credential, patient data, clinical finding, charge, or billing action.

## Current baseline

The implemented local path accepts only the `SYNTHETIC_IOP_PROGRAM` integration. It requires stable source record IDs and versions for each represented enrollment, plan, attendance event, note audit, charge line, and EMR billable line. It records authenticated review and close evidence, but it is not approved for real data.

## Source authority decisions

| Handoff | Required authoritative source | Decision owner | Required decision | Status |
|---|---|---|---|---|
| Enrollment and treatment-plan version | `[Unknown] EHR/program export` | IOP operations + clinical informatics | Name system, report/API, owner, and update cadence | Open |
| Attendance and group participation | `[Unknown] attendance/EHR export` | IOP director + operations | Confirm event-grain source and therapist/group attribution | Open |
| Therapist note and independent audit | `[Unknown] documentation/audit export` | Documentation compliance | Confirm finalization, audit result, reviewer, and audit-time source | Open |
| Charge line | `[Unknown] charge/EMR export` | Revenue cycle | Confirm charge status, service-line mapping, unit, and source ownership | Open |
| EMR billable result | `[Unknown] EMR/RCM export` | Revenue cycle + finance systems | Confirm posted/held/denied semantics and posting-time source | Open |

## Adapter admission requirements

Each proposed source must supply the following fields without using patient names, note text, coverage identifiers, or credentials in the import payload.

| Entity | Required stable ID | Required version or timestamp | Required linkage | Required status/time |
|---|---|---|---|---|
| Enrollment | source enrollment ID | admission/update version or time | program ID | admission date, active/closed state |
| Treatment plan | source plan ID | plan version and effective range | enrollment ID | prescribed days/sessions and plan status |
| Attendance | source attendance ID | event update version or time | enrollment ID, plan ID, group/therapist ID | service date/time and outcome |
| Note audit | source note/audit ID | note/audit version or time | attendance ID | finalization, audit status, reviewer, reviewed time |
| Charge | source charge-line ID | charge update version or time | attendance ID and note/audit ID | units, service mapping, charge status |
| EMR billable | source billable-line ID | posting/update version or time | charge-line ID | posted/held/denied state and posting time |

The source owner must demonstrate that each ID is immutable within the source, or document its replacement/supersession behavior. A mutable display identifier is insufficient.

## Cutoff contract

For every accepted snapshot, the source owner must define:

1. `exportedAt`: when the export became available.
2. `cutoffAt`: the latest source update guaranteed to be included.
3. Timezone and daylight-saving handling for service, documentation, charge, and posting times.
4. Whether late notes, late charges, reversals, and corrected billable lines appear as new versions or overwrite prior records.
5. The expected lag between attendance, final note, independent audit, charge, and billable posting.

Clarity will reject a cutoff later than the export time. It will not infer that an absent downstream record is fraudulent, noncompliant, or unbillable; the source owner must supply an explicit lag, hold, denial, correction, or exception state.

## Identity, authorization, and security gates

| Gate | Required evidence | Approver | Status |
|---|---|---|---|
| Source-owned service identity | Named integration principal, tenant binding, rotation and revocation procedure | Security + source owner | Open |
| Program-scoped access | Role-to-facility/program authorization matrix, including IOP director responsibility | Operations + compliance | Open |
| Database tenancy | RLS policy and tenant-context tests for imports, reviews, and receipts | Security + technical lead | Open |
| Data-minimization review | Field allowlist; confirmation that no note text or direct identifiers are imported | Privacy/security | Open |
| Retention and audit policy | Retention period, immutable audit controls, and incident-access procedure | Privacy + compliance | Open |

No shared API key, spreadsheet password, browser-selected role, or source-file tenant claim satisfies these gates.

## Bounded acceptance exercise

After the decisions above are approved, run one de-identified or synthetic program-day exercise. It passes only if:

1. Every represented entity maps to a source-owned ID and version/update marker.
2. A documented cutoff and timezone produce repeatable results.
3. Attendance links to the applicable treatment-plan version and group/therapist attribution.
4. Each attended event reaches either a completed note audit and charge/billable link or an explicit reviewed exception state.
5. A repeat of the identical source snapshot is idempotent; a changed source version produces a distinct reviewable result.
6. Tenant and program denial tests pass before and after close.
7. The close receipt records its reviewer, source cutoff, issue count, and reviewed-exception count.

## Required approval record

| Approval | Name | Date | Evidence link | Decision |
|---|---|---|---|---|
| IOP operations source ownership | `[Unassigned]` | `[Unrecorded]` | `[Unrecorded]` | Pending |
| Revenue-cycle charge/billable semantics | `[Unassigned]` | `[Unrecorded]` | `[Unrecorded]` | Pending |
| Security/privacy data and identity gate | `[Unassigned]` | `[Unrecorded]` | `[Unrecorded]` | Pending |
| Technical tenancy/RLS gate | `[Unassigned]` | `[Unrecorded]` | `[Unrecorded]` | Pending |

Until all four approvals are recorded, the product remains synthetic-only and no real adapter work may begin.
