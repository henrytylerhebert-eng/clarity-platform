# 06 — File Move Map

**Date:** 2026-07-10. Every move, merge, rename, replacement, and removal performed during integration.
Content was never changed during a move unless noted. Verified = SHA-256 equality checked before the original was removed.

## Commit key

- `33849c9` chore: capture pre-integration baseline (workspace as found)
- `a39a03f` docs: audit + immutable package copies created under `reference/source-packages/`
- `36e1bff` docs: integration matrix + ADR-0001
- `3177eae` chore: organize repository structure (all moves below)
- `053bdcf` docs: canonical documentation
- `dad535e` feat: canonical schema + synthetic cases (canonical **copies** below)
- `197cdc8` feat: domain contracts (also retires `app/package-lock.json`)
- `5d13461` test: safety baselines

## Canonical copies (source unchanged and retained; content copied, then adapted where noted)

| Source (immutable) | Canonical destination | Content changed? | Commit |
|---|---|---|---|
| `…v0.2.0-partial/schema.foundation.prisma` | `prisma/schema.prisma` | whitespace only (`prisma format`) | dad535e |
| `…/clarity-ai-database-artifact/data/synthetic-cases/*.json` (3) | `data/synthetic-cases/` | no | dad535e |
| `…/clarity-ai-database-artifact/scripts/seed.ts` | `scripts/seed.ts` | no | dad535e |
| `…v0.2.0-partial/DEVELOPER_BRIEF.md` | `docs/developer-handoff/DEVELOPER_BRIEF.md` | **adapted** (repo-fitted; original preserved) | 053bdcf |
| `…v0.2.0-partial/MASTER_BUILD_PROMPT.md` | `docs/developer-handoff/MASTER_BUILD_PROMPT.md` | pointer + restated rules | 053bdcf |

## Removals with preserved copies

`clarity-ai-database-artifact.zip` (root) — byte-identical tracked copy at `reference/source-packages/clarity-ai-database-artifact.zip`; root copy deleted (was untracked due to user global `*.zip` ignore; force-added in `3177eae`). `app/package-lock.json` — retired on workspace consolidation (`197cdc8`); recoverable from `33849c9`.

## Per-file moves and removals (commit 3177eae)

