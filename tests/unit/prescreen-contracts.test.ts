import { describe, expect, it } from "vitest";
import * as contracts from "@clarity/domain-contracts";
import {
  AssessmentAnswerSchema,
  AssessmentVersionSchema,
  ConsentAuthorityRuleSchema,
  FormalVoluntaryPrescreenGateSchema,
  PacketRequirementSchema,
  PrescreenContractError,
  PrescreenEventEnvelopeSchema,
  SECURED_INSTRUMENT_BLOCKED_CATEGORIES,
  TransportCategoryRuleSchema,
  assertAssessmentVersionSuccessor,
  assertPrescreenEncounterTransition,
  derivePossiblePrescreenPathway,
  evaluateConsentAuthority,
  evaluateOrientationGate,
  evaluatePrescreenPacketReadiness,
  evaluateTransportCategoryRule,
  type AssessmentVersion,
  type ConsentAuthorityContext,
  type OrientationObservation,
  type PacketRequirement,
  type TransportCategoryRule,
} from "@clarity/domain-contracts";

const NOW = "2026-07-19T12:00:00Z";

const formalVoluntaryGate = FormalVoluntaryPrescreenGateSchema.parse({
  ruleId: "synthetic-owner-formal-voluntary-gate",
  ruleVersion: 1,
  source: "OWNER_DEFINED_LAUNCH_RULE",
  requiredDomains: ["person", "place", "time", "situation"],
});

function orientation(
  person: OrientationObservation["domains"]["person"]["status"],
  place = person,
  time = person,
  situation = person,
): OrientationObservation {
  return {
    observedAt: NOW,
    sourceId: "synthetic-observation-source",
    domains: {
      person: { status: person },
      place: { status: place },
      time: { status: time },
      situation: { status: situation },
    },
  };
}

describe("prescreen pathway contracts", () => {
  it("passes the owner-defined gate only when all four domains are oriented", () => {
    expect(evaluateOrientationGate(orientation("ORIENTED"))).toBe("PASS");
    expect(evaluateOrientationGate(orientation("ORIENTED", "NOT_ORIENTED"))).toBe("FAIL");
    expect(evaluateOrientationGate(orientation("ORIENTED", "UNKNOWN"))).toBe("UNKNOWN");
  });

  it("derives possible formal-voluntary review without making a final decision", () => {
    const result = derivePossiblePrescreenPathway({
      willingness: "WILLING",
      orientation: orientation("ORIENTED"),
      formalVoluntaryGate,
    });
    expect(result).toMatchObject({
      pathway: "POSSIBLE_FORMAL_VOLUNTARY_REVIEW",
      requiresAuthorizedReview: true,
    });
    expect(result.pathway).toMatch(/^POSSIBLE_/);
  });

  it("routes willing but not oriented to possible noncontested review", () => {
    expect(
      derivePossiblePrescreenPathway({
        willingness: "WILLING",
        orientation: orientation("ORIENTED", "ORIENTED", "NOT_ORIENTED", "ORIENTED"),
        formalVoluntaryGate,
      }),
    ).toMatchObject({
      pathway: "POSSIBLE_NONCONTESTED_PATHWAY",
      orientationGate: "FAIL",
      requiresAuthorizedReview: true,
    });
  });

  it("routes non-opposed with unknown orientation to possible noncontested review", () => {
    expect(
      derivePossiblePrescreenPathway({
        willingness: "NON_OPPOSED",
        orientation: orientation("UNKNOWN"),
        formalVoluntaryGate,
      }),
    ).toMatchObject({
      pathway: "POSSIBLE_NONCONTESTED_PATHWAY",
      orientationGate: "UNKNOWN",
      requiresAuthorizedReview: true,
    });
  });

  it("routes opposition or an active process to review without selecting an instrument", () => {
    const result = derivePossiblePrescreenPathway({
      willingness: "OPPOSED",
      orientation: orientation("ORIENTED"),
      formalVoluntaryGate,
    });
    expect(result.pathway).toBe("EMERGENCY_OR_LEGAL_REVIEW_REQUIRED");
    expect(result).not.toHaveProperty("instrument");
  });

  it("gives medical stabilization precedence over other possible pathways", () => {
    expect(
      derivePossiblePrescreenPathway({
        willingness: "OPPOSED",
        orientation: orientation("NOT_ORIENTED"),
        formalVoluntaryGate,
        activeEmergencyOrLegalProcess: true,
        immediateMedicalStabilizationRequired: true,
      }).pathway,
    ).toBe("MEDICAL_STABILIZATION_REQUIRED");
  });

  it("preserves blank or unanswered values as explicit unknown state", () => {
    const answer = AssessmentAnswerSchema.parse({
      answerId: "synthetic-answer",
      questionCode: "willingness-detail",
      valueState: "UNKNOWN",
      sourceIds: [],
      recordedAt: NOW,
      recordedBy: "synthetic-assessor",
    });
    expect(answer.valueState).toBe("UNKNOWN");
    expect(answer).not.toHaveProperty("value");
  });
});

