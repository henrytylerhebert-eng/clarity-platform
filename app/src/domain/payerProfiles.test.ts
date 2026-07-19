import { describe, expect, it } from "vitest";
import { deriveCoverage } from "./services";
import {
  getOperationsPayerProfile,
  OPERATIONS_PAYER_CONFIGURATION_PROFILES,
} from "./payerProfiles";

describe("operations payer configuration profiles", () => {
  it("exposes the four requested profile families with an explicit review gate", () => {
    expect(OPERATIONS_PAYER_CONFIGURATION_PROFILES.map((profile) => profile.id)).toEqual([
      "medicare",
      "medicaid",
      "va",
      "commercial",
    ]);
    for (const profile of OPERATIONS_PAYER_CONFIGURATION_PROFILES) {
      expect(profile.version).toBe("operations-poc-v1");
      expect(profile.reviewStatus).toBe("Pending domain-owner review");
      expect(profile.verificationPrompts.length).toBeGreaterThan(0);
    }
  });

  it("keeps VA local until the shared persistence enum has an approved category", () => {
    expect(getOperationsPayerProfile("va").coverageTypes).toEqual(["OTHER"]);
  });

  it("attaches a profile to payer-backed synthetic coverage without turning it into verification", () => {
    const profileIds = new Set<string>();
    for (let index = 0; index < 100; index += 1) {
      const coverage = deriveCoverage(`profile-case-${index}`);
      if (coverage.payerProfileId) {
        profileIds.add(coverage.payerProfileId);
        expect(coverage.payerProfileVersion).toBe("operations-poc-v1");
        expect(coverage.payerProfileReviewStatus).toBe("Pending domain-owner review");
        expect(coverage.payerVerificationPrompts.length).toBeGreaterThan(0);
      }
    }
    expect(profileIds).toEqual(new Set(["medicare", "medicaid", "va", "commercial"]));
  });
});
