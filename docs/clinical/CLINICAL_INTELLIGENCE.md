---
status: Integrated draft — package spec missing; graded on summary + Jul 8 depth
owner: TBD (requires clinical review)
version: 0.9.0
last_integrated: 2026-07-10
source_artifacts:
  - MASTER_ARCHITECTURE.md §10 (partial package)
  - reference/source-packages/clarity-mh-architecture/docs/workflows/clinical-intake-workflow.md
  - reference/source-packages/clarity-mh-architecture/docs/compliance/clinical-safety-guardrails.md
  - reference/source-documents/clarity-mh-sources/CIA Comp initial Assesment guidance .md
  - app/src/domain/guardrails.ts (implemented pitfall guards)
unresolved_conflicts: "03-clinical-intelligence/CLINICAL_INTELLIGENCE_SPEC.md missing from package"
related_requirements: REQ-010…REQ-014
related_adrs: ADR-0001
---

# Clinical Intelligence

## Scope

The clinical layer organizes: referral reason, current symptoms, risk indicators, protective factors, psychiatric history, substance-use considerations, medications, medical concerns, legal/custody status, disposition objective, and unresolved questions. It supports contradiction grouping, timeline, missing-information detection, medical-necessity criteria mapping, and medical-screening gap detection.

## Hard boundaries

It does **not** diagnose, declare safety, approve admission, or declare medical clearance (REQ-014). The implemented prohibited-language guard (`app/src/domain/guardrails.ts`, tested) blocks claims such as "meets InterQual" or "admission is medically necessary" without qualified human review.

## Assessment architecture (crisis generation, implemented in prototype)

Field mode (short, coached capture for non-clinicians) and clinical mode (structured psychiatric assessment), with age branching (youth/adult/geriatric). Grounded in the CIA comprehensive-assessment guidance and central-intake SOP (see source artifacts). Collateral sources are captured with source attribution and confidence.

## Medical necessity

Draft narratives map evidence to criteria and are inputs to authorization preparation; they are always review-gated drafts. Criteria packs (InterQual/MCG or payer-specific) are **not licensed or included** — an open decision.

## Open items

- Package clinical spec missing — re-compare when obtained.
- Clinical criteria licensing and governance review required before any criteria mapping ships.
- Assessment content requires clinician sign-off (`docs/decisions/OPEN_DECISIONS.md`).
