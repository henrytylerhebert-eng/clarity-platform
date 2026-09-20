# Clarity Implementation Authorization — IA-002 (DRAFT)

**Date:** 2026-09-20
**Repository:** `henrytylerhebert-eng/clarity-platform`
**Main inspected at:** `6b1d91f`
**Status:** **DRAFT — NOT IN FORCE, AND NOT RATIFIABLE AS WRITTEN.** Superseded in part by the
2026-09-20 owner-level review
([review/OWNER_DECISION_PACKET_v0.1.md](review/OWNER_DECISION_PACKET_v0.1.md)). IA-001's HELD list
governs and the persistence boundary remains closed.

> ## NOT RATIFIABLE AS WRITTEN — 2026-09-20
>
> Four defects, found by re-testing this draft rather than defending it:
>
> 1. **§1 condition 2 is overstated.** "Open longitudinal gaps resolved or explicitly bounded —
>    MET" rested on the blanket claim that no bound blocks persistence. Re-tested per gap,
>    **LONG-GAP-03 and LONG-GAP-08 fail.** Condition 2 is **NOT MET**.
> 2. **The precondition list is incomplete.** C-7 … C-10 below were missing, two of them fixing
>    defects in merged code.
> 3. **C-1 and C-3 are insufficient as specified.** C-1 does not bar `UNKNOWN` from a clinical
>    recommendation and does not address the enum's incompleteness for continuity; C-3's three
>    coverage states cannot carry the eight required distinctions.
> 4. **Slice A is not the smallest coherent slice** and rests on LONG-GAP-03. See ADR-0026.
>
> **No slice is authorized.** The next authorized work is Slice 0.5 (§9), which is already
> permitted by IA-001 §10 and needs no authorization at all.
**Authority basis:** IA-001 §5 and §11 + Longitudinal Gap Closure v0.1 (6 LOCKED, 4 BOUNDED) +
Current → Target Longitudinal Schema Reconciliation v0.1 + Verification Matrix Conformance
Baseline v0.1

---

## 1. What IA-001 required, and whether it is met

IA-001 §5 names four conditions for unlocking persistence.

| Condition | Status | Evidence |
|---|---|---|
| 1. Longitudinal Vertical Slice Contract v0.1 completed | **MET** | Merged as `4307093` (PR #133): contracts, event payloads, authority contracts, projection functions, state machines, Day 1→39 fixture, acceptance tests, schema map |
| 2. Open longitudinal gaps resolved or explicitly bounded | ~~MET~~ **NOT MET** | Re-tested 2026-09-20: LONG-GAP-03 and LONG-GAP-08 are **NOT YET RATIFIABLE**; 04, 05, 06 and 10 are ratifiable only with amendment |
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

**AMENDED 2026-09-20 — four preconditions added, two of them fixing defects in merged code:**

| ID | Requirement | Source |
|---|---|---|
| **C-7** | `deriveTransitionReadiness` must require all seven components; a missing component is `UNKNOWN`, never silently `READY`. Test empty and partial inputs | Defect D-1 |
| **C-8** | Every projection must exclude `SUPERSEDED`, `REJECTED` and `QUARANTINED` events | Defect D-2 |
| **C-9** | `UNKNOWN` is not a permitted `clinicalRecommendation` value | Gap 04 amendment |
| **C-10** | The journey projection carries **required** `organizationId` + `evaluatedAt`; a consumer fails on their absence | Gap 10 amendment |

C-1 additionally requires C-9; C-3 is insufficient as written and must implement the six derived
source conditions in the review §6.

All of these are contract, fixture, test and tooling work — **already authorized under IA-001
§10**. None requires this authorization. They can start immediately.

## 4. Authorization matrix

| Area | Status | Authorization |
|---|---|---|
| C-1 … C-6 preconditions | **AUTHORIZED (under IA-001 §10)** | Proceed now |
| **Slice A** — `LongitudinalAuthorityPolicy`, `LevelOfCareRecommendation`, `ClinicalDischargeReadinessDecision` | ~~AUTHORIZED ON CONDITIONS~~ **NOT AUTHORIZED** | Rests on LONG-GAP-03, which fails re-testing. Blocked on owner decisions OD-A, OD-B, OD-C |
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

---

# 9. AMENDED — the next authorized slice (Slice 0.5)

Since no persistence slice is authorized, the next engineering work is **Slice 0.5 — Executable
protection of the locked semantics.** It is entirely within IA-001 §10, requires no
authorization from this document, and can start immediately. Every item closes a hole the
2026-09-20 review *demonstrated* rather than asserted.

1. **C-7** — `deriveTransitionReadiness` requires all seven components; empty and partial inputs
   yield `UNKNOWN`. *(fixes D-1: today `deriveTransitionReadiness([])` returns `READY`)*
2. **C-8** — all projections exclude `SUPERSEDED` / `REJECTED` / `QUARANTINED`. *(fixes D-2:
   today `qualityState` is read by no projection)*
3. **C-5** — every no-collapse assertion rewritten as a rejection assertion.
4. **C-6** — schema-conformance tripwire over refused model **and column** names.
5. **C-1 + C-9** — LOC fields typed to the enum, fixture re-coded, enum-sync extended, and
   `UNKNOWN` barred from `clinicalRecommendation`.
6. **C-10** — journey projection carries required `organizationId` + `evaluatedAt`.
7. Negative test: no projection groups or ranks by `waitingOnPartyRef`, `responsibleRoleCode` or
   `assignedUserId`.

No Prisma, migration, command, API or UI.

# 10. AMENDED — three gates, not one

The original draft implied preconditions land, then migrations follow. L2 tenancy tests cannot
precede the table they test, so the sequencing is:

1. **Before the migration** — C-5, C-6, C-7, C-8, C-9, C-10 (all contract-level, all runnable
   today) plus the *written* tenancy and correction test plan per object.
2. **In the same PR as the migration** — L2 tenancy and L2 correction/supersession **behavior**
   tests, green. The migration and its proofs land together or not at all.
3. **Before any API exposes the object** — the L3 command envelope.

Documentary evidence is not sufficient at any gate. Each is a test that runs in CI.

# 11. AMENDED — owner decisions that gate any persistence

- **OD-A** — what must be true for a `LongitudinalAuthorityPolicy` to take effect: A1
  administrative only / **A2 administrative write + named clinical approver (recommended)** / A3
  out-of-band document of record. A2 adds approval columns and a `PENDING_APPROVAL` state.
- **OD-B** — does delegated or emergency authority exist? If yes it is a separate time-bounded
  grant table.
- **OD-C** — is an improperly authorized decision **superseded** (retained in the chain, still
  supporting projections) or **invalidated** (retained but excluded from projections)?
- **OD-D** — does continuity's next-level-of-care extend `LevelOfCare` or get a separate
  `CareSettingOrService` vocabulary with a crosswalk? *(gates Slice C, not Slice A)*

OD-A, OD-B and OD-C gate **all** persistence, because they change the shape of the first object
any slice would need.
