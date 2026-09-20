# Clarity × Figma Pattern Gap Analysis v0.1

**Date:** 2026-09-20  
**Purpose:** Compare Figma AI / Figma Make interaction patterns against the reconciled Clarity architecture.  
**Status:** Research / design input only. Does not authorize product semantics, persistence, or commands.

## Controlling Clarity architecture

This analysis assumes the locked architecture:

- **Work** = traditional operational interface and primary precision/mutation surface.
- **History** = temporal reconstruction.
- **Explore** = relationship/topology understanding; 2D first.
- **Flow** = operational movement, queues, and dependencies.
- **Ask Clarity** = language interface for governed Query / Trace first; commands remain gated.
- **Spatial** = optional later renderer under Explore.
- All representations consume the same governed truth.
- Fact / Observation / Claim / Inference / Decision / Derived State remain distinct.
- Authority, provenance, tenancy, and effective time remain explicit.
- AI may not silently convert inference into fact or decision.

---

## Pattern matrix

| Figma pattern | Figma example / evidence | Clarity fit | Exact Clarity adaptation | Guardrail | Disposition |
|---|---|---|---|---|---|
| Reactive filters update all views | Analytics dashboard: category, region, and time filters drive every chart | **Work / Flow / History** | One shared context bar: organization/facility, Case, as-of time/window, and permitted operational filters. All dependent projections re-evaluate against the same context. | Filter/view state is not domain state. Preserve evaluation time and source provenance. | **ADAPT** |
| Natural-language retrieval over structured data | Expense tracker supports queries such as “show coffee expenses” | **Ask Clarity** | “What changed since Day 6?”, “Why is discharge pending?”, “Show the evidence behind this barrier”, “Which component is unknown?” | Query/Trace only initially. Answers cite governed objects/evidence and distinguish unknown from negative. | **ADOPT, BOUNDED** |
| Alerts and proactive insights | Expense tracker smart alerts; admin dashboard AI insights | **Work** | Candidate attention: surface source-backed blockers, review gates, external waits, contradictions, and time-sensitive conditions. | Attention ≠ Decision; Suggested ≠ Assigned; no opaque “impact score” as authority. | **ADAPT** |
| Time-based behavior | Shader Reminder responds simultaneously to user input and time-based events | **History / Work** | As-of views, due windows, barrier age, readiness-to-discharge interval, continuity observation windows. | Effective time ≠ recorded time. Time calculations must reference governed timestamps. | **ADOPT** |
| Overview → operational detail | Hospital management dashboard leads with big-picture stats, then detailed tables and occupancy | **Work** | Case scan answers “which Case deserves attention and why?” then opens the governed Case workspace. Inside Case: current state → attention → next work → details. | No misleading aggregate health/readiness score. Summary must drill to source. | **ADOPT** |
| Put controls before dense visualization | Energy dashboard places filters before charts and preserves navigation | **Work / Flow / History** | Context first, representation second. Users choose scope/time before seeing queue, flow, or historical projection. | Context must respect tenant/role authority; unavailable scope must not render. | **ADOPT** |
| Use full-load/synthetic data to pressure-test hierarchy | Figma hospital example recommends filling tables/progress bars to see whether hierarchy still works | **Tree 5 validation** | Stress-test Cases and Case Workspace with high-density synthetic cases, long histories, multiple barriers, disagreements, unknown data, narrow/mobile screens. | Synthetic load is usability evidence only, not clinical/product-outcome evidence. | **ADOPT** |
| Persistent spatial state | Figmacraft preserves a navigable 3D world and saves progress | **Explore** | Preserve a user’s Explore viewport, expansion state, selected object, and filters as presentation preferences. | Spatial coordinates/view state are not canonical clinical/operational truth. 2D Explore precedes 3D. | **ADAPT / DEFER 3D** |
| AI-generated app logic can be refined visually or in code | Figma Make supports prompt → generated logic → visual/code refinement | **Development process** | Use the Clarity canon + vertical-slice contracts as prompt/context inputs to Figma Make; use generated UI as disposable prototype evidence, not semantic authority. | Generated prototype cannot define backend state, role authority, or persistence boundaries. | **ADOPT FOR PROTOTYPING** |
| Build against existing design system/context | Figma Make can start from existing frames/code/design system | **Development process / Work** | Figma experiments must inherit Tree 4 shell and Tree 5 interaction grammar rather than generating a new Clarity shell. | Tree 4 remains locked unless a formal decision supersedes it. | **ADOPT** |
| Contextual AI actions on selected objects | Figma AI beta Actions menu exposes relevant actions based on selection | **Work / History / Explore / Ask Clarity** | Select a Case, barrier, decision, event, evidence item, relationship, or time interval; expose only semantically valid Query/Trace/proposal actions for that object. | Selection gives context, not authority. Available commands must come from governed policy, not model choice. | **ADOPT, BOUNDED** |
| Generate → preview/review → keep | Figma AI beta generated interactions can be previewed and edited before keeping | **Ask Clarity / Work** | AI output becomes a candidate/proposal, with evidence, epistemic label, provenance, and human review before any command. | No direct model-to-database mutation; consequential commands use the same command gateway as human UI. | **ADOPT AS COMMITMENT PATTERN** |

---

## Representation-specific conclusions

### Work

Figma reinforces the direction already established in Tree 5:

