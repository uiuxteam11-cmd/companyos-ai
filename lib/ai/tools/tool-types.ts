import type { z } from "zod";
import type { ActionRisk } from "@/lib/security/policy-engine";

export type ToolPermission =
  | "TOOL_READ"
  | "TOOL_WRITE"
  | "TOOL_EXTERNAL"
  | "TOOL_ADMIN";

export type ToolExecutionContext = {
  workspaceId: string;
  userId: string;
  agentId: string;
  taskId?: string | null;
  runId?: string | null;
  role?: string | null;
  metadata?: Record<string, unknown>;
};

export type ToolExecutionResult = {
  ok: boolean;
  toolId: string;
  name: string;
  result?: unknown;
  error?: string;
  permissionDenied?: boolean;
  metadata?: Record<string, unknown>;
};

export type ToolDefinition = {
  id: string;
  name: string;
  description: string;
  permission: ToolPermission;
  riskLevel: ActionRisk;
  inputSchema: z.ZodTypeAny;
  execute: (input: unknown, context: ToolExecutionContext) => Promise<unknown>;
  timeoutMs?: number;
  metadata?: Record<string, unknown>;
};
