import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import type { AuthenticationService } from "@clarity/auth-service";
import { PrismaIopReconciliationGateway, IopReconciliationError } from "../../case-repository/src/iopReconciliationGateway.js";

export function registerIopReconciliationRoutes(app: FastifyInstance, auth: AuthenticationService, gateway: PrismaIopReconciliationGateway) {
  const principal = (req: FastifyRequest) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new IopReconciliationError("authentication_failed", 401);
    return auth.authenticate(header.slice(7));
  };
  const id = (req: FastifyRequest) => z.object({ id: z.string().min(1).max(160) }).parse(req.params).id;
  app.post("/api/iop/reconciliation-imports", { bodyLimit: 1500000 }, async (req) => gateway.import(await principal(req), req.body));
  app.get("/api/iop/reconciliation-imports/:id", async (req) => gateway.get(await principal(req), id(req)));
  app.post("/api/iop/reconciliation-imports/:id/issues/:issueKey/reviews", async (req) => {
    const issueKey = z.object({ issueKey: z.string().min(1).max(240) }).parse(req.params).issueKey;
    return gateway.review(await principal(req), id(req), issueKey, req.body);
  });
  app.post("/api/iop/reconciliation-imports/:id/close", async (req) => gateway.close(await principal(req), id(req), req.body));
}
