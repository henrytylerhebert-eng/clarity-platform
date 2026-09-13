import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AuthenticatedPrincipal } from "@clarity/domain-contracts";
import { PrismaRevOpsRateReleaseGateway } from "../../packages/case-repository/src/revOpsRateReleaseGateway.js";
import { createHarness, type Harness } from "./helpers/harness.js";

let h: Harness;
let gateway: PrismaRevOpsRateReleaseGateway;

const principal = (organizationId: string, userId: string, roles: AuthenticatedPrincipal["roles"]): AuthenticatedPrincipal => ({
  organizationId, userId, roles, displayName: "Synthetic rate-release actor", sessionId: "synthetic-session", expiresAt: new Date("2028-02-09T00:00:00.000Z"),
});

const request = (releaseId: string, overrides: Partial<Record<string, unknown>> = {}) => ({
  programMethod: "LA_MEDICAID_INPATIENT_PER_DIEM" as const,
  releaseId,
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
  ...overrides,
});

// RevOpsRateRelease deliberately has no organizationId (ADR-0021), so the
// harness's tenant-scoped dispose() cannot reach these rows. Every releaseId
// this file creates is listed here and deleted explicitly.
const RELEASE_IDS = [
  "LA-IP-TEST-DENY-001",
  "LA-IP-TEST-SUPERSEDE-001",
  "LA-IP-TEST-SUPERSEDE-002",
  "LA-IP-TEST-BADSUPERSEDE-001",
  "LA-IP-TEST-CHAIN-001",
  "LA-IP-TEST-CHAIN-002",
  "LA-IP-TEST-CHAIN-003",
];

beforeAll(async () => {
  h = await createHarness();
  gateway = new PrismaRevOpsRateReleaseGateway(h.prisma);
});
afterAll(async () => {
  await h.prisma.revOpsRateRelease.deleteMany({ where: { releaseId: { in: RELEASE_IDS } } });
  await h.dispose();
});

describe("RevOps rate-release registry (ADR-0021)", () => {
  it("denies a non-admin recording a release, but lets any authenticated principal read one", async () => {
    const nonAdmin = principal(h.tenantA.organizationId, h.tenantA.userId, ["READ_ONLY_AUDITOR"]);
    await expect(gateway.record(nonAdmin, request("LA-IP-TEST-DENY-001"))).rejects.toMatchObject({ code: "permission_denied", status: 403 });

    const admin = principal(h.tenantA.organizationId, h.tenantA.userId, ["ORGANIZATION_ADMIN"]);
    const created = await gateway.record(admin, request("LA-IP-TEST-DENY-001"));
    expect(created.status).toBe("ACTIVE");

    // No tenant predicate on read, by design (ADR-0021): a different org's
    // non-admin principal can still see this public reference release.
    const foreignReader = principal(h.tenantB.organizationId, h.tenantB.userId, ["READ_ONLY_AUDITOR"]);
    const list = await gateway.list(foreignReader, "LA_MEDICAID_INPATIENT_PER_DIEM", false);
    expect(list.some((r) => r.releaseId === "LA-IP-TEST-DENY-001")).toBe(true);
  });

  it("rejects a duplicate releaseId outright, and never mutates a superseded release's content", async () => {
    const admin = principal(h.tenantA.organizationId, h.tenantA.userId, ["ORGANIZATION_ADMIN"]);
    const original = await gateway.record(admin, request("LA-IP-TEST-SUPERSEDE-001"));

    await expect(gateway.record(admin, request("LA-IP-TEST-SUPERSEDE-001"))).rejects.toMatchObject({ code: "release_id_already_recorded", status: 409 });

    const corrected = await gateway.record(admin, request("LA-IP-TEST-SUPERSEDE-002", {
      supersedesReleaseId: "LA-IP-TEST-SUPERSEDE-001",
      sha256: "b".repeat(64),
    }));
    expect(corrected.status).toBe("ACTIVE");

    const list = await gateway.list(admin, "LA_MEDICAID_INPATIENT_PER_DIEM", true);
    const replaced = list.find((r) => r.releaseId === "LA-IP-TEST-SUPERSEDE-001")!;
    expect(replaced.status).toBe("SUPERSEDED");
    expect(replaced.supersededById).toBe(corrected.id);
    // The content fields on the replaced row are exactly what was originally recorded.
    expect(replaced.sha256).toBe(original.sha256);
    expect(replaced.payload).toEqual(original.payload);

    const activeOnly = await gateway.list(admin, "LA_MEDICAID_INPATIENT_PER_DIEM", false);
    expect(activeOnly.some((r) => r.releaseId === "LA-IP-TEST-SUPERSEDE-001")).toBe(false);
    expect(activeOnly.some((r) => r.releaseId === "LA-IP-TEST-SUPERSEDE-002")).toBe(true);
  });

  it("rejects superseding a release that does not exist, is already superseded, or belongs to a different program method", async () => {
    const admin = principal(h.tenantA.organizationId, h.tenantA.userId, ["ORGANIZATION_ADMIN"]);
    await expect(gateway.record(admin, request("LA-IP-TEST-BADSUPERSEDE-001", { supersedesReleaseId: "LA-IP-DOES-NOT-EXIST" })))
      .rejects.toMatchObject({ code: "superseded_release_not_found", status: 404 });

    await gateway.record(admin, request("LA-IP-TEST-CHAIN-001"));
    await gateway.record(admin, request("LA-IP-TEST-CHAIN-002", { supersedesReleaseId: "LA-IP-TEST-CHAIN-001" }));
    await expect(gateway.record(admin, request("LA-IP-TEST-CHAIN-003", { supersedesReleaseId: "LA-IP-TEST-CHAIN-001" })))
      .rejects.toMatchObject({ code: "superseded_release_not_active", status: 409 });
  });
});
