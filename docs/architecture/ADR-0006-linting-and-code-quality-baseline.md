# ADR-0006 — Linting and Code Quality Baseline

- **Status:** Accepted
- **Date:** 2026-07-11
- **Numbering note:** the hardening brief referenced this as "ADR-0005"; numbering shifted because ADR-0004/0005 were already taken.

## Context

No lint configuration existed anywhere in the repository (verified in `docs/repository-audit/07_CASE_FOUNDATION_MILESTONE_REVIEW.md`). OD-9 (toolchain/CI) remains open; this ADR adds only the smallest maintained lint baseline, deliberately avoiding a formatting rewrite or rule churn across the existing, tested codebase.

## Decision

1. **ESLint flat config** (`eslint.config.mjs`) with `@eslint/js` recommended + `typescript-eslint` **non-type-checked** recommended. Installed at the root; covers `packages/`, `tests/`, `scripts/`, root config files, and `app/src` with the same rules (no React-specific plugins — nothing in the current failure history motivates them, and the brief forbids framework rules unless required).
2. **Type-checked rules deferred.** `recommendedTypeChecked` would require project-service wiring across workspaces and would surface dozens of stylistic findings in tested code — churn without a defect basis. Revisit with OD-9/CI.
3. **Ignores:** `node_modules`, `app/dist`, Playwright outputs, `coverage`, `prisma/migrations` (generated SQL), `graphify-out`, `reference/` and `reporting-metrics-rebuild-package/` (vendored source packages, not owned code), `.local-object-storage/` (synthetic file bytes), `clarity-platform-visualizer/` (separate nested repository), `.claude/worktrees/` (separate agent checkouts), `*.d.ts`.
4. **Consciously adjusted rules:**
   - `@typescript-eslint/no-explicit-any`: **warn** — the Prisma adapter boundary and Zod-narrowed envelopes occasionally need it; a warning surfaces new uses without blocking.
   - `@typescript-eslint/no-unused-vars`: error, with `^_` ignore patterns for intentionally unused parameters.
5. **Scripts:** root `npm run lint` (`eslint .`) and `npm run typecheck` (`tsc --noEmit`) added alongside the existing `test`.

## Findings corrected at adoption (all three legitimate, no churn)

- `preserve-caught-error` (new in ESLint 10): the two non-revealing "Case key … is unavailable" rethrows in `caseCommandGateway.ts` / `prismaCaseRepository.ts` now attach `{ cause: e }` — the outward message is unchanged (no cross-tenant leak), but the original Prisma error is preserved for diagnostics.
- `no-unused-vars`: `scripts/seed.ts` bound an upsert result it never used.

## Verified

`npm run lint` exits 0; `npm run typecheck` exits 0; full suite 112/112 after the fixes. The root lint command remains scoped to this repository; the nested visualizer has its own lint command and was verified separately.
