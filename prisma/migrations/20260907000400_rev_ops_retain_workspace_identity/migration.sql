-- Referenced workspace keys must not cascade updates into append-only history.
-- Retain the existing delete behavior: runtime RLS blocks parent deletion,
-- while privileged synthetic-fixture cleanup can still remove the workspace.
BEGIN;

ALTER TABLE "RevOpsChange"
  DROP CONSTRAINT "RevOpsChange_organizationId_workspaceId_fkey";

ALTER TABLE "RevOpsChange"
  ADD CONSTRAINT "RevOpsChange_organizationId_workspaceId_fkey"
  FOREIGN KEY ("organizationId", "workspaceId")
  REFERENCES "RevOpsWorkspace"("organizationId", "id")
  ON DELETE CASCADE ON UPDATE RESTRICT;

COMMIT;
