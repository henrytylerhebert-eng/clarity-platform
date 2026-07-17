import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import {
  canStartEligibilityVerification,
  canTransitionEligibility,
  coverageStatusFromEligibility,
  type AcknowledgementStatus,
  type AuditActor,
  type ClarityBenefitVerification,
  type ClarityCoverage,
  type ClarityEligibilityVerification,
  type CoverageOrder,
  type CoverageType,
  type EducationMethod,
  type EducationRecipientType,
  type EligibilityStatus,
  type NetworkStatus,
  type ServiceType,
  type SubscriberRelationship,
  type VerificationMethod,
} from "@clarity/domain-contracts";
import { coverageRowToDomain, eligibilityRowToDomain, benefitRowToDomain } from "./benefitsMappers.js";
import { CaseNotFoundError } from "./prismaCaseRepository.js";
import { DocumentNotFoundError } from "./documentGateway.js";
import { PrismaCaseAuditWriter, type CaseAuditWriter, type TxClient } from "./auditWriter.js";

/** Non-revealing miss: absent, another tenant's, and another case's coverage look identical. */
export class CoverageNotFoundError extends Error {
  constructor(coverageId: string) {
    super(`Coverage "${coverageId}" not found for this case`);
    this.name = "CoverageNotFoundError";
  }
}

export class CoverageConcurrencyConflictError extends Error {
  constructor(coverageId: string) {
    super(`Coverage "${coverageId}" was modified by someone else; refresh and retry`);
    this.name = "CoverageConcurrencyConflictError";
  }
}

/** The requested action is not legal for the coverage's current state. */
export class CoverageStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CoverageStateError";
  }
}

/** Coverage must cite at least one APPROVED INSURANCE evidence item from the same case. */
export class InsuranceEvidenceRequiredError extends Error {
  constructor(evidenceId: string) {
    super(
      `Evidence "${evidenceId}" is not approved INSURANCE evidence for this case; ` +
        "coverage must cite approved insurance evidence",
    );
    this.name = "InsuranceEvidenceRequiredError";
  }
}

const COVERAGE_OBJECT_TYPE = "InsuranceCoverage";
const ELIGIBILITY_OBJECT_TYPE = "EligibilityVerification";
const BENEFIT_OBJECT_TYPE = "BenefitVerification";
const EDUCATION_OBJECT_TYPE = "FinancialEducationRecord";

interface Envelope {
  actor: AuditActor;
  commandType: string;
  correlationId?: string;
  idempotencyKey?: string;
  reason?: string;
}

function isIdempotencyUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    (e as { code?: string }).code === "P2002" &&
    String((e as { meta?: { modelName?: string } }).meta?.modelName ?? "").includes(
      "CommandIdempotencyRecord",
    )
  );
}

/**
 * The single approved Prisma adapter for manual insurance/benefits commands
 * (ADR-0009). Same discipline as the case/document/evidence gateways:
 * tenancy in every predicate (case + coverage + documents + evidence checked
 * together inside the transaction), optimistic concurrency on the coverage
 * status rollup, one atomic audit event per mutation, idempotency records
 * with objectId replay.
 *
 * Deliberately absent: member IDs, group numbers, and policy numbers. The
 * schema's *Encrypted columns stay NULL until an encryption capability
 * exists — identifiers live only in the source insurance-card documents.
 * Audit metadata carries record ids, enums, and counts; the restricted-
 * identifier guard runs on every write regardless.
 */
