# ADR-0026: Persist the longitudinal decision spine — authority policy and the two append-only clinical decisions

**Status:** Proposed — awaiting owner ratification
**Date:** 2026-09-20
**Scope:** Slice A of IA-002. `LongitudinalAuthorityPolicy`, `LevelOfCareRecommendation`,
`ClinicalDischargeReadinessDecision`.

## Context

IA-001 closed the longitudinal persistence boundary until four conditions were met. Three are now
met: the vertical slice contract merged as `4307093`; all ten longitudinal gaps are closed or
explicitly bounded; and the Current → Target reconciliation states the eight IA-001 §5.3 facts for
nine proposed objects and refuses seven. The fourth condition is a specific ADR per persistence
boundary. This is the first.

Slice A is the **decision spine**: who is allowed to decide, and the two clinical decisions the
rest of the longitudinal model depends on. It is first because everything else references it.
A `DischargePlan` without an intended level of care recommendation is incomplete; barrier and
transition work hangs off a discharge plan; and an actual-discharge fact is only meaningful
against a readiness decision it did or did not follow.

Two facts from the audits shape this ADR.

**The contract layer is stronger than its tests.** All 24 longitudinal Zod schemas are `.strict()`,
so forbidden fields are rejected rather than stripped — confirmed empirically. But the no-collapse
tests assert `"causedBy" in parsed === false`, which passes because the fixture lacked the key and
would keep passing if the field were added. The schemas defend the semantics; the tests do not.

**The merged slice invented a level-of-care vocabulary that already existed.** `enum LevelOfCare`
has been in `prisma/schema.prisma:94` since the canonical data model, is mirrored in
`LEVELS_OF_CARE` and is enum-sync tested — yet `LevelOfCareRecommendationSchema.recommendedLevelCode`
is an open string and the Day 1→39 fixture uses `"INPATIENT"` and `"IOP"`, neither of which is a
member. Persisting that as text would freeze a private vocabulary into the database and sever
longitudinal LOC from authorization, benefits and facility program data.

## Decision

Persist three objects, in `packages/case-repository` behind gateway adapters, under the existing
command pattern — **after** the preconditions below.

### 1. `LongitudinalAuthorityPolicy` — versioned configuration

Org-scoped, optionally facility-scoped, keyed by `action`
(`RECORD_LEVEL_OF_CARE_RECOMMENDATION`, `RECORD_CLINICAL_DISCHARGE_READINESS`,
`RECORD_ACTUAL_DISCHARGE`), carrying `authorizedRoleCodes` (non-empty, drawn from `USER_ROLES`),
`policyRef` and `effectiveAt`. Versioned by effective time; never deleted.

**Clarity supplies no default policy.** Absent an effective policy, a decision cannot be recorded —
fail closed. Hard-coding a qualified role would have Clarity asserting a licensure rule it has no
authority to assert.

**Created read-only in this slice.** Who may *write* the policy that decides who may decide is a
meta-authority question this reconciliation could not settle from repository evidence. The table
is seeded and readable; no API may write it until the owner settles that question.

### 2. `LevelOfCareRecommendation` — append-only clinical decision

Child of `Episode`, tenant-scoped. `recommendedLevelCode` is the **`LevelOfCare` enum type, not
text**. Carries `decidedByActorId`, `decidedByRoleCode`, `decidedAt`, `effectiveAt`, `recordedAt`,
`rationale`, `evidenceRefs`, `criteriaRefs`, `supersedesRecommendationId`, and the authorizing
`policyRef`.

Clinical recommendation is **one of five independent LOC dimensions** and never collapses into
payer authorization, availability, patient preference or actual level of care.

### 3. `ClinicalDischargeReadinessDecision` — append-only clinical decision

Child of `Episode`, tenant-scoped. Outcome drawn from the contracted three-value set including
`UNDETERMINED`, so undetermined is representable and never reads as "not ready". Same provenance
columns, `supersedesDecisionId`, and the authorizing `policyRef`.

