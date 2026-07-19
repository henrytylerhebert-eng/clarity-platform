# Clarity Prescreen & Referral Orchestration — Integration Package

**Package version:** 1.0.0  
**Prepared:** 2026-07-19  
**Status:** Build-ready reference package; not merged, deployed, clinically approved, legally approved, or PHI-ready.

## Purpose

This package defines the product, architecture, contracts, behaviors, reference code, testing strategy, and repository handoff for the prescreen layer of the Clarity platform.

The product is a configurable field-to-Central-Intake operating system that helps crisis-response officers, hospital-employed prescreen assessors, municipal or state crisis teams, referral sources, Central Intake, authorized practitioners, transport providers, and receiving facilities coordinate one crisis referral from first contact through assessment, packet preparation, review, routing, transport, and custody handoff.

The product does **not** replace clinical judgment, legal authority, medical clearance, admission authority, transport authority, or facility governance.

## Core product promise

> Capture the story once. Preserve the source. Make missing work visible. Route decisions to the person with authority. Carry the case safely through handoff.

## What is included

- Product thesis, scope, roles, workflows, behavior rules, and UX specifications.
- Bounded-context, command/event/query, security, tenancy, audit, integration, and deployment architecture.
- Concrete JSON Schemas, OpenAPI contracts, CSV authorization matrices, event catalog, and error catalog.
- Proposed Prisma model and database constraints.
- Dependency-free TypeScript reference implementation with deterministic tests.
- Synthetic, non-PHI scenarios covering voluntary, noncontested, emergency-certificate, minor, transport, reassessment, and missing-packet paths.
- Repository integration sequence, migration plan, test plan, observability plan, release/rollback plan, security gate, Definition of Done, and Codex execution prompt.
- Curated copies of relevant Clarity repository snapshot documents.

## Safety boundary

- Synthetic data only.
- No autonomous diagnosis, capacity determination, legal determination, medical-clearance determination, admission decision, placement decision, or transport-authority decision.
- Facility and jurisdiction rules are versioned configuration with human approval, not universal truth.
- A patient’s willingness, orientation, admission status, and transport authority remain separate concepts.
- Post-submission assessment edits create versions or supplements. No silent overwrite.
- Raw patient information from the supplied completed form is intentionally excluded.

## Recommended reading order

1. `PACKAGE_STATUS.md`
2. `SOURCE_AND_ASSUMPTION_REGISTER.md`
3. `product/00_PRODUCT_THESIS.md`
4. `product/03_END_TO_END_WORKFLOW.md`
5. `product/04_BEHAVIORAL_RULES.md`
6. `architecture/00_SYSTEM_ARCHITECTURE.md`
7. `contracts/openapi.yaml`
8. `schema/proposed-prescreen-model.prisma`
9. `implementation/00_REPOSITORY_INTEGRATION_MAP.md`
10. `implementation/09_DEFINITION_OF_DONE.md`
11. `implementation/11_CODEX_EXECUTION_PROMPT.md`

## How to validate the reference code

```bash
cd code
npm install
npm run build
npm test
```

The reference code is intentionally framework-independent and does not modify the live Clarity repository. It demonstrates domain behavior and contract shape. Codex must reconcile it with the current repository before editing production paths.

## Package layout

```text
product/         Product definition, workflows, roles, behaviors, UX
architecture/    System, security, integration, deployment, ADRs
contracts/       OpenAPI, JSON Schemas, matrices, events, errors
schema/          Proposed Prisma model, SQL constraints, mappings
code/            Standalone TypeScript reference implementation + tests
frontend/        Screen, component, and UI-state specifications
synthetic/       Non-PHI scenarios
implementation/  Integration, slices, tests, release, rollback, handoff
reference/       Source-form mapping and terminology
source-material/ Curated repository snapshot; no raw source images
```

## “Shipped” meaning for this package

This package is shipped as an **implementation handoff** when:

- every required artifact is present;
- schemas and YAML parse;
- reference code compiles;
- reference tests pass;
- checksums are generated;
- source assumptions and open decisions are explicit;
- no PHI is present.

It is **not** the same as the feature being shipped in Clarity. The feature is shipped only after repository integration, clinical/legal/security approvals, production controls, migration evidence, deployment, and acceptance testing are complete.