1. Put **context and attention before detail**.
2. Let the operator scan a Cases surface and understand which Case deserves attention and why.
3. Use progressive disclosure: summary → why → evidence → detailed source.
4. Keep proactive AI/guidance as **candidate attention**, never as a clinical or operational decision.
5. Use dense synthetic fixtures to pressure-test hierarchy before production implementation.

**Near-term UX primitive:** `Case Context Bar + Attention Stack + Suggested Next Work + compact lane state`.

### History

The strongest useful pattern is not “timeline eye candy.” It is **time as an explicit query dimension**.

History should support:

- as-of time;
- custom interval;
- compare two points;
- effective time vs recorded time;
- decision supersession;
- barrier open/resolved interval;
- PendingDischarge interval;
- continuity observation windows.

**Near-term UX primitive:** `As-of / Compare control` over a typed event timeline.

### Explore

Figmacraft proves that rich spatial interaction is technically possible, but the architectural lesson for Clarity is narrower:

- preserve navigation state;
- make selected objects manipulable as presentation objects;
- reveal relationships progressively;
- use conventional inspector panels for precision.

**Near-term UX primitive:** read-only **2D relationship map + governed inspector**.

3D remains a later Explore renderer, not a replacement for Work.

### Flow

Figma’s reactive dashboard patterns suggest a shared scoped operational lens:

- Cases/work items in the selected facility/scope;
- visible bottlenecks;
- lane/workstream movement;
- waiting states;
- aging;
- transitions between operational phases.

Flow should not become another source of status. It renders governed current state and derived operational patterns.

**Near-term UX primitive:** `Queue ↔ Flow` representation switch over the same governed dataset.

### Ask Clarity

Natural-language retrieval is the clearest Figma pattern to adopt.

Initial Ask Clarity verbs should be bounded to:

- **Find**
- **Explain**
- **Compare**
- **Trace**
- **Summarize**
- **Show changes**
- **Show missing/unknown evidence**

Examples:

- “Why is this Episode pending discharge?”
- “What changed between Day 6 and Day 9?”
- “Show the source for the IOP availability state.”
- “What is still unknown in the 30-day continuity window?”
- “Compare clinical recommendation, payer authorization, availability, preference, and actual LOC.”

Command execution remains out of scope until the governed command/authority gate is implemented.

---

## Patterns Clarity should reject or defer

### Reject: universal AI “insight” or priority score

Figma examples can freely generate impact levels and recommendation panels. Clarity must not convert that design convention into opaque clinical or operational authority.

Use source-backed attention reasons instead.

### Reject: drag/drop as authoritative state mutation

A workflow/map UI may let users manipulate layout, but dragging a Case, barrier, decision, or destination node must not silently create a clinical decision, acceptance, discharge, assignment, or new relationship.

### Reject: global “traditional vs 3D” toggle

Traditional Work remains primary. Spatial belongs under Explore.

### Defer: AI write commands

Query/Trace comes first. AI command execution waits for available-command projection, actor authority, confirmation, provenance, event/audit, correction, and acceptance-test gates.

### Reject: generated prototypes as semantic authority

Figma Make may help test the experience, but generated components, statuses, fields, or workflows do not create new Clarity semantics.

---

## Recommended vertical-slice UX sequence after the contract slice

### UX Slice 1 — One Episode: Work + History, read-only

Use the Day 1 → Day 39 synthetic fixture.

Prove:

- Case/Episode context remains visible;
- current LOC profile keeps five truths separate;
- PendingDischarge is visibly derived;
- open/resolved barrier is understandable;
- target vs actual discharge is unmistakable;
- timeline can reconstruct why Day 6 → Day 9 happened.

No mutations.

### UX Slice 2 — Ask Clarity: Query + Trace over the same fixture

Support a tiny deterministic question set first:

- Why is discharge pending?
- What changed since Day 6?
- How do you know?
- What is unknown?
- Compare LOC dimensions.

Return structured citations to fixture/domain objects.

No command execution.

### UX Slice 3 — Explore 2D over the same fixture

Render:

Clinical LOC recommendation
→ readiness decision
→ discharge plan
→ transition barrier
→ destination/availability
→ actual discharge
→ continuity event

Selecting a node opens the conventional inspector.

No graph-owned truth.

### UX Slice 4 — Flow after governed cross-Case data exists

Do not fake a production cross-Case flow view from localStorage.

Once a governed list/query exists, render Queue and Flow as alternate views of the same scoped dataset.

### UX Slice 5 — Spatial feasibility

Only after 2D Explore demonstrates a real comprehension advantage.

---

## Research sources

Official Figma sources reviewed:

- Figma, “11 No-Code App Examples to Inspire Your Next Project”  
  https://www.figma.com/resource-library/no-code-app-examples/
- Figma, “29 AI Website Examples for SaaS, E-commerce, + More”  
  https://www.figma.com/resource-library/ai-website-examples/
- Figma, “AI App Builder in Figma Make”  
  https://www.figma.com/solutions/ai-app-builder/
- Figma, “App Logic Generator”  
  https://www.figma.com/solutions/app-logic-generator/
- Figma, “Vibe Coding Tool for Building Apps Faster”  
  https://www.figma.com/solutions/vibe-coding-tool/
- Previously supplied Figma AI beta guide in this Clarity conversation.

## Bottom line

[Inference] Figma does **not** suggest that Clarity needs a new UX architecture. It validates several interaction patterns that fit the one already reconciled:

**context → selection → time → governed state → attention → query/trace → evidence → human commitment.**

The valuable Figma contribution is interaction technique and prototype pressure-testing, not domain semantics.
