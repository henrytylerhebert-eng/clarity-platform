import type { PrismaClient } from "@prisma/client";
import {
  type NetworkReviewConflictRecord,
  type NetworkReviewFieldEvidenceRecord,
  type NetworkReviewPackageRecord,
  type NetworkReviewRecord,
  type NetworkReviewReplayInput,
  type NetworkReviewFieldSensitivity,
  type NetworkEnrichmentReviewState,
  type NetworkReviewPolicyState,
  type NetworkSourceReviewRole,
  type UserRole,
  type NetworkReviewAuditEvent,
} from "@clarity/domain-contracts";
import type { NetworkReviewGateway, NetworkReviewReplayRecord, NetworkReviewReplaySaveInput } from "./reviewGateway.js";
import type { NetworkReviewServiceResult } from "./reviewCommands.js";

function mapReviewFromPrisma(row: {
  reviewId: string;
  reviewPackageId: string;
  organizationId: string;
  caseId: string;
  sourceCandidateId: string;
  fieldPath: string;
  sensitivityCategory: string;
  requiredCanonicalRoles: unknown;
  createdByActorId: string;
  currentValue: unknown;
  proposedValue: unknown;
  sourceReviewerRoles: unknown;
  status: string;
  reviewPackageStatus: string | null;
  version: number;
  reviewRunId: string | null;
  reviewedByActorId: string | null;
  reviewReason: string | null;
  supersededByReviewId: string | null;
  createdAt: Date;
  updatedAt: Date;
  audits?: Array<{
    action: string;
    actorId: string;
    actorType: string;
    commandId: string;
    correlationId: string | null;
    reason: string | null;
    occurredAt: Date;
  }>;
}): NetworkReviewRecord {
  return {
    reviewId: row.reviewId,
    reviewPackageId: row.reviewPackageId,
    organizationId: row.organizationId,
    caseId: row.caseId,
    sourceCandidateId: row.sourceCandidateId,
    fieldPath: row.fieldPath,
    sensitivityCategory: row.sensitivityCategory as NetworkReviewFieldSensitivity,
    requiredCanonicalRoles: (row.requiredCanonicalRoles ?? []) as readonly UserRole[],
    createdByActorId: row.createdByActorId,
    currentValue: row.currentValue,
    proposedValue: row.proposedValue,
    sourceReviewerRoles: (row.sourceReviewerRoles ?? []) as readonly NetworkSourceReviewRole[],
    status: row.status as NetworkEnrichmentReviewState,
    reviewPackageStatus: (row.reviewPackageStatus ?? undefined) as NetworkReviewPolicyState | undefined,
    version: row.version,
    reviewRunId: row.reviewRunId,
    reviewedByActorId: row.reviewedByActorId ?? undefined,
    reviewReason: row.reviewReason,
    supersededByReviewId: row.supersededByReviewId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    audits: (row.audits ?? []).map((a) => ({
      action: a.action as NetworkReviewAuditEvent["action"],
      actorId: a.actorId,
      actorType: a.actorType as NetworkReviewAuditEvent["actorType"],
      commandId: a.commandId,
      correlationId: a.correlationId ?? undefined,
      reason: a.reason,
      occurredAt: a.occurredAt.toISOString(),
    })),
  };
}

