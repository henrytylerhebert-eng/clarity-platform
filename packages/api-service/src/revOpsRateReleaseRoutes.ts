import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import type { AuthenticationService } from "@clarity/auth-service";
import {
  PrismaRevOpsRateReleaseGateway,
  RevOpsRateReleaseError,
} from "../../case-repository/src/revOpsRateReleaseGateway.js";

export function registerRevOpsRateReleaseRoutes(
  app: FastifyInstance,
  auth: AuthenticationService,
  gateway: PrismaRevOpsRateReleaseGateway,
) {
  const principal = (req: FastifyRequest) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer "))
      throw new RevOpsRateReleaseError("authentication_failed", 401);
    return auth.authenticate(header.slice(7));
  };
  app.get("/api/rev-ops/rate-releases", async (req) => {
    const query = z
      .object({
        programMethod: z.string().min(1).max(80),
        includeSuperseded: z.enum(["true", "false"]).optional(),
      })
      .strict()
      .parse(req.query);
    return gateway.list(
      await principal(req),
      query.programMethod,
      query.includeSuperseded === "true",
    );
  });
  app.post(
    "/api/rev-ops/rate-releases",
    { bodyLimit: 2_000_000 },
    async (req) => gateway.record(await principal(req), req.body),
  );
}
