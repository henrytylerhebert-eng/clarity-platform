# Codex Execution Prompt — First Approved Prescreen Slice

Use the following prompt after Tyler approves the first implementation slice.

---

You are implementing a controlled, repository-grounded first slice of **Clarity Prescreen & Referral Orchestration** in:

`/Users/tylerhebert/Documents/clarity-platform`

Do not merely describe changes. Inspect the repository, preserve existing work, implement only the approved slice, run verification, and return exact evidence.

## Source hierarchy

1. Current code and tests.
2. `IMPLEMENTATION_STATUS.md`.
3. Accepted ADRs and owner decisions.
4. Canonical architecture/workflow/security/governance docs.
5. The `clarity-prescreen-integration-package-v1.0.0` handoff.

If sources conflict, stop and report the conflict. Do not silently choose the more ambitious interpretation.

## Preflight

Before editing:

1. Print repository path, branch, HEAD, remotes, and `git status --short`.
2. Preserve all dirty work. Do not reset, clean, stash, checkout, or overwrite unrelated changes.
3. Read `IMPLEMENTATION_STATUS.md`, `SYSTEM_ARCHITECTURE.md`, `CASE_WORKFLOW.md`, `INTAKE_TO_ADMISSION_WORKFLOW.md`, `ADR-0012-api-architecture.md`, security/governance docs, and existing domain/service patterns.
4. Inspect current package naming, exports, Zod schemas, error taxonomy, actor/authorization policy, gateway transaction pattern, idempotency, audit helper, and tests.
5. Re-run the relevant baseline checks before editing.

## Approved first slice

Implement **domain contracts and deterministic tests only** for:

- patient willingness states;
- four-domain orientation observations;
- owner-defined formal-voluntary prescreen gate;
- possible pathway derivation that never makes the final admission/legal decision;
- prescreen encounter state machine;
- immutable assessment-version contract;
- target-specific referral-packet readiness contract;
- transport category/rule contracts, including configured OPC/PEC/CEC blocking of family/self/rideshare paths;
- consent-authority rule contract that fails closed without an approved rule;
- prescreen event envelope and event catalog types.

## Boundaries

Do not change:

- Prisma schema or migrations;
- API routes/framework;
- service runtime;
- frontend/UI;
- Product Studio;
- external integrations;
- deployment or feature flags;
- clinical, legal, facility, payer, or transport-provider facts;
- existing legal-clock values;
- production configuration.

Do not implement autonomous diagnosis, capacity, medical-clearance, legal status, admission, placement, or transport decisions.

## Required behavior

1. `WILLING + all four ORIENTED` may derive `POSSIBLE_FORMAL_VOLUNTARY_REVIEW` only.
2. `WILLING or NON_OPPOSED + orientation gate FAIL/UNKNOWN` may derive `POSSIBLE_NONCONTESTED_PATHWAY` only and must require authorized review.
3. `OPPOSED` or active emergency/legal process derives `EMERGENCY_OR_LEGAL_REVIEW_REQUIRED` without selecting an instrument.
4. Medical stabilization requirement takes precedence.
5. Blank/unanswered remains unknown or not assessed.
6. Attested assessment contract is immutable; later change is a supplement/version.
7. Readiness is target-specific and returns blockers with state, owner, rule source/version, and resolution workspace.
8. OPC/PEC/CEC rule contracts block family/support, self, taxi/rideshare, and unsecured categories when configured.
9. Transport provider qualification remains a future server responsibility; no vendor is hard-coded as live/qualified.
10. Consent authority fails closed without an approved matching rule.

## Tests

Add focused tests covering at least:

- willing/oriented;
- willing/not oriented;
- non-opposed/unknown orientation;
- opposed;
- medical stabilization;
- invalid transitions;
- target-specific packet blocker;
- unavailable/not-applicable states;
- OPC/PEC/CEC category rules;
- no approved consent rule;
- minor/guardian rule contract shape;
- event-envelope versioning.

Use synthetic data only.

## Stop conditions

Stop before editing and report if:

- current code already implements materially different accepted behavior;
- API/hosting/tenancy resolution is required for the approved contract-only slice;
- a change would require clinical/legal interpretation not present in approved owner decisions;
- existing dirty work overlaps the required files and cannot be preserved safely;
- the live repository conventions conflict with the handoff and require an owner decision.

## Verification

Run:

- focused tests;
- root tests;
- typecheck;
- lint;
- `git diff --check`;
- any repository-required schema/build checks even though this slice should not change schema/UI.

## Return

1. Completed/not completed.
2. Repository preflight state.
3. Exact files changed.
4. Behavior implemented.
5. Exact verification commands/results.
6. Conflicts or deviations from the handoff.
7. Clinical/legal/security boundaries preserved.
8. Next recommended slice.
9. `git status --short` and diff summary.

Do not claim production readiness or measured outcomes.

---
