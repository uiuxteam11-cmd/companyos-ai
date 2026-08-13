import { createClient } from "@/lib/supabase/server";

export type ObservabilityEvent = { workspaceId?: string; severity: "info" | "warning" | "critical"; source: string; message: string; metadata?: Record<string, unknown> };

/** Structured server-side incident signal. Never include unredacted prompts, secrets, or PII in metadata. */
export async function reportIncident(event: ObservabilityEvent) {
  const supabase = await createClient();
  if (!supabase) return;
  await supabase.from("incident_events").insert({ workspace_id: event.workspaceId ?? null, severity: event.severity, source: event.source, message: event.message, metadata: event.metadata ?? {} });
}
