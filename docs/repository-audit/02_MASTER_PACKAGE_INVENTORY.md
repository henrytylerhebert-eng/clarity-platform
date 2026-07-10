# 02 — Master Package and Database Artifact Inventory

**Date:** 2026-07-10
**Per-file detail:** `02_MASTER_PACKAGE_FILE_MANIFEST.csv` (24 files across both preserved packages).

## Immutable source copies

- `reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/` — the 15 loose master-package files copied verbatim from the workspace root, write-protected (`chmod a-w`).
- `reference/source-packages/clarity-ai-database-artifact.zip` — original ZIP retained.
- `reference/source-packages/clarity-ai-database-artifact/` — read-only extraction of the ZIP (9 files).

> **`reference/source-packages/` is historical source material.** It is **not** the canonical implementation location. Canonical documents live under `docs/`; the canonical schema lives at `prisma/schema.prisma`. See `reference/source-packages/README.md`.

## Master architecture package v0.2.0 — status: **INCOMPLETE**

### What the package claims (from its own README and QA report)

- Version 0.2.0, prepared 2026-07-10, "Clarity AI" working name.
- **87 files**, 68 Markdown, **10 synthetic JSON cases**, 19 numbered directories (`00-executive-overview/` … `18-open-decisions-and-risks/`), `diagrams/`, `manifest.json`.
- Expanded Prisma draft: 1,484 lines, 43 models, 56 enums, brace-balanced, **never validated with the Prisma CLI** (the QA report states `prisma format/validate/generate/migrate` were *not* completed because the schema engine could not be downloaded).
- Canonical decision: benefits verification is added as a parallel workstream; it does not restart the original design.

### What is actually present (15 files)

| File | Verified content |
|---|---|
| `README copy.md` | Package README v0.2.0 with folder map and usage guide |
| `MASTER_ARCHITECTURE.md` / `.html` | 27-section master architecture (md and styled html render of similar content) |
| `REQUIREMENTS_TRACEABILITY.md` | REQ-001…REQ-0xx matrix mapping requirement → model → UI → audit event → sprint |
| `QUALITY_ASSURANCE_REPORT.md` | Self-reported QA (see claims above) |
| `DEVELOPER_BRIEF.md`, `MASTER_BUILD_PROMPT.md`, `REPOSITORY_STRUCTURE.md`, `FIRST_25_GITHUB_ISSUES.md`, `HANDOFF_CHECKLIST.md` (+ byte-identical `(1)` copy) | The `16-developer-handoff/` set |
| `DATA_DICTIONARY(1).md` | "Comprehensive Data Dictionary" — the `08-data-and-database/` expanded dictionary (differs from the database artifact's shorter dictionary) |
| `SCHEMA_COVERAGE_AND_VALIDATION.md` | Coverage/validation status for both schemas |
| `schema(1) (1).prisma` | **Expanded target draft** — 1,484 lines, 43 models, 56 enums (exactly matches QA claims; recount performed independently) |
| `schema.foundation.prisma` | **Foundation schema** — 872 lines, 25 models, 35 enums; **byte-identical (SHA-256 `909bfedf…`) to the database artifact's `prisma/schema.prisma`** |

### What is missing (~72 of 87 files)

All of: `00-executive-overview/` (EXECUTIVE_SUMMARY, DECISION_LOG), `01-product-vision/PRODUCT_REQUIREMENTS.md`, `02-user-and-workflow-architecture/`, `03-clinical-intelligence/CLINICAL_INTELLIGENCE_SPEC.md`, `04-legal-and-regulatory/LEGAL_AND_REGULATORY_SPEC.md`, `05-benefits-and-payer-intelligence/BENEFITS_AND_PAYER_SPEC.md`, `06-placement-and-custody/`, `07-agent-architecture/`, remaining `08-data-and-database/` files (including `SCHEMA_COVERAGE_AND_VALIDATION` siblings), `09-rules-and-retrieval/`, `10-security-and-governance/SECURITY_PRIVACY_AND_GOVERNANCE.md`, `11-api-and-services/SERVICE_AND_API_ARCHITECTURE.md`, `12-ui-and-experience/`, `13-testing-and-evaluation/TEST_AND_EVALUATION_STRATEGY.md`, `14-commercial-model/`, `15-roadmap-and-sprints/ROADMAP.md`, `17-synthetic-cases/` (**7 of 10 synthetic cases**), `18-open-decisions-and-risks/{OPEN_DECISIONS,RISK_REGISTER}.md`, `diagrams/`, `manifest.json`.

**Consequence:** package claims that depend on missing files (executive overview, agent specs, API architecture, UI spec, evaluation strategy, commercial model, roadmap detail, open decisions, risk register, 7 synthetic cases, diagrams) are **UNVERIFIABLE — marked unknown** in the integration matrix. The `MASTER_ARCHITECTURE.md` summary sections are the only available statement of those domains.

### Independent verification performed

- Recounted models/enums/lines in both schemas — matches QA claims for the files present.
- `HANDOFF_CHECKLIST.md` = `HANDOFF_CHECKLIST (1).md` (identical hash) — one is a redundant browser re-download.
- Foundation schema = database-artifact schema (identical hash) — the master package **includes and supersedes** the database artifact's schema.
- File count claim (87) **cannot** be verified — only 15 present.
- No checksum manifest (`manifest.json`) available — per-file integrity of the download cannot be confirmed against the source.

## Database artifact package — status: **COMPLETE (9/9 files)**

Contents: README, `prisma/schema.prisma` (foundation, 25 models/35 enums), `docs/INTEGRATION_PLAN.md` (the key "expand, don't restart" document: sprint mapping, migration strategy, the 6 feature flags, explicit avoid-list), `docs/DATA_DICTIONARY.md` (short form), `docs/AUDIT_RULES.md`, `scripts/seed.ts`, and 3 synthetic cases (`er-commercial-primary`, `medicare-advantage-spouse`, `emergent-uninsured`).

Verification: all 3 JSON files parse; content is explicitly synthetic (`"privacyFlags": ["SYNTHETIC_ONLY"]`, `SYN-00x` references, "Synthetic Regional Medical Center"); no realistic member IDs, Medicare numbers, or policy numbers observed. ZIP internal timestamps 2026-07-10 21:14 (UTC) ≈ 17:30 local — created ~30 minutes **before** the master package files, and the master package absorbs its schema verbatim → classification **SUPERSEDED (by inclusion in v0.2.0)**, retained as historical source.

## Package version relationships

```text
Jul 8  clarity-mh-codex-architecture-package (v0.1 generation, "Clarity MH")
         └─ refined by docs/00–09 + app/ prototype (pre-package baseline)
Jul 10 17:30  clarity-ai-database-artifact  (benefits-verification data spine)
Jul 10 18:00  clarity-ai-master-architecture v0.2.0  (consolidates everything; PARTIAL locally)
```
