# 03 — Conflict Register

**Date:** 2026-07-10
No conflict below was silently resolved. Each entry records the conflict, the decision (or deferral), and the rationale.

## C-1 — Product framing: "Clarity Crisis Platform" vs "Clarity AI" — `DIRECT_CONFLICT` → resolved with both preserved

- **Existing (Jul 8):** Louisiana-first behavioral-health **crisis intake, statutory custody (PEC/OPC/CEC), transfer, and inpatient operations** platform. Defensible core: guided intake coaching, statutory instrument execution, hash-chained custody ledger, bedboard.
- **Package (Jul 10):** payer-agnostic **behavioral-health case-intelligence and access-orchestration** platform centered on documents → evidence → review → parallel clinical/legal/benefits workstreams.
- **Decision:** the package's own README states it "consolidates the full Clarity concept developed to date" and its INTEGRATION_PLAN mandates *expand, don't restart*. The master framing becomes the umbrella vision; the crisis-intake generation is preserved intact as the **launch wedge and the deepest-specified domain set** (legal instruments, custody, clocks, bedboard, guided intake). Neither replaces the other.
- **Residual risk:** the missing package files might state a different disposition for crisis-specific modules (bedboard, milieu, Louisiana instruments). Marked open in `06_UNRESOLVED_QUESTIONS.md`.

## C-2 — Roadmap sequencing — `DIRECT_CONFLICT` → reconciled

- **Existing `docs/04`:** v0.1 intake spine (done — `app/` implements it) → v0.2 command center/routing (done in prototype) → v0.3 metrics/bedboard; production concerns in parking lot.
- **Package:** 15-step platform sequence starting from repository + schema foundation; FIRST_25_GITHUB_ISSUES starts at monorepo init.
- **Decision:** the package sequence governs the **platform build** (backend, schema, tenancy, audit); the existing roadmap's completed items are recorded as prototype milestones, not redone. Reconciled in `docs/roadmap/IMPLEMENTATION_ROADMAP.md`.

## C-3 — Four competing schemas — `DIRECT_CONFLICT` → decided in ADR-0002

| Candidate | Origin | Size | Notes |
|---|---|---|---|
| `clarity-mh-architecture/schema/prisma.schema.prisma` | Jul 8 | ~12 KB | Crisis-platform entities; docs/06 flagged P1 misalignment with its own RLS starter and missing entities |
| `reporting-metrics-rebuild-package/SCHEMA_BLUEPRINT.sql` | Jul 8 | 6 KB | Reporting-only star schema; different scope, not a competitor for the case spine |
| `schema.foundation.prisma` (= database artifact schema) | Jul 10 | 872 lines, 25 models, 35 enums | Foundation: identity/case/documents/evidence/insurance/benefits/auth/audit |
| `schema(1) (1).prisma` | Jul 10 | 1,484 lines, 43 models, 56 enums | Expanded target draft; package's own QA says never Prisma-validated |

- **Decision:** foundation schema proposed as canonical `prisma/schema.prisma` (validated in Phase 7); expanded draft retained as the roadmap target under `docs/architecture/`; Jul 8 schema archived as historical; SQL blueprint kept with the reporting package. Full comparison in `05_SCHEMA_COMPARISON.md`.

## C-4 — Pre-existing internal conflicts (inherited, from `docs/06-architecture-review.md`) — `UNRESOLVED` items carried forward

The Jul 8 review had already flagged, and these remain open where not overtaken by events:
1. ~~Canonical source conflict between `docs/` and `clarity-mh-architecture/`~~ → resolved by this integration: `docs/` canonical, package dirs referenced.
2. **Prisma schema ↔ `supabase-rls.sql` misalignment** — still true; both are now historical (superseded by the foundation schema) so the conflict is closed as SUPERSEDED, but the RLS concepts must be re-derived for the canonical schema. Open item.
3. **Legal-status model needs a non-enforcement configuration layer** — consistent with package §11; carried into OPEN_DECISIONS.
4. **Statutory language requires counsel review** — unchanged, UNRESOLVED, blocking any legal-clock enforcement.

## C-5 — Duplicate source documents — `DUPLICATE_EQUIVALENT` → consolidated

`Clarity MH /` and `clarity-mh-architecture/sources/` hold overlapping source docs (assessment guidance, SOP, feasibility report, competitive landscape, synthesis, epec jsx). Decision: consolidate under `reference/source-documents/` keeping one copy of each (hash-verified where identical; both kept where they differ), originals recorded in the move map. `HANDOFF_CHECKLIST (1).md` is a byte-identical re-download of `HANDOFF_CHECKLIST.md` — preserved in the immutable package copy, only one integrated.

## C-6 — Package manager / repo shape — `DIRECT_CONFLICT` → decided in ADR-0001

Package prescribes pnpm + Turborepo monorepo with ~30 packages; existing implementation is a working npm + Vite single app. See `04_REPOSITORY_STRATEGY.md`.

## C-7 — Data dictionary versions — `PACKAGE_EXPANDS_EXISTING` within the package family

`DATA_DICTIONARY(1).md` (master, "Comprehensive", 6.7 KB) ≠ database artifact `DATA_DICTIONARY.md` (3.7 KB). The master version covers the expanded draft; the artifact version covers the foundation schema. Both retained; the **foundation-schema dictionary** is canonical while the foundation schema is canonical.
