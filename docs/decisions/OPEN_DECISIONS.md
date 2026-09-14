---
status: Living document
owner: TBD
version: 1.5.0
last_integrated: 2026-07-10
last_scoped_reconciliation: 2026-09-12
source_artifacts:
  - docs/06-architecture-review.md (Jul 8 findings + unknowns)
  - docs/repository-audit/03_CONFLICT_REGISTER.md, 03_GAP_ANALYSIS.md
  - docs/discovery/operating-assurance/README.md
unresolved_conflicts: "Package 18-open-decisions-and-risks/OPEN_DECISIONS.md missing — this file re-seeds it"
related_requirements: —
related_adrs: ADR-0001, ADR-0002
---

# Open Decisions

Rev Ops export implementation was authorized September 8, 2026. OD-15–17 distinguish
the bounded synthetic implementation from unresolved hospital/production decisions.

On September 9, Tyler accepted the Dunder Mifflin restored workbook and authorized
full workbook parity, MVP/interface updates, and real financial-rate implementation.
The [acceptance record](../product/RESTORED_WORKBOOK_ACCEPTANCE.md) closes OD-18.
This development authority supersedes the earlier requirement to seek workbook
acceptance again; production and real patient-data decisions remain separate.

| # | Decision needed | Owner type | Blocking |
|---|---|---|---|
| OD-1 | Obtain the full master package v0.2.0 (72 files missing); re-run comparison for 12 summary-graded domains | Product owner | Canonical status of agent/API/UI/eval/commercial domains |
| OD-2 | Louisiana statutory wording, official forms, trigger/duration language | Counsel | Any legal-clock or instrument enforcement |
| OD-3 | Clinical criteria licensing (InterQual/MCG or payer-specific) and clinician governance of assessment content | Clinical + legal | Medical-necessity criteria mapping |
| OD-4 | Product naming: "Clarity", "Clarity MH", "Clarity AI", "Clarity Crisis Platform" all appear; pick one | Product owner | Branding in docs/UI |
| OD-5 | Fastify is now used by `packages/api-service/src/server.ts`; production API boundary, hosting, and deployment decisions remain separate. Source inspection at `35f16eb` does not establish production acceptance. | Product owner + tech lead | Additional HTTP routes and production API deployment |
| OD-6 | Database hosting + RLS strategy (recommended posture accepted; provider swapped to Supabase Postgres and schema deployed 2026-09-13, see [ADR-0022](../architecture/ADR-0022-supabase-provider-swap.md); provider-backed tenancy tests and security review still remain); see [OD-6 provider and RLS decision packet](OD-6_PROVIDER_AND_RLS_DECISION_PACKET.md) | Tech lead + security | Provider-backed tenancy tests and security review (schema/anon-grant fix already done) |
| OD-7 | pnpm/Turborepo migration timing (deferred by ADR-0001) | Tech lead | None immediately |
| OD-8 | Expanded 43-model schema adoption path (which models graduate when) | Tech lead | ADR-0002 follow-up |
| OD-9 | CI `verify` and Node 24 configuration exist in `.github/workflows/ci.yml`; local dependency isolation, database-ledger provenance, and reproducible verification still require evidence for the actual checkout/run. Historical July cross-worktree failures were not rerun in this documentation slice. | Tech lead | Reproducible verification and proposed live-agent evaluation acceptance |
| OD-10 | The 7 missing synthetic cases (recreate vs. obtain) | Product owner | Evaluation coverage |
| OD-11 | Payer criteria packs and facility authorization rules (unknown in both generations) | Revenue cycle | Benefits/auth workflows beyond schema |
| OD-12 | Baseline operational measurements (transfer timing, acceptance rate, packet completeness) | Product owner | ROI claims, pilot design |
| OD-13 | CMS/Medicare/Medicaid regulatory reference acquisition: whether to execute the Phase 1 deep research prompt (`docs/legal/GEMINI_DEEP_RESEARCH_PROMPT_CMS_MEDICARE_MEDICAID.md`), and who reviews its output before any of it informs a rule | Product owner + counsel (OD-2) + clinical (OD-3) | Any regulatory grounding for readiness, authorization, transfer, or consent logic |
| OD-14 | Per-organization AI-native policy & procedure index (Phase 2); see [org policy index decision packet](ORG_POLICY_INDEX_DECISION_PACKET.md). Unresolved: tenant-safe retrieval partitioning, reference-vs-authority scope, FDA CDS implications, who authors default interpretations, version staleness | Product owner + tech lead + counsel | Controlled extraction and AI-agent steps of the build sequence |
| OD-15 | Rev Ops metric v1 approved: Daily Midnight Census Count, prior-calendar-day midnight; future receipts snapshot it, legacy receipts disclose definition not recorded. Hospital inclusion rules and their independent version/effective date remain unknown. See [export brief](../product/INPATIENT_REV_OPS_EXPORT_BRIEF.md). | Product + census/finance owners | Hospital validation and any patient-day equivalence; synthetic export implementation authorized |
| OD-16 | Rev Ops budget: retain existing approved-budget selection for this export slice. Predecessor inheritance, separately accountable baseline changes and independent approval remain undecided. See [export brief](../product/INPATIENT_REV_OPS_EXPORT_BRIEF.md). | Product + finance owner | Changes to closing/budget policy; export must preserve the historically selected budget |
| OD-17 | Rev Ops export: explicit delegated permission, safe projection, legacy disclosure, bounded synchronous generation and durable fail-closed audit implemented for synthetic testing. Production audit retention/tamper controls, distributed limits and real-data field policy remain unresolved. See [export brief](../product/INPATIENT_REV_OPS_EXPORT_BRIEF.md). | Product + technical/security reviewers | Production/pilot use; review implementation before merge, no production or real-data authority |
| OD-18 — CLOSED 2026-09-09 | Tyler accepted Dunder Mifflin Hospital - Restored Operations 2026 at mapped SHA-256 `6e81bd61950c244e607ed03f8b0f13e1a4d0bea366ee7ad7cc54c053ef90de26`; current file hash matches. Full parity and real financial-rate implementation authorized. See [acceptance](../product/RESTORED_WORKBOOK_ACCEPTANCE.md). | Tyler / product owner | No remaining workbook-acceptance block. Native mutation rerun is unverified; it is verification work, not a reopened acceptance decision. |
| OD-19 | Selected Louisiana hospital payment profile: provider identifier pending from Tyler. Verify applicable facility classification/factors, official rate version/effective date, and any private commercial contract terms before presenting facility-specific calculations. | Product + finance/RCM | Only calculations requiring those missing inputs. Shared source/rate registry, payment-method implementation, synthetic verification, and other parity work are authorized to proceed. |
| OD-20 | Proposed DEV-R1 historical evaluation: approve, revise, or reject the exact charter, sealed corpus, enforced runner boundary, owners, and scoring rules. Approval remains Pending. | Product + technical + security/evaluation owners | DEV-R1 historical experiment only; no live trial or product/runtime authority |
| OD-21 | Bridge retirement is accepted by ADR-0017; complete or explicitly disposition the held physical quarantine and script/link cleanup while preserving message history and the separate PR #30 hold. | Product + technical owner | Retirement execution; no dispatch or relocation authorized here |
| OD-22 | `RETURNED_FOR_MORE_INFORMATION` remains the exact Prisma-only `KNOWN_DESYNC.CaseStatus` value in the enum-sync test. Decide its semantics, removal, or formal continued tolerance. | Product + technical/database owners | Shared returned-packet status changes and removal of the recorded tolerance |
| OD-23 | The canonical model is already selected by accepted ADR-0017/merged PR #33. Decide whether to adopt any recovered DEV-R1 evaluation safeguards as an explicit amendment; until then the recovered proposal is historical and Pending. | Product + technical owner | Adoption or launch of this candidate; documentation recovery does not supersede the accepted model |
| OD-24 | Decide qualified role authority for entering `MEDICAL_TRANSFER_REQUIRED`. `TransitionCase` still permits `INTAKE_COORDINATOR` and `ORGANIZATION_ADMIN`; ADR-0018 does not establish clinical approval. | Product + qualified clinical + technical/security owners | Medical-diversion role-policy changes and production reliance |
| OD-25 | The July source packet records operating-assurance Product Intelligence acceptance for a client-operated, consultant-supervised reviewed answer or explicit gap. Retained as historical provenance; the lane remains paused and implementation is not authorized. | Product + operational/compliance owners | Direct workflow/software-value validation; no pilot or runtime authority from recovery |
| OD-26 | Operating-assurance product/repository home remains undecided: Clarity module, adjacent product with selective pattern reuse, or separate product. The historical recommendation is adjacent; no option is adopted here. | Product + technical/security owners | Architecture, repository selection, contracts, and implementation |
| OD-27 | Determine permitted uses of historical consulting artifacts: firm-owned patterns, tenant-private retrieval, permissioned derived examples, evaluation-only, shared training, or prohibited. No corpus-use approval is supplied by recovery. | Product + legal/contracts + privacy/security + operational/compliance owners | Content-level ingestion, retrieval, derived examples, embeddings, evaluation, or training using historical material |

