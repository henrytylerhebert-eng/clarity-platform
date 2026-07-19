# Clarity Directory CRM System Design

Status: complete design packet, needs_review  
Owner: Tyler Hebert  
Created: 2026-07-19  
Related preview: `docs/decisions/CRM_UI_ARCHITECTURE_PREVIEW.html`  
Related review packet: `docs/decisions/CRM_UI_ARCHITECTURE_REVIEW_PACKET.md`  
Data boundary: synthetic-only until security/privacy/RLS approval  
Implementation boundary: design only; this packet does not authorize production account provisioning, EMR integration, live referral sending, bed reservation, clinical decisioning, legal decisioning, payer decisioning, or real PHI/PII handling.

## Product Thesis

Clarity Directory CRM is the base portal and network registry for behavioral-health access work. It lets organizations set up an account, define locations and service lines, invite personnel into scoped roles, and use the right Clarity workflows for prescreen, referral, packet, bed request, consult, intake, admitted operations, utilization review, and discharge planning.

The directory is not a standalone list of facilities. It is the connective tissue between organizations that need to coordinate access to care.

## System Shape

```text
Parent Organization
  -> Locations
  -> Service Lines
  -> Personnel
  -> Partner Relationships
  -> Workflow Permissions
  -> Directory / Facility / Resource Profiles
  -> Case-context Actions
  -> Referral, Consult, Bed Request, Handoff, Admission, UR, Discharge
```

Clarity should treat the CRM as a portal-account layer above the case spine:

```text
Organization account -> scoped user -> case/referral workflow -> evidence/review -> packet/routing -> admission/episode -> UR/discharge -> audit
```

## Core Product Objects

| Object | Purpose | Prototype status | Production note |
|---|---|---|---|
| Organization profile | Parent account for an agency, hospital, provider, or resource organization | Synthetic UI model | Existing `Organization` is a base, but target profile fields need schema/API review |
| Organization location | Physical/operational site under an organization | Synthetic UI model | Needs dedicated model or approved `FacilityProfile` mapping |
| Service line | Workflow capability offered by a location | Synthetic UI model | Needs controlled enum/configuration model |
| Personnel profile | User/person inside an organization | Synthetic UI model | Existing `User` exists; role assignment needs production RBAC design |
| Role assignment | Determines modules a person can access | Synthetic UI model | Must be backed by authenticated principal and RLS/route guards |
| Partner relationship | Controlled relationship between two orgs | Synthetic UI model | Needs audit, data-sharing, and consent/contract boundary |
| Facility/resource profile | Searchable facility/resource record | Partially represented by `FacilityProfile` | Directory source data and operational verification must remain separate |
| Referral interaction | Case-context communication/action history | Existing `Referral` foundation | Must be tenant-scoped and auditable |
| Consult request | ED or provider request for telemed psychiatric consult | Design only | Requires API/workflow decision before build |
| Bed request | Request for receiving-facility bed review | Design only | Must not imply live availability or reservation |

## Organization Types

### Law Enforcement Agency

Example: Lafayette Police Department.

Users:

- Officer
- Field supervisor
- Custody/evidence reviewer
- Agency admin

Primary modules:

- Prescreen
- Guided intake
- Source capture
- Custody context
- Handoff
- Limited case overview

Allowed actions:

- Start a prescreen referral.
- Capture source facts and custody context.
- Request handoff to crisis response, ED, or central intake.
- View only cases connected to that agency's authorized workflow.

Blocked actions:

- Clinical determination.
- Legal validity determination.
- Placement decision.
- Payer/authorization work.
- Unscoped directory browsing beyond approved referral needs.

### Community Crisis Response

Users:

- Crisis responder
- Triage coordinator
- Clinical supervisor
- Program admin

Primary modules:

- Prescreen
- Field assessment
- Safety triage
- Handoff coordination
- Packet prep

Allowed actions:

- Assist triage at the prescreen layer.
- Record observed facts and collateral status.
- Coordinate with law enforcement, EDs, central intake, and behavioral health providers.
- Prepare a case handoff for human review.

Blocked actions:

- Autonomous disposition.
- Legal status validation.
- Bed placement.
- Payer decisioning.

