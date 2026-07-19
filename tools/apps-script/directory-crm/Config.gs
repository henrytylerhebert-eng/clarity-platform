/**
 * Bound-Sheet configuration for the Clarity Directory CRM foundation.
 */

const DIRECTORY_CONFIG = {
  VERSION: "1.1.0",
  SEED_BATCH_ID: "PSCR-2026-07-19-v1",
  DEFAULT_REVIEW_STATE: "Needs Review",
  DEFAULT_CONFIDENCE: "Source-backed partial",
  REQUIRED_SHEETS: {
    "Organizations": [
      "organization_id", "parent_organization_id", "organization_name", "organization_type",
      "classification", "ownership_level", "headquarters_city", "state", "website",
      "main_phone", "medicare_status", "profile_summary", "review_state", "confidence_level",
      "last_verified_date", "source_ids", "notes"
    ],
    "Locations": [
      "location_id", "organization_id", "location_name", "location_type", "address_line_1",
      "city", "parish_or_county", "state", "postal_code", "main_phone", "intake_phone",
      "crisis_phone", "service_area", "capacity_status", "accepts_referrals", "review_state",
      "confidence_level", "last_verified_date", "source_ids", "notes"
    ],
    "Service Lines": [
      "service_line_id", "location_id", "organization_id", "service_line_name", "classification",
      "level_of_care", "populations_served", "capabilities", "requirements", "blocked_actions",
      "capacity_status", "medicare_status", "hours", "referral_method", "review_state",
      "confidence_level", "last_verified_date", "source_ids", "notes"
    ],
    "Sources": [
      "source_id", "source_title", "source_url", "publisher", "date_accessed", "source_type",
      "relevant_claim", "confidence_level", "review_state", "notes"
    ],
    "Review Queue": [
      "review_id", "record_type", "record_id", "claim_or_field", "current_value", "source_id",
      "review_reason", "assigned_to", "review_state", "review_notes", "created_at", "updated_at"
    ],
    "Import Staging": [
      "import_batch_id", "source_system", "record_type", "external_id", "proposed_parent_id",
      "raw_name", "raw_type", "source_url", "confidence_level", "review_state", "import_status",
      "notes"
    ],
    "Settings": ["Key", "Value"]
  }
};
