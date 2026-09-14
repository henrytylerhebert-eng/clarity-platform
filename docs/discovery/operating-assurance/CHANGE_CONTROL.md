---
status: In review
owner: Tyler Hebert
version: 0.4.0
date: 2026-07-30
suite: product-build-skill-suite@1.0.0
stage: product-intelligence
data_boundary: Documentation-only; synthetic and source-sanitized material
---

# Operating Assurance Change Control

This record applies the suite's change-control template to the current
discovery run. It does not change the canonical roadmap disposition.

## CHG-OA-01 - Route a broad skill-suite request through one legal stage

- **Change ID:** `CHG-OA-01`
- **Discovery:** The request names ten useful candidates and asks to run the
  product-build suite, while also stating that every candidate is parked and
  implementation is not authorized.
- **Evidence:** The owner-restated parking-lot boundary; the source-pattern
  audit; the canonical roadmap; and the suite orchestrator's rule to select
  exactly one primary next skill.
- **Source stage:** `idea-opportunity-assessment`
- **Product impact:** Reframes the work as one opportunity hypothesis and one
  smallest learning plan. It does not create a feature, requirement, or
  architecture.
- **User impact:** Produces questions and a synthetic walkthrough for future
  validation; no user-facing behavior changes.
- **Requirement impact:** None. Requirements do not yet exist.
- **Technical impact:** None. No schema, contract, API, UI, ingestion,
  retrieval, integration, or test behavior changes.
- **Data impact:** Synthetic/source-sanitized documents only; no Drive import
  or client records.
- **Security impact:** Avoids introducing policy corpora or tenant retrieval
  before OD-14 and security review.
- **Operational impact:** Requires a named policy/process owner, SOP user, and
  evidence reviewer before the learning plan can run.
- **Dependency impact:** Adds OD-15 as the decision that gates this opportunity
  from discovery to Product Intelligence. OD-14 remains scoped to the future
  organization-policy index.
- **Recommendation:** Accept the documentation-only opportunity assessment and
  keep SD-01 through SD-10 parked. Run only EXP-OA-01 after the named human
  participants are confirmed.
- **Decision owner:** Tyler Hebert, with operational/compliance review.
- **Approval required:** Yes, before Product Intelligence or any status
  promotion.
- **Blocking status:** Does not block this assessment; blocks every later
  lifecycle transition.
- **Artifacts to update:** This scoped project state, the opportunity
  assessment, OD-15, and R-13 through R-15. No new roadmap item is required.

## CHG-OA-02 - Preserve the canonical risk namespace

- **Change ID:** `CHG-OA-02`
- **Discovery:** The existing organization-policy decision packet used local
  headings `R1` through `R5`, which can be confused with the canonical
  repository risk register.
- **Evidence:** `docs/decisions/RISK_REGISTER.md` owns the canonical `R-*`
  namespace.
- **Source stage:** `idea-opportunity-assessment`
- **Product impact:** None; wording and traceability correction only.
- **User impact:** None.
- **Requirement impact:** None.
- **Technical impact:** None.
- **Data impact:** None.
- **Security impact:** Makes the tenant-leakage concern easier to map to
  canonical R-13.
- **Operational impact:** Reduces ambiguity during future review.
- **Dependency impact:** Local packet headings become `Concern A` through
  `Concern E`; canonical risks remain R-13 through R-15.
- **Recommendation:** Apply the namespace-only correction without changing the
  packet's meaning.
- **Decision owner:** Repository governance owner.
- **Approval required:** No product decision; documentation consistency only.
- **Blocking status:** Non-blocking.
- **Artifacts to update:**
  `docs/decisions/ORG_POLICY_INDEX_DECISION_PACKET.md`.

## CHG-OA-03 - Advance from broad discovery to bounded product definition

- **Change ID:** `CHG-OA-03`
- **Discovery:** After reviewing the operating pattern, client mix, and scope
  mix, the product owner directed the work to product definition and
  first-release scoping, explicitly excluding further broad ideation and full
  implementation.
- **Evidence:** Owner direction on 2026-07-30; the source-pattern audit; the
  anonymized current-portfolio census; the survey-activity ledger; and the
  existing opportunity assessment.
