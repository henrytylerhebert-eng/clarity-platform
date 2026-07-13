import { z } from "zod";
import {
  ACKNOWLEDGEMENT_STATUSES,
  CommandActorSchema,
  COVERAGE_ORDERS,
  COVERAGE_TYPES,
  EDUCATION_METHODS,
  EDUCATION_RECIPIENT_TYPES,
  ELIGIBILITY_STATUSES,
  NETWORK_STATUSES,
  SERVICE_TYPES,
  SUBSCRIBER_RELATIONSHIPS,
  VERIFICATION_METHODS,
} from "@clarity/domain-contracts";

/**
 * Benefits command envelopes. Strict schemas — note what is structurally
 * ABSENT: there are no fields for member IDs, group numbers, policy numbers,
 * SSNs, or any subscriber identifier. Identifiers live in the source
 * insurance-card documents until an encryption capability exists (ADR-0009);
 * a caller attempting to pass them is rejected by the strict parse.
 */

const baseEnvelope = {
  organizationId: z.string().min(1),
  caseId: z.string().min(1),
  actor: CommandActorSchema,
  correlationId: z.string().min(1).optional(),
  idempotencyKey: z.string().min(8).optional(),
  reason: z.string().min(1).optional(),
};

export const RecordInsuranceCoverageCommandSchema = z
  .object({
    ...baseEnvelope,
    coverageOrder: z.enum(COVERAGE_ORDERS),
    coverageType: z.enum(COVERAGE_TYPES),
    subscriberRelationship: z.enum(SUBSCRIBER_RELATIONSHIPS),
    payerNameRaw: z.string().min(1).optional(),
    planNameRaw: z.string().min(1).optional(),
    /** The human-verified fact basis: approved INSURANCE evidence from this case. */
    insuranceEvidenceIds: z.array(z.string().min(1)).min(1),
    /** Insurance-card / benefits documents from this case. */
    sourceDocumentIds: z.array(z.string().min(1)).default([]),
  })
  .strict();
export type RecordInsuranceCoverageCommand = z.input<typeof RecordInsuranceCoverageCommandSchema>;

export const VerifyEligibilityCommandSchema = z
  .object({
    ...baseEnvelope,
    coverageId: z.string().min(1),
    expectedCoverageVersion: z.number().int().nonnegative().optional(),
    method: z.enum(VERIFICATION_METHODS),
    /** The attempt's outcome as reported by the payer contact. */
    outcome: z.enum(ELIGIBILITY_STATUSES),
    effectiveDate: z.coerce.date().optional(),
    terminationDate: z.coerce.date().optional(),
    payerRepresentative: z.string().min(1).optional(),
    referenceNumber: z.string().min(1).optional(),
    notes: z.string().min(1).optional(),
    proofDocumentIds: z.array(z.string().min(1)).default([]),
  })
  .strict();
export type VerifyEligibilityCommand = z.input<typeof VerifyEligibilityCommandSchema>;

export const RecordBenefitVerificationCommandSchema = z
  .object({
    ...baseEnvelope,
    coverageId: z.string().min(1),
    expectedCoverageVersion: z.number().int().nonnegative().optional(),
    serviceType: z.enum(SERVICE_TYPES),
    networkStatus: z.enum(NETWORK_STATUSES),
    deductibleAmountCents: z.number().int().nonnegative().optional(),
    deductibleMetCents: z.number().int().nonnegative().optional(),
    coinsurancePercent: z.number().min(0).max(100).optional(),
    copayAmountCents: z.number().int().nonnegative().optional(),
    outOfPocketMaxCents: z.number().int().nonnegative().optional(),
    outOfPocketMetCents: z.number().int().nonnegative().optional(),
    authorizationRequired: z.boolean().optional(),
    notificationRequired: z.boolean().optional(),
    coverageLimit: z.string().min(1).optional(),
    exclusions: z.array(z.string().min(1)).default([]),
    /** Payer call/portal reference for the quote. */
    verificationReference: z.string().min(1),
    /**
     * Binding rule (domain contract): a benefit quote cannot be recorded
     * unless the not-a-payment-guarantee disclaimer was provided. Must be
     * literally true — there is no way to record a quote without it.
     */
    disclaimerProvided: z.literal(true, {
      errorMap: () => ({
        message: "A benefit quote cannot be recorded without the not-a-payment-guarantee disclaimer",
      }),
    }),
    sourceDocumentIds: z.array(z.string().min(1)).default([]),
  })
  .strict();
export type RecordBenefitVerificationCommand = z.input<typeof RecordBenefitVerificationCommandSchema>;

export const RecordFinancialEducationCommandSchema = z
  .object({
    ...baseEnvelope,
    benefitVerificationId: z.string().min(1).optional(),
    recipientType: z.enum(EDUCATION_RECIPIENT_TYPES),
    recipientName: z.string().min(1).optional(),
    method: z.enum(EDUCATION_METHODS),
    language: z.string().min(1).optional(),
    interpreterUsed: z.boolean().default(false),
    topicsReviewed: z.array(z.string().min(1)).min(1),
    /** Honest-uncertainty rule: what could NOT be confirmed is disclosed, not hidden. */
    uncertaintiesDisclosed: z.array(z.string().min(1)).default([]),
    acknowledgementStatus: z.enum(ACKNOWLEDGEMENT_STATUSES),
  })
  .strict();
export type RecordFinancialEducationCommand = z.input<typeof RecordFinancialEducationCommandSchema>;
