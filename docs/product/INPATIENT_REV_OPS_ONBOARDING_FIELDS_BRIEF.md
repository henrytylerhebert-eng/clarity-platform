# Rev Ops onboarding and custom fields — next bounded slice

Status: implemented and synthetically verified; merged in PR #50 on September 7,
2026 as `c5e4113`. Not a production Rev Ops deployment. See the
[verification record](../testing/REV_OPS_ONBOARDING_FIELDS_VERIFICATION.md).
Owner: Tyler. Scope decision: additional fields appear in **both setup and data
entry**, confirmed in the task on September 6, 2026. This extends the approved
[product definition](INPATIENT_REV_OPS_PRODUCT_DEFINITION.md) and the proven
[first patient-day slice](INPATIENT_REV_OPS_FIRST_SLICE_BRIEF.md).

## Goal and complete journey

An administrator sets up a synthetic hospital/unit, saves and resumes its
configuration, defines local fields and delegates finance/census access. Finance
imports and approves a budget with those fields. Census staff import or manually
enter daily actuals with the same field validation. A reasoned correction and a
field rename/archive retain their original meaning after reload and API restart.

Use one hospital/unit workspace as the first implementation boundary. Setup
fields describe that workspace; they are not organization-wide or shared across
all of a hospital's units. Shared facility definitions and copying configurations
are later work. Existing facility identity and timezone consistency still apply.

## Roles and workflow points

| Person / authority | When | Responsibility |
|---|---|---|
| Organization administrator | Initial setup and configuration changes | Define fields, record setup values, delegate existing permissions and resume incomplete onboarding. |
| Finance with budget import permission | Monthly planning or budget amendment | Enter/import budget values and configured budget fields; resolve preview issues. |
| Finance with budget approval permission | After reviewing a draft version | Approve that version with its field-value snapshots. |
| Census staff with actual entry permission | Reconciled end-of-day census | Enter/import daily counts and configured actual-entry fields. |
| Delegated correction authority | When a count or field value needs correction | Supply a reason; retain prior count, fields, actor and source. |
| Authorized reviewer | During reconciliation/report review | Read the current record and its preserved field definitions/history. |

Definition changes remain administrator-only. Field editing uses the permission
of the record being edited; adding a custom field cannot grant access. This
slice permits ordinary synthetic operational metadata visible to authorized
workspace viewers. Sensitive fields needing different read permissions require
separate server-side filtering across records and audit history before support.

## Field contract

Implementation choices for this bounded slice:

- Support short text and single-select fields first. Each has a server-created
  stable ID, scope (`setup`, `budget`, or `actual`), type, label, required flag,
  version and archived state. Select options have stable IDs and labels.
- A definition has one scope. A label reused in another scope represents a
  separate field/value; no automatic copying or shared budget/actual storage.
- Bound definitions to 20 per scope including archived definitions, text to 160
  characters and select options to 50 including retired options. Count limits
  remain enforced by the server. These are implementation limits, not scale proof.
- Reject unknown field/option IDs, duplicate definitions, wrong-scope input and
  invalid types. Do not accept labels as trusted identity or object-property keys.
- Required means required when saving a new record or new record revision under
  the current definition. Adding a required field does not fabricate old values
  or invalidate approved historical budgets. Display old absence as “Not recorded.”
- Keep type and scope immutable; use a new field for a different meaning. Rename,
  required-rule and option changes increment the definition version. Archive
  instead of deleting used fields/options. Archive stops new entry and preserves
  existing values. Corrections retain archived values read-only.
- Store definition version, label, type and option label with each accepted value.
  Historical displays use that snapshot, including after rename/archive. Setup
  changes also preserve before/after values and responsible actor in the journal.
- Custom metadata never changes patient-day arithmetic, tenancy, core dates,
  budget approval, period state or permissions. The existing cost-center field
  remains compatible; do not rewrite approved budget history to generalize it.

## Setup and onboarding behavior

Persist each valid setup/configuration step and resume from server state. Show
specific outstanding items: required setup values, delegated responsibilities,
first approved budget, and first accepted actuals for the selected period. Do not
infer completeness from a clicked checkbox, visited screen or uploaded file.

Label the result “Synthetic workflow configured.” This is not approval for
production, real patient data, clinical workflows or a hospital cutover. The
existing valid minimal workspace may be saved before optional configuration and
first-period activity are complete. Required setup values must be supplied before
accepting the first budget or actuals; an administrator can fix configuration
without being locked out by that requirement.

## Manual entry, imports and corrections

Extend the existing commands, preview and atomic gateway transaction. Both entry
paths call the same field validator. CSV/XLSX mappings target stable field IDs
within the selected budget/actual scope. Show labels and required fields in the
mapping UI; preserve original-byte hash, sheet, physical rows and mapping.

