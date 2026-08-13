"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Globe,
  Hand,
  Loader2,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";
import {
  RoomProvider,
  useMutation,
  useMyPresence,
  useOthers,
  useSelf,
  useStorage,
} from "../liveblocks.config";

type BoardNode = {
  id: string;
  role: "user" | "assistant";
  text: string;
  title: string;
  authorName: string;
  color: string;
  x: number;
  y: number;
  createdAt: number;
};

const pillars = [
  {
    icon: "Security",
    title: "Human Control",
    description: "Enterprise guardrails for every model, agent, and action.",
    items: ["Command", "Watch", "Take Control", "Approval"],
    accent: "border-indigo-400/30 bg-indigo-400/10 text-indigo-200",
  },
  {
    icon: "Workforce",
    title: "AI Workforce",
    description: "Specialist AI employees working within a governed operating system.",
    items: ["Sales", "Operations", "Research", "Shared context"],
    accent: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  },
  {
    icon: "Governance",
    title: "Security Gateway",
    description: "Every action is checked before data reaches a model or external system.",
    items: ["PII protection", "Permissions", "Risk policy", "Audit events"],
    accent: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  },
];

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

const visibilityMetrics = [
  { label: "AI visibility", value: 78 },
  { label: "Recommendation", value: 64 },
  { label: "Agent readiness", value: 82 },
  { label: "Website readability", value: 91 },
  { label: "Pricing discovery", value: 47 },
  { label: "Action success", value: 71 },
];

const stableBoardState = {
  nodes: [
    {
      id: "welcome-card",
      role: "assistant" as const,
      title: "Workspace Status",
      authorName: "System",
      color: "#3b82f6",
      text: "CompanyOS workspace is live. Share updates with your team in real time.",
      x: 140,
      y: 110,
      createdAt: 1,
    },
    {
      id: "peer-card",
      role: "assistant" as const,
      title: "Peer Review",
      authorName: "Lena",
      color: "#34d399",
      text: "I already reviewed the roadmap and am aligning the launch checklist.",
      x: 520,
      y: 150,
      createdAt: 2,
    },
  ] satisfies BoardNode[],
  updatedAt: 0,
};

type SEOResults = {
  brandScore: number;
  competitorScore: number;
  isBrandMentioned: boolean;
  isCompetitorMentioned: boolean;
  aiResponse: string;
};

const collaborationEnabled = Boolean(
  process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY,
);

