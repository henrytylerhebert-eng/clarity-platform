import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  PrismaAuthorizationGateway,
  PrismaBenefitsGateway,
  PrismaCaseRepository,
  PrismaDocumentGateway,
  PrismaEvidenceGateway,
} from "@clarity/case-repository";
import { DocumentCommandService } from "@clarity/document-service";
import { EvidenceCommandService } from "@clarity/evidence-service";
import { BenefitsCommandService } from "@clarity/benefits-service";
import {
  AuthorizationCommandService,
  AuthorizationConcurrencyConflictError,
  AuthorizationRequirementUnknownError,
  AuthorizationStateError,
  CaseNotFoundError,
  CoverageNotFoundError,
  DuplicateAuthorizationError,
  PermissionDeniedError,
  RationaleRequiredError,
  AUTHORIZATION_AUDIT_ACTIONS,
} from "@clarity/authorization-service";
import type { UserRole } from "@clarity/domain-contracts";
import { createHarness, tickingClock, TEST_ACTOR, type Harness } from "./helpers/harness.js";

/**
 * Authorization readiness — preparation phase only (ADR-0010). Built on the
 * full synthetic stack: document → approved INSURANCE evidence → coverage →
 * eligibility → quote → authorization record → readiness view.
 */

let h: Harness;
let caseRepo: PrismaCaseRepository;
let documents: DocumentCommandService;
let evidence: EvidenceCommandService;
let benefitsService: BenefitsCommandService;
let service: AuthorizationCommandService;

type Actor = { actorId: string; actorType: "USER"; roles: UserRole[] };
const intake: Actor = { actorId: "syn-intake", actorType: "USER", roles: ["INTAKE_COORDINATOR"] };
const benefits: Actor = {
  actorId: "syn-benefits",
  actorType: "USER",
  roles: ["BENEFITS_VERIFICATION_SPECIALIST"],
};
const authSpec: Actor = { actorId: "syn-auth", actorType: "USER", roles: ["AUTHORIZATION_SPECIALIST"] };
const auditor: Actor = { actorId: "syn-auditor", actorType: "USER", roles: ["READ_ONLY_AUDITOR"] };

const bytes = (text: string) => new TextEncoder().encode(text);

/** Case with ACTIVE coverage and one quote whose authorizationRequired is configurable. */
async function fixture(
  suffix: string,
  opts: { authorizationRequired?: boolean | null; tenant?: Harness["tenantA"] } = {},
) {
  const tenant = opts.tenant ?? h.tenantA;
  const caseKey = h.caseKey(suffix);
  await caseRepo.create(tenant.organizationId, h.makeCaseData(tenant, suffix), TEST_ACTOR);
  const upload = await documents.uploadDocument({
    organizationId: tenant.organizationId,
    caseId: caseKey,
    actor: intake,
    documentType: "INSURANCE_CARD",
    filename: "card.png",
    mimeType: "image/png",
    content: bytes(`synthetic card ${suffix}`),
  });
  const ev = await evidence.createCandidateEvidence({
    organizationId: tenant.organizationId,
    caseId: caseKey,
    documentId: upload.document.documentId,
    actor: benefits,
    category: "INSURANCE",
    originalText: `synthetic card statement ${suffix}`,
  });
  await evidence.approveEvidence({
    organizationId: tenant.organizationId,
    caseId: caseKey,
    evidenceId: ev.evidence.evidenceId,
    actor: benefits,
  });
  const cov = await benefitsService.recordInsuranceCoverage({
    organizationId: tenant.organizationId,
    caseId: caseKey,
    actor: benefits,
    coverageOrder: "PRIMARY",
    coverageType: "COMMERCIAL",
    subscriberRelationship: "SELF",
    insuranceEvidenceIds: [ev.evidence.evidenceId],
    sourceDocumentIds: [upload.document.documentId],
  });
  await benefitsService.verifyEligibility({
    organizationId: tenant.organizationId,
    caseId: caseKey,
    coverageId: cov.coverage.coverageId,
    actor: benefits,
    method: "PHONE",
    outcome: "ACTIVE_CONFIRMED",
  });
  const quote = await benefitsService.recordBenefitVerification({
    organizationId: tenant.organizationId,
    caseId: caseKey,
    coverageId: cov.coverage.coverageId,
    actor: benefits,
    serviceType: "INPATIENT_PSYCHIATRIC",
    networkStatus: "IN_NETWORK",
    verificationReference: `SYN-${suffix}`,
    disclaimerProvided: true,
    ...(opts.authorizationRequired === undefined || opts.authorizationRequired === null
      ? {}
      : { authorizationRequired: opts.authorizationRequired }),
  });
  return {
    caseKey,
    coverageId: cov.coverage.coverageId,
    benefitVerificationId: quote.benefit.benefitVerificationId,
  };
}