### Acute Care Hospital / Emergency Department

Users:

- ED clinician
- ED case manager
- Discharge planner
- Behavioral health liaison
- Hospital admin

Primary modules:

- Referral request
- Bed request
- Packet send preparation
- Telemed consult request
- Medical clearance handoff
- Case management resources
- Discharge planning resources

Allowed actions:

- Initiate a behavioral-health referral.
- Prepare a packet for central intake or receiving provider review.
- Request telemed psychiatric consult.
- Request bed review.
- Search disposition resources.

Blocked actions:

- EMR integration claim unless implemented and verified.
- Live referral sending until API and audit gates exist.
- Bed reservation or capacity claim.
- External PHI transmission in prototype.

### Behavioral Health Provider

Users:

- Central intake coordinator
- Intake supervisor
- Clinician reviewer
- UR specialist
- Charge nurse
- Discharge planner
- Facility admin

Primary modules:

- Central intake queue
- Packet review
- Routing response
- Admission readiness
- Episode operations
- Utilization review
- Discharge planning
- Facility profile/admin verification

Allowed actions:

- Review packets.
- Record accept, decline, waitlist, or request-more-info responses.
- Manage admitted-phase operational state.
- Track UR and discharge workflow readiness.
- Maintain service-line configuration after admin verification.

Blocked actions:

- Automatic acceptance.
- Automatic level-of-care determination.
- Live capacity updates without verified source.
- Payer guarantee.

### Behavioral Health Parent Company

Users:

- Parent org admin
- Regional operator
- Compliance reviewer
- Program director
- Central intake admin

Primary modules:

- Organization admin
- Location/service-line registry
- Personnel and access review
- Network governance
- Verification queue
- Aggregate operational view

Allowed actions:

- Define child locations.
- Configure service lines.
- Assign personnel to service lines and modules.
- Review profile verification status.
- Monitor network workflow performance after measurement systems exist.

Blocked actions:

- Bypassing child-location workflow controls.
- Production user provisioning without identity/RBAC approval.
- External publication of unapproved directory/contact data.

### Resource / Discharge Provider

Users:

- Admissions coordinator
- Referral coordinator
- Clinic scheduler
- Resource admin

Primary modules:

- Resource profile
- Discharge referral candidate
- Requirements and availability notes
- Verification queue

Allowed actions:

- Appear in disposition/resource search.
- Maintain source-confirmed requirements after verification workflow exists.
- Receive prepared referral candidates only after live sending is approved.

Blocked actions:

- Treating profile presence as availability.
- Writing referral history to CSV/source files.
- Receiving PHI in prototype.

## Portal UX Architecture

### 1. Organization Setup

Purpose: create the parent profile and determine the account's operating shape.

Fields:

- Organization name
- Organization type
- Operating jurisdiction/region
- Primary admin
- Data sensitivity class
- Intended modules
- Verification status
- Partner relationships requested

States:

- Draft
- Needs admin review
- Needs security review
- Approved for prototype
- Approved for production
- Suspended
- Retired

### 2. Location And Service-Line Setup

Purpose: define where work happens and what each site can do.

Examples:

- ED campus
- Central intake hub
- Inpatient psychiatric unit
- Detox program
- Residential program
- IOP / outpatient program
- Mobile crisis response team
- Skilled nursing / rehab
- Primary care clinic
- Specialty provider

Each service line should define:

- Service-line type
- Required intake packet fields
- Accepted ages
- Accepted coverage signals
- Medical capabilities
- Legal-status capabilities
- Exclusion criteria
- Referral requirements
- Transport rules
- Timezone/source lineage if admission or episode work depends on it
- Last verified date
- Review owner

### 3. Personnel And Access

Purpose: make sure each human sees only the tools they need.

Access is based on:

- Organization
- Location
- Service line
- Role
- Case relationship
- Workflow assignment
- Review authority
- Sensitive-data permission

Prototype roles should map onto existing Clarity demo roles first:

| Target persona | Prototype role |
|---|---|
| Officer | `field` |
| Crisis responder | `field` / `central` |
| ED case manager | `central` |
| ED clinician | `clinician` |
| Central intake coordinator | `central` |
| Clinician reviewer | `clinician` |
| UR specialist | `ur` |
| Charge nurse | `nurse` |
| Discharge planner | `central` / `nurse` / `executive` until dedicated role approved |
| Facility admin | `facility` / `compliance` |
| Parent company admin | `executive` / `compliance` |

