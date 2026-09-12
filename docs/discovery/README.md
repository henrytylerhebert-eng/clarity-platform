---
status: Proposed Workflow Discovery Protocol package
owner: Human project owner with domain, technical, security, and operations review
version: 0.1.0
date: 2026-07-19
data_boundary: synthetic only for examples; no production data
---

# Workflow Discovery Protocol

The Workflow Discovery Protocol (WDP) is Clarity's proposed requirements-
acquisition process. It is a structured interview engine for converting subject-
matter expertise into traceable, reviewable implementation requirements.

The WDP is documentation and governance infrastructure. It is not a runtime,
database model, API, worker, workflow engine, clinical rules engine, or product
feature. It must fit the existing Clarity case spine and must never replace
canonical domain contracts, ADRs, evidence records, readiness contracts, or
human approval gates.

## Start Here

1. Use [DISCOVERY_SESSION_TEMPLATE.md](DISCOVERY_SESSION_TEMPLATE.md) to open a
   session and define authority, scope, participants, boundaries, and known
   unknowns.
2. Run the phases in
   [WORKFLOW_DISCOVERY_PROTOCOL.md](WORKFLOW_DISCOVERY_PROTOCOL.md) in order.
3. Record every answer in the append-only ledger described by
   [DISCOVERY_LEDGER_SPEC.md](DISCOVERY_LEDGER_SPEC.md).
4. Use the phase guides to capture terminology, workflow steps, decisions,
   data meaning, readiness, events, and domain ownership.
5. Close the session with
   [IMPLEMENTATION_READINESS_GUIDE.md](IMPLEMENTATION_READINESS_GUIDE.md).
6. Route accepted outputs into the existing canonical docs, ADRs, contracts,
   tests, and implementation handoff. Do not treat the discovery package as a
   substitute for those records.

## Package Map

| Artifact | Purpose |
|---|---|
| `WORKFLOW_DISCOVERY_PROTOCOL.md` | Normative lifecycle, phases, gates, roles, and status rules |
| `DISCOVERY_SESSION_TEMPLATE.md` | Standard session header and facilitator worksheet |
| `DISCOVERY_LEDGER_SPEC.md` | Append-only answer and correction record |
| `TERMINOLOGY_DISCOVERY_GUIDE.md` | Term definition and ambiguity protocol |
| `WORKFLOW_DISCOVERY_GUIDE.md` | Step-by-step workflow record |
| `DECISION_DISCOVERY_GUIDE.md` | Explicit decision object and approval gate |
| `DATA_DISCOVERY_GUIDE.md` | Data meaning, ownership, evidence, and lifecycle record |
| `READINESS_DISCOVERY_GUIDE.md` | Stage readiness and dependency record |
| `EVENT_DISCOVERY_GUIDE.md` | Audit, governed, timeline, and derived event record |
| `DOMAIN_DISCOVERY_GUIDE.md` | Existing domain mapping and potential-new-object gate |
| `IMPLEMENTATION_READINESS_GUIDE.md` | Completion criteria and implementation handoff |
| `DISCOVERY_CLASSIFICATION_STANDARD.md` | Allowed evidence classifications and promotion rules |
| `DISCOVERY_OUTPUT_SPECIFICATION.md` | Required final output package and traceability |
| `DISCOVERY_CHECKLIST.md` | Facilitator and reviewer checklist |
| `DISCOVERY_EXAMPLE.md` | Synthetic example based on the protective-custody scenario |
| `CONFLICTS_AND_INTEGRATION_POINTS.md` | Repository fit, authority boundaries, and adoption recommendations |

## Current Clarity Fit

The WDP attaches to the current operating spine:

```text
referral -> case -> documents/evidence -> parallel workstreams -> review
-> readiness -> packet/routing -> custody -> audit/history
```

The WDP adds a requirements-acquisition layer before implementation. It does
not change the spine or create a competing source of truth.

| Existing Clarity concept | WDP relationship |
|---|---|
| Case and parallel workstreams | Workflow scope, stage ownership, readiness dimensions, and dependencies |
| Documents and evidence | Source references, evidence classification, reviewer, version, and contradiction handling |
| Domain contracts/state machines | Destination for accepted terminology, outcomes, transitions, and invariants |
| Human review | Explicit gate for clinical, legal, benefits, authorization, placement, security, and owner decisions |
| Audit and append-only history | Traceability for answers, corrections, approvals, and supersession |
| Governed events/outbox | Proposed event semantics only; no event is emitted because discovery describes it |
| Product Evidence and Decision Protocol | Existing product-claim and status authority; WDP classifications do not replace it |
| `IMPLEMENTATION_STATUS.md` | Destination for accepted implementation status after verification |

## Non-Goals

- No software implementation during discovery.
- No schema, migration, API, worker, projection, analytics mart, UI, or
  integration changes.
- No legal, clinical, payer, authorization, admission, discharge, placement,
  or operational policy inference.
- No automatic terminology normalization when an SME uses an ambiguous term.
- No optimization, redesign, prioritization, or staffing recommendation while
  the workflow is still being discovered.
- No promotion of a scenario, interview answer, or AI output to verified truth
  without the required source and human gate.

## Adoption Gate

This package is proposed. Adoption requires owner review of the protocol,
domain/technical review of the record shapes, and confirmation that the WDP
does not override existing canonical records. A workflow remains
`DISCOVERY_INCOMPLETE` whenever a material ambiguity, missing authority, or
unresolved domain boundary remains.

For the repository-specific fit assessment, read
[CONFLICTS_AND_INTEGRATION_POINTS.md](CONFLICTS_AND_INTEGRATION_POINTS.md).

The first inference-complete synthetic session is
[DISC-20260719-PC-001](sessions/DISC-20260719-PC-001/README.md). It remains
`OWNER_REVIEW` and is not an executable or operational fixture.

## Recovered operating-assurance package

The [operating-assurance recovery index](operating-assurance/README.md) preserves
July discovery and product-definition records. The lane is paused and does not
authorize implementation, corpus use, or a product-home decision.
