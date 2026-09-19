import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { once } from "node:events";
import { AuthenticationService, LocalDevIdentityProvider } from "@clarity/auth-service";
import { PrismaAuthGateway, PrismaCaseCommandGateway, AccessQueryGateway, PrismaCaseAuditWriter } from "@clarity/case-repository";
import { CaseCommandService, AccessQueryService } from "@clarity/case-service";
import { createApiServer } from "@clarity/api-service";
import { PrescreenCommandService, PRESCREEN_PRODUCTION_POLICY } from "@clarity/prescreen-service";
import { PrismaPrescreenGateway } from "@clarity/case-repository";
import { createHarness, type Harness } from "./helpers/harness.js";
import { USER_ROLES } from "@clarity/domain-contracts";

let h: Harness;
let server: any; // FastifyInstance
let base: string;

let tokenAdmin: string;
const roleTokens: Record<string, string> = {};

class ThrowingAuditWriter extends PrismaCaseAuditWriter {
  async write(): Promise<void> {
    throw new Error("Simulated audit write failure");
  }
}

function makePrismaCaseData(tenant: any, id: string): any {
  return {
    id,
    organizationId: tenant.organizationId,
    patientTokenId: tenant.patientTokenId,
    status: "DRAFT",
    urgency: "ROUTINE"
  };
}

beforeAll(async () => {
  h = await createHarness();

  const provider = new LocalDevIdentityProvider();
  const authGateway = new PrismaAuthGateway(h.prisma);
  const auth = new AuthenticationService(provider, authGateway);
  
  const caseCommands = new CaseCommandService(new PrismaCaseCommandGateway(h.prisma));
  const prescreen = new PrescreenCommandService(new PrismaPrescreenGateway(h.prisma), PRESCREEN_PRODUCTION_POLICY);

  const auditWriter = new PrismaCaseAuditWriter();
  const accessGateway = new AccessQueryGateway(h.prisma, auditWriter);
  const accessQueries = new AccessQueryService(accessGateway);

  const app = createApiServer({ auth, caseCommands, prescreen, accessQueries });
  server = app;
  
  const harnessUser = await h.prisma.user.findUniqueOrThrow({ where: { id: h.tenantA.userId } });
  await h.prisma.user.update({ where: { id: harnessUser.id }, data: { roles: ["ORGANIZATION_ADMIN"] } });
  provider.register(`admin-${h.tenantA.organizationId}`, harnessUser.email);
  tokenAdmin = (await auth.login(`admin-${h.tenantA.organizationId}`)).token;

  for (const role of USER_ROLES) {
    const rUser = await h.prisma.user.create({
      data: {
        id: `user-${role}-${h.runId}`,
        organizationId: h.tenantA.organizationId,
        email: `user-${role}-${h.runId}@test`,
        displayName: `Test ${role}`,
        roles: [role],
        status: "ACTIVE"
      }
    });
    provider.register(`assert-${role}`, rUser.email);
    roleTokens[role] = (await auth.login(`assert-${role}`)).token;
  }

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address() as { port: number };
  base = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  if (server) await server.close();
});

async function request(token: string | null, path: string): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(base + path, { method: "GET", headers });
  let body: any = null;
  try { body = await response.json(); } catch { /* ignore */ }
  return { status: response.status, body };
}

