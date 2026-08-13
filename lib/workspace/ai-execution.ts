import { createClient } from "@/lib/supabase/server";
import { callProvider, getProvider } from "@/lib/ai/provider-registry";
import { buildExecutionContext } from "@/lib/ai/context-builder";
import {
  createAgentEvent,
  getAgentRun,
  getAgentTask,
  getWorkspaceAgent,
  updateAgentRun,
} from "@/lib/workspace/agent-service";
import type { AIExecutionRequest, AIExecutionResponse, AIExecutionError } from "@/types/ai";
import { detectPii } from "@/lib/security/pii-detector";
import { detectSecrets } from "@/lib/security/secret-detector";
import { redactSensitiveContent } from "@/lib/security/pii-redactor";

export type ExecuteAgentRunOptions = {
  workspaceId: string;
  agentId: string;
  taskId: string;
  runId: string;
  userId?: string;
  providerId?: string;
  model?: string;
  systemPrompt?: string | null;
  input?: Record<string, unknown>;
};

export type ExecutionResult = {
  run: Awaited<ReturnType<typeof getAgentRun>>;
  response: AIExecutionResponse;
};

function getSafeError(error: unknown): AIExecutionError {
  if (error instanceof Error) {
    return {
      code: "UNKNOWN",
      message: error.message,
      retryable: false,
      details: { name: error.name },
    };
  }

  return {
    code: "UNKNOWN",
    message: "Unknown execution failure.",
    retryable: false,
  };
}

export async function executeAgentRun(options: ExecuteAgentRunOptions): Promise<ExecutionResult> {
  const { workspaceId, agentId, taskId, runId, userId, providerId = "mock", model, systemPrompt, input } = options;

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const agent = await getWorkspaceAgent(workspaceId, agentId);
  const task = await getAgentTask(workspaceId, agentId, taskId);
  const run = await getAgentRun(workspaceId, agentId, runId);

  if (task.workspace_id !== workspaceId || task.agent_id !== agentId) {
    throw new Error("Task does not belong to the requested workspace and agent.");
  }

  if (run.workspace_id !== workspaceId || run.agent_id !== agentId || run.task_id !== taskId) {
    throw new Error("Run does not belong to the requested workspace, agent, or task.");
  }

  const provider = getProvider(providerId);
  if (!provider) {
    throw new Error(`Provider not found: ${providerId}`);
  }

  const executionContext = await buildExecutionContext({
    workspaceId,
    userId,
    agentId,
    taskId,
    runId,
    systemInstructions: systemPrompt ?? agent.system_prompt ?? "You are a helpful CompanyOS AI assistant.",
    taskInput: input ?? task.input,
    taskOutput: run.output,
    metadata: { agentName: agent.name, taskTitle: task.title },
  });

  const rawPrompt = typeof input === "string" ? input : JSON.stringify(input ?? task.input ?? {}, null, 2);
  const piiMatches = detectPii(rawPrompt);
  const secretMatches = detectSecrets(rawPrompt);
  const prompt = redactSensitiveContent(rawPrompt);

  const request: AIExecutionRequest = {
    system: executionContext.systemInstructions ?? undefined,
    messages: [
      ...(executionContext.previousMessages ?? []),
      {
        role: "user",
        content: prompt,
        metadata: {
          taskId,
          runId,
          agentId,
        },
      },
    ],
    model,
    temperature: (agent.configuration as Record<string, unknown> | undefined)?.temperature as number | undefined,
    maxTokens: (agent.configuration as Record<string, unknown> | undefined)?.max_output_tokens as number | undefined,
    metadata: {
      workspaceId,
      agentId,
      taskId,
      runId,
    },
  };

  await createAgentEvent(workspaceId, {
    agent_id: agentId,
    task_id: taskId,
    run_id: runId,
    event_type: "AI_EXECUTION_STARTED",
    message: "AI execution started",
    payload: { providerId, model: request.model ?? provider.id, piiRedactions: piiMatches.length, secretRedactions: secretMatches.length },
  }, userId);

  try {
    const response = await callProvider(providerId, request, executionContext);

    await createAgentEvent(workspaceId, {
      agent_id: agentId,
      task_id: taskId,
      run_id: runId,
      event_type: "AI_RESPONSE_COMPLETED",
      message: response.content ?? "AI execution completed",
      payload: {
        provider: response.provider,
        model: response.model,
        finishReason: response.finishReason,
        usage: response.usage,
        toolCalls: response.toolCalls ?? [],
      },
    }, userId);

    const updatedRun = await updateAgentRun(workspaceId, agentId, runId, {
      status: "completed",
      output: {
        content: response.content,
        provider: response.provider,
        model: response.model,
        finishReason: response.finishReason,
        usage: response.usage ?? null,
        toolCalls: response.toolCalls ?? [],
      },
      metadata: {
        ...(run.metadata ?? {}),
        providerId,
        model: response.model ?? request.model,
        providerResponse: response.raw ?? null,
      },
      completed_at: new Date().toISOString(),
    });

    await createAgentEvent(workspaceId, {
      agent_id: agentId,
      task_id: taskId,
      run_id: runId,
      event_type: "RUN_COMPLETED",
      message: "Run completed after AI execution",
      payload: { provider: response.provider, model: response.model },
    }, userId);

    return { run: updatedRun, response };
  } catch (error) {
    const normalized = getSafeError(error);

    await createAgentEvent(workspaceId, {
      agent_id: agentId,
      task_id: taskId,
      run_id: runId,
      event_type: "AI_EXECUTION_FAILED",
      message: normalized.message,
      payload: { code: normalized.code, retryable: normalized.retryable, provider: providerId },
    }, userId);

    await updateAgentRun(workspaceId, agentId, runId, {
      status: "failed",
      error_message: normalized.message,
      completed_at: new Date().toISOString(),
      metadata: {
        ...(run.metadata ?? {}),
        providerId,
        lastError: normalized,
      },
    });

    throw error;
  }
}

export async function executeMockAgentRun(options: ExecuteAgentRunOptions): Promise<ExecutionResult> {
  return executeAgentRun({ ...options, providerId: "mock" });
}
