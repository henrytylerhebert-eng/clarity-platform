-- TWP-OA-002 part 5: immutable assurance evaluation and review history.
CREATE TABLE "AssuranceEvaluation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "assuranceCaseId" TEXT NOT NULL,
  "applicabilityDecisionId" TEXT,
  "evidenceSubmissionId" TEXT,
  "result" "AssuranceEvaluationResult" NOT NULL,
  "reasonCodes" TEXT[],
  "sourceStateSnapshot" JSONB NOT NULL,
  "evidenceStateSnapshot" JSONB,
  "requiresHumanReview" BOOLEAN NOT NULL DEFAULT true,
  "createdByActorType" "AuditActorType" NOT NULL,
  "createdByActorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revision" INTEGER NOT NULL,
  CONSTRAINT "AssuranceEvaluation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AssuranceEvaluation_organizationId_id_key" ON "AssuranceEvaluation"("organizationId", "id");
CREATE UNIQUE INDEX "AssuranceEvaluation_assuranceCaseId_revision_key" ON "AssuranceEvaluation"("assuranceCaseId", "revision");
CREATE INDEX "AssuranceEvaluation_organizationId_assuranceCaseId_idx" ON "AssuranceEvaluation"("organizationId", "assuranceCaseId");
ALTER TABLE "AssuranceEvaluation" ADD CONSTRAINT "AssuranceEvaluation_case_fkey" FOREIGN KEY ("organizationId", "assuranceCaseId") REFERENCES "AssuranceCase"("organizationId", "id") ON DELETE CASCADE ON UPDATE RESTRICT;

CREATE TABLE "AssuranceReviewDecision" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "assuranceCaseId" TEXT NOT NULL,
  "evaluationId" TEXT NOT NULL,
  "decision" "AssuranceReviewDecisionType" NOT NULL,
  "rationale" TEXT,
  "reviewerUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssuranceReviewDecision_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AssuranceReviewDecision_organizationId_assuranceCaseId_createdAt_idx" ON "AssuranceReviewDecision"("organizationId", "assuranceCaseId", "createdAt");
CREATE INDEX "AssuranceReviewDecision_evaluationId_idx" ON "AssuranceReviewDecision"("evaluationId");
ALTER TABLE "AssuranceReviewDecision" ADD CONSTRAINT "AssuranceReviewDecision_case_fkey" FOREIGN KEY ("organizationId", "assuranceCaseId") REFERENCES "AssuranceCase"("organizationId", "id") ON DELETE CASCADE ON UPDATE RESTRICT;
ALTER TABLE "AssuranceReviewDecision" ADD CONSTRAINT "AssuranceReviewDecision_evaluation_fkey" FOREIGN KEY ("organizationId", "evaluationId") REFERENCES "AssuranceEvaluation"("organizationId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
