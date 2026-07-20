import {
  type NetworkReviewConflictRecord,
  type NetworkReviewFieldEvidenceRecord,
  type NetworkReviewPackageRecord,
  type NetworkReviewReplayInput,
  type NetworkReviewRecord,
} from "@clarity/domain-contracts";
import type { NetworkReviewServiceResult } from "./reviewCommands.js";

export type NetworkReviewReplayRecord = {
  readonly commandType: string;
  readonly commandFingerprint: string;
  readonly result: unknown;
};

export interface NetworkReviewReplaySaveInput {
  readonly commandType: string;
  readonly idempotencyKey: string;
  readonly commandFingerprint: string;
  readonly result: unknown;
}

export interface NetworkReviewGateway {
  listPackages(params: {
    organizationId: string;
  }): Promise<readonly NetworkReviewPackageRecord[]>;

  getPackageByCandidateId(params: {
    organizationId: string;
    sourceCandidateId: string;
  }): Promise<readonly NetworkReviewPackageRecord[]>;

  getReviewById(params: {
    organizationId: string;
    reviewId: string;
  }): Promise<NetworkReviewRecord | undefined>;

  getReviewsByPackageId(params: {
    organizationId: string;
    reviewPackageId: string;
  }): Promise<readonly NetworkReviewRecord[]>;

  getPackageById(params: {
    organizationId: string;
    reviewPackageId: string;
  }): Promise<NetworkReviewPackageRecord | undefined>;

  getConflictsByPackageId(params: {
    organizationId: string;
    reviewPackageId: string;
  }): Promise<readonly NetworkReviewConflictRecord[]>;

  getEvidenceByReviewId(params: {
    organizationId: string;
    reviewId: string;
  }): Promise<readonly NetworkReviewFieldEvidenceRecord[]>;

  saveReview(
    record: NetworkReviewRecord,
    params?: {
      packageRecord?: NetworkReviewPackageRecord;
      replay?: NetworkReviewReplaySaveInput;
      supersedeReviewIds?: readonly string[];
      conflicts?: readonly NetworkReviewConflictRecord[];
      fieldEvidenceRecords?: readonly NetworkReviewFieldEvidenceRecord[];
    },
  ): Promise<void>;

  savePackage(
    record: NetworkReviewPackageRecord,
    params?: {
      replay?: NetworkReviewReplaySaveInput;
    },
  ): Promise<void>;

  getReplayRecord(
    input: Omit<NetworkReviewReplayInput, "fingerprint">,
  ): Promise<NetworkReviewReplayRecord | undefined>;

  saveReplayRecord?(
    input: Omit<NetworkReviewReplayInput, "fingerprint"> & { fingerprint?: string },
    result: NetworkReviewServiceResult,
  ): Promise<void>;
}

const reviewStorageKey = (organizationId: string, reviewId: string): string =>
  `${organizationId}:${reviewId}`;

const packageStorageKey = (organizationId: string, reviewPackageId: string): string =>
  `${organizationId}:${reviewPackageId}`;

const conflictStorageKey = (organizationId: string, conflictId: string): string =>
  `${organizationId}:${conflictId}`;

const replayStorageKey = (organizationId: string, commandType: string, idempotencyKey: string): string =>
  `${organizationId}:${commandType}:${idempotencyKey}`;

const _evidenceStorageKey = (organizationId: string, reviewId: string, evidenceId: string): string =>
  `${organizationId}:${reviewId}:${evidenceId}`;

/** In-memory baseline for Packet 11 tests and fast command-level work. */
export class InMemoryNetworkReviewGateway implements NetworkReviewGateway {
  private readonly reviews = new Map<string, NetworkReviewRecord>();
  private readonly packages = new Map<string, NetworkReviewPackageRecord>();
  private readonly conflicts = new Map<string, NetworkReviewConflictRecord>();
  private readonly evidence = new Map<string, NetworkReviewFieldEvidenceRecord>();
  private readonly reviewEvidence = new Map<string, string[]>();
  private readonly replayIndex = new Map<string, NetworkReviewReplayRecord>();

