/**
 * Adds the review-only Directory CRM menu to the bound Google Sheet.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Clarity Directory CRM")
    .addItem("Initialize / Verify Foundation", "initializeDirectoryCRM")
    .addItem("Populate Public Safety Seed Data", "populateDirectorySeedData")
    .addItem("Validate Seed Data", "validateDirectorySeedData")
    .addItem("Refresh Dashboard", "refreshDirectoryDashboard")
    .addSeparator()
    .addItem("Install / Repair Menu Trigger", "installDirectoryOpenTrigger")
    .addToUi();
}
