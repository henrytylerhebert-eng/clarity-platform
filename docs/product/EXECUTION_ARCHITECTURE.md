# Clarity — Execution Architecture

> **PRESERVED 2026-09-18 (Housekeeping Phase 2B).** Extracted from the unmerged PR #93 branch
> so this material stops living only on a stale ref. It is a **2026-07-29 snapshot** and is
> **Proposed**, never an owner decision — the document's own evidence labels still govern.
> Treat every capability, package, PR and branch reference in it as historical to that date:
> `main` has changed substantially since (14 packages, authentication implemented per ADR-0011,
> prescreen relocated to `packages/prescreen-service`), and PRs #29, #30 and #32 referenced in
> this era are all closed. Current state lives in `IMPLEMENTATION_STATUS.md` and the
> accepted ADRs under `docs/architecture/`.

**Prepared:** 2026-07-29
**Inputs:** [REPOSITORY_PRODUCT_INTELLIGENCE_BRIEF.md](REPOSITORY_PRODUCT_INTELLIGENCE_BRIEF.md) · [PRODUCT_BUILD_PLAN_AND_REQUIREMENTS.md](PRODUCT_BUILD_PLAN_AND_REQUIREMENTS.md)
**Status:** Proposed. No owner decision is recorded here.
**Labels:** `[V]` Verified · `[D]` Documented · `[I]` Inferred · `[P]` Proposed · `[U]` Unknown

### ID scheme and one stated deviation

`MS-` milestone · `EP-` epic · `VS-` vertical slice · `WP-` work package · `CTR-` contract · `TST-` test · `TG-` test gap · `RSK-` execution risk · `DEC-` decision.

**Deviation:** requirement IDs remain the `FR-`/`NFR-` IDs established in the PRD, and decision IDs remain `D1`–`D13`. Renumbering them to `REQ-01`/`DEC-01` would break traceability to an artifact already produced. Where this document says `DEC-nn`, read it as `Dn` from the PRD; a mapping table is in §7.

---

## 1. Execution Context Summary

| Field | Value |
|---|---|
| **Product** | Clarity — tenant-scoped case coordination and audit system for behavioral-health crisis placement `[V]` |
| **Primary user** | Central-intake coordinator (`INTAKE_COORDINATOR`) at one receiving facility — **conditional on D1, which is open** `[D, contested]` |
| **Workflow** | Referral → patient token → case → assign → prioritize → transition → rationale → close → find → read history → (admin) reopen |
| **Minimum complete outcome** | A case that is findable tomorrow, owned, prioritized, explainable, and closable — with its full history readable from the screen |
| **In scope** | 12 new HTTP routes, 2 new gateway reads, 1 new command, 2 screens, 0 migrations expected, 0 integrations |
| **Out of scope** | Documents · evidence · benefits · authorization · legal instruments · packet · routing · bedboard · prescreen persistence · episode/UR · cross-org · network enrichment · notifications · dashboards · AI · real data · production hosting |
| **Desired outcome** | The first user-reachable workflow in the project's history, and therefore the first opportunity to validate any product hypothesis |
| **Data posture** | Synthetic only, single tenant, local or single-host `[V: enforced by `assertLocalClarityDevDatabase`]` |

---

## 2. Previous Output Assessment

### Ready to execute against
| Item | Evidence |
|---|---|
| Case command service — 9 commands, role-policed, atomic, concurrency-safe | `[V]` 15 + 8 + 6 tests passing this session |
| Authentication — sessions, DB-sourced roles, `actorFor` bridge | `[V]` 8 tests |
| API route + error-mapping pattern | `[V]` `prescreen-api.test.ts` 9 tests — a proven template |
| Case reads `listForOrganization` / `findByKey` | `[V]` covered *including cross-tenant negatives* in `tenant-isolation.test.ts` |
| Tenancy and audit-identifier invariants | `[V]` `tests/security/*` 9 tests |
| CI on an ephemeral Postgres | `[V]` `.github/workflows/ci.yml` |

### Incomplete
| Item | Status |
|---|---|
| Read authorization | No policy exists — gateway reads bypass the service layer entirely `[V]` |
| `PatientToken` creation | **No governed path at any layer** (F1) `[V]` |
| Audit history read | **No read path at any layer** (F3, new this session) `[V]` |
| UI | `localStorage` prototype, no router, zero shared contracts `[V]` |
| Observability | No request logging `[V]` |

### Contradictory or blocked
| Item | State |
|---|---|
| D1 primary user | Three documents, three answers `[V]` — **blocks epics EP-04 onward** |
| D2 Thesis A/B | PR #30, 2,484 files, different buyer `[V]` — **blocks scope stability** |
| D3 workbook data status | 25/44 sheets self-flagged PHI-risk, tracked and pushed `[V]` — blocks anything external |
| D4 HIPAA claim | Present on an open PR, violates repo rules `[V]` |
| Verification integrity | `migration-integrity` fails; typecheck non-hermetic in a worktree `[V]` |
| ADR numbering | Two ADR-0014s on different branches `[V]` |

### Correction to my earlier statement
In the brief and the build plan I wrote that the tenant-scoped gateway read methods "already exist and are tested." **That is true only for the two case reads.** Direct investigation this session shows five of the nine gateway read methods have **zero test references and zero service-layer callers** (§14, TG-01), and the audit history has no read path at all (F3). The consequence is favorable for the plan — the reads VS-03 exposes are exactly the tested ones — but "reuse tested reads" was too broad, and the audit read is new work, not plumbing.

---

## 3. Execution Readiness Verdict

**Verdict: execution may proceed on MS-01 and EP-03 (VS-03/VS-04) now. Execution of EP-04 onward is blocked pending D1, D2, D6, D7, D8.**

| Assumption this verdict rests on | Label |
|---|---|
| Decisions D1–D4 close within one working week; otherwise MS-01 stalls and only EP-03 proceeds | `[P]` |
| The case read surface (EP-03) is valid under either product thesis, so it is not wasted work if D1/D2 resolve unexpectedly | `[I]` — the read pattern and policy transfer; the specific entity may not |
| No schema migration is required for the MCPO | `[I]` — every needed column exists `[V]`; **WP-02 verifies this before any code is written** |
| `prescreen-api.test.ts` is an adequate test template for new routes | `[V]` — it covers all eight assertion classes the new routes need |
| The owner is the sole product-acceptance authority | `[V]` — solo-maintainer policy is live |

**Not assumed, and explicitly not claimed:** production readiness, HIPAA compliance, security review, clinical or legal validation, measured outcomes, or DB-level audit immutability.

---

## 4. Architecture and Repository Baseline

```
app/ ─ React 19 + Vite, localStorage, 17 workspaces, NO router          [V]
  │  2 threads only: auth login/session, 1 command (decision-rationale)
  ▼
packages/api-service/src/server.ts ─ node:http, 375 lines, 10 routes    [V]
  │  regex routing; principal-derived tenant/actor; strict bodies
  ▼
case-service (9 cmds) · auth-service · evidence · document · benefits ·
authorization · prescreen (in-memory) · legal-hold-forms               [V]
  │  each: strict envelope → assertPermitted → gateway
  ▼
packages/case-repository ─ ONLY @prisma/client importer, 14 gateways    [V]
  │  caseCommandGateway (atomic) · auditWriter (CREATE ONLY — F3)
  ▼
PostgreSQL clarity_dev ─ 38 models · 45 enums · 12 migrations · RLS on 9 tables
```

### Relevant implementation areas for this execution

| Area | Path `[V]` | Baseline state |
|---|---|---|
| HTTP surface | `packages/api-service/src/server.ts` | 10 routes; prescreen block (lines 288–363) is the pattern to copy |
| Dev runner / seeding | `packages/api-service/src/devMain.ts` | Seeds org + 3 users incl. `INTAKE_COORDINATOR` + 1 patient token via raw Prisma |
| Case commands | `packages/case-service/src/{commands,permissions,caseCommandService}.ts` | 9 commands, complete, do not modify to add HTTP |
| Case reads | `packages/case-repository/src/prismaCaseRepository.ts:100,107` | `findByKey`, `listForOrganization` — tenant-scoped, tested |
| Audit write | `packages/case-repository/src/auditWriter.ts:40` | `tx.auditEvent.create` only — **no read** |
| Test harness | `tests/integration/helpers/harness.ts` | Per-run UUID tenants, deterministic cleanup, `assertLocalClarityDevDatabase` |
| Route test template | `tests/integration/prescreen-api.test.ts` | 9 tests covering all eight assertion classes |
| E2E harness | `app/smoke/clarity-v01.spec.ts` + `app/playwright.config.ts` | Playwright configured and used |
| CI | `.github/workflows/ci.yml` | Ephemeral Postgres 16 — the trustworthy signal |

---

## 5. Execution Principles

| # | Principle | Basis |
|---|---|---|
| EP-P1 | **Do not modify a working command to add a transport.** Routes adapt to commands, never the reverse. | `[V]` prescreen slice proved 1:1 mapping without touching command behavior |
| EP-P2 | **Every exposed read carries an explicit policy.** No route may call a gateway read directly. | `[V]` F2 — reads currently bypass the service layer |
| EP-P3 | **Server-derived envelope fields are never caller-suppliable.** `organizationId`, `actor`, `occurredAt` come from the principal; supplying any is a 400. | `[V]` ADR-0014 §3 |
| EP-P4 | **Failures are uniform and content-free.** Cross-tenant and absent stay indistinguishable. | `[V]` tested invariant |
| EP-P5 | **Characterize before you expose.** Any behavior a route makes reachable must have a direct test first. | `[V]` TG-01: five reads are untested and uncalled |
| EP-P6 | **One append-only audit event per mutation, in the same transaction.** | `[V]` GOVERNANCE #2 |
| EP-P7 | **Structural refusal over validation** where a field must never be stored. | `[V]` ADR-0009 precedent (`*Encrypted` columns stay NULL) |
| EP-P8 | **No aggregate scores.** Named gaps only. | `[V]` ADR-0010, tested |
| EP-P9 | **Migrations are smallest-possible and ADR-justified.** | `[V]` CLAUDE.md |
| EP-P10 | **Every session runs on an ephemeral database.** | `[V]` issue #31, empirically |
| EP-P11 | **Honesty statement on every completion claim**, listing what is not claimed. | `[V]` CLAUDE.md rule 4 |
| EP-P12 | **Agents may recommend scope changes; they may not enact them.** Contradictions are reported, not resolved. | `[D]` `agents/bridge/BUILD_TO_GOAL.md` authority order |

