import { describe, expect, it } from "vitest";
import { evaluatePlacement, unitAcuitySummary, validatePlacementDecision } from "./bedboard";
import type { AcuityProfile, Bed, Unit } from "./types";

const unit: Unit = { id: "unit-a", name: "Adult Unit A", population: "Adult", acuityCeiling: 3.5 };

const calmCandidate: AcuityProfile = {
  acuityLevel: 2,
  aggressionRisk: "Low",
  elopementRisk: "Low",
  siPrecautions: false,
  vulnerableAdult: false,
  observationLevel: "Routine",
};

function bed(overrides: Partial<Bed>): Bed {
  return {
    id: "bed-1",
    unitId: "unit-a",
    room: "Room 1",
    label: "1-A",
    nearNurseStation: false,
    nearExit: false,
    status: "Available",
    ...overrides,
  };
}

describe("evaluatePlacement", () => {
  it("hard-stops a vulnerable candidate rooming with a high-aggression occupant", () => {
    const target = bed({ id: "bed-b", room: "Room 2", label: "2-B" });
    const roommate = bed({
      id: "bed-a",
      room: "Room 2",
      label: "2-A",
      status: "Occupied",
      occupantAcuity: { ...calmCandidate, acuityLevel: 4, aggressionRisk: "High", observationLevel: "1:1" },
    });
    const flags = evaluatePlacement(
      { ...calmCandidate, siPrecautions: true },
      "Adult",
      target,
      unit,
      [target, roommate],
    );
    expect(flags.some((flag) => flag.code === "roommate_aggression_vulnerable" && flag.severity === "Hard stop")).toBe(true);
  });

  it("warns when a high elopement risk is placed near an exit", () => {
    const target = bed({ nearExit: true });
    const flags = evaluatePlacement({ ...calmCandidate, elopementRisk: "High" }, "Adult", target, unit, [target]);
    expect(flags.some((flag) => flag.code === "elopement_near_exit" && flag.severity === "Warning")).toBe(true);
  });

  it("hard-stops population mismatch between candidate and unit", () => {
    const target = bed({});
    const flags = evaluatePlacement(calmCandidate, "Youth", target, unit, [target]);
    expect(flags.some((flag) => flag.code === "population_mismatch")).toBe(true);
  });

  it("returns no flags for a safe placement", () => {
    const target = bed({ nearNurseStation: true });
    const flags = evaluatePlacement(calmCandidate, "Adult", target, unit, [target]);
    expect(flags).toEqual([]);
  });

  it("warns when placement pushes the unit past its acuity ceiling", () => {
    const target = bed({ id: "bed-open", room: "Room 3", label: "3-A" });
    const occupied = bed({
      id: "bed-full",
      room: "Room 4",
      label: "4-A",
      status: "Occupied",
      occupantAcuity: { ...calmCandidate, acuityLevel: 4 },
    });
    const flags = evaluatePlacement(
      { ...calmCandidate, acuityLevel: 5 },
      "Adult",
      target,
      unit,
      [target, occupied],
    );
    expect(flags.some((flag) => flag.code === "unit_acuity_ceiling")).toBe(true);
  });
});

describe("unitAcuitySummary", () => {
  it("rolls up occupancy, average acuity, and observation load", () => {
    const beds = [
      bed({ id: "b1", status: "Occupied", occupantAcuity: { ...calmCandidate, acuityLevel: 4, observationLevel: "1:1" } }),
      bed({ id: "b2", status: "Occupied", occupantAcuity: { ...calmCandidate, acuityLevel: 2, observationLevel: "Q15" } }),
      bed({ id: "b3", status: "Available" }),
    ];
    const summary = unitAcuitySummary(unit, beds);
    expect(summary.occupiedBeds).toBe(2);
    expect(summary.availableBeds).toBe(1);
    expect(summary.averageAcuity).toBe(3);
    expect(summary.oneToOneCount).toBe(1);
    expect(summary.q15Count).toBe(1);
  });
});

describe("validatePlacementDecision", () => {
  it("requires a reason to override", () => {
    expect(validatePlacementDecision("Overridden", "")).toMatch(/Override requires/);
    expect(validatePlacementDecision("Overridden", "Unit acuity concern; holding for 101-A discharge.")).toBeNull();
    expect(validatePlacementDecision("Accepted")).toBeNull();
  });
});
