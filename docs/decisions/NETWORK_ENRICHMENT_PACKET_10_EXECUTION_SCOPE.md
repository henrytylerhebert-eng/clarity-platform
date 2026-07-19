---
status: Packet 10 execution scope
owner: Tyler / product owner
date: 2026-07-19
data_boundary: synthetic only
prerequisite:
  - docs/decisions/NETWORK_ENRICHMENT_PACKET_9_REVIEW_AND_ACCEPTANCE_RECORD.md (Packet 9 approved)
related_decisions:
  - docs/decisions/NETWORK_ENRICHMENT_PACKET_2_DECISION_PACKET.md
  - docs/decisions/NETWORK_ENRICHMENT_PACKET_2_PLUS_RUNTIME_ROUTE_GATEWAY_ADAPTER.md
  - docs/decisions/NETWORK_ENRICHMENT_PACKET_2_REVIEW_AND_ACCEPTANCE_RECORD.md
---

# Network Enrichment Packet 10 Execution Scope (Runtime Continuation)

## Packet 10 Goal
Advance the runtime/service slice one step beyond Packet 9 by locking idempotency/state error behavior at HTTP level for `network-enrichment/synthetic/reviews/*`, and by adding a dedicated synthetic-path regression for stale or duplicate state transitions after a successful decision.

## Scope and Constraints

### In Scope
- `tests/integration/api-service.test.ts`
  - Add route-level regression for **idempotency conflict** (`409 conflict`) when duplicate idempotency key is reused with different payload for approve/reject.
  - Add regression for **not-found** and **invalid state transition** handling at HTTP boundary when a review id is missing or already terminal.
  - Add regression for **non-existent review id** on approve/reject to keep boundary error mapping stable.
  - Preserve synthetic-only transport path and existing strict schema checks.
- `docs/decisions/NETWORK_ENRICHMENT_PACKET_10_REVIEW_AND_ACCEPTANCE_RECORD.md`
  - Decision gate for Packet 10.
- `docs/developer-handoff/NEXT_PERSISTENCE_HARDENING_EVIDENCE.md`
  - Append Packet 10 execution evidence after completion.

### Out of Scope
- Any persistence/egress/worker integration.
- Auth flow redesign.
- Domain contract or schema changes.
- UI changes.

## Non-goals
- No production transport migration.
- No DB-backed gateway in `api-service` for Packet 10.
- No provider-specific runtime integration.

## Required Acceptance for Packet 10
- Packet 10 scope must be approved before implementation begins.
- Packet 10 stays strictly runtime boundary-only and synthetic-only.
- Verification commands at merge checkpoint:
  - `npx vitest run tests/integration/api-service.test.ts --root .`
  - `npm run lint --workspace=packages/network-enrichment-service`
  - `npm run test --workspace=packages/network-enrichment-service`
  - `npx tsc --noEmit`
