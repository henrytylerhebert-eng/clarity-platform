export declare const transportCategories: readonly ["LAW_ENFORCEMENT_CUSTODY", "LICENSED_AMBULANCE_EMS", "CONTRACTED_SECURE_BEHAVIORAL_TRANSPORT", "INTERFACILITY_CLINICAL_TRANSPORT", "TRANSPORTATION_BROKER", "NEMT_CARRIER", "FAMILY_OR_SUPPORT_TRANSPORT", "SELF_TRANSPORT"];
export type TransportCategory = (typeof transportCategories)[number];
export type LegalStatus = "VOLUNTARY" | "NONCONTESTED" | "OPC" | "PEC" | "CEC" | "COURT_ORDER" | "OTHER";
export interface TransportRuleProfile {
    readonly ruleId: string;
    readonly version: number;
    readonly legalStatuses: readonly LegalStatus[];
    readonly allowedCategories: readonly TransportCategory[];
    readonly blockedCategories: readonly TransportCategory[];
    readonly requiresConfirmedDestination: boolean;
    readonly requiresInstrument: boolean;
}
export interface TransportProvider {
    readonly providerId: string;
    readonly legalName: string;
    readonly category: TransportCategory;
    readonly status: "CANDIDATE" | "ACTIVE" | "SUSPENDED" | "EXPIRED" | "RESTRICTED" | "INACTIVE";
    readonly verificationStatus: "VERIFIED" | "PARTIAL" | "STALE" | "BLOCKED" | "UNKNOWN";
    readonly supportedLegalStatuses: readonly LegalStatus[];
    readonly serviceAreas: readonly string[];
    readonly capabilities: readonly string[];
    readonly restrictions: readonly string[];
    readonly facilityApprovals: readonly string[];
    readonly jurisdictionApprovals: readonly string[];
}
export interface TransportContext {
    readonly legalStatus: LegalStatus;
    readonly instrumentId?: string;
    readonly destinationFacilityId?: string;
    readonly jurisdictionCode: string;
    readonly serviceArea: string;
    readonly requiredCapabilities: readonly string[];
}
export interface ProviderQualification {
    readonly providerId: string;
    readonly status: "QUALIFIED" | "CONDITIONAL" | "NOT_QUALIFIED";
    readonly disqualifiers: readonly string[];
    readonly conditions: readonly string[];
    readonly ruleVersionIds: readonly string[];
}
export declare function qualifyTransportProvider(provider: TransportProvider, context: TransportContext, rule: TransportRuleProfile): ProviderQualification;
export declare function defaultSecuredInstrumentRule(): TransportRuleProfile;
