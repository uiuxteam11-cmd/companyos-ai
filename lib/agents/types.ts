// lib/agents/types.ts

export type AgentType = "sales" | "research" | "operations" | "marketing" | "legal";
export type AgentTaskStatus = 
  | "queued" 
  | "planning" 
  | "running" 
  | "waiting_approval" 
  | "paused" 
  | "completed" 
  | "failed" 
  | "cancelled";

export interface AgentTask {
  id: string;
  userId: string;
  workspaceId: string;
  agentType: AgentType;
  goal: string;
  status: AgentTaskStatus;
  currentStep: string;
  createdAt: number;
  updatedAt: number;
  executionHistory: string[];
}

export interface AgentTool {
  name: string;
  description: string;
  riskLevel: "low" | "medium" | "high";
  inputSchema: unknown;
  execute(input: unknown, context: AgentContext): Promise<ToolResult>;
}

export interface AgentContext {
  taskId: string;
  workspaceId: string;
}

export interface ToolResult {
  success: boolean;
  data: string;
}