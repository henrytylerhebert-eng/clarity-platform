import { Prisma, type PrismaClient } from "@prisma/client";
import type {
  AssuranceApplicabilityStatus,
  AssuranceAuthorityClass,
  AssuranceConflictStatus,
  AssuranceEvaluationInput,
  AssuranceEvaluationOutput,
  AssuranceEvaluationResult,
  AssuranceParticipantRole,
  AssuranceReferenceKind,
  AssuranceReviewDecision,
  AssuranceSourceCurrentness,
  AssuranceSourceRightsStatus,
  AuditActor,
} from "@clarity/domain-contracts";
import {
  PrismaCaseAuditWriter,
  type CaseAuditWriter,
  type TxClient,
} from "./auditWriter.js";
import {
  toAssuranceCase,
  toAssuranceEvidenceSubmission,
  toAssuranceEvaluation,
  toAssuranceReviewDecision,
  type PersistedAssuranceCase,
  type PersistedAssuranceEvidenceSubmission,
  type PersistedAssuranceEvaluation,
  type PersistedAssuranceReviewDecision,
} from "./assuranceMappers.js";

export class AssuranceNotFoundError extends Error {
  constructor() {
    super("assurance_resource_not_found");
    this.name = "AssuranceNotFoundError";
  }
}

export class AssuranceStateError extends Error {
  constructor(message = "assurance_state_invalid") {
    super(message);
    this.name = "AssuranceStateError";
  }
}

export interface CreateAssuranceCaseInput {
  readonly facilityProfileId: string;
  readonly caseKey: string;
  readonly title: string;
  readonly assuranceStatement: string;
}

export interface AddAssuranceParticipantInput {
  readonly assuranceCaseId: string;
  readonly userId: string;
  readonly role: AssuranceParticipantRole;
  readonly authorityBasis?: string;
}

export interface RecordApplicabilityDecisionInput {
  readonly assuranceCaseId: string;
  readonly status: AssuranceApplicabilityStatus;
  readonly rationale: string;
}

export interface AddAssuranceSourceInput {
  readonly assuranceCaseId: string;
  readonly sourceFamilyKey: string;
  readonly versionLabel: string;
  readonly title: string;
  readonly authorityClass: AssuranceAuthorityClass;
  readonly citation: string;
  readonly sourceUri?: string;
  readonly effectiveAt?: Date;
  readonly currentness: AssuranceSourceCurrentness;
  readonly rightsStatus: AssuranceSourceRightsStatus;
}

export interface AddAssuranceDocumentReferenceInput {
  readonly assuranceCaseId: string;
  readonly kind: AssuranceReferenceKind;
  readonly referenceKey: string;
  readonly title: string;
  readonly versionLabel: string;
  readonly locator?: string;
}

export interface AddAssuranceExpectationInput {
  readonly assuranceCaseId: string;
  readonly code: string;
  readonly prompt: string;
  readonly requiredKeys: readonly string[];
}

export interface SubmitAssuranceEvidenceInput {
  readonly assuranceCaseId: string;
  readonly expectationId: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface CreateAssuranceConflictInput {
  readonly assuranceCaseId: string;
  readonly leftSourceId: string;
  readonly rightSourceId: string;
  readonly status?: AssuranceConflictStatus;
  readonly note?: string;
}

export interface RecordAssuranceEvaluationInput {
  readonly assuranceCaseId: string;
  readonly applicabilityDecisionId?: string;
  readonly evidenceSubmissionId?: string;
  readonly result: AssuranceEvaluationResult;
  readonly reasonCodes: readonly string[];
  readonly sourceStateSnapshot: Readonly<Record<string, unknown>>;
  readonly evidenceStateSnapshot?: Readonly<Record<string, unknown>>;
  readonly requiresHumanReview?: boolean;
}

export interface RecordAssuranceReviewInput {
  readonly assuranceCaseId: string;
  readonly evaluationId: string;
  readonly decision: AssuranceReviewDecision;
  readonly rationale?: string;
  readonly reviewerUserId: string;
}

export type AssuranceEvaluator = (input: AssuranceEvaluationInput) => AssuranceEvaluationOutput;

export interface AssuranceParticipantGrant {
  readonly userId: string;
  readonly role: AssuranceParticipantRole;
  readonly authorityBasis: string | null;
  readonly active: boolean;
}

export interface AssuranceHistoryEntry {
  readonly kind: "EVIDENCE" | "EVALUATION" | "REVIEW";
  readonly id: string;
  readonly occurredAt: Date;
  readonly state: string;
  readonly version: number;
  readonly relatedId?: string;
}

function normalizeRequiredKeys(keys: readonly string[]): string[] {
  return [...new Set(keys.map((key) => key.trim()).filter(Boolean))];
}

function jsonRecord(value: Prisma.JsonValue): Readonly<Record<string, unknown>> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Readonly<Record<string, unknown>>;
  }
  return {};
}

