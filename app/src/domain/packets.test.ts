import { describe, expect, it } from "vitest";
import { buildPacketForCase, computePacketChecklist, computePacketCompleteness } from "./packets";
import { createSeedState } from "./seed";

describe("packet builder", () => {
  it("scores the packet-ready seed case at full checklist coverage", async () => {
    const state = await createSeedState();
    const checklist = computePacketChecklist(state, "case-004");
    expect(checklist.every((item) => item.present)).toBe(true);
    expect(computePacketCompleteness(state, "case-004")).toBe(100);
  });

  it("marks missing formulation and collateral for the adult SI seed case", async () => {
    const state = await createSeedState();
    const checklist = computePacketChecklist(state, "case-001");
    const byLabel = Object.fromEntries(checklist.map((item) => [item.label, item.present]));
    expect(byLabel["Risk formulation"]).toBe(false);
    expect(byLabel["Collateral documented"]).toBe(false);
    expect(computePacketCompleteness(state, "case-001")).toBeLessThan(100);
  });

  it("builds a deterministic packet hash from case artifacts", async () => {
    const state = await createSeedState();
    const first = await buildPacketForCase(state, "case-001");
    const second = await buildPacketForCase(state, "case-001");
    expect(first.packetHash).toBe(second.packetHash);
    expect(first.status).toBe("Ready");
    expect(first.includedArtifactLabels).toContain("Assessment summary");

    const mutated = {
      ...state,
      assessments: state.assessments.map((item) =>
        item.caseId === "case-001" ? { ...item, formulation: "New formulation text long enough to count." } : item,
      ),
    };
    const third = await buildPacketForCase(mutated, "case-001");
    expect(third.packetHash).not.toBe(first.packetHash);
  });
});
