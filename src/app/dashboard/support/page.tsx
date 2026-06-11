"use client";

import { useEffect, useRef, useState } from "react";
import {
  Send, Loader2, MessageCircle, ShieldCheck,
  CreditCard, KeyRound, HelpCircle, RefreshCw,
  ArrowDownToLine, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SupportMessage = {
  id: string;
  sender: "USER" | "ADMIN";
  body: string;
  createdAt: string;
};

type TicketStatus = "OPEN" | "CLOSED" | null;

const FAQ_SHORTCUTS = [
  { icon: CreditCard,      label: "Card issues",       text: "I'm having an issue with my card." },
  { icon: ArrowDownToLine, label: "Transfer failed",   text: "My transfer failed. Can you help?" },
  { icon: KeyRound,        label: "Account access",    text: "I can't access my account." },
  { icon: ShieldCheck,     label: "KYC verification",  text: "I need help with KYC verification." },
  { icon: RefreshCw,       label: "Wrong transaction", text: "A transaction on my account looks incorrect." },
  { icon: HelpCircle,      label: "Something else",    text: "I have a question that isn't listed here." },
];

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateDivider(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function groupByDate(messages: SupportMessage[]) {
  const groups: { date: string; messages: SupportMessage[] }[] = [];
  messages.forEach((msg) => {
    const date = new Date(msg.createdAt).toDateString();
    const last = groups[groups.length - 1];
    if (last && last.date === date) {
      last.messages.push(msg);
    } else {
      groups.push({ date, messages: [msg] });
    }
  });
  return groups;
}

export default function SupportPage() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [status, setStatus]     = useState<TicketStatus>(null);
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [input, setInput]       = useState("");
  const [error, setError]       = useState("");
  const bottomRef               = useRef<HTMLDivElement>(null);
  const textareaRef             = useRef<HTMLTextAreaElement>(null);

  const fetchThread = async (silent = false) => {
    try {
      const res  = await fetch("/api/support/thread", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { if (!silent) setError(data.error || "Failed to load support thread."); return; }
      setTicketId(data.ticketId ?? null);
      setStatus(data.status ?? null);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch {
      if (!silent) setError("Network error. Please try again.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchThread().then(() => setLoading(false));
  }, []);

  // Poll every 10s; restart interval if ticketId changes
  useEffect(() => {
    const interval = setInterval(() => fetchThread(true), 10_000);
    return () => clearInterval(interval);
  }, [ticketId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 120)}px`; }
  };

  const handleSend = async (overrideText?: string) => {
    const body = (overrideText ?? input).trim();
    if (!body || sending) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setSending(true);
    setError("");
    try {
      const res  = await fetch("/api/support/thread/messages", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ body, ticketId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Failed to send message."); return; }
      if (data.ticketId) setTicketId(data.ticketId);
      if (data.status)   setStatus(data.status);
      await fetchThread();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const grouped  = groupByDate(messages);
  const isClosed = status === "CLOSED";

  return (
    <div className="min-h-screen bg-[#f0f7f4] p-5 sm:p-8 flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#0f2419]"
              style={{ fontFamily: "'Playfair Display', serif" }}>
            Support
          </h1>
          <p className="text-[13px] text-[#6a8c7a] mt-0.5">We usually reply within a few hours.</p>
        </div>
        {status && (
          <span className={cn(
            "text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border",
            status === "OPEN"
              ? "bg-[#edf7f5] text-[#0f7a6e] border-[#a8dbd4]"
              : "bg-[#e4f2ec] text-[#6a8c7a] border-[#c8dfd5]"
          )}>
            {status === "OPEN" ? "● Open" : "Closed"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1">

        {/* ── LEFT: FAQ shortcuts ── */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          <div className="bg-[#f2f9f6] rounded-2xl border border-[#c8dfd5] shadow-sm p-5">
            <p className="text-[13px] font-semibold text-[#0f2419] mb-1">Quick topics</p>
            <p className="text-[12px] text-[#6a8c7a] mb-4">Tap a topic to get started fast.</p>
            <div className="flex flex-col gap-2">
              {FAQ_SHORTCUTS.map(({ icon: Icon, label, text }) => (
                <button
                  key={label}
                  type="button"
                  disabled={isClosed}
                  onClick={() => handleSend(text)}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-[13px] border border-[#c8dfd5] bg-[#e4f2ec] hover:border-[#4daa80] hover:bg-[#d8ede6] text-left transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#f2f9f6] border border-[#c8dfd5] flex items-center justify-center flex-shrink-0 group-hover:border-[#4daa80] transition-colors">
                    <Icon className="w-3.5 h-3.5 text-[#1e7a52]" strokeWidth={2} />
                  </div>
                  <span className="text-[13px] font-medium text-[#2d5042]">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Status info */}
          <div className="bg-[#f2f9f6] rounded-2xl border border-[#c8dfd5] shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#1e7a52] animate-pulse" />
              <p className="text-[13px] font-semibold text-[#0f2419]">Support is online</p>
            </div>
            <p className="text-[12px] text-[#6a8c7a] leading-relaxed">
              Our team reviews all messages and typically responds within 2–4 hours during business hours.
            </p>
          </div>
        </div>

        {/* ── RIGHT: Chat thread ── */}
        <div className="lg:col-span-2 bg-[#f2f9f6] rounded-2xl border border-[#c8dfd5] shadow-sm flex flex-col overflow-hidden" style={{ minHeight: "560px" }}>

          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#d8ede6]">
            <div className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0"
                 style={{ background: "linear-gradient(135deg, #1a6648, #3daa7a)" }}>
              <MessageCircle className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#0f2419]">NexaBank Support</p>
              <p className="text-[11px] text-[#6a8c7a]">Replies go to this thread</p>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-[#a8c8b8]" />
              </div>
            )}

            {!loading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#e4f2ec] border border-[#c8dfd5] flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6 text-[#a8c8b8]" />
                </div>
                <p className="text-[14px] font-semibold text-[#6a8c7a]">No messages yet</p>
                <p className="text-[12px] text-[#a8c8b8] mt-1">Use a quick topic or type below to start.</p>
              </div>
            )}

            {grouped.map(({ date, messages: dayMsgs }) => (
              <div key={date}>
                {/* Date divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-[#d8ede6]" />
                  <span className="text-[11px] text-[#a8c8b8] font-medium">
                    {formatDateDivider(dayMsgs[0].createdAt)}
                  </span>
                  <div className="flex-1 h-px bg-[#d8ede6]" />
                </div>

                <div className="space-y-3">
                  {dayMsgs.map((msg) => {
                    const isUser = msg.sender === "USER";
                    return (
                      <div key={msg.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                        {!isUser && (
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mr-2 mt-0.5 self-end"
                               style={{ background: "linear-gradient(135deg, #1a6648, #3daa7a)" }}>
                            <MessageCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className={cn("max-w-[72%] flex flex-col", isUser ? "items-end" : "items-start")}>
                          <div className={cn(
                            "px-4 py-2.5 rounded-2xl text-[13.5px] leading-relaxed",
                            isUser
                              ? "text-white rounded-br-sm"
                              : "bg-[#e4f2ec] text-[#0f2419] border border-[#c8dfd5] rounded-bl-sm"
                          )}
                          style={isUser ? { background: "linear-gradient(135deg, #1a6648, #2a8a62)" } : {}}>
                            <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                          </div>
                          <span className="text-[10px] text-[#a8c8b8] mt-1 px-1">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Closed notice */}
            {isClosed && (
              <div className="flex items-center gap-2 justify-center py-3 px-4 bg-[#e4f2ec] border border-[#c8dfd5] rounded-xl text-[12px] text-[#6a8c7a]">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                This conversation is closed. Start a new message to reopen it.
              </div>
            )}

            {error && (
              <div className="text-[12px] text-[#b52b3a] text-center">{error}</div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-[#d8ede6] px-4 py-3 bg-[#eaf5f0]">
            <div className="flex items-end gap-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isClosed || sending}
                rows={1}
                placeholder={isClosed ? "This conversation is closed." : "Type a message… (Enter to send)"}
                className="flex-1 resize-none bg-[#f2f9f6] border border-[#c8dfd5] rounded-[13px] px-4 py-2.5 text-[13.5px] text-[#0f2419] placeholder-[#a8c8b8] focus:outline-none focus:border-[#4daa80] focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ minHeight: "42px", maxHeight: "120px" }}
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!input.trim() || sending || isClosed}
                className="w-10 h-10 rounded-[13px] text-white flex items-center justify-center flex-shrink-0 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed mb-0.5"
                style={{ background: "linear-gradient(135deg, #1a6648, #3daa7a)" }}
              >
                {sending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </button>
            </div>
            <p className="text-[10px] text-[#a8c8b8] mt-2 px-1">Shift+Enter for new line</p>
          </div>
        </div>
      </div>
    </div>
  );
}
