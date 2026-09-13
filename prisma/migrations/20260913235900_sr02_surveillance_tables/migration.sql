-- SR-02 Surveillance vertical slice (Medication Room Handwashing Station).
-- Synthetic-only implementation; tenant isolation enforced with FORCE RLS.

CREATE TYPE "SurveillanceBlueprintStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE', 'UNDER_RE_REVIEW', 'SUPERSEDED', 'RETIRED');
CREATE TYPE "SurveillanceRoundStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "SurveillanceSceneStatus" AS ENUM ('PENDING_RESOLUTION', 'AWAITING_EVIDENCE', 'REVIEW_READY', 'UNDER_REVIEW', 'COMPLETED', 'BLOCKED');
CREATE TYPE "SurveillanceActivationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');
CREATE TYPE "SurveillanceEvidenceRequestStatus" AS ENUM ('REQUIRED_PENDING', 'SUBMITTED', 'ACCEPTED_FOR_ASSESSMENT', 'REJECTED_QUALITY', 'WAIVED', 'NOT_APPLICABLE');
CREATE TYPE "SurveillanceEvidenceType" AS ENUM ('CONTEXT_PHOTO', 'DETAIL_PHOTO', 'FUNCTIONAL_OBSERVATION', 'POLICY_DOCUMENT', 'SPATIAL_CONTEXT', 'ITEM_CLASSIFICATION');
CREATE TYPE "SurveillanceVerificationMode" AS ENUM ('VISUAL', 'FUNCTIONAL', 'DOCUMENTARY', 'MEASUREMENT', 'BEHAVIORAL', 'COMBINED');
CREATE TYPE "SurveillanceRequirementLevel" AS ENUM ('REQUIRED', 'CONDITIONAL', 'SUPPORTING', 'OPTIONAL');
CREATE TYPE "SurveillanceEvidenceStatus" AS ENUM ('AVAILABLE', 'ACCEPTED', 'REJECTED_QUALITY', 'SUPERSEDED');
CREATE TYPE "SurveillanceObservationSource" AS ENUM ('HUMAN', 'AI');
CREATE TYPE "SurveillanceCandidateStatus" AS ENUM ('CANDIDATE', 'NEEDS_MORE_EVIDENCE', 'SUBMITTED_FOR_REVIEW', 'ACCEPTED_FOR_FINDING', 'REJECTED');
CREATE TYPE "SurveillanceDecisionType" AS ENUM ('OBSERVATION_ACCEPTANCE', 'FINDING_DISPOSITION', 'CITATION_APPROVAL', 'SCOPE', 'EXCEPTION', 'CLOSURE', 'REOPEN', 'EVIDENCE_WAIVER');
CREATE TYPE "SurveillanceFindingStatus" AS ENUM ('OPEN', 'ACTION_IN_PROGRESS', 'COMPLETION_SUBMITTED', 'CLOSED', 'REOPENED');
CREATE TYPE "SurveillanceActionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETION_SUBMITTED', 'ACCEPTED_COMPLETE');
CREATE TYPE "SurveillanceTrendOutcome" AS ENUM ('UNRESOLVED', 'CORRECTED_DURING_ROUND', 'CORRECTED_AFTER_ACTION', 'ACCEPTED_CLOSED', 'NO_FINDING');

