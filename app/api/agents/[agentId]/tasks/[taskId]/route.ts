import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceContext } from "@/lib/workspace/workspace-service";
import { getAgentTask, updateAgentTask, deleteAgentTask } from "@/lib/workspace/agent-service";
import { agentTaskUpdateSchema } from "@/lib/validation/workspace";

export async function GET(
  request: Request,
  context: { params: Promise<{ agentId: string; taskId: string }> },
) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agentId, taskId } = await context.params;
  const workspaceContext = await getCurrentWorkspaceContext(user.id);
  if (!workspaceContext) return NextResponse.json({ error: "Workspace context not found." }, { status: 403 });

  try {
    const task = await getAgentTask(workspaceContext.workspace.id, agentId, taskId);
    return NextResponse.json({ task }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load task." }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ agentId: string; taskId: string }> },
) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agentId, taskId } = await context.params;
  const workspaceContext = await getCurrentWorkspaceContext(user.id);
  if (!workspaceContext) return NextResponse.json({ error: "Workspace context not found." }, { status: 403 });

  const body = await request.json().catch(() => ({}));

  try {
    const validated = agentTaskUpdateSchema.safeParse(body);
    if (!validated.success) return NextResponse.json({ error: validated.error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });

    // Update using service which already scopes by workspace and agent
    const task = await updateAgentTask(workspaceContext.workspace.id, agentId, taskId, validated.data);
    return NextResponse.json({ task }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update task." }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ agentId: string; taskId: string }> },
) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agentId, taskId } = await context.params;
  const workspaceContext = await getCurrentWorkspaceContext(user.id);
  if (!workspaceContext) return NextResponse.json({ error: "Workspace context not found." }, { status: 403 });

  try {
    const task = await deleteAgentTask(workspaceContext.workspace.id, agentId, taskId);
    return NextResponse.json({ task }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete task." }, { status: 400 });
  }
}
