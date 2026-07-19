import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  calculateNetworkAccuracyMetrics,
  canAgentReplaceNetworkField,
  detectNetworkFieldConflicts,
  enforceNetworkCandidatePolicy,
  networkFreshnessState,
  networkNextReviewAt,
  networkReviewRequirement,
  networkSourceCanSupportField,
  normalizeAddressKey,
  normalizeEntityName,
  normalizePhoneDigits,
  normalizeWebsiteHost,
  requiredNetworkReviewerRoles,
  resolveNetworkEntity,
  validateNetworkEnrichmentPackage,
  validateNetworkOutboundUrl,
  NetworkEnrichmentPackageSchema,
  NetworkResolutionCandidateSchema,
  NetworkResolutionTargetSchema,
  NETWORK_REVIEWER_ROLES,
  USER_ROLES,
  type NetworkCandidateField,
  type NetworkEnrichmentPackage,
} from "../../packages/domain-contracts/src/index.js";

const dataDir = resolve(dirname(fileURLToPath(import.meta.url)), "../data");

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(dataDir, name), "utf8")) as T;
}

function candidateField(overrides: Partial<NetworkCandidateField> = {}): NetworkCandidateField {
  return {
    candidateId: "cand-1",
    fieldPath: "contactPoints.admissions.phone",
    currentValue: null,
    proposedValue: "3375550100",
    normalizedValue: "3375550100",
    reviewState: "CANDIDATE",
    operationalUseStatus: "REQUIRES_REVIEW",
    evidenceIds: ["ev-1"],
    confidence: "HIGH",
    sourceEffectiveAt: null,
    lastHumanVerifiedAt: null,
    nextReviewAt: null,
    proposedReviewerRoles: ["NETWORK_REVIEWER"],
    ...overrides,
  };
}

function enrichmentPackage(overrides: Partial<NetworkEnrichmentPackage> = {}): NetworkEnrichmentPackage {
  return {
    schemaVersion: "clarity.network-enrichment.v1",
    runId: "run-1",
    organizationId: "org-1",
    entityResolution: {
      status: "PROBABLE_MATCH",
      selectedCandidateId: "entity-1",
      confidence: 0.7,
      margin: 0.2,
      reason: "synthetic",
      candidates: [],
      requiresHumanReview: true,
    },
    evidence: [
      {
        evidenceId: "ev-1",
        sourceType: "OFFICIAL_ORGANIZATION",
        sourceTier: 1,
        sourceTitle: "Admissions",
        sourceUrl: "https://example.org/admissions",
        retrievedAt: "2026-07-19T00:00:00.000Z",
        publishedOrEffectiveAt: null,
        evidenceText: "Admissions line listed on the official page.",
        supportsFields: ["contactPoints.admissions.phone"],
        scope: "CONTACT",
        confidence: "HIGH",
        contentHash: null,
      },
    ],
    candidates: [candidateField()],
    conflicts: [],
    unresolvedFields: [],
    limitations: [],
    ...overrides,
  };
}

describe("network enrichment normalization", () => {
  it("normalizes names, phones, hosts, and addresses deterministically", () => {
    expect(normalizeEntityName("Acadiana Recovery Center, LLC")).toBe("acadiana recovery center");
    expect(normalizeEntityName("Café & Wellness Corp")).toBe("cafe and wellness");
    expect(normalizePhoneDigits("+1 (337) 555-0100")).toBe("3375550100");
    expect(normalizeWebsiteHost("https://www.Example.org/path")).toBe("example.org");
    expect(normalizeWebsiteHost("not a url ::")).toBe("");
    expect(
      normalizeAddressKey({ street: "302 Dulles Dr.", city: "Lafayette", state: "LA", postalCode: "70506-1234" }),
    ).toBe("302 dulles dr|lafayette|la|70506");
  });
});

