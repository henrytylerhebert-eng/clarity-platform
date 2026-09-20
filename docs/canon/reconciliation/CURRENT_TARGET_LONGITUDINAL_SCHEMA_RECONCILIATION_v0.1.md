# Current → Target Longitudinal Schema Reconciliation v0.1

**Date:** 2026-09-20
**Required by:** IA-001 §5.3 — every proposed persistence object must state its current owner,
the gap, why derivation is insufficient, tenant boundary, correction/supersession behavior,
authorization owner, migration effect, and rollback plan.
**Inputs:** [Longitudinal Gap Closure v0.1](../gap-closure/LONGITUDINAL_GAP_CLOSURE_v0.1.md)
(6 LOCKED, 4 BOUNDED) and
[Verification Matrix Conformance Baseline v0.1](../conformance/VERIFICATION_MATRIX_CONFORMANCE_BASELINE_v0.1.md).
**Audited against:** `main` at `6b1d91f`.
**Prisma:** untouched. This document proposes; it does not authorize. IA-002 authorizes.

## Reconciliation summary

**9 objects proposed for persistence. 7 objects explicitly refused.**

| # | Proposed object | Kind | Gap | Blocking prerequisite |
|---|---|---|---|---|
| P-1 | `DischargePlan` + `DischargePlanVersion` | entity + append-only version | 01 | — |
| P-2 | `DestinationAttempt` | append-only entity | 02 | C-2 |
| P-3 | `CareTransition` | entity | 02, 05 | C-2 |
| P-4 | `TransitionBarrier` | entity with lifecycle | 05 | — |
| P-5 | `BarrierCategory` | facility configuration | 05 | — |
| P-6 | `LevelOfCareRecommendation` | append-only decision | 04, 06 | C-1 |
| P-7 | `ClinicalDischargeReadinessDecision` | append-only decision | 03 | — |
| P-8 | `ActualDischargeFact` | append-only fact | 07, 09 | — |
| P-9 | `ContinuityEvent` + `ContinuitySource` + `ContinuitySourceCoverage` | event + configuration | 08 | C-3 |
| P-10 | `LongitudinalAuthorityPolicy` | versioned configuration | 03, 07 | — |

**Refused — must never be persisted:** `PendingDischarge`, `TransitionReadiness`,
`LongitudinalCareJourney`, `RecoveryProfile`, `EnvironmentSupportProfile`, `CareIntensityProfile`,
and any monolithic `Continuity` entity. Each is refused below with its reason.

## Prerequisites that must land before any migration

| ID | Correction | Why it blocks | Authorized under |
|---|---|---|---|
| **C-1** | LOC fields typed to `z.enum(LEVELS_OF_CARE)`; fixture re-coded | Persisting an open string freezes the private vocabulary the slice invented into the database, where it is far more expensive to fix | IA-001 §10 (contracts, fixtures, tests) |
| **C-2** | `currentIntendedDestinationRef` becomes a projection over `DestinationAttempt` | Persisting it as stored state builds in the overwrite that destroys attempt history | same |
| **C-3** | `sourceCoverageCompleteness` derived from coverage declarations, not caller-supplied | A caller-supplied completeness flag lets any caller license "none observed", defeating LSR-17 at the storage boundary | same |
| **C-5** | No-collapse tests rewritten as rejection assertions (conformance F-1) | The schemas enforce no-collapse via `.strict()`; the tests only assert the fixture lacked the field, so schema drift would pass silently | same |
| **C-6** | Schema-conformance tripwire failing if a refused model name appears in `prisma/schema.prisma` (conformance F-3) | Nothing currently prevents a refused object from being added; this is the only automated defense of the refusals below | same |

**C-5 and C-6 are not optional.** They come from the conformance audit, not from a gap, and they
are the executable protections for exactly the invariants persistence would put at risk. IA-002
should be conditioned on all five.

---

## P-1 — `DischargePlan` + `DischargePlanVersion`

