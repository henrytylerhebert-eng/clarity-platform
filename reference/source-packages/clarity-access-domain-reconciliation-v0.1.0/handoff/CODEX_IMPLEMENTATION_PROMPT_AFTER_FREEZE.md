# Codex Implementation Prompt — AFTER FREEZE ONLY

**Do not use until the owner explicitly lifts the housekeeping freeze.**

Goal:
Implement the first bounded Clarity Access reconciliation slice without broad refactoring.

Read the entire Access Reconciliation package and the cleaned current repository.

First proposed slice:
**Classification + canonical IDs only.**

Required work:
- introduce approved canonical scenario metadata/IDs in the agreed repository location;
- map existing physical fixture families to canonical Access scenario IDs where equivalent;
- add no new clinical/legal/facility authority;
- change no user-facing workflow;
- change no database schema unless separately authorized;
- change no existing state machine;
- preserve every test;
- add tests proving fixture linkage and duplicate detection if approved.

Non-goals:
- UI redesign;
- Guided Intake/Prescreen merge;
- new JourneyPhase runtime;
- new WorkItem model;
- cross-org workflow;
- production roles;
- live integrations;
- PHI.

Before editing, produce a work package:
- exact files;
- exact behavior;
- prohibited paths;
- acceptance tests;
- rollback;
- dependencies;
- owner decisions.

Stop and request owner authorization before implementation.
