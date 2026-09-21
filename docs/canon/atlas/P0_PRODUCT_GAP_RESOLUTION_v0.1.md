# P0 Product Gap Resolution & Dependency Map v0.1

**Date:** 2026-09-21
**Inputs:** Platform Atlas v0.1, Experience Atlas v0.1, Screen & Scenario Atlas v0.1,
Master Tree v2.1, Tree 4 Acceptance Contract v0.1, current repository evidence
**Status:** Analysis artifact. It authorizes no runtime, schema, API, persistence, UI, simulator,
or decision-register change.

## Purpose and governing distinction

The Atlases identify missing product surfaces, semantics, and scenario coverage. They do not imply
that every missing item must be implemented before an Experience Simulator can be designed.

This map distinguishes:

> **Unknown target behavior** — blocks simulator design until the semantics, topology, or owner
> decision is resolved.

> **Known target behavior with missing production implementation** — can be represented as a
> deliberate target design in the simulator; production implementation remains a separate gate.

Each gap below has exactly one primary disposition:

| Disposition | Meaning |
|---|---|
| `RESOLVE_BEFORE_SIMULATOR` | The simulator needs a settled semantic, topology, ownership, or query contract first. |
| `DESIGN_IN_SIMULATOR` | The target behavior is sufficiently known to model with synthetic/mock state; production implementation is separate. |
| `PRODUCTION_PREREQUISITE` | The simulator is not blocked, but an actual production release cannot proceed without the capability. |
| `BLOCKED_EXTERNAL_DECISION` | A named owner decision is missing outside this implementation slice. |
| `DEFER` | Valid work, but not a prerequisite for the first simulator or current product lane. |
| `RETIRE_AS_REQUIREMENT` | The item is a stale interpretation or test claim, not a target requirement. |

## Disposition summary

| ID | Gap | Type | Primary disposition | Root / downstream | Dependencies |
|---|---|---|---|---|---|
| G-01 | Assignment / ownership | Topology and authority | `RESOLVE_BEFORE_SIMULATOR` | Root | G-02 |
| G-02 | SEE / DO / REVIEW / DECIDE / OWN authority grammar and partial authorization | Control plane | `BLOCKED_EXTERNAL_DECISION` | Root | External product, clinical, legal, and operations owners |
| G-03 | Longitudinal correction, supersession, and continuity authority | Semantic layer | `BLOCKED_EXTERNAL_DECISION` | Root | #136 OD-A/B/C/D; G-02 |
| G-04 | Controlled Knowledge governance | Shared capability | `BLOCKED_EXTERNAL_DECISION` | Root | G-02; domain approvers |
| G-05 | Governed cross-Case query | Representation substrate | `RESOLVE_BEFORE_SIMULATOR` | Root | G-01, G-02, G-12 |
| G-06 | Case-context navigation | Application/navigation capability | `RESOLVE_BEFORE_SIMULATOR` | Root | G-01, G-02, G-12 |
| G-07 | Episode / UR has no application workspace | Product topology | `DESIGN_IN_SIMULATOR` | Downstream | G-02, G-05 |
| G-08 | Learning & Practice supervisor contest resolution has no workspace | Job/workspace | `DESIGN_IN_SIMULATOR` | Downstream | G-01, G-02 |
| G-09 | Knowledge/rule stewardship has no approval workspace | Job/workspace | `DESIGN_IN_SIMULATOR` | Downstream | G-04, G-02 |
| G-10 | Discharge planning / transition has no home | Job/topology | `BLOCKED_EXTERNAL_DECISION` | Downstream | G-03, #136 OD-A/B/D |
| G-11 | Partner participation / Collaborate has no home | Application topology | `DESIGN_IN_SIMULATOR` | Downstream | G-02, partner boundary decision |
| G-12 | Inconsistent missing/unknown/contradictory/stale/superseded semantics | Truth-state contract | `RESOLVE_BEFORE_SIMULATOR` | Root | G-02, G-03, G-04 |
| G-13 | Session-expiry recovery | Failure-state flow | `DESIGN_IN_SIMULATOR` | Downstream | G-06; server auth evidence exists |
| G-14 | Facility/scope switching | Failure-state flow | `DESIGN_IN_SIMULATOR` | Downstream | G-02, G-06, tenancy contract |
| G-15 | Unknown commit result | Failure-state flow | `DESIGN_IN_SIMULATOR` | Downstream | idempotency, reconciliation, G-12 |
| G-16 | Eighteen scenario families lack executable coverage | Scenario inventory | `DEFER` | Downstream | G-12; prioritize by simulator purpose |
| G-17 | Day 1→39 has no user-facing renderer | Scenario renderer | `DESIGN_IN_SIMULATOR` | Downstream | G-03, G-12 |

