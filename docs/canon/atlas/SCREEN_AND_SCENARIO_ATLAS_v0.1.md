# Screen & Scenario Atlas v0.1

**Derived from:** [Master Tree v2.1](../reconstruction/CLARITY_MASTER_TREE_v2.1.md) §§8–11
**Date:** 2026-09-20 · **Audited at:** `main` `4fbbf43`
**Status:** Derived artifact. **Not** authorization to build the simulator.

State legend: **✓** handled and tested · **~** handled, untested · **·** not handled · **n/a**

## Surface inventory

| Surface | Source of truth | Happy | Missing | Unknown | Contradictory | Stale | Unauthorized | Ext. wait | Superseded | Failed | Mobile | Scenarios |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Access Snapshot** | `GET /api/access/cases/:caseKey` `[R]` | ✓ | ✓ | ✓ | ✓ | · | ✓ | ~ | · | ✓ | ✓ | 30 unit |
| **Operating Assurance** | assurance API `[R]` | ✓ | ~ | ~ | ✓ | ✓ | ~ | · | ✓ | ~ | · | e2e in CI |
| **Operating Workbook** | workbook API `[R]` | ✓ | · | · | · | · | ~ | · | · | ~ | · | unit |
| **RevOps** (+ Pricing, Receipt Export) | rev-ops API `[R]` | ✓ | · | · | ~ | · | ~ | · | ✓ | ~ | · | unit |
| **IOP Reconciliation** | iop API `[R]` | ✓ | ~ | ~ | ✓ | · | ~ | · | ✓ | ~ | · | unit |
| **Legal Status** | `apiPrincipal` + rule sets `[R][P]` | ✓ | · | · | · | · | ~ | · | · | · | · | unit |
| **Case Queue** | local seed `[P]` | ~ | · | · | · | · | · | · | · | · | ~ | smoke |
| **Case Overview** | local `[P]` | ~ | · | · | · | · | · | · | · | · | ~ | smoke |
| **Guided Intake** | local `[P]` | ~ | · | · | · | · | · | · | · | · | · | smoke |
| **Medical Necessity** | local `[P]` | ~ | · | · | · | · | · | · | · | · | · | smoke |
| **Benefits / Auth Readiness** | local services `[P]` | ~ | · | · | · | · | · | · | · | · | · | unit |
| **Evidence Review** | local services `[P]` | ~ | · | · | ~ | · | · | · | · | · | · | unit |
| **Packet / Routing** | local `[P]` | ~ | · | · | · | · | · | ~ | · | · | · | smoke |
| **Bedboard / Command Center** | local `[P]` | ~ | · | · | · | · | · | · | · | · | ~ | smoke |
| **Custody Ledger** | local `[P]` | ~ | · | · | · | · | · | · | · | · | · | unit |
| **Training & SOPs** | local `[P]` | ~ | · | · | · | · | · | · | · | · | · | smoke |
| **Learning & Practice components** | `learning-practice-service` `[R]` | ~ | · | ~ | ~ | · | · | · | ✓ | · | · | unit |
| **Tree 4 acceptance flows** | shell + routes `[P][R]` | ✓ | n/a | n/a | n/a | · | · | · | · | ✓ | ✓ | **10 browser executions, CI-gated** |
| **Mock Admit / Product Studio** | local `[P]` dev-only | ~ | · | · | · | · | · | · | · | · | · | unit |
| **History / Explore / Flow / Ask Clarity / Guide / Collaborate** | — `[K]` | · | · | · | · | · | · | · | · | · | · | none |

**Reading:** exactly **one** surface — Access Snapshot — handles the uncertainty grid to any real
depth. Every column it leaves blank (`stale`, `superseded`) is a column no surface handles.

## Failure-state coverage across the product

| State | Surfaces handling it | Assessment |
|---|---|---|
| loading / empty / happy | most | adequate |
| missing vs empty | Access Snapshot only | **P0** — the distinction the canon is built on |
| unknown | Access Snapshot, continuity projections | **P0** elsewhere |
| contradictory | Access Snapshot, Assurance, IOP, `ContradictionGroup` | partial |
| unauthorized / forbidden | API-backed surfaces (403/404 non-revealing) | adequate where governed |
| stale source | Assurance (`STALE_SOURCE`) only | **P1** |
| superseded | Assurance, RevOps, IOP, L&P | partial |
| external wait | Access Snapshot (~) | **P1** |
| session expiry / scope change | Tree 4 F4, F6 — target behavior can be designed with mocked auth/scope state; production flow absent | **Downstream P0** |
| unknown commit result | nowhere; target reconciliation semantics are designable | **Downstream P0** |
| reconciliation required | IOP only | P2 |

## Scenario coverage

### Tree 4 proof flows — the only cross-module acceptance specification

