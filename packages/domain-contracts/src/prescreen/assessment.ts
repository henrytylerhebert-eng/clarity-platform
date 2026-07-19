import { z } from "zod";
import { DOMAIN_ID_SCHEMA, ISO_DATETIME_SCHEMA } from "../episode.js";
import { PrescreenContractError } from "./errors.js";

export const PATIENT_WILLINGNESS_STATES = [
  "WILLING",
  "NON_OPPOSED",
  "OPPOSED",
  "UNABLE_TO_EXPRESS",
  "FLUCTUATING",
  "UNKNOWN",
  "NOT_ASSESSED",
] as const;
export type PatientWillingness = (typeof PATIENT_WILLINGNESS_STATES)[number];

export const ORIENTATION_STATUSES = [
  "ORIENTED",
  "NOT_ORIENTED",
  "UNABLE_TO_ASSESS",
  "NOT_ASSESSED",
  "UNKNOWN",
] as const;
export type OrientationStatus = (typeof ORIENTATION_STATUSES)[number];

export const ORIENTATION_DOMAINS = ["person", "place", "time", "situation"] as const;
export type OrientationDomain = (typeof ORIENTATION_DOMAINS)[number];

export const OrientationFindingSchema = z
  .object({
    status: z.enum(ORIENTATION_STATUSES),
    observation: z.string().max(2_000).nullable().optional(),
  })
  .strict();
export type OrientationFinding = Readonly<z.infer<typeof OrientationFindingSchema>>;

export const OrientationObservationSchema = z
  .object({
    observedAt: ISO_DATETIME_SCHEMA,
    sourceId: DOMAIN_ID_SCHEMA.nullable().optional(),
    domains: z
      .object({
        person: OrientationFindingSchema,
        place: OrientationFindingSchema,
        time: OrientationFindingSchema,
        situation: OrientationFindingSchema,
      })
      .strict(),
  })
  .strict();
export type OrientationObservation = Readonly<z.infer<typeof OrientationObservationSchema>>;

export const POSSIBLE_PRESCREEN_PATHWAYS = [
  "POSSIBLE_FORMAL_VOLUNTARY_REVIEW",
  "POSSIBLE_NONCONTESTED_PATHWAY",
  "EMERGENCY_OR_LEGAL_REVIEW_REQUIRED",
  "MEDICAL_STABILIZATION_REQUIRED",
  "COMMUNITY_OR_OTHER_DISPOSITION",
  "UNDETERMINED",
] as const;
export type PossiblePrescreenPathway = (typeof POSSIBLE_PRESCREEN_PATHWAYS)[number];

export const ASSESSMENT_STATUSES = ["DRAFT", "ATTESTED", "CORRECTED", "SUPERSEDED"] as const;
export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];

export const ANSWER_VALUE_STATES = [
  "ANSWERED",
  "UNKNOWN",
  "NOT_ASSESSED",
  "DECLINED_TO_ANSWER",
  "NOT_APPLICABLE",
] as const;
export type AnswerValueState = (typeof ANSWER_VALUE_STATES)[number];

export const SOURCE_TYPES = [
  "DIRECT_OBSERVATION",
  "PATIENT_REPORT",
  "FAMILY_SUPPORT_REPORT",
  "FACILITY_STAFF_REPORT",
  "LAW_ENFORCEMENT_REPORT",
  "CLINICIAN_REPORT",
  "DOCUMENT",
  "SYSTEM_DERIVED",
  "UNKNOWN",
] as const;

export const AssessmentSourceSchema = z
  .object({
    sourceId: DOMAIN_ID_SCHEMA,
    sourceType: z.enum(SOURCE_TYPES),
    displayLabel: z.string().max(500).nullable().optional(),
    documentVersionId: DOMAIN_ID_SCHEMA.nullable().optional(),
    recordedAt: ISO_DATETIME_SCHEMA,
  })
  .strict();
export type AssessmentSource = Readonly<z.infer<typeof AssessmentSourceSchema>>;

export const AssessmentAnswerSchema = z
  .object({
    answerId: DOMAIN_ID_SCHEMA,
    questionCode: DOMAIN_ID_SCHEMA,
    valueState: z.enum(ANSWER_VALUE_STATES),
    value: z.unknown().optional(),
    narrative: z.string().max(10_000).nullable().optional(),
    sourceIds: z.array(DOMAIN_ID_SCHEMA),
    recordedAt: ISO_DATETIME_SCHEMA,
    recordedBy: DOMAIN_ID_SCHEMA,
  })
  .strict();
