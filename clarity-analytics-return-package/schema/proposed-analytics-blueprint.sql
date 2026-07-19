-- Proposed and unverified.
-- PostgreSQL blueprint for the de-identified Clarity analytics mart.
-- This file is intentionally separate from the canonical Prisma transactional model.
-- It contains no raw patient name, MRN, DOB, address, payer reference, clinical note,
-- free-text documentation, or regulator-submission payload.
--
-- Deployment prerequisites that require owner/security approval:
--   * exact database/database-role topology;
--   * HMAC/tokenization key custody and rotation;
--   * retention and deletion schedules;
--   * minimum-cell threshold and complementary suppression rules;
--   * whether this schema shares a cluster with the operational store;
--   * grants and row-level-security bypass controls.

begin;

create schema if not exists analytics;
create schema if not exists analytics_lineage;

comment on schema analytics is
  'De-identified, tenant-scoped analytics mart. Dashboard roles receive no access to analytics_lineage.';
comment on schema analytics_lineage is
  'Restricted event-to-fact lineage. Identifiers can enable re-linkage and require a service or audited steward role.';

-- The API/worker must SET LOCAL app.organization_id for every tenant-owned transaction.
-- An empty or missing setting resolves to NULL and therefore matches no tenant rows.
create or replace function analytics.current_organization_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.organization_id', true), '')::uuid
$$;

create table if not exists analytics.dim_organization (
  organization_sk       bigint generated always as identity primary key,
  organization_id       uuid not null,
  organization_key      text not null,
  display_name          text not null,
  effective_from        date not null,
  effective_to          date,
  is_current            boolean not null default true,
  source_version        text not null,
  loaded_at             timestamptz not null default now(),
  constraint uq_dim_organization_version
    unique (organization_id, effective_from),
  constraint ck_dim_organization_dates
    check (effective_to is null or effective_to >= effective_from)
);

create table if not exists analytics.dim_facility (
  facility_sk           bigint generated always as identity primary key,
  organization_id       uuid not null,
  facility_id           uuid not null,
  facility_key          text not null,
  display_name          text not null,
  timezone_name         text not null,
  effective_from        date not null,
  effective_to          date,
  is_current            boolean not null default true,
  source_version        text not null,
  loaded_at             timestamptz not null default now(),
  constraint uq_dim_facility_version
    unique (organization_id, facility_id, effective_from),
  constraint ck_dim_facility_dates
    check (effective_to is null or effective_to >= effective_from)
);

create table if not exists analytics.dim_program (
  program_sk            bigint generated always as identity primary key,
  organization_id       uuid not null,
  facility_id           uuid not null,
  program_id            uuid not null,
  program_key           text not null,
  display_name          text not null,
  effective_from        date not null,
  effective_to          date,
  is_current            boolean not null default true,
  source_version        text not null,
  loaded_at             timestamptz not null default now(),
  constraint uq_dim_program_version
    unique (organization_id, program_id, effective_from),
  constraint ck_dim_program_dates
    check (effective_to is null or effective_to >= effective_from)
);

create table if not exists analytics.dim_unit (
  unit_sk               bigint generated always as identity primary key,
  organization_id       uuid not null,
  facility_id           uuid not null,
  program_id            uuid,
  unit_id               uuid not null,
  unit_key              text not null,
  display_name          text not null,
  effective_from        date not null,
  effective_to          date,
  is_current            boolean not null default true,
  source_version        text not null,
  loaded_at             timestamptz not null default now(),
  constraint uq_dim_unit_version
    unique (organization_id, unit_id, effective_from),
  constraint ck_dim_unit_dates
    check (effective_to is null or effective_to >= effective_from)
);

create table if not exists analytics.dim_payer (
  payer_sk              bigint generated always as identity primary key,
  organization_id       uuid not null,
  payer_token           text not null,
  payer_category        text not null,
  display_label         text,
  effective_from        date not null,
  effective_to          date,
  is_current            boolean not null default true,
  source_version        text not null,
  loaded_at             timestamptz not null default now(),
  constraint uq_dim_payer_version
    unique (organization_id, payer_token, effective_from),
  constraint ck_dim_payer_dates
    check (effective_to is null or effective_to >= effective_from)
);

