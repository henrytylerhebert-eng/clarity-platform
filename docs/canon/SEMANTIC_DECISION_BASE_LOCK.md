# Clarity Semantic Decision Base Lock v0.1

**Date:** 2026-09-20  
**Status:** ACTIVE / CONTROLLING  
**Purpose:** Freeze the semantic decision base recovered during Canon Reconstruction Pass 01 so downstream UX, architecture, schema, API, AI, and implementation work cannot silently reopen settled decisions.

## 1. Tree 4 preservation

**Tree 4 status:** `LOCKED + VISUALLY PROVEN`

Tree 4 is preserved as the controlling shell and integrated-flow architecture.

This lock preserves the following interpretation:

- Tree 5 inherits Tree 4.
- Tree 4 is not reopened merely because later semantic or AI work adds capabilities.
- Tree 4 passing a visual architecture gate does **not** claim production backend/security compatibility, real-user usability validation, or manual assistive-technology conformance.
- Those remaining implementation/QA gates stay separate from the architecture lock.

## 2. Longitudinal Semantic Reconciliation v0.2 preservation

**Status:** `LOCKED`

Longitudinal Semantic Reconciliation v0.2 is preserved as the controlling semantic source for the six reconciled longitudinal concepts:

1. `DischargePlan`
2. `TransitionBarrier`
3. `CareTransition`
4. `LevelOfCareRecommendation`
5. `ClinicalDischargeReadinessDecision`
6. `Continuity`

The following remain derived rather than master persisted state unless a later ratified decision explicitly changes that:

- `PendingDischarge`
- `TransitionReadiness`
- `LongitudinalCareJourney`
- `RecoveryProfile`
- `EnvironmentSupportProfile`
- `CareIntensityProfile`

## 3. Semantic freeze rule

The 18 LSR decisions in `DECISION_REGISTER.md` are locked.

The 10 questions in `OPEN_GAP_REGISTER.md` are the only recognized longitudinal pre-schema gaps for this pass.

**Do not create new longitudinal semantic questions merely because implementation would be easier with a new table, field, status, score, or workflow object.**

A new semantic question may be added only when reconciliation exposes one of the following:

- a direct contradiction between locked decisions;
- a repo fact that makes a locked decision impossible to implement as written;
- a workflow requirement not represented by any locked semantic category;
- an authority/provenance conflict that cannot be resolved by the existing model;
- evidence that an assumed projection cannot be deterministically derived.

Any newly exposed question must be:
1. documented with source evidence;
2. assigned a new gap ID;
3. explicitly approved before schema work.

## 4. Schema gate

This lock does **not** authorize:

- Prisma changes
- database migrations
- new persistence boundaries
- API contracts
- frontend mutation behavior
- autonomous clinical logic

The governing rule remains:

> **Semantics authorize schema. Schema does not invent semantics.**

## 5. Next authorized semantic work

Only the 10 OPEN longitudinal questions may be worked before the next artifact.

After those questions are resolved, the next artifact is:

**Longitudinal Vertical Slice Contract v0.1**

No Prisma changes occur before that contract and its subsequent architecture decision gate.
