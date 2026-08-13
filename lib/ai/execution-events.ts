import { createAgentEvent } from "@/lib/workspace/agent-service";

export type ExecutionEventType =
  | "execution.started"
  | "execution.thinking"
  | "execution.message"
  | "execution.tool_call"
  | "execution.tool_result"
  | "execution.approval_required"
  | "execution.paused"
  | "execution.resumed"
  | "execution.completed"
  | "execution.failed"
  | "execution.cancelled"
  | "execution.retrying";

export type NormalizedExecutionEvent = {
  workspaceId: string;
  agentId?: string | null;
  taskId?: string | null;
  runId?: string | null;
  timestamp: string;
  type: ExecutionEventType;
  message: string;
  payload: Record<string, unknown>;
  userId?: string | null;
};

export function createExecutionEvent(input: Omit<NormalizedExecutionEvent, "timestamp"> & { timestamp?: string }): NormalizedExecutionEvent {
  return {
    ...input,
    timestamp: input.timestamp ?? new Date().toISOString(),
    payload: input.payload ?? {},
  };
}

export async function emitExecutionEvent(input: Omit<NormalizedExecutionEvent, "timestamp"> & { timestamp?: string }) {
  const event = createExecutionEvent(input);
  await createAgentEvent(
    event.workspaceId,
    {
      agent_id: event.agentId ?? null,
      task_id: event.taskId ?? null,
      run_id: event.runId ?? null,
      event_type: event.type,
      message: event.message,
      payload: event.payload,
    },
    event.userId ?? undefined,
  );

  return event;
}
