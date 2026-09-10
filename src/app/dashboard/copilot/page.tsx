'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Lightbulb, BarChart3, Radio, RefreshCw, Compass, Key, Settings, Check, X, ExternalLink, Cpu } from 'lucide-react';
import { processQuery } from '@/modules/copilot/engine';
import { CopilotMessage } from '@/types';
import api from '@/lib/api';

const suggestedQueries = [
  'What is the route between Dibrugarh and Anini?',
  'Where are the moving freight trucks right now?',
  'What is the route from Guwahati to Silchar?',
  'How can I reach Tawang from Guwahati?',
  'What are the risks between Dibrugarh and Anini?',
  'Which route is better from Imphal to Kohima?',
  'How accessible is Aizawl?',
  'What logistics hubs are near Guwahati?',
];

const mobileQuickPrompts = [
  '🗺️ Route: Dibrugarh → Anini',
  '🚚 Live Moving Trucks',
  '⚠️ Active Landslide Alerts',
  '🗺️ Route: Guwahati → Tawang',
  '🏔️ Meghalaya Logistics',
  '📊 Worst Accessibility',
];

export default function CopilotPage() {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      role: 'assistant',
      content: `Welcome to the **NER Logistics AI Copilot** 🧠\n\nI am your **real-time intelligent assistant** for freight, supply chain, and risk intelligence across India's 8 North Eastern States.\n\nI provide **grounded, multi-criteria route optimization**, **live GPS truck telemetry**, and analytical data across all 8 states.\n\nAsk me any route or logistics question in natural language (e.g. *"What is the route between Dibrugarh and Anini?"*), or tap one of the suggested queries below!`,
      timestamp: new Date().toISOString(),
      recommendations: [
        'Try asking: "What is the route between Dibrugarh and Anini?"',
        'Try asking: "Where are the moving freight trucks right now?"',
        'Try asking: "What is the safest route from Guwahati to Silchar?"',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [activeApiKey, setActiveApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Load persisted API key from localStorage if available
    try {
      const saved = localStorage.getItem('ner_gemini_api_key');
      if (saved) {
        setActiveApiKey(saved);
        setTempApiKey(saved);
      }
    } catch {
      // localStorage may not be available in private mode
    }
  }, []);

  const handleSaveKey = () => {
    const trimmed = tempApiKey.trim();
    setActiveApiKey(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem('ner_gemini_api_key', trimmed);
      } else {
        localStorage.removeItem('ner_gemini_api_key');
      }
    } catch {}
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setShowKeyModal(false);
    }, 1200);
  };

  const handleClearKey = () => {
    setActiveApiKey('');
    setTempApiKey('');
    try {
      localStorage.removeItem('ner_gemini_api_key');
    } catch {}
  };

  const handleSend = async (query?: string) => {
    const q = query || input.trim();
    if (!q || isProcessing) return;

    const userMessage: CopilotMessage = {
      role: 'user',
      content: q,
      timestamp: new Date().toISOString(),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsProcessing(true);

    // Extract recent conversation history (last 6 messages before current) for context preservation
    // Exclude the current user message since it's sent separately as 'query'
    const conversationHistory = messages.slice(-6).map(m => ({
      role: m.role,
      content: m.content,
    }));

    let response: CopilotMessage;
    try {
      // Connect to Serverless Route / FastAPI backend with live telemetry and optional custom API key
      response = await api.askCopilot(q, activeApiKey || undefined, conversationHistory);
    } catch (err) {
      console.warn('Backend copilot query failed, using rich local engine fallback:', err);
      // Fallback to local real-time engine
      response = processQuery(q);
    }

    setMessages(prev => [...prev, response]);
    setIsProcessing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-4 animate-fade-in min-h-[calc(100dvh-130px)] flex flex-col pb-6">
      {/* Header with Real-Time Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
            <Bot className="w-6 h-6 text-accent-400" />
            NER AI Copilot
          </h1>
          <p className="text-xs sm:text-sm text-surface-400 mt-0.5">
            Real-time conversational logistics & corridor operations assistant
          </p>
        </div>

        {/* Right Header Controls: AI Engine Indicator & Key Config Button */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Engine Status Indicator */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-semibold tracking-wide ${
            activeApiKey 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
              : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${activeApiKey ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
            <span>{activeApiKey ? 'Gemini 2.0 Flash (Live AI)' : 'NER Grounded Engine (Active)'}</span>
          </div>

          {/* AI Settings / Key Button */}
          <button
            onClick={() => {
              setTempApiKey(activeApiKey);
              setShowKeyModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-800 hover:bg-surface-700 border border-surface-700 text-[11px] text-surface-200 hover:text-white transition shadow-sm"
            title="Configure Google Gemini API Key"
          >
            <Key className="w-3.5 h-3.5 text-accent-400" />
            <span>{activeApiKey ? 'AI Key Configured' : 'Configure Gemini Key'}</span>
            <Settings className="w-3 h-3 text-surface-400 ml-0.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-4 min-h-0">
        {/* Chat Area */}
        <div className="xl:col-span-3 glass-card flex flex-col overflow-hidden min-h-[480px] sm:min-h-[540px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`chat-message ${msg.role} max-w-[90%] sm:max-w-[80%]`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-accent-400" />
                      <span className="text-[10px] font-semibold text-accent-400 uppercase tracking-wider">
                        Real-Time Logistics Intelligence
                      </span>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
                    {msg.content.split('\n').map((line, li) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={li} className="font-bold text-white my-1 text-sm">{line.replace(/\*\*/g, '')}</p>;
                      }
                      if (line.startsWith('• ') || line.startsWith('- ')) {
                        return <p key={li} className="ml-2 text-surface-300 my-0.5">{line}</p>;
                      }
                      if (line.includes('**')) {
                        const parts = line.split(/(\*\*[^*]+\*\*)/g);
                        return (
                          <p key={li} className="text-surface-300 my-0.5">
                            {parts.map((part, pi) =>
                              part.startsWith('**') && part.endsWith('**')
                                ? <strong key={pi} className="text-white font-semibold">{part.replace(/\*\*/g, '')}</strong>
                                : <span key={pi}>{part}</span>
                            )}
                          </p>
                        );
                      }
                      return <p key={li} className={`${line ? 'text-surface-300' : 'h-1.5'}`}>{line}</p>;
                    })}
                  </div>

                  {/* Metrics Badges */}
                  {msg.metrics && msg.metrics.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-primary-500/10">
                      <div className="flex items-center gap-1.5 mb-2">
                        <BarChart3 className="w-3 h-3 text-primary-400" />
                        <span className="text-[10px] font-semibold text-primary-400 uppercase tracking-wider">
                          Key Operational Metrics
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.metrics.map((m, mi) => (
                          <div key={mi} className="px-2.5 py-1 rounded-lg bg-surface-900/60 border border-primary-500/15 flex items-center gap-1">
                            <span className="text-[10px] text-surface-400">{m.label}:</span>
                            <span className="text-xs font-semibold text-white">{m.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-primary-500/10">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Lightbulb className="w-3 h-3 text-amber-400" />
                        <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                          Strategic Recommendations
                        </span>
                      </div>
                      <div className="space-y-1">
                        {msg.recommendations.map((rec, ri) => (
                          <p key={ri} className="text-[11px] text-surface-300">• {rec}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="chat-message assistant flex items-center gap-2 py-3 px-4">
                  <div className="w-3 h-3 rounded-full bg-accent-400 animate-ping" />
                  <span className="text-xs text-surface-300">
                    Querying live telemetry & analytical database...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Mobile Prompts Carousel */}
          <div className="px-3 pt-2 pb-1 border-t border-surface-800/80 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
            {mobileQuickPrompts.map((prompt, pi) => (
              <button
                key={pi}
                onClick={() => handleSend(prompt.replace(/^[^\w\s]+\s*/, ''))}
                disabled={isProcessing}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-surface-800 hover:bg-surface-700 text-[11px] text-surface-300 hover:text-white border border-surface-700/60 transition disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 sm:p-4 border-t border-primary-500/10 bg-surface-900/40">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask any question: moving trucks, live alerts, routes, districts, commodities..."
                className="input-field flex-1 text-xs sm:text-sm"
                disabled={isProcessing}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isProcessing}
                className="btn-primary px-4 disabled:opacity-50 flex items-center justify-center"
                aria-label="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Suggested Queries Sidebar (Visible on large screens, scrollable) */}
        <div className="space-y-3">
          <div className="glass-card p-4 rounded-xl border border-surface-800">
            <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              Real-Time Query Templates
            </h3>
            <div className="space-y-1.5">
              {suggestedQueries.map((query, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(query)}
                  disabled={isProcessing}
                  className="w-full text-left p-2 rounded-lg bg-surface-900/40 hover:bg-surface-900/80 text-xs text-surface-300 hover:text-white border border-surface-800 transition disabled:opacity-50 leading-snug"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-surface-800 hidden sm:block">
            <h3 className="text-xs font-semibold text-accent-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Real-Time Intelligence
            </h3>
            <p className="text-[11px] text-surface-400 leading-relaxed">
              Unlike static chatbots, this Copilot is connected directly to the platform&apos;s live database: active GPS convoy pings, real-time hazard notifications, road friction ratings, and spatial routing algorithms.
            </p>
          </div>
        </div>
      </div>

      {/* AI Key Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-lg w-full p-5 sm:p-6 rounded-2xl border border-primary-500/20 shadow-2xl relative">
            <button
              onClick={() => setShowKeyModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">AI Engine & Model Configuration</h3>
                <p className="text-xs text-surface-400">Power the NER Copilot with Google Gemini Generative AI</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-surface-300 mb-5">
              <p className="leading-relaxed">
                Connect your <strong>Google Gemini API Key</strong> to unlock live generative multimodal intelligence across all 8 North Eastern states, high-altitude passes, and real-time fleet operations.
              </p>

              <div className="p-3 rounded-xl bg-surface-900/60 border border-surface-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Don&apos;t have a key?</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-400 hover:text-accent-300 inline-flex items-center gap-1 font-medium"
                  >
                    Get Free Gemini Key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-surface-400">
                  Google Gemini provides a generous free tier for developers. Your key is stored securely in your browser session.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-surface-300 uppercase tracking-wider mb-1.5">
                  Google Gemini API Key (Optional)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={tempApiKey}
                    onChange={e => setTempApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="input-field w-full text-xs font-mono pr-8"
                  />
                  {tempApiKey && (
                    <button
                      type="button"
                      onClick={() => setTempApiKey('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white"
                      aria-label="Clear input"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {activeApiKey && (
                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                  <Check className="w-3.5 h-3.5" />
                  <span>Gemini API Key active for this session</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-surface-800">
              {activeApiKey ? (
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition"
                >
                  Remove Key
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-surface-300 hover:bg-surface-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveKey}
                  className="btn-primary px-4 py-1.5 text-xs flex items-center gap-1.5"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save & Activate</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
