import { createClient } from "@/lib/supabase/server";
import type { Agent, AgentEvent, AgentRun, AgentTask, AgentToolCall, BrowserSession } from "@/types/agent";
import {
  agentCreateSchema,
  agentEventCreateSchema,
  agentRunCreateSchema,
  agentRunUpdateSchema,
  agentTaskCreateSchema,
  agentTaskUpdateSchema,
  agentUpdateSchema,
} from "@/lib/validation/workspace";

export async function listWorkspaceAgents(workspaceId: string) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase.from("agents").select("*").eq("workspace_id", workspaceId);
  if (error) throw error;
  return data as Agent[];
}

export async function getWorkspaceAgent(workspaceId: string, agentId: string) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const query = supabase.from("agents").select("*").eq("id", agentId).limit(1);
  const scopedQuery = workspaceId ? query.eq("workspace_id", workspaceId) : query;

  const { data, error } = await scopedQuery.single();
  if (error) throw error;
  return data as Agent;
}

export async function createWorkspaceAgent(workspaceId: string, userId: string, payload: unknown) {
  const validation = agentCreateSchema.safeParse(payload);
  if (!validation.success) throw new Error(validation.error.issues[0]?.message ?? "Invalid agent payload.");

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("agents")
    .insert({
      workspace_id: workspaceId,
      created_by: userId,
      name: validation.data.name,
      description: validation.data.description,
      status: validation.data.status ?? "active",
      system_prompt: validation.data.system_prompt,
      configuration: validation.data.configuration ?? {},
    })
    .select()
    .single();

  if (error || !data) throw error ?? new Error("Unable to create agent.");
  return data as Agent;
}

export async function updateWorkspaceAgent(workspaceId: string, agentId: string, payload: unknown) {
  const validation = agentUpdateSchema.safeParse(payload);
  if (!validation.success) throw new Error(validation.error.issues[0]?.message ?? "Invalid agent payload.");

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("agents")
    .update(validation.data)
    .eq("workspace_id", workspaceId)
    .eq("id", agentId)
    .select()
    .single();

  if (error || !data) throw error ?? new Error("Unable to update agent.");
  return data as Agent;
}

export async function deleteWorkspaceAgent(workspaceId: string, agentId: string) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("agents")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", agentId)
    .select()
    .single();

  if (error || !data) throw error ?? new Error("Unable to delete agent.");
  return data as Agent;
}

export async function listAgentTasks(workspaceId: string, agentId: string) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("agent_tasks")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as AgentTask[];
}

export async function getAgentTask(workspaceId: string, agentId: string, taskId: string) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("agent_tasks")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("agent_id", agentId)
    .eq("id", taskId)
    .limit(1)
    .single();

  if (error) throw error;
  return data as AgentTask;
}

export async function createAgentTask(workspaceId: string, agentId: string, userId: string, payload: unknown) {
  const validation = agentTaskCreateSchema.safeParse(payload);
  if (!validation.success) throw new Error(validation.error.issues[0]?.message ?? "Invalid task payload.");

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("agent_tasks")
    .insert({
      workspace_id: workspaceId,
      agent_id: agentId,
      created_by: userId,
      title: validation.data.title,
      instruction: validation.data.instruction,
      status: validation.data.status ?? "queued",
      priority: validation.data.priority ?? 0,
      input: validation.data.input ?? {},
    })
    .select()
    .single();

  if (error || !data) throw error ?? new Error("Unable to create task.");
  return data as AgentTask;
}

export async function updateAgentTask(workspaceId: string, agentId: string, taskId: string, payload: unknown) {
  const validation = agentTaskUpdateSchema.safeParse(payload);
  if (!validation.success) throw new Error(validation.error.issues[0]?.message ?? "Invalid task payload.");

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("agent_tasks")
    .update(validation.data)
    .eq("workspace_id", workspaceId)
    .eq("agent_id", agentId)
    .eq("id", taskId)
    .select()
    .single();

  if (error || !data) throw error ?? new Error("Unable to update task.");
  return data as AgentTask;
}

export async function deleteAgentTask(workspaceId: string, agentId: string, taskId: string) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("agent_tasks")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("agent_id", agentId)
    .eq("id", taskId)
    .select()
    .single();

  if (error || !data) throw error ?? new Error("Unable to delete task.");
  return data as AgentTask;
}

export async function listAgentRuns(workspaceId: string, agentId: string) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("agent_runs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as AgentRun[];
}

export async function getAgentRun(workspaceId: string, agentId: string, runId: string) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("agent_runs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("agent_id", agentId)
    .eq("id", runId)
    .limit(1)
    .single();

  if (error) throw error;
  return data as AgentRun;
}

export async function createAgentRun(workspaceId: string, agentId: string, taskId: string, payload: unknown) {
  const validation = agentRunCreateSchema.safeParse(payload);
  if (!validation.success) throw new Error(validation.error.issues[0]?.message ?? "Invalid run payload.");

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("agent_runs")
    .insert({
      workspace_id: workspaceId,
      agent_id: agentId,
      task_id: taskId,
      status: "queued",
      input: validation.data.input ?? {},
      metadata: validation.data.metadata ?? {},
    })
    .select()
    .single();

  if (error || !data) throw error ?? new Error("Unable to create run.");
  return data as AgentRun;
}

export async function updateAgentRun(workspaceId: string, agentId: string, runId: string, payload: unknown) {
  const validation = agentRunUpdateSchema.safeParse(payload);
  if (!validation.success) throw new Error(validation.error.issues[0]?.message ?? "Invalid run payload.");

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("agent_runs")
    .update(validation.data)
    .eq("workspace_id", workspaceId)
    .eq("agent_id", agentId)
    .eq("id", runId)
    .select()
    .single();

  if (error || !data) throw error ?? new Error("Unable to update run.");
  return data as AgentRun;
}

export async function listAgentEvents(workspaceId: string, agentId?: string, runId?: string) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  let query = supabase.from("agent_events").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false });
  if (agentId) query = query.eq("agent_id", agentId);
  if (runId) query = query.eq("run_id", runId);

  const { data, error } = await query;
  if (error) throw error;
  return data as AgentEvent[];
}

export async function createAgentEvent(workspaceId: string, payload: unknown, userId?: string) {
  const validation = agentEventCreateSchema.safeParse(payload);
  if (!validation.success) throw new Error(validation.error.issues[0]?.message ?? "Invalid event payload.");

  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  // Determine created_by: if the event is generated by an agent (agent_id present) it should be null;
  // otherwise, for user-generated events, set created_by to the authenticated user id (userId param).
  const createdByValue = validation.data.agent_id ? null : userId ?? undefined;

  const { data, error } = await supabase
    .from("agent_events")
    .insert({
      workspace_id: workspaceId,
      agent_id: validation.data.agent_id,
      task_id: validation.data.task_id,
      run_id: validation.data.run_id,
      event_type: validation.data.event_type,
      message: validation.data.message,
      payload: validation.data.payload ?? {},
      created_by: createdByValue,
    })
    .select()
    .single();

  if (error || !data) throw error ?? new Error("Unable to create event.");
  return data as AgentEvent;
}

export async function listAgentToolCalls(workspaceId: string, agentId: string, runId: string) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("tool_calls")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("agent_id", agentId)
    .eq("run_id", runId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as AgentToolCall[];
}

export async function listBrowserSessions(workspaceId: string, agentId: string, runId: string) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("browser_sessions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("agent_id", agentId)
    .eq("run_id", runId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as BrowserSession[];
}
