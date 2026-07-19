---
status: Proposed phase guide
version: 0.1.0
---

# Readiness Discovery Guide

## Objective

Describe whether each workflow stage can progress without hiding independent
workstreams inside one combined score.

## Readiness Record

| Field | Required content |
|---|---|
| Readiness ID | Stable ID, such as `READY-05` |
| Target | Stage, handoff, decision, or output that may progress |
| Dimension | Clinical, operational, placement, financial, legal, authorization, transport, or facility-specific dimension |
| State | Owner-defined state set; do not invent a state without review |
| Satisfied requirements | Source-supported requirements currently met |
| Missing requirements | Specific missing inputs or reviews |
| Blockers | Conditions that stop this target only |
| Dependencies | Other stages or workstreams required |
| Responsible owner | Role responsible for resolving the blocker |
| Workspace | Where the owner works |
| Evidence | Source links and review state |
| Rule provenance | Policy/rule/configuration reference and version |
| Freshness | Validity period or recheck trigger |
| Review requirement | Human role and approval status |
| Classification | WDP classification |
| Unknowns | Remaining uncertainty |

## Current Clarity Alignment

The existing `ReferralReadiness` contract intentionally separates:

- clinical urgency;
- operational readiness;
- placement readiness;
- financial readiness.

Discovery MUST preserve that separation. A workflow MAY add a dimension only
with an owner decision and domain rationale. It MUST NOT rank or block emergency
clinical work from financial readiness.

## Dependency Map

| Target | Depends on | Does not depend on | Blocker owner | Evidence |
|---|---|---|---|---|
| `[Target]` | `[Required dimensions/records]` | `[Independent lane]` | `[Role]` | `[Source]` |

## Readiness Questions

1. What exact target is trying to progress?
2. Which requirements are satisfied and by what evidence?
3. Which missing item blocks this target, and which items do not?
4. Can another workstream continue independently?
5. Who owns the blocker and by when?
6. What rule or facility configuration creates the requirement?
7. How fresh must the evidence be?
8. What human review is required before the state changes?
9. What happens when evidence conflicts or expires?

## Gate

Phase 5 is complete only when every blocker has an owner, every state has
provenance, and independent workstreams remain independently represented.
