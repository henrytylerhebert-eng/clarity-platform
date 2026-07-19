import {
  canTransitionEvidence,
  type ClarityContradictionGroup,
  type ClarityEvidence,
  type UserRole,
} from "@clarity/domain-contracts";
import type {
  EvidenceCommandResult,
  PrismaEvidenceGateway,
  SupersedeEvidenceResult,
} from "@clarity/case-repository";
import { EvidenceNotFoundError, EvidenceStateError } from "@clarity/case-repository";
import {
  AddEvidenceToContradictionGroupCommandSchema,
  ApproveEvidenceCommandSchema,
  CorrectCandidateEvidenceCommandSchema,
  CreateCandidateEvidenceCommandSchema,
  CreateContradictionGroupCommandSchema,
  RejectEvidenceCommandSchema,
  RequestEvidenceClarificationCommandSchema,
  ResolveContradictionReviewCommandSchema,
  SupersedeEvidenceCommandSchema,
  type AddEvidenceToContradictionGroupCommand,
  type ApproveEvidenceCommand,
  type CorrectCandidateEvidenceCommand,
  type CreateCandidateEvidenceCommand,
  type CreateContradictionGroupCommand,
  type RejectEvidenceCommand,
  type RequestEvidenceClarificationCommand,
  type ResolveContradictionReviewCommand,
  type SupersedeEvidenceCommand,
} from "./commands.js";
import {
  assertContradictionReviewPermitted,
  assertEvidenceCreatePermitted,
  assertEvidenceReviewPermitted,
} from "./permissions.js";

/** Audit action vocabulary for evidence commands (REQ-007 lineage). */
export const EVIDENCE_AUDIT_ACTIONS = {
  CreateCandidateEvidence: "EVIDENCE_CREATED",
  CorrectCandidateEvidence: "EVIDENCE_CORRECTED",
  ApproveEvidence: "EVIDENCE_APPROVED",
  RejectEvidence: "EVIDENCE_REJECTED",
  RequestEvidenceClarification: "EVIDENCE_CLARIFICATION_REQUESTED",
  SupersedeEvidence: "EVIDENCE_SUPERSEDED",
  CreateContradictionGroup: "CONTRADICTION_GROUP_CREATED",
  AddEvidenceToContradictionGroup: "EVIDENCE_ADDED_TO_CONTRADICTION",
  ResolveContradictionReview: "CONTRADICTION_REVIEW_UPDATED",
} as const;

/**
 * The single controlled path for evidence actions — entirely human-driven:
 * no OCR, no automated extraction, no scoring, no AI reasoning.
 *
 * Enforcement order per command: strict Zod envelope → role policy →
 * gateway transaction (tenant-scoped reads with case + document + evidence
 * ownership together, state machine against the fresh row, conditional
 * versioned write, atomic audit, idempotency record).
 *
 * Domain-scoped review permission (approve/reject/clarify/supersede) binds
 * the actor's roles to the evidence item's OWN category. The category is
 * pre-read through the tenant-scoped gateway — safe outside the transaction
 * because no code path can ever change an item's category — and the state
 * machine still revalidates status inside the transaction.
 *
 * Source-text immutability is structural: no command schema and no gateway
 * change-set can express an originalText update. Material corrections go
 * through SupersedeEvidence, which freezes the original and creates a new
 * CANDIDATE in the same evidence family.
 */
export class EvidenceCommandService {
  constructor(private readonly gateway: PrismaEvidenceGateway) {}

  async createCandidateEvidence(input: CreateCandidateEvidenceCommand): Promise<EvidenceCommandResult> {
    const cmd = CreateCandidateEvidenceCommandSchema.parse(input);
    assertEvidenceCreatePermitted("CreateCandidateEvidence", cmd.actor.roles);
    return this.gateway.createEvidence({
      organizationId: cmd.organizationId,
      caseId: cmd.caseId,
      source: {
        documentId: cmd.documentId,
        category: cmd.category,
        subcategory: cmd.subcategory ?? null,
        originalText: cmd.originalText,
        normalizedValue: cmd.normalizedValue,
        pageNumber: cmd.pageNumber ?? null,
        sectionLabel: cmd.sectionLabel ?? null,
        sourceAuthor: cmd.sourceAuthor ?? null,
        sourceTimestamp: cmd.sourceTimestamp ?? null,
      },
      createdBy: cmd.actor.actorId,
      actor: { actorType: cmd.actor.actorType, actorId: cmd.actor.actorId },
      commandType: "CreateCandidateEvidence",
      correlationId: cmd.correlationId,
      idempotencyKey: cmd.idempotencyKey,
      reason: cmd.reason,
      auditAction: EVIDENCE_AUDIT_ACTIONS.CreateCandidateEvidence,
    });
  }

