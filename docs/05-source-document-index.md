# Source Document Index

Date: 2026-07-08

## Source Handling Rule

The source materials are read-only context. Do not edit them directly and do not treat them as active implementation files.

Use source documents to inform the canonical architecture. When a product claim is carried forward, label it with one of:

- `source-confirmed`: directly supported by available local source material.
- `summary-derived`: carried from a synthesis or generated summary, but not independently verified in the source during this review.
- `requires legal review`: may be directionally useful, but legal/statutory requirements, e-signature validity, retention, admissibility, or Louisiana-specific obligations require counsel review.
- `requires clinical review`: may be directionally useful, but clinical policy, medical necessity, diagnosis, level-of-care, risk, safety, or workflow standards require qualified clinical validation.
- `unknown`: not currently supported by available local source material.

## Available Local Context Materials

### Primary local source folder

Path: `clarity-mh-architecture/sources/`

Available files:

- `Pasted text.txt`
- `Centralized Behavioral Health Intake SOP Manual.docx`
- `intake-assessment-policy-procedure-manual.txt`
- `clarity-holistic-synthesis.md`
- `clarity-epec.jsx`
- `clarity-competitive-landscape-epec.md`
- `Louisiana Inpatient Psychiatry Assessment and Crisis Platform Feasibility Report.md`
- `CIA Comp initial Assesment guidance .md`

### Moved source/reference folder

Path: `Clarity MH /`

Available files:

- `CIA Comp initial Assesment guidance .md`
- `Centralized Behavioral Health Intake SOP Manual.docx`
- `Louisiana Inpatient Psychiatry Assessment and Crisis Platform Feasibility Report.md`
- `Reporting Metrics Ops and Budget .xlsx`
- `clarity-competitive-landscape-epec.md`
- `clarity-epec.jsx`
- `clarity-holistic-synthesis.md`
- `clarity-mh-codex-architecture-package.zip`

### Source notes

Path: `source-notes/`

Available files:

- `mental-health-clarity-chain-of-custody-thread.txt`
- `research-product-scope-thread.txt`

### Reporting metrics rebuild package

Path: `reporting-metrics-rebuild-package/`

Available files:

- `REPORTING_METRICS_REVERSE_ENGINEERING.md`
- `SUSTAINABLE_MODEL_ARCHITECTURE.md`
- `METRIC_DEFINITIONS.md`
- `DASHBOARD_MODULES.md`
- `MIGRATION_PLAN.md`
- `SCHEMA_BLUEPRINT.sql`
- `CODEX_REBUILD_PROMPT.md`
- `analysis_summary.json`
- `formula_inventory.csv`
- `sheet_dependency_edges.csv`
- `sheet_summary.csv`
- `reporting-metrics-rebuild-audit.xlsx`

## Source Contribution Map

### 1. `clarity-holistic-synthesis.md`

Role:

- Product synthesis and market-context source.

Main contributions:

- One-capture / four-outputs thesis.
- Request-broadcast direction over stale bed registry.
- Competitor feature adoption map across XFERALL, OpenBeds, iCarol, Julota, InterQual/MCG practices, and Clarity-only wedge.
- Intake-to-medical-necessity-to-legal-instrument-to-referral-packet product shape.
- Decision-support guardrail for clinician review.

Use status:

- Product thesis: `source-confirmed`
- Market feature comparisons: `summary-derived`
- Specific competitor performance claims: `summary-derived`
- InterQual/MCG practice references: `requires clinical review`
- Payer criteria implementation: `requires clinical review`
- Any proprietary criteria wording: `requires legal review`

### 2. `clarity-competitive-landscape-epec.md`

Role:

- Competitive and legislative positioning source for the ePEC/eOPC/eCEC custody wedge.

Main contributions:

- Paper-native and siloed emergency certificate problem definition.
- Clarity wedge around legal instrument execution plus evidence-grade chain of custody.
- Competitor whitespace claim.
- Acceptance-receipt pilot idea.
- Coroner-first GTM hypothesis.
- Louisiana and North Carolina legislative comparison.

