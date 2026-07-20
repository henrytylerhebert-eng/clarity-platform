# Definition of Done

A slice is not done because a screen renders. It is done only when all applicable evidence exists.

## Product

- Scope and non-goals approved.
- User, decision, source, owner, and next action are explicit.
- Loading, empty, unknown, stale, unauthorized, conflict, error, correction, and offline states are covered.
- Copy does not overstate clinical/legal authority.

## Domain and service

- Contracts and state transitions are deterministic and tested.
- Commands use authenticated actor, organization scope, strict validation, idempotency, correlation, and expected version.
- Human-review authority is enforced server-side.
- Attestation, packet, profile, and custody history is immutable/versioned.

## Persistence

- Migration reviewed and applied in test environment.
- Organization predicates and cross-tenant tests pass.
- Transaction includes state, audit, outbox, and idempotency where applicable.
- No synthetic residue remains after tests.

## API and UI

- OpenAPI/route contracts match implementation.
- Error taxonomy and field filtering are tested.
- Accessibility tests and keyboard review pass.
- No direct database/analytics writes from browser.
- Sensitive actions wait for server acknowledgement.

## Security/privacy

- Threat/risk review completed for the slice.
- No PHI in logs, analytics, fixtures, screenshots, or test artifacts.
- Authorization and denial equivalence tests pass.
- Dependencies and code scans pass.

## Operations

- Logs, metrics, traces, alerts, runbook, and rollback exist.
- Feature exposure is scoped and reversible.
- Migration/backup/restore implications are documented.

## Verification return

- branch/HEAD/working-tree state;
- files changed;
- tests/checks with exact results;
- schema/migration status;
- security/privacy review status;
- limitations/open decisions;
- rollback boundary;
- no unsupported claim that production is deployed or outcomes improved.
