"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RunStartButton({ agentId, taskId }: { agentId: string; taskId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/agents/${agentId}/runs/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to start run.");
      }

      if (!payload.run?.id) {
        throw new Error("Run response did not include an id.");
      }

      router.push(`/agents/${agentId}/runs/${payload.run.id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to start run.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleStart}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-600 dark:hover:bg-indigo-500"
      >
        {loading ? "Starting..." : "Start run"}
      </button>
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
