export type UsageMetrics = {
  provider: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  executionMs?: number;
  retryCount?: number;
  toolCalls?: number;
};

export type PriceEntry = {
  inputPer1kTokens: number;
  outputPer1kTokens: number;
};

export type PriceConfig = Record<string, Record<string, PriceEntry>>;

export const defaultPriceConfig: PriceConfig = {
  openai: {
    "gpt-4o-mini": { inputPer1kTokens: 0.00015, outputPer1kTokens: 0.0006 },
    "gpt-4o": { inputPer1kTokens: 0.000005, outputPer1kTokens: 0.000015 },
  },
  mock: {
    "mock-1.0": { inputPer1kTokens: 0, outputPer1kTokens: 0 },
  },
};

export function normalizeUsage(metrics: UsageMetrics) {
  return {
    provider: metrics.provider,
    model: metrics.model ?? "unknown",
    inputTokens: metrics.inputTokens ?? 0,
    outputTokens: metrics.outputTokens ?? 0,
    totalTokens: metrics.totalTokens ?? (metrics.inputTokens ?? 0) + (metrics.outputTokens ?? 0),
    executionMs: metrics.executionMs ?? 0,
    retryCount: metrics.retryCount ?? 0,
    toolCalls: metrics.toolCalls ?? 0,
  };
}

export function estimateCost(metrics: UsageMetrics, priceConfig: PriceConfig = defaultPriceConfig) {
  const providerPricing = priceConfig[metrics.provider]?.[metrics.model ?? ""];
  if (!providerPricing) {
    return 0;
  }

  const inputCost = ((metrics.inputTokens ?? 0) / 1000) * providerPricing.inputPer1kTokens;
  const outputCost = ((metrics.outputTokens ?? 0) / 1000) * providerPricing.outputPer1kTokens;
  return inputCost + outputCost;
}
