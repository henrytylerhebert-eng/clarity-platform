import { z } from "zod";
import { DOMAIN_ID_SCHEMA } from "../episode.js";

export const PRESCREEN_READINESS_TARGETS = [
  "CENTRAL_INTAKE_REVIEW",
  "AUTHORIZED_PRACTITIONER_REVIEW",
  "FACILITY_ROUTING",
  "TRANSPORT_PLANNING",
  "RECEIVING_HANDOFF",
] as const;
export type PrescreenReadinessTarget = (typeof PRESCREEN_READINESS_TARGETS)[number];

export const PACKET_REQUIREMENT_STATES = [
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
export type PacketRequirementState = (typeof PACKET_REQUIREMENT_STATES)[number];

export const PacketRequirementSchema = z
  .object({
    requirementCode: DOMAIN_ID_SCHEMA,
    label: z.string().min(1).max(500),
    state: z.enum(PACKET_REQUIREMENT_STATES),
    blockingTargets: z.array(z.enum(PRESCREEN_READINESS_TARGETS)).min(1),
    responsibleRoleCode: DOMAIN_ID_SCHEMA,
    resolutionWorkspace: DOMAIN_ID_SCHEMA,
    sourceRuleId: DOMAIN_ID_SCHEMA,
    sourceRuleVersion: z.number().int().positive(),
  })
  .strict();
export type PacketRequirement = Readonly<z.infer<typeof PacketRequirementSchema>>;

export interface PacketReadinessItem {
  readonly requirementCode: string;
  readonly label: string;
  readonly state: PacketRequirementState;
  readonly responsibleRoleCode: string;
  readonly resolutionWorkspace: string;
  readonly sourceRuleId: string;
  readonly sourceRuleVersion: number;
}

export interface PacketReadinessResult {
  readonly target: PrescreenReadinessTarget;
  readonly ready: boolean;
  readonly blockers: readonly PacketReadinessItem[];
  readonly warnings: readonly PacketReadinessItem[];
}

const BLOCKING_STATES = new Set<PacketRequirementState>([
  "NOT_STARTED",
  "REQUESTED",
  "MISSING",
  "NEEDS_CLARIFICATION",
  "STALE",
  "SUPERSEDED",
]);

const WARNING_STATES = new Set<PacketRequirementState>([
  "RECEIVED",
  "UNDER_REVIEW",
  "UNAVAILABLE_WITH_REASON",
]);

export function evaluatePrescreenPacketReadiness(
  target: PrescreenReadinessTarget,
  requirements: readonly PacketRequirement[],
): PacketReadinessResult {
  const relevant = requirements.filter((requirement) => requirement.blockingTargets.includes(target));
  const toItem = (requirement: PacketRequirement): PacketReadinessItem => ({
    requirementCode: requirement.requirementCode,
    label: requirement.label,
    state: requirement.state,
    responsibleRoleCode: requirement.responsibleRoleCode,
    resolutionWorkspace: requirement.resolutionWorkspace,
    sourceRuleId: requirement.sourceRuleId,
    sourceRuleVersion: requirement.sourceRuleVersion,
  });
  const blockers = relevant.filter((requirement) => BLOCKING_STATES.has(requirement.state)).map(toItem);
  const warnings = relevant.filter((requirement) => WARNING_STATES.has(requirement.state)).map(toItem);
  return { target, ready: blockers.length === 0, blockers, warnings };
}
