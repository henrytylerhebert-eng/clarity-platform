import { z } from "zod";
import { CommandActorSchema, LEVELS_OF_CARE } from "@clarity/domain-contracts";

/**
 * Authorization-readiness command envelopes (preparation phase only).
 * Note what is structurally absent: there is no way to assert an initial
 * status (it is derived from the cited benefit quote) and no way to reach
 * SUBMITTED or any payer-decision status (the submission phase adds those
 * behind assertHumanSubmitter).
 */

const baseEnvelope = {
  organizationId: z.string().min(1),
  caseId: z.string().min(1),
  actor: CommandActorSchema,
  correlationId: z.string().min(1).optional(),
  idempotencyKey: z.string().min(8).optional(),
  reason: z.string().min(1).optional(),
};

export const RecordAuthorizationCommandSchema = z
  .object({
    ...baseEnvelope,
    coverageId: z.string().min(1),
    /** The recorded quote that answers whether authorization is required. */
    benefitVerificationId: z.string().min(1),
    requestedLevelOfCare: z.enum(LEVELS_OF_CARE),
  })
  .strict();
export type RecordAuthorizationCommand = z.input<typeof RecordAuthorizationCommandSchema>;

/** Preparation-scope transition targets — the phase boundary, enforced structurally. */
export const PREPARATION_TRANSITION_TARGETS = ["PREPARING", "NOT_REQUIRED", "UNABLE_TO_COMPLETE"] as const;

export const TransitionAuthorizationPreparationCommandSchema = z
  .object({
    ...baseEnvelope,
    authorizationId: z.string().min(1),
    to: z.enum(PREPARATION_TRANSITION_TARGETS),
    expectedVersion: z.number().int().nonnegative().optional(),
  })
  .strict();
export type TransitionAuthorizationPreparationCommand = z.input<
  typeof TransitionAuthorizationPreparationCommandSchema
>;

export const AssessAuthorizationReadinessCommandSchema = z
  .object({
    organizationId: z.string().min(1),
    caseId: z.string().min(1),
    actor: CommandActorSchema,
  })
  .strict();
export type AssessAuthorizationReadinessCommand = z.input<
  typeof AssessAuthorizationReadinessCommandSchema
>;
