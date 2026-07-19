# Data Collection and Governance Requirements

## Collection Principle

Stakeholders should generate trustworthy data through their normal work. The product should not require a duplicate reporting workflow whenever a source workflow can emit a governed event.

## Stakeholder Contributions

| Stakeholder | Normal workflow data |
| --- | --- |
| Intake/admissions | referral source, acceptance, admission, program, unit, payer |
| Nursing | census, transfer, observation burden, incidents, discharge readiness |
| Utilization review | authorization reviews, approved/denied days, due dates, denial reasons |
| Clinicians/HIM | documentation completion, gaps, treatment milestones, disposition |
| Finance/revenue cycle | contract assumptions, claim status, revenue days, adjustments |
| Staffing leadership | worked hours, budget hours, agency, overtime, PTO, training, 1:1 coverage |
| Quality/compliance | incidents, complaints, corrections, attestations, submissions |
| Patient/outcomes teams | follow-up completion, continuity, approved outcome instruments |

## Acquisition Paths

The architecture must support staged adapters for:

- native Clarity workflow events;
- EHR/FHIR or HL7 interfaces;
- payer and authorization interfaces;
- staffing/payroll interfaces;
- controlled CSV/SFTP imports;
- human-attested manual entry;
- later agency submission/acknowledgement interfaces.

Every acquisition path must normalize into versioned contracts. Source-specific values must not leak into the canonical domain without an explicit mapping.

## Required Event Metadata

- event identifier;
- schema name and version;
- organization and facility scope;
- program and unit scope when applicable;
- case and/or episode reference;
- de-identified person token where allowed;
- event type and effective time;
- recorded time;
- actor or source-system identity;
- source system and provenance;
- correlation and causation identifiers;
- PHI classification;
- data-quality state;
- review/attestation state;
- correction or supersession reference;
- metric eligibility state.

## Data Zones

1. `Transactional PHI zone`: tenant-scoped case, episode, document, clinical, authorization, and operational records.
2. `Governed event zone`: validated immutable event envelopes with correction/supersession handling.
3. `De-identification zone`: tokenization, field minimization, date/generalization policy, and small-cell controls.
4. `Analytics mart`: reusable facts, dimensions, metric snapshots, and versioned definitions.
5. `Presentation/export zone`: role-scoped dashboards and approved aggregate exports.

## Governance Rules

- Raw PHI must not be copied into executive or regulator-facing dashboards by default.
- Every metric must have a name, definition, numerator, denominator, exclusions, grain, source events, owner, version, effective date, and quality status.
- Corrections must preserve the original event and establish an auditable supersession chain.
- Late events must trigger controlled recomputation rather than silent historical mutation.
- Cross-tenant aggregation requires explicit authority, purpose limitation, minimum cohort thresholds, and audit.
- Regulator exports require jurisdiction-specific definitions, review/attestation, submission history, acknowledgement, correction, and resubmission.
- Historical payer intelligence must never replace current-patient verification.
- No clinical, legal, discharge, admission, placement, or authorization decision may be automated solely from analytics output.

## Questions Requiring Explicit Decisions

- Exact production identity provider
- Tenant model and cross-organization authority
- Analytics storage/runtime provider
- De-identification standard and approved date handling
- Retention and deletion schedules
- Applicable agency reports and jurisdictions
- Data-use agreements and benchmark permissions
- EHR and payer integration priorities
- Who owns each metric definition and approval

