import type { AIExecutionContext, AIExecutionRequest, AIExecutionResponse, AIProvider } from "@/types/ai";
import { getOpenAIConfig } from "@/lib/ai/provider-config";

function normalizeMessages(request: AIExecutionRequest) {
  const messages: Array<{ role: string; content: string }> = [];

  if (request.system) {
    messages.push({ role: "system", content: request.system });
  }

  for (const message of request.messages ?? []) {
    messages.push({
      role: message.role,
      content: message.content ?? "",
    });
  }

  return messages;
}

export class OpenAIProvider implements AIProvider {
  id = "openai";

  async call(request: AIExecutionRequest, context: AIExecutionContext): Promise<AIExecutionResponse> {
    const config = getOpenAIConfig();
    if (!config) {
      throw new Error("OpenAI provider is not configured. Set OPENAI_API_KEY to enable it.");
    }

    const body = {
      model: request.model ?? config.model,
      messages: normalizeMessages(request),
      temperature: request.temperature ?? undefined,
      max_tokens: request.maxTokens ?? undefined,
      tools: request.tools ?? undefined,
      metadata: request.metadata ?? undefined,
    };

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let message = "OpenAI request failed.";
      try {
        const parsed = JSON.parse(errorText) as { error?: { message?: string } };
        if (parsed?.error?.message) message = parsed.error.message;
      } catch {
        // Ignore parse issues; leave default message.
      }
      throw new Error(message);
    }

    const data = (await response.json()) as {
      id?: string;
      model?: string;
      choices?: Array<{
        message?: {
          content?: string | null;
          tool_calls?: Array<{
            id?: string;
            function?: { name?: string; arguments?: string };
          }>;
        };
        finish_reason?: string | null;
      }>;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };

    const choice = data.choices?.[0];
    const message = choice?.message ?? {};
    const toolCalls = (message.tool_calls ?? []).map((toolCall) => {
      let parsedArguments: Record<string, unknown> = {};
      if (toolCall.function?.arguments) {
        try {
          parsedArguments = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
        } catch {
          parsedArguments = { raw: toolCall.function.arguments };
        }
      }

      return {
        id: toolCall.id,
        name: toolCall.function?.name ?? "unknown_tool",
        arguments: parsedArguments,
        raw: toolCall,
      };
    });

    return {
      content: message.content ?? null,
      provider: "openai",
      model: data.model ?? request.model ?? config.model,
      finishReason: choice?.finish_reason ?? null,
      usage: {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens: data.usage?.total_tokens,
      },
      toolCalls,
      raw: data,
      metadata: {
        workspaceId: context.workspaceId,
        agentId: context.agentId,
        taskId: context.taskId,
        runId: context.runId,
      },
    };
  }
}

export const openAIProvider = new OpenAIProvider();
