# Clarity Crisis Platform - Project Architecture

## 1. Product Thesis

Clarity is a behavioral-health crisis platform for crisis intake, legal documentation, chain of custody, transfer coordination, and inpatient bed placement.

The product should be built around one continuous case record. A field officer, mobile crisis worker, social worker, ED intake nurse, psychiatrist, UR team member, coroner, admissions coordinator, or inpatient charge nurse may each touch the case at different points, but they are not creating separate disconnected records.

The main product promise is:

> Capture once, verify continuously, generate the right clinical, legal, transfer, payer, and operational outputs from the same defensible record.

## 2. Users

Primary users:

- Police officers.
- Field assessment specialists.
- Mobile crisis clinicians.
- Social workers.
- Home-visit nurses.
- 988 / crisis-line counselors.
- ED behavioral-health intake staff.
- Central intake / admissions teams.
- Psychiatrists and psychiatric reviewers.
- Utilization review teams.
- Coroners.
- Inpatient treatment teams.
- Charge nurses managing unit placement.

Overlooked buyer/user wedge:

- Coroners and UR teams are especially important because many competitor workflows under-serve them.

## 3. Build Layers

### Layer 1 - Product

Single-facility or single-agency value. This should be buildable first and should not require a network to be useful.

Modules:

- Guided intake.
- Field mode and clinical mode.
- Age-stratified assessment branching.
- Pitfall guards.
- Medical necessity summary generator.
- Louisiana-first legal instrument execution.
- Custody and decision ledger.
- Compliance clocks.
- Versioned form-pack governance.
- Milieu-aware bedboard.

### Layer 2 - Platform

Multi-party workflow value. This becomes stronger once a coroner office, hospital, and at least one receiving facility participate.

Modules:

- Broadcast transfer/referral.
- Closed-loop referral status.
- One-click accept/deny responses.
- Acceptance receipt.
- ADT-derived bed state.
- Authorization tracking and expiry alerts.
- Consent engine, including 42 CFR Part 2 requirements.
- Collateral-informant workflow across the stay.
- Accept/deny analytics.
- Gap analytics.

### Layer 3 - Network

State-scale and partnership value.

Modules:

- Statewide OBH / LDH analytics.
- Public treatment-finder front door.
- CAD / RMS / EHR / HIE connectors.
- Payer criteria packs beyond public sources.
- Denial-letter feedback loop.
- State packs beyond Louisiana.

## 4. Core Workflows

### Workflow A - Field Capture To Legal Instrument

1. User opens a crisis case.
2. User selects role and capture mode.
3. System prompts for presenting issue, observed behaviors, collateral sources, safety concerns, and statutory grounds.
4. System branches based on patient age band and risk domain.
5. System flags missing high-risk fields.
6. User executes or drafts statutory instrument when appropriate.
7. System creates immutable ledger event and attaches signature/attestation.
8. System generates legal/clinical packet.

Primary outputs:

- Field narrative.
- PEC/OPC/EC draft or executed artifact.
- Risk formulation.
- Chain-of-custody event trail.
- Transfer-ready packet.

### Workflow B - Central Intake Pipeline

The central intake SOP maps into a 10-step case pipeline:

1. Referral entry.
2. Legal status review.
3. Nurse-to-nurse clearance.
4. Laying-eyes screening / guided assessment.
5. Psychiatric review.
6. Benefit verification.
7. Packet completion.
8. Bed assignment.
9. Transport.
10. Handoff.

Important architecture correction:

Clinical progression and financial verification must run as parallel lanes. Financial status must never gate screening or emergency clinical review. The business-office SLA can start at referral entry, but the software should structurally prevent insurance from blocking required clinical action.

### Workflow C - Secure Transfer And Acceptance

1. Case packet is assembled from the canonical case record.
2. Required fields and attachments are validated.
3. Authorized sender transmits packet through secure channel.
4. Receiving facility accepts, declines, requests more information, or times out.
5. Response is written to the ledger.
6. Decline reasons feed analytics and future routing recommendations.

Packet contents:

- Structured legal form.
- Narrative summary.
- Risk scores.
- Medical necessity statement.
- Witness / collateral statements.
- Media links.
- Chain-of-custody metadata.
- Attestations.
- Acceptance receipt.

### Workflow D - Inpatient Milieu Bedboard

The bedboard should recommend placement based on more than availability.

Recommendation layers:

- Roommate compatibility.
- Adjacency and unit geography.
- Unit-level milieu composition.
- Staffing and observation load.

Example risk relationships:

- Acutely paranoid patient near confused wanderer.
- Predatory history near vulnerable patient.
- Elopement risk near exit-adjacent room.
- Fall risk far from nursing station.
- High-stimulation patient near a patient who decompensates with noise.

Governance:

- The system recommends.
- The charge nurse decides.
- Recommendations, accepted placements, and overrides are logged.

## 5. Assessment Architecture

Use one canonical assessment schema with multiple capture depths.

### Field Mode

For police, mobile crisis, social workers, FAEs, or other non-hospital users.

Captures:

- Observed behavior.
- Precipitating event.
- Safety threats.
- Basic mental status observations.
- Stated SI / HI / psychosis / intoxication.
- Collateral source names and statements.
- Statutory grounds.
- Immediate action taken.

### Clinical Mode

For ED, central intake, inpatient admissions, or hospital clinicians.

Captures full assessment domains:

- Legal status.
- Presenting problem.
- Medical review.
- Medication history.
- Psychiatric history.
- Substance use.
- Mental status exam.
- Risk formulation.
- Functional status.
- Social determinants.
- Collateral.
- Medical necessity statement.
- Plan.