A preview is not authorization to commit. Commit rechecks permissions, revision,
current field definitions, required values and open-period rules. Stale previews
must be refreshed. One invalid row causes no activity, budget or journal write.
Previously accepted identical uploads remain no-ops after a correction or a
field rename; never restore superseded values. New uploads that disagree on a
count **or only a custom value** require accountable reconciliation.

Corrections may change metadata while keeping the same count. Capture prior and
new values, reason, actor, source and definition snapshots as a new revision.
Approved budget metadata changes require a new draft/approved budget version.
Closed-period and budget-approval rules continue to apply.

## Implementation seams and compatibility

Extend these existing surfaces rather than introducing a service or provider:

- `packages/domain-contracts/src/revOps.ts`: bounded definitions, values and
  commands; additive optional state for existing workspaces.
- `packages/rev-ops-service/src/index.ts`: shared validation, definition lifecycle,
  metadata-aware equality/conflicts and onboarding prerequisite checks.
- `packages/case-repository/src/revOpsGateway.ts`: existing tenant transaction,
  revision comparison and append-only change journal. Server derives tenancy.
- `packages/api-service/src/revOpsImport.ts` and existing routes: field mappings,
  current-definition validation and preserved replay identity.
- `app/src/workspaces/RevOps.tsx`: resumable setup, configuration, mapping, entry,
  correction and historical field display using server-owned state.

Reuse the existing JSON aggregate for the bounded extension. Old workspaces with
no new definitions/values load as empty additions without erasing old state or
history. Test an existing PR #49 workspace before and after the change. No new
SQL migration is assumed; if implementation proves one necessary, review a
forward migration and upgrade/recovery behavior before merging. Never edit the
four previously applied Rev Ops migrations.

## Synthetic acceptance example

Use Scranton–Pawnee Demo, Geriatric unit, America/Chicago, February 2028. Tenant B
has overlapping names and dates but distinct IDs and data.

| Step | Expected proof |
|---|---|
| Admin defines setup text “Reporting code” and saves `SP-GERI` | Reload/resume retains value and actor/source history. Unauthorized configuration fails. |
| Admin defines required budget select “Planning basis” with `Approved plan` | A 290 budget lacking the value fails atomically; valid manual/import input creates a draft and authorized approval retains the snapshot. |
| Admin defines required actual select “Census review” with `Pending` / `Reconciled` | Seven imported counts 9,10,11,10,12,8,10 with `Reconciled` total 70; a missing value rejects the batch without partial writes. |
| Manual entry is exercised in a separate synthetic workspace | The same valid/invalid field rules apply as the upload, including blank versus zero. |
| Correct Feb 6 from 8 to 9 with a reason | Actuals 71, phased variance +1, full-month variance -219; original count and metadata retained. |
| Correct only Feb 6's review value with a reason | A new history revision exists; actuals stay 71 and budget stays 290. |
| Repeat original accepted upload | No extra records; no restoration of the old count or review value. |
| Rename “Census review,” retire an option, then archive the field | Historical entries retain original label/option; new entry follows current active definitions and corrections retain archived values. |
| Change a definition after preview | Stale commit fails without any partial writes; fresh preview shows the new rules. |
| Add a new required field after approval | Older budget/history remains readable and unchanged; a new version must satisfy the new rule. |
| Cross-tenant, ungranted and revoked-access requests | Setup/definition mutation, preview, commit, correction, record reads and history fail without leaking field values. |
| Close period, attempt metadata-only correction, reopen with authority/reason | Closed correction denied; reopening and subsequent correction remain audited. |
| Restart API and read from a fresh session | Definitions, setup values, permissions, record snapshots, replay state and complete history match before restart. |
| Load a pre-extension workspace | Existing patient-day import, approval, correction, comparison and history still work without a data rewrite. |

## Verification and completion

Implement vertically through this whole example. Focused domain, import, API,
RLS and compatibility tests come first; then run root/app suites, lint,
typecheck, build and desktop/mobile browser journeys. Reuse the bounded workbook
reader and its security regressions unchanged unless a demonstrated defect
requires a focused fix. Apply migration checks only if schema changes are needed.

Record the tested revision, exact commands, sample results and remaining risks
in the existing verification/status records. Runtime work is complete only when
the entire journey, direct authorization failures, historical interpretation,
replay and restart persistence pass. A form or schema alone is not completion.

Non-goals: organization signup/SSO, invitations, external integrations, deployment,
PHI, episode-level counting, sensitive-field access policies, calculation fields,
conditional form builders, configuration cloning, forecasts and collections.
No measurements found for onboarding speed or production performance; measure
those separately before making improvement claims.
