-- CreateEnum
CREATE TYPE "EpisodeStatus" AS ENUM ('ACTIVE', 'DISCHARGED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CaseEpisodeRelationship" AS ENUM ('ADMISSION_SOURCE', 'TRANSFER_SOURCE', 'READMISSION_SOURCE');

-- CreateEnum
CREATE TYPE "EpisodeAuthorizationRequirement" AS ENUM ('REQUIRED', 'NOT_REQUIRED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "EpisodeAuthorizationStatus" AS ENUM ('OPEN', 'CLOSED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "AuthorizationReviewType" AS ENUM ('INITIAL', 'CONCURRENT', 'RETROSPECTIVE', 'PEER_TO_PEER', 'APPEAL');

-- CreateEnum
CREATE TYPE "AuthorizationReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'WITHDRAWN', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AuthorizationDayOutcome" AS ENUM ('APPROVED', 'DENIED', 'PENDING');

-- CreateEnum
CREATE TYPE "DenialReasonCode" AS ENUM ('MISSING_AUTHORIZATION', 'LATE_REVIEW', 'DOCUMENTATION_GAP', 'LEVEL_OF_CARE_NOT_SUPPORTED', 'ELIGIBILITY_OR_COVERAGE', 'OTHER_CONTROLLED');

-- CreateEnum
CREATE TYPE "DocumentationGapCategory" AS ENUM ('MISSING_PROGRESS_NOTE', 'MISSING_PHYSICIAN_ORDER', 'MISSING_TREATMENT_PLAN', 'MISSING_RISK_UPDATE', 'MISSING_DISCHARGE_PLAN', 'MISSING_SIGNATURE_OR_ATTESTATION', 'INCONSISTENT_LEVEL_OF_CARE_SUPPORT', 'PAYER_REQUESTED_CLARIFICATION', 'OTHER_CONTROLLED');

-- CreateEnum
CREATE TYPE "DocumentationGapStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'DISPUTED', 'REOPENED', 'CANCELLED', 'SUPERSEDED');

-- CreateTable
CREATE TABLE "FacilityTimezoneConfiguration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "facilityProfileId" TEXT NOT NULL,
    "facilityTimezone" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceReferenceId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "supersededById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacilityTimezoneConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sourceCaseId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "programId" TEXT,
    "unitId" TEXT,
    "facilityTimezone" TEXT NOT NULL,
    "timezoneSource" TEXT NOT NULL,
    "timezoneSourceReferenceId" TEXT NOT NULL,
    "timezoneConfigurationId" TEXT,
    "admittedAt" TIMESTAMP(3) NOT NULL,
    "serviceDate" TEXT NOT NULL,
    "status" "EpisodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "acceptedFacilityResponseId" TEXT NOT NULL,
    "sourcePacketVersionId" TEXT,
    "sourceCustodyEventId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseEpisodeLink" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "relationship" "CaseEpisodeRelationship" NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL,
    "linkedByActorId" TEXT NOT NULL,
    "sourceAcceptanceId" TEXT NOT NULL,
    "sourcePacketVersionId" TEXT,
    "sourceCustodyEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseEpisodeLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EpisodeAuthorization" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "sourceCoverageId" TEXT,
    "sourcePreAdmissionAuthorizationId" TEXT,
    "levelOfCare" TEXT NOT NULL,
    "requirement" "EpisodeAuthorizationRequirement" NOT NULL,
    "effectiveStartDate" TEXT NOT NULL,
    "status" "EpisodeAuthorizationStatus" NOT NULL DEFAULT 'OPEN',
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EpisodeAuthorization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorizationReview" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "episodeAuthorizationId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "reviewType" "AuthorizationReviewType" NOT NULL,
    "requestedStartDate" TEXT NOT NULL,
    "requestedEndDate" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "decisionStatus" "AuthorizationReviewStatus" NOT NULL DEFAULT 'PENDING',
    "payerReferenceToken" TEXT,
    "recordedByActorId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "supersededByReviewId" TEXT,
    "correctionReasonCode" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthorizationReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorizationDayDecision" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "authorizationReviewId" TEXT NOT NULL,
    "episodeAuthorizationId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "outcome" "AuthorizationDayOutcome" NOT NULL,
    "denialReasonCode" "DenialReasonCode",
    "sourceEventId" TEXT NOT NULL,
    "supersededByEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthorizationDayDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentationGap" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "sourceAuthorizationReviewId" TEXT,
    "categoryCode" "DocumentationGapCategory" NOT NULL,
    "operationalSummary" TEXT,
    "status" "DocumentationGapStatus" NOT NULL DEFAULT 'OPEN',
    "dueAt" TIMESTAMP(3),
    "assignedRole" TEXT,
    "assignedUserId" TEXT,
    "recordedByActorId" TEXT NOT NULL,
    "resolvedByActorId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentationGap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentationGapStatusHistory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "documentationGapId" TEXT NOT NULL,
    "fromStatus" "DocumentationGapStatus",
    "toStatus" "DocumentationGapStatus" NOT NULL,
    "reasonCode" TEXT,
    "changedByActorId" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentationGapStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernedEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventTypeName" TEXT NOT NULL,
    "eventTypeVersion" INTEGER NOT NULL,
    "schemaName" TEXT NOT NULL,
    "schemaVersion" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "aggregateVersion" INTEGER NOT NULL,
    "caseId" TEXT,
    "episodeId" TEXT,
    "correlationId" TEXT NOT NULL,
    "causationId" TEXT,
    "correctionKind" TEXT NOT NULL,
    "supersedesEventId" TEXT,
    "reasonCode" TEXT,
    "classification" TEXT NOT NULL,
    "metricEligibility" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "envelope" JSONB NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GovernedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "governedEventId" TEXT NOT NULL,
    "eventTypeName" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FacilityTimezoneConfiguration_supersededById_key" ON "FacilityTimezoneConfiguration"("supersededById");

-- CreateIndex
CREATE INDEX "FacilityTimezoneConfiguration_organizationId_facilityProfil_idx" ON "FacilityTimezoneConfiguration"("organizationId", "facilityProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "FacilityTimezoneConfiguration_facilityProfileId_version_key" ON "FacilityTimezoneConfiguration"("facilityProfileId", "version");

-- CreateIndex
CREATE INDEX "Episode_organizationId_status_idx" ON "Episode"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Episode_sourceCaseId_idx" ON "Episode"("sourceCaseId");

-- CreateIndex
CREATE INDEX "Episode_facilityId_idx" ON "Episode"("facilityId");

-- CreateIndex
CREATE INDEX "CaseEpisodeLink_organizationId_caseId_idx" ON "CaseEpisodeLink"("organizationId", "caseId");

-- CreateIndex
CREATE INDEX "CaseEpisodeLink_episodeId_idx" ON "CaseEpisodeLink"("episodeId");

-- CreateIndex
CREATE UNIQUE INDEX "CaseEpisodeLink_organizationId_sourceAcceptanceId_key" ON "CaseEpisodeLink"("organizationId", "sourceAcceptanceId");

-- CreateIndex
CREATE UNIQUE INDEX "CaseEpisodeLink_caseId_episodeId_key" ON "CaseEpisodeLink"("caseId", "episodeId");

-- CreateIndex
CREATE INDEX "EpisodeAuthorization_organizationId_episodeId_idx" ON "EpisodeAuthorization"("organizationId", "episodeId");

-- CreateIndex
CREATE INDEX "EpisodeAuthorization_episodeId_status_idx" ON "EpisodeAuthorization"("episodeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AuthorizationReview_supersededByReviewId_key" ON "AuthorizationReview"("supersededByReviewId");

-- CreateIndex
CREATE INDEX "AuthorizationReview_organizationId_episodeId_idx" ON "AuthorizationReview"("organizationId", "episodeId");

-- CreateIndex
CREATE INDEX "AuthorizationReview_episodeAuthorizationId_idx" ON "AuthorizationReview"("episodeAuthorizationId");

-- CreateIndex
CREATE INDEX "AuthorizationDayDecision_organizationId_episodeId_idx" ON "AuthorizationDayDecision"("organizationId", "episodeId");

-- CreateIndex
CREATE INDEX "AuthorizationDayDecision_authorizationReviewId_idx" ON "AuthorizationDayDecision"("authorizationReviewId");

-- CreateIndex
CREATE INDEX "AuthorizationDayDecision_episodeAuthorizationId_idx" ON "AuthorizationDayDecision"("episodeAuthorizationId");

-- CreateIndex
CREATE INDEX "DocumentationGap_organizationId_episodeId_idx" ON "DocumentationGap"("organizationId", "episodeId");

-- CreateIndex
CREATE INDEX "DocumentationGap_episodeId_status_idx" ON "DocumentationGap"("episodeId", "status");

-- CreateIndex
CREATE INDEX "DocumentationGapStatusHistory_documentationGapId_changedAt_idx" ON "DocumentationGapStatusHistory"("documentationGapId", "changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GovernedEvent_supersedesEventId_key" ON "GovernedEvent"("supersedesEventId");

-- CreateIndex
CREATE INDEX "GovernedEvent_organizationId_aggregateType_aggregateId_idx" ON "GovernedEvent"("organizationId", "aggregateType", "aggregateId");

-- CreateIndex
CREATE INDEX "GovernedEvent_organizationId_episodeId_idx" ON "GovernedEvent"("organizationId", "episodeId");

-- CreateIndex
CREATE INDEX "GovernedEvent_organizationId_eventTypeName_idx" ON "GovernedEvent"("organizationId", "eventTypeName");

-- CreateIndex
CREATE UNIQUE INDEX "OutboxRecord_governedEventId_key" ON "OutboxRecord"("governedEventId");

-- CreateIndex
CREATE INDEX "OutboxRecord_organizationId_status_createdAt_idx" ON "OutboxRecord"("organizationId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "FacilityTimezoneConfiguration" ADD CONSTRAINT "FacilityTimezoneConfiguration_facilityProfileId_fkey" FOREIGN KEY ("facilityProfileId") REFERENCES "FacilityProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityTimezoneConfiguration" ADD CONSTRAINT "FacilityTimezoneConfiguration_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "FacilityTimezoneConfiguration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_sourceCaseId_fkey" FOREIGN KEY ("sourceCaseId") REFERENCES "BehavioralHealthCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "FacilityProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_timezoneConfigurationId_fkey" FOREIGN KEY ("timezoneConfigurationId") REFERENCES "FacilityTimezoneConfiguration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseEpisodeLink" ADD CONSTRAINT "CaseEpisodeLink_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "BehavioralHealthCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseEpisodeLink" ADD CONSTRAINT "CaseEpisodeLink_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpisodeAuthorization" ADD CONSTRAINT "EpisodeAuthorization_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizationReview" ADD CONSTRAINT "AuthorizationReview_episodeAuthorizationId_fkey" FOREIGN KEY ("episodeAuthorizationId") REFERENCES "EpisodeAuthorization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizationReview" ADD CONSTRAINT "AuthorizationReview_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizationReview" ADD CONSTRAINT "AuthorizationReview_supersededByReviewId_fkey" FOREIGN KEY ("supersededByReviewId") REFERENCES "AuthorizationReview"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizationDayDecision" ADD CONSTRAINT "AuthorizationDayDecision_authorizationReviewId_fkey" FOREIGN KEY ("authorizationReviewId") REFERENCES "AuthorizationReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizationDayDecision" ADD CONSTRAINT "AuthorizationDayDecision_episodeAuthorizationId_fkey" FOREIGN KEY ("episodeAuthorizationId") REFERENCES "EpisodeAuthorization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizationDayDecision" ADD CONSTRAINT "AuthorizationDayDecision_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentationGap" ADD CONSTRAINT "DocumentationGap_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentationGapStatusHistory" ADD CONSTRAINT "DocumentationGapStatusHistory_documentationGapId_fkey" FOREIGN KEY ("documentationGapId") REFERENCES "DocumentationGap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxRecord" ADD CONSTRAINT "OutboxRecord_governedEventId_fkey" FOREIGN KEY ("governedEventId") REFERENCES "GovernedEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "LegalStatusRecord_authorizingLicenseBoard_authorizingLicense_id" RENAME TO "LegalStatusRecord_authorizingLicenseBoard_authorizingLicens_idx";
