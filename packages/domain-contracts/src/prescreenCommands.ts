import { z } from "zod";
import { DOMAIN_ID_SCHEMA, ISO_DATETIME_SCHEMA } from "./episode.js";
import {
  ANSWER_VALUE_STATES,
  OrientationObservationSchema,
  PACKET_REQUIREMENT_STATES,
  PATIENT_WILLINGNESS_STATES,
  PRESCREEN_READINESS_TARGETS,
  type PrescreenErrorCode,
} from "./prescreen.js";

/**
 * Prescreen command envelopes, stable errors, canonical serialization, and
 * gateway result shapes. These moved here from @clarity/prescreen-service
 * (which re-exports them unchanged) so the Phase 3 persistence adapter in
 * @clarity/case-repository can share the exact same contract without a
 * package cycle — the same placement as the S2 AdmissionHandoffCommand.
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

const ID = DOMAIN_ID_SCHEMA;

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

// ---------------------------------------------------------------------------
// Fully parsed command shapes (defaults applied), shared by every gateway.
// ---------------------------------------------------------------------------

export type ParsedStartPrescreenEncounter = z.output<typeof StartPrescreenEncounterCommandSchema>;
export type ParsedSaveAssessmentDraft = z.output<typeof SaveAssessmentDraftCommandSchema>;
export type ParsedAttestAssessment = z.output<typeof AttestAssessmentCommandSchema>;
export type ParsedCreateAssessmentSupplement = z.output<typeof CreateAssessmentSupplementCommandSchema>;
export type ParsedSubmitPrescreen = z.output<typeof SubmitPrescreenCommandSchema>;
export type ParsedUpdatePacketRequirement = z.output<typeof UpdatePacketRequirementCommandSchema>;
export type ParsedEvaluateTargetReadiness = z.output<typeof EvaluateTargetReadinessCommandSchema>;

export interface PrescreenCommandResult {
  readonly objectId: string;
  readonly objectType: "PrescreenEncounter" | "PrescreenAssessmentVersion" | "PacketRequirement";
  readonly encounterId: string;
  readonly encounterVersion: number;
  readonly status: string;
  readonly replayed: boolean;
}

/** Recorded submission intent. Grants nothing; implies no acknowledgement, review, or acceptance. */
export interface PrescreenSubmissionRecord {
  readonly encounterId: string;
  readonly organizationId: string;
  readonly assessmentVersionId: string;
  readonly target: string;
  readonly receivingOrganizationId: string;
  readonly submittedAt: string;
  readonly submittedBy: string;
}

// ---------------------------------------------------------------------------
// Stable prescreen command errors. Every class carries a code from the
// Phase 1 PRESCREEN_ERROR_CODES vocabulary and a message that never
// discloses whether an unauthorized or cross-tenant identifier exists.
// ---------------------------------------------------------------------------

export class PrescreenCommandError extends Error {
  constructor(
    public readonly code: PrescreenErrorCode,
    message: string,
    public readonly details: readonly string[] = [],
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** Actor's role codes do not permit the command. Raised before any read. */
export class PrescreenPermissionDeniedError extends PrescreenCommandError {
  constructor(command: string, roleCodes: readonly string[]) {
    super(
      "PERMISSION_DENIED",
      `Role codes [${roleCodes.join(", ") || "none"}] are not permitted to execute ${command}`,
    );
  }
}

/** Resource absent or outside the actor's organization — one indistinguishable answer. */
export class PrescreenNotFoundError extends PrescreenCommandError {
  constructor(kind: "encounter" | "assessment" | "case") {
    super("RESOURCE_NOT_FOUND", `The prescreen ${kind} was not found.`);
  }
}

export class PrescreenVersionConflictError extends PrescreenCommandError {
  constructor() {
    super("PRESCREEN_VERSION_CONFLICT", "The record changed. Refresh and review before trying again.");
  }
}

export class PrescreenIdempotencyKeyReusedError extends PrescreenCommandError {
  constructor() {
    super("IDEMPOTENCY_KEY_REUSED", "The idempotency key was already used for a different command body.");
  }
}

export class AssessmentNotDraftError extends PrescreenCommandError {
  constructor() {
    super("ASSESSMENT_NOT_DRAFT", "The assessment version is not editable as a draft.");
  }
}

export class AssessmentVersionRequiredError extends PrescreenCommandError {
  constructor(message: string) {
    super("ASSESSMENT_VERSION_REQUIRED", message);
  }
}

export class PrescreenDomainValidationError extends PrescreenCommandError {
  constructor(message: string, details: readonly string[] = []) {
    super("DOMAIN_VALIDATION_FAILED", message, details);
  }
}

// ---------------------------------------------------------------------------
// Canonical JSON: object keys sorted recursively at every depth, arrays in
// order. This closes the reference-package defect where a top-level
// key-whitelist replacer serialized nested command bodies as {} and let a
// changed body replay under the same idempotency key. Both prescreen
// gateways hash exactly this serialization (SHA-256 applied by the caller,
// which owns the crypto dependency — this package stays runtime-pure).
// ---------------------------------------------------------------------------

export function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  const toJSON = (value as { toJSON?: unknown }).toJSON;
  if (typeof toJSON === "function") {
    return canonicalStringify((value as { toJSON: () => unknown }).toJSON());
  }
  if (Array.isArray(value)) return `[${value.map((item) => canonicalStringify(item)).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${canonicalStringify(v)}`);
  return `{${entries.join(",")}}`;
}

/**
 * The canonical prescreen idempotency fingerprint input: the full parsed
 * command minus correlationId, idempotencyKey, and occurredAt. occurredAt
 * is excluded because the key identifies the command's INTENT and the
 * arrival time of a retry is not intent — the API layer server-stamps
 * occurredAt per request (ADR-0014 §5), so keeping it would turn every
 * legitimate HTTP retry into an IDEMPOTENCY_KEY_REUSED conflict. First
 * write wins for stored times.
 */
export function prescreenFingerprintBody(cmd: Record<string, unknown>): string {
  const {
    correlationId: _correlationId,
    idempotencyKey: _idempotencyKey,
    occurredAt: _occurredAt,
    ...body
  } = cmd;
  return canonicalStringify(body);
}
