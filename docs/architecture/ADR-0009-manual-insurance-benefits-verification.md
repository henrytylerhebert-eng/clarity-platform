# ADR-0009 — Manual Insurance and Benefits Verification

- **Status:** Accepted
- **Date:** 2026-07-13
- **Related:** ADR-0008 (evidence — the fact source), ADR-0003 (command pattern), `docs/planning/MVP_ROADMAP.md` (Phase 1), `docs/implementation/BENEFITS_VERIFICATION_IMPLEMENTATION.md`

## Context

The first business-value vertical slice: a benefits specialist calls the payer (or reads the portal), and Clarity records what they learned — coverage, eligibility, a benefit quote, and the patient-education conversation — with the same tenancy/audit/concurrency discipline as every prior layer. **Entirely human-performed:** no X12 270/271, no payer APIs, no automation. Automation, when it comes, lands behind these same commands.

## Decisions

### 1. Four commands, one new package

`@clarity/benefits-service` + `PrismaBenefitsGateway` (in the one approved Prisma package): `RecordInsuranceCoverage`, `VerifyEligibility`, `RecordBenefitVerification`, `RecordFinancialEducation`. Audit vocabulary: `INSURANCE_COVERAGE_RECORDED`, `ELIGIBILITY_VERIFICATION_RECORDED`, `BENEFIT_VERIFICATION_RECORDED`, `FINANCIAL_EDUCATION_RECORDED`.

### 2. Coverage must cite approved insurance evidence

A coverage record requires ≥1 evidence item from the same case with `category: INSURANCE` and `status: APPROVED` — validated inside the transaction. This is the pre-existing human-review gate (`canUseExtractedInsurance`) made structural: nothing unreviewed can feed verification, and when AI extraction arrives it inherits the same funnel (extract → candidate evidence → human approval → coverage).

### 3. Member/group/policy identifiers are structurally unacceptable

The schema's `memberIdEncrypted`/`groupNumberEncrypted`/`policyNumberEncrypted` columns **stay NULL**: no encryption capability exists, and storing plaintext in columns named `Encrypted` would be a lie. Command envelopes have **no fields** for these identifiers (strict Zod rejects them), so they cannot enter the database or audit trail by any path. Staff reference the source insurance-card document, which the coverage record cites. Structured identifier storage is gated on a real encryption story (production-readiness work, MVP_ROADMAP).

### 4. Existing binding contracts are honored, not reinvented

- **Subscriber-relationship gate:** `UNKNOWN` blocks eligibility verification (`canStartEligibilityVerification`).
- **Eligibility state machine:** each verification attempt is a new immutable row; successive attempts must satisfy `canTransitionEligibility` from the previous attempt's status (e.g. `FAILED → ACTIVE_CONFIRMED` must re-enter through `PENDING`). The first attempt sets the initial state.
- **Disclaimer rule:** `RecordBenefitVerification` requires `disclaimerProvided: z.literal(true)` — a quote physically cannot be recorded without the not-a-payment-guarantee disclaimer; the row is written `disclaimerStatus: PROVIDED`.
- **Contract correction:** `SUBSCRIBER_RELATIONSHIPS` said `CHILD`, which is not in the schema enum (`PARENT`/`GUARDIAN` are); fixed to mirror the schema per the keep-in-sync rule.

### 5. Coverage status is a rolled-up, version-guarded aggregate

Eligibility outcomes roll up: `ACTIVE_CONFIRMED→ACTIVE`, `INACTIVE→INACTIVE`, `UNCLEAR→UNCLEAR`, `FAILED→UNABLE_TO_VERIFY`; `PENDING` leaves it untouched. The rollup UPDATE carries the coverage `version` predicate (optimistic concurrency, same discipline as cases/documents/evidence). Benefit quotes are only recordable against `ACTIVE` coverage.

### 6. Schema change (justified; tables verified empty)

Migration `coverage_tenancy_and_versioning`: `InsuranceCoverage` gains `organizationId` (tenant scope on the row, consistent with the evidence precedent) and `version`; index `[organizationId, caseId]`. Child rows (eligibility/benefit/education) are append-only and scope through their parent's predicates.

### 7. Financial education records honest uncertainty

`FinancialEducationRecord` captures who was educated, how, topics reviewed, `uncertaintiesDisclosed` (what could NOT be confirmed — disclosed, not hidden), and acknowledgement status; optionally linked to the quote it explains (cross-case links refused). Shared with `INTAKE_COORDINATOR`, matching the `patientEducation` workstream policy.

### 8. Audit metadata carries references, not amounts or identifiers

Coverage/eligibility/benefit audit events carry ids, enums, counts, and payer references — no dollar amounts, no identifiers (verified by test; the restricted-identifier guard also runs on every write).

## Out of scope (deliberate)

PayerProfile/PlanProfile management and payer-memory institutional knowledge (raw payer/plan names suffice for Phase 1); `InsuranceSubscriber` person records (relationship enum on coverage covers the MVP need — subscriber PII stays in source documents with the identifiers); X12/portal integrations; coordination-of-benefits logic beyond the PRIMARY/SECONDARY/TERTIARY ordering column.

## Consequences

- Authorization readiness (Phase 2) can read `authorizationRequired` off recorded quotes and coverage status directly.
- The benefits workstream status on the case is still updated via the case command service by the caller — no cross-service smuggling.
- Known limits: no re-verification scheduling/expiry on eligibility; education records are append-only with no correction path yet; subscriber identity beyond the relationship enum is deferred with the identifier/encryption decision.
