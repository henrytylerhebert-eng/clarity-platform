# Clarity Operating Assurance — VS-OA-001 implementation record

**Slice:** VS-OA-001 — Applicability-Bounded Reviewed Assurance Slice  
**Lifecycle position:** Controlled Implementation complete through TWP-OA-006; TWP-OA-007 prepares the Product Acceptance handoff.  
**Authorized TWP-OA-007 starting baseline:** `2cc25abc85e0148a946e6b15e9d4ab729e0c7818`  
**Important:** this document describes implemented product state; it does not issue a Product Acceptance verdict.

## 1. Product contract implemented

The slice implements one bounded Operating Assurance trust chain:

`synthetic organization/facility`
→ `pre-approved applicability`
→ `authority/source identity + currentness + rights`
→ `linked policy`
→ `linked SOP`
→ `expected evidence`
→ `evidence submission/revision`
→ `deterministic machine assistance`
→ `qualified human review`
→ `immutable history`
→ `stale/conflict replay`

The core safety contract is unchanged:

- machine `SUPPORTED` does not mean regulatory compliance;
- applicability is human-approved;
- submitted evidence is not accepted evidence;
- final review is attributable to a qualified human under the bounded authority contract;
- stale, restricted, conflicting, missing, or insufficient support fails closed;
- historical evidence/evaluation/review records are preserved;
- no cross-client evidence retrieval is permitted;
- no live PHI/PII is required.

## 2. Work-package history

| Package | Purpose | PR | Accepted main commit |
|---|---|---:|---|
| **TWP-OA-001** | Trust contracts + deterministic evaluator | #67 | `9eeeda3e63b1511e5e15a7d20ce086c4796da7c8` |
| **TWP-OA-002** | Persistence, tenant scope, immutable trust history, audit | #69 | `f6ff9eb79f1d37d962dc861bc52247a24915f2a1` |
| **TWP-OA-003** | Commands, queries, scoped reviewer authority | #70 | `406c6d60b218b89d701026f616a30edcb3ce92f2` |
| **TWP-OA-004** | Authenticated Fastify API | #71 | `15a094ddc352030ee392f1d4f9b31c8ae49a2973` |
| **TWP-OA-005** | One-case Operating Assurance workspace | #72 | `92bdbe6f81d6b0229f64706d00332141be28cbef` |
| **TWP-OA-006** | Deterministic synthetic fixture, replay integration, desktop/mobile E2E | #74 | `2cc25abc85e0148a946e6b15e9d4ab729e0c7818` |

## 3. Implemented architecture

### Domain contracts and evaluator

`packages/domain-contracts/src/assurance.ts` defines the bounded result vocabulary and trust-state types.

`packages/assurance-service/src/evaluator.ts` implements deterministic precedence. Identical input yields identical output. No LLM/model runtime is required for this slice.

The evaluator can produce:

- `SUPPORTED`
- `PARTIALLY_SUPPORTED`
- `MISSING_EVIDENCE`
- `CONFLICT`
- `STALE_SOURCE`
- `APPLICABILITY_PENDING`
- `RIGHTS_RESTRICTED`
- `REVIEW_REQUIRED`
- `UNKNOWN`

Every result requires human review.

### Persistence

Operating Assurance has its own bounded persistence context rather than overloading behavioral-health case evidence.

Implemented OA persistence includes:

- AssuranceCase
- AssuranceParticipantAssignment
- AssuranceApplicabilityDecision
- AssuranceSourceReference
- AssuranceDocumentReference
- AssuranceEvidenceExpectation
- AssuranceEvidenceSubmission
- AssuranceSourceConflict
- AssuranceEvaluation
- AssuranceReviewDecision

All OA tenant-owned records carry direct organization ownership and are accessed with organization predicates. Existing `AuditEvent` is reused for attributable mutation history.

Evidence revisions append/supersede rather than overwrite history. Evaluations and human review decisions are append-only records.

### Human authority

The first-release final-review contract requires all of the following:

1. same-organization authenticated principal;
2. global `COMPLIANCE_REVIEWER` role;
3. active case-scoped `QUALIFIED_REVIEWER` assignment;
4. non-empty `authorityBasis` on that assignment.

`SYSTEM_ADMIN` alone cannot bypass this rule.

This is the synthetic first-release authority contract. It is not the full production reviewer qualification matrix.

### API

The authenticated OA routes are:

```text
GET  /api/assurance/cases/:caseKey
POST /api/assurance/cases/:caseKey/evidence
POST /api/assurance/cases/:caseKey/evidence/revisions
POST /api/assurance/cases/:caseKey/evaluate
POST /api/assurance/evaluations/:evaluationId/review
GET  /api/assurance/cases/:caseKey/history
```

The API derives organization, identity, roles, and reviewer authority from the verified principal/persistence state. Callers cannot submit `organizationId`, global roles, actor identity, authority grants, or server timestamps in command envelopes.

