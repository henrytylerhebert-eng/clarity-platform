# Journey Component Crosswalk

This crosswalk keeps the new journey workspaces tied to existing Clarity artifacts. The new surfaces are projections and coordination views; they do not replace the source workspaces listed below.

| Component | Primary owner | Source artifacts | Existing resolution surface | Completion evaluator | Prototype test coverage |
|---|---|---|---|---|---|
| Prescreen | Field responder / Central Intake | Case, encounter, assessment, source references, risk findings, human triage record | Prescreen, Guided Intake, Evidence Review | Minimum screen facts + explicit human triage/disposition + owner handoff | `journey.test.ts`, `App.test.tsx`, Playwright journey flow |
| Intake Stage 1 | Field responder / crisis clinician | Encounter, assessment, risk/source records | Guided Intake | Initial field/crisis facts recorded | `journey.test.ts`, existing Guided Intake tests |
| Intake Stage 2 | Registered nurse | Medical screening, vitals, allergies, medication reconciliation, handoff | Guided Intake, Stage 2 Nursing tab | Source-linked RN record, reconciliation state, safety review, and RN attestation | `journey.test.ts`, `App.test.tsx`, staged Guided Intake smoke |
| Intake Stage 3 | Clinical/social-services integrator | Assessment, collateral, source-linked risk, formulation, early discharge prompts | Guided Intake, Evidence Review, Medical Necessity | Integrated facts, conflicts, and review status | `journey.test.ts`, staged Guided Intake smoke |
| Final clinical review | Authorized clinical reviewer | Assessment, evidence, medical necessity, legal review, conflicts | Medical Necessity, Legal Status, Evidence Review | Qualified review/signature status | Existing domain tests + Journey Monitor projection |
| Psychiatrist acceptance | Receiving/admitting psychiatrist | Admission checkpoint | Admission Readiness | Explicit acceptance checkpoint | `journey.test.ts`, `App.test.tsx`, Playwright flow |
| Medical clearance | Authorized medical reviewer | Medical clearance record, screening source references | Admission Readiness; screening source remains Guided Intake | Explicit clearance approval; never inferred from Medical Necessity | `journey.test.ts`, `caseDependencyMap.test.ts` |
| Operational readiness | Central Intake / facility / charge nurse | Facility referrals, facility responses, beds, placement recommendations | Routing Response, Bedboard | Accepted facility + operational placement state | Existing routing/bedboard tests + Journey projection |
| Arrival and handoff | Facility / transport / receiving nurse | Custody ledger events, handoff checkpoint | Custody Ledger, Admission Readiness | Arrival or custody handoff recorded | `journey.test.ts`, Playwright flow |
| Admission episode | Receiving facility | Episode linkage, admitted time, orders, initial post-admission review | Admission Readiness creates a local synthetic adapter-shaped record; Episode & UR remains a read-only UR projection; backend `Episode` / `CaseEpisodeLink` persistence is already bounded separately | Case-owned episode record with explicit linkage, orders, and initial review; no inference from arrival alone | `journey.test.ts`, `App.test.tsx`, Playwright journey flow |
| Discharge planning | Central Intake / clinical-social services | Goals, family/supports, housing, level of care, medications, follow-up, notifications | Discharge Planning plus existing clinical/legal/placement surfaces | Human-reviewed disposition and confirmed or unresolved domains | `journey.test.ts`, `App.test.tsx`, Playwright journey flow |
| Operations payer profiles | Benefits / UR operations | Existing `PayerProfile` / `PlanProfile` concepts; local synthetic coverage snapshot | Benefits Verification walkthrough, Authorization Readiness, Dependency Map | Profile prompts are visible; current-patient eligibility, benefits, and authorization still require human verification | `payerProfiles.test.ts`, Central Intake Playwright walkthrough |

## Shared Rules

- Medical screening, medical clearance, medical necessity, and psychiatrist acceptance remain separate concepts.
- Financial and authorization work is a parallel lane and cannot block emergency clinical review.
- Unknown, not assessed, unable to obtain, declined, and conflicting are explicit incomplete states.
- Product gaps are visible and never counted as patient progress.
- The Journey Monitor and Dependency Map derive from local synthetic state; source workspaces own changes.
- The local admission episode record mirrors the existing backend contract for POC walkthroughs; it is not a second persistence gateway or production API.
- The local operations payer adapter exposes Medicare, Medicaid, VA, and commercial profile families for POC discovery. It supplies prompts and provenance only; it does not recreate payer criteria or replace current-patient verification.
- POC/customer-discovery approval is recorded in `19_POC_DOMAIN_REVIEW_AND_CONTRACT_APPROVAL.md`; domain-owner review remains required for authoritative rules.
