-- CreateIndex
CREATE INDEX "EvidenceItem_contradictionGroupId_idx" ON "EvidenceItem"("contradictionGroupId");

-- CreateIndex
CREATE INDEX "EvidenceItem_supersededById_idx" ON "EvidenceItem"("supersededById");
