import {
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

  saveReview(
    record: NetworkReviewRecord,
    params?: {
      packageRecord?: NetworkReviewPackageRecord;
      replay?: NetworkReviewReplaySaveInput;
      supersedeReviewIds?: readonly string[];
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
const replayStorageKey = (organizationId: string, commandType: string, idempotencyKey: string): string =>
  `${organizationId}:${commandType}:${idempotencyKey}`;

/** In-memory baseline for Packet 11 tests and fast command-level work. */
export class InMemoryNetworkReviewGateway implements NetworkReviewGateway {
  private readonly reviews = new Map<string, NetworkReviewRecord>();
  private readonly packages = new Map<string, NetworkReviewPackageRecord>();
  private readonly replayIndex = new Map<string, NetworkReviewReplayRecord>();

  async getPackageById(params: {
    organizationId: string;
    reviewPackageId: string;
  }): Promise<NetworkReviewPackageRecord | undefined> {
    return this.packages.get(packageStorageKey(params.organizationId, params.reviewPackageId));
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
    const targetOrgPrefix = `${params.organizationId}:`;
    return Array.from(this.reviews.values())
      .filter((review) =>
        `${review.organizationId}:${review.reviewId}`.startsWith(targetOrgPrefix) &&
        review.reviewPackageId === params.reviewPackageId,
      )
      .map((review) => structuredClone(review));
  }

  async saveReview(
    record: NetworkReviewRecord,
    params?: {
      packageRecord?: NetworkReviewPackageRecord;
      replay?: NetworkReviewReplaySaveInput;
      supersedeReviewIds?: readonly string[];
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
      this.packages.set(packageStorageKey(record.organizationId, params.packageRecord.reviewPackageId), {
        ...params.packageRecord,
        updatedAt: record.updatedAt,
      });
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
    this.packages.set(packageStorageKey(record.organizationId, record.reviewPackageId), structuredClone(record));
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

/** Packet 11 adapter for focused tests and runtime composition in a persistent runtime. */
export class PrismaNetworkReviewGateway implements NetworkReviewGateway {
  // Implemented in a separate file to keep reviewGateway defaults lightweight.
  async getPackageById(): Promise<NetworkReviewPackageRecord | undefined> {
    throw new Error("Prisma-backed NetworkReviewGateway is implemented in prismaReviewGateway.ts");
  }

  async getReviewById(): Promise<NetworkReviewRecord | undefined> {
    throw new Error("Prisma-backed NetworkReviewGateway is implemented in prismaReviewGateway.ts");
  }

  async getReviewsByPackageId(): Promise<readonly NetworkReviewRecord[]> {
    throw new Error("Prisma-backed NetworkReviewGateway is implemented in prismaReviewGateway.ts");
  }

  async saveReview(): Promise<void> {
    throw new Error("Prisma-backed NetworkReviewGateway is implemented in prismaReviewGateway.ts");
  }

  async savePackage(): Promise<void> {
    throw new Error("Prisma-backed NetworkReviewGateway is implemented in prismaReviewGateway.ts");
  }

  async getReplayRecord(): Promise<NetworkReviewReplayRecord | undefined> {
    throw new Error("Prisma-backed NetworkReviewGateway is implemented in prismaReviewGateway.ts");
  }
}
