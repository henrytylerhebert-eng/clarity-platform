# ADR-0012 — API Architecture (OD-5)

- **Status:** **Accepted** — the native-Fastify migration is complete. Hosting, production tenancy/RLS, and operational readiness remain separately gated (OD-5, OD-6) and are not resolved by this acceptance.
- **Date:** 2026-07-14
- **Related:** ADR-0011 (authentication — the middleware this API consumes), ADR-0003 (command pattern), `docs/planning/MVP_ROADMAP.md` (Phase 4), OD-5.

## 2026-07-18 implementation note

A bounded authenticated vertical slice now exists in `packages/api-service` using `node:http`, not the Fastify package shape proposed below. It proves session-derived actor/tenant handling and one case decision-rationale route with integration tests. The owner accepted the thin Fastify adapter direction on 2026-07-18; this spike remains evidence for contract preservation, not a completed Fastify implementation. Hosting, full route surface, RLS timing, and deployment topology remain separately gated.

## 2026-09-12 implementation note

The native-Fastify migration referenced above is now complete. The original four routes (`/api/auth/login`, `/api/auth/session`, `/api/auth/logout`, `/api/cases/:caseKey/decision-rationale`) moved into `authRoutes.ts`, and all seven prescreen routes (ADR-0014) moved into `prescreenRoutes.ts` — both using native `app.get`/`app.post` registration in the same shape as `assuranceRoutes.ts`, `revOpsRoutes.ts`, `operatingWorkbookRoutes.ts`, and `iopReconciliationRoutes.ts`. The `app.all("/*", ...)` + `reply.hijack()` catch-all that previously carried these routes is removed from `server.ts`; a `setNotFoundHandler` now provides the equivalent generic `{ error: "not_found" }` 404 for anything unmatched. No request/response contract changed: the existing `api-service.test.ts` and `prescreen-api.test.ts` integration suites (11 + 12 tests, including both malformed-percent-encoding cases) pass unmodified, alongside the full root suite (755/755), the app suite (140/140), lint, typecheck, and `prisma validate`, all verified this session. This closes the architecture-audit's DRIFT-06 finding per the owner's ruling recorded there (see PR #73). Hosting, production tenancy/RLS enforcement, and operational readiness (health/readiness endpoints, structured logging, rate limits, graceful shutdown) remain unimplemented and separately gated — this note does not claim any of that is done.

## Decision to make

How HTTP callers reach the six command services (case, document, evidence, benefits, authorization, auth). Who decides: owner. By when: before Phase 4 starts.

## Recommendation

**Evolve the existing `packages/api-service` boundary to Fastify before adding more product routes, preserving the proven command-service and verified-principal behavior with zero new business rules.**

- **Route shape:** preserve the `/api` namespace and use resource/command routes such as `POST /api/cases/:caseKey/decision-rationale`. Tenant, actor, and roles never appear in a client-controlled path or body; they come only from the verified session.
- **Middleware:** `Authorization: Bearer <token>` -> `AuthenticationService.authenticate` -> `actorFor(principal)`. Every gateway query remains organization-scoped from that principal.
- **Errors:** map the existing error taxonomy to status codes mechanically (NotFound families → 404, PermissionDenied → 403, ConcurrencyConflict → 409, RationaleRequired/validation → 422, AuthenticationFailed → 401) — non-revealing messages pass through unchanged.
- **Contract tests** drive routes end-to-end against `clarity_dev`, asserting the HTTP layer adds no behavior the service suites don't already prove.

## Options considered

- **A. Fastify thin command mapper (recommended)** — Pros: minimal dependency, first-class TypeScript, schema-validation hooks align with the Zod envelopes, no framework lock-in around the services. Cons: hand-rolled route table (mitigated by the 1:1 mapping being mechanical).
- **B. Express** — Pros: ubiquitous. Cons: weaker TS ergonomics, middleware model encourages logic creep into the HTTP layer; no advantage over A here.
- **C. tRPC** — Pros: end-to-end types with the future UI. Cons: couples the wire format to a TS client, awkward for the eventual non-TS integrations (payer/EHR), and hides the HTTP surface security review needs to see.
- **D. GraphQL** — Cons dominate for a command-oriented domain: mutation soup over an already-explicit command pattern, resolver-level authorization re-invention, needless flexibility for a thin operational UI. Not recommended.
- **E. Status quo (no API)** — blocks Phases 5–6; only viable if the UI were built as a local monolith against the services directly, which forfeits the auth boundary. Not recommended.

## This holds if

The UI (Phase 5) is a web client and integrations stay request/response. A future event/webhook surface is additive, not a reversal. **Reversal trigger:** if the owner chooses a non-TS UI stack or an integration-first strategy, revisit C vs. A.

## Decision proposal for owner acceptance

### API boundary

- Accept Fastify as the production HTTP adapter inside the existing `packages/api-service` workspace.
- Port the four existing `node:http` routes without changing contracts, status semantics, body limits, or verified-principal derivation before adding another route.
- Keep authorization in command/domain policy. The API authenticates, validates transport input, maps errors, and delegates; it does not duplicate role policy or business rules.
- Add request IDs, structured redacted logs, security headers, explicit CORS, rate limits, health/readiness endpoints, and graceful shutdown at the adapter boundary.

### Hosting boundary

- Deploy the static React client and stateless Node API as separate units. The browser never connects directly to PostgreSQL.
- Place the API and managed PostgreSQL in the same approved region and private network where supported.
- Use a managed OIDC identity provider through the existing `IdentityProvider` port. Keep `LocalDevIdentityProvider` development-only.
- Run migrations as an explicit release job before API rollout; do not run migrations implicitly on application startup.
- Keep provider selection open until operational ownership, data residency, backup, and cost requirements are confirmed. This topology is provider-neutral.

### Tenancy boundary

- Use one PostgreSQL database and shared schema for the initial controlled pilot, with `organizationId` on every tenant-owned record.
- Derive organization scope only from the verified principal; reject caller-supplied tenant or role fields.
- Retain repository/service organization predicates and add PostgreSQL RLS as defense in depth before production data.
- Set transaction-local tenant context for RLS and test cross-tenant read, write, identifier-enumeration, and error-equivalence cases.
- Treat platform administration as a separate, audited policy path; `SYSTEM_ADMIN` does not silently bypass case-domain permissions.

### Operations and rollback

- Emit structured logs and metrics without PHI, tokens, assertions, source text, or unrestricted request bodies.
- Require health, readiness, migration, backup/restore, alerting, and session-revocation evidence before a production pilot.
- Roll back application code independently from schema. Database migrations must be backward-compatible for at least one application version or include an approved restore plan.
- Keep Product Studio read-only until object visibility, access auditing, and denial tests pass through this boundary.

### Reversal triggers

Revisit this decision if isolation requirements demand database-per-tenant, a non-Node integration gateway becomes primary, regional data-residency rules cannot be met by the selected provider, or route volume/streaming requirements exceed the thin request/response adapter.

## Needs validation

Remaining validation: port/hosting expectations (OD-6 interacts: same box vs. separate service); production RLS timing and provider selection; whether the app/prototype harvest (roadmap blind spot 3) implies any client constraint.

## Owner acceptance record

- **Decision:** Accept the thin Fastify adapter direction inside `packages/api-service`, preserving the existing `node:http` contracts and verified-principal behavior before adding product routes.
- **Recorded by:** Tyler / product owner
- **Date:** 2026-07-18
- **Boundary:** This acceptance does not approve a production provider, production data, RLS deployment, or operational pilot.