- **Current owner.** None. No repository object models a discharge plan. Nearest neighbours are
  `DocumentationGap` (Episode-owned) and the document-versioning pattern in `document-service`,
  which is the structural precedent to copy.
- **Gap.** LONG-GAP-01 — **LOCKED**: one logical plan per Episode, append-only versions, at most
  one non-terminal version.
- **Why derivation is insufficient.** A discharge plan is **authored intent**, not a function of
  other records. Nothing in the repository can reconstruct a target date, an intended destination
  or a medication plan — a human decided them. LSR-03 already rules it a true target entity.
- **Tenant boundary.** `organizationId` on both tables; every read and write predicate
  tenant-scoped; a cross-tenant miss is non-revealing (existing `tenant-isolation.test.ts`
  pattern).
- **Correction / supersession.** Versions are append-only. A correction creates a superseding
  version carrying a required reason code distinguishing correction from clinical revision. No
  version is mutated or deleted.
- **Authorization owner.** Facility-configured discharge-planning role, via the LONG-GAP-03 policy
  mechanism with its own action code. Not shared with clinical readiness authority.
- **Migration effect.** Two new tables. No existing table altered. `Episode` gains an inverse
  relation only. Unique constraint: at most one non-terminal version per plan.
- **Rollback plan.** Drop both tables. No existing data depends on them; no column is added to an
  existing table, so rollback is a clean drop.

## P-2 — `DestinationAttempt`

- **Current owner.** None. `CareTransitionSliceSchema.currentIntendedDestinationRef` is the
  nearest thing and it is **the problem**, not the owner: it is current-valued, so each update
  discards the prior attempt.
- **Gap.** LONG-GAP-02 — **LOCKED**: attempts are separate append-only records.
- **Why derivation is insufficient.** An attempt and its outcome are **observed events**. No
  combination of existing records can reconstruct that a facility was contacted on day 6 and
  declined on day 7 — the information exists nowhere else. This is the clearest
  derivation-insufficiency case in the set.
- **Tenant boundary.** `organizationId`; scoped to the owning `CareTransition`. **Note:** the
  destination is frequently another organization, so the *referenced* destination is an external
  reference, never a cross-tenant join. Reading an attempt must never expose the other
  organization's records.
- **Correction / supersession.** Append-only; corrected by a superseding attempt with a reason
  code. Outcomes are never edited in place.
- **Authorization owner.** Placement / transport coordination roles. **Must not require clinical
  authority** — recording an attempt is operational work.
- **Migration effect.** One new table, child of `CareTransition`. Depends on C-2 landing first,
  otherwise the contract still models destination as stored current state and the table would be
  written against a shape about to change.
- **Rollback plan.** Drop the table and restore `currentIntendedDestinationRef` as stored state —
  which loses attempt history, so rollback is **lossy**. Stated plainly: once attempts are
  recorded, rolling back this object discards operational history.

## P-3 — `CareTransition`

- **Current owner.** None. `CareTransitionSliceSchema` is contract-only and explicitly labelled a
  candidate slice.
- **Gap.** LONG-GAP-02 (destination attempts) and LONG-GAP-05 (barriers attach to it) — both
  resolved.
- **Why derivation is insufficient.** The transition has its own lifecycle
  (`PROPOSED → PREPARING → READY → EXECUTED`), its own identity, and its own target date. State
  advanced by human action is not derivable.
- **Tenant boundary.** `organizationId`; child of `Episode`; all predicates tenant-scoped.
- **Correction / supersession.** `CANCELLED` and `SUPERSEDED` already in the contracted lifecycle.
  A transition is never deleted.
- **Authorization owner.** Placement / transport coordination, facility-configured.
- **Migration effect.** One new table. `currentIntendedDestinationRef` must **not** be a column —
  it becomes a projection over P-2. IA-002 should state that explicitly, because carrying it as a
  column is the obvious and wrong implementation.
