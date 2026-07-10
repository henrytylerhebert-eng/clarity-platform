# 04 — Repository Strategy

**Date:** 2026-07-10

## Existing technical stack (inspected, not assumed)

| Aspect | Finding |
|---|---|
| Package manager | **npm** (`app/package-lock.json`; no pnpm/yarn lockfiles anywhere) |
| Node version | not pinned (no `.nvmrc`/`engines`) — open item |
| Framework | Vite 6 + React 19, `app/` only |
| TypeScript | 5.7, strict project config in `app/tsconfig.json`, `tsc -b` in build |
| Database tooling / ORM | **none installed** — Prisma exists only as schema text in packages |
| Test framework | Vitest 2 (10 domain test files) + Playwright (smoke suite, desktop+mobile) |
| Lint/format | none configured — open item |
| Build | `tsc -b && vite build` (verified: `dist/` exists) |
| CI | none (`.github/` absent) |
| Deployment | none (explicitly out of scope for the prototype) |
| App/package boundaries | single app; clean internal `domain/` vs `workspaces/` split |

## Strategy chosen: **A — existing implementation is viable; adapt the package to it**

**Why not B (fresh pnpm/Turborepo scaffold):** the repository is not "mostly documents" — `app/` is a working, tested prototype that already implements several package requirements (hash-chained audit ledger, prohibited-language guards, packet builder, role scoping, compliance clocks). Discarding or shadowing it with an empty 30-package scaffold would violate the prime rule of the package's own INTEGRATION_PLAN: *expand, don't restart*.

**Why not C (archive existing):** there is no evidence the existing code is incompatible or fragmented — tests pass (verified in Phase 9), the architecture docs match the code, and the package explicitly builds on the same primitives. Archiving working code without evidence is prohibited.

## What A means concretely

1. `app/` stays intact and running (path preserved; `.claude/launch.json` still valid).
2. A **minimal npm-workspaces root** is added (root `package.json` with `workspaces: ["app", "packages/*"]`) so shared domain contracts can live outside the demo app without adopting pnpm/Turborepo today. The package's pnpm+Turborepo recommendation is **deferred, not rejected** — revisit when a second app (api/worker) exists. Tradeoff recorded in ADR-0001.
3. `prisma/` at the root holds the canonical schema (Phase 7); Prisma is added as a dev dependency at the root, not inside `app/`.
4. `packages/domain-contracts/` receives the Phase 8 scaffold (Zod schemas, state machines, audit helper, feature flags, seed loader) — contracts only, no business logic, no live integrations.
5. Documentation moves into the canonical `docs/` tree; packages stay immutable under `reference/source-packages/`; superseded material moves to `archive/` (nothing deleted).
6. The full target monorepo layout from `REPOSITORY_STRUCTURE.md` is recorded as the growth path in `ARCHITECTURE.md`, adopted incrementally.

## Directory target (adapted from the package, fitted to reality)

Only directories with real content are created now; empty placeholder trees are not scaffolded.

```text
clarity-platform/
├── app/                       # existing working prototype (unchanged)
├── packages/domain-contracts/ # Phase 8 contracts scaffold
├── prisma/schema.prisma       # canonical schema (Phase 7)
├── data/synthetic-cases/      # validated synthetic fixtures
├── docs/{product,architecture,workflows,clinical,legal,payer-and-benefits,
│        governance,security,testing,roadmap,developer-handoff,
│        repository-audit,decisions}/
├── governance/…               # created when first approval artifacts exist
├── reference/{source-packages,source-documents}/
├── archive/pre-integration/   # superseded-only material, with rationale
├── scripts/
└── README.md, ARCHITECTURE.md, SECURITY.md, GOVERNANCE.md,
    CONTRIBUTING.md, IMPLEMENTATION_STATUS.md
```
