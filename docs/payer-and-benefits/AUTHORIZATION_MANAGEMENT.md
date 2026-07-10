---
status: Integrated draft
owner: TBD (requires revenue-cycle review)
version: 1.0.0
last_integrated: 2026-07-10
source_artifacts:
  - MASTER_ARCHITECTURE.md §14 (partial package)
  - INTEGRATION_PLAN.md sprint 6C (database artifact)
  - prisma/schema.prisma (authorization models)
unresolved_conflicts: "Package payer spec missing (05-…)"
related_requirements: REQ matrix authorization rows
related_adrs: ADR-0002
---

# Authorization Management

Tracks preparation → submission → pending → approval / partial approval / denial → appeal, plus approved dates/units and concurrent-review dates. Transition rules live in `packages/domain-contracts/src/authorization.ts` (tested: invalid transitions rejected).

Rules:

- Agents may **prepare** materials; an authorized human records or initiates any external action.
- Authorization does not guarantee reimbursement (disclaimer parallel to the benefits rule).
- Medical-necessity output is an input to authorization preparation, never an approval.
- Feature-flagged: `authorization_management` (default off).
- No payer portal, clearinghouse, or EHR integration exists or may be added without security review — `integrations` remain documented-only.
