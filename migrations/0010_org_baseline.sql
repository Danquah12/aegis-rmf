create table if not exists org_rmf_baselines (
  id text primary key,
  org_id text not null,
  org_name text not null,
  statement text not null,
  risk_tolerance text not null,
  security_requirements text not null,
  overlays text not null,
  control_ids text not null,
  default_cadence text not null,
  cadence_assumed integer not null default 0,
  control_cadence text not null,
  methods text not null,
  kev_slo_days integer,
  stages text not null,
  status text not null,
  updated_at timestamptz not null
);
