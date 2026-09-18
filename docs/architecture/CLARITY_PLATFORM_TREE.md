---
status: repository-grounded architecture snapshot
owner: Product owner / technical owner
as_of: 2026-09-16
checkout: claude/clarity-marketing-strategy-a135e7 @ 5f22f6e
authoritative_status: ../../IMPLEMENTATION_STATUS.md and linked decision records
---

# Clarity Platform Tree


> **PRESERVATION NOTE — added 2026-09-18 (Housekeeping Phase 1).** Snapshot taken
> 2026-09-16 against checkout `claude/clarity-marketing-strategy-a135e7 @ 5f22f6e`;
> committed to Git for the first time on 2026-09-18 from `main` at `5c4c0b9`. Treat
> the checkout reference and every status label below as **historical to 2026-09-16**,
> not as a current capability claim. The architecture drift and service extraction
> registers noted below as "not a single artifact" do exist as
> `docs/architecture/ARCHITECTURE_DRIFT_REGISTER.md` and
> `docs/architecture/SERVICE_EXTRACTION_MATRIX.md` on the unmerged branch behind
> PR #73, which was still open and CONFLICTING as of 2026-09-18.

This tree replaces the pasted snapshot as a repository-local, corrected copy.
Status labels distinguish implemented local behavior from provider proof,
production readiness, and future direction. The implementation-status narrative
contains historical sections; use its dated current-state block and the linked
decision records for capability claims. This document is a map, not an
authorization to build, deploy, connect real data, or publish claims.

