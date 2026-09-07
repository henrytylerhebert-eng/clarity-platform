# Rev Ops — reconcile a conflicting census upload

Status: **proposed, documented only; not approved for implementation**.
Prepared September 7, 2026 at merged baseline `c5e4113` (PR #50).
Owner: Tyler. This request authorizes definition of the next workflow only.

## Goal and relevant context

A census reviewer resolves a changed count or custom value in an uploaded file
without retyping accepted source data into a separate correction form.

Current code detects count and metadata conflicts and blocks import confirmation:
[import parser](../../packages/api-service/src/revOpsImport.ts),
[import UI](../../app/src/workspaces/RevOps.tsx). Accountable correction already
exists in the [domain service](../../packages/rev-ops-service/src/index.ts).
PR #50 added custom-field snapshots and verified import/replay boundaries; see
its [verification record](../testing/REV_OPS_ONBOARDING_FIELDS_VERIFICATION.md).
The [product definition](INPATIENT_REV_OPS_PRODUCT_DEFINITION.md), sections 7 and 9,
calls for reconciled census and accountable handling of conflicting sources.

This is the recommended next priority based on that concrete workflow gap.
The owner has not yet approved its priority or the proposed rules below.
No measurements found for time saved or error reduction.

## Complete workflow and roles

**Upload → compare with saved actuals → decide each conflict → confirm once →
inspect comparison and history → repeat upload safely.**

| Responsibility | Workflow point | Proposed behavior |
|---|---|---|
| Census staff with `actualEnter` | Daily reconciliation after the midnight census, or later receipt of a revised file | Upload one CSV/XLSX for one hospital/unit and selected month; inspect validation and disagreements. |
| Reviewer with both `actualEnter` and `actualCorrect` | Before accepting any batch containing conflicts | Compare current and incoming values, choose each outcome and record reasons. Admin may delegate these existing permissions. |
| Authorized viewer | After commit or during reconciliation | Read counts, metadata, sources, decisions and report results within existing workspace access. |
| Authorized period manager | If the selected month is closed | Use the existing reasoned reopen process before a new reconciliation can commit. |

No new role or separate approver is proposed. Uploaders without correction
authority may inspect conflicts but cannot resolve/commit a conflicting batch,
including one whose decisions all retain current values. A reviewer can reopen
the original local file in their own authorized session; a persistent assignment
queue or stored draft-review handoff is outside this slice.

## Required work and proposed decision rules

Show a readable table containing date, physical source row, saved count/custom
values, incoming count/custom values, source names and classification. Use field
labels and option labels, with historical versions available for inspection.

| Row class | Available outcome |
|---|---|
| New | Insert the validated incoming actual. Blank is invalid; an explicit zero is a real recorded day. |
| Unchanged | Preserve the existing actual and its source; create no actual revision. |
| Conflict: count, metadata or both | No default. Choose **Keep saved values** or **Use uploaded values** and enter a trimmed reason of 3–1,000 characters. |
| Invalid | Correct the source/mapping and preview again. It cannot be skipped or accepted using a conflict decision. |

Decisions apply to the entire incoming row, including its mapped active custom
fields. The first version has no cell-by-cell merge, editable replacement values
or bulk accept-all. Display omitted optional active values as blank/cleared;
using that row may clear them and must be treated as a metadata conflict.
Required values, field scope, retired options and read-only archived values
follow the existing shared validator. Invalid values cannot be bypassed by
choosing to keep the saved row.

Keep saved values leaves the actual count, metadata, source and revision intact.
Record the incoming candidate, reason and retaining decision in the batch audit.
Use uploaded values invokes existing correction rules, including for a metadata
change with the same count. Preserve the previous actual and append the new
revision with reviewer, reason, original file hash, sheet, row and field mapping.
Days absent from the file remain untouched; absence never deletes or zeroes them.

## Confirmation, persistence and server controls

Before confirmation show insert, correction, unchanged and retained-conflict
counts, expected patient-day change and unresolved/invalid row counts. Enable
confirmation only when every row is valid and every conflict has a decision and
reason. Cancel/leave before confirmation writes no actuals, accepted-import
marker or journal entry. Preview choices are not saved across reload in this slice.

The server reparses the bounded original input and recomputes the plan. It must
not trust client-supplied classifications, saved values, derived totals, actor,
tenant or proposed correction commands. Bind row decisions to source identity,
physical row/date and the preview workspace revision. Reject unknown, duplicate
or missing decisions. A changed source, mapping, definition, grant, actual or
period state requires a fresh review; do not silently carry choices forward.

Commit all new actuals, corrections, keep decisions, the accepted-import marker
and batch receipt in one existing tenant transaction. Any validation, permission,
closed-period, stale-revision or concurrency failure writes none of them. The
receipt includes actor/time, source hash, worksheet, mappings, per-row outcome
and reason, affected actual revisions and resulting workspace revision.

An accepted file/mapping identity remains a no-op on repeat upload after later
corrections, field changes or period closure. Return the original receipt when
available, clearly labeled already reconciled; never apply new choices to that
accepted batch. Check current access/import permissions before returning it.
Preserve existing PR #49/#50 replay keys and behavior; older imports without a
reconciliation receipt must remain valid no-ops. Automatic versus explicit-empty
mapping must retain their distinct meanings. Review key compatibility explicitly.

## Architecture and implementation boundary

Extend the existing contracts, import parser/routes, Rev Ops service, gateway,
UI and append-only journal. Preserve existing file/ZIP/worksheet limits and
validate unused sheets. The new reconciliation path is limited to one workspace,
one selected month and at most the existing 366-row import limit. Existing normal
imports and manual corrections remain available.

Distinguish invalid rows from valid conflicts explicitly; do not infer validity
by matching human-readable error strings. Reuse the shared field validator and
existing correction operation. Do not duplicate patient-day math or create a
parallel actuals store. Candidate input and review decisions become actuals
only at authorized commit; retained/rejected incoming values stay audit evidence.

Exact command/route shape and receipt storage are implementation-design work
after scope approval. No API contract, service, integration, database schema or
migration is added by this brief. Prefer the existing gateway/journal; if durable
receipt storage needs a schema change, review the forward migration and recovery
path before implementation. Do not edit previously applied migrations.

## Synthetic acceptance example

Use a fresh Scranton–Pawnee Geriatric workspace, America/Chicago, February 2028,
approved budget 290 and even daily target 10. Initial February 1–7 counts are
9, 10, 11, 10, 12, 8, 10: total 70. Each has `Census review = Reconciled`.
The candidate is a new, not previously accepted, eight-day file.

| Date(s) | Saved → incoming | Decision / expected result |
|---|---|---|
| Feb 1–4 | Identical counts and metadata | Four unchanged rows; no actual revisions. |
| Feb 5 | 12/Reconciled → 12/Pending | Use uploaded values; reason `Review reopened after source reconciliation`. History counts `[12,12]`; metadata snapshots differ. |
| Feb 6 | 8/Reconciled → 9/Reconciled | Use uploaded values; reason `Signed census corrected`. History counts `[8,9]`. |
| Feb 7 | 10/Reconciled → 12/Reconciled | Keep saved values; reason `Duplicate beds in source report`. Count stays 10; actual history unchanged; decision audited. |
| Feb 8 | Missing → 4/Reconciled | One new recorded day. |

Receipt: **1 inserted, 2 corrected, 4 unchanged, 1 retained conflict**.
Through February 7: actuals **71**, phased target **70**, phased variance **+1**,
full-month variance **−219**. Through February 8: actuals **75**, phased target
**80**, phased variance **−5**, full-month variance **−215**. Budget stays **290**.
Repeating the candidate adds no revisions and keeps February 7 at 10.
After a later authorized manual correction of February 6 to 10, repeating the
accepted candidate must retain 10, not restore 9.

## Done when and verification plan

The implemented workflow must pass the complete example through UI, real API,
database and restart, including readable receipt/history on desktop and mobile.
Add focused cases for missing/short reasons, unresolved conflicts, zero versus
missing, optional-field clearing, required fields, archived values, ambiguous
mappings, malformed/formula/oversized worksheets, duplicate dates and wrong scope.
Invalid mixed batches and discarded previews leave state and history unchanged.

Direct requests from another tenant, ungranted users, entry-only users and users
whose permissions were revoked after preview must fail. Change definitions,
counts or close the month after preview and verify stale commit rejection.
Concurrent confirmations must yield one commit and either an authorized replay
or stale rejection, with one receipt and no duplicate actual revisions. Repeat
imports must preserve subsequent corrections and require current permission.

Run focused unit/API/UI regressions, then root/app tests, typecheck, lint, app
build and dedicated Rev Ops browser journeys. Verify legacy accepted imports and
the original workbook; test migrations/recovery only if storage changes. Record
actual commands and results at implementation time. These are planned tests,
not new passing evidence.

## Non-goals and next decision

No budget-import reconciliation, episode/transfer counting, saved review queue,
cross-unit copying, organization rollups, new custom-field types, external
integration, month-close policy change, forecast or collections. No production
identity, PHI, clinical/payer decisions or deployment. Existing production gates
remain unchanged.

Next: Tyler reviews this proposed workflow, role rule and row-level keep/use
behavior. Approval would authorize a separate implementation pass against this
bounded contract; it would not itself authorize merge, deployment or expansion.
