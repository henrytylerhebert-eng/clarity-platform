# ADR-0012 — API Architecture (OD-5)

- **Status:** **Proposed** — drafted during Phase 3 per the roadmap; owner decision required before Phase 4 implementation.
- **Date:** 2026-07-14
- **Related:** ADR-0011 (authentication — the middleware this API consumes), ADR-0003 (command pattern), `docs/planning/MVP_ROADMAP.md` (Phase 4), OD-5.

## 2026-07-18 implementation note

A bounded authenticated vertical slice now exists in `packages/api-service` using `node:http`, not the Fastify package shape proposed below. It proves session-derived actor/tenant handling and one case decision-rationale route with integration tests. This spike does not change this ADR to Accepted and does not settle the production framework, full route surface, hosting, or deployment topology. OD-5 now means explicitly reconciling the spike with this proposal before additional API expansion.

## Decision to make

How HTTP callers reach the six command services (case, document, evidence, benefits, authorization, auth). Who decides: owner. By when: before Phase 4 starts.

## Recommendation

**A single thin HTTP layer (one new package, `packages/api`) using Fastify, mapping routes 1:1 onto existing command envelopes, with zero new business rules.**

- **Route shape:** `POST /orgs/:organizationId/cases/:caseId/commands/<CommandName>` (and login/logout under `/auth`). The body is the command payload minus `organizationId`/`caseId`/`actor` — those come from the path and the verified session, so an HTTP caller *cannot* supply an actor or roles by construction (completing ADR-0011's retirement).
- **Middleware:** `Authorization: Bearer <token>` → `AuthenticationService.authenticate` → `actorFor(principal)`; the principal's `organizationId` must equal the path's or the request is rejected before any service call.
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

## Needs validation

Owner sign-off on Fastify vs. Express taste; port/hosting expectations (OD-6 interacts: same box vs. separate service); whether the app/ prototype harvest (roadmap blind spot 3) implies any client constraint.
