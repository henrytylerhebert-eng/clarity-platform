import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaCaseRepository, type PersistedCase } from "@clarity/case-repository";
import {
  loadSyntheticCases,
  RESTRICTED_AUDIT_FIELDS,
  type CaseStatus,
  type SyntheticCase,
  type UrgencyLevel,
  type WorkstreamStatuses,
} from "@clarity/domain-contracts";
import { createHarness, tickingClock, TEST_ACTOR, type Harness } from "./helpers/harness.js";

const FIXTURE_DIR = join(process.cwd(), "data", "synthetic-cases");

let h: Harness;
let repo: PrismaCaseRepository;

beforeAll(async () => {
  h = await createHarness();
  repo = new PrismaCaseRepository(h.prisma, undefined, tickingClock());
});
afterAll(async () => h?.dispose());

function fixtureToCase(fixture: SyntheticCase, harness: Harness): PersistedCase {
  return {
    caseKey: `${fixture.caseKey}-${harness.runId}`,
    organizationId: harness.tenantA.organizationId,
    patientTokenId: harness.tenantA.patientTokenId,
    status: fixture.case.status as CaseStatus,
    urgency: fixture.case.urgency as UrgencyLevel,
    workstreams: {
      clinical: fixture.case.clinicalStatus,
      legalReview: fixture.case.legalReviewStatus,
      medicalScreening: fixture.case.medicalScreeningStatus,
      benefits: fixture.case.benefitsStatus,
      authorization: fixture.case.authorizationStatus,
      placement: fixture.case.placementStatus,
      transportation: fixture.case.transportationStatus,
      patientEducation: fixture.case.patientEducationStatus,
    } as WorkstreamStatuses,
  };
}

describe("synthetic seed loading into clarity_dev", () => {
  it("persists every validated fixture through the repository and reads it back intact", async () => {
    const fixtures = loadSyntheticCases(FIXTURE_DIR);
    expect(fixtures.length).toBeGreaterThanOrEqual(3);

    for (const fixture of fixtures) {
      const created = await repo.create(h.tenantA.organizationId, fixtureToCase(fixture, h), TEST_ACTOR, {
        metadata: { seededFrom: fixture.caseKey },
      });
      const fresh = await repo.findByKey(h.tenantA.organizationId, created.caseKey);
      expect(fresh?.status).toBe(fixture.case.status);
      expect(fresh?.urgency).toBe(fixture.case.urgency);
      expect(fresh?.workstreams.benefits).toBe(fixture.case.benefitsStatus);
    }
    const list = await repo.listForOrganization(h.tenantA.organizationId);
    expect(list.length).toBeGreaterThanOrEqual(fixtures.length);
  });

  it("persisted rows and their audit trail contain no restricted identifiers", async () => {
    const cases = await h.prisma.behavioralHealthCase.findMany({
      where: { organizationId: h.tenantA.organizationId },
    });
    const audits = await h.prisma.auditEvent.findMany({
      where: { organizationId: h.tenantA.organizationId },
    });
    const serialized = JSON.stringify({ cases, audits }).toLowerCase();
    for (const restricted of RESTRICTED_AUDIT_FIELDS) {
      expect(serialized).not.toContain(`"${restricted.toLowerCase()}"`);
    }
    expect(serialized).not.toMatch(/\b\d{3}-\d{2}-\d{4}\b/); // SSN shape
  });
});
