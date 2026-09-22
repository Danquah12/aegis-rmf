create table if not exists incidents (
  id text primary key,
  system_id text not null,
  title text not null,
  severity text not null,
  status text not null,
  summary text not null,
  asset_id text,
  control_ids text not null,
  ato_impact text not null,
  created_at timestamptz not null
);
create index if not exists incidents_system_idx on incidents (system_id);

create table if not exists policies (
  id text primary key,
  title text not null,
  status text not null,
  body text not null,
  controls text not null,
  source text not null,
  updated_at date not null
);

create table if not exists whatif_runs (
  id text primary key,
  system_id text not null,
  scenario text not null,
  result text not null,
  ato_impact text not null,
  created_at timestamptz not null
);

create table if not exists interviews (
  id text primary key,
  system_id text not null,
  control_id text not null,
  question text not null,
  answer text not null,
  flag text,
  assessor text not null,
  updated_at timestamptz not null
);

create table if not exists inheritance_proposals (
  id text primary key,
  system_id text not null,
  provider text not null,
  control_id text not null,
  rationale text not null,
  status text not null
);

create table if not exists cato_reviews (
  id text primary key,
  system_id text not null,
  state text not null,
  notes text not null,
  actor text not null,
  created_at timestamptz not null
);

create table if not exists audit_events (
  id text primary key,
  actor text not null,
  action text not null,
  object text not null,
  created_at timestamptz not null
);

create table if not exists academy_progress (
  id text primary key,
  lab_id text not null,
  status text not null,
  updated_at timestamptz not null
);
