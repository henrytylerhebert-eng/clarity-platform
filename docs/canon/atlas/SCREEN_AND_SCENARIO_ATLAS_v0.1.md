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
| session expiry / scope change | Tree 4 F4, F6 — **not automated** | **P0** |
| unknown commit result | nowhere | **P0** |
| reconciliation required | IOP only | P2 |

## Scenario coverage

### Tree 4 proof flows — the only cross-module acceptance specification

| | Flow | Automated? |
|---|---|---|
| F1 | Cases → Case → Clinical → back | **No** |
| F2 | Clinical Review → complete → return | **No** |
| F3 | Case → Assurance Finding → return | **No** |
| F4 | Case → facility change → invalidated → new scope | **No** |
| F5 | Case → RevOps → remembered Crisis Ops context | **No** |
| F6 | Session expired → sign in → revalidated context | **No** |

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
coverage are the straight referral path (smoke) and the Day 1→39 fixture (unit).

## P0 blockers before an Experience Simulator is worth building

1. **The Tree 4 proof flows are not automated** — the simulator's primary content is unverified.
2. **Session expiry and scope change are untested** (F4, F6) and are the two failure modes most
   likely to corrupt a demo.
3. **`unknown commit result` is handled nowhere** — the state most likely to produce a false
   success.
4. **18 of 20 scenario families have no coverage** — a scenario simulator with nothing to simulate.
5. **The Day 1→39 scenario has no renderer.**
6. **Jobs with no home** (UR, supervisor review, knowledge stewardship) would appear in a Screen
   Atlas as blanks, not as screens.

## Recommendation

Do **not** build the simulator from these Atlases yet. The Platform Atlas exposes six P0 topology
gaps and this one exposes six P0 coverage gaps — twelve unexplained layers, which is precisely the
"discovering a missing product layer halfway through" failure the Atlas pass exists to prevent.

The cheapest next step that shrinks the list: **automate Tree 4's F1–F6 and gate the existing
browser suite in CI.** That is test and tooling work under IA-001 §10, requires no new
authorization, and converts the only cross-module acceptance spec Clarity has from prose into
evidence.
