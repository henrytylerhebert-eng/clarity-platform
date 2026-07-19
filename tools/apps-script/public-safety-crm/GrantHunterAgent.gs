/**
 * GrantHunterAgent.gs
 *
 * Review-gated grant analysis for the Clarity research CRM. Automated runs may
 * analyze rows and write review candidates to the sheet. Drive folders and
 * proposal documents are created only after a user explicitly confirms a
 * selected grant. The script does not send email or submit grant applications.
 */

const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GRANT_HUNTER_FOLDER_PROPERTY = "GRANT_HUNTER_FOLDER_ID";

const CLARITY_PRODUCT_CONTEXT = `
You are assisting a human reviewer with grant-opportunity research for Clarity.
Clarity is a governed coordination directory and prescreen routing concept connecting
law enforcement (911/CAD) with public health (988/Mobile Crisis/EDs).

Current concept areas:
1. Network Directory CRM: Source-backed directory of crisis providers.
2. Field Prescreen Handoff: Secure capture and routing of behavioral health field facts.
3. Governed Routing: Proposed access controls intended to separate criminal data and PHI.

Important boundaries:
- Clarity is not a deployed clinical system, production integration, grant award, or agency partnership.
- Do not claim that proposed controls, integrations, outcomes, or funding readiness are implemented.
- Treat every score as an AI estimate for prioritization, not measured evidence or a funding decision.
- A human must verify eligibility, requirements, deadline, sources, and the final pursuit decision.

Return ONLY a valid JSON object matching this schema:
{
  "confidence_ratio": 0.0,
  "win_probability_estimate": 0.0,
  "missing_features": ["feature 1"],
  "draft_proposal": "paragraph 1\\n\\nparagraph 2\\n\\nparagraph 3"
}

Use draft_proposal only when confidence_ratio is greater than 0.7. Otherwise return an empty string.
`;

function getGrantHunterFolder() {
  const folderId = PropertiesService.getScriptProperties()
    .getProperty(GRANT_HUNTER_FOLDER_PROPERTY);

  if (!folderId) {
    throw new Error(
      "Grant Hunter folder is not configured. Use Clarity CRM > Configure Grant Hunter Folder first."
    );
  }

  return DriveApp.getFolderById(folderId);
}

function configureGrantHunterFolder() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    "Configure Grant Hunter Folder",
    "Paste the Google Drive folder URL or folder ID. This folder will hold manually approved grant workspaces.",
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const value = response.getResponseText().trim();
  const urlMatch = value.match(/\/folders\/([A-Za-z0-9_-]+)/);
  const folderId = urlMatch ? urlMatch[1] : value;

  if (!/^[A-Za-z0-9_-]{10,}$/.test(folderId)) {
    ui.alert("The folder URL or ID was not recognized.");
    return;
  }

  try {
    const folder = DriveApp.getFolderById(folderId);
    PropertiesService.getScriptProperties()
      .setProperty(GRANT_HUNTER_FOLDER_PROPERTY, folderId);
    ui.alert(`Grant Hunter folder configured: ${folder.getName()}`);
  } catch (error) {
    ui.alert(`Unable to access that folder: ${error.message}`);
  }
}

function getGrantColumnIndexes(headers) {
  const columns = {
    name: headers.indexOf("program_name"),
    description: headers.indexOf("allowable_uses"),
    fit: headers.indexOf("clarity_fit"),
    notes: headers.indexOf("notes"),
    deadline: headers.indexOf("deadline"),
    funder: headers.indexOf("funder")
  };

  const missing = Object.keys(columns).filter(key => columns[key] === -1);
  if (missing.length > 0) {
    throw new Error(`Missing required Grant Opportunities columns: ${missing.join(", ")}`);
  }

  return columns;
}

function grantFromRow(row, columns) {
  return {
    name: row[columns.name],
    description: row[columns.description],
    funder: row[columns.funder] || "Unknown Funder",
    deadline: row[columns.deadline] || "Unknown Deadline"
  };
}

