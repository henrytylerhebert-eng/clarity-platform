BEGIN;

CREATE TABLE "IopSourceIntegration" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "integrationKey" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IopSourceIntegration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IopReconciliationImport" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "facilityId" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "integrationId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "snapshotHash" TEXT NOT NULL,
  "exportedAt" TIMESTAMP(3) NOT NULL,
  "cutoffAt" TIMESTAMP(3) NOT NULL,
  "sourceFileName" TEXT,
  "payload" JSONB NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "acceptedBy" TEXT NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IopReconciliationImport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IopReconciliationCloseReceipt" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "importId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reason" TEXT NOT NULL,
  "sourceCutoffAt" TIMESTAMP(3) NOT NULL,
  "issueCount" INTEGER NOT NULL,
  "reviewedCount" INTEGER NOT NULL,
  CONSTRAINT "IopReconciliationCloseReceipt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IopReconciliationExceptionReview" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "importId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "issueKey" TEXT NOT NULL,
  "disposition" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IopReconciliationExceptionReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IopSourceIntegration_organizationId_integrationKey_key" ON "IopSourceIntegration"("organizationId", "integrationKey");
CREATE INDEX "IopSourceIntegration_organizationId_active_idx" ON "IopSourceIntegration"("organizationId", "active");
CREATE UNIQUE INDEX "IopReconciliationImport_organizationId_idempotencyKey_key" ON "IopReconciliationImport"("organizationId", "idempotencyKey");
CREATE UNIQUE INDEX "IopReconciliationImport_organizationId_integrationId_snapshotHash_key" ON "IopReconciliationImport"("organizationId", "integrationId", "snapshotHash");
CREATE UNIQUE INDEX "IopReconciliationImport_organizationId_id_key" ON "IopReconciliationImport"("organizationId", "id");
CREATE INDEX "IopReconciliationImport_organizationId_facilityId_programId_cutoffAt_idx" ON "IopReconciliationImport"("organizationId", "facilityId", "programId", "cutoffAt");
CREATE UNIQUE INDEX "IopReconciliationCloseReceipt_organizationId_importId_key" ON "IopReconciliationCloseReceipt"("organizationId", "importId");
CREATE UNIQUE INDEX "IopReconciliationCloseReceipt_organizationId_idempotencyKey_key" ON "IopReconciliationCloseReceipt"("organizationId", "idempotencyKey");
CREATE INDEX "IopReconciliationCloseReceipt_organizationId_reviewedAt_idx" ON "IopReconciliationCloseReceipt"("organizationId", "reviewedAt");
CREATE UNIQUE INDEX "IopReconciliationExceptionReview_organizationId_idempotencyKey_key" ON "IopReconciliationExceptionReview"("organizationId", "idempotencyKey");
CREATE INDEX "IopReconciliationExceptionReview_organizationId_importId_issueKey_reviewedAt_idx" ON "IopReconciliationExceptionReview"("organizationId", "importId", "issueKey", "reviewedAt");

ALTER TABLE "IopReconciliationImport" ADD CONSTRAINT "IopReconciliationImport_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "IopSourceIntegration"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "IopReconciliationCloseReceipt" ADD CONSTRAINT "IopReconciliationCloseReceipt_organizationId_importId_fkey" FOREIGN KEY ("organizationId", "importId") REFERENCES "IopReconciliationImport"("organizationId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "IopReconciliationExceptionReview" ADD CONSTRAINT "IopReconciliationExceptionReview_organizationId_importId_fkey" FOREIGN KEY ("organizationId", "importId") REFERENCES "IopReconciliationImport"("organizationId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

COMMIT;
