/**
 * SeedData.gs
 * Can be run manually from Apps Script to insert baseline research for Acadiana/Louisiana.
 */

function populateSeedData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Seed Agencies
  const agencies = ss.getSheetByName("Agencies");
  if (agencies && agencies.getLastRow() === 1) {
    const agencyData = [
      ["AG-001", "Lafayette Parish Sheriff's Office", "Sheriff Department", "Lafayette Parish", "Region 4", "Lafayette", "https://www.lafayettesheriff.com", "337-232-9211", "337-236-5861", "", "", "316 W Main St, Lafayette, LA", "", "Has a dedicated Crisis Intervention Team (CIT).", "Co-response model", "Prescreen/Law Enforcement Handoff", "BJA JMHCP / SAMHSA", "Source Confirmed", "Confirmed", new Date(), "SRC-001", ""],
      ["AG-002", "Office of Aging and Adult Services - Region 4", "State Agency", "State of Louisiana", "Region 4", "Acadiana", "https://ldh.la.gov", "337-262-1635", "", "1-800-898-4910", "OAASRegion4.Waiver@la.gov", "128 Demanade Drive, Suite 104, Lafayette, LA", "", "Adult Protective Services (APS) for ages 18-59", "Elder Protection / APS", "Elder Protection Coordination", "", "Source Confirmed", "Confirmed", new Date(), "SRC-002", ""]
    ];
    agencies.getRange(2, 1, agencyData.length, agencyData[0].length).setValues(agencyData);
  }
  
  // Seed Mobile Crisis
  const mobileCrisis = ss.getSheetByName("Mobile Crisis Providers");
  if (mobileCrisis && mobileCrisis.getLastRow() === 1) {
    const mcData = [
      ["MC-001", "The Ness Center", "Acadiana (Region 4)", "337-417-9260", "337-417-9260", "", "Mon-Fri 8:30-5:00", "Adults/Youth", "Mobile Crisis Response", "Unknown", "Unknown", "Unknown", "Yes", "No", "SRC-003", "Source Confirmed", "Confirmed", ""]
    ];
    mobileCrisis.getRange(2, 1, mcData.length, mcData[0].length).setValues(mcData);
  }
  
  // Seed Sources
  const sources = ss.getSheetByName("Sources");
  if (sources && sources.getLastRow() === 1) {
    const srcData = [
      ["SRC-001", "LPSO Crisis Intervention Team", "https://www.lafayettesheriff.com/divisions/uniformed-patrol/crisis-intervention-team/", "LPSO", new Date(), "Agency Website", "LPSO operates a CIT co-response model", "", "Confirmed", ""],
      ["SRC-002", "OAAS Region 4", "https://ldh.la.gov/page/280", "Louisiana Dept of Health", new Date(), "State Website", "Region 4 office handles APS/waivers at Demanade Dr", "", "Confirmed", ""],
      ["SRC-003", "Louisiana Crisis Hub - The Ness Center", "https://louisianacrisisconnect.org", "LDH", new Date(), "State Hub", "Mobile crisis response provider in Region 4", "", "Confirmed", ""]
    ];
    sources.getRange(2, 1, srcData.length, srcData[0].length).setValues(srcData);
  }
  
  // Seed Grants
  const grants = ss.getSheetByName("Grant Opportunities");
  if (grants && grants.getLastRow() === 1) {
    const grantData = [
      ["GR-001", "Behavioral Health Mobile Crisis Team Partnerships (MCTP)", "SAMHSA", "https://www.samhsa.gov/grants", "Recently Closed", "2026-07-15", "States, local gov", "Establish/enhance mobile crisis teams", "Mobile Crisis Triage", "Mobile Crisis Provider, Law Enforcement", "Confirmed", new Date(), "SM-26-029"],
      ["GR-002", "Justice and Mental Health Collaboration Program (JMHCP)", "DOJ BJA", "https://bja.ojp.gov/funding", "Recently Closed", "Spring 2026", "Law Enforcement, Behavioral Health", "Co-responder models, CIT", "Law Enforcement Handoff", "Police Department, Sheriff Department", "Confirmed", new Date(), "Annual solicitation, wait for 2027"]
    ];
    grants.getRange(2, 1, grantData.length, grantData[0].length).setValues(grantData);
  }
  
  SpreadsheetApp.getUi().alert("Seed Data successfully injected from research.");
}
