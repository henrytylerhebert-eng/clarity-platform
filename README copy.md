# Clarity AI Master Architecture Package

**Version:** 0.2.0  
**Prepared:** 2026-07-10  
**Working product name:** Clarity AI  
**Status:** Architecture and product-design specification; not a deployed clinical system

## Purpose

This package consolidates the full Clarity concept developed to date: a behavioral-health case-intelligence and care-orchestration platform inspired by the vertical, source-grounded workflow model used by enterprise legal AI platforms.

Clarity is designed to help qualified healthcare professionals convert fragmented referrals, assessments, legal documents, payer information, facility criteria, and operational communications into structured, source-linked, human-reviewed workflows.

It is not designed to replace clinicians, attorneys, utilization reviewers, admission personnel, or revenue-cycle staff.

## What this package covers

The package includes:

- product vision, positioning, users, and boundaries
- end-to-end referral and admission workflows
- clinical, legal, medical-screening, placement, custody, and communication domains
- insurance extraction, eligibility, benefits verification, authorization, payer memory, and patient financial education
- agent catalog, agent contracts, prompt governance, and model orchestration
- data architecture, a draft Prisma schema, data dictionary, audit rules, and synthetic cases
- rules, retrieval, citations, source authority, and knowledge governance
- security, privacy, tenancy, model-risk, and human-approval controls
- services, APIs, integrations, UI specifications, events, and repository structure
- evaluation strategy, safety tests, roadmap, sprint backlog, GitHub issues, and developer handoff materials
- commercial hypotheses, product tiers, ROI measurement, open decisions, and risk register

## Canonical architectural decision

Benefits verification does **not** replace or restart the original design. It is added as a first-class parallel workstream.

The core platform spine remains:

```text
Case
Documents
Evidence
Review
Rules
Workflow
Audit
```

The expanded operating model is:

```text
Case
Documents
Evidence
Clinical Review
Legal Review
Medical Screening
Insurance
Eligibility
Benefits Verification
Authorization
Placement
Custody
Communication
Workflow
Audit
Intelligence
```

Clinical urgency, operational readiness, placement readiness, and financial readiness remain separate. Clarity must not hide them inside a single payer-weighted prioritization score.

## Package status and limitations

This package is comprehensive at the architecture and requirements level through the latest benefits-verification and decision-intelligence input.

It is not proof that:

- the Prisma schema validates without changes
- any legal rule is current or applicable in a specific jurisdiction
- any clinical criteria can be used without licensing or governance review
- any payer portal permits automated access
- any estimated reimbursement or patient responsibility will match final claim adjudication
- the system is HIPAA compliant merely because controls are described
- any integration is available from a specific vendor

Those items require implementation, contracting, security review, clinical governance, legal review, and testing.

## How to use the package

### For the product owner

Start with:

1. `00-executive-overview/EXECUTIVE_SUMMARY.md`
2. `00-executive-overview/DECISION_LOG.md`
3. `01-product-vision/PRODUCT_REQUIREMENTS.md`
4. `15-roadmap-and-sprints/ROADMAP.md`
5. `18-open-decisions-and-risks/OPEN_DECISIONS.md`

### For the developer or technical lead

Start with:

1. `16-developer-handoff/DEVELOPER_BRIEF.md`
2. `16-developer-handoff/REPOSITORY_STRUCTURE.md`
3. `08-data-and-database/prisma/schema.prisma`
4. `11-api-and-services/SERVICE_AND_API_ARCHITECTURE.md`
5. `13-testing-and-evaluation/TEST_AND_EVALUATION_STRATEGY.md`
6. `16-developer-handoff/MASTER_BUILD_PROMPT.md`

### For clinical, legal, compliance, and revenue-cycle reviewers

Review:

- `03-clinical-intelligence/CLINICAL_INTELLIGENCE_SPEC.md`
- `04-legal-and-regulatory/LEGAL_AND_REGULATORY_SPEC.md`
- `05-benefits-and-payer-intelligence/BENEFITS_AND_PAYER_SPEC.md`
- `10-security-and-governance/SECURITY_PRIVACY_AND_GOVERNANCE.md`
- `18-open-decisions-and-risks/RISK_REGISTER.md`

## Folder map

```text
clarity-ai-master-architecture/
├── 00-executive-overview/
├── 01-product-vision/
├── 02-user-and-workflow-architecture/
├── 03-clinical-intelligence/
├── 04-legal-and-regulatory/
├── 05-benefits-and-payer-intelligence/
├── 06-placement-and-custody/
├── 07-agent-architecture/
├── 08-data-and-database/
├── 09-rules-and-retrieval/
├── 10-security-and-governance/
├── 11-api-and-services/
├── 12-ui-and-experience/
├── 13-testing-and-evaluation/
├── 14-commercial-model/
├── 15-roadmap-and-sprints/
├── 16-developer-handoff/
├── 17-synthetic-cases/
├── 18-open-decisions-and-risks/
├── diagrams/
├── REQUIREMENTS_TRACEABILITY.md
├── MASTER_ARCHITECTURE.md
└── manifest.json
```

## Recommended immediate next move

Create the repository, validate the data model, and implement the case spine before building an open-ended chat interface.

The first engineering milestone should prove:

```text
Synthetic referral
→ document ingestion
→ source-linked evidence
→ human review
→ parallel clinical/legal/benefits workstreams
→ packet preparation
→ simulated routing
→ custody handoff
→ immutable audit timeline
```
