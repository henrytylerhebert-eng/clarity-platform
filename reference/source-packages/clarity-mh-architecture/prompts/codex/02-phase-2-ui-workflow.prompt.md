# Codex Prompt 02 — Phase 2 UI Workflow

Using the Phase 1 data spine, build the basic UI workflow.

Routes or equivalents:

- `/cases`
- `/cases/new`
- `/cases/[caseId]`
- `/cases/[caseId]/intake`
- `/cases/[caseId]/assessment`
- `/cases/[caseId]/medical-necessity`
- `/cases/[caseId]/legal`
- `/cases/[caseId]/routing`
- `/cases/[caseId]/packet`
- `/command-center`

UX requirements:

- show missing clinical data clearly
- distinguish patient-reported, collateral-reported, clinician-observed, and document-sourced facts
- show clinical lane and financial lane in parallel
- do not let benefits verification block clinical screening
- make all AI/draft outputs visibly review-required
- make legal instruments draft/sign/seal/transmit lifecycle visible
- show custody ledger verification state
