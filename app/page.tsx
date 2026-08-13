import Link from "next/link";

const pillars = [
  {
    icon: "🔐",
    title: "Human Control",
    description: "Enterprise guardrails for every model, agent, and action.",
    items: ["Command", "Watch", "Take Control", "Approval"],
    accent: "border-indigo-400/30 bg-indigo-400/10 text-indigo-200",
  },
  {
    icon: "👥",
    title: "AI Workforce",
    description: "Specialist AI employees working within a governed operating system.",
    items: ["Sales", "Operations", "Research", "Shared context"],
    accent: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  },
  {
    icon: "🤖",
    title: "Security Gateway",
    description: "Every action is checked before data reaches a model or external system.",
    items: ["PII protection", "Permissions", "Risk policy", "Audit events"],
    accent: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  },
];

const intelligence = ["Gemini", "OpenAI", "Other approved models"];

const runtimeSteps = [
  "Human command + AI workforce",
  "Agent Orchestrator",
  "Planner + Policy",
  "Tool Router",
  "Browser, APIs, and Knowledge",
  "Security Gateway: PII, permissions, risk",
  "Model Gateway",
  "Execution",
  "Verification",
  "Human Approval",
  "Audit + Events",
  "Postgres, Memory, Realtime",
];

function PillarCard({ pillar }: { pillar: (typeof pillars)[number] }) {
  return (
    <article className={`rounded-2xl border p-6 ${pillar.accent}`}>
      <p className="text-2xl" aria-hidden>{pillar.icon}</p>
      <h3 className="mt-4 text-xl font-semibold text-white">{pillar.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{pillar.description}</p>
      <ul className="mt-5 space-y-3 border-t border-white/10 pt-5 text-sm">
        {pillar.items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#060b18] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-180 bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.34),transparent_65%)]" />
      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-6 lg:px-8">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">CompanyOS <span className="text-indigo-400">AI</span></Link>
          <Link href="/login" className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/5">Sign in</Link>
        </nav>

        <section className="mx-auto max-w-4xl py-24 text-center sm:py-32">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">CompanyOS AI</p>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">The secure operating system for AI employees.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">Collaborate with AI. Control AI. Deploy AI. Let AI do the work.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400">Build your workforce</Link>
            <Link href="/login" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold transition hover:border-white/30 hover:bg-white/5">Open workspace</Link>
          </div>
        </section>

        <section aria-label="CompanyOS product architecture" className="mx-auto max-w-5xl">
          <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-indigo-300/25 bg-indigo-400/10 px-5 py-3"><span className="h-2 w-2 rounded-full bg-indigo-300" /><span className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-100">CompanyOS AI</span></div>
          <div className="mx-auto h-10 w-px bg-linear-to-b from-indigo-300 to-indigo-500/30" />
          <div className="grid gap-5 md:grid-cols-3">
            {pillars.map((pillar) => <PillarCard key={pillar.title} pillar={pillar} />)}
          </div>
          <div className="mx-auto h-10 w-px bg-linear-to-b from-indigo-500/30 to-emerald-300" />
          <article className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200">📊 AI Intelligence</p>
            <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-200">{intelligence.map((item) => <span key={item}>{item}</span>)}</div>
          </article>
        </section>

        <section className="mt-28 grid gap-10 rounded-3xl border border-white/10 bg-white/3 p-7 sm:p-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">From assistance to execution</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">AI employees do the work. Humans supervise with confidence.</h2>
            <p className="mt-5 leading-7 text-slate-300">Every task is planned, protected, visible, verified, and auditable before it becomes a real-world action.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-4"><p className="text-sm font-semibold text-emerald-200">Low risk</p><p className="mt-1 text-sm text-slate-300">Research, read, summarize</p></div>
              <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-4"><p className="text-sm font-semibold text-amber-200">Controlled risk</p><p className="mt-1 text-sm text-slate-300">Updates and generated documents</p></div>
              <div className="rounded-xl border border-rose-300/20 bg-rose-400/10 p-4 sm:col-span-2"><p className="text-sm font-semibold text-rose-200">High risk requires approval</p><p className="mt-1 text-sm text-slate-300">Send email, delete records, change permissions, or any consequential action.</p></div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Agent runtime</p>
            <ol className="mt-5 space-y-1">
              {runtimeSteps.map((step, index) => (
                <li key={step} className="flex gap-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-400/15 text-xs font-semibold text-indigo-200">{index + 1}</span><div className="pb-4 text-sm text-slate-200">{step}{index < runtimeSteps.length - 1 && <div className="mt-2 h-4 w-px bg-indigo-400/30" />}</div></li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mt-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">Your company’s execution layer</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">CompanyOS learns how your company works—and gives its AI workforce a secure way to act.</h2>
        </section>
      </div>
    </main>
  );
}