The original count of “13 P0 gaps” should not be preserved as a planning count. The current
analysis identifies **six primary root gaps** (G-01 through G-06) plus **G-12, a cross-cutting
truth-state contract**; the remaining IDs are downstream workspace, failure-state, and scenario
items, including one deferred coverage aggregate. Several Atlas P0 rows are symptoms produced by
these roots rather than independent architecture problems.

## Gap records

### G-01 — Assignment / ownership

1. **What is missing:** There is no canonical assignment or ownership model for work, attention,
   handoff, or responsibility. The Atlas marks this the only truly `[X] ABSENT` capability.
2. **Why it matters to the user:** People cannot reliably tell who owns the next action, who may
   accept a handoff, or who must resolve a stalled item.
3. **Topology class affected:** Shared capability; Work representation; control-plane authority.
4. **Current evidence:** Platform Atlas marks Assignment / ownership `ABSENT`; Experience Atlas
   states that existing handoffs are workflow handoffs, not modeled ownership transfers.
5. **Target behavior:** A work item can expose accountable owner, current assignee, queue/team,
   handoff state, and ownership history without changing the canonical Case record.
6. **Dependencies:** G-02 authority grammar; G-05 cross-Case work query; G-08 supervisor work;
   G-11 partner handoff.
7. **What goes wrong if unresolved:** Handoffs look complete while no accountable actor exists;
   supervisor, queue, and escalation behaviors remain ambiguous.
8. **Simulator need:** The simulator needs the ownership semantics and role transitions defined;
   it may use synthetic ownership records.
9. **Production implementation before release:** Yes for any release that claims work queues,
   assignment, escalation, or accountable handoffs; no claim is made for the current prototype.
10. **Recommended disposition:** `RESOLVE_BEFORE_SIMULATOR`.
11. **Acceptance condition:** A role/job matrix defines owner, assignee, queue, handoff, and
   escalation semantics for each simulated work object, including unassigned and contested states.
12. **Primary root or symptom:** Root.

### G-02 — Authority grammar and partial authorization

1. **What is missing:** The product has endpoint allow-lists and database-derived roles, but the
   intended SEE / DO / REVIEW / DECIDE / OWN authority grammar remains canon-only.
2. **Why it matters to the user:** A user needs to know not only whether a screen is visible, but
   whether they may act, review, decide, or own the next consequential step.
3. **Topology class affected:** Control plane; all applications and bounded contexts.
4. **Current evidence:** Platform and Experience Atlases classify authorization as `PARTIAL`
   while the authority grammar is `CANON_ONLY`; current auth tests prove server session and role
   behavior, not the complete authority grammar.
5. **Target behavior:** Every material action has an explicit authority class, actor scope,
   review requirement, refusal state, and audit consequence.
6. **Dependencies:** External product, clinical, legal, and operations owners; G-01; G-03;
   G-04.
7. **What goes wrong if unresolved:** The simulator can show controls without knowing whether
   they are allowed, suggested, review-gated, or human-decided.
8. **Simulator need:** The simulator needs the authority rules resolved before it can truthfully
   model action states; it may mock the enforcement backend afterward.
9. **Production implementation before release:** Yes for governed actions; the current prototype
   and demo-role picker must not be represented as production authorization.
