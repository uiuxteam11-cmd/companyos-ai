import { createClient } from "@/lib/supabase/server";
import { createAgentEvent, getAgentRun } from "@/lib/workspace/agent-service";
import { cancelAgentRun, resumeApprovedAgentRun } from "@/lib/workspace/agent-runtime";
import type { ApprovalDecision, ApprovalRecord } from "@/lib/approvals/approval-types";

export async function decideApproval(input: { workspaceId: string; agentId: string; runId: string; approvalId: string; decidedBy: string; decision: ApprovalDecision; reason?: string }) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: approval, error } = await supabase
    .from("approvals")
    .select("*")
    .eq("id", input.approvalId)
    .eq("workspace_id", input.workspaceId)
    .eq("agent_id", input.agentId)
    .eq("run_id", input.runId)
    .eq("status", "pending")
    .single();
  if (error || !approval) throw new Error("Pending approval was not found.");

  // Decisions are only meaningful while the execution is held at the approval
  // gate. This prevents a late approval from reviving a completed or cancelled run.
  const run = await getAgentRun(input.workspaceId, input.agentId, input.runId);
  if (run.status !== "waiting_approval") {
    throw new Error("This approval can only be decided while the run is waiting for approval.");
  }

  const now = new Date().toISOString();
  const { data: resolved, error: resolveError } = await supabase
    .from("approvals")
    .update({ status: input.decision, decided_by: input.decidedBy, decision_reason: input.reason ?? null, decided_at: now })
    .eq("id", approval.id)
    .eq("status", "pending")
    .select()
    .single();
  if (resolveError || !resolved) throw resolveError ?? new Error("Approval was already decided.");

  if (input.decision === "approved") {
    if (approval.tool_call_id) await supabase.from("tool_calls").update({ status: "queued" }).eq("id", approval.tool_call_id);
    await resumeApprovedAgentRun(input.workspaceId, input.agentId, input.runId, input.decidedBy);
  } else {
    const reason = input.reason ?? (input.decision === "cancelled" ? "Approval was cancelled." : "Rejected by approver.");
    if (approval.tool_call_id) await supabase.from("tool_calls").update({ status: "blocked", error_message: reason, completed_at: now }).eq("id", approval.tool_call_id);
    await cancelAgentRun(input.workspaceId, input.agentId, input.runId, input.decidedBy);
  }

  await createAgentEvent(input.workspaceId, {
    agent_id: input.agentId, task_id: approval.task_id, run_id: input.runId,
    event_type: input.decision === "approved" ? "APPROVAL_GRANTED" : input.decision === "rejected" ? "APPROVAL_REJECTED" : "APPROVAL_CANCELLED",
    message: input.decision === "approved" ? "Human approved the action; the run resumed for controlled execution." : input.decision === "rejected" ? "Human rejected the action; the run was cancelled." : "The approval was cancelled and the run was cancelled.",
    payload: { approvalId: approval.id, toolCallId: approval.tool_call_id, decisionReason: input.reason ?? null },
  }, input.decidedBy);
  return resolved as ApprovalRecord;
}