---

## 6. Milestone Architecture

| ID | Milestone | Entry gate | Exit gate (observable) | DoD level |
|---|---|---|---|---|
| **MS-01** | Decisions closed & baseline protected | This document reviewed | D1–D4 recorded in writing · PRs #29/#30/#32 each merged/parked/closed · ADR numbers unique · typecheck hermetic · **full suite incl. `migration-integrity` green on an ephemeral DB** · TG-01…TG-04 characterization tests passing | Milestone DoD §15.4 |
| **MS-02** | Case spine readable | MS-01 exit; D7 closed | An authenticated coordinator retrieves list, detail, and **full audit history** for their org only; a second org's data provably unreachable; every read policed and logged | Milestone DoD |
| **MS-03** | Case spine writable | MS-02 exit; D1, D6, D8 closed | The §5.13 primary success case passes end-to-end **over HTTP with no UI**; DOB/sex/external-ref refusals tested | Milestone DoD |
| **MS-04** | Spine reachable — **activation gate** | MS-03 exit; D-B40 harvest/rebuild decided | A named human signs in, creates, assigns, prioritizes, justifies, closes, reloads, finds the case, reads its history — **no terminal, script, or DB client involved**. Suite green in CI | Milestone DoD + Demo release DoD §15.5 |
| **MS-05** | Reliable under failure | MS-04 exit | Every exception path in PRD §5.5 has a passing test and a designed state; zero user-visible data loss under forced conflict | Milestone DoD |
| **MS-06** | Pilot-ready | MS-05 exit; D10, D12 closed | Restore rehearsed · monitoring live · runbook executed by a second person · stop conditions written · synthetic-only enforced at the entry path | Pilot release DoD §15.5 |
| **MS-07** | Production-ready | **Out of reach** | Gated on counsel (OD-2), clinical licensing (OD-3), independent security review, BAA hosting, DB-level append-only, encryption capability — **external parties, not code** `[V]` | Production DoD §15.5 |

---

## 7. Epic Architecture

| ID | Epic | Milestone | Requirements | Decisions | Slices |
|---|---|---|---|---|---|
| **EP-01** | Decision closure & governance hygiene | MS-01 | NFR-12 | D1, D2, D3, D4, D5 | VS-01 |
| **EP-02** | Verification integrity & behavior protection | MS-01 | NFR-11 | — | VS-02 |
| **EP-03** | Case read surface | MS-02 | FR-05, FR-06, FR-07, FR-30, NFR-01, NFR-07 | D7 | VS-03, VS-04 |
| **EP-04** | Case write surface | MS-03 | FR-01…FR-04, FR-08…FR-14, FR-40, FR-41, NFR-03, NFR-05 | D1, D6, D8 | VS-05, VS-06, VS-07 |
| **EP-05** | Pilot UI | MS-04 | FR-20…FR-23, FR-32, NFR-09, NFR-10, all UX | D5, D13 | VS-08 |
| **EP-06** | Failure behavior | MS-05 | FR-31, FR-33, NFR-05 | — | VS-09 |
| **EP-07** | Pilot operations | MS-06 | FR-50, NFR-06, NFR-08 | D10, D11, D12 | VS-10 |

### Decision ID mapping
`DEC-01`≡D1 primary user · `DEC-02`≡D2 thesis · `DEC-03`≡D3 workbook · `DEC-04`≡D4 HIPAA claim · `DEC-05`≡D5 naming · `DEC-06`≡D6 caseKey · `DEC-07`≡D7 read authorization · `DEC-08`≡D8 token data boundary · `DEC-09`≡D9 Fastify timing · `DEC-10`≡D10 pilot data class · `DEC-11`≡D11 hosting · `DEC-12`≡D12 support model · `DEC-13`≡D13 activation metric.

---

## 8. Vertical Slice Plan

| ID | Slice | Outcome demonstrable independently as | Epic | Requirements | Depends on |
|---|---|---|---|---|---|
| **VS-01** | Decisions recorded | Reading four written decisions and three PR dispositions. **No user value — flagged as governance, not product** | EP-01 | NFR-12 | — |
| **VS-02** | Protected baseline | Suite green on an ephemeral DB, hermetic typecheck, and new characterization tests passing over previously untested behavior | EP-02 | NFR-11 | — |
| **VS-03** | "I can see my organization's cases" | `curl` with a coordinator token returns that org's case list and one case's detail; a second org's token returns an indistinguishable 404 | EP-03 | FR-05, FR-06, FR-30, NFR-01 | VS-02, D7 |
| **VS-04** | "I can read a case's history" | `curl` returns the ordered audit trail with actor, action, timestamp, state-change evidence, and no restricted identifiers | EP-03 | FR-07, FR-41 | VS-03 (**new gateway read — F3**) |
| **VS-05** | "I can create a case" | `curl` creates a patient token, then a case; a body containing `dateOfBirth` is a 400; cross-tenant token is a non-revealing 404 | EP-04 | FR-01…FR-04 | VS-03, D1, D6, D8 |
| **VS-06** | "I can own and move a case" | `curl` assigns, sets urgency, sets location, transitions status, updates one workstream — each with conflict and permission cases | EP-04 | FR-08…FR-11 | VS-05 |
| **VS-07** | "I can justify and finish a case" | `curl` records a rationale, closes; post-close mutation refused; `SYSTEM_ADMIN` reopen 403; `ORGANIZATION_ADMIN` reopen succeeds with reason | EP-04 | FR-12…FR-14 | VS-06 |
| **VS-08** | "I can do my job in a browser" | A human completes the whole workflow at a URL, reloads, finds the case, reads its history | EP-05 | FR-20…FR-23, FR-32, UX | VS-07, harvest/rebuild decision |
| **VS-09** | "It behaves when things go wrong" | Forced conflict, mid-form expiry, double-submit, API-down — each demonstrated with input preserved | EP-06 | FR-31, FR-33 | VS-08 |
| **VS-10** | "It can be run for a week" | Restore rehearsed, monitoring showing an induced error, runbook executed by a second person | EP-07 | FR-50, NFR-06…08 | VS-09 |

---

## 9. Technical Work Packages

Effort is relative only (XS/S/M/L/XL). Every WP has one primary owner (§16).

### EP-01 — Decision closure

| ID | Work package | Deliverable | Owner | Effort | Depends |
|---|---|---|---|---|---|
| **WP-01** | Record D1 (primary user) and reconcile contradicting docs | Written decision; `docs/09-personas-and-role-ux.md` and `README.md` updated or marked superseded | Product owner | S | — |
| **WP-02** | Rule on PRs #29/#30/#32 (D2) | Each explicitly merged, parked, or closed, with the reason recorded | Product owner | S | — |
| **WP-03** | Resolve workbook data status (D3) | Qualified review recorded; file removed from history **or** retained with written rationale | Product owner + privacy reviewer | M | — |
| **WP-04** | Strike the HIPAA claim (D4) | Phrase replaced with the repo's standard honest formulation | Product owner | XS | — |
| **WP-05** | Deduplicate ADR numbering; refresh status of record | Unique ADR numbers across live branches; `IMPLEMENTATION_STATUS.md` current and recording F1/F2/F3 | Docs owner | S | WP-01, WP-02, WP-03 |
| **WP-06** | Correct `ARCHITECTURE.md`; remove dead artifacts | 38 models stated; the four existing capabilities stated; empty visualizer dir gone; bridge dirs consolidated; duplicated doc snapshot replaced by references | Docs owner | S | — |

### EP-02 — Verification integrity & behavior protection

| ID | Work package | Deliverable | Owner | Effort | Depends |
|---|---|---|---|---|---|
| **WP-10** | Make typecheck hermetic | `tsconfig.json` gains `baseUrl: "."` and the missing `@clarity/prescreen-service` path; `npm run typecheck` resolves only worktree files and passes | Infra owner | XS | — |
| **WP-11** | Per-session ephemeral database | Session/branch DB provisioning mirroring `.github/workflows/ci.yml`; `migration-integrity` passes locally | Infra owner | S | — |
| **WP-12** | Characterization tests for the reads VS-03/VS-04 will expose (TG-02) | Direct tests for `listForOrganization` shape/order and `findByKey` miss semantics, pinning current behavior before a route depends on it | Test owner | S | WP-11 |
| **WP-13** | Decide and record the disposition of five uncalled gateway reads (TG-01) | Either characterization tests, or deletion as speculative surface, recorded either way | Backend owner + product owner | S | WP-11 |
| **WP-14** | Confirm no migration is required for the MCPO | Written confirmation that every field the MCPO needs exists; if not, the smallest ADR-justified migration | Domain owner | XS | — |

### EP-03 — Case read surface

