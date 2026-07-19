---
status: Synthetic scenario draft; executable fixture pending owner clarification
owner: Human project owner with clinical, legal, operations, and benefits review
date: 2026-07-19
data_boundary: synthetic only
canonical_truth: none; this document is a test scenario and source-intake plan
---

# Synthetic Protective-Custody Intake Scenario

## Purpose

Exercise Clarity's intake-to-handoff workflow with a fully synthetic protective-
custody referral. The scenario is designed to test source capture, human review,
benefits verification, routing, transport custody, admission handoff,
episode-owned utilization review, medication reconciliation, documentation gaps,
and append-only audit behavior.

This scenario does not make a clinical, legal, admission, discharge, placement,
payer, or authorization decision. Every fact below is either a source-reported
input from the scenario prompt or an explicit `[Pending]` field that must be
supplied before an executable fixture is created.

## Scenario Identity

| Field | Synthetic value | Truth status |
|---|---|---|
| Scenario ID | `synthetic-pc-peralta-michael-scot-001` | Scenario identifier |
| Case key | `synthetic-case-peralta-michael-scot-001` | Proposed test key |
| Patient token | `synthetic-patient-michael-scot-001` | Canonical test identity; do not persist the narrative name as a patient identifier |
| Patient display name | Michael Scot | Synthetic prompt label; spelling is `[Confirm]` |
| Age | 65 | Source-reported scenario input |
| Coverage context | Medicare recipient | Source-reported; eligibility remains to be verified |
| Referral context | Protective-custody order / PEC referral | Source-reported; legal validity is not inferred |
| Scenario timezone | `[Pending: facility-owned timezone configuration]` | Must be supplied explicitly; never inferred from Lafayette, Louisiana or the server/browser |

## Source-Reported Patient Facts

These facts should enter Clarity as separate, source-linked evidence items rather
than one unstructured clinical conclusion.

| Domain | Source-reported input | Required source/provenance |
|---|---|---|
| Diagnosis | Dementia with behavioral disturbances; diagnosis reportedly made about two years ago | Diagnosing provider record, date, source document, and reviewer |
| Mood/safety statement | Severe depression and thoughts of no longer wanting to live | Direct assessment or collateral source; intent, plan, means, timeframe, and protective factors are `[Pending]` |
| Sexual behavior | Sexually inappropriate behavior toward caregivers | Named source, observed/reported distinction, date/time, and context are `[Pending]` |
| Aggression | Combative episode today; hit a caregiver while the caregiver attempted to administer medication | Caregiver incident report, date/time, injury status, and immediate response are `[Pending]` |
| Nutrition | Has not eaten in three days | Reporter, last confirmed intake, hydration status, and medical evaluation are `[Pending]` |
| Hygiene | Refused a bath | Reporter, timeframe, and whether other hygiene care occurred are `[Pending]` |
| ADLs | Requires assistance with all activities of daily living | Baseline source, current functional assessment, and assistance level by ADL are `[Pending]` |
| Home course | Continues to decompensate at home despite reported medication compliance | Collateral reporter, timeframe, adherence evidence, and definition of decompensation are `[Pending]` |

The system should preserve the difference between a patient statement, caregiver
report, officer observation, clinician assessment, and receiving-facility
decision. It must not collapse them into a single "high risk" conclusion.

## Synthetic Actors And Roles

All names are fictional scenario labels. The names are not evidence of real
credentials, employment, or authority.

| Actor | Prompted role | Workflow responsibility | Missing verification |
|---|---|---|---|
| Officer Peralta | Officer / protective-custody responder | Supplies custody-order source and transport handoff facts | Agency, badge token, order receipt time, custody authority, and chain-of-custody fields |
| Dr. Jon Bones Jones | Existing treating physician | Supplies prior diagnosis, treatment history, and source records | Credentials, relationship to patient, last evaluation, and source document |
| Dr. Dustin Porrier | PEC-initiating physician | Supplies the PEC/clinical order source | Exact spelling, credentials, order date/time, jurisdiction, and expiration/renewal fields |
| Andy Dwyer | Acadian Ambulance transport personnel | Transport and custody event source | Credential/role, pickup time, arrival time, and handoff signature/attestation |
| Ron Swanson | Nurse at Ochsner Lafayette General | Sending nurse and report source | Sending unit, report time, medication record, medical-clearance status, and contact token |
| April Ludgate | Central-intake manager | Receives report and records facility intake/acceptance workflow | Whether she represents Ochsner or Ocean's, role authority, report time, and acceptance authority |
| Dr. Angela Martin | Receiving psychiatrist | Receiving psychiatric reviewer/acceptance source | Whether she accepts, evaluates, or only receives a clinical packet; decision time and source record |
| Janis Joplin | Ocean's geriatric-unit floor nurse | Receives nursing handoff after intake | Unit name, bed/placement status, handoff time, and receiving attestation |
| Susan Lucci | Benefits-verification specialist | Human-in-the-loop eligibility and benefits verification | Organization, role authorization, payer evidence, and verification timestamp |
| Victor Bermudez, LCSW | Social worker; also described as utilization reviewer | Social-work coordination and possibly episode-owned UR | Confirm whether one person holds both roles and whether dual-control is required |
| Judy Booty | LPN | Medication reconciliation and MAR/order processing | Exact workflow: reconcile, transcribe, enter MAR, or route orders for prescriber review |

