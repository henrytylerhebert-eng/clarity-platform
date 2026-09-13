-- TWP-OA-002 part 1: additive Operating Assurance types and core records.
CREATE TYPE "AssuranceParticipantRole" AS ENUM ('OWNER', 'EVIDENCE_CONTRIBUTOR', 'QUALIFIED_REVIEWER');
CREATE TYPE "AssuranceApplicabilityStatus" AS ENUM ('PENDING', 'APPROVED', 'NOT_APPLICABLE', 'CONDITIONAL');
CREATE TYPE "AssuranceAuthorityClass" AS ENUM ('FEDERAL_REGULATION', 'CMS_CERTIFICATION', 'CMS_GUIDANCE', 'STATE_LICENSING', 'ACCREDITATION', 'INCORPORATED_STANDARD', 'PUBLIC_HEALTH_GUIDANCE', 'OTHER_EXTERNAL_AUTHORITY');
CREATE TYPE "AssuranceSourceCurrentness" AS ENUM ('CURRENT', 'STALE', 'SUPERSEDED', 'UNKNOWN');
CREATE TYPE "AssuranceSourceRightsStatus" AS ENUM ('PERMITTED', 'RESTRICTED', 'UNKNOWN');
CREATE TYPE "AssuranceReferenceKind" AS ENUM ('POLICY', 'SOP');
CREATE TYPE "AssuranceEvidenceStatus" AS ENUM ('SUBMITTED', 'ACCEPTED', 'REJECTED', 'NEEDS_CLARIFICATION', 'SUPERSEDED');
CREATE TYPE "AssuranceEvaluationResult" AS ENUM ('SUPPORTED', 'PARTIALLY_SUPPORTED', 'MISSING_EVIDENCE', 'CONFLICT', 'STALE_SOURCE', 'APPLICABILITY_PENDING', 'RIGHTS_RESTRICTED', 'REVIEW_REQUIRED', 'UNKNOWN');
CREATE TYPE "AssuranceReviewDecisionType" AS ENUM ('ACCEPT', 'REJECT', 'REQUEST_MORE_EVIDENCE', 'REVIEW_REQUIRED');
CREATE TYPE "AssuranceConflictStatus" AS ENUM ('OPEN', 'RESOLVED');

CREATE TABLE "AssuranceCase" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "facilityProfileId" TEXT NOT NULL,
  "caseKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "assuranceStatement" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "AssuranceCase_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AssuranceCase_organizationId_id_key" ON "AssuranceCase"("organizationId", "id");
CREATE UNIQUE INDEX "AssuranceCase_organizationId_caseKey_key" ON "AssuranceCase"("organizationId", "caseKey");
CREATE INDEX "AssuranceCase_organizationId_facilityProfileId_idx" ON "AssuranceCase"("organizationId", "facilityProfileId");

CREATE TABLE "AssuranceParticipantAssignment" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "assuranceCaseId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "AssuranceParticipantRole" NOT NULL,
  "authorityBasis" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "grantedBy" TEXT NOT NULL,
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "AssuranceParticipantAssignment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AssuranceParticipantAssignment_assuranceCaseId_userId_role_key" ON "AssuranceParticipantAssignment"("assuranceCaseId", "userId", "role");
CREATE INDEX "AssuranceParticipantAssignment_organizationId_assuranceCaseId_active_idx" ON "AssuranceParticipantAssignment"("organizationId", "assuranceCaseId", "active");
ALTER TABLE "AssuranceParticipantAssignment" ADD CONSTRAINT "AssuranceParticipantAssignment_case_fkey" FOREIGN KEY ("organizationId", "assuranceCaseId") REFERENCES "AssuranceCase"("organizationId", "id") ON DELETE CASCADE ON UPDATE RESTRICT;

CREATE TABLE "AssuranceApplicabilityDecision" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "assuranceCaseId" TEXT NOT NULL,
  "status" "AssuranceApplicabilityStatus" NOT NULL,
  "rationale" TEXT NOT NULL,
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "version" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssuranceApplicabilityDecision_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AssuranceApplicabilityDecision_organizationId_id_key" ON "AssuranceApplicabilityDecision"("organizationId", "id");
CREATE UNIQUE INDEX "AssuranceApplicabilityDecision_assuranceCaseId_version_key" ON "AssuranceApplicabilityDecision"("assuranceCaseId", "version");
CREATE INDEX "AssuranceApplicabilityDecision_organizationId_assuranceCaseId_idx" ON "AssuranceApplicabilityDecision"("organizationId", "assuranceCaseId");
ALTER TABLE "AssuranceApplicabilityDecision" ADD CONSTRAINT "AssuranceApplicabilityDecision_case_fkey" FOREIGN KEY ("organizationId", "assuranceCaseId") REFERENCES "AssuranceCase"("organizationId", "id") ON DELETE CASCADE ON UPDATE RESTRICT;