**UPDATED 2026-09-20** by the Tree 4 Acceptance Reconciliation (PR #139) —
[TREE_4_ACCEPTANCE_CONTRACT_v0.1.md](../acceptance/TREE_4_ACCEPTANCE_CONTRACT_v0.1.md).
The recommendation to "automate F1–F6" was revised before implementing it: **only one flow is
fully executable, two are partially executable, and three remain target-only.** Shell recovery
is recorded separately as `SHELL-RECOVERY-01` because unknown-route recovery does not exercise
session expiry.

| | Flow | Status vs current `main` | Automated? |
|---|---|---|---|
| F1 | Cases → Case → Clinical → back | `EXECUTABLE_NOW` *(prototype surfaces only)* | **Yes** — proves prototype round trip |
| F2 | Clinical Review → complete → return | **`TARGET_ONLY`** — no multi-Case Review workspace exists | **No, and must not be** |
| F3 | Case → Assurance Finding → return | `PARTIALLY_EXECUTABLE` — area nav only | **Partial** |
| F4 | Case → facility change → invalidated → new scope | **`TARGET_ONLY`** — no facility/scope switcher exists | **No, and must not be** |
| F5 | Case → RevOps → remembered Crisis Ops context | `PARTIALLY_EXECUTABLE` — shell navigation works; Case is not restored | **Partial** |
| F6 | Session expired → sign in → revalidated context | **`TARGET_ONLY`** at the browser/product layer — backend expiry evidence is separate | **No F6 browser test** |

**Four of the six unmet requirements reduce to one missing capability: Case-context navigation
that survives a route change.** A navigation concern, not persistence. F6 also remains blocked on
frontend expiry detection and re-authentication/revalidation wiring.

`app/smoke/tree4-acceptance.spec.ts` now covers F1 fully, the executable portion of F3 and F5,
and separate shell recovery — 5 tests × desktop + mobile. The existing smoke suite **is now gated in CI** as
*"Shell smoke E2E"*, and the default Playwright config was corrected: it had been selecting
`operating-assurance.spec.ts` too (**26 tests, not 20**), three of which need an API server that
config never starts.

`app/src/router.test.tsx` covers deep links, back/forward, session continuity and tenant/role
preservation in jsdom — adjacent to F5/F6 but not equal to them. `app/smoke/clarity-v01.spec.ts`
(20 tests, desktop + mobile) is the closest browser evidence and **no CI step runs it**.

### Day 1 → Day 39 longitudinal scenario

`[R]` at L1 only — `tests/data/longitudinal-day1-day39.ts` plus 30 unit tests. Answers day 6, 7, 9,
16, 39 deterministically, including `UNKNOWN` reachability after Slice 0.5. **No surface renders
it**, so the scenario the canon treats as the proof case has no user-facing form.

### Scenario families with no coverage at all

Missing information · conflicting information · alternative LOC · payer delay · facility decline ·
transport failure · clinically ready with no capacity · dementia/memory-care transition · family
unavailable · patient preference disagreement · readmission · cross-facility scope change ·
permission loss · external source outage · multiple destination attempts · coverage ends before
transition · discharge with unknown follow-up · second episode for the same person.

**18 of the 20 scenario families in Master Tree v1.0 §U have zero coverage.** The two with partial
coverage are the straight referral path (smoke) and the Day 1→39 fixture (unit). This is a
coverage-planning gap, not a blanket simulator blocker; the first simulator should select and label
its scenario subset.

## P0 blockers before an Experience Simulator is worth building

The dependency map reduces the apparent P0 list to root contracts that must be resolved before
simulator design. Downstream workspace and scenario gaps may be designed with synthetic/mock target
state after those contracts are settled.

1. ~~**The Tree 4 proof flows are not automated**~~ **PARTIALLY CLOSED 2026-09-20.** F1 is
   automated; F3 and F5 are automated to their executable boundary; **F2, F4 and F6 remain
   `TARGET_ONLY` at the browser/product layer and cannot be automated without fabricating
   surfaces or expiry behavior.** The simulator's primary
   content is now *classified* rather than merely unverified.
2. **Authority, ownership, truth-state, cross-Case query, and CaseContext contracts** must be
   resolved before detailed simulator design.
3. **Session expiry, scope change, and unknown commit result** are target failure states that can
   be modeled with mock providers; their production implementations remain separate gates.
4. **18 of 20 scenario families have no coverage** — prioritize a declared subset rather than
   treating the aggregate count as an architecture blocker.
5. **The Day 1→39 scenario has no renderer** — a simulator design gap, not a production prerequisite
   for the simulator.
6. **Jobs with no home** (UR, supervisor review, knowledge stewardship) are target workspace gaps;
   discharge/transition remains blocked on external longitudinal decisions.

## Recommendation

Do **not** build detailed simulator interactions until the root semantic and topology contracts are
resolved. The Platform and Screen Atlases expose downstream gaps that can then be represented as
explicit target designs; they are not twelve independent implementation mandates.

The cheapest next step that shrinks the list: **keep executable Tree 4 boundaries and separate
shell recovery gated in CI while implementing the missing F2/F4/F6 surfaces and flows.** That is
test and tooling work under IA-001 §10, requires no new authorization, and converts the only
cross-module acceptance spec Clarity has from prose into bounded evidence.
