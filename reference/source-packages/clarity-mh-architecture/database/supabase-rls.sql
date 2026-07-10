-- Starting Supabase RLS/audit posture for Clarity MH.
-- Adapt table names to generated schema and existing repo conventions.
-- Do not deploy without security review.

-- Required assumptions:
-- 1. auth.users is used for identity.
-- 2. public.user_profiles maps auth.uid() to organization_id, facility_id, and role.
-- 3. Every tenant-owned table includes organization_id.

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null,
  facility_id uuid,
  role text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.current_org_id()
returns uuid
language sql
security definer
stable
as $$
  select organization_id from public.user_profiles where id = auth.uid() and active = true
$$;

create or replace function public.current_role()
returns text
language sql
security definer
stable
as $$
  select role from public.user_profiles where id = auth.uid() and active = true
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select public.current_role() in ('super_admin','org_admin','facility_admin')
$$;

-- Example pattern for tenant-owned tables:
-- alter table public.intake_cases enable row level security;
-- create policy "tenant can read own cases" on public.intake_cases
--   for select using (organization_id = public.current_org_id());
-- create policy "tenant can insert own cases" on public.intake_cases
--   for insert with check (organization_id = public.current_org_id());
-- create policy "authorized roles can update own cases" on public.intake_cases
--   for update using (
--     organization_id = public.current_org_id()
--     and public.current_role() in ('org_admin','facility_admin','intake_director','lead_intake_clinician','intake_coordinator')
--   );

-- Custody ledger should be append-only.
-- create policy "tenant can read custody events" on public.custody_ledger_events
--   for select using (organization_id = public.current_org_id());
-- create policy "authorized can insert custody events" on public.custody_ledger_events
--   for insert with check (
--     organization_id = public.current_org_id()
--     and public.current_role() in ('org_admin','facility_admin','intake_director','lead_intake_clinician','psychiatrist_reviewer','coroner_user','compliance_auditor')
--   );
-- Do not create update/delete policies for custody ledger.

-- Audit logs should be append-only and tenant-readable by compliance/admin roles.
-- Do not create update/delete policies for audit logs.
