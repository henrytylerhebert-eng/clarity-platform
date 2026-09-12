import { describe, expect, it } from "vitest";
import {
  IopPersistedImportRequestSchema,
  iopPermissionsFor,
} from "../../packages/domain-contracts/src/iopPersistence.js";
import type { AuthenticatedPrincipal } from "@clarity/domain-contracts";

const principal = (roles: AuthenticatedPrincipal["roles"]): AuthenticatedPrincipal => ({
  userId: "synthetic-user",
  organizationId: "synthetic-org",
  displayName: "Synthetic user",
  roles,
  sessionId: "synthetic-session",
  expiresAt: new Date("2028-02-08T16:00:00.000Z"),
});

describe("IOP persisted import contract", () => {
  it("uses the approved synthetic permission matrix", () => {
    expect(iopPermissionsFor(principal(["ORGANIZATION_ADMIN"]))).toEqual([
      "view",
      "import",
      "review",
      "close",
    ]);
    expect(iopPermissionsFor(principal(["UTILIZATION_REVIEWER"]))).toEqual([
      "view",
      "review",
    ]);
    expect(iopPermissionsFor(principal(["READ_ONLY_AUDITOR"]))).toEqual([]);
  });

  it("requires a stable source record version, entity coverage, and a cutoff before export", () => {
    const base = {
      facilityId: "facility-synthetic",
      programId: "IOP_PROGRAM_001",
      integrationKey: "SYNTHETIC_IOP_PROGRAM",
      idempotencyKey: "iop-import-key-001",
      source: {
        exportedAt: "2028-02-08T15:00:00.000Z",
        cutoffAt: "2028-02-07T23:59:59.999Z",
      },
      sourceRecords: [{ type: "ENROLLMENT", sourceRecordId: "ENR_001", sourceVersion: "1" }],
      reconciliation: {
        privacy: "SYNTHETIC_ONLY",
        sampleId: "IOP_SAMPLE_001",
        serviceDate: "2028-02-07",
        programId: "IOP_PROGRAM_001",
        enrollments: [
          {
            enrollmentId: "ENR_001",
            personToken: "PERSON_001",
            status: "CLOSED",
            enrolledOn: "2028-02-01",
          },
        ],
        treatmentPlans: [],
        attendanceEvents: [],
        noteAudits: [],
        chargeLines: [],
        emrBillableLines: [],
        exceptionReviews: [],
      },
    };
    expect(IopPersistedImportRequestSchema.parse(base).sourceRecords).toHaveLength(1);
    expect(() =>
      IopPersistedImportRequestSchema.parse({
        ...base,
        source: { ...base.source, cutoffAt: "2028-02-09T00:00:00.000Z" },
      }),
    ).toThrow("Source cutoff cannot be after export time");
    expect(() =>
      IopPersistedImportRequestSchema.parse({
        ...base,
        sourceRecords: [{ type: "ENROLLMENT", sourceRecordId: "ENR_OTHER", sourceVersion: "1" }],
      }),
    ).toThrow("Missing stable ENROLLMENT source record for ENR_001");
  });
});
