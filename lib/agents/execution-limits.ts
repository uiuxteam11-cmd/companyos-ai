import { createClient } from "@/lib/supabase/server";
import type { AgentRun } from "@/types/agent";

export type ExecutionLimitName = "max_steps" | "max_duration" | "max_tool_calls" | "max_retries" | "max_browser_actions" | "max_cost";

export async function findExecutionLimitBreach(run: AgentRun, next: "step" | "tool_call" | "browser_action" = "step"): Promise<{ name: ExecutionLimitName; message: string } | null> {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const now = Date.now();
  const startedAt = run.started_at ? new Date(run.started_at).getTime() : now;
  if (now - startedAt >= run.max_duration_seconds * 1000) return { name: "max_duration", message: "Maximum run duration reached." };
  if (run.accrued_cost >= run.max_cost) return { name: "max_cost", message: "Maximum run cost reached." };
  if (run.retry_count >= run.max_retries) return { name: "max_retries", message: "Maximum retry count reached." };
  if (next === "browser_action" && run.browser_action_count >= run.max_browser_actions) return { name: "max_browser_actions", message: "Maximum browser action count reached." };
  if (next === "step") {
    const { count, error } = await supabase.from("agent_steps").select("id", { count: "exact", head: true }).eq("run_id", run.id);
    if (error) throw error;
    if ((count ?? 0) >= run.max_steps) return { name: "max_steps", message: "Maximum step count reached." };
  }
  if (next === "tool_call") {
    const { count, error } = await supabase.from("tool_calls").select("id", { count: "exact", head: true }).eq("run_id", run.id);
    if (error) throw error;
    if ((count ?? 0) >= run.max_tool_calls) return { name: "max_tool_calls", message: "Maximum tool call count reached." };
  }
  return null;
}
