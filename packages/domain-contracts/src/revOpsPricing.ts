/** Supported scenario methods. These results are modeled amounts, never receipts. */
export type RevOpsPaymentMethod = "perDiem" | "perService" | "perCase" | "percentCharges";
export type RevOpsPayerKind = "commercial" | "medicareAdvantage" | "medicaidManagedCare";

export interface RevOpsRateSource {
  publisher: string;
  releaseId: string;
  sourceUrl: string;
  sha256: string | null;
  locator: string;
}

export interface RevOpsContractRate {
  id: string;
  payer: string;
  payerKind: RevOpsPayerKind;
  plan: string;
  network: string;
  funding: string;
  facility: string;
  program: string;
  method: RevOpsPaymentMethod;
  effectiveFrom: string;
  effectiveThrough: string;
  unitRateCents: number | null;
  percentBasisPoints: number | null;
  sourceReference: string;
  provenance: "synthetic" | "userEnteredUnverified";
}

export interface RevOpsContractScenario {
  payer: string;
  payerKind: RevOpsPayerKind;
  plan: string;
  network: string;
  funding: string;
  facility: string;
  program: string;
  method: RevOpsPaymentMethod;
  serviceDate: string;
  units: number | null;
  chargesCents: number | null;
}

export interface RevOpsPricingLine {
  label: string;
  units: number;
  unitRateCents: number;
  amountCents: number;
  source: RevOpsRateSource;
}

export interface RevOpsPricingResult {
  status: "priced" | "unpriced" | "componentOnly";
  amountCents: number | null;
  financialMeaning: string;
  methodVersion: string;
  reasons: string[];
  lines: RevOpsPricingLine[];
  inputs: Record<string, unknown>;
  rounding: string;
}

export interface RevOpsMedicaidRow {
  providerId: string;
  facilityName: string;
  hospitalType: string;
  rateType: string;
  perDiemCents: number | null;
  rowEffectiveFrom: string | null;
  medicareNumber: string | null;
  sourceRow: number;
}

export interface RevOpsMedicaidRelease {
  releaseId: string;
  publisher: string;
  sourceUrl: string;
  sha256: string;
  retrievedAt: string;
  sheet: string;
  scenarioCoverageFrom: string;
  scenarioCoverageThrough: string;
  rowCount: number;
  rows: RevOpsMedicaidRow[];
}
