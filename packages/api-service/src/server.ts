import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { z, ZodError } from "zod";
import {
  AuthenticationFailedError,
  LoginRejectedError,
  type AuthenticationService,
} from "@clarity/auth-service";
import { CaseNotFoundError, PermissionDeniedError, type CaseCommandService } from "@clarity/case-service";
import {
  AssessmentDraftInputSchema,
  PrescreenCommandError,
  type PrescreenCommandService,
} from "@clarity/prescreen-service";
import {
  PACKET_REQUIREMENT_STATES,
  PRESCREEN_READINESS_TARGETS,
  type AuthenticatedPrincipal,
} from "@clarity/domain-contracts";

/**
 * The API vertical slice (retires the "actor roles are trusted caller input"
 * assumption on one real path):
 *
 *   POST /api/auth/login                              { assertion } → { token, principal }
 *   GET  /api/auth/session                            bearer → principal
 *   POST /api/auth/logout                             bearer → 204
 *   POST /api/cases/{caseKey}/decision-rationale      bearer + body → command result
 *
 * Prescreen same-organization slice (ADR-0014; Phase 2 in-memory gateway —
 * prescreen state is process-local and non-durable until Phase 3):
 *
 *   POST /api/prescreen/encounters                    StartPrescreenEncounter
 *   POST /api/prescreen/encounters/{id}/draft         SaveAssessmentDraft
 *   POST /api/prescreen/encounters/{id}/attest        AttestAssessment
 *   POST /api/prescreen/encounters/{id}/supplements   CreateAssessmentSupplement
 *   POST /api/prescreen/encounters/{id}/submit        SubmitPrescreen
 *   POST /api/prescreen/encounters/{id}/requirements  UpdatePacketRequirement
 *   GET  /api/prescreen/encounters/{id}/readiness     EvaluateTargetReadiness (?target=…)
 *
 * Invariants:
 * - organizationId and actor roles are taken ONLY from the verified principal
 *   (AuthenticationService.authenticate → actorFor). There is no request field
 *   through which a caller could supply either; unknown body fields are a 400.
 * - Prescreen additionally: receivingOrganizationId is derived from the
 *   principal (cross-org submission is structurally inexpressible over HTTP)
 *   and occurredAt is server-stamped (callers cannot backdate envelopes).
 * - Failures are uniform and content-free: 401 for anything wrong with the
 *   token, 403 for a role the policy does not permit, 404 for a case the
 *   tenant cannot see. Internals are never echoed.
 * - No framework: node:http only, JSON only, 64 KiB body cap.
 */

const MAX_BODY_BYTES = 64 * 1024;

const LoginBodySchema = z.object({ assertion: z.string().min(16) }).strict();

const DecisionRationaleBodySchema = z
  .object({
    reason: z.string().min(1),
    decisionContext: z.string().min(1),
    citedLegalStatusRecordId: z.string().min(1).optional(),
    idempotencyKey: z.string().min(8).optional(),
  })
  .strict();

// Prescreen bodies mirror the command envelopes MINUS every server-derived
// field (organizationId, actor, occurredAt, receivingOrganizationId). They
// are strict, so supplying any of those — or anything unknown — is a 400,
// never a silent overwrite.
const PRESCREEN_ID = z.string().min(1).max(200);
const PRESCREEN_IDEMPOTENCY_KEY = z.string().min(8).max(200);

const PrescreenStartBodySchema = z
  .object({
    caseId: PRESCREEN_ID,
    currentLocation: z.string().min(1).max(500),
    presentingConcern: z.string().min(1).max(5000),
    idempotencyKey: PRESCREEN_IDEMPOTENCY_KEY,
    correlationId: PRESCREEN_ID.optional(),
  })
  .strict();

const PrescreenDraftBodySchema = z
  .object({
    draft: AssessmentDraftInputSchema,
    expectedVersion: z.number().int().positive().optional(),
    idempotencyKey: PRESCREEN_IDEMPOTENCY_KEY,
    correlationId: PRESCREEN_ID.optional(),
  })
  .strict();

const PrescreenAttestBodySchema = z
  .object({
    assessmentVersionId: PRESCREEN_ID,
    expectedVersion: z.number().int().positive().optional(),
    idempotencyKey: PRESCREEN_IDEMPOTENCY_KEY,
    correlationId: PRESCREEN_ID.optional(),
  })
  .strict();

const PrescreenSupplementBodySchema = z
  .object({
    parentAssessmentVersionId: PRESCREEN_ID,
    reason: z.string().min(1).max(2000),
    draft: AssessmentDraftInputSchema,
    expectedVersion: z.number().int().positive().optional(),
    idempotencyKey: PRESCREEN_IDEMPOTENCY_KEY,
    correlationId: PRESCREEN_ID.optional(),
  })
  .strict();

