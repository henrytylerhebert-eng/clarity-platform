import { createHash } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import type { AuthenticatedPrincipal } from "@clarity/domain-contracts";
import {
  IopCloseRequestSchema,
  IopExceptionReviewRequestSchema,
  IopPersistedImportRequestSchema,
  iopPermissionsFor,
} from "../../domain-contracts/src/iopPersistence.js";
import { validateIopReconciliationSample } from "../../domain-contracts/src/iopReconciliation.js";
import { withTenantContext } from "./tenantContext.js";
import { PrismaCaseAuditWriter } from "./auditWriter.js";

export class IopReconciliationError extends Error {
  constructor(readonly code: string, readonly status: number) {
    super(code);
  }
}

const json = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value));
const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  return value;
};
const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const requirePermission = (
  actor: AuthenticatedPrincipal,
  permission: "view" | "import" | "review" | "close",
) => {
  if (!iopPermissionsFor(actor).includes(permission))
    throw new IopReconciliationError("permission_denied", 403);
};

export class PrismaIopReconciliationGateway {
  constructor(private readonly prisma: PrismaClient) {}

  async import(actor: AuthenticatedPrincipal, raw: unknown) {
    requirePermission(actor, "import");
    const request = IopPersistedImportRequestSchema.parse(raw);
    // Review authority is never accepted from an import payload. Reviews are
    // written later through the authenticated review endpoint.
    const persistedRequest = {
      ...request,
      reconciliation: { ...request.reconciliation, exceptionReviews: [] },
    };
    const requestHash = hash(persistedRequest);
    const snapshotHash = hash({
      source: persistedRequest.source,
      sourceRecords: persistedRequest.sourceRecords,
      reconciliation: persistedRequest.reconciliation,
    });
    return withTenantContext(this.prisma, actor.organizationId, async (tx) => {
      const facility = await tx.facilityProfile.findFirst({
        where: { id: request.facilityId, organizationId: actor.organizationId },
        select: { id: true },
      });
      if (!facility) throw new IopReconciliationError("resource_not_found", 404);
      const integration = await tx.iopSourceIntegration.findFirst({
        where: {
          organizationId: actor.organizationId,
          integrationKey: request.integrationKey,
          active: true,
        },
      });
      if (!integration) throw new IopReconciliationError("resource_not_found", 404);
      const replay = await tx.iopReconciliationImport.findFirst({
        where: { organizationId: actor.organizationId, idempotencyKey: request.idempotencyKey },
      });
      if (replay) {
        if (replay.requestHash !== requestHash)
          throw new IopReconciliationError("idempotency_key_reused", 409);
        return { import: replay, replayed: true };
      }
      const duplicate = await tx.iopReconciliationImport.findFirst({
        where: { organizationId: actor.organizationId, integrationId: integration.id, snapshotHash },
      });
      if (duplicate)
        throw new IopReconciliationError("source_snapshot_already_imported", 409);
      const created = await tx.iopReconciliationImport.create({
        data: {
          organizationId: actor.organizationId,
          facilityId: request.facilityId,
          programId: request.programId,
          integrationId: integration.id,
          idempotencyKey: request.idempotencyKey,
          requestHash,
          snapshotHash,
          exportedAt: new Date(request.source.exportedAt),
          cutoffAt: new Date(request.source.cutoffAt),
          sourceFileName: request.source.fileName,
          payload: json(persistedRequest),
          acceptedBy: actor.userId,
        },
      });
      await new PrismaCaseAuditWriter().write(tx, {
        organizationId: actor.organizationId,
        caseId: null,
        actor: { actorId: actor.userId, actorType: "USER" },
        action: "iop_reconciliation_import_accepted",
        objectType: "iop_reconciliation_import",
        objectId: created.id,
        metadata: { integrationKey: request.integrationKey, snapshotHash, cutoffAt: request.source.cutoffAt },
        occurredAt: new Date(),
      });
      return { import: created, replayed: false };
    });
  }

  async get(actor: AuthenticatedPrincipal, id: string) {
    requirePermission(actor, "view");
    return withTenantContext(this.prisma, actor.organizationId, async (tx) => {
      const record = await tx.iopReconciliationImport.findFirst({
        where: { id, organizationId: actor.organizationId },
        include: { exceptionReviews: true, closeReceipt: true, integration: { select: { integrationKey: true, label: true } } },
      });
      if (!record) throw new IopReconciliationError("resource_not_found", 404);
      return record;
    });
  }

