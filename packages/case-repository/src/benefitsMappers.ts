import type {
  BenefitVerification as BenefitRow,
  EligibilityVerification as EligibilityRow,
  InsuranceCoverage as CoverageRow,
} from "@prisma/client";
import {
  COVERAGE_ORDERS,
  COVERAGE_STATUSES,
  COVERAGE_TYPES,
  ELIGIBILITY_STATUSES,
  NETWORK_STATUSES,
  SERVICE_TYPES,
  SUBSCRIBER_RELATIONSHIPS,
  VERIFICATION_METHODS,
  type ClarityBenefitVerification,
  type ClarityCoverage,
  type ClarityEligibilityVerification,
  type CoverageOrder,
  type CoverageStatus,
  type CoverageType,
  type EligibilityStatus,
  type NetworkStatus,
  type ServiceType,
  type SubscriberRelationship,
  type VerificationMethod,
} from "@clarity/domain-contracts";

function parseEnum<T extends string>(value: string, allowed: readonly T[], field: string): T {
  if ((allowed as readonly string[]).includes(value)) return value as T;
  throw new Error(`Row field ${field} has value "${value}" outside the domain contract`);
}

export function coverageRowToDomain(row: CoverageRow): ClarityCoverage {
  return {
    coverageId: row.id,
    organizationId: row.organizationId,
    caseId: row.caseId,
    patientTokenId: row.patientTokenId,
    coverageOrder: parseEnum<CoverageOrder>(row.coverageOrder, COVERAGE_ORDERS, "coverageOrder"),
    coverageType: parseEnum<CoverageType>(row.coverageType, COVERAGE_TYPES, "coverageType"),
    subscriberRelationship: parseEnum<SubscriberRelationship>(
      row.subscriberRelationship,
      SUBSCRIBER_RELATIONSHIPS,
      "subscriberRelationship",
    ),
    payerNameRaw: row.payerNameRaw,
    planNameRaw: row.planNameRaw,
    status: parseEnum<CoverageStatus>(row.status, COVERAGE_STATUSES, "status"),
    sourceDocumentIds: row.sourceDocumentIds,
    version: row.version,
    createdAt: row.createdAt,
  };
}

export function eligibilityRowToDomain(
  row: EligibilityRow & { proofs?: Array<{ documentId: string }> },
): ClarityEligibilityVerification {
  return {
    verificationId: row.id,
    coverageId: row.insuranceCoverageId,
    method: parseEnum<VerificationMethod>(row.method, VERIFICATION_METHODS, "method"),
    status: parseEnum<EligibilityStatus>(row.status, ELIGIBILITY_STATUSES, "status"),
    effectiveDate: row.effectiveDate,
    terminationDate: row.terminationDate,
    verifiedAt: row.verifiedAt,
    verifiedBy: row.verifiedBy,
    payerRepresentative: row.payerRepresentative,
    referenceNumber: row.referenceNumber,
    notes: row.notes,
    proofDocumentIds: (row.proofs ?? []).map((p) => p.documentId),
  };
}

export function benefitRowToDomain(
  row: BenefitRow & { sources?: Array<{ documentId: string }> },
): ClarityBenefitVerification {
  return {
    benefitVerificationId: row.id,
    coverageId: row.insuranceCoverageId,
    serviceType: parseEnum<ServiceType>(row.serviceType, SERVICE_TYPES, "serviceType"),
    networkStatus: parseEnum<NetworkStatus>(row.networkStatus, NETWORK_STATUSES, "networkStatus"),
    deductibleAmountCents: row.deductibleAmountCents,
    deductibleMetCents: row.deductibleMetCents,
    coinsurancePercent: row.coinsurancePercent,
    copayAmountCents: row.copayAmountCents,
    outOfPocketMaxCents: row.outOfPocketMaxCents,
    outOfPocketMetCents: row.outOfPocketMetCents,
    authorizationRequired: row.authorizationRequired,
    notificationRequired: row.notificationRequired,
    coverageLimit: row.coverageLimit,
    exclusions: row.exclusions,
    quotedAt: row.quotedAt,
    verificationReference: row.verificationReference,
    disclaimerStatus: row.disclaimerStatus as "REQUIRED" | "PROVIDED",
    sourceDocumentIds: (row.sources ?? []).map((s) => s.documentId),
  };
}
