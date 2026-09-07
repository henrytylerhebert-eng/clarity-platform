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
  await page
    .getByLabel("File", { exact: true })
    .setInputFiles({
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
  await page
    .getByLabel("File", { exact: true })
    .setInputFiles({
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