describe("network entity resolution", () => {
  const scenarios = loadJson<
    Array<{
      id: string;
      target: unknown;
      candidates: unknown[];
      expectedStatus: string;
      expectedId: string | null;
    }>
  >("network-enrichment-entity-resolution-scenarios.json");

  it("resolves all 12 synthetic scenarios to the expected status and entity", () => {
    expect(scenarios).toHaveLength(12);
    for (const scenario of scenarios) {
      const target = NetworkResolutionTargetSchema.parse(scenario.target);
      const candidates = scenario.candidates.map((c) => NetworkResolutionCandidateSchema.parse(c));
      const result = resolveNetworkEntity(target, candidates);
      expect(result.status, scenario.id).toBe(scenario.expectedStatus);
      expect(result.selectedCandidateId, scenario.id).toBe(scenario.expectedId);
    }
  });

  it("requires human review for everything except a strong-signal MATCHED result", () => {
    for (const scenario of scenarios) {
      const target = NetworkResolutionTargetSchema.parse(scenario.target);
      const candidates = scenario.candidates.map((c) => NetworkResolutionCandidateSchema.parse(c));
      const result = resolveNetworkEntity(target, candidates);
      if (result.status !== "MATCHED") expect(result.requiresHumanReview, scenario.id).toBe(true);
    }
  });

  it("explains every score with named signals", () => {
    const result = resolveNetworkEntity(
      { name: "Oceans Behavioral Hospital Lafayette", city: "Lafayette", state: "LA" },
      [{ id: "a", name: "Oceans Behavioral Hospital Lafayette", city: "Lafayette", state: "LA", status: "ACTIVE" }],
    );
    expect(result.candidates[0]!.signals.map((s) => s.signal)).toContain("name_or_alias");
  });
});

describe("network freshness", () => {
  it("classifies verification age into the five freshness states", () => {
    expect(networkFreshnessState("2026-07-19T00:00:00.000Z", "2026-07-01T00:00:00.000Z", 30)).toBe("CURRENT");
    expect(networkFreshnessState("2026-07-19T00:00:00.000Z", "2026-06-20T00:00:00.000Z", 30)).toBe("DUE_SOON");
    expect(networkFreshnessState("2026-07-19T00:00:00.000Z", "2026-06-01T00:00:00.000Z", 30)).toBe("STALE");
    expect(networkFreshnessState("2026-07-19T00:00:00.000Z", "2026-04-01T00:00:00.000Z", 30)).toBe("EXPIRED");
    expect(networkFreshnessState("2026-07-19T00:00:00.000Z", null, 30)).toBe("UNKNOWN");
    expect(networkFreshnessState("2026-07-19T00:00:00.000Z", "2026-08-01T00:00:00.000Z", 30)).toBe("UNKNOWN");
  });

  it("derives the next review date in UTC", () => {
    expect(networkNextReviewAt("2026-07-19T00:00:00.000Z", 30)).toBe("2026-08-18T00:00:00.000Z");
    expect(networkNextReviewAt("2026-07-19T00:00:00.000Z", 0)).toBeNull();
  });
});

describe("network conflict detection", () => {
  it("preserves conflicting candidate values instead of collapsing them", () => {
    const conflicts = detectNetworkFieldConflicts([
      candidateField({ candidateId: "a", proposedValue: "3375550100", normalizedValue: "3375550100" }),
      candidateField({ candidateId: "b", proposedValue: "3375559999", normalizedValue: "3375559999" }),
    ]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]!.candidateIds).toEqual(["a", "b"]);
    expect(conflicts[0]!.fieldPath).toBe("contactPoints.admissions.phone");
  });

  it("does not report a conflict for agreeing values with different formatting", () => {
    const conflicts = detectNetworkFieldConflicts([
      candidateField({ candidateId: "a", normalizedValue: "unit  a" }),
      candidateField({ candidateId: "b", normalizedValue: "Unit A" }),
    ]);
    expect(conflicts).toHaveLength(0);
  });
});

