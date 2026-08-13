import { selectModel, type RoutingInput } from "@/lib/ai/model-router";
import { getProvider } from "@/lib/ai/provider-registry";

export type ModelGatewayDecision = { providerId: string; model: string; reason: string };

/** Selects only registered server-side Gemini, OpenAI, or future providers. */
export function routeModel(input: RoutingInput = {}): ModelGatewayDecision {
  const decision = selectModel(input);
  if (!getProvider(decision.providerId)) throw new Error(`Configured model provider is unavailable: ${decision.providerId}.`);
  return decision;
}
