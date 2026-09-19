import { createServer, type Server, type ServerResponse } from "node:http";
import Fastify from "fastify";
import { registerRevOpsRoutes } from "./revOpsRoutes.js";
import { registerOperatingWorkbookRoutes } from "./operatingWorkbookRoutes.js";
import {
  registerAssuranceRoutes,
  type AssuranceEvaluationCaseResolver,
} from "./assuranceRoutes.js";
import { registerAuthRoutes } from "./authRoutes.js";
import { registerPrescreenRoutes } from "./prescreenRoutes.js";
import type { PrismaOperatingWorkbookGateway } from "../../case-repository/src/operatingWorkbookGateway.js";
import type { PrismaRevOpsGateway } from "../../case-repository/src/revOpsGateway.js";
import { registerIopReconciliationRoutes } from "./iopReconciliationRoutes.js";
import type { PrismaIopReconciliationGateway } from "../../case-repository/src/iopReconciliationGateway.js";
import { IopReconciliationError } from "../../case-repository/src/iopReconciliationGateway.js";
import { registerRevOpsRateReleaseRoutes } from "./revOpsRateReleaseRoutes.js";
import type { PrismaRevOpsRateReleaseGateway } from "../../case-repository/src/revOpsRateReleaseGateway.js";
import { RevOpsRateReleaseError } from "../../case-repository/src/revOpsRateReleaseGateway.js";
import { RevOpsError } from "../../rev-ops-service/src/index.js";
import {
  AssuranceServiceError,
  type AssuranceCommandService,
  type AssuranceQueryService,
} from "../../assurance-service/src/index.js";
import { ZodError } from "zod";
import { AuthenticationFailedError, LoginRejectedError, type AuthenticationService } from "@clarity/auth-service";
import { CaseNotFoundError, PermissionDeniedError, type CaseCommandService } from "@clarity/case-service";
import { PrescreenCommandError, type PrescreenCommandService } from "@clarity/prescreen-service";
import { registerAccessRoutes } from "./accessRoutes.js";
import type { AccessQueryService } from "@clarity/case-service";

/**
 * Thin Fastify adapter over the command/query services. Every route file
 * (authRoutes, prescreenRoutes, revOpsRoutes, operatingWorkbookRoutes,
 * iopReconciliationRoutes, assuranceRoutes) registers native Fastify routes;
 * this module only owns cross-cutting concerns — body limits, the shared
 * error mapping, and the not-found fallback. JSON only, 64 KiB default body cap.
 *
 * Invariants (enforced per route file, not here):
 * - organizationId and actor roles are taken ONLY from the verified principal.
 *   There is no request field through which a caller could supply either;
 *   unknown body fields are a 400.
 * - Failures are uniform and content-free: 401 for anything wrong with the
 *   token, 403 for a role the policy does not permit, 404 for a case the
 *   tenant cannot see. Internals are never echoed.
 */

const MAX_BODY_BYTES = 64 * 1024;

export interface ApiDeps {
  auth: AuthenticationService;
  accessQueries?: AccessQueryService;
  caseCommands: CaseCommandService;
  prescreen: PrescreenCommandService;
  revOps?: PrismaRevOpsGateway;
  operatingWorkbook?: PrismaOperatingWorkbookGateway;
  iopReconciliation?: PrismaIopReconciliationGateway;
  revOpsRateReleases?: PrismaRevOpsRateReleaseGateway;
  assuranceCommands?: AssuranceCommandService;
  assuranceQueries?: AssuranceQueryService;
  assuranceEvaluationCaseResolver?: AssuranceEvaluationCaseResolver;
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
  if (error instanceof RevOpsError) return new HttpError(error.status, error.code);
  if (error instanceof IopReconciliationError) return new HttpError(error.status, error.code);
  if (error instanceof RevOpsRateReleaseError) return new HttpError(error.status, error.code);
  if (error instanceof AssuranceServiceError) return new HttpError(error.status, error.code);
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

export function createApiServer(deps: ApiDeps): Server {
  const app = Fastify({
    bodyLimit: MAX_BODY_BYTES,
    logger: false,
    routerOptions: {
      // Fastify rejects malformed paths before the route handler can decode them.
      onBadUrl(_path, _req, res) {
        sendJson(res, 400, { error: "invalid_request" });
      },
    },
    serverFactory(handler) {
      return createServer(async (req, res) => {
        try {
          await app.ready();
          handler(req, res);
        } catch {
          res.writeHead(500);
          res.end();
        }
      });
    },
  });
  app.setErrorHandler((error, _request, reply) => {
    const e = error as { code?: string };
    const http = e.code === "FST_ERR_CTP_BODY_TOO_LARGE"
      ? new HttpError(413, "body_too_large")
      : ["FST_ERR_CTP_INVALID_JSON_BODY", "FST_ERR_CTP_EMPTY_JSON_BODY"].includes(e.code ?? "")
        ? new HttpError(400, "invalid_json")
        : e.code === "FST_ERR_CTP_INVALID_MEDIA_TYPE"
          ? new HttpError(415, "unsupported_media_type")
          : toHttpError(error);
    void reply.code(http.status).send({ error: http.code });
  });
  registerAuthRoutes(app, deps.auth, deps.caseCommands);
  if (deps.accessQueries) {
    registerAccessRoutes(app, deps.auth, deps.accessQueries);
  }
  registerPrescreenRoutes(app, deps.auth, deps.prescreen);
  if (deps.revOps) registerRevOpsRoutes(app, deps.auth, deps.revOps);
  if (deps.operatingWorkbook) registerOperatingWorkbookRoutes(app, deps.auth, deps.operatingWorkbook);
  if (deps.iopReconciliation)
    registerIopReconciliationRoutes(app, deps.auth, deps.iopReconciliation);
  if (deps.revOpsRateReleases)
    registerRevOpsRateReleaseRoutes(app, deps.auth, deps.revOpsRateReleases);
  if (deps.assuranceCommands || deps.assuranceQueries || deps.assuranceEvaluationCaseResolver) {
    if (!deps.assuranceCommands || !deps.assuranceQueries || !deps.assuranceEvaluationCaseResolver) {
      throw new Error("assurance_api_dependencies_incomplete");
    }
    registerAssuranceRoutes(
      app,
      deps.auth,
      deps.assuranceCommands,
      deps.assuranceQueries,
      deps.assuranceEvaluationCaseResolver,
    );
  }
  app.setNotFoundHandler((_request, reply) => {
    void reply.code(404).send({ error: "not_found" });
  });
  return app.server;
}
