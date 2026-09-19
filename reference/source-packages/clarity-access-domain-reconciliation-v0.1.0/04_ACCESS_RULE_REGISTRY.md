# Access Rule Registry

**Status:** Mixed. Each rule is explicitly labeled.

Rules are intentionally small. A scenario may trigger many rules.

## Rule relationship vocabulary

- `HARD_PRECEDENCE`
- `SOFT_PRECEDENCE`
- `PARALLEL`
- `DEPENDENT`
- `INFORMATIONAL`
- `HUMAN_RESOLVED_CONFLICT`

## Registry

| Rule ID | Name | Status | Type | Outcome |
|---|---|---|---|---|
| ACCESS-R-001 | Unknown is not No | VERIFIED_REPO_FACT / architectural invariant | Data | Preserve unknown/unassessed states |
| ACCESS-R-002 | Source provenance retained | VERIFIED_REPO_FACT | Evidence | Source-linked facts remain attributable |
| ACCESS-R-003 | Contradictions preserved | VERIFIED_REPO_FACT | Evidence | Do not silently reconcile conflicting sources |
| ACCESS-R-004 | Financial lane cannot block emergency clinical review | VERIFIED_REPO_FACT | Workflow | Parallel financial work may continue without blocking emergency review |
| ACCESS-R-005 | Willing + orientation contributes to possible pathway only | VERIFIED_REPO_FACT | Prescreen | Output remains possible pathway requiring human review |
| ACCESS-R-006 | Medical stabilization precedence | VERIFIED_REPO_FACT | Prescreen | Medical stabilization can take precedence over placement progression |
| ACCESS-R-007 | Legal/emergency condition requires qualified review | SOURCE_HYPOTHESIS + existing domain pattern | Legal | Route to qualified review; no autonomous legal conclusion |
| ACCESS-R-008 | Age/consent rule must be configured | SOURCE_HYPOTHESIS | Consent | Do not infer consent authority without applicable rule/evidence |
| ACCESS-R-009 | Packet readiness is target-specific | VERIFIED_REPO_FACT | Referral | Missing target requirements remain named gaps |
| ACCESS-R-010 | Readiness has no aggregate authority score | VERIFIED_REPO_FACT | Referral | No hidden score converts gaps into approval |
| ACCESS-R-011 | Acceptance is not admission | PROPOSED_ARCHITECTURE supported by existing object separation | Journey | Keep facility decision distinct from Episode creation |
| ACCESS-R-012 | Rules create work, not screen navigation | PROPOSED_ARCHITECTURE | Workflow | Emit requirement/work item instead of directing to UI component |
| ACCESS-R-013 | Role visibility != authority | PROPOSED_ARCHITECTURE | Authorization | SEE/DO/REVIEW/DECIDE/OWN remain separate |
| ACCESS-R-014 | Synthetic state must disclose fixture class | PROPOSED_ARCHITECTURE | UX/Test | Never render invented state as operational truth |
| ACCESS-R-015 | Admission transitions to Episode | PROPOSED_ARCHITECTURE supported by existing Episode model | Journey | Access ends and episode operations begin |

## Required rule metadata

Every future rule should define:

- `ruleId`
- `version`
- `name`
- `status`
- `scope`
- `inputs`
- `predicate`
- `outputs`
- `precedence`
- `blocks`
- `createsWork`
- `authoritySource`
- `effectiveDate`
- `supersedes`
- `qualifiedReviewer`
- `tests`

## Rule boundaries

A rule may:
- identify missing information;
- identify possible pathways;
- mark dependent transitions blocked;
- create work requirements;
- request/escalate qualified review;
- derive non-clinical workflow state.

A rule must not automatically:
- diagnose;
- determine medical necessity;
- certify legal status;
- decide admission;
- fabricate facility criteria;
- fabricate payer facts;
- grant cross-tenant access.
