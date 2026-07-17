import { z } from "zod";

/**
 * Benefits contracts. Mirrors prisma/schema.prisma enums — keep in sync.
 * Binding rules: docs/payer-and-benefits/BENEFITS_VERIFICATION.md.
 */

export const ELIGIBILITY_STATUSES = [
  "PENDING",
  "ACTIVE_CONFIRMED",
  "INACTIVE",
  "UNCLEAR",
  "FAILED",
] as const;
export type EligibilityStatus = (typeof ELIGIBILITY_STATUSES)[number];

export const BENEFIT_DISCLAIMER =
  "Quoted benefits are based on information provided by the payer at the time of verification. " +
  "A benefit quote is not a guarantee of payment. Final patient responsibility is determined by " +
  "claim adjudication.";

export const BenefitQuoteSchema = z
  .object({
    serviceType: z.string().min(1),
    networkStatus: z.enum(["IN_NETWORK", "OUT_OF_NETWORK", "UNKNOWN"]),
    deductibleAmountCents: z.number().int().nonnegative().optional(),
    deductibleMetCents: z.number().int().nonnegative().optional(),
    coinsurancePercent: z.number().min(0).max(100).optional(),
    outOfPocketMaxCents: z.number().int().nonnegative().optional(),
    outOfPocketMetCents: z.number().int().nonnegative().optional(),
    authorizationRequired: z.boolean(),
    quotedAt: z.string().min(1),
    verificationReference: z.string().min(1),
    disclaimerStatus: z.literal("PROVIDED", {
      errorMap: () => ({
        message: "A benefit quote cannot be recorded without the not-a-payment-guarantee disclaimer",
      }),
    }),
  })
  .strict();
export type BenefitQuote = z.infer<typeof BenefitQuoteSchema>;

/** Present a quote for display: the disclaimer is structurally inseparable from the numbers. */
export function presentBenefitQuote(quote: BenefitQuote): { quote: BenefitQuote; disclaimer: string } {
  BenefitQuoteSchema.parse(quote);
  return { quote, disclaimer: BENEFIT_DISCLAIMER };
}

/**
 * Insurance extraction review gate: extracted fields cannot support downstream
 * eligibility/benefits work until a qualified human review approves them.
 */
export interface ExtractedInsuranceFields {
  reviewStatus: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  reviewedBy?: string;
}

export function canUseExtractedInsurance(fields: ExtractedInsuranceFields): boolean {
  return fields.reviewStatus === "APPROVED" && !!fields.reviewedBy;
}

/**
 * Contract correction 2026-07-13 (feat/insurance-benefits): the original
 * array said CHILD, which does not exist in the schema enum; the schema has
 * PARENT and GUARDIAN. Mirrors prisma/schema.prisma SubscriberRelationship —
 * keep in sync (ADR-0009).
 */
export const SUBSCRIBER_RELATIONSHIPS = [
  "SELF",
  "SPOUSE",
  "PARENT",
  "GUARDIAN",
  "OTHER",
  "UNKNOWN",
] as const;
export type SubscriberRelationship = (typeof SUBSCRIBER_RELATIONSHIPS)[number];

/** Coverage requires an explicit subscriber relationship; UNKNOWN blocks verification start. */
export function canStartEligibilityVerification(rel: SubscriberRelationship | undefined): boolean {
  return rel !== undefined && rel !== "UNKNOWN";
}

const ELIGIBILITY_TRANSITIONS: Record<EligibilityStatus, readonly EligibilityStatus[]> = {
  PENDING: ["ACTIVE_CONFIRMED", "INACTIVE", "UNCLEAR", "FAILED"],
  ACTIVE_CONFIRMED: ["INACTIVE", "UNCLEAR"], // status can change on re-verification
  INACTIVE: ["PENDING", "ACTIVE_CONFIRMED"],
  UNCLEAR: ["PENDING", "ACTIVE_CONFIRMED", "INACTIVE", "FAILED"],
  FAILED: ["PENDING"],
};

