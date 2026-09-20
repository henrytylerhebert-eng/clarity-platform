# Clarity Implementation Authorization — IA-002 (DRAFT)

**Date:** 2026-09-20
**Repository:** `henrytylerhebert-eng/clarity-platform`
**Main inspected at:** `6b1d91f`
**Status:** **DRAFT — NOT IN FORCE.** Requires owner ratification. Until ratified, IA-001's
HELD list governs and the persistence boundary remains closed.
**Authority basis:** IA-001 §5 and §11 + Longitudinal Gap Closure v0.1 (6 LOCKED, 4 BOUNDED) +
Current → Target Longitudinal Schema Reconciliation v0.1 + Verification Matrix Conformance
Baseline v0.1

---

## 1. What IA-001 required, and whether it is met

IA-001 §5 names four conditions for unlocking persistence.

| Condition | Status | Evidence |
|---|---|---|
| 1. Longitudinal Vertical Slice Contract v0.1 completed | **MET** | Merged as `4307093` (PR #133): contracts, event payloads, authority contracts, projection functions, state machines, Day 1→39 fixture, acceptance tests, schema map |
| 2. Open longitudinal gaps resolved or explicitly bounded | **MET** | [Gap Closure v0.1](gap-closure/LONGITUDINAL_GAP_CLOSURE_v0.1.md) — 6 LOCKED, 4 BOUNDED, none open |
| 3. Current → target schema reconciliation | **MET** | [Reconciliation v0.1](reconciliation/CURRENT_TARGET_LONGITUDINAL_SCHEMA_RECONCILIATION_v0.1.md) — 9 proposed with all eight §5.3 facts, 7 refused |
| 4. ADR approval per persistence boundary | **PARTIAL** | ADR-0026 drafted for Slice A only. Slices B and C get their own ADRs when reached |

**Condition 4 is deliberately incomplete**, and that is the point. IA-001's own Implementation
Plan (Slice 5) says persistence is authorized "concept-by-concept, not as a blanket migration".
This authorization therefore opens the boundary in three ordered slices, each with its own ADR
and its own gate.

## 2. What this authorization does NOT accept

Three things the evidence does not support, stated before the grants:

- **It does not accept that the merged contract is ready to persist as written.** Three breaking
  corrections (C-1, C-2, C-3) must land first. One of them exists because the merged slice
  invented a private level-of-care vocabulary while a canonical enum already existed.
- **It does not accept that the locked semantics are currently protected by tests.** The
  conformance baseline found the no-collapse assertions prove the *fixture* lacked a forbidden
  field, not that the *schema* rejects it, and found **no** automated defense against a refused
  model being added to Prisma. C-5 and C-6 fix both, and are preconditions, not follow-ups.
- **It does not accept that longitudinal tenancy or correction behavior is proven.** Neither has
  ever been exercised, because there is no repository. Both must be proven at L2 per slice.

## 3. Preconditions — all five must land before the first migration

| ID | Requirement | Source |
|---|---|---|
| **C-1** | LOC fields typed to `z.enum(LEVELS_OF_CARE)`; Day 1→39 fixture re-coded to `INPATIENT_PSYCHIATRIC` / `INTENSIVE_OUTPATIENT` | Gap 04 |
| **C-2** | `CareTransitionSlice.currentIntendedDestinationRef` becomes a projection over `DestinationAttempt`, not stored state | Gap 02 |
| **C-3** | `deriveContinuityWindow`'s `sourceCoverageCompleteness` derived from registered coverage declarations, not caller-supplied | Gap 08 |
| **C-5** | Every no-collapse test rewritten as a rejection assertion (`expect(() => Schema.parse({...valid, causedBy: "x"})).toThrow()`) | Conformance F-1 |
| **C-6** | Schema-conformance tripwire failing if any refused model **or column** name appears in `prisma/schema.prisma` | Conformance F-3 |

All five are contract, fixture, test and tooling work — **already authorized under IA-001 §10**.
None requires this authorization. They can start immediately.

## 4. Authorization matrix

| Area | Status | Authorization |
|---|---|---|
| C-1 … C-6 preconditions | **AUTHORIZED (under IA-001 §10)** | Proceed now |
| **Slice A** — `LongitudinalAuthorityPolicy`, `LevelOfCareRecommendation`, `ClinicalDischargeReadinessDecision` | **AUTHORIZED ON CONDITIONS** | Per ADR-0026, after C-1, C-5, C-6 and §5 gates |
| **Slice B** — `DischargePlan` + version, `CareTransition`, `DestinationAttempt`, `TransitionBarrier`, `BarrierCategory` | **NOT AUTHORIZED YET** | Requires C-2, Slice A complete and verified, and its own ADR |
| **Slice C** — `ActualDischargeFact`, `ContinuityEvent`, `ContinuitySource`, `ContinuitySourceCoverage` | **NOT AUTHORIZED YET** | Requires C-3, Slices A and B complete and verified, and its own ADR |
| Mutating longitudinal APIs | **PER SLICE** | Only for objects whose slice is authorized and whose command contract is ratified |
| Governed Work UI mutations | **NOT AUTHORIZED** | Requires an authorized command plus a UI gate under IA-001 §7 |
| `RECORD_ACTUAL_DISCHARGE` command | **NOT AUTHORIZED YET** | Slice C. The command *shape* is locked (Gap 07); the authorization is not granted |
| AI proposal generation | **UNCHANGED — CONDITIONAL** | IA-001 §2 continues to govern |
| AI command execution | **NOT AUTHORIZED** | IA-001 §8 unchanged. This authorization changes nothing about AI |
| `PendingDischarge`, `TransitionReadiness`, `LongitudinalCareJourney`, the three profiles, monolithic `Continuity`, any score column | **PROHIBITED** | Unchanged and not revisitable under this authorization |

## 5. Gates every slice must pass

A slice is complete only when all of the following are true for **each** object in it:

1. Its ADR is Accepted by the owner.
2. Tenancy proven at **L2**: cross-tenant read, write and list are blocked and a cross-tenant miss
   is non-revealing.
3. Correction/supersession proven at **L2** as *behavior* — not asserted about a fixture.
4. Append-only audit proven, including the restricted-identifier guard and rollback on audit
   failure.
5. Command envelope proven at **L3**: authority, preconditions, idempotency (fingerprint excluding
   `occurredAt`), governed event output, conflict behavior.
6. Every refusal in §4 still holds — C-6's tripwire green.
7. `npm run verify` green, with counts reported.
8. The rollback plan in the reconciliation is accurate, including where it is **lossy**.

## 6. The one open item

**Who may write a `LongitudinalAuthorityPolicy`?** The policy decides who may make clinical
decisions, so writing it is a meta-authority act, and the reconciliation could not settle it from
repository evidence. Until the owner settles it, the policy table may be created and **seeded
read-only**; it must not be writable through any API. Slice A may otherwise proceed, because
decisions fail closed without a policy.

## 7. Honesty statement

This draft authorizes nothing until ratified. It does not claim production readiness, HIPAA
compliance, PHI readiness, approved clinical or legal rules, working external integrations, or
deployment. The synthetic-data-only boundary is unchanged: every gate above is satisfied with
synthetic fixtures against disposable databases. Four of the ten longitudinal gaps remain BOUNDED,
and each bound is recorded with what remains and who must supply it.

## 8. Next gate

When Slices A, B and C are complete and verified, the remaining longitudinal work — mutating APIs
beyond the authorized commands, governed Work UI mutation, and eventually AI proposals over
longitudinal state — requires **IA-003**. Until then, read-only surfaces remain the only
longitudinal UI, and Tree 4 / Tree 5 are unchanged by this authorization.
