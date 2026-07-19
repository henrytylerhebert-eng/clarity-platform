export const transportCategories = [
    "LAW_ENFORCEMENT_CUSTODY",
    "LICENSED_AMBULANCE_EMS",
    "CONTRACTED_SECURE_BEHAVIORAL_TRANSPORT",
    "INTERFACILITY_CLINICAL_TRANSPORT",
    "TRANSPORTATION_BROKER",
    "NEMT_CARRIER",
    "FAMILY_OR_SUPPORT_TRANSPORT",
    "SELF_TRANSPORT",
];
export function qualifyTransportProvider(provider, context, rule) {
    const disqualifiers = [];
    const conditions = [];
    if (!rule.legalStatuses.includes(context.legalStatus))
        disqualifiers.push("RULE_NOT_APPLICABLE_TO_LEGAL_STATUS");
    if (rule.blockedCategories.includes(provider.category))
        disqualifiers.push("TRANSPORT_CATEGORY_BLOCKED");
    if (!rule.allowedCategories.includes(provider.category))
        disqualifiers.push("TRANSPORT_CATEGORY_NOT_ALLOWED");
    if (rule.requiresInstrument && !context.instrumentId)
        disqualifiers.push("TRANSPORT_AUTHORITY_MISSING");
    if (rule.requiresConfirmedDestination && !context.destinationFacilityId)
        disqualifiers.push("TRANSPORT_DESTINATION_NOT_CONFIRMED");
    if (provider.status !== "ACTIVE")
        disqualifiers.push("PROVIDER_NOT_ACTIVE");
    if (provider.verificationStatus === "STALE" || provider.verificationStatus === "BLOCKED" || provider.verificationStatus === "UNKNOWN") {
        disqualifiers.push("PROVIDER_VERIFICATION_NOT_CURRENT");
    }
    if (!provider.supportedLegalStatuses.includes(context.legalStatus))
        disqualifiers.push("LEGAL_STATUS_NOT_SUPPORTED");
    if (!provider.serviceAreas.includes(context.serviceArea))
        disqualifiers.push("SERVICE_AREA_NOT_SUPPORTED");
    for (const capability of context.requiredCapabilities) {
        if (!provider.capabilities.includes(capability))
            disqualifiers.push(`MISSING_CAPABILITY:${capability}`);
    }
    if (context.destinationFacilityId && provider.facilityApprovals.length > 0 && !provider.facilityApprovals.includes(context.destinationFacilityId)) {
        disqualifiers.push("FACILITY_APPROVAL_MISSING");
    }
    if (provider.jurisdictionApprovals.length > 0 && !provider.jurisdictionApprovals.includes(context.jurisdictionCode)) {
        disqualifiers.push("JURISDICTION_APPROVAL_MISSING");
    }
    if (provider.category === "TRANSPORTATION_BROKER")
        conditions.push("ACTUAL_CARRIER_REQUIRED");
    if (provider.verificationStatus === "PARTIAL")
        conditions.push("MANUAL_CREDENTIAL_REVIEW_REQUIRED");
    return {
        providerId: provider.providerId,
        status: disqualifiers.length > 0 ? "NOT_QUALIFIED" : conditions.length > 0 ? "CONDITIONAL" : "QUALIFIED",
        disqualifiers,
        conditions,
        ruleVersionIds: [`${rule.ruleId}:v${rule.version}`],
    };
}
export function defaultSecuredInstrumentRule() {
    return {
        ruleId: "OWNER_LA_SECURED_INSTRUMENT_TRANSPORT",
        version: 1,
        legalStatuses: ["OPC", "PEC", "CEC"],
        allowedCategories: [
            "LAW_ENFORCEMENT_CUSTODY",
            "LICENSED_AMBULANCE_EMS",
            "CONTRACTED_SECURE_BEHAVIORAL_TRANSPORT",
        ],
        blockedCategories: [
            "FAMILY_OR_SUPPORT_TRANSPORT",
            "SELF_TRANSPORT",
            "NEMT_CARRIER",
            "TRANSPORTATION_BROKER",
            "INTERFACILITY_CLINICAL_TRANSPORT",
        ],
        requiresConfirmedDestination: true,
        requiresInstrument: true,
    };
}