| ID | Work package | Deliverable | Owner | Effort | Depends |
|---|---|---|---|---|---|
| **WP-20** | ADR: read authorization and read auditing (D7) | ADR stating which roles may list/read, whether detail reads are audited, and why list reads are not | Tech lead + product owner | S | WP-01 |
| **WP-21** | `CASE_READ_POLICY` + read service | A read service in `packages/case-service/` wrapping the two case reads under an explicit policy; no route touches a gateway directly (EP-P2) | Backend owner | M | WP-20, WP-12 |
| **WP-22** | **Audit history gateway read (F3)** | A tenant-scoped audit read in `packages/case-repository/` — `auditWriter.ts` is create-only today, and tests read audit via raw Prisma | Backend owner | M | WP-20 |
| **WP-23** | Read DTOs (CTR-01/02/03) | Response shapes that expose no internal ids beyond what the UI needs and no restricted identifiers | Contracts owner | S | WP-21, WP-22 |
| **WP-24** | Three GET routes | `GET /api/cases`, `GET /api/cases/{caseKey}`, `GET /api/cases/{caseKey}/audit` following the prescreen block pattern | API owner | M | WP-23 |
| **WP-25** | Read route tests (TST-01…TST-03) | Per route: happy · cross-tenant 404 · permission 403 · uniform 401 — copied from the `prescreen-api.test.ts` pattern | Test owner | M | WP-24 |
| **WP-26** | Request logging middleware (CTR-08) | Correlation id, principal id, org id, route, outcome — **never bodies** | Observability owner | S | WP-24 |

### EP-04 — Case write surface

| ID | Work package | Deliverable | Owner | Effort | Depends |
|---|---|---|---|---|---|
| **WP-30** | ADR: patient-token creation and the v1 data boundary (D8) | ADR naming accepted fields (age, language, guardian status, `privacyFlags`) and the structural refusals (DOB, sex, external reference) | Tech lead + product owner | S | WP-01 |
| **WP-31** | **`PatientToken` creation command (F1)** | Envelope (CTR-04) + role policy + gateway method + atomic audit event. Closes the spine's missing entry point | Backend owner | M | WP-30, WP-14 |
| **WP-32** | Server-generated case id (D6) | `POST /api/cases` generates the identifier; no human invents a globally unique key | API owner + backend owner | S | WP-31 |
| **WP-33** | Case write HTTP bodies (CTR-05) | Strict bodies mirroring each envelope minus every server-derived field | Contracts owner | S | WP-32 |
| **WP-34** | Nine write routes | token · create · assign · urgency · location · transition · workstream · close · reopen | API owner | L | WP-33 |
| **WP-35** | Error map extension (CTR-06) | Case-domain errors → stable content-free 400/401/403/404/409 | API owner | S | WP-34 |
| **WP-36** | Idempotency convention (CTR-07) | Where the key travels; UI generates one per user intent; replay vs nested-body conflict | Contracts owner | S | WP-34 |
| **WP-37** | Write route tests (TST-04…TST-12) | Per route family: happy · permission both directions · `SYSTEM_ADMIN` zero · cross-tenant 404 · version conflict 409 · idempotency replay + conflict · data-boundary refusal | Test owner | L | WP-34 |

### EP-05 — Pilot UI

| ID | Work package | Deliverable | Owner | Effort | Depends |
|---|---|---|---|---|---|
| **WP-40** | Harvest-vs-rebuild spike and decision | Back one screen with real API data; time it; record the decision. Types come from the API — `app/src/domain` is not imported (NFR-10) | Frontend owner + product owner | M | WP-24 |
| **WP-41** | Router and addressable screens | Case list and case detail have real URLs; a colleague can be sent a link | Frontend owner | M | WP-40 |
| **WP-42** | Honest identity surface (FR-23) | Verified principal, org, roles, expiry; demo role selector removed or fenced behind an explicit demo flag | Frontend owner | S | WP-41 |
| **WP-43** | Case list screen | Urgency → owner → status → age → last activity; prominent "New case" | Frontend owner | M | WP-41 |
| **WP-44** | Case detail + audit timeline above the fold | The 8 workstream lanes read-mostly; the history is primary content, not a footer | Frontend owner | L | WP-41, WP-24 |
| **WP-45** | The five decision actions in the UI | Assign · urgency · transition · rationale · close (+ admin reopen) | Frontend owner | L | WP-44, WP-34 |
| **WP-46** | Three distinct states (FR-32) | No-data · failed-to-load · not-permitted, visually and textually distinct | Frontend owner | S | WP-43 |
| **WP-47** | Keyboard pass (NFR-09) | Happy path operable keyboard-only; labelled controls; status not colour-only | Frontend owner | S | WP-45 |
| **WP-48** | Activation event (D13) | "User completed a case end-to-end via UI" recorded — the `exportAnalyticsEvents()` seam exists with no callers | Frontend owner + observability owner | S | WP-45 |
| **WP-49** | E2E happy-path test (TST-13) | Playwright, live API + DB: sign in → create → assign → urgency → rationale → close → reload → find → read history | Test owner | M | WP-45 |
| **WP-50** | One-page pilot user guide | A new user completes the workflow from it alone | Docs owner | XS | WP-45 |

### EP-06 / EP-07

| ID | Work package | Deliverable | Owner | Effort | Depends |
|---|---|---|---|---|---|
| **WP-60** | Conflict UX + forced-conflict test (TST-14) | Current value shown, retry offered, never a silent overwrite | Frontend + test owner | M | WP-45 |
| **WP-61** | Session-expiry input preservation (TST-15) | Re-auth returns the user with typed input intact | Frontend owner | S | WP-45 |
| **WP-62** | Illegal-transition messaging | Names the blocking rule, not just refusal | Frontend owner | S | WP-45 |
| **WP-63** | API-unreachable state | Reuse the existing actionable message pattern | Frontend owner | XS | WP-45 |
| **WP-70** | Restore rehearsal (NFR-06) | `migration:recovery:local` replay + restore green; result recorded | Infra owner | S | MS-05 |
| **WP-71** | Error monitoring live | An induced error appears in monitoring | Infra owner | S | MS-05 |
| **WP-72** | Provisioning runbook (FR-50) | Executed by someone other than its author | Docs + infra owner | S | MS-05 |
| **WP-73** | Latency pass (NFR-08) | List and detail <500 ms at ≤500 cases | Infra owner | XS | MS-05 |
| **WP-74** | Pilot support model and stop conditions (D12) | Written and agreed before day 1 | Product owner | XS | MS-05 |
| **WP-75** | Data-classification check at the API entry path (D10) | An obvious real-data pattern is refused and logged | Backend owner | M | MS-05 |

---

## 10. Dependency Graph and Critical Path

```
WP-01 (D1) ──┬─► WP-20 (read ADR) ──► WP-21 ──┬─► WP-23 ──► WP-24 ──► WP-25
             │                    WP-22 ──────┘              │
             ├─► WP-30 (token ADR) ──► WP-31 ──► WP-32 ──► WP-33 ──► WP-34 ──► WP-37
             │                                                        │
             └─► WP-40 (harvest decision) ──► WP-41 ──► WP-43/44 ──► WP-45 ──► WP-49
WP-02 (PRs) ──► WP-05
WP-03 (workbook) ──► [gates all external activity, no code dependency]
WP-10, WP-11 ──► WP-12 ──► WP-21          WP-14 ──► WP-31
WP-45 ──► WP-60/61/62/63 ──► WP-70…WP-75
```

**Critical path (longest dependent chain):**
`WP-01 → WP-30 → WP-31 → WP-32 → WP-33 → WP-34 → WP-37 → WP-45 → WP-49 → MS-04`

**Implications.**
- **WP-01 (name the primary user) is on the critical path and costs almost nothing.** It is the single highest-leverage item in the plan.
- **WP-31 (the `PatientToken` command) is the first irreducible engineering item** on the critical path — F1 means nothing downstream can be created without it.
- **WP-03 (workbook) is off the code critical path but gates every external activity**, including the user interviews that retire the top-ranked product risk. It runs in parallel and must not be sequenced behind engineering.
- **EP-03 (reads) is *not* on the critical path to MS-04** but is a prerequisite for the UI and is thesis-invariant — which is why it starts during MS-01.

**Parallelization constraint:** WP-33 (write bodies) and WP-23 (read DTOs) both touch contract surfaces, and WP-24 and WP-34 both touch `server.ts`. Those are the two shared-file collision points (§17).

---

## 11. Repository Change Map

Only verified paths are named. Where a file does not exist, the **responsibility and proposed location** are stated.

### Modify — verified paths
| Path | Current purpose | Change | WP | Requirement | Risk | Test impact |
|---|---|---|---|---|---|---|
| `packages/api-service/src/server.ts` | 10 routes, node:http, regex routing | +3 GET, +9 POST; extend error map | WP-24, WP-34, WP-35 | FR-01…FR-14, FR-30 | **Shared file — highest merge risk**; grows to ~22 routes (D9) | +~30 integration tests |
| `packages/api-service/src/devMain.ts` | Seeds org, 3 users, 1 case, 1 token via raw Prisma | Wire read service + token command; make pilot org/users explicit | WP-21, WP-31, WP-72 | FR-50 | Dev-only, low | Manual smoke via `api:dev` |
| `packages/case-repository/src/auditWriter.ts` | **CREATE only** (`tx.auditEvent.create`, line 40) | Add a tenant-scoped audit read, or add a sibling read module | WP-22 | FR-07 | Medium — must not weaken the restricted-identifier guard | +audit read tests; existing security suite must pass unchanged |
| `packages/case-service/src/commands.ts` | Command envelopes | Add the patient-token envelope (or a sibling module) | WP-31 | FR-01 | **Medium — this is the PHI boundary** | +boundary refusal tests |
| `packages/case-service/src/permissions.ts` | Case role policy | Add token-creation policy; add `CASE_READ_POLICY` (or a sibling read policy module) | WP-21, WP-31 | FR-05…07, FR-01 | Medium — policy errors are security defects | +per-role route tests |
| `tsconfig.json` | Root config; `paths` without `baseUrl`; missing `@clarity/prescreen-service` | Add `baseUrl: "."` and the missing path | WP-10 | NFR-11 | Low — may surface latent type errors, which is the point | Typecheck becomes meaningful |
| `tests/integration/helpers/harness.ts` | Per-run UUID tenants, cleanup | Add fixtures for the token command and read assertions | WP-12, WP-37 | — | Shared file — coordinate | Underpins all new tests |
| `app/src/domain/api.ts` | API client with good error copy | Extend for 12 routes; keep the error messages | WP-41…WP-45 | FR-33 | Low | +client tests |
| `app/src/App.tsx` | 733-line shell, workspace in React state | Router, or build the pilot surface separately and leave the prototype as a demo artifact | WP-40, WP-41 | UX | **Highest-judgment change** — blind spot #3 | App suite (64 claimed, **unverified here**) |
| `ARCHITECTURE.md` | Top-level architecture entry | "25 models" → 38; remove "No backend, API, auth, or tenancy enforcement exists yet" | WP-06 | — | None | None |
| `IMPLEMENTATION_STATUS.md` | Status of record | Refresh to 2026-07-29; record F1/F2/F3 and PR dispositions | WP-05 | NFR-12 | None | None |
| `docs/09-personas-and-role-ux.md` | Canonical personas | Reconcile primary user with D1 or mark superseded | WP-01 | — | Low | `app/src/domain/roles.test.ts` if roles change |
| `docs/decisions/OPEN_DECISIONS.md` | OD register | Close OD-4; record D6–D13 | WP-05 | — | None | None |