- **Source stage:** `idea-opportunity-assessment`
- **Product impact:** Selects one product opportunity: a client-operated,
  consultant-supervised operating-assurance workspace. It does not accept a
  technical architecture or implementation home.
- **User impact:** Names a client compliance/quality/program owner as the
  primary day-to-day user and the assigned consultant as the oversight user.
- **Requirement impact:** Authorizes only a proposed first-release boundary.
  Formal `REQ`, work-package, and implementation records remain prohibited
  until Product Intelligence is accepted and Product Requirements Planning is
  legally entered.
- **Technical impact:** None. Existing Clarity contracts remain unchanged and
  case-oriented.
- **Data impact:** Analysis and artifacts remain anonymized,
  source-sanitized, and documentation-only.
- **Security impact:** Retains fail-closed authority, tenant separation, and no
  real client-content ingestion.
- **Operational impact:** Converts the consulting delivery model into the
  product operating model: client execution with consultant supervision.
- **Dependency impact:** Resolves OD-15 for Product Intelligence. OD-14 and the
  product-home decision still block retrieval design and implementation.
- **Recommendation:** Accept the opportunity handoff, run a bounded Product
  Intelligence pass, and present one proposed first-release vertical slice for
  owner review.
- **Decision owner:** Tyler Hebert.
- **Approval required:** Satisfied on 2026-07-30 by the owner's product-value
  and longitudinal-use decision.
- **Blocking status:** No longer blocks Product Requirements Planning.
  Architecture and implementation remain separately blocked.
- **Artifacts to update:** Opportunity assessment, project state, OD-15,
  Product Intelligence brief, first-release scope proposal, and stage handoff.

## CHG-OA-04 - Keep the proposed product separate from Clarity implementation

- **Change ID:** `CHG-OA-04`
- **Discovery:** Clarity's canonical product is behavioral-health crisis-access
  case coordination, while the new opportunity governs organization-level
  operating assurance across hospitals, behavioral-health facilities, rural
  health clinics, and specialty settings.
- **Evidence:** Clarity README and repository contracts; portfolio-mix
  analysis; the source-pattern audit; and the product owner's
  consultant/client operating-model direction.
- **Source stage:** `product-intelligence`
- **Product impact:** Recommends a separate adjacent product boundary with
  selective reuse of proven patterns, not silent expansion of Clarity's case
  product.
- **User impact:** Avoids forcing client compliance work into patient/referral
  case concepts.
- **Requirement impact:** The first-release scope may describe conceptual
  capabilities but may not assume current Clarity contracts satisfy them.
- **Technical impact:** Repository and architecture home remain undecided.
- **Data impact:** Prevents organization-policy and evidence records from being
  silently attached to the patient/referral case model.
- **Security impact:** Requires an independent organization/facility tenancy
  review before any implementation.
- **Operational impact:** Preserves the consulting firm's multi-client control
  plane as a first-class product need.
- **Dependency impact:** Creates OD-16, which blocks Execution Architecture but
  not product definition or first-release scoping.
- **Recommendation:** Treat the present Clarity worktree as a temporary
  discovery and governance location only.
- **Decision owner:** Tyler Hebert with technical and security owners.
- **Approval required:** Yes, before Execution Architecture.
- **Blocking status:** Non-blocking for Product Intelligence; blocking for
  technical design or implementation.
- **Artifacts to update:** Product Intelligence brief, first-release scope
  proposal, project state, and open decisions.

## CHG-OA-05 - Narrow the first release to a reviewed answer or explicit gap

- **Change ID:** `CHG-OA-05`
- **Discovery:** The initial first-release draft combined multi-client
  administration, authority and policy control, evidence workflow, Q&A,
  corrective action, closure, change propagation, and export. It crossed from
  Product Intelligence into premature requirements and platform design.
- **Evidence:** Independent suite-stage and product critique; the owner's
  instruction to define and scope rather than implement; and the absence of
  client-operated software and incumbent-workflow evidence. CHG-OA-06 later
  clarified that the consulting method itself has longitudinal value evidence.
