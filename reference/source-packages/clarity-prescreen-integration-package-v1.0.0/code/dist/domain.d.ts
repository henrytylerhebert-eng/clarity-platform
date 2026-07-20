export declare const willingnessStates: readonly ["WILLING", "NON_OPPOSED", "OPPOSED", "UNABLE_TO_EXPRESS", "FLUCTUATING", "UNKNOWN", "NOT_ASSESSED"];
export type PatientWillingness = (typeof willingnessStates)[number];
export declare const orientationStatuses: readonly ["ORIENTED", "NOT_ORIENTED", "UNABLE_TO_ASSESS", "NOT_ASSESSED", "UNKNOWN"];
export type OrientationStatus = (typeof orientationStatuses)[number];
export interface OrientationDomainFinding {
    readonly status: OrientationStatus;
    readonly observation?: string;
}
export interface OrientationObservation {
    readonly observedAt: string;
    readonly sourceId?: string;
    readonly person: OrientationDomainFinding;
    readonly place: OrientationDomainFinding;
    readonly time: OrientationDomainFinding;
    readonly situation: OrientationDomainFinding;
}
export declare const possiblePathways: readonly ["POSSIBLE_FORMAL_VOLUNTARY_REVIEW", "POSSIBLE_NONCONTESTED_PATHWAY", "EMERGENCY_OR_LEGAL_REVIEW_REQUIRED", "MEDICAL_STABILIZATION_REQUIRED", "COMMUNITY_OR_OTHER_DISPOSITION", "UNDETERMINED"];
export type PossiblePathway = (typeof possiblePathways)[number];
export declare const encounterStatuses: readonly ["DRAFT", "ATTESTED", "SUBMITTED", "CENTRAL_INTAKE_REVIEW", "NEEDS_INFORMATION", "AUTHORIZED_REVIEW", "FACILITY_ROUTING", "TRANSPORT_PLANNING", "HANDED_OFF", "REDIRECTED", "DECLINED", "CANCELLED"];
export type EncounterStatus = (typeof encounterStatuses)[number];
export declare const assessmentStatuses: readonly ["DRAFT", "ATTESTED", "CORRECTED", "SUPERSEDED"];
export type AssessmentStatus = (typeof assessmentStatuses)[number];
export declare const answerValueStates: readonly ["ANSWERED", "UNKNOWN", "NOT_ASSESSED", "DECLINED_TO_ANSWER", "NOT_APPLICABLE"];
export type AnswerValueState = (typeof answerValueStates)[number];
export interface SourceReference {
    readonly sourceId: string;
    readonly sourceType: "DIRECT_OBSERVATION" | "PATIENT_REPORT" | "FAMILY_SUPPORT_REPORT" | "FACILITY_STAFF_REPORT" | "LAW_ENFORCEMENT_REPORT" | "CLINICIAN_REPORT" | "DOCUMENT" | "SYSTEM_DERIVED" | "UNKNOWN";
    readonly label?: string;
    readonly documentVersionId?: string;
    readonly recordedAt: string;
}
export interface AssessmentAnswer {
    readonly answerId: string;
    readonly questionCode: string;
    readonly valueState: AnswerValueState;
    readonly value?: unknown;
    readonly narrative?: string;
    readonly sourceIds: readonly string[];
    readonly recordedAt: string;
    readonly recordedBy: string;
}
export interface AssessmentVersion {
    readonly assessmentVersionId: string;
    readonly encounterId: string;
    readonly organizationId: string;
    readonly versionNumber: number;
    readonly status: AssessmentStatus;
    readonly createdAt: string;
    readonly createdBy: string;
    readonly attestedAt?: string;
    readonly attestedBy?: string;
    readonly parentVersionId?: string;
    readonly changeReason?: string;
    readonly willingness: PatientWillingness;
    readonly orientation: OrientationObservation;
    readonly possiblePathway: PossiblePathway;
    readonly answers: readonly AssessmentAnswer[];
    readonly sources: readonly SourceReference[];
    readonly contentHash?: string;
}
export interface PrescreenEncounter {
    readonly encounterId: string;
    readonly caseId: string;
    readonly organizationId: string;
    readonly status: EncounterStatus;
    readonly version: number;
    readonly currentLocation: string;
    readonly presentingConcern: string;
    readonly currentAssessmentVersionId?: string;
    readonly possiblePathway: PossiblePathway;
    readonly createdBy: string;
    readonly createdAt: string;
    readonly updatedAt: string;
}
export interface Actor {
    readonly actorId: string;
    readonly organizationId: string;
    readonly roleCodes: readonly string[];
}
export interface CommandMeta {
    readonly idempotencyKey: string;
    readonly correlationId: string;
    readonly causationId?: string;
    readonly expectedVersion?: number;
}
export declare class DomainError extends Error {
    readonly code: string;
    readonly details: readonly string[];
    constructor(code: string, message: string, details?: readonly string[]);
}
