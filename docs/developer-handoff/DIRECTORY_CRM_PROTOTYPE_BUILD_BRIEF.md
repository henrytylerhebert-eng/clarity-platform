# Directory CRM Prototype Build Brief

Status: build-ready only after Tyler approval  
Owner: Tyler Hebert  
Source design: `docs/product/CLARITY_DIRECTORY_CRM_SYSTEM_DESIGN.md`  
Data boundary: synthetic-only  
Implementation target: first React prototype slice inside `app/`

## Objective

Add a `Directory CRM` workspace to the existing Clarity prototype that demonstrates the base portal CRM model:

- parent organization profile
- locations
- service lines
- personnel and access
- partner workflows
- organization/resource search
- profile inspector
- review-gated workflow intents

The first slice is visual and synthetic. It must not provision real users, connect to an EMR, send live referrals, reserve beds, write production facility records, or handle real PHI/PII.

## Existing Implementation Context

- Workspace navigation is defined in `app/src/App.tsx`.
- Demo roles and workspace visibility are defined in `app/src/domain/roles.ts`.
- Current role selector is display scoping only, not production auth.
- Existing app state is localStorage-backed.
- Prisma already contains `Organization`, `User`, `FacilityProfile`, and `Referral`, but the full CRM target model is not implemented.

## Proposed Files

Add:

- `app/src/domain/directoryCrm.ts`
- `app/src/domain/directoryCrm.test.ts`
- `app/src/workspaces/DirectoryCrm.tsx`

Modify:

- `app/src/domain/roles.ts`
- `app/src/App.tsx`
- `app/src/App.test.tsx`
- `app/src/styles.css`

Do not modify:

- `prisma/schema.prisma`
- `packages/*`
- production API/service code
- source CSV files
- `reference/`

## Domain Model For Prototype

Create synthetic TypeScript types:

```ts
type DirectoryOrganizationType =
  | "law-enforcement"
  | "crisis-response"
  | "acute-hospital"
  | "behavioral-provider"
  | "resource-provider";

type DirectoryWorkflowModule =
  | "prescreen"
  | "guided-intake"
  | "packet-prep"
  | "bed-review-request"
  | "telemed-consult-request"
  | "routing-response"
  | "admission-readiness"
  | "episode-operations"
  | "ur"
  | "discharge-planning"
  | "profile-verification";

type DirectoryReviewState =
  | "source-confirmed"
  | "human-confirmed"
  | "stale"
  | "unknown"
  | "do-not-use";
```

Records:

- `DirectoryOrganization`
- `DirectoryLocation`
- `DirectoryServiceLine`
- `DirectoryPersonnelRole`
- `DirectoryPartnerRelationship`
- `DirectoryWorkflowIntent`

All records are synthetic fixtures.

## First Synthetic Records

Include:

- Lafayette Police Department
- Lafayette Community Crisis Response
- Lafayette General Emergency Department
- Oceans Behavioral Health Parent Company
- Oceans Lafayette Central Intake
- Acadian Stepdown Nursing
- Teche Primary Care Clinic
- Gulf South Cardiology Group

## Workspace UX

### Header

Show:

- selected workspace: `Directory CRM`
- badges: `Synthetic only`, `Needs review`, `No live send`

### Portal Setup Band

Show the setup sequence:

1. Organization profile
2. Locations and service lines
3. Personnel and access
4. Partner workflows

### Module Lanes

Show four lanes:

- Law enforcement / crisis response
- Acute hospital / ED
- Behavioral health provider
- Parent company admin

Each lane should display visible modules and blocked actions.

### Search And Profile Area

Show:

- workflow context filter
- organization type filter
- verification state filter
- keyword search
- result table
- selected organization profile inspector

### Profile Inspector

Show:

- parent organization
- organization type
- locations
- service lines
- personnel groups
- portal tools
- partner relationships
- capacity status defaulted to `Unknown`
- review state
- allowed review-gated actions
- blocked actions

### Intent Actions

Allowed labels:

- Prepare prescreen handoff
- Prepare ED referral
- Prepare bed review request
- Prepare telemed consult request
- Add discharge candidate
- Queue profile verification

Forbidden labels:

- Send referral
- Reserve bed
- Admit patient
- Approve placement
- Verify benefits
- Provision user
- Sync EMR

## Role Visibility

Add the workspace to existing demo role visibility:

| Existing role | Add Directory CRM? | Reason |
|---|---:|---|
| `all` | Yes | Full reviewer view |
| `field` | Yes | Law enforcement/crisis prescreen view |
| `central` | Yes | Case manager/central intake view |
| `clinician` | Yes | Referral/consult review context |
| `facility` | Yes | Receiving provider context |
| `nurse` | Yes | Admitted/discharge resource context |
| `ur` | Yes | Coverage/UR context, read-focused |
| `compliance` | Yes | Verification/governance context |
| `executive` | Yes | Parent organization and network overview |

## Acceptance Criteria

- `Directory CRM` appears in the workspace navigation for mapped demo roles.
- The workspace renders from synthetic fixtures without network calls.
- Search filters by keyword, organization type, workflow context, and review state.
- Selecting a row updates the profile inspector.
- Capacity displays `Unknown` unless a synthetic source explicitly says otherwise.
- Workflow buttons use `Prepare`, `Add`, or `Queue`, never live-action labels.
- The UI states that demo role scoping is not authentication.
- Tests cover role visibility, filter behavior, selected profile behavior, and forbidden action labels.

## Verification Commands

Run:

```bash
cd app && npm test
npm run typecheck
```

Optional if practical:

```bash
cd app && npm run smoke
```

Report any skipped checks as `[Unverified]`.

## Non-Goals

- No schema changes.
- No API routes.
- No real auth/tenant enforcement.
- No real personnel onboarding.
- No EMR integration.
- No live referral send.
- No bed reservation.
- No production data.
- No PHI/PII.

## Human Approval Required Before Build

Tyler must explicitly approve this build brief before implementation. Approval should name this brief and confirm:

- workspace name
- synthetic-only boundary
- no real login
- no live sending
- no backend/API/RLS work in this slice
