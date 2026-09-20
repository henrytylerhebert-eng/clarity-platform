# Clarity Canon Reconstruction Pass 01 v0.1

**Date:** 2026-09-20  
**Purpose:** Reconstruct the major UX/UI, semantic, longitudinal, governed-architecture, and agent-operating decisions made across the Clarity project conversations of September 18–20, 2026; preserve the decision trajectory; reconcile contradictions; identify refinements and superseded ideas; and isolate only the genuinely open questions.

## Source-completeness note

This is a **decision-level reconstruction**, not yet a byte-for-byte transcript archive. The accessible project context and uploaded conversation artifacts provide strong coverage of the major decisions, especially the Access reconciliation, Tree 4/Tree 5 handoff, longitudinal reconciliation, governed operational architecture package, and Work/History/Explore model. Full raw exports of every major chat should still be preserved under a future `sources/` directory before calling the archive lossless.

## Status vocabulary

- **LOCKED** — explicitly accepted or later work depends on it as canonical.
- **REFINED** — earlier direction remains valid but was made materially more precise.
- **SUPERSEDED** — an earlier formulation should no longer guide implementation.
- **OPEN** — still requires a product/domain/implementation decision.
- **CURRENT-STATE FACT** — describes observed repository/UI reality at the time of inspection; not automatically a target decision.

---

# 1. Major thread trajectory — Organize UX Stabilization Tree

## 1.1 Trigger: governed backend, unusable product shell

The immediate UX problem was not lack of backend rigor. The application had accumulated governed Access behavior while Crisis Ops still presented a flat prototype shell:

- roughly 19 peer-level destinations;
- multiple simultaneous navigation systems;
- demo persona controls visually adjacent to verified identity;
- localStorage prototype surfaces beside governed API-backed surfaces;
- developer-facing language exposed to operators;
- no strong `Case -> where am I -> what matters -> what next` operating model.

### Initial stabilization direction

The first lightweight correction was approximately:

`Cases -> Case -> Current status -> Work needing attention -> Details`

with a reduced navigation proposal such as:

`Home | Cases | Intake | Review | Placement | More`

and with `Access Snapshot` reframed as a human-facing Case status/overview surface.

**Status:** **REFINED.** This was the correct usability diagnosis, but it was not the final information architecture.

## 1.2 UX re-foundation expanded beyond a light navigation cleanup

The work then moved into a tree-based UX/UI re-foundation rather than merely restyling the existing shell.

Canonical hierarchy emerging from that work:

`Platform -> Module -> Workspace -> Object -> View -> Action`

The current Crisis Ops structure was found to violate this because React components had effectively become “workspaces” regardless of user job or object scope.

**Status:** **LOCKED.** This hierarchy remains the correct conceptual grammar for the experience.

## 1.3 Tree 0 — operational meaning and trust before detail

Recovered principles:

- operational meaning precedes raw implementation detail;
- trust is a UX property;
- governed and prototype state must not be visually indistinguishable;
- backend/internal enums and IDs should not leak directly into ordinary operator language.

**Status:** **LOCKED.** Later semantic and epistemic work strengthens this rather than replacing it.

## 1.4 Tree 1 — identity, role, visibility, authority

The UX audit exposed the conflict between backend JWT authority and frontend demo-role visibility.

The later authority model made the distinction explicit:

`identity != role != visibility != authority`

and further decomposed operational authority into:

`SEE / DO / REVIEW / DECIDE / OWN`

A user receives a mutation control only where DO or DECIDE is granted; visibility alone yields a view.

**Status:** **LOCKED.** This is both a UX and authorization invariant.

## 1.5 Tree 2 — module/workspace/object structure

The platform-level module split was broadly valid:

- Crisis Ops
- Operating Assurance
- Revenue Operations

But Crisis Ops itself failed to implement a real `Workspace -> Object -> Object View` model.

Key refinement:

- Cases is a real operational workspace.
- Guided Intake is not a peer workspace by default; it is principally Case-scoped work.
- Access Snapshot is not a workspace; it is a read-model-backed Case view.
- Packet, evidence, clinical, legal, coverage/authorization, placement/handoff, etc. should be understood relative to the Case and role/job rather than as 19 permanent navigation peers.

**Status:** **LOCKED as information architecture.** Exact routes and labels remain implementation details.

## 1.6 Tree 3 — structural constraints

The audit separated change types:

- presentation-only corrections;
- frontend structural work;
- API dependencies;
- true domain decisions.

Important observed current-state facts at the time:

- Crisis Ops navigation was local React state rather than real routable navigation;
- demo roles were not authentication;
- prototype and governed screens looked alike;
- Access Snapshot established a useful read-model pattern;
- a governed Case Queue required backend support rather than UI fakery.

