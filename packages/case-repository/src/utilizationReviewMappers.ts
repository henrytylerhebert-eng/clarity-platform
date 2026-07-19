import type {
  EpisodeAuthorization as EpisodeAuthorizationRow,
  AuthorizationReview as AuthorizationReviewRow,
  AuthorizationDayDecision as AuthorizationDayDecisionRow,
  DocumentationGap as DocumentationGapRow,
} from "@prisma/client";
import {
  EPISODE_AUTHORIZATION_REQUIREMENTS,
  EPISODE_AUTHORIZATION_STATUSES,
  AUTHORIZATION_REVIEW_TYPES,
  AUTHORIZATION_REVIEW_STATUSES,
  AUTHORIZATION_DAY_OUTCOMES,
  DENIAL_REASON_CODES,
  DOCUMENTATION_GAP_CATEGORIES,
  DOCUMENTATION_GAP_STATUSES,
  type EpisodeAuthorization,
  type AuthorizationReview,
  type AuthorizationDayDecision,
  type DocumentationGap,
  type EpisodeAuthorizationRequirement,
  type EpisodeAuthorizationStatus,
  type AuthorizationReviewType,
  type AuthorizationReviewStatus,
  type AuthorizationDayOutcome,
  type DenialReasonCode,
  type DocumentationGapCategory,
  type DocumentationGapStatus
} from "@clarity/domain-contracts";

function parseEnum<T extends string>(value: string, allowed: readonly T[], field: string): T {
  if ((allowed as readonly string[]).includes(value)) return value as T;
  throw new Error(`Row field ${field} has value "${value}" outside the domain contract`);
}
export function rowToEpisodeAuthorization(row: EpisodeAuthorizationRow): EpisodeAuthorization {
  return {
    id: row.id,
    organizationId: row.organizationId,
    episodeId: row.episodeId,
    sourceCoverageId: row.sourceCoverageId,
    sourcePreAdmissionAuthorizationId: row.sourcePreAdmissionAuthorizationId,
    levelOfCare: row.levelOfCare,
    requirement: parseEnum<EpisodeAuthorizationRequirement>(row.requirement, EPISODE_AUTHORIZATION_REQUIREMENTS, "requirement"),
    effectiveStartDate: row.effectiveStartDate,
    status: parseEnum<EpisodeAuthorizationStatus>(row.status, EPISODE_AUTHORIZATION_STATUSES, "status"),
    version: row.version,
  };
}


export function rowToAuthorizationReview(row: AuthorizationReviewRow): AuthorizationReview {
  return {
    id: row.id,
    organizationId: row.organizationId,
    episodeAuthorizationId: row.episodeAuthorizationId,
    episodeId: row.episodeId,
    reviewType: parseEnum<AuthorizationReviewType>(row.reviewType, AUTHORIZATION_REVIEW_TYPES, "reviewType"),
    requestedStartDate: row.requestedStartDate,
    requestedEndDate: row.requestedEndDate,
    dueAt: row.dueAt?.toISOString() ?? null,
    decisionStatus: parseEnum<AuthorizationReviewStatus>(row.decisionStatus, AUTHORIZATION_REVIEW_STATUSES, "decisionStatus"),
    payerReferenceToken: row.payerReferenceToken,
    recordedByActorId: row.recordedByActorId,
    recordedAt: row.recordedAt.toISOString(),
    version: row.version,
  };
}


export function rowToAuthorizationDayDecision(row: AuthorizationDayDecisionRow): AuthorizationDayDecision {
  return {
    id: row.id,
    organizationId: row.organizationId,
    authorizationReviewId: row.authorizationReviewId,
    episodeAuthorizationId: row.episodeAuthorizationId,
    episodeId: row.episodeId,
    startDate: row.startDate,
    endDate: row.endDate,
    outcome: parseEnum<AuthorizationDayOutcome>(row.outcome, AUTHORIZATION_DAY_OUTCOMES, "outcome"),
    denialReasonCode: row.denialReasonCode ? parseEnum<DenialReasonCode>(row.denialReasonCode, DENIAL_REASON_CODES, "denialReasonCode") : null,
    sourceEventId: row.sourceEventId,
    supersededByEventId: row.supersededByEventId,
  };
}


export function rowToDocumentationGap(row: DocumentationGapRow): DocumentationGap {
  return {
    id: row.id,
    organizationId: row.organizationId,
    episodeId: row.episodeId,
    sourceAuthorizationReviewId: row.sourceAuthorizationReviewId,
    categoryCode: parseEnum<DocumentationGapCategory>(row.categoryCode, DOCUMENTATION_GAP_CATEGORIES, "categoryCode"),
    operationalSummary: row.operationalSummary,
    status: parseEnum<DocumentationGapStatus>(row.status, DOCUMENTATION_GAP_STATUSES, "status"),
    dueAt: row.dueAt?.toISOString() ?? null,
    assignedRole: row.assignedRole,
    assignedUserId: row.assignedUserId,
    recordedByActorId: row.recordedByActorId,
    resolvedByActorId: row.resolvedByActorId,
    version: row.version,
  };
}