describe("prescreen encounter and assessment version contracts", () => {
  it("rejects invalid encounter transitions deterministically", () => {
    expect(() => assertPrescreenEncounterTransition("DRAFT", "HANDED_OFF")).toThrowError(
      expect.objectContaining<Partial<PrescreenContractError>>({ code: "INVALID_ENCOUNTER_TRANSITION" }),
    );
  });

  it("requires post-attestation changes to use a linked successor version", () => {
    const base = {
      schemaVersion: "1.0.0" as const,
      encounterId: "synthetic-encounter",
      organizationId: "synthetic-org",
      createdAt: NOW,
      createdBy: "synthetic-assessor",
      willingness: "WILLING" as const,
      orientation: orientation("ORIENTED"),
      answers: [],
      sources: [],
    };
    const previous = AssessmentVersionSchema.parse({
      ...base,
      assessmentVersionId: "synthetic-assessment-v1",
      versionNumber: 1,
      status: "ATTESTED",
      attestedAt: NOW,
      attestedBy: "synthetic-assessor",
      contentHash: "synthetic-hash-v1",
    });
    const successor = AssessmentVersionSchema.parse({
      ...base,
      assessmentVersionId: "synthetic-assessment-v2",
      versionNumber: 2,
      status: "CORRECTED",
      parentVersionId: previous.assessmentVersionId,
      changeReason: "Synthetic collateral clarification",
    });
    expect(() => assertAssessmentVersionSuccessor(previous, successor)).not.toThrow();
    expect(() =>
      assertAssessmentVersionSuccessor(previous, {
        ...successor,
        assessmentVersionId: previous.assessmentVersionId,
      } as AssessmentVersion),
    ).toThrowError(expect.objectContaining({ code: "ASSESSMENT_VERSION_CONFLICT" }));
  });

  it("accepts the canonical JSON/OpenAPI assessment nesting and field names", () => {
    const assessment = AssessmentVersionSchema.parse({
      schemaVersion: "1.0.0",
      assessmentVersionId: "synthetic-canonical-assessment",
      encounterId: "synthetic-encounter",
      organizationId: "synthetic-org",
      versionNumber: 1,
      status: "DRAFT",
      createdAt: NOW,
      createdBy: "synthetic-assessor",
      attestedAt: null,
      attestedBy: null,
      parentVersionId: null,
      changeReason: null,
      willingness: "WILLING",
      orientation: orientation("ORIENTED"),
      possiblePathway: "POSSIBLE_FORMAL_VOLUNTARY_REVIEW",
      answers: [],
      sources: [
        {
          sourceId: "synthetic-observation-source",
          sourceType: "DIRECT_OBSERVATION",
          displayLabel: "Synthetic direct observation",
          documentVersionId: null,
          recordedAt: NOW,
        },
      ],
      contradictions: [],
      unknowns: [],
      emergencyInterrupt: null,
    });
    expect(assessment.orientation.domains.situation.status).toBe("ORIENTED");
    expect(assessment.sources[0]?.displayLabel).toBe("Synthetic direct observation");
  });
});

describe("target-specific referral packet readiness", () => {
  const requirement = (
    code: string,
    state: PacketRequirement["state"],
    blockingTargets: PacketRequirement["blockingTargets"],
  ) =>
    PacketRequirementSchema.parse({
      requirementCode: code,
      label: code,
      state,
      blockingTargets,
      responsibleRoleCode: "SYNTHETIC_PACKET_OWNER",
      resolutionWorkspace: "packet-review",
      sourceRuleId: "synthetic-facility-rule",
      sourceRuleVersion: 1,
    });

  it("returns target-specific blockers with owner, provenance, and resolution workspace", () => {
    const requirements = [
      requirement("demographics", "ACCEPTED_FOR_PACKET", ["CENTRAL_INTAKE_REVIEW"]),
      requirement("mar", "MISSING", ["FACILITY_ROUTING"]),
    ];
    expect(evaluatePrescreenPacketReadiness("CENTRAL_INTAKE_REVIEW", requirements).ready).toBe(true);
    const routing = evaluatePrescreenPacketReadiness("FACILITY_ROUTING", requirements);
    expect(routing.ready).toBe(false);
    expect(routing.blockers[0]).toMatchObject({
      state: "MISSING",
      responsibleRoleCode: "SYNTHETIC_PACKET_OWNER",
      resolutionWorkspace: "packet-review",
      sourceRuleId: "synthetic-facility-rule",
      sourceRuleVersion: 1,
    });
  });

  it("treats unavailable as visible warning and authorized not-applicable as satisfied", () => {
    const result = evaluatePrescreenPacketReadiness("FACILITY_ROUTING", [
      requirement("labs", "UNAVAILABLE_WITH_REASON", ["FACILITY_ROUTING"]),
      requirement("oxygen", "NOT_APPLICABLE_WITH_AUTHORITY", ["FACILITY_ROUTING"]),
    ]);
    expect(result).toMatchObject({ ready: true, blockers: [] });
    expect(result.warnings).toHaveLength(1);
  });
});

