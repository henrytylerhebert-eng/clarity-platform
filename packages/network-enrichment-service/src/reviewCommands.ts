import {
  type ApproveReviewCommand,
  type ReconcilePackageCommand,
  type ReconcilePackageResult,
  type NetworkReviewPackageRecord,
  type NetworkReviewRecord,
  type NetworkCommandResult,
  type NetworkReviewReplayInput,
  type NetworkReviewSubmitResult,
  type NetworkReviewTransitionResult,
  type SubmitForReviewCommand,
  type RejectReviewCommand,
  assertUserRoleOverlap,
  ApproveReviewCommandSchema,
  ReconcilePackageCommandSchema,
  NETWORK_ENRICHMENT_REVIEW_STATES,
  NETWORK_REVIEW_FIELD_POLICIES,
  isReviewTransitionAllowed,
  NetworkEnrichmentDomainError,
  resolveCanonicalRolesFromSourceRoles,
  NetworkReviewAuditEvent,
  RejectReviewCommandSchema,
  SubmitForReviewCommandSchema,
} from "@clarity/domain-contracts";
import { type NetworkReviewGateway } from "./reviewGateway.js";

const defaultNow = (): string => new Date().toISOString();

function commandFingerprint(payload: unknown): string {
  return JSON.stringify(payload);
}

function asAuditEvent(
  params: {
    action: NetworkReviewAuditEvent["action"];
    actorId: string;
    actorType: NetworkReviewAuditEvent["actorType"];
    commandId: string;
    correlationId: string | undefined;
    reason: string | null;
    occurredAt: string;
  },
): NetworkReviewAuditEvent {
  return {
    action: params.action,
    actorId: params.actorId,
    actorType: params.actorType,
    commandId: params.commandId,
    correlationId: params.correlationId,
    reason: params.reason,
    occurredAt: params.occurredAt,
  };
}

function transitionReview(
  review: NetworkReviewRecord,
  toStatus: (typeof NETWORK_ENRICHMENT_REVIEW_STATES)[number],
  now: string,
): NetworkReviewRecord {
  if (!isReviewTransitionAllowed(review.status, toStatus)) {
    throw new NetworkEnrichmentDomainError(
      "VALIDATION",
      `Cannot transition review from ${review.status} to ${toStatus}.`,
    );
  }
  return {
    ...review,
    status: toStatus,
    version: review.version + 1,
    updatedAt: now,
  };
}

export class NetworkEnrichmentReviewCommandService {
  constructor(
    private readonly gateway: NetworkReviewGateway,
    private readonly now: () => string = defaultNow,
  ) {}

  async submitForReview(
    input: SubmitForReviewCommand,
  ): Promise<NetworkCommandResult<NetworkReviewSubmitResult>> {
    const cmd = SubmitForReviewCommandSchema.parse(input);
    const requiredCanonicalRoles = resolveCanonicalRolesFromSourceRoles(cmd.sourceReviewerRoles);
    assertUserRoleOverlap(requiredCanonicalRoles, cmd.actor.roles, "submitForReview");

    const replay = await this.handleReplay(
      {
        organizationId: cmd.organizationId,
        commandType: "submitForReview",
        idempotencyKey: cmd.idempotencyKey,
      },
      cmd,
      async () => {
        const existing = await this.gateway.getReviewById({
          organizationId: cmd.organizationId,
          reviewId: cmd.reviewId,
        });
        if (existing) {
          throw new NetworkEnrichmentDomainError(
            "CONFLICT",
            `Review ${cmd.reviewId} already exists for this organization.`,
          );
        }

        const createdAt = this.now();
        const review: NetworkReviewRecord = {
          reviewPackageId: cmd.reviewPackageId ?? cmd.reviewId,
          reviewId: cmd.reviewId,
          organizationId: cmd.organizationId,
          caseId: cmd.caseId,
          sourceCandidateId: cmd.sourceCandidateId,
          fieldPath: cmd.fieldPath,
          sensitivityCategory: cmd.sensitivityCategory ?? "NORMAL_OPERATIONAL",
          sourceReviewerRoles: cmd.sourceReviewerRoles,
          currentValue: cmd.currentValue,
          proposedValue: cmd.proposedValue,
          requiredCanonicalRoles,
          status: "REVIEW_PENDING",
          version: 1,
          createdByActorId: cmd.actor.actorId,
          createdAt,
          updatedAt: createdAt,
          audits: [
            asAuditEvent({
              action: "SUBMIT_FOR_REVIEW",
              actorId: cmd.actor.actorId,
              actorType: cmd.actor.actorType,
              commandId: `submitForReview:${cmd.reviewId}`,
              correlationId: cmd.correlationId,
              reason: cmd.reason ?? null,
              occurredAt: createdAt,
            }),
          ],
        };

        const packageRecord: NetworkReviewPackageRecord = {
          reviewPackageId: review.reviewPackageId,
          organizationId: cmd.organizationId,
          caseId: cmd.caseId,
          sourceCandidateId: cmd.sourceCandidateId,
          status: "UNRESEARCHED",
          version: 1,
          submittedByActorId: cmd.actor.actorId,
          createdAt,
          updatedAt: createdAt,
        };
        await this.gateway.saveReview(review, { packageRecord });
        return { review };
      },
    );
    return replay;
  }

