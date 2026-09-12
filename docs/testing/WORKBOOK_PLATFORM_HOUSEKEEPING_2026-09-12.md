# Workbook platform housekeeping and current verification

Date: September 12, 2026. Branch: `codex/om/workbook-platform-map`.
Operating implementation baseline: `5965f4499abd23fa13decbf954f6281650b4ff97`.
Selection regression fix: `117ddfc`.

## Completed

Normalized the three workbook evidence CSVs from CRLF to LF without changing any
parsed fields. Refreshed `WORKBOOK_PLATFORM_FULL_TREE.md` against the existing
implementation and runtime evidence: imported operating records, validated
corrections, registry additions, calculations, report snapshots and bounded payment
scenarios are implemented. Remaining full-parity and production work stays explicit.
The owner-accepted workbook decision is preserved.

Browser verification exposed a separate selection regression: selecting the current
hospital again cleared the loaded comparison and closing receipt, but unchanged
effect dependencies did not reload them. The approved-baseline selector had the same
behavior. Two focused regression cases failed before the fix. Both selectors now
preserve the loaded view when their value has not changed; changing the selection
still clears and reloads the comparison.

## Isolated verification environment

All database work used a newly initialized PostgreSQL 18 cluster in a temporary
directory, listening only on `127.0.0.1:54319`, with synthetic `clarity_dev` and role
`clarity`. The name satisfies the existing repository test guard; the independent
cluster and port provide isolation from developer databases. All 19 existing
migrations were applied from scratch. No schema migration was added by this branch.

The existing development API ran on port `4349`; Vite ran on port `5199`. A temporary
Playwright config imported `app/playwright.revops.config.ts` and changed only the
test/output paths, base URL and server ports, with `reuseExistingServer: false`.
The original desktop/mobile projects, test file and assertions were retained.
Temporary configuration and runtime artifacts are outside the repository.

## Commands and results

Database commands below used
`DATABASE_URL=postgresql://clarity@127.0.0.1:54319/clarity_dev?schema=public`.

| Command or check | Current result |
| --- | --- |
| `npm run prisma:validate` | PASS. |
| `npm run prisma:generate` | PASS, Prisma Client 6.19.3. |
| `npx prisma migrate deploy` | PASS, 19 migrations into the empty isolated cluster. |
| `npm test -- tests/integration/operating-workbook.test.ts tests/unit/operating-workbook.test.ts tests/unit/rev-ops-pricing.test.ts` | PASS, 55 tests, including three authenticated database tests and 611 source metric comparisons. |
| `npm test` | PASS, 587 tests across 56 files; complete root unit, workflow, security and integration suite. Backend code was unchanged by the subsequent selector fix. |
| `npm --workspace app test -- RevOps.test.tsx -t 'preserves the loaded comparison'` before the fix | Expected FAIL: both hospital and approved-baseline reselection erased the comparison. |
| `npm run test:app` after the fix | PASS, 96 tests across 16 files, including both new regression cases. |
| `npm run typecheck` | PASS after the fix. |
| `npm run lint` | PASS after the fix. |
| `npm --workspace app run build` | PASS after the fix. Existing chunk advisory remains: initial JavaScript 551.15 kB, 152.99 kB gzip; payment chunk 281.89 kB, 26.93 kB gzip. |
| `cd app && npm run smoke -- --config /tmp/clarity-workbook-check.y3XTG0/playwright.revops.isolated.config.ts --reporter=line` | First run: 9 passed, desktop closing-receipt redisplay failed. After the reproduced selector fix: all 10 desktop/mobile RevOps journeys PASS. |
| `npm audit --audit-level=high` | PASS at the required threshold; three moderate advisories remain in `@vitest/mocker`, `vitest` and `csv-parse`. No dependency update was made. |
| CSV byte and parsed-field comparison against the prior commit | PASS: only 138 CRLF sequences across three CSVs changed to LF. |
| `git diff --check origin/main` | PASS for the complete reviewed branch changes. |

## Source verification

The accepted restored workbook was read without saving or recalculating it. Its
current SHA-256 and the committed synthetic fixture's source hash both remain
`6e81bd61950c244e607ed03f8b0f13e1a4d0bea366ee7ad7cc54c053ef90de26`.
All three archived public-rate files match the hashes in
`data/public-rates/sources/README.md`. Pricing tests independently compare all
1,126 normalized Louisiana rows with their archived source workbooks.
No file under `reference/` is changed by this branch.

## Remaining evidence and scope boundaries

This verifies the current synthetic operating slice; it does not establish complete
F01–F30/X01–X04 parity, production readiness, live integrations or deployment.
The selected hospital identifiers, complete IPF/FY2027/OPPS/SBH methods, official-rate
posting, new operating-record entry, financial receipt/reversal workflows,
consolidated financial close and remaining IOP/report parity are still outstanding.

Native Excel recalculation/mutation tests, the unrelated general prototype browser
suite, production-scale performance and production security/release checks were not
run. No performance measurements were taken. GitHub CI uses PostgreSQL 16 and must
be checked separately on the published PR revision. The original unsuccessful
browser run is retained as failure evidence, not counted as a passing run.
