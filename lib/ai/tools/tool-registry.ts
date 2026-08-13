import { z } from "zod";
import { getWorkspaceAgent, getAgentTask, getAgentRun } from "@/lib/workspace/agent-service";
import { getCurrentWorkspaceContext } from "@/lib/workspace/workspace-service";
import type { ToolDefinition, ToolExecutionContext, ToolExecutionResult, ToolPermission } from "./tool-types";
import { calculatorTool } from "./built-in/calculator";
import { workspaceSearchTool } from "./built-in/workspace-search";
import { createTaskTool } from "./built-in/create-task";
import { httpRequestTool } from "./built-in/http-request";
import { webSearchTool } from "./built-in/web-search";
import { redactSensitiveValue } from "@/lib/security/pii-redactor";

const toolRegistry = new Map<string, ToolDefinition>();

export function registerTool(tool: ToolDefinition) {
  toolRegistry.set(tool.id, tool);
}

export function getTool(id: string) {
  return toolRegistry.get(id);
}

export function listTools() {
  return Array.from(toolRegistry.values());
}

export async function canExecuteTool(
  tool: ToolDefinition,
  context: ToolExecutionContext,
): Promise<boolean> {
  const workspaceContext = await getCurrentWorkspaceContext(context.userId);
  if (!workspaceContext || workspaceContext.workspace.id !== context.workspaceId) {
    return false;
  }

  const allowedRoles = {
    TOOL_READ: ["owner", "admin", "member", "viewer"],
    TOOL_WRITE: ["owner", "admin", "member"],
    TOOL_EXTERNAL: ["owner", "admin"],
    TOOL_ADMIN: ["owner"],
  } as Record<ToolPermission, string[]>;

  const role = workspaceContext.membership.role;
  if (!role) return false;

  const permissionList = allowedRoles[tool.permission] ?? [];
  if (!permissionList.includes(role)) return false;

  if (context.agentId) {
    try {
      await getWorkspaceAgent(context.workspaceId, context.agentId);
    } catch {
      return false;
    }
  }

  if (context.taskId) {
    try {
      await getAgentTask(context.workspaceId, context.agentId, context.taskId);
    } catch {
      return false;
    }
  }

  if (context.runId) {
    try {
      await getAgentRun(context.workspaceId, context.agentId, context.runId);
    } catch {
      return false;
    }
  }

  return true;
}

export async function executeTool(
  toolId: string,
  input: unknown,
  context: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  const tool = getTool(toolId);
  if (!tool) {
    return {
      ok: false,
      toolId,
      name: toolId,
      permissionDenied: true,
      error: "Tool not found.",
    };
  }

  const authorized = await canExecuteTool(tool, context);
  if (!authorized) {
    return {
      ok: false,
      toolId: tool.id,
      name: tool.name,
      permissionDenied: true,
      error: "Tool authorization failed.",
    };
  }

  const parsedInput = tool.inputSchema.safeParse(input);
  if (!parsedInput.success) {
    return {
      ok: false,
      toolId: tool.id,
      name: tool.name,
      permissionDenied: false,
      error: parsedInput.error.issues[0]?.message ?? "Invalid tool input.",
    };
  }

  try {
    const timeoutMs = tool.timeoutMs ?? 10_000;
    const result = await Promise.race([
      tool.execute(parsedInput.data, context),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Tool timed out after ${timeoutMs}ms.`)), timeoutMs)),
    ]);
    return {
      ok: true,
      toolId: tool.id,
      name: tool.name,
      result: redactSensitiveValue(result),
      metadata: { permission: tool.permission, risk: tool.riskLevel, timeoutMs },
    };
  } catch (error) {
    return {
      ok: false,
      toolId: tool.id,
      name: tool.name,
      permissionDenied: false,
      error: error instanceof Error ? error.message : "Tool execution failed.",
    };
  }
}

registerTool(calculatorTool);
registerTool(workspaceSearchTool);
registerTool(createTaskTool);
registerTool(httpRequestTool);
registerTool(webSearchTool);

export const toolSchema = z.object({
  toolId: z.string(),
  input: z.unknown(),
});
