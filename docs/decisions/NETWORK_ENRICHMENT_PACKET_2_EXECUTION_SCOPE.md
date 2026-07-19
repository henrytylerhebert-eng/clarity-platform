---
status: Approved for scoped implementation (review-only, synthetic)
owner: Tyler / product owner
date: 2026-07-19
data_boundary: synthetic only
depends_on:
  - docs/decisions/NETWORK_ENRICHMENT_PACKET_2_DECISION_PACKET.md
  - docs/developer-handoff/NEXT_PERSISTENCE_HARDENING_EVIDENCE.md
---

# Network Enrichment Packet 2 Execution Scope (Review Slice)

## Packet 2 Goal

Build the first bounded service slice for network-enrichment review workflows using
in-memory gateways only. The packet must implement no DB persistence, no live
egress, and no external delivery while making the review contract operable for
future integration.

## Hard Gate

Packet 2 execution is authorized only because all four Packet 2 decisions are
checked in the decision packet as **approved**:

- Reviewer-role mapping
- Canonical ownership path
- ADR-0014 policy defaults
- Worker/egress boundary

## Files in Scope (Minimal)

1. `packages/domain-contracts/src/networkEnrichment.ts`
   - Keep contract surface canonical.
   - Add/confirm any role-alias helpers required for service mapping.
   - No contract shape broadening beyond approved decisions.

2. `packages/network-enrichment-service/src/reviewCommands.ts`
   - Add in-memory review command handlers for:
     - `submitForReview`
     - `approveReview`
     - `rejectReview`
   - Enforce deterministic status transitions and audit metadata.
   - Return explainable command results compatible with existing envelope patterns.

3. `packages/network-enrichment-service/src/reviewGateway.ts`
   - Implement a synthetic/in-memory persistence gateway.
   - No Prisma/DB calls.
   - Store only synthetic review rows in-process for this packet.
   - Preserve full rejection/capture details for explainability.

4. `packages/network-enrichment-service/src/index.ts`
   - Export reviewed command surface and gateway contracts.
   - Maintain a narrow service barrel; no API/HTTP bootstrap.

5. `packages/network-enrichment-service/test/reviewCommands.test.ts`
   - Add unit coverage for command happy-path, duplicate/replay handling, and
     reject/approve invariants.
   - Confirm unauthorized role mapping is rejected by domain-level checks.

6. `docs/developer-handoff/NEXT_PERSISTENCE_HARDENING_EVIDENCE.md`
   - Append Packet 2 execution evidence and approved gate handoff.

7. `docs/decisions/NETWORK_ENRICHMENT_PACKET_2_REVIEW_AND_ACCEPTANCE_RECORD.md` (optional)
   - Optional execution acceptance record for this slice.
   - Use after tests pass and before any subsequent runtime work.

## Explicit Non-Goals

- No Prisma models, migrations, or database I/O.
- No HTTP/API route registration.
- No worker, external fetch, or outbound transport.
- No producer/consumer event publishing or outbox delivery.
- No synthetic-to-production data transition.

## Exit Criteria for Packet 2

- `reviewCommands` + `reviewGateway` + `index` compile under `tsc --noEmit`.
- Unit tests for Packet 2 command behavior pass.
- No file changes outside the scoped set.
- Existing ADR gates remain unresolved for persistence, outbox, or worker
  capabilities.

## Suggested Commit Message

`feat: add network enrichment in-memory review service slice`

## Rollback Boundary

Packet 2 is safe to revert independently from Packet 1/Packet 3 by removing only
the `packages/network-enrichment-service` subtree and reverting this packet
document if needed.
