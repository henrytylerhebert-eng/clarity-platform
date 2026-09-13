-- CreateTable
CREATE TABLE "RevOpsRateRelease" (
    "id" TEXT NOT NULL,
    "programMethod" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveThrough" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "supersededById" TEXT,
    "recordedByOrganizationId" TEXT NOT NULL,
    "recordedBy" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevOpsRateRelease_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RevOpsRateRelease_releaseId_key" ON "RevOpsRateRelease"("releaseId");

-- CreateIndex
CREATE INDEX "RevOpsRateRelease_programMethod_status_effectiveFrom_effect_idx" ON "RevOpsRateRelease"("programMethod", "status", "effectiveFrom", "effectiveThrough");

-- AddForeignKey
ALTER TABLE "RevOpsRateRelease" ADD CONSTRAINT "RevOpsRateRelease_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "RevOpsRateRelease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

