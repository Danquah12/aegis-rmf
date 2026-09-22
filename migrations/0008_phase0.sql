alter table organizations add column if not exists parent_id text;
alter table organizations add column if not exists description text not null default '';
alter table organizations add column if not exists status text not null default 'established';

create table if not exists role_assignments (
  id text primary key,
  person_id text not null,
  role_id text not null,
  org_id text not null,
  system_id text,
  notes text not null default ''
);
create index if not exists role_assign_org_idx on role_assignments (org_id);
create index if not exists role_assign_role_idx on role_assignments (role_id);

create table if not exists org_prepare_tasks (
  id text primary key,
  org_id text not null,
  task_id text not null,
  title text not null,
  status text not null,
  owner_role text not null,
  evidence text not null
);