10. **Recommended disposition:** `BLOCKED_EXTERNAL_DECISION`.
11. **Acceptance condition:** An owner-approved authority matrix maps each simulated action to
   SEE / DO / REVIEW / DECIDE / OWN, role, organization/facility scope, and audit outcome.
12. **Primary root or symptom:** Root.

### G-03 — Longitudinal correction, supersession, and continuity authority

1. **What is missing:** Longitudinal is currently a contract-only semantic layer with no
   persistence authority, correction/supersession rules, or approved continuity vocabulary.
2. **Why it matters to the user:** Transition and discharge decisions must remain traceable when
   facts change, decisions are superseded, or an earlier recommendation is corrected.
3. **Topology class affected:** Longitudinal semantic layer; candidate future bounded context.
4. **Current evidence:** Platform Atlas marks longitudinal correction/supersession absent and
   Longitudinal `CONTRACT_ONLY`; the Master Tree records OD-A/B/C/D as open decisions.
5. **Target behavior:** A continuity artifact identifies source, effective time, correction or
   supersession relation, authority, reviewer, and current validity without collapsing history.
6. **Dependencies:** #136 OD-A/B/C/D and G-02. This record does not decide or modify them.
7. **What goes wrong if unresolved:** The simulator may imply a continuity decision that has no
   agreed authority or correction semantics; production could overwrite or misrepresent history.
8. **Simulator need:** The simulator is blocked until the target authority and vocabulary are
   decided; afterward, it can model the target with synthetic records.
9. **Production implementation before release:** Yes for any longitudinal or transition release;
   implementation is not required merely to design the simulator.
10. **Recommended disposition:** `BLOCKED_EXTERNAL_DECISION`.
11. **Acceptance condition:** The external decision record defines effective, corrected,
   superseded, invalidated, and unresolved continuity states with authorized actors.
12. **Primary root or symptom:** Root, with G-10 and G-17 downstream.

### G-04 — Controlled Knowledge governance

1. **What is missing:** RuleSet and Rule schema exists, but the current consumer is prototype-only;
   approval, activation, applicability, and effective-version governance are not a trusted runtime.
2. **Why it matters to the user:** Legal, clinical, payer, facility, and workflow guidance must
   be distinguishable from unapproved or stale rule content.
3. **Topology class affected:** Shared capability; legal, clinical, payer, facility, and assurance
   applications.
4. **Current evidence:** Platform Atlas classifies Controlled Knowledge `SCHEMA_ONLY`; the Master
   Tree says it is consumed exclusively by ungoverned prototype code.
5. **Target behavior:** A rule set has owner, approver, effective interval, jurisdiction/scope,
   applicability, supersession, and visible provenance.
6. **Dependencies:** G-02 authority grammar; domain approver decisions; G-12 truth-state
   vocabulary.
7. **What goes wrong if unresolved:** The simulator could present a draft rule as authoritative,
   especially in legal or clinical flows.
8. **Simulator need:** Approval and activation semantics must be known; the actual governed rule
   service may be mocked with visibly synthetic versions.
9. **Production implementation before release:** Yes before any release that claims governed rules
   drive consequential workflow; not a prerequisite for simulator design after semantics settle.
10. **Recommended disposition:** `BLOCKED_EXTERNAL_DECISION`.
11. **Acceptance condition:** An owner-approved rule lifecycle identifies draft, review, approved,
   effective, superseded, and retired states plus the actor and scope allowed for each transition.
12. **Primary root or symptom:** Root; G-09 is a downstream job/workspace symptom.

### G-05 — Governed cross-Case query

1. **What is missing:** Cases, Queue, Work, and Flow lack a governed cross-Case query/read model
   with tenancy, authorization, provenance, and uncertainty semantics.
2. **Why it matters to the user:** Operational users need to find and compare their work without
   bypassing scope or treating projections as canonical Case state.
3. **Topology class affected:** Work and Flow representations; Access bounded context; tenancy
   and authorization control plane.
4. **Current evidence:** Platform and Experience Atlases explicitly identify Flow as blocked on a
   governed cross-Case query; Cases workspace is local/prototype state.
