import { createClient } from "@/lib/supabase/server";
import { getTool } from "@/lib/ai/tools/tool-registry";
import { executeAgentTool } from "@/lib/tools/registry";
import { evaluateSecurityGateway } from "@/lib/gateways/security-gateway";
import { verifyActionResult } from "@/lib/agents/verifier";
import { createAgentEvent, getAgentRun, getAgentTask, getWorkspaceAgent, updateAgentRun } from "@/lib/workspace/agent-service";
import { resolveAgentDefinition } from "@/lib/agents/definition-resolution";
import { findExecutionLimitBreach } from "@/lib/agents/execution-limits";

export type ExecuteRunToolInput = {
  workspaceId: string;
  agentId: string;
  taskId: string;
  runId: string;
  userId: string;
  toolId: string;
  input: unknown;
};

export type ExecuteRunToolResult = {
  status: "completed" | "waiting_approval" | "failed";
  toolCallId: string;
  result?: unknown;
  approvalId?: string;
  verification?: { passed: boolean; message: string };
};

export async function executeRunTool(input: ExecuteRunToolInput): Promise<ExecuteRunToolResult> {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const [task, run, agent] = await Promise.all([
    getAgentTask(input.workspaceId, input.agentId, input.taskId),
    getAgentRun(input.workspaceId, input.agentId, input.runId),
    getWorkspaceAgent(input.workspaceId, input.agentId),
  ]);
  if (task.workspace_id !== input.workspaceId || run.task_id !== input.taskId || run.status !== "running") {
    throw new Error("The run is not active for this task.");
  }

  const limitBreach = await findExecutionLimitBreach(run, "tool_call");
  if (limitBreach) {
    await updateAgentRun(input.workspaceId, input.agentId, input.runId, { status: "paused", current_step: limitBreach.message });
    await createAgentEvent(input.workspaceId, { agent_id: input.agentId, task_id: input.taskId, run_id: input.runId, event_type: "RUN_LIMIT_REACHED", message: limitBreach.message, payload: { limit: limitBreach.name } }, input.userId);
    throw new Error(limitBreach.message);
  }

  const tool = getTool(input.toolId);
  if (!tool) throw new Error("Requested tool is not allowlisted.");
  const definition = resolveAgentDefinition(agent);
  if (!definition.tools.includes(tool.id)) throw new Error(`${definition.role} is not allowed to use ${tool.id}.`);
  if (tool.permission === "TOOL_EXTERNAL" && !definition.policies.allowExternalActions) throw new Error(`${definition.role} is not allowed to make external requests.`);
  const riskRank = { low: 1, medium: 2, high: 3, critical: 4 } as const;
  if (riskRank[tool.riskLevel] > riskRank[definition.policies.maxRisk]) throw new Error(`${definition.role} policy does not allow ${tool.riskLevel}-risk tools.`);

  const requiredPermission = tool.permission === "TOOL_EXTERNAL" ? "api:read" : tool.permission === "TOOL_WRITE" && tool.id !== "create_task" ? "saas:write" : undefined;

  const security = evaluateSecurityGateway({
    action: tool.id,
    content: typeof input.input === "string" ? input.input : JSON.stringify(input.input),
    grantedPermissions: definition.permissions,
    requiredPermission,
    riskOverride: tool.riskLevel,
  });

  const { data: toolCall, error: toolCallError } = await supabase
    .from("tool_calls")
    .insert({
      workspace_id: input.workspaceId,
      agent_id: input.agentId,
      task_id: input.taskId,
      run_id: input.runId,
      tool_name: tool.id,
      risk_level: tool.riskLevel,
      status: security.allowed ? "running" : "blocked",
      input: { value: security.redactedContent ?? null, piiCount: security.piiCount, secretCount: security.secretCount, agentType: definition.type },
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (toolCallError || !toolCall) throw toolCallError ?? new Error("Unable to record tool call.");

  await createAgentEvent(input.workspaceId, {
    agent_id: input.agentId,
    task_id: input.taskId,
    run_id: input.runId,
    event_type: "TOOL_STARTED",
    message: `Executing ${tool.name}.`,
    payload: { toolCallId: toolCall.id, toolId: tool.id, risk: tool.riskLevel, piiCount: security.piiCount, secretCount: security.secretCount, agentType: definition.type },
  }, input.userId);

  if (!security.allowed) {
    await supabase.from("tool_calls").update({ status: "blocked", error_message: security.reason, completed_at: new Date().toISOString() }).eq("id", toolCall.id);
    throw new Error(security.reason ?? "Security policy denied this tool action.");
  }

  if (security.policy.requiresApproval) {
    const { data: approval, error: approvalError } = await supabase
      .from("approvals")
      .insert({ workspace_id: input.workspaceId, agent_id: input.agentId, task_id: input.taskId, run_id: input.runId, tool_call_id: toolCall.id, requested_by: input.userId, action: tool.id, risk_level: tool.riskLevel, reason: security.policy.reason, input: { value: security.redactedContent ?? null, piiCount: security.piiCount, secretCount: security.secretCount } })
      .select()
      .single();
    if (approvalError || !approval) throw approvalError ?? new Error("Unable to create approval request.");

    await supabase.from("tool_calls").update({ status: "blocked" }).eq("id", toolCall.id);
    await updateAgentRun(input.workspaceId, input.agentId, input.runId, { status: "waiting_approval", current_step: `Approval required for ${tool.name}` });
    await createAgentEvent(input.workspaceId, { agent_id: input.agentId, task_id: input.taskId, run_id: input.runId, event_type: "APPROVAL_REQUESTED", message: `${tool.name} requires approval.`, payload: { approvalId: approval.id, toolCallId: toolCall.id, risk: tool.riskLevel } }, input.userId);
    return { status: "waiting_approval", toolCallId: toolCall.id, approvalId: approval.id };
  }

  const result = await executeAgentTool(tool.id, input.input, { workspaceId: input.workspaceId, userId: input.userId, agentId: input.agentId, taskId: input.taskId, runId: input.runId });
  const verification = verifyActionResult(result.ok ? result.result : null);
  const status = result.ok && verification.passed ? "completed" : "failed";
  await supabase.from("tool_calls").update({ status, output: result.result ?? null, error_message: result.error ?? (verification.passed ? null : verification.message), completed_at: new Date().toISOString() }).eq("id", toolCall.id);
  await updateAgentRun(input.workspaceId, input.agentId, input.runId, { current_step: `${tool.name}: ${verification.message}` });
  await createAgentEvent(input.workspaceId, { agent_id: input.agentId, task_id: input.taskId, run_id: input.runId, event_type: status === "completed" ? "TOOL_COMPLETED" : "TOOL_FAILED", message: verification.message, payload: { toolCallId: toolCall.id, toolId: tool.id, verification, result: result.result ?? null } }, input.userId);

  return { status, toolCallId: toolCall.id, result: result.result, verification };
}
