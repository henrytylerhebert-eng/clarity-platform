---
status: Proposed phase guide
version: 0.1.0
---

# Workflow Discovery Guide

## Objective

Capture the workflow one stage at a time without optimizing, merging, or
silently filling gaps.

## Stage Record

| Field | Required content |
|---|---|
| Stage ID | Stable ordered ID, such as `WF-03` |
| Stage name | Owner-accepted name or source wording |
| Purpose | Why the stage exists |
| Entry criteria | Conditions required to start |
| Trigger | Action, event, document, time, or human request |
| Inputs | Existing facts, documents, evidence, or decisions |
| Owner | Role accountable for completing the stage |
| Participants | Roles that contribute, review, or receive output |
| Actions | What people actually do, in order |
| Outputs | Facts, documents, decisions, tasks, or handoffs produced |
| Exit criteria | Conditions required to leave the stage |
| Approvals | Required reviewers and authority |
| Dependencies | Other stages, workstreams, policies, or external facts |
| Failure paths | What happens when the stage cannot proceed |
| Correction paths | How errors are corrected without erasing history |
| Audit implications | What must be recorded and why |
| Readiness impact | Which readiness dimension changes |
| Classification | WDP classification for the stage description |
| Unknowns | Missing process or authority information |

## Stage Walkthrough

For each stage ask:

1. What starts this stage?
2. What must already be true?
3. Who does the work and who is accountable?
4. What does the person do, in actual order?
5. What information or document is read?
6. What information or document is created?
7. What decision, handoff, or state change results?
8. What blocks progress and who owns the blocker?
9. What happens when the input is missing, contradictory, late, or corrected?
10. What proves the stage happened?
11. Which separate workstreams may continue while this stage is blocked?

## Exception Matrix

| Stage ID | Exception | Detection | Immediate owner | Safe state | Recovery/correction | Audit |
|---|---|---|---|---|---|---|
| `[WF-ID]` | `[Missing/late/conflicting input]` | `[How found]` | `[Role]` | `[Blocked/Needs clarification]` | `[Next action]` | `[Record]` |

## Handoff Matrix

| From stage | To stage | Sending role | Receiving role | Required payload | Acceptance evidence | Failure owner |
|---|---|---|---|---|---|---|
| `[Stage]` | `[Stage]` | `[Role]` | `[Role]` | `[Source-linked content]` | `[Attestation/receipt]` | `[Role]` |

## Rules

- A narrative summary is not a workflow stage map.
- A stage may have parallel work, but each branch needs its own owner,
  readiness, dependencies, and exit condition.
- Missing data becomes a gap or blocker; it does not become a negative answer.
- A human approval remains a human approval even if the system displays a
  readiness state.
- Financial readiness MUST NOT be made a hidden prerequisite for emergency
  clinical work in the current Clarity model.

## Gate

Phase 2 is complete only when the SME confirms that no stage, exception,
handoff, or correction path has been skipped. If the SME cannot confirm this,
the workflow is `DISCOVERY_INCOMPLETE`.
