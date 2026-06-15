"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Send, Loader2, MessageCircle, ShieldCheck,
  CheckCircle2, ArrowLeft,
} from "lucide-react";

type SupportMessage = {
  id: string;
  sender: "USER" | "ADMIN";
  body: string;
  createdAt: string;
};

type TicketStatus = "OPEN" | "CLOSED" | null;

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
  const textareaRef             = useRef<HTMLTextAreaElement>(null);

  const fetchThread = async (silent = false) => {
    try {
      const res  = await fetch("/api/support/thread", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (!silent) setError(data.error || "Failed to load support thread.");
        return;
      }
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

  // No auto-scroll at all — user scrolls manually

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 120)}px`; }
  };

  const handleSend = async () => {
    const body = input.trim();
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
        .sp-wrap {
          max-width: 720px;
          margin: 0 auto;
          padding: 16px 16px 60px;
          min-height: 100vh;
          font-family: var(--sans);
        }

        .sp-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.7rem; font-weight: 600; color: var(--ink-dim);
          text-decoration: none; margin-bottom: 20px;
          padding: 6px 12px;
          background: var(--card); border: 1px solid var(--line-strong);
          border-radius: 8px; transition: background 0.12s, border-color 0.12s;
        }
        .sp-back:hover { background: var(--surface-hover); border-color: var(--accent); }

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
        .sp-status-open   { background: var(--green-l);  color: var(--green); border: 1px solid var(--green); }
        .sp-status-closed { background: var(--surface); color: var(--ink-faint); border: 1px solid var(--line-strong); }

        /* Chat panel — fixed height, no page reflow */
        .sp-chat {
          background: var(--card); border: 1px solid var(--line-strong);
          border-radius: 14px; display: flex; flex-direction: column;
          height: 620px; overflow: hidden;
        }

        .sp-chat-header {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 18px; border-bottom: 1px solid var(--line-strong);
          background: var(--bg-3); flex-shrink: 0;
        }
        .sp-chat-avatar {
          width: 36px; height: 36px; border-radius: 10px;
          background: var(--surface);
          border: 1px solid var(--line-strong);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; color: var(--accent);
        }
        .sp-chat-name { font-size: 0.8rem; font-weight: 600; color: var(--ink); }
        .sp-chat-tagline { font-size: 0.62rem; color: var(--ink-faint); margin-top: 1px; }

        /* Online dot in header */
        .sp-online-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--green); margin-left: auto; flex-shrink: 0;
          box-shadow: 0 0 0 0 rgba(74,222,128,0.4);
          animation: pulse-green 2s infinite;
        }
        @keyframes pulse-green {
          0%   { box-shadow: 0 0 0 0 rgba(74,222,128,0.4); }
          70%  { box-shadow: 0 0 0 6px rgba(74,222,128,0); }
          100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
        }
        .sp-online-label {
          font-family: var(--mono); font-size: 0.55rem;
          color: var(--green); letter-spacing: 0.08em;
        }

        /* Messages — scrollable only by user */
        .sp-messages {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          scrollbar-width: thin;
          scrollbar-color: var(--line-strong) transparent;
        }
        .sp-messages::-webkit-scrollbar { width: 4px; }
        .sp-messages::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: 4px; }

        .sp-divider {
          display: flex; align-items: center; gap: 10px;
          margin: 14px 0 10px;
        }
        .sp-divider-line { flex: 1; height: 1px; background: var(--line-strong); }
        .sp-divider-label {
          font-family: var(--mono); font-size: 0.55rem;
          color: var(--ink-faint); white-space: nowrap;
        }

        .sp-msg-row { display: flex; margin-bottom: 6px; }
        .sp-msg-row.user  { justify-content: flex-end; }
        .sp-msg-row.admin { justify-content: flex-start; }
        .sp-msg-admin-ico {
          width: 26px; height: 26px; border-radius: 8px;
          background: var(--surface); border: 1px solid var(--line-strong);
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
          background: var(--accent); color: var(--bg);
          border-bottom-right-radius: 4px;
        }
        .sp-bubble.admin {
          background: var(--surface); color: var(--ink);
          border: 1px solid var(--line-strong);
          border-bottom-left-radius: 4px;
        }
        .sp-bubble-time {
          font-family: var(--mono); font-size: 0.55rem;
          color: var(--ink-faint); margin-top: 4px; padding: 0 2px;
        }

        .sp-empty {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          flex: 1; padding: 48px 24px; text-align: center; gap: 10px;
        }
        .sp-empty-ico {
          width: 52px; height: 52px; border-radius: 14px;
          background: var(--surface); border: 1px solid var(--line-strong);
          display: flex; align-items: center; justify-content: center;
          color: var(--ink-faint);
        }
        .sp-empty-title { font-size: 0.85rem; font-weight: 600; color: var(--ink-dim); }
        .sp-empty-sub   { font-size: 0.7rem; color: var(--ink-faint); }

        .sp-closed-notice {
          display: flex; align-items: center; gap: 8px;
          justify-content: center; margin: 8px 0;
          padding: 10px 14px;
          background: var(--surface); border: 1px solid var(--line-strong);
          border-radius: 10px;
          font-size: 0.68rem; color: var(--ink-faint);
          font-family: var(--mono);
        }

        .sp-error { font-size: 0.65rem; color: var(--red); text-align: center; margin: 4px 0; }

        /* Input — fixed at bottom of panel */
        .sp-input-area {
          border-top: 1px solid var(--line-strong);
          padding: 12px 16px;
          background: var(--bg-3);
          flex-shrink: 0;
        }
        .sp-input-row { display: flex; align-items: flex-end; gap: 10px; }
        .sp-textarea {
          flex: 1; resize: none; outline: none;
          background: var(--surface); border: 1.5px solid var(--line-strong);
          border-radius: 12px; padding: 10px 14px;
          font-family: var(--sans); font-size: 0.8rem;
          color: var(--ink); line-height: 1.5;
          transition: border-color 0.15s;
          min-height: 42px; max-height: 120px;
        }
        .sp-textarea::placeholder { color: var(--ink-faint); }
        .sp-textarea:focus { border-color: var(--accent); }
        .sp-textarea:disabled { opacity: 0.4; cursor: not-allowed; }
        .sp-send {
          width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
          background: var(--accent); color: var(--bg); border: none;
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

        <div className="sp-chat">
          {/* Header */}
          <div className="sp-chat-header">
            <div className="sp-chat-avatar">
              <MessageCircle size={16} strokeWidth={1.8} />
            </div>
            <div>
              <p className="sp-chat-name">Apex Markets Support</p>
              <p className="sp-chat-tagline">Replies go to this thread</p>
            </div>
            <div className="sp-online-dot" />
            <span className="sp-online-label">Online</span>
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
                <p className="sp-empty-sub">Type below to start a conversation.</p>
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
    </>
  );
}
