export type RoutingDecision = {
  providerId: string;
  model: string;
  reason: string;
};

export type RoutingInput = {
  taskType?: string;
  complexity?: "simple" | "medium" | "complex";
  preferredProvider?: string;
  fallbackProvider?: string;
};

export function selectModel(input: RoutingInput = {}): RoutingDecision {
  const taskType = input.taskType ?? "general";
  const complexity = input.complexity ?? "simple";

  if (input.preferredProvider === "openai") {
    if (complexity === "complex") return { providerId: "openai", model: "gpt-4o", reason: "preferred provider with strong reasoning" };
    return { providerId: "openai", model: "gpt-4o-mini", reason: "preferred provider for efficient completion" };
  }

  if (taskType === "simple" || complexity === "simple") {
    return { providerId: "mock", model: "mock-1.0", reason: "simple task uses deterministic mock provider" };
  }

  if (input.fallbackProvider) {
    return { providerId: input.fallbackProvider, model: "mock-1.0", reason: "fallback provider selected" };
  }

  return { providerId: "mock", model: "mock-1.0", reason: "default deterministic routing" };
}
