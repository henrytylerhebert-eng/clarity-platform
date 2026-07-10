# Integration Plan: Adding Benefits Verification Without Restarting the Build

## Decision

Do not restart the Clarity architecture.

The benefits-verification domain is inserted into the existing case spine as a parallel workstream. The existing sequence remains intact:

1. Case
2. Documents
3. Evidence
4. Review
5. Rules
6. Workflow
7. Audit

The expanded spine becomes:

1. Case
2. Documents
3. Evidence
4. Clinical review
5. Legal review
6. Insurance extraction
7. Eligibility verification
8. Benefits verification
9. Authorization
10. Placement
11. Custody
12. Workflow
13. Audit
14. Intelligence

## How It Fits the Current Roadmap

### Existing Sprint 0
No change.

Repository, CI, linting, tests, environment validation, security documents, and governance remain the foundation.

### Existing Sprint 1: Identity and Case Spine
Add parallel workstream statuses to the case:

- clinicalStatus
- legalReviewStatus
- medicalScreeningStatus
- benefitsStatus
- authorizationStatus
- placementStatus
- transportationStatus
- patientEducationStatus

Add roles:

- BENEFITS_VERIFICATION_SPECIALIST
- AUTHORIZATION_SPECIALIST

This avoids forcing the entire intake process through a single linear status.

### Existing Sprint 2: Documents
Add document types:

- INSURANCE_CARD
- BENEFITS_VERIFICATION
- AUTHORIZATION_RECORD

The same document service handles them. No separate upload system is needed.

### Existing Sprint 3: Evidence
Add evidence categories:

- INSURANCE
- AUTHORIZATION

Insurance-card extraction becomes another evidence pipeline. Candidate insurance fields still require review.

### Existing Sprint 4: Case Intelligence
Add:

- insurance completeness check
- subscriber relationship check
- primary/secondary coverage identification
- missing member ID or group number flags

### Existing Sprint 5: Medical Necessity
No structural change.

Medical-necessity output becomes an input to authorization preparation.

### Existing Sprint 6: Legal Status
No structural change.

Legal status remains visible to authorization, placement, and admission workflows.

### New Sprint 6A: Insurance and Eligibility
Add:

- payer profiles
- plan profiles
- subscriber records
- insurance coverage records
- eligibility verification
- verification proof

### New Sprint 6B: Benefits Verification
Add:

- network status
- deductible
- coinsurance
- copay
- out-of-pocket limits
- service coverage
- authorization requirement
- quoted-benefit disclaimer

### New Sprint 6C: Authorization
Add:

- authorization preparation
- submission
- approval/denial tracking
- approved days or units
- concurrent review dates
- appeal status

### Existing Sprint 7: Packet Builder
Add insurance and authorization manifests:

- coverage summary
- verification proof
- authorization status
- patient education status

### Existing Sprint 8: Facility Routing
Add financial readiness indicators without allowing payer value to override clinical urgency.

### Existing Sprint 9: Custody Ledger
No structural change.

### Existing Sprint 10: Evaluation and Hardening
Add:

- insurance extraction accuracy
- verification workflow completeness
- patient responsibility disclaimer tests
- payer-memory misuse tests
- authorization status transition tests
- fairness tests for referral prioritization

## What We Are Preserving

- Existing case model
- Existing evidence model
- Existing source-linking approach
- Existing human review gates
- Existing rules engine
- Existing audit architecture
- Existing packet and placement workflow

## What We Are Adding

- Insurance coverage as a first-class entity
- Subscriber relationships
- Eligibility verification
- Benefits verification
- Authorization tracking
- Patient financial education
- Payer and plan memory
- Financial readiness as a separate operational dimension

## What We Are Explicitly Avoiding

- Restarting the repository
- Creating a second intake system
- Treating payer history as current verification
- Combining clinical urgency and financial value into one opaque score
- Allowing financial readiness to control emergency clinical review
- Storing raw member IDs without encryption
- Presenting quoted benefits as guaranteed payment

## Migration Strategy

If the repository already contains case, document, evidence, workflow, and audit tables:

1. Add new enums.
2. Add parallel workstream fields to the case table.
3. Create payer, plan, subscriber, coverage, verification, authorization, and education tables.
4. Add insurance and authorization document types.
5. Add insurance and authorization evidence categories.
6. Backfill existing cases with NOT_STARTED workstream statuses.
7. Do not modify existing clinical or legal records.
8. Add new audit actions.
9. Add synthetic test cases before UI development.
10. Release behind a feature flag.

## Recommended Feature Flags

- benefits_verification
- payer_memory
- authorization_management
- patient_financial_education
- referral_prioritization
- contract_rate_intelligence

## Recommended Order of Implementation

1. Schema and migrations
2. Synthetic seed data
3. Coverage entry and review UI
4. Eligibility workflow
5. Benefits workflow
6. Authorization workflow
7. Patient education record
8. Payer-memory retrieval
9. Analytics and retrospective decision review
10. External clearinghouse or payer integrations

## Why This Is the Right Path

The original architecture was built around reusable domain primitives:

- documents
- evidence
- rules
- workflow
- audit

Benefits verification uses the same primitives.

That means the system is expanding, not being rebuilt.