---
status: OWNER_REVIEW
discovery_id: DISC-20260719-PC-001
version: 0.1.0
data_boundary: synthetic only
---

# Domain Mapping

| Concept | Existing Clarity mapping | Lifecycle / ownership fit | New-object status | Notes |
|---|---|---|---|---|
| Referral and intake | `BehavioralHealthCase`, Documents, Evidence | Case begins before admission | No | Use synthetic patient token |
| Protective-custody source | Legal-status source document, Evidence, Audit | Source and interpretation remain separate | No | Legal validity is external review |
| Clinical incident | Evidence item linked to source document | Corrections preserve source | No | Reported, observed, and assessed facts stay distinct |
| Facility response | Routing/acceptance source and Audit | Human facility ownership | No | No autonomous placement |
| Transport custody | Custody and Audit records | Append-only handoffs | No | Attestation gaps remain visible |
| Admission | `Episode`, `CaseEpisodeLink`, governed event | Admission handoff owns episode linkage | No | Explicit facility timezone required |
| Pre-admission authorization | Existing authorization-readiness workflow | Remains pre-admission-owned | No | Existing behavior unchanged |
| Post-admission UR | Episode-owned authorization/review records | Episode lifecycle and UR linkage | No | Victor dual role is scenario-only |
| Episode-day outcome | Authorization day decision and derived coverage view | Source outcome separate from risk | No | Seven-state outcome vocabulary |
| Documentation gap | `DocumentationGap` and status history | Append-only transition history | No | Gap is not an outcome |
| Medication/MAR | Existing contract if present; otherwise source evidence and gap | Independent medication lifecycle may be required | `Potential New Domain Object` | No schema or contract added here |
| Benefits verification | Existing coverage, eligibility, benefits records | Financial lane remains independent | No | Raw payer narrative preserved |
| Timeline | Derived view of source/audit records | No independent authority | No | Timeline is not a source of truth |
| Governed event | Existing event envelope and outbox boundary | Named consumer required | No | No new event type in session |

## New-Object Gate

MAR remains a potential new domain object only because the current repository
boundary does not establish a medication administration lifecycle. Before any
contract or schema change, document its owner, order relationship, MAR status
machine, correction rules, prescriber gate, audit needs, sensitivity, and named
consumers.
