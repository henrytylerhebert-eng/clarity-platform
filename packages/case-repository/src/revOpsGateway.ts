import type { PrismaClient, Prisma } from "@prisma/client";
import type { AuthenticatedPrincipal } from "@clarity/domain-contracts";
import type {
  RevOpsCommand,
  RevOpsSetup,
  RevOpsSource,
  RevOpsState,
} from "../../domain-contracts/src/revOps.js";
import {
  applyRevOpsCommand,
  createRevOpsState,
  isRevOpsAdmin,
  permissionsFor,
  requirePermission,
  RevOpsError,
} from "../../rev-ops-service/src/index.js";
import { withTenantContext } from "./tenantContext.js";

const json = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value));
export class PrismaRevOpsGateway {
  constructor(private readonly prisma: PrismaClient) {}
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
  ) {
    return withTenantContext(this.prisma, actor.organizationId, async (tx) => {
      const row = await tx.revOpsWorkspace.findFirst({
        where: { id, organizationId: actor.organizationId },
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
        if (state.acceptedImports.includes(importKey))
          return { replayed: true, revision: row.revision };
      }
      if (row.revision !== revision)
        throw new RevOpsError("version_conflict_refresh_required");
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
            source.rows ? { ...source, rows: [source.rows[index]!] } : source,
            at,
          ) || changed;
      }
      if (importKey) {
        state.acceptedImports.push(importKey);
        changed = true;
      }
      if (!changed) return { replayed: true, revision: row.revision };
      const updated = await tx.revOpsWorkspace.updateMany({
        where: { id, organizationId: actor.organizationId, revision },
        data: { state: json(state), revision: { increment: 1 } },
      });
      if (updated.count !== 1)
        throw new RevOpsError("version_conflict_refresh_required");
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
      return { replayed: false, revision: revision + 1 };
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