  async correctCandidateEvidence(input: CorrectCandidateEvidenceCommand): Promise<EvidenceCommandResult> {
    const cmd = CorrectCandidateEvidenceCommandSchema.parse(input);
    assertEvidenceCreatePermitted("CorrectCandidateEvidence", cmd.actor.roles);
    return this.gateway.executeEvidenceCommand({
      ...this.envelope(cmd, "CorrectCandidateEvidence"),
      decide: (current) => {
        if (current.status !== "CANDIDATE" && current.status !== "NEEDS_CLARIFICATION") {
          // Approved/rejected/superseded evidence is never silently edited.
          throw new EvidenceStateError(current.evidenceId, current.status, "CANDIDATE");
        }
        const changedFields = (
          ["normalizedValue", "subcategory", "pageNumber", "sectionLabel", "reviewerNote"] as const
        ).filter((f) => cmd[f] !== undefined);
        return {
          changes: {
            normalizedValue: cmd.normalizedValue,
            ...(cmd.subcategory !== undefined ? { subcategory: cmd.subcategory } : {}),
            ...(cmd.pageNumber !== undefined ? { pageNumber: cmd.pageNumber } : {}),
            ...(cmd.sectionLabel !== undefined ? { sectionLabel: cmd.sectionLabel } : {}),
            ...(cmd.reviewerNote !== undefined ? { reviewerNote: cmd.reviewerNote } : {}),
            // A clarified item returns to the review queue.
            ...(current.status === "NEEDS_CLARIFICATION" ? { status: "CANDIDATE" as const } : {}),
          },
          auditAction: EVIDENCE_AUDIT_ACTIONS.CorrectCandidateEvidence,
          auditMetadata: {
            category: current.category,
            changedFields, // field NAMES only — values never enter audit rows
            fromStatus: current.status,
          },
        };
      },
    });
  }

  async approveEvidence(input: ApproveEvidenceCommand): Promise<EvidenceCommandResult> {
    const cmd = ApproveEvidenceCommandSchema.parse(input);
    const current = await this.requireEvidence(cmd);
    assertEvidenceReviewPermitted("ApproveEvidence", current.category, cmd.actor.roles);
    return this.gateway.executeEvidenceCommand({
      ...this.envelope(cmd, "ApproveEvidence"),
      decide: (fresh) => {
        if (!canTransitionEvidence(fresh.status, "APPROVED")) {
          throw new EvidenceStateError(fresh.evidenceId, fresh.status, "APPROVED");
        }
        return {
          changes: {
            status: "APPROVED",
            markReviewed: true,
            ...(cmd.reviewerNote !== undefined ? { reviewerNote: cmd.reviewerNote } : {}),
          },
          auditAction: EVIDENCE_AUDIT_ACTIONS.ApproveEvidence,
          auditMetadata: { category: fresh.category, from: fresh.status, to: "APPROVED" },
        };
      },
    });
  }

  async rejectEvidence(input: RejectEvidenceCommand): Promise<EvidenceCommandResult> {
    const cmd = RejectEvidenceCommandSchema.parse(input); // reason is schema-mandatory
    const current = await this.requireEvidence(cmd);
    assertEvidenceReviewPermitted("RejectEvidence", current.category, cmd.actor.roles);
    return this.gateway.executeEvidenceCommand({
      ...this.envelope(cmd, "RejectEvidence"),
      decide: (fresh) => {
        if (!canTransitionEvidence(fresh.status, "REJECTED")) {
          throw new EvidenceStateError(fresh.evidenceId, fresh.status, "REJECTED");
        }
        return {
          changes: { status: "REJECTED", markReviewed: true },
          auditAction: EVIDENCE_AUDIT_ACTIONS.RejectEvidence,
          auditMetadata: { category: fresh.category, from: fresh.status, to: "REJECTED" },
        };
      },
    });
  }

  async requestEvidenceClarification(
    input: RequestEvidenceClarificationCommand,
  ): Promise<EvidenceCommandResult> {
    const cmd = RequestEvidenceClarificationCommandSchema.parse(input); // note is schema-mandatory
    const current = await this.requireEvidence(cmd);
    assertEvidenceReviewPermitted("RequestEvidenceClarification", current.category, cmd.actor.roles);
    return this.gateway.executeEvidenceCommand({
      ...this.envelope(cmd, "RequestEvidenceClarification"),
      decide: (fresh) => {
        if (!canTransitionEvidence(fresh.status, "NEEDS_CLARIFICATION")) {
          throw new EvidenceStateError(fresh.evidenceId, fresh.status, "NEEDS_CLARIFICATION");
        }
        return {
          changes: { status: "NEEDS_CLARIFICATION", reviewerNote: cmd.note, markReviewed: true },
          auditAction: EVIDENCE_AUDIT_ACTIONS.RequestEvidenceClarification,
          auditMetadata: { category: fresh.category, from: fresh.status, to: "NEEDS_CLARIFICATION" },
        };
      },
    });
  }

