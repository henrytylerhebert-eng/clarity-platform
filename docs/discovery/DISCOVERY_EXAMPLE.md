---
status: Illustrative synthetic example; not canonical workflow truth
version: 0.1.0
source: docs/testing/SYNTHETIC_PROTECTIVE_CUSTODY_SCENARIO.md
data_boundary: synthetic only
---

# Workflow Discovery Example

This is a small WDP example using the synthetic protective-custody scenario. It
demonstrates record shape and classification; it does not approve the scenario,
validate law or Medicare policy, or authorize implementation.

## Session Header

| Field | Value |
|---|---|
| Discovery ID | `DISC-20260719-PC-001` |
| Workflow | Protective-custody referral to inpatient behavioral admission |
| Owner | Human project owner |
| Participants | Synthetic scenario actors and workflow SME |
| Scope | Intake, PEC source capture, clinical/benefits/MAR lanes, routing, custody, admission, UR, correction |
| Non-goals | Legal validation, clinical determination, payer adjudication, production integration |
| Data boundary | Synthetic only |
| Status | `DISCOVERY_INCOMPLETE` |

## Terminology Records

| Term | Definition | Classification | Owner decision |
|---|---|---|---|
| MAR | Medication Administration Record; the record used to process and document medication administration | `Owner Defined` | No new object assumed; existing contract fit must be checked |
| PEC | Protective-custody/psychiatric emergency source label supplied by the scenario | `Source Reported` | Legal meaning and jurisdictional rule remain `Owner Decision Required` |
| Episode-owned UR | Post-admission utilization review linked to the Episode | `Owner Defined` | Keep separate from pre-admission authorization readiness |
| Aetna Amanda | Unresolved scenario phrase | `Unknown` | Do not map to payer or medication until clarified |

## Workflow Stage Example

| Stage | Entry | Owner | Inputs | Output | Readiness/blocker |
|---|---|---|---|---|---|
| Medication reconciliation/MAR | Medication list and order sources received | LPN workflow owner | Medication sources, last doses, allergies, orders | Reconciled MAR candidate and unresolved gaps | Exact orders and prescriber authority are `Unknown` |

## Decision Example

| Field | Record |
|---|---|
| Decision | Receiving-facility acceptance |
| Owner | Receiving-facility authorized human; exact authority `[Pending]` |
| Evidence | Central Intake record, receiving psychiatrist review, packet, bed/unit facts |
| Possible outcomes | Accepted, declined, pending, returned for information, `Unknown` |
| System role | Record source and human decision; do not recommend or auto-accept |
| Audit | Actor, time, reason, source packet version, and correction history |
| Governed event | Use only the accepted current vocabulary; no new acceptance event inferred here |
| Classification | `Owner Decision Required` |

## Readiness Example

| Target | Dimension | State | Missing requirement | Owner |
|---|---|---|---|---|
| Admission handoff | Placement | `PARTIAL` | Receiving program/unit, acceptance time, explicit facility timezone | Oceans Central Intake / receiving facility |
| Clinical review | Clinical | `PARTIAL` | Medical clearance, detailed safety assessment, source review | Qualified clinical reviewer |
| Benefits verification | Financial | `IN_PROGRESS` | Exact payer meaning and source benefit evidence | Benefits verifier |
| MAR processing | Operational | `NOT_READY` | Exact medication orders, doses, routes, and last administration | LPN/prescriber workflow |

Financial readiness does not block emergency clinical review. Each dimension
remains visible and separately owned.

## Event Example

| Action | Class | Current disposition |
|---|---|---|
| PEC source received | `AUDIT` plus source document/evidence | Record source and review; do not declare legal validity |
| Facility acceptance | `SOURCE` plus audit | Record human acceptance when it occurs; no autonomous placement |
| Admission handoff | `SOURCE` and governed `ADMISSION_RECORDED.v1` when the accepted handoff is persisted | Existing S2 vocabulary |
| MAR processed | `AUDIT` plus transactional medication/MAR record if a contract exists | Do not emit a new governed event without a named consumer |
| Episode-day coverage derived | `DERIVED` | Preserve source decisions and label derivation/version |

## Ledger Examples

| Record ID | Question | Answer | Classification | Status |
|---|---|---|---|---|
| `DL-20260719-0001` | What does MAR mean? | Medication Administration Record | `Owner Defined` | `ACCEPTED` |
| `DL-20260719-0002` | Who owns placement? | Oceans Central Intake under the stated joint venture | `Source Reported` | `OWNER_REVIEW` |
| `DL-20260719-0003` | What does Aetna Amanda mean? | Not yet known | `Unknown` | `BLOCKED` |

## Completion Assessment

The example is `DISCOVERY_INCOMPLETE` because exact PEC time/timezone,
clinical source details, medication orders, benefit meaning, facility unit, and
several authority questions remain unresolved. That is the correct WDP result;
the protocol does not convert a plausible story into implementation readiness.
