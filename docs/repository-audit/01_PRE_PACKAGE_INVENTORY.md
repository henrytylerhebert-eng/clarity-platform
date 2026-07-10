# 01 — Pre-Package Workspace Inventory

**Date:** 2026-07-10
**Scope:** every file that existed **before** the Jul 10 package material arrived (202 files; full per-file detail in `01_PRE_PACKAGE_FILE_MANIFEST.csv` with path, size, SHA-256, mtime, classification, and sensitivity flags). Package paths and the loose Jul 10 root files are excluded per the package-origin rule.

## How origin was determined

- File-system mtimes cluster cleanly: pre-package material is 2026-07-08; package material is 2026-07-10 17:30–18:12. Timestamps were used as supporting evidence only.
- Content confirms the split: Jul 8 material consistently uses the **"Clarity MH / Clarity Crisis Platform / Blue Partner"** framing (Louisiana-first crisis intake, PEC/OPC/CEC statutory instruments, EPEC custody chain). Jul 10 material uses the **"Clarity AI"** framing (behavioral-health case intelligence, benefits verification, payer memory). No Git history exists to corroborate; origin claims beyond this are marked unknown.

## Inventory by area

### 1. `app/` — working prototype (48 files) — **CURRENT, WORKING CODE**

- **Stack:** Vite 6 + React 19 + TypeScript 5.7, Vitest (unit), Playwright (smoke), npm (package-lock.json present), no backend, no auth, localStorage state. Package name `clarity-intake-spine-prototype` v0.2.0.
- **Domain layer** (`src/domain/`, unit-tested): types, seed scenarios, hash-chained custody ledger (`hashLedger.ts`, `custodyLedger.ts`), prohibited-language guardrails (`guardrails.ts`), compliance clocks (`clocks.ts`), packet builder (`packets.ts`), bedboard placement rules (`bedboard.ts`), role scoping (`roles.ts`, `roleFocus.ts`), storage, selectors, analytics events.
- **Workspaces** (`src/workspaces/`): CaseQueue, CommandCenter, NewCase, GuidedIntake, MedicalNecessity, LegalStatus, PacketPreview, RoutingResponse, Bedboard, CustodyLedger, CaseOverview.
- **Safety posture already implemented:** demo-data-only banner; prohibited-language guard blocking clinical-determination claims; review-gated drafts; documented override reasons; hash-chained audit ledger. Seed data is synthetic ("Adult Demo A" patient tokens).
- Status: **current**. This is the only executable implementation in the workspace.

### 2. `docs/00–09` — canonical Jul 8 architecture docs (10 files) — **CURRENT (for the crisis-platform generation)**

Index, project architecture, Claude Code handoff, first-pass data model, build roadmap, source-document index, architecture review, redundancy/priority map, reporting-metrics rebuilder, personas and role-adaptive UX. `00-architecture-index.md` establishes an explicit authority order. These are the richest statement of the *crisis-intake* product generation and include an evidence-status register ("No measurements found" honesty markers).

### 3. `clarity-mh-architecture/` — extracted Jul 8 package (40 files) — **CURRENT source docs; partially superseded by docs/**

Extracted copy of `clarity-mh-codex-architecture-package.zip` plus additions (`assessment-training-protocol.md`, extra sources, `types/clarity-mh.types.ts`). Contains: product thesis/module architecture/UI routes/MVP scope, compliance docs (clinical safety guardrails, EMTALA parallel financial lane, RBAC/audit/custody), workflows (clinical intake, EPEC chain of custody, request broadcast routing), 7 clinical AI prompts + 6 Codex build prompts, **Prisma schema** (`schema/prisma.schema.prisma`, Supabase-flavored), `database/supabase-rls.sql`, demo seed, mermaid diagrams, acceptance tests, epics/issues, and the original source documents.

### 4. `Clarity MH /` — raw source materials (8 files; trailing space in dirname) — **SOURCE MATERIAL**

CIA comprehensive-assessment guidance (46 KB md), Centralized Behavioral Health Intake SOP Manual (docx), Louisiana feasibility report, competitive landscape (EPEC), holistic synthesis, `clarity-epec.jsx` prototype, `Reporting Metrics Ops and Budget .xlsx` (1.6 MB — **business-sensitive**), and the original architecture package ZIP.

### 5. `reporting-metrics-rebuild-package/` (13 files) — **CURRENT, self-contained analysis**

Reverse-engineering of the reporting spreadsheet: formula inventory (198 KB CSV), sheet dependency edges, metric definitions, dashboard modules, SQL blueprint, migration plan, sustainable model architecture, rebuild prompt, audit xlsx.

### 6. `source-notes/` (2 files) — **SOURCE MATERIAL**

Conversation-thread texts: chain-of-custody thread; research/product-scope thread.

### 7. Root and config

- `README.md` (Jul 8) — packet README describing the docs/ authority order and evidence status. Current for the pre-package generation.
- `.claude/launch.json` — dev-server launch config for `app/`.
- `graphify-out/` (73 files) — generated knowledge graph; regenerable, not source material.

## Duplication and conflict observations (pre-package only)

- `clarity-mh-architecture/sources/` duplicates most of `Clarity MH /` (assessment guidance, SOP, feasibility, competitive landscape, synthesis, epec jsx) — **DUPLICATE_EQUIVALENT**, retained in both places at baseline; consolidated during reorganization with the extracted-package copy as working reference.
- `clarity-mh-architecture/{docs,prompts,schema}` overlaps `docs/00–09` thematically; `docs/00-architecture-index.md` explicitly declares itself the higher authority ("canonical docs" over "generated package") — **EXISTING_EXPANDS_PACKAGE** (the Jul 8 docs refined the Jul 8 package).
- Two pre-package schemas exist: `clarity-mh-architecture/schema/prisma.schema.prisma` (12.4 KB) and `reporting-metrics-rebuild-package/SCHEMA_BLUEPRINT.sql` (reporting-only). Neither has ever been validated with the Prisma CLI as far as can be determined — marked unknown.

## Sensitivity flags

- `Reporting Metrics Ops and Budget .xlsx` and derivatives (`formula_inventory.csv`, `reporting-metrics-rebuild-audit.xlsx`): operational/budget data — business-sensitive, no PHI observed in sampled content; keep local, never push.
- SOP manual, CIA assessment guidance, intake policy manual: organizational policy documents; review before any external distribution; contain no patient records.
- App seed data, demo-seed.json: fully synthetic. **No real patient information found anywhere in the pre-package workspace.**
