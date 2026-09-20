import { describe, expect, it } from "vitest";
import {
  BLOCKING_CLASSES,
  CASE_EPISODE_RELATIONSHIPS,
  CASE_STATUSES,
  GUIDANCE_SUPPRESSION_REASONS,
  JOURNEY_DISPOSITIONS,
  JOURNEY_PHASES,
  NEXT_WORK_KINDS,
  PACKET_REQUIREMENT_STATES,
  PRESCREEN_ENCOUNTER_STATUSES,
  PRESCREEN_READINESS_TARGETS,
  WORKSTREAMS,
  WORKSTREAM_STATUSES,
  type GuidanceSignal,
} from "@clarity/domain-contracts";
import {
  JOURNEY_PHASE_ORDER,
  WORKSTREAM_ORDER,
  blockingClassLabel,
  blockingClassTone,
  caseStatusLabel,
  describeAccessSignal,
  describeJourneyEvidence,
  dispositionLabel,
  dispositionTone,
  episodeRelationshipLabel,
  isAttentionClass,
  nextWorkLabel,
  packetRequirementStateLabel,
  phaseLabel,
  prescreenStatusLabel,
  prescreenTargetLabel,
  requirementLabelIndex,
  suppressionReasonLabel,
  workstreamLabel,
  workstreamStatusLabel,
  workstreamStatusTone,
} from "./accessPresentation";

/** A label that is missing, empty, or just the raw enum would leak into the UI. */
function expectTranslated(values: readonly string[], toLabel: (value: never) => string): void {
  for (const value of values) {
    const text = toLabel(value as never);
    expect(text, `label for ${value}`).toBeTruthy();
    expect(text, `label for ${value}`).not.toBe(value);
    expect(text, `label for ${value}`).not.toMatch(/^[A-Z0-9_]+$/);
  }
}

describe("accessPresentation — every contract value has a human label", () => {
  it.each([
    ["JourneyPhase", JOURNEY_PHASES, phaseLabel],
    ["JourneyDisposition", JOURNEY_DISPOSITIONS, dispositionLabel],
    ["CaseStatus", CASE_STATUSES, caseStatusLabel],
    ["PrescreenEncounterStatus", PRESCREEN_ENCOUNTER_STATUSES, prescreenStatusLabel],
    ["CaseEpisodeRelationship", CASE_EPISODE_RELATIONSHIPS, episodeRelationshipLabel],
    ["BlockingClass", BLOCKING_CLASSES, blockingClassLabel],
    ["Workstream", WORKSTREAMS, workstreamLabel],
    ["WorkstreamStatus", WORKSTREAM_STATUSES, workstreamStatusLabel],
    ["PrescreenReadinessTarget", PRESCREEN_READINESS_TARGETS, prescreenTargetLabel],
    ["PacketRequirementState", PACKET_REQUIREMENT_STATES, packetRequirementStateLabel],
    ["NextWorkKind", NEXT_WORK_KINDS, nextWorkLabel],
    ["GuidanceSuppressionReason", GUIDANCE_SUPPRESSION_REASONS, suppressionReasonLabel],
  ] as const)("%s", (_name, values, toLabel) => {
    expectTranslated(values, toLabel as (value: never) => string);
  });

  it("every blocking class and workstream status has a badge tone", () => {
    const tones = ["neutral", "good", "warn", "danger", "info"];
    for (const value of BLOCKING_CLASSES) expect(tones).toContain(blockingClassTone(value));
    for (const value of WORKSTREAM_STATUSES) expect(tones).toContain(workstreamStatusTone(value));
    for (const value of JOURNEY_DISPOSITIONS) expect(tones).toContain(dispositionTone(value));
  });

  it("falls back to the raw value, not undefined, for a value newer than this bundle", () => {
    expect(caseStatusLabel("A_FUTURE_STATUS" as never)).toBe("A_FUTURE_STATUS");
  });
});