create table if not exists analytics.dim_date (
  date_key               integer primary key,
  calendar_date          date not null unique,
  calendar_year          smallint not null,
  calendar_quarter       smallint not null,
  calendar_month         smallint not null,
  month_label            text not null,
  iso_week               smallint not null,
  day_of_week            smallint not null,
  is_weekend             boolean not null
);

create table if not exists analytics.metric_definition (
  metric_definition_id   uuid primary key,
  metric_key             text not null,
  version                integer not null,
  status                 text not null,
  display_name           text not null,
  description            text not null,
  grain                   text not null,
  numerator_definition   jsonb,
  denominator_definition jsonb,
  eligibility_rule       jsonb not null,
  dimension_allowlist    jsonb not null,
  source_event_types     jsonb not null,
  freshness_policy       jsonb not null,
  suppression_policy_key text not null,
  correction_policy      jsonb not null,
  owner_role             text not null,
  approved_by_actor_id   uuid,
  approved_at            timestamptz,
  effective_from         timestamptz,
  retired_at             timestamptz,
  definition_hash        text not null,
  created_at             timestamptz not null default now(),
  constraint uq_metric_definition_version unique (metric_key, version),
  constraint ck_metric_status check (
    status in ('DRAFT', 'VALIDATED', 'APPROVED', 'ACTIVE', 'RETIRED')
  ),
  constraint ck_metric_hash check (definition_hash ~ '^[0-9a-f]{64}$')
);

create table if not exists analytics.recompute_run (
  recompute_run_id       uuid primary key,
  organization_id       uuid not null,
  run_type               text not null,
  trigger_type           text not null,
  trigger_reference      text,
  requested_metric_keys  jsonb not null,
  requested_start_date   date,
  requested_end_date     date,
  source_watermark_start bigint,
  source_watermark_end   bigint,
  status                 text not null,
  started_at             timestamptz,
  completed_at           timestamptz,
  row_counts             jsonb not null default '{}'::jsonb,
  quality_summary        jsonb not null default '{}'::jsonb,
  error_code             text,
  error_detail_redacted  text,
  code_version           text not null,
  created_at             timestamptz not null default now(),
  constraint ck_recompute_status check (
    status in ('REQUESTED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED')
  ),
  constraint ck_recompute_dates check (
    requested_end_date is null
    or requested_start_date is null
    or requested_end_date >= requested_start_date
  )
);

create table if not exists analytics.fact_episode (
  episode_fact_id        bigint generated always as identity primary key,
  organization_id       uuid not null,
  episode_token         text not null,
  facility_sk           bigint not null references analytics.dim_facility(facility_sk),
  program_sk            bigint references analytics.dim_program(program_sk),
  unit_sk               bigint references analytics.dim_unit(unit_sk),
  admission_date_key     integer not null references analytics.dim_date(date_key),
  discharge_date_key     integer references analytics.dim_date(date_key),
  episode_status         text not null,
  source_watermark       bigint not null,
  metric_eligibility     text not null,
  data_quality_status    text not null,
  projection_version     integer not null,
  recompute_run_id       uuid not null references analytics.recompute_run(recompute_run_id),
  loaded_at              timestamptz not null default now(),
  constraint uq_fact_episode unique (organization_id, episode_token),
  constraint ck_episode_token check (episode_token ~ '^[A-Za-z0-9_-]{32,128}$'),
  constraint ck_fact_episode_status check (
    episode_status in ('ACTIVE', 'DISCHARGED', 'CLOSED')
  ),
  constraint ck_fact_episode_eligibility check (
    metric_eligibility in ('ELIGIBLE', 'INELIGIBLE', 'PENDING_REVIEW')
  )
);

