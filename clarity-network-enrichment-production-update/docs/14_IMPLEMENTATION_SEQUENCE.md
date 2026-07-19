# Implementation Sequence

## Slice 0 — Repository reconciliation

- Inspect current Organization/Facility/Program models.
- Reconcile ADR-0012 and package conventions.
- Produce exact path and collision map.
- No behavior changes.

## Slice 1 — Domain accuracy contracts

- Add enums, schemas, normalization, entity resolution, source authority, freshness and conflict logic.
- Add synthetic fixtures and focused tests.
- No database or API.

## Slice 2 — Candidate persistence

- Add tenant-scoped enrichment-run, candidate, evidence, conflict and review-decision tables.
- Add gateways, idempotency and audit atomicity.
- Candidate-only; no canonical mutation.

## Slice 3 — Review queue projection

- Server-owned read-only queue.
- Permission filtering before browser response.
- Provenance and freshness visible.

## Slice 4 — Controlled approval commands

- Field-level approve/reject/clarify/conflict-resolution.
- Optimistic concurrency and supersession.
- Canonical mapping limited to low-risk identity/contact fields first.

## Slice 5 — Sensitive profile governance

- Admission, payer, transport and legal/guardian review routes.
- Dual review where policy requires.
- No automated routing decision.

## Slice 6 — Bounded live research adapters

- Official source allowlist first.
- Egress proxy, rate limits, SSRF defense, source snapshots and tool audit.
- Human review remains mandatory.

## Slice 7 — Production pilot

- One tenant, selected facilities, adjudicated sample.
- Measure false merges, evidence coverage, conflicts, stale detection and review burden.
- Adjust thresholds before expansion.
