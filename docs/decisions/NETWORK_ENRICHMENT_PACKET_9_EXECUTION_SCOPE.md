---
status: Packet 9 execution scope
owner: Tyler / product owner
date: 2026-07-19
data_boundary: synthetic only
prerequisite:
  - docs/decisions/NETWORK_ENRICHMENT_PACKET_8_REVIEW_AND_ACCEPTANCE_RECORD.md (Packet 8 approved)
related_decisions:
  - docs/decisions/NETWORK_ENRICHMENT_PACKET_2_DECISION_PACKET.md
  - docs/decisions/NETWORK_ENRICHMENT_PACKET_2_REVIEW_AND_ACCEPTANCE_RECORD.md
  - docs/decisions/NETWORK_ENRICHMENT_PACKET_2_PLUS_RUNTIME_ROUTE_GATEWAY_ADAPTER.md
---

# Network Enrichment Packet 9 Execution Scope (Runtime Boundary Hardening)

## Packet 9 Goal
Add Packet 9 runtime hardening checks for the network-enrichment route layer without widening behavior: principal spoofing guards, version/conflict visibility, and consistent boundary error mapping for `approve` / `reject` flows.

## Scope and Constraints

### In Scope
- `tests/integration/api-service.test.ts`
  - Add route-level hardening tests for `approve` and `reject` paths that validate forged principal fields are rejected with `400 invalid_request`.
  - Add boundary checks for bad transition/version state surfaced from the service (e.g., wrong expected version should map to `409 conflict`).
- `docs/decisions/NETWORK_ENRICHMENT_PACKET_9_REVIEW_AND_ACCEPTANCE_RECORD.md` (gate + owner decision)
- `docs/developer-handoff/NEXT_PERSISTENCE_HARDENING_EVIDENCE.md` (append Packet 9 execution evidence)

### Out of Scope
- New persistence or egress.
- Worker/runtime replacement outside synthetic mode.
- API authentication redesign outside network-enrichment route guard tests.
- Any UI/domain-contract/schema additions.

## Non-goals
- No production transport migration.
- No DB-backed gateway in `api-service`.
- No external provider integration.

## Required Acceptance for Packet 9
- Packet 9 gate is reviewed and approved before merge.
- No files outside the runtime boundary above are changed.
- All Packet 9 checks pass:
  - `npx vitest run tests/integration/api-service.test.ts --root .`
  - `npm run lint --workspace=packages/network-enrichment-service`
  - `npm run test --workspace=packages/network-enrichment-service`
  - `npx tsc --noEmit`
