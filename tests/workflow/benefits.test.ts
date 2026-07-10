import { describe, expect, it } from "vitest";
import {
  BENEFIT_DISCLAIMER,
  BenefitQuoteSchema,
  presentBenefitQuote,
  canUseExtractedInsurance,
  canStartEligibilityVerification,
  canTransitionEligibility,
} from "@clarity/domain-contracts";

const validQuote = {
  serviceType: "INPATIENT_PSYCHIATRIC",
  networkStatus: "IN_NETWORK" as const,
  deductibleAmountCents: 200000,
  coinsurancePercent: 20,
  authorizationRequired: true,
  quotedAt: "2026-07-10T15:12:00-05:00",
  verificationReference: "SYN-BEN-001",
  disclaimerStatus: "PROVIDED" as const,
};

describe("insurance extraction review requirement", () => {
  it("blocks unreviewed extracted fields", () => {
    expect(canUseExtractedInsurance({ reviewStatus: "PENDING_REVIEW" })).toBe(false);
    expect(canUseExtractedInsurance({ reviewStatus: "REJECTED", reviewedBy: "u1" })).toBe(false);
  });
  it("requires an identified human approver", () => {
    expect(canUseExtractedInsurance({ reviewStatus: "APPROVED" })).toBe(false);
    expect(canUseExtractedInsurance({ reviewStatus: "APPROVED", reviewedBy: "u1" })).toBe(true);
  });
});

describe("subscriber relationship requirement", () => {
  it("blocks eligibility verification with unknown or missing relationship", () => {
    expect(canStartEligibilityVerification(undefined)).toBe(false);
    expect(canStartEligibilityVerification("UNKNOWN")).toBe(false);
    expect(canStartEligibilityVerification("SPOUSE")).toBe(true);
  });
});

describe("eligibility status changes", () => {
  it("permits verification outcomes and re-verification", () => {
    expect(canTransitionEligibility("PENDING", "ACTIVE_CONFIRMED")).toBe(true);
    expect(canTransitionEligibility("ACTIVE_CONFIRMED", "INACTIVE")).toBe(true);
    expect(canTransitionEligibility("FAILED", "PENDING")).toBe(true);
  });
  it("rejects impossible jumps", () => {
    expect(canTransitionEligibility("FAILED", "ACTIVE_CONFIRMED")).toBe(false);
    expect(canTransitionEligibility("ACTIVE_CONFIRMED", "PENDING")).toBe(false);
  });
});

describe("benefits disclaimer enforcement", () => {
  it("rejects a quote recorded without the disclaimer", () => {
    const result = BenefitQuoteSchema.safeParse({ ...validQuote, disclaimerStatus: "NOT_PROVIDED" });
    expect(result.success).toBe(false);
  });
  it("presents quotes with the not-a-payment-guarantee disclaimer structurally attached", () => {
    const presented = presentBenefitQuote(validQuote);
    expect(presented.disclaimer).toBe(BENEFIT_DISCLAIMER);
    expect(presented.disclaimer).toMatch(/not a guarantee of payment/);
  });
});
