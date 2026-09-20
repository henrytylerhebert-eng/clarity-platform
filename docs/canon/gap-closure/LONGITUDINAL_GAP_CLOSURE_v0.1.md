# Longitudinal Gap Closure v0.1 — LONG-GAP-01 through LONG-GAP-10

**Date:** 2026-09-20
**Audited against:** `main` at `6b1d91f` (canon landed) / `4307093` (contract slice)
**Inputs:** LSR-01 → LSR-18 (locked), the Clarity Constitution, the merged Longitudinal Vertical
Slice Contract v0.1, current repository structures, behavioral-health operational workflow,
and the authority/provenance/correction requirements in IA-001 §5–§6.
**Outcome:** **6 LOCKED, 4 explicitly BOUNDED.** No gap is left open.
**Prisma:** untouched. No persistence, command, API, migration or UI change in this pass.

## How to read a BOUNDED decision

A gap is **LOCKED** when the semantics can be settled now from evidence already in hand.

A gap is **BOUNDED** when the *structure* is settled but a value list or an authority
assignment requires input this repository cannot supply — clinical licensing (OD-3), counsel
(OD-2), or a real integration contract (OD-5/OD-8). A BOUNDED decision is **not** an open
question: it fixes the shape, the invariants, and the failure mode, and names exactly what
remains and who must supply it. Persistence may proceed on a BOUNDED decision **only** where
the reconciliation shows the bound does not affect the stored shape.

## Summary

| Gap | Topic | Decision | Status |
|---|---|---|---|
| 01 | DischargePlan cardinality | One logical plan per Episode, append-only versions | **LOCKED** |
| 02 | Destination-attempt identity | Separate append-only attempt records | **LOCKED** |
| 03 | Clinical readiness authority | Facility-configured policy; no hard-coded role | **BOUNDED** |
| 04 | Canonical LOC registry | Reuse the existing `LevelOfCare` enum; fix contract drift | **LOCKED** |
| 05 | Barrier taxonomy | Configurable category + locked non-blame invariant | **BOUNDED** |
| 06 | Core vs configurable observations | Dependency rule decides; list stays configurable | **BOUNDED** |
| 07 | Actual-discharge command contract | Full command shape locked; disposition vocabulary bounded | **LOCKED** (shape) |
| 08 | Continuity evidence sources | Per-source, per-window coverage declaration | **BOUNDED** |
| 09 | DISCHARGED → CLOSED boundary | DISCHARGED is operational; CLOSED is terminal | **LOCKED** |
| 10 | Projection without parent aggregate | Derivable **within one organization only** | **LOCKED** (with a hard limit) |

---

## LONG-GAP-01 — DischargePlan cardinality

**1. Question.** Does each inpatient Episode have one logical DischargePlan with revisions, or
can concurrent independent plans exist?

**2. Repository evidence.** `DischargePlanVersionSchema` (`longitudinal.ts:57`) already carries
`episodeId`, a positive integer `version`, `initiatedAt`, `effectiveAt`, `recordedAt`,
`createdByActorId`, and a status set including `SUPERSEDED` — the shape of a versioned single
plan, not of peer plans. The doc comment defers cardinality to this gap. No repository object
elsewhere models competing plans for one aggregate; every versioned aggregate in Clarity
(documents, evidence, prescreen, rate releases) uses one logical record with append-only
supersession.

**3. Workflow evidence.** An inpatient discharge plan is the single plan of record a treatment
team works from. Real variation is *revision* — the target date moves, the destination changes
after a refusal, the medication plan is updated — not simultaneity. Where two plans appear to
exist operationally, one is a draft under discussion, which is a version in `DRAFT`, not a peer
plan. Permitting concurrent plans would create exactly the ambiguity that causes missed
handoffs: two teams working different destinations with no rule for which governs.

**4. Candidate interpretations.** (a) One logical plan per Episode, append-only versions.
(b) Concurrent independent plans with a selection rule. (c) One plan per CareTransition rather
than per Episode.

**5. Contradictions / tradeoffs.** (b) demands a "which plan governs?" rule that is itself an
unmodeled authority decision, and every projection would need it — a false master-state generator.
(c) inverts the dependency: `CareTransitionSliceSchema` already references `dischargePlanId`, so a
plan per transition would make the plan a child of its own child. (a) costs nothing operationally
because revision is expressible as a version.

**6. Selected decision.** **One logical DischargePlan per inpatient Episode, represented as an
append-only sequence of versions.** Exactly one version is non-terminal (`DRAFT`, `ACTIVE`, or
`READY_FOR_EXECUTION`) at any effective time; the rest are `COMPLETED`, `SUPERSEDED` or
`CANCELLED`. A revision creates a new version that supersedes its predecessor. **LOCKED.**

**7. Rejected alternatives.** (b) rejected — requires an unmodeled selection authority and
manufactures a master-state problem; violates the Constitution §7 rule that derived state is
recomputed rather than arbitrated. (c) rejected — contradicts the merged contract's own
dependency direction.

**8. Classification.** Entity (`DischargePlan`), with an append-only **version** child. Status is
recorded state, not derived. "Current plan" is a **projection** over versions, never a stored
pointer.

**9. Authority owner.** The discharge-planning role configured by the facility. Not locked here —
it rides on LONG-GAP-03's policy mechanism, with its own action code.

**10. Provenance / time.** Each version requires `effectiveAt`, `recordedAt`, `createdByActorId`,
and `sourceRefs`. Effective and recorded time are distinct: a plan revised in a Tuesday rounds
meeting but entered Wednesday is effective Tuesday, recorded Wednesday.

**11. Correction / supersession.** Corrections create a new version with a supersession link.
No version is ever mutated or deleted. A correction is distinguishable from a clinical revision
by the reason code, which is required on a superseding version.

**12. Persistence consequence.** `DischargePlan` (identity, episode, tenancy) +
`DischargePlanVersion` (append-only). A uniqueness constraint must enforce at most one
non-terminal version per plan.