**Status:** **CURRENT-STATE FACT / migration input**, not permanent product doctrine.

## 1.7 Tree 4 — global shell and integrated flow

`4.10 v0.2` failed because it was still primarily a state gallery.

`4.10 v0.3` corrected this by adding deterministic/clickable integrated flows, workspace/object transitions, mobile selector semantics, skip-to-main/global navigation structure, and six proof flows:

1. Cases -> Case -> Clinical -> Back to Cases
2. Clinical Review -> Case/Clinical -> Complete -> Return
3. Case -> Assurance Finding -> Return to Case
4. Case -> Facility change -> Case invalidated -> Cases in new scope
5. Case -> Revenue Operations -> remembered Crisis Ops Case context
6. Session expired -> Sign in -> revalidated Case context

Result:

**Tree 4 = LOCKED + VISUALLY PROVEN**

Important limitation preserved in the source: this was a **visual architecture gate**, not proof of production backend/security compatibility, real-user usability, or manual assistive-technology conformance.

**Status:** **LOCKED**, with implementation/QA verification still required.

## 1.8 Tree 5 — Crisis Ops experience begins

Tree 5.0 was opened as the **Crisis Ops Experience Constitution** and explicitly **inherits Tree 4** rather than redesigning the shell.

Tree 5.1 asks:

> What information does an operator need to scan across Cases to know which Case deserves attention and why, before opening it?

The intended Case-centered operating model continues to emphasize:

- current position/state;
- attention;
- next work;
- context;
- evidence/reasoning on demand rather than debugger-first presentation.

**Status:** **ACTIVE / not complete.** Tree 5 must consume the reconciled semantics rather than invent them.

---

# 2. Major thread trajectory — Access Reconciliation / AI Development Artifacts

## 2.1 The critical repo finding: “two systems wearing one name”

The Access reconciliation showed that the usability problem was deeper than navigation:

- the localStorage Crisis Ops prototype and the governed backend were largely disconnected;
- the backend already contained parallel workstreams;
- `CaseStatus` also encoded sequential lane-like review states;
- the Prescreen engine existed with governed endpoints but had no real UI consumer;
- several prototype screens duplicated or fabricated domains already represented by governed services.

**Status:** **CURRENT-STATE FACT at the time of inspection.** It explains the migration problem but must be rechecked against current `main` before implementation.

## 2.2 Seven-stage Access journey

The reconciled Access journey became:

1. Referral
2. Prescreen
3. Qualified Review
4. Facility Review
5. Pre-Admission
6. Transfer / Handoff
7. Admitted

The decisive semantic rule:

> phase is where the Case has reached, based on the furthest governed artifact; parallel lanes are an overlay.

**Status:** **LOCKED.**

## 2.3 Phase, lane, disposition

The reconciliation corrected overloaded “status” semantics:

- **Phase** = where the Case has reached.
- **Lane/workstream state** = what parallel work is happening or outstanding.
- **Disposition** = whether progression is on track, blocked, diverted, exceptional, or closed, with reasons.

A lane may be `BLOCKED` without the Case as a whole being blocked.

**Status:** **LOCKED semantic distinction.**

### Important migration nuance

The recommendation to retire lane states from `CaseStatus` and let workstreams own lane state was strongly supported, but the retrieved evidence does not prove that migration itself was fully authorized and executed.

**Status of the semantic ownership:** **LOCKED.**  
**Status of the concrete `CaseStatus` migration:** **OPEN / repo-verification required.**

## 2.4 Evidence is not a lane

Evidence feeds multiple lanes and decisions. It should not be modeled as a journey stage or a parallel operational lane merely because a screen exists for it.

**Status:** **LOCKED.**

## 2.5 Guided Intake vs Prescreen

The governed Prescreen bounded context is canonical. Guided Intake contained useful UX/content that should be harvested where clinically appropriate, but maintaining two competing assessment domain models was rejected.

**Status:** **REFINED.** Preserve valuable capture concepts; retire domain duplication.

## 2.6 Fabricated benefits/authorization behavior

Prototype coverage generated from case-id hashing was identified as fabricated and unsafe to present as operational truth.

**Status:** **SUPERSEDED as product behavior.** Unknown/unverified must remain unknown unless a governed source exists.

## 2.7 Demo and training behavior

Early UX stabilization considered de-emphasizing demo persona controls. Later work sharpened this:

- demo persona controls do not belong in operational identity/authority;
- reset/tamper/Mock Admit and similar behavior belongs behind an explicit Scenario Lab / training boundary;
- production visibility/authority must come from governed identity and policy.

