# Clarity Full-Stack Analytics Handoff

## Purpose

This package gives ChatGPT enough curated context to review, design, and produce a build-ready full-stack plan for Clarity's post-admission hospital operations and outcomes-intelligence layer.

The target is not a standalone dashboard. It must connect cleanly to Clarity's referral-through-admission workflow through a shared, governed event spine.

## Start Here

Upload this package to ChatGPT and instruct it to begin with `CHATGPT_MASTER_PROMPT.md`.

Recommended reading order:

1. `CHATGPT_MASTER_PROMPT.md`
2. `01_VERIFIED_CURRENT_STATE.md`
3. `02_TARGET_PRODUCT_SCOPE.md`
4. `03_DATA_COLLECTION_AND_GOVERNANCE.md`
5. `04_INTEGRATION_CONTRACT.md`
6. `05_REQUIRED_RETURN_PACKAGE.md`
7. `SOURCE_MANIFEST.md`
8. Relevant files under `source-material/`

## Expected Result

ChatGPT should return a self-contained `clarity-analytics-return-package` containing architecture decisions, schemas, API contracts, event contracts, role and authorization rules, UX specifications, an implementation sequence, migration and test plans, and a Codex execution handoff.

## Evidence Boundary

- The repository working tree is the implementation source of truth.
- This handoff is a curated snapshot, not proof that a capability is deployed.
- Current production hosting, managed identity, production tenancy, live integrations, and operational measurements are `Unknown` or not implemented unless the source material explicitly proves otherwise.
- No measurements found for denial reduction, margin improvement, transfer-time improvement, or other outcome claims.
- The legacy workbook and detailed audit/formula exports are intentionally excluded because repository documentation classifies them as business-sensitive reference artifacts.
- No real PHI should be added to the return package.

## Snapshot

- Repository: `clarity-platform`
- Branch observed: `main`
- HEAD observed: `8af3e69d0f7d057d2ed903c78f3e7428b131e492`
- Working tree: modified at packaging time; ChatGPT must treat this as a working-tree snapshot rather than committed-HEAD evidence.
- Package date: 2026-07-18

