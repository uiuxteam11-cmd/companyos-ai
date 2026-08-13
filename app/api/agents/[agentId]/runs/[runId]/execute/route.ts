import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceContext } from "@/lib/workspace/workspace-service";
import { orchestrateRun } from "@/lib/agents/orchestrator";
import { canRunAgent } from "@/lib/workspace/permissions";

export async function POST(
  request: Request,
  context: { params: Promise<{ agentId: string; runId: string }> },
) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agentId, runId } = await context.params;
  const workspaceContext = await getCurrentWorkspaceContext(user.id);
  if (!workspaceContext) return NextResponse.json({ error: "Workspace context not found." }, { status: 403 });
  if (!canRunAgent(workspaceContext.membership.role)) return NextResponse.json({ error: "Your workspace role cannot execute agent runs." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const taskId = body.taskId ?? body.task_id ?? null;

  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  try {
    const result = await orchestrateRun({
      workspaceId: workspaceContext.workspace.id,
      agentId,
      taskId,
      runId,
      userId: user.id,
    });

    return NextResponse.json({ execution: result }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to execute agent run." },
      { status: 400 },
    );
  }
}
