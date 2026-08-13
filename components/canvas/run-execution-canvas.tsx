"use client";

import { useCallback, useEffect, useState } from "react";
import type { CanvasEdge, CanvasNode } from "@/lib/canvas/types";
import { createClient } from "@/lib/supabase/client";

type CanvasData = { nodes: CanvasNode[]; edges: CanvasEdge[] };

const statusStyles: Record<CanvasNode["status"], string> = {
  queued: "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
  running: "border-indigo-300 bg-indigo-50 text-indigo-900 dark:border-indigo-500/60 dark:bg-indigo-500/10 dark:text-indigo-100",
  completed: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-100",
  blocked: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-100",
};

export function RunExecutionCanvas({ agentId, runId, workspaceId, userId, userName, initialData }: { agentId: string; runId: string; workspaceId: string; userId: string; userName: string; initialData: CanvasData }) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState<string | null>(null);
  const [presenceCount, setPresenceCount] = useState(1);
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "live" | "unavailable">(() => createClient() ? "connecting" : "unavailable");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}/runs/${runId}/canvas`);
      if (!response.ok) throw new Error("Unable to refresh execution canvas.");
      setData(await response.json() as CanvasData);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to refresh execution canvas.");
    }
  }, [agentId, runId]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      return;
    }

    const channel = supabase.channel(`companyos:workspace:${workspaceId}:run:${runId}`, { config: { presence: { key: userId } } });
    const updatePresence = () => {
      const users = Object.values(channel.presenceState()).flat();
      setPresenceCount(Math.max(1, users.length));
    };
    const eventConfig = { event: "*" as const, schema: "public", table: "agent_events", filter: `run_id=eq.${runId}` };
    channel
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_runs", filter: `id=eq.${runId}` }, refresh)
      .on("postgres_changes", eventConfig, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "tool_calls", filter: `run_id=eq.${runId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "approvals", filter: `run_id=eq.${runId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "browser_sessions", filter: `run_id=eq.${runId}` }, refresh)
      .on("presence", { event: "sync" }, updatePresence)
      .on("presence", { event: "join" }, updatePresence)
      .on("presence", { event: "leave" }, updatePresence)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("live");
          void channel.track({ userId, name: userName, activeRunId: runId, workspaceId });
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setRealtimeStatus("unavailable");
        }
      });
    return () => { void supabase.removeChannel(channel); };
  }, [refresh, runId, userId, userName, workspaceId]);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Execution canvas</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Live projection of persisted runtime records</p></div>
        <div className="flex items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-medium ${realtimeStatus === "live" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{realtimeStatus === "live" ? `Live · ${presenceCount} viewing` : "Realtime unavailable"}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{data.nodes.length} nodes</span></div>
      </header>
      <div className="min-h-[440px] overflow-auto bg-[linear-gradient(rgba(148,163,184,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.12)_1px,transparent_1px)] bg-size-[28px_28px] p-6 sm:p-10">
        <div className="mx-auto flex min-w-[280px] max-w-xl flex-col items-center">
          {data.nodes.map((node, index) => (
            <div key={node.id} className="contents">
              <article className={`w-full rounded-2xl border p-4 shadow-sm ${statusStyles[node.status]}`}>
                <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">{node.kind.replace("_", " ")}</p><h3 className="mt-1 font-semibold">{node.label}</h3>{node.data?.error ? <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">{String(node.data.error)}</p> : null}</div><span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-semibold capitalize dark:bg-white/10">{node.status}</span></div>
              </article>
              {index < data.nodes.length - 1 ? <div className="h-8 w-px bg-indigo-300 dark:bg-indigo-700" aria-label="Execution flow connector" /> : null}
            </div>
          ))}
        </div>
        {error ? <p className="mt-5 text-center text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
      </div>
    </section>
  );
}
