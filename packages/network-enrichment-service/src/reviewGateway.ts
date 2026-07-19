import {
  type NetworkReviewRecord,
  type NetworkReviewReplayInput,
  type NetworkReviewSubmitResult,
  type NetworkReviewTransitionResult,
} from "@clarity/domain-contracts";

export type NetworkReviewServiceResult = NetworkReviewSubmitResult | NetworkReviewTransitionResult;

export interface NetworkReviewReplayRecord {
  readonly commandFingerprint: string;
  readonly result: NetworkReviewServiceResult;
}

/** Synthetic, in-process persistence only for Packet 2. */
export interface NetworkReviewGateway {
  getReviewById(params: {
    organizationId: string;
    reviewId: string;
  }): Promise<NetworkReviewRecord | undefined>;

  saveReview(record: NetworkReviewRecord): Promise<void>;

  getReplayRecord(
    input: NetworkReviewReplayInput,
  ): Promise<NetworkReviewReplayRecord | undefined>;

  saveReplayRecord(
    input: NetworkReviewReplayInput,
    result: NetworkReviewServiceResult,
  ): Promise<void>;
}

const reviewStorageKey = (organizationId: string, reviewId: string): string =>
  `${organizationId}:${reviewId}`;

const replayStorageKey = (organizationId: string, commandType: string, idempotencyKey: string): string =>
  `${organizationId}:${commandType}:${idempotencyKey}`;

/** Packet-2 scoped in-memory gateway. No Prisma, no SQL, no outbound calls. */
export class InMemoryNetworkReviewGateway implements NetworkReviewGateway {
  private readonly reviews = new Map<string, NetworkReviewRecord>();
  private readonly replayIndex = new Map<string, NetworkReviewReplayRecord>();

  async getReviewById(params: {
    organizationId: string;
    reviewId: string;
  }): Promise<NetworkReviewRecord | undefined> {
    return this.reviews.get(reviewStorageKey(params.organizationId, params.reviewId));
  }

  async saveReview(record: NetworkReviewRecord): Promise<void> {
    this.reviews.set(reviewStorageKey(record.organizationId, record.reviewId), structuredClone(record));
  }

  async getReplayRecord(
    input: NetworkReviewReplayInput,
  ): Promise<NetworkReviewReplayRecord | undefined> {
    const key = replayStorageKey(input.organizationId, input.commandType, input.idempotencyKey);
    return this.replayIndex.get(key);
  }

  async saveReplayRecord(
    input: NetworkReviewReplayInput,
    result: NetworkReviewServiceResult,
  ): Promise<void> {
    const key = replayStorageKey(input.organizationId, input.commandType, input.idempotencyKey);
    this.replayIndex.set(key, {
      commandFingerprint: input.fingerprint,
      result: structuredClone(result),
    });
  }
}