## Recovered agent-readiness decisions — 2026-09-12

[Recovery disposition](../developer-handoff/GOVERNANCE_DOCUMENT_RECOVERY_2026-09-12.md)
records the July-to-current ID mapping and superseded source-era claims.
OD-20 through OD-24 replace this proposal's old branch-local OD-15 through
OD-19 references. Canonical Rev Ops OD-15 through OD-17 and workbook
OD-18/OD-19 are preserved after reconciliation with the workbook branch.

### OD-20 — historical DEV-R1 experiment

Status: Open. The [charter](../agents/PRESCREEN_INVARIANT_VERIFIER_CHARTER.md)
is Proposed and the [approval record](../../governance/prompt-approvals/DEV_R1_PRESCREEN_INVARIANT_VERIFIER_APPROVAL.md)
is Pending. The owner may approve the exact historical-only experiment,
request revision, or reject it. Required evidence includes named technical,
independent-verification, evaluation, and security owners; immutable charter,
context, work-package, runner, prompt/tool and corpus hashes; sealed gold
outside the reviewer's readable scope; and demonstrated write/network denial.
No owner, hash, score, launch, or acceptance is supplied by this recovery.
A live trial would need separate approval after historical eligibility.

### OD-21 — execute the accepted bridge disposition

Retirement as an operating model is already accepted in ADR-0017. The current
plan records physical quarantine as held. The remaining decision concerns a
bounded migration: ledger/message preservation, all inbound scripts/links,
and the disposition of overlapping PR #30 work. This entry does not reopen
retirement, infer authenticated transport, or authorize a replacement channel.