**13. Required acceptance invariants.** (i) two non-terminal versions for one plan is rejected;
(ii) a superseded version is never mutated; (iii) "current plan" is derived, never stored;
(iv) `targetDischargeDate` never satisfies any actual-discharge query (already proven by the
merged day-7 test).

**14. Impact on the existing contract.** Additive. `DischargePlanVersionSchema` needs a
`dischargePlanId` parent reference and a supersession reason code. No field is removed and no
locked semantic changes.

**15. Status. LOCKED.**

---

## LONG-GAP-02 — Destination-attempt identity

**1. Question.** Does each CareTransition need separate destination-attempt records?

**2. Repository evidence.** `CareTransitionSliceSchema` (`longitudinal.ts:176`) carries
`currentIntendedDestinationRef` — **singular and current-valued**. Its doc comment says
"Destination-attempt persistence remains LONG-GAP-02". As written, updating the intended
destination *overwrites the fact that a prior destination was attempted and refused*. LSR-05
already names destination-attempt modeling as a pre-schema dependency, and IA-001 holds
persisted `CareTransition` specifically on this point.

**3. Workflow evidence.** Placement is a sequence, not a value. A crisis-placement coordinator
contacts facilities in turn; each contact produces an outcome — accepted, refused for clinical
reasons, refused for capacity, no response, withdrawn by the patient. The refusal history *is*
the operational record: it drives escalation, explains delay, and is the evidence base for
barrier aging. Collapsing it to "current destination" destroys the only data that explains why a
transition took nine days, and makes `deriveBarrierAging` describe a duration nobody can account
for.

**4. Candidate interpretations.** (a) Separate append-only `DestinationAttempt` records, with
CareTransition holding only the current intent. (b) Current destination plus a free-text history
note. (c) Attempts modeled as TransitionBarriers.

**5. Contradictions / tradeoffs.** (b) is not queryable, cannot support aging or trending, and
puts operational fact in prose — the Constitution §4 provenance requirement cannot be met by a
note. (c) conflates two different things and collides directly with LSR-18: a barrier is a
condition to resolve; an attempt is an event with an outcome. Modeling a refusal as a barrier
invites reading the refusing facility as the blamed party, which is precisely the causal
attribution LSR-18 forbids. (a) costs one more table and preserves the story.

**6. Selected decision.** **Destination attempts are separate append-only records.** Each attempt
carries its own identity, the destination reference, requested-at and outcome-at times, an
outcome code, a source reference, and the actor who recorded it. `CareTransition` keeps
`currentIntendedDestinationRef` as a **derived** convenience over the latest non-withdrawn
accepted-or-pending attempt, not as independently mutable state. **LOCKED.**

**7. Rejected alternatives.** (b) rejected — unqueryable, fails provenance. (c) rejected —
conflates event with condition and creates a blame surface prohibited by LSR-18.

**8. Classification.** `DestinationAttempt` is an **event-like append-only entity** (it has
identity and an outcome, so it is not a pure event). "Current destination" is a **projection**.

**9. Authority owner.** Placement / transport coordination roles, facility-configured. Recording
an attempt is an operational act, not a clinical decision — it must **not** require clinical
authority, or coordinators cannot do their job.

**10. Provenance / time.** Each attempt requires `requestedAt`, `outcomeAt` (nullable while
pending), `recordedAt`, `recordedByActorId`, `sourceRef`. An outcome reported by the receiving
facility is a **claim** by that facility, not a fact about clinical appropriateness — the
outcome code must preserve that distinction (a refusal records *that they refused*, never *that
the patient was inappropriate*).

**11. Correction / supersession.** An attempt is corrected by a superseding attempt record
carrying a correction reason. Outcomes are never edited in place.

**12. Persistence consequence.** New `DestinationAttempt` table, child of `CareTransition`,
tenant-scoped, append-only.

**13. Required acceptance invariants.** (i) recording a new attempt never mutates a prior one;
(ii) current destination is derived and matches the attempt sequence; (iii) no attempt field can
express causal blame; (iv) a refusal outcome is classified as a claim by the receiving party,
never as a clinical determination.

**14. Impact on the existing contract.** `CareTransitionSliceSchema` must be reduced:
`currentIntendedDestinationRef` moves from stored state to a derived projection. This is a
**breaking change to the merged slice** and must be recorded as such in the reconciliation.

**15. Status. LOCKED.**

---

## LONG-GAP-03 — Clinical discharge-readiness authority

**1. Question.** Which facility-configured roles may record or supersede clinical discharge
readiness?

**2. Repository evidence.** `LongitudinalAuthorityPolicySchema` (`longitudinal.ts:364`) already
models this correctly: an org- and optionally facility-scoped policy naming
`authorizedRoleCodes` (min 1) drawn from `USER_ROLES`, with a `policyRef` and `effectiveAt`.
`evaluateLongitudinalAuthority` (`:391`) is a pure evaluator with no hard-coded role. The repo's
13 `USER_ROLES` include `CLINICAL_REVIEWER` and `PHYSICIAN_REVIEWER`. ADR-0024 established the
precedent for an explicit, enumerated, same-organization allow-list — and for excluding
`SYSTEM_ADMIN` from clinical operations. The conformance baseline found this row **PARTIAL**: the
evaluator is proven, the binding is not.

**3. Workflow evidence.** Who may declare a patient clinically ready for discharge is a
licensure and medical-staff-bylaws question, and it varies by facility and by state. In Louisiana
inpatient psychiatric settings the determination typically rests with a physician or a
psychiatric-mental-health nurse practitioner within their scope; other disciplines contribute
evidence toward it. Clarity cannot name that list from a repository.

**4. Candidate interpretations.** (a) Hard-code a qualified role set. (b) Facility-configured
policy, no platform default. (c) Facility-configured with a platform-supplied default.

**5. Contradictions / tradeoffs.** (a) is prohibited: LSR-08 makes readiness a *qualified-human*
decision, and hard-coding would have Clarity assert a licensure rule it has no authority to
assert (Constitution §3; CLAUDE.md rule 4 — no approved clinical/legal rules claimed). (c) is
worse than it looks: a default is a rule, and a facility that never reviews it has silently
inherited Clarity's clinical judgment. (b) is honest but requires the policy to exist before the
first decision can be recorded — which is the correct fail-closed behavior.

