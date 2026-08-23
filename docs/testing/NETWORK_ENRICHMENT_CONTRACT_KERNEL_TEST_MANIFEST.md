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
