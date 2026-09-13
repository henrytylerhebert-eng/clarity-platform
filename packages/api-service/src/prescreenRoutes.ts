import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { AuthenticationFailedError, type AuthenticationService } from "@clarity/auth-service";
import { AssessmentDraftInputSchema, type PrescreenCommandService } from "@clarity/prescreen-service";
import {
  PACKET_REQUIREMENT_STATES,
  PRESCREEN_READINESS_TARGETS,
  type AuthenticatedPrincipal,
} from "@clarity/domain-contracts";

// Prescreen bodies mirror the command envelopes MINUS every server-derived
// field (organizationId, actor, occurredAt, receivingOrganizationId). They
// are strict, so supplying any of those — or anything unknown — is a 400,
// never a silent overwrite.
const PRESCREEN_ID = z.string().min(1).max(200);
const PRESCREEN_IDEMPOTENCY_KEY = z.string().min(8).max(200);

const EncounterParamsSchema = z.object({ encounterId: PRESCREEN_ID }).strict();

const PrescreenStartBodySchema = z
  .object({
    caseId: PRESCREEN_ID,
    currentLocation: z.string().min(1).max(500),
    presentingConcern: z.string().min(1).max(5000),
    idempotencyKey: PRESCREEN_IDEMPOTENCY_KEY,
    correlationId: PRESCREEN_ID.optional(),
  })
  .strict();

const PrescreenDraftBodySchema = z
  .object({
    draft: AssessmentDraftInputSchema,
    expectedVersion: z.number().int().positive().optional(),
    idempotencyKey: PRESCREEN_IDEMPOTENCY_KEY,
    correlationId: PRESCREEN_ID.optional(),
  })
  .strict();

const PrescreenAttestBodySchema = z
  .object({
    assessmentVersionId: PRESCREEN_ID,
    expectedVersion: z.number().int().positive().optional(),
    idempotencyKey: PRESCREEN_IDEMPOTENCY_KEY,
    correlationId: PRESCREEN_ID.optional(),
  })
  .strict();

const PrescreenSupplementBodySchema = z
  .object({
    parentAssessmentVersionId: PRESCREEN_ID,
    reason: z.string().min(1).max(2000),
    draft: AssessmentDraftInputSchema,
    expectedVersion: z.number().int().positive().optional(),
    idempotencyKey: PRESCREEN_IDEMPOTENCY_KEY,
    correlationId: PRESCREEN_ID.optional(),
  })
  .strict();

const PrescreenSubmitBodySchema = z
  .object({
    assessmentVersionId: PRESCREEN_ID,
    target: z.enum(PRESCREEN_READINESS_TARGETS),
    expectedVersion: z.number().int().positive().optional(),
    idempotencyKey: PRESCREEN_IDEMPOTENCY_KEY,
    correlationId: PRESCREEN_ID.optional(),
  })
  .strict();

const PrescreenRequirementBodySchema = z
  .object({
    requirementCode: z.string().min(1).max(200),
    label: z.string().min(1).max(300),
    state: z.enum(PACKET_REQUIREMENT_STATES),
    blockingTargets: z.array(z.enum(PRESCREEN_READINESS_TARGETS)).min(1),
    responsibleRoleCode: z.string().min(1).max(200).optional(),
    resolutionWorkspace: z.string().min(1).max(200),
    sourceRuleId: PRESCREEN_ID,
    sourceRuleVersion: z.number().int().positive(),
    expectedVersion: z.number().int().positive().optional(),
    idempotencyKey: PRESCREEN_IDEMPOTENCY_KEY,
    correlationId: PRESCREEN_ID.optional(),
  })
  .strict();

const PrescreenReadinessQuerySchema = z
  .object({ target: z.enum(PRESCREEN_READINESS_TARGETS) })
  .strict();

async function principalFor(req: FastifyRequest, auth: AuthenticationService) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ") || header.length <= 7) {
    throw new AuthenticationFailedError();
  }
  return auth.authenticate(header.slice(7));
}

/**
 * The only way a prescreen actor is built above the service layer: identity
 * and role codes come from the verified principal, whose roles came from
 * the database (ADR-0011). Mirrors actorFor() for the prescreen actor shape.
 */
function prescreenActorFor(principal: AuthenticatedPrincipal) {
  return {
    actorId: principal.userId,
    actorType: "USER" as const,
    // The same verified roles must produce the same idempotency fingerprint.
    roleCodes: [...principal.roles].sort(),
  };
}

