'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import {
  Send,
  ShieldCheck,
  Paperclip,
  Globe,
  Search,
  CheckCircle,
  Loader2,
  Hand,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  RoomProvider,
  useMutation,
  useMyPresence,
  useOthers,
  useSelf,
  useStorage,
} from '../liveblocks.config';

type BoardNode = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  title: string;
  authorName: string;
  color: string;
  x: number;
  y: number;
  createdAt: number;
};

const initialBoardState = {
  nodes: [
    {
      id: 'welcome-card',
      role: 'assistant',
      title: 'Workspace Status',
      authorName: 'System',
      color: '#3b82f6',
      text: 'CompanyOS workspace is live. Share updates with your team in real time.',
      x: 140,
      y: 110,
      createdAt: Date.now(),
    },
    {
      id: 'peer-card',
      role: 'assistant',
      title: 'Peer Review',
      authorName: 'Lena',
      color: '#34d399',
      text: 'I already reviewed the roadmap and am aligning the launch checklist.',
      x: 520,
      y: 150,
      createdAt: Date.now() + 1000,
    },
  ],
  updatedAt: Date.now(),
};

type SEOResults = {
  brandScore: number;
  competitorScore: number;
  isBrandMentioned: boolean;
  isCompetitorMentioned: boolean;
  aiResponse: string;
};

