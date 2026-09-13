import type {
  AssuranceEvaluationInput,
  AssuranceEvaluationOutput,
  AssuranceEvaluationReasonCode,
  AssuranceEvaluationResult,
} from "@clarity/domain-contracts";

function output(
  input: AssuranceEvaluationInput,
  result: AssuranceEvaluationResult,
  reasonCodes: readonly AssuranceEvaluationReasonCode[],
): AssuranceEvaluationOutput {
  return {
    result,
    reasonCodes: [...reasonCodes],
    requiresHumanReview: true,
    sourceIds: input.sources.map((source) => source.sourceId),
    ...(input.submission ? { evidenceSubmissionId: input.submission.submissionId } : {}),
  };
}

function isMeaningfulEvidenceValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length > 0;
  return false;
}

function normalizedRequiredKeys(keys: readonly string[]): string[] {
  return [...new Set(keys.map((key) => key.trim()).filter(Boolean))];
}

/**
 * Pure trust-contract evaluator for VS-OA-001.
 *
 * This function deliberately does not determine regulatory compliance. It
 * evaluates whether the bounded synthetic assurance case has enough governed
 * structural support to present a result for qualified human review.
 *
 * The precedence is fail-closed: applicability, metadata, rights, currentness,
 * and source conflicts are evaluated before evidence completeness.
 */
export function evaluateAssurance(input: AssuranceEvaluationInput): AssuranceEvaluationOutput {
  if (input.applicability.status !== "APPROVED") {
    return output(input, "APPLICABILITY_PENDING", ["APPLICABILITY_NOT_APPROVED"]);
  }

  if (input.sources.length === 0 || input.sources.some((source) => !source.hasRequiredMetadata)) {
    return output(input, "UNKNOWN", ["SOURCE_METADATA_INCOMPLETE"]);
  }

  if (input.sources.some((source) => source.rights === "RESTRICTED")) {
    return output(input, "RIGHTS_RESTRICTED", ["SOURCE_RIGHTS_RESTRICTED"]);
  }

  if (input.sources.some((source) => source.rights === "UNKNOWN")) {
    return output(input, "REVIEW_REQUIRED", ["SOURCE_RIGHTS_UNKNOWN"]);
  }

  if (input.sources.some((source) => source.currentness === "STALE" || source.currentness === "SUPERSEDED")) {
    return output(input, "STALE_SOURCE", ["SOURCE_STALE"]);
  }

  if (input.sources.some((source) => source.currentness === "UNKNOWN")) {
    return output(input, "REVIEW_REQUIRED", ["SOURCE_CURRENTNESS_UNKNOWN"]);
  }

  if (input.conflicts.some((conflict) => conflict.status === "OPEN")) {
    return output(input, "CONFLICT", ["SOURCE_CONFLICT_OPEN"]);
  }

  const requiredKeys = normalizedRequiredKeys(input.expectation.requiredKeys);
  if (requiredKeys.length === 0) {
    return output(input, "UNKNOWN", ["EVIDENCE_EXPECTATION_EMPTY"]);
  }

  if (!input.submission) {
    return output(input, "MISSING_EVIDENCE", ["EVIDENCE_NOT_SUBMITTED"]);
  }

  const presentCount = requiredKeys.filter((key) => isMeaningfulEvidenceValue(input.submission?.payload[key])).length;

  if (presentCount === 0) {
    return output(input, "MISSING_EVIDENCE", ["EVIDENCE_MISSING"]);
  }

  if (presentCount < requiredKeys.length) {
    return output(input, "PARTIALLY_SUPPORTED", ["EVIDENCE_PARTIAL"]);
  }

  return output(input, "SUPPORTED", ["EVIDENCE_COMPLETE"]);
}
