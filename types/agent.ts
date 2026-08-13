export type AgentStatus = "active" | "paused" | "archived";

export type Agent = {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  status: AgentStatus;
  system_prompt: string | null;
  configuration: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type AgentTaskStatus =
  | "queued"
  | "planning"
  | "running"
  | "waiting_approval"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export type AgentTask = {
  id: string;
  workspace_id: string;
  agent_id: string;
  created_by: string;
  title: string;
  instruction: string;
  status: AgentTaskStatus;
  priority: number;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error_message: string | null;
  current_step: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
};

export type AgentRunStatus = AgentTaskStatus;

export type AgentRun = {
  id: string;
  workspace_id: string;
  agent_id: string;
  task_id: string;
  status: AgentRunStatus;
  started_at: string | null;
  completed_at: string | null;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error_message: string | null;
  current_step: string | null;
  max_steps: number;
  max_duration_seconds: number;
  max_tool_calls: number;
  max_retries: number;
  max_browser_actions: number;
  max_cost: number;
  accrued_cost: number;
  retry_count: number;
  browser_action_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AgentEvent = {
  id: string;
  workspace_id: string;
  agent_id: string | null;
  task_id: string | null;
  run_id: string | null;
  event_type: string;
  message: string | null;
  payload: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
};

export type AgentToolCall = {
  id: string;
  workspace_id: string;
  agent_id: string;
  task_id: string;
  run_id: string;
  tool_name: string;
  risk_level: "low" | "medium" | "high" | "critical";
  status: "queued" | "running" | "completed" | "failed" | "blocked";
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type BrowserSession = {
  id: string;
  workspace_id: string;
  agent_id: string;
  task_id: string;
  run_id: string;
  provider: string;
  provider_session_id: string;
  status: "created" | "active" | "human_control" | "closed" | "failed";
  current_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