**6. Selected decision.** **Authority is facility-configured. Clarity supplies no default.**
Recording or superseding a clinical discharge-readiness decision requires a
`LongitudinalAuthorityPolicy` for `RECORD_CLINICAL_DISCHARGE_READINESS` that is effective at the
decision's effective time and names at least one role the actor holds. **Absent policy fails
closed** — the decision cannot be recorded. Every decision stores the `policyRef` that authorized
it, so the authority basis is reconstructible at any later date even after the policy changes.
**BOUNDED.**

**7. Rejected alternatives.** (a) rejected — Clarity would be asserting licensure. (c) rejected —
a default is an unreviewed rule that becomes invisible clinical policy.

**8. Classification.** Authority is **configuration** (a governed policy record). The decision is
an append-only **decision** entity. Neither is derived.

**9. Authority owner.** The facility's medical staff / clinical leadership, expressed as a
governed policy record. Who may edit that policy is itself an authority question and must be
answered before the policy is writable — flagged for the reconciliation.

**10. Provenance / time.** The decision stores `decidedByActorId`, `decidedByRoleCode`,
`decidedAt`, `effectiveAt`, `recordedAt`, `evidenceRefs`, `criteriaRefs` — all already present in
`ClinicalDischargeReadinessDecisionSchema`. Add the authorizing `policyRef`. Policies are
themselves versioned by `effectiveAt`; evaluation uses the policy effective at the decision's
effective time, never the policy in force today.

**11. Correction / supersession.** Append-only with `supersedesDecisionId` (already contracted).
A superseding decision requires authority under the policy effective at **its own** effective
time. A decision recorded under a policy later found invalid is **not** retroactively void — it is
superseded with a reason, preserving history (Constitution §2).

**12. Persistence consequence.** `ClinicalDischargeReadinessDecision` (append-only) +
`LongitudinalAuthorityPolicy` (versioned configuration). The bound does **not** affect either
stored shape, so persistence may proceed on this BOUNDED decision.

**13. Required acceptance invariants.** (i) no policy → recording fails closed; (ii) an actor
without a named role is denied; (iii) the stored `policyRef` reproduces the authority decision
later; (iv) no role is hard-coded anywhere in the path; (v) evaluation uses effective-time policy,
not current policy.

**14. Impact on the existing contract.** Additive: `policyRef` on the decision schema. The
evaluator is unchanged.

**15. Status. BOUNDED.** Remaining: each facility must supply its own role list. Gated on OD-3
(clinical licensing) for any Clarity-authored guidance. **This bound does not block persistence.**

---

## LONG-GAP-04 — Canonical level-of-care registry

**1. Question.** What canonical level-of-care registry should span inpatient, residential, PHP,
IOP, outpatient, post-acute and other applicable settings?

**2. Repository evidence — this gap is substantially already answered, and there is a live
contradiction.** `prisma/schema.prisma:94` defines `enum LevelOfCare` with ten members:
`INPATIENT_PSYCHIATRIC`, `CRISIS_STABILIZATION`, `RESIDENTIAL`, `PARTIAL_HOSPITALIZATION`,
`INTENSIVE_OUTPATIENT`, `OUTPATIENT`, `MEDICAL_ADMISSION_WITH_PSYCHIATRIC_CONSULT`,
`SUBSTANCE_USE_DETOX`, `SUBSTANCE_USE_RESIDENTIAL`, `UNKNOWN`. It is mirrored at
`packages/domain-contracts/src/authorization.ts:19` as `LEVELS_OF_CARE` and **enum-sync-tested**
at `tests/unit/contract-schema-enum-sync.test.ts:27`. It is used across the schema
(`requestedLevelOfCare`, `requestedLevel`, facility `programs`).

The merged longitudinal slice ignores it. `LevelOfCareRecommendationSchema.recommendedLevelCode`
is `z.string().min(1).max(100)` — an open string — and the fixture
(`tests/data/longitudinal-day1-day39.ts:63,79`) uses **`"INPATIENT"` and `"IOP"`, neither of
which is a member of the existing enum.** The Day 1→39 scenario therefore expresses levels of
care in a private vocabulary that cannot be joined to authorization, benefits or facility program
data.

**3. Workflow evidence.** The listed settings match how Louisiana behavioral-health placement
actually steps down: inpatient psychiatric → residential or PHP → IOP → outpatient, with detox
and substance-use residential as parallel tracks and medical admission with psychiatric consult
as a distinct disposition. The existing enum is a credible operational spine. Its `UNKNOWN`
member is correct and should be kept — it lets a source say "level not established" without
guessing, satisfying LSR-17.

**4. Candidate interpretations.** (a) Adopt the existing `LevelOfCare` enum as the canonical
registry. (b) Build a new longitudinal-specific registry. (c) Keep the open string and defer.

**5. Contradictions / tradeoffs.** (b) violates the Developer Handoff's existing-owner rule —
find the current owner and extend before creating — and would give Clarity two LOC vocabularies
that must be crosswalked forever. (c) is what the merged slice does, and the fixture drift is the
predictable result: an unconstrained string collects private spellings within weeks. The cost of
(a) is that the enum may need members for post-acute settings; that is an extension, not a
reason to fork.

**6. Selected decision.** **The existing `LevelOfCare` enum is the canonical registry.** All five
LOC dimensions — clinical recommendation, payer authorization, availability, patient preference,
actual — draw from it. Extending it follows the existing enum-sync discipline: add to
`prisma/schema.prisma`, mirror in `LEVELS_OF_CARE`, and the sync test enforces the pair.
**The merged slice's drift is a defect to correct**: `recommendedLevelCode` must become
`z.enum(LEVELS_OF_CARE)` and the fixture must use `INPATIENT_PSYCHIATRIC` and
`INTENSIVE_OUTPATIENT`. **LOCKED.**

