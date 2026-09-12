# ADR-0019: Network enrichment contract kernel

- **Status:** Proposed (clean replacement PR from current `main`)
- **Date:** 2026-08-23
- **Branch refresh:** 2026-09-12; merged `origin/main` at
  `35f16eb63ae0953b15802edb62fdfeb6f8795bfa` into the existing draft branch.
  The merge required no conflict resolution and did not change the kernel's
  contracts, fixtures, tests or contract-only scope.
- **Supersedes:** the contract-only portion of PR #29 and the domain-contract
  portion of PR #30
- **Does not supersede:** PR #30 service, API, migration, UI, bridge, tooling,
  or generated-output work

## Context

Two prior network-enrichment lanes accumulated useful work and unrelated
drift:

- PR #29 introduced a contract-first network-enrichment package with focused
  fixtures and unit tests.
- PR #30 split later network-enrichment contracts into resolution and review
  modules, but also included service/runtime work, API and persistence work,
  bridge updates, generated Graphify output, donor package roots, and broader
  docs/tooling churn.

That made the review surface too large. The replacement strategy is to start
from current `main` and bring over only the shared contract kernel:

```text
candidate resolution contracts
  -> review/persistence workflow contracts
  -> future controlled service/API/persistence/UI work
```

The kernel is the smallest useful source-of-truth boundary. It defines types,
schemas, pure validation, deterministic normalization, entity-resolution
helpers, source-authority rules, freshness rules, conflict detection, and
human-review command contracts. It does not fetch, scrape, persist, promote,
or mutate canonical facility/network records.

## Decision

Adopt the network-enrichment contract kernel under
`packages/domain-contracts/src/`:

- `networkEnrichmentShared.ts`
- `networkEnrichmentResolution.ts`
- `networkEnrichmentReview.ts`
- `networkEnrichment.ts`

Export the kernel from the domain-contracts package root and preserve #29's
focused synthetic contract fixtures/tests.

This PR intentionally fixes the contract-level review findings while bringing
the kernel over:

1. Stable JSON comparison uses recursive key sorting and normal
   `JSON.stringify`, so `undefined` object fields are omitted instead of
   producing invalid JSON.
2. The imported contract kernel contains no fingerprint-generator function;
   only a `fingerprint` type field remains. Any later runtime generator must
   use the stable serializer before service/API adoption.
3. Entity identifiers are grouped by type with sets of values, so repeated
   identifiers of the same type are compared by overlap instead of being
   overwritten.
4. Candidate-package validation rejects `"Unknown"` in a case-insensitive,
   trim-aware way; unknown scalar values remain `null`.

The #30 bridge and UI review findings are not fixed here because those files
are deliberately excluded from this replacement PR. They remain service/UI
follow-up scope if and when that material is brought forward.

## Boundaries

Included:

- Pure TypeScript/Zod domain contracts.
- Synthetic fixtures for contract validation.
- Unit tests for resolution, freshness, conflict detection, source authority,
  candidate-package validation, outbound URL validation, and deterministic
  metrics.
- This ADR and the matching test manifest.

Excluded:

- Graphify output and generated reports.
- Donor/root source-package directories.
- Network-enrichment service/runtime package.
- API routes, Prisma schema changes, migrations, queues, outbox persistence,
  and background workers.
- App UI changes.
- `agents/bridge` changes.
- Apps Script/tools and external connector behavior.

## Consequences

- Review becomes tractable: the kernel can merge independently of the #30
  runtime/UI/bridge knot.
- The shared vocabulary and validation rules become available for future
  service/API work without implying that service/API work exists.
- The unresolved mapping between proposed reviewer-role vocabularies and
  canonical `UserRole` remains explicit. The resolution-side vocabulary is
  not an authorization system.
- Future runtime work must prove persistence, authorization, idempotency,
  outbox, promotion, and audit behavior separately.

## Open questions

- Which canonical entity owns promoted network enrichment values?
- What exact reviewer-role mapping is owner-approved for production commands?
- What server command is allowed to promote candidate data into canonical
  network records?
- Which source registries are approved for live enrichment, and under what
  egress/privacy constraints?
- What operational readiness criteria are required before any non-synthetic
  use?

## Honesty statement

This ADR does not claim production readiness, live integrations, PHI/PII
readiness, clinical/legal/payer correctness, deployment, API availability,
or measurable operational improvement. No measurements found. All fixtures in
this PR are synthetic.
