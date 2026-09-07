import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { once } from "node:events";
import type { Server } from "node:http";
import {
  AuthenticationService,
  LocalDevIdentityProvider,
} from "@clarity/auth-service";
import {
  createPrismaClient,
  PrismaAuthGateway,
  PrismaCaseCommandGateway,
} from "@clarity/case-repository";
import { CaseCommandService } from "@clarity/case-service";
import { createApiServer } from "@clarity/api-service";
import {
  InMemoryPrescreenGateway,
  PrescreenCommandService,
  PRESCREEN_PRODUCTION_POLICY,
} from "@clarity/prescreen-service";
import { PrismaRevOpsGateway } from "../../packages/case-repository/src/revOpsGateway.js";
import { parseRevOpsUpload } from "../../packages/api-service/src/revOpsImport.js";
import { planReconciliation } from "../../packages/rev-ops-service/src/reconciliation.js";
import type {
  RevOpsView,
  RevOpsCommand,
} from "../../packages/domain-contracts/src/revOps.js";
import { createHarness, type Harness } from "./helpers/harness.js";
import ExcelJS from "exceljs";
import JSZip from "jszip";

let h: Harness;
let server: Server;
let base: string;
let tokenA: string;
let tokenB: string;
let tokenStaff: string;
let auth: AuthenticationService;
const setup = {
  name: "Harbor Demo Hospital",
  unit: "Adult",
  timezone: "America/Chicago",
  costCenterLabel: "Cost center",
  costCenterOptions: ["Inpatient"],
};
// The HTTP assertions below check heterogeneous success/error envelopes.
async function request(
  token: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: any }> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const r = await fetch(base + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: r.status, body: await r.json() };
}
async function workspace(name: string) {
  return (await request(tokenA, "/workspaces", { ...setup, name }))
    .body as RevOpsView;
}
async function current(w: RevOpsView) {
  return (await request(tokenA, `/workspaces/${w.id}`)).body as RevOpsView;
}
async function command(w: RevOpsView, cmd: RevOpsCommand, token = tokenA) {
  const c = await current(w);
  return request(token, `/workspaces/${w.id}/commands`, {
    revision: c.revision,
    command: cmd,
  });
}
const upload = (kind: "budget" | "actuals", csv: string) => ({
  kind,
  name: `${kind}.csv`,
  content: Buffer.from(csv).toString("base64"),
  mapping: {},
});
async function importFile(
  w: RevOpsView,
  u: ReturnType<typeof upload> & {
    sheet?: string;
    fieldMapping?: { fieldId: string; column: string }[];
  },
  commit = true,
) {
  const c = await current(w);
  return request(tokenA, `/workspaces/${w.id}/import`, {
    revision: c.revision,
    commit,
    upload: u,
  });
}
beforeAll(async () => {
  h = await createHarness();
  await h.prisma.user.update({
    where: { id: h.tenantA.userId },
    data: { roles: ["ORGANIZATION_ADMIN"] },
  });
  await h.prisma.user.update({
    where: { id: h.tenantB.userId },
    data: { roles: ["ORGANIZATION_ADMIN"] },
  });
  await h.prisma.user.create({
    data: {
      id: `staff-${h.runId}`,
      organizationId: h.tenantA.organizationId,
      email: `staff-${h.runId}@example.test`,
      displayName: "Synthetic Census",
      roles: ["READ_ONLY_AUDITOR"],
    },
  });
  const provider = new LocalDevIdentityProvider();
  for (const [assertion, id] of [
    ["synthetic-revops-test-a", h.tenantA.userId],
    ["synthetic-revops-test-b", h.tenantB.userId],
    ["synthetic-revops-staff", `staff-${h.runId}`],
  ]) {
    const u = await h.prisma.user.findUniqueOrThrow({ where: { id } });
    provider.register(assertion!, u.email);
  }
  auth = new AuthenticationService(provider, new PrismaAuthGateway(h.prisma));
  tokenA = (await auth.login("synthetic-revops-test-a")).token;
  tokenB = (await auth.login("synthetic-revops-test-b")).token;
  tokenStaff = (await auth.login("synthetic-revops-staff")).token;
  server = createApiServer({
    auth,
    caseCommands: new CaseCommandService(
      new PrismaCaseCommandGateway(h.prisma),
    ),
    prescreen: new PrescreenCommandService(
      new InMemoryPrescreenGateway(),
      PRESCREEN_PRODUCTION_POLICY,
    ),
    revOps: new PrismaRevOpsGateway(h.prisma),
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/rev-ops`;
});
afterAll(async () => {
  if (server)
    await new Promise<void>((resolve, reject) =>
      server.close((e) => (e ? reject(e) : resolve())),
    );
  if (h) await h.dispose();
});

describe("persisted patient-day workflow through authenticated Fastify routes", () => {
  it("atomically reconciles the eight-day example and preserves its receipt across corrections and replay", async () => {
    const w = await workspace("Synthetic reconciliation receipt");
    const path = `/workspaces/${w.id}`;
    await command(w, {
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
    const field = (await current(w)).state.customFields![0]!;
    await command(w, {
      action: "budget",
      period: "2028-02",
      total: 290,
      costCenter: "Inpatient",
    });
    await command(w, {
      action: "approve",
      budgetId: (await current(w)).state.budgets[0]!.id,
    });
    const csv = (counts: number[], pending = false) =>
      "activity_date,patient_days,Field: Census review\n" +
      counts
        .map(
          (n, i) =>
            `2028-02-0${i + 1},${n},${pending && i === 4 ? "Pending" : "Reconciled"}`,
        )
        .join("\n");
    const baseline = upload("actuals", csv([9, 10, 11, 10, 12, 8, 10]));
    expect((await importFile(w, baseline)).status).toBe(200);
    const candidate = upload(
      "actuals",
      csv([9, 10, 11, 10, 12, 9, 12, 4], true),
    );
    await command(w, {
      action: "grant",
      userId: `staff-${h.runId}`,
      permissions: ["actualEnter"],
    });
    const previewBody = {
      revision: (await current(w)).revision,
      commit: false,
      upload: candidate,
      reconciliation: { period: "2028-02" },
    };
    const preview = await request(tokenStaff, path + "/import", previewBody);
    expect(preview.status).toBe(200);
    expect(
      preview.body.reconciliation.rows.map((r: { status: string }) => r.status),
    ).toEqual([
      "unchanged",
      "unchanged",
      "unchanged",
      "unchanged",
      "conflict",
      "conflict",
      "conflict",
      "new",
    ]);
    const decisions = [
      {
        row: 6,
        date: "2028-02-05",
        choice: "use",
        reason: "Review reopened after source reconciliation",
      },
      {
        row: 7,
        date: "2028-02-06",
        choice: "use",
        reason: "Signed census corrected",
      },
      {
        row: 8,
        date: "2028-02-07",
        choice: "keep",
        reason: "Duplicate beds in source report",
      },
    ];
    const commit = {
      ...previewBody,
      commit: true,
      reconciliation: {
        period: "2028-02",
        importKey: preview.body.importKey,
        decisions,
      },
    };
    const before = await current(w);
    const history = (await request(tokenA, path + "/history")).body;
    expect((await request(tokenB, path + "/import", previewBody)).status).toBe(
      404,
    );
    expect((await request(tokenStaff, path + "/import", commit)).status).toBe(
      403,
    );
    // Omitting reconciliation cannot turn a conflicting import into an entry.
    expect(
      (
        await request(tokenStaff, path + "/import", {
          ...previewBody,
          commit: true,
          reconciliation: undefined,
        })
      ).status,
    ).toBe(400);
    // Server-derived authority, classifications and commands are not request fields.
    for (const forged of [
      { actorId: h.tenantA.userId },
      { organizationId: h.tenantA.organizationId },
      { commands: [] },
      {
        reconciliation: {
          ...commit.reconciliation,
          rows: [],
          counts: { kept: 0 },
        },
      },
    ]) {
      expect(
        (await request(tokenStaff, path + "/import", { ...commit, ...forged }))
          .status,
      ).toBe(400);
    }
    for (const override of [
      { decisions: [] },
      { decisions: [decisions[0], decisions[0], decisions[2]] },
      { decisions: decisions.map((d) => ({ ...d, reason: " " })) },
      { decisions: decisions.map((d) => ({ ...d, row: 99 })) },
      { decisions: decisions.map((d) => ({ ...d, date: "2028-02-01" })) },
      { importKey: "a".repeat(64) },
    ]) {
      expect(
        (
          await request(tokenA, path + "/import", {
            ...commit,
            reconciliation: { ...commit.reconciliation, ...override },
          })
        ).status,
      ).toBeGreaterThanOrEqual(400);
      expect(await current(w)).toEqual(before);
    }
    const invalid = {
      ...candidate,
      content: Buffer.from(
        csv([9, 10, 11, 10, 12, 9, 12, 4], true).replace(
          "2028-02-08,4",
          "2028-02-08,",
        ),
      ).toString("base64"),
    };
    const badPreview = await request(tokenA, path + "/import", {
      ...previewBody,
      upload: invalid,
    });
    expect(badPreview.body.reconciliation.rows.at(-1).status).toBe("invalid");
    expect(
      (
        await request(tokenA, path + "/import", {
          ...commit,
          upload: invalid,
          reconciliation: {
            ...commit.reconciliation,
            importKey: badPreview.body.importKey,
          },
        })
      ).status,
    ).toBe(400);
    expect(await current(w)).toEqual(before);
    expect((await request(tokenA, path + "/history")).body).toEqual(history);
    await command(w, {
      action: "grant",
      userId: `staff-${h.runId}`,
      permissions: ["actualEnter", "actualCorrect"],
    });
    expect((await request(tokenStaff, path + "/import", commit)).status).toBe(
      409,
    );
    const fresh = await request(tokenStaff, path + "/import", {
      ...previewBody,
      revision: (await current(w)).revision,
    });
    const ready = { ...commit, revision: fresh.body.revision };
    const results = await Promise.all([
      request(tokenStaff, path + "/import", ready),
      request(tokenStaff, path + "/import", ready),
    ]);
    expect(
      results.filter((r) => r.status === 200 && !r.body.replayed),
    ).toHaveLength(1);
    expect(results.every((r) => r.status === 200 || r.status === 409)).toBe(
      true,
    );
    const result = results.find((r) => r.status === 200 && !r.body.replayed)!;
    const receipt = result.body.receipt;
    expect(receipt.counts).toEqual({
      inserted: 1,
      corrected: 2,
      unchanged: 4,
      kept: 1,
    });
    expect(receipt.patientDayChange).toBe(5);
    expect(receipt.actorId).toBe(`staff-${h.runId}`);
    expect(
      receipt.rows.map((r: { actualRevision: number }) => r.actualRevision),
    ).toEqual([1, 1, 1, 1, 2, 2, 1, 1]);
    const saved = await current(w);
    expect(saved.state.actuals["2028-02-05"]?.map((r) => r.count)).toEqual([
      12, 12,
    ]);
    expect(saved.state.actuals["2028-02-06"]?.map((r) => r.count)).toEqual([
      8, 9,
    ]);
    expect(saved.state.actuals["2028-02-07"]).toEqual(
      before.state.actuals["2028-02-07"],
    );
    expect(saved.state.actuals["2028-02-06"]?.at(-1)?.source.rows).toEqual([7]);
    expect(saved.state.actuals["2028-02-08"]?.at(-1)?.source.rows).toEqual([9]);
    expect(saved.state.budgets).toEqual(before.state.budgets);
    expect(
      (
        await request(
          tokenA,
          path + "/comparison?period=2028-02&through=2028-02-07",
        )
      ).body,
    ).toMatchObject({
      actuals: 71,
      fullMonthBudget: 290,
      phasedVariance: 1,
      fullMonthVariance: -219,
    });
    expect(
      (
        await request(
          tokenA,
          path + "/comparison?period=2028-02&through=2028-02-08",
        )
      ).body,
    ).toMatchObject({
      actuals: 75,
      phasedVariance: -5,
      fullMonthVariance: -215,
    });
    const journal = (await request(tokenA, path + "/history")).body;
    expect(
      journal.filter(
        (e: { details: { importKey?: string } }) =>
          e.details.importKey === receipt.importKey,
      ),
    ).toHaveLength(1);
    expect(journal[0].details.reconciliation).toEqual(receipt);
    const freshPrisma = createPrismaClient();
    try {
      const gateway = new PrismaRevOpsGateway(freshPrisma);
      const principal = await auth.authenticate(tokenStaff);
      expect(
        await gateway.importReceipt(principal, w.id, receipt.importKey),
      ).toEqual(receipt);
    } finally {
      await freshPrisma.$disconnect();
    }
    await command(w, {
      action: "correct",
      date: "2028-02-06",
      count: 10,
      fields: [{ fieldId: field.id, value: field.options[0]!.id }],
      reason: "Later signed correction",
    });
    const { version: _version, ...definition } = field;
    await command(w, { action: "defineField", ...definition, archived: true });
    await command(w, {
      action: "close",
      period: "2028-02",
      reason: "Month reviewed",
    });
    const later = await current(w);
    const replay = await request(tokenStaff, path + "/import", ready);
    expect(replay.body).toMatchObject({ replayed: true, receipt });
    expect(await current(w)).toEqual(later);
    expect(
      (
        await request(tokenStaff, path + "/import", {
          ...previewBody,
          revision: later.revision,
        })
      ).body.receipt,
    ).toEqual(receipt);
    expect((await importFile(w, baseline)).body.replayed).toBe(true);
    await command(w, {
      action: "grant",
      userId: `staff-${h.runId}`,
      permissions: [],
    });
    expect((await request(tokenStaff, path + "/import", ready)).status).toBe(
      403,
    );
    expect((await request(tokenB, path + "/import", ready)).status).toBe(404);
  });

  it("rolls back reconciliation when receipt creation fails after the workspace update", async () => {
    const w = await workspace("Synthetic receipt rollback");
    const path = `/workspaces/${w.id}`;
    await command(w, { action: "actual", date: "2028-02-06", count: 8 });
    const before = await current(w);
    const history = (await request(tokenA, path + "/history")).body;
    const parsed = await parseRevOpsUpload(
      upload(
        "actuals",
        "activity_date,patient_days\n2028-02-06,9\n2028-02-07,4\n",
      ),
      before.state,
    );
    const plan = planReconciliation(
      before.state,
      parsed.rows,
      {
        period: "2028-02",
        importKey: parsed.importKey,
        decisions: [
          {
            row: 2,
            date: "2028-02-06",
            choice: "use",
            reason: "Signed correction",
          },
        ],
      },
      parsed.importKey,
    );
    let workspaceUpdateCompleted = false;
    let receiptAttempted = false;
    const failing = h.prisma.$extends({
      query: {
        revOpsWorkspace: {
          async updateMany({ args, query }) {
            const result = await query(args);
            if (args.where?.id === w.id)
              workspaceUpdateCompleted = result.count === 1;
            return result;
          },
        },
        revOpsChange: {
          async create({ args, query }) {
            if (
              args.data.workspaceId === w.id &&
              args.data.action === "import"
            ) {
              receiptAttempted = true;
              throw new Error("synthetic receipt write failure");
            }
            return query(args);
          },
        },
      },
    });
    // The extended client retains real PostgreSQL transactions; only journal creation fails.
    const gateway = new PrismaRevOpsGateway(
      failing as unknown as typeof h.prisma,
    );
    const actor = await auth.authenticate(tokenA);
    const args = [
      actor,
      w.id,
      before.revision,
      plan.commands,
      parsed.source,
      parsed.importKey,
      "actuals",
      plan,
    ] as const;
    await expect(gateway.execute(...args)).rejects.toThrow(
      "synthetic receipt write failure",
    );
    expect(workspaceUpdateCompleted).toBe(true);
    expect(receiptAttempted).toBe(true);
    expect(await current(w)).toEqual(before);
    expect((await request(tokenA, path + "/history")).body).toEqual(history);
    const normal = new PrismaRevOpsGateway(h.prisma);
    const retry = await normal.execute(...args);
    expect(retry).toMatchObject({
      replayed: false,
      receipt: { counts: { inserted: 1, corrected: 1, unchanged: 0, kept: 0 } },
    });
    const accepted = await current(w);
    const acceptedHistory = (await request(tokenA, path + "/history")).body;
    expect(accepted.state.actuals["2028-02-06"]?.map((r) => r.count)).toEqual([
      8, 9,
    ]);
    expect(accepted.state.actuals["2028-02-07"]?.map((r) => r.count)).toEqual([
      4,
    ]);
    expect(accepted.state.acceptedImports).toEqual([
      ...before.state.acceptedImports,
      parsed.importKey,
    ]);
    expect(acceptedHistory).toHaveLength(history.length + 1);
    expect(await normal.execute(...args)).toMatchObject({
      replayed: true,
      receipt: JSON.parse(JSON.stringify(retry.receipt)),
    });
    expect(await current(w)).toEqual(accepted);
    expect((await request(tokenA, path + "/history")).body).toEqual(
      acceptedHistory,
    );
  });

  it("audits keep-only batches, enforces permission and rejects changed definitions or closed periods", async () => {
    const w = await workspace("Keep-only reconciliation");
    const path = `/workspaces/${w.id}`;
    await command(w, { action: "actual", date: "2028-02-06", count: 8 });
    await command(w, {
      action: "grant",
      userId: `staff-${h.runId}`,
      permissions: ["actualEnter"],
    });
    const file = upload(
      "actuals",
      "activity_date,patient_days\n2028-02-06,9\n",
    );
    const preview = await request(tokenStaff, path + "/import", {
      revision: (await current(w)).revision,
      commit: false,
      upload: file,
      reconciliation: { period: "2028-02" },
    });
    const payload = {
      revision: preview.body.revision,
      commit: true,
      upload: file,
      reconciliation: {
        period: "2028-02",
        importKey: preview.body.importKey,
        decisions: [
          {
            row: 2,
            date: "2028-02-06",
            choice: "keep",
            reason: "Saved census verified",
          },
        ],
      },
    };
    expect((await request(tokenStaff, path + "/import", payload)).status).toBe(
      403,
    );
    await command(w, {
      action: "defineField",
      scope: "actual",
      type: "text",
      label: "Review",
      required: false,
      archived: false,
      options: [],
    });
    expect((await request(tokenA, path + "/import", payload)).status).toBe(409);
    await command(w, {
      action: "close",
      period: "2028-02",
      reason: "Closed period",
    });
    const closed = await current(w);
    expect(
      (
        await request(tokenA, path + "/import", {
          ...payload,
          revision: closed.revision,
        })
      ).status,
    ).toBe(400);
    expect(await current(w)).toEqual(closed);
    await command(w, {
      action: "reopen",
      period: "2028-02",
      reason: "Authorized reconciliation",
    });
    const open = await current(w);
    const result = await request(tokenA, path + "/import", {
      ...payload,
      revision: open.revision,
    });
    expect(result.status).toBe(200);
    expect(result.body.receipt.counts.kept).toBe(1);
    expect((await current(w)).state.actuals).toEqual(open.state.actuals);
    const wrongMonth = await request(tokenA, path + "/import", {
      revision: (await current(w)).revision,
      commit: false,
      upload: upload("actuals", "activity_date,patient_days\n2028-03-01,4\n"),
      reconciliation: { period: "2028-02" },
    });
    expect(wrongMonth.body.reconciliation.rows[0].status).toBe("invalid");
  });

  it("rejects a changed mapping mode instead of falsely replaying an accepted import", async () => {
    const w = await workspace("Mapping mode accountability");
    expect(
      (
        await command(w, {
          action: "defineField",
          scope: "actual",
          type: "text",
          label: "Review",
          required: false,
          archived: false,
          options: [],
        })
      ).status,
    ).toBe(200);
    const file = upload(
      "actuals",
      "activity_date,patient_days,Field: Review\n2028-02-06,8,Reviewed\n",
    );
    expect((await importFile(w, file)).status).toBe(200);
    const before = await current(w);
    const history = (await request(tokenA, `/workspaces/${w.id}/history`)).body;
    const changed = { ...file, fieldMapping: [] };
    const preview = await importFile(w, changed, false);
    expect(preview.body.replayed).toBe(false);
    expect(preview.body.issues).toEqual([
      {
        row: 2,
        message:
          "Conflicts with existing custom values; use correction with a reason",
      },
    ]);
    const rejected = await importFile(w, changed);
    expect(rejected.status).toBe(400);
    expect(rejected.body.error).toBe("import_has_unresolved_rows");
    expect((await importFile(w, file)).body.replayed).toBe(true);
    expect(await current(w)).toEqual(before);
    expect((await request(tokenA, `/workspaces/${w.id}/history`)).body).toEqual(
      history,
    );
  });
  it("allows a deliberate budget amendment back to a previous total without changing old approvals", async () => {
    const w = await workspace("Budget amendment");
    for (const total of [290, 300, 290]) {
      await command(w, {
        action: "budget",
        period: "2028-02",
        total,
        costCenter: "Inpatient",
      });
      const latest = (await current(w)).state.budgets.at(-1)!;
      await command(w, { action: "approve", budgetId: latest.id });
    }
    const snapshot = await current(w);
    expect(snapshot.state.budgets.map((b) => b.total)).toEqual([290, 300, 290]);
    const compare = `/workspaces/${w.id}/comparison?period=2028-02&through=2028-02-07`;
    expect((await request(tokenA, compare)).body.fullMonthBudget).toBe(290);
    expect((await request(tokenA, compare + "&budgetId=missing")).status).toBe(
      404,
    );
    expect(
      (
        await request(
          tokenA,
          compare + `&budgetId=${snapshot.state.budgets[1]!.id}`,
        )
      ).body.fullMonthBudget,
    ).toBe(300);
  });
  it("rejects inconsistent facility timezones and ambiguous existing hospital identities", async () => {
    const name = "One timezone hospital";
    await workspace(name);
    expect(
      (
        await request(tokenA, "/workspaces", {
          ...setup,
          name,
          unit: "Geri",
          timezone: "America/New_York",
        })
      ).status,
    ).toBe(409);
    expect(
      (await request(tokenA, "/workspaces", { ...setup, name, unit: "Geri" }))
        .status,
    ).toBe(200);
    const row = await h.prisma.facilityProfile.findFirstOrThrow({
      where: { organizationId: h.tenantA.organizationId, name },
    });
    const { id: _id, acceptedAges: _ages, ...copy } = row;
    await h.prisma.facilityProfile.create({ data: copy });
    expect(
      (await request(tokenA, "/workspaces", { ...setup, name, unit: "Third" }))
        .status,
    ).toBe(409);
  });
  it("keeps identical hospital labels and separate budget totals isolated across tenants", async () => {
    const a = await workspace("Same hospital label");
    const b = (
      await request(tokenB, "/workspaces", {
        ...setup,
        name: "Same hospital label",
      })
    ).body as RevOpsView;
    let revision = b.revision;
    const write = async (command: RevOpsCommand) => {
      const r = await request(tokenB, `/workspaces/${b.id}/commands`, {
        revision,
        command,
      });
      expect(r.status).toBe(200);
      revision = r.body.revision;
    };
    await write({
      action: "budget",
      period: "2028-02",
      total: 145,
      costCenter: "Inpatient",
    });
    const snapshot = (await request(tokenB, `/workspaces/${b.id}`))
      .body as RevOpsView;
    await write({ action: "approve", budgetId: snapshot.state.budgets[0]!.id });
    for (let i = 1; i <= 7; i++)
      await write({ action: "actual", date: `2028-02-0${i}`, count: 5 });
    expect(
      (
        await request(
          tokenB,
          `/workspaces/${b.id}/comparison?period=2028-02&through=2028-02-07`,
        )
      ).body,
    ).toMatchObject({
      actuals: 35,
      fullMonthBudget: 145,
      phasedTarget: 35,
      phasedVariance: 0,
    });
    expect((await current(a)).state.budgets).toEqual([]);
    expect((await request(tokenA, `/workspaces/${b.id}`)).status).toBe(404);
  });
  it("imports, approves, reconciles, corrects, replays and survives a fresh database client", async () => {
    const w = await workspace("Full journey");
    expect(w.revision).toBe(1);
    const b = upload(
      "budget",
      "period,monthly_budget,cost_center\n2028-02,290,Inpatient\n",
    );
    expect((await importFile(w, b, false)).body.issues).toEqual([]);
    expect((await current(w)).state.budgets).toHaveLength(0);
    expect((await importFile(w, b)).status).toBe(200);
    const budget = (await current(w)).state.budgets[0]!;
    expect(
      (await command(w, { action: "approve", budgetId: budget.id })).status,
    ).toBe(200);
    const actual = upload(
      "actuals",
      "activity_date,patient_days\n" +
        [9, 10, 11, 10, 12, 8, 10]
          .map((n, i) => `2028-02-0${i + 1},${n}`)
          .join("\n"),
    );
    expect((await importFile(w, actual)).status).toBe(200);
    const comparison = () =>
      request(
        tokenA,
        `/workspaces/${w.id}/comparison?period=2028-02&through=2028-02-07`,
      );
    expect((await comparison()).body).toMatchObject({
      actuals: 70,
      fullMonthBudget: 290,
      phasedTarget: 70,
      fullMonthVariance: -220,
      phasedVariance: 0,
      forecast: null,
      collections: null,
    });
    expect(
      (
        await command(w, {
          action: "correct",
          date: "2028-02-06",
          count: 9,
          reason: "Reconciled signed census",
        })
      ).status,
    ).toBe(200);
    expect((await comparison()).body).toMatchObject({
      actuals: 71,
      fullMonthVariance: -219,
      phasedVariance: 1,
    });
    expect((await importFile(w, actual)).body.replayed).toBe(true);
    const changed = await current(w);
    expect(changed.state.actuals["2028-02-06"]).toHaveLength(2);
    expect(changed.state.budgets[0]!.total).toBe(290);
    expect(changed.state.actuals["2028-02-06"]![0]!.source.rows).toEqual([7]);
    expect(changed.state.actuals["2028-02-06"]![0]!.cutoffInstant).toBe(
      "2028-02-07T06:00:00.000Z",
    );
    const fresh = createPrismaClient();
    try {
      const result = await new PrismaRevOpsGateway(fresh).get(
        await auth.authenticate(tokenA),
        w.id,
      );
      expect(result.state.actuals["2028-02-06"]?.at(-1)?.count).toBe(9);
    } finally {
      await fresh.$disconnect();
    }
    const journal = await request(tokenA, `/workspaces/${w.id}/history`);
    expect(
      journal.body.some(
        (e: { action: string; actorId: string }) =>
          e.action === "correct" && e.actorId === h.tenantA.userId,
      ),
    ).toBe(true);
  });
  it("enforces tenant, facility and delegated permissions, including close/reopen accountability", async () => {
    const w = await workspace("Permissions");
    expect((await request(tokenB, `/workspaces/${w.id}`)).status).toBe(404);
    expect((await request(tokenB, `/workspaces/${w.id}/history`)).status).toBe(
      404,
    );
    expect(
      (
        await command(
          w,
          { action: "actual", date: "2028-02-01", count: 99 },
          tokenB,
        )
      ).status,
    ).toBe(404);
    expect((await request(tokenStaff, `/workspaces/${w.id}`)).status).toBe(403);
    expect((await request("bad-token", "/workspaces")).status).toBe(401);
    expect(
      (
        await command(w, {
          action: "grant",
          userId: `staff-${h.runId}`,
          permissions: ["actualEnter"],
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await command(
          w,
          { action: "actual", date: "2028-02-01", count: 9 },
          tokenStaff,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await command(
          w,
          {
            action: "correct",
            date: "2028-02-01",
            count: 10,
            reason: "Count correction",
          },
          tokenStaff,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await command(w, {
          action: "grant",
          userId: h.tenantB.userId,
          permissions: ["view"],
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await command(w, {
          action: "close",
          period: "2028-02",
          reason: "Month reconciled",
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await command(
          w,
          { action: "actual", date: "2028-02-02", count: 9 },
          tokenStaff,
        )
      ).body.error,
    ).toBe("period_closed");
    expect(
      (
        await command(
          w,
          {
            action: "reopen",
            period: "2028-02",
            reason: "Late census received",
          },
          tokenStaff,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await command(w, {
          action: "reopen",
          period: "2028-02",
          reason: "Late census received",
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(tokenA, `/workspaces/${w.id}/commands`, {
          revision: (await current(w)).revision,
          command: {
            action: "correct",
            date: "2028-02-01",
            count: 10,
            reason: "",
          },
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(tokenA, "/workspaces", {
          ...setup,
          organizationId: h.tenantB.organizationId,
        })
      ).status,
    ).toBe(400);
    await command(w, {
      action: "grant",
      userId: `staff-${h.runId}`,
      permissions: [],
    });
    expect((await request(tokenStaff, `/workspaces/${w.id}`)).status).toBe(403);
  });
  it("rejects conflicting/duplicate/error rows atomically and flags incomplete periods", async () => {
    const w = await workspace("Import errors");
    await command(w, { action: "actual", date: "2028-02-01", count: 9 });
    const bad = upload(
      "actuals",
      "activity_date,patient_days\n2028-02-02,10\n2028-02-01,22\n2028-02-02,12\n2028-02-30,4\n2028-02-03,#REF!\n",
    );
    const preview = await importFile(w, bad, false);
    expect(preview.body.issues).toHaveLength(4);
    expect((await importFile(w, bad)).status).toBe(400);
    expect((await current(w)).state.actuals["2028-02-02"]).toBeUndefined();
    const c = await request(
      tokenA,
      `/workspaces/${w.id}/comparison?period=2028-02&through=2028-02-02`,
    );
    expect(c.body).toMatchObject({
      knownActuals: 9,
      actuals: null,
      missingDates: ["2028-02-02"],
      phasedVariance: null,
    });
  });
  it("preserves budget/field history, checks phasing totals and rejects stale writes", async () => {
    const w = await workspace("Version controls");
    expect(
      (
        await command(w, {
          action: "budget",
          period: "2028-02",
          total: 290,
          costCenter: "Inpatient",
          dailyTargets: [290],
        })
      ).status,
    ).toBe(400);
    await command(w, {
      action: "budget",
      period: "2028-02",
      total: 290,
      costCenter: "Inpatient",
      dailyTargets: [20, ...Array(27).fill(10), 0],
    });
    const b = (await current(w)).state.budgets[0]!;
    await command(w, { action: "approve", budgetId: b.id });
    expect(
      (
        await request(
          tokenA,
          `/workspaces/${w.id}/comparison?period=2028-02&through=2028-02-07`,
        )
      ).body.phasedTarget,
    ).toBe(80);
    await command(w, {
      action: "field",
      label: "Department",
      options: ["New inpatient"],
      archived: false,
    });
    expect((await current(w)).state.budgets[0]!.costCenterLabel).toBe(
      "Cost center",
    );
    await command(w, {
      action: "field",
      label: "Department",
      options: ["New inpatient"],
      archived: true,
    });
    expect(
      (
        await command(w, {
          action: "budget",
          period: "2028-03",
          total: 300,
          costCenter: "New inpatient",
        })
      ).status,
    ).toBe(400);
    const snap = await current(w);
    const payload = {
      revision: snap.revision,
      command: { action: "actual", date: "2028-02-01", count: 10 },
    };
    const results = await Promise.all([
      request(tokenA, `/workspaces/${w.id}/commands`, payload),
      request(tokenA, `/workspaces/${w.id}/commands`, {
        ...payload,
        command: { ...payload.command, count: 11 },
      }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect((await current(w)).state.actuals["2028-02-01"]).toHaveLength(1);
  });
  it("accepts XLSX values and rejects formula cells without executing them", async () => {
    const w = await workspace("Excel import");
    const wb = new ExcelJS.Workbook();
    const s = wb.addWorksheet("Budget");
    s.addRow(["period", "monthly_budget", "cost_center"]);
    s.addRow(["2028-02", 290, "Inpatient"]);
    const content = Buffer.from(await wb.xlsx.writeBuffer()).toString("base64");
    const result = await importFile(w, {
      kind: "budget",
      name: "budget.xlsx",
      content,
      mapping: {},
    });
    expect(result.status).toBe(200);
    expect((await current(w)).state.budgets[0]!.source.sheet).toBe("Budget");
    s.getCell("B2").value = { formula: "1+1", result: 2 };
    const invalid = await importFile(
      w,
      {
        kind: "budget",
        name: "budget.xlsx",
        content: Buffer.from(await wb.xlsx.writeBuffer()).toString("base64"),
        mapping: {},
      },
      false,
    );
    expect(invalid.body.issues).toHaveLength(1);
  });
  it("rejects oversized unused worksheets over HTTP without writing activity or history", async () => {
    const w = await workspace("Unsafe workbook");
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet("Actuals").addRows([
      ["activity_date", "patient_days"],
      ["2028-02-01", 9],
    ]);
    wb.addWorksheet("Notes").getCell("A1").value = "Synthetic";
    const zip = await JSZip.loadAsync(await wb.xlsx.writeBuffer());
    zip.file(
      "xl/worksheets/sheet2.xml",
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:XFD1048576"/></worksheet>',
    );
    const before = await request(tokenA, `/workspaces/${w.id}/history`);
    const result = await importFile(w, {
      kind: "actuals",
      name: "unsafe.xlsx",
      sheet: "Actuals",
      mapping: {},
      content: (
        await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })
      ).toString("base64"),
    });
    expect(result.status).toBe(400);
    expect(result.body.error).toBe("worksheet_missing_or_too_large");
    expect((await current(w)).revision).toBe(w.revision);
    expect((await current(w)).state.actuals).toEqual({});
    expect((await request(tokenA, `/workspaces/${w.id}/history`)).body).toEqual(
      before.body,
    );
  });
  it("persists setup and field history through imports, corrections, stale previews and tenant/role denials", async () => {
    const w = await workspace("Synthetic onboarding proof");
    const define = async (
      scope: "setup" | "budget" | "actual",
      type: "text" | "select",
      label: string,
    ) => {
      const result = await command(w, {
        action: "defineField",
        scope,
        type,
        label,
        required: true,
        archived: false,
        options:
          type === "select"
            ? [
                { label: "Pending", archived: false },
                { label: "Reconciled", archived: false },
              ]
            : [],
      });
      expect(result.status).toBe(200);
      return (await current(w)).state.customFields!.at(-1)!;
    };
    const reporting = await define("setup", "text", "Reporting code");
    const planning = await define("budget", "text", "Planning basis");
    const review = await define("actual", "select", "Census review");
    const path = `/workspaces/${w.id}`;
    const fieldCommand = {
      action: "defineField",
      scope: "setup",
      type: "text",
      label: "Unauthorized",
      required: false,
      archived: false,
      options: [],
    } as const;
    expect(
      (
        await request(tokenStaff, path + "/commands", {
          revision: (await current(w)).revision,
          command: fieldCommand,
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(tokenB, path + "/commands", {
          revision: (await current(w)).revision,
          command: fieldCommand,
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await importFile(
          w,
          upload("actuals", "activity_date,patient_days\n2028-02-01,9\n"),
        )
      ).status,
    ).toBe(400);
    expect((await current(w)).state.actuals).toEqual({});
    expect(
      (await command(w, { action: "setupValues", values: [] })).status,
    ).toBe(200);
    expect(
      (
        await command(w, {
          action: "setupValues",
          values: [{ fieldId: reporting.id, value: "SP-GERI" }],
        })
      ).status,
    ).toBe(200);
    const stable = await current(w);
    expect(
      (
        await command(w, {
          action: "setupValues",
          values: [{ fieldId: reporting.id, value: "SP-GERI" }],
        })
      ).body.replayed,
    ).toBe(true);
    const { version: _planningVersion, ...sameDefinition } = planning;
    expect(
      (await command(w, { action: "defineField", ...sameDefinition })).body
        .replayed,
    ).toBe(true);
    expect((await current(w)).revision).toBe(stable.revision);
    const budgetUpload = {
      ...upload(
        "budget",
        "period,monthly_budget,cost_center,Field: Planning basis\n2028-02,290,Inpatient,Approved plan\n",
      ),
    };
    expect((await importFile(w, budgetUpload)).status).toBe(200);
    const b = (await current(w)).state.budgets[0]!;
    expect(b.fields?.[0]).toMatchObject({
      fieldId: planning.id,
      label: "Planning basis",
      value: "Approved plan",
      version: 1,
    });
    expect(
      (await command(w, { action: "approve", budgetId: b.id })).status,
    ).toBe(200);
    await command(w, {
      action: "grant",
      userId: `staff-${h.runId}`,
      permissions: ["actualEnter", "actualCorrect"],
    });
    const beforeRepeatBudget = await current(w);
    expect(
      (
        await command(w, {
          action: "budget",
          period: "2028-02",
          total: 290,
          costCenter: "Inpatient",
          fields: [{ fieldId: planning.id, value: "Approved plan" }],
        })
      ).body.replayed,
    ).toBe(true);
    expect((await current(w)).revision).toBe(beforeRepeatBudget.revision);
    const actualUpload = {
      ...upload(
        "actuals",
        "activity_date,patient_days,review\n" +
          [9, 10, 11, 10, 12, 8, 10]
            .map((n, i) => `2028-02-0${i + 1},${n},Reconciled`)
            .join("\n"),
      ),
      fieldMapping: [{ fieldId: review.id, column: "review" }],
    };
    const invalidBatch = {
      ...actualUpload,
      content: Buffer.from(
        "activity_date,patient_days,review\n2028-02-01,9,Reconciled\n2028-02-02,10,\n",
      ).toString("base64"),
    };
    const beforeRejected = await current(w);
    const historyBeforeRejected = (await request(tokenA, path + "/history"))
      .body;
    expect((await importFile(w, invalidBatch)).status).toBe(400);
    expect(await current(w)).toEqual(beforeRejected);
    expect((await request(tokenA, path + "/history")).body).toEqual(
      historyBeforeRejected,
    );
    const preview = await importFile(w, actualUpload, false);
    expect(preview.body.issues).toEqual([]);
    expect(
      (
        await request(tokenStaff, path + "/import", {
          revision: preview.body.revision,
          commit: true,
          upload: actualUpload,
        })
      ).status,
    ).toBe(200);
    const corrected = {
      action: "correct" as const,
      date: "2028-02-06",
      count: 9,
      reason: "Signed census reconciled",
      fields: [{ fieldId: review.id, value: review.options[1]!.id }],
    };
    expect((await command(w, corrected, tokenStaff)).status).toBe(200);
    expect(
      (
        await command(
          w,
          {
            ...corrected,
            reason: "Metadata-only follow-up",
            fields: [{ fieldId: review.id, value: review.options[0]!.id }],
          },
          tokenStaff,
        )
      ).status,
    ).toBe(200);
    const snapshot = await current(w);
    expect(snapshot.state.actuals["2028-02-06"]?.map((a) => a.count)).toEqual([
      8, 9, 9,
    ]);
    expect(snapshot.state.budgets[0]).toMatchObject({
      status: "approved",
      total: 290,
    });
    const journal = (await request(tokenA, path + "/history")).body;
    expect(
      journal.find((c: { action: string }) => c.action === "setupValues")
        .details,
    ).toMatchObject({
      previousSetupValues: [],
      setupValues: [{ label: "Reporting code", value: "SP-GERI" }],
    });
    const newUpload = {
      ...actualUpload,
      content: Buffer.from(
        "activity_date,patient_days,review\n2028-02-08,10,Reconciled\n",
      ).toString("base64"),
    };
    const pending = await importFile(w, newUpload, false);
    const { version: _version, ...definition } = review;
    expect(
      (
        await command(w, {
          action: "defineField",
          ...definition,
          label: "Reconciled review",
        })
      ).status,
    ).toBe(200);
    const beforeStale = await current(w);
    expect(
      (
        await request(tokenStaff, path + "/import", {
          revision: pending.body.revision,
          commit: true,
          upload: newUpload,
        })
      ).status,
    ).toBe(409);
    expect((await current(w)).revision).toBe(beforeStale.revision);
    const conflict = await importFile(
      w,
      {
        ...actualUpload,
        content: Buffer.from(
          "activity_date,patient_days,review\n2028-02-06,9,Reconciled\n",
        ).toString("base64"),
      },
      false,
    );
    expect(
      conflict.body.issues.some((i: { message: string }) =>
        i.message.includes("custom values"),
      ),
    ).toBe(true);
    await command(w, {
      action: "defineField",
      ...definition,
      label: "Reconciled review",
      archived: true,
    });
    const replay = await importFile(w, actualUpload);
    expect(replay.body.replayed).toBe(true);
    const report = (
      await request(
        tokenA,
        path + "/comparison?period=2028-02&through=2028-02-07",
      )
    ).body;
    expect(report).toMatchObject({
      actuals: 71,
      fullMonthBudget: 290,
      phasedVariance: 1,
      fullMonthVariance: -219,
    });
    const priorHistory = (await current(w)).state.actuals["2028-02-06"]!;
    expect(priorHistory.at(-1)?.fields?.[0]?.label).toBe("Census review");
    await command(w, {
      action: "close",
      period: "2028-02",
      reason: "Reviewed close",
    });
    expect(
      (await command(w, { ...corrected, count: 10, fields: [] }, tokenStaff))
        .status,
    ).toBe(409);
    await command(w, {
      action: "reopen",
      period: "2028-02",
      reason: "Authorized late correction",
    });
    expect(
      (await command(w, { ...corrected, count: 10, fields: [] }, tokenStaff))
        .status,
    ).toBe(200);
    expect(
      (await current(w)).state.actuals["2028-02-06"]?.at(-1)?.fields,
    ).toEqual(priorHistory.at(-1)?.fields);
    for (const token of [tokenB, tokenStaff]) {
      if (token === tokenStaff)
        await command(w, {
          action: "grant",
          userId: `staff-${h.runId}`,
          permissions: [],
        });
      for (const suffix of [
        "",
        "/history",
        "/comparison?period=2028-02&through=2028-02-07",
      ])
        expect((await request(token, path + suffix)).status).toBe(
          token === tokenB ? 404 : 403,
        );
      expect(
        (
          await request(token, path + "/import", {
            revision: (await current(w)).revision,
            commit: false,
            upload: actualUpload,
          })
        ).status,
      ).toBe(token === tokenB ? 404 : 403);
      expect(
        (
          await request(token, path + "/import", {
            revision: (await current(w)).revision,
            commit: true,
            upload: actualUpload,
          })
        ).status,
      ).toBe(token === tokenB ? 404 : 403);
    }
    // Fresh Prisma connection proves the additive JSON state did not rely on process memory.
    const fresh = createPrismaClient();
    try {
      const persisted = await fresh.revOpsWorkspace.findUniqueOrThrow({
        where: { id: w.id },
      });
      expect(persisted.state).toEqual((await current(w)).state);
    } finally {
      await fresh.$disconnect();
    }
  });
  it("RLS fails closed for a non-bypass role and protects tenant writes", async () => {
    const w = await workspace("RLS test");
    await h.prisma.$executeRawUnsafe(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='revops_rls_test') THEN CREATE ROLE revops_rls_test NOLOGIN NOSUPERUSER NOBYPASSRLS; END IF; END $$;`,
    );
    await h.prisma.$executeRawUnsafe(
      `GRANT SELECT, UPDATE, DELETE ON "RevOpsWorkspace" TO revops_rls_test`,
    );
    await h.prisma.$executeRawUnsafe(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON "RevOpsChange" TO revops_rls_test`,
    );
    await h.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL ROLE revops_rls_test");
      expect(
        await tx.$queryRawUnsafe(
          `SELECT id FROM "RevOpsWorkspace" WHERE id=$1`,
          w.id,
        ),
      ).toEqual([]);
      await tx.$executeRaw`SELECT set_config('app.current_organization_id',${h.tenantB.organizationId},true)`;
      expect(
        await tx.$executeRawUnsafe(
          `UPDATE "RevOpsWorkspace" SET revision=999 WHERE id=$1`,
          w.id,
        ),
      ).toBe(0);
      await tx.$executeRaw`SELECT set_config('app.current_organization_id',${h.tenantA.organizationId},true)`;
      expect(
        await tx.$queryRawUnsafe(
          `SELECT id FROM "RevOpsWorkspace" WHERE id=$1`,
          w.id,
        ),
      ).toEqual([{ id: w.id }]);
      expect(
        await tx.$queryRawUnsafe(
          `SELECT revision FROM "RevOpsChange" WHERE "workspaceId"=$1`,
          w.id,
        ),
      ).toEqual([{ revision: 1 }]);
      expect(
        await tx.$executeRawUnsafe(
          `UPDATE "RevOpsChange" SET action='tampered' WHERE "workspaceId"=$1`,
          w.id,
        ),
      ).toBe(0);
      expect(
        await tx.$executeRawUnsafe(
          `DELETE FROM "RevOpsChange" WHERE "workspaceId"=$1`,
          w.id,
        ),
      ).toBe(0);
      expect(
        await tx.$executeRawUnsafe(
          `DELETE FROM "RevOpsWorkspace" WHERE id=$1`,
          w.id,
        ),
      ).toBe(0);
      const journalBefore = await tx.$queryRawUnsafe(
        `SELECT * FROM "RevOpsChange" WHERE "workspaceId"=$1`,
        w.id,
      );
      await tx.$executeRawUnsafe("SAVEPOINT immutable_workspace_key");
      await expect(
        tx.$executeRawUnsafe(
          `UPDATE "RevOpsWorkspace" SET id=$2 WHERE id=$1`,
          w.id,
          `${w.id}-rewritten`,
        ),
      ).rejects.toMatchObject({
        code: "P2010",
        meta: {
          // PostgreSQL 16 reports foreign_key_violation; 18 reports
          // restrict_violation for the same rejected referenced-key update.
          code: expect.stringMatching(/^(23503|23001)$/),
          message: expect.stringContaining(
            "RevOpsChange_organizationId_workspaceId_fkey",
          ),
        },
      });
      await tx.$executeRawUnsafe(
        "ROLLBACK TO SAVEPOINT immutable_workspace_key",
      );
      expect(
        await tx.$queryRawUnsafe(
          `SELECT * FROM "RevOpsChange" WHERE "workspaceId"=$1`,
          w.id,
        ),
      ).toEqual(journalBefore);
      expect(
        await tx.$queryRawUnsafe(
          `SELECT id FROM "RevOpsWorkspace" WHERE id=$1`,
          w.id,
        ),
      ).toEqual([{ id: w.id }]);
      expect(
        await tx.$queryRawUnsafe(
          `SELECT revision FROM "RevOpsChange" WHERE "workspaceId"=$1`,
          w.id,
        ),
      ).toEqual([{ revision: 1 }]);
    });
  });
});
