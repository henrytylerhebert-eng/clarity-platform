-- CreateEnum
CREATE TYPE "PrescreenEncounterStatus" AS ENUM ('DRAFT', 'ATTESTED', 'SUBMITTED', 'CENTRAL_INTAKE_REVIEW', 'NEEDS_INFORMATION', 'AUTHORIZED_REVIEW', 'FACILITY_ROUTING', 'TRANSPORT_PLANNING', 'HANDED_OFF', 'REDIRECTED', 'DECLINED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PrescreenAssessmentStatus" AS ENUM ('DRAFT', 'ATTESTED', 'CORRECTED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "PatientWillingness" AS ENUM ('WILLING', 'NON_OPPOSED', 'OPPOSED', 'UNABLE_TO_EXPRESS', 'FLUCTUATING', 'UNKNOWN', 'NOT_ASSESSED');

-- CreateEnum
CREATE TYPE "PossiblePathway" AS ENUM ('POSSIBLE_FORMAL_VOLUNTARY_REVIEW', 'POSSIBLE_NONCONTESTED_PATHWAY', 'EMERGENCY_OR_LEGAL_REVIEW_REQUIRED', 'MEDICAL_STABILIZATION_REQUIRED', 'COMMUNITY_OR_OTHER_DISPOSITION', 'UNDETERMINED');

-- CreateEnum
CREATE TYPE "PrescreenReadinessTarget" AS ENUM ('CENTRAL_INTAKE_REVIEW', 'AUTHORIZED_PRACTITIONER_REVIEW', 'FACILITY_ROUTING', 'TRANSPORT_PLANNING', 'RECEIVING_HANDOFF');

-- CreateEnum
CREATE TYPE "PacketRequirementState" AS ENUM ('NOT_STARTED', 'REQUESTED', 'RECEIVED', 'UNDER_REVIEW', 'ACCEPTED_FOR_PACKET', 'MISSING', 'UNAVAILABLE_WITH_REASON', 'NOT_APPLICABLE_WITH_AUTHORITY', 'NEEDS_CLARIFICATION', 'STALE', 'SUPERSEDED');

-- AlterTable
ALTER TABLE "CommandIdempotencyRecord" ADD COLUMN     "requestFingerprint" TEXT;

-- CreateTable
CREATE TABLE "PrescreenEncounter" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "status" "PrescreenEncounterStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "currentLocation" TEXT NOT NULL,
    "presentingConcern" TEXT NOT NULL,
    "currentAssessmentVersionId" TEXT,
    "possiblePathway" "PossiblePathway" NOT NULL DEFAULT 'UNDETERMINED',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "insertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrescreenEncounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescreenAssessmentVersion" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assessmentVersionId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "PrescreenAssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "attestedAt" TIMESTAMP(3),
    "attestedBy" TEXT,
    "parentVersionId" TEXT,
    "changeReason" TEXT,
    "willingness" "PatientWillingness" NOT NULL,
    "orientation" JSONB NOT NULL,
    "immediateMedicalStabilizationRequired" BOOLEAN NOT NULL DEFAULT false,
    "activeEmergencyOrLegalProcess" BOOLEAN NOT NULL DEFAULT false,
    "possiblePathway" "PossiblePathway" NOT NULL,
    "answers" JSONB NOT NULL,
    "sources" JSONB NOT NULL,
    "contentHash" TEXT,
    "insertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrescreenAssessmentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescreenPacketRequirement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "requirementCode" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "state" "PacketRequirementState" NOT NULL,
    "blockingTargets" "PrescreenReadinessTarget"[],
    "responsibleRoleCode" TEXT,
    "resolutionWorkspace" TEXT NOT NULL,
    "sourceRuleId" TEXT NOT NULL,
    "sourceRuleVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrescreenPacketRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescreenSubmission" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "assessmentVersionId" TEXT NOT NULL,
    "target" "PrescreenReadinessTarget" NOT NULL,
    "receivingOrganizationId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrescreenSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PrescreenEncounter_organizationId_status_idx" ON "PrescreenEncounter"("organizationId", "status");

-- CreateIndex
CREATE INDEX "PrescreenEncounter_organizationId_caseId_idx" ON "PrescreenEncounter"("organizationId", "caseId");

-- CreateIndex
CREATE INDEX "PrescreenAssessmentVersion_organizationId_encounterId_idx" ON "PrescreenAssessmentVersion"("organizationId", "encounterId");

-- CreateIndex
CREATE UNIQUE INDEX "PrescreenAssessmentVersion_organizationId_assessmentVersion_key" ON "PrescreenAssessmentVersion"("organizationId", "assessmentVersionId");

-- CreateIndex
CREATE INDEX "PrescreenPacketRequirement_organizationId_encounterId_idx" ON "PrescreenPacketRequirement"("organizationId", "encounterId");

-- CreateIndex
CREATE UNIQUE INDEX "PrescreenPacketRequirement_organizationId_encounterId_requi_key" ON "PrescreenPacketRequirement"("organizationId", "encounterId", "requirementCode");

-- CreateIndex
CREATE UNIQUE INDEX "PrescreenSubmission_encounterId_key" ON "PrescreenSubmission"("encounterId");

-- CreateIndex
CREATE INDEX "PrescreenSubmission_organizationId_idx" ON "PrescreenSubmission"("organizationId");

-- AddForeignKey
ALTER TABLE "PrescreenEncounter" ADD CONSTRAINT "PrescreenEncounter_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "BehavioralHealthCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescreenAssessmentVersion" ADD CONSTRAINT "PrescreenAssessmentVersion_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "PrescreenEncounter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescreenPacketRequirement" ADD CONSTRAINT "PrescreenPacketRequirement_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "PrescreenEncounter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescreenSubmission" ADD CONSTRAINT "PrescreenSubmission_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "PrescreenEncounter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

