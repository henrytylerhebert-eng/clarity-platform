import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  PrismaBenefitsGateway,
  PrismaCaseAuditWriter,
  PrismaCaseRepository,
  PrismaDocumentGateway,
  PrismaEvidenceGateway,
  type CaseAuditWriter,
} from "@clarity/case-repository";
import { DocumentCommandService } from "@clarity/document-service";
import { EvidenceCommandService } from "@clarity/evidence-service";
import {
  BenefitsCommandService,
  CaseNotFoundError,
  CoverageConcurrencyConflictError,
  CoverageNotFoundError,
  CoverageStateError,
  DocumentNotFoundError,
  InsuranceEvidenceRequiredError,
  PermissionDeniedError,
  BENEFITS_AUDIT_ACTIONS,
} from "@clarity/benefits-service";
import type { UserRole } from "@clarity/domain-contracts";
import { createHarness, tickingClock, TEST_ACTOR, type Harness } from "./helpers/harness.js";

/**
 * Manual insurance/benefits verification (ADR-0009). Entirely human-performed
 * synthetic workflows against local clarity_dev. Structurally absent
 * everywhere: member IDs, group numbers, policy numbers.
 */

let h: Harness;
let caseRepo: PrismaCaseRepository;
let documents: DocumentCommandService;
let evidence: EvidenceCommandService;
let service: BenefitsCommandService;

type Actor = { actorId: string; actorType: "USER"; roles: UserRole[] };
const intake: Actor = { actorId: "syn-intake", actorType: "USER", roles: ["INTAKE_COORDINATOR"] };
const benefits: Actor = {
  actorId: "syn-benefits",
  actorType: "USER",
  roles: ["BENEFITS_VERIFICATION_SPECIALIST"],
};
const auditor: Actor = { actorId: "syn-auditor", actorType: "USER", roles: ["READ_ONLY_AUDITOR"] };

const bytes = (text: string) => new TextEncoder().encode(text);

/** Case + insurance-card document + APPROVED INSURANCE evidence, in one tenant. */
async function fixture(suffix: string, tenant = h.tenantA) {
  const caseKey = h.caseKey(suffix);
  await caseRepo.create(tenant.organizationId, h.makeCaseData(tenant, suffix), TEST_ACTOR);
  const upload = await documents.uploadDocument({
    organizationId: tenant.organizationId,
    caseId: caseKey,
    actor: intake,
    documentType: "INSURANCE_CARD",
    filename: "insurance-card.png",
    mimeType: "image/png",
    content: bytes(`synthetic card image for ${suffix}`),
  });
  const created = await evidence.createCandidateEvidence({
    organizationId: tenant.organizationId,
    caseId: caseKey,
    documentId: upload.document.documentId,
    actor: benefits,
    category: "INSURANCE",
    originalText: "Card front lists Synthetic Health Plan, PPO, group text redacted in test.",
  });
  await evidence.approveEvidence({
    organizationId: tenant.organizationId,
    caseId: caseKey,
    evidenceId: created.evidence.evidenceId,
    actor: benefits,
  });
  return { caseKey, documentId: upload.document.documentId, evidenceId: created.evidence.evidenceId };
}

function coverageInput(f: { caseKey: string; documentId: string; evidenceId: string }, extra: Record<string, unknown> = {}) {
  return {
    organizationId: h.tenantA.organizationId,
    caseId: f.caseKey,
    actor: benefits,
    coverageOrder: "PRIMARY" as const,
    coverageType: "COMMERCIAL" as const,
    subscriberRelationship: "SELF" as const,
    payerNameRaw: "Synthetic Health Plan",
    insuranceEvidenceIds: [f.evidenceId],
    sourceDocumentIds: [f.documentId],
    ...extra,
  };
}

