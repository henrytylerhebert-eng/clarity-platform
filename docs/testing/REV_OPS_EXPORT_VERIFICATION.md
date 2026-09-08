# Rev Ops operational census export — verification

September 8, 2026. Local synthetic implementation on `codex/om/rev-ops-export-brief`,
base `c9a00bd` (PR #52). Pending code review; not merged, deployed or a hospital pilot.
[Approved scope and remaining decisions](../product/INPATIENT_REV_OPS_EXPORT_BRIEF.md).

## Implemented behavior

New receipts snapshot Daily Midnight Census Count v1, configured timezone, midnight
and prior-calendar-day attribution, historical hospital identity, and explicit
unknown hospital-rule slots. Legacy receipts remain unchanged. Original/revised
receipt review and values-only XLSX export use saved budget/actual/source facts.
Budgets, forecasts and collections are not reinterpreted. Export permission is an
explicit workspace grant, including for administrators.

Tenant-scoped reads bound historical receipt JSON in SQL. Export uses current
identity/grants and reviewed revision/hash, repeats authority checks before delivery,
and writes separate AuditEvent records without changing census revisions. The
workbook withholds free text/custom fields and preserves typed dates and zeroes.
There are no schema, migration, dependency, reference-document or MiroFish changes.

## Verification completed

| Check | Result |
|---|---|
| `npm test` with isolated PostgreSQL on local port 55439 | 519 passed across 49 files; subsequent calendar-only test addition passed separately (7 export unit tests) |
| `npm --workspace app test` | 79 passed across 14 files |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm --workspace app run build` | Passed |
| `cd app && npx playwright test --config playwright.revops.config.ts` | All 10 desktop/mobile journeys passed |
| Actual API stop/start and reauthentication | Two complete workspaces/histories and four receipt exports identical in saved content/hash |
| Screenshot review | Desktop/mobile review and download inspected; narrow layout stays within viewport |
| OOXML/readback | No formulas, external relationships, macros, hidden sheets, comments, connections or embedded files in adversarial export; literal formula-like text and exclusions verified |
| `git diff --check` | Passed |

Tests include original 280 / 290 / -10 and revised 285 / 290 / -5, explicit leap-day
zero/five, prior-budget comparison, legacy unknowns, zero-budget percentage,
28/29/30/31-date exports and recorded Chicago daylight-saving cutoffs, immutable
source hash, unsupported metric definitions, malformed/missing/duplicate dates,
oversize hidden content and missing legacy receipts. Existing calendar tests cover
the supported range; the export does not change that range.

Authorization tests deny administrator export without an explicit grant,
unauthorized/cross-tenant review, stale review download, revoked access during
generation and forged request fields. Injected audit failure prevents delivery.
Malformed revision input cannot strand the tenant concurrency slot. Repeated
exports write separate request/generation events while preserving census revision.

The browser journey uploads 28 dates, enters February 29 as zero, closes, reviews
and saves the original workbook, reopens/corrects/recloses and saves the revised
workbook, then downloads the original from History after a reload. Saved XLSX
readback verifies 280/285 against 290 and the actual February 29 date. Both desktop
and mobile complete it. Restart verification independently reauthenticates and
compares full workspace/history plus daily/budget sheet values and receipt hashes.

Local proof artifacts (synthetic; outside git):
`/Users/tylerhebert/Documents/Clarity-RevOps-Local-Proof/2026-09-08/export/` contains
`restart-proof.mjs`, `restart-before.json`, `restart-after.json` and before/after
workbooks for both devices and both receipt versions. Playwright screenshots and
saved downloads are under `app/test-results/`; copied proof remains outside git.
The prior offline design samples are retained separately and not relabeled.

## Debugging and review

Fixed a test CSV header that did not map to the existing import contract, old
patient-day text assertions, an ambiguous browser locator matching hidden receipt
metadata, and a nullable SQL size access caught by TypeScript. Review additionally
hardened metric/receipt identity validation, moved revision parsing ahead of the
concurrency claim, and kept legacy predecessor metrics explicit. Percentage display
and long workbook rows were adjusted following visual inspection. Final checks
above passed after those changes.

## Remaining gates and limits

- Hospital-specific rules, effective dates and validation remain unknown. Only the
  metric object/unknown slots are implemented; no rule editor or registry is claimed.
- Budget metric equivalence, future baseline inheritance/change approval and real
  hospital field classification require owner decisions. Current budget policy is
  unchanged; all historical custom-field values/labels are withheld from export.
- Native Microsoft Excel opening is **unverified**. Browser download plus ExcelJS
  readback and OOXML inspection do not establish every desktop Excel behavior.
- Concurrency limits are per process. Ten-second rejection happens after generation,
  not cancellation. Distributed limits, load testing and production capacity remain
  unverified. No performance or efficiency measurements found.
- Existing AuditEvent storage is reused; privileged tamper controls and retention
  are not added. Process termination may leave an unmatched request event. There is
  no new export-audit browsing API or assertion that delivery means opened/saved.
- No schema change: migration reset/recovery and Prisma generation were not rerun
  for this slice; existing integration migration-integrity tests passed. No deployment
  or real-data authorization. Legacy unrelated application smoke was not rerun;
  full unit/integration and dedicated Rev Ops browser coverage are recorded above.
- Existing runtime warnings: Node experimental localStorage during app tests and
  Playwright NO_COLOR/FORCE_COLOR warning; both suites completed successfully.
- An Excel temporary lock file appeared in `reference/source-documents`; it was
  left untouched and is excluded from this slice.

Next: review authorization, historical fidelity, output bounds and audit behavior
before a separate merge decision. Do not expand into pilot/deployment from these tests.