**7. Rejected alternatives.** (b) rejected — existing-owner rule; creates a permanent crosswalk.
(c) rejected — the drift already happened; leaving it open guarantees more.

**8. Classification.** A controlled **vocabulary** (configuration-grade reference data expressed
as an enum), not an entity. Crosswalks to external payer or regulatory vocabularies are separate
mapping records, not members of this enum.

**9. Authority owner.** Platform, as domain contract. Extending it is an ADR-level change because
`LevelOfCare` is already load-bearing for authorization and benefits.

**10. Provenance / time.** The *code* is a value. The *source* of each LOC statement carries the
provenance, which the five-dimension profile already models via `sourceRef` /
`sourceDecisionId`.

**11. Correction / supersession.** Not applicable to the vocabulary. Corrections to a LOC
*statement* are handled by the owning record's supersession (recommendation supersession is
already contracted).

**12. Persistence consequence.** None new — the enum exists. Longitudinal objects referencing it
gain a typed column rather than free text, which is a strictly better persistence position.

**13. Required acceptance invariants.** (i) an out-of-registry LOC code is rejected at the
contract boundary; (ii) the enum-sync test covers every LOC-typed longitudinal field;
(iii) `UNKNOWN` is never rendered as a clinical recommendation; (iv) the five dimensions remain
independently valued (already proven by the merged disagreement test).

**14. Impact on the existing contract.** **Breaking, and a correction to merged work.**
`recommendedLevelCode`, `currentActualLevelOfCareCode` and the profile's `levelCode` fields move
from open string to `z.enum(LEVELS_OF_CARE)`; the Day 1→39 fixture must be re-coded. Authorized
under IA-001 §10 (contract + fixture + test work). Recorded in the reconciliation as a required
pre-persistence correction.

**15. Status. LOCKED.**

---

## LONG-GAP-05 — Barrier taxonomy

**1. Question.** What barrier taxonomy supports operations and trending without becoming a blame
taxonomy?

**2. Repository evidence.** `TransitionBarrierSchema` has `categoryCode` as an open string with
the comment "Taxonomy intentionally remains open under LONG-GAP-05", alongside
`responsibilityKind`, `responsibleRoleCode`, `assignedUserId`, `waitingOnPartyRef`,
`resolutionCode`. The conformance baseline confirmed the schema is `.strict()`, so `causedBy` and
`primaryBarrier` are structurally rejected — the anti-blame protection is real today.

**3. Workflow evidence.** Operationally useful categories describe *what is missing*: no
accepting destination, awaiting payer authorization, medication access unresolved, transport
unavailable, guardian or consent unresolved, housing unavailable, documentation incomplete.
Each names a condition. The blame version of the same list names a party — "facility refused",
"payer denied", "family uncooperative" — and it is seductive because it reads as more
informative. It is the taxonomy that turns an operations tool into a liability exhibit, and it is
also usually wrong: waiting on a payer is not evidence the payer erred.

**4. Candidate interpretations.** (a) Fixed platform enum. (b) Facility-configurable categories
with locked structural invariants. (c) Free text.

**5. Contradictions / tradeoffs.** (a) would have Clarity assert a normative operational model
across facilities that differ in real ways, and every missing category becomes "Other", which
destroys trending. (c) cannot trend at all and fails provenance. (b) keeps trending possible
within a facility while leaving the clinical/operational list to the people who own the process.

**6. Selected decision.** **Category is facility-configurable reference data; the structural
invariants are locked.** Locked invariants: a category names a **condition**, never a party; a
category must not encode causation, fault or a performance judgment; `waitingOnPartyRef` records
*who the work sits with*, which is an operational fact, and must never be projected as cause;
resolution requires a `resolutionCode`, an actor and a time. **BOUNDED.**

**7. Rejected alternatives.** (a) rejected — Clarity asserting a cross-facility operational
model; "Other" defeats trending. (c) rejected — untrendable, unprovenanced.

**8. Classification.** `TransitionBarrier` is an entity with a lifecycle (already contracted).
Category is **configuration**. Barrier age is **derived** (already contracted and tested).

**9. Authority owner.** Facility operations leadership configures categories. Identifying and
resolving a barrier is an operational act; it must not require clinical authority.

**10. Provenance / time.** `identifiedAt`, `effectiveAt`, `resolvedAt`, `resolvedByActorId`,
`sourceRefs` — all present. Aging derives from these and is capped at resolution (proven by the
merged test).

**11. Correction / supersession.** `SUPERSEDED` and `REOPENED` are already in the lifecycle, and
`RESOLVED → REOPENED` is already permitted — correctly, because barriers recur. A miscategorized
barrier is superseded, never edited.

**12. Persistence consequence.** `TransitionBarrier` table plus a facility-scoped
`BarrierCategory` configuration table. The bound affects **rows, not shape**, so persistence may
proceed.

**13. Required acceptance invariants.** (i) no barrier field can express causation — enforce by
asserting the schema **rejects** `causedBy` (see conformance finding F-1, which showed the
current test only asserts the fixture lacks it); (ii) `waitingOnPartyRef` never appears in any
projection labelled cause, fault or responsibility-for-delay; (iii) aging is derived and capped;
(iv) a category rename does not rewrite historical barriers.

**14. Impact on the existing contract.** Additive: `categoryCode` gains a foreign-key-style
reference to configured categories. No locked semantic changes.

**15. Status. BOUNDED.** Remaining: each facility supplies its category list. **Does not block
persistence.**

---

## LONG-GAP-06 — Core vs configurable longitudinal observations

**1. Question.** Which recovery/function and environment/support concepts are core platform
semantics versus configurable assessment fields?

**2. Repository evidence.** The canon's `LONGITUDINAL_MODEL.md` lists recovery/function
(symptoms, daily function, treatment engagement, self-management, cognition, patient-defined
goals) and environment/support (housing, family support, transportation, medication access,
community resources, receiving-setting capability, supervision) as longitudinal dimensions. The
merged contract persists **none** of them. What it does carry are *references*:
`DischargePlanVersionSchema` has `patientGoalRefs`, `treatmentPreferenceRefs`,
`supportPersonRefs`, `medicationPlanRef`, `environmentNeedRefs`, `followUpPlanRefs`,
`transportPlanRef`. `deriveTransitionReadiness` consumes readiness **components**, not raw
observations. `RecoveryProfile`, `EnvironmentSupportProfile` and `CareIntensityProfile` are
LOCKED as derived (Semantic Lock §2).

