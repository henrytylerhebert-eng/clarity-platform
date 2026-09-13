import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaAssuranceGateway } from "@clarity/case-repository";
import { evaluateAssurance } from "../../packages/assurance-service/src/evaluator.js";
import { createHarness, tickingClock, type Harness } from "../integration/helpers/harness.js";

let h: Harness;

beforeAll(async () => {
  h = await createHarness();
});

afterAll(async () => h?.dispose());

describe("VS-OA-001 independent audit reconstruction", () => {
  it("AC-OA-014 reconstructs applicability, source trust, evidence, machine result, human decision, and replay", async () => {
    const tenant = h.tenantA;
    const actor = { actorType: "USER" as const, actorId: tenant.userId };
    const gateway = new PrismaAssuranceGateway(h.prisma, undefined, tickingClock());

    const facility = await h.prisma.facilityProfile.create({
      data: {
        organizationId: tenant.organizationId,
        name: `PA audit ${h.runId}`,
        programs: [],
        acceptedCoverageTypes: [],
        medicalCapabilities: [],
        exclusionCriteria: [],
        legalStatusCapabilities: [],
        transportationRules: [],
        referralRequirements: [],
      },
    });

    const assuranceCase = await gateway.createCase(
      tenant.organizationId,
      {
        facilityProfileId: facility.id,
        caseKey: `pa-audit-${h.runId}`,
        title: "Independent PA audit case",
        assuranceStatement: "Synthetic environmental assurance evidence is documented.",
      },
      actor,
    );

    const applicability = await gateway.recordApplicabilityDecision(
      tenant.organizationId,
      {
        assuranceCaseId: assuranceCase.id,
        status: "APPROVED",
        rationale: "Independent PA applicability approved.",
      },
      actor,
    );

    const source = await gateway.addSourceReference(
      tenant.organizationId,
      {
        assuranceCaseId: assuranceCase.id,
        sourceFamilyKey: "PA-AUDIT-AUTH",
        versionLabel: "v1",
        title: "Independent PA authority",
        authorityClass: "FEDERAL_REGULATION",
        citation: "PA-AUDIT-CITATION",
        currentness: "CURRENT",
        rightsStatus: "PERMITTED",
      },
      actor,
    );

    const expectation = await gateway.addEvidenceExpectation(
      tenant.organizationId,
      {
        assuranceCaseId: assuranceCase.id,
        code: "PA_AUDIT",
        prompt: "Provide round date, owner, and follow-up status.",
        requiredKeys: ["roundDate", "owner", "followUpStatus"],
      },
      actor,
    );

    const evidence = await gateway.submitEvidence(
      tenant.organizationId,
      {
        assuranceCaseId: assuranceCase.id,
        expectationId: expectation.id,
        payload: {
          roundDate: "2026-09-13",
          owner: "Independent PA Owner",
          followUpStatus: "COMPLETE",
        },
      },
      actor,
    );

    const first = await gateway.evaluateCurrentState(
      tenant.organizationId,
      assuranceCase.id,
      expectation.id,
      actor,
      evaluateAssurance,
    );
    expect(first.result).toBe("SUPPORTED");

    const review = await gateway.recordReviewDecisionWithEvidenceEffect(
      tenant.organizationId,
      {
        assuranceCaseId: assuranceCase.id,
        evaluationId: first.id,
        decision: "ACCEPT",
        reviewerUserId: tenant.userId,
      },
      actor,
    );
    expect(review.decision).toBe("ACCEPT");

    await gateway.setSourceCurrentness(
      tenant.organizationId,
      source.id,
      "SUPERSEDED",
      actor,
    );

    const second = await gateway.evaluateCurrentState(
      tenant.organizationId,
      assuranceCase.id,
      expectation.id,
      actor,
      evaluateAssurance,
    );
    expect(second.result).toBe("STALE_SOURCE");

    const rows = await h.prisma.assuranceEvaluation.findMany({
      where: { organizationId: tenant.organizationId, assuranceCaseId: assuranceCase.id },
      orderBy: { revision: "asc" },
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]?.applicabilityDecisionId).toBe(applicability.id);
    expect(rows[0]?.evidenceSubmissionId).toBe(evidence.id);
    expect(rows[0]?.result).toBe("SUPPORTED");
    expect(rows[1]?.result).toBe("STALE_SOURCE");

    const firstSourceState = rows[0]?.sourceStateSnapshot as {
      sources: Array<{ sourceId: string; currentness: string; rights: string }>;
      conflicts: unknown[];
    };
    const secondSourceState = rows[1]?.sourceStateSnapshot as {
      sources: Array<{ sourceId: string; currentness: string; rights: string }>;
      conflicts: unknown[];
    };
    expect(firstSourceState.sources).toContainEqual({
      sourceId: source.id,
      currentness: "CURRENT",
      rights: "PERMITTED",
      hasRequiredMetadata: true,
    });
    expect(secondSourceState.sources).toContainEqual({
      sourceId: source.id,
      currentness: "SUPERSEDED",
      rights: "PERMITTED",
      hasRequiredMetadata: true,
    });

    const firstEvidenceState = rows[0]?.evidenceStateSnapshot as {
      expectationId: string;
      evidenceSubmissionId: string;
      evidenceStatus: string;
      evidenceVersion: number;
    };
    const secondEvidenceState = rows[1]?.evidenceStateSnapshot as {
      expectationId: string;
      evidenceSubmissionId: string;
      evidenceStatus: string;
      evidenceVersion: number;
    };
    expect(firstEvidenceState).toMatchObject({
      expectationId: expectation.id,
      evidenceSubmissionId: evidence.id,
      evidenceStatus: "SUBMITTED",
      evidenceVersion: 1,
    });
    expect(secondEvidenceState).toMatchObject({
      expectationId: expectation.id,
      evidenceSubmissionId: evidence.id,
      evidenceStatus: "ACCEPTED",
      evidenceVersion: 1,
    });

    const reviewRows = await h.prisma.assuranceReviewDecision.findMany({
      where: { organizationId: tenant.organizationId, assuranceCaseId: assuranceCase.id },
    });
    expect(reviewRows).toHaveLength(1);
    expect(reviewRows[0]).toMatchObject({
      evaluationId: first.id,
      decision: "ACCEPT",
      reviewerUserId: tenant.userId,
    });

    const audit = await h.prisma.auditEvent.findMany({
      where: {
        organizationId: tenant.organizationId,
        action: {
          in: [
            "ASSURANCE_APPLICABILITY_RECORDED",
            "ASSURANCE_SOURCE_ADDED",
            "ASSURANCE_EVIDENCE_SUBMITTED",
            "ASSURANCE_EVALUATED",
            "ASSURANCE_REVIEW_RECORDED",
            "ASSURANCE_SOURCE_CURRENTNESS_CHANGED",
          ],
        },
      },
      orderBy: { occurredAt: "asc" },
    });
    const actions = audit.map((event) => event.action);
    expect(actions).toEqual(expect.arrayContaining([
      "ASSURANCE_APPLICABILITY_RECORDED",
      "ASSURANCE_SOURCE_ADDED",
      "ASSURANCE_EVIDENCE_SUBMITTED",
      "ASSURANCE_REVIEW_RECORDED",
      "ASSURANCE_SOURCE_CURRENTNESS_CHANGED",
    ]));
    expect(actions.filter((action) => action === "ASSURANCE_EVALUATED")).toHaveLength(2);
    expect(audit.every((event) => event.actorId === tenant.userId)).toBe(true);
  });
});
