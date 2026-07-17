---
status: Requirements draft — stakeholder-stated model, requires clinical and legal review before enforcement
owner: TBD
version: 1.0.0
last_integrated: 2026-07-17
source_artifacts:
  - Stakeholder direction (product owner), 2026-07-17
  - reference/source-packages/clarity_cia_integration_bundle_v1_0_0/ (CIA blueprint v1.0.0)
  - docs/workflows/CASE_WORKFLOW.md (case spine + crisis-path workflows A–D)
  - docs/legal/LEGAL_STATUS_ARCHITECTURE.md (e-PEC lifecycle, jurisdictional rule sets)
unresolved_conflicts: "None recorded; facility-specific criteria packs do not exist yet"
related_requirements: REQ matrix intake/clinical rows
related_adrs: ADR-0001
---

# Intake-to-Admission Workflow (Treatment-Team Model)

Clarity mimics the workflow of the overall treatment team. This document is the canonical statement
of that model as directed by the product owner (2026-07-17), mapped against the Clarity CIA
integration bundle (v1.0.0) that now provides the assessment-documentation blueprint for this lane.

The **receiving facility is the primary user** of the software. The emergency department of a
sending hospital may also be a user, but the workflow must not assume it.

## The workflow, end to end

1. **Field contact or referral.** A call comes in from the field or a referral is made. Depending
   on the case type, crisis-response personnel or local law enforcement engage. (CIA Stage 1 —
   `field_responder` / `crisis_clinician`; already demoed in `app/` guided intake field mode and,
   for custody instruments, the e-PEC Legal Status lifecycle.)
2. **Ripple into the treatment team — intake initial assessment.** Intake performs the initial
   assessment. **Intake staff are not assumed to be nurses** — the role model must stay adaptable.
   (CIA Stage 1 owner may be `intake_specialist`, which the bundle already keeps distinct from
   `registered_nurse`: `source-confirmed`.)
3. **Physician acceptance.** Admission acceptance is approved **only by a physician**, unless that
   authority is **delegated to a nurse practitioner**, unless otherwise specified by the
   **admitting psychiatrist**. This must be adaptable per facility. (CIA restricted-capability
   model supports "authorized roles per policy and scope" but does not name this delegation chain;
   the facility configuration layer below must make it explicit. `requires clinical review` and
   `requires legal review` — scope-of-practice law varies by state.)
4. **Nursing report.** If a nursing report can be gathered from the **sending facility or entity**,
   that is part of this process. If not, it is done by a **nurse on the floor of the receiving
   facility** — unless the sending emergency room is also using the software, in which case the
   report can originate there. (CIA Stage 2 `registered_nurse` assessment covers the receiving-side
   work and "verify rather than copy" reconciliation; a named **sending-facility nursing report**
   artifact is a gap — see Requirements below.)
5. **Facility screening criteria.** Certain **lab standards** and **decision-making processes for
   exclusionary criteria** must be built in **per facility**, along with each facility's
   **inclusionary / admitting criteria**. (CIA has extensive lab documentation fields but **no
   facility criteria-pack concept**; this is a new configuration layer — see Requirements.)
6. **Admission.** Once the patient is admitted, the **facility's governing admissions process
   proceeds** — Clarity supports and documents it; it does not replace it.
7. **Documentation assist.** Clarity's **audio listening capabilities** assist the nurse in the
   admission documentation process, informed by **that facility's documentation needs**. (The CIA
   bundle covers transcript-to-structured-field proposals with human confirmation; **ambient audio
   capture** is not yet specified — see Requirements.)

## Requirements this creates (beyond the CIA bundle)

| # | Requirement | Covered by CIA bundle? | Disposition |
|---|---|---|---|
| R1 | Adaptable role model: intake staff ≠ nurse; stage ownership configurable per facility | Yes — distinct roles, stage ownership, default-deny permissions | Adopt as-is |
| R2 | Physician-only acceptance with per-facility delegation to NP, overridable by admitting psychiatrist directive | Partially — restricted capabilities are "per policy," but the physician→NP→psychiatrist-directive chain is not named | Add to facility configuration layer; `requires clinical review` + `requires legal review` |
| R3 | Sending-facility nursing report as a first-class intake artifact (obtain when possible; receiving-floor nurse otherwise; ED-origin when the ED runs Clarity) | Partially — record-review source attribution exists; no named artifact or obtain-else-fallback task rule | Add artifact type + handoff task rule |
| R4 | Per-facility lab standards (what must be drawn/resulted before admission decision) | Labs documented, standards not configurable per facility | Facility configuration layer |
| R5 | Per-facility exclusionary criteria decision process + inclusionary/admitting criteria | No | Facility configuration layer |
| R6 | Post-admission handoff into the facility's governing admissions process | Out of CIA scope by design | Case-spine transition (`CASE_WORKFLOW.md`) |
| R7 | Audio listening assist for nurse documentation, shaped by facility documentation needs | Transcript ingestion only; no ambient capture | Roadmap item (near-term lane, after CIA runtime) |
| R8 | Ingestion pipeline for facility policies/procedures/SOPs to inform documentation configuration | No | **Parking lot** — explicitly deprioritized by product owner; see `docs/roadmap/IMPLEMENTATION_ROADMAP.md` |

## Facility configuration layer (the pattern)

R2, R4, and R5 are the same shape as the e-PEC jurisdictional rule set
(`app/src/domain/epecRuleSets.ts`, per `docs/legal/LEGAL_STATUS_ARCHITECTURE.md`): **configuration,
not truth**. A `FacilityAdmissionProfile` should hold, per facility:

- acceptance-authority rules (physician-only default; NP delegation flag; admitting-psychiatrist
  directive override),
- required lab panel and result standards for the admission decision,
- exclusionary criteria and the decision process they gate,
- inclusionary/admitting criteria,
- documentation needs that shape the CIA runtime and any audio-assist output.

A second facility is then a new profile, not a code fork — matching how a second jurisdiction is a
new e-PEC rule set. No criteria pack exists yet for any facility; all clinical thresholds are
`requires clinical review` and nothing here may be enforced until a facility's own governance
approves its profile.

## Binding constraints carried forward

- The CIA bundle's own rules hold: signed content locked, silent overwrite prohibited, blanks are
  never negatives, AI output is draft-only for high-risk fields, hard-stop safety interrupts invoke
  the organization's approved emergency protocol.
- Financial readiness never blocks emergency clinical review (`CASE_WORKFLOW.md`, tested).
- Nothing in this document is a claim of statutory or clinical compliance; it is a workflow
  requirements statement pending qualified review.