**Status:** **REFINED -> LOCKED target direction.**

## 2.8 Candidate next work and WorkItem

The repo already had enough signals to derive candidate next work. A persisted generic `WorkItem` was parked until requirements such as person-specific assignment, due dates, completion evidence, and independent lifecycle prove persistence is necessary.

**Status:** **LOCKED current posture: projection first.**

`Suggested != Assigned` is a semantic invariant.

---

# 3. Major thread trajectory — 3D Unix file-system

## 3.1 Initial idea: spatial/Unix-like navigation

The starting idea explored whether Clarity could be understood more like a spatial or navigable system than a collection of screens.

The early conclusion was not “make the whole app 3D.” It quickly moved toward:

- relationships and hierarchy being navigable;
- conventional panels/forms remaining the precise work surface;
- 2D/2.5D proving value before full spatial rendering.

**Status:** **REFINED.** The metaphor survived; literal 3D-first product design did not.

## 3.2 Governed operational world

The deeper conceptual move was to model Clarity as a governed operational reality rather than a set of pages.

Recovered semantic kernel:

- Object
- Relationship
- Event
- Proposition
- Evidence
- State
- Command

with cross-cutting concerns:

- Time
- Authority
- Provenance
- Tenancy

**Status:** **LOCKED architecture direction.**

## 3.3 Epistemic constitution

The model then distinguished forms of knowledge rather than allowing “data” to become truth by default.

Core epistemic distinctions evolved into:

- Fact
- Observation
- Claim
- Inference
- Decision
- Derived State

Later longitudinal work also explicitly added Plan and Preference where required.

The constitutional rule is not that these categories can never relate; it is that the system cannot **silently promote** one category into another.

Examples:

- Claim -> Fact: prohibited without governing evidence/promotion.
- Observation -> Decision: prohibited.
- Inference -> Fact: prohibited.
- Plan -> Actual: prohibited.
- Preference -> Clinical Decision: prohibited.

**Status:** **LOCKED.**

## 3.4 UI is a projection, not canonical truth

The 3D/spatial thread generalized a key rule:

> Work, History, Explore, Flow, AI, dashboards, graphs, and spatial renderers are representations of governed domain truth; they do not each own competing state.

**Status:** **LOCKED.**

## 3.5 One Clarity, multiple representations

The traditional interface is retained and becomes the primary **Work** surface.

Canonical representation model:

- **Work** — precise operational UI and governed mutation.
- **History** — temporal reconstruction and provenance.
- **Explore** — relationship/dependency understanding; 2D first.
- **Flow** — operational topology / where work accumulates.
- **Ask Clarity / AI** — language interface over governed Query/Trace/Command capabilities.
- **Spatial** — optional deeper Explore renderer after 2D proves value.

There is no global `Classic Clarity` vs `3D Clarity` product split.

**Status:** **LOCKED.**

## 3.6 No new graph database merely because Explore is graph-like

The relationship/spatial experience is a projection concern first. It does not by itself authorize a new graph database or a second backend truth system.

**Status:** **LOCKED.**

## 3.7 Learn, Guide, Revenue and System-of-Care Twin

Later work explored additional bounded projections/experiences over the same semantic core:

- **Learn** — synthetic scenario/education use.
- **Guide** — translated/disclosure-controlled explanation for patient/family-facing use.
- **Revenue** — financial/operational projection that consumes clinical/operational events without owning clinical truth.
- **System-of-Care Twin** — a projection across governed relationships, time, transition, and continuity.

These do not replace the core Work/History/Explore/Flow/AI experience architecture.

**Status:** **REFINED / additive**, not a conflicting top-level navigation mandate.

---

# 4. Major thread trajectory — Longitudinal semantics

## 4.1 Initial working hypothesis: broad “Episode of Care” container

The first longitudinal model used:

`Person -> Episode of Care -> Access -> Inpatient -> Transition -> Continuity`

This was useful because it established the need for:

- longitudinal time;
- independent trajectories rather than one score;
- discharge as an event rather than an outcome;
- continuity after discharge;
- patient preference separate from clinical/payer truth;
- clinical and financial trajectories remaining distinct.

**Status:** **REFINED.** The principles survived, but the broad Episode container did not.

## 4.2 Repo reconciliation corrected Episode semantics

The existing Clarity `Episode` already has a precise meaning:

- admission-anchored inpatient stay;
- facility/program/unit scoped;
- linked back to the Access Case;
- lifecycle `ACTIVE -> DISCHARGED -> CLOSED`;
- owner of inpatient authorization/review/documentation-gap facts.

Therefore:

> Existing `Episode` must not be broadened into the entire longitudinal care journey.

**Status:** **LOCKED.**