/**
 * Prescreen same-organization slice (ADR-0014; Phase 2 in-memory gateway —
 * prescreen state is process-local and non-durable until Phase 3):
 *
 *   POST /api/prescreen/encounters                    StartPrescreenEncounter
 *   POST /api/prescreen/encounters/{id}/draft         SaveAssessmentDraft
 *   POST /api/prescreen/encounters/{id}/attest        AttestAssessment
 *   POST /api/prescreen/encounters/{id}/supplements   CreateAssessmentSupplement
 *   POST /api/prescreen/encounters/{id}/submit        SubmitPrescreen
 *   POST /api/prescreen/encounters/{id}/requirements  UpdatePacketRequirement
 *   GET  /api/prescreen/encounters/{id}/readiness     EvaluateTargetReadiness (?target=…)
 *
 * receivingOrganizationId is derived from the principal (cross-org submission
 * is structurally inexpressible over HTTP) and occurredAt is server-stamped
 * (callers cannot backdate envelopes).
 */
export function registerPrescreenRoutes(
  app: FastifyInstance,
  auth: AuthenticationService,
  prescreen: PrescreenCommandService,
): void {
  app.post("/api/prescreen/encounters", async (req) => {
    const principal = await principalFor(req, auth);
    const body = PrescreenStartBodySchema.parse(req.body ?? {});
    return prescreen.startEncounter({
      organizationId: principal.organizationId,
      actor: prescreenActorFor(principal),
      occurredAt: new Date().toISOString(),
      ...body,
    });
  });

  app.post("/api/prescreen/encounters/:encounterId/draft", async (req) => {
    const principal = await principalFor(req, auth);
    const { encounterId } = EncounterParamsSchema.parse(req.params);
    const body = PrescreenDraftBodySchema.parse(req.body ?? {});
    return prescreen.saveAssessmentDraft({
      organizationId: principal.organizationId,
      actor: prescreenActorFor(principal),
      occurredAt: new Date().toISOString(),
      encounterId,
      ...body,
    });
  });

  app.post("/api/prescreen/encounters/:encounterId/attest", async (req) => {
    const principal = await principalFor(req, auth);
    const { encounterId } = EncounterParamsSchema.parse(req.params);
    const body = PrescreenAttestBodySchema.parse(req.body ?? {});
    return prescreen.attestAssessment({
      organizationId: principal.organizationId,
      actor: prescreenActorFor(principal),
      occurredAt: new Date().toISOString(),
      encounterId,
      ...body,
    });
  });

  app.post("/api/prescreen/encounters/:encounterId/supplements", async (req) => {
    const principal = await principalFor(req, auth);
    const { encounterId } = EncounterParamsSchema.parse(req.params);
    const body = PrescreenSupplementBodySchema.parse(req.body ?? {});
    return prescreen.createAssessmentSupplement({
      organizationId: principal.organizationId,
      actor: prescreenActorFor(principal),
      occurredAt: new Date().toISOString(),
      encounterId,
      ...body,
    });
  });

  app.post("/api/prescreen/encounters/:encounterId/submit", async (req) => {
    const principal = await principalFor(req, auth);
    const { encounterId } = EncounterParamsSchema.parse(req.params);
    const body = PrescreenSubmitBodySchema.parse(req.body ?? {});
    // Same-organization slice (ADR-0014): the receiving organization IS the
    // principal's organization, by construction.
    return prescreen.submitPrescreen({
      organizationId: principal.organizationId,
      actor: prescreenActorFor(principal),
      occurredAt: new Date().toISOString(),
      encounterId,
      ...body,
      receivingOrganizationId: principal.organizationId,
    });
  });

  app.post("/api/prescreen/encounters/:encounterId/requirements", async (req) => {
    const principal = await principalFor(req, auth);
    const { encounterId } = EncounterParamsSchema.parse(req.params);
    const body = PrescreenRequirementBodySchema.parse(req.body ?? {});
    return prescreen.updatePacketRequirement({
      organizationId: principal.organizationId,
      actor: prescreenActorFor(principal),
      occurredAt: new Date().toISOString(),
      encounterId,
      ...body,
    });
  });

  app.get("/api/prescreen/encounters/:encounterId/readiness", async (req) => {
    const principal = await principalFor(req, auth);
    const { encounterId } = EncounterParamsSchema.parse(req.params);
    const { target } = PrescreenReadinessQuerySchema.parse(req.query);
    return prescreen.evaluateTargetReadiness({
      organizationId: principal.organizationId,
      actor: prescreenActorFor(principal),
      encounterId,
      target,
    });
  });
}
