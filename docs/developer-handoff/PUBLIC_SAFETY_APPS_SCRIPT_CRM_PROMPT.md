# Antigravity Prompt: Public Safety + Crisis Resource Apps Script CRM

## Objective

Create a lightweight, source-grounded Google Sheets + Google Apps Script CRM for Clarity's public safety and crisis-response directory research.

This is a research and directory-operations tool only. It must not claim Clarity is deployed, partnered, grant-approved, production-ready, or connected to any agency. It must not contact agencies, send referrals, route patients, reserve beds, provision users, or process PHI/PII.

## Context

Clarity is building a governed behavioral health coordination platform. The CRM should help organize agencies that may participate in crisis triage, referral readiness, resource discovery, mobile crisis response, elder/vulnerable adult protection, and hospital/community handoff workflows.

The first target geography is Louisiana, beginning with Lafayette Parish / Acadiana and expanding outward when source coverage allows.

## Required Deliverable

Build a Google Apps Script CRM package that can be attached to a Google Sheet.

Create:

1. A Markdown implementation packet.
2. A Google Sheet tab schema.
3. Apps Script files.
4. Seed data placeholders.
5. Research instructions for source-backed population of the CRM.
6. A grant/opportunity tracking model.
7. Review gates that keep all claims human-approved.

Save the package in the repo as:

- `tools/apps-script/public-safety-crm/README.md`
- `tools/apps-script/public-safety-crm/Code.gs`
- `tools/apps-script/public-safety-crm/Config.gs`
- `tools/apps-script/public-safety-crm/Menu.gs`
- `tools/apps-script/public-safety-crm/Schema.gs`
- `tools/apps-script/public-safety-crm/Search.gs`
- `tools/apps-script/public-safety-crm/ReviewQueue.gs`
- `tools/apps-script/public-safety-crm/GrantTracker.gs`
- `tools/apps-script/public-safety-crm/SeedData.gs`
- `tools/apps-script/public-safety-crm/appsscript.json`

If Antigravity cannot write files directly, output the full file contents in separate fenced code blocks.

## Spreadsheet Tabs

Create or document these tabs:

1. `Dashboard`
2. `Agencies`
3. `Agency Contacts`
4. `Special Units`
5. `Mobile Crisis Providers`
6. `Elder Protection`
7. `Existing Programs`
8. `Grant Opportunities`
9. `Clarity Fit`
10. `Sources`
11. `Review Queue`
12. `Data Dictionary`
13. `Settings`

## Core CRM Records

### Agencies Tab

Fields:

- `agency_id`
- `agency_name`
- `agency_type`
- `jurisdiction`
- `parish_or_region`
- `service_area`
- `website`
- `main_phone`
- `non_emergency_phone`
- `crisis_phone`
- `public_email`
- `physical_address`
- `mailing_address`
- `mental_health_relevance`
- `current_solution_or_program`
- `potential_clarity_use_case`
- `grant_alignment`
- `review_state`
- `confidence_level`
- `last_verified_date`
- `source_ids`
- `notes`

Allowed `agency_type` values:

- `Police Department`
- `Sheriff Department`
- `Campus Police`
- `State Agency`
- `Mobile Crisis Provider`
- `Behavioral Health Provider`
- `Acute Care Hospital`
- `Elder Protection Agency`
- `Area Agency on Aging`
- `Community Crisis Response`
- `Other`

Allowed `review_state` values:

- `Needs Review`
- `Source Confirmed`
- `Human Confirmed`
- `Stale`
- `Do Not Use`

Allowed `confidence_level` values:

- `Confirmed`
- `Source-backed partial`
- `Inference`
- `Unknown`

### Special Units Tab

Capture any public safety unit or program specifically related to behavioral health, elder abuse, vulnerable adults, victim services, homelessness, diversion, CIT, co-response, crisis negotiation, or community response.

Fields:

- `unit_id`
- `agency_id`
- `unit_or_program_name`
- `unit_type`
- `description`
- `public_contact`
- `phone`
- `email`
- `referral_or_activation_path`
- `populations_served`
- `hours`
- `source_ids`
- `review_state`
- `confidence_level`
- `notes`

Allowed `unit_type` values:

- `CIT`
- `Co-Responder`
- `Mental Health Unit`
- `Community Response`
- `Elder Abuse / Vulnerable Adult`
- `Victim Services`
- `Homeless Outreach`
- `Crisis Negotiation`
- `Diversion`
- `Unknown`

### Mobile Crisis Providers Tab

Fields:

- `provider_id`
- `organization_name`
- `service_area`
- `crisis_phone`
- `main_phone`
- `website`
- `hours`
- `populations_served`
- `services`
- `law_enforcement_referral`
- `hospital_referral`
- `school_referral`
- `community_referral`
- `central_intake_available`
- `source_ids`
- `review_state`
- `confidence_level`
- `notes`

### Elder Protection Tab

Fields:

- `elder_protection_id`
- `agency_name`
- `program_name`
- `scope`
- `reporting_method`
- `reporting_phone`
- `website`
- `eligibility`
- `mandatory_reporter_notes`
- `service_area`
- `source_ids`
- `review_state`
- `confidence_level`
- `notes`

### Existing Programs Tab

Fields:

- `program_id`
- `agency_id`
- `program_name`
- `program_type`
- `description`
- `known_partners`
- `technology_or_platform_reference`
- `clarty_gap_or_opportunity`
- `source_ids`
- `review_state`
- `confidence_level`
- `notes`

Allowed `program_type` values:

- `CIT`
- `Co-Responder`
- `988`
- `Mobile Crisis`
- `Jail Diversion`
- `Crisis Stabilization`
- `Hospital Partnership`
- `Homeless Outreach`
- `Elder Protection`
- `Referral Directory`
- `Case Management`
- `Unknown`