5. **Target behavior:** A query returns scoped work projections with stable identity, source
   lineage, authorization filtering, freshness, and explicit unknown/empty results.
6. **Dependencies:** G-01 ownership, G-02 authorization, G-12 truth-state contract.
7. **What goes wrong if unresolved:** Queue and Flow cannot be trusted for completeness, ownership,
   or cross-facility comparisons.
8. **Simulator need:** The query contract and projection semantics must be resolved; the
   simulator can use a deterministic synthetic query provider.
9. **Production implementation before release:** Yes for governed multi-Case work; no production
   query implementation is required to design the simulator.
10. **Recommended disposition:** `RESOLVE_BEFORE_SIMULATOR`.
11. **Acceptance condition:** A synthetic query contract demonstrates scope filtering,
   authorization filtering, source/provenance, freshness, empty versus unknown, and stable IDs.
12. **Primary root or symptom:** Root.

### G-06 — Case-context navigation

1. **What is missing:** Navigation context does not survive route changes; the selected Case is
   component state and is reset when Crisis Ops unmounts.
2. **Why it matters to the user:** Returning from Assurance, RevOps, or re-authentication must
   return the person to the Case they were actually working on, or clearly explain why it cannot.
3. **Topology class affected:** Application shell and navigation; not canonical Case state.
4. **Current evidence:** Tree 4 browser evidence proves shell navigation but explicitly records
   F5-b as unmet; F3-b and F6-b remain unmet. `selectedCaseId` is local state.
5. **Target behavior:** The application carries a validated `CaseContext` through navigation and
   revalidates it before returning to a Case view.
6. **Dependencies:** G-01 ownership; G-02 authorization; G-12 state vocabulary; authentication,
   tenancy, and facility scope contracts.
7. **What goes wrong if unresolved:** The user lands in the wrong Case, loses queue position, or
   receives a misleading continuity claim after expiry or scope change.
8. **Simulator need:** The semantic contract must be resolved first; the simulator can mock
   context transport and revalidation without a production persistence layer.
9. **Production implementation before release:** Yes for any release claiming cross-application
   Case continuity; do not persist it into the governed clinical database merely for navigation.
10. **Recommended disposition:** `RESOLVE_BEFORE_SIMULATOR`.
11. **Acceptance condition:** The simulator and later browser tests demonstrate valid return,
   inaccessible/closed/stale Case handling, expiry, scope invalidation, and back/forward behavior.
12. **Primary root or symptom:** Root; resolves F3-b, F5-b, and F6-b and participates in F4.

### G-07 through G-11 — Jobs and applications with no home

These are not five independent reasons to block simulator design. The target jobs are legible
enough to design with synthetic objects; their production workspaces can follow the simulator.

