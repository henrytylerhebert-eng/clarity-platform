# Architecture

Entry point for the technical architecture. The full document set lives under `docs/`.

- **System architecture:** [docs/architecture/SYSTEM_ARCHITECTURE.md](docs/architecture/SYSTEM_ARCHITECTURE.md) — operating spine, platform layers, implementation state, growth path.
- **ADRs:** [ADR-0001 repository & integration strategy](docs/architecture/ADR-0001-repository-and-integration-strategy.md) · [ADR-0002 canonical data model](docs/architecture/ADR-0002-canonical-data-model.md)
- **Case workflow:** [docs/workflows/CASE_WORKFLOW.md](docs/workflows/CASE_WORKFLOW.md)
- **Domains:** [clinical](docs/clinical/CLINICAL_INTELLIGENCE.md) · [legal](docs/legal/LEGAL_STATUS_ARCHITECTURE.md) · [benefits](docs/payer-and-benefits/BENEFITS_VERIFICATION.md) · [authorization](docs/payer-and-benefits/AUTHORIZATION_MANAGEMENT.md) · [payer intelligence](docs/payer-and-benefits/PAYER_INTELLIGENCE.md)
- **Data model:** `prisma/schema.prisma` (canonical foundation, 25 models); expanded 43-model target preserved in the source package; comparison in [docs/repository-audit/05_SCHEMA_COMPARISON.md](docs/repository-audit/05_SCHEMA_COMPARISON.md).
- **Contracts:** `packages/domain-contracts/` — the single source for enums, state machines, and safety invariants shared by future services. Keep aligned with the Prisma schema.
- **Workflow discovery:** [docs/discovery/README.md](docs/discovery/README.md) — proposed documentation-only requirements-acquisition protocol; it does not replace ADRs, contracts, evidence, readiness, or implementation-status records.

## Shape today

```text
app/ (frontend demo, localStorage)     packages/domain-contracts (typed contracts)
                    \                   /
                     docs/ (canonical) + prisma/ (validated schema + migration)
```

No backend, API, auth, or tenancy enforcement exists yet. The package's target monorepo layout (preserved at `reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/REPOSITORY_STRUCTURE.md`) is the documented growth path; adoption is incremental per ADR-0001.
