/**
 * Schema.gs
 * Defines the tabs, headers, and validation rules.
 */

const SCHEMA = {
  "Dashboard": { headers: [] },
  "Agencies": {
    headers: [
      "agency_id", "agency_name", "agency_type", "jurisdiction", "parish_or_region", 
      "service_area", "website", "main_phone", "non_emergency_phone", "crisis_phone", 
      "public_email", "physical_address", "mailing_address", "mental_health_relevance", 
      "current_solution_or_program", "potential_clarity_use_case", "grant_alignment", 
      "review_state", "confidence_level", "last_verified_date", "source_ids", "notes"
    ],
    validations: {
      3: ["Police Department", "Sheriff Department", "Campus Police", "State Agency", "Mobile Crisis Provider", "Behavioral Health Provider", "Acute Care Hospital", "Elder Protection Agency", "Area Agency on Aging", "Community Crisis Response", "Other"],
      18: ["Needs Review", "Source Confirmed", "Human Confirmed", "Stale", "Do Not Use"],
      19: ["Confirmed", "Source-backed partial", "Inference", "Unknown"]
    }
  },
  "Agency Contacts": {
    headers: ["contact_id", "agency_id", "name", "title", "role", "email", "phone", "source_ids", "review_state", "notes"]
  },
  "Special Units": {
    headers: [
      "unit_id", "agency_id", "unit_or_program_name", "unit_type", "description", 
      "public_contact", "phone", "email", "referral_or_activation_path", "populations_served", 
      "hours", "source_ids", "review_state", "confidence_level", "notes"
    ],
    validations: {
      4: ["CIT", "Co-Responder", "Mental Health Unit", "Community Response", "Elder Abuse / Vulnerable Adult", "Victim Services", "Homeless Outreach", "Crisis Negotiation", "Diversion", "Unknown"],
      13: ["Needs Review", "Source Confirmed", "Human Confirmed", "Stale", "Do Not Use"],
      14: ["Confirmed", "Source-backed partial", "Inference", "Unknown"]
    }
  },
  "Mobile Crisis Providers": {
    headers: [
      "provider_id", "organization_name", "service_area", "crisis_phone", "main_phone", 
      "website", "hours", "populations_served", "services", "law_enforcement_referral", 
      "hospital_referral", "school_referral", "community_referral", "central_intake_available", 
      "source_ids", "review_state", "confidence_level", "notes"
    ],
    validations: {
      16: ["Needs Review", "Source Confirmed", "Human Confirmed", "Stale", "Do Not Use"],
      17: ["Confirmed", "Source-backed partial", "Inference", "Unknown"]
    }
  },
  "Elder Protection": {
    headers: [
      "elder_protection_id", "agency_name", "program_name", "scope", "reporting_method", 
      "reporting_phone", "website", "eligibility", "mandatory_reporter_notes", "service_area", 
      "source_ids", "review_state", "confidence_level", "notes"
    ],
    validations: {
      12: ["Needs Review", "Source Confirmed", "Human Confirmed", "Stale", "Do Not Use"],
      13: ["Confirmed", "Source-backed partial", "Inference", "Unknown"]
    }
  },
  "Existing Programs": {
    headers: [
      "program_id", "agency_id", "program_name", "program_type", "description", 
      "known_partners", "technology_or_platform_reference", "clarity_gap_or_opportunity", 
      "source_ids", "review_state", "confidence_level", "notes"
    ],
    validations: {
      4: ["CIT", "Co-Responder", "988", "Mobile Crisis", "Jail Diversion", "Crisis Stabilization", "Hospital Partnership", "Homeless Outreach", "Elder Protection", "Referral Directory", "Case Management", "Unknown"],
      10: ["Needs Review", "Source Confirmed", "Human Confirmed", "Stale", "Do Not Use"],
      11: ["Confirmed", "Source-backed partial", "Inference", "Unknown"]
    }
  },
  "Grant Opportunities": {
    headers: [
      "grant_id", "program_name", "funder", "source_url", "status", "deadline", 
      "eligible_applicants", "allowable_uses", "clarity_fit", "matched_agency_types", 
      "match_confidence", "next_review_date", "notes"
    ],
    validations: {
      5: ["Confirmed Current", "Recently Closed", "Historical", "Forecasted", "Needs Verification"]
    }
  },
  "Clarity Fit": {
    headers: [
      "fit_id", "agency_id", "workflow_layer", "problem_clarity_could_help_solve", 
      "possible_clarity_module", "data_governance_needs", "human_approval_required", 
      "integration_needed", "what_cannot_be_automated", "source_ids", "review_state", "notes"
    ],
    validations: {
      3: ["Prescreen", "Mobile Crisis Triage", "Law Enforcement Handoff", "Hospital ED Referral", "Behavioral Health Intake", "Elder Protection", "Discharge Planning", "Grant / Funding", "Administration"],
      11: ["Needs Review", "Source Confirmed", "Human Confirmed", "Stale", "Do Not Use"]
    }
  },
  "Sources": {
    headers: [
      "source_id", "source_title", "source_url", "publisher", "date_accessed", 
      "source_type", "relevant_claim", "archive_or_pdf_path", "confidence_level", "notes"
    ],
    validations: {
      9: ["Confirmed", "Source-backed partial", "Inference", "Unknown"]
    }
  },
  "Review Queue": {
    headers: [
      "review_id", "record_type", "record_id", "claim_or_field", "current_value", 
      "source_id", "review_reason", "assigned_to", "review_state", "review_notes", 
      "created_at", "updated_at"
    ]
  },
  "Data Dictionary": { headers: ["Field", "Definition", "Allowed Values"] },
  "Settings": { headers: ["Key", "Value"] }
};
