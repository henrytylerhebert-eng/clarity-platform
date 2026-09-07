import { expect, test } from "@playwright/test";

test("delegated census entry respects correction and revoked-access boundaries", async ({
  page,
}, testInfo) => {
  const name = `Synthetic delegated ${testInfo.project.name} ${Date.now()}`;
  const login = await page.request.post("/api/auth/login", {
    data: { assertion: "syn-assert-revops-admin-dev" },
  });
  const { token } = await login.json();
  const headers = { authorization: `Bearer ${token}` };
  const response = await page.request.post("/api/rev-ops/workspaces", {
    headers,
    data: {
      name,
      unit: "Adult",
      timezone: "America/Chicago",
      costCenterLabel: "Cost center",
      costCenterOptions: ["Inpatient"],
    },
  });
  expect(response.ok()).toBe(true);
  const workspace = await response.json();
  const members = await (
    await page.request.get("/api/rev-ops/members", { headers })
  ).json();
  const staff = members.find(
    (m: { displayName: string }) =>
      m.displayName === "Synthetic Census Operator",
  );
  expect(staff).toBeTruthy();
  async function grant(permissions: string[]) {
    const current = await (
      await page.request.get(`/api/rev-ops/workspaces/${workspace.id}`, {
        headers,
      })
    ).json();
    const result = await page.request.post(
      `/api/rev-ops/workspaces/${workspace.id}/commands`,
      {
        headers,
        data: {
          revision: current.revision,
          command: { action: "grant", userId: staff.id, permissions },
        },
      },
    );
    expect(result.ok()).toBe(true);
  }
  await grant(["actualEnter"]);
  await page.goto("/rev-ops");
  await page
    .getByLabel("Development assertion")
    .fill("syn-assert-revops-census-dev");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page
    .getByLabel("Hospital / unit")
    .selectOption({ label: `${name} / Adult` });
  await expect(
    page.getByRole("button", { name: "Setup & access", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Daily actuals", exact: true })
    .click();
  await page.getByLabel("Patient days", { exact: true }).fill("9");
  await page.getByRole("button", { name: "Save actual" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Saved with source history",
  );
  await page.getByLabel("Patient days", { exact: true }).fill("10");
  await page
    .getByLabel("Correction reason", { exact: false })
    .fill("Reconciled signed census");
  await page.getByRole("button", { name: "Save actual" }).click();
  await expect(page.getByRole("alert")).toContainText("permission denied");
  await grant(["actualEnter", "actualCorrect"]);
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Refreshed from server");
  await page.getByRole("button", { name: "Save actual" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Saved with source history",
  );
  const corrected = await (
    await page.request.get(`/api/rev-ops/workspaces/${workspace.id}`, {
      headers,
    })
  ).json();
  expect(
    corrected.state.actuals["2028-02-07"].map(
      (v: { count: number }) => v.count,
    ),
  ).toEqual([9, 10]);
  await grant([]);
  await page.getByLabel("Patient days", { exact: true }).fill("11");
  await page.getByRole("button", { name: "Save actual" }).click();
  await expect(page.getByRole("alert")).toContainText("permission denied");
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(
    page.getByRole("option", { name: `${name} / Adult`, exact: true }),
  ).toHaveCount(0);
  const logout = page.waitForResponse((r) =>
    r.url().endsWith("/api/auth/logout"),
  );
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  expect((await logout).status()).toBe(204);
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
});

test("hospital setup, budget upload/approval, actuals, correction and period accountability", async ({
  page,
}, testInfo) => {
  const name = `Synthetic Rev Ops ${testInfo.project.name} ${Date.now()}`;
  await page.goto("/rev-ops");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page
    .getByRole("button", { name: "Setup & access", exact: true })
    .click();
  await page.getByLabel("Hospital name", { exact: true }).fill(name);
  await page
    .getByRole("button", { name: "Create workspace", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Hospital workspace created",
  );
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  await page.getByLabel("Import type").selectOption("budget");
  await page.getByLabel("File", { exact: true }).setInputFiles({
    name: "budget.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "period,monthly_budget,cost_center\n2028-02,290,Inpatient\n",
    ),
  });
  await page.getByRole("button", { name: "Preview import" }).click();
  await expect(
    page.getByRole("heading", { name: "1 mapped rows" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm import" }).click();
  await expect(page.getByRole("status")).toContainText("Import accepted");
  await page.getByRole("button", { name: "Budgets", exact: true }).click();
  await page.getByRole("button", { name: "Approve budget" }).click();
  await expect(
    page.getByRole("button", { name: "Approve budget" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  await page.getByLabel("Import type").selectOption("actuals");
  const csv =
    "activity_date,patient_days\n" +
    [9, 10, 11, 10, 12, 8, 10]
      .map((n, i) => `2028-02-0${i + 1},${n}`)
      .join("\n");
  await page.getByLabel("File", { exact: true }).setInputFiles({
    name: "actuals.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv),
  });
  await page.getByRole("button", { name: "Preview import" }).click();
  await expect(
    page.getByRole("heading", { name: "7 mapped rows" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm import" }).click();
  await expect(page.getByRole("status")).toContainText("Import accepted");
  await page.getByRole("button", { name: "Comparison", exact: true }).click();
  await expect(page.locator(".ro-metrics strong")).toHaveText([
    "70",
    "290",
    "70",
  ]);
  await page
    .getByRole("button", { name: "Daily actuals", exact: true })
    .click();
  await page.getByLabel("Activity date", { exact: true }).fill("2028-02-06");
  await page.getByLabel("Patient days", { exact: true }).fill("9");
  await page
    .getByLabel("Correction reason", { exact: false })
    .fill("Reconciled signed census");
  await page.getByRole("button", { name: "Save actual" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Saved with source history",
  );
  await page.getByRole("button", { name: "Comparison", exact: true }).click();
  await expect(page.locator(".ro-metrics strong")).toHaveText([
    "71",
    "290",
    "70",
  ]);
  await page.getByLabel("Reason to close period").fill("Month reconciled");
  await page.getByRole("button", { name: "Close period", exact: true }).click();
  await expect(page.getByText("Closed period", { exact: true })).toBeVisible();
  await page
    .getByLabel("Reason to reopen period")
    .fill("Late census correction");
  await page
    .getByRole("button", { name: "Reopen period", exact: true })
    .click();
  await expect(page.getByText("Open period", { exact: true })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("comparison.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.reload();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page
    .getByLabel("Hospital / unit")
    .selectOption({ label: `${name} / Adult` });
  await expect(page.locator(".ro-metrics strong")).toHaveText([
    "71",
    "290",
    "70",
  ]);
});

test("resumable onboarding and custom fields preserve corrections, mappings and historical labels", async ({
  page,
}, testInfo) => {
  const name = `Synthetic fields ${testInfo.project.name} ${Date.now()}`;
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const login = async (staff = false, select = true) => {
    await page.goto("/rev-ops");
    await page
      .getByLabel("Development assertion")
      .fill(
        staff ? "syn-assert-revops-census-dev" : "syn-assert-revops-admin-dev",
      );
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    if (select)
      await page
        .getByLabel("Hospital / unit")
        .selectOption({ label: `${name} / Geriatric` });
  };
  const tab = async (name: string) =>
    page.getByRole("button", { name, exact: true }).click();
  const saved = async () =>
    expect(page.getByRole("status")).toContainText("Saved with source history");
  const addField = async (label: string, scope: string, choices?: string) => {
    await page.getByLabel("New field label", { exact: true }).fill(label);
    await page.getByLabel("Field placement").selectOption(scope);
    await page
      .getByLabel("Field type", { exact: true })
      .selectOption(choices ? "select" : "text");
    if (choices)
      await page
        .getByLabel("New choices, comma separated", { exact: true })
        .fill(choices);
    await page
      .getByRole("checkbox", { name: "Required for entry", exact: true })
      .first()
      .check();
    await tab("Add field");
    await saved();
  };
  await login(false, false);
  await tab("Setup & access");
  await page.getByLabel("Hospital name", { exact: true }).fill(name);
  await page.getByLabel("Unit name", { exact: true }).fill("Geriatric");
  await tab("Create workspace");
  await expect(page.getByRole("status")).toContainText(
    "Hospital workspace created",
  );
  await addField("Reporting code", "setup");
  await tab("Save setup progress");
  await saved();
  await page.reload();
  await login();
  await tab("Setup & access");
  await expect(
    page.getByText("Reporting code: Not recorded", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Reporting code (required)", { exact: true })
    .fill("SP-GERI");
  await tab("Save setup progress");
  await saved();
  await addField("Planning basis", "budget", "Approved plan");
  await addField("Census review", "actual", "Pending,Reconciled");
  await page
    .getByLabel("Staff member")
    .selectOption({ label: "Synthetic Census Operator" });
  for (const permission of [
    "Enter / import budgets",
    "Approve budgets",
    "Enter / import actuals",
    "Correct actuals",
  ]) {
    await page.getByRole("checkbox", { name: permission, exact: true }).check();
  }
  await tab("Save delegation");
  await saved();
  await page.screenshot({
    path: testInfo.outputPath("field-setup.png"),
    fullPage: true,
  });
  await tab("Sign out");
  await login(true);
  await expect(
    page.getByRole("button", { name: "Setup & access", exact: true }),
  ).toHaveCount(0);
  const uploadFile = async (kind: string, content: string, mapped = false) => {
    await tab("Upload");
    await page.getByLabel("Import type").selectOption(kind);
    await page
      .getByLabel("File", { exact: true })
      .setInputFiles({
        name: `${kind}-fields.csv`,
        mimeType: "text/csv",
        buffer: Buffer.from(content),
      });
    if (mapped)
      await page
        .getByLabel("Census review column (required)", { exact: true })
        .fill("review_status");
    await tab("Preview import");
    await expect(page.getByRole("status")).toContainText("Preview loaded");
    await expect(
      page.getByRole("button", { name: "Confirm import" }),
    ).toBeEnabled();
    await tab("Confirm import");
    await expect(page.getByRole("status")).toContainText("Import accepted");
  };
  await uploadFile(
    "budget",
    "period,monthly_budget,cost_center,Field: Planning basis\n2028-02,290,Inpatient,Approved plan\n",
  );
  await tab("Budgets");
  await tab("Approve budget");
  await saved();
  const csv =
    "activity_date,patient_days,review_status\n" +
    [9, 10, 11, 10, 12, 8, 10]
      .map((n, i) => `2028-02-0${i + 1},${n},Reconciled`)
      .join("\n");
  await uploadFile("actuals", csv, true);
  await tab("Daily actuals");
  await page.getByLabel("Activity date", { exact: true }).fill("2028-02-06");
  await expect(
    page.getByLabel("Census review (required)", { exact: true }),
  ).toHaveValue(/.+/);
  await page.getByLabel("Patient days", { exact: true }).fill("9");
  await page
    .getByLabel("Correction reason", { exact: false })
    .fill("Corrected signed census");
  await tab("Save actual");
  await saved();
  await page
    .getByLabel("Census review (required)", { exact: true })
    .selectOption({ label: "Pending" });
  await page
    .getByLabel("Correction reason", { exact: false })
    .fill("Metadata only follow-up");
  await tab("Save actual");
  await saved();
  await uploadFile("actuals", csv, true);
  await tab("Daily actuals");
  await page.getByLabel("Activity date", { exact: true }).fill("2028-02-08");
  await page.getByLabel("Patient days", { exact: true }).fill("4");
  await page
    .getByLabel("Census review (required)", { exact: true })
    .selectOption({ label: "Reconciled" });
  await tab("Save actual");
  await saved();
  await tab("Comparison");
  await expect(page.locator(".ro-metrics strong")).toHaveText([
    "71",
    "290",
    "70",
  ]);
  await expect(
    page.getByText("Synthetic workflow configured", { exact: true }),
  ).toBeVisible();
  await tab("Sign out");
  await login();
  await tab("Setup & access");
  const definition = page
    .locator(".ro-field-definition")
    .filter({
      has: page.locator("summary", { hasText: "Census review · actual" }),
    });
  await definition.locator("summary").click();
  await definition
    .getByLabel("Definition label", { exact: true })
    .fill("Verification status");
  await definition
    .getByRole("checkbox", { name: "Retire choice", exact: true })
    .first()
    .check();
  await definition
    .getByRole("button", { name: "Save additional field" })
    .click();
  await saved();
  const renamed = page
    .locator(".ro-field-definition")
    .filter({
      has: page.locator("summary", { hasText: "Verification status · actual" }),
    });
  await renamed.locator("summary").click();
  await renamed.getByLabel("Archive additional field", { exact: true }).check();
  await renamed.getByRole("button", { name: "Save additional field" }).click();
  await saved();
  await tab("Daily actuals");
  await page.getByLabel("Activity date", { exact: true }).fill("2028-02-06");
  await expect(
    page.getByText("Census review: Pending (archived, retained)", {
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("field-history.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.reload();
  await login();
  await expect(page.locator(".ro-metrics strong")).toHaveText([
    "71",
    "290",
    "70",
  ]);
  const auth = await (
    await page.request.post("/api/auth/login", {
      data: { assertion: "syn-assert-revops-admin-dev" },
    })
  ).json();
  const headers = { authorization: `Bearer ${auth.token}` };
  const workspaces = await (
    await page.request.get("/api/rev-ops/workspaces", { headers })
  ).json();
  const persisted = workspaces.find((w: { name: string }) => w.name === name);
  expect(persisted.state.setupValues[0].value).toBe("SP-GERI");
  expect(persisted.state.budgets[0].fields[0].optionLabel).toBe(
    "Approved plan",
  );
  expect(
    persisted.state.actuals["2028-02-06"].map(
      (r: { count: number }) => r.count,
    ),
  ).toEqual([8, 9, 9]);
  expect(
    persisted.state.actuals["2028-02-06"].at(-1).fields[0].optionLabel,
  ).toBe("Pending");
  expect(
    persisted.state.actuals["2028-02-01"][0].source.fieldMapping[0].column,
  ).toBe("review_status");
  expect(errors).toEqual([]);
  await testInfo.attach("persisted-synthetic-workspace", {
    body: JSON.stringify(persisted),
    contentType: "application/json",
  });
});
