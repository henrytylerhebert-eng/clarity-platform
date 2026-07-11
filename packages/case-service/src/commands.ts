import { z } from "zod";
import {
  CASE_STATUSES,
  CommandActorSchema,
  URGENCY_LEVELS,
  WORKSTREAM_STATUSES,
  WORKSTREAMS,
} from "@clarity/domain-contracts";

/**
 * Command envelopes. Every command carries tenant, actor identity + roles,
 * optional correlation/idempotency, optional reason, and (for mutations of an
 * existing case) the case key and optional expected version.
 * CommandActorSchema/CommandActor live in @clarity/domain-contracts (shared by
 * every command service); re-exported here for backward compatibility.
 */

export { CommandActorSchema };
export type { CommandActor } from "@clarity/domain-contracts";

const baseEnvelope = {
  organizationId: z.string().min(1),
  actor: CommandActorSchema,
  correlationId: z.string().min(1).optional(),
  idempotencyKey: z.string().min(8).optional(),
  reason: z.string().min(1).optional(),
};

const caseEnvelope = {
  ...baseEnvelope,
  caseKey: z.string().min(1),
  expectedVersion: z.number().int().nonnegative().optional(),
};

export const CreateCaseCommandSchema = z
  .object({
    ...baseEnvelope,
    caseKey: z.string().min(1),
    patientTokenId: z.string().min(1),
    urgency: z.enum(URGENCY_LEVELS).default("ROUTINE"),
    currentLocation: z.string().min(1).optional(),
  })
  .strict();
export type CreateCaseCommand = z.input<typeof CreateCaseCommandSchema>;

export const AssignCaseCommandSchema = z
  .object({ ...caseEnvelope, assigneeUserId: z.string().min(1) })
  .strict();
export type AssignCaseCommand = z.input<typeof AssignCaseCommandSchema>;

export const UpdateCaseUrgencyCommandSchema = z
  .object({ ...caseEnvelope, urgency: z.enum(URGENCY_LEVELS) })
  .strict();
export type UpdateCaseUrgencyCommand = z.input<typeof UpdateCaseUrgencyCommandSchema>;

export const UpdateCaseLocationCommandSchema = z
  .object({ ...caseEnvelope, currentLocation: z.string().min(1) })
  .strict();
export type UpdateCaseLocationCommand = z.input<typeof UpdateCaseLocationCommandSchema>;

export const TransitionCaseCommandSchema = z
  .object({ ...caseEnvelope, to: z.enum(CASE_STATUSES) })
  .strict();
export type TransitionCaseCommand = z.input<typeof TransitionCaseCommandSchema>;

export const UpdateWorkstreamStatusCommandSchema = z
  .object({ ...caseEnvelope, workstream: z.enum(WORKSTREAMS), to: z.enum(WORKSTREAM_STATUSES) })
  .strict();
export type UpdateWorkstreamStatusCommand = z.input<typeof UpdateWorkstreamStatusCommandSchema>;

export const RecordDecisionRationaleCommandSchema = z
  .object({ ...caseEnvelope, reason: z.string().min(1), decisionContext: z.string().min(1) })
  .strict();
export type RecordDecisionRationaleCommand = z.input<typeof RecordDecisionRationaleCommandSchema>;

export const CloseCaseCommandSchema = z.object({ ...caseEnvelope }).strict();
export type CloseCaseCommand = z.input<typeof CloseCaseCommandSchema>;

export const ReopenCaseCommandSchema = z
  .object({ ...caseEnvelope, reopenTo: z.enum(CASE_STATUSES) })
  .strict();
export type ReopenCaseCommand = z.input<typeof ReopenCaseCommandSchema>;

/**
 * Transitions into exit/exception states are high-impact and require a
 * documented rationale, as do urgency changes, close, and reopen.
 */
export const RATIONALE_REQUIRED_TRANSITIONS = [
  "CANCELLED",
  "WITHDRAWN",
  "NO_PLACEMENT_FOUND",
  "REFERRED_TO_ALTERNATIVE_LEVEL",
] as const;
