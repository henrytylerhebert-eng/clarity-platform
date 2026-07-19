import type { AppState, RiskFinding, SourceReference } from "./types";
import { getOperationsPayerProfile, type OperationsPayerProfileId } from "./payerProfiles";

/**
 * Prototype-side mirrors of the evidence, benefits, and authorization services that live in
 * packages/{evidence,benefits,authorization}-service. The app is deliberately standalone (it does
 * not import @clarity/* — see app/vite.config.ts), so the vocabularies below are kept in sync by
 * hand with packages/domain-contracts/src/{evidence,benefits,authorization}.ts.
 *
 * Everything here is derived from existing synthetic case state or from a deterministic function of
 * the case id. Nothing is persisted, nothing is a payer or clinical decision, and no value here is
 * an authorization, an eligibility determination, or a guarantee of payment.
 */

// ---------------------------------------------------------------------------
// Authentication (mirrors packages/domain-contracts/src/authentication.ts)
// ---------------------------------------------------------------------------

/** Default session lifetime in the auth service: one nursing shift. */
export const DEFAULT_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export interface DemoPrincipal {
  userId: string;
  organizationId: string;
  displayName: string;
  roles: string[];
  sessionId: string;
  expiresAt: string;
}

/**
 * A stand-in for the AuthenticatedPrincipal the real auth service issues.
 *
 * The distinction this surfaces matters: in packages/auth-service the principal is the identity
 * point — an actor's roles are derived from a verified session, so a caller cannot assert its own
 * roles. The role selector in this prototype is the opposite: unverified local display scoping with
 * no security value. This panel exists to make that gap visible rather than let the role switcher
 * read as though it were a login.
 */