### Reuse unchanged
`packages/case-service/src/caseCommandService.ts` · `packages/auth-service/src/{authenticationService,identityProviders}.ts` · `packages/case-repository/src/caseCommandGateway.ts` · `packages/case-repository/src/prismaCaseRepository.ts` (reads already exist) · `tests/security/*` · `.github/workflows/ci.yml` · `app/playwright.config.ts` — all `[V]`. EP-P1 forbids touching working commands to add transport.

### Add — responsibilities with proposed locations `[P]`
| Responsibility | Proposed location | WP |
|---|---|---|
| Tenant-scoped case read service + `CASE_READ_POLICY` | a read module in `packages/case-service/`, co-located with the write policy it mirrors | WP-21 |
| Audit history gateway read | `packages/case-repository/` alongside `auditWriter.ts` | WP-22 |
| Patient-token gateway method | `packages/case-repository/` alongside `caseCommandGateway.ts` | WP-31 |
| Request logging middleware | `packages/api-service/` | WP-26 |
| ADR: read authorization and auditing | `docs/architecture/` — next free number **after** WP-05 renumbering | WP-20 |
| ADR: patient-token creation and v1 data boundary | `docs/architecture/` | WP-30 |
| Case-spine API test manifest with honest gaps | `docs/testing/` (existing convention `[V]`) | WP-37 |
| Pilot runbook | `docs/developer-handoff/` | WP-72 |
| New integration tests | `tests/integration/` | WP-25, WP-37 |
| E2E happy path | `app/smoke/` | WP-49 |

### Remove
`clarity-platform-visualizer/` (empty `[V]`) · `chatgpt-full-stack-analytics-handoff/source-material/repo/` (duplicated docs, stale-fork hazard `[V]`) · one of `agent_bridge/` or `agents/bridge/` `[V]` · the HIPAA sentence on `codex/om/sync-main` · the workbook pending WP-03 · possibly the five uncalled gateway reads pending WP-13.

### Schema
**Expected: none.** WP-14 confirms this in writing before any code. Explicitly deferred: a per-tenant `caseKey` column (D6 option c).

---

## 12. Interfaces and Contracts

| ID | Contract | Producer → Consumer | Shape / rule | Authority | Status |
|---|---|---|---|---|---|
| **CTR-01** | Case list item | read service → API → UI | caseKey, status, urgency, assignee display, openedAt, lastActivityAt, 8 workstream statuses. **No patient identifiers beyond the token reference** | Contracts owner | `[P]` |
| **CTR-02** | Case detail | read service → API → UI | CTR-01 + currentLocation, version, requestedLevelOfCare, currentLegalStatus | Contracts owner | `[P]` |
| **CTR-03** | Audit history entry | audit read → API → UI | occurredAt, actorId, actorType, action, previous/new state hash. **Never source text, filenames, or restricted identifiers** — the existing guard is the authority | Contracts owner | `[P]`, constrained by `[V]` guard |
| **CTR-04** | `CreatePatientToken` envelope | UI → API → command | Accepts: age, preferredLanguage, guardianStatus, `privacyFlags` (must include `SYNTHETIC_ONLY`). **Rejects as unknown fields: dateOfBirth, sex, externalPatientReference** | Tech lead (ADR, WP-30) | `[P]` |
| **CTR-05** | Case command HTTP bodies | UI → API | Each body mirrors its envelope **minus** `organizationId`, `actor`, `occurredAt`; supplying any is a 400 | API owner | `[V]` pattern from ADR-0014 §3 |
| **CTR-06** | Error code → HTTP status | API → all callers | 400 validation · 401 authentication · 403 policy · 404 non-revealing not-found · 409 version/idempotency. Bodies content-free | API owner | `[V]` extend existing `PRESCREEN_ERROR_STATUS` |
| **CTR-07** | Idempotency key | UI → API → command | One key per user intent; same key + same intent replays; same key + different nested body → 409; `occurredAt` excluded from the fingerprint | Contracts owner | `[V]` ADR-0014 §5 |
| **CTR-08** | Request log record | API → logs | correlationId, principalId, organizationId, method, route, status, durationMs. **No bodies, no tokens** | Observability owner | `[P]` |
| **CTR-09** | Read policy | policy module → read service | Role → permitted read; conditional capabilities fail closed | Tech lead (ADR, WP-20) | `[P]` |
| **CTR-10** | Agent handoff package | any agent → integration owner | §16.3 | Product owner | `[P]` |

**Backward-compatibility rule:** CTR-05/06/07 already have live consumers (the prescreen routes and the prototype client). Changes to them require the integration owner's approval and a recorded change request (§21).

---

## 13. Domain and Data Change Plan

| Area | Change | Rationale | Migration? | Ownership |
|---|---|---|---|---|
| `PatientToken` | **New governed creation path** with minimum-necessary input | F1 — no path exists at any layer `[V]` | **No** — all columns exist `[V]` | Clarity is source of truth; the human supplies judgment |
| `PatientToken.dateOfBirth` / `.sex` / `.externalPatientReference` | **Structurally unacceptable input in v1** | No encryption capability exists; `*Encrypted` precedent `[V: ADR-0009]` | No | Columns remain, unused and unwritable through the API |
| `BehavioralHealthCase.id` (`caseKey`) | Server-generated (D6) | Humans should not invent globally unique keys; the global-vs-per-tenant limitation is documented `[V: mappers.ts:19-22]` | **No** in v1; a per-tenant `caseKey` column is deferred | Platform |
| `AuditEvent` | **New tenant-scoped read** | F3 — `auditWriter.ts` is create-only; tests read via raw Prisma `[V]` | No | Append-only; application-layer enforcement only, **DB-level deferred and not claimed** |
| 8 workstream columns | Read + independent update over HTTP | Parallel-lane model; the financial-never-blocks-clinical invariant must survive into the UI | No | Clarity |
| `CommandIdempotencyRecord` | Reused as-is | `[V]` | No | Retention **undecided** `[U]` — pre-real-data gap |
| Episode / prescreen / document / evidence / coverage entities | **No change** | Out of scope | No | — |

**State machines:** no change. `CaseStatus` transitions, terminal protection, and independent workstream transitions are used exactly as tested `[V]`. **Any proposed state-machine change is a change request (§21), not an implementation detail.**

---

## 14. Test Architecture

### 14.1 Verified baseline (measured this session, per file)

| Suite | Tests | Suite | Tests |
|---|---|---|---|
| `prescreen-contracts` | 38 | `evidence-review-and-contradictions` | 14 |
| `prescreen-service` | 27 | `document-command-service` | 14 |
| `document-hardening` | 18 | `analytics-contracts` | 13 |
| `s2-episode-persistence` | 17 | `case-repository` | 11 |
| `benefits-command-service` | 16 | `authorization-readiness` | 10 |
| `case-command-service` | 15 | `audit-persistence` | 10 |
| `prescreen-api` | **9** | `tenant-isolation` | 7 |
| `case-command-concurrency` | 8 | `evidence-command-service` | 7 |
| `api-service` | **8** | `benefits` (workflow) | 7 |
| `authentication` | 8 | `case-assignment-atomicity` | 6 |
| `episode-utilization-contracts` | 8 | `no-sensitive-identifiers-in-audit` | 6 |
| `case-lifecycle` (workflow) | 8 | others | remainder |
| **Total** | **343 (342 pass, 1 fail)** | | |