  async listPackages(params: {
    organizationId: string;
  }): Promise<readonly NetworkReviewPackageRecord[]> {
    const targetOrgPrefix = `${params.organizationId}:`;
    return Array.from(this.packages.values())
      .filter((pkg) => `${pkg.organizationId}:`.startsWith(targetOrgPrefix))
      .map((pkg) => structuredClone(pkg));
  }

  async getPackageById(params: {
    organizationId: string;
    reviewPackageId: string;
  }): Promise<NetworkReviewPackageRecord | undefined> {
    return this.packages.get(packageStorageKey(params.organizationId, params.reviewPackageId));
  }

  async getPackageByCandidateId(params: {
    organizationId: string;
    sourceCandidateId: string;
  }): Promise<readonly NetworkReviewPackageRecord[]> {
    const targetOrgPrefix = `${params.organizationId}:`;
    return Array.from(this.packages.values())
      .filter((pkg) => `${pkg.organizationId}:`.startsWith(targetOrgPrefix) && pkg.sourceCandidateId === params.sourceCandidateId)
      .map((pkg) => structuredClone(pkg));
  }

  async getReviewById(params: {
    organizationId: string;
    reviewId: string;
  }): Promise<NetworkReviewRecord | undefined> {
    const row = this.reviews.get(reviewStorageKey(params.organizationId, params.reviewId));
    return row ? structuredClone(row) : undefined;
  }

  async getReviewsByPackageId(params: {
    organizationId: string;
    reviewPackageId: string;
  }): Promise<readonly NetworkReviewRecord[]> {
    return Array.from(this.reviews.values())
      .filter(
        (review) =>
          review.organizationId === params.organizationId && review.reviewPackageId === params.reviewPackageId,
      )
      .map((review) => structuredClone(review));
  }

  async getConflictsByPackageId(params: {
    organizationId: string;
    reviewPackageId: string;
  }): Promise<readonly NetworkReviewConflictRecord[]> {
    return Array.from(this.conflicts.values())
      .filter(
        (conflict) =>
          conflict.organizationId === params.organizationId && conflict.reviewPackageId === params.reviewPackageId,
      )
      .map((conflict) => structuredClone(conflict));
  }

