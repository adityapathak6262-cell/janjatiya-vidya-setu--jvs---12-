import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User as UserIcon, 
  Sparkles, 
  HelpCircle, 
  Minimize2, 
  Maximize2,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { api, User } from '../api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatbotWidgetProps {
  currentUser?: User | null;
  onOpenSchemeWizard?: (schemeCode: string) => void;
  externalIsOpen?: boolean;
  onToggleExternal?: (open: boolean) => void;
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  currentUser,
  onOpenSchemeWizard,
  externalIsOpen,
  onToggleExternal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [unreadBadge, setUnreadBadge] = useState(false);

  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setIsOpen(externalIsOpen);
    }
  }, [externalIsOpen]);

  const handleSetOpen = (open: boolean) => {
    setIsOpen(open);
    if (onToggleExternal) onToggleExternal(open);
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `🙏 **Namaste! Main hoon Setu Mitra (सेतु मित्र)** — Janjatiya Vidya Setu (JVS) ka Official AI Intelligence Assistant.

Main is website ke **sabhi features, administrative modules aur scholarship guidelines** me aapki madad kar sakta hoon:

🔹 **Administrators & Evaluators ke liye:**
- **Version Governance:** Policy lifecycle (Draft -> Approved -> Published) aur rollback kaise kaam karta hai
- **Scheme Execution Engine:** 2 schemes (NFST vs NOS) ka live auto-flagging aur auto-clear demo
- **Visual Rules Builder:** No-code sliders se income limits, marks cutoffs aur quotas configure karna
- **PRAMAAN Engine & SHA-256 Audit Trail:** Dual-path verification aur cryptographic ledger

🔹 **Students & Scholars ke liye:**
- **NFST, NOS & Top Class:** Eligibility, ₹37k-42k stipend, aur foreign rules
- **Application & Continuity:** Multi-year renewal, bonafide upload, aur 3W deficiency solve karna

Niche diye gaye prompt par click karein ya website ke kisi bhi section ke bare me poochhein!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadBadge(false);
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    { label: '🌐 PRAMAAN Global Bridge', text: 'PRAMAAN Global Bridge (NOS 360) me 11-page MoTA circular ke kon kon se rules solve hote hain?' },
    { label: '⚙️ Version Governance kya hai?', text: 'Admin portal me Version Governance section kya karta hai aur iska kya fayda hai?' },
    { label: '⚡ Scheme Execution Engine', text: 'Scheme Execution Engine me 2 schemes ka live verification demo kaise kaam karta hai?' },
    { label: '🎛️ Visual Rules Builder', text: 'Visual Rules Builder me schemes ke rules bina coding ke kaise configure hote hain?' },
    { label: '🔍 PRAMAAN Verification', text: 'PRAMAAN Dual-Path Verification Engine me Path A aur Path B kya check karte hain?' },
    { label: '🎓 NFST Fellowship & Stipend', text: 'NFST (National Fellowship for ST) ki eligibility aur stipend kitna milta hai?' },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const chatHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.sendChatMessage(chatHistory, {
        userName: currentUser?.name,
        userRole: currentUser?.role,
        institution: currentUser?.institution,
        state: currentUser?.state
      });

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (!isOpen) {
        setUnreadBadge(true);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Maaf kijiye, abhi server se connect karne me dikkat aa rahi hai. Kripya thodi der baad punah prayas karein.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `Conversation reset ho gaya hai. Aap mujhse MoTA ke NFST, NOS ya Top Class scholarships ke bare me naye sire se pooch sakte hain!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <aside aria-label="Setu Mitra AI Assistant" className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => {
            handleSetOpen(true);
            setUnreadBadge(false);
          }}
          className="group flex items-center gap-2.5 px-4 py-3 bg-linear-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-full shadow-2xl hover:shadow-amber-500/30 transition-all duration-200 transform hover:scale-105 border border-amber-400/40 cursor-pointer"
          title="Open Setu Mitra AI Scholarship Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white animate-pulse" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold leading-tight flex items-center gap-1">
              <span>Setu Mitra AI</span>
              <Sparkles className="w-3 h-3 text-amber-200" />
            </div>
            <div className="text-[10px] text-amber-100 font-medium">
              MoTA Scholarship Guide
            </div>
          </div>
          {unreadBadge && (
            <span className="w-3 h-3 rounded-full bg-rose-500 border border-white ml-1 animate-ping" />
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 ${
            isExpanded
              ? 'w-[94vw] sm:w-[580px] h-[82vh] max-h-[720px]'
              : 'w-[92vw] sm:w-[420px] h-[560px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 p-3.5 text-white flex items-center justify-between border-b border-slate-700 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-900 flex items-center justify-center font-bold shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold tracking-tight">Setu Mitra (सेतु मित्र)</h3>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono">
                    Gemini AI Active
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Ministry of Tribal Affairs · AI Application Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-300">
              <button
                onClick={handleReset}
                title="Restart Chat"
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-md transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Shrink Window' : 'Expand Window'}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-md transition hidden sm:block cursor-pointer"
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => handleSetOpen(false)}
                title="Close Chat"
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-md transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Carousel */}
          <div className="p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto flex gap-1.5 no-scrollbar">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(qp.text)}
                disabled={loading}
                className="shrink-0 text-[11px] px-2.5 py-1 bg-white hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 text-slate-700 border border-slate-200 rounded-full font-medium transition cursor-pointer shadow-2xs"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {messages.map((m) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isAssistant ? 'items-start' : 'items-end justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-6 h-6 rounded-md bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
                      isAssistant
                        ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                        : 'bg-slate-900 text-white rounded-tr-xs'
                    }`}
                  >
                    {/* Render basic markdown formatting simply */}
                    <div className="space-y-1.5 whitespace-pre-wrap font-normal">
                      {m.content.split('\n\n').map((paragraph, pIdx) => {
                        // Check if it is a heading
                        if (paragraph.startsWith('### ')) {
                          return (
                            <h4 key={pIdx} className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-1 mt-1">
                              {paragraph.replace('### ', '')}
                            </h4>
                          );
                        }
                        // Render line with bold replacements
                        return (
                          <p key={pIdx} className="text-xs">
                            {paragraph.split('**').map((chunk, cIdx) =>
                              cIdx % 2 === 1 ? (
                                <strong key={cIdx} className="font-bold text-slate-900">
                                  {chunk}
                                </strong>
                              ) : (
                                chunk
                              )
                            )}
                          </p>
                        );
                      })}
                    </div>

                    <div
                      className={`text-[9px] mt-1.5 flex justify-end font-mono ${
                        isAssistant ? 'text-slate-400' : 'text-slate-300'
                      }`}
                    >
                      {m.timestamp}
                    </div>
                  </div>

                  {!isAssistant && (
                    <div className="w-6 h-6 rounded-md bg-slate-800 text-amber-400 flex items-center justify-center shrink-0 mb-0.5 shadow-2xs">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 items-start">
                <div className="w-6 h-6 rounded-md bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3 text-xs text-slate-600 shadow-2xs flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Setu Mitra is verifying MoTA policy rules...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box Footer */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Poochhein: NFST eligibility, documents list, etc..."
                disabled={loading}
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50 focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="p-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition cursor-pointer shrink-0"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-1.5 text-center text-[10px] text-slate-400">
              Grounded in MoTA 2026-27 Guidelines · Powered by Gemini
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