```text
CLARITY PLATFORM — one platform, multiple domain applications
│  Topology: recommendation awaiting product-owner ruling
│  Checkout: claude/clarity-marketing-strategy-a135e7 @ 5f22f6e
│  Runtime: local synthetic prototype + backend foundations
│  Production / PHI readiness: NOT ESTABLISHED
│
├── 0. ARCHITECTURE, GOVERNANCE + DELIVERY EVIDENCE
│   ├── [DOCUMENTED] Canonical architecture entry point and ADR set
│   ├── [PARTIAL] Current-state/status record (needs refresh for this checkout)
│   ├── [DOCUMENTED] Product evidence and decision protocol
│   ├── [DOCUMENTED] Open decisions, risks, work-package template
│   ├── [DOCUMENTED] UX topology/navigation/session findings
│   ├── [DOCUMENTED] Implementation roadmap and verification manifests
│   └── [UNKNOWN / NOT A SINGLE ARTIFACT] Architecture drift and service
│       extraction registers as named in the pasted tree
│
├── 1. USERS + ROLE CONTEXT
│   ├── [PROTOTYPE] Field responder
│   ├── [PROTOTYPE] Central intake
│   ├── [PROTOTYPE] Clinician reviewer
│   ├── [BACKEND FOUNDATION] UR / benefits specialist
│   ├── [PROTOTYPE] Receiving facility
│   ├── [PROTOTYPE] Charge nurse / operations
│   ├── [PROTOTYPE] Compliance / legal reviewer
│   └── [PROTOTYPE] Executive / leadership
│       NOTE: display-role behavior is not equivalent to production
│       authorization. Server authorization is bounded by implemented routes
│       and policies; production identity and access acceptance remain open.
│
├── 2. EXPERIENCE LAYER
│   ├── CRISIS OPS
│   │   ├── [LOCAL SYNTHETIC PROTOTYPE] Guided intake and case queue
│   │   ├── [LOCAL SYNTHETIC PROTOTYPE] Evidence and risk review
│   │   ├── [DRAFT / REVIEW-GATED] Medical-necessity and legal-status views
│   │   ├── [LOCAL SYNTHETIC PROTOTYPE] Benefits / authorization views
│   │   ├── [LOCAL SYNTHETIC PROTOTYPE] Packet preview and simulated routing
│   │   ├── [DEMO] Bedboard, custody ledger, command center
│   │   └── [PARTIAL] Some screens remain localStorage-backed; API wiring is
│   │       workflow-specific, not a production-wide integration
│   ├── REVOPS
│   │   ├── [IMPLEMENTED SYNTHETIC SLICES] Setup, operations, reconciliation,
│   │   │   close, export, rate registry and pricing work
│   │   ├── [INCOMPLETE] Accepted workbook parity across P1–P6
│   │   └── [NOT AUTHORIZED BY THIS MAP] Real-hospital source pilot / deployment
│   ├── OPERATING ASSURANCE
│   │   ├── [LOCAL APPLICATION SURFACE EXISTS] Shared platform shell and
│   │   │   reviewed synthetic/demo flows
│   │   ├── [PRODUCT/IMPLEMENTATION DECISIONS OPEN] Product home and scope
│   │   └── [NOT AUTHORIZED] Historical-corpus use or pilot
│   ├── [BACKEND ONLY] Prescreen and Episode / UR have no established frontend
│   └── [PARTIAL] Reporting/analytics; no complete cross-domain dashboard
│
├── 3. APPLICATION + API LAYER
│   ├── [IMPLEMENTED FOUNDATION] Authentication and revocable server sessions
│   ├── [IMPLEMENTED FOUNDATION] Principal-derived organization and actor context
│   ├── [IMPLEMENTED BOUNDED ROUTES] Case, prescreen, RevOps and related APIs
│   ├── [IMPLEMENTED] Request validation and domain service routing
│   ├── [IMPLEMENTED] Shared React auth context, router, and global shell
│   ├── [LIMITED] Authorization is route/domain-specific; not production-wide
│   ├── [DECISION / DEPLOYMENT GATES OPEN] Production API hosting/runtime
│   └── [FUTURE ONLY IF JUSTIFIED] Gateway or additional service boundary
│
├── 4. DOMAIN PLATFORM
│   ├── 4.1 Identity + tenancy
│   │   ├── [IMPLEMENTED FOUNDATION] Auth sessions and tenant-scoped query paths
│   │   ├── [LOCAL VERIFIED, BOUNDED] Transaction-local RLS for selected tables
│   │   └── [OPEN] Provider runtime role, complete policy coverage, security review
│   ├── 4.2 Case + intake
│   │   ├── [IMPLEMENTED FOUNDATION] Case repository, commands, state transitions
│   │   └── [PROTOTYPE] Intake facts and case workflow UI
│   ├── 4.3 Documents
│   │   ├── [IMPLEMENTED FOUNDATION] Upload, versioning, classification, access
│   │   └── [NOT IMPLEMENTED] Cloud object storage and malware scanning
│   ├── 4.4 Evidence
│   │   ├── [IMPLEMENTED FOUNDATION] Human review, provenance, lineage,
│   │   │   contradiction groups
│   │   └── [NOT IMPLEMENTED] Live extraction/OCR or autonomous approval
│   ├── 4.5 Benefits + 4.6 authorization
│   │   ├── [IMPLEMENTED FOUNDATION] Manual benefits verification and
│   │   │   authorization preparation/readiness
│   │   └── [NOT IMPLEMENTED] Payer APIs or autonomous submission/decisions
│   ├── 4.7 Episode + 4.8 utilization review
│   │   └── [BOUNDED IMPLEMENTATION] Episode persistence, review outcomes,
│   │       documentation gaps, correction history, timezone lineage
│   ├── 4.9 Governed events
│   │   ├── [IMPLEMENTED FOUNDATION] Transactional outbox and bounded synthetic
│   │   │   dispatcher/consumer
│   │   └── [NOT IMPLEMENTED] External delivery, production workers, retries/
│   │       operations beyond the verified synthetic boundary
│   ├── 4.10 Learning + practice
│   │   ├── [CODE EXISTS] Learning-practice service and synthetic practice UI
│   │   └── [INTEGRATION / END-TO-END ACCEPTANCE UNKNOWN] Do not treat package
│   │       tests or UI presence as live workforce adoption
│   ├── 4.11 Operating Assurance
│   │   └── [DOCUMENTED / PARTIAL APP SURFACE] Product home, corpus permissions,
│   │       scope, and pilot authority remain open
│   └── 4.12 Performance + reporting
│       ├── [PARTIAL] RevOps and domain-specific metrics/workbooks
│       └── [DOCUMENTED / FUTURE] Broad analytics, forecasting, benchmarks,
│           and improvement tracking
│
├── 5. DATA FOUNDATION
│   ├── [IMPLEMENTED] PostgreSQL / Prisma schema and migrations
│   ├── [IMPLEMENTED FOUNDATION] Tenant-scoped persistence for selected domains
│   ├── [LOCAL VERIFIED, BOUNDED] RLS policies on specified tables only
│   ├── [PROVIDER STATE] Supabase selected; existing migrations applied;
│   │   anon/authenticated grants revoked
│   ├── [NOT VERIFIED] Supabase RLS acceptance suite, non-bypass runtime role,
│   │   backup/restore, key rotation, or operational recovery
│   └── [SYNTHETIC ONLY] App/test databases; real/PHI use is not approved
│
├── 6. EVENT + ASYNC FOUNDATION
│   ├── [IMPLEMENTED FOUNDATION] Governed event contracts and transactional outbox
│   ├── [BOUNDED SYNTHETIC VERIFICATION] In-process dispatch/consumer behavior
│   ├── [NOT IMPLEMENTED] Production workers, external delivery, DLQ and
│   │   operational observability
│   └── [DO NOT ADD WITHOUT A DECISION] Kafka, RabbitMQ, NATS, Redis Streams
│
├── 7. CROSS-CUTTING PLATFORM CONTROLS
│   ├── [IMPLEMENTED FOUNDATION] Identity, tenant predicates, provenance,
│   │   human review gates, audit/history, synthetic-data guardrails
│   ├── [BOUNDED] Local RLS and append-only controls on selected records
│   └── [OPEN] Independent security/privacy acceptance and production control set
│
├── 8. PRODUCTIONIZATION
│   ├── [NOT ESTABLISHED] Production application/API deployment
│   ├── [PARTIAL] CI verification exists; production CI/CD/release process unknown
│   ├── [NOT IMPLEMENTED] Managed identity, production secret rotation,
│   │   production file storage, malware scanning
│   ├── [NOT VERIFIED] Full backup/recovery, disaster recovery, observability,
│   │   performance/load acceptance
│   ├── [NOT COMPLETE] Provider-backed security and tenancy acceptance
│   └── [NOT READY] Controlled pilot; requires separate product, clinical, legal,
│       operational, security, and technical approvals
│
├── 9. EXTERNAL ECOSYSTEM
│   └── [NOT IMPLEMENTED / CONDITIONAL] EHR, payer, clearinghouse, identity,
│       messaging, BI, ERP, HRIS/payroll, and external APIs
│
├── 10. ANALYTICS EVOLUTION
│   ├── CURRENT [PARTIAL] Operational, RevOps, and domain-level reporting
│   ├── EMERGING [DOCUMENTED] Scorecards, variance explanation, follow-through
│   └── FUTURE / VALIDATE FIRST: warehouse, lake, forecasting, predictive models,
│       cross-organization benchmarks
│
├── 11. SERVICE EXTRACTION RULE
│   ├── DEFAULT: retain modular-monolith boundaries
│   └── EXTRACT only for evidenced scaling, isolation, reliability, ownership,
│       release-cadence, or infrastructure need with benefit above added cost
│
└── 12. DELIVERY PIPELINE
    Repository + source records
        ↓
    Reconcile current status and decisions
        ↓
    Define one bounded work package and acceptance evidence
        ↓
    Owner approval where the decision protocol requires it
        ↓
    Implement in the authorized slice
        ↓
    Run focused tests and required build/security checks
        ↓
    Independent/reviewer gates where applicable
        ↓
    Update implementation status, evidence, risks, and decisions
```

