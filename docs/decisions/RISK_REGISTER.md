---
status: Living document
owner: TBD
version: 1.0.0
last_integrated: 2026-07-10
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
| R-3 | Real PHI enters the prototype | Privacy | Critical | Synthetic-only rule, README banners, no backend; formal controls unimplemented |
| R-4 | Benefits quotes read as payment guarantees | Payer/financial | High | Disclaimer contract + test; UI enforcement pending |
| R-5 | Payer-weighted prioritization creeps into clinical ranking | Fairness | High | Separate-readiness contract + test; no combined score |
| R-6 | Missing 72 package files → decisions made on summaries later contradicted by full specs | Architecture | High | All summary-graded domains flagged; OD-1 |
| R-7 | Schema drift between foundation (canonical) and expanded draft (target) | Architecture | Medium | ADR-0002 adoption path; expanded draft preserved |
| R-8 | Sensitive identifiers leak into logs/audit | Privacy/security | High | Restricted-field rule + audit-payload test; no runtime logging exists yet |
| R-9 | Describing HIPAA controls mistaken for having them | Compliance | High | Honesty notes in SECURITY_AND_PRIVACY and IMPLEMENTATION_STATUS |
| R-10 | Prototype demo logic (clocks, bedboard heuristics) reused as production truth | Clinical/ops | Medium | Demo-value labels in app README; parking-lot discipline |
| R-11 | Business-sensitive spreadsheet pushed to a public remote | Business | Medium | No remote configured; never push without review; consider git-crypt or removal before any remote |
| R-12 | Single-contributor knowledge concentration; no CI safety net | Delivery | Medium | OD-9 (CI), audit trail in docs/repository-audit/ |
