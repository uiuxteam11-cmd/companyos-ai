import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceContext } from "@/lib/workspace/workspace-service";
import { decideApproval } from "@/lib/approvals/approval-service";

export async function POST(request: Request, context: { params: Promise<{ agentId: string; runId: string; approvalId: string }> }) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceContext = await getCurrentWorkspaceContext(user.id);
  if (!workspaceContext) return NextResponse.json({ error: "Workspace context not found." }, { status: 403 });
  if (!(["owner", "admin"] as string[]).includes(workspaceContext.membership.role)) return NextResponse.json({ error: "Only workspace owners and admins can approve high-risk actions." }, { status: 403 });
  const [params, body] = await Promise.all([context.params, request.json().catch(() => ({}))]);
  try {
    const approval = await decideApproval({ workspaceId: workspaceContext.workspace.id, agentId: params.agentId, runId: params.runId, approvalId: params.approvalId, decidedBy: user.id, decision: "approved", reason: typeof body.reason === "string" ? body.reason : undefined });
    return NextResponse.json({ approval }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Approval failed." }, { status: 400 });
  }
}
