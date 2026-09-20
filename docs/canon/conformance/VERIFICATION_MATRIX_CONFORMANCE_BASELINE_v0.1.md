# Verification Matrix Conformance Baseline v0.1

**Audit date:** 2026-09-20
**Audited against:** `origin/main` at `4307093` plus branch `docs/canon-package-v1.0` (ADR-0025, Accepted)
**Subject:** every row of [../VERIFICATION_MATRIX.md](../VERIFICATION_MATRIX.md)
**Method:** evidence audit. Implementation paths and test paths were read; the unit and
integration suites were executed; one throwaway probe was run to settle a strictness question
and then deleted. **No test was written to turn a row green**, and no semantics, persistence,
command, API or migration was created.

## Verdict in one paragraph

Of 21 invariants: **9 ENFORCED**, **6 PARTIAL**, **2 MISSING**, **4 NOT YET APPLICABLE**. The
longitudinal contract layer merged in #133 is stronger than expected — all 24 of its Zod schemas
are `.strict()`, so several no-collapse rules are enforced *by construction* and not merely by
assertion. The weaknesses are not where the canon's prose implies. They are: (a) the matrix's
UI-level rows silently generalize from the one governed workspace (Access) to a product whose
other workspaces are ungoverned demo state; (b) several negative assertions are written in a
form that proves the *fixture* lacks a forbidden field rather than that the *schema* rejects it;
(c) nothing structurally prevents a future Prisma model from persisting a concept the canon
prohibits; and (d) the browser regression suite the matrix relies on for "Tree 4 preserved" is
run by no CI step.

## Status vocabulary

- **ENFORCED** — an automated check fails if the invariant is violated.
- **PARTIAL** — enforced on part of the surface, or at a lower level than the matrix names.
- **MISSING** — the subject exists but nothing enforces the invariant on it.
- **NOT YET APPLICABLE** — the subject does not exist yet. Vacuously true, which is *not*
  the same as enforced, and must not be reported as coverage.

**Proves vs resembles** is judged strictly: evidence *proves* an invariant only if a violation
would make a check fail. Evidence that merely exercises the happy path *resembles* proof.

---

## Row-by-row findings

### 1. Episode remains inpatient-stay scoped

- **Implementation:** `prisma/schema.prisma` `model Episode` (admission-anchored:
  `admittedAt`, `serviceDate`, `facilityId`, `acceptedFacilityResponseId`);
  `packages/domain-contracts/src/episode.ts:24` `EPISODE_STATUSES = ["ACTIVE","DISCHARGED","CLOSED"]`.
- **Tests:** `tests/unit/contract-schema-enum-sync.test.ts:45` (maps `EpisodeStatus` ↔
  `EPISODE_STATUSES`, so drift fails); `tests/unit/episode-utilization-contracts.test.ts:51`;
  `tests/integration/s2-episode-persistence.test.ts`.
- **Level reached:** L2. **Status: ENFORCED.**
- **Proves or resembles:** **Proves one half.** The enum-sync test makes *status inflation* fail
  loudly — a real structural guard, and the exact mechanism by which Episode would be broadened
  into a longitudinal container. It does **not** guard scope creep by field addition: nothing
  fails if someone adds a longitudinal parent reference to the `Episode` model.
- **Contradiction:** none.
- **Fix authorized under IA-001?** Yes — a contract test asserting Episode's field set is
  "semantic acceptance tests" under §10 AUTHORIZED NOW.

### 2. Longitudinal journey is projection-first

- **Implementation:** `packages/domain-contracts/src/longitudinal.ts:678`
  `deriveLongitudinalCareJourneyProjection`.
- **Tests:** `tests/unit/longitudinal-contracts.test.ts` — "builds a projection-first
  longitudinal journey without a parent aggregate id" asserts `"id" in journey === false` and
  `"status" in journey === false`.
- **Level reached:** L1. **Status: PARTIAL.**
- **Proves or resembles:** **Resembles, on the decisive point.** The assertion proves the
  projection's *return value* carries no id or status. It does not prove a durable aggregate
  cannot appear: a `LongitudinalCareJourney` Prisma model could be added tomorrow and every test
  in the repository would still pass. The prohibition currently lives in IA-001 prose only.
