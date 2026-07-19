import { z } from "zod";
import { DOMAIN_ID_SCHEMA } from "../episode.js";

export const TRANSPORT_CATEGORIES = [
  "LAW_ENFORCEMENT_CUSTODY",
  "LICENSED_AMBULANCE_EMS",
  "CONTRACTED_SECURE_BEHAVIORAL_TRANSPORT",
  "INTERFACILITY_CLINICAL_TRANSPORT",
  "TRANSPORTATION_BROKER",
  "NEMT_CARRIER",
  "FAMILY_OR_SUPPORT_TRANSPORT",
  "SELF_TRANSPORT",
  "TAXI_OR_RIDESHARE",
  "UNSECURED_FACILITY_TRANSPORT",
] as const;
export type TransportCategory = (typeof TRANSPORT_CATEGORIES)[number];

export const TRANSPORT_AUTHORITY_TYPES = [
  "VOLUNTARY",
  "NONCONTESTED",
  "OPC",
  "PEC",
  "CEC",
  "COURT_ORDER",
  "OTHER",
] as const;
export type TransportAuthorityType = (typeof TRANSPORT_AUTHORITY_TYPES)[number];

export const SECURED_INSTRUMENT_AUTHORITY_TYPES = ["OPC", "PEC", "CEC"] as const;
export const SECURED_INSTRUMENT_BLOCKED_CATEGORIES = [
  "FAMILY_OR_SUPPORT_TRANSPORT",
  "SELF_TRANSPORT",
  "TAXI_OR_RIDESHARE",
  "UNSECURED_FACILITY_TRANSPORT",
] as const satisfies readonly TransportCategory[];

export const TRANSPORT_RULE_APPROVAL_STATUSES = [
  "DRAFT_UNVERIFIED",
  "PENDING_REVIEW",
  "APPROVED",
  "SUSPENDED",
  "SUPERSEDED",
] as const;

export const TransportCategoryRuleSchema = z
  .object({
    ruleId: DOMAIN_ID_SCHEMA,
    version: z.number().int().positive(),
    approvalStatus: z.enum(TRANSPORT_RULE_APPROVAL_STATUSES),
    applicableAuthorities: z.array(z.enum(TRANSPORT_AUTHORITY_TYPES)).min(1),
    allowedCategories: z.array(z.enum(TRANSPORT_CATEGORIES)),
    blockedCategories: z.array(z.enum(TRANSPORT_CATEGORIES)),
    requiresInstrument: z.boolean(),
    requiresConfirmedDestination: z.boolean(),
    sourceRuleId: DOMAIN_ID_SCHEMA,
    sourceRuleVersion: z.number().int().positive(),
  })
  .strict()
  .superRefine((value, context) => {
    const appliesToSecuredInstrument = value.applicableAuthorities.some((authority) =>
      SECURED_INSTRUMENT_AUTHORITY_TYPES.includes(
        authority as (typeof SECURED_INSTRUMENT_AUTHORITY_TYPES)[number],
      ),
    );
    if (appliesToSecuredInstrument) {
      for (const category of SECURED_INSTRUMENT_BLOCKED_CATEGORIES) {
        if (!value.blockedCategories.includes(category)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["blockedCategories"],
            message: `${category} must be blocked for configured OPC/PEC/CEC rules`,
          });
        }
      }
    }
    for (const category of value.allowedCategories) {
      if (value.blockedCategories.includes(category)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["allowedCategories"],
          message: `${category} cannot be both allowed and blocked`,
        });
      }
    }
  });
export type TransportCategoryRule = Readonly<z.infer<typeof TransportCategoryRuleSchema>>;

export interface TransportCategoryEvaluation {
  readonly decision: "ALLOWED" | "BLOCKED" | "AUTHORIZED_REVIEW_REQUIRED";
  readonly reasons: readonly string[];
  readonly ruleVersionIds: readonly string[];
}

export function evaluateTransportCategoryRule(
  rule: TransportCategoryRule,
  authority: TransportAuthorityType,
  category: TransportCategory,
): TransportCategoryEvaluation {
  const parsedRule = TransportCategoryRuleSchema.parse(rule);
  const ruleVersionIds = [
    `${parsedRule.ruleId}:v${parsedRule.version}`,
    `${parsedRule.sourceRuleId}:v${parsedRule.sourceRuleVersion}`,
  ];
  if (parsedRule.approvalStatus !== "APPROVED" || !parsedRule.applicableAuthorities.includes(authority)) {
    return {
      decision: "AUTHORIZED_REVIEW_REQUIRED",
      reasons: ["NO_APPROVED_APPLICABLE_TRANSPORT_RULE"],
      ruleVersionIds,
    };
  }
  if (parsedRule.blockedCategories.includes(category)) {
    return { decision: "BLOCKED", reasons: ["TRANSPORT_CATEGORY_BLOCKED"], ruleVersionIds };
  }
  if (!parsedRule.allowedCategories.includes(category)) {
    return {
      decision: "AUTHORIZED_REVIEW_REQUIRED",
      reasons: ["TRANSPORT_CATEGORY_NOT_ALLOWED"],
      ruleVersionIds,
    };
  }
  return { decision: "ALLOWED", reasons: ["CATEGORY_ALLOWED_BY_CONFIGURED_RULE"], ruleVersionIds };
}