function Avatars() {
  const others = useOthers();
  const self = useSelf();
  const users = [self, ...others].filter((user): user is NonNullable<typeof user> => user !== null);

  return (
    <div className="flex items-center gap-2">
      <p className="text-xs text-gray-500 hidden md:block">👥 Live:</p>
      <div className="flex -space-x-2">
        {users.map((user) => {
          const isYou = user === self;
          return (
            <div
              key={user.connectionId}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-[#0A0B0D] ${
                isYou ? 'bg-blue-600' : 'bg-emerald-600'
              }`}
              title={isYou ? 'You' : `User ${user.connectionId}`}
            >
              {isYou ? 'A' : 'P'}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SEODashboard() {
  const [brand, setBrand] = useState('CompanyOS');
  const [competitor, setCompetitor] = useState('Slack');
  const [industry, setIndustry] = useState('AI Workspace');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SEOResults | null>(null);

  const runScan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);

    try {
      const res = await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, competitor, industry }),
      });
      const data: SEOResults = await res.json();
      setResults(data);
    } catch (error) {
      console.error('Failed to run scan:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#0A0B0D]">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe size={24} className="text-blue-500" /> Brand Intelligence
          </h2>
          <p className="text-gray-500 text-sm mt-1">See how AI models perceive your brand vs competitors.</p>
        </div>

        <form onSubmit={runScan} className="bg-[#121417] border border-gray-800 p-6 rounded-xl flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-50">
            <label className="text-xs text-gray-400 uppercase block mb-1">Your Brand</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full bg-[#0A0B0D] border border-gray-700 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex-1 min-w-50">
            <label className="text-xs text-gray-400 uppercase block mb-1">Competitor</label>
            <input
              type="text"
              value={competitor}
              onChange={(e) => setCompetitor(e.target.value)}
              className="w-full bg-[#0A0B0D] border border-gray-700 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex-1 min-w-50">
            <label className="text-xs text-gray-400 uppercase block mb-1">Industry</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full bg-[#0A0B0D] border border-gray-700 rounded-lg p-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 h-9.5"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Scanning...</> : <><Search size={16} /> Run Scan</>}
          </button>
        </form>

        {loading && (
          <div className="text-center text-gray-500 py-10">
            <Loader2 size={32} className="animate-spin mx-auto mb-4" />
            <p>Asking ChatGPT & Gemini about your brand...</p>
          </div>
        )}

        {results && !loading && (
          <div className="space-y-6">
            <div className="bg-[#121417] border border-gray-800 p-6 rounded-xl">
              <h3 className="text-lg font-semibold mb-6">AI Visibility Score</h3>

              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-blue-400 font-medium">{brand}</span>
                  <span className="text-gray-400">{results.brandScore}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-4">
                  <div className="bg-blue-600 h-4 rounded-full transition-all duration-1000" style={{ width: `${results.brandScore}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-red-400 font-medium">{competitor}</span>
                  <span className="text-gray-400">{results.competitorScore}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-4">
                  <div className="bg-red-600 h-4 rounded-full transition-all duration-1000" style={{ width: `${results.competitorScore}%` }}></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#121417] border border-gray-800 p-6 rounded-xl">
                <h3 className="text-md font-semibold mb-3 flex items-center gap-2">🤖 What Gemini Said:</h3>
                <div className={`p-3 rounded-lg text-sm ${results.isBrandMentioned ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                  {results.isBrandMentioned ? `✅ ${brand} was mentioned!` : `❌ ${brand} was NOT mentioned.`}
                </div>
                <p className="text-gray-400 text-xs mt-3 italic">&ldquo;{results.aiResponse}&rdquo;</p>
              </div>

              <div className="bg-[#121417] border border-gray-800 p-6 rounded-xl">
                <h3 className="text-md font-semibold mb-3 flex items-center gap-2">🛠️ Actionable Fixes:</h3>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li className="flex items-start gap-2"><CheckCircle size={16} className="text-green-500 mt-0.5" /> Update FAQ page with Schema.org structured data.</li>
                  <li className="flex items-start gap-2"><CheckCircle size={16} className="text-green-500 mt-0.5" /> Publish blog post: &ldquo;Top {industry} Companies in India&rdquo;.</li>
                  <li className="flex items-start gap-2"><CheckCircle size={16} className="text-green-500 mt-0.5" /> Get mentioned on TechCrunch India (Competitor has 3 backlinks).</li>
                </ul>
                <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">🤖 Assign Checklist to Marketing Agent</button>
              </div>
            </div>
          </div>
        )}

        {!results && !loading && (
          <div className="text-center text-gray-600 py-20 border border-dashed border-gray-800 rounded-xl">
            <Globe size={48} className="mx-auto mb-4 opacity-50" />
            <p>Run a scan to see your AI visibility.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function WorkspaceSidebar({
  activeView,
  setActiveView,
}: {
  activeView: string;
  setActiveView: (value: string) => void;
}) {
  const [myPresence] = useMyPresence();

  return (
    <div className="md:flex w-64 bg-[#121417] border-r border-gray-800 flex-col p-4 z-40">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold mb-6 flex items-center gap-2">🌐 <span>CompanyOS</span></h1>
        <span className="mb-6 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
          {myPresence?.isTyping ? 'typing' : 'live'}
        </span>
      </div>

      <div className="mb-6">
        <h2 className="text-xs text-gray-500 uppercase mb-2">💬 Workspace</h2>
        <ul className="space-y-2 text-sm">
          <li onClick={() => setActiveView('chat')} className={`p-2 rounded-md cursor-pointer ${activeView === 'chat' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>⬡ Q3 Strategy Canvas</li>
          <li className="p-2 rounded-md hover:bg-gray-800 cursor-pointer">⬡ Acme Proposal</li>
          <li className="p-2 rounded-md hover:bg-gray-800 cursor-pointer text-gray-500">+ New Canvas</li>
        </ul>
      </div>

      <div className="mb-6">
        <h2 className="text-xs text-gray-500 uppercase mb-2">🤖 AI Employees</h2>
        <ul className="space-y-2 text-sm">
          <li className="p-2 rounded-md hover:bg-gray-800 cursor-pointer">▣ Sales Agent</li>
          <li className="p-2 rounded-md hover:bg-gray-800 cursor-pointer">▣ Marketing Agent</li>
          <li className="p-2 rounded-md hover:bg-gray-800 cursor-pointer">▣ Legal Agent</li>
        </ul>
      </div>

      <div>
        <h2 className="text-xs text-gray-500 uppercase mb-2">📊 Intelligence</h2>
        <ul className="space-y-2 text-sm">
          <li onClick={() => setActiveView('seo')} className={`p-2 rounded-md cursor-pointer flex items-center gap-2 ${activeView === 'seo' ? 'bg-gray-800 text-blue-400' : 'hover:bg-gray-800'}`}>
            <Globe size={14} /> AI-SEO Mode
          </li>
          <li className="p-2 rounded-md hover:bg-gray-800 cursor-pointer flex items-center gap-2">
            <ShieldCheck size={14} /> Gateway Logs
          </li>
        </ul>
      </div>
    </div>
  );
}

function CanvasChatComponent() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });
  const boardState = useStorage((root) => root.board ?? initialBoardState);
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();
  const syncBoardState = useMutation(({ storage }, nextNodes: BoardNode[]) => {
    storage.set('board', {
      nodes: nextNodes,
      updatedAt: Date.now(),
    });
  }, []);

  const [input, setInput] = useState('');
  const [showPIIAlert, setShowPIIAlert] = useState(false);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [simulatedPeer, setSimulatedPeer] = useState({
    name: 'Lena',
    color: '#34d399',
    cursor: { x: 540, y: 180 },
    isTyping: false,
    lastAction: 'reviewing roadmap',
  });
  const [peerTrail, setPeerTrail] = useState<Array<{ x: number; y: number }>>([
    { x: 540, y: 180 },
  ]);

  const isLoading = status === 'streaming' || status === 'submitted';

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
        lastAction: index % 2 === 0 ? 'reviewing roadmap' : 'syncing checklist',
      }));
      setPeerTrail((prev) => [...prev.slice(-9), nextCursor]);
    }, 1800);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const nextNodes = messages.reduce<BoardNode[]>((acc, message, index) => {
      const text = message.parts
        .filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join(' ')
        .trim();

      if (!text) return acc;

      acc.push({
        id: message.id ?? `${message.role}-${index}`,
        role: message.role === 'user' ? 'user' : 'assistant',
        title: message.role === 'user' ? 'User Prompt' : 'AI Response',
        authorName: message.role === 'user' ? 'You' : 'AI',
        color: message.role === 'user' ? '#60a5fa' : '#f59e0b',
        text,
        x: 100 + (index % 2) * 420,
        y: 90 + Math.floor(index / 2) * 220,
        createdAt: Date.now() + index,
      });

      return acc;
    }, []);

    if (nextNodes.length > 0 && JSON.stringify(nextNodes) !== JSON.stringify(boardState.nodes ?? [])) {
      syncBoardState(nextNodes);
    }
  }, [messages, boardState.nodes, syncBoardState]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim()) {
      return;
    }

    const panRegex = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/;
    if (panRegex.test(input)) {
      setShowPIIAlert(true);
      setTimeout(() => setShowPIIAlert(false), 4000);
    }

    updateMyPresence({
      name: 'You',
      isTyping: true,
      lastAction: 'sent a prompt',
    });

    sendMessage({ text: input });
    setInput('');
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: string | number) => {
    const rect = e.currentTarget.getBoundingClientRect();
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
      lastAction: 'dragging card',
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!myPresence?.cursor) return;

    const canvasRect = e.currentTarget.getBoundingClientRect();
    const nextCursor = {
      x: e.clientX - canvasRect.left,
      y: e.clientY - canvasRect.top,
    };

    updateMyPresence({
      cursor: nextCursor,
      lastAction: 'moved a node',
    });
  };

  const boardNodes = boardState?.nodes ?? [];
  const allPresenceMarkers = [
    ...others.map((user) => ({
      name: user.info?.name ?? `User ${user.connectionId}`,
      color: user.info?.color ?? '#34d399',
      cursor: user.presence?.cursor ?? { x: 0, y: 0 },
      isTyping: Boolean(user.presence?.isTyping),
      lastAction: user.presence?.lastAction ?? 'active',
    })),
    {
      name: simulatedPeer.name,
      color: simulatedPeer.color,
      cursor: simulatedPeer.cursor,
      isTyping: simulatedPeer.isTyping,
      lastAction: simulatedPeer.lastAction,
    },
  ];

  const peerCursorTrail = peerTrail.map((point, trailIndex) => ({
    ...point,
    opacity: Math.max(0.2, (trailIndex + 1) / peerTrail.length),
    size: 9 + trailIndex * 2,
  }));

  return (
    <div className="flex-1 flex flex-col relative">
      <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-[#0A0B0D] z-20">
        <h2 className="font-semibold text-lg flex items-center gap-2"><Hand size={18} className="text-gray-500" /> Workflow Canvas</h2>
        <div className="flex items-center gap-4">
          <Avatars />
          <div className="hidden md:flex items-center gap-2 bg-green-900/30 border border-green-700 px-3 py-1.5 rounded-full text-green-400 text-xs font-medium animate-pulse">
            <ShieldCheck size={14} /> Trust Shield
          </div>
        </div>
      </div>

      <div
        className="flex-1 relative overflow-hidden bg-[#0A0B0D]"
        style={{
          backgroundImage: 'radial-gradient(#1C1E24 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
        onMouseMove={handleMouseMove}
      >
        {showPIIAlert && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-900/20 border border-yellow-700/50 p-3 rounded-lg text-center text-yellow-400 shadow-md text-sm animate-pulse">
            🛡️ System: PAN/PII Detected. Masked before sending to Google Gemini.
          </div>
        )}

        {boardNodes.length === 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-gray-600">
            <p className="text-lg">Canvas is empty.</p>
            <p className="text-sm mt-2">Type a prompt below to generate your first AI node.</p>
          </div>
        )}

        {peerCursorTrail.map((point, trailIndex) => (
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
                background: simulatedPeer.color,
              }}
            />
          </div>
        ))}

        {allPresenceMarkers.map((peer, index) => (
          <div
            key={`${peer.name}-${index}`}
            className="pointer-events-none absolute z-20"
            style={{ left: peer.cursor.x + 12, top: peer.cursor.y + 12 }}
          >
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0A0B0D]/90 px-2 py-1 text-[10px] font-medium text-white shadow-lg">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: peer.color }} />
              {peer.name}
              {peer.isTyping ? ' · typing' : ` · ${peer.lastAction}`}
            </div>
            <div
              className="mt-1 h-4 w-4 rounded-full border-2 border-white shadow-md"
              style={{ background: peer.color }}
            />
          </div>
        ))}

        {boardNodes.map((node) => {
          const pos = positions[node.id] ?? { x: node.x, y: node.y };

          return (
            <div
              key={node.id}
              onMouseDown={(event) => handleMouseDown(event, node.id)}
              className={`absolute w-72 rounded-xl border cursor-move shadow-2xl select-none ${
                node.role === 'user' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-[#121417] border-gray-700 text-gray-300'
              }`}
              style={{ left: pos.x, top: pos.y }}
            >
              <div className="flex items-center justify-between gap-2 border-b border-black/20 px-4 py-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-white/80">{node.title}</span>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: node.color }} />
              </div>
              <div className="px-4 py-3">
                <div className="mb-2 text-[10px] uppercase tracking-wide text-white/70">{node.authorName}</div>
                <p className="text-sm whitespace-pre-line wrap-break-word">{node.text}</p>
              </div>
            </div>
          );
        })}

        {isLoading && !showPIIAlert && (
          <div className="absolute bottom-24 right-10 bg-[#121417] border border-gray-700 p-3 rounded-lg max-w-md shadow-md z-10">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-30">
        <form onSubmit={onSubmit} className="flex items-center bg-[#121417] border border-gray-700 rounded-xl p-2 shadow-2xl backdrop-blur">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="💬 Type to add a node to the canvas..."
            className="flex-1 bg-transparent text-sm px-2 outline-none text-white placeholder-gray-500"
          />
          <button type="button" className="text-gray-400 hover:text-white px-2"><Paperclip size={18} /></button>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg ml-2"><Send size={18} /></button>
        </form>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeView, setActiveView] = useState('chat');

  return (
    <RoomProvider id="companyos-main-room" initialPresence={{ name: 'You', color: '#60a5fa', isTyping: false }}>
      <div className="flex h-screen bg-[#0A0B0D] text-white font-sans">
        <WorkspaceSidebar activeView={activeView} setActiveView={setActiveView} />

        <div className="flex-1">
          {activeView === 'chat' ? <CanvasChatComponent /> : <SEODashboard />}
        </div>
      </div>
    </RoomProvider>
  );
}