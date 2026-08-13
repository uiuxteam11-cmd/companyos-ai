import type { AIExecutionContext, AIMessage } from "@/types/ai";
import { listAgentEvents } from "@/lib/workspace/agent-service";

export type ExecutionContextInput = {
  workspaceId: string;
  userId?: string | null;
  agentId: string;
  taskId: string;
  runId: string;
  systemInstructions?: string | null;
  taskInput?: unknown;
  taskOutput?: unknown;
  metadata?: Record<string, unknown>;
};

export async function buildExecutionContext(input: ExecutionContextInput): Promise<AIExecutionContext> {
  const events = await listAgentEvents(input.workspaceId, input.agentId, input.runId).catch(() => []);

  const previousMessages: AIMessage[] = events
    .slice(0, 25)
    .map((event) => ({
      role: event.event_type.startsWith("AI_") || event.event_type === "MESSAGE" ? "assistant" : "user",
      content: event.message ?? JSON.stringify(event.payload ?? {}),
      metadata: {
        eventType: event.event_type,
        createdAt: event.created_at,
      },
    }));

  return {
    workspaceId: input.workspaceId,
    userId: input.userId,
    agentId: input.agentId,
    taskId: input.taskId,
    runId: input.runId,
    systemInstructions: input.systemInstructions ?? null,
    previousMessages,
    metadata: {
      taskInput: input.taskInput ?? {},
      taskOutput: input.taskOutput ?? null,
      ...input.metadata,
    },
  };
}
