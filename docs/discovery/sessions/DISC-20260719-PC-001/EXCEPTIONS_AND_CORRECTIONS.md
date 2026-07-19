---
status: OWNER_REVIEW
discovery_id: DISC-20260719-PC-001
version: 0.1.0
data_boundary: synthetic only
---

# Exceptions, Corrections, And Supersession

| Situation | Required behavior | Outcome / risk effect |
|---|---|---|
| PEC source missing issue time | Create documentation gap; do not derive legal clock | Coverage unchanged; legal readiness blocked |
| Facility timezone missing | Block service-date derivation and admission persistence | Operational risk flag; no browser/server fallback |
| Facility declines or returns packet | Preserve response and reason | Placement state changes; no autonomous reroute |
| Transport arrives without attestation | Record arrival source and open handoff gap | Admission may remain pending according to approved rule |
| MAR has unknown last dose | Preserve unknown and route for review | Medication readiness partial; no order is created |
| Aetna/Amanda interpretation challenged | Append correction to ledger and benefits record | Coverage ordering is recalculated only by accepted rule |
| Payer response absent by due time | Keep outcome `PENDING` or `UNKNOWN` per accepted source rule | Add `DUE_DATE_EXPOSURE`; do not call it denied |
| Day decision corrected | Add reversal/correction event that supersedes original | Original remains readable; one active branch |
| Documentation gap status changes | Append status history and audit | No new governed event unless separately accepted |
| Victor's role authority changes | Append role/review correction | Future review ownership changes; prior review remains attributed |
| Episode correction after admission | Version-predicate update plus audit/outbox in one transaction | Episode history remains append-only |

## Correction Record Shape

```yaml
correctionId: CORR-DISC-20260719-0001
originalRecordId: DL-20260719-0012
reason: "Synthetic medication strength changed during owner review"
correctedBy: "Human project owner"
correctedAt: "2026-07-19T10:00:00-05:00"
supersedingRecordId: DL-20260719-0022
status: ACTIVE_BRANCH
```

The example is illustrative only; no correction is recorded in this session.