### Age Branching

Adult:

- Default path.

Geriatric:

- Delirium screen.
- Decision-specific capacity.
- Surrogate identification.
- Polypharmacy review.
- Cognitive baseline change.

Adolescent / child:

- Guardian consent tracking.
- Caregiver collateral.
- School collateral where relevant.
- Developmental mental status exam.
- Environmental safety and means restriction.

## 6. Pitfall Guard System

Pitfall guards are not generic validation messages. They are clinical/legal coaching prompts.

Examples:

- If SI/HI is denied but no risk formulation exists, prompt for ideation, plan, intent, means, protective factors, and collateral.
- If geriatric patient has abrupt onset or fluctuating status, prompt delirium differential before psychiatric-only framing.
- If youth disposition lacks third-party collateral or means-restriction counseling, hard flag before completion.
- If statutory form is drafted without required trigger facts, block finalization until reviewed.

Governance:

- Prompts should be role-aware.
- Senior users may have fewer teaching messages, but hard legal/compliance blocks remain.
- Drift reports should be available to administrators.

## 7. Legal And Custody Architecture

Required capabilities:

- Time-stamped creation, edit, redaction, export, transfer, and receipt events.
- Immutable or append-only audit trail.
- Hashing for originals and exports.
- E-signature and attestation.
- Source IP / user / role metadata where appropriate.
- Secure media attachment.
- Redaction workflow.
- External sharing controls.

Critical caveat:

Louisiana statutory clocks and form requirements must be reviewed by counsel before software enforces them. The architecture should support configurable legal-clock packs rather than hard-code uncertain clock language.

Known clocks / requirements from thread context needing legal validation:

- PEC-related deadlines.
- OPC validity / custody timing.
- CEC-after-admission timing.
- 12-hour exam-on-arrival rule.
- CMS initial evaluation and treatment-plan timing.
- Recertification deadlines.

## 8. Compliance Clock Architecture

Clocks should be first-class objects, not buried in UI logic.

Clock fields:

- Clock type.
- Trigger event.
- Trigger timestamp.
- Required completion event.
- Due timestamp.
- Responsible role.
- Escalation path.
- Pause/void rules.
- Legal/policy source reference.
- Status.

Examples:

- Referral to screening.
- Intake to admission.
- Insurance verification SLA.
- Packet completion.
- Psychiatric review.
- Legal custody deadline.
- Initial evaluation deadline.
- Treatment plan deadline.
- Recertification deadline.

## 9. Form-Pack Governance

Hospitals and agencies will have their own assessment and legal forms. The product should ship with a reference form pack, then allow local form packs to map onto the canonical schema.

Form-pack versioning:

- Form pack name.
- Jurisdiction / facility.
- Effective date.
- Retired date.
- Schema mapping.
- Required fields.
- Output template.
- Legal review status.
- Change log.

Principle:

Local configurability should not become one-off consulting. The canonical schema remains stable; local forms map onto it.

## 10. Reporting And Metrics

Operational metrics:

- Time from incident/referral to hospital acceptance.
- Time from intake to admission.
- First-submission acceptance rate.
- ER detainment time.
- Repeated transport attempts.
- Packet completeness.
- Screening SLA compliance.
- Insurance verification SLA compliance.

Legal / quality metrics:

- Missing fields per packet.
- Documentation corrections.
- Complaints tied to documentation quality.
- Documentation-related denials.
- Statutory-clock breaches.

Clinical / safety metrics:

- Time to clinical assessment.
- Observation load.
- Seclusion/restraint episodes.
- Patient-on-patient incidents.
- Falls.
- Elopement events.
- Staff injuries.

User adoption:

- Cases captured in system.
- Override rate.
- Recommendation acceptance rate.
- User satisfaction.

No measurements found yet. These are proposed measures, not observed results.

## 11. Technical Architecture

Recommended MVP stack:

- Web application for desktop central intake and hospital workflows.
- Mobile-friendly capture mode for field users.
- Supabase or equivalent Postgres-backed application platform.
- Object storage for documents and media.
- Append-only ledger table for case events.
- Role-based access control.
- Background jobs for clocks, escalations, packet generation, and notifications.
- PDF/document generation for legal and transfer packets.

Suggested app surfaces:

- Case intake workspace.
- Legal instrument workspace.
- Transfer/referral workspace.
- Hospital response portal.
- Central intake command center.
- Bedboard / milieu view.
- UR / payer workspace.
- Admin form-pack manager.
- Audit and reporting workspace.

## 12. Security And Privacy

Must support:

- HIPAA-aligned access controls.
- Business Associate Agreement readiness.
- Least-privilege roles.
- Strong auditability.
- Media preservation.
- Hash verification.
- Redaction before external sharing.
- Consent segmentation, including 42 CFR Part 2 support for substance-use information.
- Dual-track sharing for research: full agency record retained, redacted/anonymized dataset exported under explicit agreement.

## 13. MVP Boundary

Build first:

- Case creation.
- Field and clinical intake modes.
- Canonical assessment schema.
- Age branching.
- Pitfall guards.
- Legal instrument draft/execution scaffold.
- Ledger events.
- Compliance clocks.
- Packet generation.
- Simple receiving facility portal.
- Accept/decline response.
- Bedboard prototype with compatibility flags.

Defer:

- Full CAD/RMS/EHR/HIE integration.
- Statewide treatment finder.
- Full payer criteria library.
- Automated denial-letter parsing.
- Production-grade Part 2 consent engine.
- Multi-state legal packs.

