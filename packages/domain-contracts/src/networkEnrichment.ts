import { z } from "zod";
import { CommandActorSchema, type CommandActor } from "./actor.js";
import { DOMAIN_ID_SCHEMA, ISO_DATETIME_SCHEMA } from "./episode.js";
import { type UserRole } from "./roles.js";

const baseEnvelope = {
  organizationId: DOMAIN_ID_SCHEMA,
  actor: CommandActorSchema,
  correlationId: z.string().min(1).optional(),
  idempotencyKey: z.string().min(8),
  reason: z.string().min(1).optional(),
  reviewPackageId: z.string().min(1).optional(),
};

export const NETWORK_REVIEW_FIELD_SENSITIVITY = [
  "NORMAL_OPERATIONAL",
  "PAYER_RELATED",
  "ADMISSION_OPERATIONS",
  "CLINICAL_CRITERIA",
  "LEGAL_STATUS_REQUIREMENTS",
  "CUSTODY_TRANSPORT",
  "CAPACITY_BED_COUNT_CLAIMS",
  "ARRIVAL_HANDOFF_PROCEDURES",
  "PAYMENT_OR_SOURCE_CONFIDENCE",
] as const;
export type NetworkReviewFieldSensitivity = (typeof NETWORK_REVIEW_FIELD_SENSITIVITY)[number];

export const NETWORK_REVIEW_FIELD_POLICY_STATES = [
  "UNRESEARCHED",
  "CANDIDATE",
  "SOURCE_CONFIRMED",
  "HUMAN_CONFIRMED",
  "CONFLICT",
  "STALE",
  "REJECTED",
  "SUPERSEDED",
  "DEPRECATED",
] as const;
export type NetworkReviewPolicyState = (typeof NETWORK_REVIEW_FIELD_POLICY_STATES)[number];

