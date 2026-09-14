---
status: Living document
owner: TBD
version: 1.4.0
last_integrated: 2026-07-10
last_scoped_append: 2026-07-30
source_artifacts:
  - docs/06-architecture-review.md (Jul 8 findings + unknowns)
  - docs/repository-audit/03_CONFLICT_REGISTER.md, 03_GAP_ANALYSIS.md
  - docs/discovery/SHARED_DRIVE_OPERATING_PATTERN_AUDIT.md
  - docs/discovery/operating-assurance/IDEA_OPPORTUNITY_ASSESSMENT.md
  - docs/discovery/operating-assurance/PLATFORM_INTELLIGENCE_CORPUS_STRATEGY.md
unresolved_conflicts: "Package 18-open-decisions-and-risks/OPEN_DECISIONS.md missing — this file re-seeds it"
related_requirements: —
related_adrs: ADR-0001, ADR-0002
---

# Open Decisions

The 2026-07-29 scoped append added OD-15. The 2026-07-30 scoped updates record
its bounded resolution for Product Intelligence and Product Requirements
Planning, recognize the longitudinal operating-method evidence, and add OD-16
and OD-17. They do not revalidate every legacy row. Where an older row
conflicts with current implementation evidence, `IMPLEMENTATION_STATUS.md` and
the most specific accepted ADR govern.

| # | Decision needed | Owner type | Blocking |
|---|---|---|---|
| OD-1 | Obtain the full master package v0.2.0 (72 files missing); re-run comparison for 12 summary-graded domains | Product owner | Canonical status of agent/API/UI/eval/commercial domains |
| OD-2 | Louisiana statutory wording, official forms, trigger/duration language | Counsel | Any legal-clock or instrument enforcement |
| OD-3 | Clinical criteria licensing (InterQual/MCG or payer-specific) and clinician governance of assessment content | Clinical + legal | Medical-necessity criteria mapping |
| OD-4 | Product naming: "Clarity", "Clarity MH", "Clarity AI", "Clarity Crisis Platform" all appear; pick one | Product owner | Branding in docs/UI |
| OD-5 | Reconcile the accepted Fastify direction in `packages/api-service` with the implemented `node:http` spike; separately approve the production API boundary, hosting, and deployment | Product owner + tech lead | Additional HTTP routes and production API deployment |
| OD-6 | Database hosting + RLS strategy (recommended posture accepted; provider/session and security details remain); see [OD-6 provider and RLS decision packet](OD-6_PROVIDER_AND_RLS_DECISION_PACKET.md) | Tech lead + security | Provider-backed migrations, tenancy tests, and security review |
| OD-7 | pnpm/Turborepo migration timing (deferred by ADR-0001) | Tech lead | None immediately |
| OD-8 | Expanded 43-model schema adoption path (which models graduate when) | Tech lead | ADR-0002 follow-up |
| OD-9 | Node version pin + formatter + test/lint/typecheck/build CI; lint/typecheck exist and Pages deploys docs only | Tech lead | Stage-1 completion and reproducible release gates |
| OD-10 | The 7 missing synthetic cases (recreate vs. obtain) | Product owner | Evaluation coverage |
| OD-11 | Payer criteria packs and facility authorization rules (unknown in both generations) | Revenue cycle | Benefits/auth workflows beyond schema |
| OD-12 | Baseline operational measurements (transfer timing, acceptance rate, packet completeness) | Product owner | ROI claims, pilot design |
| OD-13 | CMS/Medicare/Medicaid regulatory reference acquisition: whether to execute the Phase 1 deep research prompt (`docs/legal/GEMINI_DEEP_RESEARCH_PROMPT_CMS_MEDICARE_MEDICAID.md`), and who reviews its output before any of it informs a rule | Product owner + counsel (OD-2) + clinical (OD-3) | Any regulatory grounding for readiness, authorization, transfer, or consent logic |
| OD-14 | Per-organization AI-native policy & procedure index (Phase 2); see [org policy index decision packet](ORG_POLICY_INDEX_DECISION_PACKET.md). Unresolved: tenant-safe retrieval partitioning, reference-vs-authority scope, FDA CDS implications, who authors default interpretations, version staleness | Product owner + tech lead + counsel | Controlled extraction and AI-agent steps of the build sequence |
| OD-15 (resolved through Product Intelligence 2026-07-30) | Client-operated, consultant-supervised authority-to-evidence-to-closure workflow; client compliance/quality/program owner is the primary day-to-day user; qualified humans retain applicability and compliance decisions | Product owner + operational/compliance owner | Product definition passed; client-operated software validation and baseline measurement remain required before pilot/software-value claims |
| OD-16 | Product home and boundary: separate adjacent operating-assurance product versus Clarity module; recommendation is separate product with selective reuse of proven patterns | Product owner + tech lead + security | Execution Architecture, repository selection, contract reuse, and implementation |
| OD-17 | Historical consulting-corpus permitted-use model: firm-owned, tenant-private, permissioned derived, evaluation-only, shared training, or prohibited | Product owner + legal/contracts + privacy/security + operational/compliance owner | Any content-level corpus ingestion, cross-client learning, shared training, retrieval, or model implementation |

