# Clarity AI Database Artifact

This package contains the next recommended build artifact for Clarity AI.

## Included

- `prisma/schema.prisma`
- `docs/DATA_DICTIONARY.md`
- `docs/AUDIT_RULES.md`
- `docs/INTEGRATION_PLAN.md`
- `data/synthetic-cases/*.json`
- `scripts/seed.ts`

## Important Design Decision

Benefits verification is integrated as a parallel workstream inside the existing case architecture.

The package does not restart the system or replace the original case, document, evidence, workflow, rules, or audit domains.

## Prototype Safety

All seed cases are synthetic.

Do not use real patient data until security, privacy, access-control, retention, model-data, and deployment controls have been formally reviewed and implemented.

## Suggested Next Commands

```bash
pnpm add -D prisma
pnpm add @prisma/client
pnpm prisma format
pnpm prisma validate
pnpm prisma migrate dev --name add_core_case_and_benefits_domains
```

## Recommended Next Artifact

After validating this schema:

1. Generate the initial migration.
2. Add Zod domain schemas.
3. Add repository and service interfaces.
4. Add state-machine transition rules.
5. Add audit-event helpers.
6. Build the synthetic-case test harness.