function PillarCard({ pillar }: { pillar: (typeof pillars)[number] }) {
  return (
    <article className={`rounded-2xl border p-6 ${pillar.accent}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">{pillar.icon}</p>
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

function CompanyHero() {
  return (
    <section className="mx-auto max-w-5xl py-20 text-center sm:py-28">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-300">CompanyOS AI</p>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">
        The secure operating system for AI employees.
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
        Collaborate with AI. Control AI. Deploy AI. Let AI do the work.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link
          href="/signup"
          className="rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400"
        >
          Build your workforce
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold transition hover:border-white/30 hover:bg-white/5"
        >
          Open workspace
        </Link>
      </div>
    </section>
  );
}

function ArchitectureSection() {
  return (
    <section aria-label="CompanyOS product architecture" className="mx-auto max-w-5xl">
      <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-indigo-300/25 bg-indigo-400/10 px-5 py-3">
        <span className="h-2 w-2 rounded-full bg-indigo-300" />
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-100">
          CompanyOS AI
        </span>
      </div>
      <div className="mx-auto h-10 w-px bg-linear-to-b from-indigo-300 to-indigo-500/30" />
      <div className="grid gap-5 md:grid-cols-3">
        {pillars.map((pillar) => (
          <PillarCard key={pillar.title} pillar={pillar} />
        ))}
      </div>
      <div className="mx-auto h-10 w-px bg-linear-to-b from-indigo-500/30 to-emerald-300" />
      <article className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200">
          AI Intelligence
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-200">
          <span>AI visibility</span>
          <span>Agent readiness</span>
          <span>Competitor intel</span>
          <span>Recommendations</span>
        </div>
      </article>
    </section>
  );
}

function RuntimeSection() {
  return (
    <section className="mt-28 grid gap-10 rounded-3xl border border-white/10 bg-white/3 p-7 sm:p-10 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">
          From assistance to execution
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight">
          AI employees do the work. Humans supervise with confidence.
        </h2>
        <p className="mt-5 leading-7 text-slate-300">
          Every task is planned, protected, visible, verified, and auditable before it becomes a
          real-world action.
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-4">
            <p className="text-sm font-semibold text-emerald-200">Low risk</p>
            <p className="mt-1 text-sm text-slate-300">Research, read, summarize</p>
          </div>
          <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-4">
            <p className="text-sm font-semibold text-amber-200">Controlled risk</p>
            <p className="mt-1 text-sm text-slate-300">Updates and generated documents</p>
          </div>
          <div className="rounded-xl border border-rose-300/20 bg-rose-400/10 p-4 sm:col-span-2">
            <p className="text-sm font-semibold text-rose-200">High risk requires approval</p>
            <p className="mt-1 text-sm text-slate-300">
              Send email, delete records, change permissions, or any consequential action.
            </p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
          Agent runtime
        </p>
        <ol className="mt-5 space-y-1">
          {runtimeSteps.map((step, index) => (
            <li key={step} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-400/15 text-xs font-semibold text-indigo-200">
                {index + 1}
              </span>
              <div className="pb-4 text-sm text-slate-200">
                {step}
                {index < runtimeSteps.length - 1 && <div className="mt-2 h-4 w-px bg-indigo-400/30" />}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Avatars() {
  const others = useOthers();
  const self = useSelf();
  const users = [self, ...others].filter((user): user is NonNullable<typeof user> => user !== null);

  return (
    <div className="flex items-center gap-2">
      <p className="hidden text-xs text-slate-400 md:block">Live:</p>
      <div className="flex -space-x-2">
        {users.map((user) => {
          const isYou = user === self;

          return (
            <div
              key={user.connectionId}
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0A0B0D] text-xs font-bold ${
                isYou ? "bg-blue-600" : "bg-emerald-600"
              }`}
              title={isYou ? "You" : `User ${user.connectionId}`}
            >
              {isYou ? "A" : "P"}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WorkspaceSidebar({
  activeView,
  setActiveView,
}: {
  activeView: "graph" | "intelligence";
  setActiveView: (value: "graph" | "intelligence") => void;
}) {
  const [myPresence] = useMyPresence();

  return (
    <aside className="flex w-full flex-col border-r border-white/10 bg-[#121417] p-4 md:w-72">
      <div className="flex items-center justify-between">
        <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
          CompanyOS <span className="text-indigo-300">Command</span>
        </h2>
        <span className="mb-6 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
          {myPresence?.isTyping ? "typing" : "live"}
        </span>
      </div>

      <div className="mb-6">
        <h3 className="mb-2 text-xs uppercase text-slate-500">Command Graph</h3>
        <ul className="space-y-2 text-sm">
          <li
            onClick={() => setActiveView("graph")}
            className={`cursor-pointer rounded-md p-2 ${activeView === "graph" ? "bg-slate-800" : "hover:bg-slate-800"}`}
          >
            Canvas
          </li>
          <li
            onClick={() => setActiveView("intelligence")}
            className={`cursor-pointer rounded-md p-2 ${activeView === "intelligence" ? "bg-slate-800" : "hover:bg-slate-800"}`}
          >
            Intelligence
          </li>
          <li className="cursor-pointer rounded-md p-2 text-slate-500 hover:bg-slate-800">
            + New workflow
          </li>
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="mb-2 text-xs uppercase text-slate-500">AI Employees</h3>
        <ul className="space-y-2 text-sm">
          <li className="rounded-md p-2 hover:bg-slate-800">Sales Agent</li>
          <li className="rounded-md p-2 hover:bg-slate-800">Marketing Agent</li>
          <li className="rounded-md p-2 hover:bg-slate-800">Research Agent</li>
          <li className="rounded-md p-2 hover:bg-slate-800">Operations Agent</li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-xs uppercase text-slate-500">Governance</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2 rounded-md p-2 hover:bg-slate-800">
            <ShieldCheck size={14} /> Approval Queue
          </li>
          <li className="flex items-center gap-2 rounded-md p-2 hover:bg-slate-800">
            <Globe size={14} /> AI Visibility
          </li>
        </ul>
      </div>
    </aside>
  );
}

function SEODashboard() {
  const [brand, setBrand] = useState("CompanyOS");
  const [competitor, setCompetitor] = useState("Slack");
  const [industry, setIndustry] = useState("AI Workspace");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SEOResults | null>(null);

  const runScan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);

    try {
      const res = await fetch("/api/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, competitor, industry }),
      });
      const data: SEOResults = await res.json();
      setResults(data);
    } catch (error) {
      console.error("Failed to run scan:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0B0D] p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Globe size={24} className="text-blue-500" />
            AI Visibility & Agent Readiness
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            See how AI models perceive your brand versus competitors.
          </p>
        </div>

        <form
          onSubmit={runScan}
          className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-800 bg-[#121417] p-6"
        >
          <div className="min-w-[12.5rem] flex-1">
            <label className="mb-1 block text-xs uppercase text-gray-400">Your Brand</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-[#0A0B0D] p-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="min-w-[12.5rem] flex-1">
            <label className="mb-1 block text-xs uppercase text-gray-400">Competitor</label>
            <input
              type="text"
              value={competitor}
              onChange={(e) => setCompetitor(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-[#0A0B0D] p-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="min-w-[12.5rem] flex-1">
            <label className="mb-1 block text-xs uppercase text-gray-400">Industry</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-[#0A0B0D] p-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-600"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search size={16} />
                Run Scan
              </>
            )}
          </button>
        </form>

        {loading && (
          <div className="py-10 text-center text-gray-500">
            <Loader2 size={32} className="mx-auto mb-4 animate-spin" />
            <p>Asking the model gateway about your brand...</p>
          </div>
        )}

        {results && !loading && (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-800 bg-[#121417] p-6">
              <h3 className="mb-6 text-lg font-semibold">AI Visibility Score</h3>

              <div className="mb-6">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium text-blue-400">{brand}</span>
                  <span className="text-gray-400">{results.brandScore}%</span>
                </div>
                <div className="h-4 w-full rounded-full bg-gray-800">
                  <div
                    className="h-4 rounded-full bg-blue-600 transition-all duration-1000"
                    style={{ width: `${results.brandScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium text-red-400">{competitor}</span>
                  <span className="text-gray-400">{results.competitorScore}%</span>
                </div>
                <div className="h-4 w-full rounded-full bg-gray-800">
                  <div
                    className="h-4 rounded-full bg-red-600 transition-all duration-1000"
                    style={{ width: `${results.competitorScore}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-gray-800 bg-[#121417] p-6">
                <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
                  Model summary
                </h3>
                <div
                  className={`rounded-lg p-3 text-sm ${
                    results.isBrandMentioned ? "bg-green-900/20 text-green-400" : "bg-red-900/20 text-red-400"
                  }`}
                >
                  {results.isBrandMentioned
                    ? `${brand} was mentioned.`
                    : `${brand} was not mentioned.`}
                </div>
                <p className="mt-3 text-xs italic text-gray-400">&ldquo;{results.aiResponse}&rdquo;</p>
              </div>

              <div className="rounded-xl border border-gray-800 bg-[#121417] p-6">
                <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
                  Suggested actions
                </h3>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 text-green-500" />
                    Update FAQ pages with structured data.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 text-green-500" />
                    Publish a comparison page for the target industry.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="mt-0.5 text-green-500" />
                    Assign the follow-up checklist to a marketing agent.
                  </li>
                </ul>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {visibilityMetrics.map((metric) => (
                <div key={metric.label} className="rounded-xl border border-gray-800 bg-[#121417] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{metric.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!results && !loading && (
          <div className="rounded-xl border border-dashed border-gray-800 py-20 text-center text-gray-600">
            <Globe size={48} className="mx-auto mb-4 opacity-50" />
            <p>Run a scan to see AI visibility and readiness.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CanvasChatComponent() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const boardState = useStorage((root) => root.board ?? stableBoardState);
  const boardNodes = useMemo(
    () => boardState?.nodes ?? stableBoardState.nodes,
    [boardState],
  );

  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();

  const syncBoardState = useMutation(
    ({ storage }, nextNodes: BoardNode[]) => {
      storage.set("board", {
        nodes: nextNodes,
        updatedAt: Date.now(),
      });
    },
    [],
  );

  const [input, setInput] = useState("");
  const [showPIIAlert, setShowPIIAlert] = useState(false);
  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});

  const [simulatedPeer, setSimulatedPeer] = useState({
    name: "Lena",
    color: "#34d399",
    cursor: { x: 540, y: 180 },
    isTyping: false,
    lastAction: "reviewing roadmap",
  });

  const [peerTrail, setPeerTrail] = useState<
    Array<{ x: number; y: number }>
  >([{ x: 540, y: 180 }]);

  const isLoading = status === "streaming" || status === "submitted";

  /*
   * Simulated peer movement
   */
  useEffect(() => {
    const cursorCycle = [
      { x: 540, y: 180 },
      { x: 610, y: 240 },
      { x: 660, y: 180 },
      { x: 520, y: 300 },
      { x: 590, y: 330 },
      { x: 710, y: 220 },
    ];

    let index = 0;

    const timer = setInterval(() => {
      index = (index + 1) % cursorCycle.length;

      const nextCursor = cursorCycle[index];

      setSimulatedPeer((prev) => ({
        ...prev,
        cursor: nextCursor,
        isTyping: index % 2 === 0,
        lastAction:
          index % 2 === 0
            ? "reviewing roadmap"
            : "syncing checklist",
      }));

      setPeerTrail((prev) => [
        ...prev.slice(-9),
        nextCursor,
      ]);
    }, 1800);

    return () => clearInterval(timer);
  }, []);

  /*
   * Sync AI chat messages into the collaborative board.
   */
  useEffect(() => {
    const nextNodes = messages.reduce<BoardNode[]>(
      (acc, message, index) => {
        const text = message.parts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join(" ")
          .trim();

        if (!text) {
          return acc;
        }

        acc.push({
          id: message.id ?? `${message.role}-${index}`,
          role:
            message.role === "user"
              ? "user"
              : "assistant",
          title:
            message.role === "user"
              ? "User Prompt"
              : "AI Response",
          authorName:
            message.role === "user"
              ? "You"
              : "AI",
          color:
            message.role === "user"
              ? "#60a5fa"
              : "#f59e0b",
          text,
          x: 100 + (index % 2) * 420,
          y: 90 + Math.floor(index / 2) * 220,
          createdAt: index + 1,
        });

        return acc;
      },
      [],
    );

    const currentNodes = boardNodes;

    if (
      nextNodes.length > 0 &&
      JSON.stringify(nextNodes) !== JSON.stringify(currentNodes)
    ) {
      syncBoardState(nextNodes);
    }
  }, [
    messages,
    boardNodes,
    syncBoardState,
  ]);

  /*
   * Submit chat prompt
   */
  const onSubmit = (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    const trimmedInput = input.trim();

    if (!trimmedInput) {
      return;
    }

    const panRegex = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/;

    if (panRegex.test(trimmedInput)) {
      setShowPIIAlert(true);

      setTimeout(() => {
        setShowPIIAlert(false);
      }, 4000);
    }

    updateMyPresence({
      name: "You",
      isTyping: true,
      lastAction: "sent a prompt",
    });

    sendMessage({
      text: trimmedInput,
    });

    setInput("");
  };

  /*
   * Mouse interaction
   */
  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    id: string | number,
  ) => {
    const rect =
      e.currentTarget.getBoundingClientRect();

    const nextCursor = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    setPositions((prev) => ({
      ...prev,
      [String(id)]: nextCursor,
    }));

    updateMyPresence({
      cursor: nextCursor,
      lastAction: "dragging card",
    });
  };

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (!myPresence?.cursor) {
      return;
    }

    const canvasRect =
      e.currentTarget.getBoundingClientRect();

    const nextCursor = {
      x: e.clientX - canvasRect.left,
      y: e.clientY - canvasRect.top,
    };

    updateMyPresence({
      cursor: nextCursor,
      lastAction: "moved a node",
    });
  };

  const allPresenceMarkers = [
    ...others.map((user) => ({
      name:
        user.info?.name ??
        `User ${user.connectionId}`,

      color:
        user.info?.color ??
        "#34d399",

      cursor:
        user.presence?.cursor ??
        { x: 0, y: 0 },

      isTyping:
        Boolean(user.presence?.isTyping),

      lastAction:
        user.presence?.lastAction ??
        "active",
    })),

    {
      name: simulatedPeer.name,
      color: simulatedPeer.color,
      cursor: simulatedPeer.cursor,
      isTyping: simulatedPeer.isTyping,
      lastAction: simulatedPeer.lastAction,
    },
  ];

  const peerCursorTrail = peerTrail.map(
    (point, trailIndex) => ({
      ...point,

      opacity: Math.max(
        0.2,
        (trailIndex + 1) /
          peerTrail.length,
      ),

      size: 9 + trailIndex * 2,
    }),
  );

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="z-20 flex items-center justify-between border-b border-gray-800 bg-[#0A0B0D] p-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Hand
            size={18}
            className="text-gray-500"
          />
          Workflow Canvas
        </h3>

        <div className="flex items-center gap-4">
          <Avatars />

          <div className="hidden items-center gap-2 rounded-full border border-green-700 bg-green-900/30 px-3 py-1.5 text-xs font-medium text-green-400 md:flex">
            <ShieldCheck size={14} />
            Trust Shield
          </div>
        </div>
      </div>

      <div
        className="relative flex-1 overflow-hidden bg-[#0A0B0D]"
        style={{
          backgroundImage:
            "radial-gradient(#1C1E24 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
        onMouseMove={handleMouseMove}
      >
        {showPIIAlert && (
          <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg border border-yellow-700/50 bg-yellow-900/20 p-3 text-center text-sm text-yellow-400 shadow-md animate-pulse">
            PAN or PII detected. Input is masked before model access.
          </div>
        )}

        {boardNodes.length === 0 && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-gray-600">
            <p className="text-lg">
              Canvas is empty.
            </p>

            <p className="mt-2 text-sm">
              Type a prompt below to generate your first AI node.
            </p>
          </div>
        )}

        {peerCursorTrail.map(
          (point, trailIndex) => (
            <div
              key={`trail-${trailIndex}`}
              className="pointer-events-none absolute z-20"
              style={{
                left: point.x + 12,
                top: point.y + 12,
                opacity: point.opacity,
              }}
            >
              <div
                className="rounded-full border border-white/20 shadow-md"
                style={{
                  width: `${point.size}px`,
                  height: `${point.size}px`,
                  background:
                    simulatedPeer.color,
                }}
              />
            </div>
          ),
        )}

        {allPresenceMarkers.map((peer, index) => (
  <div
    key={`${peer.name}-${index}`}
    className="pointer-events-none absolute z-20"
    style={{
      left: peer.cursor.x + 12,
      top: peer.cursor.y + 12,
    }}
  >
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0A0B0D]/90 px-2 py-1 text-[10px] font-medium text-white shadow-lg">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{
          background: String(peer.color ?? "#34d399"),
        }}
      />

      {peer.name}

      {peer.isTyping
        ? " · typing"
        : ` · ${peer.lastAction}`}
    </div>

    <div
      className="mt-1 h-4 w-4 rounded-full border-2 border-white shadow-md"
      style={{
        background: String(peer.color ?? "#34d399"),
      }}
    />
  </div>
))}

        {boardNodes.map((node) => {
          const pos =
            positions[node.id] ?? {
              x: node.x,
              y: node.y,
            };

          return (
            <div
              key={node.id}
              onMouseDown={(event) =>
                handleMouseDown(
                  event,
                  node.id,
                )
              }
              className={`absolute w-72 cursor-move select-none rounded-xl border shadow-2xl ${
                node.role === "user"
                  ? "border-blue-400 bg-blue-600 text-white"
                  : "border-gray-700 bg-[#121417] text-gray-300"
              }`}
              style={{
                left: pos.x,
                top: pos.y,
              }}
            >
              <div className="flex items-center justify-between gap-2 border-b border-black/20 px-4 py-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-white/80">
                  {node.title}
                </span>

                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background:
                      node.color,
                  }}
                />
              </div>

              <div className="px-4 py-3">
                <div className="mb-2 text-[10px] uppercase tracking-wide text-white/70">
                  {node.authorName}
                </div>

                <p className="break-words whitespace-pre-line text-sm">
                  {node.text}
                </p>
              </div>
            </div>
          );
        })}

        {isLoading && !showPIIAlert && (
          <div className="absolute bottom-24 right-10 z-10 max-w-md rounded-lg border border-gray-700 bg-[#121417] p-3 shadow-md">
            <div className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:0.2s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500 [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-6 left-1/2 z-30 w-full max-w-2xl -translate-x-1/2 px-4">
        <form
          onSubmit={onSubmit}
          className="flex items-center rounded-xl border border-gray-700 bg-[#121417] p-2 shadow-2xl backdrop-blur"
        >
          <input
            type="text"
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            placeholder="Type to add a node to the command graph..."
            className="flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder-gray-500"
          />

          <button
            type="button"
            className="px-2 text-gray-400 hover:text-white"
          >
            <Paperclip size={18} />
          </button>

          <button
            type="submit"
            className="ml-2 rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

function CollaborationWorkspace() {
  const [activeView, setActiveView] = useState<
    "graph" | "intelligence"
  >("graph");

  const shell = (
    <div className="mt-16 grid gap-0 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0A0B0D] shadow-2xl shadow-black/40 lg:grid-cols-[18rem_1fr]">
      <WorkspaceSidebar
        activeView={activeView}
        setActiveView={setActiveView}
      />
      <div className="min-h-[48rem]">
        {activeView === "graph" ? (
          <CanvasChatComponent />
        ) : (
          <SEODashboard />
        )}
      </div>
    </div>
  );

  if (!collaborationEnabled) {
    return (
      <section className="mt-16 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
            Multiplayer ready
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
            Live collaboration activates when Liveblocks credentials are configured.
          </h2>
          <p className="mt-4 max-w-2xl leading-7 text-slate-300">
            The dashboard still loads without credentials, but shared cursors, live presence, and
            the command canvas only come online when the public Liveblocks key is present in the
            environment.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Collaboration
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                Presence, handoff, and live approval queues
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Safety
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                Approval flow, audit trail, and policy gating remain active
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-[#0A0B0D]">
          <SEODashboard />
        </div>
      </section>
    );
  }

  return (
    <RoomProvider
      id="companyos-home"
      initialPresence={{
        name: "You",
        color: "#60a5fa",
        isTyping: false,
        cursor: { x: 0, y: 0 },
        lastAction: "joined the workspace",
      }}
      initialStorage={{ board: stableBoardState }}
    >
      {shell}
    </RoomProvider>
  );
}

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060b18] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.24),_transparent_34%),radial-gradient(circle_at_20%_20%,_rgba(14,165,233,0.15),_transparent_25%),linear-gradient(180deg,_rgba(255,255,255,0.03),_transparent_45%)]" />
      <div className="relative mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <CompanyHero />
        <div className="mx-auto mt-6 max-w-6xl">
          <ArchitectureSection />
          <RuntimeSection />
          <section className="mt-28 grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Overview",
                value: "Command center",
                text: "See the workforce, approvals, and live execution posture at a glance.",
              },
              {
                title: "Agents",
                value: "6 roles",
                text: "Sales, Marketing, Research, Operations, Finance, and Legal are ready.",
              },
              {
                title: "Governance",
                value: "Human in loop",
                text: "Sensitive actions pause for approval with policy and audit controls.",
              },
            ].map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                  {card.title}
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  {card.value}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {card.text}
                </p>
              </article>
            ))}
          </section>
          <CollaborationWorkspace />
        </div>
      </div>
    </main>
  );
}