describe("network review-routing policy", () => {
  it("routes sensitive admission, transport, payer, and license fields to specialized review", () => {
    expect(requiredNetworkReviewerRoles("facilityAdmissionProfiles.labRequirements.cbc")).toEqual([
      "FACILITY_CLINICAL_GOVERNANCE",
    ]);
    expect(requiredNetworkReviewerRoles("facilityAdmissionProfiles.legalStatuses")).toEqual([
      "FACILITY_LEGAL_COMPLIANCE",
    ]);
    expect(networkReviewRequirement("facilityAdmissionProfiles.acceptanceAuthority.role")).toEqual({
      roles: ["FACILITY_CLINICAL_GOVERNANCE", "FACILITY_LEGAL_COMPLIANCE"],
      mode: "ALL_DISTINCT",
    });
    expect(networkReviewRequirement("transportCapabilityProfiles.securedTransport").mode).toBe("ALL_DISTINCT");
    expect(requiredNetworkReviewerRoles("payerParticipation.medicaid")).toEqual(["PAYER_BENEFITS_REVIEWER"]);
    expect(requiredNetworkReviewerRoles("organization.license.number")).toEqual(["COMPLIANCE_REVIEWER"]);
    expect(requiredNetworkReviewerRoles("locations.main.address")).toEqual(["NETWORK_REVIEWER"]);
  });

  it("payer review routing is independent of clinical admission review routing", () => {
    const payer = networkReviewRequirement("payerParticipation.medicaid");
    const clinical = networkReviewRequirement("facilityAdmissionProfiles.inclusionCriteria");
    expect(payer.roles).not.toContain("FACILITY_CLINICAL_GOVERNANCE");
    expect(clinical.roles).not.toContain("PAYER_BENEFITS_REVIEWER");
  });

  it("never allows an agent to replace a human-confirmed value", () => {
    expect(canAgentReplaceNetworkField("HUMAN_CONFIRMED")).toBe(false);
    expect(canAgentReplaceNetworkField("STALE")).toBe(true);
    expect(canAgentReplaceNetworkField("CANDIDATE")).toBe(true);
  });

  it("rejects agent-produced HUMAN_CONFIRMED candidates", () => {
    const errors = enforceNetworkCandidatePolicy(candidateField({ reviewState: "HUMAN_CONFIRMED" }));
    expect(errors.some((e) => e.includes("cannot create HUMAN_CONFIRMED"))).toBe(true);
  });

  it("keeps sensitive fields REQUIRES_REVIEW until an authorized human decision", () => {
    const errors = enforceNetworkCandidatePolicy(
      candidateField({
        fieldPath: "facilityAdmissionProfiles.exclusionCriteria",
        operationalUseStatus: "APPROVED_OPERATIONAL",
        proposedReviewerRoles: ["FACILITY_CLINICAL_GOVERNANCE"],
      }),
    );
    expect(errors.some((e) => e.includes("REQUIRES_REVIEW"))).toBe(true);
  });

  it("keeps the proposed reviewer vocabulary distinct from the schema UserRole enum", () => {
    const overlap = NETWORK_REVIEWER_ROLES.filter((role) =>
      (USER_ROLES as readonly string[]).includes(role),
    );
    // COMPLIANCE_REVIEWER is the only name shared with UserRole today; the
    // mapping decision is open and nothing authorizes against these values.
    expect(overlap).toEqual(["COMPLIANCE_REVIEWER"]);
  });
});

describe("network source authority", () => {
  it("blocks discovery-only sources from supporting any populated field", () => {
    expect(networkSourceCanSupportField("DISCOVERY_ONLY", "contactPoints.general.phone")).toBe(false);
    expect(networkSourceCanSupportField("DISCOVERY_ONLY", "locations.main.address")).toBe(false);
  });

  it("tightens allowed source tiers for operational use", () => {
    expect(networkSourceCanSupportField("COMMERCIAL_DIRECTORY", "contactPoints.general.phone")).toBe(true);
    expect(networkSourceCanSupportField("COMMERCIAL_DIRECTORY", "contactPoints.general.phone", true)).toBe(false);
    expect(networkSourceCanSupportField("REPUTABLE_SECONDARY", "payerParticipation.medicaid")).toBe(true);
    expect(networkSourceCanSupportField("REPUTABLE_SECONDARY", "payerParticipation.medicaid", true)).toBe(false);
  });
});

