# Operating Assurance test manifest — VS-OA-001

**Scope:** Applicability-Bounded Reviewed Assurance Slice  
**Lifecycle stage:** TWP-OA-007 Acceptance Handoff  
**Implementation baseline:** `main@2cc25abc85e0148a946e6b15e9d4ab729e0c7818`  
**Acceptance candidate baseline:** use the final `main` commit recorded in Clarity governance after TWP-OA-007 merges. Do not run Product Acceptance against an older SHA.

## Purpose

This manifest inventories implementation-team verification for VS-OA-001. It is evidence for an independent Product Acceptance reviewer. It is **not** the Product Acceptance verdict.

The implementation proves a bounded trust contract:

`approved applicability → current/permitted source → policy/SOP → expected evidence → submitted evidence → deterministic machine assistance → qualified human review → immutable replay/history`

Machine output is assistance only. `SUPPORTED` is not a compliance determination.

## Implemented verification surfaces

| Surface | Primary files | What implementation tests currently prove |
|---|---|---|
| Deterministic evaluator | `tests/unit/assurance-evaluator.test.ts` | Fail-closed precedence for applicability, metadata, rights, currentness, conflict, missing/partial/full evidence; every result requires human review |
| Persistence / tenant isolation | `tests/integration/assurance-gateway.test.ts`, `tests/integration/assurance-tenant-isolation.test.ts` | Tenant-owned OA records, same-org relationships, immutable evidence/evaluation/review history, isolation from guessed/foreign IDs |
| Command/query and reviewer authority | `tests/integration/assurance-command-service.test.ts`, `tests/integration/assurance-review-safety.test.ts` | Contributor permissions, deterministic evaluation orchestration, reviewer dual-grant contract, evidence review side effects, stale review safety |
| Authenticated API | `tests/integration/assurance-api.test.ts` | Verified session, strict envelopes, server-derived tenancy/identity/roles, content-free errors, no caller-supplied reviewer authority |
| One-case workspace | `app/src/workspaces/OperatingAssurance.test.tsx` | Verified-session gating, trust strip, fail-closed states, exact outbound command envelopes, machine/human separation, refresh failure safety |
| Replay integration | `tests/integration/assurance-replay.test.ts` | STALE, SUPERSEDED, and CONFLICT re-evaluation while preserving prior evidence/evaluation/review history |
| Desktop/mobile E2E | `app/smoke/operating-assurance.spec.ts`, `app/playwright.assurance.config.ts` | Authenticated evidence/evaluation/review flow, stale/conflict replay, history preservation, SYSTEM_ADMIN no-bypass on desktop/mobile |
| Protected CI | `.github/workflows/ci.yml` | Prisma validation/generation, all migrations, lint, typecheck, root tests, app tests, app build, OA Playwright replay E2E, dependency audit |

## Acceptance-criteria traceability

| Acceptance criterion | Implementation evidence | Independent acceptance should still verify |
|---|---|---|
| **AC-OA-001 — Complete trace** | OA workspace tests + desktop/mobile E2E show Authority → Applicability → Policy → SOP → Evidence → Machine → Human trace | Reviewer can reconstruct one case without implementation knowledge |
| **AC-OA-002 — Applicability gate** | Evaluator unit tests + command-service fail-closed coverage | No positive machine state when applicability is not approved |
| **AC-OA-003 — Current source** | Evaluator happy path + API/workspace/E2E | Current permitted source + approved applicability + sufficient evidence can produce bounded `SUPPORTED` |
| **AC-OA-004 — Missing evidence** | Evaluator tests + command/API/workspace flows | Missing evidence yields `MISSING_EVIDENCE`/review-required behavior, not positive support |
| **AC-OA-005 — Submission is not acceptance** | Persistence/service/API/workspace tests | Contributor submission remains `SUBMITTED` until qualified review |
| **AC-OA-006 — Rights gate** | Evaluator/command fail-closed tests | Restricted source is excluded from authoritative support and surfaces `RIGHTS_RESTRICTED`/review-required behavior |
| **AC-OA-007 — Stale source** | Replay integration + Playwright stale replay | Previous positive result remains historical; new current result fails closed |
| **AC-OA-008 — Conflict** | Replay integration + Playwright conflict replay | Open unresolved source conflict produces `CONFLICT` and does not erase earlier history |
| **AC-OA-009 — Human authority** | Command/API tests + E2E control user | Final review requires verified human authority; SYSTEM_ADMIN alone cannot bypass |
| **AC-OA-010 — Reviewer separation** | Review-safety/workspace/E2E | Machine evaluation and human review remain separate records and visual states |
| **AC-OA-011 — Historical preservation** | Persistence/replay/E2E | Evidence, evaluation, and review history survives replay and source-state changes |
| **AC-OA-012 — No `Compliant` machine state** | Evaluator result vocabulary + UI tests | No machine or UI result implies universal compliance |
| **AC-OA-013 — No cross-tenant path** | Tenant-isolation + API tests | Foreign IDs and foreign-tenant cases remain non-revealing/unusable |
| **AC-OA-014 — Audit reconstruction** | Gateway/audit/history/workspace/replay tests | Independent reviewer can reconstruct source/evidence/evaluation/review chronology |