  async approveReview(
    input: ApproveReviewCommand,
  ): Promise<NetworkCommandResult<NetworkReviewTransitionResult>> {
    const cmd = ApproveReviewCommandSchema.parse(input);
    const replay = await this.handleReplay(
      {
        organizationId: cmd.organizationId,
        commandType: "approveReview",
        idempotencyKey: cmd.idempotencyKey,
      },
      cmd,
      async () => {
        const review = await this.requireReview(cmd.organizationId, cmd.reviewId);
        assertUserRoleOverlap(review.requiredCanonicalRoles, cmd.actor.roles, "approveReview");

        if (cmd.expectedVersion !== review.version) {
          throw new NetworkEnrichmentDomainError(
            "CONCURRENCY_CONFLICT",
            "Review version mismatch.",
          );
        }

        const now = this.now();
        const approvalAudit = asAuditEvent({
          action: "APPROVE_REVIEW",
          actorId: cmd.actor.actorId,
          actorType: cmd.actor.actorType,
          commandId: `approveReview:${cmd.reviewId}`,
          correlationId: cmd.correlationId,
          reason: cmd.actorNotes ?? null,
          occurredAt: now,
        });

        // Dual-review enforcement (NETWORK_REVIEW_FIELD_POLICIES): when the
        // field's sensitivity policy says one review does NOT suffice,
        // HUMAN_CONFIRMED requires approvals from two DISTINCT reviewers.
        // The first approval is recorded on the audit trail without a state
        // change; the same actor approving twice never satisfies it.
        const policy = NETWORK_REVIEW_FIELD_POLICIES[review.sensitivityCategory];
        if (!policy.oneReviewSuffices) {
          if (!isReviewTransitionAllowed(review.status, "HUMAN_CONFIRMED")) {
            throw new NetworkEnrichmentDomainError(
              "VALIDATION",
              `Cannot approve a review in status ${review.status}.`,
            );
          }
          const priorApprovers = new Set(
            review.audits.filter((a) => a.action === "APPROVE_REVIEW").map((a) => a.actorId),
          );
          if (priorApprovers.has(cmd.actor.actorId)) {
            throw new NetworkEnrichmentDomainError(
              "VALIDATION",
              "This field's policy requires a second, distinct reviewer; the same actor cannot approve twice.",
            );
          }
          if (priorApprovers.size === 0) {
            const firstApproval: NetworkReviewRecord = {
              ...review,
              version: review.version + 1,
              updatedAt: now,
              audits: [...review.audits, approvalAudit],
            };
            await this.gateway.saveReview(firstApproval);
            return { review: firstApproval };
          }
        }

        const nextReview: NetworkReviewRecord = {
          ...transitionReview(review, "HUMAN_CONFIRMED", now),
          reviewedByActorId: cmd.actor.actorId,
          reviewReason: cmd.actorNotes ?? null,
          updatedAt: now,
          audits: [...review.audits, approvalAudit],
        };
        await this.gateway.saveReview(nextReview);
        return { review: nextReview };
      },
    );
    return replay;
  }

  async rejectReview(
    input: RejectReviewCommand,
  ): Promise<NetworkCommandResult<NetworkReviewTransitionResult>> {
    const cmd = RejectReviewCommandSchema.parse(input);
    const replay = await this.handleReplay(
      {
        organizationId: cmd.organizationId,
        commandType: "rejectReview",
        idempotencyKey: cmd.idempotencyKey,
      },
      cmd,
      async () => {
        const review = await this.requireReview(cmd.organizationId, cmd.reviewId);
        assertUserRoleOverlap(review.requiredCanonicalRoles, cmd.actor.roles, "rejectReview");

        if (cmd.expectedVersion !== review.version) {
          throw new NetworkEnrichmentDomainError(
            "CONCURRENCY_CONFLICT",
            "Review version mismatch.",
          );
        }

        const now = this.now();
        const nextReview: NetworkReviewRecord = {
          ...transitionReview(review, "REJECTED", now),
          reviewedByActorId: cmd.actor.actorId,
          reviewReason: cmd.rejectionReason,
          updatedAt: now,
          audits: [
            ...review.audits,
            asAuditEvent({
              action: "REJECT_REVIEW",
              actorId: cmd.actor.actorId,
              actorType: cmd.actor.actorType,
              commandId: `rejectReview:${cmd.reviewId}`,
              correlationId: cmd.correlationId,
              reason: cmd.rejectionReason,
              occurredAt: now,
            }),
          ],
        };
        await this.gateway.saveReview(nextReview);
        return { review: nextReview };
      },
    );
    return replay;
  }

