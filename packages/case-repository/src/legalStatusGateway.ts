import type { PrismaClient } from "@prisma/client";
import type { AuditActor, LegalStatusRecordSummary, LegalStatusType } from "@clarity/domain-contracts";
import { legalStatusRowToDomain } from "./legalStatusMappers.js";
import { CaseNotFoundError } from "./prismaCaseRepository.js";
import { PrismaCaseAuditWriter, type CaseAuditWriter, type TxClient } from "./auditWriter.js";

export interface CreateLegalStatusRecordParams {
  /**
   * Explicit id, when the caller already generated a form-instance identifier
   * and printed it on the rendered PDF (see @clarity/legal-hold-forms
   * renderLouisianaForm) — using the SAME id here keeps the printed control
   * number and the database record identical (one-of-one traceability).
   * Omit to fall back to the column's own cuid() default.
   */
  id?: string;
  organizationId: string;
  caseId: string;
  jurisdiction: string;
  statusType: LegalStatusType;
  authorizingAuthority?: string | null;
  /** See LegalStatusRecordSummary — populated only for license-bearing forms (OBH-1/1A/2). */
  authorizingLicenseBoard?: string | null;
  authorizingLicenseNumber?: string | null;
  initiatedAt?: Date | null;
  expiresAt?: Date | null;
  /** ClarityDocument id of the rendered OBH-1/1A/2/19/20 PDF this record evidences. */
  formDocumentId?: string | null;
  signatureStatus?: string | null;
  actor: AuditActor;
  commandType: string;
  correlationId?: string;
  reason?: string;
  auditAction: string;
}

const OBJECT_TYPE = "LegalStatusRecord";

/**
 * The single approved Prisma adapter for legal-status-record commands (mirrors
 * PrismaDocumentGateway). Every command verifies case ownership before writing,
 * and the mutation commits atomically with its audit event. Per
 * docs/legal/LEGAL_STATUS_ARCHITECTURE.md's binding non-enforcement rule, this
 * gateway only records data — it never decides whether a hold is valid.
 */
export class PrismaLegalStatusGateway {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly auditWriter: CaseAuditWriter = new PrismaCaseAuditWriter(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async assertCaseOwnership(tx: TxClient, organizationId: string, caseId: string): Promise<void> {
    const owned = await tx.behavioralHealthCase.findFirst({
      where: { id: caseId, organizationId },
      select: { id: true },
    });
    if (!owned) throw new CaseNotFoundError(caseId);
  }

  async createLegalStatusRecord(params: CreateLegalStatusRecordParams): Promise<LegalStatusRecordSummary> {
    const { organizationId, caseId } = params;
    const row = await this.prisma.$transaction(async (tx) => {
      await this.assertCaseOwnership(tx, organizationId, caseId);

      const created = await tx.legalStatusRecord.create({
        data: {
          ...(params.id ? { id: params.id } : {}),
          caseId,
          jurisdiction: params.jurisdiction,
          statusType: params.statusType,
          authorizingAuthority: params.authorizingAuthority ?? null,
          authorizingLicenseBoard: params.authorizingLicenseBoard ?? null,
          authorizingLicenseNumber: params.authorizingLicenseNumber ?? null,
          initiatedAt: params.initiatedAt ?? null,
          expiresAt: params.expiresAt ?? null,
          formDocumentId: params.formDocumentId ?? null,
          signatureStatus: params.signatureStatus ?? null,
        },
      });

      await this.auditWriter.write(tx, {
        organizationId,
        caseId,
        action: params.auditAction,
        actor: params.actor,
        objectType: OBJECT_TYPE,
        objectId: created.id,
        reason: params.reason,
        metadata: {
          command: params.commandType,
          correlationId: params.correlationId,
          jurisdiction: params.jurisdiction,
          statusType: params.statusType,
          formDocumentId: params.formDocumentId ?? null,
        },
        occurredAt: this.now(),
      });
      return created;
    });
    return legalStatusRowToDomain(row, organizationId);
  }

  async listLegalStatusRecordsForCase(organizationId: string, caseId: string): Promise<LegalStatusRecordSummary[]> {
    await this.assertOwnershipOutsideTransaction(organizationId, caseId);
    const rows = await this.prisma.legalStatusRecord.findMany({
      where: { caseId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    return rows.map((row) => legalStatusRowToDomain(row, organizationId));
  }

  /**
   * All records a given professional (license board + number) has signed
   * within THIS organization — the substrate for "how often does Dr. X issue
   * these" within one facility's data. This does NOT span organizations: a
   * physician who also practices at a different facility/parish will have a
   * separate history there, invisible here, because there is no cross-
   * organization professional directory in this schema (tenant isolation is a
   * deliberate, tested boundary — see tests/security/organization-isolation).
   */
  async listLegalStatusRecordsBySigner(
    organizationId: string,
    licenseBoard: string,
    licenseNumber: string,
  ): Promise<LegalStatusRecordSummary[]> {
    const rows = await this.prisma.legalStatusRecord.findMany({
      where: {
        authorizingLicenseBoard: licenseBoard,
        authorizingLicenseNumber: licenseNumber,
        case: { organizationId },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    return rows.map((row) => legalStatusRowToDomain(row, organizationId));
  }

  /**
   * All records tied to a given patient across every case they have within
   * THIS organization — since PatientToken.cases is one-to-many, a returning
   * patient's prior legal-hold history is already linkable this way without
   * any new schema. This is the "part of a patient's medical history" query;
   * it does not span organizations for the same reason listLegalStatusRecordsBySigner
   * doesn't — no cross-organization patient identity exists in this schema.
   */
  async listLegalStatusRecordsForPatient(
    organizationId: string,
    patientTokenId: string,
  ): Promise<LegalStatusRecordSummary[]> {
    const rows = await this.prisma.legalStatusRecord.findMany({
      where: { case: { organizationId, patientTokenId } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    return rows.map((row) => legalStatusRowToDomain(row, organizationId));
  }

  private async assertOwnershipOutsideTransaction(organizationId: string, caseId: string): Promise<void> {
    const owned = await this.prisma.behavioralHealthCase.findFirst({
      where: { id: caseId, organizationId },
      select: { id: true },
    });
    if (!owned) throw new CaseNotFoundError(caseId);
  }
}
