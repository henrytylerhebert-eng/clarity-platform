---
status: OWNER_REVIEW
discovery_id: DISC-20260719-PC-001
version: 0.1.0
data_boundary: synthetic only
---

# Readiness And Dependency Map

Readiness is represented by independent dimensions. No aggregate score is
created, and financial readiness does not block emergency clinical review.

| Target | Dimension | State | Evidence / satisfied | Gap or dependency | Owner |
|---|---|---|---|---|---|
| Referral intake | Operational | `READY` | Synthetic case and source identity | None for walkthrough | Intake |
| Protective-custody review | Legal | `PARTIAL` | Source, issue time, expiration, authority reference | Qualified legal review remains required | Legal reviewer |
| Safety assessment | Clinical | `PARTIAL` | Reported death wish, aggression, behavior, nutrition, ADL facts | Qualified assessment and source review | Clinical reviewer |
| Medical screening | Clinical | `READY_FOR_REVIEW` | Synthetic stable screening packet | Actual clinical clearance cannot be inferred operationally | Sending/receiving clinical staff |
| MAR intake | Operational | `PARTIAL` | Candidate medications and MAR definition | Orders, last doses, allergies, and prescriber review | Judy / prescriber |
| Facility placement | Placement | `ACCEPTED_FOR_WALKTHROUGH` | Synthetic April/Angela acceptance and G-3 destination | Facility authority and bed facts require review | Oceans intake |
| Transport custody | Operational | `READY_FOR_HANDOFF` | Synthetic departure, arrival, and actor chain | Attestations and exact times need source review | Officer / transport |
| Admission handoff | Operational | `READY_FOR_EPISODE` | Acceptance, arrival, and explicit timezone config | None for synthetic persistence walkthrough | Receiving staff |
| Pre-admission authorization readiness | Financial / authorization | `UNCHANGED` | Existing Clarity behavior | Must not be altered by this session | Existing authorization workflow |
| Post-admission UR | Authorization | `PENDING` | Episode link and review request | Payer source decision and documentation review | Victor |
| Episode-day coverage | Authorization | `PENDING` | No final source decision yet | UR evidence and payer response | Victor |
| Authorization risk | Operational / authorization | `AT_RISK` | Documentation gap and due-date exposure flags | Risk is separate from outcome | Victor |
| Benefits verification | Financial | `PARTIAL` | Medicare/Humana/Medicaid narrative and raw source | Source verification and coordination order | Susan |

## Derived Initial View

```text
coverage_outcome = PENDING
risk_flags = [DOCUMENTATION_GAP, DUE_DATE_EXPOSURE]
clinical_readiness = PARTIAL
financial_readiness = PARTIAL
placement_readiness = ACCEPTED_FOR_WALKTHROUGH
```

`AT_RISK` is a readiness/risk condition only. It must never replace the
coverage outcome vocabulary.
