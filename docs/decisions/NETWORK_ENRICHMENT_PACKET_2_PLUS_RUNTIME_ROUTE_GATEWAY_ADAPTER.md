---
status: Packet 2+ acceptance evidence
owner: Tyler / product owner
date: 2026-07-19
data_boundary: synthetic only
decision_reference:
  - docs/decisions/NETWORK_ENRICHMENT_PACKET_2_REVIEW_AND_ACCEPTANCE_RECORD.md
  - docs/decisions/NETWORK_ENRICHMENT_PACKET_2_DECISION_PACKET.md
related_files:
  - packages/api-service/src/reviewCommandCaller.ts
  - packages/api-service/src/server.ts
  - packages/api-service/src/devMain.ts
  - packages/api-service/src/index.ts
  - tests/integration/api-service.test.ts
---

# Packet 2+ Runtime Route Gateway Adapter (Synthetic Boundary)

## Purpose

This record documents the next approved Packet 2+ runtime slice: how `api-service`
exposes route-level network-enrichment review commands through a dedicated
runtime-composition boundary that remains synthetic-only by default.

## Interface and Behavior (Non-Widening Scope)

- The API route handlers in `packages/api-service/src/server.ts` continue to serve
  only local HTTP (`node:http`) and do not add any framework or transport stack.
- New route handlers remain limited to:
  - `POST /api/network-enrichment/synthetic/reviews/submit`
  - `POST /api/network-enrichment/synthetic/reviews/approve`
  - `POST /api/network-enrichment/synthetic/reviews/reject`
- The `networkEnrichmentReviewInvoker` is resolved once at server construction as:
  `deps.networkEnrichmentReviewInvoker ?? createNetworkEnrichmentReviewCommandCaller()`.
- `createNetworkEnrichmentReviewCommandCaller` is a dedicated invocation module in
  `packages/api-service/src/reviewCommandCaller.ts` and is re-exported from
  `packages/api-service/src/index.ts`.
- The default invocation path is synthetic-only because
  `createNetworkEnrichmentReviewRuntime(...)` (used by the command caller) still
  defaults to `InMemoryNetworkReviewGateway`.
- Route tests intentionally assert:
  - successful submit → approve flow,
  - replay semantics,
  - reject flow,
  - unauthorized role denial.

## Hardening Checkpoints

- [x] No DB imports or Prisma adapters were added in `api-service`.
- [x] No outbound network transport was introduced in this lane.
- [x] The synthetic route is explicit in URL naming and cannot be confused with any live/production worker path.
- [x] The composition point is isolated from route logic, allowing future
  replacement by a caller adapter while preserving Packet 2 boundary guarantees.

## Route-Level Decision Path

- Decision: `[x] Approve Packet 2+ runtime route adapter`  `[ ] Revise`  `[ ] Defer`
- Owner: Tyler / product owner
- Date: `2026-07-19`
- Notes: Approved for route-level synthetic enforcement only. Real persistence, worker
  execution, and external egress remain out of scope.
