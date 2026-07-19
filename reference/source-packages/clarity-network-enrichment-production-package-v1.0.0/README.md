# Clarity Network Enrichment Production Handoff

Version: `1.0.0-proposed`

This package is a repository-ready architecture and standalone reference implementation for Clarity's facility, organization, program, contact, payer, admission-profile, and transport-capability enrichment workflow.

## What it delivers

- A normalized organization → location → program data model.
- Deterministic entity resolution with explainable match signals.
- Field-level source evidence, authority, scope, freshness, and conflict handling.
- Candidate-only AI enrichment behavior with explicit human approval.
- Clinical, legal, payer, and transport review gates.
- Tenant-aware API, command, audit, and persistence contracts.
- A standalone TypeScript implementation with no runtime dependencies.
- Synthetic scenarios, validation, tests, and measurable accuracy metrics.
- A Codex execution prompt that maps this package into the live repository without overwriting unrelated work.

## Critical boundary

The enrichment agent does **not** create canonical CRM truth. It produces a versioned candidate package. An authenticated, authorized, server-owned command is required to approve a candidate field into the canonical network profile.

## Verification performed in this package

The standalone code is designed to compile with the globally available TypeScript compiler and run with Node's built-in test runner. See `VERIFICATION.md` for the actual results captured when this package was built.

## Start here

1. `docs/00_EXECUTIVE_ARCHITECTURE.md`
2. `docs/01_SOURCE_ASSUMPTION_REGISTER.md`
3. `docs/03_DOMAIN_MODEL.md`
4. `docs/04_ACCURACY_ENTITY_RESOLUTION.md`
5. `docs/07_REVIEW_APPROVAL_WORKFLOW.md`
6. `docs/14_IMPLEMENTATION_SEQUENCE.md`
7. `prompts/CODEX_EXECUTION_PROMPT.md`

## Package status

The package is complete as a proposed implementation contract. It is not evidence that the live Clarity repository has accepted ADR-0012, production hosting, managed identity, RLS, or live enrichment integrations. Codex must inspect and reconcile those boundaries before production deployment.