export interface NetworkReviewPackageRecord {
  readonly reviewPackageId: string;
  readonly organizationId: string;
  readonly caseId: string;
  readonly enrichmentRunId?: string;
  readonly sourceCandidateId: string;
  readonly networkEntityCandidateId?: string;
  readonly status: NetworkReviewPolicyState;
  readonly version: number;
  readonly submittedByActorId: string;
  readonly assignedReviewerCategory?: readonly string[];
  readonly sourceRunId?: string;
  readonly packageStatusReason?: string | null;
  readonly isTerminal?: boolean;
  readonly terminalReason?: string | null;
  readonly supersedesPackageId?: string;
  readonly supersededByPackageId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NetworkReviewPolicy {
  readonly requiredCanonicalRoles: readonly UserRole[];
  readonly oneReviewSuffices: boolean;
  readonly specializedReviewRequired: boolean;
  readonly eligibleForPromotion: boolean;
  readonly unresolvedConflictBlocksPromotion: boolean;
}

export const NETWORK_REVIEW_FIELD_POLICIES: Record<
  NetworkReviewFieldSensitivity,
  NetworkReviewPolicy
> = {
  NORMAL_OPERATIONAL: {
    requiredCanonicalRoles: ["FACILITY_REVIEWER", "COMPLIANCE_REVIEWER"],
    oneReviewSuffices: true,
    specializedReviewRequired: false,
    eligibleForPromotion: true,
    unresolvedConflictBlocksPromotion: false,
  },
  PAYER_RELATED: {
    requiredCanonicalRoles: ["COMPLIANCE_REVIEWER", "BENEFITS_VERIFICATION_SPECIALIST"],
    oneReviewSuffices: true,
    specializedReviewRequired: true,
    eligibleForPromotion: true,
    unresolvedConflictBlocksPromotion: true,
  },
  ADMISSION_OPERATIONS: {
    requiredCanonicalRoles: ["TRANSPORT_COORDINATOR", "FACILITY_REVIEWER", "COMPLIANCE_REVIEWER"],
    oneReviewSuffices: true,
    specializedReviewRequired: true,
    eligibleForPromotion: true,
    unresolvedConflictBlocksPromotion: true,
  },
  CLINICAL_CRITERIA: {
    requiredCanonicalRoles: ["CLINICAL_REVIEWER", "PHYSICIAN_REVIEWER"],
    oneReviewSuffices: false,
    specializedReviewRequired: true,
    eligibleForPromotion: true,
    unresolvedConflictBlocksPromotion: true,
  },
  LEGAL_STATUS_REQUIREMENTS: {
    requiredCanonicalRoles: ["LEGAL_REVIEWER", "COMPLIANCE_REVIEWER"],
    oneReviewSuffices: false,
    specializedReviewRequired: true,
    eligibleForPromotion: true,
    unresolvedConflictBlocksPromotion: true,
  },
  CUSTODY_TRANSPORT: {
    requiredCanonicalRoles: ["TRANSPORT_COORDINATOR", "LEGAL_REVIEWER"],
    oneReviewSuffices: true,
    specializedReviewRequired: true,
    eligibleForPromotion: true,
    unresolvedConflictBlocksPromotion: true,
  },
  CAPACITY_BED_COUNT_CLAIMS: {
    requiredCanonicalRoles: ["FACILITY_REVIEWER", "COMPLIANCE_REVIEWER"],
    oneReviewSuffices: true,
    specializedReviewRequired: true,
    eligibleForPromotion: true,
    unresolvedConflictBlocksPromotion: true,
  },
  ARRIVAL_HANDOFF_PROCEDURES: {
    requiredCanonicalRoles: ["FACILITY_REVIEWER", "TRANSPORT_COORDINATOR", "COMPLIANCE_REVIEWER"],
    oneReviewSuffices: true,
    specializedReviewRequired: true,
    eligibleForPromotion: true,
    unresolvedConflictBlocksPromotion: true,
  },
  PAYMENT_OR_SOURCE_CONFIDENCE: {
    requiredCanonicalRoles: ["COMPLIANCE_REVIEWER", "ORGANIZATION_ADMIN"],
    oneReviewSuffices: true,
    specializedReviewRequired: false,
    eligibleForPromotion: true,
    unresolvedConflictBlocksPromotion: false,
  },
};

export function policyForFieldSensitivity(
  category: NetworkReviewFieldSensitivity,
): NetworkReviewPolicy {
  return NETWORK_REVIEW_FIELD_POLICIES[category];
}

export const NETWORK_ENRICHMENT_REVIEW_STATES = [
  "UNRESEARCHED",
  "REVIEW_PENDING",
  "SOURCE_CONFIRMED",
  "HUMAN_CONFIRMED",
  "CONFLICT",
  "STALE",
  "REJECTED",
  "SUPERSEDED",
  "DEPRECATED",
] as const;
export type NetworkEnrichmentReviewState = (typeof NETWORK_ENRICHMENT_REVIEW_STATES)[number];

export const NETWORK_SOURCE_REVIEW_ROLES = [
  "NETWORK_REVIEWER",
  "FACILITY_CLINICAL_GOVERNANCE",
  "FACILITY_LEGAL_COMPLIANCE",
  "FACILITY_OPERATIONS",
  "NETWORK_COMPLIANCE_REVIEWER",
] as const;
export type NetworkSourceReviewRole = (typeof NETWORK_SOURCE_REVIEW_ROLES)[number];

export const NETWORK_SOURCE_ROLE_ALIAS_MAP = {
  NETWORK_REVIEWER: ["FACILITY_REVIEWER", "COMPLIANCE_REVIEWER"],
  FACILITY_CLINICAL_GOVERNANCE: ["CLINICAL_REVIEWER"],
  FACILITY_LEGAL_COMPLIANCE: ["LEGAL_REVIEWER", "COMPLIANCE_REVIEWER"],
  FACILITY_OPERATIONS: ["TRANSPORT_COORDINATOR"],
  NETWORK_COMPLIANCE_REVIEWER: ["COMPLIANCE_REVIEWER"],
} as const satisfies Record<NetworkSourceReviewRole, readonly UserRole[]>;

export const REVIEW_TRANSITIONS: Record<
  NetworkEnrichmentReviewState,
  readonly NetworkEnrichmentReviewState[]
> = {
  UNRESEARCHED: ["REVIEW_PENDING", "SOURCE_CONFIRMED"],
  REVIEW_PENDING: ["HUMAN_CONFIRMED", "REJECTED"],
  SOURCE_CONFIRMED: ["HUMAN_CONFIRMED", "REJECTED"],
  HUMAN_CONFIRMED: ["SUPERSEDED", "DEPRECATED"],
  CONFLICT: ["REVIEW_PENDING", "REJECTED"],
  STALE: ["REVIEW_PENDING", "REJECTED"],
  REJECTED: [],
  SUPERSEDED: [],
  DEPRECATED: [],
};

export function isReviewTransitionAllowed(
  from: NetworkEnrichmentReviewState,
  to: NetworkEnrichmentReviewState,
): boolean {
  return REVIEW_TRANSITIONS[from].includes(to);
}

export function resolveCanonicalRolesFromSourceRoles(
  sourceRoles: readonly NetworkSourceReviewRole[],
): readonly UserRole[] {
  const canonical = new Set<UserRole>();
  for (const sourceRole of sourceRoles) {
    const aliases = NETWORK_SOURCE_ROLE_ALIAS_MAP[sourceRole];
    for (const alias of aliases) {
      canonical.add(alias);
    }
  }
  return [...canonical];
}

export interface NetworkReviewAuditEvent {
  readonly action: "SUBMIT_FOR_REVIEW" | "APPROVE_REVIEW" | "REJECT_REVIEW";
  readonly actorId: string;
  readonly actorType: "USER" | "AGENT" | "SYSTEM";
  readonly commandId: string;
  readonly correlationId: string | undefined;
  readonly reason: string | null;
  readonly occurredAt: string;
}

export interface NetworkReviewRecord {
  readonly reviewPackageId: string;
  readonly reviewId: string;
  readonly organizationId: string;
  readonly caseId: string;
  readonly sourceCandidateId: string;
  readonly fieldPath: string;
  readonly sensitivityCategory: NetworkReviewFieldSensitivity;
  readonly requiredCanonicalRoles: readonly UserRole[];
  readonly createdByActorId: string;
  readonly currentValue: unknown;
  readonly proposedValue: unknown;
  readonly sourceReviewerRoles: readonly NetworkSourceReviewRole[];
  readonly status: NetworkEnrichmentReviewState;
  readonly reviewPackageStatus?: NetworkReviewPolicyState;
  readonly version: number;
  readonly reviewRunId?: string | null;
  readonly valueType?: string | null;
  readonly valueSource?: string | null;
  readonly canonicalSnapshot?: unknown;
  readonly freshnessState?: string | null;
  readonly sourceEffectiveDate?: string | null;
  readonly retrievedAt?: string;
  readonly reviewedAt?: string | null;
  readonly supersedesReviewId?: string | null;
  readonly reviewedByActorId?: string;
  readonly reviewReason?: string | null;
  readonly supersededByReviewId?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly audits: readonly NetworkReviewAuditEvent[];
}

export interface NetworkReviewFieldEvidenceRecord {
  readonly evidenceId?: string;
  readonly reviewId: string;
  readonly evidenceType: string;
  readonly payload: unknown;
  readonly evidenceSource: string;
  readonly evidenceTypeAlias?: string;
}

export interface NetworkReviewConflictRecord {
  readonly conflictId: string;
  readonly organizationId: string;
  readonly reviewPackageId: string;
  readonly fieldPath?: string;
  readonly conflictType?: string;
  readonly authorityDifference?: string | null;
  readonly dateDifference?: string | null;
  readonly scopeDifference?: string | null;
  readonly status: "OPEN" | "RESOLVED";
  readonly reason: string | null;
  readonly requiredReviewerCategory?: readonly string[];
  readonly resolutionDecision?: string | null;
  readonly resolvedBy?: string | null;
  readonly resolvedAt?: string | null;
  readonly packageAssignedCategory?: readonly string[];
  readonly version?: number;
  readonly relatedReviewIds: readonly string[];
}

export const SubmitForReviewCommandSchema = z
  .object({
    ...baseEnvelope,
    reviewId: DOMAIN_ID_SCHEMA,
    reviewPackageId: z.string().min(1).optional(),
    caseId: DOMAIN_ID_SCHEMA,
    sourceCandidateId: DOMAIN_ID_SCHEMA,
    fieldPath: z.string().min(1),
    sensitivityCategory: z
      .enum(NETWORK_REVIEW_FIELD_SENSITIVITY)
      .default("NORMAL_OPERATIONAL"),
    currentValue: z.unknown(),
    proposedValue: z.unknown(),
    sourceReviewerRoles: z.array(z.enum(NETWORK_SOURCE_REVIEW_ROLES)).min(1),
  })
  .strict();
export type SubmitForReviewCommand = z.input<typeof SubmitForReviewCommandSchema>;

export const ApproveReviewCommandSchema = z
  .object({
    ...baseEnvelope,
    reviewId: DOMAIN_ID_SCHEMA,
    expectedVersion: z.number().int().positive(),
    actorNotes: z.string().min(1).optional(),
  })
  .strict();
export type ApproveReviewCommand = z.input<typeof ApproveReviewCommandSchema>;

export const RejectReviewCommandSchema = z
  .object({
    ...baseEnvelope,
    reviewId: DOMAIN_ID_SCHEMA,
    expectedVersion: z.number().int().positive(),
    rejectionReason: z.string().min(1),
  })
  .strict();
export type RejectReviewCommand = z.input<typeof RejectReviewCommandSchema>;

export const ReconcilePackageCommandSchema = z
  .object({
    ...baseEnvelope,
    reviewPackageId: DOMAIN_ID_SCHEMA,
    expectedVersion: z.number().int().positive(),
    notes: z.string().min(1).optional(),
  })
  .strict();
export type ReconcilePackageCommand = z.input<typeof ReconcilePackageCommandSchema>;

export interface NetworkCommandResult<T> {
  value: T;
  replayed: boolean;
}

export interface NetworkReviewSubmitResult {
  review: NetworkReviewRecord;
  reviewPackageStatus?: NetworkReviewPolicyState;
  replayed?: boolean;
}

export interface NetworkReviewTransitionResult {
  review: NetworkReviewRecord;
  reviewPackageStatus?: NetworkReviewPolicyState;
  replayed?: boolean;
}

export interface ReconcilePackageResult {
  packageRecord: NetworkReviewPackageRecord;
  promotedFieldPaths: readonly string[];
  replayed?: boolean;
}

export interface NetworkReviewReplayInput {
  organizationId: string;
  commandType: string;
  idempotencyKey: string;
  fingerprint: string;
}

export const REVIEW_AUDIT_ACTIONS = ["SUBMIT_FOR_REVIEW", "APPROVE_REVIEW", "REJECT_REVIEW"] as const;
export type ReviewAuditAction = (typeof REVIEW_AUDIT_ACTIONS)[number];

export const TimestampedActorSchema = z.object({
  actorId: z.string().min(1),
  actorType: z.enum(["USER", "AGENT", "SYSTEM"]).default("USER"),
  actionedAt: ISO_DATETIME_SCHEMA,
});
export type TimestampedActor = z.input<typeof TimestampedActorSchema>;

export interface CommandActorWithRoles extends CommandActor {
  roles: UserRole[];
}

export class NetworkEnrichmentDomainError extends Error {
  constructor(
    public readonly code:
      | "VALIDATION"
      | "NOT_FOUND"
      | "CONFLICT"
      | "IDEMPOTENCY_CONFLICT"
      | "PERMISSION_DENIED"
      | "CONCURRENCY_CONFLICT",
    message: string,
  ) {
    super(message);
    this.name = "NetworkEnrichmentDomainError";
  }
}

export function isCommandActorAuthorized(
  allowedRoles: readonly UserRole[],
  actorRoles: readonly UserRole[],
): boolean {
  if (allowedRoles.length === 0) {
    return false;
  }
  return actorRoles.some((role) => allowedRoles.includes(role));
}

export function assertUserRoleOverlap(
  allowedRoles: readonly UserRole[],
  actorRoles: readonly UserRole[],
  command: string,
): void {
  if (!isCommandActorAuthorized(allowedRoles, actorRoles)) {
    throw new NetworkEnrichmentDomainError("PERMISSION_DENIED", `${command} denied by role policy.`);
  }
}

export const ExportAuditLogCommandSchema = z
  .object({
    organizationId: z.string().min(1),
    reviewPackageId: z.string().min(1),
    actor: CommandActorSchema,
    includeEvidenceExcerpts: z.boolean().default(true),
    includeConflictsMatrix: z.boolean().default(true),
    correlationId: z.string().min(1),
  })
  .strict();
export type ExportAuditLogCommand = z.input<typeof ExportAuditLogCommandSchema>;

export interface ComplianceExportManifest {
  exportId: string;
  organizationId: string;
  reviewPackageId: string;
  generatedAt: string;
  generatedByActorId: string;
  recordCount: number;
  integrityHashAlg: "SHA-256";
  integrityHash: string;
}

export interface ComplianceExportPackage {
  manifest: ComplianceExportManifest;
  packageRecord: NetworkReviewPackageRecord;
  reviews: readonly NetworkReviewRecord[];
  conflicts: readonly NetworkReviewConflictRecord[];
  auditTimeline: readonly NetworkReviewAuditEvent[];
}