CREATE TABLE "SurveillanceBlueprint" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "canonicalName" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "sceneFamily" TEXT NOT NULL,
  "ownerRole" TEXT NOT NULL,
  "status" "SurveillanceBlueprintStatus" NOT NULL DEFAULT 'DRAFT',
  "activeVersionId" TEXT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SurveillanceBlueprint_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceBlueprintVersion" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "blueprintId" TEXT NOT NULL,
  "versionLabel" TEXT NOT NULL,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveTo" TIMESTAMP(3) NULL,
  "status" "SurveillanceBlueprintStatus" NOT NULL DEFAULT 'DRAFT',
  "changeReason" TEXT NOT NULL,
  "approvedBy" TEXT NULL,
  "approvedAt" TIMESTAMP(3) NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceBlueprintVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceApplicabilityProfile" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "blueprintVersionId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "rule" JSONB NOT NULL,
  "status" TEXT NOT NULL,
  "approvedBy" TEXT NULL,
  "approvedAt" TIMESTAMP(3) NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceApplicabilityProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceSceneVariant" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "blueprintVersionId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "selectionRule" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceSceneVariant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceReviewerPolicy" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "blueprintVersionId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "minimumRole" TEXT NOT NULL,
  "qualificationRule" TEXT NOT NULL,
  "reservedDecisions" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceReviewerPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceReviewerAssignment" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "authorityBasis" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "grantedBy" TEXT NOT NULL,
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceReviewerAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceCriterion" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "blueprintVersionId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "canonicalQuestion" TEXT NOT NULL,
  "plainLanguageExpectation" TEXT NOT NULL,
  "criterionType" TEXT NOT NULL,
  "materiality" TEXT NOT NULL,
  "activationRule" JSONB NOT NULL,
  "reviewerPolicyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceCriterion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceExpectedStateRule" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "criterionId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "statement" TEXT NOT NULL,
  "ruleType" TEXT NOT NULL,
  "basisStrength" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceExpectedStateRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceEvidenceRequirement" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "criterionId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "evidenceType" "SurveillanceEvidenceType" NOT NULL,
  "requirementLevel" "SurveillanceRequirementLevel" NOT NULL,
  "verificationMode" "SurveillanceVerificationMode" NOT NULL,
  "acceptanceRule" TEXT NOT NULL,
  "conditionalRule" JSONB NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceEvidenceRequirement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceCaptureStep" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "blueprintVersionId" TEXT NOT NULL,
  "criterionCode" TEXT NULL,
  "sequence" INTEGER NOT NULL,
  "evidenceType" "SurveillanceEvidenceType" NOT NULL,
  "instruction" TEXT NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT true,
  "viewGeometry" TEXT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceCaptureStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceAuthorityBinding" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "criterionId" TEXT NOT NULL,
  "sourceFamilyKey" TEXT NOT NULL,
  "versionLabel" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "citation" TEXT NOT NULL,
  "sourceRole" TEXT NOT NULL,
  "relationshipType" TEXT NOT NULL,
  "currentness" "AssuranceSourceCurrentness" NOT NULL,
  "rightsStatus" "AssuranceSourceRightsStatus" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceAuthorityBinding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceOrganizationRuleBinding" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "criterionId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "versionLabel" TEXT NOT NULL,
  "statement" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceOrganizationRuleBinding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceTrendIdentity" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "criterionId" TEXT NOT NULL,
  "canonicalKey" TEXT NOT NULL,
  "matchScope" TEXT NOT NULL,
  "rollupLevel" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceTrendIdentity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceRound" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "roundKey" TEXT NOT NULL,
  "facilityProfileId" TEXT NOT NULL,
  "roundType" TEXT NOT NULL DEFAULT 'SURVEILLANCE',
  "status" "SurveillanceRoundStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "startedBy" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3) NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SurveillanceRound_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceSceneInstance" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "roundId" TEXT NOT NULL,
  "blueprintVersionId" TEXT NOT NULL,
  "sceneVariantId" TEXT NULL,
  "sceneFamily" TEXT NOT NULL,
  "locationCode" TEXT NOT NULL,
  "facts" JSONB NOT NULL,
  "status" "SurveillanceSceneStatus" NOT NULL DEFAULT 'PENDING_RESOLUTION',
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SurveillanceSceneInstance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceApplicabilityResolution" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "sceneInstanceId" TEXT NOT NULL,
  "applicabilityProfileId" TEXT NOT NULL,
  "result" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "basisSnapshot" JSONB NOT NULL,
  "resolvedBy" TEXT NULL,
  "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceApplicabilityResolution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceCriterionRuntime" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "sceneInstanceId" TEXT NOT NULL,
  "criterionId" TEXT NOT NULL,
  "activationStatus" "SurveillanceActivationStatus" NOT NULL,
  "activationReason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceCriterionRuntime_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceEvidenceRequest" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "sceneInstanceId" TEXT NOT NULL,
  "criterionRuntimeId" TEXT NOT NULL,
  "evidenceRequirementId" TEXT NOT NULL,
  "status" "SurveillanceEvidenceRequestStatus" NOT NULL DEFAULT 'REQUIRED_PENDING',
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SurveillanceEvidenceRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceEvidenceArtifact" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "sceneInstanceId" TEXT NOT NULL,
  "evidenceRequestId" TEXT NULL,
  "evidenceType" "SurveillanceEvidenceType" NOT NULL,
  "status" "SurveillanceEvidenceStatus" NOT NULL DEFAULT 'AVAILABLE',
  "payload" JSONB NOT NULL,
  "contentHash" TEXT NOT NULL,
  "sourceSystem" TEXT NOT NULL,
  "sourceIdentifier" TEXT NULL,
  "submittedBy" TEXT NOT NULL,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceEvidenceArtifact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceEvidenceDerivation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "parentEvidenceId" TEXT NOT NULL,
  "derivedEvidenceId" TEXT NOT NULL,
  "transformationType" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceEvidenceDerivation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceObservation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "sceneInstanceId" TEXT NOT NULL,
  "criterionId" TEXT NOT NULL,
  "source" "SurveillanceObservationSource" NOT NULL,
  "objectiveDescription" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceObservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceInterpretationDescriptor" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "observationId" TEXT NOT NULL,
  "structuredFeatures" JSONB NOT NULL,
  "detectionConfidence" DOUBLE PRECISION NOT NULL,
  "interpretationConfidence" DOUBLE PRECISION NOT NULL,
  "impactConfidence" DOUBLE PRECISION NOT NULL,
  "abstentionReason" TEXT NULL,
  "modelMetadata" JSONB NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceInterpretationDescriptor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceEvidenceAssessment" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "sceneInstanceId" TEXT NOT NULL,
  "criterionId" TEXT NOT NULL,
  "result" "AssuranceEvaluationResult" NOT NULL,
  "reasonCodes" TEXT[] NOT NULL,
  "missingRequirementCodes" TEXT[] NOT NULL,
  "assessorType" TEXT NOT NULL,
  "assessorId" TEXT NOT NULL,
  "supersedesAssessmentId" TEXT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceEvidenceAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceCandidateVariance" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "sceneInstanceId" TEXT NOT NULL,
  "criterionId" TEXT NOT NULL,
  "observationId" TEXT NOT NULL,
  "evidenceAssessmentId" TEXT NOT NULL,
  "candidateDescription" TEXT NOT NULL,
  "createdByType" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "status" "SurveillanceCandidateStatus" NOT NULL DEFAULT 'CANDIDATE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SurveillanceCandidateVariance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceReviewPacket" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "candidateVarianceId" TEXT NOT NULL,
  "packetVersion" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "snapshotHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceReviewPacket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceDecisionRecord" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "reviewPacketId" TEXT NULL,
  "candidateVarianceId" TEXT NULL,
  "findingId" TEXT NULL,
  "decisionType" "SurveillanceDecisionType" NOT NULL,
  "decision" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "decidedBy" TEXT NOT NULL,
  "roleAtDecision" TEXT NOT NULL,
  "authorityBasis" TEXT NOT NULL,
  "supersedesDecisionId" TEXT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceDecisionRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceReviewedFinding" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "candidateVarianceId" TEXT NOT NULL,
  "reviewPacketId" TEXT NOT NULL,
  "status" "SurveillanceFindingStatus" NOT NULL DEFAULT 'OPEN',
  "currentVersion" INTEGER NOT NULL DEFAULT 1,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SurveillanceReviewedFinding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceFindingVersion" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "findingId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "expectedState" TEXT NOT NULL,
  "objectiveEvidence" TEXT NOT NULL,
  "observedVariance" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "authoredBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceFindingVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceFindingCitation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "findingId" TEXT NOT NULL,
  "findingVersionId" TEXT NOT NULL,
  "authorityBindingId" TEXT NOT NULL,
  "approvalDecisionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceFindingCitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceImmediateCorrection" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "candidateVarianceId" TEXT NULL,
  "findingId" TEXT NULL,
  "description" TEXT NOT NULL,
  "performedBy" TEXT NOT NULL,
  "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceImmediateCorrection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceCorrectiveAction" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "findingId" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "requiredAction" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3) NULL,
  "status" "SurveillanceActionStatus" NOT NULL DEFAULT 'OPEN',
  "completionNote" TEXT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SurveillanceCorrectiveAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceActionEvidence" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actionId" TEXT NOT NULL,
  "evidenceId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceActionEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SurveillanceTrendOccurrence" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "trendIdentityId" TEXT NOT NULL,
  "sceneInstanceId" TEXT NOT NULL,
  "criterionId" TEXT NOT NULL,
  "candidateVarianceId" TEXT NULL,
  "findingId" TEXT NULL,
  "outcome" "SurveillanceTrendOutcome" NOT NULL,
  "eventTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SurveillanceTrendOccurrence_pkey" PRIMARY KEY ("id")
);
