import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceContext, listWorkspaceMembers } from "@/lib/workspace/workspace-service";
import { getWorkspacePermissions } from "@/lib/workspace/permissions";

export default async function SettingsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <WorkspaceShell title="Settings" subtitle="Workspace settings">
        <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable workspace settings.
        </div>
      </WorkspaceShell>
    );
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <WorkspaceShell title="Settings" subtitle="Workspace settings">
        <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          Sign in to manage workspace settings.
        </div>
      </WorkspaceShell>
    );
  }

  const workspaceContext = await getCurrentWorkspaceContext(user.id);

  if (!workspaceContext) {
    return (
      <WorkspaceShell title="Settings" subtitle="Workspace settings">
        <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          No workspace membership was found for your account.
        </div>
      </WorkspaceShell>
    );
  }

  const members = await listWorkspaceMembers(workspaceContext.workspace.id);
  const permissions = getWorkspacePermissions(workspaceContext.membership.role);

  return (
    <WorkspaceShell title="Settings" subtitle="Profile and workspace controls">
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="space-y-4 xl:col-span-2">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-indigo-600">Workspace</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{workspaceContext.workspace.name}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Workspace slug</p>
              <p className="mt-2 text-base font-medium text-slate-900 dark:text-white">{workspaceContext.workspace.slug}</p>
            </div>
            <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Your role</p>
              <p className="mt-2 text-base font-medium text-slate-900 dark:text-white">{workspaceContext.membership.role}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Members</p>
              <p className="mt-2 text-base font-medium text-slate-900 dark:text-white">{members.length}</p>
            </div>
            <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Permissions</p>
              <p className="mt-2 text-base font-medium text-slate-900 dark:text-white">
                {permissions.canManageWorkspace ? "Workspace management enabled" : "Read-only workspace access"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-indigo-600">Profile</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{user.email ?? "Profile"}</h2>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Workspace access</p>
              <p className="mt-2 text-base font-medium text-slate-900 dark:text-white">
                {permissions.canManageMembers ? "Team membership management enabled" : "Team membership view only"}
              </p>
            </div>
            <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Role capabilities</p>
              <p className="mt-2 text-base font-medium text-slate-900 dark:text-white">{workspaceContext.membership.role}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card className="space-y-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-indigo-600">Workspace members</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Team directory</h2>
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="grid gap-0 text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 sm:grid-cols-[2fr_1fr_1fr]">
              <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">Name / Email</div>
              <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">Role</div>
              <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">Joined</div>
            </div>
            {members.map((member) => (
              <div key={member.id} className="grid gap-0 border-t border-slate-200 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200 sm:grid-cols-[2fr_1fr_1fr]">
                <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-700">
                  <p className="font-medium text-slate-900 dark:text-white">{member.profile?.full_name ?? member.user_id}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{member.profile?.email ?? "No email"}</p>
                </div>
                <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-700">
                  <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                    {member.role}
                  </span>
                </div>
                <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-700">
                  <time dateTime={member.created_at ?? undefined}>{member.created_at ? new Date(member.created_at).toLocaleDateString() : "–"}</time>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-indigo-600">Role capabilities</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Current permissions</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(permissions).map(([key, value]) => (
              <div key={key} className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400">{key.replace(/([A-Z])/g, " $1")}</p>
                <p className="mt-2 font-medium text-slate-900 dark:text-white">{value ? "Allowed" : "Restricted"}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </WorkspaceShell>
  );
}
