-- CreateTable
CREATE TABLE "NetworkReviewRun" (
    "runId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "schemaVersion" TEXT NOT NULL,
    "inputIdentity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "createdByActorId" TEXT NOT NULL,
    "correlationId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supersededByRunId" TEXT,
    "supersedesRunId" TEXT,

    CONSTRAINT "NetworkReviewRun_pkey" PRIMARY KEY ("runId")
);

-- CreateTable
CREATE TABLE "NetworkEntityCandidate" (
    "candidateId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "enrichmentRunId" TEXT NOT NULL,
    "candidateEntityType" TEXT NOT NULL,
    "requestedName" TEXT NOT NULL,
    "requestedLocation" TEXT NOT NULL,
    "normalizedSignals" JSONB NOT NULL,
    "candidateCanonicalReferenceId" TEXT,
    "candidateCanonicalReferenceType" TEXT,
    "resolutionStatus" TEXT NOT NULL,
    "resolutionConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "resolutionSummary" TEXT,
    "ambiguityReason" TEXT,
    "candidateState" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkEntityCandidate_pkey" PRIMARY KEY ("candidateId")
);

-- CreateTable
CREATE TABLE "NetworkReviewPackage" (
    "reviewPackageId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "enrichmentRunId" TEXT NOT NULL,
    "networkEntityCandidateId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "sourceCandidateId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "submittedByActorId" TEXT NOT NULL,
    "assignedReviewerCategory" JSONB,
    "sourceRunId" TEXT,
    "packageStatusReason" TEXT,
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,
    "terminalReason" TEXT,
    "supersedesPackageId" TEXT,
    "supersededByPackageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkReviewPackage_pkey" PRIMARY KEY ("reviewPackageId")
);

-- CreateTable
CREATE TABLE "NetworkReview" (
    "reviewId" TEXT NOT NULL,
    "reviewPackageId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "sourceCandidateId" TEXT NOT NULL,
    "fieldPath" TEXT NOT NULL,
    "sensitivityCategory" TEXT NOT NULL DEFAULT 'NORMAL_OPERATIONAL',
    "requiredCanonicalRoles" JSONB NOT NULL,
    "createdByActorId" TEXT NOT NULL,
    "currentValue" JSONB,
    "proposedValue" JSONB,
    "sourceReviewerRoles" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "reviewPackageStatus" TEXT,
    "reviewPackageRole" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "reviewRunId" TEXT,
    "valueType" TEXT,
    "valueSource" TEXT,
    "canonicalSnapshot" JSONB,
    "candidateValueType" TEXT,
    "freshnessState" TEXT,
    "sourceEffectiveDate" TIMESTAMP(3),
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByActorId" TEXT,
    "reviewReason" TEXT,
    "supersedesReviewId" TEXT,
    "supersededByReviewId" TEXT,
    "terminalReason" TEXT,
    "isCurrentVersion" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkReview_pkey" PRIMARY KEY ("reviewId")
);

-- CreateTable
CREATE TABLE "NetworkReviewAudit" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "commandId" TEXT NOT NULL,
    "correlationId" TEXT,
    "reason" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkReviewAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkReviewEvidence" (
    "evidenceId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceAuthorityTier" TEXT,
    "sourceTitle" TEXT,
    "sourceUrl" TEXT,
    "sourceScope" TEXT,
    "sourceStatus" TEXT NOT NULL,
    "sourceEffectiveDate" TIMESTAMP(3),
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "confidence" DOUBLE PRECISION,
    "excerpt" TEXT,
    "sourceHash" TEXT,
    "originatingRunId" TEXT,
    "createdByActorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkReviewEvidence_pkey" PRIMARY KEY ("evidenceId")
);

-- CreateTable
CREATE TABLE "NetworkReviewFieldEvidence" (
    "reviewId" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkReviewFieldEvidence_pkey" PRIMARY KEY ("reviewId","evidenceId")
);

-- CreateTable
CREATE TABLE "NetworkReviewConflict" (
    "conflictId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reviewPackageId" TEXT NOT NULL,
    "fieldPath" TEXT NOT NULL,
    "conflictType" TEXT NOT NULL,
    "requiredReviewerCategory" JSONB,
    "reason" TEXT,
    "relatedReviewIds" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolutionDecision" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkReviewConflict_pkey" PRIMARY KEY ("conflictId")
);

-- CreateTable
CREATE TABLE "NetworkReviewReplay" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "commandType" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "commandFingerprint" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkReviewReplay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NetworkReviewRun_organizationId_idx" ON "NetworkReviewRun"("organizationId");

-- CreateIndex
CREATE INDEX "NetworkReviewRun_organizationId_status_idx" ON "NetworkReviewRun"("organizationId", "status");

-- CreateIndex
CREATE INDEX "NetworkEntityCandidate_organizationId_enrichmentRunId_idx" ON "NetworkEntityCandidate"("organizationId", "enrichmentRunId");

-- CreateIndex
CREATE INDEX "NetworkEntityCandidate_organizationId_candidateEntityType_idx" ON "NetworkEntityCandidate"("organizationId", "candidateEntityType");

-- CreateIndex
CREATE INDEX "NetworkReviewPackage_organizationId_caseId_idx" ON "NetworkReviewPackage"("organizationId", "caseId");

