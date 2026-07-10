# ADR-0001 — Repository and Integration Strategy

- **Status:** Accepted
- **Date:** 2026-07-10
- **Owner:** _placeholder — repository owner_
- **Related:** `docs/repository-audit/04_REPOSITORY_STRATEGY.md`, `03_CONFLICT_REGISTER.md` C-1/C-2/C-6

## Context

Two generations of Clarity work coexist: a Jul 8 "Clarity Crisis Platform" generation with a working, tested Vite/React/TypeScript prototype (`app/`) and deep crisis-domain docs, and a Jul 10 "Clarity AI" master architecture package v0.2.0 that is only **partially present locally** (15 of 87 files) plus a complete database artifact. The package recommends a pnpm+Turborepo monorepo with ~30 domain packages; the existing repo is an npm single-app workspace with no backend.

## Decision

1. **Strategy A** — the existing implementation is viable; the package is adapted to it. Nothing working is archived or rewritten to match architecture prose.
2. The **master package's framing becomes the umbrella product vision**; the crisis-intake generation is preserved as the launch wedge and remains the deepest domain specification (legal instruments, custody ledger, bedboard, guided intake).
3. **npm workspaces** (root `package.json`) rather than pnpm+Turborepo, until a second runnable app exists. Deferral, not rejection: the package's target structure is recorded as the growth path.
4. The **foundation Prisma schema** (25 models — identical in the database artifact and master package) is the canonical schema candidate; the 43-model expanded draft is the documented target (ADR-0002).
5. Source packages are **immutable** under `reference/source-packages/`; canonical docs live in `docs/`; superseded material moves to `archive/pre-integration/` with rationale; nothing is deleted.
6. Every move/merge is recorded in `docs/repository-audit/06_FILE_MOVE_MAP.md`; direct conflicts are decided in the conflict register, never silently.

## Consequences

- The prototype keeps running unmodified; platform work (schema, contracts) grows beside it instead of replacing it.
- A later pnpm/Turborepo migration is a mechanical change confined to package manifests.
- Because ~72 package files are missing, 12 of 35 comparison domains were graded on summary text; decisions in those domains carry a re-review obligation if the full package is obtained (`06_UNRESOLVED_QUESTIONS.md`).
- No production readiness is implied: no backend, auth, tenancy, or persistence exists yet.
