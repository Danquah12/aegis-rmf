create table if not exists package_artifacts (
  id text primary key,
  system_id text not null references systems(id),
  kind text not null,
  title text not null,
  status text not null,
  source text not null,
  updated_at date not null
);
create index if not exists artifacts_system_idx on package_artifacts (system_id);

create table if not exists workflow_events (
  id text primary key,
  system_id text not null references systems(id),
  gate text not null,
  actor text not null,
  action text not null,
  notes text not null,
  created_at timestamptz not null default now()
);
create index if not exists workflow_system_idx on workflow_events (system_id);

create table if not exists test_results (
  id text primary key,
  system_id text not null references systems(id),
  control_id text not null,
  method text not null,
  objective text not null,
  result text not null,
  comments text not null,
  automated boolean not null default false
);
create index if not exists tests_system_idx on test_results (system_id);

create table if not exists interconnections (
  id text primary key,
  system_id text not null references systems(id),
  partner text not null,
  kind text not null,
  agreement text not null,
  data_flow text not null,
  status text not null
);
create index if not exists interconnect_system_idx on interconnections (system_id);