- **Contradiction:** none, but note the matrix's stated evidence ("unit test: no aggregate
  id/status") describes exactly the weaker check that exists.
- **Fix authorized?** Yes — a schema-conformance test that fails if a prohibited model name
  appears in `prisma/schema.prisma` is test-only work, authorized under §10.

### 3. Planned discharge ≠ actual discharge

- **Implementation:** `DischargePlanVersionSchema` (carries `targetDischargeDate`, has no
  `actualDischargeAt`); `derivePendingDischarge` (`longitudinal.ts:440`).
- **Tests:** "validates the Day 1 discharge plan without treating target date as actual
  discharge"; **"does not infer actual discharge from the plan target date"** — evaluates at
  `day7`, the plan's own target date, and asserts `state === "PENDING"` and
  `sourceDischargeFactId === null`.
- **Level reached:** L1. **Status: ENFORCED.**
- **Proves or resembles:** **Proves.** The day-7 test is a true negative assertion at precisely
  the moment the collapse would occur. This is the strongest row in the matrix.
- **Fix authorized?** N/A.

### 4. Clinical LOC ≠ payer LOC ≠ availability ≠ preference ≠ actual

- **Implementation:** `deriveLevelOfCareProfile` (`longitudinal.ts:608`), which preserves five
  independently sourced dimensions.
- **Tests:** "keeps clinical level-of-care recommendation append-only and separate from
  payer/actual truth" — fixture deliberately **disagrees** across dimensions (clinical `IOP`,
  payer `IOP`, availability `UNAVAILABLE`, preference `IOP`, actual `INPATIENT`) and asserts all
  five survive distinctly.
- **Level reached:** L1. **Status: ENFORCED.**
- **Proves or resembles:** **Proves.** Testing the disagreement case rather than the agreement
  case is what makes this real; a collapsing implementation cannot pass it.
- **Contradiction:** none. LONG-GAP-04 (canonical LOC registry) remains open, so
  `recommendedLevelCode` is an open string domain — correct under the gap, but it means no test
  can yet assert cross-setting comparability.

### 5. Clinical readiness is a human decision

- **Implementation:** `ClinicalDischargeReadinessDecisionSchema` (`longitudinal.ts:223`);
  `evaluateLongitudinalAuthority` (`:391`) against a `LongitudinalAuthorityPolicy` (`:364`).
- **Tests:** "evaluates clinical authority from a configured policy instead of hard-coding a
  qualified role" — allows `CLINICAL_REVIEWER`, denies `INTAKE_COORDINATOR`.
- **Level reached:** L1. **Status: PARTIAL.**
- **Proves or resembles:** **Resembles.** It proves a policy evaluator returns the right answer
  for a fixture policy. It cannot prove a readiness decision is unrecordable without authority,
  because **no command path exists** — and none may exist until IA-002. The authority owner
  itself is LONG-GAP-03, still open, so there is nothing yet to bind the evaluator to.
- **Contradiction:** none, but the matrix's "authority/contract test" overstates what an L1 test
  can establish. Full proof is L3 and is correctly HELD.
- **Fix authorized?** Partially. A contract-level test that the decision schema *requires* a
  deciding actor is authorized. The binding proof is not, and should not be forced.

### 6. PendingDischarge is derived

- **Implementation:** `derivePendingDischarge` (`longitudinal.ts:440`).
- **Tests:** day-6 → `PENDING` with an open interval; day-9 → `ENDED_BY_DISCHARGE` with
  `sourceDischargeFactId`.
- **Negative evidence:** `grep -i "pendingDischarge" prisma/*.prisma` → **zero hits**, and
  `EpisodeStatus` is exactly `ACTIVE|DISCHARGED|CLOSED` (row 1). LSR-09 holds in the database.
- **Level reached:** L1, with a verified L2 absence. **Status: ENFORCED.**
- **Proves or resembles:** **Proves**, via the enum-sync test: adding `PENDING_DISCHARGE` to
  `EpisodeStatus` breaks `contract-schema-enum-sync.test.ts`.

