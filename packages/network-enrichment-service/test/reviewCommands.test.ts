import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryNetworkReviewGateway } from "../src/reviewGateway.js";
import {
  NetworkEnrichmentReviewCommandService,
} from "../src/reviewCommands.js";
import type {
  CommandActor,
  NetworkSourceReviewRole,
  UserRole,
} from "@clarity/domain-contracts";

const fixedNow = () => "2026-07-19T00:00:00.000Z";

const actor = (actorId: string, roles: readonly UserRole[]): CommandActor => ({
  actorId,
  actorType: "USER",
  roles: [...roles],
});

const sourceRoles = (...roles: NetworkSourceReviewRole[]): NetworkSourceReviewRole[] => [...roles];

describe("NetworkEnrichmentReviewCommandService", () => {
  let gateway: InMemoryNetworkReviewGateway;

  beforeEach(() => {
    gateway = new InMemoryNetworkReviewGateway();
  });

  it("submits a review in synthetic storage with role-mapped canonical permissions", async () => {
    const service = new NetworkEnrichmentReviewCommandService(gateway, fixedNow);
    const input = {
      organizationId: "org-a",
      caseId: "case-a",
      sourceCandidateId: "candidate-a",
      reviewId: "rev-a",
      fieldPath: "facilityAdmissionProfiles.contact",
      currentValue: null,
      proposedValue: { phone: "337-555-0100" },
      sourceReviewerRoles: sourceRoles("NETWORK_REVIEWER"),
      actor: actor("submitter", ["FACILITY_REVIEWER"]),
      idempotencyKey: "idem-submit-a",
      reason: "seeded for review workflow",
      correlationId: "corr-a",
    };

    const result = await service.submitForReview(input);
    expect(result.replayed).toBe(false);
    expect(result.value.review.status).toBe("REVIEW_PENDING");
    expect(result.value.review.version).toBe(1);
    expect(result.value.review.requiredCanonicalRoles).toEqual(["FACILITY_REVIEWER", "COMPLIANCE_REVIEWER"]);
    expect(result.value.review.audits).toHaveLength(1);
  });

  it("replays submit when idempotency key and payload match", async () => {
    const service = new NetworkEnrichmentReviewCommandService(gateway, fixedNow);
    const input = {
      organizationId: "org-a",
      caseId: "case-a",
      sourceCandidateId: "candidate-a",
      reviewId: "rev-a",
      fieldPath: "facilityAdmissionProfiles.contact",
      currentValue: null,
      proposedValue: { phone: "337-555-0100" },
      sourceReviewerRoles: sourceRoles("NETWORK_REVIEWER"),
      actor: actor("submitter", ["FACILITY_REVIEWER"]),
      idempotencyKey: "idem-submit-b",
      reason: "seeded for review workflow",
      correlationId: "corr-a",
    };

    const first = await service.submitForReview(input);
    const second = await service.submitForReview(input);
    expect(first.replayed).toBe(false);
    expect(second.replayed).toBe(true);
    expect(second.value).toEqual(first.value);
    expect(second.value.review.audits).toHaveLength(1);
  });

  it("rejects duplicate idempotency keys when payload changes", async () => {
    const service = new NetworkEnrichmentReviewCommandService(gateway, fixedNow);
    const baseInput = {
      organizationId: "org-a",
      caseId: "case-a",
      sourceCandidateId: "candidate-a",
      reviewId: "rev-a",
      fieldPath: "facilityAdmissionProfiles.contact",
      currentValue: null,
      proposedValue: { phone: "337-555-0100" },
      sourceReviewerRoles: sourceRoles("NETWORK_REVIEWER"),
      actor: actor("submitter", ["FACILITY_REVIEWER"]),
      idempotencyKey: "idem-conflict",
      reason: "seeded for review workflow",
      correlationId: "corr-a",
    };

    await service.submitForReview(baseInput);
    await expect(
      service.submitForReview({
        ...baseInput,
        proposedValue: { phone: "337-555-9999" },
      }),
    ).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
  });

  it("approves and rejects review transitions with strict invariants", async () => {
    const service = new NetworkEnrichmentReviewCommandService(gateway, fixedNow);
    await service.submitForReview({
      organizationId: "org-a",
      caseId: "case-a",
      sourceCandidateId: "candidate-a",
      reviewId: "rev-a",
      fieldPath: "facilityAdmissionProfiles.contact",
      currentValue: null,
      proposedValue: { phone: "337-555-0100" },
      sourceReviewerRoles: sourceRoles("NETWORK_REVIEWER"),
      actor: actor("submitter", ["FACILITY_REVIEWER"]),
      idempotencyKey: "idem-submit-c",
      correlationId: "corr-1",
    });

    const approved = await service.approveReview({
      organizationId: "org-a",
      reviewId: "rev-a",
      expectedVersion: 1,
      actor: actor("approver", ["FACILITY_REVIEWER"]),
      actorNotes: "Verified by policy reviewer",
      idempotencyKey: "idem-approve-a",
      correlationId: "corr-2",
    });
    expect(approved.value.review.status).toBe("HUMAN_CONFIRMED");
    expect(approved.value.review.version).toBe(2);

    await expect(
      service.approveReview({
        organizationId: "org-a",
        reviewId: "rev-a",
        expectedVersion: 1,
        actor: actor("approver", ["FACILITY_REVIEWER"]),
        actorNotes: "Late approval attempt",
        idempotencyKey: "idem-approve-b",
        correlationId: "corr-3",
      }),
    ).rejects.toMatchObject({ code: "CONCURRENCY_CONFLICT" });

    await expect(
      service.approveReview({
        organizationId: "org-a",
        reviewId: "rev-a",
        expectedVersion: 2,
        actor: actor("approver", ["FACILITY_REVIEWER"]),
        actorNotes: "Duplicate approved state",
        idempotencyKey: "idem-approve-b",
        correlationId: "corr-4",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("rejects from a pending review and prevents unauthorized approvers", async () => {
    const service = new NetworkEnrichmentReviewCommandService(gateway, fixedNow);
    await service.submitForReview({
      organizationId: "org-a",
      caseId: "case-a",
      sourceCandidateId: "candidate-a",
      reviewId: "rev-a",
      fieldPath: "facilityAdmissionProfiles.role",
      currentValue: "Old",
      proposedValue: "New",
      sourceReviewerRoles: sourceRoles("FACILITY_CLINICAL_GOVERNANCE"),
      actor: actor("submitter", ["CLINICAL_REVIEWER"]),
      idempotencyKey: "idem-submit-d",
      correlationId: "corr-5",
    });

    const rejected = await service.rejectReview({
      organizationId: "org-a",
      reviewId: "rev-a",
      expectedVersion: 1,
      actor: actor("reviewer", ["CLINICAL_REVIEWER"]),
      rejectionReason: "Conflicts with licensing source",
      idempotencyKey: "idem-reject-a",
      correlationId: "corr-6",
    });
    expect(rejected.value.review.status).toBe("REJECTED");

    await expect(
      service.approveReview({
        organizationId: "org-a",
        reviewId: "rev-a",
        expectedVersion: 2,
        actor: actor("unauthorized", ["FACILITY_REVIEWER"]),
        actorNotes: "Should fail; wrong role mapping",
        idempotencyKey: "idem-approve-c",
        correlationId: "corr-7",
      }),
    ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });

    await expect(
      service.approveReview({
        organizationId: "org-a",
        reviewId: "rev-a",
        expectedVersion: 2,
        actor: actor("other", ["CLINICAL_REVIEWER"]),
        actorNotes: "Should fail; wrong review state",
        idempotencyKey: "idem-approve-d",
        correlationId: "corr-8",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });
});
