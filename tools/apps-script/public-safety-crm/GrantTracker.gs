/**
 * GrantTracker.gs
 * Helper functions to generate grant summaries.
 */

function generateGrantSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const grantsSheet = ss.getSheetByName("Grant Opportunities");
  
  if (!grantsSheet) return;
  
  const data = grantsSheet.getDataRange().getValues();
  if (data.length <= 1) {
    SpreadsheetApp.getUi().alert("No grant data available.");
    return;
  }
  
  let currentCount = 0;
  let closedCount = 0;
  let summaryText = "GRANT OPPORTUNITY SUMMARY\n\n";
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const name = row[1];
    const status = row[4];
    const deadline = row[5];
    const fit = row[8];
    
    if (status === "Confirmed Current") {
      currentCount++;
      summaryText += `[CURRENT] ${name} (Deadline: ${deadline})\nFit: ${fit}\n\n`;
    } else if (status === "Recently Closed") {
      closedCount++;
    }
  }
  
  summaryText += `\nMetrics: ${currentCount} Active Grants, ${closedCount} Recently Closed.`;
  
  const ui = SpreadsheetApp.getUi();
  ui.alert("Grant Summary", summaryText, ui.ButtonSet.OK);
}