### 7. TransitionReadiness is derived

- **Implementation:** `deriveTransitionReadiness` (`longitudinal.ts:557`).
- **Tests:** `BLOCKED` with `blockedComponents: ["DESTINATION"]`; `READY` with none.
- **Negative evidence:** no persisted master readiness field in `prisma/schema.prisma`. (The
  `PrescreenReadinessTarget` enum at `schema.prisma:1554` is prescreen packet readiness, a
  different and legitimately scoped concept — not a transition-readiness master state.)
- **Level reached:** L1. **Status: ENFORCED.**
- **Proves or resembles:** **Proves** the component decomposition, including a distinct
  `unknownComponents` channel so unknown cannot masquerade as satisfied. No test yet exercises a
  non-empty `unknownComponents`; that is a coverage gap, not a design gap.

### 8. Missing continuity data remains unknown under partial coverage

- **Implementation:** `deriveContinuityWindow` (`longitudinal.ts:626`).
- **Tests:** three, covering both directions — `PARTIAL` → `UNKNOWN` with empty
  `observedEventIds`; `COMPLETE_FOR_WINDOW` → `NONE_OBSERVED_WITH_COMPLETE_COVERAGE`;
  `OBSERVED` with the event id and `"score" in projection === false`.
- **Level reached:** L1. **Status: ENFORCED.**
- **Proves or resembles:** **Proves.** Both directions are covered, which is what LSR-17
  requires: the implementation cannot claim absence without explicit coverage, and cannot refuse
  to claim it when coverage is complete.

### 9. No causal blame from waiting state

- **Implementation:** `TransitionBarrierSchema` (`longitudinal.ts:117`) carries
  `waitingOnPartyRef`, `responsibilityKind`, `responsibleRoleCode` — operational fields — and is
  `.strict()`.
- **Tests:** "keeps barrier waiting-state evidence separate from causal blame" asserts
  `waitingOnPartyRef.id` is present and `"causedBy" in parsed === false`,
  `"primaryBarrier" in parsed === false`.
- **Level reached:** L0/L1. **Status: ENFORCED by construction; test evidence RESEMBLES.**
- **Proves or resembles:** This distinction was settled empirically. A throwaway probe confirmed
  that `TransitionBarrierSchema.parse({...barrierDay6, causedBy: "iop-provider-001"})` **throws**,
  because the schema is `.strict()`. So the *contract* genuinely forbids blame fields. But the
  *test* does not demonstrate that: `"causedBy" in parsed === false` passes merely because the
  fixture never carried the key, and would keep passing if `causedBy` were added to the schema as
  an optional field. The real guard is `.strict()`; the assertion is decoration on top of it.
- **Fix authorized?** Yes, and it is one line per rule: assert the rejection
  (`expect(() => Schema.parse({...valid, causedBy: "x"})).toThrow()`) rather than the absence.
  Authorized under §10 as semantic acceptance tests. **This is the single highest-value cheap fix
  in the audit** and applies to rows 9, 10 and every other `in`-operator negative.

### 10. No universal score

- **Implementation:** no score field anywhere. All 24 longitudinal schemas are `.strict()`.
- **Tests:** `"score" in profile === false` (LOC profile); `"score" in projection === false`
  (continuity window).
- **Negative evidence:** `grep -in "score" prisma/*.prisma` → **zero hits** across the entire
  schema.
- **Level reached:** L0/L1 + verified L2 absence. **Status: ENFORCED by construction; test
  evidence RESEMBLES** (same `in`-operator weakness as row 9).
- **Proves or resembles:** The database is clean and `.strict()` blocks the contract path. The
  assertions themselves do not prove rejection.

### 11. Tree 4 shell is preserved

- **Implementation:** `app/src/router.tsx`, `ClarityShell.tsx`, `AuthContext.tsx`.
- **Tests:** `app/src/router.test.tsx` — 7 tests (default route, deep links to Operating
  Assurance and RevOps, invalid route redirect, back/forward without reload, one session across
  areas, tenant/role context preserved) — jsdom, runs in CI via `npm run test:app`.
  `app/smoke/clarity-v01.spec.ts` — 10 Playwright tests across desktop and mobile projects.
