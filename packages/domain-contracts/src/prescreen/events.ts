import { z } from "zod";
import { DOMAIN_ID_SCHEMA, ISO_DATETIME_SCHEMA } from "../episode.js";

export const PRESCREEN_EVENT_TYPES = [
  "PRESCREEN_ENCOUNTER_STARTED",
  "RAPID_SAFETY_SCREEN_RECORDED",
  "ASSESSMENT_DRAFT_SAVED",
  "SOURCE_STATEMENT_RECORDED",
  "ORIENTATION_OBSERVED",
  "PATIENT_WILLINGNESS_RECORDED",
  "POSSIBLE_PATHWAY_DERIVED",
  "EMERGENCY_PROTOCOL_ACTIVATED",
  "ASSESSMENT_ATTESTED",
  "ASSESSMENT_SUPPLEMENTED",
  "PRESCREEN_SUBMITTED",
  "PRESCREEN_ACKNOWLEDGED",
  "INFORMATION_REQUESTED",
  "TASK_ACKNOWLEDGED",
  "TASK_COMPLETED",
  "TASK_ESCALATED",
  "PACKET_REQUIREMENT_STATE_CHANGED",
  "REFERRAL_PACKET_VERSION_CREATED",
  "PACKET_TRANSMITTED",
  "PACKET_RECEIPT_RECORDED",
  "AUTHORIZED_REVIEW_RECORDED",
  "FACILITY_RESPONSE_RECORDED",
  "FACILITY_PROFILE_DRAFTED",
  "FACILITY_PROFILE_APPROVED",
  "FACILITY_PROFILE_ACTIVATED",
  "TRANSPORT_PLAN_CREATED",
  "TRANSPORT_PROVIDER_QUALIFIED",
  "TRANSPORT_DISPATCH_ACCEPTED",
  "PATIENT_TAKEN_INTO_CUSTODY",
  "CUSTODY_TRANSFERRED",
  "TRANSPORT_DEPARTED",
  "TRANSPORT_ARRIVED",
  "RECEIVING_CUSTODY_ACCEPTED",
  "TRANSPORT_EXCEPTION_RECORDED",
  "EVENT_CORRECTED",
] as const;
export type PrescreenEventType = (typeof PRESCREEN_EVENT_TYPES)[number];

export const PrescreenEventActorSchema = z
  .object({
    actorType: z.enum(["USER", "SOURCE_SYSTEM", "SERVICE"]),
    actorId: DOMAIN_ID_SCHEMA,
    roleCodes: z.array(DOMAIN_ID_SCHEMA),
  })
  .strict();

export const PrescreenEventSourceSchema = z
  .object({
    sourceSystem: DOMAIN_ID_SCHEMA,
    sourceObjectId: DOMAIN_ID_SCHEMA.nullable().optional(),
    sourceVersion: z.string().min(1).nullable().optional(),
    mappingVersion: z.string().min(1).nullable().optional(),
  })
  .strict();

export const PrescreenEventEnvelopeSchema = z
  .object({
    eventId: DOMAIN_ID_SCHEMA,
    schemaName: z.literal("clarity.prescreen.event"),
    schemaVersion: z.literal("1.0.0"),
    eventType: z.enum(PRESCREEN_EVENT_TYPES),
    organizationId: DOMAIN_ID_SCHEMA,
    facilityId: DOMAIN_ID_SCHEMA.nullable().optional(),
    programId: DOMAIN_ID_SCHEMA.nullable().optional(),
    caseId: DOMAIN_ID_SCHEMA.nullable().optional(),
    encounterId: DOMAIN_ID_SCHEMA.nullable().optional(),
    aggregateType: DOMAIN_ID_SCHEMA,
    aggregateId: DOMAIN_ID_SCHEMA,
    aggregateVersion: z.number().int().positive(),
    eventTime: ISO_DATETIME_SCHEMA,
    recordedTime: ISO_DATETIME_SCHEMA,
    actor: PrescreenEventActorSchema,
    source: PrescreenEventSourceSchema,
    correlationId: DOMAIN_ID_SCHEMA,
    causationId: DOMAIN_ID_SCHEMA.nullable().optional(),
    idempotencyKey: DOMAIN_ID_SCHEMA.nullable().optional(),
    phiClassification: z.enum([
      "RESTRICTED_PHI",
      "SENSITIVE_OPERATIONAL",
      "DEIDENTIFIED_OPERATIONAL",
      "PUBLIC_REFERENCE",
    ]),
    dataQualityState: z.enum(["VALIDATED", "PARTIAL", "DISPUTED", "CORRECTED", "LATE", "INVALID"]),
    reviewState: z.enum(["NOT_REQUIRED", "DRAFT", "PENDING", "APPROVED", "REJECTED"]),
    supersedesEventId: DOMAIN_ID_SCHEMA.nullable().optional(),
    payload: z.record(z.unknown()),
  })
  .strict()
  .superRefine((event, context) => {
    if (event.eventType === "EVENT_CORRECTED" && !event.supersedesEventId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supersedesEventId"],
        message: "EVENT_CORRECTED must reference the event it supersedes",
      });
    }
  });
export type PrescreenEventEnvelope = Readonly<z.infer<typeof PrescreenEventEnvelopeSchema>>;
