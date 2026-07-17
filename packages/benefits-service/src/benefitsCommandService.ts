import type {
  ClarityBenefitVerification,
  ClarityCoverage,
  ClarityEligibilityVerification,
} from "@clarity/domain-contracts";
import type { PrismaBenefitsGateway } from "@clarity/case-repository";
import {
  RecordBenefitVerificationCommandSchema,
  RecordFinancialEducationCommandSchema,
  RecordInsuranceCoverageCommandSchema,
  VerifyEligibilityCommandSchema,
  type RecordBenefitVerificationCommand,
  type RecordFinancialEducationCommand,
  type RecordInsuranceCoverageCommand,
  type VerifyEligibilityCommand,
} from "./commands.js";
import { assertBenefitsPermitted } from "./permissions.js";

/** Audit action vocabulary for benefits commands (REQ-008 lineage). */
export const BENEFITS_AUDIT_ACTIONS = {
  RecordInsuranceCoverage: "INSURANCE_COVERAGE_RECORDED",
  VerifyEligibility: "ELIGIBILITY_VERIFICATION_RECORDED",
  RecordBenefitVerification: "BENEFIT_VERIFICATION_RECORDED",
  RecordFinancialEducation: "FINANCIAL_EDUCATION_RECORDED",
} as const;

/**
 * The single controlled path for manual insurance/benefits actions.
 * Entirely human-performed: a specialist calls the payer or reads the
 * portal and records what they learned. No X12 270/271, no payer APIs,
 * no automation — those arrive behind these same commands later.
 *
 * Enforcement order: strict Zod envelope → role policy → gateway
 * transaction (case + coverage + documents + evidence ownership together,
 * binding domain rules, conditional versioned rollup, atomic audit,
 * idempotency record).
 *
 * Binding rules honored from the existing domain contracts:
 * - Coverage cites ≥1 APPROVED INSURANCE evidence item (the human-review
 *   gate: unreviewed extraction can never feed verification).
 * - UNKNOWN subscriber relationship blocks eligibility verification.
 * - Eligibility outcomes roll up onto coverage status; PENDING doesn't.
 * - A benefit quote is impossible to record without the not-a-payment-
 *   guarantee disclaimer, and only against ACTIVE coverage.
 * - Member/group/policy identifiers are structurally unacceptable input.
 */
export class BenefitsCommandService {
  constructor(private readonly gateway: PrismaBenefitsGateway) {}

  async recordInsuranceCoverage(
    input: RecordInsuranceCoverageCommand,
  ): Promise<{ coverage: ClarityCoverage; replayed: boolean }> {
    const cmd = RecordInsuranceCoverageCommandSchema.parse(input);
    assertBenefitsPermitted("RecordInsuranceCoverage", cmd.actor.roles);
    return this.gateway.recordCoverage({
      organizationId: cmd.organizationId,
      caseId: cmd.caseId,
      coverageOrder: cmd.coverageOrder,
      coverageType: cmd.coverageType,
      subscriberRelationship: cmd.subscriberRelationship,
      payerNameRaw: cmd.payerNameRaw ?? null,
      planNameRaw: cmd.planNameRaw ?? null,
      insuranceEvidenceIds: cmd.insuranceEvidenceIds,
      sourceDocumentIds: cmd.sourceDocumentIds,
      envelope: this.envelope(cmd, "RecordInsuranceCoverage"),
      auditAction: BENEFITS_AUDIT_ACTIONS.RecordInsuranceCoverage,
    });
  }

