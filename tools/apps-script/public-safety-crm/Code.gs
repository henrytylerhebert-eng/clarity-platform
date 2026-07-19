/**
 * Code.gs
 * Core logic for initializing the sheet and handling the dashboard.
 */

function initializeCRMSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  Object.keys(SCHEMA).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    // Set headers
    const headers = SCHEMA[sheetName].headers;
    if (headers && headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
      sheet.setFrozenRows(1);
    }
    
    // Set Validations
    const validations = SCHEMA[sheetName].validations;
    if (validations) {
      Object.keys(validations).forEach(colIndex => {
        const rules = validations[colIndex];
        const range = sheet.getRange(2, parseInt(colIndex), sheet.getMaxRows() - 1, 1);
        const rule = SpreadsheetApp.newDataValidation().requireValueInList(rules, true).build();
        range.setDataValidation(rule);
      });
    }
  });
  
  SpreadsheetApp.getUi().alert("CRM Sheets Initialized Successfully.");
}

function refreshDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dashboard = ss.getSheetByName("Dashboard");
  if (!dashboard) return;
  
  dashboard.clear();
  dashboard.getRange("A1").setValue("Clarity CRM Dashboard").setFontSize(16).setFontWeight("bold");
  
  const agencies = ss.getSheetByName("Agencies");
  const specialUnits = ss.getSheetByName("Special Units");
  const mobileCrisis = ss.getSheetByName("Mobile Crisis Providers");
  const elder = ss.getSheetByName("Elder Protection");
  const grants = ss.getSheetByName("Grant Opportunities");
  const reviewQueue = ss.getSheetByName("Review Queue");
  
  const data = [
    ["Metric", "Count"],
    ["Total Agencies", getRowCount(agencies)],
    ["Police Departments", countMatches(agencies, 3, "Police Department")],
    ["Sheriff Departments", countMatches(agencies, 3, "Sheriff Department")],
    ["Special Units Found", getRowCount(specialUnits)],
    ["Mobile Crisis Providers", getRowCount(mobileCrisis)],
    ["Elder Protection Records", getRowCount(elder)],
    ["Grant Opportunities", getRowCount(grants)],
    ["Records Needing Review", countMatches(agencies, 18, "Needs Review") + countMatches(specialUnits, 13, "Needs Review")],
    ["Stale Records", countMatches(agencies, 18, "Stale")]
  ];
  
  dashboard.getRange(3, 1, data.length, 2).setValues(data);
  dashboard.getRange(3, 1, 1, 2).setFontWeight("bold").setBackground("#f3f3f3");
  dashboard.autoResizeColumns(1, 2);
}

function getRowCount(sheet) {
  if (!sheet) return 0;
  const lastRow = sheet.getLastRow();
  return lastRow > 1 ? lastRow - 1 : 0;
}

function countMatches(sheet, colIndex, value) {
  if (!sheet) return 0;
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 0;
  const data = sheet.getRange(2, colIndex, lastRow - 1, 1).getValues();
  return data.filter(row => row[0] === value).length;
}