No production source-currentness/conflict mutation endpoint exists.

### React workspace

The one-case workspace exposes the trust chain:

**Authority → Applicability → Policy → SOP → Evidence → Machine Assistance → Human Review**

The existing demo role selector is presentation/navigation only. It does not grant Operating Assurance authority.

Fail-closed states are visible and intentionally distinct from positive support. Machine assistance and human review are displayed as separate states.

### Deterministic synthetic replay harness

TWP-OA-006 added a synthetic dev/test fixture guarded to local `clarity_dev` use.

The harness can deterministically:

- reset the synthetic OA fixture;
- mark the primary source STALE;
- mark the primary source SUPERSEDED;
- create an unresolved source CONFLICT.

Replay mutation is not exposed through the production HTTP API.

The replay suite proves historical evidence/evaluation/review records remain inspectable after current source state changes.

## 4. Principal code/test locations

### Contracts / service
- `packages/domain-contracts/src/assurance.ts`
- `packages/assurance-service/src/evaluator.ts`
- `packages/assurance-service/src/assuranceCommandService.ts`
- `packages/assurance-service/src/assuranceQueryService.ts`
- `packages/assurance-service/src/permissions.ts`

### Persistence
- `prisma/assurance.prisma`
- `packages/case-repository/src/assuranceGateway.ts`
- `packages/case-repository/src/assuranceMappers.ts`

### API
- `packages/api-service/src/assuranceRoutes.ts`
- `packages/api-service/src/server.ts`
- synthetic dev/test support: `packages/api-service/src/assuranceDevFixture.ts`

### UI
- `app/src/workspaces/OperatingAssurance.tsx`
- `app/src/domain/assuranceApi.ts`

### Tests
- `tests/unit/assurance-evaluator.test.ts`
- `tests/integration/assurance-gateway.test.ts`
- `tests/integration/assurance-tenant-isolation.test.ts`
- `tests/integration/assurance-command-service.test.ts`
- `tests/integration/assurance-review-safety.test.ts`
- `tests/integration/assurance-api.test.ts`
- `tests/integration/assurance-replay.test.ts`
- `app/src/workspaces/OperatingAssurance.test.tsx`
- `app/smoke/operating-assurance.spec.ts`
- `app/playwright.assurance.config.ts`

## 5. Last TWP-OA-006 protected verification

CI run #181 on the final TWP-OA-006 head passed:

- all 24 migrations;
- lint;
- typecheck;
- root suite: **73 files / 758 tests**;
- OA replay integration: **3/3**;
- app suite: **21 files / 140 tests**;
- OA workspace tests: **8/8**;
- production app build;
- OA Playwright desktop/mobile: **6/6**;
- dependency audit: **0 vulnerabilities**.

These results establish implementation-team verification only.

## 6. E2E-discovered hardening

The real Node/tsx API process exposed a module-runtime barrel issue in `@clarity/assurance-service` that unit/integration transforms had not surfaced. TWP-OA-006 made runtime classes explicit exports from the existing package barrel. No evaluator, permission, query, command, or API semantics changed.

This is a useful reason the browser/process-level gate remains part of protected CI.

## 7. Post-TWP-OA-006 repository delta

After TWP-OA-006 merged, PR #75 advanced `main` beyond `2cc25abc…`.

PR #75:

- completed a broader native-Fastify routing migration for pre-existing API/prescreen routes;
- converted Operating Assurance command envelopes to strict Zod schemas;
- parses each OA command before tenant reads;
- added rejection-path tests for unknown/missing/invalid command fields.

This delta strengthens input validation but is outside TWP-OA-006/TWP-OA-007 implementation ownership. The Product Acceptance candidate must include and independently re-verify the actual merged repository state after TWP-OA-007, not rely solely on the historical run #181.

## 8. Explicit non-scope / known limitations

VS-OA-001 does not implement or validate:

- live regulatory ingestion or regulatory-content completeness;
- automated applicability determination;
- unrestricted regulatory Q&A;
- production PHI/PII or client-corpus ingestion;
- licensed standards reproduction;
- cross-client benchmarking/retrieval;
- Visit Assurance/photo capture;
- CAPA/POC runtime;
- training/competency;
- multi-client consultant portfolio;
- production deployment;
- production-wide RLS completion;
- BAA/security operating model;
- EHR/HRIS/LMS/CMMS integrations;
- commercial buyer/pricing/product-market fit;
- survey, accreditation, legal, clinical, or compliance outcome guarantees.

## 9. Product Acceptance boundary

Controlled Implementation can establish that the code exists and passes implementation tests.

It cannot self-declare Product Acceptance.

The independent Product Acceptance reviewer must use the accepted PRP criteria, inspect this implementation record and `docs/testing/OPERATING_ASSURANCE_TEST_MANIFEST.md`, run/select independent checks against the final handoff baseline, record defects, and issue the separate lifecycle verdict.