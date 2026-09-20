# Clarity Implementation Authorization — IA-001

**Date:** 2026-09-20  
**Repository:** `henrytylerhebert-eng/clarity-platform`  
**Main inspected at:** `43028c7acf2196c492ce81835753423814d0c03a`  
**Status:** **PARTIAL AUTHORIZATION / PRE-PERSISTENCE GATE**  
**Authority basis:** Canon Reconstruction Pass 01 + Semantic Decision Base v0.1 + Longitudinal Semantic Reconciliation v0.2 + current-main confrontation

---

## 1. Governing decision

This authorization does **not** approve the full longitudinal persistence build.

It authorizes implementation work that can be completed **without inventing unresolved semantics or persistence boundaries**.

The following remain gated until the Longitudinal Vertical Slice Contract v0.1 has passed and the remaining longitudinal open questions have been resolved or explicitly bounded:

- new Prisma persistence for the longitudinal model;
- database migrations for those persistence boundaries;
- mutating longitudinal APIs;
- new governed UI that depends on unratified persisted longitudinal state;
- AI command surfaces that can create or mutate longitudinal truth.

The governing rule remains:

> **Semantics authorize schema. Schema does not invent semantics.**

---

# 2. Authorization matrix

| Area | Status | Authorization |
|---|---|---|
| Canon/docs package | **AUTHORIZED** | May be created, refined, versioned, and wired into agent/developer instructions. |
| TypeScript domain contracts | **AUTHORIZED WITH BOUNDS** | May define contract-only types/interfaces for the vertical slice, provided they do not imply persistence and preserve locked semantics. |
| Pure projection functions | **AUTHORIZED** | May implement deterministic, side-effect-free derivations such as PendingDischarge, barrier aging, LOC profile, transition-readiness projection, and longitudinal read projection. |
| Synthetic fixtures | **AUTHORIZED** | Day 1 → Day 39 synthetic fixture and related synthetic-only scenario data may be implemented. |
| Acceptance tests | **AUTHORIZED** | Unit/contract tests for locked semantics and no-collapse rules may be added. |
| Existing read-model extension | **CONDITIONAL** | Read-only projection work may proceed when it consumes existing governed facts and introduces no new source-of-truth persistence. |
| Tree 5 Work UI using existing governed data | **CONDITIONAL** | May proceed where it only re-presents existing governed read models and preserves Tree 4. No new longitudinal mutation semantics. |
| Prisma changes | **NOT AUTHORIZED** | Hold. |
| Database migrations | **NOT AUTHORIZED** | Hold. |
| New persisted `DischargePlan` | **NOT AUTHORIZED YET** | Semantically justified, but implementation waits on vertical-slice contract + remaining gap decisions. |
| New persisted `TransitionBarrier` | **NOT AUTHORIZED YET** | Semantically justified, but implementation waits on vertical-slice contract + remaining gap decisions. |
| New persisted `CareTransition` | **NOT AUTHORIZED YET** | Hold specifically on destination-attempt model and workflow boundary. |
| Persisted `LevelOfCareRecommendation` | **NOT AUTHORIZED YET** | Append-only decision semantics locked; schema/API implementation waits on authority/value-set contracts. |
| Persisted `ClinicalDischargeReadinessDecision` | **NOT AUTHORIZED YET** | Append-only decision semantics locked; implementation waits on facility authority contract. |
| Monolithic `Continuity` table/entity | **PROHIBITED** | Continuity remains typed events + derived projections. |
| Persisted `PendingDischarge` status | **PROHIBITED** | Derived only. |
| Persisted `TransitionReadiness` master status | **PROHIBITED** | Derived only. |
| Persisted `LongitudinalCareJourney` parent aggregate | **PROHIBITED FOR FIRST SLICE** | Projection-first. Revisit only if derivation proves insufficient. |
| Mutating longitudinal APIs | **NOT AUTHORIZED** | Hold until persistence and command contracts are ratified. |
| Read-only longitudinal query API | **CONDITIONAL** | May be designed/implemented after vertical-slice contract if it composes governed existing facts only. |
| `DISCHARGE_RECORDED` command | **NOT AUTHORIZED** | Event direction is correct, but exact command/source/disposition/correction contract is still open. |
| AI Query / Trace | **DESIGN AUTHORIZED; IMPLEMENTATION CONDITIONAL** | May design against governed read/trace contracts. Production implementation must not invent truth. |
| AI proposal generation | **CONDITIONAL** | May produce clearly labeled candidate/inference objects only where no canonical mutation occurs. |
| AI command execution | **NOT AUTHORIZED** | Hold until command authorization, confirmation, provenance, and audit contracts are implemented and verified. |
| 2D Explore read-only projection | **CONDITIONAL** | May proceed only over authorized read models and relationship authorization. |
| Spatial/3D Explore | **NOT A CURRENT IMPLEMENTATION PRIORITY** | Deferred until 2D Explore proves value. |