Production roles should not be added until RBAC/RLS design is approved.

### 4. Partner Relationships

Purpose: represent controlled operational relationships between organizations.

Relationship examples:

- Law enforcement -> crisis response
- Law enforcement -> ED
- ED -> behavioral central intake
- ED -> telemed psychiatry provider
- Behavioral parent company -> child facility
- Behavioral provider -> discharge resource
- Hospital system -> internal case management

Each relationship should include:

- Source organization
- Target organization
- Relationship type
- Allowed workflows
- Data-sharing boundary
- Contact route
- Effective date
- Review owner
- Status

Relationship statuses:

- Proposed
- Needs legal/security review
- Active for synthetic prototype
- Active for production
- Suspended
- Retired

## Major Workflows

### Workflow A: Law Enforcement Or Crisis Prescreen

```text
Officer/crisis responder logs in
  -> selects agency profile
  -> starts prescreen
  -> records source/custody facts
  -> requests handoff destination
  -> human intake/clinical review
  -> case joins Clarity spine
```

Required UI:

- Agency profile banner
- Officer/responder identity panel
- Prescreen fields
- Source/custody context
- Handoff target selector
- Guardrail warnings
- Audit preview

### Workflow B: Acute Hospital ED Referral

```text
ED user logs in
  -> selects hospital/location
  -> opens referral request
  -> attaches medical clearance and packet facts
  -> requests bed review or central-intake review
  -> optionally requests telemed psych consult
  -> human review before send
```

Required UI:

- ED location context
- Referral type selector
- Bed request panel
- Packet completeness
- Medical clearance status
- Consult request composer
- No-live-send warning

### Workflow C: Behavioral Central Intake

```text
Central intake user logs in
  -> sees inbound referral queue
  -> reviews packet and missing facts
  -> searches internal/external service lines
  -> records accept/decline/request-info/waitlist
  -> admission readiness starts only after human acceptance
```

Required UI:

- Inbound queue
- Packet review
- Directory/facility profile context
- Missing facts
- Response composer
- Admission readiness transition

### Workflow D: Admitted Operations And UR

```text
Accepted referral becomes admission/episode candidate
  -> facility timezone/source lineage confirmed
  -> admitted episode created
  -> UR/authorization and documentation gaps tracked
  -> discharge planning begins as parallel workflow
```

Required UI:

- Accepted source handoff
- Facility timezone lineage
- Episode status
- UR lane
- Documentation gaps
- Discharge dependencies

### Workflow E: Discharge Planning And Resource Search

```text
Discharge planner opens case
  -> selects disposition goal
  -> searches resources by service line and requirements
  -> compares candidate resources
  -> prepares referral candidate for human review
  -> records status and missing follow-up items
```

Required UI:

- Disposition selector
- Resource search
- Candidate comparison
- Requirements checklist
- Follow-up scheduling placeholders
- Review-gated referral candidate

### Workflow F: Parent Company Admin

```text
Parent admin logs in
  -> views child locations
  -> configures service lines
  -> reviews personnel access
  -> reviews stale profile data
  -> routes changes to verification queue
```

Required UI:

- Parent organization tree
- Location registry
- Service-line registry
- Personnel/access table
- Verification queue
- Audit trail

## Screen Inventory

### Portal Home

Shows:

- Current organization
- Organization type
- Active locations
- Active service lines
- Personnel needing review
- Partner relationships
- Available modules
- Governance warnings

Primary action:

- Continue into the role's default workflow.

### Organization Profile

Shows:

- Parent organization metadata
- Child locations
- Personnel groups
- Service lines
- Partner relationships
- Verification state
- Sensitive-data rules
- Module access map

Primary actions:

- Queue profile verification.
- Open service line.
- Review personnel access.
- Open partner relationship.

### Location Profile

Shows:

- Site name
- Physical/operational address
- Service lines
- Intake contacts
- Timezone/source lineage
- Status
- Verification date

Primary actions:

- Open service-line profile.
- Queue contact update.
- Mark unknown/stale.

### Service-Line Profile

Shows:

- Level of care / service type
- Accepted ages
- Medical capabilities
- Legal-status capabilities
- Coverage signals
- Exclusion criteria
- Referral requirements
- Transport rules
- Operational notes
- Review owner

Primary actions:

- Add to shortlist.
- Compare profile.
- Queue verification.

### Personnel And Access

Shows:

- Personnel name
- Organization
- Location
- Service line
- Role
- Module access
- Review status
- Last login/status

Primary actions:

- Request access review.
- Suspend synthetic access.
- View role rationale.

Prototype note: no real login or user provisioning.

### Network Search

Shows:

- Workflow context
- Organization type
- Directory/resource classification
- Location/geography
- Capabilities
- Coverage signals
- Verification state
- Search results
- Selected profile detail

Primary actions:

- Open profile.
- Compare.
- Shortlist.
- Prepare referral/bed request/consult/discharge candidate.

### Partner Relationship Map

Shows:

- Source organization
- Target organization
- Allowed workflows
- Data-sharing boundary
- Review status
- Effective date

Primary actions:

- Queue relationship review.
- Open associated workflow.

### Verification Queue

Shows:

- Stale profile fields
- Unknown fields
- High-sensitivity contact fields
- Capacity/availability claims
- Service-line claims
- Relationship changes
- Review owner

Primary actions:

- Mark source-confirmed.
- Mark human-confirmed.
- Mark unknown.
- Mark do-not-use.

Prototype note: verification is local/synthetic only.

## Permission Matrix

| Persona | Prescreen | Intake | Packet | Bed request | Consult | Routing response | Admitted ops | UR | Discharge | CRM admin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Officer | Yes | Limited | No | No | No | No | No | No | No | No |
| Crisis responder | Yes | Limited | Prepare | No | Prepare | No | No | No | Handoff only | No |
| ED clinician | Yes | Yes | Prepare | Prepare | Prepare | No | No | No | Limited | No |
| ED case manager | Yes | Yes | Prepare | Prepare | Prepare | No | No | No | Yes | No |
| Central intake | Yes | Yes | Yes | Review | Review | Yes | Transition | No | Yes | Limited |
| Behavioral clinician | Review | Review | Review | Review | Review | Review | Yes | No | Yes | No |
| UR specialist | No | Read | Read | No | No | No | Yes | Yes | Read | No |
| Charge nurse | No | Read | Read | Review | No | Review | Yes | Read | Yes | No |
| Discharge planner | No | Read | Read | No | No | No | Yes | Read | Yes | Limited |
| Facility admin | No | Read | Read | No | No | Yes | Read | Read | Read | Yes |
| Parent admin | No | Aggregate | Aggregate | No | No | Aggregate | Aggregate | Aggregate | Aggregate | Yes |

`Yes` means workflow access may be shown in prototype. It is not production authorization.

## Data Boundary Rules

1. Organization/profile setup in the first prototype is synthetic-only.
2. Personnel entries are fake or role examples, not real staff accounts.
3. No `.env`, token, credential, PHI, PII, EMR payload, or live contact data should be embedded in demos.
4. Capacity defaults to `Unknown`.
5. Directory CSVs are baseline source material, not canonical interaction history.
6. Referral history comes from `Referral` or synthetic local equivalents.
7. Contact fields need sensitivity review before external use.
8. Partner relationships require legal/security/operational review before production use.
9. Any live transmission requires audit, authorization, route tests, and owner approval.

## Data Model Target

Existing foundation:

- `Organization`
- `User`
- `FacilityProfile`
- `Referral`
- `AuthSession`
- `BehavioralHealthCase`
- `Episode`

Target additions or extensions for a later decision packet:

| Target model | Purpose |
|---|---|
| `OrganizationProfile` | Extended CRM account metadata beyond current `Organization` |
| `OrganizationLocation` | Child site/campus/operational hub |
| `ServiceLineProfile` | Configured service capability at a location |
| `PersonnelProfile` | User-facing staff profile metadata |
| `RoleAssignment` | Scoped role to organization/location/service line/module |
| `PartnerRelationship` | Controlled relationship between two organizations |
| `WorkflowPermission` | Module access declaration for a role assignment |
| `DirectorySourceRecord` | Source provenance for imported directory/resource data |
| `ProfileVerificationEvent` | Audit trail for field/source verification |
| `ConsultRequest` | Future telemed consult workflow |
| `BedReviewRequest` | Future bed-review workflow distinct from live reservation |
| `ResourceReferralCandidate` | Discharge/resource candidate before live sending |

