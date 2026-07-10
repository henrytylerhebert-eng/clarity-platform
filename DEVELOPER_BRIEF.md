# Developer Brief

## Objective

Create a production-disciplined prototype of Clarity AI using synthetic data.

The first implementation should prove the controlled workflow, not attempt to automate every clinical, legal, payer, or placement decision.

## First technical milestone

A synthetic behavioral-health referral can move through:

```text
case creation
→ document upload
→ evidence extraction
→ evidence review
→ parallel clinical/legal/benefits work
→ authorization preparation
→ packet approval
→ simulated routing
→ simulated custody handoff
→ closure
→ audit review
```

## Non-negotiables

- source before summary
- structured evidence before narrative
- deterministic rules before model judgment
- human approval before external action
- parallel workstreams
- benefits verification cannot block emergency clinical review
- payer memory is historical
- no opaque payer-weighted prioritization
- append-only audit
- tenant isolation
- masked sensitive identifiers
- synthetic data only for prototype

## Package files to use first

- `08-data-and-database/prisma/schema.prisma`
- `08-data-and-database/SCHEMA_COVERAGE_AND_VALIDATION.md`
- `11-api-and-services/SERVICE_AND_API_ARCHITECTURE.md`
- `15-roadmap-and-sprints/SPRINT_BACKLOG.md`
- `13-testing-and-evaluation/TEST_AND_EVALUATION_STRATEGY.md`
- `17-synthetic-cases/`
- `16-developer-handoff/MASTER_BUILD_PROMPT.md`

## First repository actions

1. Create repository.
2. Initialize pnpm and Turborepo.
3. Add TypeScript, linting, formatting, Vitest, and Playwright.
4. Add PostgreSQL and Prisma.
5. Add the target schema as a draft.
6. Run `prisma format` and `prisma validate`.
7. document every schema correction in an ADR.
8. Generate migration.
9. Load synthetic organization and case fixtures.
10. Implement tenant-scoped repositories.
11. Implement audit helper before case mutations.
12. Implement state-machine tests.
13. Do not add live AI or real data yet.

## Required first deliverables

- working local monorepo
- valid schema
- migration
- seed command
- passing unit and workflow tests
- architecture decision record
- gap report
- issue backlog
- security assumptions
- synthetic-data banner

## Developer questions to resolve

- Next.js or Vite for web
- API framework
- authentication provider
- PostgreSQL hosting
- object storage
- queue
- observability
- model provider
- vector storage
- tenancy enforcement
- field encryption
- deployment target
- first pilot workflow
