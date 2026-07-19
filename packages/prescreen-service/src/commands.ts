import { z } from "zod";
import {
  ANSWER_VALUE_STATES,
  ISO_DATETIME_SCHEMA,
  PACKET_REQUIREMENT_STATES,
  PATIENT_WILLINGNESS_STATES,
  PRESCREEN_READINESS_TARGETS,
  OrientationObservationSchema,
} from "@clarity/domain-contracts";

/**
 * Prescreen command envelopes (Phase 2 — in-memory slice).
 *
 * Structural boundaries, per the approved scope:
 * - No command can express a legal status, admission decision, placement,
 *   transport authority, Central Intake acknowledgement, or facility
 *   acceptance — those are separate human commands that do not exist here.
 * - No command can assert a possible pathway; it is always derived.
 * - Submission names a workflow target and a receiving organization as a
 *   recorded intent only; nothing grants that organization access.
 * - Unknown fields are rejected (`.strict()`), so the forbidden concepts
 *   cannot be smuggled in through an envelope.
 */

const ID = z.string().min(1).max(200);

/**
 * Prescreen command actor. Role codes are free-form strings evaluated
 * against an explicitly injected policy because the production role
 * taxonomy for prescreen actors (field officers, prescreen assessors,
 * Central Intake) is deliberately NOT invented in this slice — see
 * docs/decisions/PRESCREEN_ROLE_MAPPING_DECISION_PACKET.md. Synthetic
 * tests use clearly synthetic role codes. This diverges from
 * CommandActorSchema (exact UserRole enum) on purpose and must be
 * reconciled before any API/UI exposure.
 */
export const PrescreenCommandActorSchema = z
  .object({
    actorId: ID,
    actorType: z.enum(["USER", "AGENT", "SYSTEM"]).default("USER"),
    roleCodes: z.array(z.string().min(1).max(200)).default([]),
  })
  .strict();
export type PrescreenCommandActor = z.input<typeof PrescreenCommandActorSchema>;

const baseEnvelope = {
  organizationId: ID,
  actor: PrescreenCommandActorSchema,
  correlationId: ID.optional(),
  idempotencyKey: z.string().min(8).max(200),
  occurredAt: ISO_DATETIME_SCHEMA,
};

/** Draft assessment content supplied by the actor. Status and pathway are never caller-supplied. */
export const AssessmentDraftInputSchema = z
  .object({
    assessmentVersionId: ID,
    willingness: z.enum(PATIENT_WILLINGNESS_STATES),
    orientation: OrientationObservationSchema,
    immediateMedicalStabilizationRequired: z.boolean().default(false),
    activeEmergencyOrLegalProcess: z.boolean().default(false),
    answers: z
      .array(
        z
          .object({
            answerId: ID,
            questionCode: z.string().min(1).max(200),
            valueState: z.enum(ANSWER_VALUE_STATES),
            narrative: z.string().min(1).max(10000).optional(),
            sourceIds: z.array(ID),
          })
          .strict(),
      )
      .default([]),
    sources: z
      .array(
        z
          .object({
            sourceId: ID,
            sourceType: z.enum([
              "DIRECT_OBSERVATION",
              "PATIENT_REPORT",
              "FAMILY_SUPPORT_REPORT",
              "FACILITY_STAFF_REPORT",
              "LAW_ENFORCEMENT_REPORT",
              "CLINICIAN_REPORT",
              "DOCUMENT",
              "SYSTEM_DERIVED",
              "UNKNOWN",
            ]),
            label: z.string().min(1).max(300).optional(),
            documentVersionId: ID.optional(),
          })
          .strict(),
      )
      .default([]),
  })
  .strict();
export type AssessmentDraftInput = z.input<typeof AssessmentDraftInputSchema>;

export const StartPrescreenEncounterCommandSchema = z
  .object({
    ...baseEnvelope,
    caseId: ID,
    currentLocation: z.string().min(1).max(500),
    presentingConcern: z.string().min(1).max(5000),
  })
  .strict();
export type StartPrescreenEncounterCommand = z.input<typeof StartPrescreenEncounterCommandSchema>;

export const SaveAssessmentDraftCommandSchema = z
  .object({
    ...baseEnvelope,
    encounterId: ID,
    expectedVersion: z.number().int().positive().optional(),
    draft: AssessmentDraftInputSchema,
  })
  .strict();
export type SaveAssessmentDraftCommand = z.input<typeof SaveAssessmentDraftCommandSchema>;

export const AttestAssessmentCommandSchema = z
  .object({
    ...baseEnvelope,
    encounterId: ID,
    assessmentVersionId: ID,
    expectedVersion: z.number().int().positive().optional(),
  })
  .strict();
export type AttestAssessmentCommand = z.input<typeof AttestAssessmentCommandSchema>;

export const CreateAssessmentSupplementCommandSchema = z
  .object({
    ...baseEnvelope,
    encounterId: ID,
    parentAssessmentVersionId: ID,
    reason: z.string().min(1).max(2000),
    expectedVersion: z.number().int().positive().optional(),
    draft: AssessmentDraftInputSchema,
  })
  .strict();
export type CreateAssessmentSupplementCommand = z.input<typeof CreateAssessmentSupplementCommandSchema>;

/**
 * Submission = "the actor submitted an immutable assessment version to a
 * named workflow target." It records intent; it is structurally incapable
 * of expressing acknowledgement, review, acceptance, admission, or access.
 */
export const SubmitPrescreenCommandSchema = z
  .object({
    ...baseEnvelope,
    encounterId: ID,
    assessmentVersionId: ID,
    target: z.enum(PRESCREEN_READINESS_TARGETS),
    receivingOrganizationId: ID,
    expectedVersion: z.number().int().positive().optional(),
  })
  .strict();
export type SubmitPrescreenCommand = z.input<typeof SubmitPrescreenCommandSchema>;

export const UpdatePacketRequirementCommandSchema = z
  .object({
    ...baseEnvelope,
    encounterId: ID,
    requirementCode: z.string().min(1).max(200),
    label: z.string().min(1).max(300),
    state: z.enum(PACKET_REQUIREMENT_STATES),
    blockingTargets: z.array(z.enum(PRESCREEN_READINESS_TARGETS)).min(1),
    responsibleRoleCode: z.string().min(1).max(200).optional(),
    resolutionWorkspace: z.string().min(1).max(200),
    sourceRuleId: ID,
    sourceRuleVersion: z.number().int().positive(),
    expectedVersion: z.number().int().positive().optional(),
  })
  .strict();
export type UpdatePacketRequirementCommand = z.input<typeof UpdatePacketRequirementCommandSchema>;

/** Read-only derived view; no mutation, no idempotency key. */
export const EvaluateTargetReadinessCommandSchema = z
  .object({
    organizationId: ID,
    actor: PrescreenCommandActorSchema,
    encounterId: ID,
    target: z.enum(PRESCREEN_READINESS_TARGETS),
  })
  .strict();
export type EvaluateTargetReadinessCommand = z.input<typeof EvaluateTargetReadinessCommandSchema>;
