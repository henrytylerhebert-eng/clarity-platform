-- Prescreen Phase 3 bounded slice: defense-in-depth RLS for the prescreen
-- persistence records, mirroring 20260719123000_od6_episode_persistence_rls.
--
-- The application remains responsible for deriving organizationId from the
-- authenticated principal. These policies add a database boundary for the
-- prescreen-owned records and fail closed when the transaction-local
-- app.current_organization_id setting is absent.
--
-- This migration intentionally covers only the four new prescreen tables;
-- the broader-rollout caveats recorded in the OD-6 migration still apply.

DO $$
DECLARE
  table_name text;
  protected_tables text[] := ARRAY[
    'PrescreenEncounter',
    'PrescreenAssessmentVersion',
    'PrescreenPacketRequirement',
    'PrescreenSubmission'
  ];
BEGIN
  FOREACH table_name IN ARRAY protected_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON %I USING ("organizationId" = current_setting(''app.current_organization_id'', true)) WITH CHECK ("organizationId" = current_setting(''app.current_organization_id'', true))',
      table_name || '_tenant_isolation',
      table_name
    );
  END LOOP;
END
$$;
