/*
  Warnings:

  - Added the required column `createdBy` to the `EvidenceItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creationMethod` to the `EvidenceItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `evidenceFamilyId` to the `EvidenceItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `EvidenceItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CommandIdempotencyRecord" ADD COLUMN     "objectId" TEXT;

-- AlterTable
ALTER TABLE "EvidenceItem" ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "creationMethod" TEXT NOT NULL,
ADD COLUMN     "evidenceFamilyId" TEXT NOT NULL,
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "reviewerNote" TEXT,
ADD COLUMN     "supersededById" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ContradictionGroup" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "classification" TEXT,
    "reviewNote" TEXT,
    "createdBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContradictionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContradictionGroup_organizationId_caseId_idx" ON "ContradictionGroup"("organizationId", "caseId");

-- CreateIndex
CREATE INDEX "EvidenceItem_organizationId_caseId_idx" ON "EvidenceItem"("organizationId", "caseId");

-- CreateIndex
CREATE INDEX "EvidenceItem_evidenceFamilyId_idx" ON "EvidenceItem"("evidenceFamilyId");

-- AddForeignKey
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "EvidenceItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_contradictionGroupId_fkey" FOREIGN KEY ("contradictionGroupId") REFERENCES "ContradictionGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContradictionGroup" ADD CONSTRAINT "ContradictionGroup_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "BehavioralHealthCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
