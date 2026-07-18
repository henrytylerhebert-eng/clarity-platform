---
status: Integrated — adapted from package original
owner: TBD
version: 1.0.0
last_integrated: 2026-07-10
source_artifacts:
  - reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/DEVELOPER_BRIEF.md (original, unmodified)
  - docs/repository-audit/04_REPOSITORY_STRATEGY.md
unresolved_conflicts: "Original assumes pnpm+Turborepo greenfield; adapted per ADR-0001"
related_requirements: REQ-001…REQ-012
related_adrs: ADR-0001, ADR-0002
---

# Developer Brief (adapted to this repository)

The package original is preserved verbatim in the source-package copy. This adaptation reflects decisions made during integration:

## Objective

Prove the case spine end-to-end on synthetic data: referral → document ingestion → source-linked evidence → human review → parallel clinical/legal/benefits workstreams → packet → simulated routing → custody handoff → immutable audit timeline.

## What already exists (do not rebuild)

- `app/` — working frontend demo of the crisis path (run `npm run dev` in `app/`).
- `prisma/schema.prisma` — canonical foundation schema (validation status: `docs/repository-audit/05_SCHEMA_VALIDATION_RESULTS.md`).
- `packages/domain-contracts/` — Zod schemas, state machines, audit helper, feature flags, seed loader, with tests.
- `data/synthetic-cases/` — 3 validated synthetic fixtures.

## Non-negotiables (unchanged from the package)

Synthetic data only; human gates intact; append-only audit; parallel workstreams; no payment guarantees; payer memory labeled historical; no opaque combined score; no autonomous external actions; schema-validated model outputs.

## First repository actions (adapted)

1. ~~Create repository~~ done. 2. npm workspaces (not pnpm/Turborepo yet — ADR-0001). 3. Add lint/format + CI (open). 4. ~~Add schema draft~~ done. 5. ~~prisma format/validate~~ see validation results. 6. Document schema corrections in ADR-0002 ✅. 7. Generate migration — **blocked on a local PostgreSQL instance** (schema-only validation done). 8. ~~Load synthetic fixtures~~ seed loader + tests done. 9. Build tenant-scoped repositories against a real database — **next issue**.

## Lane onboarding standard (now live)

- For standard/normal-scope work, start with [`docs/AGENTS_TEMPLATE.md`](/Users/tylerhebert/Documents/clarity-platform/docs/AGENTS_TEMPLATE.md).
- For urgent execution, use [`docs/AGENTS_TEMPLATE.quickfill.md`](/Users/tylerhebert/Documents/clarity-platform/docs/AGENTS_TEMPLATE.quickfill.md) and expand into the full template when time allows.
- Both templates are required to classify:
  - mode (COACH / FAST / PLAN / SHOW REWRITE),
  - completion criteria,
  - verification commands,
  - open risks and tradeoffs,
  - and the final response format.
