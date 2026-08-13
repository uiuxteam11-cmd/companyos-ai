-- Phase 2 Step 1
-- Workspace management and permission foundation


-- ============================================================
-- 1. Drop Phase 1 policies that depend on workspace_members.role
-- ============================================================

drop policy if exists "workspaces_select_member"
on public.workspaces;

drop policy if exists "workspaces_update_auth"
on public.workspaces;

drop policy if exists "workspace_members_select_member"
on public.workspace_members;

drop policy if exists "workspace_members_insert_authorized"
on public.workspace_members;

drop policy if exists "workspace_members_update_authorized"
on public.workspace_members;

drop policy if exists "workspace_members_delete_authorized"
on public.workspace_members;


-- ============================================================
-- 2. Create workspace role enum
-- ============================================================

do $$
begin
  create type public.workspace_role as enum (
    'owner',
    'admin',
    'member',
    'viewer'
  );
exception
  when duplicate_object then null;
end
$$;


-- ============================================================
-- 3. Convert role column from text to enum
-- ============================================================

alter table public.workspace_members
  drop constraint if exists workspace_members_role_check;

alter table public.workspace_members
  alter column role type public.workspace_role
  using role::public.workspace_role;


-- ============================================================
-- 4. Helper function
-- ============================================================

create or replace function public.workspace_member_is_authorized(
  workspace_uuid uuid,
  allowed_roles public.workspace_role[],
  user_uuid uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspace_uuid
      and wm.user_id = user_uuid
      and wm.role = any(allowed_roles)
  );
$$;


-- ============================================================
-- 5. Owner protection
-- ============================================================

create or replace function public.protect_workspace_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  if tg_op = 'DELETE' then

    if old.role = 'owner' then
      raise exception 'The workspace owner cannot be removed';
    end if;

    return old;

  end if;


  if tg_op = 'UPDATE' then

    if old.role = 'owner'
       and new.role <> 'owner' then
      raise exception 'The workspace owner cannot be demoted';
    end if;

    if old.role <> 'owner'
       and new.role = 'owner' then
      raise exception 'A new workspace owner cannot be created through member updates';
    end if;

    return new;

  end if;

  return new;

end;
$$;


drop trigger if exists protect_workspace_owner_trigger
on public.workspace_members;


create trigger protect_workspace_owner_trigger
before update or delete
on public.workspace_members
for each row
execute function public.protect_workspace_owner();


-- ============================================================
-- 6. Workspace SELECT
-- ============================================================

create policy "workspaces_select_member"
on public.workspaces
for select
using (
  public.workspace_member_is_authorized(
    id,
    array[
      'owner'::public.workspace_role,
      'admin'::public.workspace_role,
      'member'::public.workspace_role,
      'viewer'::public.workspace_role
    ]
  )
);


-- ============================================================
-- 7. Workspace UPDATE
-- ============================================================

create policy "workspaces_update_authorized"
on public.workspaces
for update
using (
  public.workspace_member_is_authorized(
    id,
    array[
      'owner'::public.workspace_role,
      'admin'::public.workspace_role
    ]
  )
)
with check (
  public.workspace_member_is_authorized(
    id,
    array[
      'owner'::public.workspace_role,
      'admin'::public.workspace_role
    ]
  )
);


-- ============================================================
-- 8. Member SELECT
-- ============================================================

create policy "workspace_members_select_member"
on public.workspace_members
for select
using (
  public.workspace_member_is_authorized(
    workspace_id,
    array[
      'owner'::public.workspace_role,
      'admin'::public.workspace_role,
      'member'::public.workspace_role,
      'viewer'::public.workspace_role
    ]
  )
);


-- ============================================================
-- 9. Member INSERT
-- ============================================================

create policy "workspace_members_insert_authorized"
on public.workspace_members
for insert
with check (
  role <> 'owner'::public.workspace_role
  and public.workspace_member_is_authorized(
    workspace_id,
    array[
      'owner'::public.workspace_role,
      'admin'::public.workspace_role
    ]
  )
);


-- ============================================================
-- 10. Member UPDATE
-- ============================================================

create policy "workspace_members_update_authorized"
on public.workspace_members
for update
using (
  public.workspace_member_is_authorized(
    workspace_id,
    array[
      'owner'::public.workspace_role,
      'admin'::public.workspace_role
    ]
  )
)
with check (
  role <> 'owner'::public.workspace_role
  and public.workspace_member_is_authorized(
    workspace_id,
    array[
      'owner'::public.workspace_role,
      'admin'::public.workspace_role
    ]
  )
);


-- ============================================================
-- 11. Member DELETE
-- ============================================================

create policy "workspace_members_delete_authorized"
on public.workspace_members
for delete
using (
  role <> 'owner'::public.workspace_role
  and public.workspace_member_is_authorized(
    workspace_id,
    array[
      'owner'::public.workspace_role,
      'admin'::public.workspace_role
    ]
  )
);


-- ============================================================
-- 12. Ensure RLS remains enabled
-- ============================================================

alter table public.workspaces enable row level security;

alter table public.workspace_members enable row level security;