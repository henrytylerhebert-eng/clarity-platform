import { afterAll, beforeAll, expect, it } from "vitest";
import { once } from "node:events";
import type { Server } from "node:http";
import { AuthenticationService, LocalDevIdentityProvider } from "@clarity/auth-service";
import { PrismaAuthGateway, PrismaCaseCommandGateway } from "@clarity/case-repository";
import { CaseCommandService } from "@clarity/case-service";
import { createApiServer } from "@clarity/api-service";
import { InMemoryPrescreenGateway, PrescreenCommandService, PRESCREEN_PRODUCTION_POLICY } from "@clarity/prescreen-service";
import { PrismaRevOpsGateway } from "../../packages/case-repository/src/revOpsGateway.js";
import { PrismaOperatingWorkbookGateway } from "../../packages/case-repository/src/operatingWorkbookGateway.js";
import type { OperatingWorkbook, OperatingWorkbookSummary } from "../../packages/domain-contracts/src/operatingWorkbook.js";
import { createHarness, type Harness } from "./helpers/harness.js";

let h: Harness;
let server: Server;
let base: string;
let auth: AuthenticationService;
let tokenA: string;
let tokenB: string;
let tokenReader: string;
let workspaceId: string;
type View = { revision: number; workbook: OperatingWorkbook; summary: OperatingWorkbookSummary; history: { action: string; oldValue: unknown; newValue: unknown; reason: string; actorId: string }[]; closings: { dataHash: string; summary: OperatingWorkbookSummary }[] };
// HTTP assertions span successful records and error envelopes.
async function request(token: string, path: string, body?: unknown): Promise<{ status: number; cache: string | null; body: any }> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const response = await fetch(base + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, cache: response.headers.get("cache-control"), body: await response.json() };
}
const route = () => `/workspaces/${workspaceId}/operating-workbook`;
// Each test's own valid setup: loads the accepted sample if a prior test's
// load didn't run or failed, so a failed initialization surfaces as its own
// clear "loadSample did not return 200" failure here, never as an unrelated
// "Cannot read properties of null" crash in a later, otherwise-passing test.
async function ensureLoaded(): Promise<View> {
  const current = await request(tokenA, route());
  if (current.body.workbook) return current.body as View;
  const loaded = await request(tokenA, route(), { action: "loadSample" });
  expect(loaded.status).toBe(200);
  return loaded.body as View;
}

