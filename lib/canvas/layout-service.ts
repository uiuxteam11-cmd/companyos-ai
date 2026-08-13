import { createClient } from "@/lib/supabase/server";

export type CanvasLayout = {
  workspace_id: string;
  run_id: string;
  node_positions: Record<string, { x: number; y: number }>;
  viewport: Record<string, number>;
  updated_by: string | null;
};

export async function getCanvasLayout(workspaceId: string, runId: string) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.from("canvas_layouts").select("*").eq("workspace_id", workspaceId).eq("run_id", runId).maybeSingle();
  if (error) throw error;
  return data as CanvasLayout | null;
}

export async function saveCanvasLayout(input: { workspaceId: string; runId: string; userId: string; nodePositions: CanvasLayout["node_positions"]; viewport: CanvasLayout["viewport"] }) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.from("canvas_layouts").upsert({
    workspace_id: input.workspaceId,
    run_id: input.runId,
    node_positions: input.nodePositions,
    viewport: input.viewport,
    updated_by: input.userId,
  }, { onConflict: "workspace_id,run_id" }).select().single();
  if (error || !data) throw error ?? new Error("Unable to save canvas layout.");
  return data as CanvasLayout;
}
