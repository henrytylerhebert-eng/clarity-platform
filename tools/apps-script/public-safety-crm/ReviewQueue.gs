/**
 * ReviewQueue.gs
 * Generates the review queue from stale or missing-source records.
 */

function generateReviewQueue() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const queueSheet = ss.getSheetByName("Review Queue");
  const agencies = ss.getSheetByName("Agencies");
  const specialUnits = ss.getSheetByName("Special Units");
  
  if (!queueSheet || !agencies) return;
  
  // Clear existing queue (skip header)
  const lastRow = queueSheet.getLastRow();
  if (lastRow > 1) {
    queueSheet.getRange(2, 1, lastRow - 1, queueSheet.getMaxColumns()).clearContent();
  }
  
  let queueData = [];
  
  // Scan Agencies
  const agencyData = agencies.getDataRange().getValues();
  for (let i = 1; i < agencyData.length; i++) {
    const row = agencyData[i];
    const reviewState = row[17]; // R
    const confidence = row[18]; // S
    const sourceIds = row[20]; // U
    
    if (reviewState === "Needs Review" || reviewState === "Stale" || confidence === "Unknown" || !sourceIds) {
      queueData.push([
        "REV-" + Utilities.getUuid(),
        "Agency",
        row[0] || `Row ${i+1}`,
        "Overall Record",
        reviewState,
        sourceIds,
        !sourceIds ? "Missing Source ID" : "Status is " + reviewState,
        "Unassigned",
        "Open",
        "",
        new Date(),
        new Date()
      ]);
    }
  }
  
  // Scan Special Units
  if (specialUnits) {
    const unitData = specialUnits.getDataRange().getValues();
    for (let i = 1; i < unitData.length; i++) {
      const row = unitData[i];
      const reviewState = row[12]; // M
      const confidence = row[13]; // N
      const sourceIds = row[11]; // L
      
      if (reviewState === "Needs Review" || reviewState === "Stale" || confidence === "Unknown" || !sourceIds) {
        queueData.push([
          "REV-" + Utilities.getUuid(),
          "Special Unit",
          row[0] || `Row ${i+1}`,
          "Overall Record",
          reviewState,
          sourceIds,
          !sourceIds ? "Missing Source ID" : "Status is " + reviewState,
          "Unassigned",
          "Open",
          "",
          new Date(),
          new Date()
        ]);
      }
    }
  }
  
  if (queueData.length > 0) {
    queueSheet.getRange(2, 1, queueData.length, queueData[0].length).setValues(queueData);
    SpreadsheetApp.getUi().alert(`Generated ${queueData.length} items in the Review Queue.`);
  } else {
    SpreadsheetApp.getUi().alert("No items require review at this time.");
  }
}

function markRowNeedsReview() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const row = sheet.getActiveCell().getRow();
  
  if (row === 1) return; // Header
  
  if (sheet.getName() === "Agencies") {
    sheet.getRange(row, 18).setValue("Needs Review"); // review_state
  } else if (sheet.getName() === "Special Units") {
    sheet.getRange(row, 13).setValue("Needs Review"); 
  }
}

function markRowSourceConfirmed() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const row = sheet.getActiveCell().getRow();
  
  if (row === 1) return; // Header
  
  if (sheet.getName() === "Agencies") {
    sheet.getRange(row, 18).setValue("Source Confirmed"); 
  } else if (sheet.getName() === "Special Units") {
    sheet.getRange(row, 13).setValue("Source Confirmed"); 
  }
}