### Grant Opportunities Tab

Fields:

- `grant_id`
- `program_name`
- `funder`
- `source_url`
- `status`
- `deadline`
- `eligible_applicants`
- `allowable_uses`
- `clarity_fit`
- `matched_agency_types`
- `match_confidence`
- `next_review_date`
- `notes`

Allowed `status` values:

- `Confirmed Current`
- `Recently Closed`
- `Historical`
- `Forecasted`
- `Needs Verification`

### Clarity Fit Tab

Fields:

- `fit_id`
- `agency_id`
- `workflow_layer`
- `problem_clarity_could_help_solve`
- `possible_clarity_module`
- `data_governance_needs`
- `human_approval_required`
- `integration_needed`
- `what_cannot_be_automated`
- `source_ids`
- `review_state`
- `notes`

Allowed `workflow_layer` values:

- `Prescreen`
- `Mobile Crisis Triage`
- `Law Enforcement Handoff`
- `Hospital ED Referral`
- `Behavioral Health Intake`
- `Elder Protection`
- `Discharge Planning`
- `Grant / Funding`
- `Administration`

### Sources Tab

Fields:

- `source_id`
- `source_title`
- `source_url`
- `publisher`
- `date_accessed`
- `source_type`
- `relevant_claim`
- `archive_or_pdf_path`
- `confidence_level`
- `notes`

### Review Queue Tab

Fields:

- `review_id`
- `record_type`
- `record_id`
- `claim_or_field`
- `current_value`
- `source_id`
- `review_reason`
- `assigned_to`
- `review_state`
- `review_notes`
- `created_at`
- `updated_at`

## Apps Script Requirements

Implement the Apps Script CRM with:

- Custom menu: `Clarity CRM`
- Menu actions:
  - `Initialize CRM Sheets`
  - `Validate Required Fields`
  - `Create Review Queue`
  - `Mark Selected Row Needs Review`
  - `Mark Selected Row Source Confirmed`
  - `Refresh Dashboard`
  - `Generate Grant Opportunity Summary`
  - `Export CRM Snapshot JSON`
- Header creation for all tabs.
- Data validation dropdowns for controlled fields.
- Frozen header rows.
- Basic conditional formatting for `review_state`, `confidence_level`, and `grant status`.
- Source ID validation: records with claims must reference at least one `source_id`.
- Review queue generation for:
  - missing source IDs
  - `Unknown` confidence
  - stale verification dates
  - grant opportunities without status
  - inferred Clarity fit rows
- Dashboard formulas or script-generated counts:
  - total agencies
  - police departments
  - sheriff departments
  - special units found
  - mobile crisis providers
  - elder protection records
  - grant opportunities
  - records needing review
  - stale records
- JSON export with no secrets and no private notes.

## Research Assignment

Populate the CRM with source-backed research for:

1. Police departments in Lafayette Parish / Acadiana.
2. Sheriff departments in Lafayette Parish / Acadiana.
3. Any publicly identified mental health, CIT, co-responder, vulnerable adult, elder abuse, victim services, homeless outreach, or community response units.
4. Agencies that provide mobile crisis services for mental illness.
5. Louisiana Office of Elderly Protective Services / Adult Protective Services and local elder protection resources.
6. Existing behavioral health crisis solutions, referral tools, public safety diversion programs, 988-related services, or case-management approaches.
7. Grant opportunities that could support a program like Clarity.

Prioritize official sources:

- agency websites
- parish/city websites
- Louisiana Department of Health
- Louisiana Office of Aging and Adult Services
- Louisiana Department of Children and Family Services, if relevant
- SAMHSA
- DOJ Bureau of Justice Assistance
- COPS Office
- HRSA
- ACL / Administration for Community Living
- CMS
- Louisiana Commission on Law Enforcement
- official grant notices

## Grant Research

Find current or recent grant opportunities related to:

- crisis intervention teams
- co-responder programs
- law enforcement behavioral health diversion
- mobile crisis response
- 988 crisis continuum
- jail diversion
- behavioral health referral coordination
- elder protection
- vulnerable adult protection
- rural behavioral health access
- health information exchange
- hospital-community transition support

For each opportunity, record:

- program name
- funder
- eligibility
- allowable uses
- current/closed/historical status
- deadline if current
- how Clarity might fit
- confidence level
- source URL

## Governance Rules

- Use only source-backed facts.
- If a source does not confirm something, write `[Unknown]`.
- If a Clarity use case is inferred, label it `Inference`.
- Do not include non-public personal information.
- Do not include PHI/PII.
- Do not contact agencies.
- Do not claim an agency is interested in Clarity.
- Do not claim grant eligibility unless the grant source supports it.
- Do not build live referral, messaging, bed request, consult request, EMR sync, or user provisioning features.
- Keep all CRM output in `Needs Review` unless directly supported by a cited source.

## Final Output Format

Return:

1. Files created or proposed.
2. Spreadsheet tab schema.
3. Apps Script code.
4. Seed records with sources.
5. Grant opportunity summary.
6. Open questions.
7. Recommended next step:
   - UI prototype slice
   - backend/API/RLS decision packet
   - research expansion
   - grant concept note

## Acceptance Criteria

The work is complete when:

- The CRM can initialize a Google Sheet with all required tabs.
- Controlled fields have validation dropdowns.
- Review queue can be generated.
- Dashboard counts can refresh.
- Research rows are source-backed or marked `[Unknown]`.
- Grant opportunities are separated from agency records.
- Clarity fit is clearly marked as confirmed, inferred, or unknown.
- No live operational action is implemented.

