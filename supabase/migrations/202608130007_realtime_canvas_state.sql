-- Persisted presentation state for the execution canvas. Execution nodes remain
-- projections of agent_runs, agent_events, tool_calls, approvals, and browser_sessions.
create table if not exists public.canvas_layouts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  node_positions jsonb not null default '{}'::jsonb,
  viewport jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, run_id)
);

create index if not exists canvas_layouts_workspace_run_idx on public.canvas_layouts(workspace_id, run_id);
alter table public.canvas_layouts enable row level security;
create policy canvas_layouts_select_workspace_member on public.canvas_layouts for select using (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member','viewer']::public.workspace_role[]));
create policy canvas_layouts_write_workspace_member on public.canvas_layouts for all using (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member']::public.workspace_role[])) with check (public.workspace_member_is_authorized(workspace_id, array['owner','admin','member']::public.workspace_role[]));
drop trigger if exists canvas_layouts_set_updated_at on public.canvas_layouts;
create trigger canvas_layouts_set_updated_at before update on public.canvas_layouts for each row execute function public.set_updated_at();

-- Supabase Realtime delivers only rows still permitted by RLS to subscribed users.
do $$ begin alter publication supabase_realtime add table public.agent_runs; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.agent_events; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.tool_calls; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.approvals; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.browser_sessions; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.canvas_layouts; exception when duplicate_object then null; end $$;