function mapPackageFromPrisma(row: {
  reviewPackageId: string;
  organizationId: string;
  caseId: string;
  enrichmentRunId?: string;
  sourceCandidateId: string;
  networkEntityCandidateId?: string;
  status: string;
  version: number;
  submittedByActorId: string;
  assignedReviewerCategory: unknown;
  sourceRunId: string | null;
  packageStatusReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}): NetworkReviewPackageRecord {
  return {
    reviewPackageId: row.reviewPackageId,
    organizationId: row.organizationId,
    caseId: row.caseId,
    enrichmentRunId: row.enrichmentRunId ?? row.sourceRunId ?? `run-${row.reviewPackageId}`,
    sourceCandidateId: row.sourceCandidateId,
    networkEntityCandidateId: row.networkEntityCandidateId ?? row.sourceCandidateId,
    status: row.status as NetworkReviewPolicyState,
    version: row.version,
    submittedByActorId: row.submittedByActorId,
    assignedReviewerCategory: (row.assignedReviewerCategory ?? undefined) as readonly string[] | undefined,
    sourceRunId: row.sourceRunId ?? undefined,
    packageStatusReason: row.packageStatusReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class PrismaNetworkReviewGateway implements NetworkReviewGateway {
  constructor(private readonly prisma: PrismaClient) {}

  async getPackageByCandidateId(params: {
    organizationId: string;
    sourceCandidateId: string;
  }): Promise<readonly NetworkReviewPackageRecord[]> {
    const rows = await this.prisma.networkReviewPackage.findMany({
      where: {
        organizationId: params.organizationId,
        sourceCandidateId: params.sourceCandidateId,
      },
    });
    return rows.map(mapPackageFromPrisma);
  }

  async getPackageById(params: {
    organizationId: string;
    reviewPackageId: string;
  }): Promise<NetworkReviewPackageRecord | undefined> {
    const row = await this.prisma.networkReviewPackage.findFirst({
      where: {
        organizationId: params.organizationId,
        reviewPackageId: params.reviewPackageId,
      },
    });
    return row ? mapPackageFromPrisma(row) : undefined;
  }

  async getReviewById(params: {
    organizationId: string;
    reviewId: string;
  }): Promise<NetworkReviewRecord | undefined> {
    const row = await this.prisma.networkReview.findFirst({
      where: {
        organizationId: params.organizationId,
        reviewId: params.reviewId,
      },
      include: {
        audits: true,
      },
    });
    return row ? mapReviewFromPrisma(row) : undefined;
  }

  async getReviewsByPackageId(params: {
    organizationId: string;
    reviewPackageId: string;
  }): Promise<readonly NetworkReviewRecord[]> {
    const rows = await this.prisma.networkReview.findMany({
      where: {
        organizationId: params.organizationId,
        reviewPackageId: params.reviewPackageId,
      },
      include: {
        audits: true,
      },
    });
    return rows.map(mapReviewFromPrisma);
  }

  async getConflictsByPackageId(params: {
    organizationId: string;
    reviewPackageId: string;
  }): Promise<readonly NetworkReviewConflictRecord[]> {
    const rows = await this.prisma.networkReviewConflict.findMany({
      where: {
        organizationId: params.organizationId,
        reviewPackageId: params.reviewPackageId,
      },
    });
    return rows.map((r) => ({
      conflictId: r.conflictId,
      organizationId: r.organizationId,
      reviewPackageId: r.reviewPackageId,
      status: r.status as "OPEN" | "RESOLVED",
      reason: r.reason,
      relatedReviewIds: (r.relatedReviewIds ?? []) as readonly string[],
    }));
  }

  async getEvidenceByReviewId(params: {
    organizationId: string;
    reviewId: string;
  }): Promise<readonly NetworkReviewFieldEvidenceRecord[]> {
    const rows = await this.prisma.networkReviewFieldEvidence.findMany({
      where: {
        organizationId: params.organizationId,
        reviewId: params.reviewId,
      },
      include: {
        evidence: true,
      },
    });
    return rows.map((r) => ({
      reviewId: r.reviewId,
      evidenceType: r.evidence.evidenceType,
      payload: r.evidence.excerpt ? JSON.parse(r.evidence.excerpt) : {},
      evidenceSource: r.evidence.sourceUrl ?? "",
    }));
  }

  private async ensurePrismaPackage(
    tx: Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0],
    pkg: NetworkReviewPackageRecord,
    updatedAtDate: Date,
  ) {
    const runId = pkg.sourceRunId ?? `run-${pkg.reviewPackageId}`;
    const candId = pkg.sourceCandidateId;

    await tx.networkReviewRun.upsert({
      where: { runId },
      create: {
        runId,
        organizationId: pkg.organizationId,
        schemaVersion: "1.0",
        inputIdentity: "synthetic-scan",
        status: "COMPLETED",
        sourceType: "DIRECTORY_SCAN",
        createdByActorId: pkg.submittedByActorId,
        submittedAt: new Date(pkg.createdAt),
        createdAt: new Date(pkg.createdAt),
        updatedAt: updatedAtDate,
      },
      update: { updatedAt: updatedAtDate },
    });

    await tx.networkEntityCandidate.upsert({
      where: { candidateId: candId },
      create: {
        candidateId: candId,
        organizationId: pkg.organizationId,
        enrichmentRunId: runId,
        candidateEntityType: "FACILITY",
        requestedName: "Candidate Facility",
        requestedLocation: "Louisiana",
        normalizedSignals: {},
        resolutionStatus: "UNRESOLVED",
        candidateState: "PROPOSED",
        createdAt: new Date(pkg.createdAt),
        updatedAt: updatedAtDate,
      },
      update: { updatedAt: updatedAtDate },
    });

    await tx.networkReviewPackage.upsert({
      where: { reviewPackageId: pkg.reviewPackageId },
      create: {
        reviewPackageId: pkg.reviewPackageId,
        organizationId: pkg.organizationId,
        enrichmentRunId: runId,
        networkEntityCandidateId: candId,
        caseId: pkg.caseId,
        sourceCandidateId: pkg.sourceCandidateId,
        status: pkg.status,
        version: pkg.version,
        submittedByActorId: pkg.submittedByActorId,
        assignedReviewerCategory: pkg.assignedReviewerCategory as unknown as object,
        sourceRunId: pkg.sourceRunId ?? null,
        packageStatusReason: pkg.packageStatusReason ?? null,
        createdAt: new Date(pkg.createdAt),
        updatedAt: updatedAtDate,
      },
      update: {
        status: pkg.status,
        version: pkg.version,
        packageStatusReason: pkg.packageStatusReason ?? null,
        updatedAt: updatedAtDate,
      },
    });
  }

  async saveReview(
    record: NetworkReviewRecord,
    params?: {
      packageRecord?: NetworkReviewPackageRecord;
      replay?: NetworkReviewReplaySaveInput;
      supersedeReviewIds?: readonly string[];
      conflicts?: readonly NetworkReviewConflictRecord[];
      fieldEvidenceRecords?: readonly NetworkReviewFieldEvidenceRecord[];
    },
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const updatedAtDate = new Date(record.updatedAt);
      const pkgToSave: NetworkReviewPackageRecord = params?.packageRecord ?? {
        reviewPackageId: record.reviewPackageId,
        organizationId: record.organizationId,
        caseId: record.caseId,
        sourceCandidateId: record.sourceCandidateId,
        status: record.reviewPackageStatus ?? "UNRESEARCHED",
        version: 1,
        submittedByActorId: record.createdByActorId,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };

      await this.ensurePrismaPackage(tx, pkgToSave, updatedAtDate);

      if (params?.supersedeReviewIds?.length) {
        for (const supersedeReviewId of params.supersedeReviewIds) {
          const existing = await tx.networkReview.findFirst({
            where: {
              organizationId: record.organizationId,
              reviewId: supersedeReviewId,
            },
          });
          if (existing) {
            await tx.networkReview.update({
              where: { reviewId: existing.reviewId },
              data: {
                status: "SUPERSEDED",
                supersededByReviewId: record.reviewId,
                version: existing.version + 1,
                updatedAt: updatedAtDate,
              },
            });
          }
        }
      }

      const existingRecord = await tx.networkReview.findFirst({
        where: {
          organizationId: record.organizationId,
          reviewId: record.reviewId,
        },
      });

      if (record.version > 1) {
        if (!existingRecord) {
          throw new Error("review not found");
        }
        if (existingRecord.version !== record.version - 1) {
          throw new Error("review concurrency conflict");
        }
        await tx.networkReview.update({
          where: { reviewId: record.reviewId },
          data: {
            status: record.status,
            reviewPackageStatus: record.reviewPackageStatus ?? null,
            version: record.version,
            reviewedByActorId: record.reviewedByActorId ?? null,
            reviewReason: record.reviewReason ?? null,
            supersededByReviewId: record.supersededByReviewId ?? null,
            updatedAt: updatedAtDate,
          },
        });
      } else {
        if (existingRecord) {
          throw new Error("review already exists");
        }
        await tx.networkReview.create({
          data: {
            reviewId: record.reviewId,
            reviewPackageId: record.reviewPackageId,
            organizationId: record.organizationId,
            caseId: record.caseId,
            sourceCandidateId: record.sourceCandidateId,
            fieldPath: record.fieldPath,
            sensitivityCategory: record.sensitivityCategory,
            requiredCanonicalRoles: record.requiredCanonicalRoles as unknown as object,
            createdByActorId: record.createdByActorId,
            currentValue: record.currentValue as object,
            proposedValue: record.proposedValue as object,
            sourceReviewerRoles: record.sourceReviewerRoles as unknown as object,
            status: record.status,
            reviewPackageStatus: record.reviewPackageStatus ?? null,
            version: record.version,
            reviewRunId: record.reviewRunId ?? null,
            reviewedByActorId: record.reviewedByActorId ?? null,
            reviewReason: record.reviewReason ?? null,
            supersededByReviewId: record.supersededByReviewId ?? null,
            retrievedAt: new Date(record.createdAt),
            createdAt: new Date(record.createdAt),
            updatedAt: updatedAtDate,
          },
        });
      }

      if (record.audits.length) {
        for (const audit of record.audits) {
          const existingAudit = await tx.networkReviewAudit.findFirst({
            where: {
              reviewId: record.reviewId,
              commandId: audit.commandId,
            },
          });
          if (!existingAudit) {
            await tx.networkReviewAudit.create({
              data: {
                reviewId: record.reviewId,
                organizationId: record.organizationId,
                action: audit.action,
                actorId: audit.actorId,
                actorType: audit.actorType,
                commandId: audit.commandId,
                correlationId: audit.correlationId ?? null,
                reason: audit.reason ?? null,
                occurredAt: new Date(audit.occurredAt),
              },
            });
          }
        }
      }

      if (params?.fieldEvidenceRecords?.length) {
        for (const evidence of params.fieldEvidenceRecords) {
          const evId = `ev-${evidence.reviewId}-${Date.now()}`;
          const evRecord = await tx.networkReviewEvidence.create({
            data: {
              evidenceId: evId,
              organizationId: record.organizationId,
              evidenceType: evidence.evidenceType,
              sourceType: "EXTRACT",
              sourceStatus: "VERIFIED",
              sourceUrl: evidence.evidenceSource,
              retrievedAt: new Date(record.createdAt),
              excerpt: JSON.stringify(evidence.payload),
            },
          });

          await tx.networkReviewFieldEvidence.create({
            data: {
              reviewId: evidence.reviewId,
              evidenceId: evRecord.evidenceId,
              organizationId: record.organizationId,
            },
          });
        }
      }

      if (params?.conflicts?.length) {
        for (const conflict of params.conflicts) {
          await tx.networkReviewConflict.upsert({
            where: { conflictId: conflict.conflictId },
            create: {
              conflictId: conflict.conflictId,
              organizationId: conflict.organizationId,
              reviewPackageId: conflict.reviewPackageId,
              fieldPath: record.fieldPath,
              conflictType: "DATA_CONTRADICTION",
              status: conflict.status,
              reason: conflict.reason,
              relatedReviewIds: conflict.relatedReviewIds as unknown as object,
              updatedAt: updatedAtDate,
            },
            update: {
              status: conflict.status,
              reason: conflict.reason,
              relatedReviewIds: conflict.relatedReviewIds as unknown as object,
              updatedAt: updatedAtDate,
            },
          });
        }
      }

      if (params?.replay) {
        await tx.networkReviewReplay.upsert({
          where: {
            organizationId_commandType_idempotencyKey: {
              organizationId: record.organizationId,
              commandType: params.replay.commandType,
              idempotencyKey: params.replay.idempotencyKey,
            },
          },
          create: {
            organizationId: record.organizationId,
            commandType: params.replay.commandType,
            idempotencyKey: params.replay.idempotencyKey,
            commandFingerprint: params.replay.commandFingerprint,
            result: params.replay.result as object,
          },
          update: {
            commandFingerprint: params.replay.commandFingerprint,
            result: params.replay.result as object,
          },
        });
      }
    });
  }

  async savePackage(
    record: NetworkReviewPackageRecord,
    params?: {
      replay?: NetworkReviewReplaySaveInput;
    },
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.ensurePrismaPackage(tx, record, new Date(record.updatedAt));

      if (params?.replay) {
        await tx.networkReviewReplay.upsert({
          where: {
            organizationId_commandType_idempotencyKey: {
              organizationId: record.organizationId,
              commandType: params.replay.commandType,
              idempotencyKey: params.replay.idempotencyKey,
            },
          },
          create: {
            organizationId: record.organizationId,
            commandType: params.replay.commandType,
            idempotencyKey: params.replay.idempotencyKey,
            commandFingerprint: params.replay.commandFingerprint,
            result: params.replay.result as object,
          },
          update: {
            commandFingerprint: params.replay.commandFingerprint,
            result: params.replay.result as object,
          },
        });
      }
    });
  }

  async getReplayRecord(
    input: Omit<NetworkReviewReplayInput, "fingerprint">,
  ): Promise<NetworkReviewReplayRecord | undefined> {
    const row = await this.prisma.networkReviewReplay.findUnique({
      where: {
        organizationId_commandType_idempotencyKey: {
          organizationId: input.organizationId,
          commandType: input.commandType,
          idempotencyKey: input.idempotencyKey,
        },
      },
    });
    if (!row) return undefined;
    return {
      commandType: row.commandType,
      commandFingerprint: row.commandFingerprint,
      result: (row.result as unknown) as NetworkReviewServiceResult,
    };
  }

  async saveReplayRecord(
    input: Omit<NetworkReviewReplayInput, "fingerprint"> & { fingerprint?: string },
    result: NetworkReviewServiceResult,
  ): Promise<void> {
    await this.prisma.networkReviewReplay.upsert({
      where: {
        organizationId_commandType_idempotencyKey: {
          organizationId: input.organizationId,
          commandType: input.commandType,
          idempotencyKey: input.idempotencyKey,
        },
      },
      update: {
        commandFingerprint: input.fingerprint ?? "",
        result: result as any,
      },
      create: {
        organizationId: input.organizationId,
        commandType: input.commandType,
        idempotencyKey: input.idempotencyKey,
        commandFingerprint: input.fingerprint ?? "",
    });
  }
}
