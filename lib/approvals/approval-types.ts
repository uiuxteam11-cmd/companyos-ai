export type ApprovalDecision = "approved" | "rejected" | "cancelled";

export type ApprovalRecord = {
  id: string;
  workspace_id: string;
  agent_id: string;
  task_id: string;
  run_id: string;
  tool_call_id: string | null;
  action: string;
  risk_level: "low" | "medium" | "high" | "critical";
  status: "pending" | "approved" | "rejected" | "cancelled";
  reason: string;
  decision_reason: string | null;
  decided_by: string | null;
  decided_at: string | null;
};
