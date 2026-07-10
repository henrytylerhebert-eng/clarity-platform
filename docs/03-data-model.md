# Clarity Crisis Platform - First-Pass Data Model

This is a prototype-oriented schema. It is not a final production database design.

## Core Identity

### organizations

- id
- name
- type: agency | hospital | coroner | crisis_center | payer | research_partner | state_agency
- jurisdiction
- address
- status

### users

- id
- organization_id
- name
- email
- role
- license_or_badge_id
- status

### patients

- id
- first_name
- last_name
- date_of_birth
- age_band: child | adolescent | adult | geriatric
- sex
- identifiers
- created_at

## Case Record

### cases

- id
- patient_id
- owning_organization_id
- opened_by_user_id
- referral_source_type
- referral_source_name
- legal_status
- current_stage
- priority
- status
- opened_at
- closed_at

### case_participants

- id
- case_id
- person_name
- participant_type: caregiver | guardian | officer | clinician | collateral | witness | reviewer | receiving_contact
- organization_name
- contact_info
- relationship_to_patient

## Assessment

### assessments

- id
- case_id
- mode: field | clinical
- assessment_type
- age_path
- status
- started_by_user_id
- completed_by_user_id
- started_at
- completed_at

### assessment_answers

- id
- assessment_id
- domain
- field_key
- value
- source: direct_patient | collateral | observation | document | imported
- confidence
- required
- completed_at

### risk_formulations

- id
- case_id
- suicidal_ideation
- homicidal_ideation
- psychosis
- intoxication_or_withdrawal
- aggression_risk
- elopement_risk
- fall_risk
- vulnerability_risk
- protective_factors
- means_access
- formulation_text
- reviewer_user_id
- created_at

### pitfall_guards

- id
- case_id
- assessment_id
- guard_type
- severity: info | warning | hard_stop
- message
- status: open | acknowledged | resolved | overridden
- triggered_at
- resolved_at
- resolved_by_user_id

## Legal And Custody

### legal_instruments

- id
- case_id
- instrument_type: PEC | OPC | EC | CEC | other
- jurisdiction
- form_pack_id
- status: draft | ready_for_review | executed | voided | expired
- required_facts_complete
- executed_by_user_id
- executed_at
- expiration_at
- counsel_review_required

### attestations

- id
- case_id
- legal_instrument_id
- attestation_type
- attested_by_user_id
- attestation_text
- signed_at

### ledger_events

- id
- case_id
- actor_user_id
- actor_organization_id
- event_type
- event_subject_type
- event_subject_id
- event_payload
- occurred_at
- source_ip
- previous_event_hash
- event_hash

### compliance_clocks

- id
- case_id
- clock_type
- trigger_event_type
- triggered_at
- due_at
- completed_event_type
- completed_at
- responsible_role
- escalation_policy_id
- status: pending | active | due_soon | breached | completed | voided
- source_reference
- counsel_review_required

## Documents, Media, Packets

### artifacts

- id
- case_id
- artifact_type: document | audio | video | image | transcript | generated_pdf | packet
- title
- storage_uri
- mime_type
- original_hash
- current_hash
- uploaded_by_user_id
- uploaded_at
- retention_policy

### packets

- id
- case_id
- packet_type: hospital_transfer | DA | payer | research | internal_review
- status: draft | complete | sent | accepted | declined | archived
- generated_by_user_id
- generated_at
- sent_at

### packet_artifacts

- id
- packet_id
- artifact_id
- include_mode: full | redacted | link_only | metadata_only

### redactions

- id
- artifact_id
- redacted_artifact_id
- redaction_reason
- redacted_by_user_id
- redacted_at
- review_status

## Transfer And Referral

### facility_referrals

- id
- case_id
- packet_id
- sending_organization_id
- receiving_organization_id
- status: draft | sent | viewed | accepted | declined | info_requested | expired
- sent_at
- viewed_at
- response_due_at

### facility_responses

- id
- referral_id
- responder_user_id
- response_type: accept | decline | request_info
- reason_code
- response_notes
- responded_at
- receipt_hash

## Bedboard And Milieu

### units

- id
- organization_id
- name
- population_type
- capacity
- current_status

### rooms

- id
- unit_id
- room_number
- room_type
- adjacency_zone
- near_exit
- near_nursing_station
- near_dayroom
- ada_accessible
- isolation_capable

### beds

- id
- room_id
- bed_label
- status: available | occupied | held | blocked | cleaning
- current_case_id

### acuity_profiles

- id
- case_id
- observation_status: routine | q15 | line_of_sight | one_to_one
- si_precaution
- assault_precaution
- elopement_precaution
- fall_precaution
- sexual_acting_out_precaution
- paranoia_level
- disorganization_level
- agitation_level
- vulnerability_level
- hygiene_support_level
- mobility_support_level
- trajectory: escalating | stable | improving | unknown
- updated_at

### placement_recommendations

- id
- case_id
- bed_id
- recommendation_score
- summary
- flags
- generated_at
- generated_by

### placement_decisions

- id
- recommendation_id
- case_id
- bed_id
- decision: accepted | overridden | rejected
- decision_reason
- decided_by_user_id
- decided_at

## Consent And Sharing

### consents

- id
- case_id
- consent_type
- scope
- granted_by
- granted_at
- expires_at
- revoked_at
- part2_sensitive

### sharing_grants

- id
- case_id
- receiving_organization_id
- scope
- consent_id
- status
- created_at
- revoked_at

## Admin Governance

### form_packs

- id
- name
- jurisdiction
- organization_id
- version
- effective_at
- retired_at
- legal_review_status
- schema_mapping
- output_template_uri

### escalation_policies

- id
- organization_id
- name
- trigger_status
- threshold_minutes
- notify_role
- notify_user_id

