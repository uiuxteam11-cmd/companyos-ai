import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceContext } from "@/lib/workspace/workspace-service";
import { listWorkspaceAgents } from "@/lib/workspace/agent-service";

export default async function AgentsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <WorkspaceShell title="Agents" subtitle="Live agent run experience">
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable the agent dashboard.
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
      <WorkspaceShell title="Agents" subtitle="Live agent run experience">
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          Sign in to view agents and run execution state.
        </div>
      </WorkspaceShell>
    );
  }

  const workspaceContext = await getCurrentWorkspaceContext(user.id);

  if (!workspaceContext) {
    return (
      <WorkspaceShell title="Agents" subtitle="Live agent run experience">
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          No workspace membership was found for your account.
        </div>
      </WorkspaceShell>
    );
  }

  let agents = [];
  try {
    agents = await listWorkspaceAgents(workspaceContext.workspace.id);
  } catch {
    return (
      <WorkspaceShell title="Agents" subtitle="Live agent run experience">
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          Unable to load agents.
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell title="Agents" subtitle="Live run dashboard">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-indigo-600">Agents</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">Live AI run management</h2>
          </div>
          <div className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-200">
            Phase 4 preview
          </div>
        </div>

        {agents.length === 0 ? (
          <Card className="border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">No agents are available in this workspace.</p>
            <p className="mt-3 text-base text-slate-700 dark:text-slate-200">
              Create an agent through the API or seed sample data to start live runs.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {agents.map((agent) => (
              <Card key={agent.id} className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{agent.status === "active" ? "Active agent" : "Agent"}</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{agent.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {agent.description ?? "No description available."}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {agent.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/agents/${agent.id}/runs`}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                  >
                    View runs
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
