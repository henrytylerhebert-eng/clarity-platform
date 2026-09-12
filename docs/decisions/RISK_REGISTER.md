---
status: Living document
owner: TBD
version: 1.4.0
last_integrated: 2026-07-10
last_scoped_reconciliation: 2026-09-12
source_artifacts:
  - MASTER_ARCHITECTURE.md limitations; README copy.md "not proof that" list (partial package)
  - docs/06-architecture-review.md risks
  - docs/discovery/operating-assurance/README.md
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
| R-15 | Existing bridge artifacts are mistaken for authenticated operating authority | Governance | High | ADR-0017 retires the model; OD-21 covers held physical quarantine. Files remaining on disk do not authorize dispatch. |
| R-16 | Parallel work reviews changing contracts against different baselines | Coordination | High | PR #32 has merged; the old open-PR claim is historical. Freeze actual base/head and review shared-surface overlap for any new slice. |
| R-17 | Recovered governance proposals are mistaken for current accepted policy | Governance/coordination | Critical | ADR-0017/merged PR #33 govern; OD-23 holds proposed DEV-R1 amendments. Keep historical source status distinct from approval. |
| R-18 | Expected prescreen transition errors receive unintended HTTP status | API/compatibility | High | Retain the July issue as a review target; current service/API tests and error mapping need a scoped rerun before claiming either an open defect or its resolution. |
| R-19 | A blind replay sees later fixes, gold labels, or answer-bearing metadata | Evaluation integrity | Critical | Proposed DEV-R1 runner must isolate synthetic history, deny network/writes, hash sanitized context, and keep scoring keys outside readable scope before approval. |
| R-20 | Case-reference ownership differs between prescreen adapters | Security/tenancy | Critical | Phase 3 persistence is now wired; assess in-memory and Prisma paths separately. July findings do not by themselves establish current runtime exposure or resolution. |
| R-21 | Medical-diversion topology is read as clinically approved role policy | Clinical/authorization | High | OD-24 retains qualified role authority; current command roles and ADR-0018 do not establish clinical approval. |
| R-22 | Recovery of an old worktree overwrites newer accepted status or decisions | Documentation/coordination | High | Recover on current main, preserve dated records, append reconciled content, and verify Rev Ops OD-15–17 plus newer roadmap evidence survive. |
| R-23 | Broad older PR #30 work is merged as routine housekeeping | Scope/coordination | Critical | The lane remains open and held; split/disposition its product, bridge, and status scope separately. No acceptance is implied by documentation recovery. |
| R-24 | Decision IDs refer to different questions across historical branches | Governance/traceability | Critical | The recovery mapping assigns governance OD-20–24 while preserving current Rev Ops OD-15–17 and workbook OD-18/OD-19; migrate cross-references atomically and retain original branch provenance. |
| R-25 | Policy, consulting, evidence, or source material crosses a tenant or source-handling boundary through import, storage, retrieval, logs, or outputs | Privacy/security | Critical | Current opportunity is documentation-only and synthetic; any future corpus requires tenant-unreachable partitioning, source controls, and negative isolation tests before build |
| R-26 | Superseded, inapplicable, unlicensed, template, or organization-specific material is treated as current authoritative policy or regulation | Compliance/legal | High | Require exact provenance/version/currentness/reuse rights, qualified applicability review, and a fail-closed `Unknown` state |
| R-27 | A checklist, evidence state, template, score, training record, or closure artifact is represented as compliance, competency, certification, or control effectiveness | Product/compliance | High | Preserve separate evidence states, prohibit aggregate compliance scores, and require qualified approval and closure evidence |
| R-28 | The product duplicates mature policy, GRC, accreditation, LMS, or credentialing suites without proving a consultant-supervised lineage advantage | Product/market | High | Validate the complete lineage and multi-client control plane against incumbent demos before investment |
| R-29 | Consultant approval becomes the new bottleneck and prevents the service from scaling | Operating model | High | Separate client execution, consultant review, and exception escalation; measure consultant touches and queue age |
| R-30 | A knowledge answer omits uncertainty, conflicting versions, missing evidence, or applicability limits and is relied on as authoritative | Product/compliance/security | Critical | Approved tenant sources only, exact citations, fail-closed `Unknown`, human approval, contradiction preservation, and adversarial tests |
| R-31 | Client-confidential, licensed, private, or contract-restricted material is reused across tenants or for shared training without authority | Privacy/contract/IP | Critical | Default client material to tenant-private or quarantined; require rights, purpose, provenance, and deletion controls before any derived or shared use |
| R-32 | Historical plans of correction, policies, findings, or reviewer decisions are learned as universally correct despite stale context, missing outcomes, or selection bias | Product/model safety | High | Preserve version/context/outcome labels, use qualified review and held-out evaluation, and prohibit historical examples from becoming current authority |

## Recovered risk provenance

R-13 through R-24 derive from the July agent-readiness proposal. The
[2026-09-12 recovery disposition](../developer-handoff/GOVERNANCE_DOCUMENT_RECOVERY_2026-09-12.md)
separates current source inspection, historical findings, resolved PR state,
and remaining human decisions. These entries do not convert historical test
failures into fresh measurements or establish production exposure.

## Historical operating-assurance risk detail

The following source-derived risk detail is scoped to the paused operating-
assurance proposal. It records July evidence and assumptions, not a runtime
or a newly validated corpus. See the recovery index for verification limits.


These records use the product-build suite's full risk fields while preserving
the canonical `R-*` namespace. Likelihood remains `Unknown` where no runtime,
user, or market evidence exists.

### R-25 - Tenant or source-boundary disclosure

- **Risk ID:** `R-25`
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

### R-26 - Non-authoritative material presented as authority

- **Risk ID:** `R-26`
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

### R-27 - Evidence represented as compliance or effectiveness

- **Risk ID:** `R-27`
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

### R-28 - Undifferentiated incumbent overlap

- **Risk ID:** `R-28`
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
- **Related decisions/candidates:** OD-26, SD-01, SD-03, SD-06, SD-10.
- **Related work packages:** Not applicable.

### R-29 - Consultant oversight bottleneck

- **Risk ID:** `R-29`
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
- **Related decisions/candidates:** OD-25, OD-26.
- **Related work packages:** Not applicable.

### R-30 - Unsafe or falsely authoritative knowledge answer

- **Risk ID:** `R-30`
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
- **Related decisions/candidates:** OD-14, OD-25, OD-26, SD-01 through SD-03.
- **Related work packages:** Not applicable.

### R-31 - Unauthorized corpus reuse

- **Risk ID:** `R-31`
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
- **Related decisions/candidates:** OD-14, OD-26, OD-27, SD-01 through SD-10.
- **Related work packages:** Not applicable.

### R-32 - Historical examples learned as universal truth

- **Risk ID:** `R-32`
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
- **Related decisions/candidates:** OD-13, OD-14, OD-25, OD-27, SD-01 through
  SD-10.
- **Related work packages:** Not applicable.