export function describeDemoSession(roleLabel: string): DemoPrincipal {
  return {
    userId: "synthetic-user",
    organizationId: "synthetic-org",
    displayName: "Synthetic Reviewer",
    roles: [roleLabel],
    sessionId: "synthetic-session",
    expiresAt: new Date(Date.now() + DEFAULT_SESSION_TTL_MS).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Evidence repository (mirrors packages/domain-contracts/src/evidence.ts)
// ---------------------------------------------------------------------------

export const EVIDENCE_STATUSES = ["CANDIDATE", "APPROVED", "REJECTED", "NEEDS_CLARIFICATION", "SUPERSEDED"] as const;
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export const CONTRADICTION_CLASSIFICATIONS = ["DIRECT_CONFLICT", "TEMPORAL_CHANGE", "SOURCE_DISAGREEMENT", "UNCLEAR"] as const;
export type ContradictionClassification = (typeof CONTRADICTION_CLASSIFICATIONS)[number];

export interface EvidenceItem {
  id: string;
  caseId: string;
  category: string;
  summary: string;
  status: EvidenceStatus;
  severity: RiskFinding["severity"];
  /** Provenance — every item traces to the source references it was drawn from. */
  sources: SourceReference[];
  /** True when no source reference backs this item; it cannot be approved as-is. */
  unsourced: boolean;
}

export interface ContradictionGroup {
  id: string;
  classification: ContradictionClassification;
  summary: string;
  memberIds: string[];
}

/**
 * Every item enters review as a CANDIDATE — nothing is auto-approved. The app's existing
 * ReviewStatus vocabulary is mapped onto the evidence review state machine.
 */
export function evidenceStatusFromReview(reviewStatus: RiskFinding["reviewStatus"]): EvidenceStatus {
  switch (reviewStatus) {
    case "Clinician reviewed":
    case "Signed locked":
      return "APPROVED";
    case "Needs clinician review":
    case "Counsel validation required":
      return "NEEDS_CLARIFICATION";
    default:
      return "CANDIDATE";
  }
}

export function buildEvidenceLedger(state: AppState, caseId: string): EvidenceItem[] {
  const sources = state.sourceReferences.filter((source) => source.caseId === caseId);
  return state.riskFindings
    .filter((finding) => finding.caseId === caseId)
    .map((finding) => {
      const linked = sources.filter((source) => finding.sourceReferenceIds.includes(source.id));
      return {
        id: finding.id,
        caseId,
        category: finding.type,
        summary: finding.summary,
        status: evidenceStatusFromReview(finding.reviewStatus),
        severity: finding.severity,
        sources: linked,
        unsourced: linked.length === 0,
      };
    });
}

/**
 * Surfaces disagreement rather than resolving it: two findings of the same category drawn from
 * different source types are flagged for a human to classify, never silently reconciled.
 */
export function detectContradictions(items: EvidenceItem[]): ContradictionGroup[] {
  const byCategory = new Map<string, EvidenceItem[]>();
  for (const item of items) {
    byCategory.set(item.category, [...(byCategory.get(item.category) ?? []), item]);
  }
  const groups: ContradictionGroup[] = [];
  for (const [category, members] of byCategory) {
    if (members.length < 2) continue;
    const sourceTypes = new Set(members.flatMap((member) => member.sources.map((source) => source.type)));
    const severities = new Set(members.map((member) => member.severity));
    if (sourceTypes.size < 2 && severities.size < 2) continue;
    groups.push({
      id: `contradiction-${category.toLowerCase().replace(/\s+/g, "-")}`,
      classification: sourceTypes.size > 1 ? "SOURCE_DISAGREEMENT" : "UNCLEAR",
      summary:
        sourceTypes.size > 1
          ? `${members.length} ${category.toLowerCase()} findings drawn from differing source types (${[...sourceTypes].join(", ")}).`
          : `${members.length} ${category.toLowerCase()} findings recorded at differing severities (${[...severities].join(", ")}).`,
      memberIds: members.map((member) => member.id),
    });
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Benefits verification (mirrors packages/domain-contracts/src/benefits.ts)
// ---------------------------------------------------------------------------

export const BENEFIT_DISCLAIMER =
  "Quoted benefits are based on information provided by the payer at the time of verification. " +
  "A benefit quote is not a guarantee of payment. Final patient responsibility is determined by " +
  "claim adjudication.";

export const ELIGIBILITY_STATUSES = ["PENDING", "ACTIVE_CONFIRMED", "INACTIVE", "UNCLEAR", "FAILED"] as const;
export type EligibilityStatus = (typeof ELIGIBILITY_STATUSES)[number];

export const COVERAGE_STATUSES = ["UNVERIFIED", "ACTIVE", "INACTIVE", "UNCLEAR", "UNABLE_TO_VERIFY"] as const;
export type CoverageStatus = (typeof COVERAGE_STATUSES)[number];

export const VERIFICATION_METHODS = ["PORTAL", "ELECTRONIC_TRANSACTION", "PHONE", "FAX", "MANUAL", "OTHER"] as const;
export type VerificationMethod = (typeof VERIFICATION_METHODS)[number];

export interface CoverageSnapshot {
  coverageId: string;
  payerName: string;
  planName: string;
  coverageOrder: "PRIMARY" | "SECONDARY";
  coverageType: string;
  coverageTypeLabel: string;
  payerProfileId: OperationsPayerProfileId | null;
  payerProfileLabel: string;
  payerProfileVersion: string | null;
  payerProfileReviewStatus: "Pending domain-owner review" | "Not applicable";
  payerVerificationPrompts: readonly string[];
  coverageStatus: CoverageStatus;
  eligibilityStatus: EligibilityStatus;
  verificationMethod: VerificationMethod;
  /** Human who performed the verification — manual verification is the only supported path. */
  verifiedBy?: string;
  verifiedAt?: string;
  benefitQuote?: { deductibleRemaining: string; coinsurance: string; priorAuthRequired: "REQUIRED" | "NOT_REQUIRED" | "UNKNOWN" };
}

function hashCode(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

const DEMO_PAYER_LANES: Array<{
  payerProfileId: OperationsPayerProfileId | null;
  payerName: string;
  planName: string;
  coverageType: string;
}> = [
  { payerProfileId: "medicaid", payerName: "Synthetic Medicaid Health", planName: "Managed Medicaid", coverageType: "MEDICAID" },
  { payerProfileId: "commercial", payerName: "Synthetic Commercial Health", planName: "Employer PPO", coverageType: "COMMERCIAL" },
  { payerProfileId: "medicare", payerName: "Synthetic Medicare", planName: "Part A/B", coverageType: "MEDICARE" },
  { payerProfileId: "va", payerName: "Synthetic Veterans Care", planName: "VA referral pathway", coverageType: "OTHER" },
  { payerProfileId: null, payerName: "Self-pay", planName: "No third-party coverage", coverageType: "SELF_PAY" },
];

/**
 * Deterministic synthetic coverage for the prototype. Real coverage is captured through the manual
 * verification workflow in packages/benefits-service — this is display scaffolding only.
 */
export function deriveCoverage(caseId: string): CoverageSnapshot {
  const seed = hashCode(caseId);
  const payer = DEMO_PAYER_LANES[seed % DEMO_PAYER_LANES.length];
  const profile = payer.payerProfileId ? getOperationsPayerProfile(payer.payerProfileId) : null;
  const isSelfPay = payer.coverageType === "SELF_PAY";
  // Self-pay has no third-party coverage to verify, so it can never carry a verifier or a
  // benefit quote — only payer-backed coverage reaches a verified state.
  const verified = !isSelfPay && seed % 3 !== 0;
  return {
    coverageId: `coverage-${caseId}`,
    ...payer,
    coverageTypeLabel: profile?.coverageTypeLabel ?? (isSelfPay ? "Self-pay" : payer.coverageType),
    payerProfileLabel: profile?.label ?? "No payer profile",
    payerProfileVersion: profile?.version ?? null,
    payerProfileReviewStatus: profile?.reviewStatus ?? "Not applicable",
    payerVerificationPrompts: profile?.verificationPrompts ?? [],
    coverageOrder: "PRIMARY",
    coverageStatus: isSelfPay ? "UNABLE_TO_VERIFY" : verified ? "ACTIVE" : "UNVERIFIED",
    eligibilityStatus: isSelfPay ? "FAILED" : verified ? "ACTIVE_CONFIRMED" : "PENDING",
    verificationMethod: verified ? "PORTAL" : "MANUAL",
    verifiedBy: verified ? "UR specialist (synthetic)" : undefined,
    verifiedAt: verified ? new Date(Date.now() - (seed % 48) * 3600000).toISOString() : undefined,
    benefitQuote: verified
      ? {
          deductibleRemaining: `$${(seed % 20) * 50}`,
          coinsurance: `${10 + (seed % 4) * 10}%`,
          priorAuthRequired: seed % 2 === 0 ? "REQUIRED" : "UNKNOWN",
        }
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Authorization readiness (mirrors packages/domain-contracts/src/authorization.ts)
// ---------------------------------------------------------------------------

export const AUTHORIZATION_STATUSES = [
  "NOT_STARTED",
  "PREPARING",
  "SUBMITTED",
  "PENDING",
  "APPROVED",
  "PARTIALLY_APPROVED",
  "DENIED",
  "NOT_REQUIRED",
  "UNABLE_TO_COMPLETE",
] as const;
export type AuthorizationStatus = (typeof AUTHORIZATION_STATUSES)[number];

export const AUTHORIZATION_READINESS_GAPS = [
  "ELIGIBILITY_NOT_CONFIRMED",
  "BENEFIT_QUOTE_MISSING",
  "AUTHORIZATION_REQUIREMENT_UNVERIFIED",
  "AUTHORIZATION_NOT_STARTED",
] as const;
export type AuthorizationReadinessGap = (typeof AUTHORIZATION_READINESS_GAPS)[number];

export const GAP_LABELS: Record<AuthorizationReadinessGap, string> = {
  ELIGIBILITY_NOT_CONFIRMED: "Eligibility not confirmed with the payer",
  BENEFIT_QUOTE_MISSING: "No benefit quote captured",
  AUTHORIZATION_REQUIREMENT_UNVERIFIED: "Prior-authorization requirement not verified",
  AUTHORIZATION_NOT_STARTED: "Authorization request not started",
};

export interface AuthorizationReadiness {
  status: AuthorizationStatus;
  gaps: AuthorizationReadinessGap[];
  /** Readiness never blocks the clinical lane — it reports, it does not gate. */
  clinicalLaneBlocked: false;
}

export function assessAuthorizationReadiness(coverage: CoverageSnapshot): AuthorizationReadiness {
  const gaps: AuthorizationReadinessGap[] = [];
  if (coverage.eligibilityStatus !== "ACTIVE_CONFIRMED") gaps.push("ELIGIBILITY_NOT_CONFIRMED");
  if (!coverage.benefitQuote) gaps.push("BENEFIT_QUOTE_MISSING");
  if (!coverage.benefitQuote || coverage.benefitQuote.priorAuthRequired === "UNKNOWN") {
    gaps.push("AUTHORIZATION_REQUIREMENT_UNVERIFIED");
  }
  if (coverage.benefitQuote?.priorAuthRequired === "REQUIRED") gaps.push("AUTHORIZATION_NOT_STARTED");

  let status: AuthorizationStatus = "NOT_STARTED";
  if (coverage.coverageStatus === "UNABLE_TO_VERIFY") status = "UNABLE_TO_COMPLETE";
  else if (coverage.benefitQuote?.priorAuthRequired === "NOT_REQUIRED") status = "NOT_REQUIRED";
  else if (gaps.length === 0) status = "PREPARING";

  return { status, gaps, clinicalLaneBlocked: false };
}
