import { createClient } from "@/lib/supabase/server";

export type ScheduledWorkflow = {
  id: string;
  workspace_id: string;
  workflow_id: string;
  cron_expression: string;
  next_run_at: string;
  last_run_at: string | null;
  enabled: boolean;
};

function assertCronExpression(cron: string) {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5 || parts.some((part) => !/^[\d*/?,\-]+$/.test(part))) {
    throw new Error("Use a five-part cron expression for scheduled workflows.");
  }
}

/** Persists a schedule; no process-local scheduler is used. */
export async function scheduleWorkflow(input: { workspaceId: string; workflowId: string; cron: string; nextRunAt: string; enabled?: boolean }) {
  assertCronExpression(input.cron);
  if (Number.isNaN(Date.parse(input.nextRunAt))) throw new Error("nextRunAt must be a valid ISO timestamp.");
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.from("workflow_schedules").upsert({
    workspace_id: input.workspaceId,
    workflow_id: input.workflowId,
    cron_expression: input.cron.trim(),
    next_run_at: input.nextRunAt,
    enabled: input.enabled ?? true,
  }, { onConflict: "workflow_id" }).select().single();
  if (error || !data) throw error ?? new Error("Unable to persist workflow schedule.");
  return data as ScheduledWorkflow;
}

/**
 * Atomically claims due schedules by advancing their next execution time.
 * A durable worker invokes this function; it remains safe across web restarts.
 */
export async function claimDueWorkflowSchedules(input: { now: string; nextRunAt: (schedule: ScheduledWorkflow) => string; limit?: number }) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: due, error } = await supabase.from("workflow_schedules").select("*").eq("enabled", true).lte("next_run_at", input.now).order("next_run_at", { ascending: true }).limit(input.limit ?? 20);
  if (error) throw error;

  const claimed: ScheduledWorkflow[] = [];
  for (const schedule of (due ?? []) as ScheduledWorkflow[]) {
    const nextRunAt = input.nextRunAt(schedule);
    if (Number.isNaN(Date.parse(nextRunAt))) throw new Error("The scheduler produced an invalid next run time.");
    const { data, error: claimError } = await supabase.from("workflow_schedules").update({ last_run_at: input.now, next_run_at: nextRunAt }).eq("id", schedule.id).eq("enabled", true).eq("next_run_at", schedule.next_run_at).select().maybeSingle();
    if (claimError) throw claimError;
    if (data) claimed.push(data as ScheduledWorkflow);
  }
  return claimed;
}
