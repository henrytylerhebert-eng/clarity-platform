import { randomUUID } from "node:crypto";
import type { Authorization as AuthorizationRow, PrismaClient } from "@prisma/client";
import {
  AUTHORIZATION_STATUSES,
  assessAuthorizationReadiness,
  canTransitionAuthorization,
  type AuditActor,
  type AuthorizationStatus,
  type CoverageAuthorizationFacts,
  type CoverageAuthorizationReadiness,
} from "@clarity/domain-contracts";
import { CaseNotFoundError } from "./prismaCaseRepository.js";
import { CoverageNotFoundError } from "./benefitsGateway.js";
import { PrismaCaseAuditWriter, type CaseAuditWriter, type TxClient } from "./auditWriter.js";

/** Non-revealing miss: absent, another tenant's, and another case's record look identical. */
export class AuthorizationNotFoundError extends Error {
  constructor(authorizationId: string) {
    super(`Authorization "${authorizationId}" not found for this case`);
    this.name = "AuthorizationNotFoundError";
  }
}

export class AuthorizationConcurrencyConflictError extends Error {
  constructor(authorizationId: string) {
    super(`Authorization "${authorizationId}" was modified by someone else; refresh and retry`);
    this.name = "AuthorizationConcurrencyConflictError";
  }
}

/** The requested action is not legal for the record's current status. */
export class AuthorizationStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationStateError";
  }
}

/**
 * The cited benefit quote does not answer whether authorization is required
 * (authorizationRequired is null) — the specialist must re-verify benefits
 * before an authorization record can be created.
 */
export class AuthorizationRequirementUnknownError extends Error {
  constructor(benefitVerificationId: string) {
    super(
      `Benefit verification "${benefitVerificationId}" does not state whether authorization is required; ` +
        "re-verify benefits before recording authorization",
    );
    this.name = "AuthorizationRequirementUnknownError";
  }
}

/** One live authorization record per (coverage, level of care) in this phase. */
export class DuplicateAuthorizationError extends Error {
  constructor(coverageId: string, levelOfCare: string) {
    super(`An authorization record already exists for coverage "${coverageId}" at ${levelOfCare}`);
    this.name = "DuplicateAuthorizationError";
  }
}

const OBJECT_TYPE = "Authorization";

export interface ClarityAuthorization {
  readonly authorizationId: string;
  readonly organizationId: string;
  readonly caseId: string;
  readonly coverageId: string;
  readonly requestedLevelOfCare: string;
  readonly status: AuthorizationStatus;
  readonly version: number;
  readonly createdAt: Date;
}

