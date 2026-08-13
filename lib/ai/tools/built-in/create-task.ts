import { z } from "zod";
import { createAgentTask } from "@/lib/workspace/agent-service";
import type { ToolDefinition } from "../tool-types";

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  instruction: z.string().min(1).max(2000),
  priority: z.number().int().min(0).max(100).optional(),
});

export const createTaskTool: ToolDefinition = {
  id: "create_task",
  name: "create_task",
  description: "Create a safe internal task for the current workspace and agent.",
  permission: "TOOL_WRITE",
  riskLevel: "medium",
  inputSchema: createTaskSchema,
  timeoutMs: 3000,
  execute: async (input, context) => {
    const parsed = createTaskSchema.parse(input);
    const task = await createAgentTask(
      context.workspaceId,
      context.agentId,
      context.userId,
      {
        title: parsed.title,
        instruction: parsed.instruction,
        priority: parsed.priority ?? 0,
        input: { createdByTool: true },
      },
    );

    return {
      created: true,
      taskId: task.id,
      title: task.title,
      status: task.status,
    };
  },
};
