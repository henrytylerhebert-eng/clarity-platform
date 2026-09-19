import { type JourneyProjection, type JourneyProjectionInput, deriveJourneyProjection } from "./journeyPhase.js";
import { type WorkstreamStatuses, type Workstream } from "./workstreams.js";
import { type PacketRequirement, type PrescreenReadinessTarget, type PacketReadinessResult, evaluatePacketReadiness, PRESCREEN_READINESS_TARGETS } from "./prescreen.js";

export const BLOCKING_CLASSES = [
  "HARD_BLOCKER",
  "REVIEW_GATE",
  "EXTERNAL_WAIT",
  "WARNING",
  "SATISFIED",
  "NOT_APPLICABLE",
] as const;

export type BlockingClass = (typeof BLOCKING_CLASSES)[number];

export const BLOCKING_SCOPES = [
  "CASE_PROGRESSION",
  "PRESCREEN",
  "PRESCREEN_TARGET",
  "WORKSTREAM",
] as const;

export type BlockingScope = (typeof BLOCKING_SCOPES)[number];

export interface BlockingSignal {
  readonly blockingClass: BlockingClass;
  readonly scope: BlockingScope;
  readonly code: string;
  readonly source: "CASE_STATUS" | "PRESCREEN_STATUS" | "PACKET_REQUIREMENT" | "WORKSTREAM_STATUS";
  readonly sourceValue: string;

  readonly workstream?: Workstream;
  readonly prescreenTarget?: PrescreenReadinessTarget;
  readonly requirementCode?: string;

  readonly responsibleRoleCode?: string;
  readonly resolutionWorkspace?: string;
  readonly sourceRuleId?: string;
  readonly sourceRuleVersion?: number;
}

export interface WorkstreamAttention {
  readonly blockingClass: BlockingClass;
  readonly scope: BlockingScope;
  readonly code: string;
  readonly workstream: Workstream;
}

export const NEXT_WORK_KINDS = [
  "RESOLVE_CASE_INFORMATION",
  "RESOLVE_PRESCREEN_INFORMATION",
  "RESOLVE_PACKET_REQUIREMENT",
  "RESOLVE_WORKSTREAM_BLOCK",
  "REVIEW_WORKSTREAM",
  "START_READY_WORKSTREAM",
] as const;
export type NextWorkKind = (typeof NEXT_WORK_KINDS)[number];

export interface NextWorkCandidate {
  readonly kind: NextWorkKind;
  readonly source: "CASE_STATUS" | "PRESCREEN_STATUS" | "PACKET_REQUIREMENT" | "WORKSTREAM_STATUS";
  readonly code: string;
  readonly workstream?: Workstream;
  readonly prescreenTarget?: PrescreenReadinessTarget;
  readonly requirementCode?: string;
  readonly responsibleRoleCode?: string;
  readonly resolutionWorkspace?: string;
}

export interface AccessGuidanceInput extends JourneyProjectionInput {
  readonly workstreams: WorkstreamStatuses;
  readonly packetRequirements?: readonly PacketRequirement[];
}

export interface AccessGuidanceProjection {
  readonly journey: JourneyProjection;
  readonly blockingSignals: readonly BlockingSignal[];
  readonly workstreamAttention: readonly WorkstreamAttention[];
  readonly targetReadiness: readonly PacketReadinessResult[];
  readonly nextWork: readonly NextWorkCandidate[];
}

