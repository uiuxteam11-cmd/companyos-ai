-- ============================================================
-- Phase 2 Step 2A
-- Agent Runtime Foundation
-- ============================================================

-- ============================================================
-- 1. AGENTS
-- ============================================================

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null
    references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active'
    check (status in ('active', 'paused', 'archived')),
  system_prompt text,
  configuration jsonb not null default '{}'::jsonb,
  created_by uuid not null
    references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agents_workspace_id_idx
  on public.agents(workspace_id);


-- ============================================================
-- 2. AGENT TASKS
-- ============================================================

create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null
    references public.workspaces(id) on delete cascade,
  agent_id uuid not null
    references public.agents(id) on delete cascade,
  created_by uuid not null
    references public.profiles(id),
  title text not null,
  instruction text not null,
  status text not null default 'pending'
    check (
      status in (
        'pending',
        'queued',
        'running',
        'waiting',
        'completed',
        'failed',
        'cancelled'
      )
    ),
  priority integer not null default 0,
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists agent_tasks_workspace_id_idx
  on public.agent_tasks(workspace_id);

create index if not exists agent_tasks_agent_id_idx
  on public.agent_tasks(agent_id);

create index if not exists agent_tasks_status_idx
  on public.agent_tasks(status);


-- ============================================================
-- 3. AGENT RUNS
-- ============================================================

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null
    references public.workspaces(id) on delete cascade,
  agent_id uuid not null
    references public.agents(id) on delete cascade,
  task_id uuid not null
    references public.agent_tasks(id) on delete cascade,
  status text not null default 'queued'
    check (
      status in (
        'queued',
        'running',
        'waiting',
        'completed',
        'failed',
        'cancelled'
      )
    ),
  started_at timestamptz,
  completed_at timestamptz,
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists agent_runs_workspace_id_idx
  on public.agent_runs(workspace_id);

create index if not exists agent_runs_agent_id_idx
  on public.agent_runs(agent_id);

create index if not exists agent_runs_task_id_idx
  on public.agent_runs(task_id);

create index if not exists agent_runs_status_idx
  on public.agent_runs(status);


-- ============================================================
-- 4. AGENT EVENTS
-- ============================================================

create table if not exists public.agent_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null
    references public.workspaces(id) on delete cascade,
  agent_id uuid
    references public.agents(id) on delete cascade,
  task_id uuid
    references public.agent_tasks(id) on delete cascade,
  run_id uuid
    references public.agent_runs(id) on delete cascade,
  event_type text not null,
  message text,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid
    references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists agent_events_workspace_id_idx
  on public.agent_events(workspace_id);

create index if not exists agent_events_agent_id_idx
  on public.agent_events(agent_id);

create index if not exists agent_events_task_id_idx
  on public.agent_events(task_id);

create index if not exists agent_events_run_id_idx
  on public.agent_events(run_id);

create index if not exists agent_events_created_at_idx
  on public.agent_events(created_at);


-- ============================================================
-- 5. UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists agents_set_updated_at
on public.agents;

create trigger agents_set_updated_at
before update on public.agents
for each row
execute function public.set_updated_at();

drop trigger if exists agent_tasks_set_updated_at
on public.agent_tasks;

create trigger agent_tasks_set_updated_at
before update on public.agent_tasks
for each row
execute function public.set_updated_at();


-- ============================================================
-- 6. ENABLE RLS
-- ============================================================

alter table public.agents enable row level security;
alter table public.agent_tasks enable row level security;
alter table public.agent_runs enable row level security;
alter table public.agent_events enable row level security;

