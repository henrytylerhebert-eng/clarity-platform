import { describe, expect, it } from "vitest";
import {
  buildOperationsDashboardExceptions,
  filterOperationsExceptionsByGate,
  getOperationsOwnerChain,
  operationsBackboneFixture,
  validateOperationsBackbone,
} from "./operationsBackbone";
import type { OperationsBackbone } from "./operationsBackbone";

describe("operations backbone", () => {
  it("keeps every event attached to a valid facility, department, role, and owner chain", () => {
    expect(validateOperationsBackbone(operationsBackboneFixture)).toEqual([]);

    for (const event of operationsBackboneFixture.events) {
      const chain = getOperationsOwnerChain(operationsBackboneFixture, event);
      expect(chain?.facility.name).toBe("Bayou Vista Behavioral (synthetic)");
      expect(chain?.department.facilityId).toBe(chain?.facility.id);
      expect(chain?.role.departmentId).toBe(chain?.department.id);
      expect(chain?.owner.roleId).toBe(chain?.role.id);
    }
  });

  it("detects broken reporting chains before they become dashboard exceptions", () => {
    const broken: OperationsBackbone = {
      ...operationsBackboneFixture,
      events: [
        {
          ...operationsBackboneFixture.events[0],
          id: "ops-event-broken-owner",
          ownerId: "owner-does-not-exist",
        },
      ],
    };

    expect(validateOperationsBackbone(broken)).toEqual([
      "ops-event-broken-owner has an invalid facility -> department -> role -> owner chain",
    ]);
    expect(buildOperationsDashboardExceptions(broken)).toEqual([]);
  });

  it("projects only unresolved source events into read-only dashboard exceptions", () => {
    const exceptions = buildOperationsDashboardExceptions(operationsBackboneFixture);

    expect(exceptions.map((item) => item.sourceEventId)).toEqual([
      "ops-event-ur-gap",
      "ops-event-referral-missing-info",
      "ops-event-safety",
      "ops-event-training",
    ]);
    expect(exceptions.every((item) => item.projectionStatus === "read-only-synthetic-projection")).toBe(true);
    expect(exceptions.some((item) => item.sourceEventId === "ops-event-transport-resolved")).toBe(false);
  });

  it("preserves review gates instead of turning job titles into permissions", () => {
    const exceptions = buildOperationsDashboardExceptions(operationsBackboneFixture);
    const clinical = filterOperationsExceptionsByGate(exceptions, "clinical-review");
    const compliance = filterOperationsExceptionsByGate(exceptions, "legal-compliance-review");
    const ur = filterOperationsExceptionsByGate(exceptions, "ur-revenue-cycle-review");

    expect(clinical.map((item) => item.sourceEventId)).toEqual([
      "ops-event-ur-gap",
      "ops-event-referral-missing-info",
      "ops-event-safety",
    ]);
    expect(compliance.map((item) => item.sourceEventId)).toEqual(["ops-event-safety", "ops-event-training"]);
    expect(ur.map((item) => item.sourceEventId)).toEqual(["ops-event-ur-gap"]);
  });

  it("keeps financial readiness separate from emergency clinical action", () => {
    const exceptions = buildOperationsDashboardExceptions(operationsBackboneFixture);
    const urException = exceptions.find((item) => item.sourceEventId === "ops-event-ur-gap");

    expect(urException?.eventType).toBe("ur-documentation-gap");
    expect(urException?.reviewGates).toContain("ur-revenue-cycle-review");
    expect(urException?.reviewGates).toContain("clinical-review");
    expect(urException?.summary).not.toMatch(/guarantee|approve payment|block emergency/i);
  });
});
