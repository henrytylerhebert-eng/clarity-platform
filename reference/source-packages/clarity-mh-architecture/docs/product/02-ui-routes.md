# UI Routes and Screens

## Route map

### `/command-center`

System-wide intake dashboard.

Cards:

- Active cases by acuity
- Cases breaching SLA
- Legal deadlines
- Awaiting clinician review
- Awaiting insurance verification
- Awaiting facility response
- Transport pending
- Packet incomplete
- Admission completed

### `/cases`

Case list.

Columns:

- Case ID
- Patient display name or pseudonym
- Age group
- Current location
- Referral source
- Legal status
- Acuity
- Packet completeness
- Routing status
- Current owner
- SLA status

### `/cases/new`

Create new intake case.

Minimum fields:

- referral source
- callback/contact
- patient name or pseudonym
- age/DOB estimate
- current location
- presenting concern
- urgency
- source type
- consent/permission status if known

### `/cases/[caseId]`

Case dashboard.

Sections:

- status strip
- legal status
- current risk summary
- medical suitability
- medical necessity readiness
- source references
- open tasks
- active routing requests
- custody ledger preview
- audit trail preview

### `/cases/[caseId]/call-coach`

Guided call/intake coach.

Progressive sections:

1. Who is calling and where is the patient?
2. What happened today?
3. What are you most afraid will happen next?
4. Danger to self.
5. Danger to others.
6. Grave disability / inability to care for self.
7. Altered mental status, psychosis, paranoia, delusions, hallucinations.
8. Depression, anxiety, insomnia, eating/sleeping disruption.
9. Substance use, intoxication, withdrawal.
10. Medical issues and medications.
11. History of mental illness and prior treatment.
12. Current stressors and supports.
13. Insurance and payer information.
14. Collateral contacts.
15. Immediate safety and next steps.

### `/cases/[caseId]/assessment`

Structured psychiatric assessment.

Tabs:

- Presenting crisis
- Risk
- MSE
- Psychiatric history
- Substance use
- Medical suitability
- Functional status
- Life stressors
- Collateral
- Age-specific sections
- Formulation and plan

### `/cases/[caseId]/medical-necessity`

Medical necessity workbench.

Panels:

- Severity of illness
- Intensity of service
- Risk of harm
- Functional impairment
- Treatment history / lower LOC
- Environmental stressors
- Engagement in care
- Medical suitability
- Missing documentation
- Draft narrative

### `/cases/[caseId]/legal`

Legal instrument workbench.

Tabs:

- Legal status determination
- OPC
- PEC
- CEC
- Signatures and attestations
- Deadlines
- Counsel validation notes
- Form version history

### `/cases/[caseId]/routing`

Request-broadcast routing.

Sections:

- recommended level-of-care range
- facility eligibility filters
- packet preview
- broadcast recipients
- facility responses
- accept / decline / more-info log
- re-route history

### `/cases/[caseId]/packet`

Referral packet builder.

Includes:

- demographics summary
- referral source summary
- presenting crisis
- risk summary
- MSE summary
- medical suitability
- legal documents
- collateral summary
- medications
- substance use
- insurance/authorization status
- treatment recommendation draft
- source references
- custody ledger hash
- export status

### `/cases/[caseId]/custody-ledger`

Chain-of-custody view.

Shows:

- event timeline
- previous hash
- event hash
- actor
- timestamp
- artifact IDs
- verification result
- tamper check

### `/facilities`

Receiving facility directory.

Fields:

- facility name
- program types
- accepted age groups
- payer accepted
- acuity limits
- medical exclusions
- contact routes
- average response time
- accept/decline rates

### `/analytics`

Quality and executive dashboards.

Dashboards:

- team monthly scorecard
- individual quarterly scorecard
- executive quarterly summary
- denial feedback loop
- referral source performance
- facility response performance
