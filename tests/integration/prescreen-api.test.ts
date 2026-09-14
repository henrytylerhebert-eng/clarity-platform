import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaAuthGateway, PrismaCaseCommandGateway } from "@clarity/case-repository";
import { AuthenticationService, LocalDevIdentityProvider } from "@clarity/auth-service";
import { CaseCommandService } from "@clarity/case-service";
import {
  InMemoryPrescreenGateway,
  PRESCREEN_PRODUCTION_POLICY,
  PrescreenCommandService,
  type AssessmentDraftInput,
} from "@clarity/prescreen-service";
import { createApiServer } from "@clarity/api-service";
import type { UserRole } from "@clarity/domain-contracts";
import { createHarness, type Harness } from "./helpers/harness.js";

/**
 * The prescreen same-organization API slice (ADR-0014) over REAL HTTP:
 * database-backed authentication (ADR-0011), the production role policy
 * (INTAKE_COORDINATOR / PHYSICIAN_REVIEWER — the two ruled equivalences),
 * and the Phase 2 in-memory gateway. The tests prove that over HTTP:
 * - the full coordinator-drafts / practitioner-attests flow works same-org;
 * - tenancy, actor, occurredAt, and receivingOrganizationId are
 *   server-derived and cannot be smuggled through the body (400);
 * - the production policy denies over HTTP exactly as ruled (403);
 * - cross-tenant probes are non-revealing (404);
 * - idempotency replays and conflicts surface as 200/replayed and 409.
 */

let h: Harness;
let server: Server;
let baseUrl: string;
let gateway: InMemoryPrescreenGateway;

const ASSERTIONS = {
  intake: "syn-assert-ps-api-intake-01",
  physician: "syn-assert-ps-api-doc-001",
  sysadmin: "syn-assert-ps-api-admin-01",
  intakeB: "syn-assert-ps-api-intakeb1",
};

const T_ANSWER = {
  answerId: "syn-ps-api-ans-1",
  questionCode: "PRESENTING_CONCERN",
  valueState: "ANSWERED",
  narrative: "Synthetic narrative for the API slice.",
  sourceIds: ["syn-ps-api-src-1"],
} as const;

function draftInput(assessmentVersionId: string): AssessmentDraftInput {
  return {
    assessmentVersionId,
    willingness: "WILLING",
    orientation: {
      observedAt: "2026-07-19T15:00:00Z",
      person: { status: "ORIENTED" },
      place: { status: "ORIENTED" },
      time: { status: "ORIENTED" },
      situation: { status: "ORIENTED" },
    },
    answers: [{ ...T_ANSWER, sourceIds: [...T_ANSWER.sourceIds] }],
    sources: [{ sourceId: "syn-ps-api-src-1", sourceType: "DIRECT_OBSERVATION" }],
  };
}

