import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceContext } from "@/lib/workspace/workspace-service";
import { getAgentRun, listAgentEvents, listAgentToolCalls, listBrowserSessions } from "@/lib/workspace/agent-service";
import { projectRunToCanvas } from "@/lib/canvas/run-projection";

export async function GET(_request: Request, context: { params: Promise<{ agentId: string; runId: string }> }) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [params, workspaceContext] = await Promise.all([context.params, getCurrentWorkspaceContext(user.id)]);
  if (!workspaceContext) return NextResponse.json({ error: "Workspace context not found." }, { status: 403 });
  try {
    const [run, events, toolCalls, browserSessions] = await Promise.all([
      getAgentRun(workspaceContext.workspace.id, params.agentId, params.runId),
      listAgentEvents(workspaceContext.workspace.id, params.agentId, params.runId),
      listAgentToolCalls(workspaceContext.workspace.id, params.agentId, params.runId),
      listBrowserSessions(workspaceContext.workspace.id, params.agentId, params.runId),
    ]);
    return NextResponse.json(projectRunToCanvas(run, events, toolCalls, browserSessions));
  } catch {
    return NextResponse.json({ error: "Run canvas data was not found." }, { status: 404 });
  }
}
