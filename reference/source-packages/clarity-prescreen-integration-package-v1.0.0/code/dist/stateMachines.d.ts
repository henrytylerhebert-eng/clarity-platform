import { type EncounterStatus, type OrientationObservation, type PatientWillingness, type PossiblePathway } from "./domain.js";
export type OrientationGate = "PASS" | "FAIL" | "UNKNOWN";
export declare function evaluateOrientationGate(observation: OrientationObservation): OrientationGate;
export interface PathwayInput {
    readonly willingness: PatientWillingness;
    readonly orientation: OrientationObservation;
    readonly immediateMedicalStabilizationRequired?: boolean;
    readonly activeEmergencyOrLegalProcess?: boolean;
}
export interface PathwayResult {
    readonly pathway: PossiblePathway;
    readonly orientationGate: OrientationGate;
    readonly reasons: readonly string[];
    readonly requiresAuthorizedReview: boolean;
}
export declare function derivePossiblePathway(input: PathwayInput): PathwayResult;
export declare function assertEncounterTransition(from: EncounterStatus, to: EncounterStatus): void;
