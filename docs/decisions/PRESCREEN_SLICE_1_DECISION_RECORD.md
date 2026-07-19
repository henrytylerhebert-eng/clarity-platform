---
status: owner-approved bounded contract slice; implementation candidate verified locally
owner: Tyler / product owner
date: 2026-07-19
data_boundary: synthetic only
source_package: clarity-prescreen-integration-package-v1.0.0
implementation_paths:
  - packages/domain-contracts/src/prescreen/
  - tests/unit/prescreen-contracts.test.ts
---

# Prescreen Slice 1 Decision Record

## Decision

For translation of the Prescreen integration package into the live repository:

1. The package JSON Schemas and OpenAPI document govern the proposed contract
   shape and field names.
2. The package TypeScript reference implementation informs deterministic domain
   behavior when it does not conflict with those schemas.
3. Once accepted and verified in the live repository, code and tests under
   `packages/domain-contracts` and `tests` govern implemented behavior. The
   source package remains reference material and is not production evidence.

This resolves the observed shape conflict for Slice 1, including the nested
`orientation.domains` structure and the schema-defined jurisdiction and approval
field names. It does not adopt the package wholesale or make every proposed
contract canonical.

## Approved Slice

The approved implementation is contracts-only and includes:

- willingness and four-domain orientation observations;
- possible-pathway derivation that always requires authorized human review;
- medical-stabilization precedence without selecting a legal instrument;
- deterministic prescreen encounter transitions;
- immutable assessment-version successor rules;
- target-specific packet readiness with visible blockers and warnings;
- transport-category configuration that blocks secured-instrument categories;
- fail-closed consent-authority evaluation; and
- prescreen event envelopes and bounded event vocabulary.

The implementation is classified as **scaffolded and locally verified**, not an
integrated or released product capability. It contains deterministic contract
behavior but no persisted service, authenticated API, production tenancy,
frontend integration, external transport, or facility exchange.

## Safety Boundary

- Synthetic data only.
- No autonomous diagnosis, capacity determination, legal determination,
  medical-clearance determination, admission decision, placement decision, or
  transport-authority decision.
- Possible pathways are review prompts, not final determinations.
- Facility and jurisdiction rules remain versioned configuration requiring
  qualified human approval.
- Willingness, orientation, admission status, and transport authority remain
  distinct concepts.
- Post-attestation changes require a linked version or supplement; no silent
  overwrite is authorized.

## Explicit Non-Goals

- No Prisma schema or migration.
- No service, repository, API route, UI wiring, or localStorage migration.
- No provider-backed database, RLS rollout, worker, deployment, or live
  integration.
- No production PHI/PII.
- No claim that the untracked integration package is merged or shipped.

## Open Decisions Before Phase 2

1. Final repository placement or external archival policy for the immutable
   integration package, including its checksum-covered ignored `code/dist`
   files.
2. Prescreen role-to-permission mapping and authenticated principal policy.
3. Same-organization access and cross-organization referral/packet-sharing
   boundaries.
4. Submission, attestation, correction, and supplement command semantics.
5. Persistence tenancy, provider-backed enforcement, audit, retention, and
   operational ownership.
6. Clinical, legal, security/privacy, facility-profile, and transport-provider
   approvals.

Phase 2 service or persistence work is paused until an explicit owner
authorization names its paths, commands, exclusions, and required evidence.

## Verification Evidence

At approval time, the focused Prescreen suite passed 17 of 17 tests, targeted
Prescreen lint passed, and repository typecheck passed. These results verify the
bounded local contract behavior only. Broader repository release readiness is
not established by this record.

## Owner Acceptance

- **Decision:** Accept Slice 1 as a bounded implementation candidate and follow
  the conservative isolation recommendation.
- **Recorded by:** Tyler / product owner
- **Date:** 2026-07-19
- **Boundary:** This acceptance authorizes isolating and committing Slice 1 and
  this decision record. It does not authorize Phase 2, package relocation,
  production integration, external actions, or real data.
