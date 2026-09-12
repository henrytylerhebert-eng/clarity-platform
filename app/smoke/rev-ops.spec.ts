import ExcelJS from "exceljs";
import { expect, test } from "@playwright/test";

test("month close requires every leap-year date and preserves original and revised receipts", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const login = await page.request.post("/api/auth/login", {
    data: { assertion: "syn-assert-revops-admin-dev" },
  });
  const { token } = await login.json();
  const headers = { authorization: `Bearer ${token}` };
  const name = `Synthetic month close ${testInfo.project.name} ${Date.now()}`;
  const response = await page.request.post("/api/rev-ops/workspaces", {
    headers,
    data: {
      name,
      unit: "Geriatric",
      timezone: "America/Chicago",
      costCenterLabel: "Cost center",
      costCenterOptions: ["Inpatient"],
    },
  });
  expect(response.ok()).toBe(true);
  const w = await response.json();
  const path = `/api/rev-ops/workspaces/${w.id}`;
  const get = async () => (await page.request.get(path, { headers })).json();
  const cmd = async (command: unknown) => {
    const result = await page.request.post(path + "/commands", {
      headers,
      data: { revision: (await get()).revision, command },
    });
    expect(result.ok()).toBe(true);
    return result.json();
  };
  await cmd({
    action: "budget",
    period: "2028-02",
    total: 290,
    costCenter: "Inpatient",
  });
  const budgetId = (await get()).state.budgets[0].id;
  await cmd({ action: "approve", budgetId });
  const members = await (
    await page.request.get("/api/rev-ops/members", { headers })
  ).json();
  const staff = members.find(
    (m: { displayName: string }) =>
      m.displayName === "Synthetic Census Operator",
  );
  await cmd({
    action: "grant",
    userId: staff.id,
    permissions: [
      "actualEnter",
      "actualCorrect",
      "periodClose",
      "periodReopen",
      "receiptExport",
    ],
  });
  await page.goto("/rev-ops");
  await page
    .getByLabel("Development assertion")
    .fill("syn-assert-revops-census-dev");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page
    .getByLabel("Hospital / unit")
    .selectOption({ label: `${name} / Geriatric` });
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  await page
    .getByLabel("File", { exact: true })
    .setInputFiles({
      name: "february-28-dates.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        "activity_date,patient_days\n" +
          Array.from(
            { length: 28 },
            (_, i) => `2028-02-${String(i + 1).padStart(2, "0")},10`,
          ).join("\n"),
      ),
    });
  await page.getByRole("button", { name: "Preview import" }).click();
  await expect(
    page.getByRole("heading", { name: "28 mapped rows" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm import" }).click();
  await expect(page.getByRole("status")).toContainText("Import accepted");
  await page.getByRole("button", { name: "Comparison", exact: true }).click();
  await expect(page.getByText(/28 of 29 calendar dates/)).toBeVisible();
  await expect(page.locator(".ro-metrics strong")).toHaveText([
    "70",
    "290",
    "70",
  ]);
  await page
    .getByLabel("Reason to close period")
    .fill("Review missing leap day");
  await expect(
    page.getByRole("button", { name: "Close period", exact: true }),
  ).toBeDisabled();
  await page.screenshot({
    path: testInfo.outputPath("month-close-missing.png"),
    fullPage: true,
  });
  const enter = async (count: string, reason?: string) => {
    await page
      .getByRole("button", { name: "Daily actuals", exact: true })
      .click();
    await page.getByLabel("Activity date", { exact: true }).fill("2028-02-29");
    await page.getByLabel("Patient days", { exact: true }).fill(count);
    if (reason)
      await page.getByLabel("Correction reason", { exact: false }).fill(reason);
    await page
      .getByRole("button", { name: "Save actual", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Saved with source history",
    );
    await page.getByRole("button", { name: "Comparison", exact: true }).click();
  };
  await enter("0");
  await expect(page.getByText(/29 of 29 calendar dates/)).toBeVisible();
  await page.getByLabel("Approved baseline").selectOption(budgetId);
  await page
    .getByLabel("Reason to close period")
    .fill("Signed leap-month census");
  await page.getByRole("button", { name: "Close period", exact: true }).click();
  await expect(page.getByText("Closed period", { exact: true })).toBeVisible();
  const receipt1 = (
    await (await page.request.get(path + "/history", { headers })).json()
  )[0].details.closing;
  expect(receipt1).toMatchObject({
    actuals: 280,
    variance: -10,
    closingNumber: 1,
    expectedDays: 29,
  });
  await expect(
    page.getByRole("heading", { name: "Closing receipt #1", exact: true }),
  ).toBeVisible();
  const downloadReceipt = async (revision: number, actual: number, status: string) => {
    const region=page.getByRole("region",{name:`Excel export for receipt revision ${revision}`,exact:true});
    await region.getByRole("button",{name:"Review Excel export",exact:true}).click();
    await expect(region.getByText(status,{exact:true})).toBeVisible();
    await expect(region.getByRole("cell",{name:"Daily Midnight Census Count",exact:true})).toBeVisible();
    const pending=page.waitForEvent("download");
    await region.getByRole("button",{name:"Download selected receipt (.xlsx)",exact:true}).click();
    const download=await pending;
    const output=testInfo.outputPath(`receipt-${revision}-${actual}.xlsx`);
    await download.saveAs(output);
    const book=new ExcelJS.Workbook();await book.xlsx.readFile(output);
    expect(book.getWorksheet("Summary")!.getCell("B3").value).toBe(actual);
    expect(book.getWorksheet("Summary")!.getCell("B4").value).toBe(290);
    expect(book.getWorksheet("Daily activity")!.getCell("B30").value).toBe(actual===280?0:5);
    expect(book.getWorksheet("Daily activity")!.getCell("A30").value).toEqual(new Date("2028-02-29T00:00:00Z"));
    await expect(region.getByRole("status")).toContainText("handed to the browser");
    await region.screenshot({path:testInfo.outputPath(`export-${revision}.png`)});
    await region.getByRole("button",{name:"Hide Excel review",exact:true}).click();
  };
  await downloadReceipt(receipt1.revision,280,"LATEST CLOSED");
  await page
    .getByText("Closing budget and daily sources", { exact: true })
    .click();
  await expect(
    page.getByText(/2028-02-29 · 0 recorded count · actual revision 1/),
  ).toBeVisible();
  await page
    .getByRole("heading", { name: "Closing receipt #1", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath("month-close-receipt-viewport.png"),
  });
  await page
    .getByLabel("Reason to reopen period")
    .fill("Late signed census arrived");
  await page
    .getByRole("button", { name: "Reopen period", exact: true })
    .click();
  await expect(page.getByText("Open period", { exact: true })).toBeVisible();
  await enter("5", "Late signed leap-day census");
  await expect(page.getByText(/Known full-month actuals: 285/)).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Closing receipt 1", exact: true }),
  ).toContainText("Closed actuals: 280");
  await page
    .getByLabel("Reason to close period")
    .fill("Reviewed corrected month");
  await page.getByRole("button", { name: "Close period", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Closing receipt #2", exact: true }),
  ).toBeVisible();
  const afterClose = await get();
  const history = await (
    await page.request.get(path + "/history", { headers })
  ).json();
  const receipt2 = history[0].details.closing;
  expect(receipt2).toMatchObject({
    actuals: 285,
    variance: -5,
    closingNumber: 2,
    previousClosingRevision: receipt1.revision,
  });
  await downloadReceipt(receipt2.revision,285,"LATEST CLOSED");
  expect(
    history.find((h: { revision: number }) => h.revision === receipt1.revision)
      .details.closing,
  ).toEqual(receipt1);
  expect(
    (
      await cmd({
        action: "close",
        period: "2028-02",
        budgetId,
        reason: "Retry closed month",
      })
    ).closingReceipt,
  ).toEqual(receipt2);
  expect(await get()).toEqual(afterClose);
  // Ordinary February requires 28 dates, not 29, in the same hospital calendar.
  await cmd({
    action: "budget",
    period: "2027-02",
    total: 280,
    costCenter: "Inpatient",
  });
  await cmd({
    action: "approve",
    budgetId: (await get()).state.budgets.at(-1).id,
  });
  const ordinary = await page.request.post(path + "/import", {
    headers,
    data: {
      revision: (await get()).revision,
      commit: true,
      upload: {
        kind: "actuals",
        name: "ordinary-february.csv",
        mapping: {},
        content: Buffer.from(
          "activity_date,patient_days\n" +
            Array.from(
              { length: 28 },
              (_, i) => `2027-02-${String(i + 1).padStart(2, "0")},10`,
            ).join("\n"),
        ).toString("base64"),
      },
    },
  });
  expect(ordinary.ok()).toBe(true);
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await page.getByLabel("Month", { exact: true }).fill("2027-02");
  await expect(page.getByText(/28 of 28 calendar dates/)).toBeVisible();
  await page
    .getByLabel("Reason to close period")
    .fill("Ordinary February reviewed");
  await page.getByRole("button", { name: "Close period", exact: true }).click();
  await expect(page.getByText("Closed period", { exact: true })).toBeVisible();
  await page.reload();
  await page
    .getByLabel("Development assertion")
    .fill("syn-assert-revops-census-dev");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page
    .getByLabel("Hospital / unit")
    .selectOption({ label: `${name} / Geriatric` });
  await expect(
    page.getByRole("heading", { name: "Closing receipt #2", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "History", exact: true }).click();
  await page
    .getByText(new RegExp(`Revision ${receipt1.revision} · close`))
    .click();
  await expect(
    page.getByRole("region", { name: "Closing receipt 1", exact: true }),
  ).toContainText("Closed actuals: 280");
  await downloadReceipt(receipt1.revision,280,"SUPERSEDED");
  await page.screenshot({
    path: testInfo.outputPath("month-close-history.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
  expect(errors).toEqual([]);
});

test("census reconciliation reviews conflicts, rejects stale decisions and preserves receipts after replay", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const login = await page.request.post("/api/auth/login", {
    data: { assertion: "syn-assert-revops-admin-dev" },
  });
  const { token } = await login.json();
  const headers = { authorization: `Bearer ${token}` };
  const name = `Synthetic reconciliation ${testInfo.project.name} ${Date.now()}`;
  const created = await page.request.post("/api/rev-ops/workspaces", {
    headers,
    data: {
      name,
      unit: "Geriatric",
      timezone: "America/Chicago",
      costCenterLabel: "Cost center",
      costCenterOptions: ["Inpatient"],
    },
  });
  expect(created.ok()).toBe(true);
  const w = await created.json();
  const path = `/api/rev-ops/workspaces/${w.id}`;
  const get = async () => (await page.request.get(path, { headers })).json();
  const command = async (command: unknown) => {
    const response = await page.request.post(path + "/commands", {
      headers,
      data: { revision: (await get()).revision, command },
    });
    expect(response.ok()).toBe(true);
  };
  await command({
    action: "defineField",
    scope: "actual",
    type: "select",
    label: "Census review",
    required: true,
    archived: false,
    options: [
      { label: "Reconciled", archived: false },
      { label: "Pending", archived: false },
    ],
  });
  await command({
    action: "budget",
    period: "2028-02",
    total: 290,
    costCenter: "Inpatient",
  });
  await command({
    action: "approve",
    budgetId: (await get()).state.budgets[0].id,
  });
  const members = await (
    await page.request.get("/api/rev-ops/members", { headers })
  ).json();
  const staff = members.find(
    (m: { displayName: string }) =>
      m.displayName === "Synthetic Census Operator",
  );
  await command({
    action: "grant",
    userId: staff.id,
    permissions: ["actualEnter", "actualCorrect"],
  });
  const csv = (counts: number[], pending = false) =>
    "activity_date,patient_days,Field: Census review\n" +
    counts
      .map(
        (n, i) =>
          `2028-02-0${i + 1},${n},${pending && i === 4 ? "Pending" : "Reconciled"}`,
      )
      .join("\n");
  const initial = await page.request.post(path + "/import", {
    headers,
    data: {
      revision: (await get()).revision,
      commit: true,
      upload: {
        kind: "actuals",
        name: "baseline.csv",
        mapping: {},
        content: Buffer.from(csv([9, 10, 11, 10, 12, 8, 10])).toString(
          "base64",
        ),
      },
    },
  });
  expect(initial.ok()).toBe(true);
  const before = await get();
  await page.goto("/rev-ops");
  await page
    .getByLabel("Development assertion")
    .fill("syn-assert-revops-census-dev");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page
    .getByLabel("Hospital / unit")
    .selectOption({ label: `${name} / Geriatric` });
  const chooseFile = async () => {
    await page.getByRole("button", { name: "Upload", exact: true }).click();
    await page.getByLabel("File", { exact: true }).setInputFiles({
      name: "revised-census.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv([9, 10, 11, 10, 12, 9, 12, 4], true)),
    });
    await page.getByRole("button", { name: "Preview import" }).click();
    await expect(
      page.getByRole("heading", { name: "8 mapped rows" }),
    ).toBeVisible();
  };
  const decisions = async () => {
    for (const [date, choice, reason] of [
      ["2028-02-05", "use", "Review reopened after source reconciliation"],
      ["2028-02-06", "use", "Signed census corrected"],
      ["2028-02-07", "keep", "Duplicate beds in source report"],
    ]) {
      await page.getByLabel(`Decision for ${date}`).selectOption(choice!);
      await page.getByLabel(`Reason for ${date}`).fill(reason!);
    }
  };
  await chooseFile();
  await expect(
    page.getByRole("button", { name: "Confirm import" }),
  ).toBeDisabled();
  await decisions();
  await expect(page.getByText("Expected patient-day change: +5")).toBeVisible();
  await page.getByRole("button", { name: "Discard preview" }).click();
  expect(await get()).toEqual(before);
  await page.getByRole("button", { name: "Preview import" }).click();
  await expect(page.getByLabel("Decision for 2028-02-05")).toHaveValue("");
  await decisions();
  // A changed grant invalidates the review without closing this incomplete month.
  await command({
    action: "grant",
    userId: staff.id,
    permissions: ["actualEnter"],
  });
  await command({
    action: "grant",
    userId: staff.id,
    permissions: ["actualEnter", "actualCorrect"],
  });
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.getByText(/Data changed. Preview again/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirm import" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Preview import" }).click();
  await expect(page.getByLabel("Decision for 2028-02-05")).toHaveValue("");
  await decisions();
  await page.screenshot({
    path: testInfo.outputPath("reconciliation-review.png"),
    fullPage: true,
  });
  await page.getByLabel("Decision for 2028-02-05").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath("reconciliation-review-viewport.png"),
  });
  await page.getByRole("button", { name: "Confirm import" }).click();
  await expect(page.getByRole("status")).toContainText("Import accepted");
  await expect(
    page.getByText("1 inserted · 2 corrected · 4 unchanged · 1 kept"),
  ).toBeVisible();
  const accepted = await get();
  expect(
    accepted.state.actuals["2028-02-05"].map((r: { count: number }) => r.count),
  ).toEqual([12, 12]);
  expect(
    accepted.state.actuals["2028-02-06"].map((r: { count: number }) => r.count),
  ).toEqual([8, 9]);
  expect(accepted.state.actuals["2028-02-07"]).toEqual(
    before.state.actuals["2028-02-07"],
  );
  expect(accepted.state.budgets).toEqual(before.state.budgets);
  await page.getByRole("button", { name: "Comparison", exact: true }).click();
  await expect(page.locator(".ro-metrics strong")).toHaveText([
    "71",
    "290",
    "70",
  ]);
  await page
    .getByRole("button", { name: "Daily actuals", exact: true })
    .click();
  await page.getByLabel("Activity date", { exact: true }).fill("2028-02-06");
  await page.getByLabel("Patient days", { exact: true }).fill("10");
  await page
    .getByLabel("Correction reason", { exact: false })
    .fill("Later signed census correction");
  await page.getByRole("button", { name: "Save actual" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Saved with source history",
  );
  const corrected = await get();
  await chooseFile();
  await expect(page.getByText(/Already imported. Confirmation/)).toBeVisible();
  await page.getByRole("button", { name: "Confirm import" }).click();
  await expect(page.getByRole("status")).toContainText("Import accepted");
  expect(await get()).toEqual(corrected);
  await page.reload();
  await page
    .getByLabel("Development assertion")
    .fill("syn-assert-revops-census-dev");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page
    .getByLabel("Hospital / unit")
    .selectOption({ label: `${name} / Geriatric` });
  await page.getByRole("button", { name: "History", exact: true }).click();
  const item = page
    .locator("details")
    .filter({
      has: page.getByRole("heading", {
        name: "Reconciliation receipt",
        includeHidden: true,
      }),
    })
    .first();
  await item.locator("summary").first().click();
  await expect(
    page.getByText("1 inserted · 2 corrected · 4 unchanged · 1 kept"),
  ).toBeVisible();
  await page.getByText("Row decisions and sources", { exact: true }).click();
  await expect(
    page.getByText(/Duplicate beds in source report · actual revision 1/),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
  await page.screenshot({
    path: testInfo.outputPath("reconciliation-receipt.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

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
  // Explicitly supply the rest of the calendar before exercising the period lock.
  await page.getByRole("button", { name: "Upload", exact: true }).click();
  await page.getByLabel("File", { exact: true }).setInputFiles({
    name: "remaining-calendar.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "activity_date,patient_days\n" +
        Array.from(
          { length: 22 },
          (_, i) => `2028-02-${String(i + 8).padStart(2, "0")},0`,
        ).join("\n"),
    ),
  });
  await page.getByRole("button", { name: "Preview import" }).click();
  await expect(
    page.getByRole("heading", { name: "22 mapped rows" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm import" }).click();
  await expect(page.getByRole("status")).toContainText("Import accepted");
  await page.getByRole("button", { name: "Comparison", exact: true }).click();
  await expect(page.getByText(/29 of 29 calendar dates/)).toBeVisible();
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
