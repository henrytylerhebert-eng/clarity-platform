# Clarity MH / Blue Partner Architecture Package

**Purpose:** give Codex a concrete build blueprint for the Clarity MH product: a Louisiana-first behavioral health crisis intake, medical-necessity, e-PEC/e-OPC/e-CEC custody, referral-routing, and treatment-continuity platform.

## What this package contains

- `CODEX_MASTER_PROMPT.md` — paste this into Codex first.
- `CODEX_QUICKSTART.md` — fast-start sequence for Codex sessions.
- `docs/product/00-product-thesis.md` — the product definition and strategic wedge.
- `docs/product/01-module-architecture.md` — product modules and responsibilities.
- `docs/product/02-ui-routes.md` — routes, screens, and primary user flows.
- `docs/product/03-mvp-scope.md` — MVP cut line and phase plan.
- `docs/workflows/clinical-intake-workflow.md` — central intake pipeline from first call to handoff.
- `docs/workflows/epec-chain-of-custody-workflow.md` — OPC → PEC → transmission → acceptance → CEC lifecycle.
- `docs/workflows/request-broadcast-routing.md` — XFERALL/OpenBeds-inspired routing without building a stale bed registry.
- `docs/compliance/clinical-safety-guardrails.md` — decision-support limits, AI limits, and review requirements.
- `docs/compliance/rbac-audit-custody.md` — roles, permissions, audit logs, hashing, WORM posture.
- `docs/compliance/emtala-parallel-financial-lane.md` — clinical lane must never be gated by benefits/insurance.
- `schema/prisma.schema.prisma` — starting Prisma domain model.
- `database/supabase-rls.sql` — starting Supabase RLS/audit posture.
- `types/clarity-mh.types.ts` — domain enums and DTO shapes.
- `prompts/clarity-mh/` — source-grounded AI prompt templates.
- `implementation/epics-and-issues.md` — Codex implementation backlog.
- `implementation/acceptance-tests.md` — safety and product acceptance criteria.
- `diagrams/*.mmd` — Mermaid diagrams for workflows and architecture.
- `prototype/clarity-epec.prototype.jsx` — existing prototype copy if available.
- `sources/` — uploaded source docs copied into the package for context.

## Recommended Codex sequence

1. Open the target repo.
2. Paste `CODEX_MASTER_PROMPT.md` into Codex.
3. Tell Codex to read this package first, especially `docs/product/03-mvp-scope.md`, `schema/prisma.schema.prisma`, and `implementation/epics-and-issues.md`.
4. Have Codex inspect the existing repo before changing files.
5. Implement Phase 1 only unless the repo is already prepared for more.

## North-star build sentence

**Clarity MH is a guided crisis-intake and clinical-documentation workbench that turns one structured capture into four reviewed outputs: assessment, medical-necessity narrative, legal instrument, and referral packet.**

## Non-negotiables

- No real PHI in demo data.
- No autonomous diagnosis.
- No autonomous admission decision.
- No “meets InterQual/MCG/ASAM/LOCUS” language unless licensed and counsel-approved.
- Every AI output is draft, source-grounded, and requires clinician review.
- Every legal/clinical transfer artifact is hashed, versioned, signed, and audit-logged.
- Clinical screening proceeds regardless of insurance status; benefits verification runs in parallel.


## Codex operating posture

Use Codex like an implementation agent, not a brainstorming partner.

The first Codex response should be a repo inspection report and implementation plan. The second response should make Phase 1 changes only after the plan is accepted.

The first build target is the data spine:

`case → encounter → assessment → source references → risk findings → medical-necessity snapshot → legal instrument → custody ledger → routing response → referral packet`

Keep statutory logic configurable until counsel validates trigger events, form language, and e-sign requirements.