create table if not exists analytics.fact_episode_day_authorization (
  episode_day_fact_id   bigint generated always as identity primary key,
  organization_id       uuid not null,
  episode_token         text not null,
  facility_sk           bigint not null references analytics.dim_facility(facility_sk),
  program_sk            bigint references analytics.dim_program(program_sk),
  unit_sk               bigint references analytics.dim_unit(unit_sk),
  service_date_key      integer not null references analytics.dim_date(date_key),
  day_ordinal           integer not null,
  coverage_status       text not null,
  is_at_risk             boolean not null,
  risk_reason_codes      text[] not null default '{}'::text[],
  review_due_date_key    integer references analytics.dim_date(date_key),
  decision_basis        text not null,
  metric_eligibility     text not null,
  data_quality_status    text not null,
  source_watermark       bigint not null,
  projection_version     integer not null,
  recompute_run_id       uuid not null references analytics.recompute_run(recompute_run_id),
  loaded_at              timestamptz not null default now(),
  constraint uq_episode_day_authorization
    unique (organization_id, episode_token, service_date_key, projection_version),
  constraint ck_coverage_status check (
    coverage_status in ('NOT_REQUIRED', 'APPROVED', 'DENIED', 'PENDING', 'EXPIRED', 'UNREQUESTED', 'UNKNOWN')
  ),
  constraint ck_day_eligibility check (
    metric_eligibility in ('ELIGIBLE', 'INELIGIBLE', 'PENDING_REVIEW')
  ),
  constraint ck_day_ordinal check (day_ordinal > 0)
);

create table if not exists analytics.fact_authorization_review (
  authorization_review_fact_id bigint generated always as identity primary key,
  organization_id       uuid not null,
  review_token           text not null,
  episode_token          text not null,
  facility_sk            bigint not null references analytics.dim_facility(facility_sk),
  program_sk             bigint references analytics.dim_program(program_sk),
  payer_sk               bigint references analytics.dim_payer(payer_sk),
  review_type            text not null,
  review_status          text not null,
  outcome                text not null,
  requested_start_date_key integer references analytics.dim_date(date_key),
  requested_end_date_key integer references analytics.dim_date(date_key),
  decided_start_date_key integer references analytics.dim_date(date_key),
  decided_end_date_key   integer references analytics.dim_date(date_key),
  requested_day_count    integer,
  approved_day_count     integer,
  denied_day_count       integer,
  review_due_date_key    integer references analytics.dim_date(date_key),
  decision_date_key      integer references analytics.dim_date(date_key),
  metric_eligibility     text not null,
  data_quality_status    text not null,
  is_current             boolean not null,
  source_watermark       bigint not null,
  projection_version     integer not null,
  recompute_run_id       uuid not null references analytics.recompute_run(recompute_run_id),
  loaded_at              timestamptz not null default now(),
  constraint uq_fact_authorization_review
    unique (organization_id, review_token, projection_version),
  constraint ck_review_token check (review_token ~ '^[A-Za-z0-9_-]{32,128}$'),
  constraint ck_review_type check (
    review_type in ('INITIAL', 'CONCURRENT', 'RETROSPECTIVE', 'PEER_TO_PEER', 'APPEAL')
  ),
  constraint ck_review_status check (
    review_status in ('DRAFT', 'ATTESTED', 'SUPERSEDED', 'VOIDED')
  ),
  constraint ck_review_outcome check (
    outcome in ('PENDING', 'APPROVED', 'DENIED', 'WITHDRAWN', 'UNKNOWN')
  ),
  constraint ck_review_counts check (
    (requested_day_count is null or requested_day_count >= 0)
    and (approved_day_count is null or approved_day_count >= 0)
    and (denied_day_count is null or denied_day_count >= 0)
  )
);