- **Level reached:** L4 in jsdom (gated); L4 in a real browser (**not** gated).
- **Status: PARTIAL.**
- **Proves or resembles:** The matrix names "browser regression". A browser regression suite
  exists and passed locally on 2026-09-20 (20/20), but **no CI step runs it**: CI's `verify` job
  runs `npm run test:oa-e2e`, whose `testMatch` selects `operating-assurance.spec.ts` only. The
  shell suite runs solely under `npm --workspace app run smoke`, which CI never invokes. So the
  invariant is regression-protected by a human remembering to run it.
- **Contradiction:** the canon's Tree 4 lock is described as "LOCKED + VISUALLY PROVEN", which
  reads as stronger than an ungated local suite supports. The lock's own text is careful —
  it disclaims production, usability and assistive-technology conformance — but "visually proven"
  should be read as *proven once, on a date*, not *continuously protected*.
- **Fix authorized?** Yes. Adding the existing spec to CI is tooling work, authorized under §10,
  and requires no new test to be written.

### 12. Work uses governed truth

- **Implementation:** `app/src/features/access-snapshot/` reading
  `GET /api/access/cases/:caseKey` under a verified session.
- **Tests:** `tests/integration/access-api.test.ts` — 11 tests (authentication, tenant/not-found,
  path and query boundaries, exhaustive R3 role matrix, minimum-necessary response, prescreen
  selection matrix, episode/admission matrix, guidance invariants through the API, legacy and
  terminal cases, audit success, **audit fail-closed**).
  `app/src/features/access-snapshot/AccessSnapshot.test.tsx` — 30 tests.
- **Level reached:** L3 + L4. **Status: PARTIAL.**
- **Proves or resembles:** **Proves — for Access, and only Access.** The row as written implies a
  product-wide property. It is false elsewhere by design: Crisis Ops is mixed. `access`
  (read-only), `iop-reconciliation` and `legal` reach the API under a verified session; the
  remaining workspaces are local demo state driven by an unauthenticated demo-role picker that is
  **not an authorization boundary anywhere**.
- **Contradiction:** not between canon and code — `CURRENT_REPO_STATE.md` states the mixed
  reality plainly. The contradiction is inside the *matrix*, which presents a per-surface
  property as a global one.
- **Fix authorized?** Scoping the row is a documentation fix (authorized). Extending governed
  truth to other workspaces is Slice-level work, currently deferred by owner decision.

### 13. History reconstructs source events

- **Implementation:** no History surface exists. Temporal reconstruction exists only as pure
  functions over the fixture.
- **Tests:** `tests/data/longitudinal-day1-day39.ts` plus the derivations, which answer
  time-sliced questions at day 6, 7, 9, 16 and 39 deterministically.
- **Level reached:** L1. **Status: PARTIAL.**
- **Proves or resembles:** The *capability* to reconstruct a timeline from source events is
  proven in pure logic — genuinely, and this is the substance the matrix cares about. The
  *surface* does not exist, so nothing proves a UI reconstructs rather than narrates.
- **Fix authorized?** L1 breadth: yes. The UI is Slice 1, authorized-conditional under §10 but
  explicitly deferred by the owner.

### 14. Explore does not own truth

- **Implementation:** none. No Explore surface.
- **Level reached:** none. **Status: NOT YET APPLICABLE.**
- **Proves or resembles:** vacuously true. **This must not be counted as coverage.**

### 15. Ask Clarity cites governed sources

- **Implementation:** none. A targeted search
  (`grep -rlE "\bllm\b|anthropic|openai|claude-|gpt-" packages/*/src app/src`) returns **zero
  matches**. There is no AI runtime in this repository.
- **Level reached:** none. **Status: NOT YET APPLICABLE.**

### 16. AI cannot establish decision authority

