---
status: OWNER_REVIEW
discovery_id: DISC-20260719-PC-001
version: 0.1.0
data_boundary: synthetic only
---

# Event And Audit Map

## Event Classes

| Action | Class | Record | Current disposition |
|---|---|---|---|
| PEC source received | Source + audit | Source document, evidence, custody/audit record | Record source; do not declare legal validity |
| Clinical report received | Source + audit | Source-linked evidence item | Preserve reported/observed distinction |
| Medication list received | Source + audit | MAR/reconciliation source record | No medication order is inferred |
| Benefits response received | Source + audit | Coverage/benefits verification record | Preserve raw narrative and verification status |
| Facility acceptance recorded | Source + audit | Facility response and acceptance record | Human source fact only |
| Admission handoff recorded | Governed + audit | Episode, link, event, audit, outbox | Existing `ADMISSION_RECORDED.v1` |
| Episode-day decision recorded | Governed + audit | Day decision, event, audit, outbox | Existing `AUTHORIZATION_DAY_DECISION_RECORDED.v1` |
| Documentation gap created | Governed + audit | Gap, event, audit, outbox | Existing `DOCUMENTATION_GAP_RECORDED.v1` |
| Documentation gap transition | Status history + audit | Gap history and audit record | No new governed event in this session |
| Episode-day coverage derived | Derived | Versioned derived view | No new governed event |
| Correction or reversal | Governed/audit correction | Append-only correction and supersession link | Preserve original and active branch |

## Current Governed Vocabulary

Only these existing S2 events are used in the session:

1. `ADMISSION_RECORDED.v1`
2. `AUTHORIZATION_DAY_DECISION_RECORDED.v1`
3. `DOCUMENTATION_GAP_RECORDED.v1`

`AUTHORIZATION_REVIEW_RECORDED` remains an audit action/fixture concept, not a
new governed event. `DOCUMENTATION_GAP_TRANSITIONED` remains status history and
audit. No event consumer is invented, and no dispatcher is implied.

## Envelope Requirements

Each governed event requires server-controlled identity, tenant, actor,
correlation, causation, occurred-at, schema version, source references, and
correction/supersession metadata. The synthetic caller supplies business facts
only; it does not author server-owned envelope fields.
