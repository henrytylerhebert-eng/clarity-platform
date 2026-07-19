/**
 * Review-gated public-source seed packet for Acadiana / Louisiana.
 * No row represents a Clarity customer, partner, integration, or operational connection.
 */

function populateDirectorySeedData() {
  ensureDirectoryCRM_();
  const accessed = new Date("2026-07-19T12:00:00-05:00");

  const organizations = [
    ["org-ps-001", "", "Lafayette Parish Sheriff's Office", "Law Enforcement", "Public Safety", "Independent organization", "Lafayette", "LA", "https://www.lafayettesheriff.com", "337-232-9211", "Not Applicable", "Public-source profile with a Crisis Intervention Team program described in the research packet.", "Needs Review", "Source-backed partial", "", "SRC-PS-001", "No Clarity relationship, deployment, or data connection. Verify all operational details before use."],
    ["org-ep-001", "", "Office of Aging and Adult Services - Region 4", "Elder Protection Agency", "Elder Protection", "State agency", "Lafayette", "LA", "https://ldh.la.gov", "337-262-1635", "Not Applicable", "Public-source profile for Region 4 aging, disability, waiver, and protective-service coordination.", "Needs Review", "Source-backed partial", "", "SRC-EP-001", "Public office information only. Eligibility and reporting paths require human verification."],
    ["org-cr-001", "", "The Ness Center", "Mobile Crisis Provider", "Crisis Response", "Independent organization", "Lafayette", "LA", "https://louisianacrisisconnect.org", "337-417-9260", "Unknown", "Research-packet profile for mobile crisis response in Louisiana Region 4.", "Needs Review", "Source-backed partial", "", "SRC-CR-001", "No referral connection or availability claim. Verify dispatch path, coverage, and hours."],
    ["org-cr-002", "", "The Extra Mile", "Mobile Crisis Provider", "Crisis Response", "Independent organization", "[Unknown]", "LA", "", "337-362-8899", "Unknown", "Research-packet profile for youth mobile crisis response in Louisiana Region 4.", "Needs Review", "Source-backed partial", "", "SRC-CR-001", "Website and office location remain unknown. Verify provider identity, coverage, and hours." ]
  ];

  const locations = [
    ["loc-ps-001", "org-ps-001", "Lafayette Parish Sheriff's Office", "Law enforcement agency", "", "Lafayette", "Lafayette Parish", "LA", "", "337-232-9211", "", "", "Lafayette Parish", "Unknown", "Unknown", "Needs Review", "Source-backed partial", "", "SRC-PS-001", "Address and activation path require verification."],
    ["loc-ep-001", "org-ep-001", "OAAS Region 4 Office", "State regional office", "128 Demanade Drive, Suite 104", "Lafayette", "Lafayette Parish", "LA", "", "337-262-1635", "", "1-800-898-4910", "Louisiana Region 4", "Unknown", "Unknown", "Needs Review", "Source-backed partial", "", "SRC-EP-001", "Public office and hotline information from the research packet; verify before operational use."],
    ["loc-cr-001", "org-cr-001", "The Ness Center - Region 4 service profile", "Mobile crisis service area", "", "[Unknown]", "Region 4", "LA", "", "337-417-9260", "", "337-417-9260", "Acadiana / Louisiana Region 4", "Unknown", "Unknown", "Needs Review", "Source-backed partial", "", "SRC-CR-001", "Service-area record, not a verified physical site or live-capacity record."],
    ["loc-cr-002", "org-cr-002", "The Extra Mile - Region 4 service profile", "Mobile crisis service area", "", "[Unknown]", "Region 4", "LA", "", "337-362-8899", "", "337-362-8899", "Louisiana Region 4", "Unknown", "Unknown", "Needs Review", "Source-backed partial", "", "SRC-CR-001", "Service-area record, not a verified physical site or live-capacity record."]
  ];

  const serviceLines = [
    ["svc-ps-001", "loc-ps-001", "org-ps-001", "Crisis Intervention Team (CIT)", "Public Safety", "Field crisis response", "All ages [Needs Verification]", "Crisis response and de-escalation described in source packet", "Dispatch and agency policy; human decision", "No autonomous diversion, transport, custody, or clinical decision", "Unknown", "Not Applicable", "[Unknown]", "911 / dispatch path [Needs Verification]", "Needs Review", "Source-backed partial", "", "SRC-PS-001", "Program details must be checked against the current official source."],
    ["svc-ep-001", "loc-ep-001", "org-ep-001", "Adult protective services and waiver coordination", "Elder Protection", "Protective services", "Adults 18-59 per research packet [Needs Verification]", "Public reporting and regional coordination information", "Eligibility and mandated-reporting rules; human review", "No autonomous report, eligibility, investigation, or disposition decision", "Unknown", "Not Applicable", "[Unknown]", "State hotline / regional office [Needs Verification]", "Needs Review", "Source-backed partial", "", "SRC-EP-001", "Elderly Protective Services for adults 60+ is a distinct state pathway and is not collapsed into this row."],
    ["svc-cr-001", "loc-cr-001", "org-cr-001", "Mobile Crisis Response", "Crisis Response", "Community crisis stabilization", "Adults and youth [Needs Verification]", "Mobile crisis response in community settings", "Current dispatch rules and service eligibility; human triage", "No live dispatch, clinical triage, placement, or capacity claim", "Unknown", "Unknown", "Mon-Fri 8:30-5:00 [Needs Verification]", "Louisiana Crisis Hub or direct [Needs Verification]", "Needs Review", "Source-backed partial", "", "SRC-CR-001", "Hours and referral path are imported from the research packet and require confirmation."],
    ["svc-cr-002", "loc-cr-002", "org-cr-002", "Youth Mobile Crisis Response", "Crisis Response", "Youth community crisis stabilization", "Youth ages 0-20 [Needs Verification]", "Youth-focused mobile crisis response", "Current dispatch rules and service eligibility; human triage", "No live dispatch, clinical triage, placement, or capacity claim", "Unknown", "Unknown", "24/7 [Needs Verification]", "[Unknown]", "Needs Review", "Source-backed partial", "", "SRC-CR-001", "Provider identity, hours, age range, and referral path require confirmation."]
  ];

  const sources = [
    ["SRC-PS-001", "LPSO Crisis Intervention Team", "https://www.lafayettesheriff.com/divisions/uniformed-patrol/crisis-intervention-team/", "Lafayette Parish Sheriff's Office", accessed, "Official webpage", "CIT program and crisis-response description", "Source-backed partial", "Needs Review", "Imported from the 2026-07-19 research packet; re-open the source before approval."],
    ["SRC-EP-001", "OAAS Region 4", "https://ldh.la.gov/page/280", "Louisiana Department of Health", accessed, "Official webpage", "Region 4 office, protective-service, and waiver coordination information", "Source-backed partial", "Needs Review", "Imported from the research packet; current URL and service details require review."],
    ["SRC-CR-001", "Louisiana Crisis Response System Region 4 Fact Sheet", "https://ldh.la.gov/assets/docs/BehavioralHealth/Crisis_Services/crisismap/Louisiana_Crisis_Response_System_Region_4_Fact_Sheet.pdf", "Louisiana Department of Health", accessed, "Official PDF", "Region 4 mobile crisis providers, service areas, and contact pathways", "Source-backed partial", "Needs Review", "Confirm the PDF is current before operational use."],
    ["SRC-CR-002", "Louisiana Crisis Connect", "https://louisianacrisisconnect.org", "Louisiana Crisis Response System", accessed, "Official webpage", "State crisis hub and mobile crisis directory context", "Source-backed partial", "Needs Review", "Directory context only; no integration or referral connection is claimed."],
    ["SRC-GR-001", "Behavioral Health Mobile Crisis Team Partnerships SM-26-029", "https://www.samhsa.gov/grants/grant-announcements/sm-26-029", "SAMHSA", accessed, "Official webpage", "Historical or recently closed mobile crisis grant lead", "Source-backed partial", "Needs Review", "Deadline and availability are time-sensitive and must be reverified."],
    ["SRC-GR-002", "BJA funding opportunities", "https://bja.ojp.gov/funding", "Bureau of Justice Assistance", accessed, "Official webpage", "JMHCP and related law-enforcement behavioral-health grant research", "Source-backed partial", "Needs Review", "Program cycle, status, eligibility, and allowable uses require current review."]
  ];

  const reviews = [
    ["review-syn-002", "Import lane", "import-syn-001", "Public Safety + Crisis Response", "Staged for review", "SRC-SYN-001", "Review the staged public-source seed packet before operational use.", "Product owner", "Needs Review", "", accessed, accessed],
    ["review-ps-001", "Organization", "org-ps-001", "CIT profile and activation path", "Imported from public research packet", "SRC-PS-001", "Confirm current CIT scope, phone numbers, dispatch path, and program status.", "Product owner", "Needs Review", "", accessed, accessed],
    ["review-ep-001", "Organization", "org-ep-001", "Protective-service profile", "Imported from public research packet", "SRC-EP-001", "Confirm age boundaries, hotlines, local office details, and reporting path.", "Product owner", "Needs Review", "", accessed, accessed],
    ["review-cr-001", "Organization", "org-cr-001", "Mobile crisis profile", "Imported from public research packet", "SRC-CR-001", "Confirm provider identity, hours, coverage, populations, and dispatch path.", "Product owner", "Needs Review", "", accessed, accessed],
    ["review-cr-002", "Organization", "org-cr-002", "Youth mobile crisis profile", "Imported from public research packet", "SRC-CR-001", "Confirm provider identity, website, phone, age range, hours, and referral path.", "Product owner", "Needs Review", "", accessed, accessed],
    ["review-gr-001", "Grant opportunity", "grant-sm-26-029", "Current grant status", "Recently closed in research packet", "SRC-GR-001", "Reverify status, deadline, eligibility, and whether software is an allowable cost.", "Product owner", "Needs Review", "", accessed, accessed],
    ["review-gr-002", "Grant opportunity", "grant-bja-jmhcp", "Current grant status", "Historical / forecasted in research packet", "SRC-GR-002", "Locate the current official solicitation before using this as a funding lead.", "Product owner", "Needs Review", "", accessed, accessed]
  ];

  const staging = [
    [DIRECTORY_CONFIG.SEED_BATCH_ID, "Public Safety + Crisis Response research packet", "Organization", "org-ps-001", "", "Lafayette Parish Sheriff's Office", "Law Enforcement / CIT", "https://www.lafayettesheriff.com/divisions/uniformed-patrol/crisis-intervention-team/", "Source-backed partial", "Needs Review", "Staged", "Mapped into Organizations, Locations, and Service Lines; not approved directory truth."],
    [DIRECTORY_CONFIG.SEED_BATCH_ID, "Public Safety + Crisis Response research packet", "Organization", "org-ep-001", "", "Office of Aging and Adult Services - Region 4", "Elder Protection Agency", "https://ldh.la.gov/page/280", "Source-backed partial", "Needs Review", "Staged", "Mapped into Organizations, Locations, and Service Lines; not approved directory truth."],
    [DIRECTORY_CONFIG.SEED_BATCH_ID, "Public Safety + Crisis Response research packet", "Organization", "org-cr-001", "", "The Ness Center", "Mobile Crisis Provider", "https://ldh.la.gov/assets/docs/BehavioralHealth/Crisis_Services/crisismap/Louisiana_Crisis_Response_System_Region_4_Fact_Sheet.pdf", "Source-backed partial", "Needs Review", "Staged", "Mapped into Organizations, Locations, and Service Lines; verify current details."],
    [DIRECTORY_CONFIG.SEED_BATCH_ID, "Public Safety + Crisis Response research packet", "Organization", "org-cr-002", "", "The Extra Mile", "Mobile Crisis Provider", "https://ldh.la.gov/assets/docs/BehavioralHealth/Crisis_Services/crisismap/Louisiana_Crisis_Response_System_Region_4_Fact_Sheet.pdf", "Source-backed partial", "Needs Review", "Staged", "Mapped into Organizations, Locations, and Service Lines; verify current details."],
    [DIRECTORY_CONFIG.SEED_BATCH_ID, "Grant research packet", "Source", "grant-sm-26-029", "", "Behavioral Health Mobile Crisis Team Partnerships", "Grant Opportunity", "https://www.samhsa.gov/grants/grant-announcements/sm-26-029", "Source-backed partial", "Needs Review", "Needs mapping", "Time-sensitive lead. Reverify status and allowable costs before creating a grant record."],
    [DIRECTORY_CONFIG.SEED_BATCH_ID, "Grant research packet", "Source", "grant-bja-jmhcp", "", "Justice and Mental Health Collaboration Program", "Grant Opportunity", "https://bja.ojp.gov/funding", "Source-backed partial", "Needs Review", "Needs mapping", "Historical or forecasted lead. A current solicitation has not been approved in this CRM."]
  ];

  const foundationMarker = [[
    "import-syn-001", "Public Safety + Crisis Response foundation marker", "Organization",
    "foundation-marker", "", "Seed importer status", "Foundation control row", "",
    "Unknown", "Needs Review", "Staged",
    "The public-source seed batch is staged below. This control row is not a directory entity."
  ]];

  const results = {
    organizations: upsertRowsByKey_("Organizations", organizations, 0),
    locations: upsertRowsByKey_("Locations", locations, 0),
    serviceLines: upsertRowsByKey_("Service Lines", serviceLines, 0),
    sources: upsertRowsByKey_("Sources", sources, 0),
    reviews: upsertRowsByKey_("Review Queue", reviews, 0),
    stagingMarker: upsertRowsByKey_("Import Staging", foundationMarker, 0),
    staging: upsertRowsByKey_("Import Staging", staging, 3)
  };

  upsertSetting_("version", "Foundation v1 + public-safety seed importer " + DIRECTORY_CONFIG.VERSION);
  upsertSetting_("public_safety_crisis_response_import", "Staged for review");
  upsertSetting_("next_gate", "Human source review before operational use");
  upsertSetting_("seed_batch", DIRECTORY_CONFIG.SEED_BATCH_ID);
  refreshDirectoryDashboard();

  SpreadsheetApp.getActiveSpreadsheet().toast(
    "Seed packet populated. All public-source records remain Needs Review.\n\n" +
    "Organizations: " + summarizeUpsert_(results.organizations) + "\n" +
    "Locations: " + summarizeUpsert_(results.locations) + "\n" +
    "Service lines: " + summarizeUpsert_(results.serviceLines) + "\n" +
    "Sources: " + summarizeUpsert_(results.sources) + "\n" +
    "Review items: " + summarizeUpsert_(results.reviews) + "\n" +
    "Staging rows: " + summarizeUpsert_(results.staging),
    "Clarity Directory CRM",
    10
  );
}

function summarizeUpsert_(result) {
  return result.inserted + " inserted, " + result.updated + " updated";
}
