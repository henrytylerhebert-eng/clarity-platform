import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaAuthGateway, PrismaCaseCommandGateway } from "@clarity/case-repository";
import { AuthenticationService, LocalDevIdentityProvider } from "@clarity/auth-service";
import { CaseCommandService } from "@clarity/case-service";
import { createApiServer } from "@clarity/api-service";
import type { UserRole } from "@clarity/domain-contracts";
import { createHarness, type Harness } from "./helpers/harness.js";

/**
 * The API vertical slice, exercised over REAL HTTP: authentication via
 * @clarity/auth-service, actors built only through actorFor(), and
 * RecordDecisionRationale exposed end-to-end. This is the first path where
 * the "actor roles are trusted caller input" assumption is retired outside
 * the service layer — the tests below prove a caller cannot smuggle roles,
 * tenancy, or an actor through the HTTP surface.
 */

let h: Harness;
let server: Server;
let baseUrl: string;
let caseKey: string;

const ASSERTIONS = {
  physician: "syn-assert-api-physician-1",
  sysadmin: "syn-assert-api-sysadmin-01",
  tenantB: "syn-assert-api-tenantb-01",
};

async function createRoleUser(label: string, tenant: Harness["tenantA"], roles: UserRole[]) {
  const email = `syn-api-${label}-${h.runId}@example.test`;
  await h.prisma.user.create({
    data: {
      id: `synthetic-user-api-${label}-${h.runId}`,
      organizationId: tenant.organizationId,
      email,
      displayName: `Synthetic API ${label}`,
      roles,
      status: "ACTIVE",
    },
  });
  return email;
}

async function login(assertion: string): Promise<string> {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ assertion }),
  });
  expect(res.status).toBe(200);
  const body = (await res.json()) as { token: string };
  return body.token;
}

function postRationale(token: string, key: string, body: Record<string, unknown>) {
  return fetch(`${baseUrl}/api/cases/${encodeURIComponent(key)}/decision-rationale`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

beforeAll(async () => {
  h = await createHarness();
  const provider = new LocalDevIdentityProvider();
  provider.register(ASSERTIONS.physician, await createRoleUser("physician", h.tenantA, ["PHYSICIAN_REVIEWER"]));
  provider.register(ASSERTIONS.sysadmin, await createRoleUser("sysadmin", h.tenantA, ["SYSTEM_ADMIN"]));
  provider.register(ASSERTIONS.tenantB, await createRoleUser("tenant-b", h.tenantB, ["PHYSICIAN_REVIEWER"]));

  const caseData = h.makeCaseData(h.tenantA, "api-slice");
  caseKey = caseData.caseKey;
  await h.prisma.behavioralHealthCase.create({
    data: {
      id: caseData.caseKey,
      organizationId: caseData.organizationId,
      patientTokenId: caseData.patientTokenId,
      status: "DRAFT",
      urgency: "ROUTINE",
    },
  });

  const auth = new AuthenticationService(provider, new PrismaAuthGateway(h.prisma));
  const caseCommands = new CaseCommandService(new PrismaCaseCommandGateway(h.prisma));
  server = createApiServer({ auth, caseCommands });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("no ephemeral port assigned");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server?.close((e) => (e ? reject(e) : resolve())));
  await h?.dispose();
});

describe("authentication over HTTP", () => {
  it("login returns a token and a principal whose roles come from the database", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ assertion: ASSERTIONS.physician }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: string; principal: { roles: string[]; organizationId: string } };
    expect(body.token).toHaveLength(64);
    expect(body.principal.roles).toEqual(["PHYSICIAN_REVIEWER"]);
    expect(body.principal.organizationId).toBe(h.tenantA.organizationId);

    const session = await fetch(`${baseUrl}/api/auth/session`, {
      headers: { authorization: `Bearer ${body.token}` },
    });
    expect(session.status).toBe(200);
  });

  it("unknown assertions, missing bearers, and garbage tokens all fail with one uniform 401", async () => {
    const badLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ assertion: "syn-assert-never-registered" }),
    });
    expect(badLogin.status).toBe(401);
    expect(await badLogin.json()).toEqual({ error: "authentication_failed" });

    const noBearer = await fetch(`${baseUrl}/api/auth/session`);
    expect(noBearer.status).toBe(401);
    expect(await noBearer.json()).toEqual({ error: "authentication_failed" });

    const garbage = await fetch(`${baseUrl}/api/auth/session`, {
      headers: { authorization: `Bearer ${"0".repeat(64)}` },
    });
    expect(garbage.status).toBe(401);
    expect(await garbage.json()).toEqual({ error: "authentication_failed" });
  });

  it("logout revokes the session; the token stops working immediately", async () => {
    const token = await login(ASSERTIONS.physician);
    const logout = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(logout.status).toBe(204);
    const after = await fetch(`${baseUrl}/api/auth/session`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(after.status).toBe(401);
  });
});