- **Rollback plan.** Drop the table; drop P-2 with it (child). Lossy for the same reason as P-2.

## P-4 — `TransitionBarrier`

- **Current owner.** None. `TransitionBarrierSchema` is contract-only. `DocumentationGap` is a
  narrower Episode-owned precedent for "something is missing".
- **Gap.** LONG-GAP-05 — **BOUNDED**: category configurable, non-blame invariants locked. The
  bound affects rows, not shape.
- **Why derivation is insufficient.** LSR-04 rules barrier identity, lifecycle, provenance,
  responsibility and resolution history a true entity. Barrier **age** is derived and must remain
  so (already proven); the barrier itself is not.
- **Tenant boundary.** `organizationId`; child of `Episode` and `DischargePlan`, optionally of
  `CareTransition`.
- **Correction / supersession.** `SUPERSEDED` and `REOPENED` already contracted;
  `RESOLVED → REOPENED` permitted because barriers recur. Miscategorization is corrected by
  supersession.
- **Authorization owner.** Facility operations. **Must not require clinical authority.**
- **Migration effect.** One new table plus a reference to P-5. **No column may express causation**
  — `causedBy`, `faultParty`, `primaryBarrier` and equivalents are prohibited by LSR-18, and
  C-6's tripwire should cover column names as well as model names.
- **Rollback plan.** Drop the table. Lossy for barrier history.

## P-5 — `BarrierCategory`

- **Current owner.** None.
- **Gap.** LONG-GAP-05 — BOUNDED.
- **Why derivation is insufficient.** Configuration is authored, not derived.
- **Tenant boundary.** `organizationId`, optionally `facilityId`.
- **Correction / supersession.** Versioned by effective time. **A category rename must not rewrite
  historical barriers** — historical rows keep the category as it was understood when recorded.
- **Authorization owner.** Facility operations leadership.
- **Migration effect.** One small configuration table.
- **Rollback plan.** Drop; barriers fall back to an uncontrolled `categoryCode` string. Clean.

## P-6 — `LevelOfCareRecommendation`

- **Current owner.** **Partially owned already.** The *vocabulary* has an owner —
  `enum LevelOfCare` (`prisma/schema.prisma:94`), mirrored in `LEVELS_OF_CARE` and enum-sync
  tested. The *recommendation record* has none.
- **Gap.** LONG-GAP-04 — **LOCKED** (adopt the existing enum); LONG-GAP-06 — BOUNDED (core vs
  configurable observations feeding it).
- **Why derivation is insufficient.** LSR-06 requires append-only clinical decisions. A
  recommendation is a human clinical judgment with rationale, evidence and criteria; it cannot be
  computed.
- **Tenant boundary.** `organizationId`; child of `Episode`.
- **Correction / supersession.** Append-only with `supersedesRecommendationId` (already
  contracted, and the only supersession field the merged slice exercises). Prior recommendations
  stay queryable so "what was recommended on day 6?" remains answerable.
- **Authorization owner.** Facility-configured via `RECORD_LEVEL_OF_CARE_RECOMMENDATION`.
- **Migration effect.** One new table. **`recommendedLevelCode` must be the `LevelOfCare` enum
  type, not text** — this is C-1 and it is the difference between joining to authorization and
  benefits data and not.
- **Rollback plan.** Drop the table. The enum is untouched (it predates this work), so no existing
  capability regresses.

## P-7 — `ClinicalDischargeReadinessDecision`

- **Current owner.** None.
- **Gap.** LONG-GAP-03 — **BOUNDED**: authority is facility-configured, Clarity supplies no
  default, absent policy fails closed. The bound does not affect the stored shape.
- **Why derivation is insufficient.** LSR-08 is explicit: readiness is a qualified-human decision,
  never a computed boolean. This is the single most important non-derivation in the model —
  deriving it would have Clarity making a clinical determination.
