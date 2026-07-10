# Clarity AI Master Architecture

## 1. Vision

Clarity AI is a proposed behavioral-health case-intelligence and access-orchestration platform.

It is designed for the operational space between referral receipt and care transition: document intake, evidence review, clinical and legal support, benefits verification, authorization, placement, transport, custody, communication, and audit.

The product does not replace professional judgment. It creates a structured environment in which qualified people can see the source, uncertainty, rule, owner, deadline, and history behind each material action.

## 2. Product thesis

Behavioral-health access problems rarely come from one missing decision.

They frequently come from fragmented information and fragmented ownership:

- records arrive by multiple channels
- facts conflict
- legal status is time-sensitive
- facilities have different capabilities
- benefits require separate verification
- authorization may depend on a complete clinical narrative
- transport and custody require coordination
- staff change across shifts
- phone and portal work is difficult to reconstruct
- final outcomes are not connected back to the initial process

Clarity turns those fragments into one auditable case.

## 3. Product promise

> Clarity turns fragmented behavioral-health referrals into structured, source-linked, clinically reviewable, legally traceable, and financially informed care pathways.

## 4. Core questions

For every case, Clarity should answer:

1. What is documented?
2. What is the source?
3. What is missing, stale, or contradictory?
4. What can proceed now?
5. What is blocked?
6. Which rule or requirement creates the block?
7. Who owns the next action?
8. Which qualified person must approve it?
9. What happened after the decision?
10. What can the organization learn?

## 5. Platform layers

### Controlled knowledge

- clinical guidance
- legal authorities
- payer policies
- facility criteria
- organizational procedures
- contract information
- historical operational memory

### Case intelligence

- documents
- candidate evidence
- source links
- timeline
- contradictions
- missing information
- structured summaries

### Bounded reasoning

- medical necessity
- medical screening
- legal status
- eligibility and benefits
- authorization
- facility matching
- packet readiness

### Workflow orchestration

- overall case state
- parallel workstreams
- tasks
- deadlines
- blockers
- escalation
- approvals

### User workspaces

- case queue
- case overview
- evidence
- clinical
- legal
- benefits
- authorization
- packet
- routing
- custody
- audit
- analytics

### Governance

- permissions
- source versions
- rule versions
- prompt and model versions
- human review
- audit
- evaluations
- incident response

## 6. Core operating spine

The base architecture is:

```text
Case
Documents
Evidence
Review
Rules
Workflow
Audit
```

The expanded domain architecture is:

```text
Case
Documents
Evidence
Clinical Review
Legal Review
Medical Screening
Insurance
Eligibility
Benefits Verification
Authorization
Placement
Custody
Communication
Workflow
Audit
Intelligence
```

The expansion does not discard prior work. Each added domain uses the same source, evidence, rule, workflow, review, and audit primitives.

## 7. Parallel workstreams

One linear status cannot represent real intake work.

Clarity therefore maintains:

- an overall case status
- clinical status
- legal status
- medical-screening status
- benefits status
- authorization status
- placement status
- transportation status
- patient-education status

A case may be:

- clinically in progress
- legal review pending
- medically complete
- benefits in progress
- placement ready

at the same time.

## 8. Emergency and fairness rule

Financial readiness remains separate from clinical urgency.

Clarity must not:

- delay emergency review solely because insurance is unknown
- hide payer weighting inside a priority score
- recommend the financially strongest referral as the clinically highest priority
- use reimbursement as a substitute for care need

Clarity may show financial readiness so staff can start verification and authorization earlier.

## 9. Document and evidence architecture

Original documents are preserved with metadata, version, checksum, source, and access classification.

Agents may create candidate evidence containing:

- original source text
- normalized value
- category
- source page or section
- author and time
- extraction confidence

Qualified users approve, correct, reject, or request clarification.

Rejected or superseded evidence remains auditable but cannot support approved output.

## 10. Clinical intelligence

The clinical layer organizes:

- referral reason
- current symptoms
- risk indicators
- protective factors
- psychiatric history
- substance-use considerations
- medications
- medical concerns
- legal and custody status
- disposition objective
- unresolved questions

It also supports:

- contradiction grouping
- timeline
- missing information
- medical-necessity criteria mapping
- medical-screening gap detection

It does not diagnose, declare safety, approve admission, or declare medical clearance.

## 11. Legal-status intelligence

The legal layer:

- selects the approved jurisdictional rule set
- identifies the documented legal-status type
- checks forms, signatures, dates, and required elements
- calculates configured deadlines
- distinguishes law, policy, and operational practice
- shows source authority and version

It does not declare a hold valid, decide competency, or authorize transfer.

## 12. Benefits verification

Benefits verification begins as soon as reliable identity and insurance information is available.

The workflow separates:

- data extraction
- subscriber relationship
- coverage order
- eligibility
- service-specific benefits
- network status
- authorization requirement
- patient education
- claim outcome

