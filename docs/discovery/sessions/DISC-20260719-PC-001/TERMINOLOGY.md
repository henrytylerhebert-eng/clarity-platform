---
status: OWNER_REVIEW
discovery_id: DISC-20260719-PC-001
version: 0.1.0
data_boundary: synthetic only
---

# Session Terminology

| Term | Working definition | Classification | Owner / review gate |
|---|---|---|---|
| Protective custody / PEC | Synthetic legal-status source record representing the stated protective-custody order | `Source Reported` | Legal reviewer; no validity inferred |
| MAR | Medication Administration Record | `Owner Defined` | Medication reviewer |
| Episode | Post-admission unit of care linked to the source case and admission handoff | `Owner Defined` | Technical/domain review |
| Episode-owned UR | Utilization review facts and day decisions owned by the admitted Episode | `Owner Defined` | UR/domain review |
| Central Intake | Receiving-facility intake function operated by Oceans of Lafayette under the stated joint-venture arrangement | `Assumed` | Facility operations review |
| Admission handoff | Source-attributed handoff accepted by the receiving facility and recorded as an admission fact | `Assumed` | Facility operations review |
| Coverage outcome | One of `APPROVED`, `DENIED`, `PENDING`, `EXPIRED`, `UNREQUESTED`, `UNKNOWN`, or `NOT_REQUIRED` | `Owner Defined` | Authorization contract review |
| Authorization-risk flag | Separate concern such as `DOCUMENTATION_GAP`, `DUE_DATE_EXPOSURE`, or `SOURCE_STALE` | `Owner Defined` | UR/product review |
| At risk | A risk flag state, never an authorization outcome | `Owner Defined` | Product/technical review |
| Documentation gap | A missing, incomplete, stale, or contradictory requirement record | `Owner Defined` | Domain review |
| Facility timezone | Explicit source-owned configuration used for service-date derivation | `Owner Defined` | Facility/security review |
| Aetna Amanda | Synthetic interpretation: Aetna contact/payer reference involving a contact named Amanda; not an additional active coverage | `Assumed` | Benefits review |
| Coroner source | Dr. Jim Halpert role label attached to the synthetic custody/authority source | `Source Reported` | Legal reviewer |
| Self-review | Victor's dual-role UR review in this synthetic case; not a claim about Medicare policy | `Owner Defined` | UR compliance review |

## Normalization Rule

The narrative labels remain preserved in source evidence. These working terms
are display and mapping terms only. They do not create a new schema object,
state, legal definition, payer rule, medication order, or clinical conclusion.