**Never a boolean on `Episode`.** `EpisodeStatus` gains no member; `PendingDischarge` remains
derived.

### 4. Effective-time authority evaluation

A decision is authorized against the policy effective **at the decision's own effective time**,
never the policy in force today. The authorizing `policyRef` is stored, so the authority basis is
reconstructible after the policy changes. A decision later found to rest on an invalid policy is
**superseded with a reason, not retroactively voided**.

### 5. Preconditions — this ADR does not take effect until all are green

- **C-1** — LOC fields typed to `z.enum(LEVELS_OF_CARE)`; fixture re-coded.
- **C-5** — no-collapse tests rewritten as rejection assertions.
- **C-6** — schema-conformance tripwire failing if a refused model or column name appears in
  `prisma/schema.prisma`.
- L2 tenancy, L2 correction/supersession **behavior**, append-only audit with rollback-on-failure,
  and the L3 command envelope, proven for each of the three objects.
- `npm run verify` green with reported counts.

C-2 and C-3 belong to Slices B and C and do not gate this slice.

## Consequences

**Enabling.** Clinical decisions become recordable with authority, provenance and correction —
the prerequisite for every other longitudinal object. `derivePendingDischarge` gains a real input
instead of a fixture. Longitudinal LOC becomes joinable to authorization and benefits data.

**Constraining.** Fail-closed authority means a facility that has not configured a policy cannot
record decisions. That is intended: the alternative is Clarity guessing who is qualified.

**Cost.** Three tables and their gateways, plus the L2/L3 test burden in §5 — which is larger than
the implementation, deliberately, because the conformance audit found longitudinal has no tenancy
or correction evidence at all today.

**Migration effect.** Three new tables. **No existing table altered**; `Episode` gains inverse
relations only. `EpisodeStatus` unchanged.

**Rollback.** Drop the three tables. No existing column is added or changed, so rollback is a
clean drop — but **lossy** once decisions are recorded: clinical decision history cannot be
reconstructed from anything else. Stated plainly rather than buried.

**Not claimed.** No production readiness, HIPAA compliance, PHI readiness, or approved clinical or
legal rules. The authority model is a *mechanism* for a facility to express its own rule; Clarity
asserts no licensure rule. All verification is synthetic, against disposable databases.

## Alternatives considered

- **Persist all nine objects in one migration.** Rejected — IA-001's Implementation Plan requires
  concept-by-concept authorization, and a single migration would put the refusals at maximum risk
  precisely when the most new surface is landing.
- **Start with `DischargePlan`** (the most visible object). Rejected — it references a level-of-care
  recommendation and needs discharge-planning authority, so it would force the authority mechanism
  to be built anyway, without the clarity of doing it deliberately.
- **Ship a default authority policy.** Rejected — a default is a rule, and a facility that never
  reviews it has silently inherited Clarity's clinical judgment.
- **Keep `recommendedLevelCode` as text and normalize later.** Rejected — the drift already
  happened in the merged fixture; text columns accumulate private spellings faster than they can
  be cleaned, and the canonical enum is three files away.

## References

- `docs/canon/IMPLEMENTATION_AUTHORIZATION_IA-002.md` — the authorization this slice sits under
- `docs/canon/reconciliation/CURRENT_TARGET_LONGITUDINAL_SCHEMA_RECONCILIATION_v0.1.md` — P-6, P-7, P-10
- `docs/canon/gap-closure/LONGITUDINAL_GAP_CLOSURE_v0.1.md` — LONG-GAP-03, 04, 06
- `docs/canon/conformance/VERIFICATION_MATRIX_CONFORMANCE_BASELINE_v0.1.md` — F-1, F-3, F-5
- `docs/architecture/ADR-0024-*` — precedent for an explicit enumerated same-organization allow-list
- ADR-0014 §5 — idempotency fingerprint excludes `occurredAt`
