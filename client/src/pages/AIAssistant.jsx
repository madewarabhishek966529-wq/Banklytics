import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle, ShieldCheck, Cpu, RefreshCw } from 'lucide-react';
import { analyticsService } from '../services/analyticsService.js';

const QUICK_QUESTIONS = [
  'How much did I actually spend on food and dining?',
  'Where can I potentially save money this month?',
  'Which merchants receive the most money from me?',
  'Are there any unusual or duplicate transactions?',
  'What is my overall financial health score and savings rate?',
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am **Banklytics AI**, your personal financial intelligence analyst. I have analyzed your uploaded statements. Ask me anything about your real spending, merchants, potential savings, or anomalies.",
      source: 'LOCAL_FINANCIAL_AI',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        const data = await analyticsService.getAIStatus();
        setAiStatus(data.status);
      } catch (err) {
        setAiStatus({ isAvailable: false, activeModel: 'Heuristic Financial Analyst Engine' });
      }
    }
    checkStatus();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const q = textToSend || input;
    if (!q || !q.trim() || loading) return;

    const userMsg = {
      id: String(Date.now()),
      sender: 'user',
      text: q.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await analyticsService.chatWithAI(q.trim());
      const botMsg = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: data.reply || 'Analysis completed.',
        source: data.source,
        model: data.model,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: 'Sorry, I encountered an issue analyzing your transactions. Please ensure at least one statement is uploaded.',
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      {/* Top AI Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">AI Financial Analyst</h1>
            <p className="text-xs text-slate-500">
              Offline Local Intelligence • Strict Zero API Key Policy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs self-start sm:self-auto">
          {aiStatus?.isAvailable ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Ollama Online ({aiStatus.activeModel || 'llama3.2:3b'})</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-medium" title="To use Ollama LLM, run: ollama run llama3.2:3b">
              <Cpu className="w-3.5 h-3.5 text-amber-600" />
              <span>Local Deterministic Analyst Engine</span>
            </span>
          )}
        </div>
      </div>

      {/* Chat Thread */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-5 overflow-y-auto space-y-4 shadow-xs">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div key={m.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-brand-600 text-white rounded-tr-none'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none space-y-2'
                }`}
              >
                <div className="whitespace-pre-line font-normal">{m.text}</div>

                {!isUser && m.source && (
                  <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Calculated deterministically from your imported statements ({m.model || 'Local Model'})</span>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 items-center text-slate-500 text-xs py-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] font-medium ml-1 text-slate-600">Analyzing statement data...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        {QUICK_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-brand-500 hover:bg-brand-50 text-slate-700 text-xs font-medium transition shadow-2xs"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your spending, merchants, savings, or anomalies..."
          className="flex-1 px-3 py-2 text-xs rounded-lg border-none focus:outline-none focus:ring-0 text-slate-800"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
}