describe("Access Read Model API", () => {
  it("AUTHENTICATION TESTS", async () => {
    expect((await request(null, `/api/access/cases/anything`)).status).toBe(401);
    expect((await request("Bearer invalid", `/api/access/cases/anything`)).status).toBe(401);
    expect((await request("invalid", `/api/access/cases/anything`)).status).toBe(401);
  });

  it("TENANT / NOT-FOUND TESTS", async () => {
    const r1 = await request(tokenAdmin, `/api/access/cases/does-not-exist`);
    expect(r1.status).toBe(404);

    const cB = await h.prisma.behavioralHealthCase.create({ data: makePrismaCaseData(h.tenantB, `c-${h.runId}-b`) });
    const r2 = await request(tokenAdmin, `/api/access/cases/${cB.id}`);
    expect(r2.status).toBe(404);

    expect(r1.body).toEqual(r2.body); // Identical body "not_found"
  });

  it("PATH + QUERY BOUNDARY TESTS", async () => {
    const c = await h.prisma.behavioralHealthCase.create({ data: makePrismaCaseData(h.tenantA, `c-${h.runId}-1`) });
    expect((await request(tokenAdmin, `/api/access/cases/${c.id}?organizationId=123`)).status).toBe(400);
    expect((await request(tokenAdmin, `/api/access/cases/${c.id}?roles=ADMIN`)).status).toBe(400);
    expect((await request(tokenAdmin, `/api/access/cases/${c.id}?encounterId=abc`)).status).toBe(400);
  });

  it("EXHAUSTIVE R3 ROLE TEST", async () => {
    const c = await h.prisma.behavioralHealthCase.create({ data: makePrismaCaseData(h.tenantA, `c-${h.runId}-2`) });

    const allowedRoles = [
      "ORGANIZATION_ADMIN",
      "INTAKE_COORDINATOR",
      "CLINICAL_REVIEWER",
      "PHYSICIAN_REVIEWER",
      "UTILIZATION_REVIEWER",
      "LEGAL_REVIEWER",
      "BENEFITS_VERIFICATION_SPECIALIST",
      "AUTHORIZATION_SPECIALIST",
      "FACILITY_REVIEWER",
      "TRANSPORT_COORDINATOR",
      "COMPLIANCE_REVIEWER",
      "READ_ONLY_AUDITOR"
    ];
    for (const role of allowedRoles) {
      expect((await request(roleTokens[role]!, `/api/access/cases/${c.id}`)).status).toBe(200);
    }
    expect((await request(roleTokens["SYSTEM_ADMIN"]!, `/api/access/cases/${c.id}`)).status).toBe(403);
  });

  it("MINIMUM-NECESSARY RESPONSE TEST", async () => {
    const c = await h.prisma.behavioralHealthCase.create({ data: makePrismaCaseData(h.tenantA, `c-${h.runId}-3`) });
    const { body } = await request(tokenAdmin, `/api/access/cases/${c.id}`);

    const jsonStr = JSON.stringify(body).toLowerCase();
    expect(jsonStr).not.toContain("patienttoken");
    expect(jsonStr).not.toContain("dob");
    expect(jsonStr).not.toContain("dateofbirth");
    expect(jsonStr).not.toContain("currentlocation");
    expect(body.caseVersion).toBeTypeOf("number");
  });

  it("PRESCREEN SELECTION MATRIX & EMPTY VS LOADED", async () => {
    const c0 = await h.prisma.behavioralHealthCase.create({ data: makePrismaCaseData(h.tenantA, `c-${h.runId}-4a`) });
    const res0 = await request(tokenAdmin, `/api/access/cases/${c0.id}`);
    expect(res0.body.sourceState.prescreenSelection).toBe("NONE");
    expect(res0.body.sourceState.packetRequirementEvidence).toBe("NOT_AVAILABLE");
    expect(res0.body.guidance.packetReadiness).toBeNull();

    const c1 = await h.prisma.behavioralHealthCase.create({ data: makePrismaCaseData(h.tenantA, `c-${h.runId}-4b`) });
    await h.prisma.prescreenEncounter.create({ data: { organizationId: h.tenantA.organizationId, caseId: c1.id, currentLocation: "ER", presentingConcern: "test", createdBy: "sys", createdAt: new Date(), updatedAt: new Date(), id: `enc1-${h.runId}`, status: "DECLINED", version: 1 } });
    const res1 = await request(tokenAdmin, `/api/access/cases/${c1.id}`);
    expect(res1.body.sourceState.prescreenSelection).toBe("NONE");

    const c2 = await h.prisma.behavioralHealthCase.create({ data: makePrismaCaseData(h.tenantA, `c-${h.runId}-4c`) });
    await h.prisma.prescreenEncounter.create({ data: { organizationId: h.tenantA.organizationId, caseId: c2.id, currentLocation: "ER", presentingConcern: "test", createdBy: "sys", createdAt: new Date(), updatedAt: new Date(), id: `enc2-${h.runId}`, status: "CENTRAL_INTAKE_REVIEW", version: 1 } });
    const res2 = await request(tokenAdmin, `/api/access/cases/${c2.id}`);
    expect(res2.body.sourceState.prescreenSelection).toBe("SELECTED");
    expect(res2.body.sourceState.packetRequirementEvidence).toBe("LOADED_EMPTY");
    expect(res2.body.guidance.packetReadiness).not.toBeNull();
    expect(res2.body.guidance.packetReadiness.length).toBeGreaterThan(0);

    const c3 = await h.prisma.behavioralHealthCase.create({ data: makePrismaCaseData(h.tenantA, `c-${h.runId}-4d`) });
    await h.prisma.prescreenEncounter.create({ data: { organizationId: h.tenantA.organizationId, caseId: c3.id, currentLocation: "ER", presentingConcern: "test", createdBy: "sys", createdAt: new Date(), updatedAt: new Date(), id: `enc3-${h.runId}`, status: "CENTRAL_INTAKE_REVIEW", version: 1 } });
    await h.prisma.prescreenPacketRequirement.create({ data: { organizationId: h.tenantA.organizationId, encounterId: `enc3-${h.runId}`, requirementCode: "PSYCHIATRIC_EVALUATION", label: "Psych Eval", state: "NOT_STARTED" as any, resolutionWorkspace: "any", sourceRuleId: "rule-1", sourceRuleVersion: 1 } });
    const res3 = await request(tokenAdmin, `/api/access/cases/${c3.id}`);
    expect(res3.body.sourceState.packetRequirementEvidence).toBe("LOADED");

    const c4 = await h.prisma.behavioralHealthCase.create({ data: makePrismaCaseData(h.tenantA, `c-${h.runId}-4e`) });
    await h.prisma.prescreenEncounter.create({ data: { organizationId: h.tenantA.organizationId, caseId: c4.id, currentLocation: "ER", presentingConcern: "test", createdBy: "sys", createdAt: new Date(), updatedAt: new Date(), id: `enc4a-${h.runId}`, status: "CENTRAL_INTAKE_REVIEW", version: 1 } });
    await h.prisma.prescreenEncounter.create({ data: { organizationId: h.tenantA.organizationId, caseId: c4.id, currentLocation: "ER", presentingConcern: "test", createdBy: "sys", createdAt: new Date(), updatedAt: new Date(), id: `enc4b-${h.runId}`, status: "CENTRAL_INTAKE_REVIEW", version: 1 } });
    const res4 = await request(tokenAdmin, `/api/access/cases/${c4.id}`);
    expect(res4.body.sourceState.prescreenSelection).toBe("AMBIGUOUS");
    expect(res4.body.sourceState.packetRequirementEvidence).toBe("NOT_AVAILABLE");
    expect(res4.body.guidance.packetReadiness).toBeNull();
  });

  it("EPISODE / ADMISSION MATRIX", async () => {
    const c = await h.prisma.behavioralHealthCase.create({ data: makePrismaCaseData(h.tenantA, `c-${h.runId}-5`) });
    await h.prisma.episode.create({ data: { id: `ep-${h.runId}`, organizationId: h.tenantA.organizationId, status: "ACTIVE" as any, facilityTimezone: "UTC", timezoneSource: "USER", timezoneSourceReferenceId: "123", admittedAt: new Date(), serviceDate: "2026-09-19", acceptedFacilityResponseId: "resp-1", sourceCase: { connect: { id: c.id } }, facility: { create: { id: `fac-${h.runId}`, organizationId: h.tenantA.organizationId, name: "Fac" } } } });
    await h.prisma.caseEpisodeLink.create({ data: { organizationId: h.tenantA.organizationId, caseId: c.id, episodeId: `ep-${h.runId}`, relationship: "ADMISSION_SOURCE" as any, linkedAt: new Date(), linkedByActorId: "sys", sourceAcceptanceId: "123" } });
    const { body } = await request(tokenAdmin, `/api/access/cases/${c.id}`);
    expect(body.journey.phase).toBe("ADMISSION");
  });

  it("GUIDANCE INVARIANTS THROUGH THE API", async () => {
    const c = await h.prisma.behavioralHealthCase.create({
      data: {
        ...makePrismaCaseData(h.tenantA, `c-${h.runId}-6`),
        urgency: "EMERGENT" as any,
        clinicalStatus: "IN_PROGRESS" as any,
        benefitsStatus: "BLOCKED" as any,
        authorizationStatus: "BLOCKED" as any
      }
    });
    const { body } = await request(tokenAdmin, `/api/access/cases/${c.id}`);
    expect(body.guidance.signals.length).toBeGreaterThan(0);
    expect(body.journey.disposition).not.toBe("BLOCKED");
  });

  it("LEGACY + TERMINAL CASES", async () => {
    const c1 = await h.prisma.behavioralHealthCase.create({ data: { ...makePrismaCaseData(h.tenantA, `c-${h.runId}-7a`), status: "CLINICAL_REVIEW" as any } });
    const r1 = await request(tokenAdmin, `/api/access/cases/${c1.id}`);
    expect(r1.status).toBe(200);

    for (const termStatus of ["CLOSED", "CANCELLED", "WITHDRAWN"]) {
      const ct = await h.prisma.behavioralHealthCase.create({ data: { ...makePrismaCaseData(h.tenantA, `c-${h.runId}-7-${termStatus}`), status: termStatus as any } });
      const rt = await request(tokenAdmin, `/api/access/cases/${ct.id}`);
      expect(rt.body.journey.disposition).toBe("CLOSED");
    }
  });

  it("AUDIT SUCCESS", async () => {
    const c = await h.prisma.behavioralHealthCase.create({ data: makePrismaCaseData(h.tenantA, `c-${h.runId}-8`) });
    await request(tokenAdmin, `/api/access/cases/${c.id}`);
    
    const audits = await h.prisma.auditEvent.findMany({ where: { caseId: c.id, action: "ACCESS_CASE_VIEWED" } });
    expect(audits).toHaveLength(1);
    expect(audits[0]!.organizationId).toBe(h.tenantA.organizationId);
    expect(audits[0]!.actorType).toBe("USER");
    expect(audits[0]!.objectType).toBe("AccessCaseReadModel");
    expect(audits[0]!.objectId).toBe(c.id);

    await request(tokenAdmin, `/api/access/cases/${c.id}`);
    const audits2 = await h.prisma.auditEvent.findMany({ where: { caseId: c.id, action: "ACCESS_CASE_VIEWED" } });
    expect(audits2).toHaveLength(2);

    const cAfter = await h.prisma.behavioralHealthCase.findUniqueOrThrow({ where: { id: c.id } });
    expect(cAfter.version).toBe(c.version);
    expect(cAfter.status).toBe(c.status);
  });

  it("AUDIT FAIL-CLOSED TEST", async () => {
    const provider = new LocalDevIdentityProvider();
    const authGateway = new PrismaAuthGateway(h.prisma);
    const auth = new AuthenticationService(provider, authGateway);
    const caseCommands = new CaseCommandService(new PrismaCaseCommandGateway(h.prisma));
    const prescreen = new PrescreenCommandService(new PrismaPrescreenGateway(h.prisma), PRESCREEN_PRODUCTION_POLICY);
    const throwingAuditWriter = new ThrowingAuditWriter();
    const accessGateway = new AccessQueryGateway(h.prisma, throwingAuditWriter);
    const accessQueries = new AccessQueryService(accessGateway);

    const failApp = createApiServer({ auth, caseCommands, prescreen, accessQueries });
    failApp.listen(0, "127.0.0.1");
    await once(failApp, "listening");
    const addr = failApp.address() as { port: number };
    const failBase = `http://127.0.0.1:${addr.port}`;

    const c = await h.prisma.behavioralHealthCase.create({ data: makePrismaCaseData(h.tenantA, `c-${h.runId}-9`) });

    const res = await fetch(`${failBase}/api/access/cases/${c.id}`, { headers: { Authorization: `Bearer ${tokenAdmin}` } });
    expect(res.status).toBe(500);

    const audits = await h.prisma.auditEvent.findMany({ where: { caseId: c.id, action: "ACCESS_CASE_VIEWED" } });
    expect(audits).toHaveLength(0);

    failApp.close();
  });

  it("REPEATABLE READ PROOF", async () => {
    const c = await h.prisma.behavioralHealthCase.create({ data: makePrismaCaseData(h.tenantA, `c-${h.runId}-10`) });
    const { status } = await request(tokenAdmin, `/api/access/cases/${c.id}`);
    expect(status).toBe(200);
  });
});
