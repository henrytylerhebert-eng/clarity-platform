# Architecture

Entry point for the technical architecture. The full document set lives under `docs/`.

- **System architecture:** [docs/architecture/SYSTEM_ARCHITECTURE.md](docs/architecture/SYSTEM_ARCHITECTURE.md) — operating spine, platform layers, implementation state, growth path.
- **ADRs:** [ADR-0001 repository & integration strategy](docs/architecture/ADR-0001-repository-and-integration-strategy.md) · [ADR-0002 canonical data model](docs/architecture/ADR-0002-canonical-data-model.md)
- **Case workflow:** [docs/workflows/CASE_WORKFLOW.md](docs/workflows/CASE_WORKFLOW.md)
- **Domains:** [clinical](docs/clinical/CLINICAL_INTELLIGENCE.md) · [legal](docs/legal/LEGAL_STATUS_ARCHITECTURE.md) · [benefits](docs/payer-and-benefits/BENEFITS_VERIFICATION.md) · [authorization](docs/payer-and-benefits/AUTHORIZATION_MANAGEMENT.md) · [payer intelligence](docs/payer-and-benefits/PAYER_INTELLIGENCE.md)
- **Data model:** `prisma/schema.prisma` (canonical persistence schema; the older source-package counts are historical); expanded 43-model target preserved in the source package; comparison in [docs/repository-audit/05_SCHEMA_COMPARISON.md](docs/repository-audit/05_SCHEMA_COMPARISON.md).
- **Contracts:** `packages/domain-contracts/` — the single source for enums, state machines, and safety invariants shared by future services. Keep aligned with the Prisma schema.
- **Workflow discovery:** [docs/discovery/README.md](docs/discovery/README.md) — proposed documentation-only requirements-acquisition protocol; it does not replace ADRs, contracts, evidence, readiness, or implementation-status records.

## Shape today

```text
app/ prototype (localStorage plus selected API-backed workflows)
  -> packages/api-service (Fastify; authenticated local routes)
     -> authentication, case, prescreen, Rev Ops and IOP reconciliation services
        -> packages/case-repository (Prisma adapters) -> local PostgreSQL

packages/domain-contracts + accepted ADRs govern shared interfaces
```

Source inspection at `35f16eb` confirms the server and adapter wiring in
`packages/api-service/src/server.ts` and `src/devMain.ts`. Authentication and
tenant-scoped repository paths exist; prescreen persistence is wired through
`PrismaPrescreenGateway`. The prototype remains synthetic. Production hosting,
managed identity, provider-backed security acceptance, and PHI readiness are
not established by this documentation review. See `IMPLEMENTATION_STATUS.md`
for dated verification evidence and open decisions for remaining approvals.

The target monorepo layout preserved in
`reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/REPOSITORY_STRUCTURE.md`
is historical growth-path context, adopted incrementally per ADR-0001.