## 4.3 Longitudinal Care Journey becomes a derived projection first

Canonical longitudinal spine:

`PatientToken -> Access Case -> Inpatient Episode -> Care Transition -> Continuity events`

with `LongitudinalCareJourney` initially assembled as a governed projection across those records.

A new durable parent aggregate is not justified until independent identity/lifecycle/ownership/correction/external-ID requirements prove it necessary.

**Status:** **LOCKED.**

## 4.4 Independent trajectories; no monolithic human-health score

Clarity must preserve separate longitudinal dimensions such as:

- care/clinical need;
- recommended LOC;
- authorized LOC;
- available LOC;
- preferred LOC;
- actual LOC;
- recovery/function observations;
- environment/support;
- discharge readiness;
- transition readiness;
- discharge event;
- continuity events/outcomes;
- coverage;
- revenue/financial activity.

No single dimension silently stands in for the others.

**Status:** **LOCKED.**

## 4.5 Longitudinal Semantic Reconciliation v0.2

The six key concepts were reconciled:

1. `DischargePlan` — true target operational entity; future persistence.
2. `TransitionBarrier` — true target operational entity; future persistence.
3. `CareTransition` — true target operational entity; destination-attempt modeling is a pre-schema dependency.
4. `LevelOfCareRecommendation` — append-only qualified-human decision.
5. `ClinicalDischargeReadinessDecision` — append-only qualified-human decision/event.
6. `Continuity` — typed governed event family plus derived profile; no monolithic Continuity entity.

Explicitly derived rather than master persisted state:

- PendingDischarge
- TransitionReadiness
- LongitudinalCareJourney
- RecoveryProfile
- EnvironmentSupportProfile
- CareIntensityProfile

**Status:** **LOCKED. Do not reopen v0.2 unless contradictory evidence emerges.**

## 4.6 LSR-01 through LSR-18

The following decisions are locked:

- **LSR-01** Preserve current Episode as admission-anchored inpatient Episode.
- **LSR-02** LongitudinalCareJourney is a derived projection first.
- **LSR-03** DischargePlan is a true target entity.
- **LSR-04** TransitionBarrier is a true target entity.
- **LSR-05** CareTransition is a true target entity; destination-attempt modeling remains pre-schema.
- **LSR-06** Clinical LOC is append-only LevelOfCareRecommendation decisions.
- **LSR-07** Payer LOC decisions stay inside payer/UR authority.
- **LSR-08** Clinical discharge readiness is an append-only qualified-human decision.
- **LSR-09** PendingDischarge is derived, not an EpisodeStatus.
- **LSR-10** TransitionReadiness is derived from independently governed components.
- **LSR-11** Actual discharge requires a human-governed source command/event.
- **LSR-12** Continuity is a typed-event family plus derived projections.
- **LSR-13** Expected/target discharge is plan/forecast only.
- **LSR-14** Patient preference remains separate from clinical, payer, legal, and actual-care truth.
- **LSR-15** No universal health, recovery, readiness, or continuity score.
- **LSR-16** Relationships inherit provenance, timing, and authorization requirements.
- **LSR-17** Absence of continuity data means unknown/no observation unless source completeness proves otherwise.
- **LSR-18** Clarity does not infer causal blame from chronology, barrier location, or waiting state.

## 4.7 Ten remaining longitudinal questions

These are the actual remaining pre-schema questions:

1. One logical DischargePlan with revisions per inpatient Episode, or concurrent independent plans?
2. Separate destination-attempt records for each CareTransition?
3. Which facility-configured roles may record/supersede clinical discharge readiness?
4. What canonical LOC registry/crosswalk spans inpatient, residential, PHP, IOP, outpatient, post-acute, etc.?
5. What barrier taxonomy supports operations/trending without becoming a blame taxonomy?
6. Which recovery/function and environment/support concepts are platform-core vs configurable assessment fields?
7. Exact command/source/disposition/correction contract for actual discharge?
8. Which sources can establish follow-up, medication events, next LOC, ED use, and readmission?
9. What operational work remains allowed between `DISCHARGED` and `CLOSED`?
10. Can the first longitudinal projection be reliably derived from existing identity/lineage without a new parent aggregate?

**Status:** **OPEN.**

## 4.8 Next longitudinal artifact

`Longitudinal Vertical Slice Contract v0.1`

No Prisma changes yet. It should specify TypeScript contracts, value sets, state machines, decision-authority contracts, typed event payloads, projection functions, synthetic Day 1 -> Day 39 fixture, acceptance tests, existing-object mapping, and informational-only Prisma impact.

**Status:** **NEXT.**

---

# 5. Major thread trajectory — Design agent operating model