describe("network candidate-package validation", () => {
  it("accepts the shipped synthetic example package end to end", () => {
    const raw = loadJson<unknown>("network-enrichment-valid-candidate-package.json");
    const parsed = NetworkEnrichmentPackageSchema.parse(raw);
    expect(validateNetworkEnrichmentPackage(parsed)).toEqual([]);
  });

  it("rejects the string Unknown in place of null", () => {
    const errors = validateNetworkEnrichmentPackage(
      enrichmentPackage({ candidates: [candidateField({ proposedValue: "Unknown", normalizedValue: "Unknown" })] }),
    );
    expect(errors.some((e) => e.includes("use null"))).toBe(true);
  });

  it("requires at least one supporting evidence item per candidate field", () => {
    const errors = validateNetworkEnrichmentPackage(
      enrichmentPackage({ candidates: [candidateField({ evidenceIds: [] })] }),
    );
    expect(errors.some((e) => e.includes("at least one evidenceId"))).toBe(true);
  });

  it("rejects candidates citing evidence that does not support the field path", () => {
    const pkg = enrichmentPackage();
    pkg.candidates = [candidateField({ fieldPath: "contactPoints.general.phone" })];
    pkg.evidence[0]!.supportsFields = ["contactPoints.admissions.phone"];
    const errors = validateNetworkEnrichmentPackage(pkg);
    expect(errors.some((e) => e.includes("does not support"))).toBe(true);
  });

  it("rejects discovery-only evidence as support for a populated field", () => {
    const pkg = enrichmentPackage();
    pkg.evidence[0]!.sourceType = "DISCOVERY_ONLY";
    pkg.evidence[0]!.sourceTier = 10;
    const errors = validateNetworkEnrichmentPackage(pkg);
    expect(errors.some((e) => e.includes("cannot support"))).toBe(true);
  });

  it("rejects mismatched source tiers and non-canonical timestamps", () => {
    const pkg = enrichmentPackage();
    pkg.evidence[0]!.sourceTier = 5;
    pkg.candidates[0]!.nextReviewAt = "2026-07-19T00:00:00+02:00";
    const errors = validateNetworkEnrichmentPackage(pkg);
    expect(errors.some((e) => e.includes("sourceTier does not match"))).toBe(true);
    expect(errors.some((e) => e.includes("invalid ISO timestamp"))).toBe(true);
  });

  it("rejects an agent package carrying HUMAN_CONFIRMED state", () => {
    const errors = validateNetworkEnrichmentPackage(
      enrichmentPackage({ candidates: [candidateField({ reviewState: "HUMAN_CONFIRMED" })] }),
    );
    expect(errors.some((e) => e.includes("cannot create HUMAN_CONFIRMED"))).toBe(true);
  });

  it("strict schema rejects unknown envelope fields", () => {
    const raw = { ...enrichmentPackage(), extra: true } as unknown;
    expect(NetworkEnrichmentPackageSchema.safeParse(raw).success).toBe(false);
  });
});

describe("network outbound URL safety validator", () => {
  it("blocks private, loopback, credentialed, and non-allowlisted URLs", () => {
    expect(validateNetworkOutboundUrl("http://127.0.0.1/admin").length).toBeGreaterThanOrEqual(1);
    expect(validateNetworkOutboundUrl("https://10.0.0.8/x").length).toBeGreaterThanOrEqual(1);
    expect(validateNetworkOutboundUrl("https://user:pw@example.org/").length).toBeGreaterThanOrEqual(1);
    expect(
      validateNetworkOutboundUrl("https://example.org", { allowedDomainSuffixes: ["cms.gov"] }).some((e) =>
        e.includes("allowlisted"),
      ),
    ).toBe(true);
    expect(validateNetworkOutboundUrl("https://data.cms.gov/path", { allowedDomainSuffixes: ["cms.gov"] })).toEqual([]);
  });
});

describe("network accuracy metrics", () => {
  it("calculates deterministic evaluation metrics", () => {
    const metrics = calculateNetworkAccuracyMetrics([
      {
        expectedMatchId: "a",
        predictedMatchId: "a",
        expectedConflict: true,
        predictedConflict: true,
        expectedStale: true,
        predictedStale: true,
        totalCandidateFields: 2,
        supportedCandidateFields: 2,
        acceptedUnsupportedFields: 0,
        authoritativeEvidenceCount: 2,
        evidenceCount: 2,
        requiredHumanReview: true,
      },
      {
        expectedMatchId: null,
        predictedMatchId: null,
        expectedConflict: false,
        predictedConflict: false,
        expectedStale: false,
        predictedStale: false,
        totalCandidateFields: 1,
        supportedCandidateFields: 1,
        acceptedUnsupportedFields: 0,
        authoritativeEvidenceCount: 1,
        evidenceCount: 1,
        requiredHumanReview: false,
      },
    ]);
    expect(metrics.entityPrecision).toBe(1);
    expect(metrics.entityRecall).toBe(1);
    expect(metrics.evidenceCoverageRate).toBe(1);
    expect(metrics.conflictDetectionRate).toBe(1);
    expect(metrics.humanReviewEscalationRate).toBe(0.5);
  });
});
