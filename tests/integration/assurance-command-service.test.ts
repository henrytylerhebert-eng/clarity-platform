import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AuthenticatedPrincipal, UserRole } from "@clarity/domain-contracts";
import {
  PrismaAssuranceGateway,
  type CaseAuditRecord,
  type CaseAuditWriter,
  type TxClient,
} from "@clarity/case-repository";
import {
  AssuranceCommandService,
  AssuranceConflictError,
  AssurancePermissionDeniedError,
  AssuranceQueryService,
  AssuranceServiceNotFoundError,
  AssuranceValidationError,
} from "../../packages/assurance-service/src/index.js";
import { createHarness, tickingClock, type Harness, type TenantFixture } from "./helpers/harness.js";

let h: Harness;

beforeAll(async () => {
  h = await createHarness();
});

afterAll(async () => h?.dispose());

function principal(
  tenant: TenantFixture,
  userId: string,
  roles: readonly UserRole[] = [],
): AuthenticatedPrincipal {
  return {
    userId,
    organizationId: tenant.organizationId,
    displayName: `Synthetic ${userId}`,
    roles,
    sessionId: `session-${userId}`,
    expiresAt: new Date("2026-09-14T00:00:00Z"),
  };
}

async function createUser(
  tenant: TenantFixture,
  label: string,
  roles: readonly UserRole[] = [],
): Promise<string> {
  const id = `oa-${label}-${h.runId}`;
  await h.prisma.user.create({
    data: {
      id,
      organizationId: tenant.organizationId,
      email: `${label}-${h.runId}@example.test`,
      displayName: `OA ${label}`,
      roles: [...roles],
    },
  });
  return id;
}

