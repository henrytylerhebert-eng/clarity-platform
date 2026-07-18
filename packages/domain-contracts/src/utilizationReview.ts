import { z } from "zod";
import {
  DATE_ONLY_SCHEMA,
  DOMAIN_ID_SCHEMA,
  ISO_DATETIME_SCHEMA,
} from "./episode.js";

export const EPISODE_AUTHORIZATION_REQUIREMENTS = ["REQUIRED", "NOT_REQUIRED", "UNKNOWN"] as const;
export type EpisodeAuthorizationRequirement = (typeof EPISODE_AUTHORIZATION_REQUIREMENTS)[number];

export const EPISODE_AUTHORIZATION_STATUSES = ["OPEN", "CLOSED", "SUPERSEDED"] as const;
export type EpisodeAuthorizationStatus = (typeof EPISODE_AUTHORIZATION_STATUSES)[number];

const EPISODE_AUTHORIZATION_TRANSITIONS: Record<
  EpisodeAuthorizationStatus,
  readonly EpisodeAuthorizationStatus[]
> = {
  OPEN: ["CLOSED", "SUPERSEDED"],
  CLOSED: [],
  SUPERSEDED: [],
};

export function canTransitionEpisodeAuthorization(
  from: EpisodeAuthorizationStatus,
  to: EpisodeAuthorizationStatus,
): boolean {
  return EPISODE_AUTHORIZATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export const AUTHORIZATION_REVIEW_TYPES = [
  "INITIAL",
  "CONCURRENT",
  "RETROSPECTIVE",
  "PEER_TO_PEER",
  "APPEAL",
] as const;
export type AuthorizationReviewType = (typeof AUTHORIZATION_REVIEW_TYPES)[number];

export const AUTHORIZATION_REVIEW_STATUSES = [
  "PENDING",
  "APPROVED",
  "DENIED",
  "WITHDRAWN",
  "UNKNOWN",
] as const;
export type AuthorizationReviewStatus = (typeof AUTHORIZATION_REVIEW_STATUSES)[number];

export const AUTHORIZATION_DAY_OUTCOMES = ["APPROVED", "DENIED", "PENDING"] as const;
export type AuthorizationDayOutcome = (typeof AUTHORIZATION_DAY_OUTCOMES)[number];

export const DENIAL_REASON_CODES = [
  "MISSING_AUTHORIZATION",
  "LATE_REVIEW",
  "DOCUMENTATION_GAP",
  "LEVEL_OF_CARE_NOT_SUPPORTED",
  "ELIGIBILITY_OR_COVERAGE",
  "OTHER_CONTROLLED",
] as const;
export type DenialReasonCode = (typeof DENIAL_REASON_CODES)[number];

export const InclusiveDateRangeSchema = z
  .object({
    startDate: DATE_ONLY_SCHEMA,
    endDate: DATE_ONLY_SCHEMA,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.startDate > value.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Inclusive date range must start on or before it ends",
      });
    }
  });
export type InclusiveDateRange = z.infer<typeof InclusiveDateRangeSchema>;

export const EpisodeAuthorizationSchema = z
  .object({
    id: DOMAIN_ID_SCHEMA,
    organizationId: DOMAIN_ID_SCHEMA,
    episodeId: DOMAIN_ID_SCHEMA,
    sourceCoverageId: DOMAIN_ID_SCHEMA.nullable(),
    sourcePreAdmissionAuthorizationId: DOMAIN_ID_SCHEMA.nullable(),
    levelOfCare: z.string().min(1).max(100),
    requirement: z.enum(EPISODE_AUTHORIZATION_REQUIREMENTS),
    effectiveStartDate: DATE_ONLY_SCHEMA,
    status: z.enum(EPISODE_AUTHORIZATION_STATUSES),
    version: z.number().int().nonnegative(),
  })
  .strict();
export type EpisodeAuthorization = z.infer<typeof EpisodeAuthorizationSchema>;

