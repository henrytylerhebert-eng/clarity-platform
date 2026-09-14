---
status: Living document
owner: TBD
version: 1.3.0
last_integrated: 2026-07-10
last_scoped_append: 2026-07-30
source_artifacts:
  - MASTER_ARCHITECTURE.md limitations; README copy.md "not proof that" list (partial package)
  - docs/06-architecture-review.md risks
  - docs/discovery/SHARED_DRIVE_OPERATING_PATTERN_AUDIT.md
  - docs/discovery/operating-assurance/IDEA_OPPORTUNITY_ASSESSMENT.md
  - docs/discovery/operating-assurance/PLATFORM_INTELLIGENCE_CORPUS_STRATEGY.md
unresolved_conflicts: "Package RISK_REGISTER.md missing — this file re-seeds it"
related_requirements: —
related_adrs: ADR-0001
---

# Risk Register

The 2026-07-29 scoped append added R-13 through R-15. The 2026-07-30 scoped
updates add R-16 through R-20 for Product Intelligence and the historical
corpus strategy. They do not revalidate every legacy row. Current
implementation evidence and accepted ADRs govern when an older mitigation
statement has drifted.

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
| R-13 | Policy, consulting, evidence, or source material crosses a tenant or source-handling boundary through import, storage, retrieval, logs, or outputs | Privacy/security | Critical | Current opportunity is documentation-only and synthetic; any future corpus requires tenant-unreachable partitioning, source controls, and negative isolation tests before build |
| R-14 | Superseded, inapplicable, unlicensed, template, or organization-specific material is treated as current authoritative policy or regulation | Compliance/legal | High | Require exact provenance/version/currentness/reuse rights, qualified applicability review, and a fail-closed `Unknown` state |
| R-15 | A checklist, evidence state, template, score, training record, or closure artifact is represented as compliance, competency, certification, or control effectiveness | Product/compliance | High | Preserve separate evidence states, prohibit aggregate compliance scores, and require qualified approval and closure evidence |
| R-16 | The product duplicates mature policy, GRC, accreditation, LMS, or credentialing suites without proving a consultant-supervised lineage advantage | Product/market | High | Validate the complete lineage and multi-client control plane against incumbent demos before investment |
| R-17 | Consultant approval becomes the new bottleneck and prevents the service from scaling | Operating model | High | Separate client execution, consultant review, and exception escalation; measure consultant touches and queue age |
| R-18 | A knowledge answer omits uncertainty, conflicting versions, missing evidence, or applicability limits and is relied on as authoritative | Product/compliance/security | Critical | Approved tenant sources only, exact citations, fail-closed `Unknown`, human approval, contradiction preservation, and adversarial tests |
| R-19 | Client-confidential, licensed, private, or contract-restricted material is reused across tenants or for shared training without authority | Privacy/contract/IP | Critical | Default client material to tenant-private or quarantined; require rights, purpose, provenance, and deletion controls before any derived or shared use |
| R-20 | Historical plans of correction, policies, findings, or reviewer decisions are learned as universally correct despite stale context, missing outcomes, or selection bias | Product/model safety | High | Preserve version/context/outcome labels, use qualified review and held-out evaluation, and prohibit historical examples from becoming current authority |

## Operating-assurance risk detail

These records use the product-build suite's full risk fields while preserving
the canonical `R-*` namespace. Likelihood remains `Unknown` where no runtime,
user, or market evidence exists.

### R-13 - Tenant or source-boundary disclosure

- **Risk ID:** `R-13`
- **Category:** Privacy/security
- **Evidence:** The source audit found mixed templates, completed records,
  external material, copies, and archived versions. OD-14 already identifies
  tenant retrieval partitioning as unresolved.
- **Likelihood:** Unknown while parked; no corpus or runtime exists.
- **Impact:** Critical cross-organization disclosure, loss of trust, and
  potential privacy, contractual, or licensing harm.
- **Prevention:** Keep discovery synthetic and source-sanitized. Before any
  build, require structurally tenant-unreachable storage/retrieval, explicit
  source rights, restricted audit payloads, and no source text in logs.
- **Detection:** Negative cross-tenant tests, source-provenance review, log and
  export inspection, and independent security/privacy review.
- **Response:** Fail closed, disable the affected path, preserve audit
  evidence, notify the human security owner, and follow the approved incident
  process before reuse.
- **Owner:** Security/privacy owner and technical lead.
- **Related requirements:** Not applicable; no requirements exist.
- **Related decisions/candidates:** OD-6, OD-14, SD-01, SD-03.
- **Related work packages:** Not applicable; no work package is authorized.

