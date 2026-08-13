import assert from "node:assert";
import { describe, it } from "node:test";
import {
  createApprovalRequest,
  approveApprovalRequest,
  rejectApprovalRequest,
} from "../lib/ai/approvals.ts";

describe("approval helpers", () => {
  it("creates a pending request", () => {
    const request = createApprovalRequest({
      id: "approval-1",
      workspaceId: "workspace-1",
      agentId: "agent-1",
      userId: "user-1",
      action: "execute-task",
      reason: "Need approval",
    });

    assert.equal(request.status, "pending");
    assert.equal(request.id, "approval-1");
    assert.equal(request.workspaceId, "workspace-1");
    assert.equal(request.agentId, "agent-1");
    assert.equal(request.userId, "user-1");
    assert.equal(request.action, "execute-task");
    assert.equal(request.reason, "Need approval");
    assert.equal(request.resolvedAt, null);
  });

  it("approves a pending request", () => {
    const request = createApprovalRequest({
      id: "approval-2",
      workspaceId: "workspace-1",
      agentId: "agent-1",
      userId: "user-1",
      action: "approve",
      reason: "Please approve",
    });

    const approved = approveApprovalRequest(request, "approver-1");

    assert.equal(approved.status, "approved");
    assert.equal(approved.userId, "approver-1");
    assert.ok(approved.resolvedAt);
  });

  it("rejects a pending request", () => {
    const request = createApprovalRequest({
      id: "approval-3",
      workspaceId: "workspace-1",
      agentId: "agent-1",
      userId: "user-1",
      action: "reject",
      reason: "Please reject",
    });

    const rejected = rejectApprovalRequest(request, "approver-2", "Not allowed");

    assert.equal(rejected.status, "rejected");
    assert.equal(rejected.userId, "approver-2");
    assert.equal(rejected.reason, "Not allowed");
    assert.ok(rejected.resolvedAt);
  });

  it("throws when approving a resolved request", () => {
    const request = {
      ...createApprovalRequest({
        id: "approval-4",
        workspaceId: "workspace-1",
        agentId: "agent-1",
        userId: "user-1",
        action: "approve",
        reason: "Already resolved",
      }),
      status: "approved" as const,
      resolvedAt: new Date().toISOString(),
    };

    assert.throws(() => approveApprovalRequest(request, "approver-1"), {
      message: "Approval request is not pending.",
    });
  });

  it("throws when rejecting a resolved request", () => {
    const request = {
      ...createApprovalRequest({
        id: "approval-5",
        workspaceId: "workspace-1",
        agentId: "agent-1",
        userId: "user-1",
        action: "reject",
        reason: "Already resolved",
      }),
      status: "rejected" as const,
      resolvedAt: new Date().toISOString(),
    };

    assert.throws(() => rejectApprovalRequest(request, "approver-2", "Still nope"), {
      message: "Approval request is not pending.",
    });
  });
});
