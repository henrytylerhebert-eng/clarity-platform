import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AuthenticatedPrincipal, UserRole } from "@clarity/domain-contracts";
import { PrismaAssuranceGateway } from "@clarity/case-repository";
import {
  AssuranceCommandService,
  AssurancePermissionDeniedError,
  AssuranceQueryService,
  AssuranceServiceNotFoundError,
} from "../../packages/assurance-service/src/index.js";
import {
  createHarness,
  tickingClock,
  type Harness,
  type TenantFixture,
} from "../integration/helpers/harness.js";

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
    displayName: `PA ${userId}`,
    roles,
    sessionId: `pa-session-${userId}`,
    expiresAt: new Date("2026-09-14T00:00:00Z"),
  };
}

async function createUser(
  tenant: TenantFixture,
  label: string,
  roles: readonly UserRole[] = [],
): Promise<string> {
  const id = `pa-oa-${label}-${h.runId}`;
  await h.prisma.user.create({
    data: {
      id,
      organizationId: tenant.organizationId,
      email: `${label}-${h.runId}@acceptance.test`,
      displayName: `PA OA ${label}`,
      roles: [...roles],
      status: "ACTIVE",
    },
  });
  return id;
}

interface FixtureOptions {
  readonly applicability?: "APPROVED" | "PENDING";
  readonly currentness?: "CURRENT" | "STALE" | "SUPERSEDED" | "UNKNOWN";
  readonly rights?: "PERMITTED" | "RESTRICTED" | "UNKNOWN";
  readonly citation?: string;
  readonly tenant?: TenantFixture;
}

async function buildFixture(label: string, options: FixtureOptions = {}) {
  const tenant = options.tenant ?? h.tenantA;
  const gateway = new PrismaAssuranceGateway(h.prisma, undefined, tickingClock());
  const setupActor = { actorType: "USER" as const, actorId: tenant.userId };
  const facility = await h.prisma.facilityProfile.create({
    data: {
      organizationId: tenant.organizationId,
      name: `PA OA ${label} ${h.runId}`,
      programs: [],
      acceptedCoverageTypes: [],
      medicalCapabilities: [],
      exclusionCriteria: [],
      legalStatusCapabilities: [],
      transportationRules: [],
      referralRequirements: [],
    },
  });

  const contributorId = await createUser(tenant, `${label}-contributor`);
  const reviewerId = await createUser(tenant, `${label}-reviewer`, ["COMPLIANCE_REVIEWER"]);
  const globalOnlyId = await createUser(tenant, `${label}-global-only`, ["COMPLIANCE_REVIEWER"]);
  const scopedOnlyId = await createUser(tenant, `${label}-scoped-only`);
  const systemAdminId = await createUser(tenant, `${label}-system-admin`, ["SYSTEM_ADMIN"]);

  const assuranceCase = await gateway.createCase(
    tenant.organizationId,
    {
      facilityProfileId: facility.id,
      caseKey: `pa-oa-${label}-${h.runId}`,
      title: `PA OA ${label}`,
      assuranceStatement: "Synthetic monthly environmental assurance evidence is documented.",
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
      authorityBasis: "Independent PA synthetic reviewer authority",
    },
    setupActor,
  );
  await gateway.addParticipant(
    tenant.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      userId: scopedOnlyId,
      role: "QUALIFIED_REVIEWER",
      authorityBasis: "Independent PA scoped-only authority",
    },
    setupActor,
  );
  await gateway.addParticipant(
    tenant.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      userId: systemAdminId,
      role: "QUALIFIED_REVIEWER",
      authorityBasis: "Independent PA system-admin scoped authority",
    },
    setupActor,
  );

  const applicability = await gateway.recordApplicabilityDecision(
    tenant.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      status: options.applicability ?? "APPROVED",
      rationale: "Independent Product Acceptance fixture applicability posture.",
    },
    setupActor,
  );

  const source = await gateway.addSourceReference(
    tenant.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      sourceFamilyKey: `PA-${label}-AUTH`,
      versionLabel: "v1",
      title: "Independent synthetic authority",
      authorityClass: "FEDERAL_REGULATION",
      citation: options.citation ?? `PA-${label}-CITATION`,
      currentness: options.currentness ?? "CURRENT",
      rightsStatus: options.rights ?? "PERMITTED",
    },
    setupActor,
  );

  const policy = await gateway.addDocumentReference(
    tenant.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      kind: "POLICY",
      referenceKey: `PA-${label}-POLICY`,
      title: "Independent synthetic policy",
      versionLabel: "v1",
    },
    setupActor,
  );
  const sop = await gateway.addDocumentReference(
    tenant.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      kind: "SOP",
      referenceKey: `PA-${label}-SOP`,
      title: "Independent synthetic SOP",
      versionLabel: "v1",
    },
    setupActor,
  );
  const expectation = await gateway.addEvidenceExpectation(
    tenant.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      code: `PA_${label.toUpperCase().replaceAll("-", "_")}`,
      prompt: "Provide round date, accountable owner, and follow-up status.",
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
    policy,
    sop,
    expectation,
    owner: principal(tenant, tenant.userId),
    contributor: principal(tenant, contributorId),
    reviewer: principal(tenant, reviewerId, ["COMPLIANCE_REVIEWER"]),
    globalOnly: principal(tenant, globalOnlyId, ["COMPLIANCE_REVIEWER"]),
    scopedOnly: principal(tenant, scopedOnlyId),
    systemAdmin: principal(tenant, systemAdminId, ["SYSTEM_ADMIN"]),
    setupActor,
  };
}

