/**
 * Referral readiness is four SEPARATE dimensions. There is intentionally no
 * function that combines them into one number (MASTER_ARCHITECTURE §8;
 * MASTER_BUILD_PROMPT rule 12). Display them side by side; never rank
 * referrals by any weighted blend that includes financial readiness.
 */
export interface ReferralReadiness {
  readonly clinicalUrgency: "ROUTINE" | "URGENT" | "EMERGENT";
  readonly operationalReadiness: "NOT_READY" | "PARTIAL" | "READY";
  readonly placementReadiness: "NOT_READY" | "PARTIAL" | "READY";
  readonly financialReadiness: "UNKNOWN" | "IN_PROGRESS" | "VERIFIED" | "BLOCKED";
}

export function describeReadiness(r: ReferralReadiness): ReadonlyArray<{ dimension: string; value: string }> {
  return [
    { dimension: "clinicalUrgency", value: r.clinicalUrgency },
    { dimension: "operationalReadiness", value: r.operationalReadiness },
    { dimension: "placementReadiness", value: r.placementReadiness },
    { dimension: "financialReadiness", value: r.financialReadiness },
  ];
}

/**
 * Clinical ordering ignores financial readiness entirely.
 * Exported so queue implementations cannot accidentally weight payment.
 */
export function compareClinicalUrgency(a: ReferralReadiness, b: ReferralReadiness): number {
  const order = { EMERGENT: 0, URGENT: 1, ROUTINE: 2 } as const;
  return order[a.clinicalUrgency] - order[b.clinicalUrgency];
}