The failure is `migration-integrity` — the local DB has 4 migrations from other branches (issue #31), fixed by WP-11.

### 14.2 Test gaps — behaviors that must be protected before modification

| ID | Gap | Evidence | Why it matters now | Action | WP |
|---|---|---|---|---|---|
| **TG-01** | **Five gateway read methods have zero test references and zero service callers**: `listDocumentsForCase`, `listEvidenceForCase`, `listCoveragesForCase`, `findEvidence`, `findCoverage` | `[V]` grep across `tests/` and `packages/*/src/` | Speculative surface. If a later slice exposes one, there is no pinned behavior to preserve — and no evidence it is tenant-safe | Characterize **or delete**, recorded either way | WP-13 |
| **TG-02** | The two reads VS-03 exposes are covered only *incidentally*, inside `tenant-isolation.test.ts` and `synthetic-seed.test.ts` — there is no test asserting list **shape or ordering** | `[V]` | A route contract (CTR-01) will depend on shape and order; today nothing pins them | Add direct characterization tests **before** WP-21 | WP-12 |
| **TG-03** | **No audit read exists to test.** Every audit assertion in the suite uses raw `prisma.auditEvent.findMany` in test code | `[V]` `auditWriter.ts` has only `create` | FR-07 is the product's core value claim and has no production read path (F3) | Build the read (WP-22) with tests written first | WP-22 |
| **TG-04** | `countReferencesToStorageKey` is called in the document compensation path, but the compensation-cleanup failure path is untested | `[V]` open issue #1 | Not in this slice's scope — but it is a **known untested failure path in shipped code**; do not let a documents slice start without closing it | Record; close before EP for documents | deferred |
| **TG-05** | `app/` suite (64 tests claimed) **could not be executed** — `app/node_modules` absent in this worktree | `[V]` this session | Any UI work (EP-05) modifies code whose test baseline is unverified | Establish that the app suite runs and passes before WP-41 | WP-40 |
| **TG-06** | `server.ts` has no test isolating routing/error-mapping from handlers; coverage is end-to-end only (8 + 9 tests) | `[V]` | Adding 12 routes to a 375-line regex router with only E2E coverage risks silent route-shadowing | Add a route-resolution test as part of WP-24 | WP-24 |
| **TG-07** | No performance test of any kind | `[V]` blind spot #6 | List view at real queue size is unknown | One measured pass | WP-73 |
| **TG-08** | No accessibility test of any kind | `[V]` | Keyboard operability unverified | Manual keyboard pass | WP-47 |

### 14.3 Requirement → verification traceability

**Every must-have requirement has at least one verification method.** Method key: `INT` integration test · `UNIT` unit test · `E2E` end-to-end · `SEC` security suite · `MAN` manual acceptance · `OPS` operational rehearsal.

| Requirement | Verification | Method | Test ID | WP |
|---|---|---|---|---|
| FR-01 token creation + boundary refusal | Token created; `dateOfBirth`/`sex`/`externalPatientReference` each rejected as unknown fields; audit event written | INT | TST-04 | WP-37 |
| FR-02 create case, server-generated id | Create succeeds with no caller-supplied key; starts `DRAFT`; atomic audit | INT | TST-05 | WP-37 |
| FR-03 cross-tenant token rejected non-revealingly | Cross-tenant token response identical to nonexistent | INT | TST-05 | WP-37 |
| FR-04 idempotent retry | Same key + intent replays; different nested body → 409 | INT | TST-06 | WP-37 |
| FR-05 case list scoped to org | Only same-org cases; second org's case never present; **shape and order pinned** | INT | TST-01 | WP-25 |
| FR-06 case detail scoped | Other-org and absent indistinguishable | INT | TST-02 | WP-25 |
| FR-07 audit history readable, no restricted identifiers | Ordered history; existing guard suite passes unchanged | INT + SEC | TST-03 | WP-25 |
| FR-08 assignee same-org + ACTIVE in-transaction | Mid-transaction deactivation fails deterministically, writes nothing | INT | TST-07 | WP-37 |
| FR-09 urgency with optimistic concurrency | Stale `expectedVersion` → 409, no write | INT | TST-08 | WP-37 |
| FR-10 legal transitions only, on the fresh row | Illegal transition rejected, blocking rule named | INT | TST-09 | WP-37 |
| FR-11 independent workstreams | Updating `benefits` leaves `clinical` untouched; blocked financial does not block clinical | INT + UNIT | TST-10 | WP-37 |
| FR-12 decision rationale | Appears in history with actor and time | INT | TST-11 | WP-37 |
| FR-13 close + terminal protection | Post-close mutation refused | INT | TST-12 | WP-37 |
| FR-14 reopen authority | `SYSTEM_ADMIN` → 403; `ORGANIZATION_ADMIN` + reason succeeds; failed reopen writes nothing | INT | TST-12 | WP-37 |
| FR-20 DB-sourced roles | Asserted role not held is rejected; session roles equal DB row | INT | reuse `authentication.test.ts` `[V]` | WP-25 |
| FR-21 uniform auth failure | Unknown, wrong, and deactivated are identical | INT | reuse `[V]` | — |
| FR-22 deactivation kills live session | Next request 401 | INT | reuse `[V]` | — |
| FR-23 honest identity surface | No client control changes acting role; displayed role = session role | E2E + MAN | TST-13 | WP-42 |
| FR-30 stable content-free error map | No body reveals existence, ownership, or what would be permitted | INT | TST-01…12 | WP-35 |
| FR-31 input preserved across recoverable failure | After conflict/expiry, typed values intact | E2E | TST-14, TST-15 | WP-60, WP-61 |
| FR-32 three distinct states | No-data, failed-to-load, not-permitted distinguishable | Component + MAN | TST-16 | WP-46 |
| FR-33 unreachable API actionable | Message names the remedy | Component | TST-17 | WP-63 |
| FR-40 one audit event per mutation, same transaction | Forced post-write failure leaves neither row nor event | INT | TST-18 | WP-37 |
| FR-41 audit metadata carries no restricted identifiers | Existing security suite passes unchanged | SEC | reuse `[V]` 6 tests | WP-25 |
| FR-50 provisioning runbook | Executed by someone other than its author | MAN | — | WP-72 |
| NFR-01 tenant isolation | One cross-tenant negative **per new route** | INT | TST-01…12 | WP-25, WP-37 |
| NFR-02 token hashing | Existing tests pass | INT | reuse `[V]` | — |
| NFR-03 no real PHI | FR-01 refusals; security suite green | INT + SEC | TST-04 | WP-37 |
| NFR-04 append-only (application layer) | Honesty statement present; **DB-level not claimed** | MAN (doc review) | — | WP-05 |
| NFR-05 no partial writes | Concurrency + interleave tests per mutating route | INT | TST-06…12 | WP-37 |
| NFR-06 restore rehearsed | `migration:recovery:local` green on disposable DBs | OPS | — | WP-70 |
| NFR-07 observability | Log review shows correlation id, principal, org, route, outcome, no bodies | MAN | — | WP-26 |
| NFR-08 latency | <500 ms at ≤500 cases | OPS | — | WP-73 |
| NFR-09 accessibility | Keyboard-only happy path completes | MAN | — | WP-47 |
| NFR-10 no duplicated domain | No state machine or enum list duplicated in UI; types sourced from the API | Review + typecheck | — | WP-40 |
| NFR-11 verification integrity | Typecheck hermetic; `migration-integrity` green on ephemeral DB | CI | — | WP-10, WP-11 |
| NFR-12 compliance posture | No HIPAA/production/measured-outcome claim in any artifact | Review | — | WP-04, WP-05 |

### 14.4 Test pattern to reuse

`tests/integration/prescreen-api.test.ts` covers, in nine tests, exactly the eight assertion classes every new route family needs: happy path · permission in both directions · `SYSTEM_ADMIN` zero capability · uniform 401 · server-derived-field rejection (400) · cross-tenant 404 · version conflict 409 · idempotency replay and conflict `[V]`. **WP-25 and WP-37 copy this file's structure rather than inventing a pattern.** This is the single largest test-effort saving available.

### 14.5 Regression gate

Before MS-04 is offered to any human: the full suite (343 tests) green **including `migration-integrity`**, on an **ephemeral** database, with a **hermetic** typecheck, plus the new tests above. The app suite must be shown to run (TG-05) before EP-05 modifies it.

---

## 15. Definition of Done

### 15.1 Work package done
Adapted to this repository — items marked ✕ are deliberately excluded because the corresponding capability does not exist.

| Criterion | Applies | This repo's form |
|---|---|---|
| Code implemented | ✓ | — |
| Relevant tests pass | ✓ | The specific TST IDs in §14.3 for that WP |
| Interfaces match the contract | ✓ | Matches its CTR entry; contract changes recorded (§21) |
| Error behavior implemented | ✓ | Every domain error maps per CTR-06; bodies content-free |
| Permissions enforced | ✓ | Route reached only through a policy; a negative test per role |
| Logging present | ✓ | CTR-08 record emitted; no bodies, no tokens |
| Documentation updated | ✓ | ADR if a decision was made; test manifest with **honest gaps** |
| Review complete | ✓ | Documented self-review under the live solo-maintainer policy `[V]`; PR-only to `main` |
| No unresolved critical defects | ✓ | — |
| Handoff notes complete | ✓ | The §16.3 handoff package |
| **Added:** tenancy negative test exists | ✓ | EP-P4 — one per exposed route |
| **Added:** honesty statement | ✓ | EP-P11 — names what is not claimed |
| **Added:** lint + hermetic typecheck + `prisma validate` pass | ✓ | The project's own validation gate `[V]` |
| Performance budget met | ✕ | No perf capability until WP-73 |
| Security sign-off | ✕ | No security-review capability exists; must not be implied |

### 15.2 Vertical slice done
| Criterion | Evidence required |
|---|---|
| Outcome works end to end | The slice's "demonstrable as" column in §8, performed live |
| Acceptance criteria pass | The PRD §5.13 blocks that apply |
| Critical failure states handled | The PRD §5.5 exception rows in scope for that slice |
| Data changes persist correctly | Verified after a process restart — **material here, because the prescreen gateway is in-memory `[V]` and this slice must not repeat that** |
| Authorization works | Positive and negative per role, over HTTP |
| Audit evidence exists | One event per mutation, readable through FR-07 once VS-04 lands |
| Tests cover the workflow | The mapped TST IDs green |
| Demonstrable independently | `curl` script or URL walkthrough with no other slice required |

### 15.3 Epic done
All required slices done · cross-slice integration verified (e.g. VS-05's created case appears in VS-03's list and VS-04's history) · every mapped requirement has a passing verification · no critical product gap remains inside the epic · **product acceptance by the owner recorded in writing.**

### 15.4 Milestone done
Exit gate in §6 met · required evidence available and reproducible (test output, not assertion) · open risks within the accepted threshold in §20 · **the next milestone can begin with no hidden dependency** — specifically, no decision in §7 that the next milestone needs is still open.

### 15.5 Release done — four distinct standards

| Release type | Standard | Applies to |
|---|---|---|
| **Internal** | Suite green on an ephemeral DB · hermetic typecheck · lint · `prisma validate` · PR merged to `main` with documented self-review · honesty statement present | Every WP |
| **Demo** | Internal standard **plus**: the happy path performs live without a terminal or DB client · synthetic-only banner visible · the demo role selector removed or fenced · **no e-PEC, statutory, or clinical content shown** (OD-2/OD-3 open) · verbal statement of what is not claimed | MS-04 |
| **Pilot** | Demo standard **plus**: every §5.5 exception path handled and tested · restore rehearsed once · error monitoring live · runbook executed by a second person · stop conditions written and agreed · data-classification check at the entry path · single tenant, synthetic data only | MS-06 |
| **Production** | Pilot standard **plus** — all external and none currently achievable: counsel review (OD-2) · clinical licensing (OD-3) · independent security review and pen test · BAA-capable hosting · encryption capability · DB-level append-only enforcement · malware scanning · backup/restore with stated objectives · incident runbook. **No earlier release type may be described as production-ready** `[V: CLAUDE.md rule 4]` | MS-07, out of reach |

---

## 16. Ownership Architecture

The repository already has a multi-agent convention: branch prefixes `codex/om/*` and `claude/*`, and an operating document with an explicit authority order — latest human decision > canonical docs/ADRs > repo guidance > working code and tests > bridge ledger > agent recommendations `[D: agents/bridge/BUILD_TO_GOAL.md]`. The roles below map onto that.

### 16.1 Roles

| Role | Mission | Repository boundary | Allowed | Prohibited |
|---|---|---|---|---|
| **Product owner** (human, Tyler Hebert) | Own product truth and acceptance | `docs/product/`, `docs/decisions/`, `CLAUDE.md`, `GOVERNANCE.md` | Decide D1–D13; accept or reject slices; rule on PRs | — (sole authority; cannot be delegated to an agent) |
| **Tech lead** (human) | Own architecture decisions | `docs/architecture/` (ADRs) | Author ADRs; approve contract changes | Changing product requirements |
| **Contracts owner** | Own CTR-01…CTR-09 | `packages/domain-contracts/src/`, DTO definitions | Add contracts; extend additively | **Breaking a live contract** (CTR-05/06/07 have consumers) without a change request |
| **Domain owner** | Own the schema and state machines | `prisma/schema.prisma`, `packages/domain-contracts/src/*StateMachine*` | Propose migrations with an ADR; keep enum arrays in sync with the schema | Any migration without an ADR; any state-machine change without a change request |
| **Backend owner** | Own services and gateways | `packages/case-service/`, `packages/case-repository/` | Add read services, policies, gateway methods | Modifying `caseCommandService.ts` command behavior (EP-P1); importing `@prisma/client` outside `case-repository` |
| **API owner** | Own the HTTP surface | `packages/api-service/` | Add routes; extend the error map | Deriving tenant or actor from anything but the principal (EP-P3); adding business rules in a route |
| **Frontend owner** | Own the pilot UI | `app/` | Build the routed surface; consume API types | Importing `app/src/domain` into the pilot surface (NFR-10); presenting unverified role scoping as access control |
| **Test owner** | Own the verification map | `tests/`, `app/smoke/`, `packages/**/*.test.ts` | Add tests; add harness fixtures | **Weakening `assertLocalClarityDevDatabase`** `[V: CLAUDE.md]`; deleting or skipping a security test |
| **Infra owner** | Own toolchain and environments | `tsconfig.json`, `.github/workflows/`, env provisioning | Fix resolution; ephemeral DBs; monitoring | Pushing to `main`; changing branch protection |
| **Observability owner** | Own logging | logging middleware, CTR-08 | Add structured logs | Logging bodies, tokens, or restricted identifiers |
| **Docs owner** | Own canonical record accuracy | `README.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_STATUS.md`, `docs/testing/` | Correct stale claims; refresh status | Promoting a status without evidence `[V: PRODUCT_EVIDENCE_AND_DECISION_PROTOCOL]` |
| **Integration owner** | Own shared-file merges | `server.ts`, `harness.ts`, `permissions.ts`, `commands.ts` | Sequence and merge conflicting edits | Silently resolving a semantic conflict — must escalate |

### 16.2 Ownership rules

1. **One primary owner per work package.** §9 assigns exactly one.
2. **Shared files have an explicit integration owner.** Four files are shared: `packages/api-service/src/server.ts` (WP-24 + WP-34), `tests/integration/helpers/harness.ts` (WP-12 + WP-37), `packages/case-service/src/permissions.ts` (WP-21 + WP-31), `packages/case-service/src/commands.ts` (WP-31). These are the merge-risk hotspots in §17.
3. **Cross-cutting contracts have a designated authority** — contracts owner for CTR-01…08, tech lead for CTR-09, product owner for CTR-10.
4. **Agents cannot silently alter product requirements.** A requirement change is a change request (§21) approved by the product owner.
5. **Agents cannot expand scope without recording it.** Any file touched outside the WP's boundary is reported in the handoff.
6. **Agents must report contradictions, not resolve them** — matching the repository's existing authority order `[D]`.
7. **Backward compatibility is preserved unless authorized.** CTR-05/06/07 have live consumers.
8. **Evidence of completion is required** — test output, not a claim. `[V: CLAUDE.md rule 1 — never claim a test passed unless it ran in this session]`

### 16.3 Agent handoff package (CTR-10)

Every agent returns:

```
WP ID:              WP-nn
Summary:            what changed and why, ≤5 lines
Files changed:      full list, flagging any outside the WP boundary
Contracts:          CTR IDs added or changed (and whether additive)
Tests added:        TST IDs + file paths
Test results:       exact counts from a run IN THIS SESSION; the command used;
                    DATABASE_URL target; "not run" where not run
Assumptions:        labeled [V]/[D]/[I]/[P]/[U]
Deviations:         any departure from this plan, with the reason
Known limitations:  what does not work
Risks introduced:   RSK IDs, new or aggravated
Follow-up work:     proposed, not enacted
Honesty statement:  what is NOT claimed
Commit/patch ref:   branch and commit
```

**Rejection criteria:** a handoff is returned unaccepted if test counts are asserted without a command and target, if a file outside the boundary is changed without being flagged, if a security test was skipped or weakened, or if the honesty statement is missing.

---

## 17. Parallel Workstream Plan

| Stream | Work | Start condition | Required contract | Shared files | Merge risk | Integration checkpoint | Owner | Fallback if upstream changes |
|---|---|---|---|---|---|---|---|---|
| **PS-1 Decisions** | WP-01…WP-06 | Now | — | Docs only | Low | MS-01 exit | Product owner + docs owner | None — this stream *is* upstream |
| **PS-2 Toolchain** | WP-10, WP-11 | Now | — | `tsconfig.json`, CI | Low | Before WP-12 | Infra owner | None |
| **PS-3 Behavior protection** | WP-12, WP-13, WP-14 | WP-11 done | — | `harness.ts` | **Medium** — also touched by WP-37 | Before WP-21 | Test owner | If WP-13 deletes the five reads, no downstream effect (nothing calls them) |
| **PS-4 Read surface** | WP-20…WP-26 | WP-01 + WP-12 | CTR-01/02/03/09 | `server.ts`, `permissions.ts` | **High** — `server.ts` | WP-25 green | Backend + API owner | If D1 flips to field responder, the **policy and route pattern still transfer**; the entity may not — one WP of rework |
| **PS-5 Write surface** | WP-30…WP-37 | WP-01 + WP-14 + D8 | CTR-04/05/06/07 | `server.ts`, `commands.ts`, `permissions.ts`, `harness.ts` | **High** | WP-37 green | Backend + API owner | Blocked, not degraded, if D1/D8 slip |
| **PS-6 UI shell** | WP-40, WP-41, WP-42, WP-46 | **CTR-01/02/03 frozen** (not the routes built) | CTR-01/02/03 | `app/` | Low | WP-43 against real API | Frontend owner | Contract-first means route delays do not block the shell; mock against the frozen DTOs |
| **PS-7 Observability** | WP-26 | CTR-08 agreed | CTR-08 | `server.ts` | Medium | With WP-24 | Observability owner | Independent |
| **PS-8 Documentation** | WP-05, WP-06, WP-50, WP-72 | Continuous | — | Docs only | Low | Each milestone exit | Docs owner | Independent |

### Explicitly NOT parallelized
- **WP-31 (token command) before D8.** It defines the PHI boundary; building it on a guess would either widen the data surface or be rewritten.
- **WP-21/WP-24 (read exposure) before D7/WP-20.** Exposing unpoliced reads is a security defect (EP-P2).
- **Any UI screen before CTR-01/02/03 are frozen.** The prototype already demonstrates what happens when the UI invents its own domain model `[V]`.
- **EP-04 before D1.** Building the coordinator's write path while the primary user is contested risks a full-slice discard.
- **WP-24 and WP-34 concurrently in `server.ts`** without the integration owner sequencing them.

---

## 18. Implementation Order

| # | Step | Items | Why now | Dependencies | Exit criteria | Unlocks |
|---|---|---|---|---|---|---|
| 1 | Close blocking product and architecture decisions | WP-01…WP-06 | Three documents name three primary users; a 2,484-file PR proposes a different product; two hard-rule violations gate all external activity `[V]` | Owner availability | D1–D4 written; PRs ruled; ADR numbers unique; status current | Writable requirements; safe user research |
| 2 | Protect current behavior with tests | WP-10…WP-14 | **Five gateway reads are untested and uncalled; the two reads about to be exposed have no shape/order test; typecheck is non-hermetic; the DB ledger is contended** `[V]` | Step 1 partially | Suite green on an ephemeral DB; TG-01/02 resolved; migration need confirmed | Safe modification |
| 3 | Stabilize contracts | WP-20, WP-23, WP-30, WP-33 | Contract-first is what lets PS-6 (UI) run parallel to PS-4/5, and prevents the prototype's duplicate-domain failure recurring | Steps 1–2 | CTR-01…07 frozen; two ADRs accepted | Parallel UI and backend work |
| 4 | Data changes | WP-14 (confirm), WP-31 (token path) | **F1: the spine has no entry point** — nothing downstream can exist without it | Step 3, D8 | Token creatable through a governed, policed, audited path; refusals tested | Case creation |
| 5 | Smallest happy-path vertical slice | WP-21, WP-22, WP-24, WP-25, WP-32, WP-34, WP-37 | Turns tested-but-unreachable capability into an HTTP-reachable workflow | Step 4 | PRD §5.13 primary success case passes over HTTP, no UI | The UI slice |
| 6 | **Permissions and authorization — folded into step 5, not after it** | WP-20, WP-21, per-role tests in WP-25/WP-37 | **Deliberate deviation from the default sequence:** reads currently have no policy at all `[V]`. Shipping unpoliced reads and policing them later is a security defect, not deferred hardening | — | Every route reached only through a policy; a negative test per role | Safe exposure |
| 7 | UI and first observable outcome | WP-40…WP-50 | This is where the activation event happens | Step 5 | A human completes the workflow at a URL and reads the history | **User validation becomes possible** |
| 8 | Critical exception and recovery paths | WP-60…WP-63 | Where a pilot user's confidence is permanently won or lost | Step 7 | Every §5.5 exception tested and designed | Week-long exposure |
| 9 | Audit and observability | WP-22 (in step 5), WP-26, WP-48 | **Deviation: pulled earlier.** The audit read *is* the product's value claim (VS-04), and without the activation event the pilot cannot be evaluated | — | History readable; activation counted; logs carry no bodies | Evaluable pilot |
| 10 | Integrations | **skipped** | Zero live integrations is the recommendation, not an omission — every alternative adds infrastructure without testing the hypothesis | — | — | — |
| 11 | End-to-end verification | WP-49, regression gate §14.5 | — | Step 8 | E2E green in CI; full suite green on ephemeral DB | Pilot hardening |
| 12 | Harden for pilot | WP-70…WP-75 | — | Step 11 | §15.5 pilot standard met | The pilot |
| 13 | Product acceptance | Owner walkthrough | — | Step 12 | Owner accepts in writing; stop conditions agreed | MS-06 exit |

**Three stated deviations from the default sequence:** permissions move *into* the slice rather than after it (step 6); observability and the audit read move earlier (step 9); integrations are skipped entirely (step 10). Each is justified above.

---

## 19. Delivery Waves

### Wave 0 — Decisions and protection
| Field | Value |
|---|---|
| **Objective** | Make the plan executable and make "verified" mean something |
| **Milestones** | MS-01 |
| **Slices** | VS-01, VS-02 |
| **Entry gate** | This document reviewed |
| **Exit gate** | D1–D4 written · PRs ruled · ADR numbers unique · hermetic typecheck · suite incl. `migration-integrity` green on an ephemeral DB · TG-01/TG-02 resolved |
| **Demo** | Read the four decisions; watch the suite go green on a fresh database |
| **Risks** | RSK-01 (owner availability), RSK-11 (scope pressure from open PRs) |
| **Release type** | Internal |

### Wave 1 — Minimum working path
| Field | Value |
|---|---|
| **Objective** | The first user-reachable workflow in the project's history |
| **Milestones** | MS-02, MS-03, MS-04 |
| **Slices** | VS-03…VS-08 |
| **Entry gate** | Wave 0 exit; D1, D6, D7, D8 closed |
| **Exit gate** | A named human signs in, creates, assigns, prioritizes, justifies, closes, reloads, finds the case, reads its history — no terminal, script, or DB client. Suite green in CI |
| **Demo** | The full workflow at a URL, then the audit timeline read aloud |
| **Risks** | RSK-02 (domain-model entry point), RSK-04 (read policy), RSK-05 (shared-file merges), RSK-08 (UI rebuild) |
| **Release type** | **Demo** — §15.5 demo standard, explicitly excluding e-PEC/statutory/clinical content |

### Wave 2 — Reliability and exceptions
| Field | Value |
|---|---|
| **Objective** | Trustworthy under contention, expiry, and failure |
| **Milestones** | MS-05 |
| **Slices** | VS-09 |
| **Entry gate** | Wave 1 exit |
| **Exit gate** | Every §5.5 exception tested and designed; zero user-visible data loss under forced conflict |
| **Demo** | Two browsers editing one case; a mid-form expiry; a double-submit — with input preserved each time |
| **Risks** | RSK-06 (test fragility), RSK-09 (incomplete observability) |
| **Release type** | Internal → Demo |

### Wave 3 — Operations and pilot controls
| Field | Value |
|---|---|
| **Objective** | Runnable for a week by someone who did not build it |
| **Milestones** | MS-06 |
| **Slices** | VS-10 |
| **Entry gate** | Wave 2 exit; D10, D12 closed |
| **Exit gate** | Restore rehearsed · monitoring live · runbook executed by a second person · stop conditions written · entry-path data-classification check |
| **Demo** | Induce an error and show it in monitoring; provision a fresh org from the runbook |
| **Risks** | RSK-07 (environment differences), RSK-10 (product acceptance) |
| **Release type** | **Pilot** |

### Wave 4 — Release readiness
**Not scheduled.** Every remaining item is an external gate, not code: counsel review (OD-2), clinical licensing (OD-3), independent security review and pen test, BAA-capable hosting, encryption capability, DB-level append-only enforcement `[V]`. Listed so it is visible that MS-07 exists and is out of reach — **not** so it can be planned into a wave.

---

## 20. Execution Risk Register

| ID | Risk | Evidence | Likel. | Impact | Prevention | Detection | Response | Owner | WPs |
|---|---|---|---|---|---|---|---|---|---|
| **RSK-01** | Decisions stall; Wave 0 never exits | `[V]` `owner: TBD` in every `docs/product/*`; OD-4 open ~3 weeks | High | High | One-week time-box; PS-4 proceeds regardless | No written decision after a week | Proceed with EP-03 only; escalate D1 as the single blocking item | Product owner | WP-01…04 |
| **RSK-02** | Domain-model instability at the entry point — the token command is designed wrong and rewritten | `[V]` F1: no prior art in the repo; PHI boundary involved | Medium | High | D8/ADR before code (WP-30); copy the ADR-0009 structural-refusal precedent | Boundary-refusal tests fail, or a field is requested that the ADR excluded | Change request (§21); do not widen the boundary in code | Tech lead | WP-30, WP-31 |
| **RSK-03** | Requirement ambiguity — D1 flips after EP-04 starts | `[V]` three documents, three users | Medium | **Critical** | EP-04 does not start until D1 is written | A stakeholder describes a different primary user | Stop EP-04; re-derive PRD §3 onward; EP-03 survives | Product owner | all EP-04 |
| **RSK-04** | Permission gap — reads exposed without a policy, or with too broad a one | `[V]` F2: reads bypass the service layer entirely | Medium | **Critical** (security) | EP-P2; WP-20 ADR precedes WP-21; a negative test per role per route | Missing negative test; a route calling a gateway directly | Block the merge; this is not a follow-up item | Tech lead | WP-20, WP-21, WP-24 |
| **RSK-05** | Parallel merge conflicts in `server.ts` | `[V]` 375-line single file; WP-24 and WP-34 both edit it | **High** | Medium | Integration owner sequences WP-24 before WP-34; route blocks kept contiguous like the prescreen block | Conflict on merge; route shadowing | Sequence, do not merge concurrently; TG-06 route-resolution test catches shadowing | Integration owner | WP-24, WP-34 |
| **RSK-06** | Test fragility — new route tests duplicate rather than reuse the proven pattern | `[V]` `prescreen-api.test.ts` covers all eight assertion classes | Medium | Medium | Mandate the template (§14.4) | Divergent structure in review | Rewrite to the template | Test owner | WP-25, WP-37 |
| **RSK-07** | Environment differences — local passes, CI fails, or vice versa | `[V]` **already realized**: `migration-integrity` fails locally and would pass in CI's ephemeral DB | **Realized** | High | WP-11 ephemeral DBs; WP-10 hermetic typecheck | Divergence between local and CI results | Treat CI as authoritative until WP-10/11 land | Infra owner | WP-10, WP-11 |
| **RSK-08** | Hidden coupling — the UI re-implements the domain a third time | `[V]` prototype already duplicates it; zero shared contracts | Medium | High | NFR-10; contract-first (CTR-01/02/03 frozen); WP-40 spike decides harvest vs rebuild | An enum or state machine appears in UI code | Reject; source types from the API | Frontend owner | WP-40, WP-41 |
| **RSK-09** | Incomplete observability makes the pilot unsupportable | `[V]` no request logging exists | Medium | Medium | WP-26 lands with WP-24, not later | A pilot defect cannot be traced | Add before pilot exposure | Observability owner | WP-26 |
| **RSK-10** | Product acceptance failure — the workflow is complete and the user does not want it | `[U]` zero user validation | **High** | **Critical** | Interviews **before** MS-04 ships (§13 of the build plan, item 1) | Pilot diary shows the spreadsheet still in use | Revisit assumption A1; do not add features | Product owner | pre-MS-04 |
| **RSK-11** | Scope expansion — PR #29/#30/#32 merge mid-wave | `[V]` 2,484 + 526 + 1,081 changed files pending | Medium | High | WP-02 rules on them **before** Wave 1; change control (§21) | New packages or migrations appearing on the working branch | Revert to the ruling; re-record if the ruling changed | Product owner | WP-02 |
| **RSK-12** | Data migration failure | `[I]` none expected; WP-14 confirms | Low | High | WP-14 written confirmation; smallest-possible + ADR if needed | `prisma validate` or `migration-integrity` fails | Roll back on a disposable DB; rehearse restore (WP-70) | Domain owner | WP-14 |
| **RSK-13** | Agent interpretation drift — an agent quietly redefines a requirement or contract | `[D]` the repo's own authority order exists because this is a known failure mode | Medium | High | §16.2 rules; CTR-10 handoff; rejection criteria | Handoff shows files outside the boundary, or an unflagged deviation | Return the handoff unaccepted; record a change request | Integration owner | all |
| **RSK-14** | Untested existing behavior breaks silently | `[V]` TG-01: five reads untested and uncalled; TG-05: app suite unrunnable here | Medium | Medium | Step 2 precedes step 5; TG-01/02/05 resolved in Wave 0 | Regression with no failing test | Characterize first, then change (EP-P5) | Test owner | WP-12, WP-13, WP-40 |
| **RSK-15** | Compliance exposure from artifacts, not code | `[V]` HIPAA claim on an open PR; 25/44 PHI-flagged sheets tracked | Medium | **Critical** | WP-03, WP-04 before any external activity | Any external artifact or conversation before those close | Halt the external activity, not the engineering | Product owner | WP-03, WP-04 |

---

## 21. Change-Control Process

### When a change must be recorded
Implementation reveals a conflicting requirement · a missing workflow step · an invalid assumption · a new dependency · an architectural constraint · a security concern · a data issue · scope expansion · a breaking interface change.

### Record format
```
Change ID:         CR-nn
Discovery:         what was found, and during which WP
Evidence:          file:line, test output, or command result — not a claim
Product impact:    which requirement / user outcome changes
Technical impact:  which contracts, schemas, or modules change
Scope impact:      in / out / deferred; which slice or wave moves
Dependency impact: which WPs or milestones are affected
Recommendation:    the agent's or developer's proposal
Decision owner:    per §16.1 authority
Approval status:   proposed / approved / rejected / deferred
Updated artifacts: which documents must change if approved
```

### Routing
| Change type | Decision owner | Blocks work? |
|---|---|---|
| Requirement change | Product owner | Yes, for the affected WP |
| Contract change (CTR-01…08) | Contracts owner; **tech lead if a live consumer exists** | Yes |
| Schema / migration | Domain owner + tech lead ADR | Yes |
| State machine | Product owner + tech lead | Yes |
| Scope expansion | Product owner | Yes |
| Security concern | Tech lead — **halt the affected WP immediately** | Yes |
| Test strategy | Test owner | No |
| Sequencing within a wave | Integration owner | No |

### Standing rules
1. **Agents may recommend changes; they may not silently redefine the product.** `[D: agents/bridge/BUILD_TO_GOAL.md` authority order]
2. A discovered contradiction is **reported, not resolved** — matching the repository's existing invariant that contradictions stay visible `[V: GOVERNANCE #4]`.
3. Any WP whose change request is pending is **paused, not worked around**.
4. An approved change updates the artifact chain: PRD → this document → the affected WP → the test map. A change that updates code but not the artifact chain is not done.
5. **Three change requests are pre-seeded by this session's findings** and should be filed immediately rather than discovered later:
   - **CR-01** — F1: no `PatientToken` creation path exists at any layer. Product impact: FR-01 is new work, not plumbing. Evidence: grep across `packages/`, `scripts/`, `tests/`.
   - **CR-02** — F3: no audit read path exists at any layer (`auditWriter.ts` is create-only; tests use raw Prisma). Product impact: FR-07 needs a gateway method, so VS-04 is a distinct slice.
   - **CR-03** — TG-01: five gateway read methods are untested and uncalled. Recommendation: characterize or delete; either way, record.

---

## 22. First Execution Package

**The smallest work item that materially reduces risk.**

Two candidates were compared. **WP-01 (name the primary user)** is on the critical path, costs almost nothing, and unblocks the most — but it is a decision requiring the owner, not executable work. **WP-10 + WP-11 (verification integrity)** is executable now, needs no decision, and repairs the fact that the project's completion claims are currently unreliable.

**Recommendation: run both in parallel.** WP-01 is dispatched to the owner as a decision request; WP-10/11 begins immediately as engineering. The first *executable* package is therefore:

### WP-10 + WP-11 — Restore trustworthy verification

| Field | Content |
|---|---|
| **First milestone** | MS-01 — Decisions closed & baseline protected |
| **First epic** | EP-02 — Verification integrity & behavior protection |
| **First vertical slice** | VS-02 — Protected baseline |
| **First work package** | WP-10 (hermetic typecheck) + WP-11 (per-session ephemeral database) |
| **Product outcome** | Not user-facing. **System outcome:** a completion claim in a session report becomes verifiable. Today `npm run typecheck` in a worktree silently type-checks the *parent* checkout, and `migration-integrity` fails because parallel branches share one local database — so "lint, typecheck, tests all pass" cannot currently be trusted from a worktree `[V, both reproduced this session]` |
| **Repository area** | Root toolchain and test environment |
| **Files to inspect first** | `tsconfig.json` (has `paths`, **no `baseUrl`**, and omits `@clarity/prescreen-service`) · `vitest.config.ts` (gets this right via `import.meta.url` — the reference implementation) · `.github/workflows/ci.yml` (already models the ephemeral-DB pattern correctly) · `tests/integration/migration-integrity.test.ts` · `tests/integration/helpers/harness.ts` (`assertLocalClarityDevDatabase`) |
| **Inputs** | This document; the two reproductions in the brief §18-C/D; open issue #31 |
| **Required changes** | (1) `tsconfig.json`: add `baseUrl: "."` so the existing `paths` take effect, and add the missing `@clarity/prescreen-service` entry. (2) Provide a per-session ephemeral `clarity_dev` (create → `prisma migrate deploy` → run → drop), mirroring the CI service-container pattern, and document the command. **Do not weaken `assertLocalClarityDevDatabase`** — the ephemeral database must still be named `clarity_dev` and be local |
| **Interfaces** | None. No CTR is created or changed |
| **Tests** | No new product tests. Verification is that the **existing** suite behaves correctly: full suite **343/343 green** on a fresh ephemeral database (including `migration-integrity`, which fails today), and `npm run typecheck` passing while resolving only files inside the worktree |
| **Acceptance criteria** | `Given` a clean worktree checkout and a fresh ephemeral database · `When` lint, typecheck, `prisma validate`, and the full suite are run · `Then` all four pass, `migration-integrity` is green, and no diagnostic path in the typecheck output points outside the worktree |
| **Definition of done** | Work-package DoD §15.1: change implemented · existing suite green with counts from a run in this session · no contract change · documentation updated (the ephemeral-DB command recorded in the contributor guidance) · documented self-review · handoff package per CTR-10 including the exact commands and `DATABASE_URL` target |
| **Dependencies** | None. This is the only WP in the plan with no upstream dependency |
| **Owner** | Infra owner |
| **Reviewer** | Test owner (confirms no test was weakened or skipped to achieve green) |
| **Handoff requirements** | CTR-10 package, and specifically: the before/after typecheck output, the exact suite command and target, the 343/343 counts, and confirmation that `assertLocalClarityDevDatabase` is unchanged |
| **Must NOT be included** | Any product code · any route · any new test asserting new behavior · any schema change · fixing latent type errors that WP-10 newly reveals (**report them; a separate WP fixes them** — otherwise this package's scope is unbounded) · touching the five uncalled gateway reads (that is WP-13) · merging any of PRs #29/#30/#32 · any change to branch protection |

**Why this package first.** It is the only work in the entire plan that is dependency-free, decision-free, and repairs a defect that undermines every subsequent completion claim — including this plan's own gates. Every milestone exit in §6 is phrased as "suite green on an ephemeral database with a hermetic typecheck." Until WP-10/11 land, none of those gates can be honestly evaluated.

**Dispatched in parallel, not executed:** WP-01 (name the primary user) to the product owner, and WP-03 (workbook data status) to the owner plus a qualified privacy reviewer. Those two are the highest-leverage items in the plan and neither is engineering work.

---

## Final Quality Review

| Check | Status |
|---|---|
| Did you understand the prior output before planning? | Yes — and this session's investigation **corrected** one of my own prior claims (§2: "read methods exist and are tested" was true only for the two case reads) and produced a third structural finding (F3, no audit read path) |
| Is the execution plan tied to the approved product outcome? | Tied to the *proposed* MCPO. It is **not approved** — D1 is open, and §3 states the plan is conditional |
| Is every epic connected to a milestone? | Yes — §7, all seven |
| Is every slice connected to a user or system outcome? | Yes — §8, each with a "demonstrable independently as" column. VS-01 and VS-02 are flagged as system, not user, outcomes |
| Is every work package bounded and assignable? | Yes — §9, one owner each, with WP-10/11's exclusions stated explicitly to prevent scope creep |
| Are repository locations verified rather than invented? | Yes — verified paths are cited with line numbers; new work states a **responsibility plus proposed location**, marked `[P]` |
| Are interfaces and contracts explicit? | Yes — §12, CTR-01…10, with authority and backward-compatibility constraints |
| Are dependencies mapped? | Yes — §10 graph, plus per-WP `Depends` columns |
| Is the critical path visible? | Yes — `WP-01 → WP-30 → WP-31 → WP-32 → WP-33 → WP-34 → WP-37 → WP-45 → WP-49 → MS-04` |
| Can work safely occur in parallel? | Yes — §17, eight streams, with five explicit non-parallelization rules and four named shared-file hotspots |
| **Does every requirement have a verification method?** | **Yes — §14.3 maps all 26 FR and 12 NFR requirements to a method and a test ID.** Several reuse existing passing tests rather than adding new ones |
| Are definitions of done observable? | Yes — §15, five levels, four distinct release standards, with two work-package criteria marked ✕ because the capability does not exist |
| Are agent ownership boundaries clear? | Yes — §16, twelve roles with explicit prohibitions, mapped onto the repository's existing authority order |
| Are handoffs defined? | Yes — CTR-10, with rejection criteria |
| Are unresolved decisions isolated? | Yes — §7 mapping table; §3 states exactly which epics are blocked by which decisions |
| Is scope expansion controlled? | Yes — §21, with three pre-seeded change requests and RSK-11 covering the three open PRs |
| Is the first execution package ready to begin? | Yes — WP-10/11, dependency-free, decision-free, with an explicit must-not-include list |
| Is it clear what must not be implemented yet? | Yes — build plan Artifact 14 (22 items with reconsideration triggers), plus §19 Wave 4 listed as out of reach and §22's exclusions |