**3. Workflow evidence.** Assessment instruments vary by facility, payer and program, and they
change — a facility may switch instruments and must not lose the ability to read its own history.
But a small number of these concepts are not assessment data at all: they are *preconditions a
transition depends on*. Whether medication access is resolved, whether transport is arranged,
whether a receiving setting has accepted — these gate discharge, appear in `deriveTransitionReadiness`,
and cannot be optional per facility without making the readiness projection meaningless.

**4. Candidate interpretations.** (a) Enumerate a core observation set now. (b) Make everything
configurable. (c) Let dependency decide: core iff a governed decision or projection depends on it.

**5. Contradictions / tradeoffs.** (a) requires clinical input this repository cannot supply and
risks freezing one facility's instrument into platform semantics — a collapse of configuration
into meaning. (b) makes `deriveTransitionReadiness` non-comparable across facilities and lets a
facility silently disable a readiness component, which would let "READY" mean different things in
different places — a false master state by omission. (c) is a rule rather than a list, and it can
be locked today because the dependency is already visible in the merged contract.

**6. Selected decision.** **Dependency decides.** A concept is **core** if and only if a governed
decision or a governed projection depends on it — which today means exactly the readiness
components consumed by `deriveTransitionReadiness` (clinical, medication, destination, follow-up,
transport, support, handoff per LSR-10). Core components are platform semantics, always present,
and always three-valued (satisfied / not satisfied / **unknown**). Everything else —
instruments, scores, scales, narrative assessments — is **configurable observation** attached by
reference, never promoted into a decision input without a new gap. **BOUNDED.**

**7. Rejected alternatives.** (a) rejected — needs OD-3 clinical input; risks freezing one
instrument into the platform. (b) rejected — makes readiness incomparable and silently
disableable, producing a false master state.

**8. Classification.** Core readiness components are **derived projection inputs** with a fixed
vocabulary. Configurable observations are **observations** (epistemic class OBSERVATION) attached
by `sourceRef`. Profiles remain **derived**, never stored (Semantic Lock §2).

**9. Authority owner.** Platform owns the core component list (change = ADR). Facilities own
their instruments. Neither may promote an instrument result into a decision.

**10. Provenance / time.** Every observation carries its source, observer, observed-at and
recorded-at. An observation is never a decision: a functional-assessment result does not make
someone ready for discharge; only an authorized human decision does (LSR-08).

**11. Correction / supersession.** Observations are append-only and corrected by superseding
observations. Because profiles are derived, a corrected observation automatically corrects every
profile — which is the principal argument for keeping profiles derived.

**12. Persistence consequence.** No new core observation tables. Configurable observations attach
through the existing evidence/source-reference pattern. **`RecoveryProfile`,
`EnvironmentSupportProfile` and `CareIntensityProfile` must not be persisted** (Semantic Lock §2,
IA-001 §10).

**13. Required acceptance invariants.** (i) every core readiness component is representable as
unknown and unknown never reads as satisfied; (ii) a facility cannot remove a core component;
(iii) no configurable observation is an input to a governed decision; (iv) no profile is stored;
(v) no profile produces a single score (already proven for the LOC profile).

**14. Impact on the existing contract.** Additive: `deriveTransitionReadiness` should type its
component set against a named vocabulary rather than accepting an open shape.

**15. Status. BOUNDED.** Remaining: each facility's instrument list. **Does not block
persistence**, because no configurable observation gets a core table.

---

## LONG-GAP-07 — Actual-discharge command contract

**1. Question.** What exact command, source, disposition and correction contract governs actual
discharge?

**2. Repository evidence.** `DischargeRecordedSlicePayloadSchema` (`longitudinal.ts:330`) carries
`dischargeFactId`, `episodeId`, `dischargedAt`, `recordedAt`, `recordedByActorId`, `sourceRef`,
and is explicitly labelled "Candidate fact payload only". `ActualDischargeFactSchema` (`:405`) is
the consumed shape. `RECORD_ACTUAL_DISCHARGE` is already a `LONGITUDINAL_AUTHORITY_ACTIONS`
member. `derivePendingDischarge` keys the end of the pending interval on an actual discharge
fact — **never** on `EpisodeStatus`, a target date, or a payer end date — and the merged day-7
test proves the target date does not trigger it. `EPISODE_STATUS_TRANSITIONS` permits
`ACTIVE → DISCHARGED` and also `ACTIVE → CLOSED`. Clarity's established command pattern
(CLAUDE.md) already supplies the envelope: Zod → role policy → one transaction → versioned update
→ atomic audit → idempotency record.

**3. Workflow evidence.** Actual discharge is a recorded event with a time, a disposition and a
recorder. It is frequently recorded *after* it happened, so effective and recorded time diverge
routinely. It is also genuinely corrected — a discharge entered at the wrong hour, or entered
against the wrong episode, is common enough that correction must be first-class rather than an
incident. What it must never be is inferred: a bed showing vacant, transport departing, or an
authorization ending are all *consistent with* discharge and prove nothing (LSR-11).

**4. Candidate interpretations.** (a) A status transition on Episode. (b) An append-only
discharge **fact** recorded by a governed command, with `EpisodeStatus` derived or separately
transitioned. (c) Infer from the source system.

**5. Contradictions / tradeoffs.** (c) is prohibited outright by LSR-11. (a) is the tempting one
and it is wrong: a status field cannot carry effective-vs-recorded time, cannot express a
correction without destroying history, and would make discharge time unrecoverable after an edit.
(b) matches every other append-only decision in the platform and keeps `EpisodeStatus` as a
coarse lifecycle marker rather than the record of when discharge occurred.

