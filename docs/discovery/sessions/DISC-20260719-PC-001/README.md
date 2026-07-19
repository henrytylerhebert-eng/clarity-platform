---
status: OWNER_REVIEW
discovery_id: DISC-20260719-PC-001
workflow: Synthetic protective-custody referral to inpatient behavioral admission
version: 0.1.0
date: 2026-07-19
timezone: America/Chicago
data_boundary: synthetic only
inference_boundary: owner-authorized synthetic assumptions; not verified domain truth
---

# Synthetic Protective-Custody Discovery Session

This session applies the Workflow Discovery Protocol to the synthetic Michael
Scot protective-custody scenario. The human project owner authorized inferred
values for this exercise so the workflow can be walked end to end without
stopping for every missing field.

Inference does not become evidence. Every filled gap is labeled `Assumed` or
`Derived`, includes its owner and review trigger, and remains unsuitable for
clinical, legal, payer, admission, placement, or production use until qualified
review occurs.

## Source And Boundary

- Source scenario: [SYNTHETIC_PROTECTIVE_CUSTODY_SCENARIO.md](../../../testing/SYNTHETIC_PROTECTIVE_CUSTODY_SCENARIO.md)
- Protocol: [WORKFLOW_DISCOVERY_PROTOCOL.md](../../WORKFLOW_DISCOVERY_PROTOCOL.md)
- All people, facilities, identifiers, times, benefits, medications, and
  documents in this package are synthetic.
- This package adds no schema, migration, API, worker, UI, integration, or
  deployment behavior.
- The source scenario remains unchanged; this directory is the inferred
  discovery overlay.

## Package Map

| Artifact | Purpose |
|---|---|
| `SESSION.md` | Contract, authority, participants, and phase status |
| `DISCOVERY_LEDGER.md` | Append-only record of source answers and assumptions |
| `TERMINOLOGY.md` | Session glossary and ambiguity decisions |
| `WORKFLOW.md` | Normalized end-to-end workflow |
| `DECISIONS.md` | Human decisions and decision-shaped actions |
| `DATA.md` | Data ownership, evidence, and lifecycle map |
| `READINESS.md` | Separate readiness dimensions and dependencies |
| `EVENTS.md` | Audit, governed, source, and derived event map |
| `DOMAIN_MAPPING.md` | Existing Clarity object mapping and new-object gates |
| `EXCEPTIONS_AND_CORRECTIONS.md` | Failure, correction, and supersession behavior |
| `OUTPUT_TRACEABILITY.md` | Requirement-to-ledger-to-destination matrix |
| `SYNTHETIC_FIXTURE_AND_TESTS.md` | Inferred fixture values and focused test scenarios |
| `IMPLEMENTATION_READINESS.md` | Final gate and explicit implementation boundary |

## Session Result

The scenario is **inference-complete for a synthetic workflow walkthrough**.
The protocol status remains `OWNER_REVIEW` because the inferred clinical,
legal, benefits, authorization, and facility facts are not qualified review,
and no implementation slice has been separately authorized.

The package is ready to support a future contract-design discussion. It is not
an operational chart, a legal instrument, a payer response, a medication
order, a placement decision, or a production test fixture.
