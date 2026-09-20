# Clarity Implementation Plan v1.0

## Method

Implement by vertical slice.

No giant rewrite.

Each slice must:

1. consume locked semantics;
2. preserve Tree 4;
3. have one bounded user/system story;
4. include explicit non-goals;
5. have acceptance tests;
6. state whether persistence is touched;
7. state rollback boundary;
8. produce verification evidence before the next slice.

## Slice 0 — Canon + contract base
**Status:** substantially complete.

- Canon Reconstruction Pass 01
- semantic lock
- decision register LSR-01 → LSR-18
- open-gap register
- Longitudinal Vertical Slice Contract v0.1
- synthetic Day 1 → Day 39 fixture
- pure derivation acceptance tests

## Slice 1 — Work + History, read-only
Use the same Day 1 → Day 39 scenario.

Prove on-screen:

- Case/Episode context;
- five LOC truths kept separate;
- target vs actual discharge;
- readiness decision;
- PendingDischarge derived interval;
- barrier lifecycle/aging;
- Day 6 → Day 9 reconstruction;
- continuity source-coverage semantics.

No mutations.

## Slice 2 — Ask Clarity Query / Trace
Same data.

Support a deliberately small first question set:

- Why is discharge pending?
- What changed since Day 6?
- How do you know?
- What is unknown?
- Compare LOC dimensions.

No command execution.

## Slice 3 — Explore 2D
Same data.

Render read-only relationship topology:

LOC recommendation
→ readiness
→ discharge plan
→ barrier
→ destination/availability
→ actual discharge
→ continuity

Node selection opens conventional inspector.

## Slice 4 — Resolve longitudinal open gaps
Work only the ten existing gaps.

Do not invent new semantics unless reconciliation exposes a contradiction.

## Slice 5 — IA-002 persistence authorization
Authorize persistence concept-by-concept, not as a blanket migration.

## Slice 6 — Persistence/API vertical slice
Once authorized:

- DischargePlan
- TransitionBarrier
- CareTransition where ready
- append-only LOC decisions
- append-only discharge-readiness decisions
- actual-discharge command/event
- read/write APIs

## Slice 7 — Governed Work mutations
Wire only authorized commands into the Work interface.

## Slice 8 — Flow
Requires governed cross-Case query/list support.

Queue and Flow become alternate renderers of the same scoped dataset.

## Slice 9 — AI candidate proposals
AI may create source-linked candidates.

Still no direct command execution.

## Slice 10 — Governed AI commands
Only after:

- available-command projection;
- actor/authority resolution independent of model;
- confirmation/review;
- provenance;
- command gateway;
- audit;
- correction/supersession;
- conformance tests.

## Slice 11 — Spatial feasibility
Only after 2D Explore proves value.


