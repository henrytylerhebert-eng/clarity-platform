---
status: Proposed; no event-vocabulary implementation authorized
owner: Tyler/product owner with domain, technical, security, and operations review
date: 2026-07-19
data_boundary: synthetic only
related_decisions:
  - docs/decisions/NEXT_PERSISTENCE_HARDENING_DECISION_PACKET.md
  - docs/decisions/OUTBOX_DELIVERY_BOUNDARY_DECISION.md
  - docs/decisions/S2_PERSISTENCE_DECISION_PACKET.md
  - docs/developer-handoff/NEXT_PERSISTENCE_HARDENING_EVIDENCE.md
---

# Event Vocabulary Decision Packet

## Purpose

Define the smallest governed-event vocabulary needed for future reviewable
consumers without confusing transactional facts, audit actions, and derived
analytics observations. This packet is a proposal only. It authorizes no new
event schema, persistence behavior, projection, worker, metric, API, or
external delivery.

## Truth Boundary

The canonical operational facts remain the transactional episode,
authorization, review, day-decision, and documentation-gap records. Governed
events are append-only, source-linked records for controlled downstream use.
Audit actions and status-history rows remain audit/history evidence; they do
not become governed events merely because they have similar names. Derived
episode-day state is an observation, not a replacement for source facts.

## Current Repository Inventory

| Event or action | Current evidence | Current state | Consumer evidence |
|---|---|---|---|
| `ADMISSION_RECORDED.v1` | `AdmissionRecordedEventPayloadSchema`; emitted by `recordAdmission` | Governed event emitted and persisted with an outbox row | No runtime consumer found; read gateway only retrieves by tenant and event ID |
| `AUTHORIZATION_DAY_DECISION_RECORDED.v1` | `AuthorizationDayDecisionRecordedEventPayloadSchema`; emitted for each day-decision range | Governed event emitted and persisted; correction reversals reuse this event name with envelope correction metadata | No projection, mart, worker, or external consumer found |
| `DOCUMENTATION_GAP_RECORDED.v1` | `DocumentationGapRecordedEventPayloadSchema`; emitted when a gap is created | Governed event emitted and persisted with an outbox row | No runtime consumer found |
| `AUTHORIZATION_REVIEW_RECORDED.v1` | Synthetic envelope fixture and `AUTHORIZATION_REVIEW_RECORDED` audit action | Not a typed or persisted governed event in S2; the current persistence path emits day-decision events | No explicit consumer requirement found |
| `DOCUMENTATION_GAP_TRANSITIONED.v1` | `DocumentationGapStatusHistory` plus `DOCUMENTATION_GAP_TRANSITIONED` audit action | Not emitted as a governed event by design; status history is append-only source evidence | No explicit consumer requirement found |
| `EPISODE_CREATED.v1` | `EpisodeCreatedEventPayloadSchema` exists | Contract-only; admission persistence currently emits `ADMISSION_RECORDED` rather than two overlapping lifecycle events | No explicit consumer requirement found |
| `EPISODE_DAY_AUTHORIZATION_STATE_DERIVED.v1` | Typed payload schema and draft metric source reference | Derived-event contract only; no projection or persistence worker exists | Draft metrics reference it; no operational measurement is approved |

The current implementation therefore has three distinct layers:

1. Transactional source facts and append-only status history.
2. Three emitted governed source events with transactional outbox rows.
3. Contract-only or draft derived concepts that have no runtime consumer.

## Proposed Vocabulary Rules

### 1. Name and versioning

- Governed event names remain stable uppercase identifiers such as
  `AUTHORIZATION_DAY_DECISION_RECORDED`.
- The envelope carries the numeric `eventType.version`; metric references use
  the explicit `EVENT_NAME.v1` notation.
- A payload change that alters meaning or required fields requires a new event
  version and a compatibility decision. Do not silently widen a v1 payload.
- Event names describe a recorded fact or explicitly labeled derivation. They
  must not describe a risk flag as if it were a clinical, payer, admission, or
  placement decision.

### 2. Source events versus derived observations

- Source events describe a persisted, human- or source-attested fact.
- Derived events describe a deterministic observation calculated from named
  source facts, an evaluation time, facility timezone, thresholds, quality
  state, and derivation version.