type Fixture = Awaited<ReturnType<typeof buildFixture>>;

async function submitComplete(f: Fixture) {
  return f.service.submitEvidence(f.contributor, {
    caseKey: f.assuranceCase.caseKey,
    expectationId: f.expectation.id,
    payload: {
      roundDate: "2026-09-13",
      owner: "Independent Acceptance Owner",
      followUpStatus: "COMPLETE",
    },
  });
}

async function evaluate(f: Fixture, actor: AuthenticatedPrincipal = f.owner) {
  return f.service.evaluate(actor, {
    caseKey: f.assuranceCase.caseKey,
    expectationId: f.expectation.id,
  });
}

describe("VS-OA-001 independent Product Acceptance", () => {
  it("FIX-OA-001 / AC-001,003,005,010,012,014: completes an inspectable bounded trace without conflating machine and human states", async () => {
    const f = await buildFixture("happy");

    const before = await f.query.getCaseView(f.owner, f.assuranceCase.caseKey);
    expect(before.applicability[0]?.status).toBe("APPROVED");
    expect(before.sources[0]?.currentness).toBe("CURRENT");
    expect(before.sources[0]?.rightsStatus).toBe("PERMITTED");
    expect(before.documentReferences.some((item) => item.id === f.policy.id && item.kind === "POLICY")).toBe(true);
    expect(before.documentReferences.some((item) => item.id === f.sop.id && item.kind === "SOP")).toBe(true);
    expect(before.evidenceExpectations[0]?.id).toBe(f.expectation.id);

    const evidence = await submitComplete(f);
    expect(evidence.status).toBe("SUBMITTED");

    const machine = await evaluate(f, f.contributor);
    expect(machine.result).toBe("SUPPORTED");
    expect(machine.requiresHumanReview).toBe(true);
    expect(machine.reasonCodes).toEqual(["EVIDENCE_COMPLETE"]);

    const preReview = await f.query.getCaseView(f.reviewer, f.assuranceCase.caseKey);
    expect(preReview.evidenceExpectations[0]?.submissions[0]?.status).toBe("SUBMITTED");
    expect(preReview.evaluations[0]?.result).toBe("SUPPORTED");
    expect(preReview.evaluations[0]?.reviewDecisions).toHaveLength(0);

    const review = await f.service.review(f.reviewer, {
      caseKey: f.assuranceCase.caseKey,
      evaluationId: machine.id,
      decision: "ACCEPT",
    });
    expect(review.decision).toBe("ACCEPT");

    const after = await f.query.getCaseView(f.reviewer, f.assuranceCase.caseKey);
    expect(after.evidenceExpectations[0]?.submissions[0]?.status).toBe("ACCEPTED");
    expect(after.evaluations[0]?.result).toBe("SUPPORTED");
    expect(after.evaluations[0]?.reviewDecisions[0]?.decision).toBe("ACCEPT");
    expect(JSON.stringify(after).toUpperCase()).not.toContain('"COMPLIANT"');

    const history = await f.query.getCaseHistory(f.reviewer, f.assuranceCase.caseKey);
    expect(history.map((entry) => entry.kind)).toEqual(expect.arrayContaining(["EVIDENCE", "EVALUATION", "REVIEW"]));
    expect(history.find((entry) => entry.kind === "EVALUATION")?.state).toBe("SUPPORTED");
    expect(history.find((entry) => entry.kind === "REVIEW")?.state).toBe("ACCEPT");
  });

  it("FIX-OA-002 / AC-004: missing evidence fails closed", async () => {
    const f = await buildFixture("missing-evidence");
    const result = await evaluate(f);
    expect(result.result).toBe("MISSING_EVIDENCE");
    expect(result.requiresHumanReview).toBe(true);
    expect(result.result).not.toBe("SUPPORTED");
  });

  it("FIX-OA-003 / AC-002: pending applicability blocks positive support even with complete evidence", async () => {
    const f = await buildFixture("applicability-pending", { applicability: "PENDING" });
    await submitComplete(f);
    const result = await evaluate(f);
    expect(result.result).toBe("APPLICABILITY_PENDING");
    expect(result.result).not.toBe("SUPPORTED");
    expect(result.result).not.toBe("PARTIALLY_SUPPORTED");
  });

  it("FIX-OA-004 / AC-006: restricted rights fail closed", async () => {
    const f = await buildFixture("rights-restricted", { rights: "RESTRICTED" });
    await submitComplete(f);
    const result = await evaluate(f);
    expect(result.result).toBe("RIGHTS_RESTRICTED");
    expect(result.result).not.toBe("SUPPORTED");
  });

  it("FIX-OA-005 / AC-007,011: supersession replay preserves the accepted history and changes the current result", async () => {
    const f = await buildFixture("superseded-replay");
    await submitComplete(f);
    const initial = await evaluate(f);
    expect(initial.result).toBe("SUPPORTED");
    await f.service.review(f.reviewer, {
      caseKey: f.assuranceCase.caseKey,
      evaluationId: initial.id,
      decision: "ACCEPT",
    });

    await f.gateway.setSourceCurrentness(
      f.tenant.organizationId,
      f.source.id,
      "SUPERSEDED",
      f.setupActor,
    );
    const replay = await evaluate(f);
    expect(replay.result).toBe("STALE_SOURCE");

    const evaluations = await f.gateway.listEvaluationsForCase(f.tenant.organizationId, f.assuranceCase.id);
    const reviews = await f.gateway.listReviewsForCase(f.tenant.organizationId, f.assuranceCase.id);
    expect(evaluations.map((item) => item.result)).toEqual(["SUPPORTED", "STALE_SOURCE"]);
    expect(reviews.map((item) => item.decision)).toEqual(["ACCEPT"]);

    const history = await f.query.getCaseHistory(f.reviewer, f.assuranceCase.caseKey);
    expect(history.filter((entry) => entry.kind === "EVALUATION").map((entry) => entry.state)).toEqual([
      "SUPPORTED",
      "STALE_SOURCE",
    ]);
  });

  it("FIX-OA-006 / AC-008: unresolved source conflict blocks positive support without erasing earlier records", async () => {
    const f = await buildFixture("conflict");
    await submitComplete(f);
    const beforeConflict = await evaluate(f);
    expect(beforeConflict.result).toBe("SUPPORTED");

    const second = await f.gateway.addSourceReference(
      f.tenant.organizationId,
      {
        assuranceCaseId: f.assuranceCase.id,
        sourceFamilyKey: "PA-CONFLICT-SECOND",
        versionLabel: "v1",
        title: "Independent conflicting authority",
        authorityClass: "STATE_LICENSING",
        citation: "PA-CONFLICT-SECOND-CITATION",
        currentness: "CURRENT",
        rightsStatus: "PERMITTED",
      },
      f.setupActor,
    );
    await f.gateway.createSourceConflict(
      f.tenant.organizationId,
      {
        assuranceCaseId: f.assuranceCase.id,
        leftSourceId: f.source.id,
        rightSourceId: second.id,
      },
      f.setupActor,
    );

    const conflict = await evaluate(f);
    expect(conflict.result).toBe("CONFLICT");
    const evaluations = await f.gateway.listEvaluationsForCase(f.tenant.organizationId, f.assuranceCase.id);
    expect(evaluations.map((item) => item.result)).toEqual(["SUPPORTED", "CONFLICT"]);
  });

  it("FIX-OA-007 / AC-010: human rejection remains distinct and rejected evidence cannot support a later positive result", async () => {
    const f = await buildFixture("reviewer-disagrees");
    const evidence = await submitComplete(f);
    const machine = await evaluate(f);
    expect(machine.result).toBe("SUPPORTED");

    const review = await f.service.review(f.reviewer, {
      caseKey: f.assuranceCase.caseKey,
      evaluationId: machine.id,
      decision: "REJECT",
      rationale: "Independent reviewer found the evidence insufficient.",
    });
    expect(review.decision).toBe("REJECT");

    const rejected = await f.gateway.findEvidenceSubmission(f.tenant.organizationId, evidence.id);
    expect(rejected?.status).toBe("REJECTED");

    const replay = await evaluate(f);
    expect(replay.result).toBe("MISSING_EVIDENCE");
    const reviews = await f.gateway.listReviewsForCase(f.tenant.organizationId, f.assuranceCase.id);
    expect(reviews[0]?.decision).toBe("REJECT");
  });

  it("FIX-OA-008: evidence revision preserves prior provenance and distinguishes the current version", async () => {
    const f = await buildFixture("evidence-revision");
    const first = await f.service.submitEvidence(f.contributor, {
      caseKey: f.assuranceCase.caseKey,
      expectationId: f.expectation.id,
      payload: { roundDate: "2026-09-13" },
    });
    const second = await f.service.reviseEvidence(f.contributor, {
      caseKey: f.assuranceCase.caseKey,
      priorSubmissionId: first.id,
      payload: {
        roundDate: "2026-09-13",
        owner: "Revised Owner",
        followUpStatus: "COMPLETE",
      },
    });

    const evidence = await f.gateway.listEvidenceForCase(f.tenant.organizationId, f.assuranceCase.id);
    expect(evidence).toHaveLength(2);
    expect(evidence[0]).toMatchObject({ id: first.id, version: 1, status: "SUPERSEDED" });
    expect(evidence[1]).toMatchObject({ id: second.id, version: 2, status: "SUBMITTED" });
    expect(evidence[0]?.payload).toEqual({ roundDate: "2026-09-13" });
  });

  it("FIX-OA-009 / AC-009: reviewer authority requires both grants and SYSTEM_ADMIN does not bypass", async () => {
    const f = await buildFixture("review-authority");
    await submitComplete(f);
    const machine = await evaluate(f);

    for (const unauthorized of [f.globalOnly, f.scopedOnly, f.systemAdmin]) {
      await expect(
        f.service.review(unauthorized, {
          caseKey: f.assuranceCase.caseKey,
          evaluationId: machine.id,
          decision: "ACCEPT",
        }),
      ).rejects.toBeInstanceOf(AssurancePermissionDeniedError);
    }

    await expect(
      f.service.review(f.reviewer, {
        caseKey: f.assuranceCase.caseKey,
        evaluationId: machine.id,
        decision: "ACCEPT",
      }),
    ).resolves.toMatchObject({ decision: "ACCEPT" });
  });

  it("FIX-OA-010: unknown currentness or incomplete metadata cannot produce authoritative support", async () => {
    const unknown = await buildFixture("unknown-currentness", { currentness: "UNKNOWN" });
    await submitComplete(unknown);
    expect((await evaluate(unknown)).result).toBe("REVIEW_REQUIRED");

    const incomplete = await buildFixture("incomplete-metadata", { citation: "" });
    await submitComplete(incomplete);
    expect((await evaluate(incomplete)).result).toBe("UNKNOWN");
  });

  it("AC-OA-013: cross-tenant case and evidence are non-revealing through the service/query boundary", async () => {
    const f = await buildFixture("tenant-a", { tenant: h.tenantA });
    const foreignUserId = await createUser(h.tenantB, "tenant-b-reviewer", ["COMPLIANCE_REVIEWER"]);
    const foreign = principal(h.tenantB, foreignUserId, ["COMPLIANCE_REVIEWER"]);

    await expect(f.query.getCaseView(foreign, f.assuranceCase.caseKey)).rejects.toBeInstanceOf(
      AssuranceServiceNotFoundError,
    );
    await expect(
      f.service.evaluate(foreign, {
        caseKey: f.assuranceCase.caseKey,
        expectationId: f.expectation.id,
      }),
    ).rejects.toBeInstanceOf(AssuranceServiceNotFoundError);
  });
});
