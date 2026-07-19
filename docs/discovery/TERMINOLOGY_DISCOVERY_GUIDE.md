---
status: Proposed phase guide
version: 0.1.0
---

# Terminology Discovery Guide

## Objective

Create a shared vocabulary before describing workflow behavior. Terminology is
not normalized by spelling alone; two similar words may represent different
owners, lifecycle states, or legal/clinical contexts.

## Term Record

| Field | Required content |
|---|---|
| Term ID | Stable discovery term ID |
| Term as spoken | Exact SME wording |
| Proposed display term | Only when accepted; otherwise `Unknown` or `Owner Decision Required` |
| Definition | What the term means in this workflow |
| Does not mean | Nearby concepts explicitly excluded |
| Owner | Person or role accountable for meaning |
| Creator | Who creates or initiates it |
| Consumer | Who uses it and for what purpose |
| Begin condition | Event or source that starts its lifecycle |
| End condition | Event or source that closes, supersedes, or retires it |
| Evidence | Source document, policy, interview, or observation |
| Documents | Forms, reports, orders, messages, or records that represent it |
| Events | Audit, governed, timeline, or derived events that affect it |
| Classification | WDP classification |
| Status | `OPEN`, `DEFINED`, `AMBIGUOUS`, `OWNER_REVIEW`, `SUPERSEDED` |
| Unknowns | Remaining ambiguity and resolution path |

## Interview Questions

Ask in order:

1. What exact word or phrase do people use?
2. What does it mean here?
3. What does it not mean?
4. Who owns the meaning and who may change it?
5. Who creates it and who consumes it?
6. What starts and ends its lifecycle?
7. What document or evidence supports it?
8. What happens when two people use the term differently?
9. Is the term a source fact, interpretation, decision, readiness state, event,
   or derived observation?

## Rules

- Preserve acronyms with their expansion on first use, for example `MAR =
  Medication Administration Record`.
- Preserve source wording in the term record even when a display term is later
  accepted.
- Do not treat a job title as a permission or a legal authority.
- Do not treat a policy label as proof that the policy applies to this case.
- Do not combine terms because they appear adjacent in a workflow.
- When a term is jurisdiction-specific, record jurisdiction and effective date.
- When a term is payer-specific, record payer, plan, source, and verification
  time.
- When a term is facility-specific, record facility configuration ownership.

## Gate

Phase 1 is complete only when every material term is either defined with owner
and evidence or explicitly marked `AMBIGUOUS`, `Unknown`, or `Owner Decision
Required`. An ambiguous term cannot be used to mark implementation readiness.
