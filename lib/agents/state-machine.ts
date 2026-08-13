import type { AgentRunStatus } from "@/types/agent";

const transitions: Record<AgentRunStatus, readonly AgentRunStatus[]> = {
  queued: ["planning", "paused", "cancelled"],
  planning: ["running", "failed", "cancelled"],
  running: ["waiting_approval", "paused", "completed", "failed", "cancelled"],
  waiting_approval: ["running", "paused", "failed", "cancelled"],
  paused: ["running", "cancelled"],
  completed: [],
  failed: [],
  cancelled: [],
};

export function canTransitionRun(from: AgentRunStatus, to: AgentRunStatus): boolean {
  return transitions[from].includes(to);
}

export function assertRunTransition(from: AgentRunStatus, to: AgentRunStatus) {
  if (!canTransitionRun(from, to)) throw new Error(`Invalid agent run transition: ${from} -> ${to}.`);
}
