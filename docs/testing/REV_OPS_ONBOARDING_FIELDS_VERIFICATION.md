# Rev Ops onboarding and custom-field verification

Date: September 7, 2026. Branch: `codex/om/rev-ops-onboarding-fields`.
Code commits: `d6c7b80` (backend/contracts/tests), `c45d1f2` (UI/browser tests).
Base: PR #49 merge `926b3776ae25df536ad3d2254d51c6d8019aff0a`.

Status: implemented, locally verified and agent-reviewed with synthetic data;
PR #50 remains draft. This is not merge, production deployment or hospital
cutover approval.
Scope: [approved direction and bounded brief](../product/INPATIENT_REV_OPS_ONBOARDING_FIELDS_BRIEF.md).

## Implemented journey

Administrator creates a hospital/unit, defines fields in setup and data entry,
saves incomplete setup and resumes after reload. Required setup values gate new
budget/actual writes. Existing permissions govern configuration, entry, approval
and correction. Onboarding progress reflects saved values, recorded delegation,
an approved budget and first accepted actuals for the selected month.

Fields support text and single select: 20 definitions per scope including
archived fields, 50 options including retired choices, 160-character values and
labels. IDs are server-created. Scope and type cannot change. Definition revisions
and before/after setup values are journaled. Every stored value snapshots its
label, type, version and option label. Active required values apply to new record
versions; historical absence is shown as “Not recorded.” Existing approved
budgets are not rewritten when definitions change.

CSV/XLSX imports use explicit stable-ID mappings or match the template's
`Field: label` columns against current definitions. Resolved mappings, byte hash,
worksheet and physical rows are saved as source evidence. Mapped custom cells
must be text; formulas, invalid/ambiguous choices and wrong-scope fields fail.
Invalid batches write no state or journal entries. Commit uses the preview's
revision and rechecks server permissions/current definitions. Previously
accepted identical imports remain no-ops after correction or definition changes.

Metadata-only actual changes require correction authority and a reason even
when the count is unchanged. Retired choices may be retained on existing records;
archived field values remain read-only during corrections. Budget metadata
amendments create a new version. Budget and actual activity stay separate;
forecast and collections remain absent.

## Passing evidence

All database commands used the isolated loopback synthetic `clarity_dev` database
on port 55439. No production database or real hospital records were accessed.

| Command/check | Result |
|---|---|
| `DATABASE_URL=<isolated URL> npm test` | 493 tests across 46 files passed after the PR review fixes below. |
| `npm --workspace app test` | 68 tests across 11 files passed. |
| `API_PORT=4316 npx playwright test --config app/playwright.revops.config.ts` | Six journeys passed: original workflow, delegated/revoked access, and onboarding/fields, each desktop/mobile. |
| `npm run typecheck` / `npm run lint` | Passed. |
| `npm --workspace app run build` | Passed. |
| `DATABASE_URL=<isolated URL> npm run prisma:validate` | Passed; no schema/migration change. |
| `npm audit --audit-level=high` | Zero vulnerabilities. No dependency changes. |
| `git diff --check` / staged Gitleaks | Passed / no leaks found. |

Focused regressions cover required/blank/zero distinctions, XLSX custom cells,
formula rejection, stable mappings, ambiguous options, immutable scope/type,
field bounds, archived/retired values, metadata conflicts, preserved snapshots,
new budget approval requirements, direct unauthorized requests, stale commits,
atomic rejection, and pre-extension workspaces. The client regression confirms
that refreshing after preview does not replace its revision at confirmation.

The new browser journey creates setup `Reporting code = SP-GERI`, budget
`Planning basis = Approved plan`, and actuals `Census review`. A delegated user
imports/approves budget 290 and imports seven actual days totaling 70, corrects
February 6 from 8 to 9, then changes only its review value. History is `[8,9,9]`;
repeat import preserves the correction. Manual February 8 entry adds four days
outside the February 7 reporting cutoff. Through February 7, actuals are 71,
phased variance +1 and full-month variance -219. Renaming, retiring an option,
archiving, reload and mobile layout checks pass without browser errors.

## Debugging and durability

The first browser run exposed ambiguous label targeting for new select controls;
explicit accessible labels resolved it. A subsequent run collided with the prior
test server's shutdown and failed with connection refusal. Starting one persistent
Vite instance and waiting for the old run to end resolved the harness race; the
final six-test run passed. No runtime behavior was weakened to make tests pass.

Review also found that JSON string comparison could treat PostgreSQL JSONB key
ordering as a data change. The database regression failed before the fix, then
passed with explicit field-content comparisons. Identical setup, definition and
budget saves no longer create revisions after a database round-trip.

An actual API stop/restart preserved two field-enabled browser workspaces at
revision 14 with 14 history records each, plus the original namespace-proof
workspace at revision 5 with five history records. Entire workspace and journal
objects matched across fresh sessions. Six repeated-save checks after restart
remained no-ops. The original unmodified Scranton–Pawnee XLSX was also uploaded
again into a fresh workspace: 290 budget, 70 then 71 actuals, accepted replay,
reload, fresh API read and desktop/mobile checks passed.

