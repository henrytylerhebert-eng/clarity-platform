---
status: Proposed phase guide
version: 0.1.0
---

# Event Discovery Guide

## Objective

Classify meaningful actions and state changes without collapsing audit history,
governed events, timeline entries, readiness changes, and derived observations
into one object.

Every meaningful action MUST be considered. Not every action becomes a governed
event.

## Event Record

| Field | Required content |
|---|---|
| Event ID | Stable ID, such as `EVENT-09` |
| Event name | Source wording or proposed governed name |
| Event class | `SOURCE`, `AUDIT`, `TIMELINE`, `READINESS`, `DERIVED`, or `NONE` |
| Trigger | Action, source, time, or state change |
| Actor | Person, role, system, or external source |
| Evidence | Source that proves the action or state |
| State before | Relevant precondition |
| State after | Resulting fact or state |
| Aggregate/subject | Existing Clarity object and identity boundary |
| Tenant/scope | Organization, facility, program, unit, or other scope |
| Effective time | When the action/state was true |
| Recorded time | When Clarity recorded it |
| Audit action | Append-only audit record, or `None` with rationale |
| Governed event | Name/version, consumer, or `Deferred` |
| Outbox behavior | Persistence-only, future delivery, or `None` |
| Readiness impact | Dimensions affected |
| Correction | How the original is corrected |
| Supersession | How active history is resolved |
| Classification | WDP classification |
| Unknowns | Unresolved semantics or consumer need |

## Event Classes

| Class | Meaning | Current Clarity treatment |
|---|---|---|
| `SOURCE` | A persisted source fact or human/source-attested action | Transactional record may be paired with a governed event |
| `AUDIT` | Who changed what, why, and when | Append-only audit event; not automatically a consumer event |
| `TIMELINE` | Chronological display or handoff entry | May be derived from source/audit records |
| `READINESS` | A requirement or blocker state for a target | Must retain rule provenance and owner |
| `DERIVED` | Deterministic observation calculated from source facts | Must include inputs, evaluation time, quality, and derivation version |
| `NONE` | Action has no persisted event requirement in this scope | Rationale required; never silently omit it |

## Consumer Gate

Before proposing a new governed event, identify:

- named consumer;
- consumer purpose;
- source facts consumed;
- tenant and sensitivity boundary;
- retention and replay owner;
- correction and late-arrival behavior;
- event version owner;
- human review and security gates.

The current bounded event vocabulary is recorded in
`docs/decisions/EVENT_VOCABULARY_DECISION_PACKET.md`. Discovery must not add a
new event merely because an audit action or draft metric exists.

## Correction Rules

- Preserve the original source and event.
- Append a correction or reversal with a reason and actor.
- Link the correction to the superseded event.
- Enforce one active branch where the domain contract requires it.
- Keep source fact correction separate from derived recalculation.

## Gate

Phase 6 is complete only when every meaningful action has an event class,
consumer disposition, correction behavior, and audit decision. A proposed
governed event without a named consumer is `Owner Decision Required` or
`Deferred`, not implementation-ready.