## 5.1 Human/agent operating model

Recovered target operating model separated orchestration, building, verification, truth/docs, and temporary forensics rather than letting one agent author and self-certify everything.

**Status:** **REFINED process direction.** Exact agent names are operational implementation details, not product canon.

## 5.2 Source-of-truth hierarchy

Recovered hierarchy:

1. merged Git/main implementation truth;
2. CI/evidence verification truth;
3. ADR architecture truth;
4. structured task/project state;
5. human-readable board/interpretation;
6. model/chat memory lowest authority.

Docs must reconcile to merged main and accepted ADRs, not to an agent’s claim that something was done.

**Status:** **LOCKED process invariant.**

## 5.3 Existing ADRs remain authoritative until explicitly superseded

The new canon package is not permission to overwrite existing accepted ADRs casually.

**Status:** **LOCKED.** Conflicts must be surfaced and resolved explicitly.

## 5.4 Engineering readiness gate

A feature should not enter implementation while behavior, domain objects, permissions, state transitions, data requirements, AI boundaries, UI states, acceptance tests, and dependencies are ambiguous enough that two competent coding agents could build materially different systems.

**Status:** **LOCKED engineering principle.**

---

# 6. Cross-thread reconciliation

## 6.1 “Light UX pass” vs “full UX re-foundation”

**Earlier:** group 19 workspaces into `Home | Cases | Intake | Review | Placement | More` and simplify Access Snapshot.  
**Later:** define Platform/Module/Workspace/Object/View/Action, prove the shell through Tree 4, then build Tree 5 on top.

**Resolution:** **REFINED.** The early grouping was a useful emergency stabilization idea, but it is not the final domain or IA model. Tree 4/Tree 5 control the target architecture.

## 6.2 Intake as top-level workspace vs Case-scoped work

**Earlier:** Intake appeared as a permanent top-level navigation group.  
**Later:** Guided Intake was classified as a Case-scoped view/action and the governed Prescreen domain became canonical.

**Resolution:** **SUPERSEDED as a permanent domain workspace.** Cross-case Intake queues may exist if justified by a real repeated job, but “Intake” is not automatically a top-level product object because a screen existed.

## 6.3 Access Snapshot vs Case Overview/Case Status

**Earlier:** Access Snapshot was an engineering label.  
**Later:** its read-model architecture was explicitly preserved while the product presentation should answer where the Case is, disposition, attention, next work, lanes, and why.

**Resolution:** **REFINED.** Preserve the governed read model; expose it through a human-facing Case overview/status experience. Exact final label should be set by Tree 5, not backend naming.

## 6.4 Demo role picker: de-emphasize vs remove from operations

**Earlier:** make it a smaller “Demo view / Prototype persona” control.  
**Later:** verified identity and authority must govern production UI; demo/reset/tamper/Mock Admit move to Scenario Lab/training.

**Resolution:** **REFINED -> LOCKED target.** Operational production surfaces do not use demo persona as authority or primary navigation logic.

## 6.5 “Status” as one concept vs semantic decomposition

**Earlier/current UI:** “status” was overloaded across journey, workstreams, attention, review, and exceptions.  
**Later:** phase, lane state, disposition, decision state, requirement state, and derived state are distinct.

**Resolution:** **SUPERSEDED.** No generic status concept may silently represent all of these meanings.

## 6.6 Broad Episode of Care vs existing Episode

**Earlier:** Episode of Care was proposed as the longitudinal operational container.  
**Repo reconciliation:** existing `Episode` is already admission-anchored inpatient stay.

**Resolution:** **SUPERSEDED.** Keep `Episode` narrow; derive longitudinal Care Journey across bounded records/events.

## 6.7 TransitionPlan/CareTransition “candidate” vs true target entity

**Earlier:** CareTransition was a likely candidate requiring workflow validation.  
**v0.2:** CareTransition was admitted as a true target-domain entity, with destination-attempt modeling still unresolved.

**Resolution:** **REFINED -> LOCKED entity class, OPEN substructure.**

## 6.8 DischargePlan and TransitionBarrier candidates vs true target entities

**Earlier:** candidates.  
**v0.2:** both classified as true target operational entities.

**Resolution:** **REFINED -> LOCKED.** Persistence implementation remains gated.

## 6.9 Continuity as object vs typed event family

**Earlier:** continuity was sometimes discussed as a period/object.  
**v0.2:** no giant Continuity entity; use typed governed events plus derived profiles.

**Resolution:** **SUPERSEDED.**

## 6.10 3D Clarity vs integrated representations

**Earlier:** spatial/Unix metaphor raised possibility of a distinct experience.  
**Later:** traditional Work remains primary; Explore starts in 2D; Spatial is an optional deeper renderer; no global Classic/3D product split.

