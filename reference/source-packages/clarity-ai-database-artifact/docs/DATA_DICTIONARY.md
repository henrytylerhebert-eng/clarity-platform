# Clarity AI Data Dictionary

## Organization
Represents a hospital, health system, crisis provider, payer, receiving facility, transport provider, or administrative entity.

Key controls:
- Every case belongs to one organization.
- Every query must be organization-scoped.
- Cross-organization access must be explicit and audited.

## User
Represents an authenticated workforce user.

Key controls:
- Roles are additive.
- Benefits and authorization roles are separate from clinical approval roles.
- A benefits specialist may not approve clinical or legal determinations unless separately authorized.

## PatientToken
A privacy-controlled patient reference.

Key controls:
- Direct identifiers should be isolated from general operational views.
- The token is used across case, insurance, and workflow records.

## BehavioralHealthCase
The central operational record.

Key addition:
Parallel workstream statuses allow clinical, legal, medical, benefits, authorization, placement, transportation, and patient education work to proceed concurrently.

## SourceDocument
Stores metadata for uploaded or generated records.

Important document types:
- Insurance card
- Benefits verification proof
- Authorization record

## EvidenceItem
Stores candidate or approved facts extracted from source documents.

Important rule:
The original source text must not be silently rewritten.

## HumanReview
Stores human decisions on AI-assisted or rules-assisted outputs.

## LegalStatusRecord
Stores jurisdiction-specific legal status and time-sensitive information.

## MedicalNecessityReview
Maps approved evidence to a selected criteria set.

## RuleSet and Rule
Stores versioned legal, clinical, payer, facility, and workflow rules.

## PayerProfile
Organization-specific payer memory.

May include:
- portal instructions
- phone numbers
- carve-out information
- common pend reasons
- average verification time
- average authorization time

Guardrail:
Payer memory is historical operational guidance, not current-patient verification.

## PlanProfile
Stores plan-family patterns.

Guardrail:
Network status, benefit patterns, and reimbursement history must be labeled as historical until verified for the current patient.

## InsuranceSubscriber
Represents the policyholder when different from the patient.

## InsuranceCoverage
Represents primary, secondary, or tertiary coverage.

Sensitive fields:
- member ID
- group number
- policy number

These should be encrypted at the application layer or with a field-level encryption strategy.

## EligibilityVerification
Stores whether coverage was reported as active, inactive, unclear, or unable to verify.

## EligibilityProof
Links verification evidence to a source document.

## BenefitVerification
Stores quoted benefits for a specific service type.

Important distinction:
A benefit quote is not a guarantee of payment.

## BenefitVerificationSource
Links benefit findings to portal screenshots, call records, fax responses, or other source documents.

## Authorization
Tracks prior authorization or precertification.

Does not imply:
- clinical acceptance
- legal validity
- payment guarantee

## FinancialEducationRecord
Stores who received benefit education, how it was delivered, what uncertainty was disclosed, and whether it was acknowledged.

## FacilityProfile
Stores program capabilities, accepted ages, coverage types, medical capabilities, exclusions, legal-status capabilities, and routing requirements.

## Referral
Tracks a case sent to a receiving facility.

## CustodyEvent
Tracks transfer of legal or physical custody.

## AuditEvent
Immutable record of user, system, agent, and integration actions.