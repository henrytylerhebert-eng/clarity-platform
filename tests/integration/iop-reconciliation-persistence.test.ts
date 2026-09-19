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
  await h.prisma.iopSourceIntegration.create({ data: { organizationId: h.tenantA.organizationId, integrationKey: "SYNTHETIC_IOP_PROGRAM", programId: "IOP_PROGRAM_001", label: "Synthetic source" } });
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
    await expect(gateway.review(actor, imported.import.id, "attendance:ATT_001:charge_missing", {
      expectedRevision: 1,
      idempotencyKey: "iop-review-key-004d",
      disposition: "ACCEPTED_EXCEPTION",
      reason: "Post-close review must be rejected.",
    })).rejects.toMatchObject({ code: "reconciliation_already_closed", status: 409 });
  });

  it("denies underprivileged callers and makes cross-tenant imports non-revealing", async () => {
    const auditor = principal(h.tenantA.organizationId, h.tenantA.userId, ["READ_ONLY_AUDITOR"]);
    await expect(gateway.import(auditor, request("iop-import-key-002"))).rejects.toMatchObject({ code: "permission_denied", status: 403 });
    const foreign = principal(h.tenantB.organizationId, h.tenantB.userId, ["ORGANIZATION_ADMIN"]);
    await expect(gateway.import(foreign, request("iop-import-key-003"))).rejects.toMatchObject({ code: "resource_not_found", status: 404 });
  });

  it("retains a distinct source-backed self-audit as an exception and restricts the reviewer to review", async () => {
    const admin = principal(h.tenantA.organizationId, h.tenantA.userId, ["ORGANIZATION_ADMIN"]);
    const reviewer = principal(h.tenantA.organizationId, h.tenantA.userId, ["COMPLIANCE_REVIEWER"]);
    const selfAudited = {
      ...request("iop-import-key-007"),
      reconciliation: {
        ...reconciliation,
        enrollments: [{ enrollmentId: "ENR_001", personToken: "PERSON_001", status: "ACTIVE" as const, enrolledOn: "2028-02-01" }],
        treatmentPlans: [{ planId: "PLAN_001", enrollmentId: "ENR_001", version: "1.0.0", effectiveFrom: "2028-02-01", prescribedDaysPerWeek: 3, status: "ACTIVE" as const }],
        attendanceEvents: [{ attendanceId: "ATT_001", enrollmentId: "ENR_001", planId: "PLAN_001", groupType: "Group therapy", outcome: "ATTENDED" as const }],
        noteAudits: [{ attendanceId: "ATT_001", noteId: "NOTE_001", auditId: "AUDIT_001", authoredBy: "THERAPIST_001", auditStatus: "COMPLETE" as const, reviewedBy: "THERAPIST_001", reviewedAt: "2028-02-08T12:00:00.000Z" }],
        chargeLines: [{ chargeLineId: "CHARGE_001", attendanceId: "ATT_001", noteId: "NOTE_001", units: 1, status: "CREATED" as const }],
        emrBillableLines: [{ billableLineId: "BILLABLE_001", chargeLineId: "CHARGE_001", status: "POSTED" as const }],
      },
      sourceRecords: [
        { type: "ENROLLMENT" as const, sourceRecordId: "ENR_001", sourceVersion: "1" },
        { type: "TREATMENT_PLAN" as const, sourceRecordId: "PLAN_001", sourceVersion: "1" },
        { type: "ATTENDANCE" as const, sourceRecordId: "ATT_001", sourceVersion: "1" },
        { type: "NOTE_AUDIT" as const, sourceRecordId: "AUDIT_001", sourceVersion: "1" },
        { type: "CHARGE_LINE" as const, sourceRecordId: "CHARGE_001", sourceVersion: "1" },
        { type: "EMR_BILLABLE_LINE" as const, sourceRecordId: "BILLABLE_001", sourceVersion: "1" },
      ],
    };
    await expect(gateway.import(reviewer, selfAudited)).rejects.toMatchObject({ code: "permission_denied", status: 403 });
    const imported = await gateway.import(admin, selfAudited);
    const stored = await gateway.get(admin, imported.import.id);
    expect(stored.payload).toMatchObject({ reconciliation: { noteAudits: [{ noteId: "NOTE_001", auditId: "AUDIT_001", authoredBy: "THERAPIST_001", reviewedBy: "THERAPIST_001" }] } });
    await expect(gateway.close(admin, imported.import.id, { expectedRevision: 1, idempotencyKey: "iop-close-key-007", reason: "Self-audit must remain unresolved." }))
      .rejects.toMatchObject({ code: "unreviewed_exceptions", status: 400 });
    await gateway.review(reviewer, imported.import.id, "attendance:ATT_001:note_audit_not_independent", {
      expectedRevision: 1, idempotencyKey: "iop-review-key-007", disposition: "ACCEPTED_EXCEPTION", reason: "Independent audit exception reviewed by compliance.",
    });
    await expect(gateway.close(reviewer, imported.import.id, { expectedRevision: 1, idempotencyKey: "iop-close-key-008", reason: "Reviewer cannot close." }))
      .rejects.toMatchObject({ code: "permission_denied", status: 403 });
    const closed = await gateway.close(admin, imported.import.id, { expectedRevision: 1, idempotencyKey: "iop-close-key-009", reason: "Independent-audit exception reviewed." });
    expect(closed.receipt).toMatchObject({ reviewerId: h.tenantA.userId, sourceCutoffAt: new Date("2028-02-07T23:59:59.999Z"), issueCount: 1, reviewedCount: 1 });
  });

  it("denies an import whose program is not bound to the authenticated tenant integration", async () => {
    const actor = principal(h.tenantA.organizationId, h.tenantA.userId, ["ORGANIZATION_ADMIN"]);
    const wrongProgram = { ...request("iop-import-key-006"), programId: "IOP_PROGRAM_OTHER", reconciliation: { ...reconciliation, programId: "IOP_PROGRAM_OTHER" } };
    await expect(gateway.import(actor, wrongProgram)).rejects.toMatchObject({ code: "resource_not_found", status: 404 });
  });
});
