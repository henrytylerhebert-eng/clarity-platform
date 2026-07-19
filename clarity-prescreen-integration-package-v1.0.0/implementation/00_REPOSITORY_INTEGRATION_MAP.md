# Repository Integration Map

## Current confirmed patterns to preserve

From the supplied snapshot:

- React/TypeScript client under `app/src`.
- Shared contracts and state machines under `packages/domain-contracts`.
- Controlled service packages with explicit command envelopes.
- Prisma persistence under `prisma/schema.prisma`.
- Authentication-derived actor/organization scope.
- Organization predicates, optimistic concurrency, idempotency, and audit.
- Synthetic fixtures and tests separated from canonical state.
- Existing prototype surfaces for Guided Intake, Evidence Review, Legal Status, Packet Preview, Routing, Bedboard, Custody Ledger, and Training/SOPs.

## Proposed placement to verify

```text
packages/domain-contracts/src/prescreen/
  assessment.ts
  pathway.ts
  readiness.ts
  transport.ts
  consent.ts
  events.ts
  errors.ts

packages/prescreen-service/
  src/commands/
  src/policy/
  src/ports/
  src/service.ts
  test/

packages/communication-task-service/
packages/referral-packet-service/
packages/facility-policy-service/
packages/transport-custody-service/

packages/api-service/
  routes/prescreens/
  routes/configuration/
  routes/transport/

app/src/workspaces/prescreen/
app/src/workspaces/central-intake/
app/src/workspaces/transport/
app/src/workspaces/configuration/

prisma/schema.prisma
prisma/migrations/<approved migrations>/

data/synthetic-cases/prescreen/

docs/product/prescreen/
docs/workflows/prescreen/
docs/architecture/adrs/
docs/testing/prescreen/
```

These paths are proposals. Codex must inspect existing naming, exports, test structure, API route shape, actor types, error taxonomy, and package conventions before creating files.

## Reuse vs build

| Capability | Reuse/extend | New runtime needed |
|---|---|---|
| Case identity/assignment | Existing case service | Prescreen-case link and collaboration grants |
| Documents/evidence | Existing foundations | Packet requirement linkage and external intake upload path |
| Authentication/actor | Existing auth service | External user/scoped access design |
| Benefits/authorization | Existing parallel lanes | Prescreen projection only initially |
| Legal Status demo | Reuse concepts/config pattern | Server-owned instrument/status records after approval |
| Custody ledger demo | Reuse hash-chain behavior | Server persistence, authorization, transport sequence |
| Packet preview demo | Reuse UX concepts | Durable packet versions/transmissions |
| Routing demo | Reuse response concepts | Authenticated facility submissions/responses |
| Communications/tasks | Minimal current support | New service/runtime |
| Facility policy ingestion | Document foundation supports sources | New configuration, extraction, approval, publication runtime |
| Operational trends | Existing analytics seam only | Governed events/projections and later mart |

## Dependency order

1. API/hosting/tenancy decision boundary.
2. Prescreen domain contracts.
3. Prescreen service and persistence.
4. Server-owned read projections.
5. Assessment UI and Central Intake receive flow.
6. Communications/tasks.
7. Durable packet.
8. Facility response.
9. Transport/custody.
10. Configuration/ingestion.
11. Integration adapters.
12. Aggregate trends.
