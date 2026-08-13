import { cancelAgentRun } from "@/lib/workspace/agent-runtime";
import { getAgentRun } from "@/lib/workspace/agent-service";

export type ExecutionControlOptions = {
  workspaceId: string;
  agentId: string;
  runId: string;
  userId?: string;
  reason?: string;
  signal?: AbortSignal;
};

export async function cancelExecution(options: ExecutionControlOptions) {
  const run = await getAgentRun(options.workspaceId, options.agentId, options.runId).catch(() => null);
  if (!run) {
    throw new Error("Run not found.");
  }

  if (run.status === "cancelled" || run.status === "completed" || run.status === "failed") {
    return run;
  }

  return cancelAgentRun(options.workspaceId, options.agentId, options.runId, options.userId);
}

export async function applyAbortSignal(signal: AbortSignal | undefined, onAbort: () => Promise<void> | void) {
  if (!signal) return;
  if (signal.aborted) {
    await onAbort();
    return;
  }

  signal.addEventListener("abort", () => {
    void onAbort();
  }, { once: true });
}
