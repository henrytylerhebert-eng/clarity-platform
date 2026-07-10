# Clarity Crisis Platform - Build Roadmap

Date: 2026-07-08

## Roadmap Rule

The roadmap must separate:

- **Priority build**: well-developed, central, and necessary for the clean product spine.
- **Market-informed design**: useful because it reflects the served market, but not required for v0.1.
- **Parking lot**: directionally interesting, underdeveloped, legally/clinically unvalidated, integration-heavy, or too broad for the first clean build.

The source materials remain read-only context. Build from the canonical architecture.

## Current Priority

Build `MVP v0.1 - Intake Spine`.

This is the smallest clean slice that proves Clarity:

> A crisis referral can become a structured assessment, source-linked medical-necessity draft, legal-status draft, referral packet, custody ledger, and simulated facility response without retyping the same story.

## Priority Build - v0.1 Intake Spine

### Phase 0 - Project Setup And Canonical Spine

Goal:

- Create a clean prototype repo or isolated app folder.
- Make the canonical case spine explicit before UI expansion.

Tasks:

- Pick stack.
- Create app shell.
- Add demo seed data only.
- Add role/workspace navigation.
- Add README with product scope, source handling, unknowns, and no-PHI rule.
- Implement or stub the core entities:
  - Case,
  - Patient or pseudonymous subject,
  - Encounter,
  - Assessment,
  - SourceReference,
  - RiskFinding,
  - MedicalNecessitySnapshot,
  - LegalInstrument,
  - CustodyLedgerEvent,
  - ReferralPacket,
  - FacilityReferral,
  - FacilityResponse,
  - AuditLog.

Exit criteria:

- App runs locally.
- Demo data loads.
- Workspaces are navigable.
- Source/reference docs are not imported as live app data.

### Phase 1 - Guided Intake

Goal:

- Demonstrate field and clinical capture from the same canonical case record.

Tasks:

- Case list and case detail.
- New case creation.
- Field mode and clinical mode form paths.
- Age-band branching.
- Collateral capture.
- Source-reference attachment.
- Risk findings for danger to self, danger to others, grave disability, medical instability, elopement, and vulnerability.
- Pitfall guard engine.

Seed scenarios:

- Adult SI with missing formulation.
- Geriatric abrupt confusion requiring delirium/capacity prompt.
- Youth guardian/collateral gap and means-restriction prompt.

Exit criteria:

- User can create and open a case.
- Branching changes visible fields.
- Important facts can be source-linked.
- Pitfall guards trigger from case state.
- Guardrails say draft for clinician review where needed.

### Phase 2 - Medical Necessity And Legal Status Drafts

Goal:

- Show how Clarity turns intake into reviewed documentation drafts without pretending to make final clinical or legal determinations.

Tasks:

- Medical necessity snapshot draft from structured facts.
- Missing facts checklist.
- Legal status tracking: unknown, voluntary, OPC, PEC, CEC, court-committed.
- Legal instrument draft scaffold.
- Required facts checklist.
- Counsel-review warning for statutory language and clocks.
- Prohibited language checks for proprietary criteria claims.

Exit criteria:

- Draft medical necessity summary can be generated from source-linked facts.
- Legal instrument draft can be created but not treated as legally enforceable.
- UI makes clinician/legal review status clear.
- No output says the patient "meets InterQual", "meets MCG", or "admission is medically necessary" without qualified human review.

### Phase 3 - Custody Ledger, Packet Preview, And Simulated Facility Response

Goal:

- Prove the closed-loop custody and routing concept.

Tasks:

- Hash-chain custody ledger.
- Packet builder preview.
- Packet completeness checklist.
- Facility referral object.
- Simulated transmission event.
- Receiving facility response: accept, decline, request more info.
- Decline reason required.
- Response ledger event.

Exit criteria:

- Packet status changes from draft to sent.
- Receiving facility can respond.
- Referral status updates.
- Decline reason is captured.
- Custody chain verifies when untouched.
- Custody chain fails if tampered.

## Market-Informed Design - v0.2

These are complementary to the spine and should shape the UI/data model, but should not block v0.1.

### Central Intake Command Center

Source basis:

- Centralized intake SOP.
- Workflow docs.

Build when:

- v0.1 case/referral objects exist and events are logged.

Features:

- Pipeline stages.
- SLA clocks.
- Parallel clinical and financial lanes.
- Escalation flags.
- Packet completeness score.
- Legal deadline warnings.
- Routing and transport status.

Exit criteria:

- Dashboard shows active cases by stage.
- Clinical lane continues independent of financial lane.
- Delayed case escalates.

### Request-Broadcast Routing Expansion

Source basis:

- Holistic synthesis.
- Competitive landscape.
- Request-broadcast workflow.

Build when:

- v0.1 facility referrals and responses work.

Features:

- Facility capability profiles.
- Eligibility filters.
- Broadcast groups.
- Response-time analytics.
- Decline reason analytics.
- Reroute history.

Exit criteria:

- User can select eligible facilities.
- System tracks response times and reasons.
- Routing recommendations are explainable.

### Staff Training And Assessment Protocol Support

Source basis:

- Intake assessment policy/procedure manual.
- Clinical assessment guidance.

Build when:

- Guided intake and source references work.

Features:

