import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <WorkspaceShell title="Dashboard" subtitle="Environment not configured">
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable the dashboard.
        </div>
      </WorkspaceShell>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <WorkspaceShell title="Dashboard" subtitle={user?.email ?? "Workspace overview"}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-indigo-600">Overview</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">Welcome back</h2>
          </div>
          <div className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-200">
            Agent control plane
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <p className="text-sm text-slate-500 dark:text-slate-400">Workspace</p>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">Primary</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Current workspace</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500 dark:text-slate-400">Members</p>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">1</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Workspace members</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500 dark:text-slate-400">AI Employees</p>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">3</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Research, Sales, Operations</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500 dark:text-slate-400">Tasks</p>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">1</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Active research workflow</p>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <Card className="space-y-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Current workspace</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Primary workspace</h3>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
              <p className="text-sm text-slate-500 dark:text-slate-400">Workspace name</p>
              <p className="mt-3 text-lg font-medium text-slate-900 dark:text-white">CompanyOS Workspace</p>
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">System status</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Healthy</h3>
            </div>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800">
                <span>Auth</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Ready</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800">
                <span>Database</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Ready</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800">
                <span>RLS</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Enabled</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </WorkspaceShell>
  );
}
