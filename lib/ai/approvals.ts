export type ApprovalStatus = "pending" | "approved" | "rejected";

export type ApprovalRequest = {
  id: string;
  workspaceId: string;
  agentId: string;
  taskId?: string | null;
  runId?: string | null;
  userId: string;
  action: string;
  reason: string;
  status: ApprovalStatus;
  createdAt: string;
  resolvedAt?: string | null;
};

export function createApprovalRequest(input: Omit<ApprovalRequest, "status" | "createdAt" | "resolvedAt">): ApprovalRequest {
  return {
    ...input,
    status: "pending",
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };
}

export function approveApprovalRequest(request: ApprovalRequest, approverUserId: string): ApprovalRequest {
  if (request.status !== "pending") {
    throw new Error("Approval request is not pending.");
  }
  return {
    ...request,
    status: "approved",
    resolvedAt: new Date().toISOString(),
    userId: approverUserId,
  };
}

export function rejectApprovalRequest(request: ApprovalRequest, approverUserId: string, reason?: string): ApprovalRequest {
  if (request.status !== "pending") {
    throw new Error("Approval request is not pending.");
  }
  return {
    ...request,
    status: "rejected",
    reason: reason ?? request.reason,
    resolvedAt: new Date().toISOString(),
    userId: approverUserId,
  };
}
