import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { loadSyntheticCases, defaultFeatureFlags, FEATURE_FLAGS } from "@clarity/domain-contracts";

const FIXTURE_DIR = join(process.cwd(), "data", "synthetic-cases");

describe("synthetic seed loading", () => {
  it("loads and validates every fixture as explicitly synthetic", () => {
    const cases = loadSyntheticCases(FIXTURE_DIR);
    expect(cases.length).toBeGreaterThanOrEqual(3);
    for (const c of cases) {
      expect(c.caseKey).toMatch(/^synthetic-/);
      expect(c.patientToken.privacyFlags).toContain("SYNTHETIC_ONLY");
      expect(c.patientToken.externalPatientReference).toMatch(/^SYN-/);
    }
  });

  it("fixtures contain no realistic member or Medicare identifiers", () => {
    const cases = loadSyntheticCases(FIXTURE_DIR);
    const text = JSON.stringify(cases);
    // Medicare Beneficiary Identifier shape: 1AA1AA1AA11 (e.g. 1EG4-TE5-MK73 without dashes)
    expect(text).not.toMatch(/\b\d[A-Z]{2}\d[A-Z]{2}\d[A-Z]{2}\d{2}\b/);
    // SSN shape
    expect(text).not.toMatch(/\b\d{3}-\d{2}-\d{4}\b/);
  });
});

describe("feature flags", () => {
  it("ships all six payer-stack flags dark by default", () => {
    const flags = defaultFeatureFlags();
    expect(FEATURE_FLAGS).toHaveLength(6);
    for (const f of FEATURE_FLAGS) expect(flags[f]).toBe(false);
  });
});
