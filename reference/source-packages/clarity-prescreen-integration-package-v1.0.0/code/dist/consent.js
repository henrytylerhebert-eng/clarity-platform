export function ageBandFor(age) {
    if (!Number.isInteger(age) || age < 0 || age > 125)
        throw new RangeError("Age must be an integer from 0 through 125.");
    if (age < 12)
        return "UNDER_12";
    if (age < 16)
        return "AGE_12_TO_15";
    if (age < 18)
        return "AGE_16_TO_17";
    return "ADULT";
}
export function evaluateConsentAuthority(rules, context) {
    const ageBand = ageBandFor(context.age);
    const candidates = rules.filter((rule) => rule.status === "APPROVED" &&
        rule.jurisdictionCode === context.jurisdictionCode &&
        (rule.facilityId === undefined || rule.facilityId === context.facilityId) &&
        (rule.programId === undefined || rule.programId === context.programId) &&
        (rule.ageBand === "ALL" || rule.ageBand === ageBand) &&
        rule.actionCode === context.actionCode &&
        rule.admissionPathways.includes(context.admissionPathway));
    if (candidates.length === 0)
        return { allowed: false, unmetRequirements: ["NO_APPROVED_RULE"], reasons: [] };
    const rule = candidates[0];
    if (!rule)
        return { allowed: false, unmetRequirements: ["NO_APPROVED_RULE"], reasons: [] };
    const unmet = [];
    if (!rule.authorizedSignerTypes.includes(context.signerType))
        unmet.push("SIGNER_TYPE_NOT_AUTHORIZED");
    if (rule.relationshipEvidenceRequired && !context.relationshipEvidencePresent)
        unmet.push("RELATIONSHIP_EVIDENCE_REQUIRED");
    if (rule.minorSignatureRequired && !context.minorSignaturePresent)
        unmet.push("MINOR_SIGNATURE_REQUIRED");
    if (rule.courtApprovalRequired && !context.courtApprovalPresent)
        unmet.push("COURT_APPROVAL_REQUIRED");
    if (rule.clinicianReviewRequired && !context.clinicianReviewPresent)
        unmet.push("CLINICIAN_REVIEW_REQUIRED");
    if (context.privacyRegime && rule.privacyRegimes.length > 0 && !rule.privacyRegimes.includes(context.privacyRegime))
        unmet.push("PRIVACY_REGIME_NOT_COVERED");
    return {
        allowed: unmet.length === 0,
        ruleId: rule.ruleId,
        ruleVersion: rule.version,
        unmetRequirements: unmet,
        reasons: [`MATCHED_APPROVED_RULE:${rule.ruleId}:v${rule.version}`],
    };
}
