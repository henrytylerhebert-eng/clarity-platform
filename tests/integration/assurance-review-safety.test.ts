import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AuthenticatedPrincipal } from "@clarity/domain-contracts";
import { PrismaAssuranceGateway } from "@clarity/case-repository";
import { AssuranceCommandService } from "../../packages/assurance-service/src/index.js";
import { createHarness, tickingClock, type Harness } from "./helpers/harness.js";

let h: Harness;

beforeAll(async () => {
  h = await createHarness();
});

afterAll(async () => h?.dispose());

function principal(userId: string, roles: AuthenticatedPrincipal["roles"] = []): AuthenticatedPrincipal {
  return {
    userId,
    organizationId: h.tenantA.organizationId,
    displayName: `Synthetic ${userId}`,
    roles,
    sessionId: `session-${userId}`,
    expiresAt: new Date("2026-09-14T00:00:00Z"),
  };
}

async function createFixture(label: string) {
  const gateway = new PrismaAssuranceGateway(h.prisma, undefined, tickingClock());
  const setupActor = { actorType: "USER" as const, actorId: h.tenantA.userId };
  const facility = await h.prisma.facilityProfile.create({
    data: {
      organizationId: h.tenantA.organizationId,
      name: `OA safety ${label} ${h.runId}`,
      programs: [],
      acceptedCoverageTypes: [],
      medicalCapabilities: [],
      exclusionCriteria: [],
      legalStatusCapabilities: [],
      transportationRules: [],
      referralRequirements: [],
    },
  });
  const contributorId = `oa-safety-${label}-contributor-${h.runId}`;
  const reviewerId = `oa-safety-${label}-reviewer-${h.runId}`;
  await h.prisma.user.createMany({
    data: [
      {
        id: contributorId,
        organizationId: h.tenantA.organizationId,
        email: `${contributorId}@example.test`,
        displayName: "Synthetic Contributor",
        roles: [],
      },
      {
        id: reviewerId,
        organizationId: h.tenantA.organizationId,
        email: `${reviewerId}@example.test`,
        displayName: "Synthetic Reviewer",
        roles: ["COMPLIANCE_REVIEWER"],
      },
    ],
  });

  const assuranceCase = await gateway.createCase(
    h.tenantA.organizationId,
    {
      facilityProfileId: facility.id,
      caseKey: `oa-safety-${label}-${h.runId}`,
      title: `OA safety ${label}`,
      assuranceStatement: "Required environmental assurance evidence is documented.",
    },
    setupActor,
  );
  await gateway.addParticipant(
    h.tenantA.organizationId,
    { assuranceCaseId: assuranceCase.id, userId: contributorId, role: "EVIDENCE_CONTRIBUTOR" },
    setupActor,
  );
  await gateway.addParticipant(
    h.tenantA.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      userId: reviewerId,
      role: "QUALIFIED_REVIEWER",
      authorityBasis: "VS-OA-001 synthetic reviewer contract",
    },
    setupActor,
  );
  await gateway.recordApplicabilityDecision(
    h.tenantA.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      status: "APPROVED",
      rationale: "Synthetic applicability approved.",
    },
    setupActor,
  );
  const source = await gateway.addSourceReference(
    h.tenantA.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      sourceFamilyKey: `SYN-SAFETY-${label}`,
      versionLabel: "v1",
      title: "Synthetic authority fixture",
      authorityClass: "FEDERAL_REGULATION",
      citation: `SYN-SAFETY-${label}-CITATION`,
      currentness: "CURRENT",
      rightsStatus: "PERMITTED",
    },
    setupActor,
  );
  const expectation = await gateway.addEvidenceExpectation(
    h.tenantA.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      code: "MONTHLY_ROUND",
      prompt: "Provide date, owner, and follow-up status.",
      requiredKeys: ["roundDate", "owner", "followUpStatus"],
    },
    setupActor,
  );

  const service = new AssuranceCommandService(gateway);
  const contributor = principal(contributorId);
  const reviewer = principal(reviewerId, ["COMPLIANCE_REVIEWER"]);
  const evidence = await service.submitEvidence(contributor, {
    caseKey: assuranceCase.caseKey,
    expectationId: expectation.id,
    payload: {
      roundDate: "2026-09-12",
      owner: "Synthetic Owner",
      followUpStatus: "COMPLETE",
    },
  });

  return { gateway, service, assuranceCase, source, expectation, contributor, reviewer, evidence };
}

