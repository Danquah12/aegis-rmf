create table if not exists systems (
  id text primary key,
  name text not null,
  acronym text not null,
  mission text not null,
  impact_level text not null,
  ato_status text not null,
  ato_expires date,
  hosting text not null,
  cloud_provider text,
  owner_role text not null,
  isso_role text not null,
  ao_role text not null,
  authorization_boundary text not null,
  data_types text not null,
  rmf_step text not null,
  ssp_draft text,
  extra text not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists assets (
  id text primary key,
  system_id text not null references systems(id),
  name text not null,
  kind text not null,
  environment text not null,
  criticality text not null,
  internet_exposed boolean not null default false
);
create index if not exists assets_system_idx on assets (system_id);

create table if not exists vulnerabilities (
  id text primary key,
  system_id text not null references systems(id),
  asset_id text not null,
  cve text not null,
  title text not null,
  cvss numeric not null,
  severity text not null,
  kev boolean not null default false,
  control_ids text not null,
  status text not null
);
create index if not exists vulns_system_idx on vulnerabilities (system_id);

create table if not exists implementations (
  id text primary key,
  system_id text not null references systems(id),
  control_id text not null,
  status text not null,
  result text not null,
  statement text not null,
  confidence integer not null,
  last_verified date not null,
  responsible text not null
);
create index if not exists impl_system_idx on implementations (system_id);
create index if not exists impl_control_idx on implementations (control_id);

create table if not exists evidence (
  id text primary key,
  system_id text not null references systems(id),
  control_id text not null,
  title text not null,
  source text not null,
  method text not null,
  collected_at timestamptz not null,
  hash text not null,
  classification text not null,
  expires_at date,
  summary text not null
);
create index if not exists evidence_system_idx on evidence (system_id);

create table if not exists findings (
  id text primary key,
  system_id text not null references systems(id),
  control_id text not null,
  title text not null,
  severity text not null,
  status text not null,
  description text not null,
  impact text not null
);
create index if not exists findings_system_idx on findings (system_id);

create table if not exists poams (
  id text primary key,
  system_id text not null references systems(id),
  finding_id text,
  control_id text not null,
  weakness text not null,
  risk_level text not null,
  owner text not null,
  due_date date not null,
  status text not null,
  milestones text not null,
  resources text not null,
  compensating text,
  days_open integer not null
);
create index if not exists poams_system_idx on poams (system_id);

create table if not exists assessments (
  id text primary key,
  system_id text not null references systems(id),
  kind text not null,
  status text not null,
  assessor text not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  summary text not null
);

create table if not exists agent_runs (
  id text primary key,
  agent text not null,
  system_id text,
  status text not null,
  objective text not null,
  plan text not null,
  tools text not null,
  evidence text not null,
  decision text not null,
  confidence integer not null,
  created_at timestamptz not null default now(),
  requires_approval boolean not null default true
);

create table if not exists ask_messages (
  id text primary key,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);