async function createFacility(tenant: TenantFixture, label: string) {
  return h.prisma.facilityProfile.create({
    data: {
      organizationId: tenant.organizationId,
      name: `OA ${label} ${h.runId}`,
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

type Fixture = Awaited<ReturnType<typeof buildFixture>>;

async function buildFixture(label: string, tenant: TenantFixture = h.tenantA) {
  const gateway = new PrismaAssuranceGateway(h.prisma, undefined, tickingClock());
  const setupActor = { actorType: "USER" as const, actorId: tenant.userId };
  const facility = await createFacility(tenant, label);
  const contributorId = await createUser(tenant, `${label}-contributor`);
  const reviewerId = await createUser(tenant, `${label}-reviewer`, ["COMPLIANCE_REVIEWER"]);
  const reviewerNoGlobalId = await createUser(tenant, `${label}-reviewer-no-global`);
  const globalOnlyId = await createUser(tenant, `${label}-global-only`, ["COMPLIANCE_REVIEWER"]);
  const systemAdminId = await createUser(tenant, `${label}-system-admin`, ["SYSTEM_ADMIN"]);
  const unassignedId = await createUser(tenant, `${label}-unassigned`);

  const assuranceCase = await gateway.createCase(
    tenant.organizationId,
    {
      facilityProfileId: facility.id,
      caseKey: `oa-${label}-${h.runId}`,
      title: `OA ${label}`,
      assuranceStatement: "Required environmental assurance evidence is documented.",
    },
    setupActor,
  );

  await gateway.addParticipant(
    tenant.organizationId,
    { assuranceCaseId: assuranceCase.id, userId: tenant.userId, role: "OWNER" },
    setupActor,
  );
  await gateway.addParticipant(
    tenant.organizationId,
    { assuranceCaseId: assuranceCase.id, userId: contributorId, role: "EVIDENCE_CONTRIBUTOR" },
    setupActor,
  );
  await gateway.addParticipant(
    tenant.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      userId: reviewerId,
      role: "QUALIFIED_REVIEWER",
      authorityBasis: "VS-OA-001 synthetic reviewer contract",
    },
    setupActor,
  );
  await gateway.addParticipant(
    tenant.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      userId: reviewerNoGlobalId,
      role: "QUALIFIED_REVIEWER",
      authorityBasis: "VS-OA-001 synthetic reviewer contract",
    },
    setupActor,
  );
  await gateway.addParticipant(
    tenant.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      userId: systemAdminId,
      role: "QUALIFIED_REVIEWER",
      authorityBasis: "VS-OA-001 synthetic reviewer contract",
    },
    setupActor,
  );

  const applicability = await gateway.recordApplicabilityDecision(
    tenant.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      status: "APPROVED",
      rationale: "Synthetic applicability approved for VS-OA-001.",
    },
    setupActor,
  );
  const source = await gateway.addSourceReference(
    tenant.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      sourceFamilyKey: `SYN-${label}-AUTH`,
      versionLabel: "v1",
      title: "Synthetic authority fixture",
      authorityClass: "FEDERAL_REGULATION",
      citation: `SYN-${label}-CITATION`,
      currentness: "CURRENT",
      rightsStatus: "PERMITTED",
    },
    setupActor,
  );
  await gateway.addDocumentReference(
    tenant.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      kind: "POLICY",
      referenceKey: `SYN-${label}-POLICY`,
      title: "Synthetic policy",
      versionLabel: "v1",
    },
    setupActor,
  );
  await gateway.addDocumentReference(
    tenant.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      kind: "SOP",
      referenceKey: `SYN-${label}-SOP`,
      title: "Synthetic SOP",
      versionLabel: "v1",
    },
    setupActor,
  );
  const expectation = await gateway.addEvidenceExpectation(
    tenant.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      code: "MONTHLY_ROUND",
      prompt: "Provide date, owner, and follow-up status.",
      requiredKeys: ["roundDate", "owner", "followUpStatus"],
    },
    setupActor,
  );

  return {
    tenant,
    gateway,
    service: new AssuranceCommandService(gateway),
    query: new AssuranceQueryService(gateway),
    assuranceCase,
    applicability,
    source,
    expectation,
    owner: principal(tenant, tenant.userId),
    contributor: principal(tenant, contributorId),
    reviewer: principal(tenant, reviewerId, ["COMPLIANCE_REVIEWER"]),
    reviewerNoGlobal: principal(tenant, reviewerNoGlobalId),
    globalOnly: principal(tenant, globalOnlyId, ["COMPLIANCE_REVIEWER"]),
    systemAdmin: principal(tenant, systemAdminId, ["SYSTEM_ADMIN"]),
    unassigned: principal(tenant, unassignedId),
  };
}

async function submitComplete(f: Fixture) {
  return f.service.submitEvidence(f.contributor, {
    caseKey: f.assuranceCase.caseKey,
    expectationId: f.expectation.id,
    payload: {
      roundDate: "2026-09-12",
      owner: "Synthetic Owner",
      followUpStatus: "COMPLETE",
    },
  });
}

async function evaluateComplete(f: Fixture) {
  await submitComplete(f);
  return f.service.evaluate(f.contributor, {
    caseKey: f.assuranceCase.caseKey,
    expectationId: f.expectation.id,
  });
}

