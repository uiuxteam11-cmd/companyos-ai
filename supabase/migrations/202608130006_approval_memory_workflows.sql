-- Persisted approvals, memory metadata, and durable workflow scheduling.

alter table public.agent_memory
  add column if not exists owner_id uuid references public.profiles(id),
  add column if not exists source text not null default 'user',
  add column if not exists visibility text not null default 'workspace' check (visibility in ('private', 'agent', 'workspace')),
  add column if not exists content jsonb not null default '{}'::jsonb;

update public.agent_memory set owner_id = coalesce(owner_id, created_by) where owner_id is null;
update public.agent_memory set content = memory_value where content = '{}'::jsonb;

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  name text not null,
  trigger_type text not null check (trigger_type in ('manual', 'schedule', 'webhook', 'event')),
  trigger_config jsonb not null default '{}'::jsonb,
  definition jsonb not null,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  agent_run_id uuid references public.agent_runs(id) on delete set null,
  status text not null check (status in ('queued', 'running', 'waiting_approval', 'completed', 'failed', 'cancelled')),
  current_step integer not null default 0,
  retry_count integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.workflow_schedules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  cron_expression text not null,
  next_run_at timestamptz not null,
  last_run_at timestamptz,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workflow_id)
);

create index if not exists workflows_workspace_idx on public.workflows(workspace_id, status);
create index if not exists workflow_runs_workspace_idx on public.workflow_runs(workspace_id, created_at desc);
create index if not exists workflow_schedules_due_idx on public.workflow_schedules(enabled, next_run_at);
alter table public.workflows enable row level security;
alter table public.workflow_runs enable row level security;
alter table public.workflow_schedules enable row level security;
create policy workflows_select_workspace_member on public.workflows for select using (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member','viewer']::public.workspace_role[]));
create policy workflow_runs_select_workspace_member on public.workflow_runs for select using (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member','viewer']::public.workspace_role[]));
create policy workflow_schedules_select_workspace_member on public.workflow_schedules for select using (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member','viewer']::public.workspace_role[]));
create policy workflows_write_workspace_member on public.workflows for all using (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member']::public.workspace_role[])) with check (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member']::public.workspace_role[]));
create policy workflow_runs_write_workspace_member on public.workflow_runs for all using (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member']::public.workspace_role[])) with check (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member']::public.workspace_role[]));
create policy workflow_schedules_write_workspace_member on public.workflow_schedules for all using (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member']::public.workspace_role[])) with check (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member']::public.workspace_role[]));
drop trigger if exists workflows_set_updated_at on public.workflows;
create trigger workflows_set_updated_at before update on public.workflows for each row execute function public.set_updated_at();
drop trigger if exists workflow_schedules_set_updated_at on public.workflow_schedules;
create trigger workflow_schedules_set_updated_at before update on public.workflow_schedules for each row execute function public.set_updated_at();
