import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceContext } from "@/lib/workspace/workspace-service";
import { createAgentTask, listAgentTasks } from "@/lib/workspace/agent-service";

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
    const tasks = await listAgentTasks(workspaceContext.workspace.id, agentId);
    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load tasks." }, { status: 500 });
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

  try {
    const task = await createAgentTask(workspaceContext.workspace.id, agentId, user.id, body);
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create task." }, { status: 400 });
  }
}
