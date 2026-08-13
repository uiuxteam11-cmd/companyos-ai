"use client";

import { useEffect, useState } from "react";
import { AgentEvent, AgentRun } from "@/types/agent";

const STATUS_STYLES: Record<string, string> = {
  queued: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200",
  planning: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-200",
  running: "bg-sky-100 text-sky-800 dark:bg-sky-900/20 dark:text-sky-200",
  waiting_approval: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200",
  paused: "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200",
  cancelled: "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-200",
};

type Props = {
  agentId: string;
  runId: string;
  initialRun: AgentRun;
  initialEvents: AgentEvent[];
};

export function AgentRunLivePanel({ agentId, runId, initialRun, initialEvents }: Props) {
  const [run, setRun] = useState<AgentRun>(initialRun);
  const [events, setEvents] = useState<AgentEvent[]>(initialEvents);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      try {
        const [runResponse, eventsResponse] = await Promise.all([
          fetch(`/api/agents/${agentId}/runs/${runId}`),
          fetch(`/api/agents/${agentId}/runs/${runId}/events`),
        ]);

        if (runResponse.ok) {
          const payload = await runResponse.json();
          if (payload.run) {
            setRun(payload.run);
          }
        }

        if (eventsResponse.ok) {
          const payload = await eventsResponse.json();
          if (payload.events) {
            setEvents(payload.events);
          }
        }
      } catch {
        setStatusMessage("Unable to refresh run state. Check your connection.");
      }
    }, 4000);

    return () => window.clearInterval(interval);
  }, [agentId, runId]);

  async function sendAction(action: string) {
    setStatusMessage(null);
    setActionLoading(action);

    try {
      const response = await fetch(`/api/agents/${agentId}/runs/${runId}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to perform action.");
      }

      if (payload.run) {
        setRun(payload.run);
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to perform action.");
    } finally {
      setActionLoading(null);
    }
  }

  const sortedEvents = [...events].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const canPause = run.status === "running";
  const canResume = run.status === "paused";
  const canCancel = ["queued", "planning", "running", "waiting_approval", "paused"].includes(run.status);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Live control</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Interactive run controls</h3>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${STATUS_STYLES[run.status] ?? STATUS_STYLES.cancelled}`}>
            {run.status}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {canPause ? (
            <button
              type="button"
              onClick={() => sendAction("pause")}
              disabled={!!actionLoading}
              className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Pause
            </button>
          ) : null}
          {canResume ? (
            <button
              type="button"
              onClick={() => sendAction("resume")}
              disabled={!!actionLoading}
              className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Resume
            </button>
          ) : null}
          {canCancel ? (
            <button
              type="button"
              onClick={() => sendAction("cancel")}
              disabled={!!actionLoading}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          ) : null}
        </div>

        {statusMessage ? <p className="mt-4 text-sm text-red-600 dark:text-red-400">{statusMessage}</p> : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Current state</p>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{run.status}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Last updated</p>
            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{run.completed_at ?? run.started_at ?? run.created_at}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-950">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-indigo-600">Event stream</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Run activity</h3>
        </div>

        {sortedEvents.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            No events have been emitted for this run yet.
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {sortedEvents.map((event) => (
              <div key={event.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{event.event_type}</p>
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{new Date(event.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{event.message ?? "No message provided."}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