function rowToDomain(row: AuthorizationRow): ClarityAuthorization {
  const status = row.status as string;
  if (!(AUTHORIZATION_STATUSES as readonly string[]).includes(status)) {
    throw new Error(`Row field status has value "${status}" outside the domain contract`);
  }
  return {
    authorizationId: row.id,
    organizationId: row.organizationId,
    caseId: row.caseId,
    coverageId: row.insuranceCoverageId,
    requestedLevelOfCare: row.requestedLevelOfCare,
    status: status as AuthorizationStatus,
    version: row.version,
    createdAt: row.createdAt,
  };
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

interface Envelope {
  actor: AuditActor;
  commandType: string;
  correlationId?: string;
  idempotencyKey?: string;
  reason?: string;
}

/**
 * The single approved Prisma adapter for authorization-readiness commands
 * (ADR-0010). Preparation phase only: no payer submission exists here, so
 * SUBMITTED and later statuses are structurally unreachable through this
 * gateway — the submission phase will add them behind assertHumanSubmitter.
 */
export class PrismaAuthorizationGateway {
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

  private async replay(
    record: { commandType: string; objectId: string | null; idempotencyKey: string },
    organizationId: string,
    commandType: string,
  ): Promise<{ authorization: ClarityAuthorization; replayed: boolean }> {
    if (record.commandType !== commandType || !record.objectId) {
      throw new Error(`Idempotency key "${record.idempotencyKey}" was already used by a different command`);
    }
    const row = await this.prisma.authorization.findFirst({
      where: { id: record.objectId, organizationId },
    });
    if (!row) throw new AuthorizationNotFoundError(record.objectId);
    return { authorization: rowToDomain(row), replayed: true };
  }

  private async assertCase(tx: TxClient, organizationId: string, caseId: string): Promise<void> {
    const row = await tx.behavioralHealthCase.findFirst({
      where: { id: caseId, organizationId },
      select: { id: true },
    });
    if (!row) throw new CaseNotFoundError(caseId);
  }

  /**
   * Creates the authorization record for a coverage + level of care. The
   * initial status is DERIVED from the cited benefit quote, never asserted
   * by the caller: authorizationRequired true → NOT_STARTED; false →
   * NOT_REQUIRED (a positive "we checked" record); null → rejected.
   */
  async recordAuthorization(params: {
    organizationId: string;
    caseId: string;
    coverageId: string;
    benefitVerificationId: string;
    requestedLevelOfCare: string;
    envelope: Envelope;
    auditAction: string;
  }): Promise<{ authorization: ClarityAuthorization; replayed: boolean }> {
    const { organizationId, caseId, coverageId } = params;
    const { idempotencyKey, commandType } = params.envelope;
    if (idempotencyKey) {
      const existing = await this.findIdempotencyRecord(organizationId, idempotencyKey);
      if (existing) return this.replay(existing, organizationId, commandType);
    }
    try {
      const row = await this.prisma.$transaction(async (tx) => {
        await this.assertCase(tx, organizationId, caseId);
        const coverage = await tx.insuranceCoverage.findFirst({
          where: { id: coverageId, organizationId, caseId },
          select: { id: true },
        });
        if (!coverage) throw new CoverageNotFoundError(coverageId);
        // The quote must belong to THIS coverage (which is already tenant- and
        // case-scoped above).
        const quote = await tx.benefitVerification.findFirst({
          where: { id: params.benefitVerificationId, insuranceCoverageId: coverageId },
          select: { id: true, authorizationRequired: true },
        });
        if (!quote) throw new CoverageNotFoundError(params.benefitVerificationId);
        if (quote.authorizationRequired === null) {
          throw new AuthorizationRequirementUnknownError(params.benefitVerificationId);
        }
        const duplicate = await tx.authorization.findFirst({
          where: {
            insuranceCoverageId: coverageId,
            organizationId,
            caseId,
            requestedLevelOfCare: params.requestedLevelOfCare as never,
          },
          select: { id: true },
        });
        if (duplicate) throw new DuplicateAuthorizationError(coverageId, params.requestedLevelOfCare);

        const initialStatus: AuthorizationStatus = quote.authorizationRequired
          ? "NOT_STARTED"
          : "NOT_REQUIRED";
        const created = await tx.authorization.create({
          data: {
            id: randomUUID(),
            caseId,
            organizationId,
            insuranceCoverageId: coverageId,
            requestedLevelOfCare: params.requestedLevelOfCare as never,
            status: initialStatus,
            version: 0,
          },
        });
        await this.auditWriter.write(tx, {
          organizationId,
          caseId,
          action: params.auditAction,
          actor: params.envelope.actor,
          objectType: OBJECT_TYPE,
          objectId: created.id,
          reason: params.envelope.reason,
          metadata: {
            command: commandType,
            correlationId: params.envelope.correlationId,
            coverageId,
            benefitVerificationId: params.benefitVerificationId,
            requestedLevelOfCare: params.requestedLevelOfCare,
            authorizationRequired: quote.authorizationRequired,
            initialStatus,
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
      return { authorization: rowToDomain(row), replayed: false };
    } catch (e) {
      if (idempotencyKey && isIdempotencyUniqueViolation(e)) {
        const record = await this.findIdempotencyRecord(organizationId, idempotencyKey);
        if (record) return this.replay(record, organizationId, commandType);
      }
      throw e;
    }
  }

  /**
   * Preparation-scope transitions only. The allowed targets are enforced by
   * the SERVICE (phase scope) and the existing state machine is re-validated
   * here against the fresh row.
   */
  async transitionAuthorization(params: {
    organizationId: string;
    caseId: string;
    authorizationId: string;
    to: AuthorizationStatus;
    expectedVersion?: number;
    envelope: Envelope;
    auditAction: string;
  }): Promise<{ authorization: ClarityAuthorization; replayed: boolean }> {
    const { organizationId, caseId, authorizationId } = params;
    const { idempotencyKey, commandType } = params.envelope;
    if (idempotencyKey) {
      const existing = await this.findIdempotencyRecord(organizationId, idempotencyKey);
      if (existing) return this.replay(existing, organizationId, commandType);
    }
    try {
      const row = await this.prisma.$transaction(async (tx) => {
        const current = await tx.authorization.findFirst({
          where: { id: authorizationId, organizationId, caseId },
        });
        if (!current) throw new AuthorizationNotFoundError(authorizationId);
        if (params.expectedVersion !== undefined && params.expectedVersion !== current.version) {
          throw new AuthorizationConcurrencyConflictError(authorizationId);
        }
        if (!canTransitionAuthorization(current.status as AuthorizationStatus, params.to)) {
          throw new AuthorizationStateError(
            `Invalid authorization transition: ${current.status} -> ${params.to}`,
          );
        }
        const updated = await tx.authorization.updateMany({
          where: { id: authorizationId, organizationId, caseId, version: current.version },
          data: { status: params.to, version: { increment: 1 } },
        });
        if (updated.count !== 1) throw new AuthorizationConcurrencyConflictError(authorizationId);

        await this.auditWriter.write(tx, {
          organizationId,
          caseId,
          action: params.auditAction,
          actor: params.envelope.actor,
          objectType: OBJECT_TYPE,
          objectId: authorizationId,
          reason: params.envelope.reason,
          metadata: {
            command: commandType,
            correlationId: params.envelope.correlationId,
            from: current.status,
            to: params.to,
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
              objectId: authorizationId,
              resultVersion: current.version + 1,
            },
          });
        }
        const fresh = await tx.authorization.findFirst({
          where: { id: authorizationId, organizationId, caseId },
        });
        if (!fresh) throw new AuthorizationNotFoundError(authorizationId);
        return fresh;
      });
      return { authorization: rowToDomain(row), replayed: false };
    } catch (e) {
      if (idempotencyKey && isIdempotencyUniqueViolation(e)) {
        const record = await this.findIdempotencyRecord(organizationId, idempotencyKey);
        if (record) return this.replay(record, organizationId, commandType);
      }
      throw e;
    }
  }

  /**
   * Assembles the per-coverage facts and derives the readiness view via the
   * pure contract function. Tenant-scoped read; no aggregate score exists.
   */
  async assessCaseAuthorizationReadiness(
    organizationId: string,
    caseId: string,
  ): Promise<CoverageAuthorizationReadiness[]> {
    const caseRow = await this.prisma.behavioralHealthCase.findFirst({
      where: { id: caseId, organizationId },
      select: { id: true },
    });
    if (!caseRow) throw new CaseNotFoundError(caseId);
    const coverages = await this.prisma.insuranceCoverage.findMany({
      where: { organizationId, caseId },
      orderBy: [{ coverageOrder: "asc" }, { createdAt: "asc" }],
      include: {
        benefitVerifications: {
          select: {
            id: true,
            serviceType: true,
            authorizationRequired: true,
            notificationRequired: true,
          },
        },
        authorizations: {
          select: { id: true, requestedLevelOfCare: true, status: true },
        },
      },
    });
    const facts: CoverageAuthorizationFacts[] = coverages.map((c) => ({
      coverageId: c.id,
      coverageOrder: c.coverageOrder as CoverageAuthorizationFacts["coverageOrder"],
      coverageStatus: c.status as CoverageAuthorizationFacts["coverageStatus"],
      quotes: c.benefitVerifications.map((q) => ({
        benefitVerificationId: q.id,
        serviceType: q.serviceType,
        authorizationRequired: q.authorizationRequired,
        notificationRequired: q.notificationRequired,
      })),
      authorizations: c.authorizations.map((a) => ({
        authorizationId: a.id,
        requestedLevelOfCare: a.requestedLevelOfCare,
        status: a.status as AuthorizationStatus,
      })),
    }));
    return assessAuthorizationReadiness(facts);
  }
}
