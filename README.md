# Clarity Platform

Behavioral-health **case intelligence and access orchestration** — an architecture-and-prototype repository, **not a deployed clinical system**. Synthetic data only.

Clarity helps qualified professionals convert fragmented referrals, assessments, legal documents, payer information, facility criteria, and operational communications into structured, source-linked, human-reviewed workflows: intake → evidence → parallel clinical/legal/benefits workstreams → packet → routing → custody → audit.

## Repository map

| Path | What it is |
|---|---|
| `app/` | Working prototype (Vite + React + TS): guided intake, medical-necessity/legal drafts, hash-chained custody ledger, packet builder, simulated routing, bedboard. `cd app && npm run dev` |
| `packages/domain-contracts/` | Domain types, Zod schemas, state machines, audit helper, feature flags — contracts only |
| `prisma/` | Canonical foundation schema (validated; initial migration generated) — ADR-0002 |
| `data/synthetic-cases/` | Validated synthetic fixtures (3 of a planned 10) |
| `docs/` | Canonical documentation: `product/`, `architecture/` (incl. ADRs), `workflows/`, `clinical/`, `legal/`, `payer-and-benefits/`, `governance/`, `security/`, `testing/`, `roadmap/`, `developer-handoff/`, `decisions/` |
| `docs/00–09*.md` | Historical Jul 8 crisis-platform docs (preserved; see path-migration note in `00-architecture-index.md`) |
| `docs/repository-audit/` | Full integration audit trail: inventories, integration matrix, conflict register, gap analysis, schema validation, file move map |
| `reporting-metrics-rebuild-package/` | Reporting-metrics reverse-engineering analysis (metrics substrate) |
| `reference/source-packages/` | **Immutable** source packages (master architecture v0.2.0 partial, database artifact, Jul 8 package) — never edit, never treat as canonical |
| `reference/source-documents/` | Original research/source materials |
| `scripts/`, `tests/` | Seed script (contract-level) and safety/workflow baseline tests |

## Quick start

```bash
npm install            # root workspace (app + packages)
npm test               # root safety/workflow suites (vitest)
cd app && npm test     # prototype domain tests
cd app && npm run dev  # http://127.0.0.1:5173
npx prisma validate    # canonical schema
```

## Ground rules

- **Synthetic data only.** No real PHI/PII anywhere, ever, until formal security review (`SECURITY.md`).
- **Human gates stay intact.** No autonomous clinical, legal, admission, placement, or authorization decisions (`GOVERNANCE.md`).
- **Benefits quotes are not payment guarantees; payer memory is historical and unconfirmed; financial readiness never blocks emergency clinical review.** These are tested invariants, not slogans.
- The master architecture package is only **partially present** (15 of 87 files) — see `docs/repository-audit/02_MASTER_PACKAGE_INVENTORY.md` and open decision OD-1.

## Status

See `IMPLEMENTATION_STATUS.md` for the honest breakdown (completed / scaffolded / documented-only / blocked) and `docs/decisions/OPEN_DECISIONS.md` for what needs a human decision.