export type AssessmentAnswer = Readonly<z.infer<typeof AssessmentAnswerSchema>>;

export const AssessmentContradictionSchema = z
  .object({
    contradictionId: DOMAIN_ID_SCHEMA,
    statementIds: z.array(DOMAIN_ID_SCHEMA).min(2),
    status: z.enum(["OPEN", "REVIEWED", "RESOLVED_WITH_RATIONALE"]),
    resolution: z.string().max(2_000).nullable().optional(),
  })
  .strict();

export const EmergencyInterruptSchema = z
  .object({
    triggerCode: DOMAIN_ID_SCHEMA,
    activatedAt: ISO_DATETIME_SCHEMA,
    protocolReference: z.string().min(1),
    outcome: z.string().max(2_000).nullable().optional(),
  })
  .strict();

export const AssessmentVersionSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    assessmentVersionId: DOMAIN_ID_SCHEMA,
    encounterId: DOMAIN_ID_SCHEMA,
    organizationId: DOMAIN_ID_SCHEMA,
    versionNumber: z.number().int().positive(),
    status: z.enum(ASSESSMENT_STATUSES),
    createdAt: ISO_DATETIME_SCHEMA,
    createdBy: DOMAIN_ID_SCHEMA,
    attestedAt: ISO_DATETIME_SCHEMA.nullable().optional(),
    attestedBy: DOMAIN_ID_SCHEMA.nullable().optional(),
    parentVersionId: DOMAIN_ID_SCHEMA.nullable().optional(),
    changeReason: z.string().min(1).max(2_000).nullable().optional(),
    willingness: z.enum(PATIENT_WILLINGNESS_STATES),
    orientation: OrientationObservationSchema,
    possiblePathway: z.enum(POSSIBLE_PRESCREEN_PATHWAYS).optional(),
    answers: z.array(AssessmentAnswerSchema),
    sources: z.array(AssessmentSourceSchema),
    contradictions: z.array(AssessmentContradictionSchema).optional(),
    unknowns: z.array(z.string().min(1)).optional(),
    emergencyInterrupt: EmergencyInterruptSchema.nullable().optional(),
    contentHash: z.string().min(1).nullable().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status === "ATTESTED") {
      for (const [field, present] of [
        ["attestedAt", Boolean(value.attestedAt)],
        ["attestedBy", Boolean(value.attestedBy)],
        ["contentHash", Boolean(value.contentHash)],
      ] as const) {
        if (!present) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: `${field} is required for an attested assessment version`,
          });
        }
      }
    }
    if (value.status === "CORRECTED" && (!value.parentVersionId || !value.changeReason)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["parentVersionId"],
        message: "A corrected assessment must reference its parent version and state a change reason",
      });
    }
  });
export type AssessmentVersion = Readonly<z.infer<typeof AssessmentVersionSchema>>;

export function isImmutableAssessmentStatus(status: AssessmentStatus): boolean {
  return status !== "DRAFT";
}

export function assertAssessmentVersionSuccessor(
  previous: AssessmentVersion,
  successor: AssessmentVersion,
): void {
  if (!isImmutableAssessmentStatus(previous.status)) {
    throw new PrescreenContractError(
      "ASSESSMENT_VERSION_REQUIRED",
      "Only an attested, corrected, or superseded assessment requires a successor version.",
    );
  }
  const conflicts: string[] = [];
  if (successor.assessmentVersionId === previous.assessmentVersionId) conflicts.push("assessmentVersionId");
  if (successor.encounterId !== previous.encounterId) conflicts.push("encounterId");
  if (successor.organizationId !== previous.organizationId) conflicts.push("organizationId");
  if (successor.versionNumber !== previous.versionNumber + 1) conflicts.push("versionNumber");
  if (successor.parentVersionId !== previous.assessmentVersionId) conflicts.push("parentVersionId");
  if (!successor.changeReason?.trim()) conflicts.push("changeReason");
  if (conflicts.length > 0) {
    throw new PrescreenContractError(
      "ASSESSMENT_VERSION_CONFLICT",
      "Post-attestation changes must be recorded as a linked successor version.",
      conflicts,
    );
  }
}
