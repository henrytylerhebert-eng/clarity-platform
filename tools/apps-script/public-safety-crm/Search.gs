/**
 * Search.gs
 * Placeholder for any custom search logic or JSON export functions.
 */

function validateFields() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const agencies = ss.getSheetByName("Agencies");
  if (!agencies) return;
  
  const data = agencies.getDataRange().getValues();
  let invalidCount = 0;
  
  // Start from row 2 (index 1) to skip header
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const sourceIds = row[20]; // U column
    const confidence = row[18]; // S column
    
    // Rule: if confidence is Confirmed, must have source_id
    if (confidence === "Confirmed" && (!sourceIds || sourceIds.trim() === "")) {
      agencies.getRange(i + 1, 21).setBackground("#ffcccc"); // Highlight missing source
      invalidCount++;
    } else {
      agencies.getRange(i + 1, 21).setBackground(null);
    }
  }
  
  SpreadsheetApp.getUi().alert(`Validation Complete. Found ${invalidCount} rows missing required Source IDs.`);
}

function exportCRMJSON() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const agencies = ss.getSheetByName("Agencies");
  
  if (!agencies) return;
  
  const data = agencies.getDataRange().getValues();
  const headers = data[0];
  const jsonArr = [];
  
  for (let i = 1; i < data.length; i++) {
    let obj = {};
    for (let j = 0; j < headers.length; j++) {
      // Exclude private notes or PII for export if necessary
      if (headers[j] !== "notes") {
        obj[headers[j]] = data[i][j];
      }
    }
    jsonArr.push(obj);
  }
  
  const jsonString = JSON.stringify(jsonArr, null, 2);
  const blob = Utilities.newBlob(jsonString, "application/json", "Clarity_CRM_Snapshot.json");
  
  // Show a dialog with the JSON so the user can copy it
  const htmlOutput = HtmlService.createHtmlOutput('<textarea style="width:100%;height:300px;">' + jsonString + '</textarea>')
      .setWidth(600)
      .setHeight(400);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'CRM Export JSON');
}
