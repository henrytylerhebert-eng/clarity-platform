# Rev Ops patient-day slice: local verification

Date: 2026-09-06 (America/Chicago). Branch: `codex/om/rev-ops-patient-days`,
based on upstream `a7ece3a00e15db19565ea3c69d561e1d907eafe7`.
Status: owner walkthrough complete; test/debug pass complete for the bounded
synthetic workflow. Not deployed.

## Approved behavior

Tyler approved midnight records labeled as the day just ended, delegated
correction permission with required reasons and separate reopening authority,
and even daily budget phasing with optional custom targets summing to the month.
The source workbooks remain candidate requirements sources, unchanged.

The `/rev-ops` workspace supports hospital/unit setup, cost-center configuration,
delegation, CSV/XLSX preview and commit, manual entry, budget approval, correction,
close/reopen, comparisons and source history. Missing dates suppress complete
variance claims. Repeat imports do not undo corrections. Prior budget versions
and field labels are retained. Forecast and collections are not implemented.

## Implementation boundaries

- `app/src/workspaces/RevOps.tsx`: server-backed workspace, no operational localStorage.
- `packages/domain-contracts/src/revOps.ts` and `packages/rev-ops-service/`:
  validation, permissions, calendar, budget versions and comparisons.
- `packages/api-service/src/revOps*.ts`: authenticated Fastify routes and
  bounded import parsing. Existing API routes retain their verified-principal contracts.
- `packages/case-repository/src/revOpsGateway.ts`: transaction-local organization
  context, facility identity reuse, workspace grants, optimistic revision checks.
- `prisma/schema.prisma` and migration `20260907000100_rev_ops_patient_days`:
  persisted workspace and change journal, composite organization foreign keys,
  organization RLS. Migration `20260907000200_rev_ops_append_only_history`
  prevents ordinary application roles from updating or deleting audit rows.
  Migration `20260907000300_rev_ops_retain_workspace_history` also prevents
  parent deletion from cascading into the journal. Migration
  `20260907000400_rev_ops_retain_workspace_identity` restricts referenced workspace
  key updates so they cannot cascade into audit history.
  Facility/unit permissions are enforced by the gateway.

State is a bounded JSON aggregate, updated atomically with its change journal.
It is limited to 240 budget versions, 3,660 activity dates and 100 revisions per
date. This is a scoped implementation, not the final normalized analytics warehouse.
Imports accept normalized tables with row-one headers, explicit column mapping
and optional worksheet selection; arbitrary legacy workbook layouts are not
automatically interpreted. Formula cells are rejected. Source history preserves
file name, hash, worksheet, mapping, row references and normalized values, not
the original uploaded file bytes. The journal has no application edit/delete route;
database administrator tamper resistance is not claimed.

## Evidence

All database work used an isolated loopback PostgreSQL instance on port 55439,
database `clarity_dev`, with synthetic fixtures. No shared database or `.env`
configuration was changed. The original 15 migrations applied successfully to
the fresh database; three additional history-retention migrations subsequently
applied, for 18 total. Prisma generation and validation passed. The fourth Rev Ops
migration was applied to the existing synthetic database during review fixes.

| Check | Observed result |
|---|---|
| `DATABASE_URL=<isolated URL> npm test` | 463 tests passed across 44 files after the review fixes. |
| `npm --workspace app test` | 67 tests passed across 11 files. |
| Dedicated Playwright Rev Ops config | Four tests passed: complete workflow and delegated census/correction/revocation/logout, each on desktop and mobile. |
| `npm --workspace app run smoke` | All 20 legacy browser checks passed after correcting stale selectors. |
| API process restart | Full workspace and all seven audit revisions equal before/after actual stop and restart. |
| `npm run typecheck`, app build, Prisma validation | Passed. |
| `npm run lint` and `git diff --check` | Passed with the normal commands. Installed `.venv` dependencies are now excluded from source lint. |
| Production dependency audit | Zero vulnerabilities in the previous run; dependencies unchanged by the debug pass. |

## Test/debug findings and fixes

- Regression tests first reproduced acceptance of blank/hex counts, inaccurate
  CSV line provenance after blank lines, and closed periods missing from preview
  issues. Imports now reject blank, boolean and non-decimal numeric inputs while
  retaining real zero; source references track physical CSV lines, including
  quoted newlines. Closed periods are shown as unresolved before commit.
- Workbook validation now bounds actual decompression rather than trusting ZIP
  metadata. A forged-size workbook is rejected before ExcelJS loads its cells.
