import { z } from "zod";
import { WRITABLE_CASE_STATUSES } from "./caseStateMachine.js";

/**
 * Zod schema for data/synthetic-cases/*.json fixtures.
 * Every fixture must be explicitly synthetic; the loader rejects anything else.
 */
export const SyntheticCaseSchema = z
  .object({
    caseKey: z.string().startsWith("synthetic-"),
    description: z.string().min(1),
    patientToken: z.object({
      externalPatientReference: z.string().startsWith("SYN-"),
      dateOfBirth: z.string(),
      age: z.number().int().positive(),
      sex: z.string(),
      preferredLanguage: z.string(),
      privacyFlags: z.array(z.string()).refine((f) => f.includes("SYNTHETIC_ONLY"), {
        message: "Synthetic fixtures must carry the SYNTHETIC_ONLY privacy flag",
      }),
    }),
    case: z
      .object({
        status: z.enum(WRITABLE_CASE_STATUSES),
        urgency: z.enum(["ROUTINE", "URGENT", "EMERGENT"]),
        currentLocation: z.string(),
        requestedLevelOfCare: z.string(),
        currentLegalStatus: z.string(),
        clinicalStatus: z.string(),
        legalReviewStatus: z.string(),
        medicalScreeningStatus: z.string(),
        benefitsStatus: z.string(),
        authorizationStatus: z.string(),
        placementStatus: z.string(),
        transportationStatus: z.string(),
        patientEducationStatus: z.string(),
      })
      .passthrough(),
    documents: z.array(z.object({ documentType: z.string(), filename: z.string() })).default([]),
    coverages: z
      .array(
        z
          .object({
            coverageOrder: z.string(),
            payerNameRaw: z.string(),
            coverageType: z.string(),
            subscriberRelationship: z.string(),
            status: z.string(),
          })
          .passthrough(),
      )
      .default([]),
    eligibility: z.record(z.unknown()).optional(),
    benefits: z.record(z.unknown()).optional(),
    authorization: z.record(z.unknown()).optional(),
    expectedAuditEvents: z.array(z.string()).default([]),
  })
  .passthrough();

export type SyntheticCase = z.infer<typeof SyntheticCaseSchema>;
