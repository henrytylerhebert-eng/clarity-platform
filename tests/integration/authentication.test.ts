import { createHash } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  PrismaAuthGateway,
  PrismaBenefitsGateway,
  PrismaCaseRepository,
  PrismaDocumentGateway,
  PrismaEvidenceGateway,
} from "@clarity/case-repository";
import { DocumentCommandService } from "@clarity/document-service";
import { EvidenceCommandService } from "@clarity/evidence-service";
import { BenefitsCommandService, CaseNotFoundError, PermissionDeniedError } from "@clarity/benefits-service";
import {
  AuthenticationFailedError,
  AuthenticationService,
  LocalDevIdentityProvider,
  LoginRejectedError,
} from "@clarity/auth-service";
import type { UserRole } from "@clarity/domain-contracts";
import { createHarness, tickingClock, TEST_ACTOR, type Harness } from "./helpers/harness.js";

/**
 * Authentication (ADR-0011): session lifecycle, non-revealing failures,
 * token-hash-only storage, and — the point of the phase — the permission
 * suites re-run against REAL principals whose roles come from the database,
 * not the caller.
 */

let h: Harness;
let provider: LocalDevIdentityProvider;
let auth: AuthenticationService;
let clockMs: number;

const ASSERTIONS = {
  benefits: "syn-assert-benefits-0001",
  intake: "syn-assert-intake-00001",
  tenantB: "syn-assert-tenantb-0001",
  inactive: "syn-assert-inactive-001",
};

async function createRoleUser(label: string, tenant: Harness["tenantA"], roles: UserRole[], status = "ACTIVE") {
  const email = `syn-auth-${label}-${h.runId}@example.test`;
  await h.prisma.user.create({
    data: {
      id: `synthetic-user-auth-${label}-${h.runId}`,
      organizationId: tenant.organizationId,
      email,
      displayName: `Synthetic Auth ${label}`,
      roles,
      status: status as never,
    },
  });
  return email;
}

beforeAll(async () => {
  h = await createHarness();
  clockMs = Date.parse("2026-07-14T08:00:00Z");
  const clock = () => new Date(clockMs);
  provider = new LocalDevIdentityProvider();
  auth = new AuthenticationService(
    provider,
    new PrismaAuthGateway(h.prisma, undefined, clock),
    8 * 60 * 60 * 1000,
    clock,
  );
  provider.register(ASSERTIONS.benefits, await createRoleUser("benefits", h.tenantA, ["BENEFITS_VERIFICATION_SPECIALIST"]));
  provider.register(ASSERTIONS.intake, await createRoleUser("intake", h.tenantA, ["INTAKE_COORDINATOR"]));
  provider.register(ASSERTIONS.tenantB, await createRoleUser("tenant-b", h.tenantB, ["BENEFITS_VERIFICATION_SPECIALIST"]));
  provider.register(ASSERTIONS.inactive, await createRoleUser("inactive", h.tenantA, ["INTAKE_COORDINATOR"], "INACTIVE"));
});
afterAll(async () => h?.dispose());

describe("session lifecycle", () => {
  it("login issues a session whose principal carries DATABASE roles; lastLoginAt stamps; issuance audited without token material", async () => {
    const { token, principal } = await auth.login(ASSERTIONS.benefits);
    expect(principal.roles).toEqual(["BENEFITS_VERIFICATION_SPECIALIST"]); // from the User row
    expect(principal.organizationId).toBe(h.tenantA.organizationId);
    expect(token).toHaveLength(64); // 32 random bytes, hex

    const verified = await auth.authenticate(token);
    expect(verified.userId).toBe(principal.userId);
    expect(verified.sessionId).toBe(principal.sessionId);

    const user = await h.prisma.user.findUnique({ where: { id: principal.userId } });
    expect(user?.lastLoginAt).not.toBeNull();

    const events = await h.prisma.auditEvent.findMany({
      where: { organizationId: h.tenantA.organizationId, action: "SESSION_ISSUED", objectId: principal.sessionId },
    });
    expect(events).toHaveLength(1);
    expect(events[0]!.caseId).toBeNull(); // organization-level event
    const flat = JSON.stringify(events[0]!.modelMetadata);
    expect(flat).not.toContain(token);
    expect(flat).not.toContain(createHash("sha256").update(token).digest("hex"));
  });

  it("the raw token is stored nowhere — only its SHA-256 hash", async () => {
    const { token, principal } = await auth.login(ASSERTIONS.benefits);
    const session = await h.prisma.authSession.findUnique({ where: { id: principal.sessionId } });
    expect(session?.tokenHash).toBe(createHash("sha256").update(token).digest("hex"));
    expect(session?.tokenHash).not.toBe(token);
  });

  it("unknown, tampered, expired, and revoked tokens fail with one indistinguishable error", async () => {
    const { token } = await auth.login(ASSERTIONS.benefits);
    const failures: string[] = [];
    const attempt = async (t: string) => {
      try {
        await auth.authenticate(t);
        throw new Error("should not authenticate");
      } catch (e) {
        expect(e).toBeInstanceOf(AuthenticationFailedError);
        failures.push((e as Error).message);
      }
    };
    await attempt("0".repeat(64)); // unknown
    await attempt(token.slice(0, 63) + (token.endsWith("a") ? "b" : "a")); // tampered

    const revoked = await auth.login(ASSERTIONS.benefits);
    await auth.logout(revoked.token);
    await attempt(revoked.token); // revoked

    const shortLived = await auth.login(ASSERTIONS.benefits);
    clockMs += 9 * 60 * 60 * 1000; // advance past the 8h TTL
    await attempt(shortLived.token); // expired
    clockMs -= 9 * 60 * 60 * 1000;

    expect(new Set(failures).size).toBe(1); // identical message for every failure mode
  });

  it("logout is audited exactly once and is idempotent; a deactivated user's live session stops working", async () => {
    const { token, principal } = await auth.login(ASSERTIONS.intake);
    await auth.logout(token);
    await auth.logout(token); // second call: no error, no second event
    const revokeEvents = await h.prisma.auditEvent.count({
      where: { action: "SESSION_REVOKED", objectId: principal.sessionId },
    });
    expect(revokeEvents).toBe(1);

    const second = await auth.login(ASSERTIONS.benefits);
    const user = await h.prisma.user.findUnique({ where: { id: second.principal.userId } });
    await h.prisma.user.update({ where: { id: user!.id }, data: { status: "INACTIVE" } });
    await expect(auth.authenticate(second.token)).rejects.toBeInstanceOf(AuthenticationFailedError);
    await h.prisma.user.update({ where: { id: user!.id }, data: { status: "ACTIVE" } });
  });

  it("login is rejected uniformly for unknown assertions and inactive users", async () => {
    await expect(auth.login("not-a-registered-assertion")).rejects.toBeInstanceOf(LoginRejectedError);
    await expect(auth.login(ASSERTIONS.inactive)).rejects.toBeInstanceOf(LoginRejectedError);
  });
});