export function canTransitionEligibility(from: EligibilityStatus, to: EligibilityStatus): boolean {
  return ELIGIBILITY_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Coverage/verification vocabulary added 2026-07-13 (feat/insurance-benefits).
 * Values mirror prisma/schema.prisma enums — keep in sync.
 */
export const COVERAGE_ORDERS = ["PRIMARY", "SECONDARY", "TERTIARY"] as const;
export type CoverageOrder = (typeof COVERAGE_ORDERS)[number];

export const COVERAGE_TYPES = [
  "MEDICARE",
  "MEDICAID",
  "MEDICARE_ADVANTAGE",
  "COMMERCIAL",
  "SUPPLEMENTAL",
  "TRICARE",
  "SELF_PAY",
  "OTHER",
  "UNKNOWN",
] as const;
export type CoverageType = (typeof COVERAGE_TYPES)[number];

export const COVERAGE_STATUSES = [
  "UNVERIFIED",
  "ACTIVE",
  "INACTIVE",
  "UNCLEAR",
  "UNABLE_TO_VERIFY",
] as const;
export type CoverageStatus = (typeof COVERAGE_STATUSES)[number];

export const VERIFICATION_METHODS = [
  "PORTAL",
  "ELECTRONIC_TRANSACTION",
  "PHONE",
  "FAX",
  "MANUAL",
  "OTHER",
] as const;
export type VerificationMethod = (typeof VERIFICATION_METHODS)[number];

export const SERVICE_TYPES = [
  "INPATIENT_PSYCHIATRIC",
  "PARTIAL_HOSPITALIZATION",
  "INTENSIVE_OUTPATIENT",
  "OUTPATIENT_BEHAVIORAL_HEALTH",
  "SUBSTANCE_USE",
  "OTHER",
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const NETWORK_STATUSES = ["IN_NETWORK", "OUT_OF_NETWORK", "UNKNOWN"] as const;
export type NetworkStatus = (typeof NETWORK_STATUSES)[number];

export const EDUCATION_RECIPIENT_TYPES = [
  "PATIENT",
  "SPOUSE",
  "PARENT",
  "GUARDIAN",
  "LEGAL_REPRESENTATIVE",
  "OTHER",
] as const;
export type EducationRecipientType = (typeof EDUCATION_RECIPIENT_TYPES)[number];

export const EDUCATION_METHODS = ["IN_PERSON", "PHONE", "VIDEO", "ELECTRONIC", "WRITTEN"] as const;
export type EducationMethod = (typeof EDUCATION_METHODS)[number];

export const ACKNOWLEDGEMENT_STATUSES = ["ACKNOWLEDGED", "DECLINED", "UNABLE", "DEFERRED"] as const;
export type AcknowledgementStatus = (typeof ACKNOWLEDGEMENT_STATUSES)[number];

/**
 * How an eligibility attempt's outcome rolls up onto the coverage record.
 * PENDING attempts leave the coverage status untouched.
 */
export function coverageStatusFromEligibility(outcome: EligibilityStatus): CoverageStatus | undefined {
  switch (outcome) {
    case "ACTIVE_CONFIRMED":
      return "ACTIVE";
    case "INACTIVE":
      return "INACTIVE";
    case "UNCLEAR":
      return "UNCLEAR";
    case "FAILED":
      return "UNABLE_TO_VERIFY";
    case "PENDING":
      return undefined;
  }
}

/** Domain shapes persisted by the benefits repository layer. */
export interface ClarityCoverage {
  readonly coverageId: string;
  readonly organizationId: string;
  readonly caseId: string;
  readonly patientTokenId: string;
  readonly coverageOrder: CoverageOrder;
  readonly coverageType: CoverageType;
  readonly subscriberRelationship: SubscriberRelationship;
  readonly payerNameRaw?: string | null;
  readonly planNameRaw?: string | null;
  readonly status: CoverageStatus;
  readonly sourceDocumentIds: readonly string[];
  readonly version: number;
  readonly createdAt: Date;
}

export interface ClarityEligibilityVerification {
  readonly verificationId: string;
  readonly coverageId: string;
  readonly method: VerificationMethod;
  readonly status: EligibilityStatus;
  readonly effectiveDate?: Date | null;
  readonly terminationDate?: Date | null;
  readonly verifiedAt?: Date | null;
  readonly verifiedBy?: string | null;
  readonly payerRepresentative?: string | null;
  readonly referenceNumber?: string | null;
  readonly notes?: string | null;
  readonly proofDocumentIds: readonly string[];
}

export interface ClarityBenefitVerification {
  readonly benefitVerificationId: string;
  readonly coverageId: string;
  readonly serviceType: ServiceType;
  readonly networkStatus: NetworkStatus;
  readonly deductibleAmountCents?: number | null;
  readonly deductibleMetCents?: number | null;
  readonly coinsurancePercent?: number | null;
  readonly copayAmountCents?: number | null;
  readonly outOfPocketMaxCents?: number | null;
  readonly outOfPocketMetCents?: number | null;
  readonly authorizationRequired?: boolean | null;
  readonly notificationRequired?: boolean | null;
  readonly coverageLimit?: string | null;
  readonly exclusions: readonly string[];
  readonly quotedAt?: Date | null;
  readonly verificationReference?: string | null;
  readonly disclaimerStatus: "REQUIRED" | "PROVIDED";
  readonly sourceDocumentIds: readonly string[];
}