beforeAll(async () => {
  h = await createHarness();
  const provider = new LocalDevIdentityProvider();
  for (const tenant of [h.tenantA, h.tenantB]) {
    const user = await h.prisma.user.update({ where: { id: tenant.userId }, data: { roles: ["ORGANIZATION_ADMIN"] } });
    provider.register(`synthetic-workbook-${tenant.organizationId}`, user.email);
  }
  const reader = await h.prisma.user.create({ data: { id: `reader-${h.runId}`, organizationId: h.tenantA.organizationId, email: `reader-${h.runId}@example.test`, displayName: "Synthetic reader", roles: ["READ_ONLY_AUDITOR"] } });
  provider.register("synthetic-workbook-reader", reader.email);
  auth = new AuthenticationService(provider, new PrismaAuthGateway(h.prisma));
  tokenA = (await auth.login(`synthetic-workbook-${h.tenantA.organizationId}`)).token;
  tokenB = (await auth.login(`synthetic-workbook-${h.tenantB.organizationId}`)).token;
  tokenReader = (await auth.login("synthetic-workbook-reader")).token;
  server = createApiServer({ auth, caseCommands: new CaseCommandService(new PrismaCaseCommandGateway(h.prisma)), prescreen: new PrescreenCommandService(new InMemoryPrescreenGateway(), PRESCREEN_PRODUCTION_POLICY), revOps: new PrismaRevOpsGateway(h.prisma), operatingWorkbook: new PrismaOperatingWorkbookGateway(h.prisma) });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/rev-ops`;
  const result = await request(tokenA, "/workspaces", { name: "Synthetic workbook integration", unit: "Hospital operations", timezone: "America/Chicago", costCenterLabel: "Cost center", costCenterOptions: ["Inpatient", "IOP"] });
  expect(result.status).toBe(200);
  workspaceId = result.body.id;
}, 20000);

afterAll(async () => {
  if (server) await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
  if (h) await h.dispose();
});

it("persists the accepted year, recalculates corrections and preserves report evidence across gateway reloads", async () => {
  expect((await request(tokenA, route())).body.workbook).toBeNull();
  const loaded = await request(tokenA, route(), { action: "loadSample" });
  expect(loaded.status).toBe(200);
  expect(loaded.cache).toBe("no-store");
  const view = loaded.body as View;
  expect(view.workbook.tables.length).toBe(31);
  expect(view.summary.metrics.ipPatientDays).toBe(4392);
  expect(view.summary.comparisons).toHaveLength(47);
  expect(view.summary.comparisons.every(c => c.status === "match")).toBe(true);
  expect((await request(tokenA, route(), { action: "loadSample" })).status).toBe(409);
  const regular = await request(tokenA, `/workspaces/${workspaceId}`);
  expect(regular.body.state).not.toHaveProperty("operatingWorkbook");
  const snapshot = await request(tokenA, `${route()}/snapshot`, { revision: view.revision, period: "2026", reason: "Synthetic baseline evidence" });
  expect(snapshot.status).toBe(200);
  const before = snapshot.body as View;
  const row = before.workbook.tables.find(t => t.key === "budget")!.rows[0]!;
  const amount = row.values.revenueBudget as number;
  const edit = { revision: before.revision, period: "2026", tableKey: "budget", rowId: row.id, columnKey: "revenueBudget", value: amount + 100, reason: "Synthetic pressure test adjustment" };
  const edited = await request(tokenA, `${route()}/edit`, edit);
  expect(edited.status).toBe(200);
  expect(edited.body.summary.metrics.revenueBudget).toBeCloseTo(before.summary.metrics.revenueBudget! + 100, 2);
  expect(edited.body.history[0]).toMatchObject({ oldValue: amount, newValue: amount + 100, actorId: h.tenantA.userId, reason: edit.reason });
  expect(edited.body.closings).toEqual(before.closings);
  expect((await request(tokenA, `${route()}/edit`, { ...edit, value: amount + 200 })).status).toBe(409);
  const fresh = await new PrismaOperatingWorkbookGateway(h.prisma).get(await auth.authenticate(tokenA), workspaceId, "2026");
  expect(fresh.revision).toBe(before.revision + 1);
  expect(fresh.summary!.metrics.revenueBudget).toBeCloseTo(before.summary.metrics.revenueBudget! + 100, 2);
  // Existing aggregate commands must preserve the new workbook state.
  const legacy = await request(tokenA, `/workspaces/${workspaceId}/commands`, { revision: fresh.revision, command: { action: "actual", date: "2026-01-01", count: 0 } });
  expect(legacy.status).toBe(200);
  const stillSaved = await request(tokenA, route());
  expect(stillSaved.body.summary.metrics.revenueBudget).toBe(edited.body.summary.metrics.revenueBudget);
  expect(stillSaved.body.closings).toEqual(before.closings);
}, 30000);

it("enforces authenticated tenancy, delegated view and admin correction authority", async () => {
  await ensureLoaded();
  expect((await request("", route())).status).toBe(401);
  expect((await request(tokenB, route())).status).toBe(404);
  expect((await request(tokenReader, route())).status).toBe(403);
  const current = await request(tokenA, `/workspaces/${workspaceId}`);
  const grant = await request(tokenA, `/workspaces/${workspaceId}/commands`, { revision: current.body.revision, command: { action: "grant", userId: `reader-${h.runId}`, permissions: ["view"] } });
  expect(grant.status).toBe(200);
  const read = await request(tokenReader, route());
  expect(read.status).toBe(200);
  const row = read.body.workbook.tables.find((t: { key: string }) => t.key === "budget").rows[0];
  const edit = { revision: read.body.revision, tableKey: "budget", rowId: row.id, columnKey: "revenueBudget", value: 1, reason: "Synthetic unauthorized edit" };
  expect((await request(tokenReader, `${route()}/edit`, edit)).status).toBe(403);
  expect((await request(tokenB, `${route()}/edit`, edit)).status).toBe(404);
  expect((await request(tokenA, `${route()}/edit`, { ...edit, organizationId: h.tenantB.organizationId })).status).toBe(400);
  expect((await request(tokenA, `${route()}/snapshot`, { revision: read.body.revision, period: "2027", reason: "Unsupported reporting year" })).status).toBe(400);
  expect((await request(tokenA, `${route()}?period=2028`)).status).toBe(400);
  // Receipts are source evidence, not mutable cash input cells.
  const receipt = read.body.workbook.tables.find((t: { key: string }) => t.key === "collections").rows[0];
  const denied = await request(tokenA, `${route()}/edit`, { ...edit, tableKey: "collections", rowId: receipt.id, columnKey: "signedAmount", value: 0 });
  expect(denied.status).toBe(400);
}, 20000);

it("adds durable payer and contract versions without modifying source records", async () => {
  const before = await ensureLoaded();
  const source = before.workbook.tables.find(t => t.key === "payers")!.rows[0]!;
  const payerValues = Object.fromEntries(Object.entries(source.values).filter(([key]) => !source.formulaKeys?.includes(key)));
  payerValues.payerId = "SYN-NEW-PPO";
  payerValues.payerAdministrator = "Synthetic expandable plan";
  const command = { revision: before.revision, tableKey: "payers", values: payerValues, reason: "Synthetic future payer setup" };
  expect((await request(tokenReader, `${route()}/append`, command)).status).toBe(403);
  const added = await request(tokenA, `${route()}/append`, command);
  expect(added.status).toBe(200);
  const payer = added.body.workbook.tables.find((t: { key: string }) => t.key === "payers").rows.at(-1);
  expect(payer).toMatchObject({ sourceRow: 0, values: { payerId: "SYN-NEW-PPO" } });
  expect(added.body.history[0]).toMatchObject({ action: "append", actorId: h.tenantA.userId, reason: command.reason });
  expect((await request(tokenA, `${route()}/append`, { ...command, revision: added.body.revision })).status).toBe(400);
  const rate = before.workbook.tables.find(t => t.key === "contractRates")!.rows[0]!;
  const rateValues = Object.fromEntries(Object.entries(rate.values).filter(([key]) => !rate.formulaKeys?.includes(key)));
  rateValues.rateId = "SYN-NEW-CONTRACT";
  rateValues.payerId = "SYN-NEW-PPO";
  const priced = await request(tokenA, `${route()}/append`, { revision: added.body.revision, tableKey: "contractRates", values: rateValues, reason: "Synthetic dated contract terms" });
  expect(priced.status).toBe(200);
  expect(priced.body.workbook.source).toEqual(before.workbook.source);
  expect(priced.body.closings).toEqual(before.closings);
  const fresh = await new PrismaOperatingWorkbookGateway(h.prisma).get(await auth.authenticate(tokenA), workspaceId);
  expect(fresh.workbook!.tables.find(t => t.key === "contractRates")!.rows.at(-1)!.values.rateId).toBe("SYN-NEW-CONTRACT");
  expect((await request(tokenA, `${route()}/append`, { revision: fresh.revision, tableKey: "collections", values: {}, reason: "No arbitrary financial record appends" })).status).toBe(400);
}, 20000);