| ID | What is missing | Why it matters to the user | Topology class | Current evidence | Target behavior | Dependencies | What goes wrong if unresolved | Simulator need | Production before release | Primary disposition | Acceptance condition |
|---|---|---|---|---|---|---|---|---|---|---|---|
| G-07 | Episode / UR has no application/workspace | UR users cannot defend a stay in a dedicated workflow | Bounded context + application gap | Episode/UR is implemented but has no application in the Experience Atlas | Scoped UR workspace over Episode, authorization, and day decisions | G-02, G-05 | UR work is hidden in adjacent surfaces or treated as RevOps ownership | Mock target workspace after authority/query contracts settle | Yes if UR is in release scope | `DESIGN_IN_SIMULATOR` | Synthetic UR user reviews source, status, days, gaps, and next action without treating RevOps as owner |
| G-08 | Learning & Practice supervisor contest resolution has no workspace | Supervisors cannot resolve a contested recognition/coaching item | Bounded context + shared capability | Service models `CONTEST` → `RESOLVE_CONTEST`; no supervisor workspace exists | Review queue with contest, resolve, dismiss, rationale, and audit states | G-01, G-02 | Recognition/coaching remains unresolved or silently appears complete | Mock target review queue and resolution states | Yes if supervisor review is in release scope | `DESIGN_IN_SIMULATOR` | Synthetic contested item has an authorized resolution path and observable outcome |
| G-09 | Knowledge/rule stewardship has no approval workspace | No accountable steward can approve or retire a rule set | Shared capability + workspace gap | `RuleSet.approvedBy` / `approvedAt` exist; no approval surface exists | Stewardship queue and approval history over the G-04 lifecycle | G-04, G-02 | Prototype-consumed rules appear authoritative without accountable approval | Mock lifecycle and stewardship surface after G-04 settles | Yes before governed knowledge release | `DESIGN_IN_SIMULATOR` | Steward sees provenance, applicability, authority, effective version, and supersession |
| G-10 | Discharge planning / transition has no home | Transition work cannot be owned or reviewed | Semantic layer + candidate application | Longitudinal is contract-only; no transition workspace or persisted objects | Transition workspace over continuity artifacts, barriers, destination attempts, and discharge facts | G-03; #136 OD-A/B/D | Simulator or product implies discharge authority that has not been decided | Blocked until external authority/vocabulary decisions settle; then mock target workspace | Yes if transition is in release scope | `BLOCKED_EXTERNAL_DECISION` | External decisions define authority and vocabulary before approval/discharge is modeled |
| G-11 | Partner participation / Collaborate has no home | Referral is one-directional and receiving partners have no bounded seat | Candidate application with separate auth boundary | Collaborate is canon-only and referral has no partner seat | Separate partner application with constrained referral, response, and handoff views | G-02; partner auth boundary | Partner access is either absent or over-broad | Mock constrained partner roles and response states | Yes before partner-facing release | `DESIGN_IN_SIMULATOR` | Synthetic partner sees only permitted referral/handoff objects and explicit response states |

### G-12 — Truth-state vocabulary and projection contract

1. **What is missing:** Missing, unknown, contradictory, stale, superseded, unauthorized,
   unavailable, and empty states are not consistently represented across surfaces.
2. **Why it matters to the user:** A blank, an unknown fact, and an inaccessible fact require
   different next actions and must not be mistaken for one another.
3. **Topology class affected:** Semantic layer; all representations and renderers.
4. **Current evidence:** Screen Atlas says Access Snapshot handles the uncertainty grid to depth;
   other surfaces leave columns blank or partial. The repository uses explicit `Unknown` in parts
   of the prototype but has no universal projection contract.
5. **Target behavior:** Each projection carries state, source/provenance, freshness, authority,
   and user-safe next action with a stable vocabulary.
6. **Dependencies:** G-02, G-03, G-04, and source-specific contracts.
7. **What goes wrong if unresolved:** Simulator screens become polished but semantically false;
   users may interpret missing data as negative data or stale data as current.
8. **Simulator need:** Vocabulary and display rules must be resolved before scenario design;
   implementation can be mocked.
9. **Production implementation before release:** Yes for any governed surface that makes status,
   readiness, or action claims.
10. **Recommended disposition:** `RESOLVE_BEFORE_SIMULATOR`.
11. **Acceptance condition:** A state dictionary and projection examples cover at least the Atlas
   states, including empty versus unknown, stale versus superseded, and unauthorized versus absent.
12. **Primary root or symptom:** Root.

### G-13 through G-17 — Failure and scenario coverage

