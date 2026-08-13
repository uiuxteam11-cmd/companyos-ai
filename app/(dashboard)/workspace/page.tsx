import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { Card } from "@/components/ui/card";

export default function WorkspacePage() {
  return (
    <WorkspaceShell title="Workspace" subtitle="CompanyOS future workspace shell">
      <div className="space-y-6">
        <Card className="space-y-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-indigo-600">Workspace shell</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">Your AI workspace is ready.</h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
              <p className="text-sm text-slate-500 dark:text-slate-400">Workspace name</p>
              <p className="mt-3 text-lg font-medium text-slate-900 dark:text-white">CompanyOS Workspace</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
              <p className="text-sm text-slate-500 dark:text-slate-400">Current user</p>
              <p className="mt-3 text-lg font-medium text-slate-900 dark:text-white">Workspace owner</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
              <p className="text-sm text-slate-500 dark:text-slate-400">Members</p>
              <p className="mt-3 text-lg font-medium text-slate-900 dark:text-white">1 active member</p>
            </div>
          </div>
        </Card>

        <Card className="min-h-[280px]">
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center dark:border-slate-700 dark:bg-slate-800/60">
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">Your AI workspace is ready.</p>
            <p className="mt-3 max-w-md text-sm text-slate-600 dark:text-slate-300">
              Agent execution will be introduced in Phase 2.
            </p>
          </div>
        </Card>
      </div>
    </WorkspaceShell>
  );
}
