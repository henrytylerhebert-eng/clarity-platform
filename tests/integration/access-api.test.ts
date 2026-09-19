import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { once } from "node:events";
import { AuthenticationService, LocalDevIdentityProvider } from "@clarity/auth-service";
import { PrismaAuthGateway, PrismaCaseCommandGateway, AccessQueryGateway } from "@clarity/case-repository";
import { CaseCommandService, AccessQueryService } from "@clarity/case-service";
import { createApiServer } from "@clarity/api-service";
import { InMemoryPrescreenGateway, PrescreenCommandService, PRESCREEN_PRODUCTION_POLICY } from "@clarity/prescreen-service";
import { PrismaCaseAuditWriter } from "../../packages/case-repository/src/auditWriter.js";
import { createHarness, type Harness } from "./helpers/harness.js";

let h: Harness;
let server: any; // FastifyInstance
let base: string;

let tokenAdmin: string;
let tokenViewer: string;
let tokenDenied: string;
let tokenOtherOrg: string;

beforeAll(async () => {
  h = await createHarness();

  const provider = new LocalDevIdentityProvider();
  const authGateway = new PrismaAuthGateway(h.prisma);
  const auth = new AuthenticationService(provider, authGateway);
  
  const caseCommands = new CaseCommandService(new PrismaCaseCommandGateway(h.prisma));
  const prescreen = new PrescreenCommandService(new InMemoryPrescreenGateway(), PRESCREEN_PRODUCTION_POLICY);

  const auditWriter = new PrismaCaseAuditWriter();
  const accessGateway = new AccessQueryGateway(h.prisma, auditWriter);
  const accessQueries = new AccessQueryService(accessGateway);

  const viewer = await h.prisma.user.create({
    data: { id: `viewer-${h.runId}`, organizationId: h.tenantA.organizationId, email: `viewer-${h.runId}@test`, displayName: "Viewer", roles: ["CLINICAL_REVIEWER"] }
  });

  const denied = await h.prisma.user.create({
    data: { id: `denied-${h.runId}`, organizationId: h.tenantA.organizationId, email: `denied-${h.runId}@test`, displayName: "Denied", roles: ["SYSTEM_ADMIN"] }
  });

  await h.prisma.user.update({
    where: { id: h.tenantA.userId },
    data: { roles: ["ORGANIZATION_ADMIN"] }
  });
  
  provider.register(`admin-${h.tenantA.organizationId}`, h.tenantA.userId + "@test.clarity"); // the harness created user email usually 
  // Let's actually just fetch the harness user to be safe:
  const harnessUser = await h.prisma.user.findUniqueOrThrow({ where: { id: h.tenantA.userId } });
  provider.register(`admin-${h.tenantA.organizationId}`, harnessUser.email);

  provider.register(`viewer-${h.runId}`, viewer.email);
  provider.register(`denied-${h.runId}`, denied.email);
  
  const otherUser = await h.prisma.user.findUniqueOrThrow({ where: { id: h.tenantB.userId } });
  provider.register(`other-${h.tenantB.organizationId}`, otherUser.email);

  tokenAdmin = (await auth.login(`admin-${h.tenantA.organizationId}`)).token;
  tokenViewer = (await auth.login(`viewer-${h.runId}`)).token;
  tokenDenied = (await auth.login(`denied-${h.runId}`)).token;
  tokenOtherOrg = (await auth.login(`other-${h.tenantB.organizationId}`)).token;

  server = createApiServer({ auth, caseCommands, prescreen, accessQueries });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  
    const address = server.address() as any;
  base = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  if (server) await server.close();
});

async function request(token: string, path: string): Promise<{ status: number; body: any }> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const response = await fetch(base + path, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: response.status, body: await response.json() };
}

describe("Access Read Model API", () => {
  it("rejects unauthorized users with SYSTEM_ADMIN role", async () => {
    const { status } = await request(tokenDenied, `/api/access/cases/some-case-key`);
    expect(status).toBe(403);
  });

  it("returns 404 for case in other org", async () => {
    const caseRecord = await h.prisma.behavioralHealthCase.create({
      data: {
        organizationId: h.tenantA.organizationId,
        patientTokenId: "pt-123",
        status: "DRAFT"
      }
    });
    const { status } = await request(tokenOtherOrg, `/api/access/cases/${caseRecord.id}`);
    expect(status).toBe(404);
  });

  it("permits ORGANIZATION_ADMIN and audits read", async () => {
    const caseRecord = await h.prisma.behavioralHealthCase.create({
      data: {
        organizationId: h.tenantA.organizationId,
        patientTokenId: "pt-123",
        status: "DRAFT"
      }
    });

    const { status, body } = await request(tokenAdmin, `/api/access/cases/${caseRecord.id}`);
    expect(status).toBe(200);
    expect(body.caseKey).toBe(caseRecord.id);

    const audits = await h.prisma.auditEvent.findMany({
      where: { caseId: caseRecord.id, action: "ACCESS_CASE_VIEWED" }
    });
    expect(audits.length).toBe(1);
  });

  it("permits CLINICAL_REVIEWER and maps DTO correctly", async () => {
    const caseRecord = await h.prisma.behavioralHealthCase.create({
      data: {
        organizationId: h.tenantA.organizationId,
        patientTokenId: "pt-124",
        status: "REVIEW_IN_PROGRESS"
      }
    });

    const { status, body } = await request(tokenViewer, `/api/access/cases/${caseRecord.id}`);
    expect(status).toBe(200);
    expect(body.sourceState.caseStatus).toBe("REVIEW_IN_PROGRESS");
    expect(body.sourceState.prescreenSelection).toBe("NONE");
    expect(body.sourceState.packetRequirementEvidence).toBe("NOT_AVAILABLE");
  });
});