function sourceHasRequiredMetadata(source: {
  sourceFamilyKey: string;
  versionLabel: string;
  title: string;
  citation: string;
}): boolean {
  return [source.sourceFamilyKey, source.versionLabel, source.title, source.citation].every(
    (value) => value.trim().length > 0,
  );
}

export class PrismaAssuranceGateway {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly auditWriter: CaseAuditWriter = new PrismaCaseAuditWriter(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async caseForOrg(tx: TxClient, organizationId: string, assuranceCaseId: string) {
    const row = await tx.assuranceCase.findFirst({
      where: { id: assuranceCaseId, organizationId },
    });
    if (!row) throw new AssuranceNotFoundError();
    return row;
  }

  private async userForOrg(tx: TxClient, organizationId: string, userId: string) {
    const row = await tx.user.findFirst({ where: { id: userId, organizationId } });
    if (!row) throw new AssuranceNotFoundError();
    return row;
  }

  private async facilityForOrg(tx: TxClient, organizationId: string, facilityProfileId: string) {
    const row = await tx.facilityProfile.findFirst({
      where: { id: facilityProfileId, organizationId },
    });
    if (!row) throw new AssuranceNotFoundError();
    return row;
  }

  private async lockCase(tx: TxClient, organizationId: string, assuranceCaseId: string): Promise<void> {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${organizationId}:${assuranceCaseId}:oa`}))`;
  }

  async createCase(
    organizationId: string,
    input: CreateAssuranceCaseInput,
    actor: AuditActor,
  ): Promise<PersistedAssuranceCase> {
    return this.prisma.$transaction(async (tx) => {
      await this.facilityForOrg(tx, organizationId, input.facilityProfileId);
      await this.userForOrg(tx, organizationId, actor.actorId);
      const row = await tx.assuranceCase.create({
        data: {
          organizationId,
          facilityProfileId: input.facilityProfileId,
          caseKey: input.caseKey,
          title: input.title,
          assuranceStatement: input.assuranceStatement,
          createdBy: actor.actorId,
        },
      });
      await this.auditWriter.write(tx, {
        organizationId,
        caseId: null,
        action: "ASSURANCE_CASE_CREATED",
        actor,
        objectType: "ASSURANCE_CASE",
        objectId: row.id,
        metadata: { caseKey: row.caseKey, facilityProfileId: row.facilityProfileId },
        occurredAt: this.now(),
      });
      return toAssuranceCase(row);
    });
  }

  async findCaseByKey(
    organizationId: string,
    caseKey: string,
  ): Promise<PersistedAssuranceCase | undefined> {
    const row = await this.prisma.assuranceCase.findFirst({
      where: { organizationId, caseKey },
    });
    return row ? toAssuranceCase(row) : undefined;
  }

  async findEvidenceSubmission(
    organizationId: string,
    submissionId: string,
  ): Promise<PersistedAssuranceEvidenceSubmission | undefined> {
    const row = await this.prisma.assuranceEvidenceSubmission.findFirst({
      where: { id: submissionId, organizationId },
    });
    return row ? toAssuranceEvidenceSubmission(row) : undefined;
  }

  async findActiveParticipant(
    organizationId: string,
    assuranceCaseId: string,
    userId: string,
    role?: AssuranceParticipantRole,
  ): Promise<AssuranceParticipantGrant | undefined> {
    const row = await this.prisma.assuranceParticipantAssignment.findFirst({
      where: {
        organizationId,
        assuranceCaseId,
        userId,
        active: true,
        ...(role ? { role } : {}),
      },
      orderBy: { grantedAt: "desc" },
    });
    return row
      ? {
          userId: row.userId,
          role: row.role,
          authorityBasis: row.authorityBasis,
          active: row.active,
        }
      : undefined;
  }

  async addParticipant(
    organizationId: string,
    input: AddAssuranceParticipantInput,
    actor: AuditActor,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.caseForOrg(tx, organizationId, input.assuranceCaseId);
      await this.userForOrg(tx, organizationId, input.userId);
      if (input.role === "QUALIFIED_REVIEWER" && !input.authorityBasis?.trim()) {
        throw new AssuranceStateError("qualified_reviewer_authority_basis_required");
      }
      const row = await tx.assuranceParticipantAssignment.create({
        data: {
          organizationId,
          assuranceCaseId: input.assuranceCaseId,
          userId: input.userId,
          role: input.role,
          authorityBasis: input.authorityBasis?.trim() || null,
          active: true,
          grantedBy: actor.actorId,
          grantedAt: this.now(),
        },
      });
      await this.auditWriter.write(tx, {
        organizationId,
        caseId: null,
        action: "ASSURANCE_PARTICIPANT_ADDED",
        actor,
        objectType: "ASSURANCE_PARTICIPANT",
        objectId: row.id,
        metadata: {
          assuranceCaseId: input.assuranceCaseId,
          userId: input.userId,
          role: input.role,
        },
        occurredAt: this.now(),
      });
      return row;
    });
  }

  async recordApplicabilityDecision(
    organizationId: string,
    input: RecordApplicabilityDecisionInput,
    actor: AuditActor,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.caseForOrg(tx, organizationId, input.assuranceCaseId);
      await this.userForOrg(tx, organizationId, actor.actorId);
      await this.lockCase(tx, organizationId, input.assuranceCaseId);
      const latest = await tx.assuranceApplicabilityDecision.findFirst({
        where: { organizationId, assuranceCaseId: input.assuranceCaseId },
        orderBy: { version: "desc" },
      });
      const approved = input.status === "APPROVED";
      const row = await tx.assuranceApplicabilityDecision.create({
        data: {
          organizationId,
          assuranceCaseId: input.assuranceCaseId,
          status: input.status,
          rationale: input.rationale,
          approvedBy: approved ? actor.actorId : null,
          approvedAt: approved ? this.now() : null,
          version: (latest?.version ?? 0) + 1,
        },
      });
      await this.auditWriter.write(tx, {
        organizationId,
        caseId: null,
        action: "ASSURANCE_APPLICABILITY_RECORDED",
        actor,
        objectType: "ASSURANCE_APPLICABILITY",
        objectId: row.id,
        metadata: {
          assuranceCaseId: input.assuranceCaseId,
          status: input.status,
          version: row.version,
        },
        occurredAt: this.now(),
      });
      return row;
    });
  }

  async addSourceReference(
    organizationId: string,
    input: AddAssuranceSourceInput,
    actor: AuditActor,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.caseForOrg(tx, organizationId, input.assuranceCaseId);
      const row = await tx.assuranceSourceReference.create({
        data: {
          organizationId,
          assuranceCaseId: input.assuranceCaseId,
          sourceFamilyKey: input.sourceFamilyKey,
          versionLabel: input.versionLabel,
          title: input.title,
          authorityClass: input.authorityClass,
          citation: input.citation,
          sourceUri: input.sourceUri ?? null,
          effectiveAt: input.effectiveAt ?? null,
          currentness: input.currentness,
          rightsStatus: input.rightsStatus,
        },
      });
      await this.auditWriter.write(tx, {
        organizationId,
        caseId: null,
        action: "ASSURANCE_SOURCE_ADDED",
        actor,
        objectType: "ASSURANCE_SOURCE",
        objectId: row.id,
        metadata: {
          assuranceCaseId: input.assuranceCaseId,
          sourceFamilyKey: row.sourceFamilyKey,
          versionLabel: row.versionLabel,
          currentness: row.currentness,
          rightsStatus: row.rightsStatus,
        },
        occurredAt: this.now(),
      });
      return row;
    });
  }

  async setSourceCurrentness(
    organizationId: string,
    sourceId: string,
    currentness: AssuranceSourceCurrentness,
    actor: AuditActor,
    supersededBySourceId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const source = await tx.assuranceSourceReference.findFirst({
        where: { id: sourceId, organizationId },
      });
      if (!source) throw new AssuranceNotFoundError();
      if (supersededBySourceId) {
        const replacement = await tx.assuranceSourceReference.findFirst({
          where: {
            id: supersededBySourceId,
            organizationId,
            assuranceCaseId: source.assuranceCaseId,
          },
        });
        if (!replacement) throw new AssuranceNotFoundError();
      }
      const row = await tx.assuranceSourceReference.update({
        where: { id: source.id },
        data: {
          currentness,
          supersededBySourceId: supersededBySourceId ?? source.supersededBySourceId,
          version: { increment: 1 },
        },
      });
      await this.auditWriter.write(tx, {
        organizationId,
        caseId: null,
        action: "ASSURANCE_SOURCE_CURRENTNESS_CHANGED",
        actor,
        objectType: "ASSURANCE_SOURCE",
        objectId: row.id,
        metadata: {
          from: source.currentness,
          to: currentness,
          supersededBySourceId: supersededBySourceId ?? null,
        },
        occurredAt: this.now(),
      });
      return row;
    });
  }

  async addDocumentReference(
    organizationId: string,
    input: AddAssuranceDocumentReferenceInput,
    actor: AuditActor,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.caseForOrg(tx, organizationId, input.assuranceCaseId);
      const row = await tx.assuranceDocumentReference.create({
        data: {
          organizationId,
          assuranceCaseId: input.assuranceCaseId,
          kind: input.kind,
          referenceKey: input.referenceKey,
          title: input.title,
          versionLabel: input.versionLabel,
          locator: input.locator ?? null,
        },
      });
      await this.auditWriter.write(tx, {
        organizationId,
        caseId: null,
        action: "ASSURANCE_DOCUMENT_REFERENCE_ADDED",
        actor,
        objectType: "ASSURANCE_DOCUMENT_REFERENCE",
        objectId: row.id,
        metadata: {
          assuranceCaseId: input.assuranceCaseId,
          kind: input.kind,
          referenceKey: input.referenceKey,
        },
        occurredAt: this.now(),
      });
      return row;
    });
  }

  async addEvidenceExpectation(
    organizationId: string,
    input: AddAssuranceExpectationInput,
    actor: AuditActor,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.caseForOrg(tx, organizationId, input.assuranceCaseId);
      const requiredKeys = normalizeRequiredKeys(input.requiredKeys);
      if (requiredKeys.length === 0) {
        throw new AssuranceStateError("evidence_expectation_requires_keys");
      }
      const row = await tx.assuranceEvidenceExpectation.create({
        data: {
          organizationId,
          assuranceCaseId: input.assuranceCaseId,
          code: input.code,
          prompt: input.prompt,
          requiredKeys,
        },
      });
      await this.auditWriter.write(tx, {
        organizationId,
        caseId: null,
        action: "ASSURANCE_EXPECTATION_ADDED",
        actor,
        objectType: "ASSURANCE_EXPECTATION",
        objectId: row.id,
        metadata: {
          assuranceCaseId: input.assuranceCaseId,
          code: input.code,
          requiredKeyCount: requiredKeys.length,
        },
        occurredAt: this.now(),
      });
      return row;
    });
  }

  async submitEvidence(
    organizationId: string,
    input: SubmitAssuranceEvidenceInput,
    actor: AuditActor,
  ): Promise<PersistedAssuranceEvidenceSubmission> {
    return this.prisma.$transaction(async (tx) => {
      await this.caseForOrg(tx, organizationId, input.assuranceCaseId);
      await this.userForOrg(tx, organizationId, actor.actorId);
      const expectation = await tx.assuranceEvidenceExpectation.findFirst({
        where: {
          id: input.expectationId,
          organizationId,
          assuranceCaseId: input.assuranceCaseId,
        },
      });
      if (!expectation) throw new AssuranceNotFoundError();
      await this.lockCase(tx, organizationId, input.assuranceCaseId);
      const latest = await tx.assuranceEvidenceSubmission.findFirst({
        where: { organizationId, expectationId: input.expectationId },
        orderBy: { version: "desc" },
      });
      const row = await tx.assuranceEvidenceSubmission.create({
        data: {
          organizationId,
          assuranceCaseId: input.assuranceCaseId,
          expectationId: input.expectationId,
          payload: input.payload as Prisma.InputJsonValue,
          status: "SUBMITTED",
          version: (latest?.version ?? 0) + 1,
          submittedBy: actor.actorId,
          submittedAt: this.now(),
        },
      });
      await this.auditWriter.write(tx, {
        organizationId,
        caseId: null,
        action: "ASSURANCE_EVIDENCE_SUBMITTED",
        actor,
        objectType: "ASSURANCE_EVIDENCE",
        objectId: row.id,
        metadata: {
          assuranceCaseId: input.assuranceCaseId,
          expectationId: input.expectationId,
          status: row.status,
          version: row.version,
        },
        occurredAt: this.now(),
      });
      return toAssuranceEvidenceSubmission(row);
    });
  }

  async reviseEvidence(
    organizationId: string,
    priorSubmissionId: string,
    payload: Readonly<Record<string, unknown>>,
    actor: AuditActor,
  ): Promise<PersistedAssuranceEvidenceSubmission> {
    return this.prisma.$transaction(async (tx) => {
      const prior = await tx.assuranceEvidenceSubmission.findFirst({
        where: { id: priorSubmissionId, organizationId },
      });
      if (!prior) throw new AssuranceNotFoundError();
      await this.userForOrg(tx, organizationId, actor.actorId);
      await this.lockCase(tx, organizationId, prior.assuranceCaseId);
      const fresh = await tx.assuranceEvidenceSubmission.findFirst({
        where: { id: priorSubmissionId, organizationId },
      });
      if (!fresh || fresh.status === "SUPERSEDED" || fresh.supersededById) {
        throw new AssuranceStateError("evidence_already_superseded");
      }
      const row = await tx.assuranceEvidenceSubmission.create({
        data: {
          organizationId,
          assuranceCaseId: fresh.assuranceCaseId,
          expectationId: fresh.expectationId,
          payload: payload as Prisma.InputJsonValue,
          status: "SUBMITTED",
          version: fresh.version + 1,
          submittedBy: actor.actorId,
          submittedAt: this.now(),
        },
      });
      await tx.assuranceEvidenceSubmission.update({
        where: { id: fresh.id },
        data: { status: "SUPERSEDED", supersededById: row.id },
      });
      await this.auditWriter.write(tx, {
        organizationId,
        caseId: null,
        action: "ASSURANCE_EVIDENCE_SUPERSEDED",
        actor,
        objectType: "ASSURANCE_EVIDENCE",
        objectId: fresh.id,
        metadata: {
          assuranceCaseId: fresh.assuranceCaseId,
          supersededById: row.id,
          priorVersion: fresh.version,
          newVersion: row.version,
        },
        occurredAt: this.now(),
      });
      return toAssuranceEvidenceSubmission(row);
    });
  }

  async createSourceConflict(
    organizationId: string,
    input: CreateAssuranceConflictInput,
    actor: AuditActor,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.caseForOrg(tx, organizationId, input.assuranceCaseId);
      const sources = await tx.assuranceSourceReference.findMany({
        where: {
          organizationId,
          assuranceCaseId: input.assuranceCaseId,
          id: { in: [input.leftSourceId, input.rightSourceId] },
        },
      });
      if (sources.length !== 2) throw new AssuranceNotFoundError();
      const row = await tx.assuranceSourceConflict.create({
        data: {
          organizationId,
          assuranceCaseId: input.assuranceCaseId,
          leftSourceId: input.leftSourceId,
          rightSourceId: input.rightSourceId,
          status: input.status ?? "OPEN",
          note: input.note ?? null,
          createdBy: actor.actorId,
        },
      });
      await this.auditWriter.write(tx, {
        organizationId,
        caseId: null,
        action: "ASSURANCE_CONFLICT_CREATED",
        actor,
        objectType: "ASSURANCE_CONFLICT",
        objectId: row.id,
        metadata: {
          assuranceCaseId: input.assuranceCaseId,
          leftSourceId: input.leftSourceId,
          rightSourceId: input.rightSourceId,
          status: row.status,
        },
        occurredAt: this.now(),
      });
      return row;
    });
  }

  async recordEvaluation(
    organizationId: string,
    input: RecordAssuranceEvaluationInput,
    actor: AuditActor,
  ): Promise<PersistedAssuranceEvaluation> {
    return this.prisma.$transaction(async (tx) => {
      await this.caseForOrg(tx, organizationId, input.assuranceCaseId);
      await this.lockCase(tx, organizationId, input.assuranceCaseId);
      if (input.applicabilityDecisionId) {
        const applicability = await tx.assuranceApplicabilityDecision.findFirst({
          where: {
            id: input.applicabilityDecisionId,
            organizationId,
            assuranceCaseId: input.assuranceCaseId,
          },
        });
        if (!applicability) throw new AssuranceNotFoundError();
      }
      if (input.evidenceSubmissionId) {
        const evidence = await tx.assuranceEvidenceSubmission.findFirst({
          where: {
            id: input.evidenceSubmissionId,
            organizationId,
            assuranceCaseId: input.assuranceCaseId,
          },
        });
        if (!evidence) throw new AssuranceNotFoundError();
      }
      const latest = await tx.assuranceEvaluation.findFirst({
        where: { organizationId, assuranceCaseId: input.assuranceCaseId },
        orderBy: { revision: "desc" },
      });
      const row = await tx.assuranceEvaluation.create({
        data: {
          organizationId,
          assuranceCaseId: input.assuranceCaseId,
          applicabilityDecisionId: input.applicabilityDecisionId ?? null,
          evidenceSubmissionId: input.evidenceSubmissionId ?? null,
          result: input.result,
          reasonCodes: [...input.reasonCodes],
          sourceStateSnapshot: input.sourceStateSnapshot as Prisma.InputJsonValue,
          evidenceStateSnapshot: input.evidenceStateSnapshot as Prisma.InputJsonValue | undefined,
          requiresHumanReview: true,
          createdByActorType: actor.actorType,
          createdByActorId: actor.actorId,
          revision: (latest?.revision ?? 0) + 1,
        },
      });
      await this.auditWriter.write(tx, {
        organizationId,
        caseId: null,
        action: "ASSURANCE_EVALUATED",
        actor,
        objectType: "ASSURANCE_EVALUATION",
        objectId: row.id,
        metadata: {
          assuranceCaseId: input.assuranceCaseId,
          result: row.result,
          revision: row.revision,
          evidenceSubmissionId: row.evidenceSubmissionId,
        },
        occurredAt: this.now(),
      });
      return toAssuranceEvaluation(row);
    });
  }

  async evaluateCurrentState(
    organizationId: string,
    assuranceCaseId: string,
    expectationId: string,
    actor: AuditActor,
    evaluator: AssuranceEvaluator,
  ): Promise<PersistedAssuranceEvaluation> {
    return this.prisma.$transaction(async (tx) => {
      await this.caseForOrg(tx, organizationId, assuranceCaseId);
      await this.userForOrg(tx, organizationId, actor.actorId);
      await this.lockCase(tx, organizationId, assuranceCaseId);

      const applicability = await tx.assuranceApplicabilityDecision.findFirst({
        where: { organizationId, assuranceCaseId },
        orderBy: { version: "desc" },
      });
      const sources = await tx.assuranceSourceReference.findMany({
        where: { organizationId, assuranceCaseId },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      });
      const conflicts = await tx.assuranceSourceConflict.findMany({
        where: { organizationId, assuranceCaseId },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      });
      const expectation = await tx.assuranceEvidenceExpectation.findFirst({
        where: { id: expectationId, organizationId, assuranceCaseId },
      });
      if (!expectation) throw new AssuranceNotFoundError();
      const evidence = await tx.assuranceEvidenceSubmission.findFirst({
        where: { organizationId, assuranceCaseId, expectationId },
        orderBy: { version: "desc" },
      });
      const evaluationEvidence =
        evidence && (evidence.status === "SUBMITTED" || evidence.status === "ACCEPTED")
          ? evidence
          : undefined;

      const evaluationInput: AssuranceEvaluationInput = {
        applicability: applicability
          ? { status: applicability.status, decisionId: applicability.id }
          : { status: "PENDING" },
        sources: sources.map((source) => ({
          sourceId: source.id,
          hasRequiredMetadata: sourceHasRequiredMetadata(source),
          currentness: source.currentness,
          rights: source.rightsStatus,
        })),
        conflicts: conflicts.map((conflict) => ({
          conflictId: conflict.id,
          status: conflict.status,
        })),
        expectation: { requiredKeys: [...expectation.requiredKeys] },
        ...(evaluationEvidence
          ? {
              submission: {
                submissionId: evaluationEvidence.id,
                payload: jsonRecord(evaluationEvidence.payload),
              },
            }
          : {}),
      };

      const output = evaluator(evaluationInput);
      const latest = await tx.assuranceEvaluation.findFirst({
        where: { organizationId, assuranceCaseId },
        orderBy: { revision: "desc" },
      });
      const row = await tx.assuranceEvaluation.create({
        data: {
          organizationId,
          assuranceCaseId,
          applicabilityDecisionId: applicability?.id ?? null,
          evidenceSubmissionId: evaluationEvidence?.id ?? null,
          result: output.result,
          reasonCodes: [...output.reasonCodes],
          sourceStateSnapshot: {
            sources: evaluationInput.sources,
            conflicts: evaluationInput.conflicts,
          } as Prisma.InputJsonValue,
          evidenceStateSnapshot: {
            expectationId: expectation.id,
            requiredKeys: expectation.requiredKeys,
            evidenceSubmissionId: evaluationEvidence?.id ?? null,
            evidenceStatus: evidence?.status ?? null,
            evidenceVersion: evidence?.version ?? null,
          } as Prisma.InputJsonValue,
          requiresHumanReview: true,
          createdByActorType: actor.actorType,
          createdByActorId: actor.actorId,
          revision: (latest?.revision ?? 0) + 1,
        },
      });

      await this.auditWriter.write(tx, {
        organizationId,
        caseId: null,
        action: "ASSURANCE_EVALUATED",
        actor,
        objectType: "ASSURANCE_EVALUATION",
        objectId: row.id,
        metadata: {
          assuranceCaseId,
          expectationId,
          result: row.result,
          revision: row.revision,
          evidenceSubmissionId: row.evidenceSubmissionId,
          sourceCount: sources.length,
          openConflictCount: conflicts.filter((conflict) => conflict.status === "OPEN").length,
        },
        occurredAt: this.now(),
      });

      return toAssuranceEvaluation(row);
    });
  }

  async recordReviewDecision(
    organizationId: string,
    input: RecordAssuranceReviewInput,
    actor: AuditActor,
  ): Promise<PersistedAssuranceReviewDecision> {
    return this.prisma.$transaction(async (tx) => {
      await this.caseForOrg(tx, organizationId, input.assuranceCaseId);
      await this.userForOrg(tx, organizationId, input.reviewerUserId);
      const evaluation = await tx.assuranceEvaluation.findFirst({
        where: {
          id: input.evaluationId,
          organizationId,
          assuranceCaseId: input.assuranceCaseId,
        },
      });
      if (!evaluation) throw new AssuranceNotFoundError();
      const row = await tx.assuranceReviewDecision.create({
        data: {
          organizationId,
          assuranceCaseId: input.assuranceCaseId,
          evaluationId: input.evaluationId,
          decision: input.decision,
          rationale: input.rationale ?? null,
          reviewerUserId: input.reviewerUserId,
          createdAt: this.now(),
        },
      });
      await this.auditWriter.write(tx, {
        organizationId,
        caseId: null,
        action: "ASSURANCE_REVIEW_RECORDED",
        actor,
        objectType: "ASSURANCE_REVIEW",
        objectId: row.id,
        metadata: {
          assuranceCaseId: input.assuranceCaseId,
          evaluationId: input.evaluationId,
          decision: input.decision,
          reviewerUserId: input.reviewerUserId,
        },
        occurredAt: this.now(),
      });
      return toAssuranceReviewDecision(row);
    });
  }

  async recordReviewDecisionWithEvidenceEffect(
    organizationId: string,
    input: RecordAssuranceReviewInput,
    actor: AuditActor,
  ): Promise<PersistedAssuranceReviewDecision> {
    return this.prisma.$transaction(async (tx) => {
      await this.caseForOrg(tx, organizationId, input.assuranceCaseId);
      await this.userForOrg(tx, organizationId, input.reviewerUserId);
      if (actor.actorType !== "USER" || actor.actorId !== input.reviewerUserId) {
        throw new AssuranceStateError("reviewer_actor_mismatch");
      }
      await this.lockCase(tx, organizationId, input.assuranceCaseId);

      const evaluation = await tx.assuranceEvaluation.findFirst({
        where: {
          id: input.evaluationId,
          organizationId,
          assuranceCaseId: input.assuranceCaseId,
        },
      });
      if (!evaluation) throw new AssuranceNotFoundError();

      const latestEvaluation = await tx.assuranceEvaluation.findFirst({
        where: { organizationId, assuranceCaseId: input.assuranceCaseId },
        orderBy: { revision: "desc" },
      });
      if (!latestEvaluation || latestEvaluation.id !== evaluation.id) {
        throw new AssuranceStateError("review_requires_current_evaluation");
      }

      const priorReview = await tx.assuranceReviewDecision.findFirst({
        where: { organizationId, evaluationId: evaluation.id },
      });
      if (priorReview) throw new AssuranceStateError("evaluation_already_reviewed");

      let evidenceBefore: string | null = null;
      let evidenceAfter: string | null = null;
      const nextEvidenceStatus =
        input.decision === "ACCEPT"
          ? "ACCEPTED"
          : input.decision === "REJECT"
            ? "REJECTED"
            : input.decision === "REQUEST_MORE_EVIDENCE"
              ? "NEEDS_CLARIFICATION"
              : null;

      if (evaluation.evidenceSubmissionId) {
        const evidence = await tx.assuranceEvidenceSubmission.findFirst({
          where: {
            id: evaluation.evidenceSubmissionId,
            organizationId,
            assuranceCaseId: input.assuranceCaseId,
          },
        });
        if (!evidence) throw new AssuranceNotFoundError();
        if (evidence.status === "SUPERSEDED" || evidence.supersededById) {
          throw new AssuranceStateError("review_requires_current_evidence");
        }
        if (nextEvidenceStatus && evidence.status !== "SUBMITTED") {
          throw new AssuranceStateError("review_requires_submitted_evidence");
        }
        evidenceBefore = evidence.status;
        if (nextEvidenceStatus) {
          const reviewedAt = this.now();
          await tx.assuranceEvidenceSubmission.update({
            where: { id: evidence.id },
            data: {
              status: nextEvidenceStatus,
              reviewedBy: input.reviewerUserId,
              reviewedAt,
            },
          });
          evidenceAfter = nextEvidenceStatus;
        } else {
          evidenceAfter = evidence.status;
        }
      } else if (nextEvidenceStatus) {
        throw new AssuranceStateError("review_decision_requires_evidence");
      }

      const reviewedAt = this.now();
      const row = await tx.assuranceReviewDecision.create({
        data: {
          organizationId,
          assuranceCaseId: input.assuranceCaseId,
          evaluationId: input.evaluationId,
          decision: input.decision,
          rationale: input.rationale ?? null,
          reviewerUserId: input.reviewerUserId,
          createdAt: reviewedAt,
        },
      });

      if (evaluation.evidenceSubmissionId && nextEvidenceStatus) {
        await this.auditWriter.write(tx, {
          organizationId,
          caseId: null,
          action: "ASSURANCE_EVIDENCE_REVIEW_STATE_CHANGED",
          actor,
          objectType: "ASSURANCE_EVIDENCE",
          objectId: evaluation.evidenceSubmissionId,
          metadata: {
            assuranceCaseId: input.assuranceCaseId,
            evaluationId: input.evaluationId,
            from: evidenceBefore,
            to: evidenceAfter,
          },
          occurredAt: reviewedAt,
        });
      }

      await this.auditWriter.write(tx, {
        organizationId,
        caseId: null,
        action: "ASSURANCE_REVIEW_RECORDED",
        actor,
        objectType: "ASSURANCE_REVIEW",
        objectId: row.id,
        metadata: {
          assuranceCaseId: input.assuranceCaseId,
          evaluationId: input.evaluationId,
          decision: input.decision,
          reviewerUserId: input.reviewerUserId,
          evidenceSubmissionId: evaluation.evidenceSubmissionId,
          evidenceStatusBefore: evidenceBefore,
          evidenceStatusAfter: evidenceAfter,
        },
        occurredAt: reviewedAt,
      });

      return toAssuranceReviewDecision(row);
    });
  }

  async getCaseViewByKey(organizationId: string, caseKey: string) {
    return this.prisma.assuranceCase.findFirst({
      where: { organizationId, caseKey },
      include: {
        participants: {
          where: { active: true },
          orderBy: [{ role: "asc" }, { grantedAt: "asc" }],
          select: {
            userId: true,
            role: true,
            authorityBasis: true,
            active: true,
            grantedAt: true,
          },
        },
        applicability: { orderBy: { version: "desc" }, take: 1 },
        sources: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
        documentReferences: { orderBy: [{ kind: "asc" }, { createdAt: "asc" }] },
        evidenceExpectations: {
          orderBy: { createdAt: "asc" },
          include: {
            submissions: { orderBy: { version: "desc" }, take: 1 },
          },
        },
        sourceConflicts: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
        evaluations: {
          orderBy: { revision: "desc" },
          take: 1,
          include: {
            reviewDecisions: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
    });
  }

  async getCaseHistory(
    organizationId: string,
    assuranceCaseId: string,
  ): Promise<AssuranceHistoryEntry[]> {
    const assuranceCase = await this.prisma.assuranceCase.findFirst({
      where: { id: assuranceCaseId, organizationId },
      select: { id: true },
    });
    if (!assuranceCase) throw new AssuranceNotFoundError();

    const [evidence, evaluations, reviews] = await Promise.all([
      this.prisma.assuranceEvidenceSubmission.findMany({
        where: { organizationId, assuranceCaseId },
        orderBy: { submittedAt: "asc" },
      }),
      this.prisma.assuranceEvaluation.findMany({
        where: { organizationId, assuranceCaseId },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.assuranceReviewDecision.findMany({
        where: { organizationId, assuranceCaseId },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return [
      ...evidence.map((item): AssuranceHistoryEntry => ({
        kind: "EVIDENCE",
        id: item.id,
        occurredAt: item.submittedAt,
        state: item.status,
        version: item.version,
        relatedId: item.expectationId,
      })),
      ...evaluations.map((item): AssuranceHistoryEntry => ({
        kind: "EVALUATION",
        id: item.id,
        occurredAt: item.createdAt,
        state: item.result,
        version: item.revision,
        ...(item.evidenceSubmissionId ? { relatedId: item.evidenceSubmissionId } : {}),
      })),
      ...reviews.map((item, index): AssuranceHistoryEntry => ({
        kind: "REVIEW",
        id: item.id,
        occurredAt: item.createdAt,
        state: item.decision,
        version: index + 1,
        relatedId: item.evaluationId,
      })),
    ].sort((left, right) => {
      const time = left.occurredAt.getTime() - right.occurredAt.getTime();
      return time !== 0 ? time : left.id.localeCompare(right.id);
    });
  }

  async listEvidenceForCase(
    organizationId: string,
    assuranceCaseId: string,
  ): Promise<PersistedAssuranceEvidenceSubmission[]> {
    const rows = await this.prisma.assuranceEvidenceSubmission.findMany({
      where: { organizationId, assuranceCaseId },
      orderBy: [{ expectationId: "asc" }, { version: "asc" }],
    });
    return rows.map(toAssuranceEvidenceSubmission);
  }

  async listEvaluationsForCase(
    organizationId: string,
    assuranceCaseId: string,
  ): Promise<PersistedAssuranceEvaluation[]> {
    const rows = await this.prisma.assuranceEvaluation.findMany({
      where: { organizationId, assuranceCaseId },
      orderBy: { revision: "asc" },
    });
    return rows.map(toAssuranceEvaluation);
  }

  async listReviewsForCase(
    organizationId: string,
    assuranceCaseId: string,
  ): Promise<PersistedAssuranceReviewDecision[]> {
    const rows = await this.prisma.assuranceReviewDecision.findMany({
      where: { organizationId, assuranceCaseId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toAssuranceReviewDecision);
  }
}