const PrescreenSubmitBodySchema = z
  .object({
    assessmentVersionId: PRESCREEN_ID,
    target: z.enum(PRESCREEN_READINESS_TARGETS),
    expectedVersion: z.number().int().positive().optional(),
    idempotencyKey: PRESCREEN_IDEMPOTENCY_KEY,
    correlationId: PRESCREEN_ID.optional(),
  })
  .strict();

const PrescreenRequirementBodySchema = z
  .object({
    requirementCode: z.string().min(1).max(200),
    label: z.string().min(1).max(300),
    state: z.enum(PACKET_REQUIREMENT_STATES),
    blockingTargets: z.array(z.enum(PRESCREEN_READINESS_TARGETS)).min(1),
    responsibleRoleCode: z.string().min(1).max(200).optional(),
    resolutionWorkspace: z.string().min(1).max(200),
    sourceRuleId: PRESCREEN_ID,
    sourceRuleVersion: z.number().int().positive(),
    expectedVersion: z.number().int().positive().optional(),
    idempotencyKey: PRESCREEN_IDEMPOTENCY_KEY,
    correlationId: PRESCREEN_ID.optional(),
  })
  .strict();

const PrescreenReadinessQuerySchema = z
  .object({ target: z.enum(PRESCREEN_READINESS_TARGETS) })
  .strict();

export interface ApiDeps {
  auth: AuthenticationService;
  caseCommands: CaseCommandService;
  prescreen: PrescreenCommandService;
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
    this.name = "HttpError";
  }
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(payload);
}

function serializePrincipal(principal: AuthenticatedPrincipal) {
  return {
    userId: principal.userId,
    organizationId: principal.organizationId,
    displayName: principal.displayName,
    roles: principal.roles,
    sessionId: principal.sessionId,
    expiresAt: principal.expiresAt.toISOString(),
  };
}

function bearerToken(req: IncomingMessage): string {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ") || header.length <= 7) {
    throw new HttpError(401, "authentication_failed");
  }
  return header.slice(7);
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, "body_too_large");
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, "invalid_json");
  }
}

/** Stable prescreen error-code → HTTP status. Codes are content-free by design (errors.ts). */
const PRESCREEN_ERROR_STATUS: Record<string, number> = {
  PERMISSION_DENIED: 403,
  RESOURCE_NOT_FOUND: 404,
  PRESCREEN_VERSION_CONFLICT: 409,
  IDEMPOTENCY_KEY_REUSED: 409,
  ASSESSMENT_NOT_DRAFT: 409,
  ASSESSMENT_VERSION_REQUIRED: 409,
  DOMAIN_VALIDATION_FAILED: 400,
};

function toHttpError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;
  if (error instanceof LoginRejectedError || error instanceof AuthenticationFailedError) {
    return new HttpError(401, "authentication_failed");
  }
  if (error instanceof PermissionDeniedError) return new HttpError(403, "permission_denied");
  if (error instanceof CaseNotFoundError) return new HttpError(404, "case_not_found");
  if (error instanceof PrescreenCommandError) {
    const status = PRESCREEN_ERROR_STATUS[error.code];
    if (status !== undefined) return new HttpError(status, error.code.toLowerCase());
    return new HttpError(500, "internal_error");
  }
  if (error instanceof ZodError) return new HttpError(400, "invalid_request");
  return new HttpError(500, "internal_error");
}

const DECISION_RATIONALE_PATH = /^\/api\/cases\/([^/]+)\/decision-rationale$/;
const PRESCREEN_ACTION_PATH =
  /^\/api\/prescreen\/encounters\/([^/]+)\/(draft|attest|supplements|submit|requirements|readiness)$/;

/**
 * The only way a prescreen actor is built above the service layer: identity
 * and role codes come from the verified principal, whose roles came from
 * the database (ADR-0011). Mirrors actorFor() for the prescreen actor shape.
 */
function prescreenActorFor(principal: AuthenticatedPrincipal) {
  return {
    actorId: principal.userId,
    actorType: "USER" as const,
    roleCodes: [...principal.roles],
  };
}

