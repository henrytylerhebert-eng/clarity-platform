---
status: Living document
owner: TBD
version: 1.0.0
last_integrated: 2026-07-10
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
| OD-15 | Rev Ops metric v1 approved: Daily Midnight Census Count, prior-calendar-day midnight; future receipts snapshot it, legacy receipts disclose definition not recorded. Hospital inclusion rules and their independent version/effective date remain unknown. See [export brief](../product/INPATIENT_REV_OPS_EXPORT_BRIEF.md). | Product + census/finance owners | Hospital validation and any patient-day equivalence; synthetic export implementation authorized |
| OD-16 | Rev Ops budget: retain existing approved-budget selection for this export slice. Predecessor inheritance, separately accountable baseline changes and independent approval remain undecided. See [export brief](../product/INPATIENT_REV_OPS_EXPORT_BRIEF.md). | Product + finance owner | Changes to closing/budget policy; export must preserve the historically selected budget |
| OD-17 | Rev Ops export: explicit delegated permission, safe projection, legacy disclosure, bounded synchronous generation and durable fail-closed audit implemented for synthetic testing. Production audit retention/tamper controls, distributed limits and real-data field policy remain unresolved. See [export brief](../product/INPATIENT_REV_OPS_EXPORT_BRIEF.md). | Product + technical/security reviewers | Production/pilot use; review implementation before merge, no production or real-data authority |
