# ADR-0011 — Authentication: Sessions, Identity Port, and the Principal Bridge

- **Status:** Accepted
- **Date:** 2026-07-14
- **Related:** ADR-0003…ADR-0010 (all carried the assumption this ADR retires), `docs/planning/MVP_ROADMAP.md` (Phase 3), ADR-0012 (API architecture — Proposed)

## Context

Every ADR since 0003 has documented the same assumption: *actor roles are trusted caller input; authentication is upstream and does not exist.* Phase 3 builds that upstream. The deliverable is real identity for the existing `User`/roles model, middleware-ready session verification for the API phase, and the permission suites re-run against principals whose roles come from the database.

## Decisions

### 1. Server-side sessions with hash-only token storage

`AuthSession` (new model): opaque 32-byte random bearer token, returned to the caller **exactly once** and stored only as a SHA-256 hash — no code path can recover it, and tests assert neither the token nor its hash appears in audit metadata. Expiry defaults to one nursing shift (8h, configurable). Revocation is a timestamp, never a delete: the session trail survives for audit. Issuance and revocation are audited (`SESSION_ISSUED`, `SESSION_REVOKED`) as **organization-level events** — the first audit rows with `caseId: null`, which the audit writer's contract now honestly permits.

### 2. Identity verification is a port; the dev provider is not an IdP

`IdentityProvider.verifyAssertion(assertion) → { email }` answers only WHO — never roles, never tenancy. The recommended production implementation is a **managed IdP (OIDC) adapter** at deployment time (the roadmap's recommendation stands; wiring it requires accounts and secrets that belong to the deployment phase, handled by the owner). `LocalDevIdentityProvider` maps pre-registered synthetic assertions to emails — development-only, performs no cryptography, same posture as `LocalFilesystemObjectStorage`. **No passwords are stored anywhere in the system**, and none will be: password verification is the IdP's job.

### 3. The principal bridge retires the trusted-roles assumption

`AuthenticatedPrincipal` is built during session verification from the **User row**: roles, tenancy, and identity all come from the database. `principalToActor(principal)` is the only sanctioned way to construct a `CommandActor` above the service layer, and it has no parameter through which a caller could add roles. Uniform failure everywhere: unknown, tampered, expired, and revoked tokens — and deactivated users and suspended organizations — all present as one indistinguishable `AuthenticationFailedError` (verified: identical messages across all failure modes). Login failures are equally uniform (`LoginRejectedError`).

**Honest scope of the retirement:** the command services still accept `actor.roles` in their envelopes — they remain the *authorization* point and their existing tests still drive them directly. What changed is that a sanctioned identity path now exists, and the API phase (ADR-0012) makes it the **only** entry: HTTP callers will never supply an actor, only a bearer token. The assumption is retired at the authentication boundary; it is fully dead when the API layer is the sole caller.

### 4. Deactivation is immediate

Verification re-checks `User.status` and `Organization.status` on every call, so deactivating a user kills their live sessions on the next request — no waiting for expiry. (This is why verification hits the database rather than using stateless JWTs: revocation and deactivation must be immediate in a clinical setting.)

### 5. Permission suites against real principals

New integration tests drive the existing services with session-derived actors: a benefits-specialist session completes the full verification flow (with the audit trail carrying the real user id); an intake session is denied specialist commands *because the database says intake*; a tenant-B session with the right role still cannot touch tenant A's case (tenancy is principal-derived too).

## Out of scope (deliberate)

OIDC/managed-IdP adapter (deployment phase — port is ready); password auth (never); refresh tokens and sliding expiry; MFA; admin session-revocation commands (revoke-by-user, revoke-all); rate limiting and lockout (API-phase middleware); session listing UI.

## Consequences

- The API phase composes: `authenticate(bearer) → principal → actorFor(principal) → command envelope`, one call per request.
- CLAUDE.md's standing assumption ("actor roles are trusted caller input") needs updating **after this PR and the API phase land** — until the API layer is the sole caller, the assumption still holds for direct service callers.
- Known limits: no session cleanup job (expired rows accumulate — trivial future sweep, same class as idempotency retention); `assertNoRestrictedFields` guards audit metadata but token hygiene relies on the exactly-once return discipline, verified by test.
