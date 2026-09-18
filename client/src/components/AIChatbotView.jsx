import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
  Sparkles,
  Send,
  Bot,
  User,
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
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 h-[calc(100vh-5.5rem)] flex flex-col">
      {/* Neumorphic Banner */}
      <div className="neu-card rounded-3xl p-5 mb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#ebf0f7] shadow-[4px_4px_10px_#cad4e3,-4px_-4px_10px_#ffffff] flex items-center justify-center text-amber-500 border border-white/60">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-800">Civic Sahayak AI</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ebf0f7] shadow-[inset_2px_2px_4px_#cbd6e4,inset_-2px_-2px_4px_#ffffff] text-amber-700 uppercase tracking-wider">
                Tamil & English
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Step-by-step guidance on government schemes, portals & municipal helplines
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
          className="p-2.5 rounded-2xl neu-btn text-slate-600 hover:text-slate-900"
          title="Reset chat"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 neu-flat rounded-3xl p-5 overflow-y-auto space-y-4">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'neu-btn-primary'
                    : 'bg-[#ebf0f7] shadow-[3px_3px_8px_#cbd6e4,-3px_-3px_8px_#ffffff] text-emerald-700'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'neu-btn-primary rounded-tr-none font-medium text-white'
                    : 'neu-card rounded-tl-none text-slate-800 space-y-2 font-medium'
                }`}
              >
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
                    <span className="font-bold text-emerald-700">
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
            <div className="w-9 h-9 rounded-2xl bg-[#ebf0f7] shadow-[3px_3px_8px_#cbd6e4,-3px_-3px_8px_#ffffff] text-emerald-700 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="neu-card rounded-2xl rounded-tl-none p-4 text-xs text-slate-600 flex items-center gap-2 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Civic Sahayak is reviewing municipal service regulations...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      <div className="py-2.5 flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <HelpCircle className="w-3 h-3" /> Quick:
        </span>
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q)}
            className="px-3.5 py-1.5 rounded-full neu-btn text-xs font-semibold text-slate-700 whitespace-nowrap hover:text-emerald-700"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
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
            className="w-full px-5 py-3.5 rounded-2xl neu-input text-xs sm:text-sm font-medium text-slate-800 pr-12"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className="w-12 h-12 rounded-2xl neu-btn-primary text-white flex items-center justify-center shrink-0 active:scale-95 disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