-- Compatibility overload for the agent-runtime policies below. The workspace
-- permission foundation exposes the canonical (workspace, roles, user) form;
-- these policies use (user, workspace, roles). Keep both forms to make the
-- migration sequence safe for fresh projects and existing environments.
create or replace function public.workspace_member_is_authorized(
  user_uuid uuid,
  workspace_uuid uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.workspace_member_is_authorized(
    workspace_uuid,
    allowed_roles::public.workspace_role[],
    user_uuid
  );
$$;

create or replace function public.workspace_member_is_authorized(
  user_uuid uuid,
  workspace_uuid uuid,
  allowed_roles public.workspace_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.workspace_member_is_authorized(workspace_uuid, allowed_roles, user_uuid);
$$;


-- ============================================================
-- 7. AGENTS RLS
-- ============================================================

create policy agents_select_workspace_member
on public.agents
for select
using (
  public.workspace_member_is_authorized(
    auth.uid(),
    workspace_id,
    array['owner', 'admin', 'member', 'viewer']::text[]
  )
);

create policy agents_insert_workspace_member
on public.agents
for insert
with check (
  public.workspace_member_is_authorized(
    auth.uid(),
    workspace_id,
    array['owner', 'admin', 'member']::text[]
  )
  and created_by = auth.uid()
);

create policy agents_update_workspace_member
on public.agents
for update
using (
  public.workspace_member_is_authorized(
    auth.uid(),
    workspace_id,
    array[
      'owner'::public.workspace_role,
      'admin'::public.workspace_role,
      'member'::public.workspace_role
    ]
  )
)
with check (
  public.workspace_member_is_authorized(
    auth.uid(),
    workspace_id,
    array[
      'owner'::public.workspace_role,
      'admin'::public.workspace_role,
      'member'::public.workspace_role
    ]
  )
);

create policy agents_delete_workspace_admin
on public.agents
for delete
using (
  public.workspace_member_is_authorized(
    auth.uid(),
    workspace_id,
    array['owner', 'admin']::text[]
  )
);


-- ============================================================
-- 8. AGENT TASK RLS
-- ============================================================

create policy agent_tasks_select_workspace_member
on public.agent_tasks
for select
using (
  public.workspace_member_is_authorized(
    auth.uid(),
    workspace_id,
    array[
      'owner'::public.workspace_role,
      'admin'::public.workspace_role,
      'member'::public.workspace_role,
      'viewer'::public.workspace_role
    ]
  )
);

create policy agent_tasks_insert_workspace_member
on public.agent_tasks
for insert
with check (
  public.workspace_member_is_authorized(
    auth.uid(),
    workspace_id,
    array[
      'owner'::public.workspace_role,
      'admin'::public.workspace_role,
      'member'::public.workspace_role
    ]
  )
  and created_by = auth.uid()
  and exists (
    select 1
    from public.agents a
    where a.id = agent_tasks.agent_id
      and a.workspace_id = agent_tasks.workspace_id
  )
);

create policy agent_tasks_update_workspace_member
on public.agent_tasks
for update
using (
  public.workspace_member_is_authorized(
    auth.uid(),
    workspace_id,
    array[
      'owner'::public.workspace_role,
      'admin'::public.workspace_role,
      'member'::public.workspace_role
    ]
  )
)
with check (
  public.workspace_member_is_authorized(
    auth.uid(),
    workspace_id,
    array[
      'owner'::public.workspace_role,
      'admin'::public.workspace_role,
      'member'::public.workspace_role
    ]
  )
  and exists (
    select 1
    from public.agents a
    where a.id = agent_tasks.agent_id
      and a.workspace_id = agent_tasks.workspace_id
  )
);

create policy agent_tasks_delete_workspace_admin
on public.agent_tasks
for delete
using (
  public.workspace_member_is_authorized(
    auth.uid(),
    workspace_id,
    array[
      'owner'::public.workspace_role,
      'admin'::public.workspace_role
    ]
  )
);


-- ============================================================
-- 9. AGENT RUN RLS
-- ============================================================

create policy agent_runs_select_workspace_member
on public.agent_runs
for select
using (
  public.workspace_member_is_authorized(
    auth.uid(),
    workspace_id,
    array[
      'owner'::public.workspace_role,
      'admin'::public.workspace_role,
      'member'::public.workspace_role,
      'viewer'::public.workspace_role
    ]
  )
);

create policy agent_runs_insert_workspace_member
on public.agent_runs
for insert
with check (
  public.workspace_member_is_authorized(
    auth.uid(),
    workspace_id,
    array[
      'owner'::public.workspace_role,
      'admin'::public.workspace_role,
      'member'::public.workspace_role
    ]
  )
  and exists (
    select 1
    from public.agents a
    where a.id = agent_runs.agent_id
      and a.workspace_id = agent_runs.workspace_id
  )
  and exists (
    select 1
    from public.agent_tasks t
    where t.id = agent_runs.task_id
      and t.workspace_id = agent_runs.workspace_id
      and t.agent_id = agent_runs.agent_id
  )
);

create policy agent_runs_update_workspace_member
on public.agent_runs
for update
using (
  public.workspace_member_is_authorized(
    auth.uid(),
    workspace_id,
    array[
      'owner'::public.workspace_role,
      'admin'::public.workspace_role,
      'member'::public.workspace_role
    ]
  )
)
with check (
  public.workspace_member_is_authorized(
    auth.uid(),
    workspace_id,
    array[
      'owner'::public.workspace_role,
      'admin'::public.workspace_role,
      'member'::public.workspace_role
    ]
  )
  and exists (
    select 1
    from public.agents a
    where a.id = agent_runs.agent_id
      and a.workspace_id = agent_runs.workspace_id
  )
  and exists (
    select 1
    from public.agent_tasks t
    where t.id = agent_runs.task_id
      and t.workspace_id = agent_runs.workspace_id
      and t.agent_id = agent_runs.agent_id
  )
);

create policy agent_runs_delete_workspace_admin
on public.agent_runs
for delete
using (
  public.workspace_member_is_authorized(
    auth.uid(),
    workspace_id,
    array[
      'owner'::public.workspace_role,
      'admin'::public.workspace_role
    ]
  )
);


-- ============================================================
-- 10. AGENT EVENTS RLS
-- ============================================================

create policy agent_events_select_workspace_member
on public.agent_events
for select
using (
  public.workspace_member_is_authorized(
    auth.uid(),
    workspace_id,
    array[
      'owner'::public.workspace_role,
      'admin'::public.workspace_role,
      'member'::public.workspace_role,
      'viewer'::public.workspace_role
    ]
  )
);

create policy agent_events_insert_workspace_member
on public.agent_events
for insert
with check (
  public.workspace_member_is_authorized(
    auth.uid(),
    workspace_id,
    array[
      'owner'::public.workspace_role,
      'admin'::public.workspace_role,
      'member'::public.workspace_role
    ]
  )
  and (
    agent_id is null
    or exists (
      select 1
      from public.agents a
      where a.id = agent_events.agent_id
        and a.workspace_id = agent_events.workspace_id
    )
  )
  and (
    task_id is null
    or exists (
      select 1
      from public.agent_tasks t
      where t.id = agent_events.task_id
        and t.workspace_id = agent_events.workspace_id
    )
  )
  and (
    run_id is null
    or exists (
      select 1
      from public.agent_runs r
      where r.id = agent_events.run_id
        and r.workspace_id = agent_events.workspace_id
    )
  )
);

-- Events are append-only.
-- No UPDATE or DELETE policies are intentionally created.
