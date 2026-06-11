"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Send, Loader2, MessageCircle, ShieldCheck,
  CreditCard, KeyRound, HelpCircle, RefreshCw,
  ArrowDownToLine, CheckCircle2, ArrowLeft,
} from "lucide-react";

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

  useEffect(() => {
    fetchThread().then(() => setLoading(false));
  }, []);

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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        :root {
          --bg:           #0f2535;
          --bg-1:         #0b1e2c;
          --bg-2:         #1a3a50;
          --bg-3:         #234d67;
          --card:         #132f45;
          --ink:          #f0f8ff;
          --ink-2:        #d6ecf8;
          --ink-dim:      #8dbdd8;
          --ink-faint:    #4d7a96;
          --accent:       #38bdf8;
          --accent-dim:   rgba(56,189,248,0.12);
          --accent-border:rgba(56,189,248,0.25);
          --green:        #4ade80;
          --green-bg:     rgba(74,222,128,0.08);
          --green-border: rgba(74,222,128,0.2);
          --red:          #f87171;
          --red-bg:       rgba(248,113,113,0.08);
          --red-border:   rgba(248,113,113,0.2);
          --yellow:       #fbbf24;
          --yellow-bg:    rgba(251,191,36,0.08);
          --yellow-border:rgba(251,191,36,0.2);
          --sans:         'DM Sans', system-ui, sans-serif;
          --mono:         'DM Mono', 'SF Mono', monospace;
          --r:            14px;
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .sp-wrap {
          max-width: 960px;
          margin: 0 auto;
          padding: 16px 16px 60px;
          min-height: 100vh;
          font-family: var(--sans);
        }

        /* Back */
        .sp-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.7rem; font-weight: 600; color: var(--ink-dim);
          text-decoration: none; margin-bottom: 20px;
          padding: 6px 12px;
          background: var(--card); border: 1px solid var(--bg-2);
          border-radius: 8px; transition: background 0.12s, border-color 0.12s;
        }
        .sp-back:hover { background: var(--bg-2); border-color: var(--bg-3); }

        /* Header */
        .sp-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 20px; gap: 12px;
        }
        .sp-brand {
          font-family: var(--mono); font-size: 0.58rem;
          letter-spacing: 0.18em; color: var(--accent);
          text-transform: uppercase; margin-bottom: 4px;
        }
        .sp-title {
          font-size: 1.4rem; font-weight: 700; color: var(--ink);
          letter-spacing: -0.02em; margin-bottom: 3px;
        }
        .sp-sub {
          font-size: 0.7rem; font-weight: 300; color: var(--ink-faint);
        }
        .sp-status-badge {
          font-family: var(--mono); font-size: 0.55rem; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 4px 12px; border-radius: 20px; white-space: nowrap;
          flex-shrink: 0; margin-top: 4px;
        }
        .sp-status-open   { background: rgba(74,222,128,0.1);  color: var(--green); border: 1px solid var(--green-border); }
        .sp-status-closed { background: rgba(77,122,150,0.12); color: var(--ink-faint); border: 1px solid rgba(77,122,150,0.25); }

        /* Layout */
        .sp-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 768px) {
          .sp-grid { grid-template-columns: 260px 1fr; }
        }

        /* Sidebar */
        .sp-sidebar { display: flex; flex-direction: column; gap: 12px; }
        .sp-card {
          background: var(--card); border: 1px solid var(--bg-2);
          border-radius: var(--r); padding: 18px;
        }
        .sp-card-title {
          font-size: 0.58rem; font-weight: 700; color: var(--ink-faint);
          text-transform: uppercase; letter-spacing: 0.1em;
          font-family: var(--mono); margin-bottom: 4px;
        }
        .sp-card-sub {
          font-size: 0.65rem; color: var(--ink-faint); margin-bottom: 14px;
        }

        /* Shortcut buttons */
        .sp-shortcuts { display: flex; flex-direction: column; gap: 6px; }
        .sp-shortcut {
          display: flex; align-items: center; gap: 10px;
          background: var(--bg-1); border: 1.5px solid var(--bg-2);
          border-radius: 10px; padding: 10px 12px;
          cursor: pointer; transition: all 0.14s; text-align: left;
          font-family: var(--sans);
        }
        .sp-shortcut:hover:not(:disabled) { border-color: var(--accent); background: var(--accent-dim); }
        .sp-shortcut:disabled { opacity: 0.35; cursor: not-allowed; }
        .sp-shortcut-ico {
          width: 30px; height: 30px; border-radius: 8px;
          background: var(--bg-2); border: 1px solid var(--bg-3);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          color: var(--accent); transition: background 0.14s;
        }
        .sp-shortcut:hover:not(:disabled) .sp-shortcut-ico { background: var(--accent-border); }
        .sp-shortcut-lbl {
          font-size: 0.72rem; font-weight: 500; color: var(--ink-dim);
        }
        .sp-shortcut:hover:not(:disabled) .sp-shortcut-lbl { color: var(--accent); }

        /* Online indicator */
        .sp-online {
          display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
        }
        .sp-online-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 0 0 rgba(74,222,128,0.4);
          animation: pulse-green 2s infinite;
        }
        @keyframes pulse-green {
          0%   { box-shadow: 0 0 0 0 rgba(74,222,128,0.4); }
          70%  { box-shadow: 0 0 0 6px rgba(74,222,128,0); }
          100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
        }
        .sp-online-lbl { font-size: 0.72rem; font-weight: 600; color: var(--ink-dim); }
        .sp-online-desc { font-size: 0.65rem; color: var(--ink-faint); line-height: 1.6; }

        /* Chat panel */
        .sp-chat {
          background: var(--card); border: 1px solid var(--bg-2);
          border-radius: var(--r); display: flex; flex-direction: column;
          overflow: hidden; min-height: 560px;
        }

        /* Chat header */
        .sp-chat-header {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 18px; border-bottom: 1px solid var(--bg-2);
          background: var(--bg-1);
        }
        .sp-chat-avatar {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, var(--bg-2), var(--bg-3));
          border: 1px solid var(--accent-border);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; color: var(--accent);
        }
        .sp-chat-name { font-size: 0.8rem; font-weight: 600; color: var(--ink); }
        .sp-chat-tagline { font-size: 0.62rem; color: var(--ink-faint); margin-top: 1px; }

        /* Messages */
        .sp-messages {
          flex: 1; overflow-y: auto; padding: 18px;
          display: flex; flex-direction: column; gap: 4px;
          scrollbar-width: thin; scrollbar-color: var(--bg-2) transparent;
        }
        .sp-messages::-webkit-scrollbar { width: 4px; }
        .sp-messages::-webkit-scrollbar-thumb { background: var(--bg-2); border-radius: 4px; }

        /* Date divider */
        .sp-divider {
          display: flex; align-items: center; gap: 10px;
          margin: 14px 0 10px;
        }
        .sp-divider-line { flex: 1; height: 1px; background: var(--bg-2); }
        .sp-divider-label {
          font-family: var(--mono); font-size: 0.55rem;
          color: var(--ink-faint); white-space: nowrap;
        }

        /* Message bubbles */
        .sp-msg-row { display: flex; margin-bottom: 6px; }
        .sp-msg-row.user  { justify-content: flex-end; }
        .sp-msg-row.admin { justify-content: flex-start; }
        .sp-msg-admin-ico {
          width: 26px; height: 26px; border-radius: 8px;
          background: var(--bg-2); border: 1px solid var(--accent-border);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-right: 8px; align-self: flex-end;
          color: var(--accent);
        }
        .sp-bubble-wrap { max-width: 72%; display: flex; flex-direction: column; }
        .sp-bubble-wrap.user  { align-items: flex-end; }
        .sp-bubble-wrap.admin { align-items: flex-start; }
        .sp-bubble {
          padding: 10px 14px; border-radius: 16px;
          font-size: 0.82rem; line-height: 1.6;
          white-space: pre-wrap; word-break: break-words;
        }
        .sp-bubble.user {
          background: var(--accent); color: #0a1f2e;
          border-bottom-right-radius: 4px;
        }
        .sp-bubble.admin {
          background: var(--bg-2); color: var(--ink);
          border: 1px solid var(--bg-3);
          border-bottom-left-radius: 4px;
        }
        .sp-bubble-time {
          font-family: var(--mono); font-size: 0.55rem;
          color: var(--ink-faint); margin-top: 4px; padding: 0 2px;
        }

        /* Empty state */
        .sp-empty {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          flex: 1; padding: 48px 24px; text-align: center; gap: 10px;
        }
        .sp-empty-ico {
          width: 52px; height: 52px; border-radius: 14px;
          background: var(--bg-2); border: 1px solid var(--bg-3);
          display: flex; align-items: center; justify-content: center;
          color: var(--ink-faint);
        }
        .sp-empty-title { font-size: 0.85rem; font-weight: 600; color: var(--ink-dim); }
        .sp-empty-sub   { font-size: 0.7rem; color: var(--ink-faint); }

        /* Closed notice */
        .sp-closed-notice {
          display: flex; align-items: center; gap: 8px;
          justify-content: center; margin: 8px 0;
          padding: 10px 14px;
          background: var(--bg-2); border: 1px solid var(--bg-3);
          border-radius: 10px;
          font-size: 0.68rem; color: var(--ink-faint);
          font-family: var(--mono);
        }

        /* Error */
        .sp-error { font-size: 0.65rem; color: var(--red); text-align: center; margin: 4px 0; }

        /* Input area */
        .sp-input-area {
          border-top: 1px solid var(--bg-2);
          padding: 12px 16px; background: var(--bg-1);
        }
        .sp-input-row { display: flex; align-items: flex-end; gap: 10px; }
        .sp-textarea {
          flex: 1; resize: none; outline: none;
          background: var(--bg-2); border: 1.5px solid var(--bg-3);
          border-radius: 12px; padding: 10px 14px;
          font-family: var(--sans); font-size: 0.8rem;
          color: var(--ink); line-height: 1.5;
          transition: border-color 0.15s, background 0.15s;
          min-height: 42px; max-height: 120px;
        }
        .sp-textarea::placeholder { color: var(--ink-faint); }
        .sp-textarea:focus { border-color: var(--accent); background: var(--bg-2); }
        .sp-textarea:disabled { opacity: 0.4; cursor: not-allowed; }
        .sp-send {
          width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
          background: var(--accent); color: #0a1f2e; border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: opacity 0.15s, transform 0.1s;
          margin-bottom: 1px;
        }
        .sp-send:hover:not(:disabled) { opacity: 0.85; }
        .sp-send:active:not(:disabled) { transform: scale(0.95); }
        .sp-send:disabled { opacity: 0.3; cursor: not-allowed; }
        .sp-input-hint {
          font-size: 0.58rem; color: var(--ink-faint);
          margin-top: 6px; padding: 0 2px;
          font-family: var(--mono);
        }
      `}</style>

      <div className="sp-wrap">

        <Link href="/dashboard" className="sp-back">
          <ArrowLeft size={13} /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="sp-header">
          <div>
            <p className="sp-brand">Apex · Markets</p>
            <h1 className="sp-title">Support</h1>
            <p className="sp-sub">We usually reply within a few hours.</p>
          </div>
          {status && (
            <span className={`sp-status-badge ${status === "OPEN" ? "sp-status-open" : "sp-status-closed"}`}>
              {status === "OPEN" ? "● Open" : "Closed"}
            </span>
          )}
        </div>

        <div className="sp-grid">

          {/* ── Sidebar ── */}
          <div className="sp-sidebar">

            {/* Quick topics */}
            <div className="sp-card">
              <p className="sp-card-title">Quick topics</p>
              <p className="sp-card-sub">Tap a topic to get started fast.</p>
              <div className="sp-shortcuts">
                {FAQ_SHORTCUTS.map(({ icon: Icon, label, text }) => (
                  <button
                    key={label}
                    type="button"
                    disabled={isClosed || sending}
                    onClick={() => handleSend(text)}
                    className="sp-shortcut"
                  >
                    <div className="sp-shortcut-ico">
                      <Icon size={13} strokeWidth={2} />
                    </div>
                    <span className="sp-shortcut-lbl">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Online status */}
            <div className="sp-card">
              <div className="sp-online">
                <div className="sp-online-dot" />
                <span className="sp-online-lbl">Support is online</span>
              </div>
              <p className="sp-online-desc">
                Our team reviews all messages and typically responds within 2–4 hours during business hours.
              </p>
            </div>

          </div>

          {/* ── Chat panel ── */}
          <div className="sp-chat">

            {/* Chat header */}
            <div className="sp-chat-header">
              <div className="sp-chat-avatar">
                <MessageCircle size={16} strokeWidth={1.8} />
              </div>
              <div>
                <p className="sp-chat-name">Apex Markets Support</p>
                <p className="sp-chat-tagline">Replies go to this thread</p>
              </div>
            </div>

            {/* Messages */}
            <div className="sp-messages">

              {loading && (
                <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
                  <Loader2 size={18} style={{ color: "var(--ink-faint)", animation: "spin 0.8s linear infinite" }} />
                </div>
              )}

              {!loading && messages.length === 0 && (
                <div className="sp-empty">
                  <div className="sp-empty-ico">
                    <MessageCircle size={22} strokeWidth={1.5} />
                  </div>
                  <p className="sp-empty-title">No messages yet</p>
                  <p className="sp-empty-sub">Use a quick topic or type below to start.</p>
                </div>
              )}

              {grouped.map(({ date, messages: dayMsgs }) => (
                <div key={date}>
                  <div className="sp-divider">
                    <div className="sp-divider-line" />
                    <span className="sp-divider-label">{formatDateDivider(dayMsgs[0].createdAt)}</span>
                    <div className="sp-divider-line" />
                  </div>

                  {dayMsgs.map((msg) => {
                    const isUser = msg.sender === "USER";
                    return (
                      <div key={msg.id} className={`sp-msg-row ${isUser ? "user" : "admin"}`}>
                        {!isUser && (
                          <div className="sp-msg-admin-ico">
                            <MessageCircle size={12} strokeWidth={2} />
                          </div>
                        )}
                        <div className={`sp-bubble-wrap ${isUser ? "user" : "admin"}`}>
                          <div className={`sp-bubble ${isUser ? "user" : "admin"}`}>
                            {msg.body}
                          </div>
                          <span className="sp-bubble-time">{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {isClosed && (
                <div className="sp-closed-notice">
                  <CheckCircle2 size={13} />
                  Conversation closed · Start a new message to reopen
                </div>
              )}

              {error && <p className="sp-error">{error}</p>}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="sp-input-area">
              <div className="sp-input-row">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  disabled={isClosed || sending}
                  rows={1}
                  placeholder={isClosed ? "Conversation is closed." : "Type a message… (Enter to send)"}
                  className="sp-textarea"
                />
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || sending || isClosed}
                  className="sp-send"
                >
                  {sending
                    ? <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} />
                    : <Send size={15} />
                  }
                </button>
              </div>
              <p className="sp-input-hint">Shift+Enter for new line</p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
