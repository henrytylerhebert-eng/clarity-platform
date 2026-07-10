# Recommended Repository Structure

```text
clarity-ai/
├── apps/
│   ├── web/
│   ├── api/
│   ├── worker/
│   ├── admin/
│   └── docs/
├── packages/
│   ├── ui/
│   ├── config/
│   ├── database/
│   ├── auth/
│   ├── tenancy/
│   ├── audit/
│   ├── case-domain/
│   ├── workflow-domain/
│   ├── document-domain/
│   ├── evidence-domain/
│   ├── clinical-intelligence/
│   ├── legal-status/
│   ├── insurance-domain/
│   ├── eligibility-verification/
│   ├── benefits-verification/
│   ├── authorization-management/
│   ├── payer-intelligence/
│   ├── patient-financial-education/
│   ├── facility-intelligence/
│   ├── packet-builder/
│   ├── communications/
│   ├── custody-ledger/
│   ├── rules-engine/
│   ├── retrieval/
│   ├── prompt-registry/
│   ├── model-gateway/
│   ├── ai-orchestrator/
│   ├── integrations/
│   └── observability/
├── data/
│   ├── synthetic-cases/
│   ├── synthetic-documents/
│   ├── rule-sets/
│   ├── facility-profiles/
│   ├── payer-profiles/
│   └── evaluation-cases/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── workflow/
│   ├── security/
│   ├── evaluation/
│   └── regression/
├── governance/
│   ├── model-cards/
│   ├── prompt-approvals/
│   ├── rule-approvals/
│   ├── source-approvals/
│   ├── risk-register/
│   ├── incidents/
│   └── change-control/
├── infrastructure/
│   ├── docker/
│   ├── deployment/
│   ├── monitoring/
│   └── backups/
├── scripts/
│   ├── seed.ts
│   ├── create-synthetic-case.ts
│   ├── evaluate-agents.ts
│   ├── verify-audit-chain.ts
│   └── verify-tenant-isolation.ts
├── .github/
│   ├── workflows/
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
├── README.md
├── ARCHITECTURE.md
├── SECURITY.md
├── GOVERNANCE.md
├── CONTRIBUTING.md
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Package boundaries

Each domain package should export:

- types
- runtime schemas
- repository interface
- service interface
- errors
- audit action names
- tests

It should not import the web application.

## Suggested stack

- TypeScript
- pnpm
- Turborepo
- React
- Next.js or Vite
- PostgreSQL
- Prisma
- Zod
- Vitest
- Playwright
- object storage abstraction
- queue abstraction
- provider-neutral model gateway

The final selection should reflect the developer’s operating environment and deployment target.
