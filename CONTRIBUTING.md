# Contributing

## Setup

```bash
npm install          # root workspace: app + packages
npm test             # root safety/workflow suites
cd app && npm test   # prototype domain tests
cd app && npm run smoke  # Playwright end-to-end (needs browsers installed)
npx prisma validate  # schema check (uses .env; copy .env.example)
```

Node: not yet pinned (open decision OD-9). Package manager: **npm workspaces** — do not introduce pnpm/yarn lockfiles (ADR-0001 defers that migration).

## Rules

1. Read `GOVERNANCE.md` and `SECURITY.md` first — the invariants there are enforced by tests and review, not optional.
2. **Never** commit real patient data, member IDs, credentials, or `.env`. Synthetic fixtures must pass the seed loader's `SYNTHETIC_ONLY` validation.
3. Do not edit anything under `reference/` — it is immutable source material. Canonical docs live in `docs/`; changes there need the front-matter provenance block updated.
4. Keep `packages/domain-contracts` enums aligned with `prisma/schema.prisma`; schema changes require a migration and an ADR amendment (ADR-0002).
5. Safety tests in `tests/` are contractual — a change that makes one fail is a design violation, not a test to update.
6. Every file move/merge of source material gets a row in `docs/repository-audit/06_FILE_MOVE_MAP.md`.
7. Small, single-purpose commits. Do not push to any remote without reviewing `SECURITY.md` §5 (business-sensitive source material).

## Adding new domains

Contracts first (`packages/domain-contracts`), schema second (migration + ADR), UI/services after. Feature-flag anything payer-facing (`featureFlags.ts`).