### OD-22 — remaining CaseStatus tolerance

Source inspection at `35f16eb` confirms the enum-sync test's exact
`RETURNED_FOR_MORE_INFORMATION` tolerance and issue #35 reference. Choose
compatible removal, approved domain behavior, or explicit retention only after
sender/receipt semantics, migration impact, and producer/consumer review.
A fresh hermetic test is required for an implementation change; none ran here.

### OD-23 — candidate amendment to the accepted model

PR #33 merged on August 23. The July proposal's instruction to choose between
two unmerged governance lanes is superseded. Accepted ADR-0017 and its plan
remain authoritative; an owner may evaluate the recovered DEV-R1 historical
benchmark design as an amendment, revise it, or leave it parked. No additional
agent topology or blanket role gate becomes effective through this recovery.
PR #30 remains a separately held open lane.

### OD-24 — medical-diversion role authority

ADR-0018 accepts state topology but leaves role appropriateness unresolved.
`packages/case-service/src/permissions.ts` still supplies the two command roles.
A product, qualified-clinical, and technical/security ruling must determine
whether target-specific roles, a distinct approval, the existing policy with
rationale, or disabled entry is appropriate. This recovery selects none of
those outcomes; allowed/denied role, audit, and non-revealing failure evidence
would belong to a separately authorized implementation.

## Operating-assurance decision provenance

The detail below preserves the July 29–30 source decision record with migrated
IDs. Its resolution/acceptance labels describe that historical source; the
current rows above and [recovery index](../discovery/operating-assurance/README.md)
state the paused scope. No acceptance, product-home selection, or corpus-use
permission is added by the documentation recovery.

## OD-25 detail - operating-assurance discovery focus

- **Decision ID:** `OD-25`
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

### OD-25 resolution - 2026-07-30

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

## OD-26 detail - operating-assurance product home

- **Decision ID:** `OD-26`
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

## OD-27 detail - historical consulting corpus use

- **Decision ID:** `OD-27`
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
