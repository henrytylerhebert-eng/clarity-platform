/**
 * Menu.gs
 * Adds the custom menu to the Google Sheet.
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("Clarity CRM")
    .addItem("Initialize CRM Sheets", "initializeCRMSheets")
    .addItem("Populate Seed Data", "populateSeedData")
    .addItem("Validate Required Fields", "validateFields")
    .addItem("Create Review Queue", "generateReviewQueue")
    .addItem("Mark Selected Row Needs Review", "markRowNeedsReview")
    .addItem("Mark Selected Row Source Confirmed", "markRowSourceConfirmed")
    .addItem("Refresh Dashboard", "refreshDashboard")
    .addItem("Generate Grant Opportunity Summary", "generateGrantSummary")
    .addSeparator()
    .addItem("Analyze Grants (Review Only)", "evaluateGrantsWithGemini")
    .addItem("Create Draft for Selected Grant", "createGrantDraftForSelectedRow")
    .addItem("Configure Grant Hunter Folder", "configureGrantHunterFolder")
    .addItem("Move CRM to Grant Hunter Folder", "moveSpreadsheetToGrantHunter")
    .addItem("Setup Daily Review-Only Analysis", "setupDailyGrantHunterTrigger")
    .addSeparator()
    .addItem("Export CRM Snapshot JSON", "exportCRMJSON")
    .addToUi();
}
