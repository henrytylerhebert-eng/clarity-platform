import { describe, expect, it } from "vitest";
import {
  assertPrescreenEncounterTransition,
  canTransitionPrescreenEncounter,
  consentAgeBandFor,
  derivePossiblePathway,
  evaluateConsentAuthority,
  evaluateOrientationGate,
  evaluatePacketReadiness,
  qualifyTransportProvider,
  syntheticSecuredInstrumentTransportRule,
  ConsentAuthorityRuleSchema,
  OrientationObservationSchema,
  PacketRequirementSchema,
  PrescreenAssessmentVersionSchema,
  PrescreenEncounterSchema,
  PrescreenEventEnvelopeSchema,
  PrescreenTransitionError,
  TransportProviderSchema,
  PRESCREEN_ENCOUNTER_STATUSES,
  type ConsentAuthorityRule,
  type ConsentContext,
  type OrientationObservation,
  type OrientationStatus,
  type PacketRequirement,
  type PacketRequirementState,
  type PrescreenReadinessTarget,
  type TransportContext,
  type TransportProvider,
} from "@clarity/domain-contracts";

function orientation(
  person: OrientationStatus,
  place: OrientationStatus,
  time: OrientationStatus,
  situation: OrientationStatus,
): OrientationObservation {
  return {
    observedAt: "2026-07-19T12:00:00Z",
    person: { status: person },
    place: { status: place },
    time: { status: time },
    situation: { status: situation },
  };
}

const fullyOriented = orientation("ORIENTED", "ORIENTED", "ORIENTED", "ORIENTED");

describe("orientation gate", () => {
  it("passes only when all four domains are oriented", () => {
    expect(evaluateOrientationGate(fullyOriented)).toBe("PASS");
    expect(evaluateOrientationGate(orientation("ORIENTED", "NOT_ORIENTED", "ORIENTED", "ORIENTED"))).toBe("FAIL");
    expect(evaluateOrientationGate(orientation("ORIENTED", "UNKNOWN", "ORIENTED", "ORIENTED"))).toBe("UNKNOWN");
  });
});

describe("possible-pathway derivation", () => {
  it("routes willing and oriented to possible formal voluntary review", () => {
    const result = derivePossiblePathway({ willingness: "WILLING", orientation: fullyOriented });
    expect(result.pathway).toBe("POSSIBLE_FORMAL_VOLUNTARY_REVIEW");
    expect(result.requiresAuthorizedReview).toBe(true);
  });

  it("routes willing but not fully oriented to possible noncontested pathway", () => {
    const result = derivePossiblePathway({
      willingness: "WILLING",
      orientation: orientation("ORIENTED", "ORIENTED", "NOT_ORIENTED", "NOT_ORIENTED"),
    });
    expect(result.pathway).toBe("POSSIBLE_NONCONTESTED_PATHWAY");
    expect(result.orientationGate).toBe("FAIL");
  });

  it("routes non-opposed with unknown orientation to possible noncontested pathway", () => {
    const result = derivePossiblePathway({
      willingness: "NON_OPPOSED",
      orientation: orientation("UNKNOWN", "UNKNOWN", "UNKNOWN", "UNKNOWN"),
    });
    expect(result.pathway).toBe("POSSIBLE_NONCONTESTED_PATHWAY");
  });

  it("routes opposed to emergency or legal review without choosing an instrument", () => {
    const result = derivePossiblePathway({ willingness: "OPPOSED", orientation: fullyOriented });
    expect(result.pathway).toBe("EMERGENCY_OR_LEGAL_REVIEW_REQUIRED");
  });

  it("gives medical stabilization precedence over every other pathway", () => {
    const result = derivePossiblePathway({
      willingness: "WILLING",
      orientation: fullyOriented,
      immediateMedicalStabilizationRequired: true,
    });
    expect(result.pathway).toBe("MEDICAL_STABILIZATION_REQUIRED");
  });

  it("routes non-opposed and fully oriented to the noncontested pathway with authorized review", () => {
    const result = derivePossiblePathway({ willingness: "NON_OPPOSED", orientation: fullyOriented });
    expect(result.pathway).toBe("POSSIBLE_NONCONTESTED_PATHWAY");
    expect(result.requiresAuthorizedReview).toBe(true);
  });

  it("reports both reasons when a patient is opposed during an active legal process", () => {
    const result = derivePossiblePathway({
      willingness: "OPPOSED",
      orientation: fullyOriented,
      activeEmergencyOrLegalProcess: true,
    });
    expect(result.pathway).toBe("EMERGENCY_OR_LEGAL_REVIEW_REQUIRED");
    expect(result.reasons).toEqual(["ACTIVE_LEGAL_PROCESS", "PATIENT_OPPOSED"]);
  });

  it("derives UNDETERMINED without authorized review when information is insufficient", () => {
    const result = derivePossiblePathway({
      willingness: "NOT_ASSESSED",
      orientation: orientation("UNKNOWN", "UNKNOWN", "UNKNOWN", "UNKNOWN"),
    });
    expect(result.pathway).toBe("UNDETERMINED");
    expect(result.requiresAuthorizedReview).toBe(false);
  });
});