Role labels are not authorization by themselves. The test fixture must use the
repository's role and actor contracts, and any dual-role assignment must preserve
the required review and audit boundaries.

## Facility And Transfer Map

The prompt contains a facility ambiguity that must be resolved before routing
data is generated.

| Role | Prompted facility | Working interpretation | Status |
|---|---|---|---|
| Sending hospital | "Oshner/Ochsner Lafayette General" in Lafayette, Louisiana | Source hospital where Ron Swanson gives report | Exact canonical display name and sending unit `[Confirm]` |
| Receiving hospital | "Ocean's Behavioral Hospital" | Behavioral receiving facility with a geriatric unit | Exact legal/display name, organization record, and address `[Confirm]` |
| Central intake | April Ludgate | Appears to operate for the receiving facility, but prompt says "for Oshner" | Facility ownership and acceptance authority `[Confirm]` |
| Receiving unit | Ocean's geriatric unit | Destination program/unit | Program, unit, bed, and level of care `[Pending]` |
| Receiving psychiatrist | Dr. Angela Martin | Receiving clinical reviewer/psychiatrist | Acceptance relationship and review time `[Pending]` |

No episode should be created until the receiving-facility acceptance and the
facility-owned timezone configuration are explicit. The system may store a
referral or routing attempt before acceptance.

## Coverage And Medication Inputs

### Coverage

The prompt describes:

- Medicare Part A;
- a Humana secondary;
- Medicaid;
- a benefits narrative of "60 full days, 30 days, 60 and 190 lifetime Psych
  days."

These are source-reported inputs, not verified benefits. Susan Lucci's workflow
must preserve each coverage source, verification timestamp, evidence reference,
coordination-of-benefits position, and unresolved question. The benefit narrative
must not be normalized into an operational authorization outcome until the source
documents and payer response are reviewed.

The phrase "Aetna Amanda" is ambiguous and is recorded as `[Unclear]`: it may
refer to an additional payer, a person, or a transcription error. It must not be
silently mapped to a payer or medication.

### Medications

The prompt names Exelon, Cymbalta, and Abilify. "Aetna Amanda" does not map
reliably to a medication and remains `[Unclear]`.

For each medication, the executable fixture needs:

- normalized medication name and strength;
- route, scheduled/PRN status, frequency, and last administered dose;
- source of the medication list and reconciliation status;
- allergies/adverse reactions and unknown status;
- prescriber/source record;
- whether an order is active, held, refused, discontinued, or awaiting review.

Judy Booty's workflow should be represented as medication reconciliation/MAR
processing, subject to prescriber and facility policy. The system must not infer
or authorize a medication order.

## End-To-End Data Scenario

| Step | Workflow stage | Data captured | Human gate / expected result |
|---:|---|---|---|
| 1 | Referral intake | Synthetic patient token, referral source, officer/order source, current location, urgency, and narrative evidence items | Intake coordinator verifies minimum identity and source provenance; no placement decision is made |
| 2 | Protective-custody evidence | PEC/order document, issuing clinician, legal status label, issue time, jurisdiction, custody period, service/notice fields, source hash, and custody chain | Legal/clinical reviewers validate that the record is complete for their workflow; Clarity does not determine legal validity |
| 3 | Clinical evidence | Dementia history, depression statement, aggression incident, inappropriate behavior, food refusal, hygiene refusal, ADL dependence, home-course report, and medical-clearance facts | Qualified clinical review separates observed, reported, and assessed facts; missing risk details become documentation gaps |
| 4 | Safety and medical screening | Vitals, allergies, injuries, delirium/medical causes, labs/imaging, fall risk, elopement risk, precautions, and current observation level | Qualified clinical staff record the assessment; no autonomous triage or admission decision |
| 5 | Medication reconciliation | Exelon/Cymbalta/Abilify details, unknown medication entry, last doses, refusals, allergies, MAR/source document, and prescriber follow-up | Judy Booty processes the MAR/reconciliation workflow; prescriber or authorized clinician reviews orders |
| 6 | Benefits verification | Medicare, secondary, Medicaid, ambiguous Aetna item, eligibility evidence, benefit-period narrative, coordination-of-benefits status, and payer contacts | Susan Lucci verifies source evidence; benefits readiness remains separate from emergency clinical review |
| 7 | Packet assembly | Source-linked clinical, legal, benefits, medication, and transport sections; missing-data list; reviewer statuses; correction history | Human reviewers approve the packet contents for routing; no field is silently filled from an assumption |
| 8 | Routing and acceptance | Receiving organization, program, unit, level of care, bed/acceptance status, accepting person, acceptance time, and reason if not accepted | April/Angela workflow records the facility response; acceptance is a source fact, not an autonomous recommendation |
| 9 | Transport custody | Officer Peralta order handoff, Andy Dwyer transport record, departure/arrival times, sending nurse report, receiving contact, and custody attestations | Each handoff is append-only and source-attributed; missing signatures/attestations are visible gaps |
| 10 | Admission handoff | Accepted response, source case, facility/unit/program, admitted time, explicit facility timezone configuration, service date, episode status, and source references | When the accepted handoff is recorded, S2 episode persistence may emit `ADMISSION_RECORDED.v1`; no pre-admission authorization behavior is changed |
| 11 | Receiving nurse/psychiatry handoff | Ron-to-April report, April-to-Janis handoff, Angela review/acceptance record, arrival condition, belongings/precautions, and unresolved gaps | Receiving staff attest to receipt; the system records facts and review status without making the clinical decision |
| 12 | Episode-owned UR | Episode authorization requirement, review request, due time, review status, day decisions, payer reference token, and documentation gaps | Victor's role must be clarified; post-admission UR is episode-owned and separate from pre-admission readiness |
| 13 | Coverage derivation | Approved/denied/pending/expired/unrequested/unknown day outcome, separate risk codes, active source event IDs, quality state, and derivation version | Derived status never replaces source facts; "at risk" remains a risk flag, not an authorization outcome |
| 14 | Ongoing corrections | Original review/day decision/gap facts, correction reason, supersession relationship, actor, version, and audit event | Corrections append new records; originals remain readable and active-branch rules are enforced |
| 15 | Closure or transition | Episode status, discharge/closure source, remaining open gaps, final handoff, and unresolved benefits/authorization facts | Qualified staff record the lifecycle transition; no automatic discharge or placement decision |

