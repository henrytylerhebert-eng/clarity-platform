import { CASE_STATUSES, canTransitionCase, type CaseStatus, type UrgencyLevel } from "./caseStateMachine.js";
import type { CaseEpisodeRelationship } from "./episode.js";
import { deriveJourneyProjection, type JourneyProjection } from "./journeyPhase.js";
import {
  PRESCREEN_ENCOUNTER_STATUSES,
  PRESCREEN_READINESS_TARGETS,
  canTransitionPrescreenEncounter,
  evaluatePacketReadiness,
  type PacketReadinessBlocker,
  type PacketReadinessResult,
  type PacketRequirement,
  type PacketRequirementState,
  type PrescreenEncounterStatus,
  type PrescreenReadinessTarget,
} from "./prescreen.js";
import { WORKSTREAMS, type Workstream, type WorkstreamStatus, type WorkstreamStatuses } from "./workstreams.js";

/**
 * Access Guidance Projection (Access Slice 4B).
 *
 * A pure, deterministic read over facts the platform already records: the case
 * status (through the JourneyPhase projection), the prescreen encounter status,
 * target-specific packet readiness, and the eight parallel workstreams. It reports
 * what is explicitly blocked, what is waiting, and descriptive next-work candidates.
 *
 * It is NOT a WorkItem engine and NOT a workflow. Nothing here is persisted, assigned,
 * scheduled, escalated, or prioritized. It invents no clinical, legal, placement, timing,
 * SLA, or readiness policy: every blocking class below is a direct reading of a status
 * or of `evaluatePacketReadiness`, and every candidate traces to the signals it came from.
 *
 * Boundaries:
 * - A blocked workstream is not a blocked patient journey. WORKSTREAM-scoped and
 *   PRESCREEN-scoped signals never produce a CASE_PROGRESSION signal and never alter
 *   `journey`, which is `deriveJourneyProjection` output passed through unchanged.
 * - There is no global primary blocker. Signals are a flat, sorted set.
 * - Workstream-derived candidates carry no role. Packet-requirement candidates carry the
 *   requirement's own `responsibleRoleCode` / `resolutionWorkspace`, unchanged.
 */

export const BLOCKING_CLASSES = [
  "HARD_BLOCKER",
  "REVIEW_GATE",
  "EXTERNAL_WAIT",
  "WARNING",
  "SATISFIED",
  "NOT_APPLICABLE",
] as const;
export type BlockingClass = (typeof BLOCKING_CLASSES)[number];

export const BLOCKING_SCOPES = ["CASE_PROGRESSION", "PRESCREEN", "PRESCREEN_TARGET", "WORKSTREAM"] as const;
export type BlockingScope = (typeof BLOCKING_SCOPES)[number];

export const NEXT_WORK_KINDS = [
  "RESOLVE_CASE_INFORMATION",
  "RESOLVE_PRESCREEN_INFORMATION",
  "RESOLVE_PACKET_REQUIREMENT",
  "RESOLVE_WORKSTREAM_BLOCK",
  "REVIEW_WORKSTREAM",
  "START_READY_WORKSTREAM",
] as const;
export type NextWorkKind = (typeof NEXT_WORK_KINDS)[number];

export const GUIDANCE_SUPPRESSION_REASONS = ["CASE_TERMINAL", "PRESCREEN_TERMINAL"] as const;
export type GuidanceSuppressionReason = (typeof GUIDANCE_SUPPRESSION_REASONS)[number];

export interface AccessGuidanceInput {
  readonly caseStatus: CaseStatus;
  readonly urgency: UrgencyLevel;
  readonly workstreams: WorkstreamStatuses;
  readonly prescreenStatus?: PrescreenEncounterStatus;
  /**
   * `undefined` means packet requirements were not supplied: no packet readiness is
   * reported and nothing is claimed ready. `[]` means they were supplied and none exist.
   */
  readonly packetRequirements?: readonly PacketRequirement[];
  readonly episodeRelationships?: readonly CaseEpisodeRelationship[];
}

/** The recorded fact a signal was read from. */
export type GuidanceSource =
  | { readonly kind: "CASE_STATUS"; readonly value: CaseStatus }
  | { readonly kind: "PRESCREEN_STATUS"; readonly value: PrescreenEncounterStatus }
  | {
      readonly kind: "PACKET_REQUIREMENT";
      readonly value: PacketRequirementState;
      readonly requirementCode: string;
      readonly sourceRuleId: string;
      readonly sourceRuleVersion: number;
    }
  | { readonly kind: "WORKSTREAM_STATUS"; readonly value: WorkstreamStatus };

