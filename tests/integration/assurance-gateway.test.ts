import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  AssuranceNotFoundError,
  PrismaAssuranceGateway,
  type CaseAuditRecord,
  type CaseAuditWriter,
  type TxClient,
} from "@clarity/case-repository";
import { createHarness, tickingClock, type Harness, type TenantFixture } from "./helpers/harness.js";

let h: Harness;

beforeAll(async () => {
  h = await createHarness();
});

afterAll(async () => h?.dispose());

async function createFacility(tenant: TenantFixture, suffix: string) {
  return h.prisma.facilityProfile.create({
    data: {
      organizationId: tenant.organizationId,
      name: `Synthetic OA Facility ${suffix} ${h.runId}`,
      programs: [],
      acceptedCoverageTypes: [],
      medicalCapabilities: [],
      exclusionCriteria: [],
      legalStatusCapabilities: [],
      transportationRules: [],
      referralRequirements: [],
    },
  });
}

function actor(tenant: TenantFixture) {
  return { actorType: "USER" as const, actorId: tenant.userId };
}

describe("PrismaAssuranceGateway", () => {
  it("persists versioned assurance evidence, evaluations, reviews and metadata-only audit history", async () => {
    const facility = await createFacility(h.tenantA, "history");
    const gateway = new PrismaAssuranceGateway(h.prisma, undefined, tickingClock());
    const a = actor(h.tenantA);

    const assuranceCase = await gateway.createCase(
      h.tenantA.organizationId,
      {
        facilityProfileId: facility.id,
        caseKey: `oa-history-${h.runId}`,
        title: "Synthetic monthly environmental assurance",
        assuranceStatement: "Required evidence elements are documented.",
      },
      a,
    );

    await gateway.addParticipant(
      h.tenantA.organizationId,
      {
        assuranceCaseId: assuranceCase.id,
        userId: h.tenantA.userId,
        role: "QUALIFIED_REVIEWER",
        authorityBasis: "VS-OA-001 synthetic reviewer contract",
      },
      a,
    );

    const applicability = await gateway.recordApplicabilityDecision(
      h.tenantA.organizationId,
      {
        assuranceCaseId: assuranceCase.id,
        status: "APPROVED",
        rationale: "Synthetic applicability posture approved for fixture.",
      },
      a,
    );

    const source = await gateway.addSourceReference(
      h.tenantA.organizationId,
      {
        assuranceCaseId: assuranceCase.id,
        sourceFamilyKey: "SYN-OA-AUTH-001",
        versionLabel: "v1",
        title: "Synthetic authority fixture",
        authorityClass: "FEDERAL_REGULATION",
        citation: "SYNTH-OA-TA-001",
        currentness: "CURRENT",
        rightsStatus: "PERMITTED",
      },
      a,
    );

    await gateway.addDocumentReference(
      h.tenantA.organizationId,
      {
        assuranceCaseId: assuranceCase.id,
        kind: "POLICY",
        referenceKey: "SYN-OA-POL-001",
        title: "Environmental Assurance Monitoring Policy",
        versionLabel: "v1",
      },
      a,
    );
    await gateway.addDocumentReference(
      h.tenantA.organizationId,
      {
        assuranceCaseId: assuranceCase.id,
        kind: "SOP",
        referenceKey: "SYN-OA-SOP-001",
        title: "Monthly Environmental Assurance Round Procedure",
        versionLabel: "v1",
      },
      a,
    );

    const expectation = await gateway.addEvidenceExpectation(
      h.tenantA.organizationId,
      {
        assuranceCaseId: assuranceCase.id,
        code: "MONTHLY_ROUND",
        prompt: "Provide the required monthly round evidence.",
        requiredKeys: ["roundDate", "owner", "followUpStatus"],
      },
      a,
    );

    const first = await gateway.submitEvidence(
      h.tenantA.organizationId,
      {
        assuranceCaseId: assuranceCase.id,
        expectationId: expectation.id,
        payload: {
          roundDate: "2026-09-12",
          owner: "Synthetic Owner",
          followUpStatus: "OPEN",
          privateNote: "RAW-SECRET-MUST-NOT-ENTER-AUDIT",
        },
      },
      a,
    );
    const revised = await gateway.reviseEvidence(
      h.tenantA.organizationId,
      first.id,
      {
        roundDate: "2026-09-12",
        owner: "Synthetic Owner",
        followUpStatus: "COMPLETE",
        privateNote: "RAW-SECRET-REVISION",
      },
      a,
    );

    const storedFirst = await h.prisma.assuranceEvidenceSubmission.findUniqueOrThrow({ where: { id: first.id } });
    expect(storedFirst.status).toBe("SUPERSEDED");
    expect(storedFirst.supersededById).toBe(revised.id);
    expect(storedFirst.payload).toMatchObject({ followUpStatus: "OPEN" });
    expect(revised.version).toBe(2);
    expect(revised.status).toBe("SUBMITTED");

    const evaluation1 = await gateway.recordEvaluation(
      h.tenantA.organizationId,
      {
        assuranceCaseId: assuranceCase.id,
        applicabilityDecisionId: applicability.id,
        evidenceSubmissionId: revised.id,
        result: "SUPPORTED",
        reasonCodes: ["EVIDENCE_COMPLETE"],
        sourceStateSnapshot: { sourceId: source.id, currentness: "CURRENT", rights: "PERMITTED" },
        evidenceStateSnapshot: { evidenceSubmissionId: revised.id, status: "SUBMITTED" },
      },
      a,
    );
    const review1 = await gateway.recordReviewDecision(
      h.tenantA.organizationId,
      {
        assuranceCaseId: assuranceCase.id,
        evaluationId: evaluation1.id,
        decision: "ACCEPT",
        reviewerUserId: h.tenantA.userId,
      },
      a,
    );

    await gateway.setSourceCurrentness(
      h.tenantA.organizationId,
      source.id,
      "SUPERSEDED",
      a,
    );

    const evaluation2 = await gateway.recordEvaluation(
      h.tenantA.organizationId,
      {
        assuranceCaseId: assuranceCase.id,
        applicabilityDecisionId: applicability.id,
        evidenceSubmissionId: revised.id,
        result: "STALE_SOURCE",
        reasonCodes: ["SOURCE_STALE"],
        sourceStateSnapshot: { sourceId: source.id, currentness: "SUPERSEDED", rights: "PERMITTED" },
        evidenceStateSnapshot: { evidenceSubmissionId: revised.id, status: "SUBMITTED" },
      },
      a,
    );
    const review2 = await gateway.recordReviewDecision(
      h.tenantA.organizationId,
      {
        assuranceCaseId: assuranceCase.id,
        evaluationId: evaluation2.id,
        decision: "REVIEW_REQUIRED",
        rationale: "Source was superseded after the first review.",
        reviewerUserId: h.tenantA.userId,
      },
      a,
    );

    const evaluations = await gateway.listEvaluationsForCase(h.tenantA.organizationId, assuranceCase.id);
    const reviews = await gateway.listReviewsForCase(h.tenantA.organizationId, assuranceCase.id);
    const submissions = await gateway.listEvidenceForCase(h.tenantA.organizationId, assuranceCase.id);

    expect(evaluations.map((item) => [item.revision, item.result])).toEqual([
      [1, "SUPPORTED"],
      [2, "STALE_SOURCE"],
    ]);
    expect(reviews.map((item) => [item.id, item.decision])).toEqual([
      [review1.id, "ACCEPT"],
      [review2.id, "REVIEW_REQUIRED"],
    ]);
    expect(submissions.map((item) => [item.version, item.status])).toEqual([
      [1, "SUPERSEDED"],
      [2, "SUBMITTED"],
    ]);

    const storedEvaluation1 = await h.prisma.assuranceEvaluation.findUniqueOrThrow({ where: { id: evaluation1.id } });
    expect(storedEvaluation1.sourceStateSnapshot).toMatchObject({ currentness: "CURRENT" });

    const audit = await h.prisma.auditEvent.findMany({
      where: { organizationId: h.tenantA.organizationId, objectId: { not: null } },
      orderBy: { timestamp: "asc" },
    });
    const serializedAudit = JSON.stringify(audit.map((event) => event.modelMetadata));
    expect(serializedAudit).not.toContain("RAW-SECRET");
    expect(audit.map((event) => event.action)).toContain("ASSURANCE_EVIDENCE_SUBMITTED");
    expect(audit.map((event) => event.action)).toContain("ASSURANCE_EVIDENCE_SUPERSEDED");
    expect(audit.map((event) => event.action)).toContain("ASSURANCE_EVALUATED");
    expect(audit.map((event) => event.action)).toContain("ASSURANCE_REVIEW_RECORDED");
  });

  it("rolls back an assurance mutation when the audit write fails", async () => {
    const facility = await createFacility(h.tenantA, "rollback");
    const failingAudit: CaseAuditWriter = {
      async write(_tx: TxClient, _record: CaseAuditRecord): Promise<void> {
        throw new Error("synthetic_audit_failure");
      },
    };
    const gateway = new PrismaAssuranceGateway(h.prisma, failingAudit);
    const caseKey = `oa-rollback-${h.runId}`;

    await expect(
      gateway.createCase(
        h.tenantA.organizationId,
        {
          facilityProfileId: facility.id,
          caseKey,
          title: "Rollback fixture",
          assuranceStatement: "Mutation must roll back when audit fails.",
        },
        actor(h.tenantA),
      ),
    ).rejects.toThrow("synthetic_audit_failure");

    expect(
      await h.prisma.assuranceCase.count({ where: { organizationId: h.tenantA.organizationId, caseKey } }),
    ).toBe(0);
  });

  it("rejects an unknown same-tenant relationship rather than creating an orphan", async () => {
    const gateway = new PrismaAssuranceGateway(h.prisma);
    await expect(
      gateway.addParticipant(
        h.tenantA.organizationId,
        {
          assuranceCaseId: `missing-oa-case-${h.runId}`,
          userId: h.tenantA.userId,
          role: "OWNER",
        },
        actor(h.tenantA),
      ),
    ).rejects.toBeInstanceOf(AssuranceNotFoundError);
  });
});
