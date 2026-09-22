create table if not exists support_documents (
  id text primary key,
  system_id text not null,
  rmf_step text not null,
  kind text not null,
  title text not null,
  body text not null,
  control_ids text not null,
  source text not null,
  url text,
  status text not null,
  updated_at timestamptz not null
);
create index if not exists support_docs_system_idx on support_documents (system_id, rmf_step);
