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

  it("enforces dual review for oneReviewSuffices=false sensitivities: first approval stays pending, same actor cannot approve twice, a distinct second reviewer confirms (ADR-0015)", async () => {
    const service = new NetworkEnrichmentReviewCommandService(gateway, fixedNow);
    await service.submitForReview({
      organizationId: "org-a",
      caseId: "case-a",
      sourceCandidateId: "candidate-a",
      reviewId: "rev-dual",
      fieldPath: "facilityAdmissionProfiles.clinicalCriteria",
      sensitivityCategory: "CLINICAL_CRITERIA",
      currentValue: null,
      proposedValue: { criterion: "synthetic-criterion" },
      sourceReviewerRoles: sourceRoles("FACILITY_CLINICAL_GOVERNANCE"),
      actor: actor("submitter", ["CLINICAL_REVIEWER"]),
      idempotencyKey: "idem-submit-dual",
      correlationId: "corr-dual-1",
    });

    const first = await service.approveReview({
      organizationId: "org-a",
      reviewId: "rev-dual",
      expectedVersion: 1,
      actor: actor("reviewer-one", ["CLINICAL_REVIEWER"]),
      actorNotes: "First clinical sign-off",
      idempotencyKey: "idem-dual-approve-1",
      correlationId: "corr-dual-2",
    });
    expect(first.value.review.status).toBe("REVIEW_PENDING");
    expect(first.value.review.version).toBe(2);
    expect(first.value.review.audits.filter((a) => a.action === "APPROVE_REVIEW")).toHaveLength(1);

    await expect(
      service.approveReview({
        organizationId: "org-a",
        reviewId: "rev-dual",
        expectedVersion: 2,
        actor: actor("reviewer-one", ["CLINICAL_REVIEWER"]),
        actorNotes: "Same actor again — must not satisfy dual review",
        idempotencyKey: "idem-dual-approve-2",
        correlationId: "corr-dual-3",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });

    const second = await service.approveReview({
      organizationId: "org-a",
      reviewId: "rev-dual",
      expectedVersion: 2,
      actor: actor("reviewer-two", ["PHYSICIAN_REVIEWER", "CLINICAL_REVIEWER"]),
      actorNotes: "Distinct second reviewer",
      idempotencyKey: "idem-dual-approve-3",
      correlationId: "corr-dual-4",
    });
    expect(second.value.review.status).toBe("HUMAN_CONFIRMED");
    expect(second.value.review.version).toBe(3);
    expect(second.value.review.reviewedByActorId).toBe("reviewer-two");
  });

  it("refuses to reconcile a package with zero HUMAN_CONFIRMED reviews or with reviews still pending (ADR-0015)", async () => {
    const service = new NetworkEnrichmentReviewCommandService(gateway, fixedNow);
    await service.submitForReview({
      organizationId: "org-a",
      caseId: "case-a",
      sourceCandidateId: "candidate-a",
      reviewId: "rev-gate",
      reviewPackageId: "pkg-gate",
      fieldPath: "facilityAdmissionProfiles.contact",
      currentValue: null,
      proposedValue: { phone: "337-555-0100" },
      sourceReviewerRoles: sourceRoles("NETWORK_REVIEWER"),
      actor: actor("submitter", ["FACILITY_REVIEWER"]),
      idempotencyKey: "idem-submit-gate",
      correlationId: "corr-gate-1",
    });

    // Still pending → both gates trip (no confirmed reviews, one pending).
    await expect(
      service.reconcilePackage({
        organizationId: "org-a",
        reviewPackageId: "pkg-gate",
        expectedVersion: 1,
        actor: actor("reconciler", ["COMPLIANCE_REVIEWER"]),
        idempotencyKey: "idem-reconcile-gate-1",
        correlationId: "corr-gate-2",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });

    await service.approveReview({
      organizationId: "org-a",
      reviewId: "rev-gate",
      expectedVersion: 1,
      actor: actor("approver", ["FACILITY_REVIEWER"]),
      actorNotes: "Confirmed",
      idempotencyKey: "idem-approve-gate",
      correlationId: "corr-gate-3",
    });

    const reconciled = await service.reconcilePackage({
      organizationId: "org-a",
      reviewPackageId: "pkg-gate",
      expectedVersion: 1,
      actor: actor("reconciler", ["COMPLIANCE_REVIEWER"]),
      idempotencyKey: "idem-reconcile-gate-2",
      correlationId: "corr-gate-4",
    });
    expect(reconciled.value.packageRecord.status).toBe("HUMAN_CONFIRMED");
    expect(reconciled.value.promotedFieldPaths).toEqual(["facilityAdmissionProfiles.contact"]);
    expect(reconciled.value.packageRecord.packageStatusReason).not.toContain("canonical CRM");
  });
});
