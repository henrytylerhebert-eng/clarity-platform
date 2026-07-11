import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CaseNotFoundError, PrismaCaseRepository } from "@clarity/case-repository";
import { createHarness, tickingClock, TEST_ACTOR, type Harness } from "./helpers/harness.js";

let h: Harness;
let repo: PrismaCaseRepository;

beforeAll(async () => {
  h = await createHarness();
  repo = new PrismaCaseRepository(h.prisma, undefined, tickingClock());
  // One case per tenant, created up front.
  await repo.create(h.tenantA.organizationId, h.makeCaseData(h.tenantA, "iso-a"), TEST_ACTOR);
  await repo.create(h.tenantB.organizationId, h.makeCaseData(h.tenantB, "iso-b"), TEST_ACTOR);
});
afterAll(async () => h?.dispose());

describe("organization isolation (DB)", () => {
  it("tenant A can create and read its own case", async () => {
    const own = await repo.findByKey(h.tenantA.organizationId, h.caseKey("iso-a"));
    expect(own?.organizationId).toBe(h.tenantA.organizationId);
  });

  it("tenant A cannot read tenant B's case by its key", async () => {
    const stolen = await repo.findByKey(h.tenantA.organizationId, h.caseKey("iso-b"));
    expect(stolen).toBeUndefined();
  });

  it("list operations never return another tenant's records", async () => {
    const listA = await repo.listForOrganization(h.tenantA.organizationId);
    expect(listA.length).toBeGreaterThanOrEqual(1);
    expect(listA.every((c) => c.organizationId === h.tenantA.organizationId)).toBe(true);
    expect(listA.some((c) => c.caseKey === h.caseKey("iso-b"))).toBe(false);
  });

  it("tenant A cannot transition or update tenant B's case, and B's row is untouched", async () => {
    await expect(
      repo.transitionStatus(h.tenantA.organizationId, h.caseKey("iso-b"), "INTAKE_IN_PROGRESS", TEST_ACTOR),
    ).rejects.toBeInstanceOf(CaseNotFoundError);
    await expect(
      repo.updateWorkstream(h.tenantA.organizationId, h.caseKey("iso-b"), "benefits", "IN_PROGRESS", TEST_ACTOR),
    ).rejects.toBeInstanceOf(CaseNotFoundError);
    const b = await repo.findByKey(h.tenantB.organizationId, h.caseKey("iso-b"));
    expect(b?.status).toBe("DRAFT");
    expect(b?.workstreams.benefits).toBe("NOT_STARTED");
  });

  it("a cross-tenant miss is indistinguishable from a nonexistent case", async () => {
    const missOtherTenant = await repo.findByKey(h.tenantA.organizationId, h.caseKey("iso-b"));
    const missNowhere = await repo.findByKey(h.tenantA.organizationId, h.caseKey("does-not-exist"));
    expect(missOtherTenant).toBe(missNowhere); // both undefined

    const errOtherTenant = await repo
      .transitionStatus(h.tenantA.organizationId, h.caseKey("iso-b"), "INTAKE_IN_PROGRESS", TEST_ACTOR)
      .catch((e: Error) => e.message.replace(h.caseKey("iso-b"), "<key>"));
    const errNowhere = await repo
      .transitionStatus(h.tenantA.organizationId, h.caseKey("does-not-exist"), "INTAKE_IN_PROGRESS", TEST_ACTOR)
      .catch((e: Error) => e.message.replace(h.caseKey("does-not-exist"), "<key>"));
    expect(errOtherTenant).toBe(errNowhere);
  });

  it("audit events remain tenant-scoped", async () => {
    const bEventsForACase = await h.prisma.auditEvent.findMany({
      where: { organizationId: h.tenantB.organizationId, caseId: h.caseKey("iso-a") },
    });
    expect(bEventsForACase).toHaveLength(0);
    const aEvents = await h.prisma.auditEvent.findMany({
      where: { organizationId: h.tenantA.organizationId, caseId: h.caseKey("iso-a") },
    });
    expect(aEvents.length).toBeGreaterThanOrEqual(1);
    expect(aEvents.every((e) => e.organizationId === h.tenantA.organizationId)).toBe(true);
  });

  it("cleanup of one tenant's records does not remove another tenant's records", async () => {
    const tenantC = await h.createTenant("c");
    await repo.create(tenantC.organizationId, h.makeCaseData(tenantC, "iso-c"), TEST_ACTOR);
    await h.cleanupTenants([tenantC.organizationId]);

    expect(await repo.findByKey(tenantC.organizationId, h.caseKey("iso-c"))).toBeUndefined();
    expect(await repo.findByKey(h.tenantA.organizationId, h.caseKey("iso-a"))).toBeDefined();
    expect(await repo.findByKey(h.tenantB.organizationId, h.caseKey("iso-b"))).toBeDefined();
  });
});