## OD-15 detail - operating-assurance discovery focus

- **Decision ID:** `OD-15`
- **Question:** Which one bounded operating-assurance job, user/context, and
  target outcome should be tested first, and may it enter Product Intelligence
  after discovery?
- **Why it matters:** The source-pattern audit supports a plausible connected
  workflow, but it does not establish the primary user, frequency, severity,
  product fit, measurable value, or preferred alternative.
- **Options:**
  1. Leave all candidates parked and run no discovery.
  2. Run the documentation-only SD-01 + SD-03 synthetic policy-review
     walkthrough described by EXP-OA-01.
  3. Select a different single candidate only after direct user evidence shows
     it is a better first learning target.
- **Evidence:** The shared-drive operating-pattern audit and current repository
  fit are documented. Direct user validation and baseline/outcome measurements
  are absent. `No measurements found`.
- **Historical recommendation, superseded for the Product Intelligence route
  on 2026-07-30:** Option 2, only after a named policy/process owner, SOP user,
  and independent evidence reviewer are confirmed. The current resolution
  below permits bounded product definition while preserving the experiment as
  a prerequisite for pilot, adoption, usability, or measurable-value claims.
- **Confidence:** Medium for discovery sequencing; low for product value until
  the walkthrough runs.
- **Owner:** Tyler Hebert/product owner with an operational/compliance owner.
- **Required by:** Resolved through Product Intelligence. Direct participant
  evidence remains required before a pilot or client-operated software
  value/status claim for SD-01 through SD-10.
- **Blocking status:** Does not block Product Requirements Planning. It
  continues to block pilot and validated software-value claims; it does not
  block current Clarity roadmap work.
- **Downstream impact:** The operating-assurance idea assessment, any future
  Product Intelligence brief, and OD-14 if SD-01 later reaches organization-
  policy retrieval or indexing.

### OD-15 resolution - 2026-07-30

- **Selected user/context:** Client-side compliance, quality, or program owner
  operating one organization/facility workspace, with an assigned consultant
  providing configuration, oversight, review, and approval.
- **Selected job:** Answer one survey-readiness or operating-assurance question
  by tracing exact authority/version to current policy, SOP, one evidence
  response, human review, and an explicit answer or gap.
- **Target outcome:** A source-linked, human-reviewed answer or explicit
  `Unknown`/gap. Corrective-action and closure management remain part of the
  longer product thesis, not the minimum first-release outcome.
- **Authority posture:** Reference and provenance support only. Qualified
  humans decide applicability, interpretation, compliance, clinical, and legal
  conclusions.
- **Required reviewers:** Product owner and operational/compliance reviewer;
  security/privacy and technical reviewers before any real-data or runtime
  design; counsel or clinical review when content requires it.
- **Success criteria:** Exact lineage is visible; missing evidence remains
  explicit; consultant review is preserved; both an answer and an explicit-gap
  branch are valid completion; no cross-tenant or false-compliance output is
  required.
