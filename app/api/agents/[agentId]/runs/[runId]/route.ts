import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceContext } from "@/lib/workspace/workspace-service";
import {
  getAgentRun,
} from "@/lib/workspace/agent-service";

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
    const run = await getAgentRun(workspaceContext.workspace.id, agentId, runId);
    return NextResponse.json({ run }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load run." }, { status: 404 });
  }
}
