# Clarity Open-Gap Register v0.1

**Scope:** Longitudinal pre-schema questions only  
**Status:** OPEN  
**Count:** 10  
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
