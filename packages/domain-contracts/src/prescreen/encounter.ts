import { z } from "zod";
import { DOMAIN_ID_SCHEMA, ISO_DATETIME_SCHEMA } from "../episode.js";
import { POSSIBLE_PRESCREEN_PATHWAYS } from "./assessment.js";
import { PrescreenContractError } from "./errors.js";

export const PRESCREEN_ENCOUNTER_STATUSES = [
  "DRAFT",
  "ATTESTED",
  "SUBMITTED",
  "CENTRAL_INTAKE_REVIEW",
  "NEEDS_INFORMATION",
  "AUTHORIZED_REVIEW",
  "FACILITY_ROUTING",
  "TRANSPORT_PLANNING",
  "HANDED_OFF",
  "REDIRECTED",
  "DECLINED",
  "CANCELLED",
] as const;
export type PrescreenEncounterStatus = (typeof PRESCREEN_ENCOUNTER_STATUSES)[number];

const PRESCREEN_ENCOUNTER_TRANSITIONS: Readonly<
  Record<PrescreenEncounterStatus, readonly PrescreenEncounterStatus[]>
> = {
  DRAFT: ["ATTESTED", "CANCELLED"],
  ATTESTED: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["CENTRAL_INTAKE_REVIEW", "NEEDS_INFORMATION", "CANCELLED"],
  CENTRAL_INTAKE_REVIEW: [
    "NEEDS_INFORMATION",
    "AUTHORIZED_REVIEW",
    "FACILITY_ROUTING",
    "REDIRECTED",
    "DECLINED",
    "CANCELLED",
  ],
  NEEDS_INFORMATION: ["CENTRAL_INTAKE_REVIEW", "CANCELLED"],
  AUTHORIZED_REVIEW: [
    "NEEDS_INFORMATION",
    "FACILITY_ROUTING",
    "TRANSPORT_PLANNING",
    "REDIRECTED",
    "DECLINED",
    "CANCELLED",
  ],
  FACILITY_ROUTING: [
    "NEEDS_INFORMATION",
    "TRANSPORT_PLANNING",
    "REDIRECTED",
    "DECLINED",
    "CANCELLED",
  ],
  TRANSPORT_PLANNING: ["HANDED_OFF", "REDIRECTED", "CANCELLED"],
  HANDED_OFF: [],
  REDIRECTED: [],
  DECLINED: [],
  CANCELLED: [],
};

export const PrescreenEncounterSchema = z
  .object({
    encounterId: DOMAIN_ID_SCHEMA,
    caseId: DOMAIN_ID_SCHEMA,
    organizationId: DOMAIN_ID_SCHEMA,
    status: z.enum(PRESCREEN_ENCOUNTER_STATUSES),
    version: z.number().int().positive(),
    currentLocation: z.string().min(1).max(2_000),
    presentingConcern: z.string().min(1).max(10_000),
    currentAssessmentVersionId: DOMAIN_ID_SCHEMA.nullable().optional(),
    possiblePathway: z.enum(POSSIBLE_PRESCREEN_PATHWAYS).nullable().optional(),
    createdBy: DOMAIN_ID_SCHEMA,
    createdAt: ISO_DATETIME_SCHEMA,
    updatedAt: ISO_DATETIME_SCHEMA,
  })
  .strict();
export type PrescreenEncounter = Readonly<z.infer<typeof PrescreenEncounterSchema>>;

export function canTransitionPrescreenEncounter(
  from: PrescreenEncounterStatus,
  to: PrescreenEncounterStatus,
): boolean {
  return PRESCREEN_ENCOUNTER_TRANSITIONS[from].includes(to);
}

export function assertPrescreenEncounterTransition(
  from: PrescreenEncounterStatus,
  to: PrescreenEncounterStatus,
): void {
  if (!canTransitionPrescreenEncounter(from, to)) {
    throw new PrescreenContractError(
      "INVALID_ENCOUNTER_TRANSITION",
      `Cannot transition prescreen encounter from ${from} to ${to}.`,
    );
  }
}
