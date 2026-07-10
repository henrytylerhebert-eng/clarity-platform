-- Clarity Ops Intelligence — Schema Blueprint
-- This is a starter schema, not production-complete.

create table facility (
  facility_id uuid primary key,
  name text not null,
  state text,
  timezone text default 'America/Chicago',
  licensed_beds integer,
  created_at timestamptz default now()
);

create table program (
  program_id uuid primary key,
  facility_id uuid references facility(facility_id),
  name text not null,
  program_type text not null, -- inpatient, iop, php, crisis, residential
  age_group text, -- adult, geriatric, adolescent, child, mixed
  licensed_capacity integer,
  active boolean default true
);

create table patient_identity (
  patient_id uuid primary key,
  facility_id uuid references facility(facility_id),
  mrn text,
  legal_name text,
  dob date,
  sex_at_birth text,
  gender_identity text,
  created_at timestamptz default now()
);

create table episode (
  episode_id uuid primary key,
  patient_id uuid references patient_identity(patient_id),
  program_id uuid references program(program_id),
  admit_at timestamptz,
  discharge_at timestamptz,
  legal_status text,
  status text not null default 'active',
  admission_source text,
  discharge_disposition text
);

create table episode_day (
  episode_day_id uuid primary key,
  episode_id uuid references episode(episode_id),
  service_date date not null,
  program_id uuid references program(program_id),
  payer_id uuid,
  patient_day_flag integer default 1,
  revenue_day_flag integer default 1,
  census_status text,
  auth_status text,
  unique (episode_id, service_date)
);

create table admission_event (
  admission_event_id uuid primary key,
  episode_id uuid references episode(episode_id),
  admitted_at timestamptz not null,
  referral_source text,
  from_state text,
  admit_reason text
);

create table discharge_event (
  discharge_event_id uuid primary key,
  episode_id uuid references episode(episode_id),
  discharged_at timestamptz not null,
  disposition text,
  transfer_level text,
  los_days numeric
);

create table bed (
  bed_id uuid primary key,
  facility_id uuid references facility(facility_id),
  program_id uuid references program(program_id),
  unit_name text,
  room text,
  bed_label text,
  bed_type text,
  active boolean default true
);

create table bed_status_event (
  bed_status_event_id uuid primary key,
  bed_id uuid references bed(bed_id),
  event_at timestamptz not null,
  status text not null, -- available, occupied, blocked, cleaning, pending
  episode_id uuid references episode(episode_id),
  blocked_reason text,
  updated_by uuid
);

create table census_snapshot (
  census_snapshot_id uuid primary key,
  facility_id uuid references facility(facility_id),
  program_id uuid references program(program_id),
  snapshot_date date not null,
  census integer not null,
  available_beds integer,
  blocked_beds integer,
  pending_admissions integer,
  pending_discharges integer
);

create table payer (
  payer_id uuid primary key,
  name text not null,
  payer_type text, -- medicare, medicaid, mco, commercial, private_pay, indigent
  active boolean default true
);

create table payer_contract_rate (
  rate_rule_id uuid primary key,
  payer_id uuid references payer(payer_id),
  program_id uuid references program(program_id),
  effective_start date not null,
  effective_end date,
  rate_type text not null, -- per_diem, case_rate, group_rate, carveout
  amount numeric not null,
  rule_notes text
);

create table ur_authorization (
  auth_id uuid primary key,
  episode_id uuid references episode(episode_id),
  payer_id uuid references payer(payer_id),
  requested_days numeric,
  approved_days numeric,
  denied_days numeric,
  auth_start date,
  auth_end date,
  denial_reason text,
  reviewer text,
  status text,
  created_at timestamptz default now()
);

create table revenue_event (
  revenue_event_id uuid primary key,
  episode_day_id uuid references episode_day(episode_day_id),
  payer_id uuid references payer(payer_id),
  rate_rule_id uuid references payer_contract_rate(rate_rule_id),
  gross_projected numeric,
  adjustment numeric default 0,
  net_projected numeric,
  adjustment_reason text
);

create table iop_attendance (
  attendance_id uuid primary key,
  episode_id uuid references episode(episode_id),
  program_id uuid references program(program_id),
  service_date date not null,
  group_type text,
  units numeric,
  attended boolean,
  absent_reason text
);

create table staffing_role (
  role_id uuid primary key,
  program_id uuid references program(program_id),
  role_name text not null,
  default_daily_budget_hours numeric,
  default_hourly_rate numeric
);

create table staffing_actual (
  staffing_actual_id uuid primary key,
  role_id uuid references staffing_role(role_id),
  program_id uuid references program(program_id),
  work_date date not null,
  regular_hours numeric default 0,
  overtime_hours numeric default 0,
  agency_hours numeric default 0,
  pto_hours numeric default 0,
  training_hours numeric default 0,
  one_to_one_hours numeric default 0,
  hourly_rate numeric,
  agency_rate numeric
);

create table ancillary_rate (
  ancillary_rate_id uuid primary key,
  facility_id uuid references facility(facility_id),
  service_type text not null, -- housekeeping, laundry, dietary, iop_meals, fixed_maintenance
  unit_basis text not null, -- patient_day, attendance_day, monthly_fixed
  amount numeric not null,
  effective_start date not null,
  effective_end date
);

create table budget_line (
  budget_line_id uuid primary key,
  facility_id uuid references facility(facility_id),
  program_id uuid references program(program_id),
  period_start date not null,
  period_end date not null,
  metric_name text not null,
  budget_amount numeric not null
);

create table metric_snapshot (
  metric_snapshot_id uuid primary key,
  facility_id uuid references facility(facility_id),
  program_id uuid references program(program_id),
  period_start date,
  period_end date,
  metric_name text not null,
  metric_value numeric,
  calculated_at timestamptz default now()
);

create table audit_log (
  audit_id uuid primary key,
  actor_id uuid,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  before_hash text,
  after_hash text,
  created_at timestamptz default now()
);
