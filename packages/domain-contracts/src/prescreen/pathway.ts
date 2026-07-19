import { z } from "zod";
import {
  ORIENTATION_DOMAINS,
  type OrientationDomain,
  type OrientationObservation,
  type PatientWillingness,
  type PossiblePrescreenPathway,
} from "./assessment.js";

export const ORIENTATION_GATE_RESULTS = ["PASS", "FAIL", "UNKNOWN"] as const;
export type OrientationGateResult = (typeof ORIENTATION_GATE_RESULTS)[number];

export const FormalVoluntaryPrescreenGateSchema = z
  .object({
    ruleId: z.string().min(1),
    ruleVersion: z.number().int().positive(),
    source: z.literal("OWNER_DEFINED_LAUNCH_RULE"),
    requiredDomains: z.tuple([
      z.literal("person"),
      z.literal("place"),
      z.literal("time"),
      z.literal("situation"),
    ]),
  })
  .strict();
export type FormalVoluntaryPrescreenGate = Readonly<
  z.infer<typeof FormalVoluntaryPrescreenGateSchema>
>;

export interface PossiblePathwayInput {
  readonly willingness: PatientWillingness;
  readonly orientation: OrientationObservation;
  readonly formalVoluntaryGate: FormalVoluntaryPrescreenGate;
  readonly immediateMedicalStabilizationRequired?: boolean;
  readonly activeEmergencyOrLegalProcess?: boolean;
}

export interface PossiblePathwayResult {
  readonly pathway: PossiblePrescreenPathway;
  readonly orientationGate: OrientationGateResult;
  readonly reasons: readonly string[];
  readonly ruleVersionIds: readonly string[];
  readonly requiresAuthorizedReview: boolean;
}

export function evaluateOrientationGate(
  observation: OrientationObservation,
  requiredDomains: readonly OrientationDomain[] = ORIENTATION_DOMAINS,
): OrientationGateResult {
  const statuses = requiredDomains.map((domain) => observation.domains[domain].status);
  if (statuses.every((status) => status === "ORIENTED")) return "PASS";
  if (statuses.some((status) => status === "NOT_ORIENTED")) return "FAIL";
  return "UNKNOWN";
}

export function derivePossiblePrescreenPathway(input: PossiblePathwayInput): PossiblePathwayResult {
  const rule = FormalVoluntaryPrescreenGateSchema.parse(input.formalVoluntaryGate);
  const orientationGate = evaluateOrientationGate(input.orientation, rule.requiredDomains);
  const ruleVersionIds = [`${rule.ruleId}:v${rule.ruleVersion}`];

  if (input.immediateMedicalStabilizationRequired) {
    return {
      pathway: "MEDICAL_STABILIZATION_REQUIRED",
      orientationGate,
      reasons: ["IMMEDIATE_MEDICAL_STABILIZATION_REQUIRED"],
      ruleVersionIds,
      requiresAuthorizedReview: true,
    };
  }
  if (input.activeEmergencyOrLegalProcess || input.willingness === "OPPOSED") {
    return {
      pathway: "EMERGENCY_OR_LEGAL_REVIEW_REQUIRED",
      orientationGate,
      reasons: [input.activeEmergencyOrLegalProcess ? "ACTIVE_EMERGENCY_OR_LEGAL_PROCESS" : "PATIENT_OPPOSED"],
      ruleVersionIds,
      requiresAuthorizedReview: true,
    };
  }
  if (input.willingness === "WILLING" && orientationGate === "PASS") {
    return {
      pathway: "POSSIBLE_FORMAL_VOLUNTARY_REVIEW",
      orientationGate,
      reasons: ["PATIENT_WILLING", "OWNER_DEFINED_ORIENTATION_GATE_PASS"],
      ruleVersionIds,
      requiresAuthorizedReview: true,
    };
  }
  if (
    (input.willingness === "WILLING" || input.willingness === "NON_OPPOSED") &&
    orientationGate !== "PASS"
  ) {
    return {
      pathway: "POSSIBLE_NONCONTESTED_PATHWAY",
      orientationGate,
      reasons: ["PATIENT_NOT_OPPOSED", `ORIENTATION_GATE_${orientationGate}`],
      ruleVersionIds,
      requiresAuthorizedReview: true,
    };
  }
  return {
    pathway: "UNDETERMINED",
    orientationGate,
    reasons: ["INSUFFICIENT_INFORMATION_OR_UNRESOLVED_PATHWAY"],
    ruleVersionIds,
    requiresAuthorizedReview: false,
  };
}