export interface GuidanceSignal {
  readonly signalId: string;
  readonly scope: BlockingScope;
  readonly blockingClass: BlockingClass;
  readonly target?: PrescreenReadinessTarget;
  readonly workstream?: Workstream;
  readonly source: GuidanceSource;
}

export interface NextWorkCandidate {
  readonly candidateId: string;
  readonly kind: NextWorkKind;
  readonly scope: BlockingScope;
  /** Descriptive only: never an assignment, order, or commitment. */
  readonly nonBinding: true;
  readonly workstream?: Workstream;
  readonly requirementCode?: string;
  readonly sourceRuleId?: string;
  readonly sourceRuleVersion?: number;
  readonly targets?: readonly PrescreenReadinessTarget[];
  /** Present only when carried by the source packet requirement. */
  readonly responsibleRoleCode?: string;
  readonly resolutionWorkspace?: string;
  /** Every signal this candidate was derived from. */
  readonly signalIds: readonly string[];
}

/** A candidate that would have been derived but whose command path is closed. */
export interface GuidanceSuppression {
  readonly kind: NextWorkKind;
  readonly signalId: string;
  readonly reason: GuidanceSuppressionReason;
}

export interface AccessGuidanceProjection {
  /** `deriveJourneyProjection` output, unchanged. */
  readonly journey: JourneyProjection;
  readonly signals: readonly GuidanceSignal[];
  /** `null` when packet requirements were not supplied. */
  readonly packetReadiness: readonly PacketReadinessResult[] | null;
  readonly nextWork: readonly NextWorkCandidate[];
  readonly suppressed: readonly GuidanceSuppression[];
}

// ---------------------------------------------------------------------------
// Signal mappings — direct readings of existing statuses, no new policy
// ---------------------------------------------------------------------------

/**
 * Case-level signals. INFORMATION_INCOMPLETE is the status JourneyPhase already reports
 * as disposition BLOCKED. FACILITY_RESPONSE_PENDING names a wait on an external party;
 * no timing, SLA, or escalation is attached to it. Diversion, exception and terminal
 * statuses are conveyed by `journey.disposition` and are deliberately not re-signalled.
 */
const CASE_STATUS_SIGNAL: Partial<Record<CaseStatus, BlockingClass>> = {
  INFORMATION_INCOMPLETE: "HARD_BLOCKER",
  FACILITY_RESPONSE_PENDING: "EXTERNAL_WAIT",
};

/** NEEDS_INFORMATION halts the prescreen encounter only; it is not a whole-case block. */
const PRESCREEN_STATUS_SIGNAL: Partial<Record<PrescreenEncounterStatus, BlockingClass>> = {
  NEEDS_INFORMATION: "HARD_BLOCKER",
};

/**
 * Blockers and warnings come from `evaluatePacketReadiness` itself. The only states it
 * leaves unflagged are these two; anything else unflagged is a contract drift and throws.
 */
const RESIDUAL_REQUIREMENT_CLASS: Partial<Record<PacketRequirementState, BlockingClass>> = {
  ACCEPTED_FOR_PACKET: "SATISFIED",
  NOT_APPLICABLE_WITH_AUTHORITY: "NOT_APPLICABLE",
};

/** NOT_STARTED and IN_PROGRESS carry no attention signal. */
const WORKSTREAM_STATUS_SIGNAL: Record<WorkstreamStatus, BlockingClass | null> = {
  NOT_STARTED: null,
  READY: "SATISFIED",
  IN_PROGRESS: null,
  PENDING_REVIEW: "REVIEW_GATE",
  COMPLETE: "SATISFIED",
  BLOCKED: "HARD_BLOCKER",
  NOT_APPLICABLE: "NOT_APPLICABLE",
};

/** Candidate kinds for workstreams, keyed by status (READY and COMPLETE share a class). */
const WORKSTREAM_NEXT_WORK: Partial<Record<WorkstreamStatus, NextWorkKind>> = {
  BLOCKED: "RESOLVE_WORKSTREAM_BLOCK",
  PENDING_REVIEW: "REVIEW_WORKSTREAM",
  READY: "START_READY_WORKSTREAM",
};

