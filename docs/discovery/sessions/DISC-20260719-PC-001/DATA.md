---
status: OWNER_REVIEW
discovery_id: DISC-20260719-PC-001
version: 0.1.0
data_boundary: synthetic only
---

# Data Ownership And Lifecycle Map

| Data element | Creator / source owner | Consumers | Evidence | Mutability / lifecycle | Sensitivity | Classification |
|---|---|---|---|---|---|---|
| Patient token | Case intake | All scoped workflows | Synthetic identity fixture | Stable; append-only corrections only | Sensitive-shaped synthetic | `Owner Defined` |
| PEC source document | Officer / authority source | Legal and clinical reviewers | Synthetic order reference and source hash | Immutable source; corrections supersede interpretation | Regulated-shaped synthetic | `Source Reported` |
| Issue and expiration timestamps | Authority source / owner fixture | Legal review and handoff readiness | Source record plus timezone | Source immutable; correction appends | Regulated-shaped synthetic | `Assumed` |
| Clinical incident evidence | Reporter / observer | Clinical reviewer, packet, UR | Separate source-linked items | Interpretation correctable; source preserved | Clinical-shaped synthetic | `Source Reported` |
| Medical-screening packet | Sending nurse / qualified staff | Receiving facility and clinician | Synthetic screening record | Correctable with audit history | Clinical-shaped synthetic | `Assumed` |
| Medication candidate | Home-med source / Judy workflow | MAR and prescriber review | Medication list, last-dose source, and refusal record | Orders are separate from reconciliation facts | Clinical-shaped synthetic | `Assumed` |
| Coverage record | Susan workflow | Benefits, authorization, UR | Coverage source and verification record | Versioned and reviewable | Financial-shaped synthetic | `Assumed` |
| Benefit narrative | Payer/source report | Benefits and UR | Raw quoted narrative | Preserve raw; normalized view is derived | Financial-shaped synthetic | `Source Reported` |
| Facility acceptance | April / Angela human action | Transport, admission, episode | Acceptance record and actor | Append-only response history | Operational synthetic | `Assumed` |
| Transport custody | Officer / Andy handoff | Sending/receiving teams, audit | Handoff attestations | Append-only events | Operational synthetic | `Assumed` |
| Episode | Admission handoff | Post-admission workstreams | Accepted handoff and facility config | Lifecycle state machine | Regulated-shaped synthetic | `Derived` |
| Episode-owned UR review | Victor | UR, episode, audit | Review request and source docs | Version-predicated; corrections append | Financial/clinical-shaped synthetic | `Owner Defined` |
| Episode-day outcome | UR decision / derived coverage view | UR and readiness | Source decision event IDs and rule version | Derived and supersedable | Financial-shaped synthetic | `Derived` |
| Risk flags | UR review and readiness derivation | UR, readiness, audit | Gaps, due dates, stale sources | Separate, versioned, correctable | Operational synthetic | `Derived` |
| Facility timezone config | Facility-owned configuration | Service-date derivation | `tzcfg-olf-20260719-v1` | Effective-dated; never browser-inferred | Configuration | `Assumed` |

## Ownership Rules

1. Server-governed envelope fields are not supplied by the synthetic caller.
2. Source text and source documents remain immutable.
3. Normalized interpretation, derived coverage, and risk flags retain their
   source references and rule/version metadata.
4. No medication or payer fact is treated as verified merely because it appears
   in the fixture.