describe("Operating Assurance reviewed-evidence safety", () => {
  it.each([
    ["REJECT", "REJECTED"],
    ["REQUEST_MORE_EVIDENCE", "NEEDS_CLARIFICATION"],
  ] as const)(
    "%s evidence is not reused as support by a later evaluation",
    async (decision, expectedEvidenceStatus) => {
      const f = await createFixture(`invalid-${decision.toLowerCase()}`);
      const first = await f.service.evaluate(f.contributor, {
        caseKey: f.assuranceCase.caseKey,
        expectationId: f.expectation.id,
      });
      expect(first.result).toBe("SUPPORTED");

      await f.service.review(f.reviewer, {
        caseKey: f.assuranceCase.caseKey,
        evaluationId: first.id,
        decision,
        rationale: `Synthetic ${decision} rationale`,
      });

      const reviewedEvidence = await h.prisma.assuranceEvidenceSubmission.findUniqueOrThrow({
        where: { id: f.evidence.id },
      });
      expect(reviewedEvidence.status).toBe(expectedEvidenceStatus);

      const second = await f.service.evaluate(f.contributor, {
        caseKey: f.assuranceCase.caseKey,
        expectationId: f.expectation.id,
      });
      expect(second.result).toBe("MISSING_EVIDENCE");
      const storedSecond = await h.prisma.assuranceEvaluation.findUniqueOrThrow({ where: { id: second.id } });
      expect(storedSecond.evidenceSubmissionId).toBeNull();
      expect(storedSecond.evidenceStateSnapshot).toMatchObject({
        evidenceSubmissionId: null,
        evidenceStatus: expectedEvidenceStatus,
      });
    },
  );

  it("allows stale-source replay to receive REVIEW_REQUIRED without mutating accepted evidence", async () => {
    const f = await createFixture("stale-review");
    const first = await f.service.evaluate(f.contributor, {
      caseKey: f.assuranceCase.caseKey,
      expectationId: f.expectation.id,
    });
    await f.service.review(f.reviewer, {
      caseKey: f.assuranceCase.caseKey,
      evaluationId: first.id,
      decision: "ACCEPT",
    });

    const accepted = await h.prisma.assuranceEvidenceSubmission.findUniqueOrThrow({ where: { id: f.evidence.id } });
    expect(accepted.status).toBe("ACCEPTED");

    await f.gateway.setSourceCurrentness(
      h.tenantA.organizationId,
      f.source.id,
      "SUPERSEDED",
      { actorType: "USER", actorId: h.tenantA.userId },
    );
    const replay = await f.service.evaluate(f.contributor, {
      caseKey: f.assuranceCase.caseKey,
      expectationId: f.expectation.id,
    });
    expect(replay.result).toBe("STALE_SOURCE");

    const review = await f.service.review(f.reviewer, {
      caseKey: f.assuranceCase.caseKey,
      evaluationId: replay.id,
      decision: "REVIEW_REQUIRED",
      rationale: "Authority source is superseded; human follow-up remains required.",
    });
    expect(review.decision).toBe("REVIEW_REQUIRED");

    const stillAccepted = await h.prisma.assuranceEvidenceSubmission.findUniqueOrThrow({
      where: { id: f.evidence.id },
    });
    expect(stillAccepted.status).toBe("ACCEPTED");
    expect(stillAccepted.reviewedBy).toBe(f.reviewer.userId);
  });
});