-- CreateIndex
CREATE INDEX "NetworkReviewPackage_organizationId_status_idx" ON "NetworkReviewPackage"("organizationId", "status");

-- CreateIndex
CREATE INDEX "NetworkReviewPackage_organizationId_sourceCandidateId_idx" ON "NetworkReviewPackage"("organizationId", "sourceCandidateId");

-- CreateIndex
CREATE INDEX "NetworkReviewPackage_organizationId_enrichmentRunId_idx" ON "NetworkReviewPackage"("organizationId", "enrichmentRunId");

-- CreateIndex
CREATE INDEX "NetworkReviewPackage_organizationId_networkEntityCandidateI_idx" ON "NetworkReviewPackage"("organizationId", "networkEntityCandidateId");

-- CreateIndex
CREATE INDEX "NetworkReview_organizationId_reviewPackageId_idx" ON "NetworkReview"("organizationId", "reviewPackageId");

-- CreateIndex
CREATE INDEX "NetworkReview_organizationId_caseId_idx" ON "NetworkReview"("organizationId", "caseId");

-- CreateIndex
CREATE INDEX "NetworkReview_organizationId_status_idx" ON "NetworkReview"("organizationId", "status");

-- CreateIndex
CREATE INDEX "NetworkReview_organizationId_fieldPath_idx" ON "NetworkReview"("organizationId", "fieldPath");

-- CreateIndex
CREATE INDEX "NetworkReview_organizationId_reviewRunId_idx" ON "NetworkReview"("organizationId", "reviewRunId");

-- CreateIndex
CREATE INDEX "NetworkReviewAudit_organizationId_reviewId_idx" ON "NetworkReviewAudit"("organizationId", "reviewId");

-- CreateIndex
CREATE INDEX "NetworkReviewAudit_organizationId_occurredAt_idx" ON "NetworkReviewAudit"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "NetworkReviewEvidence_organizationId_evidenceType_idx" ON "NetworkReviewEvidence"("organizationId", "evidenceType");

-- CreateIndex
CREATE INDEX "NetworkReviewEvidence_organizationId_sourceType_idx" ON "NetworkReviewEvidence"("organizationId", "sourceType");

-- CreateIndex
CREATE INDEX "NetworkReviewFieldEvidence_organizationId_reviewId_idx" ON "NetworkReviewFieldEvidence"("organizationId", "reviewId");

-- CreateIndex
CREATE INDEX "NetworkReviewFieldEvidence_organizationId_evidenceId_idx" ON "NetworkReviewFieldEvidence"("organizationId", "evidenceId");

-- CreateIndex
CREATE INDEX "NetworkReviewConflict_organizationId_reviewPackageId_idx" ON "NetworkReviewConflict"("organizationId", "reviewPackageId");

-- CreateIndex
CREATE INDEX "NetworkReviewConflict_organizationId_status_idx" ON "NetworkReviewConflict"("organizationId", "status");

-- CreateIndex
CREATE INDEX "NetworkReviewConflict_organizationId_fieldPath_idx" ON "NetworkReviewConflict"("organizationId", "fieldPath");

-- CreateIndex
CREATE INDEX "NetworkReviewConflict_organizationId_conflictType_idx" ON "NetworkReviewConflict"("organizationId", "conflictType");

-- CreateIndex
CREATE INDEX "NetworkReviewReplay_organizationId_commandType_idempotencyK_idx" ON "NetworkReviewReplay"("organizationId", "commandType", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkReviewReplay_organizationId_commandType_idempotencyK_key" ON "NetworkReviewReplay"("organizationId", "commandType", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "NetworkEntityCandidate" ADD CONSTRAINT "NetworkEntityCandidate_enrichmentRunId_fkey" FOREIGN KEY ("enrichmentRunId") REFERENCES "NetworkReviewRun"("runId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkReviewPackage" ADD CONSTRAINT "NetworkReviewPackage_enrichmentRunId_fkey" FOREIGN KEY ("enrichmentRunId") REFERENCES "NetworkReviewRun"("runId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkReviewPackage" ADD CONSTRAINT "NetworkReviewPackage_networkEntityCandidateId_fkey" FOREIGN KEY ("networkEntityCandidateId") REFERENCES "NetworkEntityCandidate"("candidateId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkReview" ADD CONSTRAINT "NetworkReview_reviewPackageId_fkey" FOREIGN KEY ("reviewPackageId") REFERENCES "NetworkReviewPackage"("reviewPackageId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkReviewAudit" ADD CONSTRAINT "NetworkReviewAudit_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "NetworkReview"("reviewId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkReviewFieldEvidence" ADD CONSTRAINT "NetworkReviewFieldEvidence_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "NetworkReview"("reviewId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkReviewFieldEvidence" ADD CONSTRAINT "NetworkReviewFieldEvidence_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "NetworkReviewEvidence"("evidenceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkReviewConflict" ADD CONSTRAINT "NetworkReviewConflict_reviewPackageId_fkey" FOREIGN KEY ("reviewPackageId") REFERENCES "NetworkReviewPackage"("reviewPackageId") ON DELETE RESTRICT ON UPDATE CASCADE;
