# MVP Scope

## MVP name

**Clarity MH Intake Spine v0.1**

## MVP target

Build the smallest useful vertical slice that proves the product thesis:

> A crisis referral can become a structured assessment, medical-necessity draft, legal-status packet, routing request, and custody ledger without retyping the same story.

## In scope for MVP

### Must-have

1. Active intake case queue.
2. New case creation.
3. Guided intake coach.
4. Structured psychiatric assessment draft.
5. Source references attached to clinical facts.
6. Risk findings: danger to self, danger to others, grave disability, medical instability.
7. Medical necessity snapshot draft.
8. Legal status tracking: voluntary, OPC, PEC, CEC, unknown.
9. Legal instrument draft model.
10. Hash-chain custody ledger.
11. Transmission and acceptance/decline model.
12. Referral packet preview/export as PDF or markdown/HTML first.
13. Basic facility directory.
14. Request-broadcast simulation.
15. RBAC roles and audit logging.
16. Demo data only.

### Should-have

1. SLA timers.
2. Packet completeness score.
3. Facility decline reason codes.
4. Missing facts checklist.
5. AI prompt templates with mock AI provider.
6. Command center dashboard.
7. Medical clearance checklist.
8. Benefits verification parallel lane.
9. Collateral contact scheduler.

### Not in MVP

1. Live EHR integration.
2. Live payer portal integration.
3. Live e-signature vendor integration.
4. Live hospital network transmission.
5. Live bodycam/media ingestion.
6. Full ASAM/LOCUS/CALOCUS scoring.
7. InterQual/MCG integration.
8. Statewide public treatment finder.
9. Production PHI storage.
10. Autonomous diagnosis or LOC determination.

## Phase plan

### Phase 0 — Repo inspection

Codex inspects the current codebase and reports current architecture.

### Phase 1 — Data spine

Implement schema, types, validation, seed data, and audit logging.

### Phase 2 — Intake and assessment vertical slice

Implement case queue, new case, call coach, assessment draft, source references, and risk findings.

### Phase 3 — Medical necessity and legal status

Implement medical necessity snapshot, legal instrument drafts, deadline config, and guardrail language tests.

### Phase 4 — Custody and routing

Implement hash-chain ledger, transmission model, facility response model, packet builder, and request-broadcast simulation.

### Phase 5 — AI/MCP layer

Implement source-grounded draft generation with mock provider first, then provider abstraction.

### Phase 6 — Dashboards and pilot metrics

Implement command center, KPI scorecards, denial feedback loop, and reporting exports.

## MVP success test

A demo user can create a suicidal-risk case from a family phone call, capture structured facts, identify missing collateral, draft medical necessity language, generate a PEC-ready legal packet draft, transmit to simulated facilities, receive one decline and one acceptance, and verify the custody ledger.
