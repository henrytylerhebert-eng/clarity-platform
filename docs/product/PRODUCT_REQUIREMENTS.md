---
status: Integrated draft — requirement prose missing; matrix authoritative
owner: TBD
version: 0.9.0
last_integrated: 2026-07-10
source_artifacts:
  - reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/REQUIREMENTS_TRACEABILITY.md
  - docs/01-project-architecture.md, docs/04-build-roadmap.md (crisis-generation requirements)
unresolved_conflicts: "Package file 01-product-vision/PRODUCT_REQUIREMENTS.md missing — prose requirements unknown"
related_requirements: full REQ matrix
related_adrs: ADR-0001
---

# Product Requirements

The authoritative requirement set is the **requirements-traceability matrix** preserved at
`reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/REQUIREMENTS_TRACEABILITY.md`, which maps each `REQ-xxx` to domain, description, data model, UI surface, audit event, and sprint.

The package's narrative requirements document (`01-product-vision/PRODUCT_REQUIREMENTS.md`) **was not in the local download**. Until it is obtained, this document records only requirement *sources*:

1. **REQ matrix (Jul 10)** — case spine, parallel workstreams, documents/evidence with human review, clinical/legal reviews, insurance/eligibility/benefits/authorization, packet, custody, audit events per material mutation.
2. **Crisis-generation requirements (Jul 8)** — guided intake modes and age branching, pitfall guards, statutory instruments and compliance clocks (configuration, not statutory truth), packet one-capture/many-output, request-broadcast routing, milieu-aware bedboard, role-adaptive UX (`docs/09`).
3. **Safety requirements (both generations)** — enumerated in `GOVERNANCE.md` and enforced by tests (`tests/`, `app/src/domain/guardrails.test.ts`).

New requirements must be added to the matrix with a REQ id, not scattered in prose.