**Resolution:** **SUPERSEDED as separate product; LOCKED as contextual renderer.**

## 6.11 Graph UI vs graph database

**Earlier possibility:** relational/spatial world could suggest graph-native persistence.  
**Later constitutional decision:** renderer/projection does not authorize a second canonical datastore.

**Resolution:** **SUPERSEDED. No new graph DB at this stage.**

## 6.12 AI assistant vs governed participant

**Earlier product instinct:** AI could explain and manipulate the interface.  
**Later constitution:** AI may Query, Trace, summarize, compare, infer, and propose within permissions; canonical decisions and mutations enter through governed command/approval surfaces.

**Resolution:** **REFINED -> LOCKED.** AI does not own truth.

## 6.13 WorkItem persistence

**Earlier product pressure:** candidate work could become tasks.  
**Reconciliation:** derive next work first; persist only when independent task identity/lifecycle/assignment/evidence is proven necessary.

**Resolution:** **LOCKED projection-first posture.**

## 6.14 Work/History/Explore/Flow/AI vs Learn/Guide/Revenue

These are not competing architectures.

- Work/History/Explore/Flow/Ask Clarity describe the core operator representation system.
- Learn, Guide, and Revenue are bounded projections/experiences over the same semantic core with separate disclosure/authority rules.

**Resolution:** **REFINED / additive.** Do not automatically add Learn/Guide/Revenue to primary Crisis Ops navigation.

## 6.15 “Rebuild UI from scratch” vs preserve Tree 4

A current-state audit correctly said the old monolithic Crisis Ops shell was architecturally weak. Tree 4 later established and visually proved a new shell architecture.

**Resolution:** **SUPERSEDED as ongoing design instruction.** Do not repeatedly reopen the shell. Preserve Tree 4 and continue Tree 5 unless new evidence fails a gate.

---

# 7. Reconstructed canonical decision register v0.1

## Experience / UX

**UX-001 — LOCKED**  
Clarity is one product over one governed domain reality, not separate “classic,” “AI,” or “3D” products.

**UX-002 — LOCKED**  
The traditional interface remains the primary **Work** and precision/mutation surface.

**UX-003 — LOCKED**  
History reconstructs time/events/provenance; Explore explains relationships; Flow explains operational topology; Ask Clarity is the language interface.

**UX-004 — LOCKED**  
2D Explore precedes Spatial. Spatial, if useful, is a deeper Explore renderer.

**UX-005 — LOCKED**  
Tree 4 shell architecture is locked and visually proven; Tree 5 inherits it.

**UX-006 — LOCKED**  
Core experience hierarchy is `Platform -> Module -> Workspace -> Object -> View -> Action`.

**UX-007 — LOCKED**  
Case-centered experience should answer: where is this Case, what requires attention, what is next, and why.

**UX-008 — LOCKED**  
Developer/provenance detail is available but progressively disclosed rather than dominating ordinary operator surfaces.

**UX-009 — LOCKED**  
Prototype/training state must not be visually or semantically indistinguishable from governed operational state.

**UX-010 — ACTIVE**  
Tree 5.1 must define the Cases scan/workspace model before deeper Case-workspace implementation.

## Identity / authority

**AUTH-001 — LOCKED**  
Identity, role, visibility, and authority are distinct.

**AUTH-002 — LOCKED**  
SEE / DO / REVIEW / DECIDE / OWN are separate capabilities.

**AUTH-003 — LOCKED**  
Visibility alone never grants mutation or decision authority.

**AUTH-004 — LOCKED**  
Demo personas and scenario controls live outside production authority; Scenario Lab/training is the correct boundary.

## Access semantics

**ACC-001 — LOCKED**  
The Access journey has seven phases: Referral, Prescreen, Qualified Review, Facility Review, Pre-Admission, Transfer/Handoff, Admitted.

**ACC-002 — LOCKED**  
JourneyPhase is derived rather than a separately mutable source of truth.

**ACC-003 — LOCKED**  
Phase != lane/workstream state != disposition.

**ACC-004 — LOCKED**  
A blocked lane does not automatically block the Case.

**ACC-005 — LOCKED**  
Evidence is a supporting data domain, not a journey phase or ordinary parallel lane.

**ACC-006 — LOCKED**  
Prescreen is the canonical governed assessment domain; useful Guided Intake content may be harvested, but duplicate assessment truth should not survive.

**ACC-007 — LOCKED**  
Candidate next work remains non-binding; `Suggested != Assigned`.

**ACC-008 — OPEN implementation/migration**  
Retire lane states from `CaseStatus` if not already completed; verify current main and ADR state before action.

