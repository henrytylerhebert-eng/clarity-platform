-- Application database roles may read/append their own organization's journal,
-- but may not rewrite or delete history. Table owners/superusers remain trusted.
DROP POLICY "RevOpsChange_tenant_isolation" ON "RevOpsChange";
CREATE POLICY "RevOpsChange_tenant_read" ON "RevOpsChange" FOR SELECT
USING ("organizationId" = current_setting('app.current_organization_id', true));
CREATE POLICY "RevOpsChange_tenant_append" ON "RevOpsChange" FOR INSERT
WITH CHECK ("organizationId" = current_setting('app.current_organization_id', true));
