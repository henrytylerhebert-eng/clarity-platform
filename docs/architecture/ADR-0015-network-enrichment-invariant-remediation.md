# ADR-0015: Network-enrichment invariant remediation (Phase 2 of the branch reconciliation)

- **Status:** Accepted (owner-directed 2026-07-19; scope-of-work Phase 2)
- **Builds on:** the packet-based network-enrichment implementation on
  `codex/om/sync-main` (packets 1–16), the networkEnrichment contracts split,
  ADR-0014 (prescreen role mapping)
- **Related:** `docs/decisions/NETWORK_ENRICHMENT_REAL_DATA_INCIDENT.md`,
  OD-13 (network-enrichment service/worker boundary)

## Context

An independent comparison of the network-enrichment work against the
repository's standing invariants found seven defects in
`packages/network-enrichment-service` and its surroundings. The owner
directed remediation before `codex/om/sync-main` merges to `main`. Items 6
and 7 (real-world seed data; live agent prompt in the operational tree) are
governance items recorded in the incident document above. This ADR records
the five engineering fixes.

## Decisions

### 1. One-Prisma-package rule restored

`PrismaNetworkReviewGateway` moved from
`packages/network-enrichment-service/src/prismaReviewGateway.ts` to
`packages/case-repository/src/networkReviewGateway.ts`, where every other
Prisma gateway lives. The service keeps its `NetworkReviewGateway` port and
consumes the implementation structurally, so `case-repository` keeps its
single dependency on `domain-contracts` and the service package no longer
imports `@prisma/client` (type-only or otherwise). The legacy facility
seed script was likewise rewritten to obtain its client from
`createPrismaClient` (see the incident record).

### 2. Dual review enforced fail-closed

`approveReview` now reads `NETWORK_REVIEW_FIELD_POLICIES` for the review's
sensitivity category. Where `oneReviewSuffices` is false (clinical criteria,
legal-status requirements), a single approval records an `APPROVE_REVIEW`
audit and bumps the version but leaves the review pending; `HUMAN_CONFIRMED`
requires a second approval from a **distinct** actor, and the same actor
approving twice is a validation error. Previously one approval from any
holder of one overlapping role confirmed any field, making the declared
`ALL_DISTINCT` dual-review policy dead configuration.

### 3. Append-only audit restored at the database boundary

Migration `20260720014914_network_review_append_only_audit` changes two
foreign keys from `ON DELETE CASCADE` to `ON DELETE RESTRICT`:
`NetworkReviewAudit → NetworkReview` and
`NetworkReview → NetworkReviewPackage`. Deleting a package can no longer
silently erase its reviews and their audit trail — the same
immutability-by-construction posture as every other audited aggregate.
Applied to local `clarity_dev` only; smallest possible change (two
constraint swaps, no data movement).

### 4. Governed-event payload hash made honest

The network-enrichment outbox writer stamped every governed event with a
`payloadHash` of 64 zeros while declaring `quality.state: "VALID"`. It now
computes the real SHA-256 of the serialized payload. A placeholder integrity
hash presented as valid is worse than no hash.

### 5. Reconciliation gated on actual confirmed reviews

`reconcilePackage` refused nothing before: it stamped the package
`HUMAN_CONFIRMED` with reason "promoted to canonical CRM" even with zero
confirmed reviews and no canonical write occurring. It now fails closed
unless at least one review is `HUMAN_CONFIRMED` and no review remains
`REVIEW_PENDING` or `CONFLICT`, and the default status reason no longer
claims a canonical/CRM promotion that does not happen.

## Consequences

- Tests that encoded the old permissive behavior were updated to encode the
  gates instead; new coverage asserts the dual-review path and the
  reconcile gate in both directions.
- The declared-but-unenforced policy fields (`oneReviewSuffices`) are now
  load-bearing; changing them changes runtime authorization outcomes.
- The remaining known gaps are recorded in OD-13 and are NOT resolved here:
  reviewer-role mapping is still a proposed alias map, sensitivity is still
  caller-supplied rather than derived from the field path, `ALL_DISTINCT`
  is enforced as distinct-actor count (not distinct-role assignment), no
  RLS exists on the network tables, and no canonical write path exists.

## Honesty statement

Not claimed: production readiness, RLS on network-enrichment tables,
resolution of OD-13, clinical/legal approval of any policy content, any
canonical CRM write path, external delivery of the outbox events. Synthetic
data only.
