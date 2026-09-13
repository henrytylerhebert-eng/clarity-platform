import type { Prisma, PrismaClient } from "@prisma/client";
import type { AuthenticatedPrincipal } from "@clarity/domain-contracts";
import {
  RecordRateReleaseRequestSchema,
  revOpsRateReleasePermissionsFor,
} from "../../domain-contracts/src/revOpsRateReleasePersistence.js";
import { withTenantContext } from "./tenantContext.js";
import { PrismaCaseAuditWriter } from "./auditWriter.js";

export class RevOpsRateReleaseError extends Error {
  constructor(readonly code: string, readonly status: number) {
    super(code);
  }
}

const json = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value));

const requirePermission = (
  actor: AuthenticatedPrincipal,
  permission: "view" | "record",
) => {
  if (!revOpsRateReleasePermissionsFor(actor).includes(permission))
    throw new RevOpsRateReleaseError("permission_denied", 403);
};

/**
 * ADR-0021. RevOpsRateRelease carries no organizationId — it is public,
 * government-published reference data identical for every organization, not
 * a tenant-owned fact. withTenantContext is used only around the `record`
 * transaction, because the audit event it writes IS tenant-scoped; `list` is
 * a plain read with no tenant predicate, by design.
 */
export class PrismaRevOpsRateReleaseGateway {
  constructor(private readonly prisma: PrismaClient) {}

  async record(actor: AuthenticatedPrincipal, raw: unknown) {
    requirePermission(actor, "record");
    const request = RecordRateReleaseRequestSchema.parse(raw);
    return withTenantContext(this.prisma, actor.organizationId, async (tx) => {
      const existing = await tx.revOpsRateRelease.findUnique({
        where: { releaseId: request.releaseId },
      });
      if (existing)
        throw new RevOpsRateReleaseError("release_id_already_recorded", 409);
      let supersedes: { id: string } | null = null;
      if (request.supersedesReleaseId) {
        const target = await tx.revOpsRateRelease.findUnique({
          where: { releaseId: request.supersedesReleaseId },
        });
        if (!target)
          throw new RevOpsRateReleaseError("superseded_release_not_found", 404);
        if (target.status !== "ACTIVE")
          throw new RevOpsRateReleaseError("superseded_release_not_active", 409);
        if (target.programMethod !== request.programMethod)
          throw new RevOpsRateReleaseError("program_method_mismatch", 400);
        supersedes = { id: target.id };
      }
      const created = await tx.revOpsRateRelease.create({
        data: {
          programMethod: request.programMethod,
          releaseId: request.releaseId,
          publisher: request.publisher,
          sourceUrl: request.sourceUrl,
          sha256: request.sha256,
          retrievedAt: new Date(request.retrievedAt),
          effectiveFrom: new Date(`${request.effectiveFrom}T00:00:00.000Z`),
          effectiveThrough: new Date(`${request.effectiveThrough}T00:00:00.000Z`),
          payload: json({
            sheet: request.sheet,
            rowCount: request.rows.length,
            rows: request.rows,
          }),
          recordedByOrganizationId: actor.organizationId,
          recordedBy: actor.userId,
        },
      });
      if (supersedes) {
        // Only the supersession-tracking fields change on the replaced row —
        // its payload/sha256/sourceUrl/effective dates are never rewritten.
        await tx.revOpsRateRelease.update({
          where: { id: supersedes.id },
          data: { status: "SUPERSEDED", supersededById: created.id },
        });
      }
      await new PrismaCaseAuditWriter().write(tx, {
        organizationId: actor.organizationId,
        caseId: null,
        actor: { actorId: actor.userId, actorType: "USER" },
        action: supersedes
          ? "rev_ops_rate_release_corrected"
          : "rev_ops_rate_release_recorded",
        objectType: "rev_ops_rate_release",
        objectId: created.id,
        metadata: {
          releaseId: created.releaseId,
          programMethod: created.programMethod,
          ...(supersedes ? { supersedesReleaseId: request.supersedesReleaseId } : {}),
        },
        occurredAt: new Date(),
      });
      return created;
    });
  }

  async list(
    actor: AuthenticatedPrincipal,
    programMethod: string,
    includeSuperseded: boolean,
  ) {
    requirePermission(actor, "view");
    return this.prisma.revOpsRateRelease.findMany({
      where: {
        programMethod,
        ...(includeSuperseded ? {} : { status: "ACTIVE" }),
      },
      orderBy: { effectiveFrom: "asc" },
    });
  }
}
