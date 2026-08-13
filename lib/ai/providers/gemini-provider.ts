import { getGeminiConfig } from "@/lib/ai/provider-config";
import type { AIExecutionContext, AIExecutionRequest, AIExecutionResponse, AIProvider } from "@/types/ai";

export class GeminiProvider implements AIProvider {
  id = "gemini";

  async call(request: AIExecutionRequest, context: AIExecutionContext): Promise<AIExecutionResponse> {
    const config = getGeminiConfig();
    if (!config) throw new Error("Gemini is not configured. Set GEMINI_API_KEY to enable it.");

    const contents = (request.messages ?? []).map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));
    const response = await fetch(`${config.baseUrl}/models/${request.model ?? config.model}:generateContent?key=${config.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemInstruction: request.system ? { parts: [{ text: request.system }] } : undefined, contents }),
    });
    if (!response.ok) throw new Error(`Gemini request failed: ${await response.text()}`);

    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } };
    const candidate = data.candidates?.[0];
    return {
      content: candidate?.content?.parts?.map((part) => part.text ?? "").join("") ?? null,
      provider: this.id,
      model: request.model ?? config.model,
      finishReason: candidate?.finishReason ?? null,
      usage: { promptTokens: data.usageMetadata?.promptTokenCount, completionTokens: data.usageMetadata?.candidatesTokenCount, totalTokens: data.usageMetadata?.totalTokenCount },
      metadata: { workspaceId: context.workspaceId, agentId: context.agentId, taskId: context.taskId, runId: context.runId },
      raw: data,
    };
  }
}

export const geminiProvider = new GeminiProvider();