/**
 * Terminal = no outgoing transition in the existing state machines. These match the
 * command guards that reject the corresponding updates: `assertNotTerminal` in
 * CaseCommandService (workstream updates) and the terminal-encounter guard on
 * `updatePacketRequirement` in both prescreen gateways.
 */
const TERMINAL_CASE_STATUSES: ReadonlySet<CaseStatus> = new Set(
  CASE_STATUSES.filter((from) => !CASE_STATUSES.some((to) => canTransitionCase(from, to))),
);
const TERMINAL_PRESCREEN_STATUSES: ReadonlySet<PrescreenEncounterStatus> = new Set(
  PRESCREEN_ENCOUNTER_STATUSES.filter(
    (from) => !PRESCREEN_ENCOUNTER_STATUSES.some((to) => canTransitionPrescreenEncounter(from, to)),
  ),
);

export function isTerminalCaseStatus(status: CaseStatus): boolean {
  return TERMINAL_CASE_STATUSES.has(status);
}

export function isTerminalPrescreenStatus(status: PrescreenEncounterStatus): boolean {
  return TERMINAL_PRESCREEN_STATUSES.has(status);
}

// ---------------------------------------------------------------------------
// Deterministic ordering (for stable output, not priority)
// ---------------------------------------------------------------------------

const rank = <T extends string>(values: readonly T[]) => {
  const index = new Map<string, number>(values.map((value, i) => [value, i]));
  return (value: string | undefined): number => (value === undefined ? -1 : (index.get(value) ?? values.length));
};
const scopeRank = rank(BLOCKING_SCOPES);
const targetRank = rank(PRESCREEN_READINESS_TARGETS);
const workstreamRank = rank(WORKSTREAMS);
const classRank = rank(BLOCKING_CLASSES);
const kindRank = rank(NEXT_WORK_KINDS);

const compareText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const compareTuple = (a: readonly (number | string)[], b: readonly (number | string)[]): number => {
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const x = a[i] ?? "";
    const y = b[i] ?? "";
    const result = typeof x === "number" && typeof y === "number" ? x - y : compareText(String(x), String(y));
    if (result !== 0) return result;
  }
  return 0;
};

const requirementKey = (r: { requirementCode: string; sourceRuleId: string; sourceRuleVersion: number }) =>
  [r.requirementCode, r.sourceRuleId, r.sourceRuleVersion] as const;

const fullKey = (r: {
  requirementCode: string;
  sourceRuleId: string;
  sourceRuleVersion: number;
  state: PacketRequirementState;
}): string => JSON.stringify([...requirementKey(r), r.state]);

const signalSortKey =(s: GuidanceSignal): (number | string)[] => [
  scopeRank(s.scope),
  targetRank(s.target),
  workstreamRank(s.workstream),
  ...(s.source.kind === "PACKET_REQUIREMENT" ? requirementKey(s.source) : ["", "", 0]),
  classRank(s.blockingClass),
  s.signalId,
];

const candidateSortKey = (c: NextWorkCandidate): (number | string)[] => [
  kindRank(c.kind),
  workstreamRank(c.workstream),
  c.requirementCode ?? "",
  c.sourceRuleId ?? "",
  c.sourceRuleVersion ?? 0,
  c.candidateId,
];

const compareBlocker = (a: PacketReadinessBlocker, b: PacketReadinessBlocker): number =>
  compareTuple([...requirementKey(a), a.state], [...requirementKey(b), b.state]);

// ---------------------------------------------------------------------------
// Projection
// ---------------------------------------------------------------------------