**6. Selected decision.** **Actual discharge is an append-only fact recorded by a governed
command.** The command contract is locked as: named actor; authority via
`RECORD_ACTUAL_DISCHARGE` policy (LONG-GAP-03 mechanism); tenant-scoped; input requires
`episodeId`, `dischargedAt` (effective), `sourceRef`, and a disposition code; preconditions
require a non-terminal episode and no unsuperseded discharge fact; `recordedAt` server-assigned;
idempotency by fingerprint **excluding `occurredAt`** (ADR-0014 §5); emits a governed event;
writes an atomic audit event; conflict = non-revealing error; corrections via a new superseding
fact carrying a reason code. **Inference paths explicitly forbidden**: target discharge date,
payer authorization end, bed vacancy, transport activity, readiness decision, episode status.
**LOCKED as to shape. BOUNDED** on the disposition vocabulary.

**7. Rejected alternatives.** (a) rejected — cannot carry dual time, cannot correct without
destroying history. (c) rejected by LSR-11.

**8. Classification.** `ActualDischargeFact` is an append-only **fact** entity; the command is a
**command**; `DISCHARGE_RECORDED` is a governed **event**; `PendingDischarge` end is **derived**.

**9. Authority owner.** Facility-configured via the `RECORD_ACTUAL_DISCHARGE` policy. Note this
is an **administrative/clinical recording** authority, not a clinical judgment — recording that
discharge occurred is distinct from deciding it should (LSR-08 vs LSR-11). The two must not share
a policy row by default.

**10. Provenance / time.** `dischargedAt` (effective) and `recordedAt` (recorded) are separate and
both required; `receivedAt` applies if the fact arrives from an external source. `sourceRef`
identifies the originating record. Never derive `dischargedAt` from `recordedAt`.

**11. Correction / supersession.** A correction is a **new fact** superseding the prior one with a
required reason code. The superseded fact is retained and remains queryable — "what did we
believe on day 10?" must stay answerable (Constitution §2). Retracting a discharge entirely
(recorded against the wrong episode) is a supersession with a retraction reason, not a delete.

**12. Persistence consequence.** New `ActualDischargeFact` table, append-only, tenant-scoped,
unique on "at most one unsuperseded fact per episode". **`EpisodeStatus` remains unchanged** —
no new member, no `PENDING_DISCHARGE`.

**13. Required acceptance invariants.** (i) no inference path produces a discharge fact —
negative tests for each of the six forbidden sources; (ii) recording without authority fails
closed; (iii) replaying the command is idempotent and does not create a second fact;
(iv) a correction preserves the prior fact and the prior answer remains reconstructible;
(v) `derivePendingDischarge` ends the interval only on an unsuperseded fact.

**14. Impact on the existing contract.** `DischargeRecordedSlicePayloadSchema` needs a disposition
code and a supersession reference. Otherwise additive.

**15. Status. LOCKED (shape).** Remaining bound: the disposition code list (home, residential,
transfer to another facility, against medical advice, elopement, death, other), which touches
regulatory reporting and is gated on OD-13 review. **Does not block persistence** — disposition
is a typed column whose vocabulary can be configured.

---

## LONG-GAP-08 — Continuity evidence sources

**1. Question.** Which sources can establish follow-up, medication events, next level of care, ED
use and readmission?

**2. Repository evidence.** `CONTINUITY_EVENT_TYPES` already enumerates eight typed events.
`ContinuityEventSchema` carries `sourceSystem`, `sourceRecordRef`, `provenanceRefs`,
`effectiveAt`, `recordedAt`, `receivedAt` (nullable) and `qualityState` drawn from
`DATA_QUALITY_STATES` (`VALID`, `VALID_WITH_WARNINGS`, `PENDING_REVIEW`, `QUARANTINED`,
`REJECTED`, `CORRECTED`, `SUPERSEDED`). `deriveContinuityWindow` takes an explicit
`sourceCoverageCompleteness` and is proven in both directions: `PARTIAL` → `UNKNOWN`,
`COMPLETE_FOR_WINDOW` → `NONE_OBSERVED_WITH_COMPLETE_COVERAGE`. `IopSourceIntegration` shows the
house pattern for a registered, tenant-scoped, program-bound source.

**3. Workflow evidence.** Continuity evidence arrives from heterogeneous places with genuinely
different completeness: a receiving IOP program's own attendance records may be complete for its
window; a state HIE may be complete for ED visits in-state and blind to out-of-state; patient or
family self-report is a claim, not a record; a pharmacy fill record proves a fill, **not
adherence** (an explicit no-collapse rule). The hard part is not listing sources — it is that
each source's completeness is scoped to an event type *and* a time window, and that scoping is
what licenses saying "none observed" instead of "unknown".

**4. Candidate interpretations.** (a) Fixed list of approved source types. (b) Registered sources
that declare per-event-type, per-window coverage. (c) Accept any source and treat all absence as
unknown.

**5. Contradictions / tradeoffs.** (a) cannot anticipate real integrations and hard-codes an
integration roadmap into semantics. (c) is safe but useless — Clarity could never report a clean
30-day window even with complete data, which fails the operational purpose. (b) is the only
option that makes the already-proven `COMPLETE_FOR_WINDOW` branch reachable honestly.

**6. Selected decision.** **A registered `ContinuitySource` declares, per event type and per time
window, whether its coverage is complete.** `sourceCoverageCompleteness` is computed from those
declarations, never asserted by a caller. Absent a declaration, coverage is `PARTIAL` and the
projection returns `UNKNOWN` — fail-closed epistemics. Self-report is registered as a source whose
declarations are always `PARTIAL`, so it can contribute an observation but can never license
"none observed". **BOUNDED.**

**7. Rejected alternatives.** (a) rejected — hard-codes an integration roadmap into semantics.
(c) rejected — makes the complete-coverage branch permanently unreachable.

**8. Classification.** `ContinuityEvent` is a typed **event** (already contracted).
`ContinuitySource` and its coverage declarations are **configuration**. Continuity windows are
**derived projections**. There is **no** Continuity entity and no continuity score (LSR-12,
LSR-15, prohibited by IA-001 §10).

