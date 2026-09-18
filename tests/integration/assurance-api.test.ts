import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { UserRole } from "@clarity/domain-contracts";
import {
  PrismaAssuranceGateway,
  PrismaAuthGateway,
  PrismaCaseCommandGateway,
} from "@clarity/case-repository";
import { AuthenticationService, LocalDevIdentityProvider } from "@clarity/auth-service";
import { CaseCommandService } from "@clarity/case-service";
import {
  InMemoryPrescreenGateway,
  PRESCREEN_PRODUCTION_POLICY,
  PrescreenCommandService,
} from "@clarity/prescreen-service";
import { createApiServer } from "@clarity/api-service";
import {
  AssuranceCommandService,
  AssuranceQueryService,
} from "../../packages/assurance-service/src/index.js";
import { createHarness, tickingClock, type Harness, type TenantFixture } from "./helpers/harness.js";

let h: Harness;
let provider: LocalDevIdentityProvider;
let gateway: PrismaAssuranceGateway;
let server: Server;
let baseUrl: string;

interface ApiUser {
  readonly id: string;
  readonly assertion: string;
}

interface ApiFixture {
  readonly tenant: TenantFixture;
  readonly caseKey: string;
  readonly assuranceCaseId: string;
  readonly expectationId: string;
  readonly sourceId: string;
  readonly contributor: ApiUser;
  readonly reviewer: ApiUser;
  readonly globalOnly: ApiUser;
  readonly scopedOnly: ApiUser;
  readonly systemAdmin: ApiUser;
  readonly unassigned: ApiUser;
  readonly tenantB: ApiUser;
}

async function createUser(
  tenant: TenantFixture,
  label: string,
  roles: readonly UserRole[] = [],
): Promise<ApiUser> {
  const id = `oa-api-${label}-${h.runId}`;
  const email = `${label}-${h.runId}@example.test`;
  const assertion = `syn-oa-api-${label}-${h.runId}`;
  await h.prisma.user.create({
    data: {
      id,
      organizationId: tenant.organizationId,
      email,
      displayName: `OA API ${label}`,
      roles: [...roles],
      status: "ACTIVE",
    },
  });
  provider.register(assertion, email);
  return { id, assertion };
}