Clarity records verification method, proof, representative, reference, time, and unresolved questions.

A benefit quote is not a payment guarantee.

## 13. Payer memory

Clarity may retain organization-specific historical knowledge:

- payer aliases
- portal instructions
- contact numbers
- carve-outs
- common requirements
- pend and denial patterns
- typical verification time
- typical authorization time

This information is labeled historical and unconfirmed for the current patient.

## 14. Authorization

The authorization workflow tracks:

- preparation
- submission
- pending
- approval
- partial approval
- denial
- appeal
- approved dates or units
- concurrent review

Agents may prepare materials. An authorized human records or initiates external action.

Authorization does not guarantee reimbursement.

## 15. Patient financial education

Clarity may prepare a plain-language benefit summary that separates:

- verified fact
- estimate
- unresolved uncertainty
- final claim outcome

The record includes recipient, language, interpreter, method, acknowledgement, and staff member.

## 16. Facility intelligence and routing

Facility profiles contain:

- programs
- ages
- legal-status capabilities
- medical capabilities
- payer relationships
- exclusions
- transport requirements
- referral requirements
- verification date

Facility matching returns:

- likely fit
- possible fit with clarification
- unlikely fit
- unable to assess

It never guarantees acceptance.

## 17. Packet and communication

A referral packet is versioned and approved before export or transmission.

It may contain:

- cover sheet
- source-linked summary
- clinical records
- legal documents
- insurance proof
- authorization status
- unresolved issues

Communications are recorded across phone, secure email, fax, portal, EHR, API, and internal notes.

Agents may draft; authorized humans send.

## 18. Custody and transport

The custody ledger tracks:

- legal custodian
- physical custodian
- location
- authority
- transport provider
- from and to parties
- time
- supporting documents

Closure is blocked when required handoff data is missing.

## 19. Agent architecture

Clarity uses specialized agents:

- document classification
- evidence extraction
- insurance extraction
- contradiction detection
- missing information
- timeline
- case summary
- medical necessity
- medical screening
- legal status
- verification preparation
- payer memory
- authorization preparation
- patient education
- facility matching
- packet building
- communication drafting
- audit review
- retrospective operations review

Each agent has a contract, allowlisted tools, output schema, source requirements, prohibited actions, validation, and human-review rule.

## 20. Knowledge, rules, and retrieval

Controlled sources are separated into collections and tagged with authority, jurisdiction, effective date, version, owner, and status.

Retrieval is:

- organization-scoped
- case-scoped for patient data
- permission-aware
- date-aware
- source-type-aware
- citation-producing
- auditable

Deterministic rules handle explicit requirements and block only the dependent step.

## 21. Data architecture

The data model covers:

- tenant and identity
- case and workflow
- documents and evidence
- clinical and legal review
- insurance and payer
- placement and custody
- AI and knowledge
- governance and audit

Sensitive identifiers and contract data receive restricted access and stronger protection.

The package includes a foundation schema and an expanded target draft. Both require developer validation.

## 22. Security and privacy

Required controls include:

- authentication and MFA
- least privilege
- tenant isolation
- case permissions
- encryption
- secrets management
- object-store controls
- field masking
- audit
- backup and restore
- model-provider governance
- prompt-injection defense
- incident response

No real patient data should enter the prototype.

## 23. User experience

The UI must show:

- draft versus approved
- source links
- missing information
- contradictions
- profile age
- rule version
- model contribution
- reviewer
- workstream status
- owner and next action

It must not show a generic confidence number as if it were clinical truth.

## 24. Evaluation

The evaluation strategy includes:

- extraction accuracy
- citation support
- contradiction detection
- legal and clinical prohibited-language tests
- benefits and payment-language tests
- tenant isolation
- prompt injection
- workflow integrity
- human factors
- fairness

Synthetic cases cover commercial, Medicare Advantage, traditional Medicare, supplemental, uninsured, minors, coordination of benefits, medical exclusion, legal deadlines, and no-bed scenarios.

## 25. Roadmap

The build sequence is:

1. foundation
2. case spine
3. workflow
4. documents
5. evidence
6. case intelligence
7. clinical and legal
8. insurance and eligibility
9. benefits and education
10. authorization
11. packet and facility
12. custody and communication
13. analytics
14. hardening
15. controlled pilot

## 26. Commercial model

Initial positioning:

> Behavioral-health case intelligence and access orchestration.

Potential packaging:

- Core
- Professional
- Enterprise

Value should be measured through time, touches, rework, verification, authorization, packet quality, access, denials, and audit.

Pricing and ROI remain hypotheses until validated.

## 27. Immediate next step

Create the repository and validate the schema.

Then implement:

- tenant-scoped repositories
- case state machine
- parallel statuses
- workflow tasks
- audit helper
- synthetic fixtures
- unit and workflow tests

Do not begin with live agents or real patient data.