export const AuthorizationReviewSchema = z
  .object({
    id: DOMAIN_ID_SCHEMA,
    organizationId: DOMAIN_ID_SCHEMA,
    episodeAuthorizationId: DOMAIN_ID_SCHEMA,
    episodeId: DOMAIN_ID_SCHEMA,
    reviewType: z.enum(AUTHORIZATION_REVIEW_TYPES),
    requestedStartDate: DATE_ONLY_SCHEMA,
    requestedEndDate: DATE_ONLY_SCHEMA,
    dueAt: ISO_DATETIME_SCHEMA.nullable(),
    decisionStatus: z.enum(AUTHORIZATION_REVIEW_STATUSES),
    payerReferenceToken: DOMAIN_ID_SCHEMA.nullable(),
    recordedByActorId: DOMAIN_ID_SCHEMA,
    recordedAt: ISO_DATETIME_SCHEMA,
    version: z.number().int().positive(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.requestedStartDate > value.requestedEndDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requestedEndDate"],
        message: "Requested review range must start on or before it ends",
      });
    }
  });
export type AuthorizationReview = z.infer<typeof AuthorizationReviewSchema>;

export const AuthorizationDayDecisionSchema = z
  .object({
    id: DOMAIN_ID_SCHEMA,
    organizationId: DOMAIN_ID_SCHEMA,
    authorizationReviewId: DOMAIN_ID_SCHEMA,
    episodeAuthorizationId: DOMAIN_ID_SCHEMA,
    episodeId: DOMAIN_ID_SCHEMA,
    startDate: DATE_ONLY_SCHEMA,
    endDate: DATE_ONLY_SCHEMA,
    outcome: z.enum(AUTHORIZATION_DAY_OUTCOMES),
    denialReasonCode: z.enum(DENIAL_REASON_CODES).nullable(),
    sourceEventId: DOMAIN_ID_SCHEMA,
    supersededByEventId: DOMAIN_ID_SCHEMA.nullable(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.startDate > value.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Day decision range must start on or before it ends",
      });
    }
    if (value.outcome === "DENIED" && value.denialReasonCode === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["denialReasonCode"],
        message: "Denied decisions require a controlled denial reason",
      });
    }
    if (value.outcome !== "DENIED" && value.denialReasonCode !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["denialReasonCode"],
        message: "Only denied decisions may include a denial reason",
      });
    }
  });
export type AuthorizationDayDecision = z.infer<typeof AuthorizationDayDecisionSchema>;

export const DOCUMENTATION_GAP_CATEGORIES = [
  "MISSING_PROGRESS_NOTE",
  "MISSING_PHYSICIAN_ORDER",
  "MISSING_TREATMENT_PLAN",
  "MISSING_RISK_UPDATE",
  "MISSING_DISCHARGE_PLAN",
  "MISSING_SIGNATURE_OR_ATTESTATION",
  "INCONSISTENT_LEVEL_OF_CARE_SUPPORT",
  "PAYER_REQUESTED_CLARIFICATION",
  "OTHER_CONTROLLED",
] as const;
export type DocumentationGapCategory = (typeof DOCUMENTATION_GAP_CATEGORIES)[number];

export const DOCUMENTATION_GAP_STATUSES = [
  "OPEN",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "RESOLVED",
  "DISPUTED",
  "REOPENED",
  "CANCELLED",
  "SUPERSEDED",
] as const;
export type DocumentationGapStatus = (typeof DOCUMENTATION_GAP_STATUSES)[number];

