create table if not exists org_artifact_kinds (
  id text primary key,
  canonical_id text not null,
  name text not null,
  aliases text not null default '',
  required integer not null default 1,
  nist_task text not null,
  control_ids text not null,
  owner_role text not null,
  agency text not null,
  hint text not null default ''
);

create table if not exists org_artifacts (
  id text primary key,
  kind_id text not null,
  org_id text not null,
  title text not null,
  body text not null,
  control_ids text not null,
  source text not null,
  url text,
  status text not null,
  updated_at timestamptz not null
);
create index if not exists org_artifacts_kind_idx on org_artifacts (kind_id);
create index if not exists org_artifacts_org_idx on org_artifacts (org_id);
