export declare const readinessTargets: readonly ["CENTRAL_INTAKE_REVIEW", "AUTHORIZED_PRACTITIONER_REVIEW", "FACILITY_ROUTING", "TRANSPORT_PLANNING", "RECEIVING_HANDOFF"];
export type ReadinessTarget = (typeof readinessTargets)[number];
export declare const requirementStates: readonly ["NOT_STARTED", "REQUESTED", "RECEIVED", "UNDER_REVIEW", "ACCEPTED_FOR_PACKET", "MISSING", "UNAVAILABLE_WITH_REASON", "NOT_APPLICABLE_WITH_AUTHORITY", "NEEDS_CLARIFICATION", "STALE", "SUPERSEDED"];
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
export declare function evaluateReadiness(target: ReadinessTarget, requirements: readonly PacketRequirement[]): ReadinessResult;