## Accepted fixture set

The independent reviewer should exercise the accepted PRP fixtures rather than inventing a new product contract:

1. `FIX-OA-001` — current source + approved applicability + sufficient evidence + human acceptance.
2. `FIX-OA-002` — missing evidence.
3. `FIX-OA-003` — applicability pending.
4. `FIX-OA-004` — rights restricted.
5. `FIX-OA-005` — current source accepted, then stale/superseded replay.
6. `FIX-OA-006` — unresolved source conflict.
7. `FIX-OA-007` — reviewer rejects or requests more evidence despite machine support.
8. `FIX-OA-008` — evidence revision preserves earlier provenance.
9. `FIX-OA-009` — unauthorized reviewer denied.
10. `FIX-OA-010` — source metadata/currentness insufficient, therefore `UNKNOWN`/review-required behavior.

Safety-critical fixtures remain: 002, 003, 004, 005, 006, 007, 009, 010.

## Exact verification commands

Run from the **final Product Acceptance candidate commit**, not an earlier TWP merge SHA.

```bash
npm ci
npx prisma validate
npx prisma generate
npx prisma migrate deploy
npm run lint
npm run typecheck
npm test
npm run test:app
npm --workspace app run build
npm run test:oa-e2e
npm audit --audit-level=high
```

For a local disposable PostgreSQL run, the repository also provides:

```bash
npm run test:ephemeral -- node node_modules/vitest/vitest.mjs run \
  tests/integration/assurance-gateway.test.ts \
  tests/integration/assurance-tenant-isolation.test.ts \
  tests/integration/assurance-command-service.test.ts \
  tests/integration/assurance-review-safety.test.ts \
  tests/integration/assurance-api.test.ts \
  tests/integration/assurance-replay.test.ts

npm run test:oa-e2e:ephemeral
```

The Playwright command may require local Chromium installation if the environment does not already have the browser binary.

## Last protected TWP-OA-006 evidence

Protected CI run #181 on TWP-OA-006 completed successfully with:

- Prisma validation/generation — passed
- 24 migrations — passed
- lint — passed
- typecheck — passed
- root suite — **73 files / 758 tests passed**
- replay integration — **3/3 passed**
- app suite — **21 files / 140 tests passed**
- OA workspace tests — **8/8 passed**
- production app build — passed
- OA Playwright desktop/mobile — **6/6 passed**
- dependency audit — **0 vulnerabilities**

These counts are historical implementation evidence. Product Acceptance must re-run the required checks on its own candidate baseline.

## Post-implementation delta requiring re-verification

After TWP-OA-006 merged at `2cc25abc85e0148a946e6b15e9d4ab729e0c7818`, PR #75 advanced `main` and changed Operating Assurance command envelopes from plain TypeScript interfaces to strict Zod schemas parsed before tenant reads. It also completed a broader native-Fastify routing migration.

This delta is not treated as part of TWP-OA-007 implementation. The acceptance handoff carries it explicitly because Product Acceptance must test the repository that actually exists after the handoff merges.

## Known test limitations

- Synthetic data only; no live PHI/PII.
- No live regulatory source ingestion or regulatory-content completeness test.
- Reviewer qualification is a synthetic first-release authority contract, not a production credentialing matrix.
- E2E uses Chromium desktop/mobile viewports; this is not a full cross-browser certification.
- No load/performance benchmark is established for this slice.
- No production deployment, production RLS rollout, BAA/security operating model, or live integration is validated by this manifest.
- No claim is made about accreditation, survey, legal, clinical, or compliance outcomes.

## Evidence separation

Implementation CI, implementation tests, and this manifest are **implementation evidence**.

The Product Acceptance reviewer must independently choose/run the required acceptance checks, record defects, and issue the later acceptance verdict. Implementation-team evidence must not be relabeled as independent Product Acceptance.
