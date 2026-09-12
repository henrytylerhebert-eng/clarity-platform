---
status: Living document
owner: TBD
version: 1.0.0
last_integrated: 2026-07-10
last_scoped_reconciliation: 2026-09-12
source_artifacts:
  - MASTER_ARCHITECTURE.md limitations; README copy.md "not proof that" list (partial package)
  - docs/06-architecture-review.md risks
unresolved_conflicts: "Package RISK_REGISTER.md missing — this file re-seeds it"
related_requirements: —
related_adrs: ADR-0001
---

# Risk Register

| # | Risk | Category | Severity | Mitigation state |
|---|---|---|---|---|
| R-1 | Statutory logic enforced from unverified Louisiana wording | Legal | Critical | Non-enforcement rule in docs; counsel review gate (OD-2) |
| R-2 | Clinical drafts read as determinations | Clinical | Critical | Prohibited-language guard implemented + tested; human gates documented |
| R-3 | Real PHI enters the prototype or service foundations | Privacy | Critical | Synthetic-only boundary remains; implemented backend/authentication paths do not establish PHI readiness |
| R-4 | Benefits quotes read as payment guarantees | Payer/financial | High | Disclaimer contract + test; UI enforcement pending |
| R-5 | Payer-weighted prioritization creeps into clinical ranking | Fairness | High | Separate-readiness contract + test; no combined score |
| R-6 | Missing 72 package files → decisions made on summaries later contradicted by full specs | Architecture | High | All summary-graded domains flagged; OD-1 |
| R-7 | Schema drift between foundation (canonical) and expanded draft (target) | Architecture | Medium | ADR-0002 adoption path; expanded draft preserved |
| R-8 | Sensitive identifiers leak into logs/audit | Privacy/security | High | Restricted-field and audit controls exist; runtime API code is present, so logging/export paths require scoped source review and security evidence rather than a no-runtime assumption |
| R-9 | Describing HIPAA controls mistaken for having them | Compliance | High | Honesty notes in SECURITY_AND_PRIVACY and IMPLEMENTATION_STATUS |
| R-10 | Prototype demo logic (clocks, bedboard heuristics) reused as production truth | Clinical/ops | Medium | Demo-value labels in app README; parking-lot discipline |
| R-11 | Business-sensitive material exposed through the configured remote | Business | Medium | Git origin exists; inspect intended tracked content and repository visibility before publishing sensitive artifacts; never commit secrets or private source data |
| R-12 | Knowledge concentration and stale handoffs | Delivery | Medium | `.github/workflows/ci.yml` supplies a verify job; current run status and independent review remain separate evidence, with reproducibility tracked in OD-9 |
| R-13 | A worktree validates another checkout or shared database ledger | Build/integrity | High | July source reports this failure; current run status remains unverified. Record actual dependency paths and migration ledger for each relevant run under OD-9. |
| R-14 | Delimiter-joined composite keys alias across tenants or actors | Security/tenancy | Critical | The in-memory prescreen adapter still joins the idempotency tuple with `:` at source `35f16eb`; inspect allowed inputs and regression evidence in a separate implementation slice. Do not infer the Prisma adapter shares this key representation. |
| R-15 | Existing bridge artifacts are mistaken for authenticated operating authority | Governance | High | ADR-0017 retires the model; OD-19 covers held physical quarantine. Files remaining on disk do not authorize dispatch. |
| R-16 | Parallel work reviews changing contracts against different baselines | Coordination | High | PR #32 has merged; the old open-PR claim is historical. Freeze actual base/head and review shared-surface overlap for any new slice. |
| R-17 | Recovered governance proposals are mistaken for current accepted policy | Governance/coordination | Critical | ADR-0017/merged PR #33 govern; OD-21 holds proposed DEV-R1 amendments. Keep historical source status distinct from approval. |
| R-18 | Expected prescreen transition errors receive unintended HTTP status | API/compatibility | High | Retain the July issue as a review target; current service/API tests and error mapping need a scoped rerun before claiming either an open defect or its resolution. |
| R-19 | A blind replay sees later fixes, gold labels, or answer-bearing metadata | Evaluation integrity | Critical | Proposed DEV-R1 runner must isolate synthetic history, deny network/writes, hash sanitized context, and keep scoring keys outside readable scope before approval. |
| R-20 | Case-reference ownership differs between prescreen adapters | Security/tenancy | Critical | Phase 3 persistence is now wired; assess in-memory and Prisma paths separately. July findings do not by themselves establish current runtime exposure or resolution. |
| R-21 | Medical-diversion topology is read as clinically approved role policy | Clinical/authorization | High | OD-22 retains qualified role authority; current command roles and ADR-0018 do not establish clinical approval. |
| R-22 | Recovery of an old worktree overwrites newer accepted status or decisions | Documentation/coordination | High | Recover on current main, preserve dated records, append reconciled content, and verify Rev Ops OD-15–17 plus newer roadmap evidence survive. |
| R-23 | Broad older PR #30 work is merged as routine housekeeping | Scope/coordination | Critical | The lane remains open and held; split/disposition its product, bridge, and status scope separately. No acceptance is implied by documentation recovery. |
| R-24 | Decision IDs refer to different questions across historical branches | Governance/traceability | Critical | The recovery mapping assigns governance OD-18–22 while preserving current Rev Ops OD-15–17; migrate cross-references atomically and retain original branch provenance. |

## Recovered risk provenance

R-13 through R-24 derive from the July agent-readiness proposal. The
[2026-09-12 recovery disposition](../developer-handoff/GOVERNANCE_DOCUMENT_RECOVERY_2026-09-12.md)
separates current source inspection, historical findings, resolved PR state,
and remaining human decisions. These entries do not convert historical test
failures into fresh measurements or establish production exposure.
