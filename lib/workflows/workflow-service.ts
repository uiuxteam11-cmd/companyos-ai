import { createClient } from "@/lib/supabase/server";
import type { Workflow } from "@/lib/workflows/workflow-engine";

export type PersistedWorkflowStatus = "active" | "paused" | "archived";
export type WorkflowRunStatus = "queued" | "running" | "waiting_approval" | "completed" | "failed" | "cancelled";

export type CreatePersistedWorkflowInput = {
  workspaceId: string;
  agentId?: string;
  createdBy: string;
  workflow: Workflow;
  triggerConfig?: Record<string, unknown>;
};

export async function createPersistedWorkflow(input: CreatePersistedWorkflowInput) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.from("workflows").insert({
    id: input.workflow.id,
    workspace_id: input.workspaceId,
    agent_id: input.agentId ?? null,
    name: input.workflow.name,
    trigger_type: input.workflow.trigger,
    trigger_config: input.triggerConfig ?? {},
    definition: input.workflow,
    created_by: input.createdBy,
  }).select().single();
  if (error || !data) throw error ?? new Error("Unable to create workflow.");
  return data;
}

export async function startWorkflowRun(input: { workspaceId: string; workflowId: string; agentRunId?: string }) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: workflow, error: workflowError } = await supabase.from("workflows").select("id, status").eq("id", input.workflowId).eq("workspace_id", input.workspaceId).single();
  if (workflowError || !workflow) throw new Error("Workflow not found.");
  if (workflow.status !== "active") throw new Error("Only active workflows can run.");
  const { data, error } = await supabase.from("workflow_runs").insert({
    workspace_id: input.workspaceId,
    workflow_id: input.workflowId,
    agent_run_id: input.agentRunId ?? null,
    status: "queued",
  }).select().single();
  if (error || !data) throw error ?? new Error("Unable to create workflow run.");
  return data;
}
