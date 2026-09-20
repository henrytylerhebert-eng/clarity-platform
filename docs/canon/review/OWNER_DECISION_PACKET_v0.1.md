# Owner Decision Packet v0.1 — adversarial review of PR #136

**Date:** 2026-09-20
**Reviewed:** PR #136 head `fc1a706` against `main` at `44961b2`
**Purpose:** break the decisions in #136 before they authorize persistence, not defend them.
**Method:** each BOUNDED gap re-tested independently; two adversarial probes run against the
merged contract and deleted afterwards; no Prisma, migration, command service, mutating API or
governed UI touched.

## Headline

**IA-002 is NOT ratifiable as written. ADR-0026 is ratifiable only with amendment. The
persistence boundary stays closed.**

The blanket claim *"none of the four bounds blocks persistence"* **does not survive independent
re-testing.** Two of the four bounds can force a schema change. That claim is withdrawn and the
gap-closure document is amended accordingly.

Separately, two **defects in merged work** (#133) surfaced under probing. Both are in code the
conformance baseline described as "stronger than expected", and both are invisible to the current
tests because those tests only exercise fully-populated happy paths.

---

## 0. Two defects in merged contract code

### D-1 — `deriveTransitionReadiness([])` returns `READY`

Verified by probe:

```
deriveTransitionReadiness([]).executionState  →  "READY"
```

The function classifies by *presence* of `BLOCKED` then `UNKNOWN` states, and never checks that
the seven components in `TRANSITION_READINESS_SLICE_COMPONENTS` are all accounted for. An empty
array — **no evidence whatsoever** — yields `READY` with empty `blockedComponents` and empty
`unknownComponents`. One `READY` component out of seven does the same.

This violates **LSR-10** (no single flag may substitute for the seven independently governed
components) and **Verification Matrix row 19** ("Unknown is not guessed"), which the conformance
baseline rated the best-covered invariant in the matrix. It is invisible today because both
fixtures (`readinessDay6`, `readinessDay8`) supply all seven components.

**Severity: high.** `READY` from absence of evidence is precisely the failure mode the canon
exists to prevent, and readiness gates transition execution.

### D-2 — a `SUPERSEDED` or `REJECTED` continuity event still counts as `OBSERVED`

Verified by probe:

```
deriveContinuityWindow({events:[{...event, qualityState:"SUPERSEDED"}], …}).status  →  "OBSERVED"
```

`qualityState` appears exactly once in `longitudinal.ts` — line 273, the schema definition. **No
projection ever reads it.** So an event that was corrected away, quarantined, rejected at
ingestion, or superseded still reports as an observed continuity event.

This breaks the correction model the reconciliation relies on ("a corrected event supersedes its
predecessor") and makes `DATA_QUALITY_STATES` decorative in the longitudinal path.

**Severity: high.** It means a retracted readmission still reads as a readmission.

**Both are contract/test defects, fixable under IA-001 §10, and both become new preconditions
(C-7, C-8) below.** Neither is a reason to reopen a locked semantic decision — the semantics were
right; the implementation does not yet enforce them.

---

## 1. Independent re-test of the four BOUNDED gaps

Each is tested against the owner's criteria: *could the remaining unknown change cardinality,
ownership, relationships, provenance, authority, correction behavior, or lifecycle? Could a future
licensed clinical rule, legal interpretation, organization policy, or integration contract force a
schema change?*

### LONG-GAP-03 — clinical readiness authority → **FAILS**

**Fixed.** A decision requires an effective `LongitudinalAuthorityPolicy` naming at least one role
the actor holds; absent policy fails closed; the authorizing `policyRef` is stored; evaluation uses
effective-time policy; supersession requires authority at the superseding decision's own effective
time.

**Unknown.** Which roles each facility names — *and four things the original closure did not
separate out*: who may configure the mapping, who must approve a change to it, whether delegated
or emergency authority exists, and what happens to a decision later found to have been improperly
authorized.

**Could the unknown change shape? Yes — four ways.**

| Unknown | Schema consequence if the answer is "yes" |
|---|---|
| Change to the policy requires a named clinical approver | Policy needs `approvedByActorId`, `approvedAt`, approval evidence ref — **new columns** |
| Emergency or delegated authority exists | Delegation is not a role; it is a time-bounded grant with a grantor and a scope — **new table** |
| A policy can be revoked mid-window | `effectiveAt` versioning is insufficient; needs `revokedAt`, `revokedBy`, and a rule for decisions made in the revoked interval — **new columns + evaluation change** |
| An improperly authorized decision must be invalidated rather than superseded | Supersession preserves the decision as part of the chain. Invalidation must **exclude** it from projections while retaining it — a distinct state, **new column + projection change** |

The fourth is the sharpest. The closure asserted "superseded with a reason, never retroactively
voided". That is defensible as *provenance* policy, but it is a **clinical-governance and legal
question**, not one the repository can settle — and if counsel or clinical leadership says an
improperly authorized readiness decision must not continue to support a `PendingDischarge`
projection, the current model cannot express that.

**Verdict: NOT YET RATIFIABLE.** The bound does not merely fill rows; it can change the policy
table's shape and add a delegation table. Persisting `LongitudinalAuthorityPolicy` before these
are answered means designing the meta-authority record without knowing what it must carry.

### LONG-GAP-05 — barrier taxonomy → **PASSES, conditionally**

**Fixed.** Category names a condition, never a party; no field may encode causation
(structurally enforced — all schemas `.strict()`); resolution requires code, actor and time;
lifecycle including `REOPENED` is contracted.

**Unknown.** Each facility's category list.

**Could the unknown change shape?** Two candidates, both absorbable:

- **Hierarchy.** Facilities trend at category *and* subcategory level. A flat code list would force
  a later self-referencing parent column. **Absorb deliberately**: give `BarrierCategory` a
  nullable `parentCategoryId` from the start.
- **Retirement/rename.** Already handled by effective-time versioning plus the locked rule that a
  rename must not rewrite historical barriers.

No plausible clinical rule, legal interpretation or integration contract changes barrier
cardinality, ownership, provenance, authority or lifecycle — a barrier is an internal operational
record, not an externally-governed artifact.

**Verdict: RATIFIABLE WITH AMENDMENT** — the schema must deliberately absorb hierarchy, and the
anti-blame guarantee must move from prose into structure (see §3).

### LONG-GAP-06 — core vs configurable observations → **PASSES for Slice A only**

**Fixed.** A decision rule (challenged in §4 below and replaced).

**Unknown.** Which observations are core.

**Could the unknown change shape?** Not for Slice A, which touches no observation. **Yes for
Slices B and C**: if a licensed clinical rule adds a readiness component — guardian consent,
capacity determination, court authorization — then `TRANSITION_READINESS_SLICE_COMPONENTS` changes,
and anything that stores component state or sources gains a member. Because readiness is derived
and not stored, the blast radius is smaller than it looks, but the *sources* feeding a new core
component need typed provenance.

**Verdict: RATIFIABLE WITH AMENDMENT** (rule replaced per §4), **and explicitly non-blocking for
Slice A while blocking for Slices B and C.** The original blanket statement hid that distinction.

### LONG-GAP-08 — continuity evidence sources → **FAILS**

**Fixed.** Coverage is declared rather than asserted by a caller; absent declaration →
`PARTIAL` → `UNKNOWN`; self-report can never license "none observed".

**Unknown.** Which real sources exist and what each is authoritative for.

**Could the unknown change shape? Yes, decisively.** The owner's own list requires eight
distinguishable conditions. The merged contract offers **three**:

```
SOURCE_COVERAGE_COMPLETENESS = ["COMPLETE_FOR_WINDOW", "PARTIAL", "UNKNOWN"]
ContinuityWindowProjection.status = "OBSERVED" | "NONE_OBSERVED_WITH_COMPLETE_COVERAGE" | "UNKNOWN"
```

| Required distinction | Expressible today? |
|---|---|
| Observed event | Yes |
| Complete coverage, no event observed | Yes |
| Partial coverage | Yes |
| Source unavailable | **No** — collapses to PARTIAL/UNKNOWN |
| Source stale | **No** — no freshness concept exists |
| Failed ingestion | **No** — indistinguishable from "nothing happened" |
| Source not authoritative for that event type | **No** — coverage is not scoped by event type in the projection input |
| Unknown | Yes, but overloaded with the four above |

Distinguishing these requires per-source, per-event-type, per-window records carrying a
freshness timestamp, an ingestion-outcome state, and an authority scope. That is materially richer
than "a coverage declaration" and it **is** a shape change. It is also exactly where an integration
contract (OD-5) dictates structure: an HIE authoritative for in-state ED visits but blind
out-of-state cannot be represented by a single completeness value.

**Verdict: NOT YET RATIFIABLE.** Defect **D-2** compounds this: even the three states that exist
are computed without consulting `qualityState`.

### Result

**Two of four fail. The blanket claim is withdrawn.** Amended into the gap-closure document as a
per-gap table with this review cited.

---

## 2. LONG-GAP-03 — the meta-authority problem, decomposed

The original closure stopped at "facility-configured", which conflates at least seven distinct
things. Separated:

| # | Layer | Who/what settles it | Status |
|---|---|---|---|
| 1 | **The capability Clarity defines** — e.g. `RECORD_CLINICAL_DISCHARGE_READINESS` exists as an action | Platform (ADR) | **Settled.** Three actions contracted |
| 2 | **The role permitted to exercise it** at a facility | Facility clinical leadership | Mechanism settled (policy rows); values unknown, correctly |
| 3 | **Authority to configure that mapping** | **Unsettled** | The core question |
| 4 | **Authority to approve a change** to the mapping | **Unsettled** | May differ from 3 — separation of duties |
| 5 | **Effective date / version** of a policy | Platform | Settled (`effectiveAt`, versioned, never deleted) |
| 6 | **Decisions made under prior versions** | Platform | Settled — evaluate at decision effective time, store `policyRef` |
| 7 | **Emergency / delegated authority** | **Unsettled** | Not a role; a time-bounded grant. No contract exists |
| 8 | **Revocation** | **Unsettled** | No `revokedAt`; mid-window revocation inexpressible |
| 9 | **Correction of an improperly authorized decision** | **Unsettled** | Supersede vs invalidate — a governance question, not a technical one |

Layers 5 and 6 are genuinely well handled and should be preserved as-is. Layers 3, 4, 7, 8 and 9
are open, and **four of them have schema consequences** (§1).

### Is `LongitudinalAuthorityPolicy` the right persistence boundary?

**Partly.** It correctly models layer 2 — a versioned, org/facility-scoped, action-keyed role
mapping. It is the wrong boundary for layers 3, 4, 7 and 8: approval is an attribute of a *change*
to the policy, not of the policy; delegation is a separate grant with its own lifetime; revocation
is a lifecycle event the current model cannot express.

The honest framing is that `LongitudinalAuthorityPolicy` is **one of two or three objects**, and
the reconciliation proposed only the first.

### Is "seeded read-only" enough for Slice A?

**No.** Read-only prevents *writes through an API*; it does not settle **what the record must
carry**. A read-only table still has columns, and if approval or revocation is later required, the
table changes — which is a migration against a table that already holds authority records.
Read-only defers the wrong risk.

### The smallest owner decision required

**Decision OD-A: what must be true for a `LongitudinalAuthorityPolicy` to take effect?**

| Option | What it means | Consequence |
|---|---|---|
| **A1 — Administrative only** | `ORGANIZATION_ADMIN` may write a policy; audited; no separate approval | Simplest schema (no approval columns). **Risk:** a single administrative role can silently widen who may make clinical decisions. Hard to defend to a reviewer |
| **A2 — Administrative write + named clinical approver** *(recommended)* | Policy is drafted administratively and takes effect only when an identified clinical approver approves it | Adds `approvedByActorId`, `approvedAt`, approval evidence ref, and a `PENDING_APPROVAL` state. Matches how medical-staff privileging actually works. **Cost:** more schema, and an approver must exist before any decision can be recorded |
| **A3 — Out-of-band** | Policy mirrors a document maintained outside Clarity; Clarity stores a reference and never claims to be the system of record | Smallest schema (`policyRef` already exists). **Cost:** Clarity cannot answer "who approved this?" from its own data — weakens the audit story it otherwise has |

**Decision OD-B: does delegated or emergency authority exist?** If yes, it is a separate
time-bounded grant table and Slice A must either include it or explicitly exclude it with the
consequence that no emergency path exists at all.

**Decision OD-C: supersede or invalidate an improperly authorized decision?** Supersede preserves
the chain but leaves the bad decision supporting projections. Invalidate excludes it from
projections while retaining it. This is a clinical-governance and legal call (OD-2 / OD-3).

I am not inventing answers to these. They are the three smallest decisions that unblock Slice A,
and each changes the schema.

---

## 3. LONG-GAP-05 — can a configurable taxonomy become a blame taxonomy?

**Yes — through composition, not through any single field.** The merged `TransitionBarrier`
already carries `responsibilityKind`, `responsibleRoleCode`, `assignedUserId` and
`waitingOnPartyRef`. `.strict()` blocks a literal `causedBy`, but nothing blocks:

1. **Label smuggling** — a facility configures the category `"Facility refused — capacity"`. The
   *category* now names a party and a reason. Structurally legal; semantically a blame code.
2. **Hierarchy smuggling** — a parent category `"External delays"` vs `"Internal delays"` sorts
   barriers by fault before any analytics run.
3. **Ranking** — "primary barrier" is blocked as a *field*, but an ordered list rendered
   longest-first, or a projection returning `blockers[0]`, reproduces it exactly.
4. **Aggregation** — "average days waiting by `waitingOnPartyRef`" is a blame league table
   assembled entirely from permitted fields. **This is the most likely real-world breach**, because
   it looks like ordinary operational reporting.
5. **Resolution codes** — `resolutionCode: "PAYER_FINALLY_APPROVED"` editorialises in a field
   nobody is watching.

### Allocation

| Layer | Contents |
|---|---|
| **Platform semantics (locked)** | Barrier identity, lifecycle, `identifiedAt`/`effectiveAt`/`resolvedAt`, derived age, the rule that a category names a **condition**, and the rule that `waitingOnPartyRef` is an operational locus — never a cause |
| **Organization-configurable vocabulary** | Category and subcategory codes and labels, resolution codes — subject to a **structural constraint**, not a guideline (below) |
| **Source evidence** | `sourceRefs` establishing who reported the condition and when |
| **Derived operational projection** | Age, open/resolved counts, aging distribution, time-in-state — **unattributed** |
| **Prohibited causal inference** | Any projection, export, label or ranking that attributes delay to a named party, role or organization; any "primary/root cause" designation; any ordering presented as cause |

### Amendment required

Move the guarantee from prose into structure:

- **Category codes are party-free by construction.** A category references a
  `BarrierConditionKind` from a platform-owned closed vocabulary (what is missing: destination,
  authorization, medication, transport, consent/guardianship, housing, documentation). Facilities
  configure *labels and subcategories under* a condition kind; they cannot mint a top-level
  category that names a party.
- **No projection may group or rank by `waitingOnPartyRef`, `responsibleRoleCode` or
  `assignedUserId`.** Stated as an acceptance invariant with a negative test, not as guidance.
- **No ordered barrier list may be labelled or documented as primacy, priority or root cause.**

Without these, "configurable category + locked invariants" is an honour system.

---

## 4. LONG-GAP-06 — is the core/configurable rule circular?

**Yes. The owner's objection is correct and the current rule should be replaced.**

Current rule: *core iff a governed decision or projection depends on it.* Clarity authors the
projections. So Clarity can promote any observation to core by writing a projection over it, or
demote it by declining to — the rule constrains nothing and merely **describes the current
implementation**. Worse, it makes promotion *silent*: adding a projection would reclassify an
observation as core with no ADR, which is "schema invents semantics" running in reverse.

Proposed rule: *core when Clarity must understand its meaning consistently across organizations to
preserve longitudinal truth, provenance, authority, transition logic, or interoperability;
organization-specific observations stay configurable when the platform needs only their typed
evidence and provenance.*

| Criterion | Current rule | Proposed rule |
|---|---|---|
| Independent of Clarity's own choices | **No** — circular | **Yes** — asks whether meaning must agree across organizations |
| Testable | Weakly | **Yes** — "if org A and org B both record this, must it mean the same thing for the longitudinal record to be true?" |
| Stable under new features | **No** — a new projection silently promotes | **Yes** — meaning-consistency does not change because a screen was added |
| Failure mode | Silent promotion | Over-inclusion via a broad reading of "interoperability" |

**The proposed rule is better and should be adopted**, with one tie-breaker to contain its failure
mode:

> Where the two rules disagree, a concept is core only if a governed **decision** — not merely a
> projection — would be *wrong* if its meaning differed between organizations. Promotion from
> configurable to core always requires an ADR; it may never happen as a side effect of adding a
> projection.

Applying the proposed rule to today's seven readiness components: each must mean the same thing
across organizations or `TransitionReadiness` is not comparable and a transition decision could be
wrong — so all seven remain core. The rule change does not disturb the current classification; it
gives it a defensible basis, which the circular rule did not.

---

## 5. LONG-GAP-04 — is the existing `LevelOfCare` enum semantically complete?

Reopening the reasoning without presuming the decision. The ten members:

```
INPATIENT_PSYCHIATRIC · CRISIS_STABILIZATION · RESIDENTIAL · PARTIAL_HOSPITALIZATION
INTENSIVE_OUTPATIENT · OUTPATIENT · MEDICAL_ADMISSION_WITH_PSYCHIATRIC_CONSULT
SUBSTANCE_USE_DETOX · SUBSTANCE_USE_RESIDENTIAL · UNKNOWN
```

### Test against the continuum Clarity now needs

| Needed | Covered? |
|---|---|
| Inpatient psychiatric | Yes |
| Crisis stabilization | Yes — and correctly, for Louisiana crisis placement |
| Residential | Yes, incl. substance-use residential |
| PHP | Yes |
| IOP | Yes |
| Outpatient | Yes |
| Medical admission with psychiatric consult | Yes |
| Withdrawal management | **Partly** — one `SUBSTANCE_USE_DETOX` member cannot distinguish medically-managed from clinically-managed withdrawal, which differ in placement requirements |
| **Post-acute / community settings** | **No** — no ACT, intensive case management, supported housing, crisis respite, mobile-crisis follow-up, peer support |
| **Discharge to self-care with no services** | **No** — a real and common disposition, currently unrepresentable |
| **Forensic / diversion destinations** | **No** — a real Louisiana crisis-placement destination |

**Where it breaks.** Inside the episode the enum is sufficient: all five LOC dimensions
(recommendation, payer authorization, availability, preference, actual) concern inpatient and
step-down settings the enum covers. It **fails** at the continuity boundary:
`NEXT_LEVEL_OF_CARE_STARTED` must be codable for whatever the person actually started, and the
most common real answers after crisis placement — ACT, case management, supported housing, or no
services — are not members. Today they would land on `OUTPATIENT` or `UNKNOWN`, both of which are
**false**.

### Distinguishing the five layers the owner named

| Layer | Status |
|---|---|
| **Canonical clinical level-of-care concept** | What the enum should model. It currently models *levels* well and *community services* not at all |
| **Internal enum/code** | `LevelOfCare` — the existing owner |
| **Payer vocabulary** | Separate. Payer authorization already references the enum but a payer's own codes are a crosswalk, not members |
| **Facility/program vocabulary** | Separate — `FacilityProfile.programs` already types to the enum, which is appropriate |
| **External standard / crosswalk** | **Absent.** No ASAM, no CMS revenue-code, no state-service-code crosswalk exists. Not needed for Slice A; needed before external continuity ingestion |

There is also an **ontology defect**: the enum mixes *level of care* (INPATIENT_PSYCHIATRIC, PHP,
IOP) with *setting* (RESIDENTIAL) and *service type* (would be ACT, case management). Extending it
with community services would deepen that conflation rather than fix it.

And `UNKNOWN` is **unsafe as a clinical recommendation**: a recommendation of "unknown" is not a
recommendation. It is appropriate for `actual` and `availability`, where the source genuinely may
not know.

### Verdict

**RATIFIABLE WITH AMENDMENT.** Adopt the existing enum — the existing-owner reasoning holds and
the drift in #133 is a real defect — **but do not treat it as complete**:

1. Adopt for the five in-episode dimensions now. Sufficient there; proven above.
2. `UNKNOWN` is **not** a permitted value for `clinicalRecommendation`. Nullable, not `UNKNOWN`.
3. Continuity's next-level-of-care needs a **separate, wider vocabulary** covering community and
   post-acute services, or `NEXT_LEVEL_OF_CARE_STARTED` will systematically record falsehoods.
   Extending `LevelOfCare` is one option; a distinct `CareSettingOrService` vocabulary with a
   crosswalk is the other, and is cleaner given the ontology conflation. **This is an owner
   decision (OD-D), not something to settle by default.**
4. The crosswalk concept must exist before any external continuity source is ingested.

"It existed first" earns adoption for the episode dimensions. It does **not** earn the continuity
continuum.

---

## 6. LONG-GAP-08 — what must be true before Clarity may say "none observed"

Established in §1 that three states cannot carry eight distinctions. Required model:

**Coverage is declared per (source × event type × time window)** — not per source, and not as a
boolean. A declaration carries: the source, the event type it is authoritative for, the window it
covers, an `observedThroughAt` freshness timestamp, and the outcome of the most recent ingestion.

Derived source condition, evaluated per event type and window:

| Condition | Established by |
|---|---|
| `AUTHORITATIVE_AND_CURRENT` | Declaration exists for this event type and window; last ingestion succeeded; `observedThroughAt` ≥ window end |
| `AUTHORITATIVE_BUT_STALE` | Declaration exists; `observedThroughAt` < window end |
| `INGESTION_FAILED` | Last ingestion attempt failed or is incomplete |
| `UNAVAILABLE` | Source registered but not reachable/enabled for the window |
| `NOT_AUTHORITATIVE_FOR_EVENT_TYPE` | Registered, but no declaration for this event type |
| `NOT_REGISTERED` | No source at all |

**Clarity may say `NONE_OBSERVED_WITH_COMPLETE_COVERAGE` only when at least one source is
`AUTHORITATIVE_AND_CURRENT` for that exact event type and window, and no qualifying event
exists.** Every other condition yields `UNKNOWN`, carrying **why** — the distinction the current
single `UNKNOWN` destroys.

Two further requirements:

- **Qualifying event** must exclude `SUPERSEDED`, `REJECTED` and `QUARANTINED` `qualityState`
  values — defect **D-2**.
- A **late-arriving event must not rewrite a prior projection answer**: projections are evaluated
  as-of a time, using `receivedAt`, so "what did we report on day 15?" stays answerable.

This is a materially different schema from the one the reconciliation proposed for P-9, which is
why LONG-GAP-08 fails the bounded test.

---

## 7. LONG-GAP-10 — hardening the within-organization boundary

The decision is right and the evidence is solid. **The implementation cannot currently express
it**: `LongitudinalCareJourneyProjectionInputSchema` carries `patientToken`, `accessCaseIds`,
`inpatientEpisodeIds`, `careTransitionIds`, `continuityEventIds` — and **no `organizationId` and no
evaluation time.** The projection cannot state its own scope, so no downstream surface can inherit
it. The limitation is documented and structurally invisible.

### Permitted terminology — locked

| Term | Means | May Clarity use it today? |
|---|---|---|
| **Organization-scoped care journey** | Records held by this organization for this person token | **Yes** — the accurate default name |
| **Episode-of-care history** | Bounded records within one episode | **Yes** |
| **Known continuity** | Continuity events observed from declared sources, with coverage stated | **Yes**, only alongside coverage |
| **Longitudinal history** | Ambiguous — reads as person-complete | **Only** when qualified with the organization scope in the same visual unit |
| **Complete history** / "the patient's full record" | All care everywhere | **Never.** Prohibited outright |

### Required metadata — every API response and every surface

1. `organizationId` and a human-readable organization scope.
2. `evaluatedAt`.
3. **Coverage statement**: which record classes are included, and explicitly that records held by
   other organizations are **not** included and their existence is **unknown** — not absent.
4. Continuity blocks carry their per-source coverage condition (§6).
5. **Scope may not be stripped by omission.** Absence of a scope field must be a hard error in any
   consumer, not a default to "complete". The scope field is therefore **required**, not optional.

The negative case is the one to protect: a person may have three admissions at another
organization. Clarity must say *unknown*, never imply *none*. That is LSR-17 applied at the
identity boundary.

Cross-organization identity resolution remains **out of scope and unauthorized**.

---

## 8. Interrogating IA-002's preconditions

| ID | Invariant protected | Evidence that proves completion | Sufficient for Slice A? | Automated or documentary? |
|---|---|---|---|---|
| **C-1** LOC enum typing | LOC vocabulary is canonical and joinable; no private spellings | Contract types are `z.enum(LEVELS_OF_CARE)`; fixture re-coded; enum-sync test extended to the longitudinal fields | **Necessary but not sufficient** — §5 shows the enum is incomplete for continuity and `UNKNOWN` must be barred from clinical recommendation | **Automated** — the enum-sync test already exists and must cover the new fields |
| **C-2** destination-attempt extraction | Attempt history is not destroyed by an overwrite | `currentIntendedDestinationRef` removed from stored shape; a projection derives it; a test proves a new attempt does not mutate a prior one | Not needed for Slice A (Slice B) | **Automated** |
| **C-3** derived continuity coverage | A caller cannot license "none observed" | Completeness no longer a parameter; derived from declarations | Not needed for Slice A (Slice C). **And insufficient as written** — §6 requires six source conditions, not three | **Automated** |
| **C-5** rejection-form no-collapse tests | No-collapse is enforced, not merely unexercised | For each forbidden field, `expect(() => Schema.parse({...valid, causedBy:"x"})).toThrow()` | **Yes, required** | **Automated** |
| **C-6** schema-conformance tripwire | Refused objects cannot be added to Prisma | A test failing if any refused model **or column** name appears in `prisma/schema.prisma` | **Yes, required** | **Automated** |

### New preconditions this review adds

| ID | Requirement | Why |
|---|---|---|
| **C-7** | `deriveTransitionReadiness` must require all seven components; a missing component is `UNKNOWN`, never silently `READY`. Test the empty and partial cases | Defect **D-1** |
| **C-8** | Every projection must exclude `SUPERSEDED`, `REJECTED` and `QUARANTINED` events. Test each | Defect **D-2** |
| **C-9** | `UNKNOWN` is not a permitted `clinicalRecommendation` value | §5 |
| **C-10** | The longitudinal journey projection must carry required `organizationId` + `evaluatedAt`, and a consumer must fail on their absence | §7 |

### Do tenancy and correction need executable proof *before* the first migration?

**Partly — and the original phrasing was imprecise.** L2 tenancy tests need a table to run against,
so they cannot literally precede the migration that creates it. The honest sequencing is three
gates, not one:

1. **Before the migration** — C-5, C-6, C-7, C-8, C-9 (all contract-level, all runnable today) plus
   the *written* tenancy and correction test plan per object.
2. **In the same PR as the migration** — L2 tenancy and L2 correction/supersession behavior tests,
   green. The migration and its proofs land together or not at all.
3. **Before any API exposes the object** — L3 command envelope: authority, preconditions,
   idempotency, governed event, conflict behavior.

Documentary evidence is **not** sufficient at any of the three. Every gate is a test that runs in
CI.

**Conclusion: IA-002 is NOT ratifiable as written.** Its precondition list is incomplete (missing
C-7 through C-10), C-1 and C-3 are insufficient as specified, and its Slice A grant rests on
LONG-GAP-03, which fails independent re-testing.

---

## 9. Interrogating ADR-0026 as a persistence boundary

**Is Slice A the smallest coherent first slice? No.**

| Object | Independent of unresolved semantics? |
|---|---|
| `LongitudinalAuthorityPolicy` | **No.** §2 shows approval, delegation and revocation are unresolved and each changes its shape. Persisting it now means designing the meta-authority record before knowing what it must carry |
| `LevelOfCareRecommendation` | **No.** Depends on LOC vocabulary completeness (§5) and on whether `UNKNOWN` is a permitted recommendation. Independent of discharge plans, barriers, attempts, discharge and continuity — but not of its own vocabulary |
| `ClinicalDischargeReadinessDecision` | **Nearly.** Depends only on the authority mechanism plus a nullable `relatedLocRecommendationId`. Independent of everything else |

Per-object check against the owner's list:

| Property | Policy | LOC rec | Readiness |
|---|---|---|---|
| Tenancy | org + optional facility ✓ | org, child of Episode ✓ | org, child of Episode ✓ |
| Immutable historical meaning | ✓ versioned, never deleted | ✓ append-only | ✓ append-only |
| Effective vs recorded time | ✓ `effectiveAt`; **no recorded time** ✗ | ✓ both | ✓ both |
| Supersession | **✗ no revocation, no approval chain** | ✓ `supersedesRecommendationId` | ✓ `supersedesDecisionId` |
| Actor authority | **✗ layer 3 unresolved** | ✓ via policy | ✓ via policy |
| Source provenance | ✓ `policyRef` | ✓ evidence + criteria refs | ✓ evidence + criteria refs |
| Correction | **✗ unresolved (OD-C)** | ✓ | **✗ invalidate-vs-supersede unresolved** |
| Audit | house pattern ✓ | ✓ | ✓ |
| Rollback | clean ✓ | clean, lossy ✓ | clean, lossy ✓ |

**Amendment: narrow Slice A.** The smallest coherent first persistence slice is
**`ClinicalDischargeReadinessDecision` together with whatever minimum authority record it
requires** — and since the authority record is unresolved, **the honest conclusion is that no
persistence slice is ready**. `LevelOfCareRecommendation` should move to Slice A.2 behind the LOC
vocabulary amendment.

---

## 10. Classification and conclusions

| Decision | Classification | Amendment required |
|---|---|---|
| LONG-GAP-01 DischargePlan cardinality | **RATIFIABLE AS WRITTEN** | — |
| LONG-GAP-02 Destination-attempt identity | **RATIFIABLE AS WRITTEN** | — |
| LONG-GAP-03 Readiness authority | **NOT YET RATIFIABLE** | Decompose into 9 layers; resolve OD-A, OD-B, OD-C |
| LONG-GAP-04 LOC registry | **RATIFIABLE WITH AMENDMENT** | Adopt for in-episode dimensions; bar `UNKNOWN` from clinical recommendation; separate continuity vocabulary (OD-D) |
| LONG-GAP-05 Barrier taxonomy | **RATIFIABLE WITH AMENDMENT** | Platform-owned condition kinds; absorb hierarchy; ban party-grouped projections structurally |
| LONG-GAP-06 Core vs configurable | **RATIFIABLE WITH AMENDMENT** | Replace circular rule with semantic-necessity rule + decision tie-breaker |
| LONG-GAP-07 Actual-discharge command | **RATIFIABLE AS WRITTEN** | — |
| LONG-GAP-08 Continuity sources | **NOT YET RATIFIABLE** | Six source conditions; per-event-type scoping; freshness; exclude non-valid quality states |
| LONG-GAP-09 DISCHARGED → CLOSED | **RATIFIABLE AS WRITTEN** | — |
| LONG-GAP-10 Projection derivability | **RATIFIABLE WITH AMENDMENT** | Required `organizationId` + `evaluatedAt`; locked terminology; scope may not be omitted |
| Reconciliation P-1 … P-10 | **RATIFIABLE WITH AMENDMENT** | P-9 reshaped per §6; P-10 reshaped per §2 |
| "None of the four bounds blocks persistence" | **WITHDRAWN** | Replaced by a per-gap table |

### Can IA-002 be ratified as written?

**No.** Preconditions incomplete (C-7 … C-10 missing); C-1 and C-3 insufficient as specified;
Slice A rests on a gap that fails re-testing; the three-gate sequencing in §8 is absent.

### Can ADR-0026 be ratified as written?

**No.** Its three objects are not independently persistable. Ratifiable only if narrowed, and even
narrowed it waits on OD-A.

### Can the persistence boundary open?

**No.** It stays closed. IA-001 continues to govern.

### Smallest remaining owner decisions

1. **OD-A** — what must be true for a `LongitudinalAuthorityPolicy` to take effect (A1 / **A2
   recommended** / A3).
2. **OD-B** — does delegated or emergency authority exist?
3. **OD-C** — is an improperly authorized decision superseded, or invalidated and excluded from
   projections?
4. **OD-D** — does continuity's next-level-of-care extend `LevelOfCare`, or get a separate
   `CareSettingOrService` vocabulary with a crosswalk?

OD-A, OD-B and OD-C gate any persistence. OD-D gates Slice C and the LOC amendment.

### The exact next authorized engineering slice

**Slice 0.5 — Executable protection of the locked semantics.** Entirely within IA-001 §10; needs
no new authorization; can start immediately:

1. **C-7** — `deriveTransitionReadiness` requires all seven components; empty and partial inputs
   yield `UNKNOWN`. *(fixes D-1)*
2. **C-8** — all projections exclude `SUPERSEDED` / `REJECTED` / `QUARANTINED`. *(fixes D-2)*
3. **C-5** — every no-collapse assertion rewritten as a rejection assertion.
4. **C-6** — schema-conformance tripwire over refused model **and column** names.
5. **C-1 (part)** — LOC fields typed to the enum, fixture re-coded, enum-sync extended; **C-9**
   bars `UNKNOWN` from clinical recommendation.
6. **C-10** — journey projection carries required `organizationId` + `evaluatedAt`.
7. Negative test: no projection groups or ranks by `waitingOnPartyRef`, `responsibleRoleCode` or
   `assignedUserId`.

No Prisma. No migration. No command, API or UI. Every item is a contract, fixture, test or CI
change, and each closes a hole this review demonstrated rather than asserted.

## Honesty statement

This review changes no runtime behavior and touches no Prisma file. D-1 and D-2 were confirmed by
executing throwaway probes against the merged contract; both probes were deleted and the working
tree verified clean. Nothing here claims production readiness, HIPAA compliance, PHI readiness, or
approved clinical or legal rules. The four owner decisions are not answered here because the
repository cannot answer them; each is presented with its viable options and their consequences.
