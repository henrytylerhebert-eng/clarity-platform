import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaNetworkReviewGateway } from "@clarity/case-repository";
import type { NetworkReviewRecord, NetworkReviewPackageRecord } from "@clarity/domain-contracts";
import { createHarness, type Harness } from "./helpers/harness.js";

let h: Harness;
let gateway: PrismaNetworkReviewGateway;

beforeAll(async () => {
  h = await createHarness();
  gateway = new PrismaNetworkReviewGateway(h.prisma);
});

afterAll(async () => {
  await h?.dispose();
});

describe("PrismaNetworkReviewGateway", () => {
  it("saves and retrieves network review records and review packages", async () => {
    const orgId = h.tenantA.organizationId;
    const reviewId = `rev-${h.runId}-1`;
    const packageId = `pkg-${h.runId}-1`;

    const packageRecord: NetworkReviewPackageRecord = {
      reviewPackageId: packageId,
      organizationId: orgId,
      caseId: `case-${h.runId}`,
      sourceCandidateId: `cand-${h.runId}`,
      status: "UNRESEARCHED",
      version: 1,
      submittedByActorId: "actor-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const reviewRecord: NetworkReviewRecord = {
      reviewPackageId: packageId,
      reviewId,
      organizationId: orgId,
      caseId: `case-${h.runId}`,
      sourceCandidateId: `cand-${h.runId}`,
      fieldPath: "facility.contact.phone",
      sensitivityCategory: "NORMAL_OPERATIONAL",
      requiredCanonicalRoles: ["FACILITY_REVIEWER"],
      createdByActorId: "actor-1",
      currentValue: null,
      proposedValue: { phone: "555-0199" },
      sourceReviewerRoles: ["NETWORK_REVIEWER"],
      status: "REVIEW_PENDING",
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      audits: [
        {
          action: "SUBMIT_FOR_REVIEW",
          actorId: "actor-1",
          actorType: "USER",
          commandId: `cmd-${reviewId}`,
          correlationId: `corr-${h.runId}`,
          reason: "seeded test review",
          occurredAt: new Date().toISOString(),
        },
      ],
    };

    await gateway.saveReview(reviewRecord, { packageRecord });

    const fetchedReview = await gateway.getReviewById({ organizationId: orgId, reviewId });
    expect(fetchedReview).toBeDefined();
    expect(fetchedReview?.reviewId).toBe(reviewId);
    expect(fetchedReview?.fieldPath).toBe("facility.contact.phone");
    expect(fetchedReview?.audits?.length).toBe(1);
    expect(fetchedReview?.audits?.[0]?.action).toBe("SUBMIT_FOR_REVIEW");

    const fetchedPackage = await gateway.getPackageById({ organizationId: orgId, reviewPackageId: packageId });
    expect(fetchedPackage).toBeDefined();
    expect(fetchedPackage?.status).toBe("UNRESEARCHED");

    const packageReviews = await gateway.getReviewsByPackageId({ organizationId: orgId, reviewPackageId: packageId });
    expect(packageReviews.length).toBe(1);
    expect(packageReviews[0]?.reviewId).toBe(reviewId);
  });

  it("handles idempotency replay record saving and retrieval", async () => {
    const orgId = h.tenantA.organizationId;
    const replayInput = {
      organizationId: orgId,
      commandType: "submitForReview",
      idempotencyKey: `idem-${h.runId}-99`,
      fingerprint: "fp-12345",
    };

    const dummyResult = {
      review: {
        reviewPackageId: `pkg-${h.runId}-dummy`,
        reviewId: "r-dummy",
        organizationId: orgId,
        caseId: "c-dummy",
        sourceCandidateId: "cand-dummy",
        fieldPath: "dummy.path",
        sensitivityCategory: "NORMAL_OPERATIONAL" as const,
        requiredCanonicalRoles: [],
        createdByActorId: "act",
        currentValue: null,
        proposedValue: null,
        sourceReviewerRoles: [],
        status: "REVIEW_PENDING" as const,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        audits: [],
      },
      replayed: false,
    };

    await gateway.saveReplayRecord(replayInput, dummyResult);

    const replayRecord = await gateway.getReplayRecord({
      organizationId: orgId,
      commandType: "submitForReview",
      idempotencyKey: `idem-${h.runId}-99`,
    });

    expect(replayRecord).toBeDefined();
    expect(replayRecord?.commandFingerprint).toBe("fp-12345");
  });
});