---

# 3. Current-main evidence used for this gate

Verified against `main` at `43028c7acf2196c492ce81835753423814d0c03a`.

## Existing implemented spine

Current repository evidence confirms:

- `Episode` exists in `prisma/schema.prisma` and remains the admission-anchored inpatient stay.
- `CaseEpisodeLink` exists in the domain contracts and case repository.
- `JourneyPhase` exists as a derived projection contract.
- `GovernedEvent` and outbox persistence exist.
- Access Case read-model/API and read-only Access Snapshot UI exist.
- Episode-owned authorization/review/day-decision/documentation-gap patterns already exist.

## Not found as canonical current-main implementations

Repository code search found no canonical implementations named:

- `DischargePlan`
- `TransitionBarrier`
- `CareTransition`

`DISCHARGE_RECORDED.v1` appears in the analytics return package/event catalog as a later/future source event; it is not current implementation authority for a discharge command.

## Current UX boundary

Current-main documentation states Crisis Ops remains mixed:

- Access Snapshot is governed and read-only.
- IOP reconciliation and Legal have API-backed paths.
- many other Crisis Ops workspaces remain local/demo prototype state.
- the demo-role picker is not an authorization boundary.

Therefore new governed UI must not present local/demo state as if it were canonical operational truth.

---

# 4. Locked semantic constraints implementation must preserve

The implementation may not violate LSR-01 through LSR-18.

Minimum non-negotiable examples:

- `Episode` remains inpatient-stay scoped.
- `LongitudinalCareJourney` remains projection-first.
- clinical LOC recommendation remains separate from payer authorization, availability, preference, and actual LOC.
- clinical discharge readiness remains a qualified-human decision.
- `PendingDischarge` remains derived.
- `TransitionReadiness` remains derived.
- actual discharge requires a governed source command/event.
- continuity remains typed events plus projections.
- missing continuity data remains unknown unless source completeness proves absence.
- chronology/waiting state does not establish causal blame.
- no universal health/recovery/readiness/continuity score.
- relationship projections must preserve provenance, time, tenancy, and authorization.

---

# 5. Conditions required to unlock persistence

Prisma/migration authorization requires all of the following:

1. **Longitudinal Vertical Slice Contract v0.1 completed**
   - exact TypeScript contracts;
   - event payloads;
   - authority contracts;
   - projection functions;
   - state machines;
   - Day 1 → Day 39 fixture;
   - acceptance tests;
   - informational schema map.

2. **Open longitudinal gaps resolved or explicitly bounded**
   - DischargePlan cardinality/version model;
   - destination-attempt identity;
   - clinical-readiness authority;
   - LOC registry/crosswalk;
   - barrier taxonomy;
   - core vs configurable recovery/environment observations;
   - actual-discharge command/correction contract;
   - continuity evidence-source contract;
   - DISCHARGED → CLOSED work boundary;
   - proof that projection-first Care Journey is derivable.

3. **Current → target schema reconciliation**
   Every proposed persistence object must state:
   - current owner;
   - gap;
   - why derivation is insufficient;
   - tenant boundary;
   - correction/supersession behavior;
   - authorization owner;
   - migration effect;
   - rollback plan.

