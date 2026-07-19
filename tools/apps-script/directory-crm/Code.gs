/**
 * Foundation initialization, idempotent upserts, and review-only validation.
 */

function initializeDirectoryCRM() {
  ensureDirectoryCRM_();
  upsertSetting_("version", "Foundation v1 + public-safety seed importer " + DIRECTORY_CONFIG.VERSION);
  SpreadsheetApp.getActiveSpreadsheet().toast(
    "Directory CRM foundation is ready.",
    "Clarity Directory CRM",
    5
  );
}

function installDirectoryOpenTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const alreadyInstalled = ScriptApp.getProjectTriggers().some(function(trigger) {
    return trigger.getHandlerFunction() === "onOpen" &&
      trigger.getEventType() === ScriptApp.EventType.ON_OPEN;
  });

  if (!alreadyInstalled) {
    ScriptApp.newTrigger("onOpen")
      .forSpreadsheet(ss)
      .onOpen()
      .create();
  }

  ss.toast(
    alreadyInstalled ? "Directory CRM menu trigger already installed." : "Directory CRM menu trigger installed.",
    "Clarity Directory CRM",
    5
  );
}

function ensureDirectoryCRM_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Object.keys(DIRECTORY_CONFIG.REQUIRED_SHEETS).forEach(function(sheetName) {
    const expectedHeaders = DIRECTORY_CONFIG.REQUIRED_SHEETS[sheetName];
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
      sheet.getRange(1, 1, 1, expectedHeaders.length)
        .setFontWeight("bold")
        .setBackground("#356854")
        .setFontColor("#ffffff");
      sheet.setFrozenRows(1);
      return;
    }

    assertHeaders_(sheet, expectedHeaders);
  });

}

function upsertRowsByKey_(sheetName, rows, keyColumnIndex) {
  if (!rows.length) return { inserted: 0, updated: 0 };

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error("Missing required sheet: " + sheetName);

  const width = rows[0].length;
  const lastRow = sheet.getLastRow();
  const existing = lastRow > 1
    ? sheet.getRange(2, keyColumnIndex + 1, lastRow - 1, 1).getDisplayValues()
    : [];
  const rowByKey = {};
  existing.forEach(function(row, index) {
    if (row[0]) rowByKey[String(row[0])] = index + 2;
  });

  let inserted = 0;
  let updated = 0;
  rows.forEach(function(row) {
    const key = String(row[keyColumnIndex]);
    let targetRow = rowByKey[key];
    if (targetRow) {
      updated += 1;
    } else {
      targetRow = sheet.getLastRow() + 1;
      if (sheet.getLastRow() >= 2) {
        sheet.getRange(2, 1, 1, width).copyTo(
          sheet.getRange(targetRow, 1, 1, width),
          SpreadsheetApp.CopyPasteType.PASTE_FORMAT,
          false
        );
        sheet.getRange(2, 1, 1, width).copyTo(
          sheet.getRange(targetRow, 1, 1, width),
          SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION,
          false
        );
      }
      rowByKey[key] = targetRow;
      inserted += 1;
    }
    sheet.getRange(targetRow, 1, 1, width).setValues([row]);
  });

  return { inserted: inserted, updated: updated };
}

function upsertSetting_(key, value) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Settings");
  if (!sheet) throw new Error("Missing required sheet: Settings");
  const keys = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues()
    : [];
  const index = keys.findIndex(function(row) { return row[0] === key; });
  const targetRow = index >= 0 ? index + 2 : sheet.getLastRow() + 1;
  sheet.getRange(targetRow, 1, 1, 2).setValues([[key, value]]);
}

function assertHeaders_(sheet, expectedHeaders) {
  const actual = sheet.getRange(1, 1, 1, expectedHeaders.length).getDisplayValues()[0];
  expectedHeaders.forEach(function(header, index) {
    if (actual[index] !== header) {
      throw new Error(
        "Schema mismatch in " + sheet.getName() + " column " + (index + 1) +
        ": expected '" + header + "', found '" + actual[index] + "'."
      );
    }
  });
}

function validateDirectorySeedData() {
  const checks = [
    ["Organizations", 0],
    ["Locations", 0],
    ["Service Lines", 0],
    ["Sources", 0],
    ["Review Queue", 0],
    ["Import Staging", 3]
  ];
  const issues = [];

  checks.forEach(function(check) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(check[0]);
    if (!sheet || sheet.getLastRow() <= 1) return;
    const values = sheet.getRange(2, check[1] + 1, sheet.getLastRow() - 1, 1).getDisplayValues();
    const seen = {};
    values.forEach(function(row, index) {
      const key = row[0];
      if (!key) issues.push(check[0] + " row " + (index + 2) + " has no stable ID.");
      if (key && seen[key]) issues.push(check[0] + " contains duplicate ID: " + key);
      seen[key] = true;
    });
  });

  const message = issues.length
    ? "Validation found " + issues.length + " issue(s):\n\n" + issues.join("\n")
    : "Seed validation passed. This confirms sheet structure only; source claims still require human review.";
  SpreadsheetApp.getActiveSpreadsheet().toast(message, "Seed validation", 10);
}

function refreshDirectoryDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dashboard = ss.getSheetByName("Dashboard");
  if (!dashboard) return;

  dashboard.getRange("A1").setValue("Clarity Directory CRM");
  dashboard.getRange("A2").setValue(
    "Public Safety + Crisis Response seed packet staged. All sourced records require human review."
  );

  const metricRows = {
    "Organizations": rowCount_(ss.getSheetByName("Organizations")),
    "Locations": rowCount_(ss.getSheetByName("Locations")),
    "Service lines": rowCount_(ss.getSheetByName("Service Lines")),
    "Personnel roles": rowCount_(ss.getSheetByName("Personnel Roles")),
    "Partner relationships": rowCount_(ss.getSheetByName("Partner Relationships")),
    "Open CRM activities": rowCount_(ss.getSheetByName("CRM Activities"))
  };
  const labels = dashboard.getRange(5, 1, 20, 1).getDisplayValues();
  labels.forEach(function(row, index) {
    if (Object.prototype.hasOwnProperty.call(metricRows, row[0])) {
      dashboard.getRange(index + 5, 2).setValue(metricRows[row[0]]);
    }
  });
  dashboard.getRange("E8").setValue("Staged for review");
  dashboard.getRange("F8").setValue("Four source-derived agency/provider profiles plus two grant leads are staged");
  dashboard.getRange("E9").setValue("Human source review");
  dashboard.getRange("F9").setValue("Confirm contacts, hours, service boundaries, and grant status before use");
}

function rowCount_(sheet) {
  return sheet && sheet.getLastRow() > 1 ? sheet.getLastRow() - 1 : 0;
}
