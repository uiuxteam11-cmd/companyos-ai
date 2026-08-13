-- Human control state and four-level CompanyOS memory.

alter table public.agent_memory
  drop constraint if exists agent_memory_scope_check;

alter table public.agent_memory
  add constraint agent_memory_scope_check check (scope in ('company', 'department', 'agent', 'task')),
  add column if not exists department_key text;

alter table public.agent_memory
  drop constraint if exists agent_memory_workspace_id_agent_id_task_id_scope_memory_key_key;

alter table public.agent_memory
  add constraint agent_memory_scope_owner_key_unique unique nulls not distinct (workspace_id, agent_id, task_id, scope, department_key, memory_key);

drop index if exists public.agent_memory_workspace_scope_idx;
create index if not exists agent_memory_workspace_scope_idx on public.agent_memory(workspace_id, scope, department_key, updated_at desc);

create table if not exists public.agent_control_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  controller_user_id uuid references public.profiles(id),
  mode text not null default 'agent' check (mode in ('agent', 'human')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id)
);

create index if not exists agent_control_sessions_workspace_run_idx on public.agent_control_sessions(workspace_id, run_id);
alter table public.agent_control_sessions enable row level security;
create policy agent_control_sessions_select_workspace_member on public.agent_control_sessions for select using (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member','viewer']::public.workspace_role[]));
create policy agent_control_sessions_write_workspace_member on public.agent_control_sessions for all using (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member']::public.workspace_role[])) with check (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member']::public.workspace_role[]));
drop trigger if exists agent_control_sessions_set_updated_at on public.agent_control_sessions;
create trigger agent_control_sessions_set_updated_at before update on public.agent_control_sessions for each row execute function public.set_updated_at();