describe("prescreen encounter state machine", () => {
  it("allows the documented forward transitions", () => {
    expect(() => assertPrescreenEncounterTransition("DRAFT", "ATTESTED")).not.toThrow();
    expect(() => assertPrescreenEncounterTransition("ATTESTED", "SUBMITTED")).not.toThrow();
    expect(() => assertPrescreenEncounterTransition("SUBMITTED", "CENTRAL_INTAKE_REVIEW")).not.toThrow();
  });

  it("rejects invalid transitions deterministically with the stable code", () => {
    expect(() => assertPrescreenEncounterTransition("DRAFT", "HANDED_OFF")).toThrow(PrescreenTransitionError);
    try {
      assertPrescreenEncounterTransition("DRAFT", "HANDED_OFF");
    } catch (error) {
      expect((error as PrescreenTransitionError).code).toBe("INVALID_ENCOUNTER_TRANSITION");
    }
  });

  it("treats terminal statuses as dead ends", () => {
    for (const terminal of ["HANDED_OFF", "REDIRECTED", "DECLINED", "CANCELLED"] as const) {
      for (const to of PRESCREEN_ENCOUNTER_STATUSES) {
        expect(canTransitionPrescreenEncounter(terminal, to)).toBe(false);
      }
    }
  });
});

function requirement(
  code: string,
  state: PacketRequirementState,
  targets: readonly PrescreenReadinessTarget[],
  role = "PRESCREEN_ASSESSOR",
): PacketRequirement {
  return {
    requirementCode: code,
    label: code,
    state,
    blockingTargets: [...targets],
    responsibleRoleCode: role,
    resolutionWorkspace: "Packet",
    sourceRuleId: "facility-rule",
    sourceRuleVersion: 1,
  };
}

describe("target-specific packet readiness", () => {
  it("is ready when no requirement blocks the named target", () => {
    const result = evaluatePacketReadiness("CENTRAL_INTAKE_REVIEW", [
      requirement("DEMOGRAPHICS", "ACCEPTED_FOR_PACKET", ["CENTRAL_INTAKE_REVIEW"]),
      requirement("LABS", "MISSING", ["FACILITY_ROUTING"]),
    ]);
    expect(result.ready).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });

  it("reports a missing target requirement as a blocker with resolution metadata", () => {
    const result = evaluatePacketReadiness("FACILITY_ROUTING", [
      requirement("MAR", "MISSING", ["FACILITY_ROUTING"], "SENDING_NURSE"),
    ]);
    expect(result.ready).toBe(false);
    expect(result.blockers[0]?.responsibleRoleCode).toBe("SENDING_NURSE");
    expect(result.blockers[0]?.sourceRuleId).toBe("facility-rule");
  });

  it("treats received-but-under-review as a warning, not a blocker", () => {
    const result = evaluatePacketReadiness("CENTRAL_INTAKE_REVIEW", [
      requirement("NOTES", "RECEIVED", ["CENTRAL_INTAKE_REVIEW"]),
    ]);
    expect(result.ready).toBe(true);
    expect(result.warnings).toHaveLength(1);
  });

  it("accepts not-applicable-with-authority as satisfying the requirement", () => {
    const result = evaluatePacketReadiness("FACILITY_ROUTING", [
      requirement("OXYGEN", "NOT_APPLICABLE_WITH_AUTHORITY", ["FACILITY_ROUTING"]),
    ]);
    expect(result.ready).toBe(true);
  });

  it("never produces an aggregate score, only named blockers and warnings", () => {
    const result = evaluatePacketReadiness("CENTRAL_INTAKE_REVIEW", [
      requirement("A", "MISSING", ["CENTRAL_INTAKE_REVIEW"]),
      requirement("B", "RECEIVED", ["CENTRAL_INTAKE_REVIEW"]),
    ]);
    expect(Object.keys(result).sort()).toEqual(["blockers", "ready", "target", "warnings"]);
  });
});

