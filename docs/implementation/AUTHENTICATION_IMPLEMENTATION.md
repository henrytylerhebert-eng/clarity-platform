---
status: Implemented and verified against clarity_dev
owner: TBD
version: 1.0.0
last_integrated: 2026-07-14
source_artifacts:
  - packages/auth-service/ (AuthenticationService, LocalDevIdentityProvider)
  - packages/case-repository/src/authGateway.ts (approved Prisma adapter)
  - packages/domain-contracts/src/authentication.ts (principal, bridge, IdP port)
  - prisma/migrations/*_auth_sessions
unresolved_conflicts: "managed-IdP (OIDC) adapter is deployment-phase work behind the ready port; trusted-roles assumption fully retires when the API layer (ADR-0012) is the sole caller"
related_requirements: MVP_ROADMAP Phase 3
related_adrs: ADR-0011 (decision record), ADR-0012 (Proposed), ADR-0003
---

# Authentication

Real identity for the existing `User`/roles model. Decisions: **ADR-0011**.

## Flow

```text
login(assertion)
  → IdentityProvider.verifyAssertion → email          (WHO — port; dev provider local-only)
  → PrismaAuthGateway.issueSession                    (ACTIVE user in ACTIVE org; uniform LoginRejectedError)
      AuthSession row: SHA-256(token) only            (raw token returned exactly once)
      lastLoginAt stamped; SESSION_ISSUED audited     (organization-level; caseId null)
authenticate(token)                                    (middleware-shaped: one call per request)
  → hash → session lookup → expiry/revocation/user-status/org-status checks
  → AuthenticatedPrincipal                             (roles FROM THE USER ROW)
  → all failure modes: one indistinguishable AuthenticationFailedError
actorFor(principal) → CommandActor                     (the bridge — no parameter can add roles)
logout(token) → audited revocation                     (timestamp, not delete; idempotent)
```

## Verified (this session, local clarity_dev — 8 integration tests)

Login issues a session whose principal carries database roles with `lastLoginAt` stamped and issuance audited without token material (neither the token nor its hash appears in metadata); the raw token is stored nowhere — only its SHA-256; unknown, tampered, revoked, and clock-advanced-expired tokens fail with byte-identical error messages; logout audits exactly once and is idempotent; deactivating a user kills their live session on the next request; login rejects unknown assertions and inactive users uniformly. Permission suites against real principals: a session-derived benefits specialist completes document → evidence → coverage → eligibility end-to-end with the audit trail carrying the real user id; an intake session is denied specialist commands because the database says intake; a tenant-B session with the right role cannot act on tenant A's case.

Full root suite **185/185**; app 37/37; lint, typecheck, `prisma validate`, `migrate status` clean; zero synthetic residue (sessions included in harness cleanup).

## Known limitations

1. The managed-IdP (OIDC) adapter is deployment-phase work — the port is ready; the dev provider must never front a real deployment. No passwords exist anywhere, by design.
2. The trusted-roles assumption is retired **at the authentication boundary**; service envelopes still accept roles for direct callers (their authorization tests depend on it). It dies completely when the API layer (ADR-0012) becomes the only entry.
3. No refresh tokens, MFA, admin bulk-revocation, rate limiting, or expired-session sweep yet (listed in ADR-0011 out-of-scope).
