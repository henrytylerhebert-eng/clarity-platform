import type { PrismaClient, Prisma } from "@prisma/client";
import type { AuthenticatedPrincipal } from "@clarity/domain-contracts";
import type {
  RevOpsCommand,
  RevOpsSetup,
  RevOpsSource,
  RevOpsState,
  RevOpsReconciliationPlan,
  RevOpsReconciliationReceipt,
  RevOpsClosingReceipt,
} from "../../domain-contracts/src/revOps.js";
import {
  applyRevOpsCommand,
  createRevOpsState,
  isRevOpsAdmin,
  permissionsFor,
  requirePermission,
  RevOpsError,
  requireSetupValues,
  assertOpen,
  compareRevOps,
  monthCloseReadiness,
} from "../../rev-ops-service/src/index.js";
import { withTenantContext } from "./tenantContext.js";
import { REV_OPS_CENSUS_METRIC } from "../../domain-contracts/src/revOps.js";
import { PrismaCaseAuditWriter } from "./auditWriter.js";

const json = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value));
export class PrismaRevOpsGateway {
  constructor(private readonly prisma: PrismaClient) {}
  async exportContext(actor: AuthenticatedPrincipal, id: string, receiptRevision: number) {
    return withTenantContext(this.prisma, actor.organizationId, async tx => {
      const row = await tx.revOpsWorkspace.findFirst({where:{id,organizationId:actor.organizationId}});
      if (!row) throw new RevOpsError("resource_not_found",404);
      const state=row.state as unknown as RevOpsState;
      requirePermission(state,actor,"view"); requirePermission(state,actor,"receiptExport");
      const read = async (revision: number) => {
        // Bound transferred JSON in SQL, before materializing an untrusted historic payload in Node.
        const rows=await tx.$queryRaw<{receipt: RevOpsClosingReceipt | null; size: number}[]>`
          SELECT CASE WHEN octet_length(("details"->'closing')::text) <= 262144
            THEN "details"->'closing' ELSE NULL END AS receipt,
            octet_length(("details"->'closing')::text) AS size
          FROM "RevOpsChange" WHERE "organizationId"=${actor.organizationId}
            AND "workspaceId"=${id} AND "revision"=${revision} AND "action"='close'`;
        if ((rows[0]?.size ?? 0) > 262144) throw new RevOpsError("export_size_limit",413);
        if(!rows[0]?.receipt) throw new RevOpsError("historical_receipt_not_found",404);
        if(rows[0].receipt.workspaceId!==id || rows[0].receipt.revision!==revision) throw new RevOpsError("invalid_historical_receipt",400);
        return rows[0].receipt;
      };
      if(receiptRevision>row.revision) throw new RevOpsError("historical_receipt_not_found",404);
      const receipt=await read(receiptRevision);
      const predecessor=receipt.previousClosingRevision ? await read(receipt.previousClosingRevision) : undefined;
      const successor=await tx.revOpsChange.findFirst({where:{organizationId:actor.organizationId,workspaceId:id,action:"close",revision:{gt:receiptRevision,lte:row.revision},details:{path:["closing","period"],equals:receipt.period}},orderBy:{revision:"asc"},select:{revision:true}});
      return {receipt,predecessor,successorRevision:successor?.revision,workspaceRevision:row.revision,periodClosed:state.closedPeriods.includes(receipt.period),observedAt:new Date().toISOString()};
    });
  }
  async exportEvent(actor: AuthenticatedPrincipal, id: string, expectedRevision: number, metadata: {requestId:string; receiptRevision:number; receiptHash:string; templateVersion:string; bytes?:number}, event: "requested" | "generated_delivery_authorized" | "failed") {
    return withTenantContext(this.prisma,actor.organizationId,async tx=>{
      // Serialize the final authority check against grant changes/period changes.
      await tx.$queryRaw`SELECT "id" FROM "RevOpsWorkspace" WHERE "id"=${id} AND "organizationId"=${actor.organizationId} FOR SHARE`;
      const row=await tx.revOpsWorkspace.findFirst({where:{id,organizationId:actor.organizationId}});
      if(!row) throw new RevOpsError("resource_not_found",404);
      if(event!=="failed") {
        requirePermission(row.state as unknown as RevOpsState,actor,"view");
        requirePermission(row.state as unknown as RevOpsState,actor,"receiptExport");
        if(row.revision!==expectedRevision) throw new RevOpsError("version_conflict_refresh_required");
      }
      await new PrismaCaseAuditWriter().write(tx,{
        organizationId:actor.organizationId,caseId:null,actor:{actorId:actor.userId,actorType:"USER"},
        action:`rev_ops_export_${event}`,objectType:"rev_ops_receipt_export",objectId:id,
        metadata:{...metadata,workspaceRevision:expectedRevision},occurredAt:new Date(),
      });
    });
  }
  private async latestClosing(
    tx: Prisma.TransactionClient,
    organizationId: string,
    workspaceId: string,
    period: string,
    revision: number,
  ): Promise<RevOpsClosingReceipt | undefined> {
    const change = await tx.revOpsChange.findFirst({
      where: {
        organizationId,
        workspaceId,
        action: "close",
        revision: { lte: revision },
        details: { path: ["closing", "period"], equals: period },
      },
      orderBy: { revision: "desc" },
      select: { details: true },
    });
    return (change?.details as { closing?: RevOpsClosingReceipt } | undefined)
      ?.closing;
  }
  async comparison(
    actor: AuthenticatedPrincipal,
    id: string,
    period: string,
    through: string,
    budgetId?: string,
  ) {
    return withTenantContext(this.prisma, actor.organizationId, async (tx) => {
      const row = await tx.revOpsWorkspace.findFirst({
        where: { id, organizationId: actor.organizationId },
      });
      if (!row) throw new RevOpsError("resource_not_found", 404);
      const state = row.state as unknown as RevOpsState;
      requirePermission(state, actor, "view");
      return {
        ...compareRevOps(state, period, through, budgetId),
        closeReadiness: monthCloseReadiness(state, period, budgetId),
        closingReceipt:
          (await this.latestClosing(
            tx,
            actor.organizationId,
            id,
            period,
            row.revision,
          )) ?? null,
        revision: row.revision,
      };
    });
  }
  private async receipt(
    tx: Prisma.TransactionClient,
    organizationId: string,
    workspaceId: string,
    importKey: string,
  ) {
    const change = await tx.revOpsChange.findFirst({
      where: {
        organizationId,
        workspaceId,
        action: "import",
        details: { path: ["importKey"], equals: importKey },
      },
      select: { details: true },
    });
    return (
      change?.details as
        | { reconciliation?: RevOpsReconciliationReceipt }
        | undefined
    )?.reconciliation;
  }
  async importReceipt(
    actor: AuthenticatedPrincipal,
    id: string,
    importKey: string,
  ) {
    return withTenantContext(this.prisma, actor.organizationId, async (tx) => {
      const row = await tx.revOpsWorkspace.findFirst({
        where: { id, organizationId: actor.organizationId },
      });
      if (!row) throw new RevOpsError("resource_not_found", 404);
      const state = row.state as unknown as RevOpsState;
      requirePermission(state, actor, "view");
      requirePermission(state, actor, "actualEnter");
      if (!state.acceptedImports.includes(importKey)) return undefined;
      return this.receipt(tx, actor.organizationId, id, importKey);
    });
  }
  async members(actor: AuthenticatedPrincipal) {
    if (!isRevOpsAdmin(actor)) throw new RevOpsError("permission_denied", 403);
    return this.prisma.user.findMany({
      where: { organizationId: actor.organizationId, status: "ACTIVE" },
      select: { id: true, displayName: true },
    });
  }
  async list(actor: AuthenticatedPrincipal) {
    return withTenantContext(this.prisma, actor.organizationId, async (tx) => {
      const rows = await tx.revOpsWorkspace.findMany({
        where: { organizationId: actor.organizationId },
        include: { facility: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      });
      return rows
        .filter((r) =>
          permissionsFor(r.state as unknown as RevOpsState, actor).includes(
            "view",
          ),
        )
        .map((r) => this.view(r, actor));
    });
  }
  private view(
    row: {
      id: string;
      state: Prisma.JsonValue;
      revision: number;
      facility: { name: string };
    },
    actor: AuthenticatedPrincipal,
  ) {
    const state = row.state as unknown as RevOpsState;
    return {
      id: row.id,
      name: row.facility.name,
      revision: row.revision,
      state,
      permissions: permissionsFor(state, actor),
      isAdmin: isRevOpsAdmin(actor),
    };
  }
  async get(actor: AuthenticatedPrincipal, id: string) {
    return withTenantContext(this.prisma, actor.organizationId, async (tx) => {
      const row = await tx.revOpsWorkspace.findFirst({
        where: { id, organizationId: actor.organizationId },
        include: { facility: { select: { name: true } } },
      });
      if (!row) throw new RevOpsError("resource_not_found", 404);
      requirePermission(row.state as unknown as RevOpsState, actor, "view");
      return this.view(row, actor);
    });
  }
  async create(actor: AuthenticatedPrincipal, input: RevOpsSetup) {
    if (!isRevOpsAdmin(actor)) throw new RevOpsError("permission_denied", 403);
    return withTenantContext(this.prisma, actor.organizationId, async (tx) => {
      // Reuse the organization's facility identity instead of creating a parallel facility registry.
      // Transaction lock serializes duplicate setup submissions within this organization.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${actor.organizationId}))`;
      const matches = await tx.facilityProfile.findMany({
        where: { organizationId: actor.organizationId, name: input.name },
        take: 2,
      });
      if (matches.length > 1)
        throw new RevOpsError("ambiguous_hospital_identity");
      let facility = matches[0];
      if (!facility)
        facility = await tx.facilityProfile.create({
          data: {
            organizationId: actor.organizationId,
            name: input.name,
            programs: [],
            acceptedCoverageTypes: [],
            medicalCapabilities: [],
            exclusionCriteria: [],
            legalStatusCapabilities: [],
            transportationRules: [],
            referralRequirements: [],
          },
        });
      const siblings = await tx.revOpsWorkspace.findMany({
        where: {
          organizationId: actor.organizationId,
          facilityId: facility.id,
        },
        select: { state: true },
      });
      if (
        siblings.some(
          (s) =>
            (s.state as unknown as RevOpsState).timezone !== input.timezone,
        )
      )
        throw new RevOpsError("hospital_timezone_conflict");
      if (
        await tx.revOpsWorkspace.findFirst({
          where: {
            organizationId: actor.organizationId,
            facilityId: facility.id,
            unit: input.unit,
          },
        })
      )
        throw new RevOpsError("workspace_already_exists");
      const row = await tx.revOpsWorkspace.create({
        data: {
          organizationId: actor.organizationId,
          facilityId: facility.id,
          unit: input.unit,
          state: json(createRevOpsState(input)),
        },
        include: { facility: { select: { name: true } } },
      });
      await tx.revOpsChange.create({
        data: {
          organizationId: actor.organizationId,
          workspaceId: row.id,
          revision: 1,
          actorId: actor.userId,
          action: "setup",
          details: json(input),
        },
      });
      return this.view(row, actor);
    });
  }
  async execute(
    actor: AuthenticatedPrincipal,
    id: string,
    revision: number,
    commands: RevOpsCommand[],
    source: RevOpsSource,
    importKey?: string,
    importKind?: "budget" | "actuals",
    reconciliation?: RevOpsReconciliationPlan,
  ) {
    return withTenantContext(this.prisma, actor.organizationId, async (tx) => {
      const row = await tx.revOpsWorkspace.findFirst({
        where: { id, organizationId: actor.organizationId },
        include: { facility: { select: { name: true } } },
      });
      if (!row) throw new RevOpsError("resource_not_found", 404);
      const state = row.state as unknown as RevOpsState;
      requirePermission(state, actor, "view");
      if (importKey) {
        requirePermission(
          state,
          actor,
          (importKind ?? commands[0]?.action) === "budget"
            ? "budgetImport"
            : "actualEnter",
        );
        if (state.acceptedImports.includes(importKey)) {
          const receipt = await this.receipt(
            tx,
            actor.organizationId,
            id,
            importKey,
          );
          return {
            replayed: true,
            revision: row.revision,
            ...(receipt ? { receipt } : {}),
          };
        }
      }
      if (row.revision !== revision)
        throw new RevOpsError("version_conflict_refresh_required");
      const close =
        commands.length === 1 && commands[0]?.action === "close"
          ? commands[0]
          : undefined;
      const priorClosing = close
        ? await this.latestClosing(
            tx,
            actor.organizationId,
            id,
            close.period,
            revision,
          )
        : undefined;
      if (reconciliation) {
        if (!importKey || importKind !== "actuals")
          throw new RevOpsError("invalid_reconciliation", 400);
        requirePermission(state, actor, "actualEnter");
        if (reconciliation.counts.corrected || reconciliation.counts.kept)
          requirePermission(state, actor, "actualCorrect");
        requireSetupValues(state);
        assertOpen(state, reconciliation.period);
      }
      const at = new Date().toISOString();
      const previousField = state.field;
      const fieldChange = commands[0]?.action === "defineField";
      const setupChange = commands[0]?.action === "setupValues";
      const previousCustomFields = state.customFields ?? [];
      const previousSetupValues = state.setupValues ?? [];
      let changed = false;
      for (const [index, command] of commands.entries()) {
        if (command.action === "grant") {
          if (!isRevOpsAdmin(actor))
            throw new RevOpsError("permission_denied", 403);
          const user = await tx.user.findFirst({
            where: {
              id: command.userId,
              organizationId: actor.organizationId,
              status: "ACTIVE",
            },
          });
          if (!user) throw new RevOpsError("resource_not_found", 404);
        }
        changed =
          applyRevOpsCommand(
            state,
            command,
            actor,
            source.rows
              ? {
                  ...source,
                  rows: [(reconciliation?.commandRows ?? source.rows)[index]!],
                }
              : source,
            at,
          ) || changed;
      }
      if (importKey) {
        state.acceptedImports.push(importKey);
        changed = true;
      }
      if (!changed)
        return {
          replayed: true,
          revision: row.revision,
          ...(priorClosing ? { closingReceipt: priorClosing } : {}),
        };
      const updated = await tx.revOpsWorkspace.updateMany({
        where: { id, organizationId: actor.organizationId, revision },
        data: { state: json(state), revision: { increment: 1 } },
      });
      if (updated.count !== 1)
        throw new RevOpsError("version_conflict_refresh_required");
      let closingReceipt: RevOpsClosingReceipt | undefined;
      if (close) {
        const ready = monthCloseReadiness(state, close.period, close.budgetId);
        closingReceipt = {
          workspaceId: id,
          hospitalId: row.facilityId,
          hospitalName: row.facility.name,
          metric: { ...structuredClone(REV_OPS_CENSUS_METRIC), timezone: state.timezone },
          unit: state.unit,
          timezone: state.timezone,
          dateConvention: "end-of-day",
          period: close.period,
          through: ready.through,
          expectedDays: ready.expectedDays,
          actuals: ready.actuals!,
          budget: structuredClone(ready.budget!),
          variance: ready.variance!,
          days: Array.from({ length: ready.expectedDays }, (_, i) => {
            const date = `${close.period}-${String(i + 1).padStart(2, "0")}`;
            const actuals = state.actuals[date]!;
            return {
              date,
              actualRevision: actuals.length,
              actual: structuredClone(actuals.at(-1)!),
            };
          }),
          actorId: actor.userId,
          at,
          reason: close.reason,
          revision: revision + 1,
          closingNumber: (priorClosing?.closingNumber ?? 0) + 1,
          ...(priorClosing
            ? { previousClosingRevision: priorClosing.revision }
            : {}),
        };
      }
      const receipt: RevOpsReconciliationReceipt | undefined = reconciliation
        ? {
            importKey: importKey!,
            period: reconciliation.period,
            source,
            actorId: actor.userId,
            at,
            revision: revision + 1,
            counts: reconciliation.counts,
            patientDayChange: reconciliation.patientDayChange,
            rows: reconciliation.rows.map((r) => ({
              ...r,
              actualRevision: state.actuals[r.date]!.length,
            })),
          }
        : undefined;
      await tx.revOpsChange.create({
        data: {
          organizationId: actor.organizationId,
          workspaceId: id,
          revision: revision + 1,
          actorId: actor.userId,
          action: importKey ? "import" : commands[0]!.action,
          details: json({
            commands,
            source,
            previousField,
            ...(importKey ? { importKey } : {}),
            ...(receipt ? { reconciliation: receipt } : {}),
            ...(closingReceipt ? { closing: closingReceipt } : {}),
            ...(fieldChange
              ? { previousCustomFields, customFields: state.customFields }
              : {}),
            ...(setupChange
              ? { previousSetupValues, setupValues: state.setupValues }
              : {}),
          }),
          occurredAt: new Date(at),
        },
      });
      return {
        replayed: false,
        revision: revision + 1,
        ...(receipt ? { receipt } : {}),
        ...(closingReceipt ? { closingReceipt } : {}),
      };
    });
  }
  async history(actor: AuthenticatedPrincipal, id: string, before?: number) {
    return withTenantContext(this.prisma, actor.organizationId, async (tx) => {
      const row = await tx.revOpsWorkspace.findFirst({
        where: { id, organizationId: actor.organizationId },
        select: { state: true },
      });
      if (!row) throw new RevOpsError("resource_not_found", 404);
      requirePermission(row.state as unknown as RevOpsState, actor, "view");
      return tx.revOpsChange.findMany({
        where: {
          organizationId: actor.organizationId,
          workspaceId: id,
          ...(before ? { revision: { lt: before } } : {}),
        },
        orderBy: { revision: "desc" },
        take: 100,
      });
    });
  }
}
