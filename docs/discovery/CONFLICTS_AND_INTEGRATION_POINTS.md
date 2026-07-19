---
status: Proposed integration and conflict register
version: 0.1.0
data_boundary: synthetic only for examples
---

# Discovery Integration And Conflict Register

## Purpose

This register explains how the Workflow Discovery Protocol (WDP) fits the
current Clarity repository. It is a documentation boundary, not an
architecture decision or implementation authorization.

## Compatibility Assessment

There is no identified production architecture conflict because the WDP is
documentation and governance only. It does not add a runtime, schema, API,
worker, projection, analytics mart, UI, integration, or deployment control.

The WDP may be adopted only if the following existing authorities remain in
place:

| Existing authority | Required relationship | Conflict if ignored |
|---|---|---|
| `ARCHITECTURE.md` and `docs/architecture/` | Discovery proposes requirements; accepted architecture decisions remain in ADRs | Interview notes could be mistaken for architecture approval |
| `docs/governance/PRODUCT_EVIDENCE_AND_DECISION_PROTOCOL.md` | WDP classifications provide discovery traceability; product claim/status labels remain canonical | Discovery confidence could be presented as implementation evidence |
| `docs/governance/HUMAN_APPROVAL_GATES.md` | Clinical, legal, payer, placement, security, and owner gates still apply | Discovery could be mistaken for qualified approval |
| `docs/workflows/` | Accepted workflow requirements are promoted after review | The ledger could become a parallel workflow source of truth |
| `packages/domain-contracts/` | Accepted terms and transitions are mapped into reviewed contracts | A discovered label could create an unapproved state or enum |
| `prisma/schema.prisma` | Persistence requirements are routed through the existing schema and decision process | Ledger fields could be mistaken for persistence requirements |
| `IMPLEMENTATION_STATUS.md` | Only verified repository work changes implementation status | A completed interview could be reported as implemented |
| Audit, governed events, and outbox records | Discovery describes candidate semantics; runtime records are separate | A proposed event could be treated as emitted or delivered |

## Specific Boundaries

### Discovery Ledger Versus Runtime Records

The append-only discovery ledger preserves interview history and answer
corrections. It is not a Prisma model, audit table, governed event, outbox
record, or analytics fact. A later implementation may cite ledger IDs, but it
must not silently use the ledger as transactional state.

### Discovery Classifications Versus Evidence Labels

`Owner Defined`, `Source Reported`, `Observed`, `Verified`, `Derived`,
`Assumed`, `Unknown`, and `Owner Decision Required` are WDP classifications.
They do not replace evidence status, product claim status, implementation
status, or qualified domain-review labels. Promotion requires the destination
record's existing rules.

### Readiness Versus Decisions

The WDP preserves separate readiness dimensions. It must align with Clarity's
existing clinical, operational, placement, and financial readiness boundaries.
It must not create a combined score, turn a blocker into an outcome, or make
financial readiness block emergency clinical review.

### Events Versus Event Proposals

Event discovery distinguishes source facts, audit actions, governed events,
timeline entries, readiness changes, and derived observations. No event is
emitted by completing a discovery session. New event types require a named
consumer, accepted vocabulary decision, domain contract, persistence boundary,
and focused tests before implementation.

### Domain Mapping Versus Domain Creation

The phase guides prefer existing Case, Episode, Evidence, Document, Review,
Authorization, Documentation Gap, MAR, Transport, Custody, Audit, Governed
Event, and Outbox concepts where their lifecycle and ownership fit. A
`Potential New Domain Object` is a review state, not permission to add a model,
contract, route, or UI.

### Sensitive And Regulated Domains

Discovery may capture a synthetic description of a clinical, legal, benefits,
authorization, placement, or operational workflow. It may not validate law,
clinical criteria, payer policy, admission authority, placement authority, or
external action. Those claims remain subject to the applicable qualified human
review and existing Clarity gates.

## Adoption Recommendations

Before using WDP for a new workflow, the owner should:

1. Accept the package status and appoint a facilitator, recorder, and required
   domain reviewers.
2. Create a session-specific record from the template under an owner-approved
   location; keep the ledger append-only.
3. Name the existing canonical workflow, contract, ADR, evidence, readiness,
   and implementation-status destinations before asking implementation agents
   to act.
4. Route unresolved items to `docs/decisions/OPEN_DECISIONS.md`, a dedicated
   decision packet, or the appropriate domain review record.
5. Require an explicit implementation handoff after discovery. WDP adoption
   alone does not authorize code or persistence changes.

## Current Recommendation

`Owner Decision Required`: adopt WDP as the proposed documentation-level
requirements-acquisition protocol, with this register and the package README
serving as the boundary against source-of-truth drift.
