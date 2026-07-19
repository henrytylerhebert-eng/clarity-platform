export const willingnessStates = [
    "WILLING",
    "NON_OPPOSED",
    "OPPOSED",
    "UNABLE_TO_EXPRESS",
    "FLUCTUATING",
    "UNKNOWN",
    "NOT_ASSESSED",
];
export const orientationStatuses = [
    "ORIENTED",
    "NOT_ORIENTED",
    "UNABLE_TO_ASSESS",
    "NOT_ASSESSED",
    "UNKNOWN",
];
export const possiblePathways = [
    "POSSIBLE_FORMAL_VOLUNTARY_REVIEW",
    "POSSIBLE_NONCONTESTED_PATHWAY",
    "EMERGENCY_OR_LEGAL_REVIEW_REQUIRED",
    "MEDICAL_STABILIZATION_REQUIRED",
    "COMMUNITY_OR_OTHER_DISPOSITION",
    "UNDETERMINED",
];
export const encounterStatuses = [
    "DRAFT",
    "ATTESTED",
    "SUBMITTED",
    "CENTRAL_INTAKE_REVIEW",
    "NEEDS_INFORMATION",
    "AUTHORIZED_REVIEW",
    "FACILITY_ROUTING",
    "TRANSPORT_PLANNING",
    "HANDED_OFF",
    "REDIRECTED",
    "DECLINED",
    "CANCELLED",
];
export const assessmentStatuses = ["DRAFT", "ATTESTED", "CORRECTED", "SUPERSEDED"];
export const answerValueStates = [
    "ANSWERED",
    "UNKNOWN",
    "NOT_ASSESSED",
    "DECLINED_TO_ANSWER",
    "NOT_APPLICABLE",
];
export class DomainError extends Error {
    code;
    details;
    constructor(code, message, details = []) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = "DomainError";
    }
}