- Training-mode prompts.
- Pre-assessment checklist.
- During-assessment checklist.
- Post-assessment handoff checklist.
- Annual competency checklist.
- Deviations-from-protocol notes.

Exit criteria:

- Training prompts do not become clinical policy.
- Staff can see what is missing and why it matters.

## Priority Later - v0.3

### Command Metrics And Pilot Readiness

Features:

- Operational metrics dashboard.
- Legal/compliance dashboard.
- Transfer acceptance analytics.
- Packet completeness trend.
- Documentation-error placeholders.
- Pilot KPI export.

Evidence posture:

- Mark baseline values as `Unknown` until measured.
- Show `No measurements found` where no data exists.

### Reporting Metrics Rebuilder

Source basis:

- `reporting-metrics-rebuild-package/`

Position:

- Company-agnostic operating-intelligence module.
- First domain lens: utilization review excellence.
- Clarity can consume or contribute events, but the module should not be Clarity-specific.

Build when:

- v0.1 intake/case events exist or an independent company-agnostic data spine is selected.

Priority features:

- UR work queue.
- Authorization risk dashboard.
- Approved days, denied days, and days-at-risk metrics.
- Documentation-gap dashboard.
- Payer/program/physician denial summaries.
- PHI-safe analytics mart.
- Export layer for Excel/PDF reports.

Exit criteria:

- Metrics are calculated from reusable fact tables, not monthly workbook tabs.
- No raw PHI is required for executive/aggregate dashboards.
- Workbook exports are outputs, not systems of record.
- Improvement claims remain `Unknown` until measured.

### Milieu-Aware Bedboard

Why later:

- Valuable and differentiating, but it is downstream of admission/intake and needs clinical validation.

Features:

- Unit/room/bed view.
- Acuity profiles.
- Compatibility rules.
- Adjacency flags.
- Unit acuity roll-up.
- Placement recommendation.
- Accept/override decision logging.

Exit criteria:

- System flags unsafe or suboptimal placement.
- Charge nurse decision remains final.
- Override requires reason.

## Parking Lot

These should not be built until the core spine is working and validated.

- Production authentication.
- Full HIPAA security implementation.
- Full 42 CFR Part 2 consent engine.
- Real EHR integration.
- Real CAD/RMS integration.
- Real HIE integration.
- Live hospital network transmission.
- Live e-signature vendor integration.
- Live bodycam/media ingestion.
- Proprietary payer criteria engine.
- InterQual/MCG integration.
- Full ASAM/LOCUS/CALOCUS scoring.
- Denial-letter ingestion.
- Predictive denial scoring.
- Statewide public treatment finder.
- Multi-state legal packs.
- Production legal form generation.
- Statewide bed registry.
- Autonomous AI chatbot.
- Autonomous diagnosis.
- Autonomous level-of-care determination.
- Autonomous legal certification.

## Feature Priority Matrix

| Feature | Priority | Why |
| --- | --- | --- |
| Canonical case spine | Priority build | Everything else depends on one defensible record. |
| Guided intake | Priority build | Core capture moment. |
| Source references | Priority build | Trust layer for clinical, legal, and packet outputs. |
| Risk findings | Priority build | Feeds assessment, medical necessity, legal status, and routing. |
| Medical necessity draft | Priority build | Central value for payer/UR workflow, but must remain review-gated. |
| Legal status and legal draft | Priority build | Louisiana-first wedge, but counsel-gated. |
| Custody ledger | Priority build | Defensible core of the legal/transfer product. |
| Packet preview | Priority build | Turns capture into usable handoff. |
| Simulated facility response | Priority build | Proves closed-loop routing without network buildout. |
| Command center | Market-informed v0.2 | Useful once case events exist. |
| Request-broadcast expansion | Market-informed v0.2 | Differentiator after basic referral response works. |
| Staff training mode | Market-informed v0.2 | Helps adoption but depends on stable intake flow. |
| Pilot metrics | Priority later v0.3 | Needs event data before it is meaningful. |
| Milieu bedboard | Priority later v0.3 | Differentiating, but downstream and clinically sensitive. |
| Reporting metrics rebuilder | Priority later v0.3 | Company-agnostic UR excellence module after spine/events are clear. |
| Payer criteria engine | Parking lot | Requires licensing, clinical review, and payer-specific validation. |
| Production legal forms | Parking lot | Requires counsel review and official form validation. |
| EHR/CAD/RMS integrations | Parking lot | Integration-heavy and not needed to prove wedge. |
| Statewide public treatment finder | Parking lot | Network-scale feature after local product works. |

## Build Discipline

Do:

- Keep legal deadlines configurable.
- Keep source-of-truth data in structured state.
- Use realistic fake demo scenarios.
- Log decisions and overrides.
- Separate confirmed facts from assumptions.
- Mark legal and clinical review requirements in the UI.
- Say `Unknown` when a gate cannot be checked.
- Say `No measurements found` when no current performance data exists.

Do not:

- Claim statutory compliance before counsel review.
- Build a marketing landing page first.
- Treat bed availability as the same thing as safe placement.
- Let insurance verification block clinical review.
- Create one-off form logic that cannot map to the canonical schema.
- Put production PHI in demo data.
- Use proprietary criteria language without licensing and approval.
