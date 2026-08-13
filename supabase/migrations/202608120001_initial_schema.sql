create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz default now(),
  unique (workspace_id, user_id)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, created_at, updated_at)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    now(),
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

create policy "profiles_select_own" on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
for insert
with check (auth.uid() = id);

create policy "workspaces_select_member" on public.workspaces
for select
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = public.workspaces.id
      and wm.user_id = auth.uid()
  )
);

create policy "workspaces_insert_own" on public.workspaces
for insert
with check (
  created_by = auth.uid() and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
  )
);

create policy "workspaces_update_auth" on public.workspaces
for update
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = public.workspaces.id
      and wm.user_id = auth.uid()
      and wm.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = public.workspaces.id
      and wm.user_id = auth.uid()
      and wm.role in ('owner', 'admin')
  )
);

create policy "workspace_members_select_member" on public.workspace_members
for select
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = public.workspace_members.workspace_id
      and wm.user_id = auth.uid()
  )
);

create policy "workspace_members_insert_authorized" on public.workspace_members
for insert
with check (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = public.workspace_members.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner', 'admin')
  )
);

create policy "workspace_members_update_authorized" on public.workspace_members
for update
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = public.workspace_members.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = public.workspace_members.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner', 'admin')
  )
);

create policy "workspace_members_delete_authorized" on public.workspace_members
for delete
using (
  exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = public.workspace_members.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner', 'admin')
  )
);
