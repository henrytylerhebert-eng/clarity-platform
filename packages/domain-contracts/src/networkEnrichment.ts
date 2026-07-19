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
};

export const NETWORK_ENRICHMENT_REVIEW_STATES = [
  "REVIEW_PENDING",
  "HUMAN_CONFIRMED",
  "REJECTED",
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
  REVIEW_PENDING: ["HUMAN_CONFIRMED", "REJECTED"],
  HUMAN_CONFIRMED: [],
  REJECTED: [],
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
  readonly reviewId: string;
  readonly organizationId: string;
  readonly caseId: string;
  readonly sourceCandidateId: string;
  readonly fieldPath: string;
  readonly currentValue: unknown;
  readonly proposedValue: unknown;
  readonly requiredCanonicalRoles: readonly UserRole[];
  readonly status: NetworkEnrichmentReviewState;
  readonly version: number;
  readonly createdByActorId: string;
  readonly reviewedByActorId?: string;
  readonly reviewReason?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly audits: readonly NetworkReviewAuditEvent[];
}

export const SubmitForReviewCommandSchema = z
  .object({
    ...baseEnvelope,
    reviewId: DOMAIN_ID_SCHEMA,
    caseId: DOMAIN_ID_SCHEMA,
    sourceCandidateId: DOMAIN_ID_SCHEMA,
    fieldPath: z.string().min(1),
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

export interface NetworkCommandResult<T> {
  value: T;
  replayed: boolean;
}

export interface NetworkReviewSubmitResult {
  review: NetworkReviewRecord;
}

export interface NetworkReviewTransitionResult {
  review: NetworkReviewRecord;
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