async function buildFixture(label: string): Promise<ApiFixture> {
  const tenant = h.tenantA;
  const setupActor = { actorType: "USER" as const, actorId: tenant.userId };
  const facility = await h.prisma.facilityProfile.create({
    data: {
      organizationId: tenant.organizationId,
      name: `OA API ${label} ${h.runId}`,
      programs: [],
      acceptedCoverageTypes: [],
      medicalCapabilities: [],
      exclusionCriteria: [],
      legalStatusCapabilities: [],
      transportationRules: [],
      referralRequirements: [],
    },
  });

  const contributor = await createUser(tenant, `${label}-contributor`);
  const reviewer = await createUser(tenant, `${label}-reviewer`, ["COMPLIANCE_REVIEWER"]);
  const globalOnly = await createUser(tenant, `${label}-global-only`, ["COMPLIANCE_REVIEWER"]);
  const scopedOnly = await createUser(tenant, `${label}-scoped-only`);
  const systemAdmin = await createUser(tenant, `${label}-sysadmin`, ["SYSTEM_ADMIN"]);
  const unassigned = await createUser(tenant, `${label}-unassigned`);
  const tenantB = await createUser(h.tenantB, `${label}-tenant-b`, ["COMPLIANCE_REVIEWER"]);

  const assuranceCase = await gateway.createCase(
    tenant.organizationId,
    {
      facilityProfileId: facility.id,
      caseKey: `oa-api-${label}-${h.runId}`,
      title: `OA API ${label}`,
      assuranceStatement: "Synthetic evidence is required for the API contract.",
    },
    setupActor,
  );

  await gateway.addParticipant(
    tenant.organizationId,
    { assuranceCaseId: assuranceCase.id, userId: contributor.id, role: "EVIDENCE_CONTRIBUTOR" },
    setupActor,
  );
  await gateway.addParticipant(
    tenant.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      userId: reviewer.id,
      role: "QUALIFIED_REVIEWER",
      authorityBasis: "Synthetic API reviewer authority",
    },
    setupActor,
  );
  await gateway.addParticipant(
    tenant.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      userId: scopedOnly.id,
      role: "QUALIFIED_REVIEWER",
      authorityBasis: "Synthetic scoped-only authority",
    },
    setupActor,
  );
  await gateway.addParticipant(
    tenant.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      userId: systemAdmin.id,
      role: "QUALIFIED_REVIEWER",
      authorityBasis: "Synthetic sysadmin scoped authority",
    },
    setupActor,
  );

  await gateway.recordApplicabilityDecision(
    tenant.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      status: "APPROVED",
      rationale: "Synthetic API applicability approved.",
    },
    setupActor,
  );
  const source = await gateway.addSourceReference(
    tenant.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      sourceFamilyKey: `SYN-API-${label}`,
      versionLabel: "v1",
      title: "Synthetic API authority",
      authorityClass: "FEDERAL_REGULATION",
      citation: `SYN-API-${label}-CITATION`,
      currentness: "CURRENT",
      rightsStatus: "PERMITTED",
    },
    setupActor,
  );
  await gateway.addDocumentReference(
    tenant.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      kind: "POLICY",
      referenceKey: `SYN-API-${label}-POLICY`,
      title: "Synthetic API policy",
      versionLabel: "v1",
    },
    setupActor,
  );
  await gateway.addDocumentReference(
    tenant.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      kind: "SOP",
      referenceKey: `SYN-API-${label}-SOP`,
      title: "Synthetic API SOP",
      versionLabel: "v1",
    },
    setupActor,
  );
  const expectation = await gateway.addEvidenceExpectation(
    tenant.organizationId,
    {
      assuranceCaseId: assuranceCase.id,
      code: `API_${label.toUpperCase().replaceAll("-", "_")}`,
      prompt: "Provide date, owner, and follow-up status.",
      requiredKeys: ["roundDate", "owner", "followUpStatus"],
    },
    setupActor,
  );

  return {
    tenant,
    caseKey: assuranceCase.caseKey,
    assuranceCaseId: assuranceCase.id,
    expectationId: expectation.id,
    sourceId: source.id,
    contributor,
    reviewer,
    globalOnly,
    scopedOnly,
    systemAdmin,
    unassigned,
    tenantB,
  };
}

async function login(assertion: string): Promise<string> {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ assertion }),
  });
  expect(response.status).toBe(200);
  return ((await response.json()) as { token: string }).token;
}

function authHeaders(token: string) {
  return {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };
}

async function submitComplete(f: ApiFixture, token: string, payloadExtra: Record<string, unknown> = {}) {
  return fetch(`${baseUrl}/api/assurance/cases/${encodeURIComponent(f.caseKey)}/evidence`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      expectationId: f.expectationId,
      payload: {
        roundDate: "2026-09-13",
        owner: "Synthetic Owner",
        followUpStatus: "COMPLETE",
        ...payloadExtra,
      },
    }),
  });
}

async function evaluate(f: ApiFixture, token: string) {
  return fetch(`${baseUrl}/api/assurance/cases/${encodeURIComponent(f.caseKey)}/evaluate`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ expectationId: f.expectationId }),
  });
}

