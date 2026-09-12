# Network enrichment contract-kernel test manifest

**Scope:** contract-only replacement PR for the network-enrichment kernel.

**Files:** `tests/unit/network-enrichment-contracts.test.ts`,
`tests/data/network-enrichment-entity-resolution-scenarios.json`, and
`tests/data/network-enrichment-valid-candidate-package.json`.

## Covered guarantees

| Area | Coverage |
|---|---|
| Normalization | Entity names, phone digits, website hosts, and address keys normalize deterministically |
| Stable JSON | Recursive object-key sorting uses normal JSON serialization and omits undefined object fields |
| Entity resolution | Twelve synthetic scenarios resolve to the expected status/entity and expose named match signals |
| Identifier overlap | Repeated identifiers of the same type compare by value overlap rather than last-write-wins overwrite |
| Freshness | Verification age maps into CURRENT, DUE_SOON, STALE, EXPIRED, and UNKNOWN |
| Conflict detection | Conflicting candidate values are surfaced for review and agreeing normalized values are not collapsed into false conflicts |
| Review routing | Sensitive admission, transport, payer, and license fields require specialized proposed reviewer roles |
| Source authority | Discovery-only sources cannot support populated fields; operational use tightens allowed source tiers |
| Candidate validation | Packages require evidence, supported field paths, matching source tiers, canonical timestamps, no agent-created HUMAN_CONFIRMED state, and null instead of string Unknown |
| URL safety | Private, loopback, credentialed, and non-allowlisted outbound URLs are rejected by pure validation |
| Metrics | Synthetic evaluation metrics are deterministic |

## Explicit non-coverage

- No database persistence or Prisma migration.
- No API route, worker, queue, outbox, or service runtime.
- No app UI.
- No bridge behavior.
- No live scraping, external API, or egress.
- No production authorization decision.
- No PHI/PII.

## Required verification for this PR

Run from the repository root:

```bash
npm test -- tests/unit/network-enrichment-contracts.test.ts
npm run typecheck
npm run lint
npm run prisma:validate
git diff --check
```

If broader validation is needed before merge, run the full root `npm test`
suite after the focused contract suite passes.

## September 12, 2026 branch refresh verification

Refreshed the existing draft branch from `7b89b1e` by merging `origin/main`
at `35f16eb63ae0953b15802edb62fdfeb6f8795bfa`. The merge was automatic.
All four network kernel modules, both fixtures and the focused contract suite
remain byte-identical to the original branch. The diff against current main
remains the same ten contract, fixture, test and documentation paths; it adds
no network service, API, database migration, UI or bridge behavior.

Dependencies were installed using the merged main lockfile with `npm ci`.
Database regression checks used a freshly initialized PostgreSQL 18 cluster
on `127.0.0.1:54329`, role `clarity`, database `clarity_dev`, with all 19
existing migrations applied from scratch. This is an independent synthetic
test cluster; no existing developer database or running service was used.

| Current check | Result |
| --- | --- |
| `npm test -- tests/unit/network-enrichment-contracts.test.ts` | PASS, 28 tests. |
| `npm run prisma:validate` | PASS. |
| `npm run prisma:generate` | PASS, Prisma Client 6.19.3. |
| `npx prisma migrate deploy` | PASS, 19 migrations into the empty isolated cluster. |
| `npm test` with the isolated database URL | PASS, 560 tests across 54 files. |
| `npm run test:app` | PASS, 81 tests across 15 files. |
| `npm run typecheck` | PASS. |
| `npm run lint` | PASS. |
| `npm --workspace app run build` | PASS; existing 520.20 kB initial-JavaScript advisory remains. |
| `npm audit --audit-level=high` | PASS at the required threshold; three moderate advisories remain in Vitest/mocker and csv-parse. |
| `git diff --check origin/main` | PASS for the complete contract-only PR diff. |

The database environment was
`DATABASE_URL=postgresql://clarity@127.0.0.1:54329/clarity_dev?schema=public`.
The broader passing tests validate compatibility with the refreshed main
baseline; they do not implement or prove network-enrichment persistence.
The earlier missing-`DATABASE_URL` full-suite failure is historical and is
superseded by this isolated full-suite run. No contract conflict or new
runtime fix was needed.

A staged whitespace check against the pre-refresh branch also reported 1,038
CRLF lines in `WORKBOOK_SHEET_LINKS_2026-09-08.csv` inherited unchanged from
main. The PR and staged checks against `origin/main` pass; that unrelated
existing CSV is not normalized by this contract-only refresh.

Browser journeys and production/live-source checks were not run for this
contract-only refresh. No performance measurements taken. GitHub CI uses
PostgreSQL 16 and is checked separately at the published draft PR head.
