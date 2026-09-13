# Codex Architecture Handoff

This is the authoritative briefing for implementation work following this session's
architecture audit. Read [CLARITY_ARCHITECTURE_LEDGER.md](CLARITY_ARCHITECTURE_LEDGER.md),
[ARCHITECTURE_DRIFT_REGISTER.md](ARCHITECTURE_DRIFT_REGISTER.md), and
[ARCHITECTURE_IMPLEMENTATION_PLAN.md](ARCHITECTURE_IMPLEMENTATION_PLAN.md) before starting
any slice below — this document only summarizes them for sequencing purposes.

## What is verified (this session, `main` at `15a094d`)

Root suite **755/755** (72 files), app suite **132/132** (20 files), `npm run lint` clean,
`npm run typecheck` clean, `npx prisma validate` clean — after applying this worktree's
10 pending migrations to local `clarity_dev` and regenerating the Prisma client (they
were missing; see DRIFT-01). Synthetic residue after the run: Organization +62, case +168
— not zero, tracked, not a new regression.

## What must not change

- **One Prisma package.** Only `packages/case-repository` may import `@prisma/client`
  (verified: grepped all 13 package.json files this session).
- **Command pattern:** Zod envelope → role/participant policy → one transaction
  (tenant-scoped reads, state machine, versioned update, atomic audit event, idempotency
  record). Do not reinvent this per new capability.
- **Tenancy in every predicate.** A record id is never authorization.
- **Append-only audit**, restricted-identifier guard — metadata carries hashes/field
  names, never source text or raw filenames.
- **Human decision gates** stay human: no automation may make clinical, legal, payer,
  placement, admission, discharge, or utilization-review judgments. Preserve
  contradiction-preservation (evidence-service, and Operating Assurance's conflict
  tracking) and append-only histories.
- **Synthetic-data boundary.** Nothing here is HIPAA-compliant or production-authorized;
  do not weaken `assertLocalClarityDevDatabase` or any RLS policy to make an
  implementation task easier.
- **Do not add Studio mutation/publication/feature-flag/worker/deployment controls**
  before server authorization and audit boundaries exist (standing house policy,
  `CLAUDE.md`) — this explicitly includes any outbox dispatcher/scheduler.

## Which files are authoritative

- `IMPLEMENTATION_STATUS.md` — capability-by-capability status, test counts, historical
  verification record. Now current as of `15a094d` (fixed this session, DRIFT-09).
- `docs/architecture/CLARITY_ARCHITECTURE_LEDGER.md` — this audit's canonical component
  inventory. Supersedes ad hoc claims elsewhere when they conflict.
- `docs/architecture/ADR-*` — binding decisions. ADR-0012 (Accepted in part, pending
  P0-2), ADR-0020 (new, Operating Assurance retroactive ratification) are the two most
  relevant to near-term work.
- `docs/product/CLARITY_PLATFORM_FULL_TREE.md` and
  `docs/product/WORKBOOK_PLATFORM_FULL_TREE.md` — navigation, not authority; defer to the
  ledger and `IMPLEMENTATION_STATUS.md` on any conflict.

## Which tests must remain green

The full house gate: `npm run lint`, `npm run typecheck`, `npm test` (root), `npm run
test:app`, `npx prisma validate`. For any slice touching a specific package, that
package's own integration suite must also pass with **no reduction in assertion count**
— a passing suite with fewer assertions than before is a regression, not a fix.

## Which architecture decisions are binding

- Modular-first: do not extract any domain into an independent service without new
  evidence changing its [SERVICE_EXTRACTION_MATRIX.md](SERVICE_EXTRACTION_MATRIX.md)
  score.
- No message broker, Kubernetes, Redis, API gateway, data warehouse, or serverless
  infrastructure without a demonstrated requirement (none exists today).
- ADR-0012's native-Fastify direction is binding; the catch-all routing is being retired,
  not extended.
- Operating Assurance's participant-grant authorization model is intentionally different
  from every other service's static role-policy table — do not "fix" it into conformity.

## Which assumptions require Tyler's approval

- Any P2 productionization item's specific vendor choice (object-storage provider,
  secrets manager, IdP, observability stack) — these are business/cost decisions, not
  engineering defaults.
- Whether CLPR or legal-hold-forms should graduate from BUILT/INTEGRATION-PENDING to a
  live, persisted product capability — this is a product-scope decision, not an
  engineering one, per the target-state CONDITIONAL labels.
- Which of the 12 mock-only workspaces gets wired first after IOP Reconciliation and
  Evidence Review (P1-1's recommended order) — confirm before starting a third slice.
- Hosting/deployment target (OD-5/OD-6) — blocks P2-5 through P2-8 entirely.

## Which work can be safely parallelized

- P0-1 (OA doc ratification), P0-3 (assurance Zod validation), and P1-2 (CLPR
  review-acceptance doc update) touch disjoint files and have no ordering dependency —
  safe to run in parallel.
- P1-3/P1-4/P1-5/P1-6 (the four code-consolidation items) touch overlapping files within
  `case-repository` and `domain-contracts` — sequence them, don't parallelize within this
  group, to avoid merge collisions on the same gateway files.
- P1-1's per-surface frontend wiring slices (IOP Reconciliation, then Evidence Review) are
  independent of each other and of everything in P0/P1-2 through P1-6 — safe to
  parallelize against those, but sequence the two frontend slices themselves one at a
  time until the pattern is proven once.

## Which work must remain sequential

- P0-2 (finish ADR-0012 Fastify migration) must land, and its full regression suite must
  re-pass, **before** any new route is added anywhere in `api-service` — adding routes to
  the catch-all pattern while it's being retired would create exactly the kind of drift
  this audit exists to prevent.
- P1-3 (idempotency helper) should land before P1-4 (canonical-JSON consolidation) since
  both touch `case-repository`'s gateway files and a combined diff is harder to review
  than two sequential small ones.

## Atomic implementation slices (in recommended order)

1. P0-1 — OA doc ratification (docs only, no tests to run beyond existing suite).
2. P0-3 — assurance-service Zod validation (one package, existing tests + new
   rejection-path tests).
3. P1-2 — CLPR review-acceptance doc update (docs only).
4. P0-2 — finish ADR-0012 Fastify migration (one package, full API + prescreen
   regression suite).
5. P1-3 — idempotency-violation helper extraction (one new file, four call-site swaps,
   existing tests only).
6. P1-4 — canonical-JSON equivalence proof, then consolidation (write the comparison
   test first; only proceed to the swap if it passes).
7. P1-5 — `withTenantContext` investigation (research spike, not a guaranteed code
   change — report back before altering any gateway).
8. P1-6 — archive the three dead reference packages (file moves + one doc-link fix).
9. P1-1 — IOP Reconciliation frontend wiring (first product-integration slice), then
   Evidence Review.

Each slice above is independently testable and mergeable — do not batch multiple slices
into one PR.