async function recordActiveCoverage(f: { caseKey: string; documentId: string; evidenceId: string }) {
  const { coverage } = await service.recordInsuranceCoverage(coverageInput(f));
  const verified = await service.verifyEligibility({
    organizationId: h.tenantA.organizationId,
    caseId: f.caseKey,
    coverageId: coverage.coverageId,
    actor: benefits,
    method: "PHONE",
    outcome: "ACTIVE_CONFIRMED",
    referenceNumber: "SYN-REF-1",
    proofDocumentIds: [f.documentId],
  });
  return verified.coverage;
}

beforeAll(async () => {
  h = await createHarness();
  caseRepo = new PrismaCaseRepository(h.prisma, undefined, tickingClock());
  documents = new DocumentCommandService(new PrismaDocumentGateway(h.prisma, undefined, tickingClock()));
  evidence = new EvidenceCommandService(new PrismaEvidenceGateway(h.prisma, undefined, tickingClock()));
  service = new BenefitsCommandService(new PrismaBenefitsGateway(h.prisma, undefined, tickingClock()));
});
afterAll(async () => h?.dispose());

describe("coverage recording", () => {
  it("records UNVERIFIED coverage citing approved insurance evidence and the card document, audited", async () => {
    const f = await fixture("bn-cov");
    const { coverage, replayed } = await service.recordInsuranceCoverage(coverageInput(f));
    expect(replayed).toBe(false);
    expect(coverage.status).toBe("UNVERIFIED");
    expect(coverage.version).toBe(0);
    expect(coverage.coverageOrder).toBe("PRIMARY");
    expect(coverage.sourceDocumentIds).toEqual([f.documentId]);

    const events = await h.prisma.auditEvent.findMany({
      where: { caseId: f.caseKey, action: BENEFITS_AUDIT_ACTIONS.RecordInsuranceCoverage },
    });
    expect(events).toHaveLength(1);
    expect(events[0]!.modelMetadata).toMatchObject({
      coverageType: "COMMERCIAL",
      insuranceEvidenceIds: [f.evidenceId],
      sourceDocumentCount: 1,
    });
  });

  it("requires APPROVED INSURANCE evidence: candidate, wrong-category, and cross-case items are refused", async () => {
    const f = await fixture("bn-ev-gate");
    // Candidate (unapproved) INSURANCE evidence:
    const candidate = await evidence.createCandidateEvidence({
      organizationId: h.tenantA.organizationId,
      caseId: f.caseKey,
      documentId: f.documentId,
      actor: benefits,
      category: "INSURANCE",
      originalText: "unapproved statement",
    });
    await expect(
      service.recordInsuranceCoverage(
        coverageInput(f, { insuranceEvidenceIds: [candidate.evidence.evidenceId] }),
      ),
    ).rejects.toBeInstanceOf(InsuranceEvidenceRequiredError);

    // Approved but non-INSURANCE category:
    const clinicalActor: Actor = { actorId: "syn-clin", actorType: "USER", roles: ["CLINICAL_REVIEWER"] };
    const medical = await evidence.createCandidateEvidence({
      organizationId: h.tenantA.organizationId,
      caseId: f.caseKey,
      documentId: f.documentId,
      actor: intake,
      category: "MEDICAL",
      originalText: "unrelated medical statement",
    });
    await evidence.approveEvidence({
      organizationId: h.tenantA.organizationId,
      caseId: f.caseKey,
      evidenceId: medical.evidence.evidenceId,
      actor: clinicalActor,
    });
    await expect(
      service.recordInsuranceCoverage(
        coverageInput(f, { insuranceEvidenceIds: [medical.evidence.evidenceId] }),
      ),
    ).rejects.toBeInstanceOf(InsuranceEvidenceRequiredError);

    // Another case's approved INSURANCE evidence:
    const other = await fixture("bn-ev-gate-other");
    await expect(
      service.recordInsuranceCoverage(coverageInput(f, { insuranceEvidenceIds: [other.evidenceId] })),
    ).rejects.toBeInstanceOf(InsuranceEvidenceRequiredError);

    expect(await h.prisma.insuranceCoverage.count({ where: { caseId: f.caseKey } })).toBe(0);
  });

  it("structurally rejects member/group/policy identifiers at the envelope", async () => {
    const f = await fixture("bn-identifiers");
    for (const field of ["memberId", "groupNumber", "policyNumber"]) {
      await expect(
        service.recordInsuranceCoverage(coverageInput(f, { [field]: "SYN-12345" })),
      ).rejects.toThrow(/unrecognized key/i);
    }
    expect(await h.prisma.insuranceCoverage.count({ where: { caseId: f.caseKey } })).toBe(0);
  });

  it("permissions: intake may record coverage; auditor may not; only the specialist verifies", async () => {
    const f = await fixture("bn-perms");
    const ok = await service.recordInsuranceCoverage(coverageInput(f, { actor: intake }));
    expect(ok.coverage.status).toBe("UNVERIFIED");
    await expect(
      service.recordInsuranceCoverage(coverageInput(f, { actor: auditor, coverageOrder: "SECONDARY" })),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(
      service.verifyEligibility({
        organizationId: h.tenantA.organizationId,
        caseId: f.caseKey,
        coverageId: ok.coverage.coverageId,
        actor: intake,
        method: "PHONE",
        outcome: "ACTIVE_CONFIRMED",
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });

  it("idempotent replay returns the same coverage without a second row or audit event", async () => {
    const f = await fixture("bn-idem");
    const key = `syn-bn-idem-${h.runId}`;
    const first = await service.recordInsuranceCoverage(coverageInput(f, { idempotencyKey: key }));
    const replay = await service.recordInsuranceCoverage(coverageInput(f, { idempotencyKey: key }));
    expect(replay.replayed).toBe(true);
    expect(replay.coverage.coverageId).toBe(first.coverage.coverageId);
    expect(await h.prisma.insuranceCoverage.count({ where: { caseId: f.caseKey } })).toBe(1);
    expect(
      await h.prisma.auditEvent.count({
        where: { caseId: f.caseKey, action: BENEFITS_AUDIT_ACTIONS.RecordInsuranceCoverage },
      }),
    ).toBe(1);
  });

  it("a failed audit write rolls back the coverage and its idempotency record; retry succeeds", async () => {
    const f = await fixture("bn-rollback");
    const key = `syn-bn-rollback-${h.runId}`;
    const real = new PrismaCaseAuditWriter();
    let failNext = true;
    const flaky: CaseAuditWriter = {
      write: async (tx, record) => {
        if (failNext && record.action === BENEFITS_AUDIT_ACTIONS.RecordInsuranceCoverage) {
          failNext = false;
          throw new Error("synthetic audit outage");
        }
        return real.write(tx, record);
      },
    };
    const flakyService = new BenefitsCommandService(
      new PrismaBenefitsGateway(h.prisma, flaky, tickingClock()),
    );
    await expect(
      flakyService.recordInsuranceCoverage(coverageInput(f, { idempotencyKey: key })),
    ).rejects.toThrow(/synthetic audit outage/);
    expect(await h.prisma.insuranceCoverage.count({ where: { caseId: f.caseKey } })).toBe(0);
    const idem = await h.prisma.commandIdempotencyRecord.findUnique({
      where: {
        organizationId_idempotencyKey: { organizationId: h.tenantA.organizationId, idempotencyKey: key },
      },
    });
    expect(idem).toBeNull();
    const retry = await flakyService.recordInsuranceCoverage(coverageInput(f, { idempotencyKey: key }));
    expect(retry.replayed).toBe(false);
    expect(retry.coverage.status).toBe("UNVERIFIED");
  });
});

describe("tenant isolation", () => {
  it("tenant A cannot record coverage on tenant B's case, verify B's coverage, or cite B's documents", async () => {
    const b = await fixture("bn-iso-b", h.tenantB);
    // A against B's case:
    await expect(
      service.recordInsuranceCoverage(coverageInput(b)),
    ).rejects.toBeInstanceOf(CaseNotFoundError);

    // B's own coverage, attacked from A (non-revealing miss):
    const bCoverage = await service.recordInsuranceCoverage({
      ...coverageInput(b),
      organizationId: h.tenantB.organizationId,
    });
    await expect(
      service.verifyEligibility({
        organizationId: h.tenantA.organizationId,
        caseId: b.caseKey,
        coverageId: bCoverage.coverage.coverageId,
        actor: benefits,
        method: "PHONE",
        outcome: "ACTIVE_CONFIRMED",
      }),
    ).rejects.toBeInstanceOf(CaseNotFoundError);

    // A's case citing B's document as proof:
    const a = await fixture("bn-iso-a");
    const aCoverage = await service.recordInsuranceCoverage(coverageInput(a));
    await expect(
      service.verifyEligibility({
        organizationId: h.tenantA.organizationId,
        caseId: a.caseKey,
        coverageId: aCoverage.coverage.coverageId,
        actor: benefits,
        method: "PHONE",
        outcome: "ACTIVE_CONFIRMED",
        proofDocumentIds: [b.documentId],
      }),
    ).rejects.toBeInstanceOf(DocumentNotFoundError);

    const row = await h.prisma.insuranceCoverage.findUnique({
      where: { id: bCoverage.coverage.coverageId },
    });
    expect(row?.status).toBe("UNVERIFIED");
    expect(row?.version).toBe(0);
  });
});

describe("eligibility verification", () => {
  it("records the attempt with proofs, rolls the outcome up onto coverage, and audits", async () => {
    const f = await fixture("bn-elig");
    const { coverage } = await service.recordInsuranceCoverage(coverageInput(f));
    const result = await service.verifyEligibility({
      organizationId: h.tenantA.organizationId,
      caseId: f.caseKey,
      coverageId: coverage.coverageId,
      actor: benefits,
      method: "PHONE",
      outcome: "ACTIVE_CONFIRMED",
      payerRepresentative: "Synthetic Rep 7",
      referenceNumber: "SYN-CALL-042",
      proofDocumentIds: [f.documentId],
      expectedCoverageVersion: 0,
    });
    expect(result.verification.status).toBe("ACTIVE_CONFIRMED");
    expect(result.verification.verifiedBy).toBe("syn-benefits");
    expect(result.verification.proofDocumentIds).toEqual([f.documentId]);
    expect(result.coverage.status).toBe("ACTIVE");
    expect(result.coverage.version).toBe(1);

    const events = await h.prisma.auditEvent.findMany({
      where: { caseId: f.caseKey, action: BENEFITS_AUDIT_ACTIONS.VerifyEligibility },
    });
    expect(events).toHaveLength(1);
    expect(events[0]!.modelMetadata).toMatchObject({
      outcome: "ACTIVE_CONFIRMED",
      coverageStatusRollup: "ACTIVE",
      method: "PHONE",
    });
  });

  it("an UNKNOWN subscriber relationship blocks verification (binding contract rule)", async () => {
    const f = await fixture("bn-unknown-rel");
    const { coverage } = await service.recordInsuranceCoverage(
      coverageInput(f, { subscriberRelationship: "UNKNOWN" }),
    );
    await expect(
      service.verifyEligibility({
        organizationId: h.tenantA.organizationId,
        caseId: f.caseKey,
        coverageId: coverage.coverageId,
        actor: benefits,
        method: "PHONE",
        outcome: "ACTIVE_CONFIRMED",
      }),
    ).rejects.toBeInstanceOf(CoverageStateError);
  });

  it("successive attempts follow the eligibility state machine: FAILED cannot jump to ACTIVE_CONFIRMED", async () => {
    const f = await fixture("bn-machine");
    const { coverage } = await service.recordInsuranceCoverage(coverageInput(f));
    const attempt = (outcome: "FAILED" | "PENDING" | "ACTIVE_CONFIRMED") =>
      service.verifyEligibility({
        organizationId: h.tenantA.organizationId,
        caseId: f.caseKey,
        coverageId: coverage.coverageId,
        actor: benefits,
        method: "PHONE",
        outcome,
      });
    await attempt("FAILED");
    await expect(attempt("ACTIVE_CONFIRMED")).rejects.toThrow(/Invalid eligibility transition/);
    await attempt("PENDING"); // re-enter through PENDING, per the contract
    const finalResult = await attempt("ACTIVE_CONFIRMED");
    expect(finalResult.coverage.status).toBe("ACTIVE");
  });

  it("a stale expectedCoverageVersion fails safely with the coverage unchanged", async () => {
    const f = await fixture("bn-stale");
    const { coverage } = await service.recordInsuranceCoverage(coverageInput(f));
    await service.verifyEligibility({
      organizationId: h.tenantA.organizationId,
      caseId: f.caseKey,
      coverageId: coverage.coverageId,
      actor: benefits,
      method: "PHONE",
      outcome: "PENDING",
    }); // v1
    await expect(
      service.verifyEligibility({
        organizationId: h.tenantA.organizationId,
        caseId: f.caseKey,
        coverageId: coverage.coverageId,
        actor: benefits,
        method: "PHONE",
        outcome: "ACTIVE_CONFIRMED",
        expectedCoverageVersion: 0,
      }),
    ).rejects.toBeInstanceOf(CoverageConcurrencyConflictError);
    const row = await h.prisma.insuranceCoverage.findUnique({ where: { id: coverage.coverageId } });
    expect(row?.status).toBe("UNVERIFIED"); // PENDING attempt left rollup untouched
    expect(row?.version).toBe(1);
  });
});

describe("benefit verification (quotes)", () => {
  it("cannot quote against non-ACTIVE coverage", async () => {
    const f = await fixture("bn-quote-gate");
    const { coverage } = await service.recordInsuranceCoverage(coverageInput(f));
    await expect(
      service.recordBenefitVerification({
        organizationId: h.tenantA.organizationId,
        caseId: f.caseKey,
        coverageId: coverage.coverageId,
        actor: benefits,
        serviceType: "INPATIENT_PSYCHIATRIC",
        networkStatus: "IN_NETWORK",
        verificationReference: "SYN-BEN-001",
        disclaimerProvided: true,
      }),
    ).rejects.toBeInstanceOf(CoverageStateError);
  });

  it("cannot be recorded without the not-a-payment-guarantee disclaimer (structural)", async () => {
    const f = await fixture("bn-disclaimer");
    const coverage = await recordActiveCoverage(f);
    for (const disclaimerProvided of [false, undefined]) {
      await expect(
        service.recordBenefitVerification({
          organizationId: h.tenantA.organizationId,
          caseId: f.caseKey,
          coverageId: coverage.coverageId,
          actor: benefits,
          serviceType: "INPATIENT_PSYCHIATRIC",
          networkStatus: "IN_NETWORK",
          verificationReference: "SYN-BEN-002",
          ...(disclaimerProvided === undefined ? {} : { disclaimerProvided }),
        } as never),
      ).rejects.toThrow(/disclaimer/i);
    }
    expect(
      await h.prisma.benefitVerification.count({ where: { insuranceCoverageId: coverage.coverageId } }),
    ).toBe(0);
  });

  it("records a quote with sources, PROVIDED disclaimer, and audit", async () => {
    const f = await fixture("bn-quote");
    const coverage = await recordActiveCoverage(f);
    const { benefit } = await service.recordBenefitVerification({
      organizationId: h.tenantA.organizationId,
      caseId: f.caseKey,
      coverageId: coverage.coverageId,
      actor: benefits,
      serviceType: "INPATIENT_PSYCHIATRIC",
      networkStatus: "IN_NETWORK",
      deductibleAmountCents: 200000,
      deductibleMetCents: 50000,
      coinsurancePercent: 20,
      authorizationRequired: true,
      verificationReference: "SYN-BEN-003",
      disclaimerProvided: true,
      sourceDocumentIds: [f.documentId],
    });
    expect(benefit.disclaimerStatus).toBe("PROVIDED");
    expect(benefit.authorizationRequired).toBe(true);
    expect(benefit.sourceDocumentIds).toEqual([f.documentId]);

    const events = await h.prisma.auditEvent.findMany({
      where: { caseId: f.caseKey, action: BENEFITS_AUDIT_ACTIONS.RecordBenefitVerification },
    });
    expect(events).toHaveLength(1);
    expect(events[0]!.modelMetadata).toMatchObject({
      serviceType: "INPATIENT_PSYCHIATRIC",
      authorizationRequired: true,
      disclaimerStatus: "PROVIDED",
    });
    // No dollar amounts or identifiers in audit metadata — references only.
    const flat = JSON.stringify(events[0]!.modelMetadata);
    expect(flat).not.toContain("200000");
  });
});

describe("financial education", () => {
  it("records an education encounter with honest uncertainties, linked to the quote, audited", async () => {
    const f = await fixture("bn-edu");
    const coverage = await recordActiveCoverage(f);
    const { benefit } = await service.recordBenefitVerification({
      organizationId: h.tenantA.organizationId,
      caseId: f.caseKey,
      coverageId: coverage.coverageId,
      actor: benefits,
      serviceType: "INPATIENT_PSYCHIATRIC",
      networkStatus: "IN_NETWORK",
      verificationReference: "SYN-BEN-004",
      disclaimerProvided: true,
    });
    const { educationRecordId } = await service.recordFinancialEducation({
      organizationId: h.tenantA.organizationId,
      caseId: f.caseKey,
      actor: intake, // patient education is shared with intake
      benefitVerificationId: benefit.benefitVerificationId,
      recipientType: "GUARDIAN",
      method: "IN_PERSON",
      interpreterUsed: false,
      topicsReviewed: ["estimated inpatient cost share", "quote is not a guarantee of payment"],
      uncertaintiesDisclosed: ["out-of-pocket met amount could not be confirmed on the call"],
      acknowledgementStatus: "ACKNOWLEDGED",
    });
    const row = await h.prisma.financialEducationRecord.findUnique({ where: { id: educationRecordId } });
    expect(row?.benefitVerificationId).toBe(benefit.benefitVerificationId);
    expect(row?.educatedBy).toBe("syn-intake");
    expect(row?.uncertaintiesDisclosed).toHaveLength(1);
    expect(
      await h.prisma.auditEvent.count({
        where: { caseId: f.caseKey, action: BENEFITS_AUDIT_ACTIONS.RecordFinancialEducation },
      }),
    ).toBe(1);
  });

  it("cannot link an education record to another case's benefit verification", async () => {
    const f1 = await fixture("bn-edu-cross-1");
    const f2 = await fixture("bn-edu-cross-2");
    const coverage = await recordActiveCoverage(f1);
    const { benefit } = await service.recordBenefitVerification({
      organizationId: h.tenantA.organizationId,
      caseId: f1.caseKey,
      coverageId: coverage.coverageId,
      actor: benefits,
      serviceType: "SUBSTANCE_USE",
      networkStatus: "UNKNOWN",
      verificationReference: "SYN-BEN-005",
      disclaimerProvided: true,
    });
    await expect(
      service.recordFinancialEducation({
        organizationId: h.tenantA.organizationId,
        caseId: f2.caseKey, // different case
        actor: benefits,
        benefitVerificationId: benefit.benefitVerificationId,
        recipientType: "PATIENT",
        method: "PHONE",
        topicsReviewed: ["x"],
        acknowledgementStatus: "DEFERRED",
      }),
    ).rejects.toBeInstanceOf(CoverageNotFoundError);
  });
});
