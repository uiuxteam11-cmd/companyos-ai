import type { AgentRun, AgentTask } from "@/types/agent";

export type { AgentRun, AgentTask } from "@/types/agent";

export type AgentType =
  | "sales"
  | "marketing"
  | "research"
  | "operations"
  | "finance"
  | "legal";

export type CanonicalAgentTask = Pick<
  AgentTask,
  | "id"
  | "workspace_id"
  | "agent_id"
  | "created_by"
  | "instruction"
  | "status"
  | "created_at"
  | "updated_at"
> & {
  current_step: string | null;
};

export type CanonicalAgentRun = Pick<
  AgentRun,
  | "id"
  | "workspace_id"
  | "agent_id"
  | "task_id"
  | "status"
  | "current_step"
  | "created_at"
>;

export type PlannedToolStep = {
  sequence: number;
  toolId: "workspace_search" | "calculator" | "create_task";
  input: Record<string, unknown>;
  rationale: string;
};

export type AgentPlan = {
  taskId: string;
  steps: PlannedToolStep[];
};

/**
 * Compatibility contracts for the imported V2 UI.
 * These are not the persisted runtime entities.
 */
export type LegacyAgentTaskStatus =
  | "queued"
  | "planning"
  | "running"
  | "waiting_approval"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export type LegacyAgentTask = {
  id: string;
  workspaceId: string;
  agentType: AgentType;
  goal: string;
  status: LegacyAgentTaskStatus;
  currentStep: string;
  createdAt: number;
  updatedAt: number;
  executionHistory: string[];
};

export type AgentTool = {
  name: string;
  description: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  inputSchema: unknown;
};

export type AgentContext = {
  taskId: string;
  workspaceId: string;
  agentId?: string;
  runId?: string;
  userId?: string;
};

export type ToolResult = {
  success: boolean;
  data: string;
};