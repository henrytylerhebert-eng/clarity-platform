import { beforeAll, describe, expect, it } from "vitest";
import {
  TARGET_TRANSITIONS,
  buildCaseDependencyMap,
  buildSyntheticDependencyQueue,
  filterDependencyNodes,
  primaryBlocker,
} from "./caseDependencyMap";
import { createSeedState } from "./seed";
import type { AppState } from "./types";

let state: AppState;

beforeAll(async () => {
  state = await createSeedState();
});

describe("case dependency map", () => {
  it("builds target-specific readiness without a universal readiness score", () => {
    const reviewMap = buildCaseDependencyMap(state, "case-004", "clinical-legal-review");
    const handoffMap = buildCaseDependencyMap(state, "case-004", "transport-custody-handoff");

    expect(reviewMap.targetTransition).toBe("clinical-legal-review");
    expect(handoffMap.targetTransition).toBe("transport-custody-handoff");
    expect(reviewMap.nodes.some((node) => node.id === "admission-handoff")).toBe(false);
    expect(handoffMap.nodes.some((node) => node.id === "admission-handoff")).toBe(true);
    expect(handoffMap.nodes).toBeDefined();
    expect(handoffMap).not.toHaveProperty("score");
    expect(handoffMap).not.toHaveProperty("readinessScore");
    expect(handoffMap).not.toHaveProperty("priorityRank");
  });

  it("keeps dependency references inside the target node set", () => {
    for (const target of TARGET_TRANSITIONS) {
      const map = buildCaseDependencyMap(state, "case-004", target);
      const nodeIds = new Set(map.nodes.map((node) => node.id));
      for (const node of map.nodes) {
        for (const dependencyId of node.dependencyIds) {
          expect(nodeIds.has(dependencyId)).toBe(true);
        }
      }
      for (const edge of map.edges) {
        expect(nodeIds.has(edge.from)).toBe(true);
        expect(nodeIds.has(edge.to)).toBe(true);
      }
    }
  });

  it("projects the case-owned admission episode as a separate dependency", () => {
    const map = buildCaseDependencyMap(state, "case-004", "admission-transition");
    const episode = map.nodes.find((node) => node.id === "admission-episode");
    expect(episode?.resolutionWorkspace).toBe("admit");
    expect(episode?.status).toBe("incomplete");
    expect(episode?.dependencyIds).toEqual(expect.arrayContaining(["psychiatrist-acceptance", "medical-clearance"]));
  });

  it("distinguishes blockers, warnings, external waits, stale data, and restricted details", () => {
    const map = buildCaseDependencyMap(state, "case-004", "transport-custody-handoff");
    expect(map.nodes.some((node) => node.blockingClass === "review-gate")).toBe(true);
    expect(map.nodes.some((node) => node.blockingClass === "warning")).toBe(true);
    expect(map.nodes.some((node) => node.waitType === "external")).toBe(true);
    expect(map.nodes.some((node) => node.freshness === "stale")).toBe(true);
    expect(map.nodes.some((node) => node.restrictedDetail)).toBe(true);
  });

  it("keeps financial readiness parallel to emergency clinical review", () => {
    const map = buildCaseDependencyMap(state, "case-001", "clinical-legal-review");
    const benefits = map.nodes.find((node) => node.id === "benefits-verification");
    expect(benefits?.blockingClass).toBe("warning");
    expect(benefits?.explanation).toMatch(/never blocks emergency clinical review/i);
  });

  it("uses operational language and avoids autonomous regulated conclusions", () => {
    const mapText = JSON.stringify(buildCaseDependencyMap(state, "case-004", "transport-custody-handoff"));
    expect(mapText).toMatch(/review is pending|counsel validation|response state|missing acknowledgement/i);
    expect(mapText).not.toMatch(/patient is legally (eligible|ineligible)/i);
    expect(mapText).not.toMatch(/medical necessity (is met|fails|passed|denied)/i);
    expect(mapText).not.toMatch(/facility should (accept|decline)/i);
    expect(mapText).not.toMatch(/payer will (approve|deny)/i);
    expect(mapText).not.toMatch(/employee failure/i);
  });

  it("filters nodes by workstream, owner, status, and wait type", () => {
    const map = buildCaseDependencyMap(state, "case-004", "transport-custody-handoff");
    expect(filterDependencyNodes(map.nodes, { workstream: "Legal status" }).map((node) => node.workstream)).toEqual(["Legal status"]);
    expect(filterDependencyNodes(map.nodes, { ownerRole: "Receiving facility" }).every((node) => node.ownerRole === "Receiving facility")).toBe(true);
    expect(filterDependencyNodes(map.nodes, { status: "external-wait" }).every((node) => node.blockingClass === "external-wait")).toBe(true);
    expect(filterDependencyNodes(map.nodes, { waitType: "external" }).every((node) => node.waitType === "external")).toBe(true);
  });

  it("creates deterministic 5, 25, and 100 case density scenarios", () => {
    for (const size of [5, 25, 100] as const) {
      const queue = buildSyntheticDependencyQueue(state, "transport-custody-handoff", size);
      expect(queue).toHaveLength(size);
      expect(queue.every((item) => primaryBlocker(item.nodes))).toBe(true);
    }
  });
});