- **Tenant boundary.** `organizationId`; child of `Episode`.
- **Correction / supersession.** Append-only with `supersedesDecisionId`. A superseding decision
  requires authority under the policy effective at **its own** effective time. A decision made
  under a policy later found invalid is superseded with a reason, **never retroactively voided**.
- **Authorization owner.** Facility medical staff, expressed as a `LongitudinalAuthorityPolicy`
  (P-10). **Who may edit that policy is itself unanswered** and must be settled before the policy
  is writable — the one genuinely open item in this reconciliation.
- **Migration effect.** One new table, plus a `policyRef` column recording the authorizing policy
  so the authority basis is reconstructible after the policy changes.
- **Rollback plan.** Drop the table. Lossy — clinical decision history.

## P-8 — `ActualDischargeFact`

- **Current owner.** None. `EpisodeStatus.DISCHARGED` exists but is a coarse lifecycle marker: it
  carries no effective time, no disposition, no source and no correction path.
- **Gap.** LONG-GAP-07 — **LOCKED** (command shape), BOUNDED (disposition vocabulary);
  LONG-GAP-09 — LOCKED.
- **Why derivation is insufficient.** LSR-11 forbids inferring discharge from target date, payer
  end, vacancy, readiness or transport. Six inference paths are explicitly closed, which leaves
  exactly one legitimate source: a governed human-recorded fact.
- **Tenant boundary.** `organizationId`; child of `Episode`.
- **Correction / supersession.** A correction is a **new fact** superseding the prior one with a
  required reason. Retraction is supersession with a retraction reason, never a delete. Unique
  constraint: at most one unsuperseded fact per episode.
- **Authorization owner.** Facility-configured `RECORD_ACTUAL_DISCHARGE`. **Distinct from clinical
  readiness authority** — recording that discharge occurred is not deciding it should. IA-002
  should require they not default to the same policy row.
- **Migration effect.** One new table. **`EpisodeStatus` gains no member** — no
  `PENDING_DISCHARGE`, which the existing enum-sync test would catch anyway.
- **Rollback plan.** Drop the table; `derivePendingDischarge` returns `PENDING` indefinitely for
  discharged episodes, which is wrong but safe (it over-reports pending rather than inventing a
  discharge). Rollback is lossy for discharge times.

## P-9 — `ContinuityEvent` + `ContinuitySource` + `ContinuitySourceCoverage`

- **Current owner.** None for continuity. `IopSourceIntegration` is the house pattern for a
  registered, tenant-scoped, program-bound source and should be the structural model.
- **Gap.** LONG-GAP-08 — **BOUNDED**: which real integrations exist is gated on OD-5 and OD-2. The
  bound affects rows, not shape.
- **Why derivation is insufficient.** Continuity events are **observations from outside** the
  episode. Nothing internal can derive that a patient attended follow-up or visited an ED.
- **Tenant boundary.** `organizationId` on all three. **This is the most delicate boundary in the
  set**: continuity data concerns a person who may be receiving care elsewhere, and LONG-GAP-10
  locked that no cross-organization journey exists. A continuity event is scoped to the recording
  organization and must never become a cross-tenant join.
- **Correction / supersession.** `qualityState` already carries `CORRECTED` and `SUPERSEDED`.
  Coverage declarations are versioned by effective time; **narrowing coverage retroactively flips
  past "none observed" answers to "unknown"**, which is correct and must be visible.
- **Authorization owner.** Organizational data governance. **Declaring coverage complete is
  consequential** — it converts silence into "none observed" — so it needs its own authority and
  its own audit trail, separate from event ingestion.
- **Migration effect.** Three new tables. **No monolithic `Continuity` entity and no continuity
  score column** — both prohibited.
- **Rollback plan.** Drop all three. Projections return `UNKNOWN` everywhere, which is the correct
  fail-closed degradation. Cleanest rollback in the set.

## P-10 — `LongitudinalAuthorityPolicy`

