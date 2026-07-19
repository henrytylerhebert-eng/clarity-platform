export type AgeBand = "UNDER_12" | "AGE_12_TO_15" | "AGE_16_TO_17" | "ADULT" | "ALL";
export type SignerType = "PATIENT" | "MINOR_PATIENT" | "PARENT" | "TUTOR" | "LEGAL_GUARDIAN" | "CARETAKER" | "PUBLIC_CUSTODIAN" | "PHYSICIAN" | "PMHNP" | "CORONER" | "JUDGE" | "COURT" | "OTHER_AUTHORIZED_ROLE";
export interface ConsentAuthorityRule {
    readonly ruleId: string;
    readonly version: number;
    readonly status: "DRAFT_UNVERIFIED" | "PENDING_REVIEW" | "APPROVED" | "SUSPENDED" | "SUPERSEDED";
    readonly jurisdictionCode: string;
    readonly facilityId?: string;
    readonly programId?: string;
    readonly ageBand: AgeBand;
    readonly actionCode: string;
    readonly admissionPathways: readonly string[];
    readonly authorizedSignerTypes: readonly SignerType[];
    readonly minorSignatureRequired: boolean;
    readonly relationshipEvidenceRequired: boolean;
    readonly courtApprovalRequired: boolean;
    readonly clinicianReviewRequired: boolean;
    readonly privacyRegimes: readonly string[];
}
export interface ConsentContext {
    readonly jurisdictionCode: string;
    readonly facilityId?: string;
    readonly programId?: string;
    readonly age: number;
    readonly actionCode: string;
    readonly admissionPathway: string;
    readonly signerType: SignerType;
    readonly relationshipEvidencePresent: boolean;
    readonly minorSignaturePresent: boolean;
    readonly courtApprovalPresent: boolean;
    readonly clinicianReviewPresent: boolean;
    readonly privacyRegime?: string;
}
export interface ConsentEvaluation {
    readonly allowed: boolean;
    readonly ruleId?: string;
    readonly ruleVersion?: number;
    readonly unmetRequirements: readonly string[];
    readonly reasons: readonly string[];
}
export declare function ageBandFor(age: number): AgeBand;
export declare function evaluateConsentAuthority(rules: readonly ConsentAuthorityRule[], context: ConsentContext): ConsentEvaluation;
