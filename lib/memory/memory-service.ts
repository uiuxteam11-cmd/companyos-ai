import { createClient } from "@/lib/supabase/server";

export type CompanyMemoryScope = "company" | "department" | "agent" | "task";
export type MemoryVisibility = "private" | "agent" | "workspace";
export type MemoryWrite = {
  workspaceId: string;
  scope: CompanyMemoryScope;
  key: string;
  content: Record<string, unknown>;
  userId: string;
  agentId?: string;
  taskId?: string;
  departmentKey?: string;
  source?: string;
  visibility?: MemoryVisibility;
};

export async function remember(input: MemoryWrite) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.from("agent_memory").upsert({
    workspace_id: input.workspaceId,
    agent_id: input.agentId ?? null,
    task_id: input.taskId ?? null,
    scope: input.scope,
    department_key: input.departmentKey ?? null,
    memory_key: input.key,
    memory_value: input.content,
    content: input.content,
    created_by: input.userId,
    owner_id: input.userId,
    source: input.source ?? "user",
    visibility: input.visibility ?? "workspace",
  }, { onConflict: "workspace_id,agent_id,task_id,scope,department_key,memory_key" }).select().single();
  if (error || !data) throw error ?? new Error("Unable to save memory.");
  return data;
}

export async function retrieveMemory(input: { workspaceId: string; scope?: CompanyMemoryScope; agentId?: string; taskId?: string; departmentKey?: string; limit?: number }) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  let query = supabase.from("agent_memory").select("*").eq("workspace_id", input.workspaceId).order("updated_at", { ascending: false }).limit(input.limit ?? 25);
  if (input.scope) query = query.eq("scope", input.scope);
  if (input.agentId) query = query.eq("agent_id", input.agentId);
  if (input.taskId) query = query.eq("task_id", input.taskId);
  if (input.departmentKey) query = query.eq("department_key", input.departmentKey);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
