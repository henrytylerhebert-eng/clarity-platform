---
status: OWNER_REVIEW
discovery_id: DISC-20260719-PC-001
version: 0.1.0
data_boundary: synthetic only
---

# Decision Matrix

| Decision ID | Decision | Owner | Evidence | Outcomes | Prerequisites / approvals | Correction behavior |
|---|---|---|---|---|---|---|
| `DEC-PC-001` | Is the PEC source packet ready for legal/clinical review? | Source/legal reviewer | PEC source, coroner source, issue/expiration, jurisdiction | Ready, incomplete, returned | Qualified review; system does not validate law | Append source correction and preserve original |
| `DEC-PC-002` | Is the patient accepted by Oceans? | April / Angela human workflow | Packet, unit/bed context, clinical review | Accepted, declined, pending, returned | Receiving-facility authority | Append response correction; do not rewrite history |
| `DEC-PC-003` | Can admission handoff be recorded? | Authorized receiving staff | Acceptance, arrival, handoff, timezone config | Recorded, blocked, corrected | Source acceptance and explicit timezone | Append correction; episode event remains auditable |
| `DEC-PC-004` | Is the MAR candidate complete for medication review? | Judy Booty with prescriber/facility gate | Medication source, orders, last doses, allergies | Complete, incomplete, refused, awaiting review | Prescriber/facility medication review | Preserve prior MAR facts and append correction |
| `DEC-PC-005` | What is the pre-admission authorization-readiness state? | Existing pre-admission workflow | Coverage, quote, evidence, authorization source | Existing contract outcomes | Existing behavior unchanged | Existing authorization correction rules |
| `DEC-PC-006` | What is the post-admission UR ownership? | Human project owner / UR lead | Episode link, review request, role matrix | Victor performs review in this synthetic scenario | Scenario rule; not Medicare policy | Append role or review correction |
| `DEC-PC-007` | What is the episode-day authorization coverage outcome? | Victor / authorized UR reviewer | Day request, source documentation, payer response | Approved, denied, pending, expired, unrequested, unknown, not-required | Source review and versioned derivation | Append reversal/supersession; never overwrite |
| `DEC-PC-008` | Which authorization risks are present? | UR reviewer | Documentation gaps, due times, freshness, source quality | None, documentation gap, due-date exposure, stale source, other | Separate from outcome | Append risk correction; outcome remains unchanged |
| `DEC-PC-009` | Should a new governed event type be added? | Technical/product owner | Named consumer and event vocabulary packet | Use existing event, defer, propose new event | Explicit consumer and domain decision | No runtime event until accepted |

## Working Decisions

- The initial post-admission outcome is `PENDING`.
- The initial risk flags are `DOCUMENTATION_GAP` and `DUE_DATE_EXPOSURE`.
- `AT_RISK` is not added to the coverage outcome set.
- The facility response and clinical acceptance remain human source facts.
- Victor's dual role is allowed only as a synthetic scenario constraint and
  must be visible in audit metadata if this ever becomes an approved design.