### R-14 - Non-authoritative material presented as authority

- **Risk ID:** `R-14`
- **Category:** Compliance/legal
- **Evidence:** The source audit found version ambiguity and mixed external,
  template, completed, archived, and organization-specific artifacts. A
  filename date is not currentness evidence.
- **Likelihood:** Unknown while parked; no direct workflow evidence exists.
- **Impact:** High risk of an incorrect policy, obligation, workflow, or review
  posture being presented with false authority.
- **Prevention:** Require exact source/version/hash, jurisdiction and
  applicability, owner, approval and review dates, supersession, reuse rights,
  and qualified human review. Missing or ambiguous authority must remain
  `Unknown`.
- **Detection:** Currentness and provenance checks, contradiction/supersession
  review, qualified applicability review, and periodic source revalidation.
- **Response:** Withdraw the candidate output, mark it stale or unknown,
  preserve the prior record, route correction to the qualified owner, and
  reassess downstream artifacts.
- **Owner:** Compliance owner with counsel or qualified domain review as
  applicable.
- **Related requirements:** Not applicable; no requirements exist.
- **Related decisions/candidates:** OD-13, OD-14, SD-01, SD-02, SD-07.
- **Related work packages:** Not applicable; no work package is authorized.

### R-15 - Evidence represented as compliance or effectiveness

- **Risk ID:** `R-15`
- **Category:** Product/compliance
- **Evidence:** Clarity already separates readiness dimensions and prohibits
  hidden aggregate scores. The source audit distinguishes an entered checklist
  or evidence record from proof that a control is effective.
- **Likelihood:** Unknown while parked; EXP-OA-01 explicitly tests this
  interpretation risk.
- **Impact:** High risk of false compliance, certification, competency, or
  control-effectiveness claims and unsafe reliance.
- **Prevention:** Keep `Unknown`, `gap`, `under review`, and `evidenced`
  separate; prohibit aggregate compliance scores; bind claims to exact evidence
  and version; require qualified approval and closure evidence.
- **Detection:** Review participant language, generated labels, UI copy,
  exports, and acceptance criteria for prohibited equivalence between evidence
  and compliance.
- **Response:** Remove or relabel the claim, reopen the human review, record the
  contradiction or correction, and block advancement until the boundary is
  restored.
- **Owner:** Product owner and operational/compliance owner.
- **Related requirements:** Not applicable; no requirements exist.
- **Related decisions/candidates:** SD-03, SD-04, SD-06, SD-08, SD-10.
- **Related work packages:** Not applicable; no work package is authorized.

### R-16 - Undifferentiated incumbent overlap

- **Risk ID:** `R-16`
- **Category:** Product/market
- **Evidence:** Official vendor materials show mature healthcare offerings for
  policy lifecycle, standards links, audit evidence, risk, corrective action,
  training, credentialing, and regulatory Q&A. Public pages do not establish
  whether consultant-supervised multi-client lineage is a durable gap.
- **Likelihood:** Medium.
- **Impact:** High risk of investing in a broad replacement suite with weak
  differentiation and high switching cost.
- **Prevention:** Keep the first release to visible lineage and the
  consultant/client operating model. Do not rebuild LMS, credentialing,
  incident-hotline, or replacement-grade policy authoring.
- **Detection:** Structured incumbent demos, buyer interviews, lost-deal
  reasons, willingness-to-switch evidence, and complete-workflow comparisons.
- **Response:** Integrate with or sit above incumbent systems, narrow the
  vertical, or stop if the proposed advantage is not material.
- **Owner:** Product owner and commercial owner.
- **Related requirements:** Not applicable until Product Requirements
  Planning.
- **Related decisions/candidates:** OD-16, SD-01, SD-03, SD-06, SD-10.
- **Related work packages:** Not applicable.

### R-17 - Consultant oversight bottleneck

- **Risk ID:** `R-17`
- **Category:** Operating model
- **Evidence:** The owner requires consultant oversight while seeking scale
  beyond consultant-delivered work. Those goals conflict if every routine
  action requires synchronous consultant approval.
- **Likelihood:** Unknown.
- **Impact:** High; the product could digitize the service while preserving its
  labor ceiling.
- **Prevention:** Separate client execution, consultant review, and
  exception-only escalation; define delegable work and risk-based review
  thresholds.
- **Detection:** Review-queue age, consultant touches per completed cycle,
  client self-service completion, reopened answers, and exception rate.
- **Response:** Simplify the workflow, introduce approved templates and
  delegation, adjust the service model, or narrow the release.