  /**
   * Review-level act: superseding invalidates existing evidence (including
   * approved evidence), so it always requires the category's domain-review
   * roles — creators fixing their own CANDIDATE use CorrectCandidateEvidence.
   */
  async supersedeEvidence(input: SupersedeEvidenceCommand): Promise<SupersedeEvidenceResult> {
    const cmd = SupersedeEvidenceCommandSchema.parse(input); // reason is schema-mandatory
    const current = await this.requireEvidence(cmd);
    assertEvidenceReviewPermitted("SupersedeEvidence", current.category, cmd.actor.roles);
    return this.gateway.supersedeEvidence({
      organizationId: cmd.organizationId,
      caseId: cmd.caseId,
      evidenceId: cmd.evidenceId,
      expectedVersion: cmd.expectedVersion,
      replacement: {
        documentId: cmd.replacement.documentId,
        category: cmd.replacement.category,
        subcategory: cmd.replacement.subcategory ?? null,
        originalText: cmd.replacement.originalText,
        normalizedValue: cmd.replacement.normalizedValue,
        pageNumber: cmd.replacement.pageNumber ?? null,
        sectionLabel: cmd.replacement.sectionLabel ?? null,
        sourceAuthor: cmd.replacement.sourceAuthor ?? null,
        sourceTimestamp: cmd.replacement.sourceTimestamp ?? null,
      },
      createdBy: cmd.actor.actorId,
      actor: { actorType: cmd.actor.actorType, actorId: cmd.actor.actorId },
      commandType: "SupersedeEvidence",
      correlationId: cmd.correlationId,
      idempotencyKey: cmd.idempotencyKey,
      reason: cmd.reason,
    });
  }

  async createContradictionGroup(
    input: CreateContradictionGroupCommand,
  ): Promise<ClarityContradictionGroup> {
    const cmd = CreateContradictionGroupCommandSchema.parse(input);
    assertContradictionReviewPermitted("CreateContradictionGroup", cmd.actor.roles);
    return this.gateway.createContradictionGroup({
      organizationId: cmd.organizationId,
      caseId: cmd.caseId,
      evidenceIds: cmd.evidenceIds,
      createdBy: cmd.actor.actorId,
      actor: { actorType: cmd.actor.actorType, actorId: cmd.actor.actorId },
      commandType: "CreateContradictionGroup",
      correlationId: cmd.correlationId,
      reason: cmd.reason,
    });
  }

  async addEvidenceToContradictionGroup(
    input: AddEvidenceToContradictionGroupCommand,
  ): Promise<ClarityContradictionGroup> {
    const cmd = AddEvidenceToContradictionGroupCommandSchema.parse(input);
    assertContradictionReviewPermitted("AddEvidenceToContradictionGroup", cmd.actor.roles);
    return this.gateway.addEvidenceToContradictionGroup({
      organizationId: cmd.organizationId,
      caseId: cmd.caseId,
      groupId: cmd.groupId,
      evidenceId: cmd.evidenceId,
      expectedGroupVersion: cmd.expectedGroupVersion,
      actor: { actorType: cmd.actor.actorType, actorId: cmd.actor.actorId },
      commandType: "AddEvidenceToContradictionGroup",
      correlationId: cmd.correlationId,
      reason: cmd.reason,
    });
  }

  async resolveContradictionReview(
    input: ResolveContradictionReviewCommand,
  ): Promise<ClarityContradictionGroup> {
    const cmd = ResolveContradictionReviewCommandSchema.parse(input);
    assertContradictionReviewPermitted("ResolveContradictionReview", cmd.actor.roles);
    return this.gateway.resolveContradictionReview({
      organizationId: cmd.organizationId,
      caseId: cmd.caseId,
      groupId: cmd.groupId,
      classification: cmd.classification,
      reviewNote: cmd.reviewNote,
      expectedGroupVersion: cmd.expectedGroupVersion,
      actor: { actorType: cmd.actor.actorType, actorId: cmd.actor.actorId },
      commandType: "ResolveContradictionReview",
      correlationId: cmd.correlationId,
      reason: cmd.reason,
    });
  }

  /** Tenant-scoped pre-read; non-revealing miss. Category is immutable, so this cannot be raced. */
  private async requireEvidence(cmd: {
    organizationId: string;
    caseId: string;
    evidenceId: string;
  }): Promise<ClarityEvidence> {
    const current = await this.gateway.findEvidence(cmd.organizationId, cmd.caseId, cmd.evidenceId);
    if (!current) throw new EvidenceNotFoundError(cmd.evidenceId);
    return current;
  }

  private envelope(
    cmd: {
      organizationId: string;
      caseId: string;
      evidenceId: string;
      expectedVersion?: number;
      actor: { actorId: string; actorType: "USER" | "AGENT" | "SYSTEM"; roles: UserRole[] };
      correlationId?: string;
      idempotencyKey?: string;
      reason?: string;
    },
    commandType: string,
  ) {
    return {
      organizationId: cmd.organizationId,
      caseId: cmd.caseId,
      evidenceId: cmd.evidenceId,
      expectedVersion: cmd.expectedVersion,
      actor: { actorType: cmd.actor.actorType, actorId: cmd.actor.actorId },
      commandType,
      correlationId: cmd.correlationId,
      idempotencyKey: cmd.idempotencyKey,
      reason: cmd.reason,
    };
  }
}
