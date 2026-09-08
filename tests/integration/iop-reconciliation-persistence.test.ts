import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AuthenticatedPrincipal } from "@clarity/domain-contracts";
import { PrismaIopReconciliationGateway } from "../../packages/case-repository/src/iopReconciliationGateway.js";
import { createHarness, type Harness } from "./helpers/harness.js";

let h: Harness;
let gateway: PrismaIopReconciliationGateway;
let facilityId: string;
const principal = (organizationId: string, userId: string, roles: AuthenticatedPrincipal["roles"]): AuthenticatedPrincipal => ({
  organizationId, userId, roles, displayName: "Synthetic IOP reviewer", sessionId: "synthetic-session", expiresAt: new Date("2028-02-09T00:00:00.000Z"),
});
const reconciliation = {
  privacy: "SYNTHETIC_ONLY" as const, sampleId: "IOP_SAMPLE_001", serviceDate: "2028-02-07", programId: "IOP_PROGRAM_001",
  enrollments: [{ enrollmentId: "ENR_001", personToken: "PERSON_001", status: "CLOSED" as const, enrolledOn: "2028-02-01" }],
  treatmentPlans: [], attendanceEvents: [], noteAudits: [], chargeLines: [], emrBillableLines: [], exceptionReviews: [],
};
const request = (idempotencyKey: string) => ({
  facilityId, programId: "IOP_PROGRAM_001", integrationKey: "SYNTHETIC_IOP_PROGRAM", idempotencyKey,
  source: { fileName: "synthetic-iop.json", exportedAt: "2028-02-08T15:00:00.000Z", cutoffAt: "2028-02-07T23:59:59.999Z" },
  sourceRecords: [{ type: "ENROLLMENT" as const, sourceRecordId: "ENR_001", sourceVersion: "1" }], reconciliation,
});

beforeAll(async () => {
  h = await createHarness();
  facilityId = `synthetic-iop-facility-${h.runId}`;
  await h.prisma.facilityProfile.create({ data: { id: facilityId, organizationId: h.tenantA.organizationId, name: "Synthetic IOP Facility" } });
  await h.prisma.iopSourceIntegration.create({ data: { organizationId: h.tenantA.organizationId, integrationKey: "SYNTHETIC_IOP_PROGRAM", label: "Synthetic source" } });
  gateway = new PrismaIopReconciliationGateway(h.prisma);
});
afterAll(async () => h.dispose());

describe("IOP reconciliation persistence", () => {
  it("persists an import once, replays the same request, and records the authenticated closer", async () => {
    const actor = principal(h.tenantA.organizationId, h.tenantA.userId, ["ORGANIZATION_ADMIN"]);
    const first = await gateway.import(actor, request("iop-import-key-001"));
    const replay = await gateway.import(actor, request("iop-import-key-001"));
    expect(first.replayed).toBe(false);
    expect(replay).toMatchObject({ replayed: true, import: { id: first.import.id } });

    const close = await gateway.close(actor, first.import.id, { expectedRevision: 1, idempotencyKey: "iop-close-key-001", reason: "Synthetic reviewer close." });
    expect(close).toMatchObject({ replayed: false, receipt: { reviewerId: h.tenantA.userId, sourceCutoffAt: new Date("2028-02-07T23:59:59.999Z") } });
  });

  it("requires an authenticated exception review before closing an unmatched event", async () => {
    const actor = principal(h.tenantA.organizationId, h.tenantA.userId, ["ORGANIZATION_ADMIN"]);
    const withGap = {
      ...request("iop-import-key-004"),
      reconciliation: {
        ...reconciliation,
        attendanceEvents: [{ attendanceId: "ATT_001", enrollmentId: "ENR_001", groupType: "Group therapy", outcome: "ATTENDED" as const }],
      },
      sourceRecords: [
        { type: "ENROLLMENT" as const, sourceRecordId: "ENR_001", sourceVersion: "1" },
        { type: "ATTENDANCE" as const, sourceRecordId: "ATT_001", sourceVersion: "1" },
      ],
    };
    const imported = await gateway.import(actor, withGap);
    await expect(gateway.close(actor, imported.import.id, { expectedRevision: 1, idempotencyKey: "iop-close-key-004", reason: "Premature close." }))
      .rejects.toMatchObject({ code: "unreviewed_exceptions", status: 400 });
    const planReview = await gateway.review(actor, imported.import.id, "attendance:ATT_001:attendance_plan_mismatch", {
      expectedRevision: 1,
      idempotencyKey: "iop-review-key-004a",
      disposition: "ACCEPTED_EXCEPTION",
      reason: "Synthetic plan linkage variance reviewed.",
    });
    await gateway.review(actor, imported.import.id, "attendance:ATT_001:note_audit_missing", {
      expectedRevision: 1,
      idempotencyKey: "iop-review-key-004b",
      disposition: "ACCEPTED_EXCEPTION",
      reason: "Synthetic documentation variance reviewed.",
    });
    await gateway.review(actor, imported.import.id, "attendance:ATT_001:charge_missing", {
      expectedRevision: 1,
      idempotencyKey: "iop-review-key-004c",
      disposition: "ACCEPTED_EXCEPTION",
      reason: "Synthetic charge variance reviewed.",
    });
    expect(planReview.review.reviewerId).toBe(h.tenantA.userId);
    const close = await gateway.close(actor, imported.import.id, { expectedRevision: 1, idempotencyKey: "iop-close-key-005", reason: "All synthetic exceptions reviewed." });
    expect(close.receipt.reviewedCount).toBe(3);
  });

  it("denies underprivileged callers and makes cross-tenant imports non-revealing", async () => {
    const auditor = principal(h.tenantA.organizationId, h.tenantA.userId, ["READ_ONLY_AUDITOR"]);
    await expect(gateway.import(auditor, request("iop-import-key-002"))).rejects.toMatchObject({ code: "permission_denied", status: 403 });
    const foreign = principal(h.tenantB.organizationId, h.tenantB.userId, ["ORGANIZATION_ADMIN"]);
    await expect(gateway.import(foreign, request("iop-import-key-003"))).rejects.toMatchObject({ code: "resource_not_found", status: 404 });
  });
});