- Regression tests reproduced a blocked budget amendment back to a prior total.
  A deliberate new amendment can now repeat an older total while preserving prior
  approvals; immediate duplicates remain no-ops. Invalid selected baselines
  return an explicit error instead of silently appearing absent.
- Hospital setup rejects ambiguous existing names and inconsistent timezones
  across units. Tests cover both conditions.
- UI regression tests reproduced stale unsaved actuals/field values after hospital
  switches, an old file remaining actionable after a rejected replacement, and
  stale history when comparison dates fail. Forms reset for the selected context;
  file state clears before reads; history loads independently of comparisons.
- Browser testing now includes real delegated staff entry, denied correction,
  newly granted correction, revoked access and successful server-side logout.
  The client no longer labels bodyless requests as JSON; the prior behavior
  prevented logout. Empty JSON and unsupported media now return client errors,
  not internal-server errors. Existing token-revocation tests continue to pass.
- Non-bypass database-role tests confirm the audit journal can be read but cannot
  be updated or deleted, even within the caller's organization.
- The six earlier legacy browser failures were stale text selectors. Assertions
  now target the exact custody badge and the implemented counsel-warning block;
  application legal/custody behavior was not changed.
- One full run exposed an existing intermittent prescreen-test collision: the
  unique-index contention test reused a possible winner's assessment ID from the
  preceding race. Its fixture now has a distinct ID; assertions are unchanged.
  The subsequent full suite passed.

Numeric proof: February 2028 has 29 days. A 290 monthly budget yields a 70 phased
target through February 7. Actuals total 70, then 71 after correction; variances
become -219 full-month and +1 phased. Re-import preserves 71. A separate tenant
with the same hospital label has budget 145, actuals 35 and phased variance zero.
Unauthorized reads/writes, foreign grants, stale concurrent updates, invalid
dates, conflicting rows and closed-period entry are rejected. Non-bypass RLS
tests deny reads without organization context and prevent foreign updates.
Calendar tests cover leap month, year boundary, fractional timezone offset and
23-/25-hour daylight-saving days. Custom daily phasing is also verified.

## Code review preparation

The review-preparation pass formatted the new implementation files and added a
regression test for cascading workspace deletion. It reproduced loss of history
under a non-bypass application role; the third migration blocks parent deletion
and the regression passes. See the [review guide](REV_OPS_CODE_REVIEW.md) for
review order, reproduction commands and architectural questions.

## Review findings resolved

The authorization/import/migration review found two additional defects. Regression
tests reproduced both before the fixes (12 passed, two failed in the focused run):

- **XLSX entry-count bypass:** an 11 MiB synthetic worksheet compressed to a small
  upload still imported after both ZIP entry counts were forged to one. The guard
  now checks the complete central-directory boundary, record count and local data
  bounds, rejects ZIP64 overrides and ambiguous end records, and retains the
  cumulative 10 MiB decompression limit. Tests cover the bypass, nine malformed
  container variants, and valid stored/deflated workbooks with ZIP comments.
- **Audit reference rewrite:** a non-bypass role could update its workspace ID,
  causing the foreign key's `ON UPDATE CASCADE` to rewrite audit references despite
  journal RLS. The fourth migration replaces this with `ON UPDATE RESTRICT` in a
  transaction; Prisma declares the same behavior. The regression verifies the
  restriction error and unchanged workspace identity and full journal contents.

After these fixes, 25 focused import/integration tests, all 463 root tests, 67 app
tests, lint, typecheck, app build, Prisma validation/generation and diff checks
passed. All four dedicated desktop/mobile browser journeys passed against the
restarted API and migrated database. The legacy browser and restart-equality
results above are retained from the preceding debug pass, not rerun here.

The first CI run applied all 18 migrations successfully on PostgreSQL 16, then
reported 462 passed and one assertion failure: the rejected key update returns
`23503` there, versus `23001` on local PostgreSQL 18. The assertion now accepts
either constraint code and requires the named journal foreign key; rejection and
unchanged-record checks remain mandatory.

This is a forward migration; earlier migration files are unchanged. ZIP64,
multi-disk archives and ambiguous ZIP containers are intentionally unsupported.
No dependency changes, source workbook access or new product scope were needed.

## Remaining gates

Tyler marked the owner walkthrough complete and authorized this test/debug pass.
Independent release review remains outstanding. Production
identity/provider setup, deployment/migration/rollback, load measurement,
operational retention, broad arbitrary custom fields and live hospital imports
are not verified. No measurements found for production performance.
Event-level transfer/admission/discharge counting remains deferred; the aggregate
workflow cannot prove those future attribution rules. No additional product lane was started during this pass. The completed walkthrough
and passing local tests do not automatically promote the slice to production.
