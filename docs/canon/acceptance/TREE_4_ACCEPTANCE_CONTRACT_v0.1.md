# Tree 4 Acceptance Contract v0.1

**Date:** 2026-09-20 · **Audited at:** `main` `4fbbf43`
**Governs:** the six Tree 4 proof flows, previously recorded only as prose inside
`CANON_RECONSTRUCTION_PASS_01_v0.1.md` §1.7.
**Trace chain:** Master Tree v2.1 §0 → Screen & Scenario Atlas → **this contract** →
`app/smoke/tree4-acceptance.spec.ts` → CI step *"Shell smoke E2E"*.

## The distinction this document exists to enforce

> **`target prose → Playwright mock → "proven"` must never happen.**

Three acceptance classes, and they are not interchangeable:

| Class | Meaning | May be automated? |
|---|---|---|
| **Current executable acceptance** | Behavior Clarity can genuinely demonstrate against governed truth today | Yes |
| **Prototype acceptance** | Real browser evidence over local/demo state behind the unauthenticated role picker. Useful as shell regression; **not** governed production behavior | Yes, if labelled `[prototype]` |
| **Target acceptance** | Behavior the architecture requires and the implementation cannot perform | **No.** No fixture, localStorage shortcut, fake UI or test-only route may be created to make it green |

A target-only flow stays a **named unmet acceptance requirement** until the product earns it.

## F1–F6 reconciliation against current `main`

| | Intended user job | Current surface(s) | Source of truth | Governed / prototype / absent | Existing coverage | Exact missing behavior | Status | What automating it proves |
|---|---|---|---|---|---|---|---|---|
| **F1** | Work a Case's clinical lane and return to the queue | Case Queue → Case Overview → Medical Necessity | `app/src/domain/seed.ts` local state | **Prototype** | smoke renders Case Queue; no round-trip assertion | none — the flow works | **EXECUTABLE_NOW** | Prototype shell round trip **only** |
| **F2** | Review a queue of Cases awaiting clinical review, complete one, return | **none** — no multi-Case Clinical Review workspace exists | — | **Absent** | none | The entire entry surface. Tree 5 leaves "Review" conditional and it was never admitted | **TARGET_ONLY** | — (no test written) |
| **F3** | From a Case, inspect an assurance finding, return to that Case | `/` ↔ `/assurance` area navigation | Crisis Ops local; Assurance governed API | **Mixed** | router test covers area navigation in jsdom | Case → *specific finding* link; return to *the originating* Case | **PARTIALLY_EXECUTABLE** | Area round trip only |
| **F4** | Change facility scope and see the Case invalidated, landing in the new scope's queue | **none** — no facility/scope switcher anywhere in `app/src` | — | **Absent** | none | The entire trigger. Scope is principal-derived with no UI to change it | **TARGET_ONLY** | — (no test written) |
| **F5** | Leave a Case for Revenue Operations and come back to the same Case | `/` ↔ `/rev-ops` | RevOps governed API; Crisis Ops local | **Mixed** | router test covers navigation + tenant/role preservation | **"Remembered Case context."** `selectedCaseId` is `useState("case-004")` with no persistence, so the route change unmounts it | **PARTIALLY_EXECUTABLE** | Deep-link round trip only |
| **F6** | Recover from an expired session and resume the same Case | `SignInForm`, `AuthProvider`, invalid-route redirect | `AuthSession` governed | **Mixed** | router test keeps one session across areas | **Expiry detection** (`AuthContext` has login/logout, no 401/expiry handler) and **Case-context revalidation** | **PARTIALLY_EXECUTABLE** | Shell recovery from an unknown route only |

**Result: 1 EXECUTABLE_NOW, 3 PARTIALLY_EXECUTABLE, 2 TARGET_ONLY, 0 STALE_OR_INVALID.**

## Amendments to the Tree 4 contract

Tree 4 is recorded as "LOCKED + VISUALLY PROVEN". Reconciled against Master Tree v2.1, two flows
need amending rather than preserving because Tree 4 once said so:

- **F2 is amended.** It presumes a Clinical Review workspace as a peer surface. Master Tree v2.1 §5
  classifies Crisis Ops as an `APPLICATION` whose review work is Case-scoped, and Tree 5 leaves a
  multi-Case Review workspace **conditional on proving a distinct repeated multi-Case human-review
  job**. F2 therefore is not an acceptance requirement for the current architecture; it is an
  acceptance requirement **for a workspace that has not been admitted.** Restated:
  > *If* a multi-Case Review workspace is admitted, it must support review → Case/Clinical →
  > complete → return without losing queue position.
