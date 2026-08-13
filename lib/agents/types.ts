import type { AgentRun, AgentTask } from "@/types/agent";

export type AgentType = "sales" | "marketing" | "research" | "operations" | "finance" | "legal";
export type CanonicalAgentTask = Pick<AgentTask, "id" | "workspace_id" | "agent_id" | "created_by" | "instruction" | "status" | "created_at" | "updated_at"> & {
  current_step: string | null;
};
export type CanonicalAgentRun = Pick<AgentRun, "id" | "workspace_id" | "agent_id" | "task_id" | "status" | "current_step" | "created_at">;

export type PlannedToolStep = {
  sequence: number;
  toolId: "workspace_search" | "calculator" | "create_task";
  input: Record<string, unknown>;
  rationale: string;
};

export type AgentPlan = { taskId: string; steps: PlannedToolStep[] };