- **Stop criteria:** The workflow requires unlicensed/protected material,
  autonomous compliance interpretation, cross-tenant access, or maintenance
  burden that participants judge greater than the coordination value.
- **Evidence limit:** EXP-OA-01 was not run and no baseline exists. This
  resolution authorizes Product Intelligence and a proposed release boundary,
  not pilot, implementation, or product-value claims.
- **Longitudinal evidence update:** The owner reports that the tools,
  workflows, evidence methods, and plans of correction have been used since
  2020 while building the business. The dated recurring corpus corroborates
  method adoption and practical service value. It does not prove
  client-operated software adoption, software ROI, or permission to use every
  historical artifact for shared training.
- **Status:** Resolved through Product Intelligence; product definition passed
  for Product Requirements Planning.

## OD-16 detail - operating-assurance product home

- **Decision ID:** `OD-16`
- **Question:** Should the operating-assurance product be implemented as a
  Clarity module, an adjacent product sharing selected primitives, or a fully
  separate product and repository?
- **Why it matters:** Clarity's governing object is a patient/referral case.
  Operating assurance governs organization/facility authority, policies, SOPs,
  evidence, actions, and multi-client consultant oversight.
- **Options:**
  1. Extend Clarity directly.
  2. Create a separate adjacent product and selectively reuse proven patterns.
  3. Create a fully independent product with no planned reuse.
- **Evidence:** The workflows, users, buyer, tenancy structure, and governing
  records differ. Clarity's document and evidence contracts are case-oriented,
  though its versioning, evidence review, audit, and fail-closed patterns may
  be useful.
- **Recommendation:** Option 2. Keep product identity and domain contracts
  separate; evaluate reuse during Execution Architecture.
- **Confidence:** High for product separation; medium for future technical
  reuse.
- **Owner:** Tyler Hebert with technical and security owners.
- **Required by:** Before Execution Architecture.
- **Blocking status:** Does not block product definition or first-release
  scoping. Blocks repository, schema, service, integration, and implementation
  decisions.
- **Downstream impact:** Product Intelligence brief, first-release scope,
  repository selection, tenancy design, contract catalog, and any future ADR.

## OD-17 detail - historical consulting corpus use

- **Decision ID:** `OD-17`
- **Question:** Which historical consulting artifacts may be used for
  firm-wide product logic, tenant-private retrieval, de-identified expert
  demonstrations, held-out evaluation, shared model training, or no use?
- **Why it matters:** The longitudinal collection is a valuable record of
  evidence workflows, findings, plans of correction, human review, closure,
  and change. It also mixes firm-owned methods, client-confidential records,
  licensed sources, personal information, stale versions, and outputs whose
  correctness or outcome is not established.
- **Options:**
  1. Use only generic field and workflow patterns; no historical content.
  2. Create a governed tiered corpus with purpose-specific rights,
     tenant-private boundaries, de-identified/permissioned examples, and a
     held-out human-reviewed evaluation set.
  3. Treat the full historical collection as shared training data.
- **Evidence:** Owner-reported use since 2020; dated 2019-2026 artifacts;
  recurring delivery structures; 3,121 operating assets; 1,476 delivery
  assets; and the source audit's provenance, privacy, licensing, and
  currentness warnings.
- **Recommendation:** Option 2. Use the corpus first for ontology, workflow
  logic, templates, synthetic cases, and evaluation. Permit tenant-private
  retrieval or shared training only after the relevant content tier passes
  rights, privacy, licensing, provenance, and safety review.
- **Confidence:** High that a tiered model is required; unknown which
  individual artifacts qualify until a content-level eligibility audit.
- **Owner:** Tyler Hebert with legal/contract, privacy/security, and
  operational/compliance reviewers.
- **Required by:** Before live corpus ingestion, tenant retrieval,
  de-identification, shared examples, embeddings, training, fine-tuning, or
  model evaluation using historical content.
- **Blocking status:** Does not block Product Requirements Planning. Blocks
  corpus architecture, content processing, model work, and implementation.
- **Downstream impact:** Corpus manifest, data classification, tenancy,
  retention/deletion, model/evaluation strategy, source contracts, acceptance
  criteria, and incident/correction procedures.
