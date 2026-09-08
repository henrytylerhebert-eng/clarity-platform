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
import { randomUUID } from "node:crypto";
import { buildExportDocument, renderExport, EXPORT_TEMPLATE } from "./revOpsExport.js";

export function registerRevOpsRoutes(
  app: FastifyInstance,
  auth: AuthenticationService,
  gateway: PrismaRevOpsGateway,
) {
  const activeExports = new Set<string>();
  const principal = (req: FastifyRequest) => {
    const h = req.headers.authorization;
    if (!h?.startsWith("Bearer "))
      throw new RevOpsError("authentication_failed", 401);
    return auth.authenticate(h.slice(7));
  };
  const id = (req: FastifyRequest) =>
    z.object({ id: z.string().min(1).max(160) }).parse(req.params).id;
  const receiptRevision = (req: FastifyRequest) => z.object({revision:z.coerce.number().int().positive().max(2147483647)}).parse(req.params).revision;
  app.get("/api/rev-ops/workspaces/:id/receipts/:revision", async(req,reply)=>{
    reply.header("Cache-Control","no-store");
    z.object({}).strict().parse(req.query);
    return buildExportDocument(await gateway.exportContext(await principal(req),id(req),receiptRevision(req)));
  });
  app.post("/api/rev-ops/workspaces/:id/receipts/:revision/export", {bodyLimit:2048}, async(req,reply)=>{
    reply.header("Cache-Control","no-store");
    const actor=await principal(req);
    const key=id(req);
    const body=z.object({workspaceRevision:z.number().int().positive(),receiptHash:z.string().regex(/^[a-f0-9]{64}$/)}).strict().parse(req.body);
    const revision=receiptRevision(req);
    if(activeExports.size>=2 || activeExports.has(actor.organizationId)) throw new RevOpsError("export_busy_retry",429);
    activeExports.add(actor.organizationId);
    let requested=false;
    const metadata={requestId:randomUUID(),receiptRevision:revision,receiptHash:body.receiptHash,templateVersion:EXPORT_TEMPLATE};
    try {
      const context=await gateway.exportContext(actor,key,metadata.receiptRevision);
      const document=buildExportDocument(context);
      if(body.workspaceRevision!==context.workspaceRevision || body.receiptHash!==document.receiptHash) throw new RevOpsError("version_conflict_refresh_required");
      await gateway.exportEvent(actor,key,body.workspaceRevision,metadata,"requested");
      requested=true;
      const started=Date.now();
      const bytes=await renderExport(document,metadata.requestId,new Date().toISOString(),actor.userId);
      if(Date.now()-started>10000) throw new RevOpsError("export_generation_timeout",503);
      // Session, active user, current roles and current workspace grant are rechecked before delivery.
      const currentActor=await principal(req);
      await gateway.exportEvent(currentActor,key,body.workspaceRevision,{...metadata,bytes:bytes.length},"generated_delivery_authorized");
      return reply.type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        .header("X-Content-Type-Options","nosniff")
        .header("Content-Disposition",`attachment; filename="${document.filename}"`)
        .header("X-Export-Request-Id",metadata.requestId).send(bytes);
    } catch(error) {
      if(requested) await gateway.exportEvent(actor,key,body.workspaceRevision,metadata,"failed");
      throw error;
    } finally { activeExports.delete(actor.organizationId); }
  });
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