**ACC-009 — OPEN implementation**  
Governed Case Queue/list endpoint and final Cases workspace behavior must be verified/designed against current main.

## Epistemic / semantic constitution

**SEM-001 — LOCKED**  
Core semantic kernel includes Object, Relationship, Event, Proposition, Evidence, State, Command.

**SEM-002 — LOCKED**  
Time, authority, provenance, and tenancy are cross-cutting semantics.

**SEM-003 — LOCKED**  
Fact, Observation, Claim, Inference, Decision, and Derived State remain distinct; longitudinal work also requires Plan and Preference.

**SEM-004 — LOCKED**  
UI/graphs/AI/projections do not own canonical truth.

**SEM-005 — LOCKED**  
Derived state is computed from governed inputs and must not be mutated as if it were source truth.

**SEM-006 — LOCKED**  
Unknown, missing, not applicable, negative evidence, and “no observation” are not interchangeable.

**SEM-007 — LOCKED**  
Relationships/edges carry provenance, time, epistemic category, and authorization where material.

**SEM-008 — LOCKED**  
Chronology or waiting state alone does not establish causal blame.

## Longitudinal semantics

**LONG-001 through LONG-018 — LOCKED**  
Adopt LSR-01 through LSR-18 exactly as recorded in Longitudinal Semantic Reconciliation v0.2.

**LONG-019 — OPEN**  
Resolve the ten remaining pre-schema longitudinal questions before persistence authorization.

**LONG-020 — NEXT**  
Build Longitudinal Vertical Slice Contract v0.1 against the Day 1 -> Day 39 synthetic proof without Prisma changes.

## AI

**AI-001 — LOCKED**  
AI is a governed participant over Clarity, not a canonical source of truth.

**AI-002 — LOCKED**  
AI may Query/Trace, summarize, compare, identify gaps, and propose within bounded permissions.

**AI-003 — LOCKED**  
AI inference may not silently become Fact or Decision.

**AI-004 — LOCKED**  
Consequential writes/decisions enter through governed command and human-authority boundaries.

**AI-005 — LOCKED**  
AI explanations must preserve source/evidence/provenance and say unknown when the system does not know.

## Architecture / implementation

**ARC-001 — LOCKED**  
No new graph database is authorized merely to support Explore/Spatial.

**ARC-002 — LOCKED**  
No new Product Brief is required for this architecture refinement; use one repo-native Governed Operational Architecture package.

**ARC-003 — LOCKED**  
Package order: Constitution -> Reconciliation -> Architecture -> Wiring -> Implementation -> Migration -> Verification.

**ARC-004 — LOCKED**  
No schema change unless semantics demonstrate a persistence requirement that existing structures/projections cannot satisfy.

**ARC-005 — LOCKED**  
Existing ADRs remain authoritative until explicitly superseded.

**ARC-006 — LOCKED**  
Current truth and target canon must remain separate.

**ARC-007 — LOCKED**  
Extend/derive before creating new persistence boundaries.

**ARC-008 — LOCKED**  
Consequential localStorage/prototype state should not gain new canonical capability; migrate, sandbox, or retire it.

## Engineering process

**ENG-001 — LOCKED**  
Merged main is implementation truth; CI/evidence proves verification; ADRs govern accepted architecture; chat/model memory is not canonical.

**ENG-002 — LOCKED**  
Specification is not ready when two competent coding agents could reasonably build materially different systems.

**ENG-003 — LOCKED**  
Authoring and independent verification should remain separate responsibilities.

**ENG-004 — LOCKED for this pass**  
Do not let Codex/Claude invent Prisma changes during canon reconstruction or before the longitudinal vertical-slice/ADR gate.

---

# 8. Superseded register v0.1

| Earlier idea | Canonical replacement |
|---|---|
| Broad `Episode of Care` as the parent of Access + inpatient + transition + continuity | Existing `Episode` stays inpatient-stay entity; `LongitudinalCareJourney` is a derived cross-boundary projection first |
| Global `Traditional / Spatial` or `Classic / 3D` switch | Contextual Work / History / Explore / Flow / Ask Clarity representations; Spatial lives under Explore later |
| 3D-first experience | 2D relational Explore first; spatial only after value is proven |
| Graph-like UX implies graph database | Graph/spatial is a renderer/projection; no new graph DB now |
| Generic `status` as master meaning | Distinct phase, lane state, disposition, decision state, requirement state, derived state |
| Demo persona as an operating identity control | Governed identity/authority in production; demo/scenario controls behind Scenario Lab/training |
| Guided Intake as competing assessment domain | Governed Prescreen domain; harvest useful fields/UX, retire duplication |
| Fabricated benefits/authorization values | Explicit unknown/unverified unless governed source exists |
| Persist generic WorkItem first | Derived next-work projection first; persist only if independent task lifecycle is proven |
| Monolithic Continuity object/score | Typed continuity events + derived profiles |
| Universal health/recovery/readiness score | Independent longitudinal dimensions/profiles; no silent collapse |
| Discharged = successful outcome | Discharge is an event; continuity/outcomes follow separately |
| Clinical stabilization = discharge readiness | Separate clinical stabilization, discharge-readiness decision, transition readiness, and actual discharge |
| Payer authorization = clinical appropriateness | Separate payer authority from clinical recommendation/medical need |
| Early emergency nav grouping as final architecture | Tree 4/Tree 5 and Platform->Module->Workspace->Object->View->Action control the target IA |
| Reopen/rebuild shell repeatedly | Tree 4 is locked; continue Tree 5 unless a gate fails |

