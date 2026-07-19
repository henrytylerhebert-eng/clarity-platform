# Integrate the Clarity Network Enrichment Production Package

You are implementing the approved Network Enrichment architecture in the local repository:

`/Users/tylerhebert/Documents/clarity-platform`

The source package is the folder delivered with this prompt: `clarity-network-enrichment-production-package`.

## Objective

Map the package into the live repository using current Clarity conventions, then implement the largest safe, independently verifiable slice that does not cross an unresolved architecture, tenancy, security, clinical or legal boundary.

## Mandatory preflight

1. Record branch, HEAD and `git status --short`.
2. Preserve all dirty and unrelated work.
3. Read `README.md`, `IMPLEMENTATION_STATUS.md`, source hierarchy, ADR-0012, current Prisma schema, domain-contract patterns, service/gateway patterns, auth principal-to-actor mapping, audit/idempotency/concurrency behavior and relevant tests.
4. Locate all existing organization, facility, program, contact, routing, evidence and Product Studio models.
5. Produce a collision/mapping table between package concepts and repository models.
6. Report conflicts before editing. Do not silently create a second system of record.

## Source hierarchy

1. Current code and tests.
2. Current canonical docs and accepted ADRs.
3. Owner decisions.
4. This package.

## Implementation boundary

Unless the live repository proves all required boundaries already exist, implement only:

- domain contracts;
- normalization;
- deterministic entity resolution;
- source authority;
- freshness;
- conflict detection;
- review-routing policy;
- candidate-package validation;
- synthetic fixtures and tests;
- repository-aligned documentation.

Do not add live scraping, canonical mutation, external APIs, queues, production deployment or operational facility criteria in the first slice.

## Required invariants

- Candidate data never becomes canonical without an authorized server command.
- Agent output cannot set `HUMAN_CONFIRMED`.
- Every candidate field has supporting evidence.
- Discovery-only sources cannot support populated fields.
- Unknown scalar values are null.
- Conflicts remain visible.
- Human-confirmed values cannot be overwritten.
- Sensitive admission/payer/transport/legal fields remain `REQUIRES_REVIEW`.
- Tenant and actor come from verified principal, not request input.
- Financial/payer data never blocks emergency clinical review.
- No PHI.

## Exact work method

1. Adapt the package paths to existing workspace conventions.
2. Prefer extending `packages/domain-contracts` over creating an unnecessary new package.
3. Reuse existing Zod, error, audit and test helpers.
4. Keep changes narrow and additive.
5. Add focused tests before broader integration.
6. Stop at ADR-0012 if new HTTP routes are required and the ADR is still unaccepted.
7. Stop before Prisma changes if canonical entity ownership is unresolved; still complete contracts and docs.

## Verification

Run the repository's actual commands, including at minimum:

- focused tests;
- root tests;
- typecheck;
- lint;
- app tests/build if touched;
- Prisma format/validate/generate if schema touched;
- `git diff --check`.

Never claim a check passed unless it ran and passed.

## Required final report

1. Completed.
2. Files affected.
3. Mapping from package concepts to current repository paths.
4. Invariants now enforced.
5. Tests and actual results.
6. Unresolved conflicts and stop conditions.
7. Decisions Tyler must approve.
8. Smallest next slice.
9. Exact files the next slice is expected to touch.
10. Rollback boundary.

Do not merely write a plan. Implement the safe approved slice and show evidence.