export class PrismaBenefitsGateway {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly auditWriter: CaseAuditWriter = new PrismaCaseAuditWriter(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async findIdempotencyRecord(organizationId: string, idempotencyKey: string) {
    return this.prisma.commandIdempotencyRecord.findUnique({
      where: { organizationId_idempotencyKey: { organizationId, idempotencyKey } },
    });
  }

  /** Case-scoped read; throws non-revealing CaseNotFoundError on miss. Returns patientTokenId. */
  private async assertCase(tx: TxClient, organizationId: string, caseId: string): Promise<string> {
    const row = await tx.behavioralHealthCase.findFirst({
      where: { id: caseId, organizationId },
      select: { id: true, patientTokenId: true },
    });
    if (!row) throw new CaseNotFoundError(caseId);
    return row.patientTokenId;
  }

  /** Every cited document must belong to this case and tenant. */
  private async assertCaseDocuments(
    tx: TxClient,
    organizationId: string,
    caseId: string,
    documentIds: readonly string[],
  ): Promise<void> {
    if (documentIds.length === 0) return;
    const found = await tx.sourceDocument.findMany({
      where: { id: { in: [...documentIds] }, caseId, organizationId },
      select: { id: true },
    });
    const present = new Set(found.map((d) => d.id));
    const missing = documentIds.find((id) => !present.has(id));
    if (missing) throw new DocumentNotFoundError(missing);
  }

  private async scopedCoverage(
    tx: TxClient,
    organizationId: string,
    caseId: string,
    coverageId: string,
  ) {
    const row = await tx.insuranceCoverage.findFirst({
      where: { id: coverageId, organizationId, caseId },
    });
    if (!row) throw new CoverageNotFoundError(coverageId);
    return row;
  }

  async recordCoverage(params: {
    organizationId: string;
    caseId: string;
    coverageOrder: CoverageOrder;
    coverageType: CoverageType;
    subscriberRelationship: SubscriberRelationship;
    payerNameRaw?: string | null;
    planNameRaw?: string | null;
    /** ≥1 APPROVED INSURANCE evidence item from the same case (validated in-transaction). */
    insuranceEvidenceIds: readonly string[];
    sourceDocumentIds: readonly string[];
    envelope: Envelope;
    auditAction: string;
  }): Promise<{ coverage: ClarityCoverage; replayed: boolean }> {
    const { organizationId, caseId } = params;
    const { idempotencyKey, commandType } = params.envelope;
    if (idempotencyKey) {
      const existing = await this.findIdempotencyRecord(organizationId, idempotencyKey);
      if (existing) return this.replayCoverage(existing, organizationId, commandType);
    }
    try {
      const row = await this.prisma.$transaction(async (tx) => {
        const patientTokenId = await this.assertCase(tx, organizationId, caseId);
        // The human-verified fact basis: every cited evidence item must be
        // this case's, APPROVED, and category INSURANCE.
        const approved = await tx.evidenceItem.findMany({
          where: {
            id: { in: [...params.insuranceEvidenceIds] },
            organizationId,
            caseId,
            category: "INSURANCE",
            status: "APPROVED",
          },
          select: { id: true },
        });
        const present = new Set(approved.map((e) => e.id));
        const unusable = params.insuranceEvidenceIds.find((id) => !present.has(id));
        if (unusable) throw new InsuranceEvidenceRequiredError(unusable);
        await this.assertCaseDocuments(tx, organizationId, caseId, params.sourceDocumentIds);

        const created = await tx.insuranceCoverage.create({
          data: {
            id: randomUUID(),
            caseId,
            organizationId,
            patientTokenId,
            coverageOrder: params.coverageOrder,
            coverageType: params.coverageType,
            subscriberRelationship: params.subscriberRelationship,
            payerNameRaw: params.payerNameRaw ?? null,
            planNameRaw: params.planNameRaw ?? null,
            // member/group/policy identifiers deliberately not accepted (ADR-0009)
            status: "UNVERIFIED",
            sourceDocumentIds: [...params.sourceDocumentIds],
            version: 0,
          },
        });
        await this.auditWriter.write(tx, {
          organizationId,
          caseId,
          action: params.auditAction,
          actor: params.envelope.actor,
          objectType: COVERAGE_OBJECT_TYPE,
          objectId: created.id,
          reason: params.envelope.reason,
          metadata: {
            command: commandType,
            correlationId: params.envelope.correlationId,
            coverageOrder: created.coverageOrder,
            coverageType: created.coverageType,
            subscriberRelationship: created.subscriberRelationship,
            insuranceEvidenceIds: [...params.insuranceEvidenceIds],
            sourceDocumentCount: params.sourceDocumentIds.length,
          },
          occurredAt: this.now(),
        });
        if (idempotencyKey) {
          await tx.commandIdempotencyRecord.create({
            data: {
              organizationId,
              idempotencyKey,
              commandType,
              caseId,
              objectId: created.id,
              resultVersion: created.version,
            },
          });
        }
        return created;
      });
      return { coverage: coverageRowToDomain(row), replayed: false };
    } catch (e) {
      if (idempotencyKey && isIdempotencyUniqueViolation(e)) {
        const record = await this.findIdempotencyRecord(organizationId, idempotencyKey);
        if (record) return this.replayCoverage(record, organizationId, commandType);
      }
      throw e;
    }
  }

  private async replayCoverage(
    record: { commandType: string; objectId: string | null; idempotencyKey: string },
    organizationId: string,
    commandType: string,
  ): Promise<{ coverage: ClarityCoverage; replayed: boolean }> {
    if (record.commandType !== commandType || !record.objectId) {
      throw new Error(`Idempotency key "${record.idempotencyKey}" was already used by a different command`);
    }
    const row = await this.prisma.insuranceCoverage.findFirst({
      where: { id: record.objectId, organizationId },
    });
    if (!row) throw new CoverageNotFoundError(record.objectId);
    return { coverage: coverageRowToDomain(row), replayed: true };
  }

  async recordEligibilityVerification(params: {
    organizationId: string;
    caseId: string;
    coverageId: string;
    expectedCoverageVersion?: number;
    method: VerificationMethod;
    outcome: EligibilityStatus;
    effectiveDate?: Date | null;
    terminationDate?: Date | null;
    payerRepresentative?: string | null;
    referenceNumber?: string | null;
    notes?: string | null;
    proofDocumentIds: readonly string[];
    envelope: Envelope;
    auditAction: string;
  }): Promise<{
    verification: ClarityEligibilityVerification;
    coverage: ClarityCoverage;
    replayed: boolean;
  }> {
    const { organizationId, caseId, coverageId } = params;
    const { idempotencyKey, commandType } = params.envelope;
    if (idempotencyKey) {
      const existing = await this.findIdempotencyRecord(organizationId, idempotencyKey);
      if (existing) return this.replayEligibility(existing, organizationId, caseId, commandType);
    }
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        await this.assertCase(tx, organizationId, caseId);
        const coverage = await this.scopedCoverage(tx, organizationId, caseId, coverageId);
        if (
          params.expectedCoverageVersion !== undefined &&
          params.expectedCoverageVersion !== coverage.version
        ) {
          throw new CoverageConcurrencyConflictError(coverageId);
        }
        // Binding rule (domain contract): UNKNOWN subscriber relationship
        // blocks eligibility verification from starting.
        if (!canStartEligibilityVerification(coverage.subscriberRelationship as SubscriberRelationship)) {
          throw new CoverageStateError(
            `Coverage "${coverageId}" has an UNKNOWN subscriber relationship; eligibility verification cannot start`,
          );
        }
        // Successive attempts follow the existing eligibility state machine:
        // e.g. a FAILED verification cannot jump straight to ACTIVE_CONFIRMED
        // — it re-enters through PENDING. The first attempt sets the initial
        // state and is not a transition.
        const lastAttempt = await tx.eligibilityVerification.findFirst({
          where: { insuranceCoverageId: coverageId },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          select: { status: true },
        });
        if (lastAttempt && !canTransitionEligibility(lastAttempt.status as EligibilityStatus, params.outcome)) {
          throw new CoverageStateError(
            `Invalid eligibility transition: ${lastAttempt.status} -> ${params.outcome}`,
          );
        }
        await this.assertCaseDocuments(tx, organizationId, caseId, params.proofDocumentIds);

        const verification = await tx.eligibilityVerification.create({
          data: {
            id: randomUUID(),
            insuranceCoverageId: coverageId,
            method: params.method,
            status: params.outcome,
            effectiveDate: params.effectiveDate ?? null,
            terminationDate: params.terminationDate ?? null,
            verifiedAt: this.now(),
            verifiedBy: params.envelope.actor.actorId,
            payerRepresentative: params.payerRepresentative ?? null,
            referenceNumber: params.referenceNumber ?? null,
            notes: params.notes ?? null,
            proofs: {
              create: params.proofDocumentIds.map((documentId) => ({ documentId })),
            },
          },
          include: { proofs: { select: { documentId: true } } },
        });

        // Rollup: the attempt's outcome updates the coverage status (PENDING
        // leaves it untouched), guarded by the coverage version predicate.
        const rollup = coverageStatusFromEligibility(params.outcome);
        const updated = await tx.insuranceCoverage.updateMany({
          where: { id: coverageId, organizationId, caseId, version: coverage.version },
          data: {
            ...(rollup ? { status: rollup } : {}),
            reviewedBy: params.envelope.actor.actorId,
            reviewedAt: this.now(),
            version: { increment: 1 },
          },
        });
        if (updated.count !== 1) throw new CoverageConcurrencyConflictError(coverageId);

        await this.auditWriter.write(tx, {
          organizationId,
          caseId,
          action: params.auditAction,
          actor: params.envelope.actor,
          objectType: ELIGIBILITY_OBJECT_TYPE,
          objectId: verification.id,
          reason: params.envelope.reason,
          metadata: {
            command: commandType,
            correlationId: params.envelope.correlationId,
            coverageId,
            method: params.method,
            outcome: params.outcome,
            coverageStatusRollup: rollup ?? "UNCHANGED",
            proofDocumentCount: params.proofDocumentIds.length,
            referenceNumber: params.referenceNumber ?? null,
          },
          occurredAt: this.now(),
        });
        if (idempotencyKey) {
          await tx.commandIdempotencyRecord.create({
            data: {
              organizationId,
              idempotencyKey,
              commandType,
              caseId,
              objectId: verification.id,
              resultVersion: coverage.version + 1,
            },
          });
        }
        const freshCoverage = await tx.insuranceCoverage.findFirst({
          where: { id: coverageId, organizationId, caseId },
        });
        if (!freshCoverage) throw new CoverageNotFoundError(coverageId);
        return { verification, freshCoverage };
      });
      return {
        verification: eligibilityRowToDomain(result.verification),
        coverage: coverageRowToDomain(result.freshCoverage),
        replayed: false,
      };
    } catch (e) {
      if (idempotencyKey && isIdempotencyUniqueViolation(e)) {
        const record = await this.findIdempotencyRecord(organizationId, idempotencyKey);
        if (record) return this.replayEligibility(record, organizationId, caseId, commandType);
      }
      throw e;
    }
  }

  private async replayEligibility(
    record: { commandType: string; objectId: string | null; idempotencyKey: string },
    organizationId: string,
    caseId: string,
    commandType: string,
  ) {
    if (record.commandType !== commandType || !record.objectId) {
      throw new Error(`Idempotency key "${record.idempotencyKey}" was already used by a different command`);
    }
    const verification = await this.prisma.eligibilityVerification.findFirst({
      where: {
        id: record.objectId,
        insuranceCoverage: { organizationId, caseId },
      },
      include: { proofs: { select: { documentId: true } }, insuranceCoverage: true },
    });
    if (!verification) throw new CoverageNotFoundError(record.objectId);
    return {
      verification: eligibilityRowToDomain(verification),
      coverage: coverageRowToDomain(verification.insuranceCoverage),
      replayed: true,
    };
  }

  async recordBenefitVerification(params: {
    organizationId: string;
    caseId: string;
    coverageId: string;
    expectedCoverageVersion?: number;
    serviceType: ServiceType;
    networkStatus: NetworkStatus;
    deductibleAmountCents?: number | null;
    deductibleMetCents?: number | null;
    coinsurancePercent?: number | null;
    copayAmountCents?: number | null;
    outOfPocketMaxCents?: number | null;
    outOfPocketMetCents?: number | null;
    authorizationRequired?: boolean | null;
    notificationRequired?: boolean | null;
    coverageLimit?: string | null;
    exclusions: readonly string[];
    verificationReference: string;
    sourceDocumentIds: readonly string[];
    envelope: Envelope;
    auditAction: string;
  }): Promise<{ benefit: ClarityBenefitVerification; replayed: boolean }> {
    const { organizationId, caseId, coverageId } = params;
    const { idempotencyKey, commandType } = params.envelope;
    if (idempotencyKey) {
      const existing = await this.findIdempotencyRecord(organizationId, idempotencyKey);
      if (existing) return this.replayBenefit(existing, organizationId, caseId, commandType);
    }
    try {
      const row = await this.prisma.$transaction(async (tx) => {
        await this.assertCase(tx, organizationId, caseId);
        const coverage = await this.scopedCoverage(tx, organizationId, caseId, coverageId);
        if (
          params.expectedCoverageVersion !== undefined &&
          params.expectedCoverageVersion !== coverage.version
        ) {
          throw new CoverageConcurrencyConflictError(coverageId);
        }
        // A benefit quote is only meaningful against eligibility-confirmed
        // coverage (ADR-0009).
        if (coverage.status !== "ACTIVE") {
          throw new CoverageStateError(
            `Coverage "${coverageId}" is ${coverage.status}; benefits can only be quoted against ACTIVE coverage`,
          );
        }
        await this.assertCaseDocuments(tx, organizationId, caseId, params.sourceDocumentIds);

        const created = await tx.benefitVerification.create({
          data: {
            id: randomUUID(),
            insuranceCoverageId: coverageId,
            serviceType: params.serviceType,
            networkStatus: params.networkStatus,
            deductibleAmountCents: params.deductibleAmountCents ?? null,
            deductibleMetCents: params.deductibleMetCents ?? null,
            coinsurancePercent: params.coinsurancePercent ?? null,
            copayAmountCents: params.copayAmountCents ?? null,
            outOfPocketMaxCents: params.outOfPocketMaxCents ?? null,
            outOfPocketMetCents: params.outOfPocketMetCents ?? null,
            authorizationRequired: params.authorizationRequired ?? null,
            notificationRequired: params.notificationRequired ?? null,
            coverageLimit: params.coverageLimit ?? null,
            exclusions: [...params.exclusions],
            quotedAt: this.now(),
            verificationReference: params.verificationReference,
            // The command envelope structurally requires the disclaimer
            // before this row can exist.
            disclaimerStatus: "PROVIDED",
            sources: {
              create: params.sourceDocumentIds.map((documentId) => ({ documentId })),
            },
          },
          include: { sources: { select: { documentId: true } } },
        });
        await this.auditWriter.write(tx, {
          organizationId,
          caseId,
          action: params.auditAction,
          actor: params.envelope.actor,
          objectType: BENEFIT_OBJECT_TYPE,
          objectId: created.id,
          reason: params.envelope.reason,
          metadata: {
            command: commandType,
            correlationId: params.envelope.correlationId,
            coverageId,
            serviceType: params.serviceType,
            networkStatus: params.networkStatus,
            authorizationRequired: params.authorizationRequired ?? null,
            disclaimerStatus: "PROVIDED",
            verificationReference: params.verificationReference,
            sourceDocumentCount: params.sourceDocumentIds.length,
          },
          occurredAt: this.now(),
        });
        if (idempotencyKey) {
          await tx.commandIdempotencyRecord.create({
            data: {
              organizationId,
              idempotencyKey,
              commandType,
              caseId,
              objectId: created.id,
              resultVersion: 0,
            },
          });
        }
        return created;
      });
      return { benefit: benefitRowToDomain(row), replayed: false };
    } catch (e) {
      if (idempotencyKey && isIdempotencyUniqueViolation(e)) {
        const record = await this.findIdempotencyRecord(organizationId, idempotencyKey);
        if (record) return this.replayBenefit(record, organizationId, caseId, commandType);
      }
      throw e;
    }
  }

  private async replayBenefit(
    record: { commandType: string; objectId: string | null; idempotencyKey: string },
    organizationId: string,
    caseId: string,
    commandType: string,
  ) {
    if (record.commandType !== commandType || !record.objectId) {
      throw new Error(`Idempotency key "${record.idempotencyKey}" was already used by a different command`);
    }
    const row = await this.prisma.benefitVerification.findFirst({
      where: { id: record.objectId, insuranceCoverage: { organizationId, caseId } },
      include: { sources: { select: { documentId: true } } },
    });
    if (!row) throw new CoverageNotFoundError(record.objectId);
    return { benefit: benefitRowToDomain(row), replayed: true };
  }

  async recordFinancialEducation(params: {
    organizationId: string;
    caseId: string;
    benefitVerificationId?: string | null;
    recipientType: EducationRecipientType;
    recipientName?: string | null;
    method: EducationMethod;
    language?: string | null;
    interpreterUsed: boolean;
    topicsReviewed: readonly string[];
    uncertaintiesDisclosed: readonly string[];
    acknowledgementStatus: AcknowledgementStatus;
    envelope: Envelope;
    auditAction: string;
  }): Promise<{ educationRecordId: string }> {
    const { organizationId, caseId } = params;
    const record = await this.prisma.$transaction(async (tx) => {
      await this.assertCase(tx, organizationId, caseId);
      if (params.benefitVerificationId) {
        const benefit = await tx.benefitVerification.findFirst({
          where: { id: params.benefitVerificationId, insuranceCoverage: { organizationId, caseId } },
          select: { id: true },
        });
        if (!benefit) throw new CoverageNotFoundError(params.benefitVerificationId);
      }
      const created = await tx.financialEducationRecord.create({
        data: {
          id: randomUUID(),
          caseId,
          benefitVerificationId: params.benefitVerificationId ?? null,
          recipientType: params.recipientType,
          recipientName: params.recipientName ?? null,
          method: params.method,
          language: params.language ?? null,
          interpreterUsed: params.interpreterUsed,
          topicsReviewed: [...params.topicsReviewed],
          uncertaintiesDisclosed: [...params.uncertaintiesDisclosed],
          acknowledgementStatus: params.acknowledgementStatus,
          educatedBy: params.envelope.actor.actorId,
          educatedAt: this.now(),
        },
      });
      await this.auditWriter.write(tx, {
        organizationId,
        caseId,
        action: params.auditAction,
        actor: params.envelope.actor,
        objectType: EDUCATION_OBJECT_TYPE,
        objectId: created.id,
        reason: params.envelope.reason,
        metadata: {
          command: params.envelope.commandType,
          correlationId: params.envelope.correlationId,
          recipientType: params.recipientType,
          educationMethod: params.method,
          acknowledgementStatus: params.acknowledgementStatus,
          topicsReviewedCount: params.topicsReviewed.length,
          uncertaintiesDisclosedCount: params.uncertaintiesDisclosed.length,
          benefitVerificationId: params.benefitVerificationId ?? null,
        },
        occurredAt: this.now(),
      });
      return created;
    });
    return { educationRecordId: record.id };
  }

  async findCoverage(
    organizationId: string,
    caseId: string,
    coverageId: string,
  ): Promise<ClarityCoverage | undefined> {
    const row = await this.prisma.insuranceCoverage.findFirst({
      where: { id: coverageId, organizationId, caseId },
    });
    return row ? coverageRowToDomain(row) : undefined;
  }

  async listCoveragesForCase(organizationId: string, caseId: string): Promise<ClarityCoverage[]> {
    const rows = await this.prisma.insuranceCoverage.findMany({
      where: { organizationId, caseId },
      orderBy: [{ coverageOrder: "asc" }, { createdAt: "asc" }],
    });
    return rows.map(coverageRowToDomain);
  }
}