export function deriveAccessGuidance(input: AccessGuidanceInput): AccessGuidanceProjection {
  const journey = deriveJourneyProjection({
    caseStatus: input.caseStatus,
    ...(input.prescreenStatus === undefined ? {} : { prescreenStatus: input.prescreenStatus }),
    ...(input.episodeRelationships === undefined ? {} : { episodeRelationships: input.episodeRelationships }),
  });

  const signals = new Map<string, GuidanceSignal>();
  const addSignal = (signal: GuidanceSignal): void => {
    if (!signals.has(signal.signalId)) signals.set(signal.signalId, signal);
  };

  const candidates = new Map<string, NextWorkCandidate>();
  const suppressed = new Map<string, GuidanceSuppression>();
  const offerCandidate = (
    candidate: Omit<NextWorkCandidate, "nonBinding" | "signalIds">,
    signalId: string,
    closedBy: GuidanceSuppressionReason | null,
  ): void => {
    if (closedBy !== null) {
      const key = `${candidate.kind}|${signalId}`;
      if (!suppressed.has(key)) suppressed.set(key, { kind: candidate.kind, signalId, reason: closedBy });
      return;
    }
    const existing = candidates.get(candidate.candidateId);
    if (existing === undefined) {
      candidates.set(candidate.candidateId, { ...candidate, nonBinding: true, signalIds: [signalId] });
      return;
    }
    const signalIds = existing.signalIds.includes(signalId) ? existing.signalIds : [...existing.signalIds, signalId];
    const targets =
      candidate.targets === undefined
        ? existing.targets
        : [...new Set([...(existing.targets ?? []), ...candidate.targets])];
    candidates.set(candidate.candidateId, {
      ...existing,
      ...(targets === undefined ? {} : { targets }),
      signalIds,
    });
  };

  const caseClosed: GuidanceSuppressionReason | null = isTerminalCaseStatus(input.caseStatus) ? "CASE_TERMINAL" : null;
  const prescreenClosed: GuidanceSuppressionReason | null =
    input.prescreenStatus !== undefined && isTerminalPrescreenStatus(input.prescreenStatus)
      ? "PRESCREEN_TERMINAL"
      : null;

  // Case progression
  const caseClass = CASE_STATUS_SIGNAL[input.caseStatus];
  if (caseClass !== undefined) {
    const signalId = `CASE_PROGRESSION|CASE_STATUS|${input.caseStatus}`;
    addSignal({
      signalId,
      scope: "CASE_PROGRESSION",
      blockingClass: caseClass,
      source: { kind: "CASE_STATUS", value: input.caseStatus },
    });
    if (caseClass === "HARD_BLOCKER") {
      offerCandidate(
        { candidateId: "RESOLVE_CASE_INFORMATION", kind: "RESOLVE_CASE_INFORMATION", scope: "CASE_PROGRESSION" },
        signalId,
        caseClosed,
      );
    }
  }

  // Prescreen encounter
  if (input.prescreenStatus !== undefined) {
    const prescreenClass = PRESCREEN_STATUS_SIGNAL[input.prescreenStatus];
    if (prescreenClass !== undefined) {
      const signalId = `PRESCREEN|PRESCREEN_STATUS|${input.prescreenStatus}`;
      addSignal({
        signalId,
        scope: "PRESCREEN",
        blockingClass: prescreenClass,
        source: { kind: "PRESCREEN_STATUS", value: input.prescreenStatus },
      });
      if (prescreenClass === "HARD_BLOCKER") {
        offerCandidate(
          {
            candidateId: "RESOLVE_PRESCREEN_INFORMATION",
            kind: "RESOLVE_PRESCREEN_INFORMATION",
            scope: "PRESCREEN",
          },
          signalId,
          prescreenClosed,
        );
      }
    }
  }

  // Packet readiness per target
  let packetReadiness: PacketReadinessResult[] | null = null;
  if (input.packetRequirements !== undefined) {
    const requirements = input.packetRequirements;
    packetReadiness = PRESCREEN_READINESS_TARGETS.map((target) => {
      const result = evaluatePacketReadiness(target, requirements);
      const blockers = dedupeBlockers(result.blockers);
      const warnings = dedupeBlockers(result.warnings);
      const classified: (readonly [PacketReadinessBlocker, BlockingClass])[] = [
        ...blockers.map((b) => [b, "HARD_BLOCKER"] as const),
        ...warnings.map((b) => [b, "WARNING"] as const),
      ];
      // Relevant requirements that evaluatePacketReadiness reports as neither blocker nor warning.
      const flagged = new Set(classified.map(([b]) => fullKey(b)));
      for (const requirement of requirements) {
        if (!requirement.blockingTargets.includes(target) || flagged.has(fullKey(requirement))) continue;
        const residual = RESIDUAL_REQUIREMENT_CLASS[requirement.state];
        if (residual === undefined) {
          // Fail closed: a state neither evaluatePacketReadiness nor this map classifies.
          throw new Error(`Unclassified PacketRequirementState in AccessGuidance: ${requirement.state}`);
        }
        classified.push([toBlockerShape(requirement), residual]);
      }
      for (const [requirement, blockingClass] of classified) {
        const signalId = [
          "PRESCREEN_TARGET",
          target,
          "PACKET_REQUIREMENT",
          requirement.requirementCode,
          requirement.sourceRuleId,
          `v${requirement.sourceRuleVersion}`,
          requirement.state,
        ].join("|");
        addSignal({
          signalId,
          scope: "PRESCREEN_TARGET",
          blockingClass,
          target,
          source: {
            kind: "PACKET_REQUIREMENT",
            value: requirement.state,
            requirementCode: requirement.requirementCode,
            sourceRuleId: requirement.sourceRuleId,
            sourceRuleVersion: requirement.sourceRuleVersion,
          },
        });
        if (blockingClass === "HARD_BLOCKER") {
          offerCandidate(
            {
              candidateId: [
                "RESOLVE_PACKET_REQUIREMENT",
                requirement.requirementCode,
                requirement.sourceRuleId,
                `v${requirement.sourceRuleVersion}`,
              ].join("|"),
              kind: "RESOLVE_PACKET_REQUIREMENT",
              scope: "PRESCREEN_TARGET",
              requirementCode: requirement.requirementCode,
              sourceRuleId: requirement.sourceRuleId,
              sourceRuleVersion: requirement.sourceRuleVersion,
              targets: [target],
              ...(requirement.responsibleRoleCode === undefined
                ? {}
                : { responsibleRoleCode: requirement.responsibleRoleCode }),
              resolutionWorkspace: requirement.resolutionWorkspace,
            },
            signalId,
            prescreenClosed,
          );
        }
      }
      return { target, ready: result.ready, blockers, warnings };
    });
  }

  // Workstreams — attention only; never case progression, never a role.
  for (const workstream of WORKSTREAMS) {
    const status = input.workstreams[workstream];
    const blockingClass = WORKSTREAM_STATUS_SIGNAL[status];
    if (blockingClass === null) continue;
    const signalId = `WORKSTREAM|${workstream}|WORKSTREAM_STATUS|${status}`;
    addSignal({
      signalId,
      scope: "WORKSTREAM",
      blockingClass,
      workstream,
      source: { kind: "WORKSTREAM_STATUS", value: status },
    });
    const kind = WORKSTREAM_NEXT_WORK[status];
    if (kind !== undefined) {
      offerCandidate({ candidateId: `${kind}|${workstream}`, kind, scope: "WORKSTREAM", workstream }, signalId, caseClosed);
    }
  }

  const sortedCandidates = [...candidates.values()]
    .map((c) => ({
      ...c,
      signalIds: [...c.signalIds].sort(compareText),
      ...(c.targets === undefined
        ? {}
        : { targets: [...c.targets].sort((a, b) => targetRank(a) - targetRank(b)) }),
    }))
    .sort((a, b) => compareTuple(candidateSortKey(a), candidateSortKey(b)));

  return {
    journey,
    signals: [...signals.values()].sort((a, b) => compareTuple(signalSortKey(a), signalSortKey(b))),
    packetReadiness,
    nextWork: sortedCandidates,
    suppressed: [...suppressed.values()].sort((a, b) =>
      compareTuple([kindRank(a.kind), a.signalId], [kindRank(b.kind), b.signalId]),
    ),
  };
}

function toBlockerShape(requirement: PacketRequirement): PacketReadinessBlocker {
  return {
    requirementCode: requirement.requirementCode,
    label: requirement.label,
    state: requirement.state,
    ...(requirement.responsibleRoleCode === undefined ? {} : { responsibleRoleCode: requirement.responsibleRoleCode }),
    resolutionWorkspace: requirement.resolutionWorkspace,
    sourceRuleId: requirement.sourceRuleId,
    sourceRuleVersion: requirement.sourceRuleVersion,
  };
}

/** Sorted and with exact duplicates removed, so input order never changes output. */
function dedupeBlockers(entries: readonly PacketReadinessBlocker[]): PacketReadinessBlocker[] {
  const byKey = new Map<string, PacketReadinessBlocker>();
  for (const entry of entries) {
    const key = JSON.stringify([
      ...requirementKey(entry),
      entry.state,
      entry.label,
      entry.responsibleRoleCode ?? null,
      entry.resolutionWorkspace,
    ]);
    if (!byKey.has(key)) byKey.set(key, entry);
  }
  return [...byKey.values()].sort((a, b) => compareBlocker(a, b) || compareText(JSON.stringify(a), JSON.stringify(b)));
}