| Original path | Final path | Action | Commit |
|---|---|---|---|
| `DATA_DICTIONARY(1).md` | `reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/DATA_DICTIONARY(1).md` | verified copy preserved in a39a03f, root original removed | 3177eae |
| `DEVELOPER_BRIEF.md` | `reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/DEVELOPER_BRIEF.md` | verified copy preserved in a39a03f, root original removed | 3177eae |
| `FIRST_25_GITHUB_ISSUES.md` | `reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/FIRST_25_GITHUB_ISSUES.md` | verified copy preserved in a39a03f, root original removed | 3177eae |
| `HANDOFF_CHECKLIST (1).md` | `reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/HANDOFF_CHECKLIST (1).md` | verified copy preserved in a39a03f, root original removed | 3177eae |
| `HANDOFF_CHECKLIST.md` | `reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/HANDOFF_CHECKLIST.md` | verified copy preserved in a39a03f, root original removed | 3177eae |
| `MASTER_ARCHITECTURE.html` | `reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/MASTER_ARCHITECTURE.html` | verified copy preserved in a39a03f, root original removed | 3177eae |
| `MASTER_ARCHITECTURE.md` | `reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/MASTER_ARCHITECTURE.md` | verified copy preserved in a39a03f, root original removed | 3177eae |
| `MASTER_BUILD_PROMPT.md` | `reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/MASTER_BUILD_PROMPT.md` | verified copy preserved in a39a03f, root original removed | 3177eae |
| `QUALITY_ASSURANCE_REPORT.md` | `reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/QUALITY_ASSURANCE_REPORT.md` | verified copy preserved in a39a03f, root original removed | 3177eae |
| `README copy.md` | `reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/README copy.md` | verified copy preserved in a39a03f, root original removed | 3177eae |
| `REPOSITORY_STRUCTURE.md` | `reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/REPOSITORY_STRUCTURE.md` | verified copy preserved in a39a03f, root original removed | 3177eae |
| `REQUIREMENTS_TRACEABILITY.md` | `reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/REQUIREMENTS_TRACEABILITY.md` | verified copy preserved in a39a03f, root original removed | 3177eae |
| `SCHEMA_COVERAGE_AND_VALIDATION.md` | `reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/SCHEMA_COVERAGE_AND_VALIDATION.md` | verified copy preserved in a39a03f, root original removed | 3177eae |
| `CLAUDE_CODE_CLARITY_INTEGRATION_PROMPT.md` | `docs/repository-audit/CLAUDE_CODE_CLARITY_INTEGRATION_PROMPT.md` | git mv (rename) | 3177eae |
| `schema.foundation.prisma` | `prisma/schema.prisma` | git mv (rename) | 3177eae |
| `Clarity MH /CIA Comp initial Assesment guidance .md` | `reference/source-documents/clarity-mh-sources/CIA Comp initial Assesment guidance .md` | git mv (rename) | 3177eae |
| `Clarity MH /Centralized Behavioral Health Intake SOP Manual.docx` | `reference/source-documents/clarity-mh-sources/Centralized Behavioral Health Intake SOP Manual.docx` | git mv (rename) | 3177eae |
| `Clarity MH /Louisiana Inpatient Psychiatry Assessment and Crisis Platform Feasibility Report.md` | `reference/source-documents/clarity-mh-sources/Louisiana Inpatient Psychiatry Assessment and Crisis Platform Feasibility Report.md` | git mv (rename) | 3177eae |
| `Clarity MH /Reporting Metrics Ops and Budget .xlsx` | `reference/source-documents/clarity-mh-sources/Reporting Metrics Ops and Budget .xlsx` | git mv (rename) | 3177eae |
| `Clarity MH /clarity-competitive-landscape-epec.md` | `reference/source-documents/clarity-mh-sources/clarity-competitive-landscape-epec.md` | git mv (rename) | 3177eae |
| `Clarity MH /clarity-epec.jsx` | `reference/source-documents/clarity-mh-sources/clarity-epec.jsx` | git mv (rename) | 3177eae |
| `Clarity MH /clarity-holistic-synthesis.md` | `reference/source-documents/clarity-mh-sources/clarity-holistic-synthesis.md` | git mv (rename) | 3177eae |
| `source-notes/mental-health-clarity-chain-of-custody-thread.txt` | `reference/source-documents/source-notes/mental-health-clarity-chain-of-custody-thread.txt` | git mv (rename) | 3177eae |
| `source-notes/research-product-scope-thread.txt` | `reference/source-documents/source-notes/research-product-scope-thread.txt` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/CODEX_MASTER_PROMPT.md` | `reference/source-packages/clarity-mh-architecture/CODEX_MASTER_PROMPT.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/CODEX_QUICKSTART.md` | `reference/source-packages/clarity-mh-architecture/CODEX_QUICKSTART.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/MANIFEST.md` | `reference/source-packages/clarity-mh-architecture/MANIFEST.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/README.md` | `reference/source-packages/clarity-mh-architecture/README.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/database/supabase-rls.sql` | `reference/source-packages/clarity-mh-architecture/database/supabase-rls.sql` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/diagrams/epec-custody-lifecycle.mmd` | `reference/source-packages/clarity-mh-architecture/diagrams/epec-custody-lifecycle.mmd` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/diagrams/system-architecture.mmd` | `reference/source-packages/clarity-mh-architecture/diagrams/system-architecture.mmd` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/docs/compliance/clinical-safety-guardrails.md` | `reference/source-packages/clarity-mh-architecture/docs/compliance/clinical-safety-guardrails.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/docs/compliance/emtala-parallel-financial-lane.md` | `reference/source-packages/clarity-mh-architecture/docs/compliance/emtala-parallel-financial-lane.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/docs/compliance/rbac-audit-custody.md` | `reference/source-packages/clarity-mh-architecture/docs/compliance/rbac-audit-custody.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/docs/product/00-product-thesis.md` | `reference/source-packages/clarity-mh-architecture/docs/product/00-product-thesis.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/docs/product/01-module-architecture.md` | `reference/source-packages/clarity-mh-architecture/docs/product/01-module-architecture.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/docs/product/02-ui-routes.md` | `reference/source-packages/clarity-mh-architecture/docs/product/02-ui-routes.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/docs/product/03-mvp-scope.md` | `reference/source-packages/clarity-mh-architecture/docs/product/03-mvp-scope.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/docs/source-index.md` | `reference/source-packages/clarity-mh-architecture/docs/source-index.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/docs/workflows/assessment-training-protocol.md` | `reference/source-packages/clarity-mh-architecture/docs/workflows/assessment-training-protocol.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/docs/workflows/clinical-intake-workflow.md` | `reference/source-packages/clarity-mh-architecture/docs/workflows/clinical-intake-workflow.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/docs/workflows/epec-chain-of-custody-workflow.md` | `reference/source-packages/clarity-mh-architecture/docs/workflows/epec-chain-of-custody-workflow.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/docs/workflows/request-broadcast-routing.md` | `reference/source-packages/clarity-mh-architecture/docs/workflows/request-broadcast-routing.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/implementation/acceptance-tests.md` | `reference/source-packages/clarity-mh-architecture/implementation/acceptance-tests.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/implementation/epics-and-issues.md` | `reference/source-packages/clarity-mh-architecture/implementation/epics-and-issues.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/prompts/clarity-mh/assessment-summary.prompt.md` | `reference/source-packages/clarity-mh-architecture/prompts/clarity-mh/assessment-summary.prompt.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/prompts/clarity-mh/collateral-question-generator.prompt.md` | `reference/source-packages/clarity-mh-architecture/prompts/clarity-mh/collateral-question-generator.prompt.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/prompts/clarity-mh/denial-letter-mining.prompt.md` | `reference/source-packages/clarity-mh-architecture/prompts/clarity-mh/denial-letter-mining.prompt.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/prompts/clarity-mh/legal-instrument-review.prompt.md` | `reference/source-packages/clarity-mh-architecture/prompts/clarity-mh/legal-instrument-review.prompt.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/prompts/clarity-mh/medical-necessity-draft.prompt.md` | `reference/source-packages/clarity-mh-architecture/prompts/clarity-mh/medical-necessity-draft.prompt.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/prompts/clarity-mh/missing-fields-review.prompt.md` | `reference/source-packages/clarity-mh-architecture/prompts/clarity-mh/missing-fields-review.prompt.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/prompts/clarity-mh/referral-packet-draft.prompt.md` | `reference/source-packages/clarity-mh-architecture/prompts/clarity-mh/referral-packet-draft.prompt.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/prompts/codex/00-repo-orientation.prompt.md` | `reference/source-packages/clarity-mh-architecture/prompts/codex/00-repo-orientation.prompt.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/prompts/codex/01-phase-1-data-spine.prompt.md` | `reference/source-packages/clarity-mh-architecture/prompts/codex/01-phase-1-data-spine.prompt.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/prompts/codex/02-phase-2-ui-workflow.prompt.md` | `reference/source-packages/clarity-mh-architecture/prompts/codex/02-phase-2-ui-workflow.prompt.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/prompts/codex/03-epec-custody-integration.prompt.md` | `reference/source-packages/clarity-mh-architecture/prompts/codex/03-epec-custody-integration.prompt.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/prompts/codex/04-medical-necessity-workbench.prompt.md` | `reference/source-packages/clarity-mh-architecture/prompts/codex/04-medical-necessity-workbench.prompt.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/prompts/codex/05-request-broadcast-routing.prompt.md` | `reference/source-packages/clarity-mh-architecture/prompts/codex/05-request-broadcast-routing.prompt.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/prototype/clarity-epec.prototype.jsx` | `reference/source-packages/clarity-mh-architecture/prototype/clarity-epec.prototype.jsx` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/schema/demo-seed.json` | `reference/source-packages/clarity-mh-architecture/schema/demo-seed.json` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/schema/prisma.schema.prisma` | `reference/source-packages/clarity-mh-architecture/schema/prisma.schema.prisma` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/sources/CIA Comp initial Assesment guidance .md` | `reference/source-packages/clarity-mh-architecture/sources/CIA Comp initial Assesment guidance .md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/sources/Centralized Behavioral Health Intake SOP Manual.docx` | `reference/source-packages/clarity-mh-architecture/sources/Centralized Behavioral Health Intake SOP Manual.docx` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/sources/Louisiana Inpatient Psychiatry Assessment and Crisis Platform Feasibility Report.md` | `reference/source-packages/clarity-mh-architecture/sources/Louisiana Inpatient Psychiatry Assessment and Crisis Platform Feasibility Report.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/sources/Pasted text.txt` | `reference/source-packages/clarity-mh-architecture/sources/Pasted text.txt` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/sources/clarity-competitive-landscape-epec.md` | `reference/source-packages/clarity-mh-architecture/sources/clarity-competitive-landscape-epec.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/sources/clarity-epec.jsx` | `reference/source-packages/clarity-mh-architecture/sources/clarity-epec.jsx` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/sources/clarity-holistic-synthesis.md` | `reference/source-packages/clarity-mh-architecture/sources/clarity-holistic-synthesis.md` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/sources/intake-assessment-policy-procedure-manual.txt` | `reference/source-packages/clarity-mh-architecture/sources/intake-assessment-policy-procedure-manual.txt` | git mv (rename) | 3177eae |
| `clarity-mh-architecture/types/clarity-mh.types.ts` | `reference/source-packages/clarity-mh-architecture/types/clarity-mh.types.ts` | git mv (rename) | 3177eae |
| `schema(1) (1).prisma` | `reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/schema(1) (1).prisma` | verified copy preserved in a39a03f, root original removed | 3177eae |


## Note on origins

Files under `reference/source-packages/clarity-ai-master-architecture-v0.2.0-partial/` originate from a manual browser download of individual package files (evidenced by `(1)`/`copy` suffixes); exact upstream provenance is **unknown** — no `manifest.json` was available to verify integrity.
