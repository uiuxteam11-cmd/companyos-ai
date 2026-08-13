import type {
  AgentRunStatus,
  AgentTask,
} from "@/types/agent";

export type PlannedStep = {
  sequence: number;
  toolId:
    | "workspace_search"
    | "calculator"
    | "create_task"
    | "search_web"
    | "read_page"
    | "request_approval"
    | string;
  input: Record<string, unknown>;
  rationale: string;
};

export type AgentPlan = {
  taskId: string;
  steps: PlannedStep[];
};

const transitions: Record<AgentRunStatus, readonly AgentRunStatus[]> = {
  queued: ["planning", "paused", "cancelled"],
  planning: ["running", "failed", "cancelled"],
  running: [
    "waiting_approval",
    "paused",
    "completed",
    "failed",
    "cancelled",
  ],
  waiting_approval: ["running", "paused", "failed", "cancelled"],
  paused: ["running", "cancelled"],
  completed: [],
  failed: [],
  cancelled: [],
};

export function canTransitionRun(
  from: AgentRunStatus,
  to: AgentRunStatus,
): boolean {
  return transitions[from].includes(to);
}

export function assertRunTransition(
  from: AgentRunStatus,
  to: AgentRunStatus,
): void {
  if (!canTransitionRun(from, to)) {
    throw new Error(
      `Invalid agent run transition: ${from} -> ${to}.`,
    );
  }
}

/**
 * Creates a simple deterministic agent plan.
 *
 * This is intentionally lightweight for the current runtime.
 * More advanced planning can be added later without changing
 * the state-machine transition logic.
 */
export function createAgentPlan(
  task: AgentTask | string,
): AgentPlan {
  const taskId =
    typeof task === "string"
      ? task
      : task.id;

  const instruction =
    typeof task === "string"
      ? task
      : task.instruction;

  return {
    taskId,
    steps: [
      {
        sequence: 1,
        toolId: "workspace_search",
        input: {
          query: instruction,
        },
        rationale:
          "Search the workspace for context relevant to the requested task.",
      },
    ],
  };
}