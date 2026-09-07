# Rev Ops onboarding and custom-field verification

Date: September 7, 2026. Branch: `codex/om/rev-ops-onboarding-fields`.
Code commits: `d6c7b80` (backend/contracts/tests), `c45d1f2` (UI/browser tests).
Base: PR #49 merge `926b3776ae25df536ad3d2254d51c6d8019aff0a`.

Status: implemented and locally verified with synthetic data, pending draft
code review. This is not production deployment or hospital cutover approval.
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
| `DATABASE_URL=<isolated URL> npm test` | 490 tests across 46 files passed. |
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