export function createApiServer(deps: ApiDeps): Server {
  return createServer(async (req, res) => {
    const url = (req.url ?? "").split("?")[0] ?? "";
    const method = req.method ?? "GET";
    try {
      if (method === "POST" && url === "/api/auth/login") {
        const { assertion } = LoginBodySchema.parse(await readJsonBody(req));
        const { token, principal } = await deps.auth.login(assertion);
        return sendJson(res, 200, { token, principal: serializePrincipal(principal) });
      }

      if (method === "GET" && url === "/api/auth/session") {
        const principal = await deps.auth.authenticate(bearerToken(req));
        return sendJson(res, 200, { principal: serializePrincipal(principal) });
      }

      if (method === "POST" && url === "/api/auth/logout") {
        await deps.auth.logout(bearerToken(req));
        res.writeHead(204);
        return res.end();
      }

      const rationaleMatch = method === "POST" ? DECISION_RATIONALE_PATH.exec(url) : null;
      if (rationaleMatch) {
        const principal = await deps.auth.authenticate(bearerToken(req));
        const body = DecisionRationaleBodySchema.parse(await readJsonBody(req));
        // The load-bearing lines of the slice: tenant and actor come from the
        // verified principal, not from anything the caller sent.
        const result = await deps.caseCommands.recordDecisionRationale({
          organizationId: principal.organizationId,
          actor: deps.auth.actorFor(principal),
          caseKey: decodeURIComponent(rationaleMatch[1]!),
          reason: body.reason,
          decisionContext: body.decisionContext,
          citedLegalStatusRecordId: body.citedLegalStatusRecordId,
          idempotencyKey: body.idempotencyKey,
        });
        return sendJson(res, 200, {
          caseKey: result.case.caseKey,
          version: result.case.version ?? null,
          replayed: result.replayed,
        });
      }

      if (method === "POST" && url === "/api/prescreen/encounters") {
        const principal = await deps.auth.authenticate(bearerToken(req));
        const body = PrescreenStartBodySchema.parse(await readJsonBody(req));
        const result = await deps.prescreen.startEncounter({
          organizationId: principal.organizationId,
          actor: prescreenActorFor(principal),
          occurredAt: new Date().toISOString(),
          ...body,
        });
        return sendJson(res, 200, result);
      }

      const prescreenMatch = PRESCREEN_ACTION_PATH.exec(url);
      if (prescreenMatch) {
        const encounterId = decodeURIComponent(prescreenMatch[1]!);
        const action = prescreenMatch[2]!;

        if (method === "GET" && action === "readiness") {
          const principal = await deps.auth.authenticate(bearerToken(req));
          const search = new URL(req.url ?? "", "http://localhost").searchParams;
          const { target } = PrescreenReadinessQuerySchema.parse(Object.fromEntries(search));
          const readiness = await deps.prescreen.evaluateTargetReadiness({
            organizationId: principal.organizationId,
            actor: prescreenActorFor(principal),
            encounterId,
            target,
          });
          return sendJson(res, 200, readiness);
        }

        if (method === "POST" && action !== "readiness") {
          const principal = await deps.auth.authenticate(bearerToken(req));
          const rawBody = await readJsonBody(req);
          // Server-derived envelope fields. Bodies are strict, so a caller
          // supplying organizationId, actor, occurredAt, or (for submit)
          // receivingOrganizationId gets a 400 — never a silent overwrite.
          const envelope = {
            organizationId: principal.organizationId,
            actor: prescreenActorFor(principal),
            occurredAt: new Date().toISOString(),
            encounterId,
          };
          switch (action) {
            case "draft": {
              const body = PrescreenDraftBodySchema.parse(rawBody);
              return sendJson(res, 200, await deps.prescreen.saveAssessmentDraft({ ...envelope, ...body }));
            }
            case "attest": {
              const body = PrescreenAttestBodySchema.parse(rawBody);
              return sendJson(res, 200, await deps.prescreen.attestAssessment({ ...envelope, ...body }));
            }
            case "supplements": {
              const body = PrescreenSupplementBodySchema.parse(rawBody);
              return sendJson(res, 200, await deps.prescreen.createAssessmentSupplement({ ...envelope, ...body }));
            }
            case "submit": {
              const body = PrescreenSubmitBodySchema.parse(rawBody);
              // Same-organization slice (ADR-0014): the receiving organization
              // IS the principal's organization, by construction.
              return sendJson(
                res,
                200,
                await deps.prescreen.submitPrescreen({
                  ...envelope,
                  ...body,
                  receivingOrganizationId: principal.organizationId,
                }),
              );
            }
            case "requirements": {
              const body = PrescreenRequirementBodySchema.parse(rawBody);
              return sendJson(res, 200, await deps.prescreen.updatePacketRequirement({ ...envelope, ...body }));
            }
          }
        }
      }

      return sendJson(res, 404, { error: "not_found" });
    } catch (error) {
      const httpError = toHttpError(error);
      if (httpError.status === 500) {
        // Server-side visibility only; the response body stays content-free.
        console.error("[api-service] internal error:", error);
      }
      return sendJson(res, httpError.status, { error: httpError.code });
    }
  });
}
