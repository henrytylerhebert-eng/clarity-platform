-- CreateTable
CREATE TABLE "RevOpsWorkspace" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "state" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevOpsWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevOpsChange" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevOpsChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RevOpsWorkspace_organizationId_facilityId_unit_key" ON "RevOpsWorkspace"("organizationId", "facilityId", "unit");

-- CreateIndex
CREATE UNIQUE INDEX "RevOpsWorkspace_organizationId_id_key" ON "RevOpsWorkspace"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "RevOpsChange_organizationId_workspaceId_revision_key" ON "RevOpsChange"("organizationId", "workspaceId", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "FacilityProfile_organizationId_id_key" ON "FacilityProfile"("organizationId", "id");

-- AddForeignKey
ALTER TABLE "RevOpsWorkspace" ADD CONSTRAINT "RevOpsWorkspace_organizationId_facilityId_fkey" FOREIGN KEY ("organizationId", "facilityId") REFERENCES "FacilityProfile"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevOpsChange" ADD CONSTRAINT "RevOpsChange_organizationId_workspaceId_fkey" FOREIGN KEY ("organizationId", "workspaceId") REFERENCES "RevOpsWorkspace"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE;


DO $$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['RevOpsWorkspace','RevOpsChange'] LOOP
 EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY %I ON %I USING ("organizationId" = current_setting(''app.current_organization_id'',true)) WITH CHECK ("organizationId" = current_setting(''app.current_organization_id'',true))',t || '_tenant_isolation',t);
 END LOOP;
END $$;
