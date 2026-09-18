import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
  Sparkles,
  Send,
  Building2,
  Bot,
  User,
  ExternalLink,
  PhoneCall,
  FileText,
  HelpCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'How do I pay Property Tax online in Chennai / Coimbatore?',
  'Eppadi new water and sewerage connection vaanguradhu?',
  'Birth certificate download panradhu eppadi?',
  'What are the required documents for Trade License renewal?',
  'Street light flickering complaint helpline number?',
];

export default function AIChatbotView() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `வணக்கம்! Hello! I am **Civic Sahayak** (சிவக சகாயக்) — your AI Government Service Guidance Assistant.\n\nI can provide step-by-step guidance, required documents, official online portals, and helpline numbers for municipal services across Tamil Nadu (Chennai & Coimbatore):\n\n• **Property Tax**: Online calculation, incentive rebate & payment receipts\n• **New Water & Drainage Connection**: CMWSSB / TWAD application procedure\n• **Birth & Death Certificates**: Civil registration & free digital PDF download\n• **Trade Licenses**: D&O license application & annual renewal\n• **Building Plan Approvals & Helplines**\n\nAsk me anything in English, Tamil (தமிழ்), or Tanglish!`,
      timestamp: new Date(),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const queryText = (textToSend || inputQuery).trim();
    if (!queryText || loading) return;

    // Add user message
    const userMsg = {
      role: 'user',
      content: queryText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await api.askChatbot(queryText);
      const assistantMsg = {
        role: 'assistant',
        content: res.response || 'I could not process that request. Please try asking about Property Tax, Water Connection, or Birth Certificates.',
        source: res.source,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error connecting to the municipal knowledge service. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 h-[calc(100vh-5rem)] flex flex-col">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-cyan-900 rounded-2xl p-4 sm:p-5 text-white shadow-md flex items-center justify-between shrink-0 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">Civic Sahayak AI</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                Tamil & English
              </span>
            </div>
            <p className="text-xs text-emerald-100/80">
              Instant conversational guidance for citizen welfare schemes and municipal services
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                role: 'assistant',
                content: 'Chat reset. How may I assist you with municipal government services today?',
                timestamp: new Date(),
              },
            ])
          }
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors text-xs font-semibold flex items-center gap-1.5"
          title="Clear chat history"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  isUser
                    ? 'bg-slate-800 text-white'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-emerald-600 text-white font-medium rounded-tr-none'
                    : 'bg-slate-50 border border-slate-200/90 text-slate-800 rounded-tl-none space-y-2'
                }`}
              >
                {/* Render markdown / formatted text */}
                <div className="whitespace-pre-line">{msg.content}</div>

                <div
                  className={`text-[10px] mt-1.5 flex items-center gap-2 ${
                    isUser ? 'text-emerald-100 justify-end' : 'text-slate-400'
                  }`}
                >
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {!isUser && msg.source && (
                    <span className="font-semibold text-emerald-700">
                      • {msg.source === 'gemini-ai' ? 'Gemini 1.5 NLU' : 'Municipal Knowledge Base'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-600 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Civic Sahayak is consulting municipal regulations...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Question Chips */}
      <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <HelpCircle className="w-3 h-3" /> Quick queries:
        </span>
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q)}
            className="px-3 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 text-xs font-semibold text-slate-700 whitespace-nowrap transition-all"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="shrink-0 flex items-center gap-2 pt-1"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask anything about municipal services (e.g. 'eppadi property tax pay pandradhu')..."
            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-sm font-medium text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 pr-12"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className="w-12 h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white flex items-center justify-center shadow-md shadow-emerald-600/25 transition-all shrink-0 active:scale-95"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