function recordInput(f: { caseKey: string; coverageId: string; benefitVerificationId: string }, extra: Record<string, unknown> = {}) {
  return {
    organizationId: h.tenantA.organizationId,
    caseId: f.caseKey,
    actor: authSpec,
    coverageId: f.coverageId,
    benefitVerificationId: f.benefitVerificationId,
    requestedLevelOfCare: "INPATIENT_PSYCHIATRIC" as const,
    ...extra,
  };
}

beforeAll(async () => {
  h = await createHarness();
  caseRepo = new PrismaCaseRepository(h.prisma, undefined, tickingClock());
  documents = new DocumentCommandService(new PrismaDocumentGateway(h.prisma, undefined, tickingClock()));
  evidence = new EvidenceCommandService(new PrismaEvidenceGateway(h.prisma, undefined, tickingClock()));
  benefitsService = new BenefitsCommandService(new PrismaBenefitsGateway(h.prisma, undefined, tickingClock()));
  service = new AuthorizationCommandService(
    new PrismaAuthorizationGateway(h.prisma, undefined, tickingClock()),
  );
});
afterAll(async () => h?.dispose());

describe("recording authorization", () => {
  it("derives NOT_STARTED from a quote requiring authorization, audited with the derivation", async () => {
    const f = await fixture("au-req", { authorizationRequired: true });
    const { authorization, replayed } = await service.recordAuthorization(recordInput(f));
    expect(replayed).toBe(false);
    expect(authorization.status).toBe("NOT_STARTED");
    expect(authorization.version).toBe(0);
    const events = await h.prisma.auditEvent.findMany({
      where: { caseId: f.caseKey, action: AUTHORIZATION_AUDIT_ACTIONS.RecordAuthorization },
    });
    expect(events).toHaveLength(1);
    expect(events[0]!.modelMetadata).toMatchObject({
      authorizationRequired: true,
      initialStatus: "NOT_STARTED",
      benefitVerificationId: f.benefitVerificationId,
    });
  });

  it("derives NOT_REQUIRED when the quote says authorization is not required", async () => {
    const f = await fixture("au-notreq", { authorizationRequired: false });
    const { authorization } = await service.recordAuthorization(recordInput(f));
    expect(authorization.status).toBe("NOT_REQUIRED");
  });

  it("rejects recording when the quote does not answer the requirement (null)", async () => {
    const f = await fixture("au-null", { authorizationRequired: null });
    await expect(service.recordAuthorization(recordInput(f))).rejects.toBeInstanceOf(
      AuthorizationRequirementUnknownError,
    );
    expect(await h.prisma.authorization.count({ where: { caseId: f.caseKey } })).toBe(0);
  });

  it("the cited quote must belong to the named coverage; duplicates per (coverage, LOC) are refused", async () => {
    const f1 = await fixture("au-cross-1", { authorizationRequired: true });
    const f2 = await fixture("au-cross-2", { authorizationRequired: true });
    await expect(
      service.recordAuthorization(
        recordInput(f1, { benefitVerificationId: f2.benefitVerificationId }),
      ),
    ).rejects.toBeInstanceOf(CoverageNotFoundError);

    await service.recordAuthorization(recordInput(f1));
    await expect(service.recordAuthorization(recordInput(f1))).rejects.toBeInstanceOf(
      DuplicateAuthorizationError,
    );
    expect(await h.prisma.authorization.count({ where: { caseId: f1.caseKey } })).toBe(1);
  });

  it("permissions: benefits specialist and auditor cannot record; idempotent replay is safe", async () => {
    const f = await fixture("au-perm", { authorizationRequired: true });
    for (const actor of [benefits, auditor, intake]) {
      await expect(service.recordAuthorization(recordInput(f, { actor }))).rejects.toBeInstanceOf(
        PermissionDeniedError,
      );
    }
    const key = `syn-au-idem-${h.runId}`;
    const first = await service.recordAuthorization(recordInput(f, { idempotencyKey: key }));
    const replay = await service.recordAuthorization(recordInput(f, { idempotencyKey: key }));
    expect(replay.replayed).toBe(true);
    expect(replay.authorization.authorizationId).toBe(first.authorization.authorizationId);
    expect(await h.prisma.authorization.count({ where: { caseId: f.caseKey } })).toBe(1);
    expect(
      await h.prisma.auditEvent.count({
        where: { caseId: f.caseKey, action: AUTHORIZATION_AUDIT_ACTIONS.RecordAuthorization },
      }),
    ).toBe(1);
  });
});

