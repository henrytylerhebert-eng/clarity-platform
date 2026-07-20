import { describe, expect, it, beforeAll } from "vitest";
import {
  PrismaNetworkReviewGateway,
  NetworkEnrichmentReviewCommandService,
} from "@clarity/network-enrichment-service";
import {
  SyntheticOutboxConsumer,
  SyntheticOutboxDispatcher,
} from "@clarity/case-repository";
import type { UserRole } from "@clarity/domain-contracts";
import { createHarness, type Harness } from "./helpers/harness.js";

let h: Harness;
let gateway: PrismaNetworkReviewGateway;
let commandService: NetworkEnrichmentReviewCommandService;

beforeAll(async () => {
  h = await createHarness();
  gateway = new PrismaNetworkReviewGateway(h.prisma);
  commandService = new NetworkEnrichmentReviewCommandService(gateway, () => "2026-07-20T12:00:00.000Z");
});

describe("Network Enrichment Transactional Outbox Events", () => {
  it("writes OutboxRecord rows in PENDING state when reviews and packages transition", async () => {
    const orgId = h.tenantA.organizationId;
    const reviewId = `net-rev-outbox-${h.runId}`;
    const caseId = `case-outbox-${h.runId}`;
    const packageId = `pkg-outbox-${h.runId}`;

    await h.prisma.behavioralHealthCase.create({
      data: {
        id: caseId,
        organizationId: orgId,
        patientTokenId: h.tenantA.patientTokenId,
        status: "DRAFT",
        urgency: "ROUTINE",
      },
    });

    const roles: UserRole[] = ["FACILITY_REVIEWER", "PHYSICIAN_REVIEWER", "CLINICAL_REVIEWER"];

    // 1. Submit for review -> NetworkReviewSubmitted event
    const submitResult = await commandService.submitForReview({
      organizationId: orgId,
      reviewId,
      reviewPackageId: packageId,
      caseId,
      sourceCandidateId: "cand-outbox-1",
      fieldPath: "facilityProfiles.npi",
      currentValue: "111",
      proposedValue: "222",
      sourceReviewerRoles: ["NETWORK_REVIEWER"],
      actor: { actorId: "submitter-outbox", actorType: "USER", roles },
      idempotencyKey: `idem-outbox-sub-${h.runId}`,
      reason: "Outbox test submit",
      correlationId: "corr-outbox-sub",
    });
    expect(submitResult.value.review.status).toBe("REVIEW_PENDING");

    const pendingSub = await h.prisma.outboxRecord.findMany({
      where: { organizationId: orgId, eventTypeName: "NETWORK_REVIEW_SUBMITTED" },
    });
    expect(pendingSub.length).toBeGreaterThanOrEqual(1);

    // 2. Approve review -> NETWORK_REVIEW_APPROVED event
    const approveResult = await commandService.approveReview({
      organizationId: orgId,
      reviewId,
      expectedVersion: 1,
      actor: { actorId: "approver-outbox", actorType: "USER", roles },
      idempotencyKey: `idem-outbox-app-${h.runId}`,
      reason: "Outbox test approve",
      actorNotes: "Approved NPI",
      correlationId: "corr-outbox-app",
    });
    expect(approveResult.value.review.status).toBe("HUMAN_CONFIRMED");

    const pendingApp = await h.prisma.outboxRecord.findMany({
      where: { organizationId: orgId, eventTypeName: "NETWORK_REVIEW_APPROVED" },
    });
    expect(pendingApp.length).toBeGreaterThanOrEqual(1);

    // 3. Reconcile package -> NETWORK_PACKAGE_RECONCILED event
    const reconcileResult = await commandService.reconcilePackage({
      organizationId: orgId,
      reviewPackageId: packageId,
      expectedVersion: 1,
      notes: "Package reconciled to CRM",
      actor: { actorId: "reconciler-outbox", actorType: "USER", roles },
      idempotencyKey: `idem-outbox-rec-${h.runId}`,
      correlationId: "corr-outbox-rec",
    });
    expect(reconcileResult.value.packageRecord.status).toBe("HUMAN_CONFIRMED");

    const pendingRec = await h.prisma.outboxRecord.findMany({
      where: { organizationId: orgId, eventTypeName: "NETWORK_PACKAGE_RECONCILED" },
    });
    expect(pendingRec.length).toBeGreaterThanOrEqual(1);

    // 4. Dispatch pending outbox messages with SyntheticOutboxDispatcher
    const consumer = new SyntheticOutboxConsumer();
    const dispatcher = new SyntheticOutboxDispatcher(h.prisma, consumer);
    const dispatchResult = await dispatcher.dispatchPending(orgId, 50);

    expect(dispatchResult.deliveredIds.length).toBeGreaterThanOrEqual(3);

    const deliveredMessageTypes = consumer.messages.map((m) => m.outbox.eventTypeName);
    expect(deliveredMessageTypes).toContain("NETWORK_REVIEW_SUBMITTED");
    expect(deliveredMessageTypes).toContain("NETWORK_REVIEW_APPROVED");
    expect(deliveredMessageTypes).toContain("NETWORK_PACKAGE_RECONCILED");
  });
});
