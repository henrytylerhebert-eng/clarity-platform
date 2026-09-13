-- TWP-OA-002 part 3: assurance evidence revision history.
CREATE TABLE "AssuranceEvidenceSubmission" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "assuranceCaseId" TEXT NOT NULL,
  "expectationId" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "AssuranceEvidenceStatus" NOT NULL DEFAULT 'SUBMITTED',
  "version" INTEGER NOT NULL,
  "submittedBy" TEXT NOT NULL,
  "submittedAt" TIMESTAMP(3) NOT NULL,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "supersededById" TEXT,
  CONSTRAINT "AssuranceEvidenceSubmission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AssuranceEvidenceSubmission_organizationId_id_key" ON "AssuranceEvidenceSubmission"("organizationId", "id");
CREATE UNIQUE INDEX "AssuranceEvidenceSubmission_organizationId_expectationId_version_key" ON "AssuranceEvidenceSubmission"("organizationId", "expectationId", "version");
CREATE INDEX "AssuranceEvidenceSubmission_organizationId_assuranceCaseId_idx" ON "AssuranceEvidenceSubmission"("organizationId", "assuranceCaseId");
CREATE INDEX "AssuranceEvidenceSubmission_expectationId_version_idx" ON "AssuranceEvidenceSubmission"("expectationId", "version");
ALTER TABLE "AssuranceEvidenceSubmission" ADD CONSTRAINT "AssuranceEvidenceSubmission_case_fkey" FOREIGN KEY ("organizationId", "assuranceCaseId") REFERENCES "AssuranceCase"("organizationId", "id") ON DELETE CASCADE ON UPDATE RESTRICT;
ALTER TABLE "AssuranceEvidenceSubmission" ADD CONSTRAINT "AssuranceEvidenceSubmission_expectation_fkey" FOREIGN KEY ("organizationId", "expectationId") REFERENCES "AssuranceEvidenceExpectation"("organizationId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
