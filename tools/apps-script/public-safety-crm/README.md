# Clarity Public Safety + Crisis Resource CRM

A lightweight, source-grounded Google Sheets + Google Apps Script CRM for Clarity's public safety and crisis-response directory research.

**IMPORTANT GOVERNANCE RULES:**
- This is a research and directory-operations tool ONLY.
- It does NOT claim Clarity is deployed, partnered, grant-approved, production-ready, or connected to any agency.
- It does NOT contact agencies, send referrals, route patients, reserve beds, provision users, or process PHI/PII.
- All data must be source-backed. If a source does not confirm something, write `[Unknown]`.
- All output is kept in `Needs Review` unless directly supported by a cited source.

## Setup Instructions
1. Create a new Google Sheet.
2. Go to **Extensions > Apps Script**.
3. Copy the `.gs` files from this directory into the Apps Script editor.
4. Save and close the Apps Script editor.
5. Refresh the Google Sheet. You will see a new **Clarity CRM** menu.
6. Click **Clarity CRM > Initialize CRM Sheets** to generate the tabs, headers, and validation dropdowns.
7. Click **Clarity CRM > Populate Seed Data** (optional) to add baseline Acadiana/Lafayette research records.

## Spreadsheet Tabs
- `Dashboard`: Automated counts and metrics.
- `Agencies`: Base records for Police, Sheriff, Hospitals, Providers.
- `Special Units`: CIT, Co-Responder, Homeless Outreach, etc.
- `Mobile Crisis Providers`: Specific mobile response teams.
- `Elder Protection`: OAAS, Adult Protective Services.
- `Existing Programs`: 988, Diversion, Crisis Stabilization.
- `Grant Opportunities`: DOJ, SAMHSA, local grants.
- `Clarity Fit`: Explicit product-opportunity matching (Inferences allowed here).
- `Sources`: URLs and dates for all claims.
- `Review Queue`: Records needing human review or source confirmation.
