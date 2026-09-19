import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { PrismaCaseCommandGateway, PrismaCaseRepository } from "@clarity/case-repository";
import { CaseCommandService, type CommandActor } from "@clarity/case-service";
import { createHarness, type Harness, tickingClock } from "./helpers/harness.js";
import { domainToCreateRow } from "../../packages/case-repository/src/mappers.js";

let h: Harness;
let repo: PrismaCaseRepository;
let service: CaseCommandService;

const sysAdminActor: CommandActor = { actorId: "test", actorType: "USER", roles: ["INTAKE_COORDINATOR"] };

beforeAll(async () => {
  h = await createHarness();
  repo = new PrismaCaseRepository(h.prisma, undefined, tickingClock());
  service = new CaseCommandService(new PrismaCaseCommandGateway(h.prisma, undefined, tickingClock()));
});

afterAll(async () => h?.dispose());

describe("Legacy Persistence Compatibility", () => {
  const legacyStatuses = [
    "CLINICAL_REVIEW",
    "LEGAL_REVIEW",
    "BENEFITS_REVIEW",
    "AUTHORIZATION_PREPARATION"
  ] as const;

  for (const legacy of legacyStatuses) {
    it(`preserves legacy status ${legacy} and allows transition to REVIEW_IN_PROGRESS`, async () => {
      const orgId = h.tenantA.organizationId;
      const caseKey = h.caseKey(`legacy-${legacy.toLowerCase()}`);
      
      const caseData = h.makeCaseData(h.tenantA, `legacy-${legacy.toLowerCase()}`);
      
      const rowInput = domainToCreateRow(orgId, {
        ...caseData,
        status: legacy as /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ any
      });
      await h.prisma.behavioralHealthCase.create({ data: rowInput });

      const readCase = await repo.findByKey(orgId, caseKey);
      
      expect(readCase!.status).toBe(legacy);
      
      const decision = await service.transitionCase({
        organizationId: orgId,
        caseKey: caseKey,
        actor: sysAdminActor,
        to: "REVIEW_IN_PROGRESS"
      });
      
      expect(decision.case.status).toBe("REVIEW_IN_PROGRESS");
      
      const audit = await h.prisma.auditEvent.findFirst({
        where: { caseId: caseKey, action: "CASE_STATUS_CHANGED" },
        orderBy: { timestamp: "desc" }
      });
      expect(audit).toBeDefined();
      const metadata = audit!.modelMetadata as /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ any;
      expect(metadata.from).toBe(legacy);
      expect(metadata.to).toBe("REVIEW_IN_PROGRESS");
    });
  }

  it("fails trying to transition into any legacy status through an operational writer", async () => {
    const orgId = h.tenantA.organizationId;
    const caseKey = h.caseKey("test-legacy-reject");
    
    await repo.create(orgId, h.makeCaseData(h.tenantA, "test-legacy-reject"), sysAdminActor as any);
    
    await expect(
      service.transitionCase({
        organizationId: orgId,
        caseKey: caseKey,
        actor: sysAdminActor,
        to: "CLINICAL_REVIEW" as /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ any
      })
    ).rejects.toThrow();
  });
});