create table if not exists analytics.fact_documentation_gap (
  documentation_gap_fact_id bigint generated always as identity primary key,
  organization_id       uuid not null,
  gap_token             text not null,
  episode_token         text not null,
  facility_sk           bigint not null references analytics.dim_facility(facility_sk),
  program_sk            bigint references analytics.dim_program(program_sk),
  unit_sk               bigint references analytics.dim_unit(unit_sk),
  episode_day_date_key   integer references analytics.dim_date(date_key),
  gap_type_key           text not null,
  severity               text not null,
  gap_status             text not null,
  source_type            text not null,
  opened_date_key        integer not null references analytics.dim_date(date_key),
  due_date_key           integer references analytics.dim_date(date_key),
  resolved_date_key      integer references analytics.dim_date(date_key),
  age_bucket             text not null,
  metric_eligibility     text not null,
  data_quality_status    text not null,
  is_current             boolean not null,
  source_watermark       bigint not null,
  projection_version     integer not null,
  recompute_run_id       uuid not null references analytics.recompute_run(recompute_run_id),
  loaded_at              timestamptz not null default now(),
  constraint uq_fact_documentation_gap
    unique (organization_id, gap_token, projection_version),
  constraint ck_gap_token check (gap_token ~ '^[A-Za-z0-9_-]{32,128}$'),
  constraint ck_gap_severity check (severity in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  constraint ck_gap_status check (
    gap_status in ('OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'DISPUTED', 'REOPENED', 'CANCELLED', 'SUPERSEDED')
  ),
  constraint ck_gap_age_bucket check (
    age_bucket in ('NOT_DUE', 'DUE_TODAY', '1_2_DAYS', '3_6_DAYS', '7_PLUS_DAYS', 'UNKNOWN')
  )
);

create table if not exists analytics.metric_snapshot (
  metric_snapshot_id     bigint generated always as identity primary key,
  organization_id        uuid not null,
  metric_definition_id   uuid not null references analytics.metric_definition(metric_definition_id),
  facility_sk            bigint references analytics.dim_facility(facility_sk),
  program_sk             bigint references analytics.dim_program(program_sk),
  unit_sk                 bigint references analytics.dim_unit(unit_sk),
  period_start_date_key   integer not null references analytics.dim_date(date_key),
  period_end_date_key     integer not null references analytics.dim_date(date_key),
  allowed_dimensions      jsonb not null default '{}'::jsonb,
  value_numeric           numeric(20,6),
  numerator_value         numeric(20,6),
  denominator_value       numeric(20,6),
  result_status           text not null,
  suppression_status      text not null,
  suppression_reason      text,
  completeness_percent    numeric(5,2),
  source_coverage_status  text not null,
  data_quality_status     text not null,
  source_watermark        bigint not null,
  computed_at             timestamptz not null,
  stale_after             timestamptz not null,
  recompute_run_id        uuid not null references analytics.recompute_run(recompute_run_id),
  definition_hash         text not null,
  projection_version      integer not null,
  constraint ck_metric_period check (period_end_date_key >= period_start_date_key),
  constraint ck_result_status check (
    result_status in (
      'VALUE', 'ZERO', 'NO_MEASUREMENTS_FOUND', 'INSUFFICIENT_DENOMINATOR',
      'SUPPRESSED', 'PARTIAL', 'STALE', 'ERROR'
    )
  ),
  constraint ck_suppression_status check (
    suppression_status in ('NOT_APPLICABLE', 'NOT_SUPPRESSED', 'PRIMARY_SUPPRESSED', 'COMPLEMENTARY_SUPPRESSED')
  ),
  constraint ck_completeness check (
    completeness_percent is null
    or (completeness_percent >= 0 and completeness_percent <= 100)
  ),
  constraint ck_metric_value_shape check (
    (result_status in ('VALUE', 'ZERO') and value_numeric is not null)
    or (result_status not in ('VALUE', 'ZERO'))
  )
);

create unique index if not exists uq_metric_snapshot_scope
on analytics.metric_snapshot (
  organization_id,
  metric_definition_id,
  coalesce(facility_sk, 0),
  coalesce(program_sk, 0),
  coalesce(unit_sk, 0),
  period_start_date_key,
  period_end_date_key,
  md5(allowed_dimensions::text),
  projection_version
);

create table if not exists analytics.ingestion_watermark (
  ingestion_watermark_id bigint generated always as identity primary key,
  organization_id        uuid not null,
  consumer_name          text not null,
  consumer_version       text not null,
  partition_key          text not null,
  last_event_sequence    bigint not null,
  last_event_recorded_at timestamptz not null,
  projected_at           timestamptz not null,
  projection_lag_seconds integer not null,
  status                  text not null,
  detail_redacted         text,
  constraint uq_ingestion_watermark
    unique (organization_id, consumer_name, consumer_version, partition_key),
  constraint ck_watermark_status check (status in ('CURRENT', 'LAGGING', 'STALE', 'FAILED', 'PAUSED')),
  constraint ck_projection_lag check (projection_lag_seconds >= 0)
);

-- Restricted lineage: event IDs are not displayed by aggregate APIs, but permit audited
-- reconstruction and correction impact analysis. Dashboard/read-only mart roles receive
-- no USAGE on analytics_lineage and no SELECT on this table.
create table if not exists analytics_lineage.fact_source_event (
  fact_source_event_id  bigint generated always as identity primary key,
  organization_id      uuid not null,
  target_table         text not null,
  target_record_key    text not null,
  governed_event_id    uuid not null,
  governed_event_sequence bigint not null,
  governed_event_type  text not null,
  governed_event_version integer not null,
  correction_type      text not null,
  transformation_name  text not null,
  transformation_version text not null,
  recompute_run_id     uuid not null,
  linked_at            timestamptz not null default now(),
  constraint uq_fact_source_event
    unique (target_table, target_record_key, governed_event_id, transformation_version)
);

create table if not exists analytics_lineage.metric_snapshot_source (
  metric_snapshot_source_id bigint generated always as identity primary key,
  organization_id      uuid not null,
  metric_snapshot_id   bigint not null references analytics.metric_snapshot(metric_snapshot_id),
  source_fact_table    text not null,
  source_record_key    text not null,
  contribution_type    text not null,
  recompute_run_id     uuid not null,
  linked_at            timestamptz not null default now(),
  constraint uq_metric_snapshot_source
    unique (metric_snapshot_id, source_fact_table, source_record_key, contribution_type)
);

-- Tenant indexes. Cross-organization queries must not be enabled by adding a broad role;
-- they require a separately approved cohort materialization and release policy.
create index if not exists ix_fact_episode_scope
  on analytics.fact_episode (organization_id, facility_sk, program_sk, admission_date_key);
create index if not exists ix_fact_episode_day_auth_scope
  on analytics.fact_episode_day_authorization
  (organization_id, facility_sk, program_sk, service_date_key, coverage_status);
create index if not exists ix_fact_episode_day_auth_risk
  on analytics.fact_episode_day_authorization
  (organization_id, facility_sk, service_date_key, is_at_risk)
  where is_at_risk = true;
create index if not exists ix_fact_auth_review_scope
  on analytics.fact_authorization_review
  (organization_id, facility_sk, program_sk, review_due_date_key, outcome)
  where is_current = true;
create index if not exists ix_fact_gap_scope
  on analytics.fact_documentation_gap
  (organization_id, facility_sk, program_sk, gap_status, due_date_key)
  where is_current = true;
create index if not exists ix_metric_snapshot_scope_time
  on analytics.metric_snapshot
  (organization_id, metric_definition_id, period_end_date_key, computed_at desc);
create index if not exists ix_lineage_event
  on analytics_lineage.fact_source_event
  (organization_id, governed_event_sequence, governed_event_id);

-- Every tenant-owned mart table uses RLS. The application role must NOT own these tables,
-- must NOT have BYPASSRLS, and must use a transaction-local tenant setting.
alter table analytics.dim_organization enable row level security;
alter table analytics.dim_facility enable row level security;
alter table analytics.dim_program enable row level security;
alter table analytics.dim_unit enable row level security;
alter table analytics.dim_payer enable row level security;
alter table analytics.recompute_run enable row level security;
alter table analytics.fact_episode enable row level security;
alter table analytics.fact_episode_day_authorization enable row level security;
alter table analytics.fact_authorization_review enable row level security;
alter table analytics.fact_documentation_gap enable row level security;
alter table analytics.metric_snapshot enable row level security;
alter table analytics.ingestion_watermark enable row level security;
alter table analytics_lineage.fact_source_event enable row level security;
alter table analytics_lineage.metric_snapshot_source enable row level security;

alter table analytics.dim_organization force row level security;
alter table analytics.dim_facility force row level security;
alter table analytics.dim_program force row level security;
alter table analytics.dim_unit force row level security;
alter table analytics.dim_payer force row level security;
alter table analytics.recompute_run force row level security;
alter table analytics.fact_episode force row level security;
alter table analytics.fact_episode_day_authorization force row level security;
alter table analytics.fact_authorization_review force row level security;
alter table analytics.fact_documentation_gap force row level security;
alter table analytics.metric_snapshot force row level security;
alter table analytics.ingestion_watermark force row level security;
alter table analytics_lineage.fact_source_event force row level security;
alter table analytics_lineage.metric_snapshot_source force row level security;

-- Policy names are intentionally explicit so migration review can verify every table.
create policy tenant_dim_organization on analytics.dim_organization
  using (organization_id = analytics.current_organization_id())
  with check (organization_id = analytics.current_organization_id());
create policy tenant_dim_facility on analytics.dim_facility
  using (organization_id = analytics.current_organization_id())
  with check (organization_id = analytics.current_organization_id());
create policy tenant_dim_program on analytics.dim_program
  using (organization_id = analytics.current_organization_id())
  with check (organization_id = analytics.current_organization_id());
create policy tenant_dim_unit on analytics.dim_unit
  using (organization_id = analytics.current_organization_id())
  with check (organization_id = analytics.current_organization_id());
create policy tenant_dim_payer on analytics.dim_payer
  using (organization_id = analytics.current_organization_id())
  with check (organization_id = analytics.current_organization_id());
create policy tenant_recompute_run on analytics.recompute_run
  using (organization_id = analytics.current_organization_id())
  with check (organization_id = analytics.current_organization_id());
create policy tenant_fact_episode on analytics.fact_episode
  using (organization_id = analytics.current_organization_id())
  with check (organization_id = analytics.current_organization_id());
create policy tenant_fact_episode_day_auth on analytics.fact_episode_day_authorization
  using (organization_id = analytics.current_organization_id())
  with check (organization_id = analytics.current_organization_id());
create policy tenant_fact_auth_review on analytics.fact_authorization_review
  using (organization_id = analytics.current_organization_id())
  with check (organization_id = analytics.current_organization_id());
create policy tenant_fact_documentation_gap on analytics.fact_documentation_gap
  using (organization_id = analytics.current_organization_id())
  with check (organization_id = analytics.current_organization_id());
create policy tenant_metric_snapshot on analytics.metric_snapshot
  using (organization_id = analytics.current_organization_id())
  with check (organization_id = analytics.current_organization_id());
create policy tenant_ingestion_watermark on analytics.ingestion_watermark
  using (organization_id = analytics.current_organization_id())
  with check (organization_id = analytics.current_organization_id());
create policy tenant_fact_source_event on analytics_lineage.fact_source_event
  using (organization_id = analytics.current_organization_id())
  with check (organization_id = analytics.current_organization_id());
create policy tenant_metric_snapshot_source on analytics_lineage.metric_snapshot_source
  using (organization_id = analytics.current_organization_id())
  with check (organization_id = analytics.current_organization_id());

-- Approved read surfaces expose de-identified facts only. API code still applies facility,
-- program, unit, role, minimum-cell, complementary suppression, and purpose-of-use policy.
create or replace view analytics.v_current_episode_day_authorization as
select
  organization_id,
  episode_token,
  facility_sk,
  program_sk,
  unit_sk,
  service_date_key,
  day_ordinal,
  coverage_status,
  is_at_risk,
  risk_reason_codes,
  review_due_date_key,
  decision_basis,
  metric_eligibility,
  data_quality_status,
  source_watermark,
  projection_version,
  loaded_at
from analytics.fact_episode_day_authorization current_row
where projection_version = (
  select max(candidate.projection_version)
  from analytics.fact_episode_day_authorization candidate
  where candidate.organization_id = current_row.organization_id
    and candidate.episode_token = current_row.episode_token
    and candidate.service_date_key = current_row.service_date_key
);

create or replace view analytics.v_current_authorization_review as
select
  organization_id,
  review_token,
  episode_token,
  facility_sk,
  program_sk,
  payer_sk,
  review_type,
  review_status,
  outcome,
  requested_start_date_key,
  requested_end_date_key,
  decided_start_date_key,
  decided_end_date_key,
  requested_day_count,
  approved_day_count,
  denied_day_count,
  review_due_date_key,
  decision_date_key,
  metric_eligibility,
  data_quality_status,
  source_watermark,
  projection_version,
  loaded_at
from analytics.fact_authorization_review
where is_current = true;

create or replace view analytics.v_current_documentation_gap as
select
  organization_id,
  gap_token,
  episode_token,
  facility_sk,
  program_sk,
  unit_sk,
  episode_day_date_key,
  gap_type_key,
  severity,
  gap_status,
  source_type,
  opened_date_key,
  due_date_key,
  resolved_date_key,
  age_bucket,
  metric_eligibility,
  data_quality_status,
  source_watermark,
  projection_version,
  loaded_at
from analytics.fact_documentation_gap
where is_current = true;

-- Deliberately absent:
--   * patient_identity or raw person identifiers;
--   * free-text source narratives;
--   * browser-write grants;
--   * cross-organization cohort/benchmark tables;
--   * agency submission/export tables;
--   * raw payload landing tables.
-- Add any of these only through an approved ADR, threat model, privacy review, retention
-- schedule, authorization contract, and auditable release workflow.

commit;
