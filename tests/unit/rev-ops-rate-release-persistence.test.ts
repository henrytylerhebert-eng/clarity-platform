import { describe, expect, it } from "vitest";
import {
  RecordRateReleaseRequestSchema,
  revOpsRateReleasePermissionsFor,
} from "../../packages/domain-contracts/src/revOpsRateReleasePersistence.js";
import type { AuthenticatedPrincipal } from "@clarity/domain-contracts";

const principal = (roles: AuthenticatedPrincipal["roles"]): AuthenticatedPrincipal => ({
  userId: "synthetic-user",
  organizationId: "synthetic-org",
  displayName: "Synthetic user",
  roles,
  sessionId: "synthetic-session",
  expiresAt: new Date("2028-02-08T16:00:00.000Z"),
});

const base = {
  programMethod: "LA_MEDICAID_INPATIENT_PER_DIEM" as const,
  releaseId: "LA-IP-2026-07-01",
  publisher: "Louisiana Department of Health",
  sourceUrl: "https://www.lamedicaid.com/provweb1/fee_schedules/Inpatient_Hospital_Per_Diem_Listing_Current.xlsx",
  sha256: "a".repeat(64),
  retrievedAt: "2026-09-09T12:22:45.404Z",
  effectiveFrom: "2026-07-01",
  effectiveThrough: "2026-12-31",
  sheet: "Current Providers 7.1.2026",
  rows: [
    { providerId: "1234567890", facilityName: "Synthetic Reference Hospital", hospitalType: "Free Standing Psychiatric", rateType: "Free Standing Psychiatric", perDiemCents: 45000, rowEffectiveFrom: "2026-07-01", medicareNumber: null, sourceRow: 12 },
  ],
};

describe("RevOps rate-release registry contract (ADR-0021)", () => {
  it("restricts recording to ORGANIZATION_ADMIN; any authenticated principal can view", () => {
    expect(revOpsRateReleasePermissionsFor(principal(["ORGANIZATION_ADMIN"]))).toEqual(["view", "record"]);
    expect(revOpsRateReleasePermissionsFor(principal(["READ_ONLY_AUDITOR"]))).toEqual(["view"]);
    expect(revOpsRateReleasePermissionsFor(principal(["UTILIZATION_REVIEWER"]))).toEqual(["view"]);
  });

  it("accepts a well-formed release request", () => {
    expect(RecordRateReleaseRequestSchema.parse(base).rows).toHaveLength(1);
  });

  it("rejects an effective interval where the release ends before it starts", () => {
    expect(() =>
      RecordRateReleaseRequestSchema.parse({ ...base, effectiveFrom: "2026-12-31", effectiveThrough: "2026-07-01" }),
    ).toThrow("effectiveFrom must be on or before effectiveThrough");
  });

  it("rejects a malformed checksum rather than silently truncating it", () => {
    expect(() => RecordRateReleaseRequestSchema.parse({ ...base, sha256: "not-a-sha256" })).toThrow();
  });

  it("rejects an unsupported programMethod rather than accepting an arbitrary string", () => {
    expect(() => RecordRateReleaseRequestSchema.parse({ ...base, programMethod: "SOMETHING_ELSE" })).toThrow();
  });

  it("rejects an unknown field on the envelope (strict parsing)", () => {
    expect(() => RecordRateReleaseRequestSchema.parse({ ...base, organizationId: "attacker-supplied" })).toThrow();
  });
});
