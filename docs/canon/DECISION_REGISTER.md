# Clarity Decision Register v0.1

**Scope:** Longitudinal Semantic Reconciliation v0.2  
**Status:** LOCKED  
**Rule:** These decisions are not reopened during implementation unless contradictory evidence is formally recorded through the canon process.

| ID | Status | Domain | Decision | Implementation effect |
|---|---|---|---|---|
| LSR-01 | LOCKED | longitudinal | Preserve the current Episode as the admission-anchored inpatient Episode. | Do not broaden Episode into the longitudinal parent container. |
| LSR-02 | LOCKED | longitudinal | LongitudinalCareJourney is a derived projection first. | Do not add a durable parent aggregate unless later evidence proves independent identity/lifecycle is required. |
| LSR-03 | LOCKED | longitudinal | DischargePlan is a true target entity. | Future persistence is semantically justified; schema remains gated. |
| LSR-04 | LOCKED | longitudinal | TransitionBarrier is a true target entity. | Barrier identity, lifecycle, provenance, responsibility, and resolution history are preserved. |
| LSR-05 | LOCKED | longitudinal | CareTransition is a true target entity; destination-attempt modeling remains a pre-schema dependency. | Do not implement the schema until destination-attempt semantics are resolved. |
| LSR-06 | LOCKED | clinical_decision | Clinical level-of-care is represented by append-only LevelOfCareRecommendation decisions. | Do not use a single mutable master LevelOfCare field to represent clinical recommendation. |
| LSR-07 | LOCKED | payer_authority | Payer level-of-care decisions stay within payer / utilization-review authority. | Do not collapse payer authorization into clinical recommendation. |
| LSR-08 | LOCKED | clinical_decision | Clinical discharge readiness is an append-only qualified-human decision. | Do not model readiness as a mutable boolean on Episode. |
| LSR-09 | LOCKED | derived_state | PendingDischarge is derived, not an EpisodeStatus. | Derive from applicable readiness plus absence of actual discharge. |
| LSR-10 | LOCKED | derived_state | TransitionReadiness is derived from independently governed components. | No single readiness flag may silently substitute for clinical, medication, destination, follow-up, transport, support, or handoff readiness. |
| LSR-11 | LOCKED | event | Actual discharge requires a human-governed source command/event. | Do not infer discharge from target date, payer end date, vacancy, readiness, or transport activity. |
| LSR-12 | LOCKED | continuity | Continuity is a typed-event family plus derived projections. | Do not create one monolithic Continuity entity or score. |
| LSR-13 | LOCKED | plan | Expected/target discharge is a plan/forecast input only. | Never treat planned discharge as actual discharge. |
| LSR-14 | LOCKED | preference | Patient preference remains separate from clinical, payer, legal, and actual-care truth. | Preference may influence decisions where applicable but does not become another authority's decision. |
| LSR-15 | LOCKED | no_collapse | No universal health, recovery, readiness, or continuity score. | Maintain independent longitudinal dimensions and profiles. |
| LSR-16 | LOCKED | relationship_semantics | Relationships inherit provenance, timing, and authorization requirements. | Graph edges/relationships must not be treated as context-free links. |
| LSR-17 | LOCKED | epistemic_safety | Absence of continuity data means unknown/no observation unless source completeness proves otherwise. | No observed event must not be presented as proof that the event did not occur. |
| LSR-18 | LOCKED | causal_safety | Clarity does not infer causal blame from chronology, barrier location, or waiting state. | Operational waiting state and causal attribution remain distinct. |

## Governance

- These entries preserve the decisions exactly at the semantic level established by Longitudinal Semantic Reconciliation v0.2.
- A developer or agent may refine implementation mechanics without changing the semantic decision.
- If implementation appears to require changing one of these decisions, stop and record the conflict rather than silently changing the model.
- No Prisma change is authorized by this register alone.
