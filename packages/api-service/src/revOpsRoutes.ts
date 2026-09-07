import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import type { AuthenticationService } from "@clarity/auth-service";
import type { PrismaRevOpsGateway } from "../../case-repository/src/revOpsGateway.js";
import {
  RevOpsCommandSchema,
  RevOpsSetupSchema,
  RevOpsDate,
  RevOpsPeriod,
  RevOpsReconciliationSchema,
} from "../../domain-contracts/src/revOps.js";
import {
  requirePermission,
  RevOpsError,
} from "../../rev-ops-service/src/index.js";
import { parseRevOpsUpload, RevOpsUploadSchema } from "./revOpsImport.js";
import { planReconciliation } from "../../rev-ops-service/src/reconciliation.js";

export function registerRevOpsRoutes(
  app: FastifyInstance,
  auth: AuthenticationService,
  gateway: PrismaRevOpsGateway,
) {
  const principal = (req: FastifyRequest) => {
    const h = req.headers.authorization;
    if (!h?.startsWith("Bearer "))
      throw new RevOpsError("authentication_failed", 401);
    return auth.authenticate(h.slice(7));
  };
  const id = (req: FastifyRequest) =>
    z.object({ id: z.string().min(1).max(160) }).parse(req.params).id;
  app.get("/api/rev-ops/members", async (req) =>
    gateway.members(await principal(req)),
  );
  app.get("/api/rev-ops/workspaces", async (req) =>
    gateway.list(await principal(req)),
  );
  app.post("/api/rev-ops/workspaces", async (req) =>
    gateway.create(await principal(req), RevOpsSetupSchema.parse(req.body)),
  );
  app.get("/api/rev-ops/workspaces/:id", async (req) =>
    gateway.get(await principal(req), id(req)),
  );
  app.post("/api/rev-ops/workspaces/:id/commands", async (req) => {
    const actor = await principal(req);
    const body = z
      .object({
        revision: z.number().int().positive(),
        command: RevOpsCommandSchema,
      })
      .strict()
      .parse(req.body);
    return gateway.execute(actor, id(req), body.revision, [body.command], {
      kind: "manual",
      name: "Manual entry",
    });
  });
  app.post(
    "/api/rev-ops/workspaces/:id/import",
    { bodyLimit: 1500000 },
    async (req) => {
      const actor = await principal(req);
      const key = id(req);
      const body = z
        .object({
          revision: z.number().int().positive(),
          commit: z.boolean(),
          upload: RevOpsUploadSchema,
          reconciliation: RevOpsReconciliationSchema.optional(),
        })
        .strict()
        .parse(req.body);
      const view = await gateway.get(actor, key);
      requirePermission(
        view.state,
        actor,
        body.upload.kind === "budget" ? "budgetImport" : "actualEnter",
      );
      const parsed = await parseRevOpsUpload(body.upload, view.state);
      if (body.revision !== view.revision && !parsed.replayed)
        throw new RevOpsError("version_conflict_refresh_required");
      if (body.reconciliation) {
        const request = body.reconciliation;
        if (body.upload.kind !== "actuals")
          throw new RevOpsError("actuals_reconciliation_only", 400);
        if (body.commit && request.importKey !== parsed.importKey)
          throw new RevOpsError("preview_source_changed");
        const rows = parsed.rows.map((r) =>
          r.date && !r.date.startsWith(request.period + "-")
            ? {
                ...r,
                status: "invalid" as const,
                issues: [...r.issues, "Row is outside the selected month"],
              }
            : r,
        );
        if (!body.commit)
          return {
            ...parsed,
            revision: view.revision,
            reconciliation: {
              period: request.period,
              importKey: parsed.importKey,
              rows,
            },
            ...(parsed.replayed
              ? {
                  receipt: await gateway.importReceipt(
                    actor,
                    key,
                    parsed.importKey,
                  ),
                }
              : {}),
          };
        const plan = parsed.replayed
          ? undefined
          : planReconciliation(view.state, rows, request, parsed.importKey);
        return gateway.execute(
          actor,
          key,
          body.revision,
          plan?.commands ?? [],
          parsed.source,
          parsed.importKey,
          body.upload.kind,
          plan,
        );
      }
      if (!body.commit) return { ...parsed, revision: view.revision };
      if (parsed.issues.length)
        throw new RevOpsError("import_has_unresolved_rows", 400);
      return gateway.execute(
        actor,
        key,
        body.revision,
        parsed.commands,
        parsed.source,
        parsed.importKey,
        body.upload.kind,
      );
    },
  );
  app.get("/api/rev-ops/workspaces/:id/comparison", async (req) => {
    const actor = await principal(req);
    const q = z
      .object({
        period: RevOpsPeriod,
        through: RevOpsDate,
        budgetId: z.string().max(160).optional(),
      })
      .strict()
      .parse(req.query);
    return gateway.comparison(actor, id(req), q.period, q.through, q.budgetId);
  });
  app.get("/api/rev-ops/workspaces/:id/history", async (req) => {
    const q = z
      .object({ before: z.coerce.number().int().positive().optional() })
      .strict()
      .parse(req.query);
    return gateway.history(await principal(req), id(req), q.before);
  });
}
