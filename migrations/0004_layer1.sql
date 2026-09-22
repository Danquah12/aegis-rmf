create table if not exists organizations (
  id text primary key,
  name text not null,
  acronym text not null,
  kind text not null
);

create table if not exists programs (
  id text primary key,
  org_id text not null,
  name text not null,
  mission text not null
);

create table if not exists personnel (
  id text primary key,
  system_id text,
  org_id text not null,
  name text not null,
  role text not null,
  title text not null
);

create table if not exists risks (
  id text primary key,
  system_id text not null,
  title text not null,
  threat text not null,
  vulnerability text not null,
  asset_id text,
  control_id text not null,
  likelihood text not null,
  impact text not null,
  risk_level text not null,
  mitigation text not null,
  residual text not null,
  owner text not null,
  status text not null,
  acceptance_expires date
);
create index if not exists risks_system_idx on risks (system_id);

create table if not exists tickets (
  id text primary key,
  poam_id text,
  system_id text not null,
  source text not null,
  external_id text not null,
  title text not null,
  status text not null,
  assignee text not null,
  updated_at date not null
);

create table if not exists ssp_sections (
  id text primary key,
  system_id text not null,
  section_id text not null,
  title text not null,
  body text not null,
  source text not null,
  status text not null,
  updated_at date not null
);
create index if not exists ssp_system_idx on ssp_sections (system_id);

create table if not exists assessment_objectives (
  id text primary key,
  system_id text not null,
  control_id text not null,
  objective_id text not null,
  method text not null,
  result text not null,
  comments text not null,
  assessor text not null,
  updated_at date not null
);
create index if not exists obj_system_idx on assessment_objectives (system_id);

create table if not exists config_changes (
  id text primary key,
  system_id text not null,
  kind text not null,
  summary text not null,
  detected_at timestamptz not null,
  controls text not null,
  risk text not null,
  status text not null
);

create table if not exists authorization_history (
  id text primary key,
  system_id text not null,
  decision text not null,
  actor text not null,
  conditions text not null,
  expires_at date,
  created_at timestamptz not null default now()
);