- **Source stage:** `product-intelligence`
- **Product impact:** Keeps the broader operating-assurance loop as the product
  thesis while narrowing the first release to one facility, three actors,
  pre-seeded immutable references, one descriptive question, one evidence
  response, and one reviewed answer or explicit gap.
- **User impact:** Tests whether the client can operate the core job and the
  consultant can review it without requiring the full multi-client control
  plane.
- **Requirement impact:** Removes requirement, acceptance-criteria,
  nonfunctional-requirement, vertical-slice, and work-package content. Those
  artifacts remain prohibited until Product Requirements Planning.
- **Technical impact:** None. No architecture, contract, schema, API, UI, or
  implementation choice is made.
- **Data impact:** Uses only synthetic or source-sanitized references and
  evidence.
- **Security impact:** Preserves scoped access, explicit source ownership,
  fail-closed answers, and no client-content reuse.
- **Operational impact:** A gap is a valid completion branch. Corrective-action
  closure is not required to demonstrate first value.
- **Dependency impact:** The original pre-PRD walkthrough condition is
  superseded by CHG-OA-06. The role-based walkthrough, adversarial replay, and
  incumbent/current-tool comparison now become validation gates to define in
  Product Requirements Planning.
- **Recommendation:** Accept the narrower release hypothesis for validation.
- **Decision owner:** Tyler Hebert with an operational/compliance reviewer.
- **Approval required:** Satisfied for Product Requirements Planning by
  CHG-OA-06.
- **Blocking status:** Product definition passed; implementation remains
  prohibited.
- **Artifacts to update:** Product Intelligence brief, first-release scope
  proposal, handoff, repository state, and project state.

## CHG-OA-06 - Recognize longitudinal method adoption and the intelligence corpus

- **Change ID:** `CHG-OA-06`
- **Discovery:** The owner clarified that the consulting tools, evidence
  workflows, and plans of correction have been used since 2020 while building
  the business, and that the historical material is intended to inform
  platform logic and intelligence.
- **Evidence:** Owner statement on 2026-07-30; dated 2019-2026 artifact history;
  recurring annual/version cycles; 91 current-labeled engagement-like units;
  3,121 operating assets; and 1,476 explicitly organized consultant-delivery
  assets.
- **Source stage:** `product-intelligence`
- **Product impact:** Reclassifies the underlying operating method from an
  untested hypothesis to a longitudinally adopted consulting operating system.
  The product opportunity is its governed productization and scale.
- **User impact:** Historical consultant-method adoption is established.
  Client-operated software adoption, self-service, and usability remain
  untested.
- **Requirement impact:** Passes the Product Intelligence gate and carries a
  governed corpus/evaluation lane into Product Requirements Planning.
- **Technical impact:** None. No ingestion, retrieval, model, architecture,
  contract, schema, or runtime choice is made.
- **Data impact:** Treats the historical collection as a candidate
  expert-demonstration corpus. Raw client and licensed artifacts are not
  automatically authorized training data.
- **Security impact:** Requires source ownership, contractual reuse authority,
  confidentiality, PHI/PII, licensing, tenant separation, provenance,
  currentness, human-label, retention, and deletion controls before corpus use.
- **Operational impact:** Product discovery no longer needs to prove that the
  consulting method has practical value. Later validation must test transfer
  into client-operated software and consultant leverage.
- **Dependency impact:** `product_definition` passes and
  `product-requirements-planning` becomes the next legal skill. OD-14 and OD-16
  continue to block retrieval architecture and implementation.
- **Recommendation:** Accept the Product Intelligence handoff and define the
  reviewed-answer-or-explicit-gap release plus corpus governance and evaluation
  requirements in the next stage.
- **Decision owner:** Tyler Hebert.
- **Approval required:** Satisfied for Product Intelligence by the owner's
  evidence and value statement. Separate approval remains required to start
  Product Requirements Planning.
- **Blocking status:** Does not block requirements planning. Rights and safety
  decisions block live corpus ingestion, shared training, retrieval, and
  implementation.
- **Artifacts to update:** Portfolio evidence, Product Intelligence brief,
  first-release scope, corpus strategy, risk register, handoff, project state,
  and repository state.