describe("preparation transitions", () => {
  it("NOT_STARTED -> PREPARING is audited; SUBMITTED is structurally unreachable", async () => {
    const f = await fixture("au-prep", { authorizationRequired: true });
    const { authorization } = await service.recordAuthorization(recordInput(f));
    const target = {
      organizationId: h.tenantA.organizationId,
      caseId: f.caseKey,
      authorizationId: authorization.authorizationId,
      actor: authSpec,
    };
    const prepared = await service.transitionAuthorizationPreparation({ ...target, to: "PREPARING" });
    expect(prepared.authorization.status).toBe("PREPARING");
    expect(prepared.authorization.version).toBe(1);

    // The phase boundary is the envelope itself: SUBMITTED is not a legal value.
    await expect(
      service.transitionAuthorizationPreparation({ ...target, to: "SUBMITTED" } as never),
    ).rejects.toThrow(/invalid/i);
    expect(
      await h.prisma.auditEvent.count({
        where: { caseId: f.caseKey, action: AUTHORIZATION_AUDIT_ACTIONS.TransitionAuthorizationPreparation },
      }),
    ).toBe(1);
  });

  it("leaving the normal path requires rationale; the state machine rejects illegal moves; stale versions fail", async () => {
    const f = await fixture("au-guards", { authorizationRequired: true });
    const { authorization } = await service.recordAuthorization(recordInput(f));
    const target = {
      organizationId: h.tenantA.organizationId,
      caseId: f.caseKey,
      authorizationId: authorization.authorizationId,
      actor: authSpec,
    };
    // UNABLE_TO_COMPLETE from NOT_STARTED is illegal per the machine, but the
    // rationale check fires first — both guards exist:
    await expect(
      service.transitionAuthorizationPreparation({ ...target, to: "UNABLE_TO_COMPLETE" }),
    ).rejects.toBeInstanceOf(RationaleRequiredError);
    await expect(
      service.transitionAuthorizationPreparation({
        ...target,
        to: "UNABLE_TO_COMPLETE",
        reason: "synthetic: payer unreachable for five business days",
      }),
    ).rejects.toBeInstanceOf(AuthorizationStateError); // NOT_STARTED -> UNABLE_TO_COMPLETE not in machine

    await service.transitionAuthorizationPreparation({ ...target, to: "PREPARING" }); // v1
    await expect(
      service.transitionAuthorizationPreparation({
        ...target,
        to: "NOT_REQUIRED",
        reason: "synthetic stale attempt",
        expectedVersion: 0,
      }),
    ).rejects.toBeInstanceOf(AuthorizationConcurrencyConflictError);
    const ok = await service.transitionAuthorizationPreparation({
      ...target,
      to: "NOT_REQUIRED",
      reason: "synthetic: payer rep confirmed no auth needed for this LOC",
      expectedVersion: 1,
    });
    expect(ok.authorization.status).toBe("NOT_REQUIRED");
  });

  it("tenant isolation: A cannot record against or transition B's records; B untouched", async () => {
    const b = await fixture("au-iso", { authorizationRequired: true, tenant: h.tenantB });
    await expect(
      service.recordAuthorization({ ...recordInput(b) }),
    ).rejects.toBeInstanceOf(CaseNotFoundError);
    const bAuth = await service.recordAuthorization({
      ...recordInput(b),
      organizationId: h.tenantB.organizationId,
    });
    await expect(
      service.transitionAuthorizationPreparation({
        organizationId: h.tenantA.organizationId,
        caseId: b.caseKey,
        authorizationId: bAuth.authorization.authorizationId,
        actor: authSpec,
        to: "PREPARING",
      }),
    ).rejects.toThrow(/not found/);
    const row = await h.prisma.authorization.findUnique({
      where: { id: bAuth.authorization.authorizationId },
    });
    expect(row?.status).toBe("NOT_STARTED");
    expect(row?.version).toBe(0);
  });
});

