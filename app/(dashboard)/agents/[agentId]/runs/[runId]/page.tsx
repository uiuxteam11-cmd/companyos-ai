import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { AgentRunLivePanel } from "@/components/agents/run-live-panel";
import { RunExecutionCanvas } from "@/components/canvas/run-execution-canvas";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceContext } from "@/lib/workspace/workspace-service";
import { getAgentRun, listAgentEvents, listAgentToolCalls, listBrowserSessions } from "@/lib/workspace/agent-service";
import { projectRunToCanvas } from "@/lib/canvas/run-projection";

export default async function AgentRunPage({ params }: { params: Promise<{ agentId: string; runId: string }> }) {
  const supabase = await createClient();
  if (!supabase) return <WorkspaceShell title="Agent run" subtitle="Environment not configured"><p className="text-slate-600 dark:text-slate-300">Configure Supabase to view execution data.</p></WorkspaceShell>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();
  const workspaceContext = await getCurrentWorkspaceContext(user.id);
  if (!workspaceContext) notFound();
  const { agentId, runId } = await params;
  let run;
  let events;
  let toolCalls;
  let browserSessions;
  try {
    [run, events, toolCalls, browserSessions] = await Promise.all([
      getAgentRun(workspaceContext.workspace.id, agentId, runId),
      listAgentEvents(workspaceContext.workspace.id, agentId, runId),
      listAgentToolCalls(workspaceContext.workspace.id, agentId, runId),
      listBrowserSessions(workspaceContext.workspace.id, agentId, runId),
    ]);
  } catch { notFound(); }
  return <WorkspaceShell title="Agent run" subtitle={`Run ${run.id.slice(0, 8)}`}><div className="space-y-6"><RunExecutionCanvas agentId={agentId} runId={runId} workspaceId={workspaceContext.workspace.id} userId={user.id} userName={user.email ?? "Workspace member"} initialData={projectRunToCanvas(run, events, toolCalls, browserSessions)} /><AgentRunLivePanel agentId={agentId} runId={runId} initialRun={run} initialEvents={events} /></div></WorkspaceShell>;
}
