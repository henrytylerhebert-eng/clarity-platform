# ADR-0005 — Atomic Assignee Tenant Validation

- **Status:** Accepted
- **Date:** 2026-07-11
- **Owner:** _placeholder — tech lead_
- **Related:** ADR-0003 (case command service), `docs/implementation/CASE_COMMAND_SERVICE.md`
- **Numbering note:** the hardening brief referenced this as "ADR-0004"; that number was already taken by `ADR-0004-document-service.md`, so this record is ADR-0005.

## Context

ADR-0003's known-limitations list documented a TOCTOU window in `AssignCase`: the service validated the assignee's organization membership via `gateway.findOrganizationUser(...)` *before* opening the command transaction. A membership change committed between that check and the transaction commit could produce a committed cross-organization assignment. The check also ignored `User.status`, so an `INACTIVE` or `LOCKED` user could be assigned.

## Decision

1. **The pre-transaction check is gone.** `CaseCommandService.assignCase` no longer performs any database read before the gateway transaction; `findOrganizationUser` was removed from the gateway entirely so no future caller can reach for the non-transactional path.
2. **Validation moved inside the transaction, enforced twice:**
   - An early scoped read inside the transaction (`tx.user.findFirst({ id, organizationId, status: "ACTIVE" })`) fails fast with the established non-revealing `CaseNotFoundError` — a caller cannot distinguish "no such user", "another tenant's user", and "inactive user".
   - The same invariant is **re-asserted as a relation predicate on the conditional UPDATE itself** (`organization: { users: { some: { id, status: "ACTIVE" } } }`, compiled by Prisma to an `EXISTS` subquery in the single UPDATE statement). Under READ COMMITTED each statement evaluates against the latest committed snapshot, so a membership/status change committed *after* the in-transaction read but *before* the UPDATE makes the UPDATE match zero rows; the gateway then throws `ConcurrencyConflictError` and the whole transaction — case mutation, audit event, idempotency record — rolls back. This is the "database-enforced conditional path" the requirement preferred.
3. **Active-status requirement adopted.** The schema defines `User.status UserStatus @default(ACTIVE)`; assignment now requires `ACTIVE`. `INACTIVE` and `LOCKED` users are rejected with the same non-revealing error.
4. **Gateway API:** `ExecuteCommandParams.requireActiveAssignee?: string` — a semantic parameter, so Prisma types stay inside the approved adapter package; `case-service` never sees a Prisma `WhereInput`.
5. **`decide` may now be async** (`CommandDecision | Promise<CommandDecision>`). Production deciders remain synchronous; the async form exists so tests can deterministically interleave an out-of-band committed write into the open transaction window (the TOCTOU regression test commits a status flip from a second pooled connection inside `decide`, after the in-transaction read passed, and proves the UPDATE predicate still blocks the commit).

## Residual honesty

READ COMMITTED does not serialize against a membership change that commits *after* the UPDATE statement executed but *before* the transaction commits. Closing that last sliver would require `SERIALIZABLE` isolation or a foreign-key-style constraint tying `assignedUserId` to the case's organization (not expressible as a plain FK across two columns without a composite-key redesign). The write-time `EXISTS` predicate reduces the window from "any time between service pre-check and commit" to "between the UPDATE statement and COMMIT of a sub-millisecond transaction", with no application-level check in between that could be fooled. Documented as accepted residual risk; revisit if/when RLS or DB-level constraints arrive (OD-6).

## Verified behavior (tests/integration/case-assignment-atomicity.test.ts, against clarity_dev)

1. Same-tenant ACTIVE assignee assigned; exactly one `CASE_ASSIGNED` audit event.
2. Cross-tenant assignee rejected; no case mutation, no audit event, no idempotency record.
3. Missing assignee rejected; nothing written.
4. `INACTIVE` and `LOCKED` assignees rejected with the same non-revealing error; nothing written.
5. Stale `expectedVersion` on assignment fails safely; row unchanged.
6. A membership change committed during the transaction window (simulated deterministically via async `decide`) cannot produce a committed invalid assignment; case, audit, and idempotency records all untouched.
