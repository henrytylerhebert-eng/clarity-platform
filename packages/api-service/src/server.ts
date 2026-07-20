import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { z, ZodError } from "zod";
import {
  AuthenticationFailedError,
  LoginRejectedError,
  type AuthenticationService,
} from "@clarity/auth-service";
import { CaseNotFoundError, PermissionDeniedError, type CaseCommandService } from "@clarity/case-service";
import {
  ApproveReviewCommandSchema,
  assertUserRoleOverlap,
  ExportAuditLogCommandSchema,
  NetworkEnrichmentDomainError,
  ReconcilePackageCommandSchema,
  RejectReviewCommandSchema,
  SubmitForReviewCommandSchema,
  type AuthenticatedPrincipal,
  type UserRole,
} from "@clarity/domain-contracts";
import {
  NetworkEnrichmentComplianceExporter,
  InMemoryNetworkReviewGateway,
} from "@clarity/network-enrichment-service";
import {
  type NetworkEnrichmentReviewCommandInvoker,
  createNetworkEnrichmentReviewCommandCaller,
} from "./reviewCommandCaller.js";

/**
 * The API vertical slice (retires the "actor roles are trusted caller input"
 * assumption on one real path):
 *
 *   POST /api/auth/login                              { assertion } → { token, principal }
 *   GET  /api/auth/session                            bearer → principal
 *   POST /api/auth/logout                             bearer → 204
 *   POST /api/cases/{caseKey}/decision-rationale      bearer + body → command result
 *   POST /api/network-enrichment/synthetic/reviews/submit   bearer + body → review submit
 *   POST /api/network-enrichment/synthetic/reviews/approve  bearer + body → review approve
 *   POST /api/network-enrichment/synthetic/reviews/reject   bearer + body → review reject
 *   POST /api/network-enrichment/synthetic/packages/reconcile bearer + body → package reconcile
 *   POST /api/network-enrichment/synthetic/packages/export    bearer + body → compliance export package
 *
 * Invariants:
 * - organizationId and actor roles are taken ONLY from the verified principal
 *   (AuthenticationService.authenticate → actorFor). There is no request field
 *   through which a caller could supply either; unknown body fields are a 400.
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

const SubmitForReviewBodySchema = SubmitForReviewCommandSchema.omit({
  organizationId: true,
  actor: true,
}).strict();
const ApproveReviewBodySchema = ApproveReviewCommandSchema.omit({
  organizationId: true,
  actor: true,
}).strict();
const RejectReviewBodySchema = RejectReviewCommandSchema.omit({
  organizationId: true,
  actor: true,
}).strict();
const ReconcilePackageBodySchema = ReconcilePackageCommandSchema.omit({
  organizationId: true,
  actor: true,
}).strict();
const ExportAuditLogBodySchema = ExportAuditLogCommandSchema.omit({
  organizationId: true,
  actor: true,
}).strict();

export interface ApiDeps {
  auth: AuthenticationService;
  caseCommands: CaseCommandService;
  networkEnrichmentReviewInvoker?: NetworkEnrichmentReviewCommandInvoker;
  complianceExporter?: NetworkEnrichmentComplianceExporter;
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

function toHttpError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;
  if (error instanceof LoginRejectedError || error instanceof AuthenticationFailedError) {
    return new HttpError(401, "authentication_failed");
  }
  if (error instanceof PermissionDeniedError) return new HttpError(403, "permission_denied");
  if (error instanceof CaseNotFoundError) return new HttpError(404, "case_not_found");
  if (error instanceof NetworkEnrichmentDomainError) {
    switch (error.code) {
      case "PERMISSION_DENIED":
        return new HttpError(403, "permission_denied");
      case "NOT_FOUND":
        return new HttpError(404, "review_not_found");
      case "CONCURRENCY_CONFLICT":
      case "IDEMPOTENCY_CONFLICT":
      case "CONFLICT":
        return new HttpError(409, "conflict");
      case "VALIDATION":
        return new HttpError(400, "invalid_request");
    }
  }
  if (error instanceof ZodError) return new HttpError(400, "invalid_request");
  return new HttpError(500, "internal_error");
}

const DECISION_RATIONALE_PATH = /^\/api\/cases\/([^/]+)\/decision-rationale$/;
const NETWORK_ENRICHMENT_SUBMIT_REVIEW_PATH = "/api/network-enrichment/synthetic/reviews/submit";
const NETWORK_ENRICHMENT_APPROVE_REVIEW_PATH = "/api/network-enrichment/synthetic/reviews/approve";
const NETWORK_ENRICHMENT_REJECT_REVIEW_PATH = "/api/network-enrichment/synthetic/reviews/reject";
const NETWORK_ENRICHMENT_RECONCILE_PACKAGE_PATH = "/api/network-enrichment/synthetic/packages/reconcile";
const NETWORK_ENRICHMENT_EXPORT_PACKAGE_PATH = "/api/network-enrichment/synthetic/packages/export";

const EXPORT_ALLOWED_ROLES: readonly UserRole[] = [
  "LEGAL_REVIEWER",
  "READ_ONLY_AUDITOR",
  "SYSTEM_ADMIN",
  "ORGANIZATION_ADMIN",
  "PHYSICIAN_REVIEWER",
  "CLINICAL_REVIEWER",
];

export function createApiServer(deps: ApiDeps): Server {
  const networkEnrichmentReviewInvoker =
    deps.networkEnrichmentReviewInvoker ?? createNetworkEnrichmentReviewCommandCaller();
  const complianceExporter =
    deps.complianceExporter ?? new NetworkEnrichmentComplianceExporter(new InMemoryNetworkReviewGateway());

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

      if (method === "POST" && url === NETWORK_ENRICHMENT_SUBMIT_REVIEW_PATH) {
        const principal = await deps.auth.authenticate(bearerToken(req));
        const body = SubmitForReviewBodySchema.parse(await readJsonBody(req));
        const command = await networkEnrichmentReviewInvoker({
          commandType: "submitForReview",
          command: {
            ...body,
            organizationId: principal.organizationId,
            actor: deps.auth.actorFor(principal),
          },
        });
        return sendJson(res, 200, command);
      }

      if (method === "POST" && url === NETWORK_ENRICHMENT_APPROVE_REVIEW_PATH) {
        const principal = await deps.auth.authenticate(bearerToken(req));
        const body = ApproveReviewBodySchema.parse(await readJsonBody(req));
        const command = await networkEnrichmentReviewInvoker({
          commandType: "approveReview",
          command: {
            ...body,
            organizationId: principal.organizationId,
            actor: deps.auth.actorFor(principal),
          },
        });
        return sendJson(res, 200, command);
      }

      if (method === "POST" && url === NETWORK_ENRICHMENT_REJECT_REVIEW_PATH) {
        const principal = await deps.auth.authenticate(bearerToken(req));
        const body = RejectReviewBodySchema.parse(await readJsonBody(req));
        const command = await networkEnrichmentReviewInvoker({
          commandType: "rejectReview",
          command: {
            ...body,
            organizationId: principal.organizationId,
            actor: deps.auth.actorFor(principal),
          },
        });
        return sendJson(res, 200, command);
      }

      if (method === "POST" && url === NETWORK_ENRICHMENT_RECONCILE_PACKAGE_PATH) {
        const principal = await deps.auth.authenticate(bearerToken(req));
        const body = ReconcilePackageBodySchema.parse(await readJsonBody(req));
        const command = await networkEnrichmentReviewInvoker({
          commandType: "reconcilePackage",
          command: {
            ...body,
            organizationId: principal.organizationId,
            actor: deps.auth.actorFor(principal),
          },
        });
        return sendJson(res, 200, command);
      }

      if (method === "POST" && url === NETWORK_ENRICHMENT_EXPORT_PACKAGE_PATH) {
        const principal = await deps.auth.authenticate(bearerToken(req));
        assertUserRoleOverlap(EXPORT_ALLOWED_ROLES, principal.roles, "exportAuditPackage");
        const body = ExportAuditLogBodySchema.parse(await readJsonBody(req));
        const exportPackage = await complianceExporter.generateExportPackage({
          ...body,
          organizationId: principal.organizationId,
          actor: deps.auth.actorFor(principal),
        });
        return sendJson(res, 200, exportPackage);
      }

      return sendJson(res, 404, { error: "not_found" });
    } catch (error) {
      const httpError = toHttpError(error);
      if (httpError.status === 500) {
        console.error("[api-service] internal error:", error);
      }
      return sendJson(res, httpError.status, { error: httpError.code });
    }
  });
}
