---
status: Living document
owner: TBD
version: 1.2.0
last_integrated: 2026-07-29
source_artifacts:
  - MASTER_ARCHITECTURE.md limitations; README copy.md "not proof that" list (partial package)
  - docs/06-architecture-review.md risks
  - docs/developer-handoff/AI_NATIVE_DOMAIN_AGENT_REPOSITORY_PREPARATION.md
  - https://github.com/henrytylerhebert-eng/clarity-platform/pull/30
  - https://github.com/henrytylerhebert-eng/clarity-platform/pull/32
  - https://github.com/henrytylerhebert-eng/clarity-platform/pull/33
  - https://github.com/henrytylerhebert-eng/clarity-platform/pull/36
  - https://github.com/henrytylerhebert-eng/clarity-platform/pull/37
  - https://github.com/henrytylerhebert-eng/clarity-platform/pull/38
  - https://github.com/henrytylerhebert-eng/clarity-platform/pull/39
  - https://github.com/henrytylerhebert-eng/clarity-platform/pull/41
source_snapshot: 8399eddad4cb8575d94f9b31db27eb00f73e4bcf
live_remote_snapshot: edd08550d44f257d10c696327a5ae3ceb1881503 (PR #41 decisions after PR #39 status)
unresolved_conflicts: "Package RISK_REGISTER.md missing — this file re-seeds it"
related_requirements: —
related_adrs: ADR-0001
---

# Risk Register

| # | Risk | Category | Severity | Mitigation state |
|---|---|---|---|---|
| R-1 | Statutory logic enforced from unverified Louisiana wording | Legal | Critical | Non-enforcement rule in docs; counsel review gate (OD-2) |
| R-2 | Clinical drafts read as determinations | Clinical | Critical | Prohibited-language guard implemented + tested; human gates documented |
| R-3 | Real PHI enters the prototype or service foundations | Privacy | Critical | Synthetic-only rule and repository guardrails; backend/auth foundations are explicitly not PHI-ready and formal controls remain unimplemented |
| R-4 | Benefits quotes read as payment guarantees | Payer/financial | High | Disclaimer contract + test; UI enforcement pending |
| R-5 | Payer-weighted prioritization creeps into clinical ranking | Fairness | High | Separate-readiness contract + test; no combined score |
| R-6 | Missing 72 package files → decisions made on summaries later contradicted by full specs | Architecture | High | All summary-graded domains flagged; OD-1 |
| R-7 | Schema drift between foundation (canonical) and expanded draft (target) | Architecture | Medium | ADR-0002 adoption path; expanded draft preserved |
| R-8 | Sensitive identifiers leak into logs/audit | Privacy/security | High | Restricted-field guard and audit-payload tests exist; the API still has ad hoc `console.error`/dev logging and needs redaction plus security review |
| R-9 | Describing HIPAA controls mistaken for having them | Compliance | High | Honesty notes in SECURITY_AND_PRIVACY and IMPLEMENTATION_STATUS |
| R-10 | Prototype demo logic (clocks, bedboard heuristics) reused as production truth | Clinical/ops | Medium | Demo-value labels in app README; parking-lot discipline |
| R-11 | Business-sensitive material pushed or exposed through the configured GitHub remote | Business | Medium | Remote exists; review repository visibility and tracked data before every push, keep secrets/private source out of Git, and require owner review for sensitive artifacts |
| R-12 | Single-contributor knowledge concentration and stale handoffs | Delivery | Medium | CI and repository audit trail exist; current-state reconciliation and independent review remain required |
| R-13 | An isolated worktree validates code or database state from another checkout | Build/integrity | High | OD-9; fail the agent gate on any dependency path outside the target worktree or unexpected migration-ledger entry |
| R-14 | Composite string keys alias across tenants or actors | Security/tenancy | Critical | Current prescreen idempotency key construction is blocked from agent modification until an unambiguous tuple contract and regression test are owner-approved |
| R-15 | A live-looking agent/bridge artifact is mistaken for an authenticated, operating control plane | Governance | High | Recheck live status every task; preserve bridge records in place; OD-16 controls freeze/retirement and link/script migration |
| R-16 | Parallel prescreen work changes the same contracts, API, schema, and tests against different baselines | Coordination | High | Reconcile open Phase 3 PR #32 before prescreen writes; freeze exact base/head for any verifier experiment |
| R-17 | Competing governance packages both claim authority over agent topology or bridge disposition | Governance/coordination | Critical | OD-18; merge neither PR #33 nor this package until one canonical model and one supersession record are selected |
| R-18 | An expected prescreen transition error falls through the HTTP adapter as a 500 | API/compatibility | High | Keep prescreen writes blocked; owner-approve the error contract and add a repeat-submit service/API regression before modification |
| R-19 | A "blind" replay can inspect later fixes or gold clues through a linked worktree, shared Git object store, current risk records, or unrestricted PR metadata | Evaluation integrity | Critical | Use an ephemeral standalone two-tree repository with no remote/unreachable objects/network; supply hashed sanitized context; keep gold outside readable scope; independently verify the runner boundary |
| R-20 | Encounter start accepts a case reference without validating same-organization ownership on the in-memory main-branch path | Security/tenancy | Critical | Keep persistence/write authority blocked; owner-approve the case-reference contract and add same-org, cross-org/nonexistent, non-revealing, zero-residue coverage in TP-12 |
| R-21 | `MEDICAL_TRANSFER_REQUIRED` is a clinically flavored current-main state, but its inherited `TransitionCase` roles are `INTAKE_COORDINATOR` and `ORGANIZATION_ADMIN`, neither a clinical role | Clinical/authorization | High | OD-19; do not claim clinical approval or grant agent permission changes; require target-role ruling plus allowed/denied, audit, non-revealing, and zero-residue coverage in TP-13 |
| R-22 | This behind preparation branch modifies canonical files updated by accepted current-main PR #39 (`CLAUDE.md`, `IMPLEMENTATION_STATUS.md`) and PR #41 (`OPEN_DECISIONS.md`), so a blind merge could drop accepted blockers/decisions or reintroduce stale claims | Documentation/coordination | High | Integrate current main through PR #41 first; preserve accepted evidence and verify the final combined diff under OD-18 |
| R-23 | Held PR #30 is a 2,483-file old-base lane spanning canonical status, application code, prescreen UI, and `agent_bridge`, creating extreme scope, merge, and bridge-governance risk | Scope/coordination | Critical | Preserve the owner hold recorded by PR #39; do not merge, edit, or treat its Stage 0.1-0.3 changes as accepted until OD-18 records a bounded disposition |
| R-24 | Decision IDs can bind different questions across branches: current-main PR #41 assigns OD-13 to CMS research, while held PR #30 independently uses OD-13 for network-enrichment boundaries | Governance/traceability | Critical | Allocate after an all-ref search, never from `main` alone; this package uses verified-free OD-15 through OD-19 and OD-18 must explicitly reconcile or supersede branch-local collisions |
