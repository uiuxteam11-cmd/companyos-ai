import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceContext } from "@/lib/workspace/workspace-service";
import { createAgentRun, listAgentRuns } from "@/lib/workspace/agent-service";

export async function GET(
  request: Request,
  context: { params: Promise<{ agentId: string }> },
) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agentId } = await context.params;
  const workspaceContext = await getCurrentWorkspaceContext(user.id);

  if (!workspaceContext) {
    return NextResponse.json({ error: "Workspace context not found." }, { status: 403 });
  }

  try {
    const runs = await listAgentRuns(workspaceContext.workspace.id, agentId);
    return NextResponse.json({ runs }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load runs." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ agentId: string }> },
) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agentId } = await context.params;
  const workspaceContext = await getCurrentWorkspaceContext(user.id);

  if (!workspaceContext) {
    return NextResponse.json({ error: "Workspace context not found." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const taskId = body.taskId ?? body.task_id;

  if (!taskId) {
    return NextResponse.json({ error: "Task ID is required." }, { status: 400 });
  }

  try {
    const run = await createAgentRun(workspaceContext.workspace.id, agentId, taskId, body);
    return NextResponse.json({ run }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create run." }, { status: 400 });
  }
}