- **Status: NOT YET APPLICABLE**, for the reason in row 15.
- **Proves or resembles:** vacuously true because no AI surface exists. Absence of a capability
  is not enforcement of a constraint on it. When Ask Clarity is built, this row starts at MISSING,
  not at ENFORCED.

### 17. AI command cannot bypass domain service

- **Status: NOT YET APPLICABLE**, same reasoning as rows 15–16.
- **Note:** the architectural precondition is in place and independently enforced — only
  `packages/case-repository` has a runtime `@prisma/client` dependency, so *any* future caller,
  AI or not, must pass through a gateway. That is a real structural protection, but it is
  enforcement of the Prisma boundary, not of an AI-specific rule.

### 18. Cross-tenant traversal is blocked

- **Implementation:** tenancy in every repository predicate; `packages/case-repository`.
- **Tests:** `tests/integration/tenant-isolation.test.ts` — 7 tests, including **"a cross-tenant
  miss is indistinguishable from a nonexistent case"** and "audit events remain tenant-scoped";
  `assurance-tenant-isolation.test.ts`; `od6-rls.test.ts`; the access-api tenant/not-found test.
- **Level reached:** L2 + L3. **Status: ENFORCED.**
- **Proves or resembles:** **Proves.** The non-revealing-miss assertion is the correct one —
  it tests the information leak, not just the access denial.
- **Scope caveat:** proven for existing persisted aggregates. **Nothing tests tenancy for
  longitudinal objects**, because they have no repository. LSR-16 (relationships inherit
  provenance, timing and authorization) is therefore untested — there is no relationship
  projection to test. This is the row most likely to regress the moment IA-002 opens
  persistence, and the reconciliation must carry a tenancy clause per object.

### 19. Unknown is not guessed

- **Implementation:** continuity window states; Access guidance projection; Access Snapshot
  presentation layer.
- **Tests, across three levels:** L1 — the two continuity coverage tests (row 8). L3 —
  access-api "PRESCREEN SELECTION MATRIX & EMPTY VS LOADED". L4 — "distinguishes packet evidence
  that was not supplied from evidence that is empty", "does not present an empty attention list
  as a clearance", "warns instead of guessing when more than one encounter is active", "does not
  fabricate a phase when the contract reports none".
- **Level reached:** L1 + L3 + L4. **Status: ENFORCED.**
- **Proves or resembles:** **Proves**, and this is the best-covered invariant in the matrix —
  the only one defended at contract, API and UI levels simultaneously.

### 20. UI does not present candidate as assignment

- **Implementation:** `app/src/features/access-snapshot/AccessSnapshot.tsx:279` renders a
  "Candidate / Not assigned" badge; `NextWorkCandidate.nonBinding` in the contract.
- **Tests:** `AccessSnapshot.test.tsx:578` "labels every candidate as non-binding and never
  implies an assignment"; `:615` asserts the badge appears once per candidate;
  "explains suppressed work in plain language".
- **Level reached:** L4. **Status: PARTIAL.**
- **Proves or resembles:** **Proves for Access.** No other workspace has been audited against
  this rule, and several present locally-invented work lists. Same scoping problem as row 12.

### 21. Source correction preserves history

- **Implementation:** supersession implemented in `evidenceGateway`, `prescreenGateway`,
  `assuranceGateway`, `utilizationReviewGateway`, `revOpsRateReleaseGateway`,
  `episodePersistenceGateway`; append-only audit with the restricted-identifier guard.
- **Tests:** `tests/integration/audit-persistence.test.ts` — 6 tests including "earlier audit
  events are unchanged by later mutations (append-only)", "a failing audit write rolls back case
  creation entirely", and restricted-identifier rejection at depth;
  `evidence-review-and-contradictions.test.ts`; `assurance-review-safety.test.ts`.
- **Level reached:** L2 + L3 for existing domains. **Status: ENFORCED for existing domains;
  MISSING for longitudinal.**
- **Proves or resembles:** For existing domains, **proves**. For longitudinal: the contract
  carries `supersedesRecommendationId`, and the test asserts
  `recs[1].supersedesRecommendationId === recs[0].id` — but that is an assertion **about the
  fixture**, not about supersession behavior. No longitudinal correction or supersession
  *behavior* is exercised anywhere: not for readiness decisions, not for barriers, not for
  discharge facts.