## Expected Data Objects

The scenario should exercise these existing or intended boundaries without
collapsing them:

- `BehavioralHealthCase` and synthetic patient token.
- Source documents/evidence for the order, clinical reports, benefits, and MAR.
- Legal-status record and append-only custody/audit events.
- Coverage and pre-admission authorization-readiness records.
- Facility routing/referral response and acceptance source.
- `Episode`, `CaseEpisodeLink`, episode-owned authorization, reviews, day
  decisions, and documentation gaps after admission.
- Governed events and transactional outbox rows, with no dispatcher.
- Medication reconciliation/MAR records only if the relevant repository
  contract exists; otherwise retain them as source evidence and a gap.

## Event And Audit Expectations

The current bounded persistence vocabulary should be used as follows:

- `ADMISSION_RECORDED.v1` only after a source acceptance and admission handoff
  are recorded.
- `AUTHORIZATION_DAY_DECISION_RECORDED.v1` for episode-owned day decisions,
  including correction/reversal envelope metadata.
- `DOCUMENTATION_GAP_RECORDED.v1` when a documentation gap is created.
- Documentation-gap transitions remain status history plus audit unless the
  event-vocabulary decision packet is accepted with a named consumer.
- No `AUTHORIZATION_REVIEW_RECORDED` governed event should be invented from
  the audit action or synthetic fixture.
- No derived episode-day event or operational metric should be claimed merely
  because the contract exists.

## Scenario Acceptance Criteria

The workflow is behaving correctly when the test proves that:

1. All patient and staff identifiers are synthetic tokens or explicitly marked
   scenario labels.
2. The protective-custody order remains a source document and review input; the
   system does not declare it legally valid.
3. Reported, observed, assessed, and derived facts remain distinguishable.
4. Missing risk, medical-clearance, benefits, medication, facility, or handoff
   data becomes an explicit gap rather than an inferred value.
5. Benefits verification does not block emergency clinical review.
6. Pre-admission authorization-readiness behavior remains unchanged.
7. Post-admission utilization review is linked to the episode.
8. Coverage outcomes and risk flags remain separate.
9. Facility timezone is an explicit source-owned input.
10. Corrections preserve original records and create auditable supersession
    relationships.
11. Every tenant, actor, event, audit, and outbox field is server/governance
    controlled where the repository contract requires it.
12. No autonomous clinical, legal, admission, discharge, placement, payer, or
    authorization decision is introduced.

## Clarifications Needed Before Executable Fixture

Please provide these three grouped answers. They are the only gates needed to
turn this scenario from a narrative draft into deterministic synthetic data:

1. **Facility and acceptance:** What are the exact sending and receiving
   facility names, organization ownership, sending/receiving units, explicit
   facility timezone source/reference, and has Ocean's accepted the patient? Is
   April's central-intake role for Ochsner or Ocean's?
2. **Legal and clinical source packet:** What are the PEC/order issue and
   expiration times, issuing jurisdiction, medical-clearance facts, exact
   suicide-risk assessment, aggression incident details, allergies, ADL
   baseline, and the source/date for the dementia diagnosis?
3. **Benefits, medication, and roles:** What does "Aetna Amanda" mean, what
   are the exact medication strengths/routes/frequencies/last doses, how should
   the Medicare benefit narrative be interpreted, and is Victor both social
   worker and UR reviewer or are those separate people? Also confirm whether
   "processing the Marsh" means processing the MAR.

Until these answers are supplied, this document remains a synthetic scenario
draft and must not be loaded as canonical case state or used to claim a real
clinical/legal workflow.
