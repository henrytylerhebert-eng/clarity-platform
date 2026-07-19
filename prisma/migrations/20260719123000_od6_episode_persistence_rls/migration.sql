-- OD-6 bounded slice: defense-in-depth RLS for episode persistence records.
--
-- The application remains responsible for deriving organizationId from the
-- authenticated principal. These policies add a database boundary for the
-- episode-owned S2 records and fail closed when the transaction-local
-- app.current_organization_id setting is absent.
--
-- This migration intentionally does not enable RLS across the existing case
-- repository. That broader rollout requires every repository transaction and
-- inherited/global model policy to be reviewed together.

DO $$
DECLARE
  table_name text;
  protected_tables text[] := ARRAY[
    'FacilityTimezoneConfiguration',
    'Episode',
    'CaseEpisodeLink',
    'EpisodeAuthorization',
    'AuthorizationReview',
    'AuthorizationDayDecision',
    'DocumentationGap',
    'DocumentationGapStatusHistory',
    'GovernedEvent',
    'OutboxRecord'
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
