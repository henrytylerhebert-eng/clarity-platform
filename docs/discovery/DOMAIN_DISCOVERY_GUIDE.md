---
status: Proposed phase guide
version: 0.1.0
---

# Domain Discovery Guide

## Objective

Place each discovered concept into the existing Clarity architecture when the
meaning and lifecycle fit. Keep a potential new domain object visible instead
of allowing a new object to emerge from an interview label.

## Mapping Record

| Field | Required content |
|---|---|
| Concept ID | Stable discovery ID |
| Concept as spoken | Source wording |
| Meaning | Accepted definition |
| Existing domain candidate | Case, Episode, Evidence, Document, Review, etc. |
| Mapping rationale | Why the existing object fits |
| Lifecycle fit | Existing state machine or lifecycle relationship |
| Ownership fit | Existing actor/tenant/domain ownership |
| Evidence fit | Existing source/evidence model |
| Audit fit | Existing audit/history behavior |
| Event fit | Existing governed/timeline/derived event behavior |
| Data gap | Missing capability or mismatch |
| New-object status | `No`, `Potential New Domain Object`, or `Owner Decision Required` |
| Related records | ADRs, contracts, schema, tests, or workflows |
| Classification | WDP classification |

## Existing Mapping Candidates

| Concept | Prefer mapping to | Do not assume |
|---|---|---|
| Referral/intake | `BehavioralHealthCase` plus Documents/Evidence | A new referral object without a lifecycle need |
| Episode/admission | `Episode` and `CaseEpisodeLink` | Case status equals episode lifecycle |
| Assessment or report | Document and source-linked Evidence | Narrative summary equals verified fact |
| Utilization review | Episode-owned Authorization/Review after admission | Pre-admission readiness and post-admission UR are identical |
| Benefits verification | Existing coverage/eligibility/benefits records | Benefit readiness is a clinical gate |
| Documentation gap | `DocumentationGap` and append-only status history | A missing document is an authorization outcome |
| Medication/MAR | Existing contract if present; otherwise source evidence and explicit gap | MAR processing authorizes a medication order |
| Transport/custody | Routing, Custody, and Audit records | A handoff occurred without receipt/attestation evidence |
| Decision | Existing domain decision plus Audit | A readiness state is a human decision |
| Timeline | Derived view of source/audit records | Timeline display is not a new source of truth |

## Potential New Domain Object Gate

Mark `Potential New Domain Object` when any of the following is true:

- the concept has an independent lifecycle and owner;
- it needs a state machine not represented by an existing object;
- it has source, correction, tenancy, or retention rules that differ materially;
- forcing it into an existing object would erase meaning or create unsafe coupling.

Before a new object is approved, document:

1. Why an existing object does not fit.
2. The proposed lifecycle and state transitions.
3. Ownership, tenant boundary, evidence, correction, and retention.
4. Domain contract and persistence impact.
5. API, event, projection, and UI impact.
6. Security, legal, clinical, payer, or operations review required.

## Gate

Phase 7 is complete only when every concept maps to an existing object or has a
recorded owner decision for a potential new object. A new domain object is never
created as a discovery convenience.
