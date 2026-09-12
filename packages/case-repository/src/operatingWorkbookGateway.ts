import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { PrismaClient, Prisma } from "@prisma/client";
import type { AuthenticatedPrincipal } from "@clarity/domain-contracts";
import type { RevOpsState } from "../../domain-contracts/src/revOps.js";
import type { OperatingWorkbook, WorkbookEdit, WorkbookCell, WorkbookAppend } from "../../domain-contracts/src/operatingWorkbook.js";
import { applyWorkbookAppend, applyWorkbookEdit, summarizeOperatingWorkbook } from "../../rev-ops-service/src/operatingWorkbook.js";
import { isRevOpsAdmin, requirePermission, RevOpsError } from "../../rev-ops-service/src/index.js";
import { withTenantContext } from "./tenantContext.js";

type StoredState = RevOpsState & { operatingWorkbook?: OperatingWorkbook };
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const ACCEPTED_SOURCE = "6e81bd61950c244e607ed03f8b0f13e1a4d0bea366ee7ad7cc54c053ef90de26";

/** Reuses the tenant-scoped workspace and append-only revision journal. */
export class PrismaOperatingWorkbookGateway {
  constructor(private readonly prisma: PrismaClient) {}

  private async workspace(tx: Prisma.TransactionClient, actor: AuthenticatedPrincipal, id: string, edit = false) {
    const row = await tx.revOpsWorkspace.findFirst({ where: { id, organizationId: actor.organizationId } });
    if (!row) throw new RevOpsError("resource_not_found", 404);
    const state = row.state as unknown as StoredState;
    requirePermission(state, actor, "view");
    if (edit && !isRevOpsAdmin(actor)) throw new RevOpsError("permission_denied", 403);
    return { row, state };
  }

  private async view(tx: Prisma.TransactionClient, actor: AuthenticatedPrincipal, id: string, revision: number, state: StoredState, period?: string) {
    const records = await tx.revOpsChange.findMany({
      where: { organizationId: actor.organizationId, workspaceId: id, action: { startsWith: "operating_" } },
      orderBy: { revision: "desc" }, take: 50,
    });
    const snapshots = await tx.revOpsChange.findMany({
      where: { organizationId: actor.organizationId, workspaceId: id, action: "operating_snapshot" },
      orderBy: { revision: "desc" }, take: 24,
    });
    const workbook = state.operatingWorkbook ?? null;
    return {
      revision, workbook,
      summary: workbook ? summarizeOperatingWorkbook(workbook, period ?? String(workbook.source.year)) : null,
      history: records.map(r => (r.details as Record<string, unknown>).operatingChange),
      closings: snapshots.map(r => (r.details as Record<string, unknown>).operatingSnapshot),
    };
  }

  async get(actor: AuthenticatedPrincipal, id: string, period?: string) {
    return withTenantContext(this.prisma, actor.organizationId, async tx => {
      const { row, state } = await this.workspace(tx, actor, id);
      return this.view(tx, actor, id, row.revision, state, period);
    });
  }

  async loadSample(actor: AuthenticatedPrincipal, id: string, period?: string) {
    // Static, locally accepted synthetic fixture; request bodies cannot choose a path or supply records.
    if (!isRevOpsAdmin(actor)) throw new RevOpsError("permission_denied", 403);
    const bytes = await readFile(new URL("../../../data/synthetic-revops/dunder-mifflin-2026.json", import.meta.url));
    if (bytes.byteLength > 25 * 1024 * 1024) throw new RevOpsError("workbook_fixture_size_limit", 413);
    const workbook = JSON.parse(bytes.toString("utf8")) as OperatingWorkbook;
    if (workbook.schemaVersion !== 1 || workbook.source.sha256 !== ACCEPTED_SOURCE || !Array.isArray(workbook.tables))
      throw new RevOpsError("workbook_fixture_not_accepted", 409);
    return withTenantContext(this.prisma, actor.organizationId, async tx => {
      const { row, state } = await this.workspace(tx, actor, id, true);
      if (state.operatingWorkbook) throw new RevOpsError("workbook_already_loaded", 409);
      state.operatingWorkbook = workbook;
      const at = new Date().toISOString();
      const change = { id: randomUUID(), action: "load", revision: row.revision + 1, actorId: actor.userId, at, reason: "Loaded owner-accepted synthetic 2026 workbook", sourceHash: workbook.source.sha256, dataHash: hash(workbook) };
      await this.write(tx, actor, id, row.revision, state, "operating_load", { operatingChange: change });
      return this.view(tx, actor, id, row.revision + 1, state, period);
    });
  }

