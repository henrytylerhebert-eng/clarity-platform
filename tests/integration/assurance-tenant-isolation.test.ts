import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AssuranceNotFoundError, PrismaAssuranceGateway } from "@clarity/case-repository";
import { createHarness, type Harness, type TenantFixture } from "./helpers/harness.js";

let h: Harness;

beforeAll(async () => {
  h = await createHarness();
});

afterAll(async () => h?.dispose());

async function createFacility(tenant: TenantFixture, suffix: string) {
  return h.prisma.facilityProfile.create({
    data: {
      organizationId: tenant.organizationId,
      name: `Synthetic OA Isolation Facility ${suffix} ${h.runId}`,
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

describe("Operating Assurance tenant isolation", () => {
  it("does not reveal another tenant's case through a guessed key or ID", async () => {
    const facilityA = await createFacility(h.tenantA, "a");
    const gateway = new PrismaAssuranceGateway(h.prisma);
    const caseA = await gateway.createCase(
      h.tenantA.organizationId,
      {
        facilityProfileId: facilityA.id,
        caseKey: `oa-isolation-${h.runId}`,
        title: "Tenant A assurance case",
        assuranceStatement: "Synthetic tenant-isolation fixture.",
      },
      actor(h.tenantA),
    );

    expect(await gateway.findCaseByKey(h.tenantB.organizationId, caseA.caseKey)).toBeUndefined();
    await expect(
      gateway.addParticipant(
        h.tenantB.organizationId,
        {
          assuranceCaseId: caseA.id,
          userId: h.tenantB.userId,
          role: "OWNER",
        },
        actor(h.tenantB),
      ),
    ).rejects.toBeInstanceOf(AssuranceNotFoundError);
  });

  it("rejects a facility belonging to another organization", async () => {
    const facilityA = await createFacility(h.tenantA, "foreign-facility");
    const gateway = new PrismaAssuranceGateway(h.prisma);

    await expect(
      gateway.createCase(
        h.tenantB.organizationId,
        {
          facilityProfileId: facilityA.id,
          caseKey: `oa-foreign-facility-${h.runId}`,
          title: "Cross-tenant facility attempt",
          assuranceStatement: "Must not be created.",
        },
        actor(h.tenantB),
      ),
    ).rejects.toBeInstanceOf(AssuranceNotFoundError);
  });

  it("rejects cross-tenant source relationships before a conflict can be persisted", async () => {
    const facilityA = await createFacility(h.tenantA, "source-a");
    const facilityB = await createFacility(h.tenantB, "source-b");
    const gateway = new PrismaAssuranceGateway(h.prisma);
    const caseA = await gateway.createCase(
      h.tenantA.organizationId,
      { facilityProfileId: facilityA.id, caseKey: `oa-source-a-${h.runId}`, title: "Source A", assuranceStatement: "A" },
      actor(h.tenantA),
    );
    const caseB = await gateway.createCase(
      h.tenantB.organizationId,
      { facilityProfileId: facilityB.id, caseKey: `oa-source-b-${h.runId}`, title: "Source B", assuranceStatement: "B" },
      actor(h.tenantB),
    );
    const sourceA = await gateway.addSourceReference(
      h.tenantA.organizationId,
      {
        assuranceCaseId: caseA.id,
        sourceFamilyKey: "SRC-A",
        versionLabel: "v1",
        title: "Synthetic A",
        authorityClass: "OTHER_EXTERNAL_AUTHORITY",
        citation: "A",
        currentness: "CURRENT",
        rightsStatus: "PERMITTED",
      },
      actor(h.tenantA),
    );
    const sourceB = await gateway.addSourceReference(
      h.tenantB.organizationId,
      {
        assuranceCaseId: caseB.id,
        sourceFamilyKey: "SRC-B",
        versionLabel: "v1",
        title: "Synthetic B",
        authorityClass: "OTHER_EXTERNAL_AUTHORITY",
        citation: "B",
        currentness: "CURRENT",
        rightsStatus: "PERMITTED",
      },
      actor(h.tenantB),
    );

    await expect(
      gateway.createSourceConflict(
        h.tenantA.organizationId,
        {
          assuranceCaseId: caseA.id,
          leftSourceId: sourceA.id,
          rightSourceId: sourceB.id,
        },
        actor(h.tenantA),
      ),
    ).rejects.toBeInstanceOf(AssuranceNotFoundError);
  });

  it("enforces the organization+case foreign key even through direct Prisma writes", async () => {
    const facilityA = await createFacility(h.tenantA, "fk");
    const gateway = new PrismaAssuranceGateway(h.prisma);
    const caseA = await gateway.createCase(
      h.tenantA.organizationId,
      { facilityProfileId: facilityA.id, caseKey: `oa-fk-${h.runId}`, title: "Composite FK fixture", assuranceStatement: "A" },
      actor(h.tenantA),
    );

    await expect(
      h.prisma.assuranceEvidenceExpectation.create({
        data: {
          organizationId: h.tenantB.organizationId,
          assuranceCaseId: caseA.id,
          code: "CROSS_TENANT",
          prompt: "Must fail",
          requiredKeys: ["x"],
        },
      }),
    ).rejects.toThrow();
  });

  it("cannot use another tenant's evidence in an evaluation", async () => {
    const facilityA = await createFacility(h.tenantA, "eval-a");
    const facilityB = await createFacility(h.tenantB, "eval-b");
    const gateway = new PrismaAssuranceGateway(h.prisma);
    const caseA = await gateway.createCase(
      h.tenantA.organizationId,
      { facilityProfileId: facilityA.id, caseKey: `oa-eval-a-${h.runId}`, title: "A", assuranceStatement: "A" },
      actor(h.tenantA),
    );
    const caseB = await gateway.createCase(
      h.tenantB.organizationId,
      { facilityProfileId: facilityB.id, caseKey: `oa-eval-b-${h.runId}`, title: "B", assuranceStatement: "B" },
      actor(h.tenantB),
    );
    const expectationA = await gateway.addEvidenceExpectation(
      h.tenantA.organizationId,
      { assuranceCaseId: caseA.id, code: "EA", prompt: "A", requiredKeys: ["x"] },
      actor(h.tenantA),
    );
    const evidenceA = await gateway.submitEvidence(
      h.tenantA.organizationId,
      { assuranceCaseId: caseA.id, expectationId: expectationA.id, payload: { x: true } },
      actor(h.tenantA),
    );

    await expect(
      gateway.recordEvaluation(
        h.tenantB.organizationId,
        {
          assuranceCaseId: caseB.id,
          evidenceSubmissionId: evidenceA.id,
          result: "SUPPORTED",
          reasonCodes: ["EVIDENCE_COMPLETE"],
          sourceStateSnapshot: {},
        },
        actor(h.tenantB),
      ),
    ).rejects.toBeInstanceOf(AssuranceNotFoundError);
  });
});
