# 06 — Post-Integration Repository Map

**Date:** 2026-07-10

```text
clarity-platform/                       (git repo; branch chore/clarity-master-package-integration)
├── README.md, ARCHITECTURE.md, SECURITY.md, GOVERNANCE.md,
│   CONTRIBUTING.md, IMPLEMENTATION_STATUS.md
├── package.json / package-lock.json    npm workspaces: app + packages/*
├── tsconfig.json, vitest.config.ts, .gitignore, .env.example (.env untracked)
├── app/                                WORKING PROTOTYPE (unchanged location)
│   ├── src/domain/                     tested domain logic (ledger, guards, clocks…)
│   ├── src/workspaces/                 11 role-scoped workspaces
│   └── smoke/                          Playwright suite
├── packages/
│   └── domain-contracts/               contracts scaffold (Phase 8) + schema-aligned enums
├── prisma/
│   ├── schema.prisma                   CANONICAL foundation schema (validated)
│   └── migrations/20260710233252_initial_clarity_foundation/
├── data/synthetic-cases/               3 validated synthetic fixtures + README
├── scripts/seed.ts                     contract-level seed loader entry
├── tests/{workflow,security,unit,data}/  39 safety/workflow baseline tests
├── docs/
│   ├── product/  architecture/ (incl. ADR-0001/0002)  workflows/  clinical/
│   ├── legal/  payer-and-benefits/  governance/  security/  testing/
│   ├── roadmap/  developer-handoff/  decisions/ (OPEN_DECISIONS, RISK_REGISTER)
│   ├── repository-audit/               THIS AUDIT TRAIL (00–06 + manifests + prompt)
│   └── 00–09-*.md                      historical Jul 8 docs (preserved, banner on index)
├── reporting-metrics-rebuild-package/  metrics substrate (canonical for analytics domain)
├── reference/
│   ├── source-packages/                IMMUTABLE:
│   │   ├── clarity-ai-master-architecture-v0.2.0-partial/   (15 loose files)
│   │   ├── clarity-ai-database-artifact{.zip,/}             (complete, 9 files)
│   │   ├── clarity-mh-codex-architecture-package.zip        (Jul 8)
│   │   ├── clarity-mh-architecture/                         (Jul 8 extracted+extended)
│   │   └── README.md                                        (not-canonical warning)
│   └── source-documents/
│       ├── clarity-mh-sources/          (SOP, CIA guidance, feasibility, xlsx…)
│       └── source-notes/                (conversation threads)
├── graphify-out/                        generated knowledge graph
└── .claude/launch.json                  dev-server launch config (app/)
```

Not created (deliberately, per ADR-0001 — no empty placeholder trees): `apps/`, the ~30-package split, `governance/` subdirs (first artifact creates them), `archive/pre-integration/` (nothing met the archive criteria), `.github/` (CI is OD-9).