describe("transport category rule contracts", () => {
  const securedRule: TransportCategoryRule = TransportCategoryRuleSchema.parse({
    ruleId: "synthetic-secured-transport-rule",
    version: 1,
    approvalStatus: "APPROVED",
    applicableAuthorities: ["OPC", "PEC", "CEC"],
    allowedCategories: [
      "LAW_ENFORCEMENT_CUSTODY",
      "LICENSED_AMBULANCE_EMS",
      "CONTRACTED_SECURE_BEHAVIORAL_TRANSPORT",
    ],
    blockedCategories: SECURED_INSTRUMENT_BLOCKED_CATEGORIES,
    requiresInstrument: true,
    requiresConfirmedDestination: true,
    sourceRuleId: "synthetic-owner-transport-source",
    sourceRuleVersion: 1,
  });

  it("blocks family, self, taxi/rideshare, and unsecured paths for configured OPC/PEC/CEC rules", () => {
    for (const authority of ["OPC", "PEC", "CEC"] as const) {
      for (const category of SECURED_INSTRUMENT_BLOCKED_CATEGORIES) {
        expect(evaluateTransportCategoryRule(securedRule, authority, category).decision).toBe("BLOCKED");
      }
    }
  });

  it("does not implement transport-provider qualification in the contracts slice", () => {
    expect(contracts).not.toHaveProperty("qualifyTransportProvider");
  });
});

describe("consent authority contracts", () => {
  const context: ConsentAuthorityContext = {
    jurisdiction: "SYNTHETIC_LA",
    facilityId: "synthetic-facility",
    age: 14,
    actionCode: "PARENTAL_ADMISSION_APPLICATION",
    admissionPathway: "PARENTAL_ADMISSION",
    signerType: "PARENT",
    relationshipEvidencePresent: true,
    minorSignaturePresent: false,
    courtApprovalPresent: false,
    clinicianReviewPresent: true,
    evaluatedOn: "2026-07-19",
  };

  const minorRule = ConsentAuthorityRuleSchema.parse({
    ruleId: "synthetic-minor-guardian-rule",
    version: 1,
    jurisdiction: "SYNTHETIC_LA",
    facilityId: "synthetic-facility",
    ageBand: "AGE_12_TO_15",
    actionCode: "PARENTAL_ADMISSION_APPLICATION",
    admissionPathways: ["PARENTAL_ADMISSION"],
    authorizedSignerTypes: ["PARENT", "LEGAL_GUARDIAN"],
    relationshipEvidenceRequired: true,
    clinicianReviewRequired: true,
    effectiveFrom: "2026-01-01",
    approvalStatus: "APPROVED",
    sourceReferences: [{ sourceType: "OTHER", citation: "Synthetic rule source" }],
  });

  it("validates document-specific minor and guardian authority shape", () => {
    expect(minorRule).toMatchObject({
      ageBand: "AGE_12_TO_15",
      authorizedSignerTypes: ["PARENT", "LEGAL_GUARDIAN"],
      relationshipEvidenceRequired: true,
    });
  });

  it("fails closed without an approved matching rule", () => {
    expect(evaluateConsentAuthority([], context)).toEqual({
      allowed: false,
      unmetRequirements: ["NO_APPROVED_RULE"],
      reasons: [],
    });
    expect(
      evaluateConsentAuthority([{ ...minorRule, approvalStatus: "PENDING_REVIEW" }], context).allowed,
    ).toBe(false);
  });
});

describe("prescreen event envelope and catalog", () => {
  const event = {
    eventId: "synthetic-event",
    schemaName: "clarity.prescreen.event",
    schemaVersion: "1.0.0",
    eventType: "ORIENTATION_OBSERVED",
    organizationId: "synthetic-org",
    caseId: "synthetic-case",
    encounterId: "synthetic-encounter",
    aggregateType: "AssessmentVersion",
    aggregateId: "synthetic-assessment-v1",
    aggregateVersion: 1,
    eventTime: NOW,
    recordedTime: NOW,
    actor: { actorType: "USER", actorId: "synthetic-assessor", roleCodes: ["PRESCREEN_ASSESSOR"] },
    source: { sourceSystem: "clarity-synthetic-test" },
    correlationId: "synthetic-correlation",
    phiClassification: "SENSITIVE_OPERATIONAL",
    dataQualityState: "VALIDATED",
    reviewState: "PENDING",
    payload: { person: "ORIENTED", place: "ORIENTED", time: "ORIENTED", situation: "ORIENTED" },
  } as const;

  it("accepts the supported envelope version and fails closed on unknown versions", () => {
    expect(PrescreenEventEnvelopeSchema.parse(event).schemaVersion).toBe("1.0.0");
    expect(PrescreenEventEnvelopeSchema.safeParse({ ...event, schemaVersion: "2.0.0" }).success).toBe(false);
    expect(PrescreenEventEnvelopeSchema.safeParse({ ...event, eventType: "UNKNOWN_EVENT" }).success).toBe(false);
  });
});
