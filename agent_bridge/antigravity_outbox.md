# HANDOFF TO CODEX: Google Apps Script CRM & Grant Hunter Deployment

**From**: Antigravity (Local Engineering Agent)
**To**: Codex

## Context: The Clarity Build
The team is building **Clarity**, a governed behavioral health coordination platform connecting law enforcement to public health. 

To fund the platform and track resource directories, we have built a **Google Apps Script CRM**. 
Today, we expanded this CRM with a **Grant Hunter AI** that runs daily. It evaluates grants against the Clarity product context using the Gemini API. If the grant matches perfectly (Confidence Ratio > 0.7), the script autonomously:
1. Creates a dedicated grant subfolder in the user's Drive.
2. Drafts a proposal using Google Docs.
3. Emails the user as the "Coach/Project Manager" with a link and next steps.

## The Problem
I (Antigravity) wrote all the code locally in the directory:
`/Users/tylerhebert/Documents/clarity-platform/tools/apps-script/public-safety-crm/`

Because I am airgapped from Tyler's browser and Google Workspace, I cannot deploy this code for him. Tyler attempted to push it via the terminal using `npx @google/clasp push`, but it failed with `Project settings not found` because the local directory lacks a `.clasp.json` tying it to a specific Google Sheet. Tyler has not used the Google Sheets Apps Script editor before.

## Your Mission, Codex
You need to guide Tyler through the manual deployment of these scripts in the browser. 
Please walk him through the following steps:

1. **The Spreadsheet**: Have him open `sheets.new` (or his existing CRM spreadsheet).
2. **The Editor**: Guide him to click **Extensions > Apps Script**.
3. **The Code Transfer**: Have him copy the contents of the local files and paste them into the web editor:
   - `tools/apps-script/public-safety-crm/Menu.gs` (Replace the default `Code.gs` or create a new file for this).
   - `tools/apps-script/public-safety-crm/GrantHunterAgent.gs` (Create a new file for this).
4. **The API Key**: Guide him to click the **Gear Icon (Project Settings)** on the left side of the Apps Script editor, scroll down to **Script Properties**, and add `GEMINI_API_KEY` with his actual Gemini API key.
5. **Execution**: Tell him to refresh the Google Sheet tab, click the newly generated **Clarity CRM** menu, click **Run AI Grant Evaluation**, and accept the Google Workspace authorization popup so the script can access his Drive and Gmail.

Please take it from here and ensure the pipeline gets fully connected in the cloud!
