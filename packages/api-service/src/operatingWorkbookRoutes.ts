import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import type { AuthenticationService } from "@clarity/auth-service";
import type { PrismaOperatingWorkbookGateway } from "../../case-repository/src/operatingWorkbookGateway.js";
import { RevOpsError } from "../../rev-ops-service/src/index.js";

// This accepted fixture supports the 2026 reporting year only.
const period = z.string().regex(/^2026(-(0[1-9]|1[0-2]))?$/);
const revision = z.number().int().positive();
const reason = z.string().trim().min(3).max(1000);
const key = z.string().min(1).max(160);
const cell = z.union([z.string().max(2000), z.number().finite(), z.boolean(), z.null()]);
export function registerOperatingWorkbookRoutes(app: FastifyInstance, auth: AuthenticationService, gateway: PrismaOperatingWorkbookGateway) {
  const actor = (req: FastifyRequest) => {
    const h = req.headers.authorization;
    if (!h?.startsWith("Bearer ")) throw new RevOpsError("authentication_failed", 401);
    return auth.authenticate(h.slice(7));
  };
  const id = (req: FastifyRequest) => z.object({ id: key }).parse(req.params).id;
  const base = "/api/rev-ops/workspaces/:id/operating-workbook";
  app.get(base, async (req, reply) => {
    reply.header("Cache-Control", "no-store");
    const q = z.object({ period: period.optional() }).strict().parse(req.query);
    return gateway.get(await actor(req), id(req), q.period);
  });
  app.post(base, async (req, reply) => {
    reply.header("Cache-Control", "no-store");
    const b = z.object({ action: z.literal("loadSample"), period: period.optional() }).strict().parse(req.body);
    return gateway.loadSample(await actor(req), id(req), b.period);
  });
  app.post(`${base}/edit`, async (req, reply) => {
    reply.header("Cache-Control", "no-store");
    const b = z.object({ revision, period: period.optional(), tableKey: key, rowId: key, columnKey: key, value: cell, reason }).strict().parse(req.body);
    return gateway.edit(await actor(req), id(req), b.revision, b, b.period);
  });
  app.post(`${base}/append`, async (req, reply) => {
    reply.header("Cache-Control", "no-store");
    const b = z.object({ revision, period: period.optional(), tableKey: z.enum(["payers", "services", "contractRates"]), values: z.record(cell).refine(v => Object.keys(v).length <= 50), reason }).strict().parse(req.body);
    return gateway.append(await actor(req), id(req), b.revision, b, b.period);
  });
  app.post(`${base}/snapshot`, async (req, reply) => {
    reply.header("Cache-Control", "no-store");
    const b = z.object({ revision, period, reason }).strict().parse(req.body);
    return gateway.snapshot(await actor(req), id(req), b.revision, b.period, b.reason);
  });
}
