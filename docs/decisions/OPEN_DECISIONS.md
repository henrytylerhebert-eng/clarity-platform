---
status: Living document
owner: TBD
version: 1.0.0
last_integrated: 2026-07-10
last_scoped_reconciliation: 2026-09-12
source_artifacts:
  - docs/06-architecture-review.md (Jul 8 findings + unknowns)
  - docs/repository-audit/03_CONFLICT_REGISTER.md, 03_GAP_ANALYSIS.md
unresolved_conflicts: "Package 18-open-decisions-and-risks/OPEN_DECISIONS.md missing — this file re-seeds it"
related_requirements: —
related_adrs: ADR-0001, ADR-0002
---

# Open Decisions

Rev Ops export implementation was authorized September 8, 2026. OD-15–17 distinguish
the bounded synthetic implementation from unresolved hospital/production decisions.

| # | Decision needed | Owner type | Blocking |
|---|---|---|---|
| OD-1 | Obtain the full master package v0.2.0 (72 files missing); re-run comparison for 12 summary-graded domains | Product owner | Canonical status of agent/API/UI/eval/commercial domains |
| OD-2 | Louisiana statutory wording, official forms, trigger/duration language | Counsel | Any legal-clock or instrument enforcement |
| OD-3 | Clinical criteria licensing (InterQual/MCG or payer-specific) and clinician governance of assessment content | Clinical + legal | Medical-necessity criteria mapping |
| OD-4 | Product naming: "Clarity", "Clarity MH", "Clarity AI", "Clarity Crisis Platform" all appear; pick one | Product owner | Branding in docs/UI |
| OD-5 | Fastify is now used by `packages/api-service/src/server.ts`; production API boundary, hosting, and deployment decisions remain separate. Source inspection at `35f16eb` does not establish production acceptance. | Product owner + tech lead | Additional HTTP routes and production API deployment |
| OD-6 | Database hosting + RLS strategy (recommended posture accepted; provider/session and security details remain); see [OD-6 provider and RLS decision packet](OD-6_PROVIDER_AND_RLS_DECISION_PACKET.md) | Tech lead + security | Provider-backed migrations, tenancy tests, and security review |
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
| OD-18 | Proposed DEV-R1 historical evaluation: approve, revise, or reject the exact charter, sealed corpus, enforced runner boundary, owners, and scoring rules. Approval remains Pending. | Product + technical + security/evaluation owners | DEV-R1 historical experiment only; no live trial or product/runtime authority |
| OD-19 | Bridge retirement is accepted by ADR-0017; complete or explicitly disposition the held physical quarantine and script/link cleanup while preserving message history and the separate PR #30 hold. | Product + technical owner | Retirement execution; no dispatch or relocation authorized here |
| OD-20 | `RETURNED_FOR_MORE_INFORMATION` remains the exact Prisma-only `KNOWN_DESYNC.CaseStatus` value in the enum-sync test. Decide its semantics, removal, or formal continued tolerance. | Product + technical/database owners | Shared returned-packet status changes and removal of the recorded tolerance |
| OD-21 | The canonical model is already selected by accepted ADR-0017/merged PR #33. Decide whether to adopt any recovered DEV-R1 evaluation safeguards as an explicit amendment; until then the recovered proposal is historical and Pending. | Product + technical owner | Adoption or launch of this candidate; documentation recovery does not supersede the accepted model |
| OD-22 | Decide qualified role authority for entering `MEDICAL_TRANSFER_REQUIRED`. `TransitionCase` still permits `INTAKE_COORDINATOR` and `ORGANIZATION_ADMIN`; ADR-0018 does not establish clinical approval. | Product + qualified clinical + technical/security owners | Medical-diversion role-policy changes and production reliance |

## Recovered agent-readiness decisions — 2026-09-12

[Recovery disposition](../developer-handoff/GOVERNANCE_DOCUMENT_RECOVERY_2026-09-12.md)
records the July-to-current ID mapping and superseded source-era claims.
OD-18 through OD-22 replace this proposal's old branch-local OD-15 through
OD-19 references. Canonical Rev Ops OD-15 through OD-17 are unchanged.

### OD-18 — historical DEV-R1 experiment

Status: Open. The [charter](../agents/PRESCREEN_INVARIANT_VERIFIER_CHARTER.md)
is Proposed and the [approval record](../../governance/prompt-approvals/DEV_R1_PRESCREEN_INVARIANT_VERIFIER_APPROVAL.md)
is Pending. The owner may approve the exact historical-only experiment,
request revision, or reject it. Required evidence includes named technical,
independent-verification, evaluation, and security owners; immutable charter,
context, work-package, runner, prompt/tool and corpus hashes; sealed gold
outside the reviewer's readable scope; and demonstrated write/network denial.
No owner, hash, score, launch, or acceptance is supplied by this recovery.
A live trial would need separate approval after historical eligibility.

### OD-19 — execute the accepted bridge disposition

Retirement as an operating model is already accepted in ADR-0017. The current
plan records physical quarantine as held. The remaining decision concerns a
bounded migration: ledger/message preservation, all inbound scripts/links,
and the disposition of overlapping PR #30 work. This entry does not reopen
retirement, infer authenticated transport, or authorize a replacement channel.

### OD-20 — remaining CaseStatus tolerance

Source inspection at `35f16eb` confirms the enum-sync test's exact
`RETURNED_FOR_MORE_INFORMATION` tolerance and issue #35 reference. Choose
compatible removal, approved domain behavior, or explicit retention only after
sender/receipt semantics, migration impact, and producer/consumer review.
A fresh hermetic test is required for an implementation change; none ran here.

### OD-21 — candidate amendment to the accepted model

PR #33 merged on August 23. The July proposal's instruction to choose between
two unmerged governance lanes is superseded. Accepted ADR-0017 and its plan
remain authoritative; an owner may evaluate the recovered DEV-R1 historical
benchmark design as an amendment, revise it, or leave it parked. No additional
agent topology or blanket role gate becomes effective through this recovery.
PR #30 remains a separately held open lane.

### OD-22 — medical-diversion role authority

ADR-0018 accepts state topology but leaves role appropriateness unresolved.
`packages/case-service/src/permissions.ts` still supplies the two command roles.
A product, qualified-clinical, and technical/security ruling must determine
whether target-specific roles, a distinct approval, the existing policy with
rationale, or disabled entry is appropriate. This recovery selects none of
those outcomes; allowed/denied role, audit, and non-revealing failure evidence
would belong to a separately authorized implementation.
