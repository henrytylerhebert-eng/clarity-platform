# Live Repository Integration Mapping Guide

Codex must complete this table after inspecting the live tree. The package names are conceptual and must not create duplicate ownership.

| Package concept | Likely Clarity seam | Required verification |
|---|---|---|
| `CandidateField`, evidence, conflict contracts | `packages/domain-contracts` | Current export conventions, Zod version, enum naming |
| Review command service | existing controlled `*-service` pattern | Actor, policy, gateway, idempotency, concurrency and audit interfaces |
| Tenant persistence | `prisma/schema.prisma` and Prisma gateway | Existing Organization/Facility/Program models and migration naming |
| API routes | `packages/api-service` | ADR-0012 acceptance and current adapter shape |
| Review workspace | `app/src/workspaces` | Current navigation registry and role lenses |
| Source adapter | new port behind service | Egress policy, secrets, source allowlist and worker runtime |
| Audit events | current append-only audit model | Event type registry, metadata restrictions and transaction semantics |
| Product Studio | read-only evidence/roadmap display only | No mutation or deployment control |

## Collision rules

- Extend existing `Organization`, `Facility`, `Program`, `Contact` and evidence types when they already own the concept.
- Do not copy the proposed Prisma fragment wholesale.
- Do not treat current frontend role selection as authorization.
- Do not introduce a second audit or idempotency subsystem.
- Do not add an HTTP route while ADR-0012 remains unresolved unless the owner explicitly approves the bounded change.
