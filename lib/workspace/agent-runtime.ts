import { createClient } from "@/lib/supabase/server";
import type { AgentRun } from "@/types/agent";
import {
  createAgentRun,
  createAgentEvent,
  listAgentRuns,
} from "@/lib/workspace/agent-service";

// Allowed statuses mirror the governed agent control-plane migration.
export type RunStatus = "queued" | "planning" | "running" | "waiting_approval" | "paused" | "completed" | "failed" | "cancelled";

const ACTIVE_STATUSES: RunStatus[] = ["queued", "planning", "running", "waiting_approval", "paused"];

// Emit a runtime event (wrapper around service createAgentEvent)
export async function emitAgentEvent(
  workspaceId: string,
  event: {
    agent_id?: string | null;
    task_id?: string | null;
    run_id?: string | null;
    event_type: string;
    message?: string | null;
    payload?: unknown;
  },
  userId?: string,
) {
  // Build payload according to validation shape
  const body = {
    agent_id: event.agent_id ?? null,
    task_id: event.task_id ?? null,
    run_id: event.run_id ?? null,
    event_type: event.event_type,
    message: event.message ?? null,
    payload: event.payload ?? {},
  };

  return await createAgentEvent(workspaceId, body as unknown, userId);
}

// Idempotent start: if there's an existing active run for the same task, return it
export async function startAgentRun(workspaceId: string, agentId: string, taskId: string, userId: string) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  // Check for an existing active run for this task
  const runs = await listAgentRuns(workspaceId, agentId);
  const existing = runs.find((r) => r.task_id === taskId && ACTIVE_STATUSES.includes(r.status as RunStatus));

  if (existing) {
    // Return existing run (idempotent)
    return existing as AgentRun;
  }

  // Create a new run (queued)
  const run = await createAgentRun(workspaceId, agentId, taskId, {});

  // A start request only queues work. The canonical orchestrator owns planning
  // and the queued -> planning -> running transitions.
  await emitAgentEvent(workspaceId, {
    agent_id: agentId,
    task_id: taskId,
    run_id: run.id,
    event_type: "RUN_CREATED",
    message: "Run created and queued",
  }, userId);

  await emitAgentEvent(workspaceId, {
    agent_id: agentId,
    task_id: taskId,
    run_id: run.id,
    event_type: "AGENT_READY_FOR_EXECUTION",
    message: "Run is queued and waiting for a planned, verified tool action.",
  }, userId);

  return run as AgentRun;
}

async function _transitionRunStatus(
  workspaceId: string,
  agentId: string,
  runId: string,
  allowedFrom: RunStatus[],
  to: RunStatus,
  userId?: string,
  extraFields?: Record<string, unknown>,
) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  // Conditional update to protect against concurrent transitions
  const { data, error } = await supabase
    .from("agent_runs")
    .update({ status: to, ...extraFields })
    .eq("id", runId)
    .eq("workspace_id", workspaceId)
    .eq("agent_id", agentId)
    .in("status", allowedFrom as unknown as string[])
    .select()
    .single();

  if (error || !data) {
    throw new Error("Invalid state transition or run not found.");
  }

  await emitAgentEvent(workspaceId, {
    agent_id: agentId,
    task_id: data.task_id,
    run_id: runId,
    event_type: `RUN_${to.toUpperCase()}`,
    message: `Run status changed to ${to}`,
  }, userId);

  return data as AgentRun;
}

export async function pauseAgentRun(workspaceId: string, agentId: string, runId: string, userId?: string) {
  const run = await _transitionRunStatus(workspaceId, agentId, runId, ["running", "waiting_approval"], "paused", userId);

  // Emit explicit paused/waiting event
  await emitAgentEvent(workspaceId, {
    agent_id: agentId,
    task_id: run.task_id,
    run_id: runId,
    event_type: "RUN_PAUSED",
    message: "Run paused and waiting for continuation",
  }, userId);

  return run;
}

export async function resumeAgentRun(workspaceId: string, agentId: string, runId: string, userId?: string) {
  const run = await _transitionRunStatus(workspaceId, agentId, runId, ["paused"], "running", userId);

  await emitAgentEvent(workspaceId, {
    agent_id: agentId,
    task_id: run.task_id,
    run_id: runId,
    event_type: "RUN_RESUMED",
    message: "Run resumed",
  }, userId);

  return run;
}

/** Only the server-side approval service may release an approval gate. */
export async function resumeApprovedAgentRun(workspaceId: string, agentId: string, runId: string, userId?: string) {
  const run = await _transitionRunStatus(workspaceId, agentId, runId, ["waiting_approval"], "running", userId);
  await emitAgentEvent(workspaceId, {
    agent_id: agentId,
    task_id: run.task_id,
    run_id: runId,
    event_type: "RUN_RESUMED_AFTER_APPROVAL",
    message: "Run resumed after a verified approval decision.",
  }, userId);
  return run;
}

export async function cancelAgentRun(workspaceId: string, agentId: string, runId: string, userId?: string) {
  return _transitionRunStatus(workspaceId, agentId, runId, ["queued", "planning", "running", "waiting_approval", "paused"], "cancelled", userId, { completed_at: new Date().toISOString() });
}

export async function failAgentRun(workspaceId: string, agentId: string, runId: string, userId?: string, message?: string) {
  return _transitionRunStatus(workspaceId, agentId, runId, ["queued", "planning", "running", "waiting_approval", "paused"], "failed", userId, { completed_at: new Date().toISOString(), error_message: message ?? null });
}

export async function completeAgentRun(workspaceId: string, agentId: string, runId: string, userId?: string, output?: unknown) {
  return _transitionRunStatus(workspaceId, agentId, runId, ["running"], "completed", userId, { completed_at: new Date().toISOString(), output: output ?? {} });
}