Do not add these models until the backend/API/RLS decision packet is approved.

## API Boundary Target

Future API groups:

- `GET /crm/organizations`
- `GET /crm/organizations/:id`
- `GET /crm/organizations/:id/locations`
- `GET /crm/organizations/:id/service-lines`
- `GET /crm/organizations/:id/personnel`
- `GET /crm/search`
- `POST /crm/profile-verification-requests`
- `POST /cases/:caseId/referral-candidates`
- `POST /cases/:caseId/bed-review-requests`
- `POST /cases/:caseId/consult-requests`
- `POST /cases/:caseId/discharge-candidates`

All write routes require:

- authenticated principal
- tenant context
- route-level authorization
- audit event
- idempotency key for material commands
- no external transmission unless separately approved

## UI Prototype Build Plan

### Slice 1: Static React Workspace

Build:

- `NetworkCrm` workspace
- synthetic CRM data module
- organization setup summary
- network search table
- organization profile inspector
- module access matrix
- guardrail copy

Do not build:

- real login
- database writes
- API routes
- EMR integration
- live sending
- real personnel onboarding

Validation:

- app tests for rendering and role visibility
- filter behavior tests
- guardrail text assertions
- no capacity defaults other than `Unknown`
- no action label that implies live send/reservation/provisioning

### Slice 2: Prototype Workflow Intents

Build synthetic intent states:

- prepare prescreen handoff
- prepare ED referral
- prepare bed request
- prepare telemed consult
- prepare central-intake response
- prepare discharge candidate
- queue profile verification

Validation:

- every intent is review-gated
- every intent uses synthetic local state
- no external action occurs

### Slice 3: Decision Packet For Backend/API/RLS

Produce:

- schema decision
- API route decision
- RLS policy coverage
- audit event vocabulary
- idempotency requirements
- provider-backed test plan
- contact-data sensitivity decision

### Slice 4: Provider-Backed Read Model

Only after approval:

- tenant-scoped organization/profile reads
- tenant-scoped directory search
- referral history read model
- profile verification read model

### Slice 5: Controlled Workflow Writes

Only after approval:

- referral candidates
- consult requests
- bed review requests
- discharge candidates
- profile verification events

### Slice 6: Live Integrations

Deferred:

- EMR integration
- live packet send
- live telemed request
- live bedboard/capacity feed
- production identity provider
- external notifications

## Acceptance Criteria For Complete Design

This system design is complete when:

- The CRM is defined as the base portal/account layer.
- Organization types are defined.
- Personnel types are defined.
- Modules per organization/persona are defined.
- Profile hierarchy is defined.
- Partner relationship model is defined.
- Major workflows are defined.
- Screen inventory is defined.
- Permissions matrix is defined.
- Data boundaries are explicit.
- Prototype build slices are defined.
- Backend/API/RLS deferrals are explicit.
- Human approval gates are preserved.

## Open Decisions

1. Should the first React workspace be named `Directory CRM`, `Network CRM`, or `Access Network`?
2. Should law enforcement and crisis response be first-class production organization types in v1, or prototype-only until operational review?
3. Should `OrganizationLocation` and `ServiceLineProfile` be distinct models, or should the first backend slice extend `FacilityProfile`?
4. What contact fields are allowed in internal prototype views?
5. Which organization/personnel actions require compliance review versus admin review?
6. Which workflow intents should be implemented first: prescreen, ED referral, bed request, consult, central-intake response, or discharge candidate?

## Recommended Next Move

Proceed with Slice 1: a static React workspace named `Directory CRM` inside the existing Clarity prototype.

Reason: it validates the full base portal model visually while preserving the synthetic-only boundary. Backend/API/RLS work should wait until Tyler confirms the organization hierarchy, service-line model, and role/module mapping feel right.