  async getEvidenceByReviewId(params: {
    organizationId: string;
    reviewId: string;
  }): Promise<readonly NetworkReviewFieldEvidenceRecord[]> {
    const keys = this.reviewEvidence.get(reviewStorageKey(params.organizationId, params.reviewId)) ?? [];
    const rows = keys
      .map((evidenceId) => this.evidence.get(evidenceId))
      .filter((item): item is NetworkReviewFieldEvidenceRecord => Boolean(item));
    return rows.map((row) => structuredClone(row));
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
    if (params?.supersedeReviewIds?.length) {
      for (const supersedeReviewId of params.supersedeReviewIds) {
        const existing = this.reviews.get(reviewStorageKey(record.organizationId, supersedeReviewId));
        if (!existing || existing.reviewPackageId !== record.reviewPackageId) {
          continue;
        }
        if (existing.status === "SUPERSEDED" || existing.status === "DEPRECATED") {
          continue;
        }
        const updatedAt = record.updatedAt;
        this.reviews.set(
          reviewStorageKey(record.organizationId, supersedeReviewId),
          {
            ...existing,
            status: "SUPERSEDED",
            supersededByReviewId: record.reviewId,
            version: existing.version + 1,
            reviewedAt: record.reviewedAt ?? existing.reviewedAt,
            reviewedByActorId: record.reviewedByActorId ?? existing.reviewedByActorId,
            updatedAt,
            audits: structuredClone(existing.audits),
          },
        );
      }
    }

    const existing = this.reviews.get(reviewStorageKey(record.organizationId, record.reviewId));
    if (record.version > 1) {
      if (!existing) {
        throw new Error("review not found");
      }
      if (existing.version !== record.version - 1) {
        throw new Error("review concurrency conflict");
      }
    } else if (existing) {
      throw new Error("review already exists");
    }

    this.reviews.set(reviewStorageKey(record.organizationId, record.reviewId), structuredClone(record));

    if (params?.packageRecord) {
      const packageKey = packageStorageKey(record.organizationId, params.packageRecord.reviewPackageId);
      const existingPackage = this.packages.get(packageKey);
      if (params.packageRecord.version > 1) {
        if (!existingPackage) {
          throw new Error("package not found");
        }
        if (existingPackage.version !== params.packageRecord.version - 1) {
          throw new Error("package concurrency conflict");
        }
      } else if (existingPackage && existingPackage.version !== params.packageRecord.version) {
        throw new Error("package conflict");
      }
      this.packages.set(packageKey, {
        ...existingPackage,
        ...params.packageRecord,
        updatedAt: record.updatedAt,
      });
    }

    if (params?.conflicts?.length) {
      for (const conflict of params.conflicts) {
        this.conflicts.set(conflictStorageKey(conflict.organizationId, conflict.conflictId), structuredClone(conflict));
      }
    }

    if (params?.fieldEvidenceRecords?.length) {
      const evidenceRefs = [...(this.reviewEvidence.get(reviewStorageKey(record.organizationId, record.reviewId)) ?? [])];
      for (const [index, incoming] of params.fieldEvidenceRecords.entries()) {
        const evidenceId =
          incoming.evidenceId ?? `evidence-${record.reviewId}-${index}-${record.updatedAt}`;
        const evidenceRecord: NetworkReviewFieldEvidenceRecord = {
          reviewId: incoming.reviewId,
          evidenceId,
          evidenceType: incoming.evidenceType,
          payload: incoming.payload,
          evidenceSource: incoming.evidenceSource,
        };
        this.evidence.set(evidenceId, evidenceRecord);
        if (!evidenceRefs.includes(evidenceId)) {
          evidenceRefs.push(evidenceId);
        }
      }
      this.reviewEvidence.set(reviewStorageKey(record.organizationId, record.reviewId), evidenceRefs);
    }

    if (params?.replay) {
      this.replayIndex.set(
        replayStorageKey(record.organizationId, params.replay.commandType, params.replay.idempotencyKey),
        {
          commandType: params.replay.commandType,
          commandFingerprint: params.replay.commandFingerprint,
          result: structuredClone(params.replay.result),
        },
      );
    }
  }

  async savePackage(
    record: NetworkReviewPackageRecord,
    params?: {
      replay?: NetworkReviewReplaySaveInput;
    },
  ): Promise<void> {
    const packageKey = packageStorageKey(record.organizationId, record.reviewPackageId);
    const existingPackage = this.packages.get(packageKey);
    if (record.version > 1) {
      if (!existingPackage) {
        throw new Error("package not found");
      }
      if (existingPackage.version !== record.version - 1) {
        throw new Error("package concurrency conflict");
      }
    } else if (existingPackage && existingPackage.version >= record.version) {
      throw new Error("package already exists");
    }

    this.packages.set(packageKey, structuredClone(record));

    if (params?.replay) {
      this.replayIndex.set(
        replayStorageKey(record.organizationId, params.replay.commandType, params.replay.idempotencyKey),
        {
          commandType: params.replay.commandType,
          commandFingerprint: params.replay.commandFingerprint,
          result: structuredClone(params.replay.result),
        },
      );
    }
  }

  async getReplayRecord(
    input: Omit<NetworkReviewReplayInput, "fingerprint">,
  ): Promise<NetworkReviewReplayRecord | undefined> {
    return this.replayIndex.get(replayStorageKey(input.organizationId, input.commandType, input.idempotencyKey));
  }

  async saveReplayRecord(
    input: Omit<NetworkReviewReplayInput, "fingerprint"> & { fingerprint?: string },
    result: NetworkReviewServiceResult,
  ): Promise<void> {
    this.replayIndex.set(
      replayStorageKey(input.organizationId, input.commandType, input.idempotencyKey),
      {
        commandType: input.commandType,
        commandFingerprint: input.fingerprint ?? "",
        result: structuredClone(result),
      },
    );
  }
}

export { PrismaNetworkReviewGateway } from "./prismaReviewGateway.js";
