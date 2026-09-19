import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { AuthenticationFailedError, type AuthenticationService } from "@clarity/auth-service";
import type { AccessQueryService } from "@clarity/case-service";
import type { AuthenticatedPrincipal } from "@clarity/domain-contracts";

const CaseParamsSchema = z.object({ caseKey: z.string().min(1) }).strict();
const EmptyQuerySchema = z.object({}).strict();

function bearerToken(req: FastifyRequest): string {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ") || header.length <= 7) {
    throw new AuthenticationFailedError();
  }
  return header.slice(7);
}

async function principalFor(req: FastifyRequest, auth: AuthenticationService): Promise<AuthenticatedPrincipal> {
  return auth.authenticate(bearerToken(req));
}

export function registerAccessRoutes(
  app: FastifyInstance,
  auth: AuthenticationService,
  accessQueryService: AccessQueryService,
): void {
  app.get("/api/access/cases/:caseKey", async (req) => {
    const principal = await principalFor(req, auth);
    const { caseKey } = CaseParamsSchema.parse(req.params);
    EmptyQuerySchema.parse(req.query ?? {});

    const readModel = await accessQueryService.getCaseAccessModel(principal, caseKey);
    return readModel;
  });
}
