---
status: Integrated draft
owner: TBD
version: 1.1.0
last_integrated: 2026-07-29
source_artifacts:
  - reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/MASTER_ARCHITECTURE.md (§5–9, §19–21)
  - reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/REPOSITORY_STRUCTURE.md
  - docs/01-project-architecture.md §3, §11 (crisis generation)
  - reference/source-packages/clarity-ai-database-artifact/docs/INTEGRATION_PLAN.md
  - docs/architecture/ADR-0013-prescreen-command-service.md
  - docs/architecture/ADR-0014-prescreen-role-mapping-and-api-slice.md
  - IMPLEMENTATION_STATUS.md
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

- **Implemented prototype (`app/`):** localStorage-backed guided intake, medical-necessity and legal drafts, evidence review, benefits/authorization views, packet/routing, custody ledger, bedboard, training, Mock Admit Lab, and read-only synthetic Product Studio.
- **Implemented service foundations (`packages/*-service`):** tenant-scoped case, document, evidence, benefits, authorization, and authentication services plus Prisma adapters and tests, and the same-organization Phase 2 prescreen command service with an in-memory gateway. These are local foundations, not deployed products; prescreen persistence remains open in PR #32.
- **Implemented API spike (`packages/api-service`):** authenticated `node:http` vertical slice for session routes, one case decision-rationale command, and seven same-organization prescreen routes. ADR-0012 remains Proposed and recommends a different Fastify package shape, so the production API decision is open.
- **Schema and local persistence:** `prisma/schema.prisma` is valid and migrations/adapters are exercised by integration tests. Production database hosting and RLS strategy remain open.
- **Documented only or open:** model gateway, retrieval, product agents, production hosting, managed identity, production storage, observability, external integrations, and controlled release.

## Growth path

The package's target monorepo (`REPOSITORY_STRUCTURE.md`: pnpm+Turborepo, ~30 domain packages) is adopted incrementally from the current npm-workspaces layout (`app/`, `packages/*`) per ADR-0001. Domain packages are split out when an implemented service needs them.

## Agent architecture (target)

Eighteen specialized agents are cataloged in `MASTER_ARCHITECTURE.md` §19 (classification, extraction, contradiction, timeline, summaries, necessity, screening, legal, verification prep, payer memory, authorization prep, education, matching, packet, drafting, audit review, retrospective review). Each requires a contract: allowlisted tools, output schema, source requirements, prohibited actions, validation, human-review rule. **The contract files (`07-agent-architecture/`) are missing from the local package copy** — only the 13 Jul 8 prompt files exist as concrete artifacts (`reference/source-packages/clarity-mh-architecture/prompts/`). No agent runs in the current codebase.
