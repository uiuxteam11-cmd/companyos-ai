export type ModelName = string;

export type AIUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type AIMessageRole = "system" | "user" | "assistant" | "tool";

export type AIMessage = {
  role: AIMessageRole;
  content: string;
  name?: string;
  metadata?: Record<string, unknown>;
};

export type AIToolCall = {
  id?: string;
  name: string;
  arguments?: Record<string, unknown>;
  raw?: unknown;
};

export type AIExecutionError = {
  code: "AUTH_ERROR" | "INVALID_REQUEST" | "RATE_LIMIT" | "TIMEOUT" | "PROVIDER_ERROR" | "TOOL_ERROR" | "CANCELLED" | "UNKNOWN";
  message: string;
  retryable?: boolean;
  provider?: string;
  details?: Record<string, unknown>;
};

export type AIProviderConfig = {
  providerId: string;
  options?: Record<string, unknown>;
};

export type AIExecutionRequest = {
  system?: string | null;
  messages?: AIMessage[];
  model?: ModelName;
  temperature?: number | null;
  maxTokens?: number | null;
  tools?: unknown[];
  metadata?: Record<string, unknown>;
};

export type AIExecutionResponse = {
  content: string | null;
  provider: string;
  model?: ModelName;
  finishReason?: string | null;
  usage?: AIUsage | null;
  toolCalls?: AIToolCall[];
  raw?: unknown;
  metadata?: Record<string, unknown>;
};

export type AIExecutionContext = {
  workspaceId: string;
  userId?: string | null;
  agentId?: string | null;
  taskId?: string | null;
  runId?: string | null;
  systemInstructions?: string | null;
  previousMessages?: AIMessage[];
  metadata?: Record<string, unknown>;
};

export interface AIProvider {
  id: string;
  config?: AIProviderConfig;
  call(request: AIExecutionRequest, context: AIExecutionContext): Promise<AIExecutionResponse>;
}
