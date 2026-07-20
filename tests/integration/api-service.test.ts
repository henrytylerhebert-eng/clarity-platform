import type { Server } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaAuthGateway, PrismaCaseCommandGateway, PrismaNetworkReviewGateway } from "@clarity/case-repository";
import { AuthenticationService, LocalDevIdentityProvider } from "@clarity/auth-service";
import { CaseCommandService } from "@clarity/case-service";
import {
  InMemoryPrescreenGateway,
  PRESCREEN_PRODUCTION_POLICY,
  PrescreenCommandService,
} from "@clarity/prescreen-service";
import { createApiServer } from "@clarity/api-service";
import { createNetworkEnrichmentReviewCommandCaller } from "../../packages/api-service/src/reviewCommandCaller.js";
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
  networkClinical: "syn-assert-api-network-clinical-01",
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

function postNetworkEnrichmentSubmit(token: string, body: Record<string, unknown>) {
  return fetch(`${baseUrl}/api/network-enrichment/synthetic/reviews/submit`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

function postNetworkEnrichmentApprove(token: string, body: Record<string, unknown>) {
  return fetch(`${baseUrl}/api/network-enrichment/synthetic/reviews/approve`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

function postNetworkEnrichmentReject(token: string, body: Record<string, unknown>) {
  return fetch(`${baseUrl}/api/network-enrichment/synthetic/reviews/reject`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

function postNetworkEnrichmentReconcile(token: string, body: Record<string, unknown>) {
  return fetch(`${baseUrl}/api/network-enrichment/synthetic/packages/reconcile`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

function getNetworkEnrichmentPackages(token: string) {
  return fetch(`${baseUrl}/api/network-enrichment/synthetic/packages`, {
    headers: { authorization: `Bearer ${token}` },
  });
}

function postNetworkEnrichmentExport(token: string, body: Record<string, unknown>) {
  return fetch(`${baseUrl}/api/network-enrichment/synthetic/packages/export`, {
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
  provider.register(
    ASSERTIONS.networkClinical,
    await createRoleUser("network-clinical", h.tenantA, ["CLINICAL_REVIEWER"]),
  );

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
  const gateway = new PrismaNetworkReviewGateway(h.prisma);
  const networkEnrichmentReviewInvoker = createNetworkEnrichmentReviewCommandCaller({ gateway });
  const prescreen = new PrescreenCommandService(new InMemoryPrescreenGateway(), PRESCREEN_PRODUCTION_POLICY);
  server = createApiServer({ auth, caseCommands, networkEnrichmentReviewInvoker, gateway, prescreen });
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

describe("Network enrichment synthetic command runtime", () => {
  it("submits and then approves a review using synthetic command state", async () => {
    const token = await login(ASSERTIONS.networkClinical);
    const reviewId = `network-review-${h.runId}-approve`;
    const submitRes = await postNetworkEnrichmentSubmit(token, {
      reviewId,
      caseId: `case-${h.runId}-approve`,
      sourceCandidateId: "candidate-approve",
      fieldPath: "facilityAdmissionProfiles.name",
      currentValue: "old",
      proposedValue: "new",
      sourceReviewerRoles: ["FACILITY_CLINICAL_GOVERNANCE"],
      idempotencyKey: `synthetic-enrich-submit-${h.runId}-approve`,
      reason: "Synthetic routing test",
      correlationId: "corr-network-approve",
    });
    expect(submitRes.status).toBe(200);

    const submitPayload = (await submitRes.json()) as {
      value: { review: { reviewId: string; status: string; version: number } };
      replayed: boolean;
    };
    expect(submitPayload.value.review.reviewId).toBe(reviewId);
    expect(submitPayload.value.review.status).toBe("REVIEW_PENDING");
    expect(submitPayload.value.review.version).toBe(1);
    expect(submitPayload.replayed).toBe(false);

    const approveRes = await postNetworkEnrichmentApprove(token, {
      reviewId,
      expectedVersion: submitPayload.value.review.version,
      actorNotes: "Clinical reviewer approved synthetic review",
      idempotencyKey: `synthetic-enrich-approve-${h.runId}-approve`,
      correlationId: "corr-network-approve-final",
    });
    expect(approveRes.status).toBe(200);
    const approvePayload = (await approveRes.json()) as {
      value: { review: { status: string; version: number } };
      replayed: boolean;
    };
    expect(approvePayload.value.review.status).toBe("HUMAN_CONFIRMED");
    expect(approvePayload.value.review.version).toBe(2);
    expect(approvePayload.replayed).toBe(false);
  });

  it("replays duplicate submit commands and rejects unauthorized mappings", async () => {
    const token = await login(ASSERTIONS.networkClinical);
    const reviewId = `network-review-${h.runId}-replay`;
    const basePayload = {
      reviewId,
      caseId: `case-${h.runId}-replay`,
      sourceCandidateId: "candidate-replay",
      fieldPath: "facilityAdmissionProfiles.notes",
      currentValue: "old",
      proposedValue: { notes: "candidate-note" },
      sourceReviewerRoles: ["FACILITY_CLINICAL_GOVERNANCE"],
      idempotencyKey: `synthetic-enrich-submit-${h.runId}-replay`,
      reason: "Replay test",
      correlationId: "corr-network-replay",
    };

    const first = await postNetworkEnrichmentSubmit(token, basePayload);
    expect(first.status).toBe(200);
    expect(((await first.json()) as { replayed: boolean }).replayed).toBe(false);

    const second = await postNetworkEnrichmentSubmit(token, basePayload);
    expect(second.status).toBe(200);
    expect(((await second.json()) as { replayed: boolean }).replayed).toBe(true);

    const badRoleToken = await login(ASSERTIONS.physician);
    const denied = await postNetworkEnrichmentSubmit(badRoleToken, {
      ...basePayload,
      reviewId: `network-review-${h.runId}-denied`,
      idempotencyKey: `synthetic-enrich-submit-${h.runId}-denied`,
    });
    expect(denied.status).toBe(403);
    expect(await denied.json()).toEqual({ error: "permission_denied" });
  });

  it("rejects a review with the reviewer actor and synthetic runtime review state", async () => {
    const token = await login(ASSERTIONS.networkClinical);
    const reviewId = `network-review-${h.runId}-reject`;
    const submitRes = await postNetworkEnrichmentSubmit(token, {
      reviewId,
      caseId: `case-${h.runId}-reject`,
      sourceCandidateId: "candidate-reject",
      fieldPath: "facilityAdmissionProfiles.capacity",
      currentValue: 1,
      proposedValue: 2,
      sourceReviewerRoles: ["FACILITY_CLINICAL_GOVERNANCE"],
      idempotencyKey: `synthetic-enrich-submit-${h.runId}-reject`,
      reason: "Synthetic reject test",
      correlationId: "corr-network-reject",
    });
    expect(submitRes.status).toBe(200);
    const submitPayload = (await submitRes.json()) as { value: { review: { version: number } }; replayed: boolean };
    expect(submitPayload.replayed).toBe(false);

    const rejectRes = await postNetworkEnrichmentReject(token, {
      reviewId,
      expectedVersion: submitPayload.value.review.version,
      rejectionReason: "Rejecting for synthetic test",
      idempotencyKey: `synthetic-enrich-reject-${h.runId}-reject`,
      correlationId: "corr-network-reject-final",
    });
    expect(rejectRes.status).toBe(200);
    const rejectPayload = (await rejectRes.json()) as {
      value: { review: { status: string; version: number } };
      replayed: boolean;
    };
    expect(rejectPayload.value.review.status).toBe("REJECTED");
    expect(rejectPayload.value.review.version).toBe(2);
    expect(rejectPayload.replayed).toBe(false);
  });

  it("rejects network enrichment payloads that attempt to smuggle principal fields", async () => {
    const token = await login(ASSERTIONS.networkClinical);
    const reviewId = `network-review-${h.runId}-smuggle`;
    const basePayload = {
      reviewId,
      caseId: `case-${h.runId}-smuggle`,
      sourceCandidateId: "candidate-smuggle",
      fieldPath: "facilityAdmissionProfiles.capacity",
      currentValue: 1,
      proposedValue: 2,
      sourceReviewerRoles: ["FACILITY_CLINICAL_GOVERNANCE"],
      idempotencyKey: `synthetic-enrich-submit-${h.runId}-smuggle`,
      reason: "Smuggling test",
      correlationId: "corr-network-smuggle",
    };

    const forgedPayloads = [
      { ...basePayload, organizationId: h.tenantB.organizationId },
      { ...basePayload, actor: { actorId: "attacker", roles: ["SYSTEM_ADMIN"] } },
      { ...basePayload, roles: ["SYSTEM_ADMIN"] },
    ];

    for (const forgedPayload of forgedPayloads) {
      const forgedRes = await postNetworkEnrichmentSubmit(token, forgedPayload);
      expect(forgedRes.status).toBe(400);
      expect(await forgedRes.json()).toEqual({ error: "invalid_request" });
    }
  });

  it("rejects network enrichment approve/reject payloads that attempt to smuggle principal fields", async () => {
    const token = await login(ASSERTIONS.networkClinical);

    const reviewId = `network-review-${h.runId}-smuggle-authz`;
    const submitPayloadRes = await postNetworkEnrichmentSubmit(token, {
      reviewId,
      caseId: `case-${h.runId}-smuggle-authz`,
      sourceCandidateId: "candidate-smuggle-authz",
      fieldPath: "facilityAdmissionProfiles.capacity",
      currentValue: 1,
      proposedValue: 2,
      sourceReviewerRoles: ["FACILITY_CLINICAL_GOVERNANCE"],
      idempotencyKey: `synthetic-enrich-submit-${h.runId}-smuggle-authz`,
      reason: "Smuggling authz test",
      correlationId: "corr-network-smuggle-authz",
    });
    expect(submitPayloadRes.status).toBe(200);
    const submitPayload = (await submitPayloadRes.json()) as {
      value: { review: { version: number } };
      replayed: boolean;
    };

    const forgedApprovals = [
      { organizationId: h.tenantB.organizationId },
      { actor: { actorId: "attacker", roles: ["SYSTEM_ADMIN"] } },
      { roles: ["SYSTEM_ADMIN"] },
    ];
    for (const forged of forgedApprovals) {
      const forgedApprove = await postNetworkEnrichmentApprove(token, {
        reviewId,
        expectedVersion: submitPayload.value.review.version,
        actorNotes: "Smuggling attempt",
        idempotencyKey: `synthetic-enrich-approve-${h.runId}-smuggle-authz`,
        correlationId: "corr-network-smuggle-authz-approve",
        ...forged,
      } as Record<string, unknown>);
      expect(forgedApprove.status).toBe(400);
      expect(await forgedApprove.json()).toEqual({ error: "invalid_request" });
    }

    const forgedRejects = [
      { organizationId: h.tenantB.organizationId },
      { actor: { actorId: "attacker", roles: ["SYSTEM_ADMIN"] } },
      { roles: ["SYSTEM_ADMIN"] },
    ];
    for (const forged of forgedRejects) {
      const forgedReject = await postNetworkEnrichmentReject(token, {
        reviewId,
        expectedVersion: submitPayload.value.review.version,
        rejectionReason: "Smuggling attempt",
        idempotencyKey: `synthetic-enrich-reject-${h.runId}-smuggle-authz`,
        correlationId: "corr-network-smuggle-authz-reject",
        ...forged,
      } as Record<string, unknown>);
      expect(forgedReject.status).toBe(400);
      expect(await forgedReject.json()).toEqual({ error: "invalid_request" });
    }
  });

  it("maps review version mismatch to conflict for approve/reject transitions", async () => {
    const token = await login(ASSERTIONS.networkClinical);

    const reviewId = `network-review-${h.runId}-conflict`;
    const submitRes = await postNetworkEnrichmentSubmit(token, {
      reviewId,
      caseId: `case-${h.runId}-conflict`,
      sourceCandidateId: "candidate-conflict",
      fieldPath: "facilityAdmissionProfiles.capacity",
      currentValue: 1,
      proposedValue: 2,
      sourceReviewerRoles: ["FACILITY_CLINICAL_GOVERNANCE"],
      idempotencyKey: `synthetic-enrich-submit-${h.runId}-conflict`,
      reason: "Conflict mapping test",
      correlationId: "corr-network-conflict",
    });
    expect(submitRes.status).toBe(200);

    const approveBadVersion = await postNetworkEnrichmentApprove(token, {
      reviewId,
      expectedVersion: 999,
      actorNotes: "Out-of-date version",
      idempotencyKey: `synthetic-enrich-approve-${h.runId}-conflict`,
      correlationId: "corr-network-conflict-approve",
    });
    expect(approveBadVersion.status).toBe(409);
    expect(await approveBadVersion.json()).toEqual({ error: "conflict" });

    const rejectBadVersion = await postNetworkEnrichmentReject(token, {
      reviewId,
      expectedVersion: 888,
      rejectionReason: "Out-of-date version",
      idempotencyKey: `synthetic-enrich-reject-${h.runId}-conflict`,
      correlationId: "corr-network-conflict-reject",
    });
    expect(rejectBadVersion.status).toBe(409);
    expect(await rejectBadVersion.json()).toEqual({ error: "conflict" });
  });

  it("returns conflict when approve/reject idempotency keys are reused with drifted payloads", async () => {
    const token = await login(ASSERTIONS.networkClinical);

    const approveReviewId = `network-review-${h.runId}-idem-conflict-approve`;
    const submitForApproveRes = await postNetworkEnrichmentSubmit(token, {
      reviewId: approveReviewId,
      caseId: `case-${h.runId}-idem-conflict-approve`,
      sourceCandidateId: "candidate-idem-conflict-approve",
      fieldPath: "facilityAdmissionProfiles.capacity",
      currentValue: 1,
      proposedValue: 2,
      sourceReviewerRoles: ["FACILITY_CLINICAL_GOVERNANCE"],
      idempotencyKey: `synthetic-enrich-submit-${h.runId}-idem-conflict-approve`,
      reason: "Idempotency drift setup",
      correlationId: "corr-network-idem-conflict-approve",
    });
    expect(submitForApproveRes.status).toBe(200);
    const submitPayload = (await submitForApproveRes.json()) as {
      value: { review: { version: number } };
      replayed: boolean;
    };

    const approveReplayConflict = await postNetworkEnrichmentApprove(token, {
      reviewId: approveReviewId,
      expectedVersion: submitPayload.value.review.version,
      actorNotes: "first approval notes",
      idempotencyKey: `synthetic-enrich-approve-${h.runId}-idem-conflict`,
      correlationId: "corr-network-idem-conflict-approve-1",
    });
    expect(approveReplayConflict.status).toBe(200);

    const approveDriftConflict = await postNetworkEnrichmentApprove(token, {
      reviewId: approveReviewId,
      expectedVersion: submitPayload.value.review.version,
      actorNotes: "second approval notes",
      idempotencyKey: `synthetic-enrich-approve-${h.runId}-idem-conflict`,
      correlationId: "corr-network-idem-conflict-approve-2",
    });
    expect(approveDriftConflict.status).toBe(409);
    expect(await approveDriftConflict.json()).toEqual({ error: "conflict" });

    const rejectReviewId = `network-review-${h.runId}-idem-conflict-reject`;
    const submitForRejectRes = await postNetworkEnrichmentSubmit(token, {
      reviewId: rejectReviewId,
      caseId: `case-${h.runId}-idem-conflict-reject`,
      sourceCandidateId: "candidate-idem-conflict-reject",
      fieldPath: "facilityAdmissionProfiles.notes",
      currentValue: "old",
      proposedValue: "new",
      sourceReviewerRoles: ["FACILITY_CLINICAL_GOVERNANCE"],
      idempotencyKey: `synthetic-enrich-submit-${h.runId}-idem-conflict-reject`,
      reason: "Idempotency drift setup",
      correlationId: "corr-network-idem-conflict-reject",
    });
    expect(submitForRejectRes.status).toBe(200);
    const submitPayloadReject = (await submitForRejectRes.json()) as {
      value: { review: { version: number } };
      replayed: boolean;
    };

    const rejectReplayConflict = await postNetworkEnrichmentReject(token, {
      reviewId: rejectReviewId,
      expectedVersion: submitPayloadReject.value.review.version,
      rejectionReason: "first rejection reason",
      idempotencyKey: `synthetic-enrich-reject-${h.runId}-idem-conflict`,
      correlationId: "corr-network-idem-conflict-reject-1",
    });
    expect(rejectReplayConflict.status).toBe(200);

    const rejectDriftConflict = await postNetworkEnrichmentReject(token, {
      reviewId: rejectReviewId,
      expectedVersion: submitPayloadReject.value.review.version,
      rejectionReason: "second rejection reason",
      idempotencyKey: `synthetic-enrich-reject-${h.runId}-idem-conflict`,
      correlationId: "corr-network-idem-conflict-reject-2",
    });
    expect(rejectDriftConflict.status).toBe(409);
    expect(await rejectDriftConflict.json()).toEqual({ error: "conflict" });
  });

  it("returns not found for approve/reject against a missing review id", async () => {
    const token = await login(ASSERTIONS.networkClinical);

    const approveMissing = await postNetworkEnrichmentApprove(token, {
      reviewId: `network-review-${h.runId}-missing`,
      expectedVersion: 1,
      actorNotes: "Missing review scenario",
      idempotencyKey: `synthetic-enrich-approve-${h.runId}-missing`,
      correlationId: "corr-network-missing-approve",
    });
    expect(approveMissing.status).toBe(404);
    expect(await approveMissing.json()).toEqual({ error: "review_not_found" });

    const rejectMissing = await postNetworkEnrichmentReject(token, {
      reviewId: `network-review-${h.runId}-missing`,
      expectedVersion: 1,
      rejectionReason: "Missing review scenario",
      idempotencyKey: `synthetic-enrich-reject-${h.runId}-missing`,
      correlationId: "corr-network-missing-reject",
    });
    expect(rejectMissing.status).toBe(404);
    expect(await rejectMissing.json()).toEqual({ error: "review_not_found" });
  });

  it("rejects transition to approve/reject for terminal-state reviews", async () => {
    const token = await login(ASSERTIONS.networkClinical);

    const reviewId = `network-review-${h.runId}-terminal`;
    const submitRes = await postNetworkEnrichmentSubmit(token, {
      reviewId,
      caseId: `case-${h.runId}-terminal`,
      sourceCandidateId: "candidate-terminal",
      fieldPath: "facilityAdmissionProfiles.capacity",
      currentValue: 1,
      proposedValue: 2,
      sourceReviewerRoles: ["FACILITY_CLINICAL_GOVERNANCE"],
      idempotencyKey: `synthetic-enrich-submit-${h.runId}-terminal`,
      reason: "terminal transition test",
      correlationId: "corr-network-terminal",
    });
    expect(submitRes.status).toBe(200);
    const submitPayload = (await submitRes.json()) as {
      value: { review: { version: number } };
      replayed: boolean;
    };

    const approved = await postNetworkEnrichmentApprove(token, {
      reviewId,
      expectedVersion: submitPayload.value.review.version,
      actorNotes: "approve to terminal",
      idempotencyKey: `synthetic-enrich-approve-${h.runId}-terminal`,
      correlationId: "corr-network-terminal-approve",
    });
    expect(approved.status).toBe(200);

    const rejectAfterApproved = await postNetworkEnrichmentReject(token, {
      reviewId,
      expectedVersion: submitPayload.value.review.version + 1,
      rejectionReason: "should fail from terminal",
      idempotencyKey: `synthetic-enrich-reject-${h.runId}-terminal`,
      correlationId: "corr-network-terminal-reject",
    });
    expect(rejectAfterApproved.status).toBe(400);
    expect(await rejectAfterApproved.json()).toEqual({ error: "invalid_request" });

    const approvedAgain = await postNetworkEnrichmentApprove(token, {
      reviewId,
      expectedVersion: submitPayload.value.review.version + 1,
      actorNotes: "second approve on terminal",
      idempotencyKey: `synthetic-enrich-approve-${h.runId}-terminal-2`,
      correlationId: "corr-network-terminal-approve-2",
    });
    expect(approvedAgain.status).toBe(400);
    expect(await approvedAgain.json()).toEqual({ error: "invalid_request" });
  });

  it("reconciles human-confirmed package records over HTTP REST surface", async () => {
    const token = await login(ASSERTIONS.networkClinical);

    const reviewId = `network-review-${h.runId}-reconcile`;
    const submitRes = await postNetworkEnrichmentSubmit(token, {
      reviewId,
      caseId: `case-${h.runId}-reconcile`,
      sourceCandidateId: "candidate-reconcile",
      fieldPath: "facilityAdmissionProfiles.capacity",
      currentValue: 10,
      proposedValue: 12,
      sourceReviewerRoles: ["FACILITY_CLINICAL_GOVERNANCE"],
      idempotencyKey: `synthetic-enrich-submit-${h.runId}-reconcile`,
      reason: "Reconcile test submit",
      correlationId: "corr-network-reconcile-sub",
    });
    expect(submitRes.status).toBe(200);

    const submitPayload = (await submitRes.json()) as {
      value: { review: { reviewPackageId: string; version: number } };
    };

    const approveRes = await postNetworkEnrichmentApprove(token, {
      reviewId,
      expectedVersion: submitPayload.value.review.version,
      actorNotes: "Approve for reconcile",
      idempotencyKey: `synthetic-enrich-approve-${h.runId}-reconcile`,
      correlationId: "corr-network-reconcile-app",
    });
    expect(approveRes.status).toBe(200);

    const reconcileRes = await postNetworkEnrichmentReconcile(token, {
      reviewPackageId: submitPayload.value.review.reviewPackageId,
      expectedVersion: 1,
      notes: "Package reconciled and promoted to CRM",
      idempotencyKey: `synthetic-enrich-reconcile-${h.runId}`,
      correlationId: "corr-network-reconcile-rec",
    });
    expect(reconcileRes.status).toBe(200);
    const reconcilePayload = (await reconcileRes.json()) as {
      value: { packageRecord: { status: string }; promotedFieldPaths: string[] };
      replayed: boolean;
    };
    expect(reconcilePayload.value.packageRecord.status).toBe("HUMAN_CONFIRMED");
    expect(reconcilePayload.value.promotedFieldPaths).toContain("facilityAdmissionProfiles.capacity");
  });

  it("returns the tenant's network-enrichment packages with nested reviews/evidence/conflicts", async () => {
    const token = await login(ASSERTIONS.networkClinical);

    const reviewId = `network-review-${h.runId}-list`;
    const submitRes = await postNetworkEnrichmentSubmit(token, {
      reviewId,
      caseId: `case-${h.runId}-list`,
      sourceCandidateId: "candidate-list",
      fieldPath: "facilityAdmissionProfiles.capacity",
      currentValue: 5,
      proposedValue: 7,
      sourceReviewerRoles: ["FACILITY_CLINICAL_GOVERNANCE"],
      idempotencyKey: `synthetic-enrich-submit-${h.runId}-list`,
      reason: "List endpoint smoke test",
      correlationId: "corr-network-list",
    });
    expect(submitRes.status).toBe(200);

    const submitPayload = (await submitRes.json()) as {
      value: { review: { reviewPackageId: string } };
      replayed: boolean;
    };
    expect(submitPayload.replayed).toBe(false);

    const listRes = await getNetworkEnrichmentPackages(token);
    expect(listRes.status).toBe(200);
    const listPayload = (await listRes.json()) as Array<{
      packageRecord: { reviewPackageId: string; sourceCandidateId: string; organizationId: string };
      reviews: Array<{ reviewId: string }>;
      evidence: Record<string, Array<{ reviewId: string }>>;
      conflicts: Array<{ conflictId: string }>;
      canonicalData: { entityName: string; fields: Record<string, unknown> };
    }>;

    expect(listPayload.length).toBeGreaterThanOrEqual(1);
    const entry = listPayload.find((item) => item.packageRecord.reviewPackageId === submitPayload.value.review.reviewPackageId);
    expect(entry).toBeDefined();
    expect(entry!.packageRecord.sourceCandidateId).toBe("candidate-list");
    expect(entry!.reviews.some((r) => r.reviewId === reviewId)).toBe(true);
    expect(entry!.conflicts).toBeInstanceOf(Array);
    expect(entry!.evidence[reviewId]).toBeInstanceOf(Array);
    expect(entry!.canonicalData.entityName).toContain("candidate-list");
  });

  it("exports signed compliance package with SHA-256 integrity hash over HTTP REST surface", async () => {
    const token = await login(ASSERTIONS.networkClinical);

    const reviewId = `network-review-${h.runId}-export`;
    const submitRes = await postNetworkEnrichmentSubmit(token, {
      reviewId,
      caseId: `case-${h.runId}-export`,
      sourceCandidateId: "candidate-export",
      fieldPath: "facilityAdmissionProfiles.complianceCert",
      currentValue: "pending",
      proposedValue: "certified",
      sourceReviewerRoles: ["FACILITY_CLINICAL_GOVERNANCE"],
      idempotencyKey: `synthetic-enrich-submit-${h.runId}-export`,
      reason: "Compliance export submit",
      correlationId: "corr-network-export-sub",
    });
    expect(submitRes.status).toBe(200);

    const submitPayload = (await submitRes.json()) as {
      value: { review: { reviewPackageId: string; version: number } };
    };

    const exportRes = await postNetworkEnrichmentExport(token, {
      reviewPackageId: submitPayload.value.review.reviewPackageId,
      includeEvidenceExcerpts: true,
      includeConflictsMatrix: true,
      correlationId: "corr-network-export-req",
    });
    expect(exportRes.status).toBe(200);

    const exportPayload = (await exportRes.json()) as {
      manifest: {
        exportId: string;
        integrityHashAlg: string;
        integrityHash: string;
        recordCount: number;
      };
      packageRecord: { reviewPackageId: string };
      auditTimeline: Array<{ action: string }>;
    };

    expect(exportPayload.manifest.integrityHashAlg).toBe("SHA-256");
    expect(exportPayload.manifest.integrityHash).toHaveLength(64);
    expect(exportPayload.manifest.recordCount).toBeGreaterThanOrEqual(1);
    expect(exportPayload.packageRecord.reviewPackageId).toBe(submitPayload.value.review.reviewPackageId);
  });
});
