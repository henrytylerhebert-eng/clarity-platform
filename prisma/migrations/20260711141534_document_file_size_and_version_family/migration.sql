/*
  Warnings:

  - Added the required column `documentFamilyId` to the `SourceDocument` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileSizeBytes` to the `SourceDocument` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SourceDocument" ADD COLUMN     "documentFamilyId" TEXT NOT NULL,
ADD COLUMN     "fileSizeBytes" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "SourceDocument_documentFamilyId_idx" ON "SourceDocument"("documentFamilyId");
