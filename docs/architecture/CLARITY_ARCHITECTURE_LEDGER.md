# Clarity Architecture Ledger

> **PRESERVED 2026-09-18 (Housekeeping Phase 2B).** Extracted from the unmerged PR #73
> branch rather than merging that PR wholesale, because its only conflicting file
> (`IMPLEMENTATION_STATUS.md`) was rewritten by PR #101's truth repair. This document is a
> **2026-09-12 snapshot** taken against `main` at `15a094d`; treat its statuses, counts and
> file sizes as historical to that date, not as current capability. Corrections applied on
> extraction are marked inline as **[CORRECTED 2026-09-18]**. See
> [`../recovery/2026-09-18-housekeeping-phase-1-truth-reconciliation.md`](../recovery/2026-09-18-housekeeping-phase-1-truth-reconciliation.md).

> The suite counts in the snapshot line below (**755/755**, **132/132**) were verified on
> **2026-09-12** and are **historical evidence only** — no test run is claimed for this
> extraction. The synthetic-residue figures it reports are DRIFT-13 evidence; a 2026-09-18
> read-only count found 401 organizations / 1,192 cases.

**Snapshot:** `main` at `15a094ddc352030ee392f1d4f9b31c8ae49a2973`, 2026-09-12. Verified this
session: root suite **755/755** (72 files), app suite **132/132** (20 files), lint clean,
typecheck clean, `prisma validate` clean, after applying this worktree's 10 pending
migrations to local `clarity_dev` and regenerating the Prisma client (they were absent —
see [ARCHITECTURE_DRIFT_REGISTER.md](ARCHITECTURE_DRIFT_REGISTER.md) DRIFT-01). Synthetic
residue is **not** zero this session (Organization 338→400, BehavioralHealthCase
1023→1191) — the suite creates rows it does not clean up; tracked, not new to this pass.

**Status vocabulary:** IMPLEMENTED | PARTIAL | BUILT / INTEGRATION PENDING | DESIGNED |
PLANNED | FUTURE | DEPRECATED | UNKNOWN. A status describes what exists, never production
readiness — see [PRODUCTION_READINESS_MATRIX.md](PRODUCTION_READINESS_MATRIX.md) for that
axis, and the **Not claimed** statement at the end of this file for what it never means.

