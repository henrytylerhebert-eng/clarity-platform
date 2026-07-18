# 01 — Repository Map

**Audit date:** 2026-07-18 · **Mode:** Inspection only, no product code changed.
**Evidence standard:** every claim below is a **Verified repository finding** unless labeled otherwise.

## Stack

| Layer | Finding |
|---|---|
| Monorepo | npm workspaces: `app` + `packages/*` (root `package.json`) |
| Language | TypeScript strict, `noUncheckedIndexedAccess`, ESM (`tsconfig.json`) |
| Frontend | Vite + React 18, Vitest + Testing Library, Playwright smoke (`app/`) |
| Backend domain | Pure-TS service packages over Prisma 6 / PostgreSQL (`packages/*`, `prisma/schema.prisma`) |
| Tests | Vitest: root 214 tests / 27 files (unit, integration, security, workflow); app 63 tests / 10 files. **Observed runtime finding:** all green at audit baseline. |
| CI/CD | Single GitHub Actions workflow: `.github/workflows/pages.yml` — deploys the **entire `docs/` directory** to public GitHub Pages on push to `main`. No build/test/lint CI exists. |
| Knowledge graph | `graphify-out/` committed (9,795 nodes) |

## Applications and packages

| Unit | Purpose | Key fact |
|---|---|---|
| `app/` | Role-scoped demo UI ("intake spine" prototype) | **Fully standalone.** Zero `@clarity/*` imports; own domain layer (`app/src/domain/`), localStorage persistence (`storage.ts`, key `clarity-intake-spine-v0.2`), synthetic seed data |
| `packages/domain-contracts` | Types, Zod schemas, state machines, audit helper | Leaf; no I/O |
| `packages/case-repository` | **The only package allowed to import `@prisma/client`** (ADR-0003) | Gateways: case commands, documents, evidence, benefits, authorization, auth sessions, legal status |
| `packages/case-service` | Case command service | Role policy + state machine + rationale rules + idempotency + optimistic concurrency |
| `packages/document-service` | Document commands | SHA-256 dedupe, version families, storage abstraction (ADR-0004/0007) |
| `packages/evidence-service` | Evidence review | Category-scoped review authority; nothing auto-approved |
| `packages/benefits-service` | Manual benefits verification | ADR-0009 |
| `packages/authorization-service` | Authorization readiness | ADR-0010 |
| `packages/auth-service` | Session authentication | ADR-0011; SHA-256-hashed opaque tokens, 8h TTL, revocation; dev-only IdP. **No consumer outside tests.** |
| `packages/legal-hold-forms` | Louisiana OBH form schemas, advisory validators/deadlines, fillable-PDF render | Official blank PDFs vendored with checksums (`src/assets/PROVENANCE.md`) |

## The central architectural fact

> **Verified repository finding:** the platform is two disconnected halves. The backend services implement real, tested, role-gated, tenant-scoped, audited command paths — but **no API layer exists**, so nothing calls them except tests. The UI implements the full workflow experience — but against its own parallel client-side domain layer with **no enforcement of any kind**. `ARCHITECTURE.md` states this explicitly: "No backend, API, auth, or tenancy enforcement exists yet."

This is documented and intentional at the current stage (README: "an architecture-and-prototype repository, not a deployed clinical system. Synthetic data only."), not a latent surprise. Every finding in this audit must be read against that declared posture.

## Data stores & jobs

- PostgreSQL via Prisma; local `clarity_dev` guarded by `assertLocalClarityDevDatabase()` (refuses non-local DBs in tests).
- Document bytes: local-filesystem object storage adapter with path-traversal-proof opaque keys (ADR-0007).
- No queues, no background jobs, no event bus, no cache, no search index. (Verified absence.)

## Governance documents that bind this audit

- `GOVERNANCE.md` — 10 invariants; statutory logic is configuration pending counsel (OD-2).
- `SECURITY.md` — "requirements documented; controls NOT implemented"; synthetic data only.
- `docs/legal/LEGAL_STATUS_ARCHITECTURE.md` — binding non-enforcement rule.
- `docs/decisions/OPEN_DECISIONS.md` (OD-1…OD-12), `RISK_REGISTER.md` (R-1…R-12).
- `docs/legal/LOUISIANA_OPC_PEC_CEC_FORM_VERIFICATION.md` — form-vs-statute ground truth.

## Files not yet produced (phase 2 of this audit)

`02, 04–13, 15–17, 19–20` of the deliverable set. This first pass produced `00, 01, 03, 14, 18`.