const DOCUMENTATION_GAP_TRANSITIONS: Record<DocumentationGapStatus, readonly DocumentationGapStatus[]> = {
  OPEN: ["ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "DISPUTED", "CANCELLED"],
  ACKNOWLEDGED: ["IN_PROGRESS", "RESOLVED", "DISPUTED", "CANCELLED"],
  IN_PROGRESS: ["RESOLVED", "DISPUTED", "CANCELLED"],
  RESOLVED: ["REOPENED"],
  DISPUTED: ["RESOLVED", "REOPENED", "CANCELLED"],
  REOPENED: ["ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "DISPUTED", "CANCELLED"],
  CANCELLED: [],
  SUPERSEDED: [],
};

export function canTransitionDocumentationGap(
  from: DocumentationGapStatus,
  to: DocumentationGapStatus,
): boolean {
  return DOCUMENTATION_GAP_TRANSITIONS[from]?.includes(to) ?? false;
}

export const DocumentationGapSchema = z
  .object({
    id: DOMAIN_ID_SCHEMA,
    organizationId: DOMAIN_ID_SCHEMA,
    episodeId: DOMAIN_ID_SCHEMA,
    sourceAuthorizationReviewId: DOMAIN_ID_SCHEMA.nullable(),
    categoryCode: z.enum(DOCUMENTATION_GAP_CATEGORIES),
    operationalSummary: z.string().max(2000).nullable(),
    status: z.enum(DOCUMENTATION_GAP_STATUSES),
    dueAt: ISO_DATETIME_SCHEMA.nullable(),
    assignedRole: z.string().min(1).max(100).nullable(),
    assignedUserId: DOMAIN_ID_SCHEMA.nullable(),
    recordedByActorId: DOMAIN_ID_SCHEMA,
    resolvedByActorId: DOMAIN_ID_SCHEMA.nullable(),
    version: z.number().int().positive(),
  })
  .strict();
export type DocumentationGap = z.infer<typeof DocumentationGapSchema>;

export const UrAssignmentSchema = z
  .object({
    episodeId: DOMAIN_ID_SCHEMA,
    previousAssignedUserId: DOMAIN_ID_SCHEMA.nullable(),
    assignedUserId: DOMAIN_ID_SCHEMA.nullable(),
    assignedRole: z.string().min(1).max(100).nullable(),
    reasonCode: z.enum(["SHIFT_ASSIGNMENT", "PROGRAM_ASSIGNMENT", "MANAGER_REASSIGNMENT", "UNASSIGNED"]),
    resultingAssignmentVersion: z.number().int().positive(),
  })
  .strict();
export type UrAssignment = z.infer<typeof UrAssignmentSchema>;

export const AUTHORIZATION_REVIEW_CORRECTION_REASONS = [
  "PAYER_DATE_RANGE_CORRECTED",
  "PAYER_OUTCOME_CORRECTED",
  "DUPLICATE_REVIEW",
  "SOURCE_RECONCILIATION",
  "DATA_ENTRY_ERROR",
] as const;
export type AuthorizationReviewCorrectionReason = (typeof AUTHORIZATION_REVIEW_CORRECTION_REASONS)[number];

export const AuthorizationReviewCorrectionSchema = z
  .object({
    correctionEventId: DOMAIN_ID_SCHEMA,
    authorizationReviewId: DOMAIN_ID_SCHEMA,
    episodeAuthorizationId: DOMAIN_ID_SCHEMA,
    episodeId: DOMAIN_ID_SCHEMA,
    supersedesEventId: DOMAIN_ID_SCHEMA,
    reasonCode: z.enum(AUTHORIZATION_REVIEW_CORRECTION_REASONS),
    replacement: AuthorizationReviewSchema,
  })
  .strict();
export type AuthorizationReviewCorrection = z.infer<typeof AuthorizationReviewCorrectionSchema>;

export const SupersessionRecordSchema = z
  .object({
    originalEventId: DOMAIN_ID_SCHEMA,
    correctionEventId: DOMAIN_ID_SCHEMA,
    reasonCode: z.string().min(1).max(100),
    recordedAt: ISO_DATETIME_SCHEMA,
  })
  .strict();
export type SupersessionRecord = z.infer<typeof SupersessionRecordSchema>;
