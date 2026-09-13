import type { AssuranceReviewDecision } from "@clarity/domain-contracts";

export interface SubmitAssuranceEvidenceCommand {
  readonly caseKey: string;
  readonly expectationId: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface ReviseAssuranceEvidenceCommand {
  readonly caseKey: string;
  readonly priorSubmissionId: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface EvaluateAssuranceCommand {
  readonly caseKey: string;
  readonly expectationId: string;
}

export interface ReviewAssuranceEvaluationCommand {
  readonly caseKey: string;
  readonly evaluationId: string;
  readonly decision: AssuranceReviewDecision;
  readonly rationale?: string;
}
