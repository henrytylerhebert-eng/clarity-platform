---
status: Proposed phase guide
version: 0.1.0
---

# Decision Discovery Guide

## Objective

Make every consequential decision explicit, owned, source-supported, and
reviewable. Discovery describes the decision; it does not make the decision.

## Decision Object

| Field | Required content |
|---|---|
| Decision ID | Stable ID, such as `DEC-07` |
| Name | Owner-accepted decision name |
| Purpose | What the decision controls |
| Decision owner | Role with authority to decide |
| Actor | Person/role performing the decision |
| Evidence required | Documents, facts, observations, or reviews |
| Evidence status | Candidate, approved, rejected, unclear, or other canonical status |
| Possible outcomes | Complete enumerated outcome set; include `Unknown` where valid |
| Prerequisites | Conditions before decision can occur |
| Required approvals | Independent or domain-specific review gates |
| Exceptions | Permitted exceptions and authority |
| Appeals/reconsideration | Who can challenge and how |
| Correction | Append-only correction and supersession behavior |
| Audit event | Action preserving who/why/when |
| Governed event | Proposed event, consumer, and version, or explicit `None` |
| Readiness impact | Dimensions and dependencies affected |
| Classification | WDP classification |
| Owner decision required | Exact unresolved choice |

## Decision Questions

1. Is this a decision, a fact, a readiness state, or a recommendation?
2. Who has authority, and what source establishes that authority?
3. What evidence is required, and what evidence is insufficient?
4. Can the outcome be `Unknown`, `Pending`, or `Not Required`?
5. What happens when inputs conflict?
6. What is the safe result when the decision cannot be made?
7. Who may correct, reverse, appeal, or supersede the decision?
8. Is an audit action enough, or is a governed event needed by a named
   consumer?

## Decision Safety Rules

- No AI, system, payer memory, facility heuristic, or readiness score may be
  presented as a human clinical, legal, admission, placement, or authorization
  decision.
- `At risk` is a risk flag and MUST NOT replace a coverage outcome.
- A decision outcome MUST not be derived from an unapproved source.
- A correction MUST preserve the original decision, actor, evidence, and
  reason.
- If authority is unclear, the outcome is `Owner Decision Required`, not a
  guessed role.

## Gate

Phase 3 is complete only when every decision has an owner, evidence basis,
outcome set, exception behavior, correction behavior, and approval status.