  async review(actor: AuthenticatedPrincipal, id: string, issueKey: string, raw: unknown) {
    requirePermission(actor, "review");
    const request = IopExceptionReviewRequestSchema.parse(raw);
    const requestHash = hash({ issueKey, ...request });
    return withTenantContext(this.prisma, actor.organizationId, async (tx) => {
      const record = await tx.iopReconciliationImport.findFirst({
        where: { id, organizationId: actor.organizationId },
      });
      if (!record) throw new IopReconciliationError("resource_not_found", 404);
      if (record.revision !== request.expectedRevision)
        throw new IopReconciliationError("version_conflict", 409);
      const existing = await tx.iopReconciliationExceptionReview.findFirst({
        where: { organizationId: actor.organizationId, idempotencyKey: request.idempotencyKey },
      });
      if (existing) {
        if (existing.requestHash === requestHash) return { review: existing, replayed: true };
        throw new IopReconciliationError("idempotency_key_reused", 409);
      }
      const payload = record.payload as unknown as { reconciliation: unknown };
      const issues = validateIopReconciliationSample(payload.reconciliation).issues;
      if (!issues.some((issue) => issue.issueKey === issueKey))
        throw new IopReconciliationError("reconciliation_issue_not_found", 404);
      const review = await tx.iopReconciliationExceptionReview.create({
        data: {
          organizationId: actor.organizationId,
          importId: record.id,
          idempotencyKey: request.idempotencyKey,
          requestHash,
          issueKey,
          disposition: request.disposition,
          reason: request.reason,
          reviewerId: actor.userId,
        },
      });
      await new PrismaCaseAuditWriter().write(tx, {
        organizationId: actor.organizationId,
        caseId: null,
        actor: { actorId: actor.userId, actorType: "USER" },
        action: "iop_reconciliation_exception_reviewed",
        objectType: "iop_reconciliation_exception_review",
        objectId: review.id,
        reason: request.reason,
        metadata: { importId: record.id, issueKey, disposition: request.disposition },
        occurredAt: new Date(),
      });
      return { review, replayed: false };
    });
  }

  async close(actor: AuthenticatedPrincipal, id: string, raw: unknown) {
    requirePermission(actor, "close");
    const request = IopCloseRequestSchema.parse(raw);
    const requestHash = hash(request);
    return withTenantContext(this.prisma, actor.organizationId, async (tx) => {
      const record = await tx.iopReconciliationImport.findFirst({
        where: { id, organizationId: actor.organizationId },
        include: { exceptionReviews: true },
      });
      if (!record) throw new IopReconciliationError("resource_not_found", 404);
      if (record.revision !== request.expectedRevision)
        throw new IopReconciliationError("version_conflict", 409);
      const existing = await tx.iopReconciliationCloseReceipt.findFirst({
        where: { organizationId: actor.organizationId, importId: id },
      });
      if (existing) {
        if (existing.idempotencyKey === request.idempotencyKey && existing.requestHash === requestHash)
          return { receipt: existing, replayed: true };
        throw new IopReconciliationError("reconciliation_already_closed", 409);
      }
      const payload = record.payload as unknown as { reconciliation: unknown };
      const result = validateIopReconciliationSample(payload.reconciliation);
      const reviewedIssueKeys = new Set(record.exceptionReviews.map((review) => review.issueKey));
      const unresolved = result.issues.filter((issue) => !reviewedIssueKeys.has(issue.issueKey));
      if (unresolved.length)
        throw new IopReconciliationError("unreviewed_exceptions", 400);
      const receipt = await tx.iopReconciliationCloseReceipt.create({
        data: {
          organizationId: actor.organizationId,
          importId: record.id,
          idempotencyKey: request.idempotencyKey,
          requestHash,
          reviewerId: actor.userId,
          reason: request.reason,
          sourceCutoffAt: record.cutoffAt,
          issueCount: result.issues.length,
          reviewedCount: reviewedIssueKeys.size,
        },
      });
      await new PrismaCaseAuditWriter().write(tx, {
        organizationId: actor.organizationId,
        caseId: null,
        actor: { actorId: actor.userId, actorType: "USER" },
        action: "iop_reconciliation_closed",
        objectType: "iop_reconciliation_close_receipt",
        objectId: receipt.id,
        reason: request.reason,
        metadata: { importId: record.id, sourceCutoffAt: record.cutoffAt.toISOString(), issueCount: result.issues.length },
        occurredAt: new Date(),
      });
      return { receipt, replayed: false };
    });
  }
}