describe("RecordDecisionRationale end to end", () => {
  it("a physician records a rationale citing a legal-status record; the audit event carries the citation and the DB-derived actor", async () => {
    const legalRecord = await h.prisma.legalStatusRecord.create({
      data: {
        caseId: caseKey,
        jurisdiction: "SYN",
        statusType: "INVOLUNTARY_EMERGENCY",
        authorizingAuthority: "Synthetic API physician",
      },
    });

    const token = await login(ASSERTIONS.physician);
    const res = await postRationale(token, caseKey, {
      reason: "Synthetic acceptance decision for the API slice test.",
      decisionContext: "physician_acceptance_review",
      citedLegalStatusRecordId: legalRecord.id,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { caseKey: string; version: number | null; replayed: boolean };
    expect(body.caseKey).toBe(caseKey);
    expect(body.replayed).toBe(false);

    const events = await h.prisma.auditEvent.findMany({
      where: { organizationId: h.tenantA.organizationId, action: "DECISION_RATIONALE_RECORDED" },
    });
    expect(events).toHaveLength(1);
    const flat = JSON.stringify(events[0]!.modelMetadata);
    expect(flat).toContain(legalRecord.id);
    expect(flat).toContain("physician_acceptance_review");
    // The audited actor is the database user behind the session — not anything the caller sent.
    expect(events[0]!.actorId).toBe(`synthetic-user-api-physician-${h.runId}`);
  });

  it("an idempotency key replays instead of double-recording", async () => {
    const token = await login(ASSERTIONS.physician);
    const body = {
      reason: "Replay-safety check.",
      decisionContext: "api_slice_idempotency",
      idempotencyKey: `syn-idem-${h.runId}`,
    };
    const first = await postRationale(token, caseKey, body);
    expect(first.status).toBe(200);
    expect(((await first.json()) as { replayed: boolean }).replayed).toBe(false);
    const second = await postRationale(token, caseKey, body);
    expect(second.status).toBe(200);
    expect(((await second.json()) as { replayed: boolean }).replayed).toBe(true);
  });

  it("a caller cannot smuggle tenancy, roles, or an actor through the body — unknown fields are a 400", async () => {
    const token = await login(ASSERTIONS.physician);
    for (const forged of [
      { organizationId: h.tenantB.organizationId },
      { actor: { actorId: "attacker", roles: ["ORGANIZATION_ADMIN"] } },
      { roles: ["ORGANIZATION_ADMIN"] },
    ]) {
      const res = await postRationale(token, caseKey, {
        reason: "Forgery attempt.",
        decisionContext: "api_slice_forgery",
        ...forged,
      });
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "invalid_request" });
    }
  });

  it("SYSTEM_ADMIN is denied by role policy (403) — platform admin has zero case rights", async () => {
    const token = await login(ASSERTIONS.sysadmin);
    const res = await postRationale(token, caseKey, {
      reason: "Should be denied.",
      decisionContext: "api_slice_denied",
    });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "permission_denied" });
  });

  it("a principal from another tenant cannot see the case at all (404, not 403)", async () => {
    const token = await login(ASSERTIONS.tenantB);
    const res = await postRationale(token, caseKey, {
      reason: "Cross-tenant probe.",
      decisionContext: "api_slice_cross_tenant",
    });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "case_not_found" });
  });
});
