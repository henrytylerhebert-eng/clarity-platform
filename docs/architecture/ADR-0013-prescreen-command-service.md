# ADR-0013: Prescreen command service (Phase 2 — in-memory slice)

- **Status:** Accepted (owner-approved Phase 2 scope, 2026-07-19)
- **Date:** 2026-07-19
- **Source material:** `reference/source-packages/clarity-prescreen-integration-package-v1.0.0` (onboarded PR #17); Phase 1 contracts in `packages/domain-contracts/src/prescreen.ts`

## Context

The owner approved Prescreen Phase 2 as the next active product slice: turn the
Phase 1 prescreen contracts into a controlled command service, proven against
an in-memory gateway, while provider-backed Cloud SQL/RLS verification remains
a separate, non-waived infrastructure gate that must complete before any
prescreen persistence (Phase 3).

## Decision

Add `packages/prescreen-service` with the repository's command pattern and no
persistence:

1. **Seven entry points, six mutating commands.** StartPrescreenEncounter,
   SaveAssessmentDraft, AttestAssessment, CreateAssessmentSupplement,
   SubmitPrescreen, UpdatePacketRequirement, plus the read-only
   EvaluateTargetReadiness view (named gaps; no aggregate score).
2. **One controlled path.** Strict Zod envelope → explicit role policy
   (checked before any read, so authorization failures disclose nothing) →
   atomic gateway execution: tenant-scoped reads, Phase 1 state machine on
   the fresh row, version-bumped update, audit event, outbox envelope, and
   idempotency record committed together or not at all.
3. **In-memory gateway only.** `InMemoryPrescreenGateway` stages every
   validation before mutating anything, so failed commands leave no state,
   audit, outbox, or idempotency residue. Nothing is durable; the outbox is a
   recorded contract, not delivery.
4. **Idempotency fingerprinting is canonical.** Keys are scoped
   `org:actor:command:key`; the request fingerprint is a SHA-256 of a
   recursively key-sorted canonical JSON of the command body (excluding
   transport metadata: `correlationId` and the key itself). This deliberately
   fixes the reference package's defect where a top-level key-whitelist
   replacer serialized nested bodies as `{}` and let changed bodies replay
   (flagged by external review on PR #17). Same key + same body replays; same
   key + any changed field — at any depth — fails with
   `IDEMPOTENCY_KEY_REUSED`.
5. **Immutability by construction.** Attestation freezes an assessment
   version (status `ATTESTED`, SHA-256 content hash); no change-set can edit
   it — supplements are new `CORRECTED` versions citing `parentVersionId`
   with a mandatory reason. Submission requires a non-draft version and
   records intent only.
6. **Explicit synthetic role policy.** The service takes its role policy as a
   constructor input; only `SYNTHETIC_PRESCREEN_TEST_POLICY` (all codes
   prefixed `SYNTHETIC_`) exists. The prescreen actor schema accepts free-form
   role codes because the production `UserRole` enum has no prescreen roles
   and silently mapping external assessors onto unrelated existing roles is
   prohibited. Production role mapping is a recorded open decision
   (`docs/decisions/PRESCREEN_ROLE_MAPPING_DECISION_PACKET.md`) that must be
   resolved before any API/UI exposure of these commands.
7. **Structurally absent concepts.** No envelope can express a legal status,
   admission/placement decision, transport authority, Central Intake
   acknowledgement, facility acceptance, or cross-organization access grant.
   `SubmitPrescreen` names a workflow target and receiving organization as a
   recorded synthetic intent; tenant scoping is unchanged and the receiving
   organization can read nothing.
8. **Audit/outbox as contract.** Payloads carry identifiers, states, and
   SHA-256 hashes — never assessment narrative, location, or concern text
   (`assertNoRestrictedFields` plus hash-only payload discipline). Only the
   six command-coupled event types from the Phase 1 vocabulary are emitted.
   This intentionally deviates from the package event catalog's illustrative
   free-text minimum payloads: the repository's audit-metadata invariant wins.

## Consequences

- Phase 3 persistence now has an exact atomic specification: encounter row,
  assessment versions, packet requirements, submission record, idempotency
  record, audit event, outbox row, and the version-bump predicate.
- The role-mapping and cross-organization submission decisions are isolated
  from this slice and block API/UI work, not this service.
- The in-memory gateway is a test vehicle, not a runtime: no process
  restart survival is claimed anywhere.

## Follow-ups recorded for domain review (from external review on PR #19)

- **Consent-rule precedence:** a specificity-ordering policy remains a
  configured-rule governance decision. Until that policy is approved, multiple
  matching APPROVED rules fail closed with `AMBIGUOUS_APPROVED_RULES`; input
  array order cannot authorize consent.
- **Fractional pediatric ages:** `consentAgeBandFor` deliberately accepts
  whole years only (bands change at 12/16/18); representing fractional ages
  would change the contract surface and needs domain review.
- Two review findings were fixed in the Phase 1 contracts before merge, as
  deliberate conservative deviations from the reference package: NON_OPPOSED
  routing (owner decision #7) and privacy-regime fail-closed evaluation.

## Not claimed

Persistence, migrations, API routes, UI, external delivery, cross-tenant
collaboration, clinical/legal rule approval, production readiness, or HIPAA
compliance.
