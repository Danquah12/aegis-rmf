create table if not exists connector_bindings (
  id text primary key,
  system_id text not null,
  connector_id text not null,
  status text not null,
  run_count integer not null default 0,
  last_run timestamptz,
  next_run timestamptz,
  last_summary text not null default '',
  unique (system_id, connector_id)
);
create index if not exists bindings_system_idx on connector_bindings (system_id);

create table if not exists collection_jobs (
  id text primary key,
  system_id text not null,
  connector_id text not null,
  status text not null,
  started_at timestamptz not null,
  finished_at timestamptz not null,
  evidence_count integer not null default 0,
  change_count integer not null default 0,
  finding_count integer not null default 0,
  summary text not null,
  mappings text not null
);
create index if not exists jobs_system_idx on collection_jobs (system_id, started_at desc);
