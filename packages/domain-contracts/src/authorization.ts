/**
 * Authorization workflow contract. Values mirror prisma/schema.prisma enum
 * AuthorizationStatus — keep in sync. Rules: docs/payer-and-benefits/AUTHORIZATION_MANAGEMENT.md.
 */
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

/** Values mirror prisma/schema.prisma enum LevelOfCare — keep in sync. */
export const LEVELS_OF_CARE = [
  "INPATIENT_PSYCHIATRIC",
  "CRISIS_STABILIZATION",
  "RESIDENTIAL",
  "PARTIAL_HOSPITALIZATION",
  "INTENSIVE_OUTPATIENT",
  "OUTPATIENT",
  "MEDICAL_ADMISSION_WITH_PSYCHIATRIC_CONSULT",
  "SUBSTANCE_USE_DETOX",
  "SUBSTANCE_USE_RESIDENTIAL",
  "UNKNOWN",
] as const;
export type LevelOfCare = (typeof LEVELS_OF_CARE)[number];

const AUTHORIZATION_TRANSITIONS: Record<AuthorizationStatus, readonly AuthorizationStatus[]> = {
  NOT_STARTED: ["PREPARING", "NOT_REQUIRED"],
  PREPARING: ["SUBMITTED", "UNABLE_TO_COMPLETE", "NOT_REQUIRED"],
  SUBMITTED: ["PENDING", "APPROVED", "PARTIALLY_APPROVED", "DENIED"],
  PENDING: ["APPROVED", "PARTIALLY_APPROVED", "DENIED", "UNABLE_TO_COMPLETE"],
  APPROVED: ["PENDING"], // concurrent review can reopen
  PARTIALLY_APPROVED: ["PENDING", "APPROVED", "DENIED"], // appeal path
  DENIED: ["PENDING"], // appeal path
  NOT_REQUIRED: ["PREPARING"], // payer position can change
  UNABLE_TO_COMPLETE: ["PREPARING"],
};

export function canTransitionAuthorization(
  from: AuthorizationStatus,
  to: AuthorizationStatus,
): boolean {
  return AUTHORIZATION_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * External submission gate: agents may prepare; only an authorized human may
 * record or initiate submission to a payer.
 */
export function assertHumanSubmitter(actorType: "USER" | "AGENT" | "SYSTEM"): void {
  if (actorType !== "USER") {
    throw new Error("Authorization submission requires an authorized human actor");
  }
}

/**
 * Authorization-readiness assessment (ADR-0010). Pure derivation from
 * recorded facts — per coverage, side by side, in the spirit of the
 * readiness contract: there is deliberately NO aggregate score, ranking, or
 * combined flag across coverages, and nothing here may feed a blend that
 * includes financial readiness.
 */

/** Whether authorization is required, as determined by recorded benefit quotes. */
export type AuthorizationRequirement = "REQUIRED" | "NOT_REQUIRED" | "UNKNOWN";

/** Named gaps a specialist can act on — facts, not judgments. */
export const AUTHORIZATION_READINESS_GAPS = [
  "ELIGIBILITY_NOT_CONFIRMED",
  "BENEFIT_QUOTE_MISSING",
  "AUTHORIZATION_REQUIREMENT_UNVERIFIED",
  "AUTHORIZATION_NOT_STARTED",
] as const;
export type AuthorizationReadinessGap = (typeof AUTHORIZATION_READINESS_GAPS)[number];

export interface CoverageAuthorizationFacts {
  readonly coverageId: string;
  readonly coverageOrder: "PRIMARY" | "SECONDARY" | "TERTIARY";
  readonly coverageStatus: "UNVERIFIED" | "ACTIVE" | "INACTIVE" | "UNCLEAR" | "UNABLE_TO_VERIFY";
  readonly quotes: ReadonlyArray<{
    readonly benefitVerificationId: string;
    readonly serviceType: string;
    readonly authorizationRequired: boolean | null;
    readonly notificationRequired: boolean | null;
  }>;
  readonly authorizations: ReadonlyArray<{
    readonly authorizationId: string;
    readonly requestedLevelOfCare: string;
    readonly status: AuthorizationStatus;
  }>;
}

export interface CoverageAuthorizationReadiness {
  readonly coverageId: string;
  readonly coverageOrder: "PRIMARY" | "SECONDARY" | "TERTIARY";
  readonly requirement: AuthorizationRequirement;
  readonly gaps: readonly AuthorizationReadinessGap[];
  /** Echoed facts so the reader can see WHY, not just the verdict. */
  readonly quotesConsidered: number;
  readonly authorizations: CoverageAuthorizationFacts["authorizations"];
}

export function assessCoverageAuthorizationReadiness(
  facts: CoverageAuthorizationFacts,
): CoverageAuthorizationReadiness {
  const gaps: AuthorizationReadinessGap[] = [];
  if (facts.coverageStatus !== "ACTIVE") gaps.push("ELIGIBILITY_NOT_CONFIRMED");

  let requirement: AuthorizationRequirement;
  if (facts.quotes.length === 0) {
    requirement = "UNKNOWN";
    gaps.push("BENEFIT_QUOTE_MISSING");
  } else if (facts.quotes.some((q) => q.authorizationRequired === true)) {
    requirement = "REQUIRED";
  } else if (facts.quotes.every((q) => q.authorizationRequired === false)) {
    requirement = "NOT_REQUIRED";
  } else {
    requirement = "UNKNOWN";
    gaps.push("AUTHORIZATION_REQUIREMENT_UNVERIFIED");
  }

  if (requirement === "REQUIRED") {
    const underway = facts.authorizations.some((a) => a.status !== "NOT_REQUIRED");
    if (!underway) gaps.push("AUTHORIZATION_NOT_STARTED");
  }

  return {
    coverageId: facts.coverageId,
    coverageOrder: facts.coverageOrder,
    requirement,
    gaps,
    quotesConsidered: facts.quotes.length,
    authorizations: facts.authorizations,
  };
}

/** Per-case view: one item per coverage, in coverage order. NO aggregate. */
export function assessAuthorizationReadiness(
  coverages: readonly CoverageAuthorizationFacts[],
): CoverageAuthorizationReadiness[] {
  return coverages.map(assessCoverageAuthorizationReadiness);
}
