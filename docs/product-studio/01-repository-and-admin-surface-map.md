# Repository and Admin Surface Map

## Current executable surfaces

| Surface | Location | Current state | Studio relevance |
| --- | --- | --- | --- |
| React prototype | `app/` | Working local UI with synthetic localStorage state | Host for the first Studio lens |
| Role model | `app/src/domain/roles.ts` | Demo workspace scoping | Reused for visibility demonstration only |
| Command Center | `app/src/workspaces/CommandCenter.tsx` | Operational case view plus existing feature map and roadmap feedback | Existing product-context pattern |
| Product Studio | `app/src/workspaces/ProductStudio.tsx` | New read-only synthetic registry | First connected Product/Build/Run view |
| API service | `packages/api-service/` | Backend foundation with verified-principal path for one command | Candidate future authority boundary |
| Domain contracts | `packages/domain-contracts/` | Shared contract foundation | Future registry and policy contracts |
| Prisma | `prisma/schema.prisma` | Canonical foundation schema | No Studio migration added in this slice |
| Tests | `app/src/*.test.tsx`, `tests/` | Vitest and integration coverage | Focused Studio navigation test added |

## Not found as verified production capability

- No production Product Studio route or persisted feature registry.
- No verified Studio-specific RBAC or object-level authorization.
- No feature-flag provider integration exposed by this slice.
- No release manager workflow or deployment control.
- No public roadmap publication pipeline.
- No validated third-party product analytics adapter.

## Source-of-truth boundary

The new UI is a synthetic projection for product review. It must not be treated as canonical runtime architecture, deployment state, or security policy. A future implementation should add a server-owned Feature Concept model and adapters to external systems without duplicating their authoritative records.
