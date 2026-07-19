export const readinessTargets = [
  "CENTRAL_INTAKE_REVIEW",
  "AUTHORIZED_PRACTITIONER_REVIEW",
  "FACILITY_ROUTING",
  "TRANSPORT_PLANNING",
  "RECEIVING_HANDOFF",
] as const;
export type ReadinessTarget = (typeof readinessTargets)[number];

export const requirementStates = [
  "NOT_STARTED",
  "REQUESTED",
  "RECEIVED",
  "UNDER_REVIEW",
  "ACCEPTED_FOR_PACKET",
  "MISSING",
  "UNAVAILABLE_WITH_REASON",
  "NOT_APPLICABLE_WITH_AUTHORITY",
  "NEEDS_CLARIFICATION",
  "STALE",
  "SUPERSEDED",
] as const;
export type RequirementState = (typeof requirementStates)[number];

export interface PacketRequirement {
  readonly requirementCode: string;
  readonly label: string;
  readonly state: RequirementState;
  readonly blockingTargets: readonly ReadinessTarget[];
  readonly responsibleRoleCode?: string;
  readonly resolutionWorkspace: string;
  readonly sourceRuleId: string;
  readonly sourceRuleVersion: number;
}

export interface ReadinessBlocker {
  readonly requirementCode: string;
  readonly label: string;
  readonly state: RequirementState;
  readonly responsibleRoleCode?: string;
  readonly resolutionWorkspace: string;
  readonly sourceRuleId: string;
  readonly sourceRuleVersion: number;
}

export interface ReadinessResult {
  readonly target: ReadinessTarget;
  readonly ready: boolean;
  readonly blockers: readonly ReadinessBlocker[];
  readonly warnings: readonly ReadinessBlocker[];
}

const blockingStates = new Set<RequirementState>([
  "NOT_STARTED",
  "REQUESTED",
  "MISSING",
  "NEEDS_CLARIFICATION",
  "STALE",
  "SUPERSEDED",
]);
const warningStates = new Set<RequirementState>(["RECEIVED", "UNDER_REVIEW", "UNAVAILABLE_WITH_REASON"]);

export function evaluateReadiness(target: ReadinessTarget, requirements: readonly PacketRequirement[]): ReadinessResult {
  const relevant = requirements.filter((requirement) => requirement.blockingTargets.includes(target));
  const map = (requirement: PacketRequirement): ReadinessBlocker => ({
    requirementCode: requirement.requirementCode,
    label: requirement.label,
    state: requirement.state,
    ...(requirement.responsibleRoleCode === undefined ? {} : { responsibleRoleCode: requirement.responsibleRoleCode }),
    resolutionWorkspace: requirement.resolutionWorkspace,
    sourceRuleId: requirement.sourceRuleId,
    sourceRuleVersion: requirement.sourceRuleVersion,
  });
  const blockers = relevant.filter((requirement) => blockingStates.has(requirement.state)).map(map);
  const warnings = relevant.filter((requirement) => warningStates.has(requirement.state)).map(map);
  return { target, ready: blockers.length === 0, blockers, warnings };
}
