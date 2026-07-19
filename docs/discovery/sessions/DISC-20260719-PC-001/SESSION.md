---
status: OWNER_REVIEW
discovery_id: DISC-20260719-PC-001
version: 0.1.0
data_boundary: synthetic only
---

# Session Record

## Discovery Contract

| Field | Value |
|---|---|
| Workflow | Protective-custody referral through inpatient behavioral admission and episode-owned UR |
| Human owner | Human project owner |
| Facilitator and recorder | Codex, acting as documentation facilitator for the synthetic exercise |
| Participants | Officer, physicians, nurses, intake, transport, benefits, social-work, UR, and LPN role labels from the source scenario |
| Authority | Owner-provided scenario; existing Clarity contracts and governance docs for repository boundaries |
| Scope | Intake, legal-source capture, clinical evidence, medical screening, MAR intake, benefits verification, packet routing, custody, admission, handoff, episode-owned UR, corrections, and derived coverage |
| Non-goals | Legal validity, clinical diagnosis, payer adjudication, medication authorization, autonomous placement, autonomous admission, production integration, and deployment |
| Repository boundary | Documentation only |
| Data boundary | Synthetic only |
| Facility timezone | `America/Chicago` from synthetic facility configuration `tzcfg-olf-20260719-v1`; this is an owner-authorized input, not browser/server/location inference |
| Session status | `OWNER_REVIEW` |

## Authority And Review Matrix

| Domain | Working authority in this exercise | Required promotion reviewer |
|---|---|---|
| Product/workflow scope | Human project owner | Human project owner |
| Clinical facts and safety | Synthetic clinical role labels | Qualified clinical reviewer |
| PEC/custody meaning | Synthetic legal/authority role labels | Qualified legal reviewer |
| Benefits and Medicare narrative | Susan Lucci role label and owner scenario | Benefits/UR reviewer |
| Medication/MAR | Judy Booty role label and receiving-facility policy | Prescriber, pharmacy, or facility medication reviewer |
| Facility acceptance and placement | April Ludgate / Dr. Angela Martin role labels | Receiving-facility authorized reviewer |
| Technical mapping | Existing Clarity repository patterns | Technical and security reviewers |

## Phase Status

| Phase | Status | Result |
|---|---|---|
| 0 Discovery Contract | `OWNER_REVIEW` | Scope and inference boundary recorded |
| 1 Terminology | `OWNER_REVIEW` | Terms normalized with synthetic assumptions labeled |
| 2 Workflow | `OWNER_REVIEW` | Fifteen stages mapped with entry and exit conditions |
| 3 Decisions | `OWNER_REVIEW` | Human decisions separated from facts and readiness |
| 4 Data | `OWNER_REVIEW` | Ownership, evidence, lifecycle, and sensitivity mapped |
| 5 Readiness | `OWNER_REVIEW` | Clinical, operational, placement, and financial dimensions kept separate |
| 6 Events | `OWNER_REVIEW` | Existing event vocabulary used; no new event invented |
| 7 Domains | `OWNER_REVIEW` | Existing objects preferred; MAR remains a potential new-object gate |
| 8 Implementation Readiness | `OWNER_REVIEW` | Discovery package complete; implementation remains separately gated |

## Owner-Authorized Synthetic Decisions

1. Use `2026-07-18T14:00:00-05:00` as the inferred PEC issue time and
   `2026-07-21T14:00:00-05:00` as the 72-hour expiration.
2. Use `America/Chicago` as the source-owned facility timezone for the
   synthetic Oceans facility configuration.
3. Interpret "Aetna Amanda" as an Aetna benefits contact named Amanda, not a
   fourth active coverage and not a medication.
4. Use Medicare Part A as primary, Humana as secondary, and Medicaid as a
   secondary/tertiary coordination record pending verification.
5. Use synthetic home-medication candidates for Exelon, Cymbalta, and Abilify;
   the values remain medication-reconciliation inputs, not orders.
6. Permit Victor Bermudez to hold both LCSW/social-work and UR roles in the
   synthetic workflow. This is a scenario rule, not verified Medicare guidance.
7. Record the receiving facility response as accepted by named human actors for
   the walkthrough; the system does not decide acceptance.

## Closeout

The inferred package is internally consistent and traceable. Qualified domain
review remains a promotion gate, not an unanswered workflow field.