export function deriveAccessGuidance(input: AccessGuidanceInput): AccessGuidanceProjection {
  const journey = deriveJourneyProjection(input);

  const rawBlockingSignals: BlockingSignal[] = [];
  const rawWorkstreamAttention: WorkstreamAttention[] = [];
  const rawNextWork: NextWorkCandidate[] = [];
  let targetReadiness: PacketReadinessResult[] = [];

  // Case-level
  if (input.caseStatus === "INFORMATION_INCOMPLETE") {
    rawBlockingSignals.push({
      blockingClass: "HARD_BLOCKER",
      scope: "CASE_PROGRESSION",
      code: "CASE_INFORMATION_INCOMPLETE",
      source: "CASE_STATUS",
      sourceValue: input.caseStatus
    });
    rawNextWork.push({
      kind: "RESOLVE_CASE_INFORMATION",
      source: "CASE_STATUS",
      code: "CASE_INFORMATION_INCOMPLETE"
    });
  } else if (input.caseStatus === "MEDICAL_TRANSFER_REQUIRED") {
    rawBlockingSignals.push({
      blockingClass: "HARD_BLOCKER",
      scope: "CASE_PROGRESSION",
      code: "MEDICAL_DIVERSION_ACTIVE",
      source: "CASE_STATUS",
      sourceValue: input.caseStatus
    });
    // Deliberately no next work
  } else if (input.caseStatus === "FACILITY_RESPONSE_PENDING") {
    rawBlockingSignals.push({
      blockingClass: "EXTERNAL_WAIT",
      scope: "CASE_PROGRESSION",
      code: "FACILITY_RESPONSE_PENDING",
      source: "CASE_STATUS",
      sourceValue: input.caseStatus
    });
  }

  // Prescreen-level
  if (input.prescreenStatus === "NEEDS_INFORMATION") {
    rawBlockingSignals.push({
      blockingClass: "HARD_BLOCKER",
      scope: "PRESCREEN",
      code: "PRESCREEN_NEEDS_INFORMATION",
      source: "PRESCREEN_STATUS",
      sourceValue: input.prescreenStatus
    });
    rawNextWork.push({
      kind: "RESOLVE_PRESCREEN_INFORMATION",
      source: "PRESCREEN_STATUS",
      code: "PRESCREEN_NEEDS_INFORMATION"
    });
  }

  // Packet-level
  if (input.packetRequirements) {
    targetReadiness = PRESCREEN_READINESS_TARGETS.map(target => evaluatePacketReadiness(target, input.packetRequirements!));

    for (const result of targetReadiness) {
      for (const blocker of result.blockers) {
        rawBlockingSignals.push({
          blockingClass: "HARD_BLOCKER",
          scope: "PRESCREEN_TARGET",
          code: blocker.requirementCode,
          source: "PACKET_REQUIREMENT",
          sourceValue: blocker.state,
          prescreenTarget: result.target,
          requirementCode: blocker.requirementCode,
          responsibleRoleCode: blocker.responsibleRoleCode,
          resolutionWorkspace: blocker.resolutionWorkspace,
          sourceRuleId: blocker.sourceRuleId,
          sourceRuleVersion: blocker.sourceRuleVersion
        });
        rawNextWork.push({
          kind: "RESOLVE_PACKET_REQUIREMENT",
          source: "PACKET_REQUIREMENT",
          code: blocker.requirementCode,
          prescreenTarget: result.target,
          requirementCode: blocker.requirementCode,
          responsibleRoleCode: blocker.responsibleRoleCode,
          resolutionWorkspace: blocker.resolutionWorkspace
        });
      }
      for (const warning of result.warnings) {
        rawBlockingSignals.push({
          blockingClass: "WARNING",
          scope: "PRESCREEN_TARGET",
          code: warning.requirementCode,
          source: "PACKET_REQUIREMENT",
          sourceValue: warning.state,
          prescreenTarget: result.target,
          requirementCode: warning.requirementCode,
          responsibleRoleCode: warning.responsibleRoleCode,
          resolutionWorkspace: warning.resolutionWorkspace,
          sourceRuleId: warning.sourceRuleId,
          sourceRuleVersion: warning.sourceRuleVersion
        });
      }
    }
  }

  // Workstream-level
  const workstreamKeys = Object.keys(input.workstreams) as Workstream[];
  // Stable sort for determinism
  workstreamKeys.sort();

  for (const w of workstreamKeys) {
    const status = input.workstreams[w];
    if (status === "BLOCKED") {
      rawWorkstreamAttention.push({
        blockingClass: "HARD_BLOCKER",
        scope: "WORKSTREAM",
        code: "WORKSTREAM_BLOCKED",
        workstream: w
      });
      rawBlockingSignals.push({
        blockingClass: "HARD_BLOCKER",
        scope: "WORKSTREAM",
        code: "WORKSTREAM_BLOCKED",
        source: "WORKSTREAM_STATUS",
        sourceValue: status,
        workstream: w
      });
      rawNextWork.push({
        kind: "RESOLVE_WORKSTREAM_BLOCK",
        source: "WORKSTREAM_STATUS",
        code: "WORKSTREAM_BLOCKED",
        workstream: w
      });
    } else if (status === "PENDING_REVIEW") {
      rawWorkstreamAttention.push({
        blockingClass: "REVIEW_GATE",
        scope: "WORKSTREAM",
        code: "WORKSTREAM_REVIEW_PENDING",
        workstream: w
      });
      rawBlockingSignals.push({
        blockingClass: "REVIEW_GATE",
        scope: "WORKSTREAM",
        code: "WORKSTREAM_REVIEW_PENDING",
        source: "WORKSTREAM_STATUS",
        sourceValue: status,
        workstream: w
      });
      rawNextWork.push({
        kind: "REVIEW_WORKSTREAM",
        source: "WORKSTREAM_STATUS",
        code: "WORKSTREAM_REVIEW_PENDING",
        workstream: w
      });
    } else if (status === "READY") {
      rawNextWork.push({
        kind: "START_READY_WORKSTREAM",
        source: "WORKSTREAM_STATUS",
        code: "WORKSTREAM_READY",
        workstream: w
      });
    }
  }

  // Deduplicate and stable-sort signals
  const blockingSignals = Array.from(
    new Map(
      rawBlockingSignals.map(s => [
        `${s.source}:${s.code}:${s.scope}:${s.prescreenTarget ?? ""}:${s.workstream ?? ""}:${s.requirementCode ?? ""}`,
        s
      ])
    ).values()
  ).sort((a, b) => {
    // Arbitrary but deterministic stable sort
    const keyA = `${a.scope}:${a.source}:${a.code}:${a.prescreenTarget ?? ""}:${a.workstream ?? ""}`;
    const keyB = `${b.scope}:${b.source}:${b.code}:${b.prescreenTarget ?? ""}:${b.workstream ?? ""}`;
    return keyA.localeCompare(keyB);
  });

  const nextWork = Array.from(
    new Map(
      rawNextWork.map(n => [
        `${n.kind}:${n.source}:${n.code}:${n.prescreenTarget ?? ""}:${n.workstream ?? ""}:${n.requirementCode ?? ""}`,
        n
      ])
    ).values()
  ).sort((a, b) => {
    const keyA = `${a.kind}:${a.source}:${a.code}:${a.prescreenTarget ?? ""}:${a.workstream ?? ""}`;
    const keyB = `${b.kind}:${b.source}:${b.code}:${b.prescreenTarget ?? ""}:${b.workstream ?? ""}`;
    return keyA.localeCompare(keyB);
  });
  
  const workstreamAttention = Array.from(
    new Map(
      rawWorkstreamAttention.map(wa => [
        `${wa.code}:${wa.workstream}`,
        wa
      ])
    ).values()
  ).sort((a, b) => {
    const keyA = `${a.code}:${a.workstream}`;
    const keyB = `${b.code}:${b.workstream}`;
    return keyA.localeCompare(keyB);
  });

  return {
    journey,
    blockingSignals,
    workstreamAttention,
    targetReadiness,
    nextWork
  };
}
