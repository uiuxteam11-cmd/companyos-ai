import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceContext } from "@/lib/workspace/workspace-service";
import { listAgentEvents } from "@/lib/workspace/agent-service";

export async function GET(
  request: Request,
  context: { params: Promise<{ agentId: string; runId: string }> },
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

  const { agentId, runId } = await context.params;
  const workspaceContext = await getCurrentWorkspaceContext(user.id);

  if (!workspaceContext) {
    return NextResponse.json({ error: "Workspace context not found." }, { status: 403 });
  }

  try {
    const events = await listAgentEvents(workspaceContext.workspace.id, agentId, runId);
    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load events." }, { status: 500 });
  }
}

/** Runtime events are server-owned evidence, not client-authored activity. */
export async function POST() {
  return NextResponse.json(
    { error: "Agent events are created only by the server runtime." },
    { status: 405, headers: { Allow: "GET" } },
  );
}