**9. Authority owner.** Registering a source and declaring its coverage is an organizational
data-governance act, not a clinical one. **Declaring coverage complete is consequential** — it is
what converts silence into "none observed" — so it requires its own authority and its own audit
trail.

**10. Provenance / time.** Three times already contracted: `effectiveAt` (when it happened),
`recordedAt` (when the source recorded it), `receivedAt` (when Clarity received it). All three
matter: a readmission on day 12 received on day 20 must not retroactively change what a day-15
projection reported.

**11. Correction / supersession.** `qualityState` already supports `CORRECTED` and `SUPERSEDED`.
A corrected event supersedes its predecessor; the prior projection answer stays reconstructible.
Coverage declarations are versioned by effective time — narrowing coverage retroactively converts
past "none observed" answers to "unknown", which is correct and must be visible rather than
silent.

**12. Persistence consequence.** `ContinuityEvent` (append-only) + `ContinuitySource` +
`ContinuitySourceCoverage` (versioned configuration). **No monolithic `Continuity` entity** —
prohibited.

**13. Required acceptance invariants.** (i) no coverage declaration → `UNKNOWN`, never "none";
(ii) a caller cannot pass completeness directly; (iii) `PRESCRIPTION_FILL_RECORDED` never
projects as adherence; (iv) a late-arriving event does not rewrite a prior projection answer;
(v) narrowing coverage flips affected answers to unknown; (vi) no continuity score exists
(already proven).

**14. Impact on the existing contract.** `deriveContinuityWindow`'s `sourceCoverageCompleteness`
parameter changes from a caller-supplied value to a derived one — a **breaking change** to the
merged function signature, recorded in the reconciliation.

**15. Status. BOUNDED.** Remaining: which real integrations exist, gated on OD-5 (API hosting) and
counsel review (OD-2) for any external data. **Does not block persistence of the event and source
tables.**

---

## LONG-GAP-09 — DISCHARGED → CLOSED operational boundary

**1. Question.** What operational work remains allowed between the existing Episode states
DISCHARGED and CLOSED?

**2. Repository evidence.** `EPISODE_STATUS_TRANSITIONS` (`episode.ts:28`):
`ACTIVE → [DISCHARGED, CLOSED]`, `DISCHARGED → [CLOSED]`, `CLOSED → []`. Two facts follow.
First, **`CLOSED` is terminal** — there is no reopen path. Second, **an Episode can go
`ACTIVE → CLOSED` directly**, without ever being `DISCHARGED`; the contract permits an episode
that closes without a discharge (administrative closure, transfer, erroneous creation), and
nothing currently distinguishes that from a discharge. `EpisodeAuthorization` has its own
`OPEN → [CLOSED, SUPERSEDED]` lifecycle, independent of Episode status.

**3. Workflow evidence.** Real work continues after the patient leaves. Utilization review closes
out authorized days; documentation gaps are completed; the receiving facility confirms the
patient arrived; barriers that delayed the transition are resolved and coded; continuity events
arrive for 30 days or more. Closing the episode the moment the patient walks out would strand all
of it. Conversely, "CLOSED" must mean something — if operational work continued indefinitely after
closure, the state would carry no information.

**4. Candidate interpretations.** (a) DISCHARGED is terminal for all work. (b) DISCHARGED remains
operationally open for a defined set of work; CLOSED is terminal. (c) No boundary; both are
labels.

**5. Contradictions / tradeoffs.** (a) strands UR closeout and continuity observation, and would
push facilities to delay recording discharge in order to keep working — corrupting the
discharge time, which LSR-11 exists to protect. (c) makes the states meaningless. (b) matches
both the workflow and the existing authorization lifecycle.

**6. Selected decision.** **`DISCHARGED` is an operationally open state; `CLOSED` is terminal for
new operational work.** In `DISCHARGED`, permitted: continuity event ingestion, barrier
resolution, care-transition completion, authorization/UR closeout, documentation-gap completion,
and corrections to any prior record. Prohibited in `DISCHARGED`: a new discharge fact (one
unsuperseded fact per episode), a new LOC recommendation for the concluded stay, or a new
readiness decision — those describe a stay that has ended. In `CLOSED`: **no new operational
records**; corrections only, via append-only supersession, because history must stay correctable
forever (Constitution §2). Continuity events with an effective time inside an observed window may
still be **received** after closure — they are observations about the person, not work on the
episode — but they never reopen the episode. **LOCKED.**

**7. Rejected alternatives.** (a) rejected — strands real work and creates an incentive to
falsify discharge time. (c) rejected — empties the states of meaning.

**8. Classification.** Episode status is **recorded state** with a locked transition function.
"Operationally open" is **derived** from status, not a second stored flag.

**9. Authority owner.** Closing an episode is an administrative act. Per-work-type authority is
unchanged by this decision — UR closeout still requires UR authority, and so on.

**10. Provenance / time.** Both transitions need an actor and a time. The direct
`ACTIVE → CLOSED` edge needs a **required reason code**, because it is the only way an episode
ends without a discharge fact and it must not be silently indistinguishable from discharge.

**11. Correction / supersession.** Corrections are permitted in every state including `CLOSED`,
always by append-only supersession, never by mutation. `CLOSED` is terminal for *new work*, not
for *truth maintenance* — a distinction that must survive into implementation.

**12. Persistence consequence.** **No schema change.** `EpisodeStatus` is unchanged; the existing
transition function already expresses the lifecycle. A reason code is required on the direct
`ACTIVE → CLOSED` edge.

**13. Required acceptance invariants.** (i) a second unsuperseded discharge fact is rejected;
(ii) new operational records in `CLOSED` are rejected while corrections are accepted;
(iii) a late continuity event does not reopen an episode; (iv) `ACTIVE → CLOSED` without a reason
code is rejected; (v) `CLOSED` has no reopen path.

**14. Impact on the existing contract.** None to the longitudinal slice. One additive
requirement on the existing episode transition (reason code on the direct edge).

**15. Status. LOCKED.**

