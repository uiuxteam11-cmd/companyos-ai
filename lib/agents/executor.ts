import type { PlannedToolStep } from "@/lib/agents/types";

export type ExecutionResult = { step: PlannedToolStep; status: "ready" | "waiting_approval" | "completed" | "failed"; output?: unknown };

/** Execution is performed by tool-execution.ts; this function intentionally has no mock side effects. */
export function prepareExecution(step: PlannedToolStep): ExecutionResult {
  return { step, status: "ready" };
}
