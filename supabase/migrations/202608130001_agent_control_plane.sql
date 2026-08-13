-- CompanyOS AI agent control plane
-- Forward-only additions for governed, observable agent execution.

alter table public.agent_tasks
  drop constraint if exists agent_tasks_status_check;

update public.agent_tasks set status = 'queued' where status = 'pending';
update public.agent_tasks set status = 'waiting_approval' where status = 'waiting';

alter table public.agent_tasks
  add constraint agent_tasks_status_check check (
    status in ('queued', 'planning', 'running', 'waiting_approval', 'paused', 'completed', 'failed', 'cancelled')
  ),
  add column if not exists current_step text;

alter table public.agent_runs
  drop constraint if exists agent_runs_status_check;

update public.agent_runs set status = 'waiting_approval' where status = 'waiting';

alter table public.agent_runs
  add constraint agent_runs_status_check check (
    status in ('queued', 'planning', 'running', 'waiting_approval', 'paused', 'completed', 'failed', 'cancelled')
  ),
  add column if not exists current_step text;

create table if not exists public.agent_steps (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  task_id uuid not null references public.agent_tasks(id) on delete cascade,
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  sequence integer not null,
  step_type text not null,
  status text not null check (status in ('queued', 'running', 'completed', 'failed', 'skipped', 'waiting_approval')),
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (run_id, sequence)
);

create table if not exists public.tool_calls (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  task_id uuid not null references public.agent_tasks(id) on delete cascade,
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  step_id uuid references public.agent_steps(id) on delete set null,
  tool_name text not null,
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  status text not null check (status in ('queued', 'running', 'completed', 'failed', 'blocked')),
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  task_id uuid not null references public.agent_tasks(id) on delete cascade,
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  tool_call_id uuid references public.tool_calls(id) on delete set null,
  requested_by uuid not null references public.profiles(id),
  action text not null,
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  reason text not null,
  input jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  decided_by uuid references public.profiles(id),
  decision_reason text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists public.agent_memory (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete cascade,
  task_id uuid references public.agent_tasks(id) on delete cascade,
  scope text not null check (scope in ('company', 'agent', 'task')),
  memory_key text not null,
  memory_value jsonb not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (workspace_id, agent_id, task_id, scope, memory_key)
);

create table if not exists public.browser_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  task_id uuid not null references public.agent_tasks(id) on delete cascade,
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  provider text not null,
  provider_session_id text not null,
  status text not null check (status in ('created', 'active', 'human_control', 'closed', 'failed')),
  current_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_session_id)
);

create index if not exists agent_steps_run_sequence_idx on public.agent_steps(run_id, sequence);
create index if not exists tool_calls_run_created_at_idx on public.tool_calls(run_id, created_at);
create index if not exists approvals_workspace_status_idx on public.approvals(workspace_id, status, created_at desc);
create index if not exists agent_memory_workspace_scope_idx on public.agent_memory(workspace_id, scope, updated_at desc);
create index if not exists browser_sessions_run_idx on public.browser_sessions(run_id);

alter table public.agent_steps enable row level security;
alter table public.tool_calls enable row level security;
alter table public.approvals enable row level security;
alter table public.agent_memory enable row level security;
alter table public.browser_sessions enable row level security;

create policy agent_steps_select_workspace_member on public.agent_steps for select using (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member','viewer']::public.workspace_role[]));
create policy tool_calls_select_workspace_member on public.tool_calls for select using (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member','viewer']::public.workspace_role[]));
create policy approvals_select_workspace_member on public.approvals for select using (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member','viewer']::public.workspace_role[]));
create policy agent_memory_select_workspace_member on public.agent_memory for select using (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member','viewer']::public.workspace_role[]));
create policy browser_sessions_select_workspace_member on public.browser_sessions for select using (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member','viewer']::public.workspace_role[]));

create policy agent_steps_write_workspace_member on public.agent_steps for all using (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member']::public.workspace_role[])) with check (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member']::public.workspace_role[]));
create policy tool_calls_write_workspace_member on public.tool_calls for all using (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member']::public.workspace_role[])) with check (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member']::public.workspace_role[]));
create policy approvals_write_workspace_member on public.approvals for all using (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member']::public.workspace_role[])) with check (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member']::public.workspace_role[]));
create policy agent_memory_write_workspace_member on public.agent_memory for all using (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member']::public.workspace_role[])) with check (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member']::public.workspace_role[]));
create policy browser_sessions_write_workspace_member on public.browser_sessions for all using (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member']::public.workspace_role[])) with check (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member']::public.workspace_role[]));

drop trigger if exists agent_memory_set_updated_at on public.agent_memory;
create trigger agent_memory_set_updated_at before update on public.agent_memory for each row execute function public.set_updated_at();
drop trigger if exists browser_sessions_set_updated_at on public.browser_sessions;
create trigger browser_sessions_set_updated_at before update on public.browser_sessions for each row execute function public.set_updated_at();