Use status:

- Digital custody wedge: `source-confirmed`
- Acceptance receipt attached to legal instrument: `source-confirmed`
- Competitor whitespace: `summary-derived`
- Coroner-first GTM: `summary-derived`
- Louisiana statutory interpretation: `requires legal review`
- North Carolina legislative precedent transferability: `requires legal review`
- Pilot outcome metrics: `unknown` until measured.

### 3. `CIA Comp initial Assesment guidance .md`

Role:

- Clinical assessment and medical-necessity context source.

Main contributions:

- Universal assessment domains.
- Legal status and consent documentation.
- Collateral importance.
- Suicide, homicide, aggression, elopement, grave disability, substance use, medical suitability, functional status, and age-specific assessment needs.
- Adult, geriatric, adolescent, and child branching.
- Common documentation pitfalls.
- Public tool references and evidence limits.

Use status:

- Assessment domain list: `source-confirmed`
- Age-stratified branching need: `source-confirmed`
- Pitfall guard categories: `source-confirmed`
- Medical-necessity documentation structure: `requires clinical review`
- Any final level-of-care conclusion: `requires clinical review`
- State-specific consent and involuntary-status handling: `requires legal review`
- Public tool availability: `summary-derived` until each tool is separately verified.

### 4. `Centralized Behavioral Health Intake SOP Manual.docx`

Role:

- Operational intake process, role, KPI, and compliance-context source.

Main contributions:

- Centralized intake operating philosophy.
- Role model: intake director, lead intake nurse/clinician, intake coordinator, business office, plus adjacent stakeholders.
- Ten-step process: referral entry, legal status, medical clearance, clinical screening, psychiatric review, benefit verification, packet completion, bed assignment, transport, admission/handoff.
- KPI set and scorecard ideas.
- EMTALA and financial-risk concerns.
- Need for compliance checklist and escalation logic.

Use status:

- Ten-step intake pipeline: `source-confirmed`
- Role taxonomy: `source-confirmed`
- KPI categories: `source-confirmed`
- EMTALA-related workflow concerns: `requires legal review`
- Clinical screening standards: `requires clinical review`
- Business-office financial-risk claims: `summary-derived`
- Any rule that benefits verification must occur before admission: `requires legal review` and must not block clinical screening.

### 5. `intake-assessment-policy-procedure-manual.txt`

Role:

- Staff-facing assessment procedure and training-context source.

Main contributions:

- Pre-assessment, during-assessment, and post-assessment protocol.
- Script posture for rapport, safety questions, and follow-up.
- EMR documentation expectations.
- EMTALA and Louisiana Mental Health Code education topics.
- Annual competency checklist.

Use status:

- Training-mode prompts and checklists: `source-confirmed`
- Source-reference and missing-facts workflow: `source-confirmed`
- Competency checklist concept: `source-confirmed`
- Clinical policy specifics: `requires clinical review`
- EMTALA/Louisiana legal education content: `requires legal review`

### 6. `Louisiana Inpatient Psychiatry Assessment and Crisis Platform Feasibility Report.md`

Role:

- Feasibility, legal frame, MVP recommendation, and risk-register source.

Main contributions:

- Louisiana-first feasibility context.
- Platform risk framing.
- MVP recommendation support.
- Legal and compliance caution areas.

Use status:

- Feasibility framing: `summary-derived`
- MVP recommendation support: `summary-derived`
- Legal frame: `requires legal review`
- Risk register items: `summary-derived`
- Any claim of statutory compliance: `requires legal review`

### 7. `Pasted text.txt`

Role:

- Broad conversation synthesis and prototype note source.

Main contributions:

- Early product framing.
- Chain-of-custody concept.
- MVP technical requirements.
- Pilot measurement ideas.

Use status:

- Conversation-derived product intent: `summary-derived`
- Pilot metrics ideas: `summary-derived`
- Any measured improvement claim: `unknown` unless separately measured.

### 8. `clarity-epec.jsx`

Role:

- Prototype/reference code source.

Main contributions:

- EPEC workflow UX ideas.
- Legal/custody sequence visualization.
- Possible screen and state concepts.

Use status:

- Prototype screen-flow ideas: `source-confirmed`
- Production data model: `unknown`
- Production security model: `unknown`
- Legal enforcement logic: `requires legal review`

### 9. `Reporting Metrics Ops and Budget .xlsx`

Role:

- Metrics, operations, and budget context source.

Main contributions:

- Not reviewed in this pass.

Use status:

- Metrics content: `unknown`
- Budget content: `unknown`
- Operational claims: `unknown`

### 10. `reporting-metrics-rebuild-package/`

Role:

- Company-agnostic reporting and metrics rebuild package.
- Utilization review excellence and healthcare operating-intelligence context source.

Main contributions:

- Reverse-engineering of a fragile reporting/budget workbook.
- Evidence that manual monthly-tab reporting should become event/fact tables.
- PHI boundary recommendation: clinical PHI store plus de-identified analytics mart.
- Durable metrics for inpatient census, utilization review, IOP, staffing, and finance.
- Dashboard module plan for executive, bed board, UR, intake/referral, revenue, staffing, and IOP.
- Migration plan from workbook artifact to data spine, metric layer, dashboards, forecasting, and exports.

Use status:

- Workbook structure and formula/error counts: `source-confirmed`
- Need to separate PHI-bearing rows from aggregate analytics: `source-confirmed`
- Company-agnostic metric-layer rebuild pattern: `source-confirmed`
- Utilization review metrics: `source-confirmed`
- Predictive denial scoring: `unknown`
- Any measured operational improvement from rebuild: `unknown`
- Proprietary payer criteria automation: `requires clinical review`
- Proprietary criteria system copying or embedding: `requires legal review`

## Product Claim Register