| ID | What is missing | Why it matters to the user | Topology class | Current evidence | Target behavior | Dependencies | What goes wrong if unresolved | Simulator need | Production before release | Primary disposition | Acceptance condition |
|---|---|---|---|---|---|---|---|---|---|---|---|
| G-13 | Session-expiry recovery is absent | A user can lose work or return to an unauthorized/stale Case | Control plane + shell flow | Server auth tests prove expiry rejection; F6 browser/product flow is target-only | Detect 401/expiry, offer sign-in, revalidate CaseContext, and explain failure | G-06, G-02 | Re-authentication appears successful while Case access is stale or absent | Mock expired, sign-in, revalidation, and failed-revalidation states | Yes for an authenticated production workflow | `DESIGN_IN_SIMULATOR` | Simulator shows all four states with no implied production implementation |
| G-14 | Facility/scope switching is absent | Users may carry a Case across a scope where they no longer have access | Tenancy/control plane + shell flow | F4 has no switcher and remains target-only | Change scope, revalidate authorization, invalidate inaccessible Case, and land in new scoped queue | G-02, G-06, G-12 | Wrong-scope Case remains visible or is silently substituted | Mock valid, invalid, closed, and inaccessible outcomes | Yes for multi-facility production use | `DESIGN_IN_SIMULATOR` | Synthetic scope switch demonstrates each outcome explicitly |
| G-15 | Unknown commit result is handled nowhere | A user cannot tell whether a consequential command succeeded | Command state + renderer | Screen Atlas marks it P0 with no surface; idempotency substrate exists | Show indeterminate outcome, reconcile by idempotency/evidence, prevent false success | G-12; existing idempotency contracts | Duplicate action, false success, or unsafe retry | Mock committed, rejected, and unknown-then-reconciled states | Yes for consequential commands | `DESIGN_IN_SIMULATOR` | Simulator distinguishes all outcomes and records reconciliation evidence |
| G-16 | Eighteen scenario families have no executable coverage | Coverage blind spots can hide important target states, but the aggregate is not itself a root gap | Scenario inventory | Screen Atlas records 18/20 with zero coverage | Select a purposeful scenario subset and label the remainder as deferred gaps | G-12; simulator purpose | Simulator scope becomes unclear or overclaims coverage | Use a coverage ledger; do not implement all families by default | No blanket production requirement for all 18 | `DEFER` | Ledger names modeled, deferred, and intentionally out-of-scope scenarios |
| G-17 | Day 1→39 has no user-facing renderer | Users cannot inspect longitudinal change over time | Semantic layer + renderer | Deterministic fixture/unit evidence exists; no surface renders it | Time-linked renderer with provenance and state transitions | G-03, G-12 | Simulator cannot show the canon's proof scenario without implying unsupported authority | Mock renderer over the fixture with explicit target labels | Yes only if longitudinal view is in release scope | `DESIGN_IN_SIMULATOR` | Renderer shows the fixture while separating target design from production continuity |

## `CaseContext` semantic contract

`CaseContext` is a navigation/application context. It is not canonical patient or Case state and
must not be persisted into the governed clinical database merely to survive navigation.

| Field | Required meaning | Validation / failure rule |
|---|---|---|
| Selected Case identity | Stable Case key and, where applicable, episode/object identity | Missing or malformed identity is an invalid context |
| Origin application/workspace | The application and workspace that created the context | Unknown origin cannot claim a valid return path |
| Origin object view | The object/view the user was using, such as Case Overview or a review lane | View must be allowed for the selected Case and actor |
| Return destination | Explicit application/workspace/view to return to | Fall back to a safe scoped queue when destination is unavailable |
| Organization/facility scope | Tenant, organization, facility, and relevant scope version | Scope mismatch triggers revalidation; no silent cross-scope return |
| Authorization revalidation | Fresh permission check for the current principal and Case | Denied access yields a safe inaccessible state, not stale content |
| Object freshness/reload behavior | Whether the Case/view must reload and which version/effective time is expected | Stale context reloads or shows stale status before action |
| Stale/closed/inaccessible Case behavior | Distinct outcomes for stale, closed, moved, and inaccessible | Never silently substitute another Case |
| Session-expiry behavior | Expiry state, sign-in destination, and post-auth revalidation step | Re-authentication does not imply Case access or restoration |
| Scope-change invalidation | What happens when facility/organization scope changes | Invalidate the context and route to a valid scoped queue |
| Browser navigation/back-forward | Context behavior across history entries and direct deep links | History must not resurrect unauthorized or stale context |

### CaseContext downstream acceptance coverage

| Acceptance gap | CaseContext contribution | Remaining dependency |
|---|---|---|
| F3-b | Return to the originating Case after an assurance finding view | G-02 authorization and finding-link contract |
| F5-b | Return from RevOps to the same selected Case | Shell transport and Case identity validation |
| F6-b | Revalidate the same Case after session re-authentication | G-13 expiry flow and G-02 authorization |
| F4 | Invalidate CaseContext when facility scope changes | G-14 scope-switch semantics |

