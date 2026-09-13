import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { AuthenticationFailedError, type AuthenticationService } from "@clarity/auth-service";
import type { CaseCommandService } from "@clarity/case-service";
import type { AuthenticatedPrincipal } from "@clarity/domain-contracts";

const LoginBodySchema = z.object({ assertion: z.string().min(16) }).strict();

const DecisionRationaleParamsSchema = z.object({ caseKey: z.string().min(1) }).strict();
const DecisionRationaleBodySchema = z
  .object({
    reason: z.string().min(1),
    decisionContext: z.string().min(1),
    citedLegalStatusRecordId: z.string().min(1).optional(),
    idempotencyKey: z.string().min(8).optional(),
  })
  .strict();

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

function bearerToken(req: FastifyRequest): string {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ") || header.length <= 7) {
    throw new AuthenticationFailedError();
  }
  return header.slice(7);
}

async function principalFor(req: FastifyRequest, auth: AuthenticationService) {
  return auth.authenticate(bearerToken(req));
}

/**
 * The API vertical slice (retires the "actor roles are trusted caller input"
 * assumption on one real path):
 *
 *   POST /api/auth/login                              { assertion } → { token, principal }
 *   GET  /api/auth/session                            bearer → principal
 *   POST /api/auth/logout                             bearer → 204
 *   POST /api/cases/{caseKey}/decision-rationale      bearer + body → command result
 *
 * organizationId and actor roles are taken ONLY from the verified principal
 * (AuthenticationService.authenticate → actorFor). There is no request field
 * through which a caller could supply either; unknown body fields are a 400.
 */
export function registerAuthRoutes(
  app: FastifyInstance,
  auth: AuthenticationService,
  caseCommands: CaseCommandService,
): void {
  app.post("/api/auth/login", async (req) => {
    const { assertion } = LoginBodySchema.parse(req.body ?? {});
    const { token, principal } = await auth.login(assertion);
    return { token, principal: serializePrincipal(principal) };
  });

  app.get("/api/auth/session", async (req) => {
    const principal = await principalFor(req, auth);
    return { principal: serializePrincipal(principal) };
  });

  app.post("/api/auth/logout", async (req, reply) => {
    await auth.logout(bearerToken(req));
    reply.code(204);
    return reply.send();
  });

  app.post("/api/cases/:caseKey/decision-rationale", async (req) => {
    const principal = await principalFor(req, auth);
    const { caseKey } = DecisionRationaleParamsSchema.parse(req.params);
    const body = DecisionRationaleBodySchema.parse(req.body ?? {});
    // The load-bearing lines of the slice: tenant and actor come from the
    // verified principal, not from anything the caller sent.
    const result = await caseCommands.recordDecisionRationale({
      organizationId: principal.organizationId,
      actor: auth.actorFor(principal),
      caseKey,
      reason: body.reason,
      decisionContext: body.decisionContext,
      citedLegalStatusRecordId: body.citedLegalStatusRecordId,
      idempotencyKey: body.idempotencyKey,
    });
    return {
      caseKey: result.case.caseKey,
      version: result.case.version ?? null,
      replayed: result.replayed,
    };
  });
}