- **Current owner.** None persisted. The contract exists (`longitudinal.ts:364`) and the evaluator
  is proven pure at L1.
- **Gap.** LONG-GAP-03 and LONG-GAP-07 — both resolved as to mechanism.
- **Why derivation is insufficient.** Authority is **declared**, not computed. Deriving it from
  role names would be Clarity asserting a licensure rule (Constitution §3).
- **Tenant boundary.** `organizationId`, optionally `facilityId`.
- **Correction / supersession.** Versioned by `effectiveAt`. Evaluation uses the policy effective
  at the *decision's* effective time, never the current policy. Policies are never deleted.
- **Authorization owner.** **Unresolved — the one genuinely open item.** Who may write the policy
  that decides who may decide is a meta-authority question. Candidate: `ORGANIZATION_ADMIN` with a
  mandatory audit event and a named clinical approver. **IA-002 must settle this before the policy
  table is writable**; until then it may be seeded read-only.
- **Migration effect.** One configuration table. Blocks P-7 and P-8, which fail closed without it.
- **Rollback plan.** Drop; P-7 and P-8 fail closed and become unwritable. Safe.

---

## Refused objects

Each of the following is **PROHIBITED**, not merely deferred. The C-6 tripwire is the automated
defense; this section is the reason.

| Object | Why refused |
|---|---|
| `PendingDischarge` (status or column) | LSR-09, IA-001 §10. Derived from readiness + absence of discharge fact, proven at L1. Persisting it creates a second source of truth that can disagree with its own inputs. |
| `TransitionReadiness` (master status) | LSR-10, IA-001 §10. Derived from seven independent components. A single stored flag is exactly the collapse the rule forbids — it would let "READY" mean different things in different facilities. |
| `LongitudinalCareJourney` (parent aggregate) | LSR-02, IA-001 §10. Derivation is demonstrated to work, so LSR-02's precondition for a durable aggregate is unmet. |
| `RecoveryProfile`, `EnvironmentSupportProfile`, `CareIntensityProfile` | Semantic Lock §2. Derived summaries of independently governed observations. Persisting them means a corrected observation leaves a stale profile. |
| Monolithic `Continuity` entity | LSR-12, IA-001 §10. Continuity is typed events plus projections. |
| Any universal score column | LSR-15. `grep -in "score" prisma/*.prisma` currently returns **zero hits** across the whole schema. That is a property worth keeping and worth testing. |

## Cross-cutting requirements for every proposed object

1. **Tenancy in every predicate.** A record id is never authorization; cross-tenant misses are
   non-revealing. The conformance baseline found longitudinal has **no** tenancy evidence because
   it has no repository — so every object above needs L2 tenant-isolation tests before IA-002
   closes, not after.
2. **Append-only audit** on every mutation, with the restricted-identifier guard. Metadata carries
   hashes and field names, never source text or raw filenames.
3. **One Prisma package.** All of this lands in `packages/case-repository` behind gateway
   adapters. No service imports `@prisma/client`.
4. **Command pattern.** Strict Zod envelope → role policy → one transaction (tenant-scoped reads,
   state machine on the fresh row, conditional versioned UPDATE, atomic audit event, idempotency
   record). Idempotency fingerprint excludes `occurredAt` (ADR-0014 §5).
5. **Correction/supersession proven at L2** for each object. The conformance baseline found
   longitudinal supersession is asserted only about a fixture, never exercised as behavior. That
   must change before persistence, not as a follow-up.
6. **Effective time and recorded time are separate columns** everywhere. Never derive one from the
   other.

## What this reconciliation does NOT do

It does not authorize anything. It proposes 9 objects and refuses 7, states the eight IA-001 §5.3
facts for each proposal, and names five prerequisite corrections. **IA-002 is the authorization**,
and per IA-001 §5.4 each persistence boundary additionally requires its own ADR. No Prisma file
was touched in producing this document.
