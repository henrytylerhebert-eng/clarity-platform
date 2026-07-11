import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  CASE_AUDIT_ACTIONS,
  PrismaCaseRepository,
  type CaseAuditWriter,
} from "@clarity/case-repository";
import { RESTRICTED_AUDIT_FIELDS } from "@clarity/domain-contracts";
import { createHarness, tickingClock, TEST_ACTOR, type Harness } from "./helpers/harness.js";

let h: Harness;
let repo: PrismaCaseRepository;

beforeAll(async () => {
  h = await createHarness();
  repo = new PrismaCaseRepository(h.prisma, undefined, tickingClock());
});
afterAll(async () => h?.dispose());

async function auditRows(caseKey: string) {
  return h.prisma.auditEvent.findMany({
    where: { organizationId: h.tenantA.organizationId, caseId: caseKey },
    orderBy: [{ timestamp: "asc" }, { id: "asc" }],
  });
}

describe("append-only audit persistence (DB)", () => {
  it("every mutation writes an ordered audit event with correct tenant, case, actor, and action", async () => {
    const key = h.caseKey("audit-flow");
    await repo.create(h.tenantA.organizationId, h.makeCaseData(h.tenantA, "audit-flow"), TEST_ACTOR);
    await repo.transitionStatus(h.tenantA.organizationId, key, "INTAKE_IN_PROGRESS", TEST_ACTOR, {
      reason: "synthetic flow",
    });
    await repo.updateWorkstream(h.tenantA.organizationId, key, "benefits", "IN_PROGRESS", TEST_ACTOR);

    const rows = await auditRows(key);
    expect(rows.map((r) => r.action)).toEqual([
      CASE_AUDIT_ACTIONS.created,
      CASE_AUDIT_ACTIONS.statusChanged,
      CASE_AUDIT_ACTIONS.workstreamChanged,
    ]);
    for (const r of rows) {
      expect(r.organizationId).toBe(h.tenantA.organizationId);
      expect(r.caseId).toBe(key);
      expect(r.actorType).toBe("USER");
      expect(r.actorId).toBe(TEST_ACTOR.actorId);
      expect(r.objectType).toBe("BehavioralHealthCase");
    }
    expect(rows[1]?.modelMetadata).toMatchObject({ from: "DRAFT", to: "INTAKE_IN_PROGRESS" });
    expect(rows[1]?.reason).toBe("synthetic flow");
  });

  it("earlier audit events are unchanged by later mutations (append-only)", async () => {
    const key = h.caseKey("audit-immutable");
    await repo.create(h.tenantA.organizationId, h.makeCaseData(h.tenantA, "audit-immutable"), TEST_ACTOR);
    const [first] = await auditRows(key);
    await repo.transitionStatus(h.tenantA.organizationId, key, "INTAKE_IN_PROGRESS", TEST_ACTOR);
    await repo.transitionStatus(h.tenantA.organizationId, key, "DOCUMENTS_PENDING", TEST_ACTOR);
    const rowsAfter = await auditRows(key);
    expect(rowsAfter).toHaveLength(3);
    expect(rowsAfter[0]).toEqual(first);
  });

  it.each(["memberId", "medicareNumber", "policyNumber", "ssn"])(
    "rejects mutation metadata containing %s and rolls back the mutation",
    async (field) => {
      const key = h.caseKey(`audit-restricted-${field}`);
      await repo.create(h.tenantA.organizationId, h.makeCaseData(h.tenantA, `audit-restricted-${field}`), TEST_ACTOR);
      await expect(
        repo.transitionStatus(h.tenantA.organizationId, key, "INTAKE_IN_PROGRESS", TEST_ACTOR, {
          metadata: { [field]: "SYN-VALUE" },
        }),
      ).rejects.toThrow(/Restricted identifier/);
      // rollback proof: no status change and no audit event beyond CASE_CREATED
      const fresh = await repo.findByKey(h.tenantA.organizationId, key);
      expect(fresh?.status).toBe("DRAFT");
      expect(await auditRows(key)).toHaveLength(1);
    },
  );

  it("rejects restricted identifiers nested at depth", async () => {
    const key = h.caseKey("audit-nested");
    await repo.create(h.tenantA.organizationId, h.makeCaseData(h.tenantA, "audit-nested"), TEST_ACTOR);
    await expect(
      repo.transitionStatus(h.tenantA.organizationId, key, "INTAKE_IN_PROGRESS", TEST_ACTOR, {
        metadata: { coverage: { subscriber: { memberId: "SYN-123" } } },
      }),
    ).rejects.toThrow(/Restricted identifier/);
    expect((await repo.findByKey(h.tenantA.organizationId, key))?.status).toBe("DRAFT");
  });

  it("accepts safe metadata and stores it without restricted keys", async () => {
    const key = h.caseKey("audit-safe");
    await repo.create(h.tenantA.organizationId, h.makeCaseData(h.tenantA, "audit-safe"), TEST_ACTOR);
    await repo.transitionStatus(h.tenantA.organizationId, key, "INTAKE_IN_PROGRESS", TEST_ACTOR, {
      metadata: { coverageOrder: "PRIMARY", payerNameRaw: "Synthetic Commercial Health" },
    });
    const rows = await auditRows(key);
    const serialized = JSON.stringify(rows.map((r) => r.modelMetadata));
    for (const restricted of RESTRICTED_AUDIT_FIELDS) {
      expect(serialized.toLowerCase()).not.toContain(`"${restricted.toLowerCase()}"`);
    }
  });

  it("a failing audit write rolls back case creation entirely", async () => {
    const failingWriter: CaseAuditWriter = {
      write: async () => {
        throw new Error("synthetic audit outage");
      },
    };
    const failingRepo = new PrismaCaseRepository(h.prisma, failingWriter, tickingClock());
    await expect(
      failingRepo.create(h.tenantA.organizationId, h.makeCaseData(h.tenantA, "audit-outage"), TEST_ACTOR),
    ).rejects.toThrow(/synthetic audit outage/);
    expect(await repo.findByKey(h.tenantA.organizationId, h.caseKey("audit-outage"))).toBeUndefined();
  });

  it("a failing audit write rolls back a status transition", async () => {
    const key = h.caseKey("audit-outage-transition");
    await repo.create(h.tenantA.organizationId, h.makeCaseData(h.tenantA, "audit-outage-transition"), TEST_ACTOR);
    const failingWriter: CaseAuditWriter = {
      write: async () => {
        throw new Error("synthetic audit outage");
      },
    };
    const failingRepo = new PrismaCaseRepository(h.prisma, failingWriter, tickingClock());
    await expect(
      failingRepo.transitionStatus(h.tenantA.organizationId, key, "INTAKE_IN_PROGRESS", TEST_ACTOR),
    ).rejects.toThrow(/synthetic audit outage/);
    expect((await repo.findByKey(h.tenantA.organizationId, key))?.status).toBe("DRAFT");
    expect(await auditRows(key)).toHaveLength(1); // only CASE_CREATED
  });
});
