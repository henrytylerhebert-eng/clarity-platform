---
status: Approved for UX scaffolding and frontend implementation
owner: Tyler / product owner
date: 2026-07-19
data_boundary: synthetic only
depends_on:
  - Packet 11 (Persistence Layer)
---

# Network Enrichment Packet 12: Review Workspace Design Package

## 1. Goal & Explicit Non-Goals
**Goal**: Build a read-oriented review workspace backed by explicit server-owned review commands. Compliance, clinical, and operations users can triage Network Enrichment review packages, compare candidate values against canonical values, inspect evidence, and submit field-level review decisions.

The architecture must strictly separate:
- **Query Projections**: For the queue, package details, candidate fields, evidence, freshness, conflicts, and audit history.
- **Controlled Commands**: For field-level approve, reject, defer, conflict resolution, and specialized-review routing.

The browser must never write directly to persistence or canonical CRM data.

**Explicit Non-Goals**:
- Do not build canonical CRM mutation (this is Packet 13).
- Do not build live web-scraping into the UI.
- Do not build referral matching or patient placement.
- Do not connect to a production database (use the synthetic API layer).

---

## 2. Roles, Permissions & Specialized Gates
### Standard Tiers
- **Operations Reviewer**: Can review standard identity, contact, and address fields.
- **Compliance Reviewer**: Can review payer participation and licensing fields.
- **Clinical Reviewer**: Required for sensitive clinical criteria (Age groups, Inpatient Detox, Medical clearance requirements, Inclusion/Exclusion criteria).
- **Legal Reviewer**: Required for forensic custody, secure transport, and OPC authorizations.

### Enforcement
The UI must disable the "Approve" button and show a "Requires [Clinical/Legal] Authority" badge if the authenticated principal lacks the required role for a specific field category.

---

## 3. Information Architecture: The Review Queue
The root view is a tabular Review Queue showing pending packages.
- **Columns**: Candidate Entity Name, Source Authority (e.g., LDH, Medicare), Submission Date, Fields Pending, Priority, Status.
- **Filters**: By Status (Unresearched, Conflicted, Stale), By Required Authority (Clinical, Legal, Ops).
- **States**: 
  - *Empty*: "No pending review packages."
  - *Loading*: Skeleton rows.
  - *Error*: "Failed to load queue. Retry."

---

## 4. Entity Resolution & Canonical-vs-Candidate Comparison
When clicking into a package, the user is presented with the **Comparison View**:
- **Left Column (Canonical)**: The current, live state of the Organization, Location, or Program in the CRM (if a match exists).
- **Right Column (Candidate)**: The newly enriched data package.
- **Diff Highlighting**: Fields that differ from canonical must be highlighted in yellow. Net-new fields in green.

---

## 5. Field-Level Review Behavior
Every candidate field in the right column acts as a distinct interactive component.
- **Actions**: Users can select `Approve`, `Reject`, `Mark Stale`, `Defer` (skip for now), or `Supersede` (manually override the value).
- **Mixed Outcomes**: The workspace must permit the user to Approve the Phone Number, Reject the Bed Count, and leave the Address pending, all within the same package.
- **Package Status Reconciliation**: A floating action bar at the bottom reflects the overall package state (e.g., "3 Approved, 1 Rejected, 2 Pending. Submit Package Decisions?").

---

## 6. Evidence, Authority, and Conflict Views
Clicking the info icon on any candidate field opens the **Evidence Panel (Drawer)**:
- **Evidence**: Displays the verbatim snippet or summary extracted by the enrichment agent.
- **Source Authority**: Displays the source tier (e.g., Tier 1: State Directory, Tier 3: Commercial Website) and the URL.
- **Freshness**: Shows the `retrieved_timestamp`. If older than 90 days, a "Stale Warning" badge appears.
- **Conflicts**: If multiple agents found conflicting data for the same field, the panel shows a side-by-side of the competing values and requires the user to explicitly select the winning value.

---

## 7. Audit-History Presentation
The bottom of the package view contains an `Audit Log` tab.
- Displays an immutable, append-only timeline of previous decisions on this entity.
- Shows who approved what field, when, and the prior state.

---

## 8. UX States & Accessibility
- **Unauthorized**: If a user hits a restricted route, display a 403 Forbidden state with a "Return to Dashboard" action.
- **Stale/Conflict**: Fields that have changed underneath the user (optimistic concurrency failure) must flash red and reload the latest state.
- **A11y**: All interactive elements (Approve/Reject buttons) must have `aria-labels` mapping to the field name. Contrast ratios must meet WCAG AA. The workspace must be fully keyboard navigable (Tab to focus, Enter/Space to select decision).
- **Responsive**: On mobile, the side-by-side comparison collapses to a stacked card view (Canonical on top, Candidate on bottom).

---

## 9. API & Query Requirements
The frontend will require the following React Query (or RTK) endpoints bridging to the API built in Packet 11:
- `GET /api/enrichment/packages` (Queue list)
- `GET /api/enrichment/packages/:id` (Detailed comparison & evidence)
- `POST /api/enrichment/packages/:id/decisions` (Submit array of field-level decisions)

---

## 10. Synthetic Fixtures
The frontend must scaffold isolated testing fixtures in `mocks/enrichmentFixtures.ts`:
- A package containing a clinical conflict (Inpatient Detox vs Outpatient).
- A package with legal requirements (OPC holds).
- A package that is 100% complete (all fields approved).

---

## 11. Acceptance Tests
- **Queue Rendering**: Ensure the queue renders all packages from the synthetic fixtures.
- **Role Enforcement**: Ensure a user mapped to `OPS_REVIEWER` cannot click "Approve" on a clinical admission criteria field.
- **Partial Submission**: Ensure submitting 2 approvals and 1 rejection correctly forms the JSON payload for the API.
- **Evidence Panel**: Ensure clicking a field correctly hydrates the Evidence Drawer with the associated source snippet.

---
---

# BOUNDED CODEX EXECUTION PROMPT

**To: Codex**
**Subject: Execute Packet 12 — Network Enrichment Review Workspace**

You are authorized to execute Packet 12. 

**Scope Boundaries:**
1. You are building the React frontend workspace in the `app/` directory (or wherever the primary CRM UI lives).
2. You must rely ONLY on the API endpoints defined in Packet 11. Do not introduce new Prisma queries or server routes.
3. Use the synthetic fixtures for all local dev rendering.
4. Do NOT build the canonical promotion command (Packet 13).

**Execution Steps:**
1. Create the `ReviewQueue.tsx` component to list pending packages.
2. Create the `PackageComparison.tsx` component to show the Canonical vs Candidate side-by-side.
3. Build the `FieldDecision.tsx` interactive component for field-level Approve/Reject/Defer actions.
4. Implement the role-based disabling logic (Clinical/Legal fields).
5. Build the `EvidenceDrawer.tsx` to surface the source snippets and conflict resolution.
6. Write Playwright or React Testing Library coverage proving that an Operations user cannot approve a Clinical field, and that mixed-package JSON payloads are constructed correctly.
7. Report back with the test results and exit.
