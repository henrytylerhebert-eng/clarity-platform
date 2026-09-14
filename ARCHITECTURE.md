# Architecture

Entry point for the technical architecture. The full document set lives under `docs/`.

- **System architecture:** [docs/architecture/SYSTEM_ARCHITECTURE.md](docs/architecture/SYSTEM_ARCHITECTURE.md) — operating spine, platform layers, implementation state, growth path.
- **ADRs:** [ADR-0001 repository & integration strategy](docs/architecture/ADR-0001-repository-and-integration-strategy.md) · [ADR-0002 canonical data model](docs/architecture/ADR-0002-canonical-data-model.md) · [all accepted and proposed ADRs](docs/architecture/)
- **Case workflow:** [docs/workflows/CASE_WORKFLOW.md](docs/workflows/CASE_WORKFLOW.md)
- **Domains:** [clinical](docs/clinical/CLINICAL_INTELLIGENCE.md) · [legal](docs/legal/LEGAL_STATUS_ARCHITECTURE.md) · [benefits](docs/payer-and-benefits/BENEFITS_VERIFICATION.md) · [authorization](docs/payer-and-benefits/AUTHORIZATION_MANAGEMENT.md) · [payer intelligence](docs/payer-and-benefits/PAYER_INTELLIGENCE.md)
- **Data model:** `prisma/schema.prisma` (canonical persistence foundation, 38 models and 45 enums at this snapshot); expanded 43-model source-package target is historical comparison material in [docs/repository-audit/05_SCHEMA_COMPARISON.md](docs/repository-audit/05_SCHEMA_COMPARISON.md).
- **Contracts:** `packages/domain-contracts/` — typed state machines and safety invariants shared by services. Contract arrays are intended to mirror the canonical persisted vocabulary where documented. Current-main ADR-0018 resolves `MEDICAL_TRANSFER_REQUIRED`; OD-17 retains exactly `RETURNED_FOR_MORE_INFORMATION` as a ruled-but-unresolved mismatch, and OD-19 tracks the medical-diversion role-authority gap.
- **Workflow discovery:** [docs/discovery/README.md](docs/discovery/README.md) — proposed documentation-only requirements-acquisition protocol; it does not replace ADRs, contracts, evidence, readiness, or implementation-status records.

## Shape today

```text
app/ frontend prototype
        +--------------------------------------> localStorage
        |                         (most prototype state)
        +--> auth + case decision-rationale client
                    |
                    v
packages/api-service (bounded node:http API) --+--> auth/case service paths
        |                                      |    -> case-repository
        |                                      |    -> local PostgreSQL
        |                                      |
        +--> prescreen-service                 +--> no prescreen UI wiring
             -> in-memory prescreen gateway

packages/domain-contracts + accepted ADRs govern shared interfaces
```

Backend service foundations, database-backed authentication, tenant-scoped
repository paths, and a bounded same-organization prescreen API exist on
`main`. They are not a deployed product boundary: the prescreen gateway on
`main` remains process-local and in-memory; managed identity, provider-backed
RLS evidence, production hosting, observability, external integrations, and
PHI readiness are not implemented or approved. The package's target monorepo
layout (preserved at
`reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/REPOSITORY_STRUCTURE.md`)
remains a documented growth path adopted incrementally per ADR-0001.
