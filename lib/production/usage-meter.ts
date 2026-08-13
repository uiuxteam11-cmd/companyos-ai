import { createClient } from "@/lib/supabase/server";

export type UsageMetric = "tool_call" | "model_input_tokens" | "model_output_tokens" | "browser_action" | "storage_bytes";

export async function recordUsage(input: { workspaceId: string; userId?: string; agentId?: string; runId?: string; metric: UsageMetric; quantity: number; unit: string; metadata?: Record<string, unknown> }) {
  if (!Number.isFinite(input.quantity) || input.quantity < 0) throw new Error("Usage quantity must be a non-negative finite number.");
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("usage_events").insert({ workspace_id: input.workspaceId, user_id: input.userId ?? null, agent_id: input.agentId ?? null, run_id: input.runId ?? null, metric: input.metric, quantity: input.quantity, unit: input.unit, metadata: input.metadata ?? {} });
  if (error) throw error;
}