describe("AssuranceCommandService and AssuranceQueryService", () => {
  it("allows an assigned contributor to submit and revise, while denying an unassigned same-tenant user", async () => {
    const f = await buildFixture("contribution");
    const submitted = await f.service.submitEvidence(f.contributor, {
      caseKey: f.assuranceCase.caseKey,
      expectationId: f.expectation.id,
      payload: { roundDate: "2026-09-12" },
    });
    expect(submitted.status).toBe("SUBMITTED");

    const revised = await f.service.reviseEvidence(f.contributor, {
      caseKey: f.assuranceCase.caseKey,
      priorSubmissionId: submitted.id,
      payload: { roundDate: "2026-09-12", owner: "Owner" },
    });
    expect(revised.version).toBe(2);

    await expect(
      f.service.submitEvidence(f.unassigned, {
        caseKey: f.assuranceCase.caseKey,
        expectationId: f.expectation.id,
        payload: { roundDate: "2026-09-12" },
      }),
    ).rejects.toBeInstanceOf(AssurancePermissionDeniedError);

    await expect(
      f.service.reviseEvidence(f.unassigned, {
        caseKey: f.assuranceCase.caseKey,
        priorSubmissionId: revised.id,
        payload: { owner: "forged" },
      }),
    ).rejects.toBeInstanceOf(AssurancePermissionDeniedError);
  });

  it("does not reveal or mutate another tenant's assurance case", async () => {
    const f = await buildFixture("tenant-a", h.tenantA);
    const otherUser = await createUser(h.tenantB, "tenant-b-user");
    const other = principal(h.tenantB, otherUser);

    await expect(
      f.service.submitEvidence(other, {
        caseKey: f.assuranceCase.caseKey,
        expectationId: f.expectation.id,
        payload: { roundDate: "2026-09-12" },
      }),
    ).rejects.toBeInstanceOf(AssuranceServiceNotFoundError);

    await expect(f.query.getCaseView(other, f.assuranceCase.caseKey)).rejects.toBeInstanceOf(
      AssuranceServiceNotFoundError,
    );
  });

  it("evaluates the current governed state and persists a human-review-required result", async () => {
    const f = await buildFixture("evaluate-happy");
    const evidence = await submitComplete(f);
    const result = await f.service.evaluate(f.contributor, {
      caseKey: f.assuranceCase.caseKey,
      expectationId: f.expectation.id,
    });

    expect(result.result).toBe("SUPPORTED");
    expect(result.requiresHumanReview).toBe(true);
    expect(result.reasonCodes).toEqual(["EVIDENCE_COMPLETE"]);

    const stored = await h.prisma.assuranceEvaluation.findUniqueOrThrow({ where: { id: result.id } });
    expect(stored.evidenceSubmissionId).toBe(evidence.id);
    expect(stored.applicabilityDecisionId).toBe(f.applicability.id);
    expect(stored.requiresHumanReview).toBe(true);
  });

  it("keeps missing, stale, restricted, and conflicting states fail-closed", async () => {
    const missing = await buildFixture("missing");
    expect(
      (
        await missing.service.evaluate(missing.owner, {
          caseKey: missing.assuranceCase.caseKey,
          expectationId: missing.expectation.id,
        })
      ).result,
    ).toBe("MISSING_EVIDENCE");

    const stale = await buildFixture("stale");
    await submitComplete(stale);
    await stale.gateway.setSourceCurrentness(
      stale.tenant.organizationId,
      stale.source.id,
      "SUPERSEDED",
      { actorType: "USER", actorId: stale.tenant.userId },
    );
    expect(
      (
        await stale.service.evaluate(stale.owner, {
          caseKey: stale.assuranceCase.caseKey,
          expectationId: stale.expectation.id,
        })
      ).result,
    ).toBe("STALE_SOURCE");

    const restricted = await buildFixture("restricted");
    await submitComplete(restricted);
    await h.prisma.assuranceSourceReference.update({
      where: { id: restricted.source.id },
      data: { rightsStatus: "RESTRICTED" },
    });
    expect(
      (
        await restricted.service.evaluate(restricted.owner, {
          caseKey: restricted.assuranceCase.caseKey,
          expectationId: restricted.expectation.id,
        })
      ).result,
    ).toBe("RIGHTS_RESTRICTED");

    const conflict = await buildFixture("conflict");
    await submitComplete(conflict);
    const second = await conflict.gateway.addSourceReference(
      conflict.tenant.organizationId,
      {
        assuranceCaseId: conflict.assuranceCase.id,
        sourceFamilyKey: "SYN-CONFLICT-SECOND",
        versionLabel: "v1",
        title: "Synthetic conflicting authority",
        authorityClass: "STATE_LICENSING",
        citation: "SYN-CONFLICT-CITATION-2",
        currentness: "CURRENT",
        rightsStatus: "PERMITTED",
      },
      { actorType: "USER", actorId: conflict.tenant.userId },
    );
    await conflict.gateway.createSourceConflict(
      conflict.tenant.organizationId,
      {
        assuranceCaseId: conflict.assuranceCase.id,
        leftSourceId: conflict.source.id,
        rightSourceId: second.id,
      },
      { actorType: "USER", actorId: conflict.tenant.userId },
    );
    expect(
      (
        await conflict.service.evaluate(conflict.owner, {
          caseKey: conflict.assuranceCase.caseKey,
          expectationId: conflict.expectation.id,
        })
      ).result,
    ).toBe("CONFLICT");
  });

  it("cannot evaluate a case with another tenant's expectation or state", async () => {
    const a = await buildFixture("evaluation-a", h.tenantA);
    const b = await buildFixture("evaluation-b", h.tenantB);

    await expect(
      a.service.evaluate(a.owner, {
        caseKey: a.assuranceCase.caseKey,
        expectationId: b.expectation.id,
      }),
    ).rejects.toBeInstanceOf(AssuranceServiceNotFoundError);
  });

  it("requires both COMPLIANCE_REVIEWER and scoped qualified-reviewer authority", async () => {
    const f = await buildFixture("review-authority");
    const evaluation = await evaluateComplete(f);

    await expect(
      f.service.review(f.globalOnly, {
        caseKey: f.assuranceCase.caseKey,
        evaluationId: evaluation.id,
        decision: "ACCEPT",
      }),
    ).rejects.toBeInstanceOf(AssurancePermissionDeniedError);

    await expect(
      f.service.review(f.reviewerNoGlobal, {
        caseKey: f.assuranceCase.caseKey,
        evaluationId: evaluation.id,
        decision: "ACCEPT",
      }),
    ).rejects.toBeInstanceOf(AssurancePermissionDeniedError);

    await expect(
      f.service.review(f.systemAdmin, {
        caseKey: f.assuranceCase.caseKey,
        evaluationId: evaluation.id,
        decision: "ACCEPT",
      }),
    ).rejects.toBeInstanceOf(AssurancePermissionDeniedError);

    const review = await f.service.review(f.reviewer, {
      caseKey: f.assuranceCase.caseKey,
      evaluationId: evaluation.id,
      decision: "ACCEPT",
    });
    expect(review.decision).toBe("ACCEPT");
  });

  it.each([
    ["ACCEPT", "ACCEPTED", false],
    ["REJECT", "REJECTED", true],
    ["REQUEST_MORE_EVIDENCE", "NEEDS_CLARIFICATION", true],
    ["REVIEW_REQUIRED", "SUBMITTED", true],
  ] as const)(
    "%s produces the accepted evidence side effect atomically",
    async (decision, expectedStatus, rationaleRequired) => {
      const f = await buildFixture(`side-effect-${decision.toLowerCase()}`);
      const evidence = await submitComplete(f);
      const evaluation = await f.service.evaluate(f.contributor, {
        caseKey: f.assuranceCase.caseKey,
        expectationId: f.expectation.id,
      });

      if (rationaleRequired) {
        await expect(
          f.service.review(f.reviewer, {
            caseKey: f.assuranceCase.caseKey,
            evaluationId: evaluation.id,
            decision,
          }),
        ).rejects.toBeInstanceOf(AssuranceValidationError);
      }

      await f.service.review(f.reviewer, {
        caseKey: f.assuranceCase.caseKey,
        evaluationId: evaluation.id,
        decision,
        ...(rationaleRequired ? { rationale: `Synthetic rationale for ${decision}` } : {}),
      });

      const stored = await h.prisma.assuranceEvidenceSubmission.findUniqueOrThrow({ where: { id: evidence.id } });
      expect(stored.status).toBe(expectedStatus);
      const reviews = await h.prisma.assuranceReviewDecision.findMany({
        where: { organizationId: f.tenant.organizationId, evaluationId: evaluation.id },
      });
      expect(reviews).toHaveLength(1);
    },
  );

  it("rolls back the review record and evidence side effect when audit persistence fails", async () => {
    const f = await buildFixture("review-rollback");
    const evidence = await submitComplete(f);
    const evaluation = await f.service.evaluate(f.contributor, {
      caseKey: f.assuranceCase.caseKey,
      expectationId: f.expectation.id,
    });

    const failingAudit: CaseAuditWriter = {
      async write(_tx: TxClient, _record: CaseAuditRecord): Promise<void> {
        throw new Error("synthetic_assurance_review_audit_failure");
      },
    };
    const failingGateway = new PrismaAssuranceGateway(h.prisma, failingAudit, tickingClock());
    const failingService = new AssuranceCommandService(failingGateway);

    await expect(
      failingService.review(f.reviewer, {
        caseKey: f.assuranceCase.caseKey,
        evaluationId: evaluation.id,
        decision: "ACCEPT",
      }),
    ).rejects.toThrow("synthetic_assurance_review_audit_failure");

    const storedEvidence = await h.prisma.assuranceEvidenceSubmission.findUniqueOrThrow({ where: { id: evidence.id } });
    expect(storedEvidence.status).toBe("SUBMITTED");
    expect(
      await h.prisma.assuranceReviewDecision.count({
        where: { organizationId: f.tenant.organizationId, evaluationId: evaluation.id },
      }),
    ).toBe(0);
  });

  it("exposes tenant-scoped case/history views to assigned users and preserves prior replay history", async () => {
    const f = await buildFixture("history-query");
    await submitComplete(f);
    const first = await f.service.evaluate(f.contributor, {
      caseKey: f.assuranceCase.caseKey,
      expectationId: f.expectation.id,
    });
    await f.service.review(f.reviewer, {
      caseKey: f.assuranceCase.caseKey,
      evaluationId: first.id,
      decision: "ACCEPT",
    });

    await f.gateway.setSourceCurrentness(
      f.tenant.organizationId,
      f.source.id,
      "SUPERSEDED",
      { actorType: "USER", actorId: f.tenant.userId },
    );
    const second = await f.service.evaluate(f.owner, {
      caseKey: f.assuranceCase.caseKey,
      expectationId: f.expectation.id,
    });
    expect(second.result).toBe("STALE_SOURCE");

    const view = await f.query.getCaseView(f.owner, f.assuranceCase.caseKey);
    expect(view.evaluations[0]?.id).toBe(second.id);

    const history = await f.query.getCaseHistory(f.owner, f.assuranceCase.caseKey);
    expect(history.filter((entry) => entry.kind === "EVALUATION").map((entry) => entry.state)).toEqual([
      "SUPPORTED",
      "STALE_SOURCE",
    ]);
    expect(history.some((entry) => entry.kind === "REVIEW" && entry.state === "ACCEPT")).toBe(true);

    await expect(f.query.getCaseView(f.unassigned, f.assuranceCase.caseKey)).rejects.toBeInstanceOf(
      AssurancePermissionDeniedError,
    );
  });

  it("refuses to review an old evaluation after a newer evaluation exists", async () => {
    const f = await buildFixture("current-review-only");
    await submitComplete(f);
    const first = await f.service.evaluate(f.contributor, {
      caseKey: f.assuranceCase.caseKey,
      expectationId: f.expectation.id,
    });
    await f.service.evaluate(f.owner, {
      caseKey: f.assuranceCase.caseKey,
      expectationId: f.expectation.id,
    });

    await expect(
      f.service.review(f.reviewer, {
        caseKey: f.assuranceCase.caseKey,
        evaluationId: first.id,
        decision: "ACCEPT",
      }),
    ).rejects.toBeInstanceOf(AssuranceConflictError);
  });
});
