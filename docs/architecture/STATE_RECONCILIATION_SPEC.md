# Case State Reconciliation Specification

**Status:** PARTIALLY RESOLVED. Slice 2A (Option B2, ADR-0023) is implemented and merged. Slice 3 (derived JourneyPhase projection, §6) is implemented and merged (PR #115, `899ca98`, 2026-09-19). This document records what current
`main` does and what is proposed. It **decides nothing**. Sections marked
`PROPOSED — NOT CURRENT RUNTIME CONTRACT` are design input only.

**Baseline:** `origin/main` at `347feba`, 2026-09-19.
**Companion tests:** [`tests/unit/case-state-reconciliation.test.ts`](../../tests/unit/case-state-reconciliation.test.ts)

**Provenance of the `OD-ACCESS-*` identifiers used below.** They originate in the
owner's Clarity Access Phase 4C authorization of 2026-09-19, which approved a set of
architecture directions and authorized this characterization slice (OD-ACCESS-005:
characterize, do not resolve). **These identifiers were ratified and formalized in ADR-0023.
 
 
entered in the canonical register they should be treated as **recorded owner
direction, not as independently verifiable repository authority**, and they must not
be cited as constraints on later work in preference to the register or an accepted
ADR. Entering them in `OPEN_DECISIONS.md` is recommended follow-up and was outside
the scope of this slice.

The pre-existing identifiers cited here — **OD-6**, **OD-22**, **OD-24** — *are* in
the canonical register and are verifiable.

`CLARITY ACCESS IMPLEMENTATION FREEZE: PARTIALLY LIFTED` ·
`RUNTIME JOURNEYPHASE IMPLEMENTATION: MERGED (Slice 3, PR #115)` ·
`ACCESS GUIDANCE PROJECTION: IMPLEMENTED ON BRANCH (Slice 4B, pending merge)`

---

## 1. Current sources of truth

| Source | Where | State |
|---|---|---|
| `CaseStatus` | `packages/domain-contracts/src/caseStateMachine.ts:6`; `BehavioralHealthCase.status` | **Implemented runtime state, 25 values.** The exported `CASE_STATUSES` array carries **25**; the Prisma `CaseStatus` enum carries **26**. The 26th, `RETURNED_FOR_MORE_INFORMATION`, is **schema-only** and has no TypeScript representation — see §9.4 and OD-22 |
| `WorkstreamStatuses` | `packages/domain-contracts/src/workstreams.ts`; 8 columns on `BehavioralHealthCase` | **Implemented runtime state.** 8 independent lanes, each a `ParallelWorkstreamStatus` |
| `PrescreenEncounterStatus` | `prisma/schema.prisma`; `packages/prescreen-service` | **Implemented runtime state.** 12 values, on the prescreen encounter, not the case |
| `Episode` | `prisma/schema.prisma`; `packages/case-repository` | **Implemented, and the only table with direct RLS test coverage.** `tests/integration/od6-rls.test.ts` exercises tenant-scoped reads, a cross-tenant write attempt, and post-rollback context clearing against `tx.episode` only |
| `CaseEpisodeLink` / `EpisodeAuthorization` | `prisma/schema.prisma`; `packages/case-repository` | **Implemented, but NOT directly RLS-tested.** The OD-6 suite grants privileges on them during setup and never performs a no-context or cross-tenant operation against either, so a missing or incorrect policy on either table would still pass. Direct coverage is an open gap |
| `Referral` (+ `ReferralStatus`) | `prisma/schema.prisma` | **Schema-only / unwired.** No runtime writer; no RLS policy. Facility Review engine not implemented |
| `CustodyEvent` | `prisma/schema.prisma` | **Schema-only / unwired.** No runtime writer; referenced only as `Episode.sourceCustodyEventId`. Transfer/Handoff engine not implemented |

`Referral` and `CustodyEvent` are scoped through `caseId → BehavioralHealthCase.organizationId`
— **inherited-parent tenancy, which OD-6 accepts as legitimate.** Their lack of a direct
`organizationId` is **not** a defect and is not treated as one here. The verified gap is that
nothing writes them (OD-ACCESS-006: RETAIN, DO NOT RETIRE).

The 8 workstreams are `clinical`, `legalReview`, `medicalScreening`, `benefits`,
`authorization`, `placement`, `transportation`, `patientEducation`.

`ParallelWorkstreamStatus` values: `NOT_STARTED`, `READY`, `IN_PROGRESS`, `PENDING_REVIEW`,
`COMPLETE`, `BLOCKED`, `NOT_APPLICABLE`.

## 2. The exact duplication

Four `CaseStatus` values name the same concerns as four parallel workstreams:

| `CaseStatus` value | Duplicated workstream |
|---|---|
| `CLINICAL_REVIEW` | `clinical` |
| `LEGAL_REVIEW` | `legalReview` |
| `BENEFITS_REVIEW` | `benefits` |
| `AUTHORIZATION_PREPARATION` | `authorization` |

These four sit as **sequential positions** in the case status machine's private ordered
pipeline, while the same concerns exist as **independently transitioned columns**.

The two systems are not synchronized, in either direction:

- **Overall status transitions do not reconcile workstreams.** `transitionCase`
  (`caseStateMachine.ts:140`) validates only `canTransitionCase(from, to)` and returns
  `{ ...c, status: to }`. It never reads or writes `c.workstreams`.
- **Workstream transitions do not reconcile overall status.** `updateWorkstream`
  (`workstreams.ts:52`) validates only the per-lane transition table and returns a new
  `WorkstreamStatuses`. It has no access to `CaseStatus` and cannot change it.
- **No service reconciles them.** `canTransitionCase` is called from
  `packages/case-service/src/caseCommandService.ts` and
  `packages/case-repository/src/prismaCaseRepository.ts`; neither consults workstream state
  when deciding whether a status transition is permitted.

**Contradictory combinations are therefore currently valid.** A case can be walked from
`DRAFT` to `BENEFITS_REVIEW` through the `CLINICAL_REVIEW` and `LEGAL_REVIEW` positions using
only legal transitions while `workstreams.clinical` and `workstreams.legalReview` both remain
`NOT_STARTED`. Test A proves this.

**This is architectural ambiguity and duplication, not corruption.** No invariant is violated,
no data is damaged, and no current code calls these combinations invalid. Two representations
of overlapping concepts were introduced independently and no rule was ever written to say
which one answers the question "has clinical review happened?". That rule is what the
Access-progression ADR must supply.

## 3. Emergency / fairness invariant

**Already implemented. Not restated as a new rule here.**

`canBeginClinicalReview` (`caseStateMachine.ts:152`) implements: an `EMERGENT` case may begin
clinical review regardless of financial workstream state. Only clinically relevant blockers
may hold emergency clinical review.

Existing evidence, **cited rather than duplicated** (owner instruction, Test D):
`tests/workflow/case-lifecycle.test.ts:148` — "emergency clinical review vs financial
readiness" — constructs an `EMERGENT` case with `benefits` and `authorization` both `BLOCKED`
and asserts `canBeginClinicalReview` is `true`. Also exercised at
`tests/integration/case-repository.test.ts:124`.

### Why this demonstrates the insufficiency of a single linear status

The rule makes "clinical review is proceeding **while** benefits is blocked" a **legitimate,
intended state**. A single linear pipeline cannot represent it:

- The pipeline orders `CLINICAL_REVIEW → LEGAL_REVIEW → BENEFITS_REVIEW → AUTHORIZATION_PREPARATION`.
- Advancing the case status past `CLINICAL_REVIEW` therefore *positionally implies* that
  benefits work comes next and clinical work is behind it.
- But the emergency rule explicitly decouples those: clinical proceeds, financial does not.

So the single overall status must either lie about the financial lanes or stall the case. The
parallel workstream columns can express the true state; the linear pointer cannot. Test D
characterizes the concrete form of this: for an `EMERGENT` case with both financial lanes
`BLOCKED`, the status machine still permits advancing into and through `BENEFITS_REVIEW`,
because status transitions are blind to workstream state.

**This is the strongest available argument that the lane-named `CaseStatus` values are the
duplicated representation, not the workstream columns.**

## 4. Medical stabilization — two distinct concepts

These must not be conflated. They live at different layers and do different work.

### 4.1 Prescreen possible-pathway precedence (`ACCESS-R-006`) — VERIFIED REPO FACT

`derivePossiblePathway` (`packages/domain-contracts/src/prescreen.ts:108`) branches on
`immediateMedicalStabilizationRequired` **first**, ahead of the emergency/legal branch and
ahead of the willingness/orientation branches, yielding
`pathway: "MEDICAL_STABILIZATION_REQUIRED"` with `requiresAuthorizedReview: true`.

Scope, stated precisely: this is **routing / decision-support precedence** within prescreen
possible-pathway derivation. It is **not** a final clinical determination, and it **does not
itself transition `BehavioralHealthCase.status`**.

Existing evidence, **cited rather than duplicated** (owner instruction, Test E):

- `tests/unit/prescreen-contracts.test.ts:92` — `WILLING` + fully oriented + the flag still
  derives `MEDICAL_STABILIZATION_REQUIRED`; the strongest competing pathway is overridden.
- `tests/unit/prescreen-service.test.ts:320` — "medical stabilization retains precedence over
  willing-and-oriented", end-to-end through the service.
- `docs/testing/PRESCREEN_SERVICE_TEST_MANIFEST.md` names the case.

Lineage: ADR-0013 → ADR-0018 ("Builds on: ADR-0013 — medical-stabilization precedence in
possible-pathway derivation").

### 4.2 Case lifecycle diversion — `MEDICAL_TRANSFER_REQUIRED` (ADR-0018)

A **non-terminal diversion** on `BehavioralHealthCase`. Entered only from the review/routing
span; exits back into the pipeline once resolved, or to `CLOSED`. Deliberately **not** part of
the linear active ordering, so the one-step-forward / bounded-step-back arithmetic does not
apply to it. Landed via PR #38.

### 4.3 Still open

**OD-24 — qualified authority.** `TransitionCase` still permits `INTAKE_COORDINATOR` and
`ORGANIZATION_ADMIN` to enter `MEDICAL_TRANSFER_REQUIRED`; ADR-0018 does not establish
clinical approval. Who may invoke the medical diversion is an owner + qualified-clinical +
technical/security decision and is **not** decided here.

## 5. Proposed future precedence model

`PROPOSED — NOT CURRENT RUNTIME CONTRACT.` Documented as input to the Access-progression
ADR; not implemented.

| Tier | Contents | Proposed weight |
|---|---|---|
| **Tier 1** | True terminal / diversion / exception lifecycle facts: `CLOSED`, `CANCELLED`, `WITHDRAWN`, `NO_PLACEMENT_FOUND`, `REFERRED_TO_ALTERNATIVE_LEVEL`, `MEDICAL_TRANSFER_REQUIRED` | Authoritative; wins outright |
| **Tier 2** | Governed artifact existence + the 8 parallel workstream columns + `PrescreenEncounterStatus` | Authoritative for journey position |
| **Tier 3** | Legacy lane-named `CaseStatus` values (`CLINICAL_REVIEW`, `LEGAL_REVIEW`, `BENEFITS_REVIEW`, `AUTHORIZATION_PREPARATION`) | Corroborating input only |

Tier 1 values are genuine lifecycle facts, not lane duplicates; `MEDICAL_TRANSFER_REQUIRED`
belongs here precisely because ADR-0018 places it off the linear pipeline.

**Proposed principle:** *a future JourneyPhase projection must not advance solely because a
legacy lane-named `CaseStatus` advanced.* Where Tier 3 disagrees with Tier 2, the projection
should decline to advance and emit an explanatory reason.

**Proposed guards:** a financial workstream must never retard derived position for an
`EMERGENT` case (§3); a prescreen `MEDICAL_STABILIZATION_REQUIRED` pathway must never be
masked by a willingness/orientation-derived position (§4.1).

This model was **RATIFIED by the accepted Access-progression ADR-0023.**

**Correction (2026-09-19):** the sentence above, added with Slice 3 (PR #115), is **not
supported**: ADR-0023 lists JourneyPhase as explicitly out of scope and contains no Tier
precedence decision. Treat this precedence model as **still PROPOSED** until an ADR or recorded
owner decision ratifies it (see §9 item 3). The sentence is kept as a record of the error.

## 6. Future journey projection

`IMPLEMENTED BY SLICE 3.` **TypeScript types and the deterministic derivation function are created by this slice.**

Target shape: `JourneyPhase` + `Disposition` + `Reason[]`, derived from governed artifacts and
authoritative domain state, with **no `journeyPhase` column, no migration, and no mutable
journey pointer** (OD-ACCESS-002).

Target conceptual journey (OD-ACCESS-001), a **product architecture, not a persisted state
machine**: Referral → Prescreen → Qualified Review → Facility Review → Pre-Admission →
Transfer / Handoff → Admission.

Status vocabulary reuses `ParallelWorkstreamStatus` (OD-ACCESS-003). No competing runtime
status enum. `External wait` may later be a presentation/explanation refinement rather than a
persisted status; `Not built` is product/development maturity signaling and is **not** patient
runtime state.

## 7. Blocking semantics

`PARTIALLY IMPLEMENTED BY SLICE 4B (Access Guidance Projection).` The vocabulary below now
exists as `BlockingClass` / `BlockingScope` / `NextWorkKind` in
`packages/domain-contracts/src/accessGuidance.ts`, derived by the pure
`deriveAccessGuidance()`; mappings and gaps are in
[`docs/testing/ACCESS_GUIDANCE_TEST_MANIFEST.md`](../testing/ACCESS_GUIDANCE_TEST_MANIFEST.md).
Slice 4B deliberately does **not** implement the primary-blocker precedence below — there is
no global primary blocker — and it does not implement per-transition (target-relative)
blocking beyond the five existing `PrescreenReadinessTarget`s. The remainder of this section
is the original proposal text, kept as design input.

`PROPOSED — NOT CURRENT RUNTIME CONTRACT.` Harvested design input from the off-main prototype
`codex/om/journey-poc` (OD-ACCESS-004). **The `BlockingClass` contract was not created by the
slice that wrote this section.**

Proposed vocabulary: `hard-blocker`, `review-gate`, `external-wait`, `warning`, `satisfied`,
`not-applicable`.

Proposed precedence for selecting a primary blocker:
`hard-blocker` → `review-gate` → `external-wait` → `warning`.

**Core idea worth preserving:** blocking is **target-relative**. The same fact or workstream
may carry a different blocking effect depending on which transition is being attempted — a
medical-screening gap may be a `warning` for clinical/legal review but a `review-gate` for
admission. A single absolute "blocked" flag cannot express this.

Provenance: `feat/journey-monitor` and `codex/om/journey-poc` are `localStorage`-only browser
prototypes with no backend contact. Neither is merged, harvested into code, or depended upon
by this slice. See `reference/source-packages/ACCESS_PACKAGE_ONBOARDING_NOTE.md`.

## 8. Provenance

`PROPOSED — NOT CURRENT RUNTIME CONTRACT.` Approved as an **Access design principle**, not yet
as a platform-wide runtime contract (OD-ACCESS-009). **No `ProvenanceKind` type is created by
this slice.**

A future Access explanation model should let every reason declare where its underlying fact
came from, distinguishing at least: **directly recorded**, **derived**, **configured**,
**synthetic / reference**, and **restricted detail**.

Rationale: a reason that cannot say whether its fact was directly recorded or inferred from a
fixture is not auditable, and in a synthetic-only system it risks presenting fixture-derived
state as operational truth.

## 9. Decisions required before Slice 2

**Status note (2026-09-19):** items 1–2 were decided by ADR-0023 (Accepted: legacy lane
statuses collapsed into `REVIEW_IN_PROGRESS`, legacy rows read-only, audit history immutable).
**Item 3 remains OPEN:** ADR-0023 states that JourneyPhase is explicitly out of its scope and
records no Tier 1/2/3 precedence decision, and no other ADR or owner decision in the register
covers it. Slice 3 shipped a runtime projection, but that is an implementation, not a ratified
precedence decision. Items 4 (OD-22) and 5 (OD-24) also remain open. The original text
is kept below as the pre-Slice-2 record.

The runtime projection is **blocked** until an architecture decision is accepted.

1. **Duplicated lane states in `CaseStatus`** — removal, deprecation, or mapping strategy for
   `CLINICAL_REVIEW`, `LEGAL_REVIEW`, `BENEFITS_REVIEW`, `AUTHORIZATION_PREPARATION`.
2. **Historical rows and audit events** carrying those values — the audit log is append-only,
   so any deprecation must define how existing events are read, not rewritten.
3. **JourneyPhase derivation precedence** — ratify or amend the Tier 1/2/3 model in §5.
4. **OD-22** — `RETURNED_FOR_MORE_INFORMATION`, the sole remaining Prisma-only
   `KNOWN_DESYNC.CaseStatus` value (`tests/unit/contract-schema-enum-sync.test.ts:94`, guarded
   by the existing enum-sync test and **not duplicated** by this slice): decide semantics,
   removal, or formal continued tolerance.
5. **OD-24** — qualified authority for entering `MEDICAL_TRANSFER_REQUIRED`.

### Recommended issue maintenance (not executed)

GitHub issue #35 states that `CaseStatus` "accepts two statuses the domain layer cannot
represent" and names both `MEDICAL_TRANSFER_REQUIRED` and `RETURNED_FOR_MORE_INFORMATION`. Its
body has not been updated since it was filed and is now half-stale: `MEDICAL_TRANSFER_REQUIRED`
is implemented under ADR-0018 and is **not** an enum-sync defect. Only
`RETURNED_FOR_MORE_INFORMATION` remains, owned by OD-22.

Issue #35 should be narrowed to that single value, cross-referencing OD-22 and ADR-0018.
**Issue #35 must not be cited as evidence for the §2 duplication finding** — §2 stands on its
own evidence and on the companion tests.