- **Owner:** Consulting operations owner and product owner.
- **Related requirements:** Not applicable until Product Requirements
  Planning.
- **Related decisions/candidates:** OD-15, OD-16.
- **Related work packages:** Not applicable.

### R-18 - Unsafe or falsely authoritative knowledge answer

- **Risk ID:** `R-18`
- **Category:** Product/compliance/security
- **Evidence:** The desired product includes question answering across
  regulation, policy, procedure, and evidence. Those records can be stale,
  conflicting, unlicensed, organization-specific, missing, or outside the
  user's authorization.
- **Likelihood:** Unknown before a runtime exists.
- **Impact:** Critical if an answer is treated as current authority,
  compliance, clinical advice, or legal advice.
- **Prevention:** Restrict answers to approved tenant sources; cite exact
  versions; expose applicability and evidence gaps; preserve contradictions;
  fail closed; require qualified human review before publication.
- **Detection:** Negative tenant tests, stale/superseded-source tests,
  missing-evidence tests, conflicting-source tests, citation verification, and
  independent compliance/security review.
- **Response:** Block or withdraw the answer, mark downstream records for
  review, preserve the audit history, notify the owner, and correct the source
  chain before reuse.
- **Owner:** Product owner, operational/compliance owner, and security owner.
- **Related requirements:** Not applicable until Product Requirements
  Planning.
- **Related decisions/candidates:** OD-14, OD-15, OD-16, SD-01 through SD-03.
- **Related work packages:** Not applicable.

### R-19 - Unauthorized corpus reuse

- **Risk ID:** `R-19`
- **Category:** Privacy/contract/IP
- **Evidence:** The historical collection mixes firm-owned methods, client
  records, completed findings, external sources, licensed material, copies,
  archives, and organization-specific work. The owner identifies the
  collection as a platform-intelligence opportunity, but artifact-level reuse
  rights have not been audited.
- **Likelihood:** Unknown before a corpus inventory and rights review.
- **Impact:** Critical cross-client disclosure, contractual breach, privacy or
  licensing harm, loss of trust, and downstream model contamination.
- **Prevention:** Classify every eligible artifact as firm-owned,
  authoritative-source, tenant-private, permissioned/de-identified,
  evaluation-only, or prohibited. Require purpose-specific rights, client
  authorization where needed, provenance, tenant separation, retention, and
  deletion behavior before use.
- **Detection:** Corpus manifest review, source-to-example lineage, tenant and
  license audits, memorization/leakage tests, deletion verification, and
  independent privacy/legal review.
- **Response:** Quarantine the source and every derived example, disable the
  affected intelligence path, preserve audit evidence, execute approved
  deletion/correction procedures, and reassess any downstream model or output.
- **Owner:** Product owner, security/privacy owner, and legal/contract owner.
- **Related requirements:** Not applicable until Product Requirements
  Planning.
- **Related decisions/candidates:** OD-14, OD-16, OD-17, SD-01 through SD-10.
- **Related work packages:** Not applicable.

### R-20 - Historical examples learned as universal truth

- **Risk ID:** `R-20`
- **Category:** Product/model safety
- **Evidence:** Historical policies, findings, plans of correction, and closure
  records are version-specific, context-specific human outputs. Approval,
  implementation, recurrence, and outcome labels may be missing, and a
  historically accepted action may no longer be current or generally
  applicable.
- **Likelihood:** High if raw files are used without normalization and
  adjudication.
- **Impact:** High risk of stale, biased, ineffective, or inapplicable logic
  being presented as a recommended action or current authority.
- **Prevention:** Preserve source/version/as-of/applicability context, reviewer
  authority, approval state, outcome and recurrence labels, supersession, and
  uncertainty. Use historical plans primarily for structure unless qualified
  outcome evidence supports stronger use. Report corpus coverage by tenant,
  segment, year, workflow stage, reviewer, outcome, and support/gap/conflict/
  failed-closure state.
- **Detection:** Temporal holdout evaluation, stale/superseded and conflict
  tests, near-duplicate and case-family leakage checks, distribution-skew
  review, expert adjudication, outcome/closure checks, and comparison against
  current authority at retrieval time.
- **Response:** Withdraw or relabel the pattern, mark affected outputs for
  review, correct the corpus lineage, and re-evaluate downstream behavior
  before reuse.
- **Owner:** Operational/compliance owner, product owner, and model/evaluation
  owner.
- **Related requirements:** Not applicable until Product Requirements
  Planning.
- **Related decisions/candidates:** OD-13, OD-14, OD-15, OD-17, SD-01 through
  SD-10.
- **Related work packages:** Not applicable.
