"use client";

import { useState } from "react";

const agents = [
  { name: "Research Agent", role: "Company discovery", icon: "⌕", status: "Running" },
  { name: "Sales Agent", role: "Prospect qualification", icon: "↗", status: "Ready" },
  { name: "Operations Agent", role: "Workflow automation", icon: "✓", status: "Ready" },
];

const nodes = [
  { title: "Research Task", detail: "20 Indian SaaS companies", state: "complete" },
  { title: "Research Agent", detail: "Planning next actions", state: "running" },
  { title: "Browser Session", detail: "Browsing company #7", state: "running" },
  { title: "Company Results", detail: "14 qualified companies", state: "pending" },
];

export function AgentControlRoom() {
  const [paused, setPaused] = useState(false);
  const [approval, setApproval] = useState<"pending" | "approved" | "rejected">("pending");
  const [selectedAgent, setSelectedAgent] = useState(0);

  const status = paused ? "Paused" : "Running";

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="grid min-h-[640px] lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">AI Employees</p><span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">3</span></div>
          <div className="mt-4 space-y-2">
            {agents.map((agent, index) => (
              <button key={agent.name} onClick={() => setSelectedAgent(index)} className={`w-full rounded-xl border p-3 text-left transition ${selectedAgent === index ? "border-indigo-300 bg-indigo-50 dark:border-indigo-500/50 dark:bg-indigo-500/10" : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                <div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white dark:bg-indigo-500">{agent.icon}</span><div><p className="text-sm font-semibold text-slate-900 dark:text-white">{agent.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{agent.role}</p></div></div>
                <p className={`mt-3 text-xs font-medium ${agent.status === "Running" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"}`}>● {index === selectedAgent ? status : agent.status}</p>
              </button>
            ))}
          </div>
          <button className="mt-5 w-full rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300">+ Add AI employee</button>
        </aside>

        <div className="flex min-w-0 flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Multiplayer Canvas</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Research workflow · 3 collaborators online</p></div><span className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Live</span></div>
          <div className="relative flex-1 overflow-hidden bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.12),transparent_48%)] p-6 sm:p-10">
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(148,163,184,.14)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.14)_1px,transparent_1px)] [background-size:28px_28px]" />
            <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-3 sm:gap-4">
              {nodes.map((node, index) => <div key={node.title} className="contents"><article className={`w-full max-w-sm rounded-2xl border bg-white p-4 shadow-lg dark:bg-slate-900 ${node.state === "running" ? "border-indigo-300 ring-4 ring-indigo-500/10 dark:border-indigo-500" : "border-slate-200 dark:border-slate-700"}`}><div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-slate-900 dark:text-white">{node.title}</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{node.detail}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${node.state === "complete" ? "bg-emerald-100 text-emerald-700" : node.state === "running" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{node.state === "running" && !paused ? "● Running" : node.state === "complete" ? "✓ Complete" : "Queued"}</span></div></article>{index < nodes.length - 1 && <div className="h-5 w-px bg-indigo-300 dark:bg-indigo-700" />}</div>)}
            </div>
          </div>
          <div className="border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 sm:p-5"><div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div><div className="flex items-center gap-2"><span className="text-lg">🤖</span><p className="font-semibold text-slate-900 dark:text-white">{agents[selectedAgent].name}</p><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${paused ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>● {status}</span></div><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Currently: Researching company #7 and extracting public company information.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setPaused(!paused)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">{paused ? "▶ Resume" : "⏸ Pause"}</button><button className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">✋ Take control</button><button onClick={() => setApproval("approved")} disabled={approval !== "pending"} className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">{approval === "approved" ? "✓ Approved" : approval === "rejected" ? "Rejected" : "✓ Approve"}</button></div></div></div>
        </div>
      </div>
    </section>
  );
}
