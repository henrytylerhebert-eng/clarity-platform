---
status: Integrated draft
owner: TBD
version: 1.0.0
last_integrated: 2026-07-10
source_artifacts:
  - reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/MASTER_ARCHITECTURE.md (§5–9, §19–21)
  - reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/REPOSITORY_STRUCTURE.md
  - docs/01-project-architecture.md §3, §11 (crisis generation)
  - reference/source-packages/clarity-ai-database-artifact/docs/INTEGRATION_PLAN.md
unresolved_conflicts: "Package files 07-agent-architecture/, 09-rules-and-retrieval/, 11-api-and-services/ missing — agent contracts, retrieval spec, and API architecture have no local source"
related_requirements: REQ-001…REQ-012
related_adrs: ADR-0001, ADR-0002
---

# System Architecture

## Operating spine

```text
Case → Documents → Evidence → Review → Rules → Workflow → Audit
```

Expanded domain spine (benefits verification added as a **parallel workstream**, not a restart):

```text
Case, Documents, Evidence, Clinical Review, Legal Review, Medical Screening,
Insurance, Eligibility, Benefits Verification, Authorization, Placement,
Custody, Communication, Workflow, Audit, Intelligence
```

Each case maintains an overall status plus independent statuses for clinical, legal, medical-screening, benefits, authorization, placement, transportation, and patient-education workstreams (see `packages/domain-contracts/`).

## Platform layers

1. **Controlled knowledge** — clinical guidance, legal authorities, payer policies, facility criteria, procedures, contracts, operational memory; tagged with authority, jurisdiction, effective date, version, owner, status.
2. **Case intelligence** — documents, candidate evidence with source links, timeline, contradictions, missing information, structured summaries. Rejected/superseded evidence stays auditable but cannot support approved output.
3. **Bounded reasoning** — medical necessity, medical screening, legal status, eligibility/benefits, authorization, facility matching, packet readiness. Agents draft; qualified humans approve.
4. **Workflow orchestration** — case state, parallel workstreams, tasks, deadlines, blockers, escalation, approvals. Deterministic rules block only the dependent step.
5. **User workspaces** — queue, overview, evidence, clinical, legal, benefits, authorization, packet, routing, custody, audit, analytics. The implemented prototype (`app/`) covers the crisis-path subset.
6. **Governance** — permissions, source/rule/prompt/model versions, human review, audit, evaluations, incident response (see `GOVERNANCE.md`).

## Current implementation state (honest)

- **Implemented (prototype, `app/`):** frontend-only demo of guided intake, medical-necessity and legal drafts, prohibited-language guardrails, hash-chained custody ledger, compliance clocks, packet builder, simulated routing, bedboard; localStorage persistence; unit + smoke tested.
- **Schema (validated text, no database):** `prisma/schema.prisma` — foundation, 25 models (ADR-0002). Expanded 43-model draft preserved as target.
- **Documented only:** API/services (no local spec — gap), model gateway, retrieval, agent contracts, tenancy enforcement, deployment.

## Growth path

The package's target monorepo (`REPOSITORY_STRUCTURE.md`: pnpm+Turborepo, ~30 domain packages) is adopted incrementally from the current npm-workspaces layout (`app/`, `packages/domain-contracts/`) per ADR-0001. Domain packages are split out when a backend service first needs them.

## Agent architecture (target)

Eighteen specialized agents are cataloged in `MASTER_ARCHITECTURE.md` §19 (classification, extraction, contradiction, timeline, summaries, necessity, screening, legal, verification prep, payer memory, authorization prep, education, matching, packet, drafting, audit review, retrospective review). Each requires a contract: allowlisted tools, output schema, source requirements, prohibited actions, validation, human-review rule. **The contract files (`07-agent-architecture/`) are missing from the local package copy** — only the 13 Jul 8 prompt files exist as concrete artifacts (`reference/source-packages/clarity-mh-architecture/prompts/`). No agent runs in the current codebase.
