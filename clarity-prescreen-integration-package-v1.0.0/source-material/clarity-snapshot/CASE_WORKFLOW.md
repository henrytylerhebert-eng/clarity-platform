---
status: Integrated draft
owner: TBD
version: 1.0.0
last_integrated: 2026-07-10
source_artifacts:
  - MASTER_ARCHITECTURE.md §6–8 (partial package)
  - INTEGRATION_PLAN.md (database artifact)
  - docs/01-project-architecture.md §4 (workflows A–D)
  - reference/source-packages/clarity-mh-architecture/docs/workflows/*
unresolved_conflicts: "02-user-and-workflow-architecture/ missing from package"
related_requirements: REQ-001…REQ-004
related_adrs: ADR-0001
---

# Case Workflow

## Overall model

A case carries one **overall status** plus independent parallel workstream statuses (clinical, legal review, medical screening, benefits, authorization, placement, transportation, patient education). A case may simultaneously be clinically in progress, legal-review pending, medically complete, benefits in progress, and placement ready. State-machine definitions live in `packages/domain-contracts/src/caseStateMachine.ts` with tests.

## Emergency and fairness rule (enforced, tested)

Financial readiness is displayed so verification can start early, but it **cannot block emergency clinical review**, cannot be hidden inside a priority score, and cannot substitute reimbursement for care need. Test: `packages/domain-contracts/src/caseStateMachine.test.ts` ("emergency clinical review proceeds while financial readiness is blocked").

## Crisis-path workflows (implemented in `app/`)

- **A — Field capture → legal instrument:** guided intake (field/clinical modes, age branching) → risk formulation → statutory instrument draft (PEC/OPC/CEC; configuration, not statutory truth) → attestation.
- **B — Central intake pipeline:** queue → evidence/collateral → medical-necessity draft (guard-gated) → packet.
- **C — Secure transfer and acceptance:** request-broadcast routing → facility responses → acceptance → custody handoff on the hash-chained ledger.
- **D — Inpatient milieu bedboard:** milieu-aware placement recommendation; charge-nurse decision is final; overrides require a documented reason.

## Payer-path workstreams (documented; schema support in `prisma/schema.prisma`)

Insurance extraction (human-reviewed) → subscriber relationship → coverage order → eligibility → service-specific benefits (+ network status, authorization requirement) → authorization preparation/submission/outcome → patient financial education record → claim outcome feedback. Verification records method, proof, representative, reference, time, and unresolved questions.

## Blockers and escalation

Deterministic rules block only the dependent step and name the rule creating the block; missing information stays visible; contradictions are grouped, never silently resolved; closure is blocked while required custody-handoff data is missing.