const syntheticConsentRule: ConsentAuthorityRule = {
  ruleId: "synthetic-parental-admission",
  version: 1,
  status: "APPROVED",
  jurisdictionCode: "LA",
  facilityId: "facility-1",
  ageBand: "AGE_12_TO_15",
  actionCode: "PARENTAL_ADMISSION_APPLICATION",
  admissionPathways: ["PARENTAL_ADMISSION"],
  authorizedSignerTypes: ["PARENT", "LEGAL_GUARDIAN"],
  minorSignatureRequired: false,
  relationshipEvidenceRequired: true,
  courtApprovalRequired: false,
  clinicianReviewRequired: true,
  privacyRegimes: [],
};

const syntheticConsentContext: ConsentContext = {
  jurisdictionCode: "LA",
  facilityId: "facility-1",
  age: 14,
  actionCode: "PARENTAL_ADMISSION_APPLICATION",
  admissionPathway: "PARENTAL_ADMISSION",
  signerType: "PARENT",
  relationshipEvidencePresent: true,
  minorSignaturePresent: false,
  courtApprovalPresent: false,
  clinicianReviewPresent: true,
};

describe("consent authority evaluation (configured synthetic rules)", () => {
  it("derives deterministic age bands and rejects out-of-range ages", () => {
    expect(consentAgeBandFor(11)).toBe("UNDER_12");
    expect(consentAgeBandFor(14)).toBe("AGE_12_TO_15");
    expect(consentAgeBandFor(16)).toBe("AGE_16_TO_17");
    expect(consentAgeBandFor(18)).toBe("ADULT");
    expect(() => consentAgeBandFor(-1)).toThrow(RangeError);
    expect(() => consentAgeBandFor(126)).toThrow(RangeError);
  });

  it("allows a matching approved rule when all requirements are met", () => {
    const result = evaluateConsentAuthority([syntheticConsentRule], syntheticConsentContext);
    expect(result.allowed).toBe(true);
    expect(result.ruleId).toBe("synthetic-parental-admission");
  });

  it("enforces relationship evidence", () => {
    const result = evaluateConsentAuthority([syntheticConsentRule], {
      ...syntheticConsentContext,
      relationshipEvidencePresent: false,
    });
    expect(result.allowed).toBe(false);
    expect(result.unmetRequirements).toContain("RELATIONSHIP_EVIDENCE_REQUIRED");
  });

  it("does not treat the wrong signer type as authority", () => {
    const result = evaluateConsentAuthority([syntheticConsentRule], {
      ...syntheticConsentContext,
      signerType: "MINOR_PATIENT",
    });
    expect(result.unmetRequirements).toContain("SIGNER_TYPE_NOT_AUTHORIZED");
  });

  it("never authorizes from a draft rule (fails closed)", () => {
    const result = evaluateConsentAuthority(
      [{ ...syntheticConsentRule, status: "DRAFT_UNVERIFIED" }],
      syntheticConsentContext,
    );
    expect(result.unmetRequirements).toEqual(["NO_APPROVED_RULE"]);
  });

  it("fails closed when a regime-scoped rule receives no privacy regime", () => {
    const scopedRule = { ...syntheticConsentRule, privacyRegimes: ["SYNTHETIC_REGIME_42CFR"] };
    const withoutRegime = evaluateConsentAuthority([scopedRule], syntheticConsentContext);
    expect(withoutRegime.allowed).toBe(false);
    expect(withoutRegime.unmetRequirements).toContain("PRIVACY_REGIME_NOT_COVERED");
    const withRegime = evaluateConsentAuthority([scopedRule], {
      ...syntheticConsentContext,
      privacyRegime: "SYNTHETIC_REGIME_42CFR",
    });
    expect(withRegime.allowed).toBe(true);
  });

  it("fails closed when no facility rule matches", () => {
    const result = evaluateConsentAuthority([syntheticConsentRule], {
      ...syntheticConsentContext,
      facilityId: "facility-2",
    });
    expect(result.allowed).toBe(false);
  });

  it("fails closed when multiple approved rules match regardless of input order", () => {
    const broadRule: ConsentAuthorityRule = {
      ...syntheticConsentRule,
      ruleId: "synthetic-jurisdiction-wide-admission",
      facilityId: undefined,
      relationshipEvidenceRequired: false,
      clinicianReviewRequired: false,
    };
    const broadFirst = evaluateConsentAuthority([broadRule, syntheticConsentRule], syntheticConsentContext);
    const specificFirst = evaluateConsentAuthority([syntheticConsentRule, broadRule], syntheticConsentContext);
    expect(broadFirst).toEqual(specificFirst);
    for (const result of [broadFirst, specificFirst]) {
      expect(result.allowed).toBe(false);
      expect(result.ruleId).toBeUndefined();
      expect(result.unmetRequirements).toEqual(["AMBIGUOUS_APPROVED_RULES"]);
      expect(result.reasons).toHaveLength(2);
    }
  });
});