- **Contradiction:** LSR-08 requires readiness to be append-only with supersession, and IA-001
  §5.3 requires every proposed persistence object to state its correction/supersession behavior.
  Neither is currently demonstrable for longitudinal objects. **This is a hard prerequisite for
  IA-002** and is named as such in the reconciliation that follows this audit.
- **Fix authorized?** Yes at contract level — pure supersession-chain derivations and their tests
  are authorized under §10. The persisted proof is correctly held.

---

## Cross-cutting findings

**F-1 — `.strict()` is doing the real work, and the tests do not say so.** All 24 longitudinal
schemas are `.strict()`, which structurally rejects forbidden fields (`causedBy`, `score`,
`primaryBarrier`) rather than silently stripping them. This was confirmed empirically, not
assumed. The no-collapse tests, however, are written as `"field" in parsed === false`, which
proves only that the fixture lacked the field. Rewriting them as rejection assertions would make
the tests prove what the schemas already enforce. Cheap, authorized, high value.

**F-2 — the matrix generalizes from Access to the product.** Rows 12 and 20 read as global
properties. They hold for the Access workspace and are false elsewhere by design. The matrix
should carry an explicit scope column; asserting them globally would be an untrue claim.

**F-3 — no structural guard against prohibited persistence.** Rows 2, 6 and 7 name concepts the
canon PROHIBITS from persistence. Today `prisma/schema.prisma` is clean — verified by direct
search. But only row 6 has an automated tripwire (the `EpisodeStatus` enum-sync test, which
catches it incidentally). A `LongitudinalCareJourney` model or a `transitionReadiness` column
could be added and no check would fail. A schema-conformance test is authorized and should land
**before** IA-002, not after.

**F-4 — the browser regression the matrix relies on is not gated.** Row 11. The suite exists and
passes; CI does not run it.

**F-5 — longitudinal has no tenancy or correction evidence, because it has no repository.** Rows
18 and 21. This is correct and expected pre-persistence, but it means two of the matrix's
strongest existing protections do not yet extend to the layer IA-002 would open. Every object in
the forthcoming reconciliation must carry an explicit tenancy clause and an explicit
correction/supersession clause, and those must be provable at L2 before persistence is ratified.

**F-6 — four rows are vacuously true and must never be reported as coverage.** Rows 14–17. When
Explore and Ask Clarity are built, those rows begin at MISSING.

---

## Authorization check on every proposed fix

Per IA-001 §10, all remediation identified by this audit falls under **AUTHORIZED NOW** —
"semantic acceptance tests", "pure deterministic projections", and repository tooling. None of it
requires Prisma, migrations, commands, APIs, mutating UI or AI execution. **No remediation was
performed in this pass**; this document is the evidence baseline, and the fixes are recorded for
a separate, explicitly scoped slice.

Recommended order, highest value first: F-1 (rewrite negative assertions as rejection
assertions), F-3 (schema-conformance tripwire for prohibited models), F-4 (gate the existing
browser suite in CI), F-2 (add a scope column to the matrix), then longitudinal supersession
derivations for F-5.

## What this baseline does NOT claim

Production readiness, HIPAA compliance, PHI readiness, approved clinical or legal rules, working
external integrations, deployment, real-user usability (no row reaches L5), or production
evidence (no row reaches L6). No row above L4 is claimed for any invariant. The tests cited were
executed on 2026-09-20 at the commit named in this header; that is dated evidence, not a standing
claim.

## Evidence run

`DATABASE_URL=<throwaway placeholder> npm run verify` — lint `eslint .` 0 errors;
typecheck `tsc --noEmit && tsc -b app/tsconfig.json` clean; `prisma validate` passed;
unit `vitest run --config vitest.unit.config.ts` **52 files / 578 tests passed**;
integration `vitest run --config vitest.integration.config.ts` on an ephemeral database
**34 files / 295 tests passed**. `npm run test:app` and Playwright were not run in this pass and
are cited above from their dated 2026-09-20 records.
