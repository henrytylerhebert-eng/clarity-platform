# Clarity Directory CRM Apps Script

This bound-Sheet package populates the universal **Clarity Directory CRM - Foundation v1** workbook with the review-gated Acadiana public-safety, crisis-response, elder-protection, and grant-research seed packet.

## Boundary

- Public-source directory research only; no PHI, PII, criminal-history, or private case data.
- Every imported record stays `Needs Review` until a human approves its source and current operational details.
- The script does not contact agencies, send referrals, route patients, reserve capacity, submit grants, create users, or connect to CAD/EMR systems.
- Grant leads are staged as source records because the foundation workbook does not yet have an approved grant-opportunity entity.

## Install In The Existing Sheet

1. Open **Clarity Directory CRM - Foundation v1**.
2. Open **Extensions > Apps Script**.
3. Add the files `Config.gs`, `Code.gs`, `Menu.gs`, and `SeedData.gs` from this directory.
4. Replace the manifest with `appsscript.json` only if manifest editing is enabled.
5. Save the project and refresh the Sheet.
6. Run **Clarity Directory CRM > Initialize / Verify Foundation**.
7. Run **Clarity Directory CRM > Populate Public Safety Seed Data**.
8. Run **Clarity Directory CRM > Validate Seed Data**.

If the custom menu does not appear after a fresh reopen, run `installDirectoryOpenTrigger()` once from the Apps Script editor. This creates an idempotent installable open trigger for the bound Sheet.

The population function is idempotent. It upserts by stable IDs and preserves the synthetic foundation rows.

## Current Deployment Status

Verified on 2026-07-19 against **Clarity Directory CRM - Foundation v1**:

- The combined source is saved in the bound Apps Script project **Clarity Directory CRM**.
- `initializeDirectoryCRM()` executed successfully from the Apps Script editor.
- The public-source seed packet is populated in the live Sheet and its native table ranges were verified.
- The automatic custom-menu trigger is **pending owner authorization**. Google presented an unverified-app warning when the installable open trigger requested permission, so automated setup stopped at that security interstitial.

The older `tools/apps-script/public-safety-crm/` package creates a separate research-workbook schema. Do not install both packages into the same Sheet.
