import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceContext } from "@/lib/workspace/workspace-service";
import {
  deleteWorkspaceAgent,
  getWorkspaceAgent,
  updateWorkspaceAgent,
} from "@/lib/workspace/agent-service";

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
    const agent = await getWorkspaceAgent(workspaceContext.workspace.id, agentId);
    return NextResponse.json({ agent }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load agent." }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
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
    const agent = await updateWorkspaceAgent(workspaceContext.workspace.id, agentId, body);
    return NextResponse.json({ agent }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update agent." }, { status: 400 });
  }
}

export async function DELETE(
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
    const agent = await deleteWorkspaceAgent(workspaceContext.workspace.id, agentId);
    return NextResponse.json({ agent }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete agent." }, { status: 400 });
  }
}
