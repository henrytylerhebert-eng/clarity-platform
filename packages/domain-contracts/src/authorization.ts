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