function analyzeGrantWithGemini(grant) {
  const apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in Apps Script Properties.");
  }

  const prompt = [
    "Evaluate this grant opportunity for human review.",
    `Name: ${grant.name}`,
    `Funder: ${grant.funder}`,
    `Deadline: ${grant.deadline}`,
    `Allowable uses: ${grant.description}`
  ].join("\n");

  const payload = {
    systemInstruction: {
      parts: [{ text: CLARITY_PRODUCT_CONTEXT }]
    },
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const response = UrlFetchApp.fetch(GEMINI_API_URL, {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-goog-api-key": apiKey
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();
  if (responseCode < 200 || responseCode >= 300) {
    throw new Error(`Gemini request failed (${responseCode}): ${responseText.slice(0, 300)}`);
  }

  const json = JSON.parse(responseText);
  if (!json.candidates || json.candidates.length === 0) {
    throw new Error("Gemini returned no candidate response.");
  }

  const aiText = json.candidates[0].content.parts[0].text;
  const aiData = JSON.parse(aiText);
  const confidenceRatio = Number(aiData.confidence_ratio);
  const winProbabilityEstimate = Number(aiData.win_probability_estimate);

  if (!Number.isFinite(confidenceRatio) || confidenceRatio < 0 || confidenceRatio > 1) {
    throw new Error("Gemini returned an invalid confidence_ratio.");
  }
  if (
    !Number.isFinite(winProbabilityEstimate) ||
    winProbabilityEstimate < 0 ||
    winProbabilityEstimate > 1
  ) {
    throw new Error("Gemini returned an invalid win_probability_estimate.");
  }

  return {
    confidence_ratio: confidenceRatio,
    win_probability_estimate: winProbabilityEstimate,
    missing_features: Array.isArray(aiData.missing_features)
      ? aiData.missing_features.map(String)
      : [],
    draft_proposal: typeof aiData.draft_proposal === "string"
      ? aiData.draft_proposal
      : ""
  };
}

function writeGrantAnalysis(sheet, rowNumber, columns, aiData) {
  const fitSummary = [
    `AI fit estimate: ${Math.round(aiData.confidence_ratio * 100)}%`,
    `AI win-likelihood estimate: ${Math.round(aiData.win_probability_estimate * 100)}%`,
    "Requires human review"
  ].join(" | ");

  const existingNotes = String(sheet.getRange(rowNumber, columns.notes + 1).getValue() || "").trim();
  const analysisNote = [
    `[AI review candidate — ${GEMINI_MODEL}]`,
    `Missing or proposed features: ${aiData.missing_features.join(", ") || "[Unknown]"}`,
    "Verify eligibility, deadline, requirements, sources, and pursuit decision before acting."
  ].join(" ");

  sheet.getRange(rowNumber, columns.fit + 1).setValue(fitSummary);
  sheet.getRange(rowNumber, columns.notes + 1)
    .setValue(existingNotes ? `${existingNotes}\n${analysisNote}` : analysisNote);
}

function evaluateGrantsWithGemini() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Grant Opportunities");
  if (!sheet) {
    ui.alert("Grant Opportunities sheet was not found. Initialize the CRM sheets first.");
    return;
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    ui.alert("No grant opportunities are available for analysis.");
    return;
  }

  let columns;
  try {
    columns = getGrantColumnIndexes(data[0]);
  } catch (error) {
    ui.alert(error.message);
    return;
  }

  let evaluatedCount = 0;
  const errors = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const grant = grantFromRow(row, columns);
    const currentFit = row[columns.fit];

    if (!grant.name || !grant.description || (currentFit && currentFit !== "Analyze")) {
      continue;
    }

    try {
      const aiData = analyzeGrantWithGemini(grant);
      writeGrantAnalysis(sheet, i + 1, columns, aiData);
      evaluatedCount++;
    } catch (error) {
      errors.push(`${grant.name}: ${error.message}`);
      Logger.log(`Failed to evaluate ${grant.name}: ${error.stack || error}`);
    }
  }

  const lines = [
    `Analyzed ${evaluatedCount} grant(s).`,
    "Results are review candidates only; no folders, documents, emails, or applications were created."
  ];
  if (errors.length > 0) {
    lines.push(`Errors (${errors.length}): ${errors.slice(0, 3).join(" | ")}`);
  }
  ui.alert(lines.join("\n\n"));
}

