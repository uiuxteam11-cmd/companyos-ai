import { createClient } from "@/lib/supabase/server";
import { planTask } from "@/lib/agents/planner";
import { assertRunTransition } from "@/lib/agents/state-machine";
import { executeRunTool } from "@/lib/agents/tool-execution";
import { findExecutionLimitBreach } from "@/lib/agents/execution-limits";
import { createAgentEvent, getAgentRun, getAgentTask, updateAgentRun } from "@/lib/workspace/agent-service";

export type OrchestrateRunInput = { workspaceId: string; agentId: string; taskId: string; runId: string; userId: string };

/**
 * Canonical persisted agent loop: task -> plan -> step -> policy/tool ->
 * observation/result -> verification -> next step. MVP plans one safe step.
 */
export async function orchestrateRun(input: OrchestrateRunInput) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const [task, run] = await Promise.all([
    getAgentTask(input.workspaceId, input.agentId, input.taskId),
    getAgentRun(input.workspaceId, input.agentId, input.runId),
  ]);
  if (run.task_id !== task.id || run.status !== "queued") throw new Error("Run is not queued for orchestration.");

  const limitBreach = await findExecutionLimitBreach(run, "step");
  if (limitBreach) {
    await updateAgentRun(input.workspaceId, input.agentId, input.runId, { status: "paused", current_step: limitBreach.message });
    await createAgentEvent(input.workspaceId, { agent_id: input.agentId, task_id: input.taskId, run_id: input.runId, event_type: "RUN_LIMIT_REACHED", message: limitBreach.message, payload: { limit: limitBreach.name } }, input.userId);
    return { status: "paused" as const, reason: limitBreach.message };
  }

  assertRunTransition(run.status, "planning");
  await updateAgentRun(input.workspaceId, input.agentId, input.runId, { status: "planning", current_step: "Planning safe tool steps", started_at: new Date().toISOString() });
  await createAgentEvent(input.workspaceId, { agent_id: input.agentId, task_id: input.taskId, run_id: input.runId, event_type: "AGENT_PLANNING", message: "Creating a policy-bound execution plan.", payload: {} }, input.userId);

  const plan = planTask(task);
  const step = plan.steps[0];
  if (!step) throw new Error("Planner produced no executable steps.");
  const { data: persistedStep, error: stepError } = await supabase.from("agent_steps").insert({
    workspace_id: input.workspaceId, agent_id: input.agentId, task_id: input.taskId, run_id: input.runId,
    sequence: step.sequence, step_type: "tool", status: "running", input: { toolId: step.toolId, input: step.input, rationale: step.rationale }, started_at: new Date().toISOString(),
  }).select().single();
  if (stepError || !persistedStep) throw stepError ?? new Error("Unable to persist agent step.");

  assertRunTransition("planning", "running");
  await updateAgentRun(input.workspaceId, input.agentId, input.runId, { status: "running", current_step: step.rationale });
  const result = await executeRunTool({ ...input, toolId: step.toolId, input: step.input });
  const stepStatus = result.status === "completed" ? "completed" : result.status === "waiting_approval" ? "waiting_approval" : "failed";
  await supabase.from("agent_steps").update({ status: stepStatus, output: result.result ?? null, completed_at: result.status === "waiting_approval" ? null : new Date().toISOString() }).eq("id", persistedStep.id);

  if (result.status === "completed") {
    await updateAgentRun(input.workspaceId, input.agentId, input.runId, { status: "completed", current_step: "Verified execution completed", output: { toolCallId: result.toolCallId, result: result.result }, completed_at: new Date().toISOString() });
    await createAgentEvent(input.workspaceId, { agent_id: input.agentId, task_id: input.taskId, run_id: input.runId, event_type: "AGENT_COMPLETED", message: "Planned tool step completed and verified.", payload: { toolCallId: result.toolCallId } }, input.userId);
  } else if (result.status === "failed") {
    await updateAgentRun(input.workspaceId, input.agentId, input.runId, { status: "failed", current_step: "Execution failed verification", error_message: result.verification?.message ?? "Tool execution failed.", completed_at: new Date().toISOString() });
    await createAgentEvent(input.workspaceId, { agent_id: input.agentId, task_id: input.taskId, run_id: input.runId, event_type: "AGENT_FAILED", message: "Tool execution failed verification.", payload: { toolCallId: result.toolCallId } }, input.userId);
  }
  return result;
}
