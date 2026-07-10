import { describe, expect, it } from "vitest";
import { getRoleFocus } from "./roleFocus";
import { roles } from "./roles";
import { createSeedState } from "./seed";

describe("getRoleFocus", () => {
  it("returns focus chips for every persona except the unscoped demo view", async () => {
    const state = await createSeedState();
    const nowIso = new Date().toISOString();
    for (const role of roles) {
      const chips = getRoleFocus(role.id, state, "case-001", nowIso);
      if (role.id === "all") {
        expect(chips).toEqual([]);
      } else {
        expect(chips.length).toBeGreaterThanOrEqual(2);
        expect(chips.length).toBeLessThanOrEqual(4);
      }
    }
  });

  it("surfaces the seeded escalation to central intake", async () => {
    const state = await createSeedState();
    const chips = getRoleFocus("central", state, "case-001", new Date().toISOString());
    const breached = chips.find((chip) => chip.label === "Breached clocks");
    expect(breached?.value).toBe("1");
    expect(breached?.tone).toBe("danger");
  });

  it("shows the charge nurse pending placement and available beds", async () => {
    const state = await createSeedState();
    const chips = getRoleFocus("nurse", state, "case-004", new Date().toISOString());
    expect(chips.find((chip) => chip.label === "Pending placements")?.value).toBe("1");
    expect(Number(chips.find((chip) => chip.label === "Available beds")?.value)).toBeGreaterThan(0);
  });

  it("keeps the executive evidence posture honest", async () => {
    const state = await createSeedState();
    const chips = getRoleFocus("executive", state, "case-001", new Date().toISOString());
    expect(chips.find((chip) => chip.label === "Baseline outcomes")?.value).toBe("No measurements found");
  });

  it("reflects field-responder guard state for the selected case", async () => {
    const state = await createSeedState();
    const chips = getRoleFocus("field", state, "case-003", new Date().toISOString());
    expect(chips.find((chip) => chip.label === "Collateral")?.value).toBe("Missing");
    expect(Number(chips.find((chip) => chip.label === "Pitfall guards")?.value)).toBeGreaterThan(0);
  });
});