  private async requireReview(
    organizationId: string,
    reviewId: string,
  ): Promise<NetworkReviewRecord> {
    const review = await this.gateway.getReviewById({ organizationId, reviewId });
    if (!review) {
      throw new NetworkEnrichmentDomainError("NOT_FOUND", `Review ${reviewId} not found.`);
    }
    return review;
  }

  async reconcilePackage(input: ReconcilePackageCommand): Promise<NetworkCommandResult<ReconcilePackageResult>> {
    const cmd = ReconcilePackageCommandSchema.parse(input);
    const result = await this.handleReplay(
      {
        organizationId: cmd.organizationId,
        commandType: "reconcilePackage",
        idempotencyKey: cmd.idempotencyKey,
      },
      cmd,
      async () => {
        const pkg = await this.gateway.getPackageById({
          organizationId: cmd.organizationId,
          reviewPackageId: cmd.reviewPackageId,
        });
        if (!pkg) {
          throw new NetworkEnrichmentDomainError("NOT_FOUND", `Review package ${cmd.reviewPackageId} not found.`);
        }
        if (pkg.version !== cmd.expectedVersion) {
          throw new NetworkEnrichmentDomainError("CONCURRENCY_CONFLICT", "Package version mismatch.");
        }

        const reviews = await this.gateway.getReviewsByPackageId({
          organizationId: cmd.organizationId,
          reviewPackageId: cmd.reviewPackageId,
        });

        const promotedFieldPaths = reviews
          .filter((r) => r.status === "HUMAN_CONFIRMED")
          .map((r) => r.fieldPath);

        // Reconciliation gate: a package may only become HUMAN_CONFIRMED on
        // the strength of actual human-confirmed reviews, and never while
        // any of its reviews is still awaiting review or in conflict.
        if (promotedFieldPaths.length === 0) {
          throw new NetworkEnrichmentDomainError(
            "VALIDATION",
            "Cannot reconcile a package with no HUMAN_CONFIRMED reviews.",
          );
        }
        const unresolved = reviews.filter(
          (r) => r.status === "REVIEW_PENDING" || r.status === "CONFLICT",
        );
        if (unresolved.length > 0) {
          throw new NetworkEnrichmentDomainError(
            "VALIDATION",
            `Cannot reconcile: ${unresolved.length} review(s) are still pending or in conflict.`,
          );
        }

        const now = this.now();
        const updatedPkg: NetworkReviewPackageRecord = {
          ...pkg,
          status: "HUMAN_CONFIRMED",
          version: pkg.version + 1,
          // No canonical/CRM write occurs here — the status reason must not
          // claim promotion beyond what actually happened.
          packageStatusReason:
            cmd.notes ?? "Package reconciled from human-confirmed reviews; no canonical write performed",
          updatedAt: now,
        };

        await this.gateway.savePackage(updatedPkg, {
          replay: {
            commandType: "reconcilePackage",
            idempotencyKey: cmd.idempotencyKey,
            commandFingerprint: commandFingerprint(cmd),
            result: { packageRecord: updatedPkg, promotedFieldPaths },
          },
        });

        return {
          packageRecord: updatedPkg,
          promotedFieldPaths,
        };
      },
    );
    return result;
  }

  private async handleReplay<T>(
    input: Omit<NetworkReviewReplayInput, "fingerprint">,
    command: unknown,
    action: () => Promise<T>,
  ): Promise<NetworkCommandResult<T>> {
    const fingerprint = commandFingerprint(command);
    const existing = await this.gateway.getReplayRecord?.(input);
    if (existing) {
      if (existing.commandFingerprint !== fingerprint) {
        throw new NetworkEnrichmentDomainError(
          "IDEMPOTENCY_CONFLICT",
          "Idempotency key was used with different command input.",
        );
      }
      return { value: existing.result as T, replayed: true };
    }

    const value = await action();
    await this.gateway.saveReplayRecord?.({ ...input, fingerprint }, value as NetworkReviewServiceResult);
    return { value, replayed: false };
  }
}

export type NetworkReviewServiceResult = NetworkReviewSubmitResult | NetworkReviewTransitionResult | ReconcilePackageResult;
