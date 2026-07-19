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