describe("permission suites against real principals", () => {
  let caseRepo: PrismaCaseRepository;
  let documents: DocumentCommandService;
  let evidence: EvidenceCommandService;
  let benefitsService: BenefitsCommandService;

  beforeAll(() => {
    caseRepo = new PrismaCaseRepository(h.prisma, undefined, tickingClock());
    documents = new DocumentCommandService(new PrismaDocumentGateway(h.prisma, undefined, tickingClock()));
    evidence = new EvidenceCommandService(new PrismaEvidenceGateway(h.prisma, undefined, tickingClock()));
    benefitsService = new BenefitsCommandService(new PrismaBenefitsGateway(h.prisma, undefined, tickingClock()));
  });

  async function caseFixture(suffix: string) {
    const caseKey = h.caseKey(suffix);
    await caseRepo.create(h.tenantA.organizationId, h.makeCaseData(h.tenantA, suffix), TEST_ACTOR);
    return caseKey;
  }

  it("a session-derived benefits specialist completes the verification flow end to end", async () => {
    const caseKey = await caseFixture("auth-flow");
    const { principal } = await auth.login(ASSERTIONS.benefits);
    const specialist = auth.actorFor(principal);
    const org = principal.organizationId; // tenancy also principal-derived

    const intakeSession = await auth.login(ASSERTIONS.intake);
    const intakeActor = auth.actorFor(intakeSession.principal);

    const upload = await documents.uploadDocument({
      organizationId: org,
      caseId: caseKey,
      actor: intakeActor,
      documentType: "INSURANCE_CARD",
      filename: "card.png",
      mimeType: "image/png",
      content: new TextEncoder().encode("synthetic card bytes"),
    });
    const ev = await evidence.createCandidateEvidence({
      organizationId: org,
      caseId: caseKey,
      documentId: upload.document.documentId,
      actor: specialist,
      category: "INSURANCE",
      originalText: "synthetic card statement",
    });
    await evidence.approveEvidence({
      organizationId: org,
      caseId: caseKey,
      evidenceId: ev.evidence.evidenceId,
      actor: specialist,
    });
    const cov = await benefitsService.recordInsuranceCoverage({
      organizationId: org,
      caseId: caseKey,
      actor: specialist,
      coverageOrder: "PRIMARY",
      coverageType: "COMMERCIAL",
      subscriberRelationship: "SELF",
      insuranceEvidenceIds: [ev.evidence.evidenceId],
    });
    const verified = await benefitsService.verifyEligibility({
      organizationId: org,
      caseId: caseKey,
      coverageId: cov.coverage.coverageId,
      actor: specialist,
      method: "PHONE",
      outcome: "ACTIVE_CONFIRMED",
    });
    expect(verified.coverage.status).toBe("ACTIVE");
    // The audit trail carries the real user id from the session, not a synthetic label.
    const audit = await h.prisma.auditEvent.findFirst({
      where: { caseId: caseKey, action: "ELIGIBILITY_VERIFICATION_RECORDED" },
    });
    expect(audit?.actorId).toBe(principal.userId);
  });

  it("an intake-role session is denied specialist commands — roles come from the database, not the caller", async () => {
    const caseKey = await caseFixture("auth-denied");
    const { principal } = await auth.login(ASSERTIONS.intake);
    expect(principal.roles).toEqual(["INTAKE_COORDINATOR"]); // DB says intake, so intake it is
    const actor = auth.actorFor(principal);
    await expect(
      benefitsService.verifyEligibility({
        organizationId: principal.organizationId,
        caseId: caseKey,
        coverageId: "irrelevant",
        actor,
        method: "PHONE",
        outcome: "ACTIVE_CONFIRMED",
      }),
    ).rejects.toBeInstanceOf(PermissionDeniedError);
  });

  it("a tenant-B session cannot act on tenant A's case even with the right role", async () => {
    const caseKey = await caseFixture("auth-cross-tenant");
    const { principal } = await auth.login(ASSERTIONS.tenantB);
    expect(principal.organizationId).toBe(h.tenantB.organizationId);
    const actor = auth.actorFor(principal);
    await expect(
      benefitsService.recordInsuranceCoverage({
        organizationId: principal.organizationId, // principal-derived tenancy
        caseId: caseKey, // tenant A's case
        actor,
        coverageOrder: "PRIMARY",
        coverageType: "COMMERCIAL",
        subscriberRelationship: "SELF",
        insuranceEvidenceIds: ["irrelevant"],
      }),
    ).rejects.toBeInstanceOf(CaseNotFoundError);
  });
});
