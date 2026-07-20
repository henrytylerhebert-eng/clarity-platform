import { describe, expect, it } from "vitest";
import type { NetworkReviewAuditEvent, NetworkReviewRecord } from "@clarity/domain-contracts";
import { computeAuditStreamHash, NetworkEnrichmentComplianceExporter } from "../src/complianceExporter.js";
import { InMemoryNetworkReviewGateway } from "../src/reviewGateway.js";

const fixedNow = () => "2026-07-20T12:00:00.000Z";

describe("NetworkEnrichmentComplianceExporter", () => {
  it("computes deterministic SHA-256 hash over canonical audit stream", () => {
    const events: NetworkReviewAuditEvent[] = [
      {
        action: "SUBMIT_FOR_REVIEW",
        actorId: "actor-1",
        actorType: "USER",
        commandId: "cmd-1",
        correlationId: "corr-1",
        reason: "Initial scan",
        occurredAt: "2026-07-20T10:00:00.000Z",
      },
      {
        action: "APPROVE_REVIEW",
        actorId: "actor-2",
        actorType: "USER",
        commandId: "cmd-2",
        correlationId: "corr-2",
        reason: "Approved by governance",
        occurredAt: "2026-07-20T11:00:00.000Z",
      },
    ];

    const hash1 = computeAuditStreamHash("org-1", "pkg-1", events);
    const hash2 = computeAuditStreamHash("org-1", "pkg-1", [...events].reverse());

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2); // Order-independent due to internal sorting by timestamp
  });

  it("generates structured compliance export package", async () => {
    const gateway = new InMemoryNetworkReviewGateway();
    const exporter = new NetworkEnrichmentComplianceExporter(gateway, fixedNow);

    const reviewRecord: NetworkReviewRecord = {
      reviewPackageId: "pkg-compliance-1",
      reviewId: "rev-compliance-1",
      organizationId: "org-compliance",
      caseId: "case-compliance-1",
      sourceCandidateId: "cand-compliance-1",
      fieldPath: "facilityProfiles.npi",
      sensitivityCategory: "LEGAL_STATUS_REQUIREMENTS",
      requiredCanonicalRoles: ["LEGAL_REVIEWER"],
      createdByActorId: "actor-submitter",
      currentValue: "1234567890",
      proposedValue: "0987654321",
      sourceReviewerRoles: ["FACILITY_LEGAL_COMPLIANCE"],
      status: "HUMAN_CONFIRMED",
      version: 1,
      createdAt: "2026-07-20T09:00:00.000Z",
      updatedAt: "2026-07-20T10:00:00.000Z",
      audits: [
        {
          action: "SUBMIT_FOR_REVIEW",
          actorId: "actor-submitter",
          actorType: "USER",
          commandId: "cmd-submit",
          correlationId: "corr-submit",
          reason: "NPI discrepancy",
          occurredAt: "2026-07-20T09:00:00.000Z",
        },
        {
          action: "APPROVE_REVIEW",
          actorId: "actor-legal",
          actorType: "USER",
          commandId: "cmd-approve",
          correlationId: "corr-approve",
          reason: "NPI verified against NPPES registry",
          occurredAt: "2026-07-20T10:00:00.000Z",
        },
      ],
    };

    await gateway.saveReview(reviewRecord, {
      packageRecord: {
        reviewPackageId: "pkg-compliance-1",
        organizationId: "org-compliance",
        caseId: "case-compliance-1",
        sourceCandidateId: "cand-compliance-1",
        status: "HUMAN_CONFIRMED",
        version: 1,
        submittedByActorId: "actor-submitter",
        createdAt: "2026-07-20T09:00:00.000Z",
        updatedAt: "2026-07-20T10:00:00.000Z",
      },
    });

    const exportPackage = await exporter.generateExportPackage({
      organizationId: "org-compliance",
      reviewPackageId: "pkg-compliance-1",
      actor: {
        actorId: "auditor-1",
        actorType: "USER",
        roles: ["LEGAL_REVIEWER"],
      },
      includeEvidenceExcerpts: true,
      includeConflictsMatrix: true,
      correlationId: "corr-export-1",
    });

    expect(exportPackage.manifest.organizationId).toBe("org-compliance");
    expect(exportPackage.manifest.reviewPackageId).toBe("pkg-compliance-1");
    expect(exportPackage.manifest.integrityHashAlg).toBe("SHA-256");
    expect(exportPackage.manifest.integrityHash).toHaveLength(64);
    expect(exportPackage.manifest.recordCount).toBe(2);
    expect(exportPackage.packageRecord.status).toBe("HUMAN_CONFIRMED");
    expect(exportPackage.reviews).toHaveLength(1);
    expect(exportPackage.auditTimeline).toHaveLength(2);
  });

  it("throws NOT_FOUND error if package does not exist", async () => {
    const gateway = new InMemoryNetworkReviewGateway();
    const exporter = new NetworkEnrichmentComplianceExporter(gateway, fixedNow);

    await expect(
      exporter.generateExportPackage({
        organizationId: "org-compliance",
        reviewPackageId: "missing-package",
        actor: { actorId: "auditor-1", actorType: "USER", roles: ["LEGAL_REVIEWER"] },
        includeEvidenceExcerpts: true,
        includeConflictsMatrix: true,
        correlationId: "corr-export-missing",
      }),
    ).rejects.toThrow("Review package missing-package not found.");
  });
});
