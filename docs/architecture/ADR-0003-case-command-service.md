# ADR-0003 — Case Command Service and Workflow Transition Engine

- **Status:** Accepted
- **Date:** 2026-07-11
- **Owner:** _placeholder — tech lead_
- **Related:** ADR-0001, ADR-0002, `docs/implementation/CASE_COMMAND_SERVICE.md`

## Context

The Prisma case repository gave the platform persistence, but nothing controlled *who may do what*. Every future API endpoint, UI screen, or worker would otherwise re-implement its own rules for creating, assigning, transitioning, and closing cases — inconsistently.

## Decision

1. **One controlled path.** All case mutations flow through `@clarity/case-service` (`CaseCommandService`), which enforces, in order: strict Zod envelope validation → role permission policy → rationale requirements → a single gateway transaction (tenant-scoped versioned read → state-machine validation against the fresh row → conditional write → atomic audit event → idempotency record).
2. **One approved Prisma adapter.** The service never touches Prisma; all persistence goes through `PrismaCaseCommandGateway` in `@clarity/case-repository`. Nothing outside `packages/case-repository` imports `@prisma/client`.
3. **Nine explicit commands:** CreateCase, AssignCase, UpdateCaseUrgency, UpdateCaseLocation, TransitionCase, UpdateWorkstreamStatus, RecordDecisionRationale, CloseCase, ReopenCase. No generic "update case" escape hatch.
4. **Schema change (justified):** `BehavioralHealthCase.version Int @default(0)` (optimistic-concurrency token, incremented by every mutation and used in every UPDATE predicate) and a `CommandIdempotencyRecord` table (`@@unique([organizationId, idempotencyKey])`). Migration `20260711133547_case_version_and_command_idempotency` — the foundation schema had no storage for either explicitly required capability.
5. **Roles come from the schema's `UserRole` enum**, mirrored in `domain-contracts/src/roles.ts`. Policy highlights: READ_ONLY_AUDITOR executes nothing; COMPLIANCE_REVIEWER may record rationale but cannot alter state; SYSTEM_ADMIN has no case-command rights (platform ≠ clinical operations); workstreams have per-workstream role policies (benefits → BENEFITS_VERIFICATION_SPECIALIST, etc.). Actor roles are caller-supplied — authentication is upstream and does not exist yet (documented assumption).
6. **Reopen is not a transition.** `canTransitionCase` still rejects everything out of a terminal state; `canReopenCase` is a separate, explicitly permitted exception path (ORGANIZATION_ADMIN + mandatory rationale, target must be an active state, clears `closedAt`).
7. **Audit vocabulary:** established REQ names kept (`CASE_STATUS_CHANGED`, `CASE_WORKSTREAM_CHANGED`) instead of the issue's synonyms; new actions added: `CASE_ASSIGNED`, `CASE_URGENCY_CHANGED`, `CASE_LOCATION_CHANGED`, `DECISION_RATIONALE_RECORDED`, `CASE_CLOSED`, `CASE_REOPENED`. Events now carry `previousStateHash`/`newStateHash` (SHA-256 of canonical case state), command name, and correlation id in `modelMetadata`.
8. **Statuses not added:** the issue's example alternate paths `RETURNED_FOR_MORE_INFORMATION` and `MEDICAL_TRANSFER_REQUIRED` are not in the canonical enum; `INFORMATION_INCOMPLETE` covers the first, and the second is a vocabulary gap tracked under OD-8 rather than silently expanding the ADR-0002 enum.
9. **Rationale-required actions:** UpdateCaseUrgency, CloseCase, ReopenCase, RecordDecisionRationale, and transitions into CANCELLED / WITHDRAWN / NO_PLACEMENT_FOUND / REFERRED_TO_ALTERNATIVE_LEVEL.

## Consequences

- Future API/UI layers call service methods only; adding a caller adds zero new business rules.
- Concurrent staff edits fail safely (`ConcurrencyConflictError`) instead of overwriting — verified by tests for stale `expectedVersion` and same-version races.
- Retried commands with idempotency keys replay instead of duplicating; a rolled-back command's idempotency record also rolls back, so real retries still succeed.
- The pre-existing `PrismaCaseRepository` remains for fixtures/tests and now also increments `version`; production-path mutations should use the command service.
- Fairness invariant preserved: no command consults financial state when acting on clinical work — enforced by construction and by test.