function createGrantDraftForSelectedRow() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const rowNumber = sheet.getActiveCell().getRow();

  if (sheet.getName() !== "Grant Opportunities" || rowNumber <= 1) {
    ui.alert("Select a grant row in the Grant Opportunities sheet first.");
    return;
  }

  const data = sheet.getDataRange().getValues();
  let columns;
  try {
    columns = getGrantColumnIndexes(data[0]);
  } catch (error) {
    ui.alert(error.message);
    return;
  }

  const grant = grantFromRow(data[rowNumber - 1], columns);
  if (!grant.name || !grant.description) {
    ui.alert("The selected row needs program_name and allowable_uses before drafting.");
    return;
  }

  let aiData;
  try {
    aiData = analyzeGrantWithGemini(grant);
    writeGrantAnalysis(sheet, rowNumber, columns, aiData);
  } catch (error) {
    ui.alert(`Unable to analyze the selected grant: ${error.message}`);
    return;
  }

  if (aiData.confidence_ratio <= 0.7) {
    ui.alert(
      `No workspace created. The AI fit estimate was ${Math.round(aiData.confidence_ratio * 100)}%, ` +
      "which does not exceed the drafting threshold. A human may review the sheet result."
    );
    return;
  }

  const confirmation = ui.alert(
    "Create Grant Draft Workspace?",
    [
      `Grant: ${grant.name}`,
      `AI fit estimate: ${Math.round(aiData.confidence_ratio * 100)}%`,
      `AI win-likelihood estimate: ${Math.round(aiData.win_probability_estimate * 100)}%`,
      "These are unverified AI estimates. Create a Drive folder and draft Google Doc for human review?"
    ].join("\n"),
    ui.ButtonSet.YES_NO
  );
  if (confirmation !== ui.Button.YES) return;

  try {
    const rootFolder = getGrantHunterFolder();
    const grantFolder = rootFolder.createFolder(`[GRANT REVIEW] ${grant.name}`);
    const doc = DocumentApp.create(`Draft for Review: ${grant.name}`);
    const body = doc.getBody();

    body.insertParagraph(0, `Grant Review Draft: ${grant.name}`)
      .setHeading(DocumentApp.ParagraphHeading.HEADING1);
    body.appendParagraph("AI-generated research draft. Not submitted, approved, or source-verified.");
    body.appendParagraph(`Funder: ${grant.funder}`);
    body.appendParagraph(`Deadline: ${grant.deadline}`);
    body.appendParagraph(`AI fit estimate: ${Math.round(aiData.confidence_ratio * 100)}%`);
    body.appendParagraph(
      `AI win-likelihood estimate: ${Math.round(aiData.win_probability_estimate * 100)}% (unverified)`
    );
    body.appendParagraph("Missing or Proposed Product Requirements:")
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);
    aiData.missing_features.forEach(feature => body.appendListItem(feature));
    body.appendParagraph("AI Draft Proposal Concept:")
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(aiData.draft_proposal || "No proposal draft was returned.");
    body.appendParagraph("Human Review Checklist:")
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);
    [
      "Verify the official source URL and deadline.",
      "Confirm applicant eligibility and match requirements.",
      "Separate implemented Clarity capabilities from proposed work.",
      "Approve, revise, or reject the pursuit decision.",
      "Do not submit without an authorized human review."
    ].forEach(item => body.appendListItem(item));

    doc.saveAndClose();
    const docFile = DriveApp.getFileById(doc.getId());
    docFile.moveTo(grantFolder);

    const existingNotes = String(sheet.getRange(rowNumber, columns.notes + 1).getValue() || "").trim();
    sheet.getRange(rowNumber, columns.notes + 1)
      .setValue(`${existingNotes}\nDraft workspace (human review required): ${grantFolder.getUrl()}`.trim());

    ui.alert(
      "Draft workspace created for human review. No email was sent and no application was submitted.\n\n" +
      grantFolder.getUrl()
    );
  } catch (error) {
    ui.alert(`Unable to create the draft workspace: ${error.message}`);
  }
}

function setupDailyGrantHunterTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "evaluateGrantsWithGemini") {
      SpreadsheetApp.getUi().alert("The daily review-only analysis trigger already exists.");
      return;
    }
  }

  ScriptApp.newTrigger("evaluateGrantsWithGemini")
    .timeBased()
    .everyDays(1)
    .atHour(2)
    .create();

  SpreadsheetApp.getUi().alert(
    "Daily review-only analysis scheduled. It may update sheet review candidates, but it will not create Drive files or send email."
  );
}

function moveSpreadsheetToGrantHunter() {
  const ui = SpreadsheetApp.getUi();
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const file = DriveApp.getFileById(ss.getId());
    const targetFolder = getGrantHunterFolder();
    const confirmation = ui.alert(
      "Move CRM Spreadsheet?",
      `Move this spreadsheet into ${targetFolder.getName()}?`,
      ui.ButtonSet.YES_NO
    );
    if (confirmation !== ui.Button.YES) return;

    file.moveTo(targetFolder);
    ui.alert("Spreadsheet moved to the configured Grant Hunter folder.");
  } catch (error) {
    ui.alert(`Unable to move the spreadsheet: ${error.message}`);
  }
}