beforeAll(async () => {
  h = await createHarness();
  provider = new LocalDevIdentityProvider();
  const auth = new AuthenticationService(provider, new PrismaAuthGateway(h.prisma));
  gateway = new PrismaAssuranceGateway(h.prisma, undefined, tickingClock());
  const assuranceCommands = new AssuranceCommandService(gateway);
  const assuranceQueries = new AssuranceQueryService(gateway);
  const caseCommands = new CaseCommandService(new PrismaCaseCommandGateway(h.prisma));
  const prescreen = new PrescreenCommandService(new InMemoryPrescreenGateway(), PRESCREEN_PRODUCTION_POLICY);
  const assuranceEvaluationCaseResolver = async (organizationId: string, evaluationId: string) => {
    const row = await h.prisma.assuranceEvaluation.findFirst({
      where: { id: evaluationId, organizationId },
      select: { assuranceCase: { select: { caseKey: true } } },
    });
    return row?.assuranceCase.caseKey;
  };

  server = createApiServer({
    auth,
    caseCommands,
    prescreen,
    assuranceCommands,
    assuranceQueries,
    assuranceEvaluationCaseResolver,
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("no ephemeral port assigned");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server?.close((error) => (error ? reject(error) : resolve())));
  await h?.dispose();
});

describe("Operating Assurance authenticated Fastify API", () => {
  it("requires authentication on every OA route", async () => {
    const requests = [
      fetch(`${baseUrl}/api/assurance/cases/no-case`),
      fetch(`${baseUrl}/api/assurance/cases/no-case/history`),
      fetch(`${baseUrl}/api/assurance/cases/no-case/evidence`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expectationId: "x", payload: {} }),
      }),
      fetch(`${baseUrl}/api/assurance/cases/no-case/evidence/revisions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ priorSubmissionId: "x", payload: {} }),
      }),
      fetch(`${baseUrl}/api/assurance/cases/no-case/evaluate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expectationId: "x" }),
      }),
      fetch(`${baseUrl}/api/assurance/evaluations/no-evaluation/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision: "ACCEPT" }),
      }),
    ];
    for (const response of await Promise.all(requests)) {
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "authentication_failed" });
    }
  });

  it("strict bodies reject caller-supplied tenancy, roles, actor identity, authority, and timestamps", async () => {
    const f = await buildFixture("strict-bodies");
    const contributorToken = await login(f.contributor.assertion);
    const reviewerToken = await login(f.reviewer.assertion);
    const forgedFields = [
      { organizationId: h.tenantB.organizationId },
      { roles: ["COMPLIANCE_REVIEWER"] },
      { actor: { actorId: "attacker" } },
      { authorityBasis: "forged" },
      { reviewerUserId: f.reviewer.id },
      { occurredAt: "2026-09-13T00:00:00Z" },
    ];

    for (const forged of forgedFields) {
      const evidence = await fetch(`${baseUrl}/api/assurance/cases/${f.caseKey}/evidence`, {
        method: "POST",
        headers: authHeaders(contributorToken),
        body: JSON.stringify({ expectationId: f.expectationId, payload: {}, ...forged }),
      });
      expect(evidence.status).toBe(400);
      expect(await evidence.json()).toEqual({ error: "invalid_request" });

      const evaluateResponse = await fetch(`${baseUrl}/api/assurance/cases/${f.caseKey}/evaluate`, {
        method: "POST",
        headers: authHeaders(contributorToken),
        body: JSON.stringify({ expectationId: f.expectationId, ...forged }),
      });
      expect(evaluateResponse.status).toBe(400);
      expect(await evaluateResponse.json()).toEqual({ error: "invalid_request" });

      const review = await fetch(`${baseUrl}/api/assurance/evaluations/not-real/review`, {
        method: "POST",
        headers: authHeaders(reviewerToken),
        body: JSON.stringify({ decision: "ACCEPT", ...forged }),
      });
      expect(review.status).toBe(400);
      expect(await review.json()).toEqual({ error: "invalid_request" });
    }
  });

  it("allows an assigned contributor to submit and revise evidence while denying an unassigned same-tenant user", async () => {
    const f = await buildFixture("contributor");
    const contributorToken = await login(f.contributor.assertion);
    const unassignedToken = await login(f.unassigned.assertion);

    const submittedResponse = await submitComplete(f, contributorToken);
    expect(submittedResponse.status).toBe(200);
    const submitted = (await submittedResponse.json()) as { id: string; status: string; version: number };
    expect(submitted.status).toBe("SUBMITTED");
    expect(submitted.version).toBe(1);

    const revised = await fetch(`${baseUrl}/api/assurance/cases/${f.caseKey}/evidence/revisions`, {
      method: "POST",
      headers: authHeaders(contributorToken),
      body: JSON.stringify({
        priorSubmissionId: submitted.id,
        payload: { roundDate: "2026-09-13", owner: "Revised", followUpStatus: "COMPLETE" },
      }),
    });
    expect(revised.status).toBe(200);
    expect(((await revised.json()) as { version: number }).version).toBe(2);

    const denied = await submitComplete(f, unassignedToken);
    expect(denied.status).toBe(403);
    expect(await denied.json()).toEqual({ error: "assurance_permission_denied" });
  });

  it("preserves deterministic fail-closed evaluation over HTTP", async () => {
    const f = await buildFixture("evaluation");
    const token = await login(f.contributor.assertion);
    expect((await submitComplete(f, token)).status).toBe(200);

    const supported = await evaluate(f, token);
    expect(supported.status).toBe(200);
    const supportedBody = (await supported.json()) as { result: string; requiresHumanReview: boolean };
    expect(supportedBody.result).toBe("SUPPORTED");
    expect(supportedBody.requiresHumanReview).toBe(true);

    await gateway.setSourceCurrentness(
      f.tenant.organizationId,
      f.sourceId,
      "STALE",
      { actorType: "USER", actorId: f.tenant.userId },
    );
    const stale = await evaluate(f, token);
    expect(stale.status).toBe(200);
    expect(((await stale.json()) as { result: string }).result).toBe("STALE_SOURCE");
  });

  it("final review requires both global and case-scoped reviewer grants; SYSTEM_ADMIN does not bypass", async () => {
    const f = await buildFixture("review-authority");
    const contributorToken = await login(f.contributor.assertion);
    expect((await submitComplete(f, contributorToken)).status).toBe(200);
    const evaluationResponse = await evaluate(f, contributorToken);
    const evaluation = (await evaluationResponse.json()) as { id: string };

    for (const user of [f.globalOnly, f.scopedOnly, f.systemAdmin]) {
      const token = await login(user.assertion);
      const denied = await fetch(`${baseUrl}/api/assurance/evaluations/${evaluation.id}/review`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ decision: "ACCEPT" }),
      });
      expect(denied.status).toBe(403);
      expect(await denied.json()).toEqual({ error: "assurance_permission_denied" });
    }

    const reviewerToken = await login(f.reviewer.assertion);
    const accepted = await fetch(`${baseUrl}/api/assurance/evaluations/${evaluation.id}/review`, {
      method: "POST",
      headers: authHeaders(reviewerToken),
      body: JSON.stringify({ decision: "ACCEPT" }),
    });
    expect(accepted.status).toBe(200);
    expect(((await accepted.json()) as { decision: string }).decision).toBe("ACCEPT");
  });

  it("maps superseded evaluation review to a content-free 409", async () => {
    const f = await buildFixture("stale-review");
    const contributorToken = await login(f.contributor.assertion);
    const reviewerToken = await login(f.reviewer.assertion);
    expect((await submitComplete(f, contributorToken)).status).toBe(200);
    const first = (await (await evaluate(f, contributorToken)).json()) as { id: string };
    const second = (await (await evaluate(f, contributorToken)).json()) as { id: string };
    expect(second.id).not.toBe(first.id);

    const staleReview = await fetch(`${baseUrl}/api/assurance/evaluations/${first.id}/review`, {
      method: "POST",
      headers: authHeaders(reviewerToken),
      body: JSON.stringify({ decision: "ACCEPT" }),
    });
    expect(staleReview.status).toBe(409);
    expect(await staleReview.json()).toEqual({ error: "review_requires_current_evaluation" });
  });

  it("returns non-revealing 404s for cross-tenant case and evaluation probes", async () => {
    const f = await buildFixture("tenant-isolation");
    const contributorToken = await login(f.contributor.assertion);
    const tenantBToken = await login(f.tenantB.assertion);
    expect((await submitComplete(f, contributorToken)).status).toBe(200);
    const evaluation = (await (await evaluate(f, contributorToken)).json()) as { id: string };

    for (const path of [
      `/api/assurance/cases/${f.caseKey}`,
      `/api/assurance/cases/${f.caseKey}/history`,
    ]) {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: { authorization: `Bearer ${tenantBToken}` },
      });
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "assurance_resource_not_found" });
    }

    const reviewProbe = await fetch(`${baseUrl}/api/assurance/evaluations/${evaluation.id}/review`, {
      method: "POST",
      headers: authHeaders(tenantBToken),
      body: JSON.stringify({ decision: "ACCEPT" }),
    });
    expect(reviewProbe.status).toBe(404);
    expect(await reviewProbe.json()).toEqual({ error: "assurance_resource_not_found" });
  });

  it("keeps error bodies free of evidence payloads and internal stack content", async () => {
    const f = await buildFixture("error-hygiene");
    const contributorToken = await login(f.contributor.assertion);
    const unassignedToken = await login(f.unassigned.assertion);
    expect((await submitComplete(f, contributorToken, { secretMarker: "RAW-SECRET-MARKER" })).status).toBe(200);

    const denied = await fetch(`${baseUrl}/api/assurance/cases/${f.caseKey}`, {
      headers: { authorization: `Bearer ${unassignedToken}` },
    });
    expect(denied.status).toBe(403);
    const text = await denied.text();
    expect(text).toBe(JSON.stringify({ error: "assurance_permission_denied" }));
    expect(text).not.toContain("RAW-SECRET-MARKER");
    expect(text.toLowerCase()).not.toContain("stack");
    expect(text).not.toContain("Prisma");
  });

  it("history remains tenant-scoped and preserves prior evidence, evaluations, and review decisions", async () => {
    const f = await buildFixture("history");
    const contributorToken = await login(f.contributor.assertion);
    const reviewerToken = await login(f.reviewer.assertion);
    expect((await submitComplete(f, contributorToken)).status).toBe(200);
    const first = (await (await evaluate(f, contributorToken)).json()) as { id: string };
    const review = await fetch(`${baseUrl}/api/assurance/evaluations/${first.id}/review`, {
      method: "POST",
      headers: authHeaders(reviewerToken),
      body: JSON.stringify({ decision: "ACCEPT" }),
    });
    expect(review.status).toBe(200);
    const second = (await (await evaluate(f, contributorToken)).json()) as { id: string };
    expect(second.id).not.toBe(first.id);

    const historyResponse = await fetch(`${baseUrl}/api/assurance/cases/${f.caseKey}/history`, {
      headers: { authorization: `Bearer ${contributorToken}` },
    });
    expect(historyResponse.status).toBe(200);
    const history = (await historyResponse.json()) as Array<{ kind: string; id: string; state: string }>;
    expect(history.some((entry) => entry.kind === "EVIDENCE")).toBe(true);
    expect(history.filter((entry) => entry.kind === "EVALUATION").map((entry) => entry.id)).toEqual(
      expect.arrayContaining([first.id, second.id]),
    );
    expect(history.some((entry) => entry.kind === "REVIEW" && entry.state === "ACCEPT")).toBe(true);
  });

  it("does not expose production HTTP endpoints for fixture source-currentness or conflict mutation", async () => {
    const f = await buildFixture("no-fixture-routes");
    const token = await login(f.reviewer.assertion);
    const probes = [
      `/api/assurance/sources/${f.sourceId}/currentness`,
      `/api/assurance/cases/${f.caseKey}/conflicts`,
    ];
    for (const path of probes) {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ currentness: "STALE" }),
      });
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "not_found" });
    }
  });
});
