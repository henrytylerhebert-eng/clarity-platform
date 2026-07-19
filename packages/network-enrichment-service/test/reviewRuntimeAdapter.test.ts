import { beforeEach, describe, expect, it } from "vitest";
import { createNetworkEnrichmentReviewRuntimeAdapter } from "../src/reviewRuntimeAdapter.js";
import { InMemoryNetworkReviewGateway } from "../src/reviewGateway.js";
import type { CommandActor, NetworkSourceReviewRole, UserRole } from "@clarity/domain-contracts";

const fixedNow = () => "2026-07-19T12:00:00.000Z";

const sourceRoles = (...roles: NetworkSourceReviewRole[]): NetworkSourceReviewRole[] => [...roles];

const actor = (actorId: string, roles: readonly UserRole[]): CommandActor => ({
  actorId,
  actorType: "USER",
  roles: [...roles],
});

describe("createNetworkEnrichmentReviewRuntimeAdapter", () => {
  let gateway: InMemoryNetworkReviewGateway;

  beforeEach(() => {
    gateway = new InMemoryNetworkReviewGateway();
  });

  it("exposes adapter command functions backed by the Packet 2 runtime", async () => {
    const adapter = createNetworkEnrichmentReviewRuntimeAdapter({ gateway, now: fixedNow });

    const submit = await adapter.submitForReview({
      organizationId: "org-adapter",
      caseId: "case-adapter",
      sourceCandidateId: "candidate-adapter",
      reviewId: "review-adapter",
      fieldPath: "facilityProfiles.emails",
      currentValue: null,
      proposedValue: { emails: ["ops@org.org"] },
      sourceReviewerRoles: sourceRoles("NETWORK_REVIEWER"),
      actor: actor("reviewer-adapter", ["FACILITY_REVIEWER"]),
      idempotencyKey: "idem-adapter-submit",
      correlationId: "corr-adapter",
      reason: "Adapter smoke submit",
    });

    const approve = await adapter.approveReview({
      organizationId: "org-adapter",
      reviewId: "review-adapter",
      expectedVersion: submit.value.review.version,
      actor: actor("approver-adapter", ["FACILITY_REVIEWER"]),
      idempotencyKey: "idem-adapter-approve",
      correlationId: "corr-adapter-approve",
      reason: "Approved from adapter",
      actorNotes: "Good match",
    });

    expect(submit.value.review.status).toBe("REVIEW_PENDING");
    expect(approve.value.review.status).toBe("HUMAN_CONFIRMED");
    expect(approve.value.review.version).toBe(2);
    expect(adapter.gateway).toBe(gateway);
  });

  it("defaults to the Packet 2 in-memory gateway when adapter deps do not supply one", async () => {
    const adapter = createNetworkEnrichmentReviewRuntimeAdapter({ now: fixedNow });

    const submit = await adapter.submitForReview({
      organizationId: "org-adapter-default",
      caseId: "case-adapter-default",
      sourceCandidateId: "candidate-adapter-default",
      reviewId: "review-adapter-default",
      fieldPath: "facilityProfiles.contact",
      currentValue: null,
      proposedValue: { phone: "555-0100" },
      sourceReviewerRoles: sourceRoles("NETWORK_COMPLIANCE_REVIEWER"),
      actor: actor("reviewer-adapter-default", ["COMPLIANCE_REVIEWER"]),
      idempotencyKey: "idem-adapter-default-submit",
      correlationId: "corr-adapter-default",
      reason: "Adapter defaults test",
    });

    expect(submit.value.review.organizationId).toBe("org-adapter-default");
  });

  it("preserves replay behavior across adapter calls", async () => {
    const adapter = createNetworkEnrichmentReviewRuntimeAdapter({ now: fixedNow });

    const first = await adapter.submitForReview({
      organizationId: "org-adapter-replay",
      caseId: "case-adapter-replay",
      sourceCandidateId: "candidate-adapter-replay",
      reviewId: "review-adapter-replay",
      fieldPath: "facilityProfiles.contact",
      currentValue: null,
      proposedValue: { phone: "555-0111" },
      sourceReviewerRoles: sourceRoles("NETWORK_REVIEWER"),
      actor: actor("reviewer-adapter-replay", ["FACILITY_REVIEWER"]),
      idempotencyKey: "idem-adapter-replay-submit",
      correlationId: "corr-adapter-replay",
      reason: "Replay test",
    });

    const second = await adapter.submitForReview({
      organizationId: "org-adapter-replay",
      caseId: "case-adapter-replay",
      sourceCandidateId: "candidate-adapter-replay",
      reviewId: "review-adapter-replay",
      fieldPath: "facilityProfiles.contact",
      currentValue: null,
      proposedValue: { phone: "555-0111" },
      sourceReviewerRoles: sourceRoles("NETWORK_REVIEWER"),
      actor: actor("reviewer-adapter-replay", ["FACILITY_REVIEWER"]),
      idempotencyKey: "idem-adapter-replay-submit",
      correlationId: "corr-adapter-replay",
      reason: "Replay test",
    });

    expect(first.replayed).toBe(false);
    expect(second.replayed).toBe(true);
    expect(second.value).toEqual(first.value);
  });
});
