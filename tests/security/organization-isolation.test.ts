import { describe, expect, it } from "vitest";
import { assertSameOrganization, scopeToOrganization } from "@clarity/domain-contracts";

const orgOneA = { organizationId: "org-1", caseKey: "synthetic-a" };
const orgOneB = { organizationId: "org-1", caseKey: "synthetic-b" };
const orgTwoC = { organizationId: "org-2", caseKey: "synthetic-c" };
const records = [orgOneA, orgOneB, orgTwoC];

describe("organization isolation", () => {
  it("scoped listing never returns another organization's records", () => {
    const mine = scopeToOrganization("org-1", records);
    expect(mine).toHaveLength(2);
    expect(mine.every((r) => r.organizationId === "org-1")).toBe(true);
  });

  it("direct cross-organization access throws instead of returning data", () => {
    expect(() => assertSameOrganization("org-1", orgTwoC)).toThrow(/Cross-organization access denied/);
  });

  it("same-organization access passes", () => {
    expect(() => assertSameOrganization("org-1", orgOneA)).not.toThrow();
  });
});
