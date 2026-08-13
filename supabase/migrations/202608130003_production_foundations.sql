-- Production observability, usage metering, and retention foundations.

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references public.profiles(id),
  agent_id uuid references public.agents(id) on delete set null,
  run_id uuid references public.agent_runs(id) on delete set null,
  metric text not null,
  quantity numeric not null check (quantity >= 0),
  unit text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_workspace_created_at_idx on public.usage_events(workspace_id, created_at desc);
create index if not exists usage_events_run_created_at_idx on public.usage_events(run_id, created_at desc);
alter table public.usage_events enable row level security;
create policy usage_events_select_workspace_member on public.usage_events for select using (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member','viewer']::public.workspace_role[]));
-- Usage events are written only by server-side code using the authenticated user context.
create policy usage_events_insert_workspace_member on public.usage_events for insert with check (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member']::public.workspace_role[]));

create table if not exists public.incident_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  source text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists incident_events_created_at_idx on public.incident_events(created_at desc);
alter table public.incident_events enable row level security;
create policy incident_events_select_workspace_admin on public.incident_events for select using (workspace_id is null or public.workspace_member_is_authorized(workspace_id, array['owner','admin']::public.workspace_role[]));
create policy incident_events_insert_workspace_member on public.incident_events for insert with check (workspace_id is null or public.workspace_member_is_authorized(workspace_id, array['owner','admin','member']::public.workspace_role[]));