## Corrections from the pasted tree

- Supabase is the selected provider and the schema was applied, but provider-backed
  tenant/RLS acceptance, a non-bypass runtime role, backup/recovery, and security
  acceptance are **not** verified. Revoking Supabase REST-role grants is not the
  same as enabling RLS on all tables.
- Local RLS is implemented for a bounded set of persistence tables. Do not label
  PostgreSQL RLS as implemented platform-wide.
- The learning/practice package and UI code exist; this alone does not prove
  complete integration or operational adoption.
- A production build and API foundations do not establish production hosting,
  managed identity, external integrations, or pilot readiness.
- RevOps has meaningful implemented slices, but accepted workbook parity remains
  incomplete. Follow P1–P7 in the workbook function map.
- Operating Assurance has open product-home, corpus-use, and implementation gates.
- Do not present the tree's architecture labels as marketing claims. External
  copy must follow `docs/marketing/CLAIMS_AND_EVIDENCE_LEDGER.md`.

## Primary references

- [`IMPLEMENTATION_STATUS.md`](../../IMPLEMENTATION_STATUS.md)
- [`README.md`](../../README.md)
- [`ADR-0022: Supabase provider swap`](ADR-0022-supabase-provider-swap.md)
- [`OD-6 provider and RLS decision packet`](../decisions/OD-6_PROVIDER_AND_RLS_DECISION_PACKET.md)
- [`Product topology decision`](../ux/PRODUCT_TOPOLOGY_DECISION.md)
- [`Workbook to platform workflow map`](../product/WORKBOOK_TO_PLATFORM_WORKFLOW_MAP.md)
- [`Product evidence and decision protocol`](../governance/PRODUCT_EVIDENCE_AND_DECISION_PROTOCOL.md)