  async verifyEligibility(input: VerifyEligibilityCommand): Promise<{
    verification: ClarityEligibilityVerification;
    coverage: ClarityCoverage;
    replayed: boolean;
  }> {
    const cmd = VerifyEligibilityCommandSchema.parse(input);
    assertBenefitsPermitted("VerifyEligibility", cmd.actor.roles);
    return this.gateway.recordEligibilityVerification({
      organizationId: cmd.organizationId,
      caseId: cmd.caseId,
      coverageId: cmd.coverageId,
      expectedCoverageVersion: cmd.expectedCoverageVersion,
      method: cmd.method,
      outcome: cmd.outcome,
      effectiveDate: cmd.effectiveDate ?? null,
      terminationDate: cmd.terminationDate ?? null,
      payerRepresentative: cmd.payerRepresentative ?? null,
      referenceNumber: cmd.referenceNumber ?? null,
      notes: cmd.notes ?? null,
      proofDocumentIds: cmd.proofDocumentIds,
      envelope: this.envelope(cmd, "VerifyEligibility"),
      auditAction: BENEFITS_AUDIT_ACTIONS.VerifyEligibility,
    });
  }

  async recordBenefitVerification(
    input: RecordBenefitVerificationCommand,
  ): Promise<{ benefit: ClarityBenefitVerification; replayed: boolean }> {
    const cmd = RecordBenefitVerificationCommandSchema.parse(input); // disclaimerProvided: true enforced here
    assertBenefitsPermitted("RecordBenefitVerification", cmd.actor.roles);
    return this.gateway.recordBenefitVerification({
      organizationId: cmd.organizationId,
      caseId: cmd.caseId,
      coverageId: cmd.coverageId,
      expectedCoverageVersion: cmd.expectedCoverageVersion,
      serviceType: cmd.serviceType,
      networkStatus: cmd.networkStatus,
      deductibleAmountCents: cmd.deductibleAmountCents ?? null,
      deductibleMetCents: cmd.deductibleMetCents ?? null,
      coinsurancePercent: cmd.coinsurancePercent ?? null,
      copayAmountCents: cmd.copayAmountCents ?? null,
      outOfPocketMaxCents: cmd.outOfPocketMaxCents ?? null,
      outOfPocketMetCents: cmd.outOfPocketMetCents ?? null,
      authorizationRequired: cmd.authorizationRequired ?? null,
      notificationRequired: cmd.notificationRequired ?? null,
      coverageLimit: cmd.coverageLimit ?? null,
      exclusions: cmd.exclusions,
      verificationReference: cmd.verificationReference,
      sourceDocumentIds: cmd.sourceDocumentIds,
      envelope: this.envelope(cmd, "RecordBenefitVerification"),
      auditAction: BENEFITS_AUDIT_ACTIONS.RecordBenefitVerification,
    });
  }

  async recordFinancialEducation(
    input: RecordFinancialEducationCommand,
  ): Promise<{ educationRecordId: string }> {
    const cmd = RecordFinancialEducationCommandSchema.parse(input);
    assertBenefitsPermitted("RecordFinancialEducation", cmd.actor.roles);
    return this.gateway.recordFinancialEducation({
      organizationId: cmd.organizationId,
      caseId: cmd.caseId,
      benefitVerificationId: cmd.benefitVerificationId ?? null,
      recipientType: cmd.recipientType,
      recipientName: cmd.recipientName ?? null,
      method: cmd.method,
      language: cmd.language ?? null,
      interpreterUsed: cmd.interpreterUsed,
      topicsReviewed: cmd.topicsReviewed,
      uncertaintiesDisclosed: cmd.uncertaintiesDisclosed,
      acknowledgementStatus: cmd.acknowledgementStatus,
      envelope: this.envelope(cmd, "RecordFinancialEducation"),
      auditAction: BENEFITS_AUDIT_ACTIONS.RecordFinancialEducation,
    });
  }

  private envelope(
    cmd: {
      actor: { actorId: string; actorType: "USER" | "AGENT" | "SYSTEM" };
      correlationId?: string;
      idempotencyKey?: string;
      reason?: string;
    },
    commandType: string,
  ) {
    return {
      actor: { actorType: cmd.actor.actorType, actorId: cmd.actor.actorId },
      commandType,
      correlationId: cmd.correlationId,
      idempotencyKey: cmd.idempotencyKey,
      reason: cmd.reason,
    };
  }
}
