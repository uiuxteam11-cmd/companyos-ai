import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceContext } from "@/lib/workspace/workspace-service";
import { pauseAgentRun, resumeAgentRun, cancelAgentRun } from "@/lib/workspace/agent-runtime";
import { setHumanControl } from "@/lib/control/human-control-service";

export async function POST(request: NextRequest, context: { params: Promise<{ agentId: string; runId: string }> }) {
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

  const body = await request.json().catch(() => ({}));
  const action = (body.action ?? body.cmd ?? "").toString().toLowerCase();

  if (!(["owner", "admin", "member"] as string[]).includes(workspaceContext.membership.role)) {
    return NextResponse.json({ error: "Your workspace role cannot control agent execution." }, { status: 403 });
  }

  try {
    let result;
    switch (action) {
      case "pause":
        result = await pauseAgentRun(workspaceContext.workspace.id, agentId, runId, user.id);
        break;
      case "resume":
        result = await resumeAgentRun(workspaceContext.workspace.id, agentId, runId, user.id);
        break;
      case "cancel":
        result = await cancelAgentRun(workspaceContext.workspace.id, agentId, runId, user.id);
        break;
      case "take_over":
      case "takeover":
        await pauseAgentRun(workspaceContext.workspace.id, agentId, runId, user.id);
        result = await setHumanControl({ workspaceId: workspaceContext.workspace.id, agentId, runId, userId: user.id, enabled: true });
        break;
      case "return_control":
        result = await setHumanControl({ workspaceId: workspaceContext.workspace.id, agentId, runId, userId: user.id, enabled: false });
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ run: result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to perform action." }, { status: 400 });
  }
}
