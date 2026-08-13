import type { AIExecutionContext, AIExecutionRequest, AIExecutionResponse, AIProvider } from "@/types/ai";
import { MockAIProvider } from "./mock-provider";
import { openAIProvider } from "./providers/openai-provider";
import { geminiProvider } from "./providers/gemini-provider";

const providers: Map<string, AIProvider> = new Map();

// register built-in providers
registerProvider(MockAIProvider);
registerProvider(openAIProvider);
registerProvider(geminiProvider);

export function registerProvider(provider: AIProvider) {
  if (!provider || !provider.id) throw new Error("Invalid provider");
  providers.set(provider.id, provider);
}

export function getProvider(id: string): AIProvider | undefined {
  return providers.get(id);
}

export function listProviders(): string[] {
  return Array.from(providers.keys());
}

export async function callProvider(
  id: string,
  request: AIExecutionRequest,
  context: AIExecutionContext,
): Promise<AIExecutionResponse> {
  const provider = getProvider(id);
  if (!provider) throw new Error(`Provider not found: ${id}`);
  return provider.call(request, context);
}
