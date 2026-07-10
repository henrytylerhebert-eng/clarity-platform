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

export const SUBSCRIBER_RELATIONSHIPS = ["SELF", "SPOUSE", "CHILD", "OTHER", "UNKNOWN"] as const;
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