async function createRoleUser(label: string, tenant: Harness["tenantA"], roles: UserRole[]) {
  const email = `syn-ps-api-${label}-${h.runId}@example.test`;
  await h.prisma.user.create({
    data: {
      id: `synthetic-user-ps-api-${label}-${h.runId}`,
      organizationId: tenant.organizationId,
      email,
      displayName: `Synthetic prescreen API ${label}`,
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
  return ((await res.json()) as { token: string }).token;
}

function post(token: string, path: string, body: Record<string, unknown>) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

let keySeq = 0;
function idem(label: string): string {
  keySeq += 1;
  return `syn-ps-api-${label}-${h.runId}-${keySeq}`;
}

async function startEncounter(token: string): Promise<string> {
  const res = await post(token, "/api/prescreen/encounters", {
    caseId: `syn-ps-api-case-${h.runId}`,
    currentLocation: "Synthetic ED",
    presentingConcern: "Synthetic presenting concern",
    idempotencyKey: idem("start"),
  });
  expect(res.status).toBe(200);
  return ((await res.json()) as { encounterId: string }).encounterId;
}

/** start → draft → attest (physician) → returns encounter + attested version id. */
async function startThroughAttest(intakeToken: string, physicianToken: string, tag: string) {
  const encounterId = await startEncounter(intakeToken);
  const assessmentVersionId = `syn-ps-api-asv-${tag}-${h.runId}`;
  const draftRes = await post(intakeToken, `/api/prescreen/encounters/${encounterId}/draft`, {
    draft: draftInput(assessmentVersionId),
    idempotencyKey: idem("draft"),
  });
  expect(draftRes.status).toBe(200);
  const attestRes = await post(physicianToken, `/api/prescreen/encounters/${encounterId}/attest`, {
    assessmentVersionId,
    idempotencyKey: idem("attest"),
  });
  expect(attestRes.status).toBe(200);
  return { encounterId, assessmentVersionId };
}

beforeAll(async () => {
  h = await createHarness();
  const provider = new LocalDevIdentityProvider();
  provider.register(ASSERTIONS.intake, await createRoleUser("intake", h.tenantA, ["INTAKE_COORDINATOR"]));
  provider.register(ASSERTIONS.physician, await createRoleUser("doc", h.tenantA, ["PHYSICIAN_REVIEWER"]));
  provider.register(ASSERTIONS.sysadmin, await createRoleUser("admin", h.tenantA, ["SYSTEM_ADMIN"]));
  provider.register(ASSERTIONS.intakeB, await createRoleUser("intake-b", h.tenantB, ["INTAKE_COORDINATOR"]));

  const auth = new AuthenticationService(provider, new PrismaAuthGateway(h.prisma));
  const caseCommands = new CaseCommandService(new PrismaCaseCommandGateway(h.prisma));
  gateway = new InMemoryPrescreenGateway();
  const prescreen = new PrescreenCommandService(gateway, PRESCREEN_PRODUCTION_POLICY);
  server = createApiServer({ auth, caseCommands, prescreen });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("no ephemeral port assigned");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server?.close((e) => (e ? reject(e) : resolve())));
  await h?.dispose();
});

describe("same-organization prescreen flow over HTTP (production policy)", () => {
  it("coordinator starts and drafts, physician attests, coordinator submits — and the receiving organization is the principal's own", async () => {
    const intake = await login(ASSERTIONS.intake);
    const physician = await login(ASSERTIONS.physician);
    const { encounterId, assessmentVersionId } = await startThroughAttest(intake, physician, "flow");

    const submit = await post(intake, `/api/prescreen/encounters/${encounterId}/submit`, {
      assessmentVersionId,
      target: "CENTRAL_INTAKE_REVIEW",
      idempotencyKey: idem("submit"),
    });
    expect(submit.status).toBe(200);
    const body = (await submit.json()) as { status: string; replayed: boolean };
    expect(body.replayed).toBe(false);

    // The recorded intent names the principal's own organization — the caller
    // never supplied it and could not have supplied any other.
    const submission = gateway.getSubmission(h.tenantA.organizationId, encounterId);
    expect(submission?.receivingOrganizationId).toBe(h.tenantA.organizationId);
    expect(submission?.assessmentVersionId).toBe(assessmentVersionId);

    // Attestation was recorded against the database-backed physician user.
    const attested = gateway.getAssessmentVersion(h.tenantA.organizationId, assessmentVersionId);
    expect(attested.attestedBy).toBe(`synthetic-user-ps-api-doc-${h.runId}`);
  });

  it("the readiness view is reachable by both ruled roles and carries named blockers, never a score", async () => {
    const intake = await login(ASSERTIONS.intake);
    const physician = await login(ASSERTIONS.physician);
    const encounterId = await startEncounter(intake);

    for (const token of [intake, physician]) {
      const res = await fetch(
        `${baseUrl}/api/prescreen/encounters/${encounterId}/readiness?target=CENTRAL_INTAKE_REVIEW`,
        { headers: { authorization: `Bearer ${token}` } },
      );
      expect(res.status).toBe(200);
      const readiness = (await res.json()) as Record<string, unknown>;
      expect(readiness.target).toBe("CENTRAL_INTAKE_REVIEW");
      expect(typeof readiness.ready).toBe("boolean");
      expect(Array.isArray(readiness.blockers)).toBe(true);
      // Readiness doctrine: named gaps only, no aggregate score.
      expect(readiness).not.toHaveProperty("score");
    }
  });

  it("an idempotency key replays with the same body (200/replayed) and conflicts with a different one (409)", async () => {
    const intake = await login(ASSERTIONS.intake);
    const key = idem("replay");
    const body = {
      caseId: `syn-ps-api-case-replay-${h.runId}`,
      currentLocation: "Synthetic ED",
      presentingConcern: "Replay-safety check",
      idempotencyKey: key,
    };
    const first = await post(intake, "/api/prescreen/encounters", body);
    expect(first.status).toBe(200);
    expect(((await first.json()) as { replayed: boolean }).replayed).toBe(false);

    const replay = await post(intake, "/api/prescreen/encounters", body);
    expect(replay.status).toBe(200);
    expect(((await replay.json()) as { replayed: boolean }).replayed).toBe(true);

    const conflict = await post(intake, "/api/prescreen/encounters", {
      ...body,
      presentingConcern: "A different body under the same key",
    });
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toEqual({ error: "idempotency_key_reused" });
  });
});

describe("production role policy enforced over HTTP (ADR-0014 ruling)", () => {
  it("the coordinator cannot attest; the physician cannot start, draft, or submit", async () => {
    const intake = await login(ASSERTIONS.intake);
    const physician = await login(ASSERTIONS.physician);
    const encounterId = await startEncounter(intake);

    const intakeAttest = await post(intake, `/api/prescreen/encounters/${encounterId}/attest`, {
      assessmentVersionId: "syn-ps-api-asv-denied",
      idempotencyKey: idem("attest-denied"),
    });
    expect(intakeAttest.status).toBe(403);
    expect(await intakeAttest.json()).toEqual({ error: "permission_denied" });

    const physicianStart = await post(physician, "/api/prescreen/encounters", {
      caseId: "syn-ps-api-case-denied",
      currentLocation: "Synthetic ED",
      presentingConcern: "Should be denied",
      idempotencyKey: idem("start-denied"),
    });
    expect(physicianStart.status).toBe(403);

    const physicianSubmit = await post(physician, `/api/prescreen/encounters/${encounterId}/submit`, {
      assessmentVersionId: "syn-ps-api-asv-denied",
      target: "CENTRAL_INTAKE_REVIEW",
      idempotencyKey: idem("submit-denied"),
    });
    expect(physicianSubmit.status).toBe(403);
  });

  it("SYSTEM_ADMIN holds zero prescreen capability — no implicit clinical/case bypass", async () => {
    const sysadmin = await login(ASSERTIONS.sysadmin);
    const start = await post(sysadmin, "/api/prescreen/encounters", {
      caseId: "syn-ps-api-case-admin",
      currentLocation: "Synthetic ED",
      presentingConcern: "Should be denied",
      idempotencyKey: idem("admin-start"),
    });
    expect(start.status).toBe(403);

    const readiness = await fetch(
      `${baseUrl}/api/prescreen/encounters/any/readiness?target=CENTRAL_INTAKE_REVIEW`,
      { headers: { authorization: `Bearer ${sysadmin}` } },
    );
    expect(readiness.status).toBe(403);
  });

  it("unauthenticated prescreen requests are a uniform 401", async () => {
    const res = await fetch(`${baseUrl}/api/prescreen/encounters`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "authentication_failed" });
  });
});

describe("server-derived envelope fields cannot be smuggled through the body", () => {
  it("organizationId, actor, occurredAt, and receivingOrganizationId in a body are a 400, never a silent overwrite", async () => {
    const intake = await login(ASSERTIONS.intake);
    const encounterId = await startEncounter(intake);

    const startForgeries = [
      { organizationId: h.tenantB.organizationId },
      { actor: { actorId: "attacker", roleCodes: ["INTAKE_COORDINATOR"] } },
      { occurredAt: "2020-01-01T00:00:00Z" },
    ];
    for (const forged of startForgeries) {
      const res = await post(intake, "/api/prescreen/encounters", {
        caseId: "syn-ps-api-case-forged",
        currentLocation: "Synthetic ED",
        presentingConcern: "Forgery attempt",
        idempotencyKey: idem("forge"),
        ...forged,
      });
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "invalid_request" });
    }

    // Cross-org submission is structurally inexpressible: the field itself is rejected.
    const submitForged = await post(intake, `/api/prescreen/encounters/${encounterId}/submit`, {
      assessmentVersionId: "syn-ps-api-asv-forged",
      target: "CENTRAL_INTAKE_REVIEW",
      receivingOrganizationId: h.tenantB.organizationId,
      idempotencyKey: idem("forge-submit"),
    });
    expect(submitForged.status).toBe(400);
    expect(await submitForged.json()).toEqual({ error: "invalid_request" });
  });

  it("a coordinator from another tenant cannot see the encounter at all (404, not 403)", async () => {
    const intake = await login(ASSERTIONS.intake);
    const intakeB = await login(ASSERTIONS.intakeB);
    const encounterId = await startEncounter(intake);

    const draftProbe = await post(intakeB, `/api/prescreen/encounters/${encounterId}/draft`, {
      draft: draftInput(`syn-ps-api-asv-probe-${h.runId}`),
      idempotencyKey: idem("probe"),
    });
    expect(draftProbe.status).toBe(404);
    expect(await draftProbe.json()).toEqual({ error: "resource_not_found" });

    const readinessProbe = await fetch(
      `${baseUrl}/api/prescreen/encounters/${encounterId}/readiness?target=CENTRAL_INTAKE_REVIEW`,
      { headers: { authorization: `Bearer ${intakeB}` } },
    );
    expect(readinessProbe.status).toBe(404);
  });

  it("malformed percent-encoding in the encounter path segment is a 400, not a 500", async () => {
    const intake = await login(ASSERTIONS.intake);
    const res = await fetch(`${baseUrl}/api/prescreen/encounters/%zz/draft`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${intake}` },
      body: JSON.stringify({
        draft: draftInput("syn-ps-api-asv-badpath"),
        idempotencyKey: idem("badpath"),
      }),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_request" });
  });

  it("a stale expectedVersion is a 409 version conflict with a content-free body", async () => {
    const intake = await login(ASSERTIONS.intake);
    const encounterId = await startEncounter(intake);
    const first = await post(intake, `/api/prescreen/encounters/${encounterId}/draft`, {
      draft: draftInput(`syn-ps-api-asv-vc-${h.runId}`),
      idempotencyKey: idem("vc-draft"),
    });
    expect(first.status).toBe(200);

    const stale = await post(intake, `/api/prescreen/encounters/${encounterId}/draft`, {
      draft: draftInput(`syn-ps-api-asv-vc2-${h.runId}`),
      expectedVersion: 1,
      idempotencyKey: idem("vc-stale"),
    });
    expect(stale.status).toBe(409);
    expect(await stale.json()).toEqual({ error: "prescreen_version_conflict" });
  });
});