- A derived event cannot overwrite, approve, deny, expire, or otherwise replace
  an authorization or documentation-gap fact.
- Draft metric definitions may reference derived events, but this does not
  make the metric operational or approved.

### 3. Corrections

- Corrections and reversals use the governed envelope's `correction` object,
  `supersedesEventId`, and controlled reason code.
- Do not create a second event name solely to signal that an existing event was
  corrected unless a named consumer requires a distinct contract.
- The original event remains readable and the active branch is resolved by
  supersession.

### 4. Audit and lifecycle history

- An audit action may accompany a source mutation without becoming a governed
  event.
- A status-history row may be the canonical operational history for a lifecycle
  transition even when no governed event is emitted.
- A new governed lifecycle event requires a consumer, payload owner, retention
  decision, and tenant/security review before implementation.

## Recommended Decisions

| # | Recommendation | Rationale | Gate |
|---:|---|---|---|
| 1 | Keep `ADMISSION_RECORDED.v1`, `AUTHORIZATION_DAY_DECISION_RECORDED.v1`, and `DOCUMENTATION_GAP_RECORDED.v1` as the bounded emitted S2 vocabulary. | These are implemented, tested, source-linked, and transactionally paired with outbox rows. | Record owner acceptance of the current boundary. |
| 2 | Do not emit `EPISODE_CREATED.v1` in the current persistence slice. | `ADMISSION_RECORDED.v1` already records the admission-created episode; adding both would create duplicate lifecycle semantics without a consumer. | Reopen only if a separate episode-lifecycle consumer is named. |
| 3 | Treat `AUTHORIZATION_REVIEW_RECORDED` as an audit action/fixture interpretation until a review-level consumer is named. | The current persistence path records day decisions, while no typed review-level governed payload or consumer is present. | Domain and analytics owner decision. |
| 4 | Treat documentation-gap transitions as transactional status history plus audit until a lifecycle consumer is named. | The append-only history already preserves every transition; a governed event would add delivery and schema obligations. | Operations and analytics owner decision. |
| 5 | Reserve `EPISODE_DAY_AUTHORIZATION_STATE_DERIVED.v1` for a future derived projection. | It is useful for draft metric lineage but is not transactional truth and has no current projection owner. | Metric owner, consumer, derivation, and late-arrival decision. |
| 6 | Keep the event envelope's correction/supersession model as the correction contract. | It preserves originals, supports reversals, and avoids proliferating correction-specific event names. | Technical and compliance review of any future consumer. |

## Explicit Consumer Questions

The repository currently identifies no approved runtime consumer. Before adding
new event schemas or emitted event types, the owner must identify:

1. Which named consumer needs review-level authorization events rather than the
   persisted review and day-decision tables.
2. Which named consumer needs documentation-gap transition events rather than
   the append-only status-history table.
3. Whether the consumer needs source events, derived observations, or both.
4. Who owns event retention, replay, tenant authorization, and correction
   interpretation.
5. Whether any consumer can receive `PHI_RESTRICTED` or only synthetic,
   pseudonymized, or deidentified envelopes.

`Unknown` is the current answer for all five consumer requirements. No
projection, analytics mart, worker, API, or external integration should be
created to fill that gap implicitly.

## Proposed Next Implementation After Acceptance

Only after the owner records a decision and names a consumer should a future
slice add the smallest required contract and deterministic tests. Depending on
the decision, that slice may include:

- a typed `AUTHORIZATION_REVIEW_RECORDED.v1` payload;
- a typed `DOCUMENTATION_GAP_TRANSITIONED.v1` payload;
- a governed-event registry test that prevents undocumented names;
- a derived-event contract test with explicit lineage and derivation version.

That future slice must remain synthetic-only and must not add a dispatcher,
projection worker, analytics mart, dashboard, API route, or external delivery.

## Owner Decision

- Decision: `[ ] Accept current bounded vocabulary`  `[ ] Approve a new event`  `[ ] Revise`  `[ ] Defer`
- Owner: Tyler / product owner
- Date: `[Pending]`
- Named consumer(s): `[Pending]`
- Notes: This packet is decision work only. No event-vocabulary code or
  migration is authorized by its existence.