Local proof, screenshots, restart snapshots and original sample report are kept
outside Git at `/Users/tylerhebert/Documents/Clarity-RevOps-Local-Proof/2026-09-07`.
No workbook binary, test trace or session token is committed.

## Review and remaining limits

Review field-ID validation and scope checks, definition/value history, JSONB
no-ops, preview/commit revision handling, replay permissions, and UI historical
labels first. Existing tenant transaction/RLS boundaries and append-only journal
are reused. The bounded XLSX reader, Prisma schema and all migrations are unchanged.

There are no new services, integrations or production identity changes. Fields
are workspace-scoped operational metadata visible to existing authorized viewers;
sensitive per-field read policies, cross-unit sharing and configuration copying
are deferred. Text/select fields do not compute metrics. No measurements found
for production scale or onboarding speed.

Do not roll an older writer back onto field-enabled data: older commands do not
understand the added values. If a defect is found, pause affected writes, retain
the journal and use a forward fix or separately verified restoration. Production
rollback, security/privacy approval and cutover remain unverified.

Next: review the draft PR and its latest-head CI. Do not merge or expand this
slice merely because local checks pass. The 20 legacy app smoke checks were not
rerun for this extension; dedicated Rev Ops and full root/app suites were run.

## PR #50 workflow walkthrough and review follow-up

Reviewed starting head `5154adb92ff4770e77dd38fd950aab330605d41a` against
`926b3776ae25df536ad3d2254d51c6d8019aff0a`. Mapping fix: `c098e3f`.
Two defects were found and fixed:

- **P2 — Import mapping modes shared a replay key.** An omitted `fieldMapping`
  automatically matches template columns; an explicit empty array ignores custom
  columns. Both previously hashed identically, so changing modes could return
  “already imported” instead of reporting a metadata conflict. Two unit cases
  failed before the fix. The key now retains the empty array while preserving
  legacy omitted-mapping keys. A database/API regression confirms that changed
  metadata is rejected, state/history stay unchanged and the original upload
  still replays. Pre-fix explicit-empty requests are revalidated under the new
  key; the fix does not rewrite accepted records.
- **P2 — The app build failed despite green CI.** The client regression passed
  an unsupported `exact` option to Testing Library's `getByRole`. A fresh build
  reproduced TS2769. Removing the option preserves exact string-name matching
  and fixes the build. The existing `npm run typecheck` now also compiles `app/`,
  so CI catches app type errors; previously it excluded app code and running
  tests did not expose this error. The earlier claim that
  the starting head's app build passed is superseded by this fresh result.

GitHub rejected the initial push containing an app-build workflow step because
the OAuth credential lacks `workflow` scope. That unpublished workflow edit was
removed. The final change extends the repository's existing typecheck script;
`.github/workflows/ci.yml` remains unchanged. The full Vite app build was verified
locally; CI checks app types through its existing Typecheck step.

The fresh desktop/mobile walkthrough exercised:

| Step | Observed behavior |
|---|---|
| Admin: setup and resume | Hospital/unit, timezone, three scoped fields, saved reporting code and delegations persist after reload. |
| Finance: upload and approve | Required planning metadata accompanies the 290 monthly draft; approval preserves that version. |
| Census: import/manual entry | Seven accepted daily counts total 70; manual February 8 entry is outside the February 7 report cutoff. |
| Correction authority: reconcile | February 6 changes 8 to 9; a metadata-only correction adds history without changing the count. History is `[8,9,9]`. |
| Reviewer: repeat upload and compare | Repeat upload retains corrections. Through February 7: actuals 71, monthly budget 290, phased variance +1, monthly variance -219. |
| Admin/reviewer: field lifecycle and history | Rename, retired choice, archive and reload retain historical labels/values. Archived values are read-only during correction. |

Custom-column mapping is all-explicit when a mapping array is supplied: include
every intended custom column. An omitted array uses automatic `Field: label`
matching. Review mapped values before confirmation; optional unmapped values are
not inferred.

Fresh root tests include authorization, cross-tenant and revoked-access denials,
atomic imports, stale previews, bounded unused worksheets and legacy compatibility.
No schema or migration changed; Prisma validation passed. App tests (68), lint,
root typecheck and the corrected app build passed. The app regression was rerun
after its query fix. An API restart with the fixed reader preserved two newly
walked field workspaces (revision/history 14 each), the legacy workspace
(revision/history 5), and six identical-save no-ops.

Review evidence is under the same local proof directory: `pr50-review-root-tests.log`,
`pr50-review-browser/`, restart snapshots and `pr50-original-sample/`.
No additional blocking defects were identified in the reviewed scope. Production
identity, sensitive data use, cutover, scale and rollback remain outside this
review's proof. Keep PR #50 draft for the owner's merge decision.