| Claim | Source basis | Status | Architecture use |
| --- | --- | --- | --- |
| Clarity should use one continuous crisis case record. | Synthesis docs and canonical architecture converge on one-capture / many-output pattern. | `source-confirmed` | Canonical data spine. |
| One capture should generate assessment, medical-necessity narrative, legal instrument, and referral packet. | `clarity-holistic-synthesis.md`; generated product thesis. | `source-confirmed` | Core product thesis. |
| The first wedge should be acute intake plus medical necessity plus Louisiana legal instrument custody. | `clarity-holistic-synthesis.md`; `clarity-competitive-landscape-epec.md`. | `source-confirmed` | Priority build lane. |
| Clarity should not start as a statewide bed board. | `clarity-holistic-synthesis.md`; request-broadcast discussion. | `source-confirmed` | Bed registry deferred. |
| Request-broadcast should push a complete patient packet to eligible facilities and capture live responses. | `clarity-holistic-synthesis.md`; request-broadcast workflow docs. | `source-confirmed` | Priority routing workflow. |
| Multi-facility one-click responses and decline analytics are important market-informed features. | `clarity-holistic-synthesis.md`. | `summary-derived` | Inform design, validate later. |
| Clarity can beat referral rails by transmitting a legally executed, hash-verified instrument with clinical narrative and custody ledger attached. | `clarity-holistic-synthesis.md`; `clarity-competitive-landscape-epec.md`. | `summary-derived` | Strategic positioning, validate with buyers. |
| Legal instrument execution and chain-of-custody are the defensible Clarity wedge. | `clarity-competitive-landscape-epec.md`. | `source-confirmed` | Priority build lane. |
| Louisiana PEC/OPC/CEC digital execution can be implemented without legal change. | Competitive playbook hypothesis. | `requires legal review` | Do not enforce or claim. |
| Louisiana statutory clocks and official form requirements can be shown in software. | Architecture docs and legal workflow. | `requires legal review` | Configurable display only until counsel validates. |
| e-signature, attestation, retention, admissibility, coroner workflow, DA/court packet format, and redaction policies can be productized. | Legal/custody docs. | `requires legal review` | Architecture-ready, enforcement blocked. |
| Guided intake should branch by field mode and clinical mode. | Assessment guidance and synthesis. | `source-confirmed` | Priority intake workflow. |
| Assessment should branch by adult, geriatric, adolescent, and child needs. | `CIA Comp initial Assesment guidance .md`. | `source-confirmed` | Priority intake workflow. |
| Geriatric abrupt confusion should trigger delirium/capacity prompts. | `CIA Comp initial Assesment guidance .md`. | `requires clinical review` | Prototype guard, clinical validation needed. |
| Youth cases should require guardian/collateral and means-restriction prompts. | `CIA Comp initial Assesment guidance .md`. | `requires clinical review` | Prototype guard, clinical validation needed. |
| Medical necessity draft should structure severity, function, treatment history, environment, engagement, lower LOC, and need for 24-hour care. | Assessment guidance and synthesis. | `requires clinical review` | Priority draft workflow, no final certification. |
| AI can summarize, flag missing fields, draft questions, and draft narrative language. | Guardrail docs and synthesis. | `source-confirmed` | Later governed AI layer. |
| AI cannot diagnose, determine LOC, certify medical necessity, sign legal instruments, or lock notes. | Guardrail docs and synthesis. | `requires clinical review` | Non-negotiable safety rule. |
| Clinical screening and emergency review must not be blocked by insurance verification. | SOP, assessment procedure, EMTALA lane docs. | `requires legal review` | Non-negotiable workflow guard. |
| Benefits verification should run as a parallel lane. | SOP and workflow docs. | `source-confirmed` | Priority workflow model. |
| Central intake pipeline should include referral entry, legal status, medical clearance, screening, psychiatric review, benefits, packet completion, bed assignment, transport, handoff. | SOP docx. | `source-confirmed` | Phase 2/3 operating model. |
| Command center should show SLA clocks, packet completeness, legal deadlines, routing status, and escalation alerts. | SOP and generated module docs. | `summary-derived` | Phase 2+ after intake spine. |
| Milieu-aware bed placement should consider compatibility, adjacency, geography, unit acuity, staffing, and observation load. | Product scope thread and synthesis. | `summary-derived` | Parking lot / Phase 3+ until spine works. |
| Bedboard recommendations should be decision support, with charge nurse override logged. | Architecture docs. | `requires clinical review` | Future module. |
| Reporting should include referral timing, acceptance rate, packet completeness, documentation errors, denials, and pilot outcomes. | SOP, synthesis, architecture docs. | `summary-derived` | Phase 3+ metrics layer. |
| Baseline transfer timing, acceptance rates, packet completeness, documentation-error rate, and pilot outcome measurements are known. | Current docs. | `unknown` | No measurements found. |
| Reporting Metrics Rebuilder should be company-agnostic rather than Clarity-specific. | User direction and rebuild package architecture. | `source-confirmed` | Reusable operating-intelligence module. |
| Utilization review excellence should be the first lens for the reporting module. | User direction and rebuild package UR metrics. | `source-confirmed` | Prioritize UR work queue, auth risk, denied days, days at risk, and documentation gaps. |
| Manual monthly workbook tabs should be replaced by reusable fact tables and a metric layer. | `reporting-metrics-rebuild-package/REPORTING_METRICS_REVERSE_ENGINEERING.md`; `SUSTAINABLE_MODEL_ARCHITECTURE.md`. | `source-confirmed` | Data model rule. |
| Workbook exports should be outputs, not the system of record. | `reporting-metrics-rebuild-package/REPORTING_METRICS_REVERSE_ENGINEERING.md`. | `source-confirmed` | Export architecture rule. |
| Current reporting workbook performance improvements are known. | Current docs. | `unknown` | No measurements found. |

## Current Evidence Limits

Unknown:

- Exact current Louisiana statutory wording and official form requirements.
- Current official e-signature acceptance requirements for each legal instrument.
- Current hospital-specific assessment forms.
- Current payer criteria packs and facility-specific authorization rules.
- Live competitor feature state.
- Current baseline workflow performance.

No measurements found:

- Baseline transfer timing.
- First-submission acceptance rates.
- Current packet completeness rate.
- Documentation-error rate.
- Pilot outcome measurements.
