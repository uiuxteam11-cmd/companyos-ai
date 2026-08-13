import { tool } from "ai";
import { z } from "zod";

import {
  executeTool,
  getTool,
  listTools,
} from "@/lib/ai/tools/tool-registry";

import type {
  ToolDefinition,
  ToolExecutionContext,
  ToolExecutionResult,
} from "@/lib/ai/tools/tool-types";

import { requestApproval } from "@/lib/agents/approval-manager";
import { BrowserController } from "@/lib/browser/controller";

export type ToolEvent = {
  type:
    | "tool_start"
    | "tool_end"
    | "status"
    | "approval_required";
  message?: string;
  tool?: string;
  input?: unknown;
  id?: string;
  action?: string;
  reason?: string;
};

type EmitToolEvent = (event: ToolEvent) => void;

function toExecutionContext(
  context?: Partial<ToolExecutionContext>,
): ToolExecutionContext {
  return {
    workspaceId: context?.workspaceId ?? "workspace_runtime",
    userId: context?.userId ?? "user_runtime",
    agentId: context?.agentId ?? "agent_runtime",
    taskId: context?.taskId ?? null,
    runId: context?.runId ?? null,
    role: context?.role ?? null,
    metadata: context?.metadata ?? {},
  };
}

function createRuntimeTool(
  definition: ToolDefinition,
  emit: EmitToolEvent,
  context?: Partial<ToolExecutionContext>,
) {
  const executionContext = toExecutionContext(context);

  return tool({
    description: definition.description,
    inputSchema: definition.inputSchema,

    execute: async (input) => {
      emit({
        type: "tool_start",
        tool: definition.id,
        input,
      });

      const result = await executeTool(
        definition.id,
        input,
        executionContext,
      );

      if (!result.ok) {
        emit({
          type: "tool_end",
          tool: definition.id,
          message: result.error,
        });

        throw new Error(
          result.error ?? "Tool execution failed.",
        );
      }

      emit({
        type: "tool_end",
        tool: definition.id,
        input: result.result,
      });

      return result.result ?? null;
    },
  });
}

function createSearchWebTool(emit: EmitToolEvent) {
  const browser = new BrowserController(
    "tool-registry-search",
  );

  const inputSchema = z.object({
    query: z.string().min(1).max(300),
  });

  return tool({
    description:
      "Search the web for information using the browser runtime.",

    inputSchema,

    execute: async (input) => {
      emit({
        type: "status",
        message: `Searching the web for: ${input.query}`,
      });

      const result = await browser.navigate(
        `https://duckduckgo.com/html/?q=${encodeURIComponent(
          input.query,
        )}`,
      );

      return {
        query: input.query,
        url: result.url,
        title: result.title,
        markdown: result.markdown.slice(0, 1500),
      };
    },
  });
}

function createReadPageTool(emit: EmitToolEvent) {
  const browser = new BrowserController(
    "tool-registry-reader",
  );

  const inputSchema = z.object({
    url: z.string().url(),
  });

  return tool({
    description:
      "Read and summarize a webpage through the governed browser runtime.",

    inputSchema,

    execute: async (input) => {
      emit({
        type: "status",
        message: `Reading page: ${input.url}`,
      });

      const result = await browser.navigate(input.url);

      return {
        url: result.url,
        title: result.title,
        markdown: result.markdown.slice(0, 3000),
      };
    },
  });
}

function createApprovalTool(emit: EmitToolEvent) {
  const inputSchema = z.object({
    action: z.string().min(1).max(200),
    reason: z.string().min(1).max(500),
  });

  return tool({
    description:
      "Pause execution and ask a human for approval before a sensitive action.",

    inputSchema,

    execute: async (input) => {
      const approvalId = `approval_${Date.now()}`;

      emit({
        type: "approval_required",
        id: approvalId,
        action: input.action,
        reason: input.reason,
      });

      const decision = await requestApproval(
        approvalId,
      );

      emit({
        type: "status",
        message: `Approval decision: ${decision}`,
      });

      return {
        approvalId,
        action: input.action,
        reason: input.reason,
        decision,
      };
    },
  });
}

export function listAgentTools() {
  return listTools();
}

export function getAgentTool(toolId: string) {
  return getTool(toolId);
}

export async function executeAgentTool(
  toolId: string,
  input: unknown,
  context: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  return executeTool(
    toolId,
    input,
    context,
  );
}

export function getToolRegistry(
  emit: EmitToolEvent = () => {},
  context?: Partial<ToolExecutionContext>,
) {
  const registry = Object.fromEntries(
    listTools().map((definition) => [
      definition.id,
      createRuntimeTool(
        definition,
        emit,
        context,
      ),
    ]),
  );

  return {
    ...registry,

    search_web: createSearchWebTool(emit),

    read_page: createReadPageTool(emit),

    request_approval: createApprovalTool(emit),
  };
}