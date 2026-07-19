export const readinessTargets = [
    "CENTRAL_INTAKE_REVIEW",
    "AUTHORIZED_PRACTITIONER_REVIEW",
    "FACILITY_ROUTING",
    "TRANSPORT_PLANNING",
    "RECEIVING_HANDOFF",
];
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
];
const blockingStates = new Set([
    "NOT_STARTED",
    "REQUESTED",
    "MISSING",
    "NEEDS_CLARIFICATION",
    "STALE",
    "SUPERSEDED",
]);
const warningStates = new Set(["RECEIVED", "UNDER_REVIEW", "UNAVAILABLE_WITH_REASON"]);
export function evaluateReadiness(target, requirements) {
    const relevant = requirements.filter((requirement) => requirement.blockingTargets.includes(target));
    const map = (requirement) => ({
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
