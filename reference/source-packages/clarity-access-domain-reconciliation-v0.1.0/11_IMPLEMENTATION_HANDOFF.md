# Implementation Handoff — DO NOT ACTIVATE UNTIL FREEZE EXIT

## Purpose

This document defines the future engineering sequence after repository housekeeping and owner approval.

## Preconditions

Do not implement until:

- `HOUSEKEEPING_FREEZE.md` exit gate is satisfied;
- owner accepts the patient journey;
- owner accepts feature disposition;
- owner accepts rule/scenario architecture;
- local/GitHub reconciliation is complete;
- current state docs are repaired;
- bounded work package is approved.

## Recommended sequence

### Slice A — Classification only
No UX redesign.

- create canonical scenario/rule registries in approved repo locations;
- add metadata linking existing fixture families to canonical IDs;
- do not change behavior.

### Slice B — Journey projection
Implement deterministic `JourneyPhase` as a projection with tests.

- no existing state machine deletion;
- no UX redesign beyond developer-visible verification;
- scenario fixtures validate mapping.

### Slice C — Scenario Lab isolation
Move or remount:
- Mock Admit Lab;
- demo role switcher;
- reset data;
- tamper simulation;
- fixture controls

into explicit Scenario/Developer mode.

### Slice D — Access Home
Build role-aware work coordination using existing authoritative state.

Do not rewrite domain logic.

### Slice E — Prescreen UX convergence
Harvest useful Guided Intake interactions and connect them to canonical Prescreen contracts.

Do not maintain two competing assessment models.

### Slice F — Qualified Review lanes
Embed:
- evidence;
- clinical documentation support;
- legal;
- benefits/UR;
- authorization

as parallel workstreams.

### Slice G — Facility Review / Pre-Admission
Consolidate packet and receiving-facility workflows.
Move bed/milieu work post-acceptance.

### Slice H — Admission → Episode
Prove end-to-end transition from accepted Access Case to Episode using synthetic scenarios.

## Non-goals

- production PHI;
- live hospital integrations;
- autonomous clinical/legal decisions;
- unreviewed facility criteria;
- cross-org expansion before design approval;
- rewriting RevOps/Operating Assurance;
- broad repo cleanup inside Access implementation PRs.

## Refactor rule

> **Harvest existing capability. Do not preserve existing navigation architecture merely because code already exists.**
