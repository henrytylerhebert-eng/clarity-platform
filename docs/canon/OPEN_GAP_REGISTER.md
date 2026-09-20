# Clarity Open-Gap Register v0.1

**Scope:** Longitudinal pre-schema questions only  
**Status (as written, 2026-09-20 package):** OPEN  
**Status (current):** PARTIALLY RESOLVED — 03 and 08 are NOT YET RATIFIABLE; see below  
**Count:** 10  

> **STATUS UPDATE — 2026-09-20.** All ten questions below have been **closed or explicitly
> bounded** by
> [gap-closure/LONGITUDINAL_GAP_CLOSURE_v0.1.md](gap-closure/LONGITUDINAL_GAP_CLOSURE_v0.1.md):
> **6 LOCKED** (01, 02, 04, 07, 09, 10) and **4 BOUNDED** (03, 05, 06, 08). A BOUNDED gap is not
> an open question — its shape, invariants and failure mode are fixed, and what remains is a
> value list or authority assignment that only clinical licensing (OD-3), counsel (OD-2) or a
> real integration contract (OD-5) can supply. **Do not re-open a question below without the
> documented contradicting evidence required by the admission rule at the end of this file.**
> The questions are preserved verbatim as the dated artifact they are.
>
> **AMENDED 2026-09-20 by the owner-level review**
> ([review/OWNER_DECISION_PACKET_v0.1.md](review/OWNER_DECISION_PACKET_v0.1.md)): re-testing each
> bound independently moved **LONG-GAP-03 and LONG-GAP-08 to NOT YET RATIFIABLE** — each can force
> a schema change — and moved 04, 05, 06 and 10 to ratifiable only with amendment. The claim that
> no bound blocks persistence is **withdrawn**. LONG-GAP-01, 02, 07 and 09 stand as written.

**Freeze rule:** These are the only recognized longitudinal pre-schema questions for this pass. Do not add new semantic questions unless reconciliation exposes a documented contradiction or missing semantic requirement.

| Gap ID | Status | Topic | Question |
|---|---|---|---|
| LONG-GAP-01 | OPEN | DischargePlan cardinality | Does each inpatient Episode have one logical DischargePlan with revisions, or can concurrent independent plans exist? |
| LONG-GAP-02 | OPEN | Destination-attempt identity | Does each CareTransition need separate destination-attempt records? |
| LONG-GAP-03 | OPEN | Clinical discharge-readiness authority | Which facility-configured roles may record or supersede clinical discharge readiness? |
| LONG-GAP-04 | OPEN | Canonical LOC registry | What canonical level-of-care registry/crosswalk should span inpatient, residential, PHP, IOP, outpatient, post-acute, and other applicable settings? |
| LONG-GAP-05 | OPEN | Barrier taxonomy | What barrier taxonomy supports operations and trending without becoming a blame taxonomy? |
| LONG-GAP-06 | OPEN | Core vs configurable longitudinal observations | Which recovery/function and environment/support concepts are core platform semantics versus configurable assessment fields? |
| LONG-GAP-07 | OPEN | Actual discharge command contract | What exact command, source, disposition, and correction contract governs actual discharge? |
| LONG-GAP-08 | OPEN | Continuity evidence sources | Which sources can establish follow-up, medication events, next level of care, ED use, and readmission? |
| LONG-GAP-09 | OPEN | DISCHARGED to CLOSED operational boundary | What operational work remains allowed between existing Episode states DISCHARGED and CLOSED? |
| LONG-GAP-10 | OPEN | Projection without parent aggregate | Can the first longitudinal projection be reliably derived from PatientToken + BehavioralHealthCase + CaseEpisodeLink + Episode, avoiding a new parent aggregate? |

## Admission rule for a new gap

A new longitudinal semantic gap may be added only if reconciliation exposes:

1. a contradiction between locked decisions;
2. a current-repo fact that makes a locked decision impossible to implement as written;
3. an unrepresented workflow or authority requirement;
4. a provenance/epistemic conflict that the current model cannot express; or
5. evidence that an assumed derived projection cannot be derived deterministically.

Any new gap must cite the evidence that exposed it and must not authorize schema work by itself.
