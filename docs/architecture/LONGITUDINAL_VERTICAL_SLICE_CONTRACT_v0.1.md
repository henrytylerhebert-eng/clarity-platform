# Longitudinal Vertical Slice Contract v0.1

**Status:** Pre-persistence implementation slice  
**Authority:** IA-001  
**Schema authorization:** No  
**Data:** Synthetic only

## Purpose

Prove the locked longitudinal semantics end-to-end in contracts and pure derivation before authorizing persistence.

The slice follows one synthetic inpatient Episode from Day 1 through Day 39 and proves that Clarity can represent:

- a discharge plan without treating the plan as actual discharge;
- append-only clinical level-of-care recommendation;
- append-only clinical discharge-readiness decision;
- a transition barrier with lifecycle and derived aging;
- transition readiness as a projection over independent components;
- actual discharge as a separate source-backed fact/event input;
- continuity as typed observed events plus explicit source-coverage semantics;
- a longitudinal Care Journey as a projection over existing identifiers, not a new parent aggregate.

## Locked semantics consumed

This slice consumes LSR-01 through LSR-18. It does not reopen them.

Especially:

- existing `Episode` remains the inpatient stay;
- `LongitudinalCareJourney` is projection-first;
- `PendingDischarge` is derived;
- `TransitionReadiness` is derived;
- clinical recommendation, payer authorization, availability, preference, and actual LOC remain separate;
- actual discharge is not inferred from a plan, payer date, availability, or readiness;
- continuity is events + projections;
- no universal score;
- missing external events remain unknown unless source completeness supports a stronger statement;
- waiting state does not establish causal blame.

## Open gaps deliberately not decided here

The slice must not answer these by accident:

1. one logical `DischargePlan` per Episode vs concurrent plans;
2. whether destination attempts become independent persisted records;
3. which facility-configured roles may record/supersede clinical discharge readiness;
4. canonical LOC registry/crosswalk;
5. production barrier taxonomy;
6. core vs configurable recovery/function/environment observations;
7. exact actual-discharge command/source/correction contract;
8. production continuity evidence sources;
9. allowed operational work between Episode `DISCHARGED` and `CLOSED`;
10. whether the first longitudinal projection is reliably derivable without a new parent aggregate.

## TypeScript contract surface

`packages/domain-contracts/src/longitudinal.ts` contains contract-only schemas and pure functions.

Implemented in this slice:

- `DischargePlanVersionSchema`
- `TransitionBarrierSchema`
- `CareTransitionSliceSchema`
- `LevelOfCareRecommendationSchema`
- `ClinicalDischargeReadinessDecisionSchema`
- `ContinuityEventSchema`
- candidate event payload schemas
- configured authority policy/check contracts
- candidate state machines
- projection functions

The candidate CareTransition and readiness vocabularies are slice-level contract vocabulary only; they do not establish production persistence enums.

## Authority contract

The contract deliberately does not hard-code which role is clinically qualified.

Instead a governed facility/organization policy snapshot supplies:

- action;
- authorized role codes;
- policy reference;
- effective time.

The pure authority evaluator answers only whether the actor's recorded roles intersect the configured policy. It does not create or infer qualification.

## Projection functions

### `derivePendingDischarge`

Inputs:

- append-only discharge-readiness decisions;
- actual-discharge facts;
- evaluation time.

Rules:

- no applicable readiness decision => `UNKNOWN`;
- current applicable decision says continue inpatient => `NOT_PENDING`;
- current applicable decision says ready and no discharge fact => `PENDING`;
- discharge fact at/after the ready decision and at/before evaluation => `ENDED_BY_DISCHARGE`.

### `deriveBarrierAging`

Computes elapsed whole days from governed barrier effective time through resolution or evaluation time.

It does not derive blame, primary-barrier status, or avoidable days.

### `deriveTransitionReadiness`

Slice-level components remain independent.

- any `BLOCKED` component => execution `BLOCKED`;
- otherwise any `UNKNOWN` => execution `UNKNOWN`;
- otherwise execution `READY`.

This projection never creates a new clinical decision.

### `deriveLevelOfCareProfile`

Returns distinct clinical recommendation, payer authorization, availability, patient preference, and actual care fields.

It deliberately produces no single master LOC and no score.

### `deriveContinuityWindow`

For a requested event family and time window:

- matching observed event => `OBSERVED`;
- no event + complete source coverage => `NONE_OBSERVED_WITH_COMPLETE_COVERAGE`;
- no event + partial/unknown source coverage => `UNKNOWN`.

### `deriveLongitudinalCareJourneyProjection`

Composes person token + Access Case ids + inpatient Episode ids + CareTransition ids + continuity-event ids.

The returned projection has no independent aggregate id and no mutable master status.

## Day 1 → Day 39 synthetic proof

| Day | Synthetic event / fact | Expected semantic effect |
|---|---|---|
| 1 | Admission recorded | Existing inpatient Episode is active. |
| 2 | DischargePlan initiated; target Day 7 | Plan exists; no actual discharge exists. |
| 4 | Clinical recommendation = continue inpatient | Human decision only. |
| 6 | New clinical recommendation = IOP | Supersedes prior clinical recommendation. |
| 6 | Clinical discharge readiness = ready | Human decision. |
| 6 | No IOP opening observed | Transition barrier open. |
| 6 | Evaluate | `PendingDischarge=PENDING`; transition readiness blocked by destination. |
| 7 | Payer authorizes IOP | Payer truth remains separate from clinical truth. |
| 8 | IOP opening observed | Barrier resolves; transition readiness becomes ready. |
| 9 | Actual discharge fact recorded | Pending-discharge interval ends; Episode may later transition under a separately authorized command contract. |
| 10 | IOP start observed | Continuity event observed. |
| 16 | 7-day window evaluation | Events are evaluated with source-coverage state. |
| 39 | 30-day window evaluation | No-event claims remain unknown unless coverage is complete. |

## Acceptance tests

The unit suite must fail if the implementation begins to:

- treat the target discharge date as actual discharge;
- collapse clinical, payer, availability, preference, and actual LOC;
- persist/return a universal score;
- end PendingDischarge without an actual discharge fact;
- infer causal blame from a waiting relationship;
- turn missing continuity data into a negative outcome under partial coverage;
- hard-code qualified clinical authority rather than consuming a governed policy;
- create a longitudinal parent aggregate id/status in the projection.

## Informational schema impact only

No Prisma file changes are part of this slice.

If IA-002 later authorizes persistence, the current semantic candidates imply **possible** future persistence for:

| Concept | Current slice posture | Possible future persistence |
|---|---|---|
| `DischargePlan` | Contract only | New entity + version/history strategy after LONG-GAP-01. |
| `TransitionBarrier` | Contract only | New entity + lifecycle/history. |
| `CareTransition` | Contract only | New entity after destination-attempt question is resolved. |
| `LevelOfCareRecommendation` | Contract only | Append-only decision records. |
| `ClinicalDischargeReadinessDecision` | Contract only | Append-only decision records after role authority is ratified. |
| `Continuity` | Events/projection only | Typed governed events; **no monolithic Continuity entity**. |
| `PendingDischarge` | Pure derivation | **No persistence.** |
| `TransitionReadiness` | Pure derivation | **No master-state persistence.** |
| `LongitudinalCareJourney` | Projection | **No first-slice parent aggregate.** |

Any future Prisma proposal must be separately authorized by IA-002 after the open-gap register is resolved or bounded.