const transportContext: TransportContext = {
  legalStatus: "OPC",
  instrumentId: "opc_synthetic_1",
  sendingFacilityId: "facility-sending-1",
  destinationFacilityId: "facility-1",
  jurisdictionCode: "LA",
  serviceArea: "Lafayette Parish",
  requiredCapabilities: ["CONTINUOUS_SUPERVISION"],
};

function syntheticProvider(overrides: Partial<TransportProvider> = {}): TransportProvider {
  return {
    providerId: "p1",
    legalName: "Synthetic Secure Transport",
    category: "CONTRACTED_SECURE_BEHAVIORAL_TRANSPORT",
    status: "ACTIVE",
    verificationStatus: "VERIFIED",
    supportedLegalStatuses: ["OPC", "PEC", "CEC"],
    serviceAreas: ["Lafayette Parish"],
    capabilities: ["CONTINUOUS_SUPERVISION"],
    restrictions: [],
    facilityApprovals: ["facility-sending-1", "facility-1"],
    jurisdictionApprovals: ["LA"],
    ...overrides,
  };
}

describe("transport provider qualification (configured synthetic rule)", () => {
  const rule = syntheticSecuredInstrumentTransportRule();

  it("qualifies a verified contracted secure provider under the configured OPC rule", () => {
    expect(qualifyTransportProvider(syntheticProvider(), transportContext, rule).status).toBe("QUALIFIED");
  });

  it("blocks family transport for the configured OPC path", () => {
    const result = qualifyTransportProvider(
      syntheticProvider({ category: "FAMILY_OR_SUPPORT_TRANSPORT" }),
      transportContext,
      rule,
    );
    expect(result.status).toBe("NOT_QUALIFIED");
    expect(result.disqualifiers).toContain("TRANSPORT_CATEGORY_BLOCKED");
  });

  it("blocks secured instrument transport without an instrument", () => {
    const { instrumentId: _omitted, ...withoutInstrument } = transportContext;
    const result = qualifyTransportProvider(syntheticProvider(), withoutInstrument, rule);
    expect(result.disqualifiers).toContain("TRANSPORT_AUTHORITY_MISSING");
  });

  it("blocks qualification without a confirmed destination", () => {
    const { destinationFacilityId: _omitted, ...withoutDestination } = transportContext;
    const result = qualifyTransportProvider(syntheticProvider(), withoutDestination, rule);
    expect(result.disqualifiers).toContain("TRANSPORT_DESTINATION_NOT_CONFIRMED");
  });

  it("blocks stale provider credentials", () => {
    const result = qualifyTransportProvider(syntheticProvider({ verificationStatus: "STALE" }), transportContext, rule);
    expect(result.disqualifiers).toContain("PROVIDER_VERIFICATION_NOT_CURRENT");
  });

  it("blocks service-area mismatches", () => {
    const result = qualifyTransportProvider(syntheticProvider({ serviceAreas: ["Orleans Parish"] }), transportContext, rule);
    expect(result.disqualifiers).toContain("SERVICE_AREA_NOT_SUPPORTED");
  });

  it("blocks missing patient capabilities", () => {
    const result = qualifyTransportProvider(syntheticProvider({ capabilities: [] }), transportContext, rule);
    expect(result.disqualifiers).toContain("MISSING_CAPABILITY:CONTINUOUS_SUPERVISION");
  });

  it("blocks providers with unresolved restrictions", () => {
    const result = qualifyTransportProvider(
      syntheticProvider({ restrictions: ["Synthetic credential review remains open"] }),
      transportContext,
      rule,
    );
    expect(result.status).toBe("NOT_QUALIFIED");
    expect(result.disqualifiers).toContain("UNRESOLVED_PROVIDER_RESTRICTION");
  });

  it("requires both sending- and receiving-facility approvals", () => {
    const missingSending = qualifyTransportProvider(
      syntheticProvider({ facilityApprovals: ["facility-1"] }),
      transportContext,
      rule,
    );
    expect(missingSending.disqualifiers).toContain("SENDING_FACILITY_APPROVAL_MISSING");

    const missingReceiving = qualifyTransportProvider(
      syntheticProvider({ facilityApprovals: ["facility-sending-1"] }),
      transportContext,
      rule,
    );
    expect(missingReceiving.disqualifiers).toContain("RECEIVING_FACILITY_APPROVAL_MISSING");
  });
});

