# Experience Atlas v0.1

**Derived from:** [Master Tree v2.1](../reconstruction/CLARITY_MASTER_TREE_v2.1.md) §§3, 5, 8, 9
**Date:** 2026-09-20 · **Audited at:** `main` `4fbbf43`
**Status:** Derived artifact. Ratifies nothing.

Chain: `User/Role → Job → Workspace → Object → View → Action → Handoff → Representation`.
Representations are listed at their **actual maturity**, never as if implemented.

## Authority caveat governing every row

`USER_ROLES` (13) plus per-endpoint allow-lists is what exists **[R]**. The
`SEE / DO / REVIEW / DECIDE / OWN` grammar is **[K] CANON_ONLY**, and **assignment/ownership is
`[X] ABSENT`** — so every "Handoff" below is a *workflow* handoff, not a modelled transfer of
ownership. No row may be read as proving an authority model.

## Work — the only representation with an implementation

| Role | Job | Workspace | Object | View | Action | Handoff | Maturity |
|---|---|---|---|---|---|---|---|
| Intake coordinator | Take a referral, open a Case | Crisis Ops → Cases | `BehavioralHealthCase` | Queue, Case Overview | create, update | → clinical review | `[P]` PROTOTYPE (queue is local state) |
| Intake coordinator | Run a prescreen | Crisis Ops → Guided Intake | `PrescreenEncounter` | draft → attest → submit | attest, submit, supplement | → qualified reviewer | `[R]` API exists; UI `[P]` |
| Clinical reviewer | Establish medical necessity | Crisis Ops → Clinical | `MedicalNecessityReview` | review | record decision | → placement | `[P]` PROTOTYPE |
| Legal reviewer | Establish legal status/custody | Crisis Ops → Legal | `LegalStatusRecord`, `CustodyEvent` | status, ledger | record, issue instrument | → placement | `[R]` API-backed |
| Benefits specialist | Verify coverage | Crisis Ops → Coverage | `InsuranceCoverage`, `BenefitVerification` | verification | verify, attach proof | → authorization | `[P]` PROTOTYPE |
| Authorization specialist | Obtain authorization | Crisis Ops → Coverage | `Authorization` | readiness | request, record | → placement | `[P]` PROTOTYPE |
| Placement/transport | Find a receiving facility | Crisis Ops → Placement | packet, facility response | routing, bedboard | send, record response | → handoff | `[P]` PROTOTYPE |
| Any authorized reader | Understand a Case now | Access Snapshot | Access read model | snapshot, journey rail, signals, candidate work | **read only** | — | `[R]` IMPLEMENTED |
| Utilization reviewer | Defend the stay | *(no application)* | `Episode`, `EpisodeAuthorization`, `AuthorizationDayDecision` | — | — | — | ⚠ **`[R]` context, no workspace** |
| Compliance reviewer | Close the assurance loop | Operating Assurance | `AssuranceCase`, evaluations | case, history | submit evidence, evaluate, review | → correction | `[R]` IMPLEMENTED |
| Finance / rev-ops | Reconcile a period | Revenue Operations | `RevOpsWorkspace`, IOP import | workspace, comparison, month close | command, close, export receipt | → finance | `[R]` IMPLEMENTED |
| Every role (observed) | Be observed, recognized, coached | *(components only)* | observation, recognition candidate | — | acknowledge, add context, **contest** | → supervisor review | `[R]` service, `[P]` UI |
| Supervisor | Review a recognition/coaching candidate | *(no workspace)* | recognition candidate | — | resolve contest, dismiss | — | ⚠ **`[R]` service, no workspace** |

## Representations at their actual maturity

| Representation | Maturity | What a user can do today | Blocking dependency |
|---|---|---|---|
| **Work** | `PARTIAL` | 8 API-backed surfaces; 19 prototype | governed cross-Case query for Cases |
| **History** | `CANON_ONLY` | nothing; substrate (`AuditEvent`, `GovernedEvent`) is real | as-of read models |
| **Explore** | `CANON_ONLY` | nothing | relationship projection with provenance + tenancy |
| **Flow** | `CANON_ONLY` | nothing | **governed cross-Case query — does not exist** |
| **Ask Clarity** | `CANON_ONLY` | nothing | query/trace contracts; **zero AI runtime** |
| **Learn** | `PROTOTYPE` | Training & SOPs screen | L&P workspace |
| **Guide** | `CANON_ONLY` | nothing | patient/family auth boundary |
| **Collaborate** | `CANON_ONLY` | nothing | partner auth boundary |

## Jobs with no home — the Atlas's main finding

1. **Utilization review.** A fully implemented bounded context with **no workspace**. A UR nurse
   cannot do UR work in Clarity today.
2. **Supervisor review of recognition/coaching.** The service models `HUMAN_REVIEW` candidates and
   a `CONTEST` → `RESOLVE_CONTEST` path; there is no surface for the supervisor who must resolve it.
3. **Knowledge stewardship.** `RuleSet` has `approvedBy` / `approvedAt`; no one can approve a rule
   set through any surface.
4. **Discharge planning / transition.** Contract-only; no job, no workspace, no objects persisted.
5. **Partner participation.** Referral is one-directional; receiving facilities have no seat.

## Handoff chains that exist end-to-end today

Only one: **referral → prescreen → (qualified review) → legal → placement**, and it is
`[P]` PROTOTYPE except for prescreen's API and the legal surface. Every other chain terminates at
a job with no home.
