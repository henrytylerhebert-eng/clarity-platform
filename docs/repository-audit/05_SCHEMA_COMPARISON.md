# 05 — Schema Comparison

**Date:** 2026-07-10 · Decision recorded in `docs/architecture/ADR-0002-canonical-data-model.md`.

## Candidates

### 1. Jul 8 crisis-generation schema — `reference/source-packages/clarity-mh-architecture/schema/prisma.schema.prisma`

22 models: Organization, Facility, User, Patient, IntakeCase, Encounter, Assessment(+Section), RiskFinding, MedicalNecessitySnapshot, SourceReference, LegalInstrument(+Version), EvidenceArtifact, CustodyLedgerEvent, Transmission, FacilityResponse, ReferralPacket, LifeDomain, LifeStressor, AIOutput, AuditLog.
**Strengths:** richest crisis-domain modeling (legal instruments with versions, custody ledger, facility responses). **Weaknesses:** raw `Patient` identity (no tokenization); no insurance/benefits/authorization at all; docs/06 flagged P1 misalignment with its own RLS starter and missing entities vs. its docs; never CLI-validated pre-session.

### 2. Reporting SQL blueprint — `reporting-metrics-rebuild-package/SCHEMA_BLUEPRINT.sql`

Star-schema for reporting metrics only. Different scope; not a competitor for the case spine. Kept with its package.

### 3. **Foundation schema (SELECTED)** — now `prisma/schema.prisma`

Byte-identical in the database artifact and master package (`schema.foundation.prisma`, SHA `909bfedf…`). 872 lines → 25 models, 35 enums: Organization, User, **PatientToken** (tokenized identity), BehavioralHealthCase (with all 8 parallel workstream statuses), SourceDocument, EvidenceItem, HumanReview, LegalStatusRecord, MedicalNecessityReview, RuleSet/Rule, PayerProfile, PlanProfile, InsuranceSubscriber, InsuranceCoverage, EligibilityVerification(+Proof), BenefitVerification(+Source), Authorization, FinancialEducationRecord, FacilityProfile, Referral, CustodyEvent, AuditEvent.
**Strengths:** covers both generations' core spine plus the full payer stack; tokenized identity; audit as first-class; smallest schema that satisfies the REQ matrix Sprint 1–6 rows. **Validated this session (see 05_SCHEMA_VALIDATION_RESULTS.md).**

### 4. Expanded target draft — `…v0.2.0-partial/schema(1) (1).prisma`

1,484 lines → 43 models, 56 enums = foundation + 18: AgentRun, CaseSummary, CitationRecord, ClaimOutcome, CommunicationRecord, ContractRateRecord, DecisionRecord, FacilityMatch, IntegrationEndpoint, KnowledgeSource, PacketItem, PayerContactEvent, PromptRecord, ReferralPacket, ReferralPriorityAssessment, RetrospectiveReview, RuleEvaluation, WorkflowTask.
**Also validates cleanly** (`prisma validate` passed this session, contradicting the package QA report's expectation of needed corrections). Retained as the **documented adoption target** — models graduate into the canonical schema when their domain is built (OD-8).

## Coverage deltas that matter

- Foundation lacks: WorkflowTask (REQ-004, Sprint 2), packet models (ReferralPacket/PacketItem), communication records, agent/prompt/knowledge governance models, decision/retrospective records. All exist in the expanded draft — first graduation candidates.
- Jul 8 schema concepts **not yet represented in either Jul 10 schema:** Encounter, Assessment/AssessmentSection detail, LifeDomain/LifeStressor, bedboard entities (units/rooms/beds/acuity, in `docs/03-data-model.md` but no schema), legal-instrument versioning. These stay tracked in OPEN_DECISIONS (OD-8 scope) so crisis-wedge depth is not lost.

## Decision summary

Foundation → canonical (`prisma/schema.prisma`); expanded draft → target; Jul 8 schema → historical (superseded, preserved); SQL blueprint → reporting package context. No original was modified; `prisma format` normalized whitespace in the canonical copy only.
