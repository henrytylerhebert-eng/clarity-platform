# CRM UI Architecture Review Packet

Status: needs_review  
Owner: Tyler Hebert  
Ledger record: `ui.crm-architecture`  
Created: 2026-07-19  
Scope: research and design only; no frontend, backend, schema, seed, deployment, or production-data change is authorized by this packet.

## Objective

Create a reviewable UI/UX architecture plan for a Clarity base CRM and portal layer that can support organization profiles, personnel, service lines, locations, and a 19,000+ facility/resource directory while preserving Clarity's evidence, safety, and human-review boundaries.

The CRM should be the account and access layer for the platform. The directory should serve facility discovery and referral workflow context inside that account layer. It must not become a generic sales CRM, a live placement engine, or an autonomous admission, clinical, legal, payer, or discharge decision system.

## Latest Product Direction

The architecture should start with a universal portal-login model:

- An organization creates a parent profile.
- The organization configures its type, locations, service lines, personnel, and permissioned tools.
- Individual staff members log in under that organization and only see the workflows appropriate to their role and service line.
- Cross-organization work happens through referral, packet, consult, bed-request, prescreen, and discharge-planning workflows, not through uncontrolled shared access.

The CRM is therefore not only a facility directory. It is the base platform registry for:

- Law enforcement agencies such as Lafayette Police Department, with individual officer accounts and field/prescreen tools.
- Community-based crisis response teams, with triage, prescreen, field assessment, and handoff tools.
- Acute care hospitals and emergency departments, with EMR-adjacent referral, bed request, packet send, consult request, and psychiatric-care coordination tools.
- Psychiatric hospitals and behavioral health providers, including central-intake organizations partnered with specific ERs.
- Substance-use treatment and recovery organizations spanning withdrawal management, residential treatment, IOP, outpatient care, MAT, peer support, and family resources.
- Behavioral health parent companies, with child profiles for each location, program, service line, and personnel group.
- Nursing, rehab, long-term-care, assisted-living, and memory-care providers used in post-acute and residential transition planning.
- Primary-care physicians and specialists used for medical continuity, consultation, and outpatient follow-up.
- Coroners, elder-protection offices, and similar statutory partners through a restricted coordination pathway that never presents them as care destinations.
- Case management and discharge planning users who need resource search by disposition across this full care and community network.

## Current Evidence

- Confirmed: the frontend is currently a single React workspace shell driven by `WorkspaceId` and role-scoped navigation in `app/src/App.tsx` and `app/src/domain/roles.ts`.
- Confirmed: the Prisma schema contains `FacilityProfile`, `Referral`, `FacilityTimezoneConfiguration`, and `Episode` models.
- Confirmed: `agent_bridge/DIRECTORY_INDEX.md` describes five segmented read-only directory classifications: behavioral, hospital, nursing, primary, and specialist.
- Confirmed: `agent_bridge/directory_search.py` can query segmented CSV directories without loading raw CSV files into context.
- Confirmed: `scripts/seed_facilities.ts` exists and can seed `FacilityProfile` rows from a CSV when a Prisma database is configured.
- Unverified: this session did not confirm that 19,000+ records are already persisted in the configured Prisma database.
- Confirmed governance: raw directory files are baseline discovery sources; referral interaction history belongs in canonical `FacilityProfile` and `Referral` records, not flat CSVs.

## Proposed Product Architecture

Add a review-gated `CRM / Network` workspace concept to the existing app shell before introducing URL routing or a separate CRM module. The workspace should behave like a portal-account and network-intelligence surface connected to prescreen, packet, routing, consult, bed-request, admission readiness, episode operations, and discharge planning workflows.

Recommended first surface:

- Organization profile switcher
- Personnel and role-access panel
- Location and service-line registry
- Directory search workspace
- Organization/facility/resource result table
- Organization and FacilityProfile detail drawer or detail panel
- Case-context shortlist/compare panel
- Human-review action strip
- Admin verification queue

The first implementation should use synthetic or read-only source data only. It should not send referrals, update live capacity, submit payer data, modify production facility records, connect to an EMR, or provision real user accounts.

## Organization Profile Model

The base CRM should support these profile layers:

| Layer | Purpose | Examples |
|---|---|---|
| Parent organization | Owns account, governance, billing/admin posture, and top-level permissions | Lafayette Police Department, a hospital system, a behavioral-health parent company |
| Location | Physical or operational site under the parent organization | ED campus, inpatient hospital, outpatient clinic, crisis-response station |
| Service line | The workflow capability offered at a location | Prescreen, inpatient psych, detox, rehab, central intake, telemed consult, discharge planning |
| Personnel | Users who log in and operate within scoped workflows | Officers, case managers, intake coordinators, nurses, ED clinicians, UR staff, admins |
| External relationship | Controlled connection between organizations | ER-to-central-intake partnership, hospital-to-behavioral-provider referral path |

This model should be treated as future backend/API/RLS architecture until approved. The HTML preview may show it as a synthetic product model only.

## Primary Users

### Case Manager / Central Intake