---

## LONG-GAP-10 — Projection without a parent aggregate

**1. Question.** Can the first longitudinal projection be reliably derived from PatientToken +
BehavioralHealthCase + CaseEpisodeLink + Episode, avoiding a new parent aggregate?

**2. Repository evidence — and the hard limit this gap exposes.**
`deriveLongitudinalCareJourneyProjection` (`longitudinal.ts:678`) already produces the projection
from exactly those inputs, and the merged test proves the result carries neither `id` nor
`status`. `CaseEpisodeLink` is tenant-scoped with `@@unique([caseId, episodeId])` and
`@@unique([organizationId, sourceAcceptanceId])`, so the case→episode edge is unambiguous and
provenanced (`linkedAt`, `linkedByActorId`, `sourceAcceptanceId`).

**But `PatientToken` carries `organizationId` and has no cross-organization identity.** Its only
external handle is a nullable `externalPatientReference`. There is no person-level identity that
spans tenants, and no matching or linkage service exists. **The longitudinal journey is therefore
derivable within one organization and is not derivable across organizations.**

**3. Workflow evidence.** Within one organization the derivation is sound: the same person's
repeat admissions link through their `PatientToken`, each bounded record stays bounded, and the
story assembles. Across organizations it is exactly the hard problem — a patient presenting at a
second facility is a *different* `PatientToken` with no governed link, and manufacturing one
would be identity matching, which carries privacy, consent and accuracy consequences far beyond
this gap. A false match merges two people's histories; a missed match silently truncates one.

**4. Candidate interpretations.** (a) Projection-first, derived per organization.
(b) Durable parent aggregate now. (c) Projection-first plus a cross-org identity resolution layer.

**5. Contradictions / tradeoffs.** (b) is PROHIBITED for the first slice (Semantic Lock §2,
IA-001 §10) and the evidence does not support it: the derivation demonstrably works, so the
"derivation is insufficient" precondition LSR-02 requires is unmet. (c) is a different product
capability with its own consent and privacy gates, well outside this gap and outside IA-002. (a)
is what the merged contract already does.

**6. Selected decision.** **Projection-first, confirmed — derived from PatientToken +
BehavioralHealthCase + CaseEpisodeLink + Episode, and scoped to a single organization.** No
parent aggregate. The organizational limit is **part of the decision**, not a caveat: any
projection, UI or answer built on it must state that it covers this organization's records only,
and must never present a within-org journey as the person's complete history. **LOCKED.**

**7. Rejected alternatives.** (b) rejected — LSR-02's precondition is unmet and it is prohibited
for the first slice. (c) rejected as out of scope — cross-organization identity is a separate
capability requiring consent, privacy and matching-accuracy gates (OD-2), and must not be smuggled
in as a longitudinal implementation detail.

**8. Classification.** `LongitudinalCareJourney` is a **derived projection**. `CaseEpisodeLink` is
an existing governed **relationship** carrying its own provenance, satisfying LSR-16.

**9. Authority owner.** Read authority follows the existing tenant-scoped read policy (ADR-0024
precedent). No new authority is created, because no new state is created.

**10. Provenance / time.** Every element retains its own source and times; the projection adds
none. It must carry an evaluation time, because its content changes as records are added.

**11. Correction / supersession.** Nothing to correct — a correction to any input automatically
corrects the projection on next derivation. This is the principal practical argument for
projection-first and should be stated as such in the reconciliation.

**12. Persistence consequence.** **None. No table.** A materialized cache would be permissible
later only if it is provably a cache — reconstructible, invalidatable, never authoritative, never
independently mutable — and that is not authorized here.

**13. Required acceptance invariants.** (i) the projection exposes no aggregate id and no status
(already proven); (ii) it never spans organizations; (iii) a corrected input changes the next
derivation with no migration; (iv) it is reproducible from inputs alone; (v) any surface
presenting it states the single-organization scope.

**14. Impact on the existing contract.** Additive: the projection should carry an explicit
`organizationId` and an evaluation time so its scope is visible in the data rather than implied
by the caller.

**15. Status. LOCKED**, with the cross-organization limit locked alongside it.

---

## Consolidated impact on the merged longitudinal contract

Three of these decisions require **corrections to work already merged in PR #133**. All are
contract, fixture and test changes — authorized under IA-001 §10, no Prisma involved — and all
must land **before** persistence:

| # | Change | Kind | Gap |
|---|---|---|---|
| C-1 | `recommendedLevelCode` and the other LOC fields move from open string to `z.enum(LEVELS_OF_CARE)`; fixture re-coded from `"INPATIENT"`/`"IOP"` to `INPATIENT_PSYCHIATRIC`/`INTENSIVE_OUTPATIENT` | **Breaking** | 04 |
| C-2 | `CareTransitionSlice.currentIntendedDestinationRef` moves from stored state to a projection over `DestinationAttempt` records | **Breaking** | 02 |
| C-3 | `deriveContinuityWindow`'s `sourceCoverageCompleteness` becomes derived from registered coverage declarations rather than caller-supplied | **Breaking** | 08 |
| C-4 | `policyRef` added to readiness decisions; disposition code and supersession reference added to the discharge payload; `dischargePlanId` parent added to plan versions; `organizationId` + evaluation time added to the journey projection | Additive | 03, 07, 01, 10 |

C-1 is the one to flag plainly: the merged slice invented a private level-of-care vocabulary
while a canonical, enum-sync-tested `LevelOfCare` already existed three files away. That is the
existing-owner rule failing in practice, and it is worth recording as a lesson rather than a
silent fix.

## Honesty statement

These decisions are **semantic**. They authorize no Prisma change, migration, command, API or UI.
Nothing here claims production readiness, HIPAA compliance, PHI readiness, or approved clinical or
legal rules — the four BOUNDED gaps are bounded precisely because the remaining inputs require
clinical licensing (OD-3), counsel (OD-2) or real integration contracts (OD-5), none of which this
repository can supply. The workflow evidence cited is the domain reasoning behind each decision,
not a citation to an approved clinical source.
