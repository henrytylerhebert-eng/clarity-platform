import { beforeEach, describe, expect, it } from "vitest";
import { createNetworkEnrichmentReviewRuntimeAdapter } from "../src/reviewRuntimeAdapter.js";
import { invokeNetworkEnrichmentReviewCommand } from "../src/reviewRuntimeInvocation.js";
import type {
  CommandActor,
  NetworkReviewRecord,
  NetworkSourceReviewRole,
  UserRole,
} from "@clarity/domain-contracts";

const fixedNow = () => "2026-07-19T00:00:00.000Z";

const sourceRoles = (...roles: NetworkSourceReviewRole[]): NetworkSourceReviewRole[] => [...roles];

const actor = (actorId: string, roles: readonly UserRole[]): CommandActor => ({
  actorId,
  actorType: "USER",
  roles: [...roles],
});

type TypedReviewRecord = Pick<
  NetworkReviewRecord,
  "reviewedByActorId" | "reviewReason" | "audits"
>;

describe("invokeNetworkEnrichmentReviewCommand", () => {
  let adapter: ReturnType<typeof createNetworkEnrichmentReviewRuntimeAdapter>;

  beforeEach(() => {
    adapter = createNetworkEnrichmentReviewRuntimeAdapter({ now: fixedNow });
  });

  it("dispatches submitForReview through the runtime adapter", async () => {
    const result = await invokeNetworkEnrichmentReviewCommand(
      {
        commandType: "submitForReview",
        command: {
          organizationId: "org-invoke",
          reviewId: "review-invoke-submit",
          caseId: "case-invoke-submit",
          sourceCandidateId: "candidate-invoke-submit",
          fieldPath: "facilityProfiles.contact",
          currentValue: null,
          proposedValue: { phone: "333-111-1111" },
          sourceReviewerRoles: sourceRoles("NETWORK_REVIEWER"),
          actor: actor("reviewer-invoke", ["FACILITY_REVIEWER"]),
          idempotencyKey: "idem-invoke-submit",
          reason: "submit from caller adapter",
          correlationId: "corr-invoke-submit",
        },
      },
      { adapter },
    );

    expect(result.value.review.status).toBe("REVIEW_PENDING");
    expect(result.value.review.reviewId).toBe("review-invoke-submit");
  });

  it("dispatches approveReview through the runtime adapter", async () => {
    const submit = await invokeNetworkEnrichmentReviewCommand(
      {
        commandType: "submitForReview",
        command: {
          organizationId: "org-invoke",
          reviewId: "review-invoke-approve",
          caseId: "case-invoke-approve",
          sourceCandidateId: "candidate-invoke-approve",
          fieldPath: "facilityProfiles.contact",
          currentValue: null,
          proposedValue: { phone: "333-111-2222" },
          sourceReviewerRoles: sourceRoles("NETWORK_REVIEWER"),
          actor: actor("reviewer-invoke", ["FACILITY_REVIEWER"]),
          idempotencyKey: "idem-invoke-submit-approve",
          reason: "submit from caller adapter",
          correlationId: "corr-invoke-submit-approve",
        },
      },
      { adapter },
    );

    const approve = await invokeNetworkEnrichmentReviewCommand(
      {
        commandType: "approveReview",
        command: {
          organizationId: "org-invoke",
          reviewId: "review-invoke-approve",
          expectedVersion: submit.value.review.version,
          actor: actor("approver-invoke", ["FACILITY_REVIEWER"]),
          idempotencyKey: "idem-invoke-approve",
          reason: "approve from caller adapter",
          actorNotes: "looks good",
          correlationId: "corr-invoke-approve",
        },
      },
      { adapter },
    );

    expect(approve.value.review.status).toBe("HUMAN_CONFIRMED");
    expect((approve.value.review as TypedReviewRecord).reviewedByActorId).toBe("approver-invoke");
  });

  it("dispatches rejectReview through the runtime adapter", async () => {
    const submit = await invokeNetworkEnrichmentReviewCommand(
      {
        commandType: "submitForReview",
        command: {
          organizationId: "org-invoke",
          reviewId: "review-invoke-reject",
          caseId: "case-invoke-reject",
          sourceCandidateId: "candidate-invoke-reject",
          fieldPath: "facilityProfiles.contact",
          currentValue: null,
          proposedValue: { phone: "333-111-3333" },
          sourceReviewerRoles: sourceRoles("NETWORK_REVIEWER"),
          actor: actor("reviewer-invoke", ["FACILITY_REVIEWER"]),
          idempotencyKey: "idem-invoke-submit-reject",
          reason: "submit from caller adapter",
          correlationId: "corr-invoke-submit-reject",
        },
      },
      { adapter },
    );

    const rejected = await invokeNetworkEnrichmentReviewCommand(
      {
        commandType: "rejectReview",
        command: {
          organizationId: "org-invoke",
          reviewId: "review-invoke-reject",
          expectedVersion: submit.value.review.version,
          actor: actor("reviewer-invoke", ["FACILITY_REVIEWER"]),
          idempotencyKey: "idem-invoke-reject",
          reason: "reject from caller adapter",
          rejectionReason: "insufficient packet context",
          correlationId: "corr-invoke-reject",
        },
      },
      { adapter },
    );

    expect(rejected.value.review.status).toBe("REJECTED");
    expect((rejected.value.review as TypedReviewRecord).reviewReason).toBe("insufficient packet context");
    expect((rejected.value.review as TypedReviewRecord).audits.length).toBe(2);
  });

  it("uses the Packet 2 synthetic default adapter when none is supplied", async () => {
    const result = await invokeNetworkEnrichmentReviewCommand({
      commandType: "submitForReview",
      command: {
        organizationId: "org-invoke-default",
        reviewId: "review-invoke-default",
        caseId: "case-invoke-default",
        sourceCandidateId: "candidate-invoke-default",
        fieldPath: "facilityProfiles.contact",
        currentValue: null,
        proposedValue: { phone: "333-111-4444" },
        sourceReviewerRoles: sourceRoles("NETWORK_REVIEWER"),
        actor: actor("reviewer-invoke-default", ["FACILITY_REVIEWER"]),
        idempotencyKey: "idem-invoke-default",
        reason: "default adapter",
        correlationId: "corr-invoke-default",
      },
    });

    expect(result.value.review.organizationId).toBe("org-invoke-default");
  });

  it("replays identical commands at the command invocation level", async () => {
    const invocation = {
      commandType: "submitForReview" as const,
      command: {
        organizationId: "org-invoke-replay",
        reviewId: "review-invoke-replay",
        caseId: "case-invoke-replay",
        sourceCandidateId: "candidate-invoke-replay",
        fieldPath: "facilityProfiles.contact",
        currentValue: null,
        proposedValue: { phone: "333-111-5555" },
        sourceReviewerRoles: sourceRoles("NETWORK_REVIEWER"),
        actor: actor("reviewer-invoke-replay", ["FACILITY_REVIEWER"]),
        idempotencyKey: "idem-invoke-replay",
        reason: "replay invocation",
        correlationId: "corr-invoke-replay",
      },
    };

    const first = await invokeNetworkEnrichmentReviewCommand(invocation, { adapter });
    const second = await invokeNetworkEnrichmentReviewCommand(invocation, { adapter });

    expect(first.replayed).toBe(false);
    expect(second.replayed).toBe(true);
    expect(second.value).toEqual(first.value);
  });
});
