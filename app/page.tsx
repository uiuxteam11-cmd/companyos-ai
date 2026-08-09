'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Send, ShieldCheck, Paperclip, ChevronDown, Globe, Search, CheckCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { RoomProvider, useOthers, useSelf } from '../liveblocks.config';

type SEOResults = {
  brandScore: number;
  competitorScore: number;
  isBrandMentioned: boolean;
  isCompetitorMentioned: boolean;
  aiResponse: string;
};

// --- Multiplayer Avatar Component ---
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
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-[#0A0B0D] ${isYou ? 'bg-blue-600' : 'bg-emerald-600'}`}
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

// --- AI-SEO Dashboard Component ---
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
          <h2 className="text-2xl font-bold flex items-center gap-2"><Globe size={24} className="text-blue-500" /> Brand Intelligence</h2>
          <p className="text-gray-500 text-sm mt-1">See how AI models perceive your brand vs competitors.</p>
        </div>

        <form onSubmit={runScan} className="bg-[#121417] border border-gray-800 p-6 rounded-xl flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-400 uppercase block mb-1">Your Brand</label>
            <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full bg-[#0A0B0D] border border-gray-700 rounded-lg p-2 text-sm outline-none focus:border-blue-500" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-400 uppercase block mb-1">Competitor</label>
            <input type="text" value={competitor} onChange={(e) => setCompetitor(e.target.value)} className="w-full bg-[#0A0B0D] border border-gray-700 rounded-lg p-2 text-sm outline-none focus:border-blue-500" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-400 uppercase block mb-1">Industry</label>
            <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full bg-[#0A0B0D] border border-gray-700 rounded-lg p-2 text-sm outline-none focus:border-blue-500" />
          </div>
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 h-9.5">
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
          <div className="space-y-6 animate-fade-in">
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

// --- Chat Component ---
function ChatComponent() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });
  const [input, setInput] = useState('');
  const [showPIIAlert, setShowPIIAlert] = useState(false);
  const isLoading = status === 'streaming' || status === 'submitted';

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const panRegex = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/;
    if (!input.trim()) {
      return;
    }

    if (panRegex.test(input)) {
      setShowPIIAlert(true);
      setTimeout(() => setShowPIIAlert(false), 4000);
    }

    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-[#0A0B0D] z-10">
        <h2 className="font-semibold text-lg">💬 Q3 Marketing Strategy</h2>
        <div className="flex items-center gap-4">
          <Avatars />
          <div className="hidden md:flex items-center gap-2 bg-green-900/30 border border-green-700 px-3 py-1.5 rounded-full text-green-400 text-xs font-medium animate-pulse">
            <ShieldCheck size={14} /> Trust Shield
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-lg">Start a secure conversation.</p>
            <p className="text-sm mt-2">Try typing: <i>&ldquo;Email Rahul, PAN: ABCDE1234F&rdquo;</i></p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id ?? index} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-lg max-w-md shadow-md ${isUser ? 'bg-blue-600 text-white' : 'bg-[#1C1E24] border border-gray-700 text-gray-300'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-white">{isUser ? '👤 Aarav' : '🤖 AI Assistant'}</span>
                </div>
                {msg.parts.map((part, partIndex) => {
                  if (part.type !== 'text') {
                    return null;
                  }
                  return (
                    <p key={`${msg.id ?? index}-part-${partIndex}`} className="text-sm whitespace-pre-line">
                      {part.text}
                    </p>
                  );
                })}
              </div>
            </div>
          );
        })}

        {showPIIAlert && (
          <div className="flex justify-center">
            <div className="bg-yellow-900/20 border border-yellow-700/50 p-3 rounded-lg text-center text-yellow-400 shadow-md text-sm animate-pulse">
              🛡️ System: PAN/PII Detected. Masked before sending to Google Gemini.
            </div>
          </div>
        )}

        {isLoading && !showPIIAlert && (
          <div className="flex gap-3 justify-start">
            <div className="bg-[#1C1E24] border border-gray-700 p-3 rounded-lg max-w-md shadow-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-800 bg-[#121417]">
        <form onSubmit={onSubmit} className="flex items-center bg-[#1C1E24] border border-gray-700 rounded-xl p-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="💬 Type your secure message here..." className="flex-1 bg-transparent text-sm px-2 outline-none text-white placeholder-gray-500" />
          <button type="button" className="text-gray-400 hover:text-white px-2"><Paperclip size={18} /></button>
          <button type="button" className="text-gray-400 hover:text-white px-2 flex items-center gap-1 text-sm">Assign to Agent <ChevronDown size={14} /></button>
          <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white p-2 rounded-lg ml-2"><Send size={18} /></button>
        </form>
        <div className="flex justify-between items-center mt-2 px-2">
          <div className="flex items-center gap-2 text-green-500 text-xs font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span> Green Shield: Data is Secured
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Default Export with Sidebar Toggle ---
export default function Home() {
  const [activeView, setActiveView] = useState('chat');

  return (
    <RoomProvider id="companyos-main-room" initialPresence={{}}>
      <div className="flex h-screen bg-[#0A0B0D] text-white font-sans">
        <div className="hidden w-64 bg-[#121417] border-r border-gray-800 flex-col p-4 md:flex">
          <h1 className="text-xl font-bold mb-6 flex items-center gap-2">🌐 <span>CompanyOS</span></h1>

          <div className="mb-6">
            <h2 className="text-xs text-gray-500 uppercase mb-2">💬 Chats</h2>
            <ul className="space-y-2 text-sm">
              <li onClick={() => setActiveView('chat')} className={`p-2 rounded-md cursor-pointer ${activeView === 'chat' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>⬡ Q3 Strategy</li>
              <li className="p-2 rounded-md hover:bg-gray-800 cursor-pointer">⬡ Acme Proposal</li>
              <li className="p-2 rounded-md hover:bg-gray-800 cursor-pointer text-gray-500">+ New Chat</li>
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

          <div className="mt-auto">
            <h2 className="text-xs text-gray-500 uppercase mb-2">⚙️ Tools</h2>
            <ul className="space-y-2 text-sm">
              <li onClick={() => setActiveView('seo')} className={`p-2 rounded-md cursor-pointer ${activeView === 'seo' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>📈 AI-SEO Monitor</li>
            </ul>
          </div>
        </div>

        <div className="flex-1">
          {activeView === 'chat' ? <ChatComponent /> : <SEODashboard />}
        </div>
      </div>
    </RoomProvider>
  );
}