describe("accessPresentation — ordering follows the contract", () => {
  it("orders the journey rail exactly as the contract declares the phases", () => {
    expect(JOURNEY_PHASE_ORDER).toEqual([...JOURNEY_PHASES]);
  });

  it("orders workstream lanes exactly as the contract declares them", () => {
    expect(WORKSTREAM_ORDER).toEqual([...WORKSTREAMS]);
  });
});

describe("accessPresentation — tone and attention", () => {
  it("colors by blocking class and never paints a satisfied fact as a warning", () => {
    expect(blockingClassTone("HARD_BLOCKER")).toBe("danger");
    expect(blockingClassTone("REVIEW_GATE")).toBe("warn");
    expect(blockingClassTone("EXTERNAL_WAIT")).toBe("info");
    expect(blockingClassTone("SATISFIED")).toBe("good");
    expect(blockingClassTone("NOT_APPLICABLE")).toBe("neutral");
  });

  it("treats only satisfied and not-applicable as non-attention", () => {
    const attention = BLOCKING_CLASSES.filter(isAttentionClass);
    expect(attention).toEqual(["HARD_BLOCKER", "REVIEW_GATE", "EXTERNAL_WAIT", "WARNING"]);
  });
});

describe("accessPresentation — describeAccessSignal", () => {
  const requirementSignal: GuidanceSignal = {
    signalId: "s1",
    scope: "PRESCREEN_TARGET",
    blockingClass: "HARD_BLOCKER",
    target: "TRANSPORT_PLANNING",
    source: {
      kind: "PACKET_REQUIREMENT",
      value: "NEEDS_CLARIFICATION",
      requirementCode: "FREE_TEXT/CODE with spaces",
      sourceRuleId: "rule",
      sourceRuleVersion: 3,
    },
  };

  it("uses the readiness label for a requirement code when one exists", () => {
    const labels = new Map([["FREE_TEXT/CODE with spaces", "Transport authorization"]]);
    expect(describeAccessSignal(requirementSignal, labels)).toBe(
      "Transport planning · Transport authorization — Needs clarification",
    );
  });

  it("falls back to the code, and omits the target prefix when there is no target", () => {
    const { target: _target, ...withoutTarget } = requirementSignal;
    expect(describeAccessSignal(withoutTarget as GuidanceSignal)).toBe(
      "FREE_TEXT/CODE with spaces — Needs clarification",
    );
  });

  it("names a workstream signal by lane and status", () => {
    const lane: GuidanceSignal = {
      signalId: "s2",
      scope: "WORKSTREAM",
      blockingClass: "REVIEW_GATE",
      workstream: "patientEducation",
      source: { kind: "WORKSTREAM_STATUS", value: "PENDING_REVIEW" },
    };
    expect(describeAccessSignal(lane)).toBe("Patient education — Pending review");
  });
});

describe("accessPresentation — requirementLabelIndex", () => {
  const blocker = (requirementCode: string, label: string) => ({ requirementCode, label });

  it("indexes blockers and warnings, keeping the first label for a code", () => {
    const index = requirementLabelIndex([
      { blockers: [blocker("A", "Alpha")], warnings: [blocker("B", "Bravo")] },
      { blockers: [blocker("A", "Alpha again")], warnings: [] },
    ]);
    expect(index.get("A")).toBe("Alpha");
    expect(index.get("B")).toBe("Bravo");
  });

  it("is empty when readiness was not supplied", () => {
    expect(requirementLabelIndex(null).size).toBe(0);
  });
});

describe("accessPresentation — describeJourneyEvidence", () => {
  it("states the source, its value, and the phase it supports", () => {
    expect(
      describeJourneyEvidence({ source: "CASE_STATUS", sourceValue: "READY_FOR_ROUTING", supportsPhase: "QUALIFIED_REVIEW" }),
    ).toBe("Case status: Ready for routing — supports Qualified review");
  });
});