- **F3 and F5 are sharpened.** Both say "return to Case context". Neither Tree 4 nor any later
  document said whether Case context is *application state* or *governed state*. Master Tree v2.1
  settles it: Crisis Ops is an application that **owns no canonical state**, so "remembered Case
  context" is a navigation concern, not a persistence concern — and must not be implemented by
  persisting a Case selection into governed storage.

**F1, F4 and F6 stand as written.** F4 and F6 are unmet, not invalid.

## What the existing smoke suite proves — and does not

`app/smoke/clarity-v01.spec.ts`, 10 tests × desktop + mobile = **20 browser executions**, now run
in CI by the step *"Shell smoke E2E"*.

**Proves:**
- current Work/prototype browser behavior renders and is operable;
- desktop and mobile shell regression at 1440×1000 and 390×844;
- existing local/prototype workflows: case queue, custody verification, packet generation, routing
  updates, command centre lanes and clocks, bedboard override gating, role-scoped workspaces,
  training SOPs, persona focus strips, mock admit cohort filtering.

**Does NOT prove:**
- **governed Access behavior** — no test asserts against `GET /api/access/cases/:caseKey`; the
  suite starts vite only, with no API server;
- **the Tree 4 F1–F6 flows**, except exactly what `tree4-acceptance.spec.ts` asserts;
- **authorization correctness** — every surface it touches sits behind the unauthenticated
  demo-role picker, which is not an authorization boundary;
- **production readiness**, HIPAA compliance, PHI readiness, or clinical/legal approval.

### A correction this slice produced

The project state recorded `npm --workspace app run smoke` as **"20/20 passed"**. The default
Playwright config selected `operating-assurance.spec.ts` as well — **26 tests**, three of which
need an API server that config never starts. The config now excludes it explicitly, so the command
selects 20 and the two suites stay separate, as they must: they prove different things and need
different servers.

## Automated acceptance — provenance per flow

`app/smoke/tree4-acceptance.spec.ts`. Every test carries its acceptance ID, surfaces crossed,
governed/prototype boundary, the regression it would catch, and the maturity it demonstrates.

| Test | Flow | Maturity demonstrated | Regression it catches |
|---|---|---|---|
| `F1 [prototype]` | F1 full | `PROTOTYPE` | Workspace round trip breaks, or the Case selected on the way in is not the Case marked `.selected-row` on return |
| `F3 [partial]` | F3 area half | `PARTIAL` | Crisis Ops ↔ Assurance navigation breaks |
| `F5 [partial]` | F5 navigation half | `PARTIAL` | `/rev-ops` deep link or return to a usable Cases surface breaks |
| `F6 [partial]` | F6 recovery half | `PARTIAL` | An unknown route dead-ends instead of recovering |

**No test exists for F2 or F4**, and none may be written until their surfaces exist.

## Unmet acceptance requirements — carried forward

| ID | Requirement | Blocked on |
|---|---|---|
| **F2** | Multi-Case Review workspace round trip | Workspace not admitted (Tree 5 conditional) |
| **F3-b** | Case → specific assurance finding → return to *that* Case | Case↔Finding link; Case-context navigation |
| **F4** | Facility scope change invalidates the Case and lands in the new scope | **No facility/scope switcher exists** |
| **F5-b** | Return from RevOps to the *same* Case | Case-context navigation |
| **F6-a** | Session **expiry** detection | No 401/expiry handler in `AuthContext` |
| **F6-b** | Case-context revalidation after re-auth | Case-context navigation |

Four of six reduce to **one missing capability: Case-context navigation that survives a route
change.** It is a navigation concern, not persistence, and must not be solved by writing Case
selection into governed storage.

## Honesty statement

This slice added no product behavior. One Playwright config exclusion, one CI step, four browser
tests over behavior that already existed, and this contract. Nothing here ratifies IA-002,
ADR-0026, OD-A, OD-B, OD-C or OD-D; the persistence boundary is unchanged. A green CI run proves
the prototype shell behaves and four partial flows navigate — it proves nothing about governed
behavior, authorization or production readiness.
