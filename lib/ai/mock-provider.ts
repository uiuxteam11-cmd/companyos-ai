import type { AIProvider, AIExecutionRequest, AIExecutionResponse, AIExecutionContext } from "@/types/ai";

export const MockAIProvider: AIProvider = {
  id: "mock",
  config: undefined,
  async call(request: AIExecutionRequest, context: AIExecutionContext): Promise<AIExecutionResponse> {
    // Deterministic mock response for development and testing
    const userText = (request.messages && request.messages.length)
      ? request.messages.map(m => `${m.role}: ${m.content}`).join("\n")
      : request.system || "";

    const content = `Mock response generated for agent=${context.agentId ?? "-"} task=${context.taskId ?? "-"} run=${context.runId ?? "-"}\n---\n${userText}`;

    return {
      content,
      provider: "mock",
      model: request.model ?? "mock-1.0",
      finishReason: "stop",
      usage: {
        promptTokens: 1,
        completionTokens: 1,
        totalTokens: 2,
      },
      raw: { request, context },
      metadata: { mock: true },
    };
  }
};