Maps to the existing `central` role for prototype work.

Primary jobs:

- Search candidate facilities for a selected case.
- Compare capabilities, exclusion criteria, accepted coverage, referral requirements, transport rules, and last verification age.
- Shortlist facilities for human review before packet routing.
- See prior referral interaction history for context, not as an automatic recommendation.

UX priority: fast faceted search with case-fit warnings and clear source status.

### Law Enforcement Officer

Maps to the existing `field` role for prototype work.

Primary jobs:

- Log in under an agency profile, such as Lafayette Police Department.
- Access field intake, prescreen, source capture, custody context, and handoff tools.
- Start or support a referral without seeing unrelated clinical, payer, admin, or provider-only surfaces.

UX priority: fast, low-jargon capture and clean handoff to crisis response, ER, central intake, or receiving facility.

### Acute Care Hospital / Emergency Department

Maps to a future hospital profile plus scoped ED personnel roles. Prototype visibility can be represented through `central`, `clinician`, and `facility` contexts until a formal role model is approved.

Primary jobs:

- Initiate referrals from the ED.
- Request behavioral-health beds.
- Send packets to central intake or receiving providers.
- Request telemed psychiatric consults.
- Coordinate care across inpatient, rehab, consult, case management, and discharge workflows.

UX priority: EMR-adjacent workflow clarity without claiming an EMR integration exists.

### Behavioral Health Provider / Parent Company

Maps to future parent-organization, location, service-line, and personnel records.

Primary jobs:

- Configure service lines by location.
- Operate central intake partnerships with specific ERs.
- Use intake, admitted-phase operations, utilization review, and discharge planning modules.
- Maintain provider capabilities, requirements, exclusions, and personnel access.

UX priority: parent-to-location hierarchy and service-line configuration without duplicating facility identity records.

### Community Crisis Response

Maps to the existing `field` and `central` workflows for prototype work until a dedicated crisis-response organization/personnel model is approved.

Primary jobs:

- Assist in triage at the prescreen layer.
- Capture field facts, source references, immediate safety concerns, and handoff context.
- Coordinate with law enforcement, EDs, central intake, and behavioral health providers.

UX priority: shared triage context without granting broad access to unrelated case, facility, payer, or admin records.

### Discharge Planner

Maps to existing discharge planning workflow, initially visible through `central`, `clinician`, `nurse`, and `executive` role contexts until a dedicated `discharge_planner` role is approved.

Primary jobs:

- Search step-down, nursing, primary-care, specialist, housing-adjacent, and outpatient follow-up resources.
- Distinguish discharge disposition planning from acute admission routing.
- Track missing source facts and human review requirements before a disposition is treated as confirmed.

UX priority: longitudinal planning and handoff readiness, not crisis-routing speed.

### Admin / Directory Steward

Maps to `compliance` plus `executive` for prototype visibility. A dedicated `directory_admin` role should wait for RBAC/RLS decisions.

Primary jobs:

- Review stale facility records.
- Mark fields as source-confirmed, human-confirmed, unknown, or do-not-use.
- Queue updates for facility contact, capabilities, coverage, referral requirements, timezone lineage, and directory-source provenance.

UX priority: verification status, auditability, field provenance, and conservative defaults.

## Portal And Search UX

Use workflow context as the first-level navigation:

- Acute and ED
- Psychiatric care
- Substance-use treatment and recovery
- Post-acute and residential
- Doctors and specialists
- Crisis and protection
- Statutory partners

Then expose organization type and directory/resource classification as filters:

- Law enforcement
- Community crisis response
- Acute care hospital / ED
- Psychiatric hospital / behavioral health provider
- Substance-use treatment provider
- Recovery or addiction resource
- Behavioral health parent company
- Central intake provider
- Nursing / rehab / long-term care
- Assisted living / memory care
- Primary care / physician group
- Medical specialist
- Coroner / statutory office
- Elder-protection office

Recommended search controls:

- Keyword: organization name, facility name, city, service category, program, personnel role, contact field where approved.
- Organization type: law enforcement, crisis response, acute hospital, behavioral provider, resource provider, admin/steward.
- Geography: city, parish/region, distance only when geocoding is verified.
- Capability: service lines, programs, medical capabilities, legal-status capabilities, accepted ages.
- Coverage: Medicare, Medicaid, commercial, self-pay, unknown.
- Referral readiness: requirements complete, missing requirements, verification stale, referral history present.
- Operational constraints: exclusion criteria, transportation rules, facility timezone, capacity status.
- Data quality: source-confirmed, human-confirmed, stale, unknown, do-not-use.

Capacity must default to `Unknown` unless backed by an explicit verified operational source. Search should never imply a bed is available merely because a facility exists in the directory.

## Organization And Facility Profile UX

The profile view should separate organization account truth, personnel permissions, service-line configuration, baseline directory identity, and operational truth.

Recommended sections:

- Header: organization name, organization type, parent/child relationship, source status, last verified date, data-quality badge.
- Account structure: parent organization, locations, service lines, personnel groups, and external relationships.
- Personnel access: roles, allowed modules, pending access review, and admin steward.
- Contact and intake: approved phone/email/contact display fields; hidden or restricted when sensitivity is not approved.
- Programs and fit: levels of care, accepted ages, medical capabilities, legal-status capabilities, exclusion criteria.
- Coverage: Medicare/Medicaid/commercial signals with source and verification age.
- Referral requirements: required documents, packet expectations, transport rules, additional information often requested.
- Capacity and availability: current capacity status, bed/unit notes, and staffing constraints only if source-confirmed; otherwise `Unknown`.
- Timezone lineage: facility-owned timezone configuration and source reference when an admission/episode workflow depends on it.
- Referral history: prior referrals, statuses, response reasons, requested information, response timestamps, and source packet version.
- Governance panel: what is verified, stale, unknown, human-reviewed, or not approved for external use.

## Actions Allowed In First UI Prototype

Allowed:

- Search and filter organization/resource profiles.
- Open organization and facility profiles.
- Compare up to a small number of profiles.
- Shortlist a profile candidate for human review.
- Attach source notes to a candidate record in synthetic/local state.
- Prepare a packet-routing candidate without sending.
- Show prior referral history if sourced from synthetic or verified tenant-scoped records.

Not allowed:

- Live referral sending.
- Automatic matching, ranking, admission, placement, or discharge decisions.
- Real organization onboarding or user provisioning.
- EMR integration claims or live consult routing.
- Updating canonical facility records without admin verification workflow.
- Treating capacity as live availability without a verified source.
- Displaying private contact data externally without approval.
- Using real PHI/PII.

## Open Questions Resolved For Review

### 1. Are 19,000+ facilities persisted in Prisma or only available through segmented CSV directories?

Resolution for now: treat persistence as unverified. The UI prototype should be designed to work against a `FacilityProfile` read model, but the first build should not depend on a confirmed 19,000-row Prisma database until a database count and seed evidence are produced.

Fast verification path:

```bash
npm run prisma:validate
DATABASE_URL=<configured local db> npx prisma db execute --stdin
```

Then query `FacilityProfile` count with a Prisma script or SQL. Do not expose `.env` values in the artifact or terminal output.

### 2. Should Case Manager, Discharge Planner, and Admin become new roles?

Resolution for prototype: do not add new `RoleId` values yet. Map them onto existing demo roles:

| Product persona | Prototype role mapping | Reason |
|---|---|---|
| Case Manager / Central Intake | `central` | Existing owner of pipeline, packet, routing, and escalation work. |
| Discharge Planner | existing discharge planning workspace visibility | Existing discharge workflow is already present; add dedicated role only after owner approval. |
| Admin / Directory Steward | `compliance` and `executive` visibility | Verification/audit posture fits existing governance roles; production admin needs RBAC/RLS decision. |

Future decision: create `case_manager`, `discharge_planner`, and `directory_admin` only after the permission model, route guards, and RLS policies are approved.

### 3. Which fields are approved for capacity, Medicare/coverage, contact display, and referral history?

Resolution for prototype:

| Field group | Approved prototype treatment |
|---|---|
| Capacity | Display as `Unknown` by default. Allow synthetic/stub status only when clearly labeled. No live bed claim. |
| Medicare/coverage | Display source-provided Medicare/Medicaid/commercial flags with verification age and `Unknown` when blank. No payment guarantee. |
| Contact display | Show baseline intake phone/email only in internal prototype views and only with source/status labels. External display requires privacy/security review. |
| Referral history | Source from `Referral` records or synthetic local equivalents. Do not write interaction history back to CSV files. |

## Recommended Authorization Path

Recommended next authorization: base CRM portal UI prototype slice first.

Reason: the existing app is workspace-based, the user need is visual/product validation, and persistence of the 19,000+ rows is unverified. A UI prototype can validate organization profile structure, personnel/service-line mapping, navigation, search shape, profile layout, and governance language without committing API/RLS architecture too early.

Authorize only this first slice:

- Add `crm-network` or `directory` as a prototype workspace.
- Add role visibility for existing mapped roles.
- Add synthetic/read-only organization, personnel, location, service-line, and directory fixture data.
- Add `NetworkCrm`, `OrganizationProfile`, `FacilityDirectory`, and `FacilityProfile` UI components.
- Add tests for role visibility, filter behavior, unknown/default capacity, no-real-user-provisioning, no-EMR-claim, and no-autonomous-decision guardrails.

Defer backend/API/RLS decision packet until after:

- Database count confirms actual `FacilityProfile` persistence.
- Organization/personnel/service-line data model is approved.
- Required query/filter fields are finalized.
- Admin verification workflow is approved.
- Tenant-scoped read/write policy for organization profiles, personnel, `FacilityProfile`, and `Referral` is reviewed.
- Contact-data sensitivity rules are defined.

## Human Approval Gate

Tyler may approve one of these:

1. Approve UI prototype slice under the constraints above.
2. Request backend/API/RLS decision packet first.
3. Revise the product/persona/field decisions before any build.

No implementation is authorized by this artifact alone.
