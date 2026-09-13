import type {
  AssuranceCase,
  AssuranceEvidenceSubmission,
  AssuranceEvaluation,
  AssuranceReviewDecision,
} from "@prisma/client";

export interface PersistedAssuranceCase {
  readonly id: string;
  readonly organizationId: string;
  readonly facilityProfileId: string;
  readonly caseKey: string;
  readonly title: string;
  readonly assuranceStatement: string;
  readonly createdBy: string;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface PersistedAssuranceEvidenceSubmission {
  readonly id: string;
  readonly organizationId: string;
  readonly assuranceCaseId: string;
  readonly expectationId: string;
  readonly status: AssuranceEvidenceSubmission["status"];
  readonly version: number;
  readonly submittedBy: string;
  readonly submittedAt: Date;
  readonly reviewedBy: string | null;
  readonly reviewedAt: Date | null;
  readonly supersededById: string | null;
  readonly payload: AssuranceEvidenceSubmission["payload"];
}

export interface PersistedAssuranceEvaluation {
  readonly id: string;
  readonly organizationId: string;
  readonly assuranceCaseId: string;
  readonly result: AssuranceEvaluation["result"];
  readonly reasonCodes: readonly string[];
  readonly requiresHumanReview: boolean;
  readonly revision: number;
  readonly createdAt: Date;
}

export interface PersistedAssuranceReviewDecision {
  readonly id: string;
  readonly organizationId: string;
  readonly assuranceCaseId: string;
  readonly evaluationId: string;
  readonly decision: AssuranceReviewDecision["decision"];
  readonly rationale: string | null;
  readonly reviewerUserId: string;
  readonly createdAt: Date;
}

export function toAssuranceCase(row: AssuranceCase): PersistedAssuranceCase {
  return { ...row };
}

export function toAssuranceEvidenceSubmission(
  row: AssuranceEvidenceSubmission,
): PersistedAssuranceEvidenceSubmission {
  return { ...row };
}

export function toAssuranceEvaluation(row: AssuranceEvaluation): PersistedAssuranceEvaluation {
  return { ...row, reasonCodes: [...row.reasonCodes] };
}

export function toAssuranceReviewDecision(
  row: AssuranceReviewDecision,
): PersistedAssuranceReviewDecision {
  return { ...row };
}