4. **ADR approval**
   A specific ADR must authorize each new persistence boundary or tightly coupled persistence slice.

---

# 6. Conditions required to unlock new mutating APIs

A mutating API is authorized only after its underlying command is authorized.

Each command must have:

- named actor;
- required role/authority;
- tenant scope;
- input schema;
- expected current state/preconditions;
- evidence/source requirements;
- effective time;
- recorded time;
- idempotency contract;
- correction/supersession behavior;
- governed event output;
- audit behavior;
- conflict behavior;
- explicit forbidden inference paths.

No endpoint may create authority merely because a UI or AI asks for an action.

---

# 7. Conditions required to unlock new governed UI

Governed UI is authorized only when each displayed or mutated concept can be traced to:

1. governed source state;
2. derived projection;
3. explicit authority rule;
4. known unknown/missing behavior;
5. read or command contract.

Tree 5 remains the Work experience.

The UI may not invent:

- new status semantics;
- new assignment semantics;
- new readiness semantics;
- causal blame;
- patient identity exposure;
- AI-owned decisions.

Read-only UX improvements over already governed Access truth may proceed before new persistence.

---

# 8. Conditions required to unlock AI command surfaces

AI command execution remains blocked until:

- Query / Trace / Command contracts are ratified;
- available-command projection is implemented;
- human actor and authority are resolved independently of the model;
- consequential commands require appropriate confirmation/review;
- provenance and decision context are retained;
- command execution passes through the same domain service/gateway as non-AI UI;
- the model cannot directly write database state;
- acceptance tests prove inference cannot become Fact/Decision silently;
- audit captures actor, model/version where relevant, input context, proposed action, confirmation, command, result, and correction path.

AI may help **find, explain, compare, summarize, and propose** before it is allowed to execute consequential commands.

---

# 9. Authorized next implementation slice

The next authorized engineering slice is:

## Longitudinal Vertical Slice Contract v0.1 — executable contract layer

It may include:

```text
domain-contracts/
  longitudinal/
    dischargePlan.ts
    transitionBarrier.ts
    careTransition.ts
    levelOfCareRecommendation.ts
    clinicalDischargeReadiness.ts
    continuityEvents.ts
    longitudinalProjection.ts

tests/
  longitudinal/
    fixture-day1-day39.ts
    projection.test.ts
    authority.test.ts
    no-collapse.test.ts
    continuity-unknown.test.ts
```

**This path is illustrative, not a repo-path command.** Existing repository organization should be followed when implemented.

The slice must remain contract/pure-logic/synthetic-test oriented until the persistence ADR gate.

---

# 10. Release gate outcome

## AUTHORIZED NOW

- canonical architecture/docs work;
- contract definitions that do not imply persistence;
- pure deterministic projections;
- synthetic fixtures;
- semantic acceptance tests;
- Tree 5 UX work over existing governed read models;
- repo wiring/current-target analysis;
- read-only design/prototyping for History/Explore/Flow/AI.

## HELD

- Prisma changes;
- migrations;
- longitudinal write repositories;
- longitudinal command services;
- mutating APIs;
- actual discharge command;
- persistence-backed longitudinal UI mutations;
- AI command execution.

## PROHIBITED BY CANON

- redefining `Episode` as the longitudinal parent;
- monolithic `Continuity` entity;
- persisted `PendingDischarge`;
- persisted master `TransitionReadiness`;
- universal health/readiness/recovery/continuity score;
- silently merging clinical recommendation, payer authorization, availability, preference, and actual LOC;
- AI directly establishing canonical clinical truth or decision authority.

---

# 11. Next gate

When the Longitudinal Vertical Slice Contract v0.1 and the ten remaining gap decisions are complete, issue:

> **IA-002 — Longitudinal Persistence Authorization**

That gate may authorize, individually:

- Prisma objects;
- migrations;
- repository gateways;
- command services;
- APIs;
- governed Work UI mutations;
- later AI commands.

Until IA-002 is issued, the persistence/write boundary remains closed.
