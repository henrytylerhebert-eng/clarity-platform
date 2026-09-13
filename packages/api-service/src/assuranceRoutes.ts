import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  AuthenticationFailedError,
  type AuthenticationService,
} from "@clarity/auth-service";
import { ASSURANCE_REVIEW_DECISIONS } from "@clarity/domain-contracts";
import {
  AssuranceServiceNotFoundError,
  type AssuranceCommandService,
  type AssuranceQueryService,
} from "../../assurance-service/src/index.js";

const ASSURANCE_ID = z.string().min(1).max(200);
const ASSURANCE_PAYLOAD = z.record(z.unknown());

const CaseParamsSchema = z.object({ caseKey: ASSURANCE_ID }).strict();
const EvaluationParamsSchema = z.object({ evaluationId: ASSURANCE_ID }).strict();
const EvidenceBodySchema = z
  .object({
    expectationId: ASSURANCE_ID,
    payload: ASSURANCE_PAYLOAD,
  })
  .strict();
const EvidenceRevisionBodySchema = z
  .object({
    priorSubmissionId: ASSURANCE_ID,
    payload: ASSURANCE_PAYLOAD,
  })
  .strict();
const EvaluateBodySchema = z.object({ expectationId: ASSURANCE_ID }).strict();
const ReviewBodySchema = z
  .object({
    decision: z.enum(ASSURANCE_REVIEW_DECISIONS),
    rationale: z.string().max(5000).optional(),
  })
  .strict();

export type AssuranceEvaluationCaseResolver = (
  organizationId: string,
  evaluationId: string,
) => Promise<string | undefined>;

async function principalFor(req: FastifyRequest, auth: AuthenticationService) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ") || header.length <= 7) {
    throw new AuthenticationFailedError();
  }
  return auth.authenticate(header.slice(7));
}

export function registerAssuranceRoutes(
  app: FastifyInstance,
  auth: AuthenticationService,
  commands: AssuranceCommandService,
  queries: AssuranceQueryService,
  resolveEvaluationCaseKey: AssuranceEvaluationCaseResolver,
): void {
  app.get("/api/assurance/cases/:caseKey", async (req) => {
    const principal = await principalFor(req, auth);
    const { caseKey } = CaseParamsSchema.parse(req.params);
    return queries.getCaseView(principal, caseKey);
  });

  app.get("/api/assurance/cases/:caseKey/history", async (req) => {
    const principal = await principalFor(req, auth);
    const { caseKey } = CaseParamsSchema.parse(req.params);
    return queries.getCaseHistory(principal, caseKey);
  });

  app.post("/api/assurance/cases/:caseKey/evidence", async (req) => {
    const principal = await principalFor(req, auth);
    const { caseKey } = CaseParamsSchema.parse(req.params);
    const body = EvidenceBodySchema.parse(req.body ?? {});
    return commands.submitEvidence(principal, {
      caseKey,
      expectationId: body.expectationId,
      payload: body.payload,
    });
  });

  app.post("/api/assurance/cases/:caseKey/evidence/revisions", async (req) => {
    const principal = await principalFor(req, auth);
    const { caseKey } = CaseParamsSchema.parse(req.params);
    const body = EvidenceRevisionBodySchema.parse(req.body ?? {});
    return commands.reviseEvidence(principal, {
      caseKey,
      priorSubmissionId: body.priorSubmissionId,
      payload: body.payload,
    });
  });

  app.post("/api/assurance/cases/:caseKey/evaluate", async (req) => {
    const principal = await principalFor(req, auth);
    const { caseKey } = CaseParamsSchema.parse(req.params);
    const body = EvaluateBodySchema.parse(req.body ?? {});
    return commands.evaluate(principal, {
      caseKey,
      expectationId: body.expectationId,
    });
  });

  app.post("/api/assurance/evaluations/:evaluationId/review", async (req) => {
    const principal = await principalFor(req, auth);
    const { evaluationId } = EvaluationParamsSchema.parse(req.params);
    const body = ReviewBodySchema.parse(req.body ?? {});
    const caseKey = await resolveEvaluationCaseKey(principal.organizationId, evaluationId);
    if (!caseKey) throw new AssuranceServiceNotFoundError();
    return commands.review(principal, {
      caseKey,
      evaluationId,
      decision: body.decision,
      rationale: body.rationale,
    });
  });
}
