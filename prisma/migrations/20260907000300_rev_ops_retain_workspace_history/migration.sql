-- Direct workspace deletion would cascade to the append-only change journal.
-- Ordinary application roles can read/create/update scoped workspaces, not delete.
DROP POLICY "RevOpsWorkspace_tenant_isolation" ON "RevOpsWorkspace";
CREATE POLICY "RevOpsWorkspace_tenant_read" ON "RevOpsWorkspace" FOR SELECT
USING ("organizationId" = current_setting('app.current_organization_id', true));
CREATE POLICY "RevOpsWorkspace_tenant_create" ON "RevOpsWorkspace" FOR INSERT
WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));
CREATE POLICY "RevOpsWorkspace_tenant_update" ON "RevOpsWorkspace" FOR UPDATE
USING ("organizationId" = current_setting('app.current_organization_id', true))
WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));