describe("readiness assessment", () => {
  it("reports per-coverage requirement and named gaps, with no aggregate score", async () => {
    // Coverage 1: ACTIVE, quote requires auth, authorization started.
    const f = await fixture("au-assess", { authorizationRequired: true });
    const { authorization } = await service.recordAuthorization(recordInput(f));
    await service.transitionAuthorizationPreparation({
      organizationId: h.tenantA.organizationId,
      caseId: f.caseKey,
      authorizationId: authorization.authorizationId,
      actor: authSpec,
      to: "PREPARING",
    });
    // Coverage 2 on the same case: recorded but never verified, no quote.
    const ev2 = await evidence.createCandidateEvidence({
      organizationId: h.tenantA.organizationId,
      caseId: f.caseKey,
      documentId: (await h.prisma.sourceDocument.findFirstOrThrow({ where: { caseId: f.caseKey } })).id,
      actor: benefits,
      category: "INSURANCE",
      originalText: "secondary synthetic plan statement",
    });
    await evidence.approveEvidence({
      organizationId: h.tenantA.organizationId,
      caseId: f.caseKey,
      evidenceId: ev2.evidence.evidenceId,
      actor: benefits,
    });
    await benefitsService.recordInsuranceCoverage({
      organizationId: h.tenantA.organizationId,
      caseId: f.caseKey,
      actor: benefits,
      coverageOrder: "SECONDARY",
      coverageType: "MEDICAID",
      subscriberRelationship: "SELF",
      insuranceEvidenceIds: [ev2.evidence.evidenceId],
    });

    const items = await service.assessAuthorizationReadiness({
      organizationId: h.tenantA.organizationId,
      caseId: f.caseKey,
      actor: authSpec,
    });
    expect(items).toHaveLength(2);
    const primary = items.find((i) => i.coverageOrder === "PRIMARY")!;
    expect(primary.requirement).toBe("REQUIRED");
    expect(primary.gaps).toEqual([]); // eligibility confirmed, auth underway
    expect(primary.authorizations[0]).toMatchObject({ status: "PREPARING" });
    const secondary = items.find((i) => i.coverageOrder === "SECONDARY")!;
    expect(secondary.requirement).toBe("UNKNOWN");
    expect(secondary.gaps).toEqual(["ELIGIBILITY_NOT_CONFIRMED", "BENEFIT_QUOTE_MISSING"]);
    // The doctrine: no aggregate anywhere on the payload.
    for (const item of items) {
      expect(item).not.toHaveProperty("score");
      expect(item).not.toHaveProperty("overallReadiness");
    }
  });

  it("flags REQUIRED-but-not-started, unverified requirements, and is tenant-scoped + role-gated", async () => {
    const f = await fixture("au-assess-2", { authorizationRequired: true });
    const items = await service.assessAuthorizationReadiness({
      organizationId: h.tenantA.organizationId,
      caseId: f.caseKey,
      actor: benefits, // benefits specialist may read the view
    });
    expect(items[0]!.requirement).toBe("REQUIRED");
    expect(items[0]!.gaps).toEqual(["AUTHORIZATION_NOT_STARTED"]);

    const fNull = await fixture("au-assess-null", { authorizationRequired: null });
    const nullItems = await service.assessAuthorizationReadiness({
      organizationId: h.tenantA.organizationId,
      caseId: fNull.caseKey,
      actor: authSpec,
    });
    expect(nullItems[0]!.requirement).toBe("UNKNOWN");
    expect(nullItems[0]!.gaps).toContain("AUTHORIZATION_REQUIREMENT_UNVERIFIED");

    await expect(
      service.assessAuthorizationReadiness({
        organizationId: h.tenantB.organizationId,
        caseId: f.caseKey,
        actor: authSpec,
      }),
    ).rejects.toBeInstanceOf(CaseNotFoundError);
    await expect(
      service.assessAuthorizationReadiness({
        organizationId: h.tenantA.organizationId,
        caseId: f.caseKey,
        actor: auditor,
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });
});
