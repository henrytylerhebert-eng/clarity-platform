# Clarity Platform Architecture Index

Date: 2026-07-08

## Purpose

This index controls how the Clarity platform documents should be used.

The project now contains canonical architecture docs, generated implementation-kit docs, source/context materials, prototype code, and source notes. These should not be treated as equal authority.

## Authority Order

### 1. Canonical Architecture

Use these as the current project source of truth:

- `docs/01-project-architecture.md`
- `docs/03-data-model.md`
- `docs/04-build-roadmap.md`
- `docs/05-source-document-index.md`
- `docs/06-architecture-review.md`
- `docs/07-redundancy-priority-map.md`
- `docs/08-reporting-metrics-rebuilder.md`

These docs decide what Clarity is, what should be built first, what is deferred, and how source materials should be interpreted.

### 2. Implementation Handoff

Use this as a build-session brief, but subordinate it to the canonical docs:

- `docs/02-claude-code-handoff.md`

If it asks for more scope than the roadmap allows, follow `docs/04-build-roadmap.md`.

### 3. Generated Implementation Kit

Use this as supporting implementation material:

- `clarity-mh-architecture/`

This folder contains useful prompts, generated schema, workflows, diagrams, backlog, acceptance tests, and copied source materials. It is not the final architecture authority.

Key rule:

- Do not treat `clarity-mh-architecture/schema/prisma.schema.prisma` as production-ready.
- Do not treat `clarity-mh-architecture/database/supabase-rls.sql` as deployable without reconciling ID strategy, tenant scoping, and table names.
- Do use generated prompts, acceptance tests, and workflow docs as accelerators after the canonical architecture is understood.

### 4. Source And Context Materials

Use these as read-only context:

- `Clarity MH /`
- `clarity-mh-architecture/sources/`
- `reporting-metrics-rebuild-package/`
- `source-notes/`

Source materials inform architecture, but they do not automatically become product requirements. Product claims derived from them must be labeled as:

- `source-confirmed`
- `summary-derived`
- `requires legal review`
- `requires clinical review`
- `unknown`

### 5. Prototype And Reference Code

Use these as design/reference inputs:

- `Clarity MH /clarity-epec.jsx`
- `clarity-mh-architecture/prototype/clarity-epec.prototype.jsx`
- `clarity-mh-architecture/sources/clarity-epec.jsx`

The prototype shows workflow intent. It should not dictate production data model, security model, or legal enforcement.

## Clean Build Principle

Build Clarity from the canonical case spine:

`Case -> Encounter -> Assessment -> SourceReference -> RiskFinding -> MedicalNecessitySnapshot -> LegalInstrument -> CustodyLedgerEvent -> ReferralPacket -> FacilityReferral -> FacilityResponse`

Everything else is either:

- an operating view over this spine,
- a governance layer around this spine,
- a future integration,
- or a parking-lot feature.

## Current Build Decision

Priority is `MVP v0.1 - Intake Spine`.

Build first:

- case queue,
- case creation,
- guided intake,
- source references,
- risk findings,
- medical necessity draft,
- legal status and legal draft,
- custody ledger,
- referral packet preview,
- simulated facility referral response.

Defer command center, bedboard, analytics, AI provider integration, payer criteria engines, real EHR/CAD/RMS integrations, and production legal enforcement until the spine works.

## Company-Agnostic Modules

`reporting-metrics-rebuilder` is a reusable operating-intelligence module, not a Clarity-only feature. It should be geared first around utilization review excellence and should consume Clarity events later instead of blocking the v0.1 intake spine.
