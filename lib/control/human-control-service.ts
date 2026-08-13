import { createClient } from "@/lib/supabase/server";
import { createAgentEvent } from "@/lib/workspace/agent-service";

export async function setHumanControl(input: { workspaceId: string; agentId: string; runId: string; userId: string; enabled: boolean }) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("agent_control_sessions")
    .upsert({ workspace_id: input.workspaceId, agent_id: input.agentId, run_id: input.runId, controller_user_id: input.enabled ? input.userId : null, mode: input.enabled ? "human" : "agent" }, { onConflict: "run_id" })
    .select()
    .single();
  if (error || !data) throw error ?? new Error("Unable to update human control.");
  await createAgentEvent(input.workspaceId, { agent_id: input.agentId, task_id: null, run_id: input.runId, event_type: input.enabled ? "HUMAN_CONTROL_TAKEN" : "HUMAN_CONTROL_RETURNED", message: input.enabled ? "Human control is active; agent actions are paused." : "Control returned to the agent.", payload: { controlSessionId: data.id } }, input.userId);
  return data;
}
