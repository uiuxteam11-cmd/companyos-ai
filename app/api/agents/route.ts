import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceContext } from "@/lib/workspace/workspace-service";
import {
  createWorkspaceAgent,
  listWorkspaceAgents,
} from "@/lib/workspace/agent-service";

export async function GET() {
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

  const workspaceContext = await getCurrentWorkspaceContext(user.id);
  if (!workspaceContext) {
    return NextResponse.json({ error: "Workspace context not found." }, { status: 403 });
  }

  try {
    const agents = await listWorkspaceAgents(workspaceContext.workspace.id);
    return NextResponse.json({ agents }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load agents." }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

  const workspaceContext = await getCurrentWorkspaceContext(user.id);
  if (!workspaceContext) {
    return NextResponse.json({ error: "Workspace context not found." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    const agent = await createWorkspaceAgent(workspaceContext.workspace.id, user.id, body);
    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create agent." }, { status: 400 });
  }
}
