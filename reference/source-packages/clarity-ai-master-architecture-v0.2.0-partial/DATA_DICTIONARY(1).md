# Comprehensive Data Dictionary

## Identity and tenancy

### Organization

Represents the tenant or participating entity.

Examples:

- sending hospital
- receiving facility
- hospital system
- crisis provider
- transport provider
- payer
- administrative organization

Important controls:

- every tenant-owned query is organization-scoped
- cross-organization sharing is explicit
- jurisdiction settings are organization-aware

### User

Represents an authenticated workforce user.

Important fields:

- organization
- email and display name
- roles
- status
- last login

Important control:

A role permits capabilities; it does not automatically give access to every case.

### PatientToken

Represents a privacy-controlled patient reference used by operational workflows.

Important controls:

- direct identity should be separated where feasible
- tokenized analytics should avoid direct identifiers
- identity reveal should be logged

## Case and workflow

### BehavioralHealthCase

The central operational record.

Contains:

- organization
- patient token
- assigned owner
- overall status
- urgency
- current location
- requested level of care
- current legal status
- parallel workstream statuses
- open and close times

### WorkflowTask

An owned action with status and optional deadline.

Examples:

- request psychiatric evaluation
- verify benefits
- submit authorization
- follow up with facility
- record custody handoff

### DecisionRecord

The human rationale for advancing, holding, escalating, rerouting, accepting, declining, or closing a case.

It separates clinical, legal, medical, facility, benefits, and capacity factors.

### ReferralPriorityAssessment

Displays four separate dimensions:

- clinical urgency
- operational readiness
- placement readiness
- financial readiness

It is not a single proprietary score.

### RetrospectiveReview

A post-case operational review containing:

- metrics
- strengths
- efficiency gaps
- recommendations
- reviewer status

## Documents and evidence

### SourceDocument

Metadata and storage reference for an original or generated file.

Important fields:

- type
- filename
- MIME type
- storage key
- checksum
- source organization
- author
- service date
- classification status
- version

Original files should be immutable.

### EvidenceItem

A candidate or approved fact linked to a source document.

Important fields:

- category
- original text
- normalized value
- source location
- source author and time
- extraction confidence
- status
- contradiction group
- reviewer

### CitationRecord

Links a generated output to:

- source document
- evidence item
- controlled knowledge source
- page or section
- excerpt or excerpt hash

### CaseSummary

A versioned structured summary generated from approved evidence.

### HumanReview

Records approval, approval with edits, rejection, or a request for more information.

## Clinical and legal

### LegalStatusRecord

Stores:

- jurisdiction
- legal status type
- authority
- initiation time
- possible expiration
- form reference
- signature status
- review status

It does not itself prove legal validity.

### MedicalNecessityReview

Stores the criteria set, version, supporting evidence, missing evidence, contradictions, draft narrative, reviewer, and decision.

### RuleSet

A versioned group of legal, clinical, payer, facility, or workflow rules.

### Rule

A deterministic or structured condition with:

- code
- description
- outcome
- message
- severity
- citation

### RuleEvaluation

Stores the result of applying one rule to one case context.

## AI and knowledge

### PromptRecord

Versioned prompt metadata and governance.

### AgentRun

Stores model, prompt, inputs, retrieved sources, rule sets, validation results, warnings, status, and timing.

### KnowledgeSource

Represents a controlled source such as:

- law
- regulation
- official guidance
- clinical guidance
- payer policy
- facility policy
- organizational policy
- contract
- historical operational note

Important fields include authority, jurisdiction, effective date, status, owner, and approval.

## Insurance and payer

### PayerProfile

Organization-specific payer memory.

May include:

- aliases
- portal labels
- contact numbers
- carve-outs
- common pend or denial reasons
- typical verification and authorization time
- last verification date

Historical profile data is not current-patient verification.

### PlanProfile

Plan-family memory containing historical network, benefit, authorization, exclusion, and reimbursement patterns.

### InsuranceSubscriber

The policyholder when different from the patient.

### InsuranceCoverage

Represents primary, secondary, or tertiary coverage.

Contains:

- payer and plan
- coverage type
- subscriber relationship
- masked or encrypted identifiers
- coverage status
- source documents
- review

### EligibilityVerification

Stores whether coverage was reported active for the relevant period.

### BenefitVerification

Stores service-specific quoted benefits, including network status and patient-cost fields.

### PayerContactEvent

Records the operational contact, time, representative, reference, questions, answers, proof, and follow-up.

### Authorization

Tracks preparation, submission, approval, partial approval, denial, appeal, approved dates or units, and concurrent review.

### FinancialEducationRecord

Records what was explained, to whom, in what language and method, and whether it was acknowledged.

### ContractRateRecord

Restricted organizational contracting information.

### ClaimOutcome

Optional downstream adjudication data used to compare verification and authorization with actual outcomes.

## Placement, packet, communication, and custody

### FacilityProfile

Stores programs, ages, payer relationships, medical capabilities, exclusions, legal-status capabilities, transport rules, referral requirements, and verification date.

### FacilityMatch

A reviewable comparison between case needs and one facility profile.

### ReferralPacket

A versioned packet with cover sheet, missing items, outdated items, approval, and transmission status.

### PacketItem

One ordered element in a packet.

### Referral

A case-to-facility routing record and response.

### CommunicationRecord

A phone, secure email, fax, portal, EHR, API, in-person, or internal communication.

### CustodyEvent

A time-ordered transfer of legal or physical responsibility.

## Governance and integration

### AuditEvent

Append-only record of user, system, agent, or integration activity.

### IntegrationEndpoint

Organization-specific integration configuration and health metadata.

Secrets should be stored in a secrets service, not as ordinary database text.