CaseContext is therefore a **root P0 semantic capability**, but its production implementation is
not a prerequisite for drawing the simulator once the contract above is accepted. The simulator
should mock transport, reload, authorization, expiry, and invalidation explicitly.

## Dependency graph

```text
External authority decisions (G-02, G-03, G-04)
        │
        ├── Assignment / ownership (G-01)
        │       ├── Cases ownership and handoff semantics
        │       ├── Learning & Practice supervisor resolution (G-08)
        │       └── partner handoff / Collaborate (G-11)
        │
        ├── Truth-state vocabulary (G-12)
        │       ├── missing / unknown / contradictory / stale / superseded
        │       ├── unknown commit result (G-15)
        │       └── scenario coverage ledger (G-16)
        │
        └── Controlled Knowledge governance (G-04)
                └── stewardship and approval workspace (G-09)

Governed cross-Case query (G-05)
        ├── Cases and Queue
        ├── Work representation
        ├── Flow representation
        └── Episode / UR workspace design (G-07)

CaseContext navigation (G-06)
        ├── F3-b: return to originating Case
        ├── F5-b: return from RevOps to same Case
        ├── F6-b: revalidate after re-auth
        └── F4: invalidate on scope change

Longitudinal authority and correction (G-03)
        ├── discharge / transition workspace (G-10)
        └── Day 1→39 renderer (G-17)
```

## What truly blocks simulator design

The simulator should not begin detailed interaction design until these are resolved:

1. **G-02 authority grammar** — what users may see, do, review, decide, and own.
2. **G-03 longitudinal authority** — the unresolved #136 OD-A/B/C/D decision cluster.
3. **G-04 controlled-knowledge lifecycle** — who approves, activates, scopes, and supersedes rules.
4. **G-06 CaseContext contract** — the navigation semantics listed above.
5. **G-12 truth-state vocabulary** — the observable state model used by every scenario.
6. **G-01 and G-05** — ownership and cross-Case query contracts needed for Work, Queue, and Flow.

These are semantic or topology decisions, not requests to implement the production backend first.

## Safe to design inside the simulator

Once the root contracts are settled, the simulator may use synthetic/mock target designs for:

- Episode / UR workspace;
- Learning & Practice supervisor contest resolution;
- Knowledge stewardship workspace;
- Partner-facing Collaborate application;
- session-expiry and scope-switch flows;
- unknown commit result and reconciliation states;
- the Day 1→39 renderer; and
- selected scenario families from the 18 uncovered families.

The simulator must label these as target designs and keep synthetic evidence separate from current
runtime proof.

## Production-only prerequisites

The following do not need to exist in production before simulator design, but do need implementation
and independent verification before a corresponding production release claim:

- governed authorization enforcement for the authority grammar;
- assignment/ownership and accountable handoffs;
- governed cross-Case query and scoped Work/Flow projections;
- CaseContext transport, revalidation, expiry, scope invalidation, and history behavior;
- controlled-knowledge approval and effective-version enforcement;
- longitudinal persistence/correction/supersession if #136 authorizes it; and
- any real partner, UR, transition, or supervisor workspace included in a release scope.

## Recommended order

1. **Resolve external authority decisions** — keep #136 open and blocked on OD-A/B/C/D; do not
   ratify IA-002 or ADR-0026 here.
2. **Settle the shared semantic contracts** — G-02, G-01, G-12, and G-06 `CaseContext`.
3. **Settle governed projection contracts** — G-05 cross-Case query and scoped Work/Flow behavior.
4. **Settle controlled knowledge lifecycle** — G-04, then design G-09 stewardship.
5. **Design the simulator’s target topology and failure states** — G-07 through G-11 and G-13
   through G-17, using mock providers and explicit target labels.
6. **Implement production prerequisites only after target semantics and release scope are accepted.**

This order reduces the apparent list without pretending that downstream work is already solved.
