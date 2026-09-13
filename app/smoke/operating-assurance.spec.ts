import { expect, test, type Page } from "@playwright/test";
import {
  ASSURANCE_DEV_FIXTURE,
  ASSURANCE_DEV_USERS,
  mutateAssuranceFixtureForE2E,
  resetAssuranceFixtureForE2E,
} from "./assurance-fixture.js";

const contributor = ASSURANCE_DEV_USERS[0];
const reviewer = ASSURANCE_DEV_USERS[1];
const systemAdmin = ASSURANCE_DEV_USERS[2];

function historyPanel(page: Page) {
  return page.locator("section.panel").filter({
    has: page.getByRole("heading", { name: "Assurance history" }),
  });
}

async function openAssuranceCase(page: Page, assertion: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "Operating Assurance" }).click();
  await page.getByLabel("Operating Assurance dev assertion").fill(assertion);
  await page.getByRole("button", { name: "Sign in (verified session)" }).click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await page.getByLabel("Operating Assurance case key").fill(ASSURANCE_DEV_FIXTURE.caseKey);
  await page.getByRole("button", { name: "Load case" }).click();
  await expect(page.getByRole("heading", { name: "Synthetic Monthly Environmental Assurance" })).toBeVisible();
}

async function submitCompleteEvidence(page: Page) {
  await page.getByLabel("Evidence roundDate").fill(ASSURANCE_DEV_FIXTURE.completeEvidence.roundDate);
  await page.getByLabel("Evidence owner").fill(ASSURANCE_DEV_FIXTURE.completeEvidence.owner);
  await page.getByLabel("Evidence followUpStatus").fill(ASSURANCE_DEV_FIXTURE.completeEvidence.followUpStatus);
  await page.getByRole("button", { name: "Submit evidence", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Evidence submitted for review.");
}

async function runSupportedEvaluation(page: Page) {
  await page.getByRole("button", { name: "Run governed evaluation" }).click();
  await expect(page.getByRole("status")).toContainText("Machine assistance refreshed. Human review is still required.");
  await expect(page.getByText("Supported", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Human review required:", { exact: true })).toBeVisible();
  await expect(page.getByText("Yes", { exact: true }).first()).toBeVisible();
}

async function signOutAndIn(page: Page, assertion: string) {
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("heading", { name: "Verified API session required" })).toBeVisible();
  await page.getByLabel("Operating Assurance dev assertion").fill(assertion);
  await page.getByRole("button", { name: "Sign in (verified session)" }).click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await page.getByLabel("Operating Assurance case key").fill(ASSURANCE_DEV_FIXTURE.caseKey);
  await page.getByRole("button", { name: "Load case" }).click();
  await expect(page.getByRole("heading", { name: "Synthetic Monthly Environmental Assurance" })).toBeVisible();
}

test.beforeEach(async () => {
  await resetAssuranceFixtureForE2E();
});

test("accepted OA case replays stale source without rewriting prior history", async ({ page }, testInfo) => {
  await openAssuranceCase(page, contributor.assertion);

  const trust = page.getByLabel("Operating Assurance trust strip");
  for (const label of ["Authority", "Applicability", "Policy", "SOP", "Evidence", "Machine assistance", "Human review"]) {
    await expect(trust.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(trust.getByText("Current", { exact: true })).toBeVisible();
  await expect(page.getByText("Machine assistance is not a compliance determination.", { exact: false })).toBeVisible();

  await submitCompleteEvidence(page);
  await runSupportedEvaluation(page);

  await signOutAndIn(page, reviewer.assertion);
  await expect(page.getByText("Both required grants are present", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Record qualified review" }).click();
  await expect(page.getByRole("status")).toContainText("Qualified human review recorded.");
  await expect(trust.getByText("Accept", { exact: true })).toBeVisible();

  const history = historyPanel(page);
  await expect(history.getByText("Evidence", { exact: true })).toBeVisible();
  await expect(history.getByText("Evaluation", { exact: true })).toBeVisible();
  await expect(history.getByText("Review", { exact: true })).toBeVisible();
  await expect(history.getByText("Accepted", { exact: true })).toBeVisible();
  await expect(history.getByText("Supported", { exact: true })).toBeVisible();
  await expect(history.getByText("Accept", { exact: true })).toBeVisible();

  await mutateAssuranceFixtureForE2E("STALE");
  await page.getByRole("button", { name: "Run governed evaluation" }).click();
  await expect(page.getByRole("status")).toContainText("Machine assistance refreshed. Human review is still required.");
  await expect(page.getAllByText("Stale Source", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("This is a fail-closed state.", { exact: false })).toBeVisible();
  await expect(trust.getByText("Stale", { exact: true })).toBeVisible();
  await expect(trust.getByText("Review Required", { exact: true }).last()).toBeVisible();

  await expect(history.getByText("Supported", { exact: true })).toBeVisible();
  await expect(history.getByText("Stale Source", { exact: true })).toBeVisible();
  await expect(history.getByText("Accept", { exact: true })).toBeVisible();
  await expect(history.getByText("Accepted", { exact: true })).toBeVisible();

  await page.screenshot({ path: testInfo.outputPath("oa-stale-replay.png"), fullPage: true });
});

test("unresolved source conflict replays fail-closed while preserving earlier evaluation history", async ({ page }, testInfo) => {
  await openAssuranceCase(page, contributor.assertion);
  await submitCompleteEvidence(page);
  await runSupportedEvaluation(page);

  await mutateAssuranceFixtureForE2E("CONFLICT");
  await page.getByRole("button", { name: "Run governed evaluation" }).click();
  await expect(page.getByRole("status")).toContainText("Machine assistance refreshed. Human review is still required.");
  await expect(page.getAllByText("Conflict", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("An unresolved source conflict is recorded.", { exact: false })).toBeVisible();
  await expect(page.getByText("This is a fail-closed state.", { exact: false })).toBeVisible();

  const history = historyPanel(page);
  await expect(history.getByText("Supported", { exact: true })).toBeVisible();
  await expect(history.getByText("Conflict", { exact: true })).toBeVisible();
  await expect(history.getByText("Submitted", { exact: true })).toBeVisible();

  await page.screenshot({ path: testInfo.outputPath("oa-conflict-replay.png"), fullPage: true });
});

test("SYSTEM_ADMIN cannot acquire qualified reviewer authority through the workspace or API", async ({ page }) => {
  await openAssuranceCase(page, systemAdmin.assertion);
  await expect(page.getByText("Both required grants are not present", { exact: true })).toBeVisible();
  await expect(page.getByText("SYSTEM_ADMIN alone is not sufficient.", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "Run governed evaluation" }).click();
  await expect(page.getByRole("status")).toContainText("Machine assistance refreshed. Human review is still required.");
  await expect(page.getByText("Missing Evidence", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Record qualified review" })).toBeDisabled();

  const login = await page.request.post("/api/auth/login", { data: { assertion: systemAdmin.assertion } });
  expect(login.ok()).toBe(true);
  const { token } = (await login.json()) as { token: string };
  const headers = { authorization: `Bearer ${token}` };
  const viewResponse = await page.request.get(`/api/assurance/cases/${ASSURANCE_DEV_FIXTURE.caseKey}`, { headers });
  expect(viewResponse.ok()).toBe(true);
  const view = (await viewResponse.json()) as { evaluations: Array<{ id: string }> };
  const evaluationId = view.evaluations[0]?.id;
  expect(evaluationId).toBeTruthy();
  const denied = await page.request.post(`/api/assurance/evaluations/${evaluationId}/review`, {
    headers,
    data: { decision: "ACCEPT" },
  });
  expect(denied.status()).toBe(403);
  expect(await denied.json()).toEqual({ error: "assurance_permission_denied" });
});
