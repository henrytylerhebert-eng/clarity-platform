import { createHash } from "node:crypto";
import {
  type ComplianceExportManifest,
  type ComplianceExportPackage,
  type ExportAuditLogCommand,
  ExportAuditLogCommandSchema,
  NetworkEnrichmentDomainError,
  type NetworkReviewAuditEvent,
} from "@clarity/domain-contracts";
import type { NetworkReviewGateway } from "./reviewGateway.js";

export function computeAuditStreamHash(
  organizationId: string,
  reviewPackageId: string,
  events: readonly NetworkReviewAuditEvent[],
): string {
  const sorted = [...events].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );

  const payload = JSON.stringify({
    organizationId,
    reviewPackageId,
    events: sorted.map((e) => ({
      action: e.action,
      actorId: e.actorId,
      actorType: e.actorType,
      commandId: e.commandId,
      correlationId: e.correlationId ?? null,
      reason: e.reason ?? null,
      occurredAt: e.occurredAt,
    })),
  });

  return createHash("sha256").update(payload).digest("hex");
}

export class NetworkEnrichmentComplianceExporter {
  constructor(
    private readonly gateway: NetworkReviewGateway,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async generateExportPackage(
    input: ExportAuditLogCommand,
  ): Promise<ComplianceExportPackage> {
    const cmd = ExportAuditLogCommandSchema.parse(input);

    const packageRecord = await this.gateway.getPackageById({
      organizationId: cmd.organizationId,
      reviewPackageId: cmd.reviewPackageId,
    });
    if (!packageRecord) {
      throw new NetworkEnrichmentDomainError(
        "NOT_FOUND",
        `Review package ${cmd.reviewPackageId} not found.`,
      );
    }

    const reviews = await this.gateway.getReviewsByPackageId({
      organizationId: cmd.organizationId,
      reviewPackageId: cmd.reviewPackageId,
    });

    const conflicts = cmd.includeConflictsMatrix
      ? await this.gateway.getConflictsByPackageId({
          organizationId: cmd.organizationId,
          reviewPackageId: cmd.reviewPackageId,
        })
      : [];

    const auditTimeline: NetworkReviewAuditEvent[] = [];
    for (const r of reviews) {
      if (r.audits) {
        auditTimeline.push(...r.audits);
      }
    }

    auditTimeline.sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    );

    const generatedAt = this.now();
    const integrityHash = computeAuditStreamHash(
      cmd.organizationId,
      cmd.reviewPackageId,
      auditTimeline,
    );

    const manifest: ComplianceExportManifest = {
      exportId: `exp-${cmd.reviewPackageId}-${Date.now()}`,
      organizationId: cmd.organizationId,
      reviewPackageId: cmd.reviewPackageId,
      generatedAt,
      generatedByActorId: cmd.actor.actorId,
      recordCount: auditTimeline.length,
      integrityHashAlg: "SHA-256",
      integrityHash,
    };

    return {
      manifest,
      packageRecord,
      reviews,
      conflicts,
      auditTimeline,
    };
  }
}