describe("prescreen schemas", () => {
  it("accepts a synthetic encounter and rejects unknown fields", () => {
    const encounter = {
      encounterId: "pre_syn_1",
      caseId: "case_syn_1",
      organizationId: "org_syn_1",
      status: "DRAFT",
      version: 1,
      currentLocation: "Synthetic ED",
      presentingConcern: "Synthetic concern",
      possiblePathway: "UNDETERMINED",
      createdBy: "actor_syn_1",
      createdAt: "2026-07-19T12:00:00Z",
      updatedAt: "2026-07-19T12:00:00Z",
    };
    expect(PrescreenEncounterSchema.parse(encounter).encounterId).toBe("pre_syn_1");
    expect(() => PrescreenEncounterSchema.parse({ ...encounter, unexpected: true })).toThrow();
  });

  it("accepts a synthetic draft assessment version", () => {
    const version = {
      assessmentVersionId: "asv_syn_1",
      encounterId: "pre_syn_1",
      organizationId: "org_syn_1",
      versionNumber: 1,
      status: "DRAFT",
      createdAt: "2026-07-19T12:05:00Z",
      createdBy: "actor_syn_1",
      willingness: "WILLING",
      orientation: fullyOriented,
      possiblePathway: "UNDETERMINED",
      answers: [
        {
          answerId: "ans_syn_1",
          questionCode: "PRESENTING_CONCERN",
          valueState: "ANSWERED",
          narrative: "Synthetic narrative",
          sourceIds: ["src_syn_1"],
          recordedAt: "2026-07-19T12:04:00Z",
          recordedBy: "actor_syn_1",
        },
      ],
      sources: [
        {
          sourceId: "src_syn_1",
          sourceType: "DIRECT_OBSERVATION",
          recordedAt: "2026-07-19T12:03:00Z",
        },
      ],
    };
    expect(PrescreenAssessmentVersionSchema.parse(version).status).toBe("DRAFT");
  });

  it("validates packet requirements, consent rules, transport providers, and orientation observations", () => {
    expect(PacketRequirementSchema.parse(requirement("DEMOGRAPHICS", "MISSING", ["CENTRAL_INTAKE_REVIEW"]))).toBeTruthy();
    expect(ConsentAuthorityRuleSchema.parse(syntheticConsentRule)).toBeTruthy();
    expect(TransportProviderSchema.parse(syntheticProvider())).toBeTruthy();
    expect(OrientationObservationSchema.parse(fullyOriented)).toBeTruthy();
  });

  it("accepts a synthetic event envelope for an adopted type only", () => {
    const envelope = {
      eventId: "evt_syn_1",
      schemaName: "clarity.prescreen.event",
      schemaVersion: "1.0.0",
      eventType: "PRESCREEN_ENCOUNTER_STARTED",
      organizationId: "org_syn_1",
      caseId: "case_syn_1",
      encounterId: "pre_syn_1",
      aggregateType: "PrescreenEncounter",
      aggregateId: "pre_syn_1",
      aggregateVersion: 1,
      eventTime: "2026-07-19T12:00:00Z",
      recordedTime: "2026-07-19T12:00:01Z",
      actor: { actorType: "USER", actorId: "actor_syn_1", roleCodes: ["SYNTHETIC_TEST_ROLE"] },
      source: { sourceSystem: "clarity.prescreen" },
      correlationId: "corr_syn_1",
      phiClassification: "RESTRICTED_PHI",
      dataQualityState: "VALIDATED",
      reviewState: "NOT_REQUIRED",
      payload: { encounterId: "pre_syn_1", caseId: "case_syn_1" },
    };
    expect(PrescreenEventEnvelopeSchema.parse(envelope).eventType).toBe("PRESCREEN_ENCOUNTER_STARTED");
    expect(() =>
      PrescreenEventEnvelopeSchema.parse({ ...envelope, eventType: "TRANSPORT_DEPARTED" }),
    ).toThrow();
  });
});
