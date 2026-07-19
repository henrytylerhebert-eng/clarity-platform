import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryNetworkReviewGateway } from "../src/reviewGateway.js";
import { createNetworkEnrichmentReviewRuntime } from "../src/runtime.js";
import type {
  CommandActor,
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

describe("createNetworkEnrichmentReviewRuntime", () => {
  let gateway: InMemoryNetworkReviewGateway;

  beforeEach(() => {
    gateway = new InMemoryNetworkReviewGateway();
  });

  it("creates a Packet 2 runtime with synthetic gateway and command surface", async () => {
    const runtime = createNetworkEnrichmentReviewRuntime({ gateway, now: fixedNow });
    const result = await runtime.commands.submitForReview({
      organizationId: "org-runtime",
      caseId: "case-runtime",
      sourceCandidateId: "candidate-runtime",
      reviewId: "rev-runtime",
      fieldPath: "facilityAdmissionProfiles.contact",
      currentValue: null,
      proposedValue: { phone: "337-555-1111" },
      sourceReviewerRoles: sourceRoles("NETWORK_REVIEWER"),
      actor: actor("reviewer-runtime", ["FACILITY_REVIEWER"]),
      idempotencyKey: "idem-runtime-submit",
      reason: "runtime hook smoke",
      correlationId: "corr-runtime",
    });

    expect(runtime.gateway).toBe(gateway);
    expect(result.value.review.reviewId).toBe("rev-runtime");
    expect(result.replayed).toBe(false);
  });

  it("defaults to an in-memory gateway when no gateway is supplied", async () => {
    const runtime = createNetworkEnrichmentReviewRuntime({ now: fixedNow });
    const result = await runtime.commands.submitForReview({
      organizationId: "org-runtime-default",
      caseId: "case-runtime-default",
      sourceCandidateId: "candidate-runtime-default",
      reviewId: "rev-runtime-default",
      fieldPath: "facilityAdmissionProfiles.contact",
      currentValue: null,
      proposedValue: { phone: "337-555-2222" },
      sourceReviewerRoles: sourceRoles("NETWORK_REVIEWER"),
      actor: actor("reviewer-runtime-default", ["FACILITY_REVIEWER"]),
      idempotencyKey: "idem-runtime-default-submit",
      correlationId: "corr-runtime-default",
    });

    expect(result.value.review.organizationId).toBe("org-runtime-default");
  });
});