  async edit(actor: AuthenticatedPrincipal, id: string, revision: number, edit: WorkbookEdit, period?: string) {
    return withTenantContext(this.prisma, actor.organizationId, async tx => {
      const { row, state } = await this.workspace(tx, actor, id, true);
      if (row.revision !== revision) throw new RevOpsError("version_conflict_refresh_required", 409);
      if (!state.operatingWorkbook) throw new RevOpsError("workbook_not_loaded", 409);
      const oldValue: WorkbookCell = state.operatingWorkbook.tables.find(t => t.key === edit.tableKey)?.rows.find(r => r.id === edit.rowId)?.values[edit.columnKey] ?? null;
      try { state.operatingWorkbook = applyWorkbookEdit(state.operatingWorkbook, edit); }
      catch { throw new RevOpsError("invalid_workbook_edit", 400); }
      if (oldValue === edit.value) return this.view(tx, actor, id, revision, state, period);
      const change = { id: randomUUID(), action: "edit", revision: revision + 1, tableKey: edit.tableKey, rowId: edit.rowId, columnKey: edit.columnKey, oldValue, newValue: edit.value, reason: edit.reason, actorId: actor.userId, at: new Date().toISOString() };
      await this.write(tx, actor, id, revision, state, "operating_edit", { operatingChange: change });
      return this.view(tx, actor, id, revision + 1, state, period);
    });
  }

  async snapshot(actor: AuthenticatedPrincipal, id: string, revision: number, period: string, reason: string) {
    return withTenantContext(this.prisma, actor.organizationId, async tx => {
      const { row, state } = await this.workspace(tx, actor, id, true);
      if (row.revision !== revision) throw new RevOpsError("version_conflict_refresh_required", 409);
      if (!state.operatingWorkbook) throw new RevOpsError("workbook_not_loaded", 409);
      const receipt = {
        id: randomUUID(), revision: revision + 1, period, reason, actorId: actor.userId, at: new Date().toISOString(),
        sourceHash: state.operatingWorkbook.source.sha256, dataHash: hash(state.operatingWorkbook),
        summary: summarizeOperatingWorkbook(state.operatingWorkbook, period),
      };
      // A report snapshot preserves results and known issues; it is not an adjudicated financial close.
      await this.write(tx, actor, id, revision, state, "operating_snapshot", {
        operatingChange: { ...receipt, summary: undefined, action: "snapshot" }, operatingSnapshot: receipt,
      });
      return this.view(tx, actor, id, revision + 1, state, period);
    });
  }

  async append(actor: AuthenticatedPrincipal, id: string, revision: number, input: WorkbookAppend, period?: string) {
    return withTenantContext(this.prisma, actor.organizationId, async tx => {
      const { row, state } = await this.workspace(tx, actor, id, true);
      if (row.revision !== revision) throw new RevOpsError("version_conflict_refresh_required", 409);
      if (!state.operatingWorkbook) throw new RevOpsError("workbook_not_loaded", 409);
      try { state.operatingWorkbook = applyWorkbookAppend(state.operatingWorkbook, input); }
      catch { throw new RevOpsError("invalid_registry_record", 400); }
      const added = state.operatingWorkbook.tables.find(t => t.key === input.tableKey)!.rows.at(-1)!;
      const change = { id: randomUUID(), action: "append", revision: revision + 1, tableKey: input.tableKey, rowId: added.id, values: added.values, reason: input.reason, actorId: actor.userId, at: new Date().toISOString() };
      await this.write(tx, actor, id, revision, state, "operating_append", { operatingChange: change });
      return this.view(tx, actor, id, revision + 1, state, period);
    });
  }

  private async write(tx: Prisma.TransactionClient, actor: AuthenticatedPrincipal, id: string, revision: number, state: StoredState, action: string, details: unknown) {
    const updated = await tx.revOpsWorkspace.updateMany({
      where: { id, organizationId: actor.organizationId, revision },
      data: { state: json(state), revision: { increment: 1 } },
    });
    if (updated.count !== 1) throw new RevOpsError("version_conflict_refresh_required", 409);
    await tx.revOpsChange.create({ data: { organizationId: actor.organizationId, workspaceId: id, revision: revision + 1, actorId: actor.userId, action, details: json(details) } });
  }
}