**Evidence priority when documentation and code disagree** (per this audit's own rule):
current executable code → database/schema/migrations → tests → this ledger and
`IMPLEMENTATION_STATUS.md` → accepted ADRs → other architecture docs → planning/reference
material. Every contradiction found is in
[ARCHITECTURE_DRIFT_REGISTER.md](ARCHITECTURE_DRIFT_REGISTER.md), not silently resolved
here.

---

## How to read one entry

```
### <Component>
Domain / Layer / Purpose
Status: <vocabulary>
Repository location: <paths>
Runtime/deployment boundary: <in-process module | separate package, same process | none>
Persistence: <Prisma models, migrations>
API surface: <routes, or "none">
Events produced / consumed: <governed-event types, or "none">
Dependencies: <other components/packages>
Tenant behavior: <organizationId scoping mechanism>
Authorization behavior: <role/permission model>
Audit/provenance behavior: <what's written, what's immutable>
Tests: <exact counts, file paths>
Known gaps: <concrete, cited>
Target state: <what would complete it>
Extraction trigger: <what would have to become true before this becomes an independent
  deployed service — "KEEP MODULAR" if nothing does>
Evidence: <file:line citations>
```

---

## 0. Governance and tenancy foundation

**Domain / Layer:** Cross-cutting / Application + Data.
**Purpose:** Organization/user/role scope, authentication, audit, idempotency,
optimistic-concurrency versioning.
**Status:** IMPLEMENTED.
**Repository location:** `packages/domain-contracts`, `packages/case-repository`,
`packages/auth-service`.
**Runtime/deployment boundary:** in-process libraries consumed by every service package;
no independent deployment.
**Persistence:** `prisma/schema.prisma` — `Organization`, `User`, `AuthSession`,
`AuditEvent`, `CommandIdempotencyRecord`; `organizationId` + `version` columns on every
tenant-scoped model.
**API surface:** none directly — consumed by `packages/api-service`.
**Events produced/consumed:** `SESSION_ISSUED`/`SESSION_REVOKED` (organization-level audit
events, null `caseId`).
**Dependencies:** none (foundation layer).
**Tenant behavior:** every gateway query/write predicate includes `organizationId`; a
record id is never treated as authorization (CLAUDE.md invariant, spot-checked across
evidence/benefits/case gateways).
**Authorization behavior:** `UserRole` enum, static policy tables per service (see
DRIFT-04 for duplication of the guard pattern) plus assurance-service's distinct
per-resource participant-grant model.
**Audit/provenance behavior:** append-only `AuditEvent` writes via the shared
`CaseAuditWriter`/`PrismaCaseAuditWriter` (`case-repository/src/auditWriter.ts`), used by
8 of the domain gateways; metadata carries hashes/field names, never source text.
**Tests:** covered indirectly by every package's integration suite; permission suites
re-run against real session-derived principals per `IMPLEMENTATION_STATUS.md`.
**Known gaps:** `withTenantContext` (the shared transaction wrapper) is used
inconsistently — `evidenceGateway`, `benefitsGateway`, `caseCommandGateway`,
`assuranceGateway`, `documentGateway` call `$transaction` directly instead (DRIFT-05).
**Target state:** no architectural gap; the inconsistency above is a code-hygiene item.
**Extraction trigger:** KEEP MODULAR.
**Evidence:** `packages/case-repository/src/auditWriter.ts`, `tenantContext.ts`;
`prisma/schema.prisma` model definitions.

---

## 1. Case repository & command service

**Domain / Layer:** Case & clinical spine / Domain platform.
**Purpose:** Tenant-scoped case persistence; 9-command workflow transition engine; 8
parallel per-case workstream statuses (clinical, legal review, medical screening,
benefits, authorization, placement, transportation, patient education).
**Status:** IMPLEMENTED (backend). Frontend is **PARTIAL** — see Experience Layer below.
**Repository location:** `packages/case-repository`, `packages/case-service`.
**Runtime/deployment boundary:** in-process; the sole package permitted `@prisma/client`
(confirmed: grepped all 13 `packages/*/package.json`, only `case-repository` declares it).
**Persistence:** `BehavioralHealthCase` + workstream status columns; optimistic
concurrency via `version`; `CommandIdempotencyRecord`.
**API surface:** `packages/api-service` case routes (decision-rationale confirmed wired
end-to-end from the frontend; broader case-command routes exist server-side but are not
called by `app/`).
**Events produced/consumed:** case-state audit events; not part of the governed-event/
outbox vocabulary (see §9).
**Dependencies:** domain-contracts, auth-service (principal), case-repository.
**Tenant behavior:** organization-scoped predicates + atomic case-mutation/audit
transactions.
**Authorization behavior:** static role-policy guard (`case-service/src/permissions.ts`)
— same pattern reimplemented independently in evidence-service and prescreen-service
(DRIFT-04).
**Audit/provenance behavior:** previous/new state hashes on every command; reopen gated
to `ORGANIZATION_ADMIN` with mandatory rationale; `SYSTEM_ADMIN` has no case-command
rights.
**Tests:** 52/52 case-service integration tests (all 12 required behaviors); 30/30
case-repository integration tests; both inside this session's 755/755 root pass.
**Known gaps:** `app/src/workspaces/CaseQueue.tsx` and `CommandCenter.tsx` are
LOCAL_MOCK_ONLY — no `domain/api.ts` import, no test file (per Explore-agent frontend
audit) — so the tested backend workflow engine is not reachable from the actual UI beyond
the one decision-rationale route.
**Target state:** wire Case Queue/Command Center to the real case-command API.
**Extraction trigger:** KEEP MODULAR — no independent-scaling, security-isolation, or
ownership signal found.
**Evidence:** `app/src/workspaces/CaseQueue.tsx` (67 LOC, no API import per Explore
agent); `packages/case-service/src/permissions.ts`.

---

## 2. Document repository

**Domain / Layer:** Case & clinical spine / Domain platform.
**Purpose:** Versioned document storage, dedupe, classification.
**Status:** IMPLEMENTED (backend, dev-only storage adapter).
**Repository location:** `packages/document-service`.
**Persistence:** `Document`, version-family columns, migration
`20260711141534_document_file_size_and_version_family`.
**API surface:** exists server-side; not called from `app/` (no workspace imports
`domain/api.ts` for documents).
**Dependencies:** case-repository (Prisma), storage port.
**Tenant behavior / Authorization / Audit:** controlled-path pattern — envelope → role
policy → transaction → audit; access auditing with VIEW/DOWNLOAD modes.
**Tests:** 32 document tests (14 baseline + 18 hardening) inside the 755/755 pass.
**Known gaps:** storage has exactly two adapters — `InMemoryDocumentStorage` and
`LocalFilesystemObjectStorage`, the latter's own comment reads "DEVELOPMENT ONLY — not a
production object store" (`packages/document-service/src/storage.ts`). No S3/Blob
adapter exists, stubbed or otherwise. No malware scanning — confirmed absent, including in
`docs/security/DOCUMENT_SECURITY_BOUNDARIES.md:18`.
**Target state:** production object-storage adapter + malware scanning before any
real-document pilot (see PRODUCTION_READINESS_MATRIX.md).
**Extraction trigger:** KEEP MODULAR.
**Evidence:** `packages/document-service/src/storage.ts`.

---

## 3. Evidence repository & human review

**Domain / Layer:** Case & clinical spine / Domain platform.
**Purpose:** Case-evidence lifecycle (CANDIDATE→APPROVED/REJECTED/NEEDS_CLARIFICATION/
SUPERSEDED), contradiction groups, entirely human-driven review.
**Status:** IMPLEMENTED (backend). Frontend PARTIAL/mock.
**Repository location:** `packages/evidence-service` + `case-repository/evidenceGateway.ts`
(718 lines).
**API surface:** exists server-side; `app/src/workspaces/EvidenceReview.tsx` (106 LOC) has
no `domain/api` import — LOCAL_MOCK_ONLY.
**Tests:** 19 evidence tests inside the 755/755 pass.
**Known gaps (DRIFT-02, DRIFT-04):** its evidence-status enum/review-decision shape is
independently reimplemented (not shared) in `assurance-service`'s `AssuranceEvidenceStatus`
(`SUBMITTED/ACCEPTED/REJECTED/NEEDS_CLARIFICATION/SUPERSEDED` — same concept, different
first two labels, no Zod validation on the assurance side). Its
`isIdempotencyUniqueViolation` helper and static role-policy guard are each duplicated,
not shared (DRIFT-03, DRIFT-04).
**Target state:** wire EvidenceReview workspace to the real API; decide whether to
formally share the evidence-lifecycle vocabulary with assurance-service or keep them
deliberately separate bounded contexts (recommend the latter — different domains).
**Extraction trigger:** KEEP MODULAR.
**Evidence:** `packages/domain-contracts/src/evidence.ts:30-37` vs `assurance.ts:46-53`.

---

## 4. Benefits verification & Authorization readiness

**Domain / Layer:** Payer & financial readiness / Domain platform.
**Purpose:** Manual insurance/benefits verification (4 commands); authorization
readiness (record/transition/assess, no aggregate score by design).
**Status:** IMPLEMENTED (backend). Frontend LOCAL_MOCK_ONLY for both
(`BenefitsVerification.tsx` 88 LOC, `AuthorizationReadiness.tsx` 69 LOC — neither imports
`domain/api`, neither has a test file).
**Repository location:** `packages/benefits-service`, `packages/authorization-service`.
**Tests:** 16 (benefits) + 10 (authorization) integration tests inside the 755/755 pass.
**Known gaps:** same static role-policy-guard duplication as case-service/evidence-service
would apply if these packages were included in the DRIFT-04 extraction — not directly
confirmed by the Explore agent (scope was case-service/evidence-service/prescreen-service),
flagged as UNKNOWN pending a follow-up check before assuming identical duplication.
**Target state:** wire both workspaces to real APIs.
**Extraction trigger:** KEEP MODULAR.
**Evidence:** Explore-agent frontend audit; `IMPLEMENTATION_STATUS.md` "Completed" section.

---

## 5. Authentication & API layer

**Domain / Layer:** Identity & API boundary / Application layer.
**Purpose:** Server-side sessions (opaque bearer tokens, SHA-256 hashed); the one HTTP
entry point.
**Status:** IMPLEMENTED (auth) / PARTIAL (API — hybrid routing, ADR-0012 accepted in
part).
**Repository location:** `packages/auth-service`, `packages/api-service`.
**Runtime/deployment boundary:** single Fastify process (`server.ts`) wrapping a mix of
native Fastify route registration (RevOps, IOP, Operating Assurance) and a manual
`app.all("/*", ...)` + `reply.hijack()` catch-all (original 4 routes + all prescreen
routes) — a node:http-style dispatch pattern still living inside the Fastify shell
(DRIFT-06).
**API surface:** login/logout/session, `POST /api/cases/{caseKey}/decision-rationale`,
RevOps/operating-workbook, IOP reconciliation, prescreen (7 routes), Operating Assurance.
**Dependencies:** auth-service for principal derivation; every domain service for command
dispatch.
**Tenant/Authorization behavior:** tenant and actor roles derived exclusively from the
verified principal (`AuthenticationService.authenticate` → `actorFor`); no request field
can supply either; unknown body fields rejected (400).
**Tests:** 8 API integration tests (core), 9 (prescreen), assurance API test suite —
all inside the 755/755 pass.
**Known gaps:** DRIFT-06 (hybrid routing) is the only real gap; identity provider is
`LocalDevIdentityProvider` only — no real OIDC/SAML client exists (confirmed by Explore
agent), matching the documented "deployment-phase work" framing.
**Target state:** finish native Fastify migration for the remaining catch-all routes;
formally accept ADR-0012 in full.
**Extraction trigger:** KEEP MODULAR — a single process is correct at this scale; an API
gateway is explicitly not justified by any evidence found.
**Evidence:** `packages/api-service/src/server.ts` (Fastify init + catch-all);
`packages/auth-service/src/identityProviders.ts`.

---

## 6. Prescreen product slice

**Domain / Layer:** Product initiative on the spine / Domain platform.
**Purpose:** Same-organization prescreen encounter/assessment lifecycle, willingness/
orientation/pathway derivation, packet readiness.
**Status:** IMPLEMENTED (backend, local-persistence only). No dedicated frontend surface
found.
**Repository location:** `packages/prescreen-service`, persistence in
`case-repository/prescreenGateway.ts` (1,052 lines).
**Persistence:** 4 tenant-scoped tables + idempotency fingerprint column; RLS
(ENABLE+FORCE) verified with a NOBYPASSRLS role.
**API surface:** 7 HTTP routes (currently via the manual catch-all, see DRIFT-06).
**Tests:** 38 contract + 27 service + 9 API + 10 persistence tests, all inside the
755/755 pass.
**Known gaps:** shares the duplicated `isIdempotencyUniqueViolation` and role-policy-guard
patterns (DRIFT-03, DRIFT-04); cross-organization submission/receipt model remains an
open decision packet, not built.
**Target state:** cross-org model design (owner decision pending); prescreen UI scope
undecided.
**Extraction trigger:** KEEP MODULAR.
**Evidence:** `IMPLEMENTATION_STATUS.md` prescreen section; `docs/architecture/ADR-0013,
0014, 0016`.

---

## 7. Episode / Utilization Review

**Domain / Layer:** Case & clinical spine / Domain platform.
**Purpose:** Episode-owned utilization review, authorization outcomes, documentation
gaps, append-only corrections.
**Status:** IMPLEMENTED (backend). **[CORRECTED 2026-09-18]** The original entry read
"Frontend LOCAL_MOCK_ONLY for the IOP reconciliation surface specifically
(`IopReconciliation.tsx`, 145 LOC + a 25-line test — no `domain/api` import …)". That is no
longer true: `IopReconciliation.tsx` is now 364 lines, imports its API client, and was
migrated to the shared session. The IOP surface is API-backed on current `main`.
**Repository location:** `packages/case-repository/{episodePersistenceGateway,
utilizationReviewGateway,utilizationReviewMappers}.ts`; contracts in
`packages/domain-contracts/src/{analytics,episode,utilizationReview}.ts`.
**Persistence:** migrations `20260718231432_s2_episode_persistence`,
`20260719011500_s2_active_admission_guard`, `20260719123000_od6_episode_persistence_rls`,
`20260908000100_iop_reconciliation_persistence`.
**Provenance:** this domain's contracts were absorbed from the (now-archived)
`clarity-analytics-return-package`/`chatgpt-full-stack-analytics-handoff` spec packages —
see DRIFT-07.
**Known gaps:** `episodePersistenceGateway.ts` reimplements its own `canonicalJson`
recursive key-sort independently of the properly-shared `canonicalStringify`
(DRIFT-03); IOP reconciliation is backend-complete but frontend-disconnected.
**Target state:** wire IOP reconciliation workspace to its already-existing API route.
**Extraction trigger:** KEEP MODULAR.
**Evidence:** `tests/integration/s2-episode-persistence.test.ts`; Explore-agent frontend
audit.

---

## 8. Governed events & transactional outbox

**Domain / Layer:** Cross-cutting / Data + event foundation.
**Purpose:** Atomic write-side event capture for 3 accepted event types
(`ADMISSION_RECORDED`, `AUTHORIZATION_DAY_DECISION_RECORDED`,
`DOCUMENTATION_GAP_RECORDED`).
**Status:** PARTIAL — write path IMPLEMENTED; delivery path is a same-process helper, not
a running system.
**Repository location:** `packages/case-repository/src/outboxDelivery.ts`;
`GovernedEvent`/`OutboxRecord` models in `prisma/schema.prisma:1426-1472`.
**Runtime/deployment boundary:** **none** — `SyntheticOutboxDispatcher.dispatchPending()`
is a plain async method; nothing in `package.json` starts it as a standing process. No
external egress exists anywhere (`fetch`/broker-client grep across
`case-repository/src` returned nothing).
**Persistence:** `OutboxRecord.status` is a bare string (PENDING→DELIVERED only) — no
retry-count column, no dead-letter/poison flag, no lease/claimed-by column. The schema
comment says so explicitly (line 1457-1459: "Persistence only — no dispatcher, worker, or
delivery mechanism exists in S2").
**Retry behavior:** implicit only — a failed consumer throws, the transaction rolls back,
the row stays PENDING forever with no max-attempt cutoff and no dead-letter quarantine.
**Tests:** `tests/integration/outbox-delivery.test.ts`, part of the 755/755 pass —
verifies `FOR UPDATE SKIP LOCKED` concurrent-claim correctness genuinely.
**Known gaps:** calling this an "event foundation" overstates the delivery side; it is
accurately a write-path boundary proof per its own decision doc
(`docs/decisions/OUTBOX_DELIVERY_BOUNDARY_DECISION.md`), not a delivery system.
**Target state:** a real dispatcher process (cron/worker), retry ceiling, dead-letter
handling, and at least one real external consumer — all explicitly out of scope until an
owner decision names a delivery-runtime owner.
**Extraction trigger:** **do not extract yet.** If a real external delivery target
appears, a worker process (not a distributed message broker) is the first justified step
— KEEP MODULAR until then; do not add Kafka/RabbitMQ/Redis Streams without a demonstrated
requirement.
**Evidence:** `packages/case-repository/src/outboxDelivery.ts:39-114`;
`prisma/schema.prisma:1426-1472`.

---

## 9. Operating Assurance (OA)

**Domain / Layer:** Product initiative on the spine / Domain platform.
**Purpose:** Regulatory/compliance requirement evidence tracking — applicability,
authority class, evidence submission, deterministic evaluation, human review.
**Status:** IMPLEMENTED (backend) / DESIGNED-ONLY at the product-definition layer.
**[CORRECTED 2026-09-18]** The original entry ended "NOT_FOUND as a distinct frontend
surface". That is no longer true: `app/src/workspaces/OperatingAssurance.tsx` exists
(325 lines) and is API-backed.
**Repository location:** `packages/domain-contracts/src/assurance.ts`,
`packages/case-repository/src/assuranceGateway.ts` (1,165 lines, multi-file
`prisma/assurance.prisma`), `packages/assurance-service`,
`packages/api-service/src/assuranceRoutes.ts`.
**Runtime/deployment boundary:** in-process, same Fastify server, native route
registration (no catch-all involvement).
**Persistence:** 5 additive migrations (`20260913000100`–`500`), applied to local
`clarity_dev` this session (was previously absent — DRIFT-01).
**API surface:** authenticated Fastify routes, strict schemas, content-free error
mapping.
**Tenant/Authorization behavior:** participant-scoped (`OWNER`/`EVIDENCE_CONTRIBUTOR`/
`QUALIFIED_REVIEWER`) grant model — genuinely different from every other service's
static role-policy table (confirmed by Explore agent; not a duplication candidate).
**Known gaps (DRIFT-08, the most consequential drift found):** OA's own product-definition
discovery lane (`docs/discovery/operating-assurance/project-state.yaml`,
`stage-manifest.yaml`) recorded `lifecycle_status: paused` and explicitly prohibited
`implementation_in_progress` as an entry state, from July 30 source decisions — this
implementation happened anyway. The owner ratified it retroactively this session; see
[ADR-0020](ADR-0020-operating-assurance-retroactive-ratification.md). Separately, its
command schemas (`packages/assurance-service/src/commands.ts`) are plain TypeScript
interfaces, not Zod envelopes — a real deviation from the house command-pattern (every
other command service validates with Zod).
**Target state:** add Zod validation to assurance-service commands; reconcile the
discovery-lane docs (done, ADR-0020); decide a frontend surface if OA becomes a first-class
product, not just a backend capability.
**Extraction trigger:** KEEP MODULAR.
**Evidence:** `docs/discovery/operating-assurance/project-state.yaml:1-4,45-51`;
`docs/implementation/OPERATING_ASSURANCE_TWP_OA_002.md`.

---

## 10. CLPR — Central Intake learning and practice

**Domain / Layer:** Product initiative on the spine / Domain platform.
**Purpose:** Synthetic training/competency simulation — learning pathway → contradiction
practice → deterministic `PracticeObservation` → Notice & Acknowledge → contest/review →
`CompetencyEvidence`.
**Status:** BUILT — INTEGRATION PENDING. This is the single most important status
correction in this ledger: the slice **is merged** into `main` (PR #68), and its code runs
inside this repository's own test suite (not a standalone package's separate test run) —
so it is not "merely a standalone implementation package." But it is also **not
integrated** into the live product beyond that: no Prisma persistence, no tenant context,
no audit writer, no shared case-repository dependency, and its React surfaces
(`app/src/components/learning-practice/`) are wired to a local `domain/learningPractice.ts`
mock, not to `packages/learning-practice-service` over any API.
**Repository location:** `packages/learning-practice-service` (evaluator, gateway,
practiceLab, recognition — pure in-memory `Map`-backed adapter, confirmed zero hits for
audit/idempotency-writer code); `app/src/components/learning-practice/` (3 components,
~127 LOC, each with a matching test).
**Persistence:** none — explicitly synthetic, in-memory only.
**API surface:** none.
**Governance constraints intact:** confirmed — does not touch `Episode`, clinical,
placement, legal, or financial decision authority anywhere in the codebase.
**Tests:** 16/16 behavioral tests (package-level) + component tests, all inside this
session's 755/755 + 132/132 pass — genuinely running in the main repo's suites, not a
disconnected standalone check.
**Known gaps:** review acceptance was recorded `[Unverified]` in
`docs/implementation/CLPR_SYNTHETIC_VERTICAL_SLICE.md` until this session's full-suite
pass; no persistence/API/tenant integration exists at all.
**Target state:** if this becomes a live product feature (not just a training
simulation), it needs a real gateway (Prisma, tenant-scoped, audited) and API routes —
currently none of that exists, despite the package name suggesting service-tier maturity.
**Extraction trigger:** KEEP MODULAR — and do not build persistence/API for it without an
explicit product decision that CLPR should become a live capability.
**Evidence:** `packages/learning-practice-service/src/gateway.ts` (in-memory `Map`, no
Prisma import); `docs/implementation/CLPR_SYNTHETIC_VERTICAL_SLICE.md`;
`docs/planning/clpr/CLPR_INTEGRATION_RESOLUTION.md`.

---

## 11. Reporting / RevOps / Workbook platform

**Domain / Layer:** Product initiative on the spine / Domain platform — the deepest,
most fully-wired vertical slice in the repository.
**Purpose:** Hospital operating-workbook replication — census, patient-days, ADC/ALOS/
occupancy, staffing, payer/service/contract registries, Louisiana Medicaid + FY2026
Medicare rate scenarios, monthly close/reconciliation.
**Status:** IMPLEMENTED (backend + frontend, the only surface where both are genuinely
connected and tested end-to-end).
**Repository location:** `packages/rev-ops-service`, `app/src/workspaces/RevOps.tsx`
(1,478 LOC) + 5 companion files (~2,800 LOC total, 6 dedicated test files) — by far the
deepest frontend surface audited.
**API surface:** `apiRevOps`/`apiRevOpsExport` in `app/src/domain/api.ts` calling real
Fastify routes — confirmed REAL_API_BACKED, not mock.
**Provenance:** built from `reporting-metrics-rebuild-package/` (metric taxonomy, now
archived as absorbed reference — DRIFT-07).
**Tests:** operating-workbook + RevOps integration tests inside the 755/755 root pass;
`RevOps.test.tsx`/`OperatingWorkbook.test.tsx` inside the 132/132 app pass.
**Known gaps:** full financial-method coverage, hospital-profile binding, and posted
financial close remain incomplete (see `docs/product/WORKBOOK_PLATFORM_FULL_TREE.md` for
the detailed remaining-phase breakdown — not restated here).
**Target state:** see the existing RevOps-specific tree doc; this ledger does not
duplicate its phase detail.
**Extraction trigger:** KEEP MODULAR — this is the deepest slice, but nothing about its
current load suggests independent-scaling or ownership separation is needed yet.
**Evidence:** `app/src/domain/api.ts`; `app/src/workspaces/RevOps.tsx`.

---

## 12. Legal status (e-PEC) & legal-hold-forms

**Domain / Layer:** Case & clinical spine / Domain platform + frontend.
**Purpose:** Louisiana OPC→PEC→CEC lifecycle (client-side rule engine); OBH-1/1A/2/19/20
involuntary-commitment form schemas, deadline calculators, fillable-PDF rendering.
**Status:** HYBRID (Legal Status workspace) / BUILT — INTEGRATION PENDING
(`legal-hold-forms` package, confirmed never imported anywhere in `app/src` despite
existing and being tested as a backend package).
**Repository location:** `app/src/workspaces/LegalStatus.tsx` (727 LOC, the largest
single-purpose workspace) + `domain/epecRuleSets.ts`/`epec.ts`; `packages/legal-hold-forms`
(independent, no Prisma, no case-repository dependency).
**API surface:** only the final decision write goes through
`apiRecordDecisionRationale` — a real POST to `/api/cases/:key/decision-rationale`; all
rule evaluation is client-side.
**Known gaps:** `legal-hold-forms` is a complete, tested package with zero frontend
wiring — a pure BUILT/INTEGRATION-PENDING case, structurally identical to CLPR's gap.
**Target state:** decide whether OBH forms should surface in the Legal Status workspace,
and if so wire it.
**Extraction trigger:** KEEP MODULAR.
**Evidence:** Explore-agent frontend audit; `packages/legal-hold-forms/package.json`
description.

---

## 13. Network-enrichment contract kernel

**Domain / Layer:** Data & integration boundary.
**Purpose:** Address/organization normalization contracts for a future network-enrichment
capability.
**Status:** DESIGNED (contracts only, ADR-0019 filed **Proposed**, not accepted).
**Repository location:** `packages/domain-contracts/src/networkEnrichmentResolution.ts`.
**Known gaps:** its own `stableNetworkJson`/`sortNetworkJsonValue` independently
reimplements the same canonical-JSON pattern used elsewhere (DRIFT-03) — duplicated even
within `domain-contracts` itself. The runtime slice (service, persistence/outbox, API,
UI, `agent_bridge` tree) from the held PR #30 was never reviewed and remains
unimplemented — closed as superseded, preserved in the local recovery bundle if wanted.
**Target state:** accept or revise ADR-0019; if accepted, build the runtime slice fresh
rather than reviving PR #30.
**Extraction trigger:** KEEP MODULAR; not yet built, so no extraction question applies.
**Evidence:** `docs/architecture/ADR-0019-network-enrichment-contract-kernel.md`.

---

## Not claimed

This ledger does not claim production readiness, HIPAA compliance, malware protection,
working external integrations, or clinical/legal rule approval for any component above.
Synthetic data only, throughout. "IMPLEMENTED" describes code and test coverage that
exists today in this repository — not that a workspace is reachable from the live
frontend (see §1-4, §7, §12 for the specific frontend-disconnection gaps), not that it has
been piloted, and not that it is authorized for real patient/organization data.