---

# 9. Open-gap register v0.1

## 9.1 Longitudinal — explicit ten questions

Retain the ten questions listed in §4.7 as the only known longitudinal pre-schema gaps until reconciliation exposes additional evidence.

## 9.2 UX / Tree 5

1. Exact Cases scan model: which governed signals make a Case deserve attention and why?
2. Exact Case Workspace composition under Tree 5 after semantic consolidation.
3. Exact user-facing label and placement for the governed Access read model (`Case Overview` vs `Case Status` or final Tree 5 term).
4. Which cross-case jobs deserve permanent workspaces beyond Cases (for example Review or Placement) versus remaining Case-scoped views/actions?
5. Production usability/accessibility validation of the Tree 4 shell.

## 9.3 Access implementation

1. Current repo status of recommended `CaseStatus` lane-state retirement.
2. Current repo status/contract for a governed Case Queue/list.
3. Cross-org Facility Review / Referral model and tenancy.
4. Transfer/Handoff engine and custody semantics.
5. Final migration fate of remaining localStorage Access capabilities.

## 9.4 Architecture contracts

The governed-architecture package identified likely missing contracts that must be confirmed against current main rather than assumed absent:

- DerivationTrace — “Why?”
- ProvenanceTrace — “How do you know?”
- Obligation semantics — “What remains unresolved?”
- AvailableCommand projection — “What can I do?”
- Decision Context — “What was known when the decision was made?”
- Temporal History projection — “What changed?”
- Authorized Neighborhood — “What is connected that this user may see?”

Status: **OPEN pending repo confrontation.**

---

# 10. Canon Reconstruction Pass 01 outcome

## What is now safe to stop re-litigating

The following should not be reopened casually:

- Tree 4 shell architecture.
- traditional Work interface as the primary operational surface.
- contextual History/Explore/Flow/Ask Clarity representation model.
- 2D before Spatial.
- Platform -> Module -> Workspace -> Object -> View -> Action.
- identity/role/visibility/authority separation.
- SEE/DO/REVIEW/DECIDE/OWN.
- seven-stage Access journey.
- phase/lane/disposition separation.
- JourneyPhase as derived.
- epistemic constitution and no silent promotion.
- existing Episode as admission-bounded inpatient stay.
- LongitudinalCareJourney as projection first.
- LSR-01 through LSR-18.
- no universal health/recovery/readiness/continuity score.
- no graph database merely for Explore.
- AI as governed participant rather than truth owner.
- semantics authorize schema.
- no new Product Brief for this architecture refinement.

## What work should happen next

1. Preserve this reconstruction as a draft canon artifact.
2. Acquire/store the full raw transcripts as immutable `sources/` for lossless provenance.
3. Extract the decision register into machine-readable YAML/JSON with source pointers.
4. Extract the superseded register and open-gap register.
5. Work only the ten longitudinal open questions plus explicit Tree 5 / implementation gaps.
6. Build `Longitudinal Vertical Slice Contract v0.1` with no Prisma changes.
7. Assemble the `Clarity Governed Operational Architecture Package v1.0` around the reconciled canon.
8. Confront the package against current `main` to classify every item as implemented / partial / missing / conflicting / legacy.
9. Only then issue implementation authorization for schema/API/UI work.
10. Resume Figma pattern research only as a pattern-gap analysis against this canon.

---

# 11. Governing sentence

> **Clarity is one governed operational system whose traditional Work interface, History, Explore, Flow, AI, learning/guide/revenue projections, and eventual spatial renderers all operate over the same evidence-backed, temporal, authorized domain truth; the product preserves bounded operational records and derives longitudinal understanding without collapsing distinct clinical, operational, payer, preference, transition, continuity, or financial meanings into one status, score, or AI-generated truth.**

