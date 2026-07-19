import { DomainError, } from "./domain.js";
export function evaluateOrientationGate(observation) {
    const statuses = [
        observation.person.status,
        observation.place.status,
        observation.time.status,
        observation.situation.status,
    ];
    if (statuses.every((status) => status === "ORIENTED"))
        return "PASS";
    if (statuses.some((status) => status === "NOT_ORIENTED"))
        return "FAIL";
    return "UNKNOWN";
}
export function derivePossiblePathway(input) {
    const gate = evaluateOrientationGate(input.orientation);
    if (input.immediateMedicalStabilizationRequired) {
        return {
            pathway: "MEDICAL_STABILIZATION_REQUIRED",
            orientationGate: gate,
            reasons: ["IMMEDIATE_MEDICAL_STABILIZATION_REQUIRED"],
            requiresAuthorizedReview: true,
        };
    }
    if (input.activeEmergencyOrLegalProcess || input.willingness === "OPPOSED") {
        return {
            pathway: "EMERGENCY_OR_LEGAL_REVIEW_REQUIRED",
            orientationGate: gate,
            reasons: [input.activeEmergencyOrLegalProcess ? "ACTIVE_LEGAL_PROCESS" : "PATIENT_OPPOSED"],
            requiresAuthorizedReview: true,
        };
    }
    if (input.willingness === "WILLING" && gate === "PASS") {
        return {
            pathway: "POSSIBLE_FORMAL_VOLUNTARY_REVIEW",
            orientationGate: gate,
            reasons: ["PATIENT_WILLING", "ORIENTATION_GATE_PASS"],
            requiresAuthorizedReview: true,
        };
    }
    if ((input.willingness === "WILLING" || input.willingness === "NON_OPPOSED") && gate !== "PASS") {
        return {
            pathway: "POSSIBLE_NONCONTESTED_PATHWAY",
            orientationGate: gate,
            reasons: ["PATIENT_NOT_OPPOSED", `ORIENTATION_GATE_${gate}`],
            requiresAuthorizedReview: true,
        };
    }
    return {
        pathway: "UNDETERMINED",
        orientationGate: gate,
        reasons: ["INSUFFICIENT_INFORMATION_OR_UNRESOLVED_PATHWAY"],
        requiresAuthorizedReview: false,
    };
}
const transitions = {
    DRAFT: ["ATTESTED", "CANCELLED"],
    ATTESTED: ["SUBMITTED", "CANCELLED"],
    SUBMITTED: ["CENTRAL_INTAKE_REVIEW", "NEEDS_INFORMATION", "CANCELLED"],
    CENTRAL_INTAKE_REVIEW: ["NEEDS_INFORMATION", "AUTHORIZED_REVIEW", "FACILITY_ROUTING", "REDIRECTED", "DECLINED", "CANCELLED"],
    NEEDS_INFORMATION: ["CENTRAL_INTAKE_REVIEW", "CANCELLED"],
    AUTHORIZED_REVIEW: ["NEEDS_INFORMATION", "FACILITY_ROUTING", "TRANSPORT_PLANNING", "REDIRECTED", "DECLINED", "CANCELLED"],
    FACILITY_ROUTING: ["NEEDS_INFORMATION", "TRANSPORT_PLANNING", "REDIRECTED", "DECLINED", "CANCELLED"],
    TRANSPORT_PLANNING: ["HANDED_OFF", "REDIRECTED", "CANCELLED"],
    HANDED_OFF: [],
    REDIRECTED: [],
    DECLINED: [],
    CANCELLED: [],
};
export function assertEncounterTransition(from, to) {
    if (!transitions[from].includes(to)) {
        throw new DomainError("INVALID_ENCOUNTER_TRANSITION", `Cannot transition prescreen from ${from} to ${to}.`);
    }
}
