"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";

type Notification = {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const fetchNotifications = async () => {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setNotifications(data.notifications ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markOne = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  const markAll = async () => {
    setMarking(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setMarking(false);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <style>{`
        .nf-wrap {
          max-width: 680px;
          margin: 0 auto;
          padding: 16px 16px 80px;
          font-family: var(--sans);
        }
        .nf-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 12px;
          margin-bottom: 24px;
        }
        .nf-brand {
          font-family: var(--mono); font-size: 0.58rem;
          letter-spacing: 0.18em; color: var(--accent);
          text-transform: uppercase; margin-bottom: 4px;
        }
        .nf-title {
          font-size: 1.4rem; font-weight: 700; color: var(--ink);
          letter-spacing: -0.02em; margin-bottom: 3px;
        }
        .nf-sub {
          font-size: 0.7rem; color: var(--ink-faint); font-weight: 300;
        }
        .nf-mark-all {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: var(--mono); font-size: 0.62rem;
          letter-spacing: 0.08em; color: var(--accent);
          background: none; border: 1px solid var(--line-strong);
          border-radius: 8px; padding: 7px 12px;
          cursor: pointer; transition: background 0.15s;
          white-space: nowrap; margin-top: 4px;
        }
        .nf-mark-all:hover { background: var(--surface); }
        .nf-mark-all:disabled { opacity: 0.4; cursor: not-allowed; }

        .nf-list { display: flex; flex-direction: column; gap: 8px; }

        .nf-item {
          display: flex; align-items: flex-start; gap: 14px;
          background: var(--card); border: 1px solid var(--line-strong);
          border-radius: 12px; padding: 14px 16px;
          cursor: pointer; transition: background 0.15s;
          position: relative;
        }
        .nf-item:hover { background: var(--surface-hover); }
        .nf-item.unread { border-color: var(--accent); }

        .nf-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--accent); flex-shrink: 0; margin-top: 5px;
        }
        .nf-dot.read { background: transparent; border: 1px solid var(--line-strong); }

        .nf-ico {
          width: 36px; height: 36px; border-radius: 10px;
          background: var(--surface); border: 1px solid var(--line-strong);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; color: var(--accent);
        }
        .nf-item.unread .nf-ico { background: rgba(56,189,248,0.1); }

        .nf-body { flex: 1; min-width: 0; }
        .nf-msg {
          font-size: 0.82rem; color: var(--ink); line-height: 1.5;
          margin-bottom: 4px;
        }
        .nf-item.read .nf-msg { color: var(--ink-dim); }
        .nf-time {
          font-family: var(--mono); font-size: 0.58rem;
          color: var(--ink-faint); letter-spacing: 0.04em;
        }

        .nf-empty {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 64px 24px; gap: 12px; text-align: center;
        }
        .nf-empty-ico {
          width: 56px; height: 56px; border-radius: 16px;
          background: var(--surface); border: 1px solid var(--line-strong);
          display: flex; align-items: center; justify-content: center;
          color: var(--ink-faint);
        }
        .nf-empty-title { font-size: 0.9rem; font-weight: 600; color: var(--ink-dim); }
        .nf-empty-sub { font-size: 0.72rem; color: var(--ink-faint); }

        .nf-loader {
          display: flex; justify-content: center; padding: 64px 0;
        }
      `}</style>

      <div className="nf-wrap">
        <div className="nf-header">
          <div>
            <p className="nf-brand">Apex · Markets</p>
            <h1 className="nf-title">Notifications</h1>
            <p className="nf-sub">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button className="nf-mark-all" onClick={markAll} disabled={marking}>
              {marking
                ? <Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} />
                : <CheckCheck size={13} />
              }
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="nf-loader">
            <Loader2 size={20} style={{ color: "var(--ink-faint)", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="nf-empty">
            <div className="nf-empty-ico">
              <Bell size={24} strokeWidth={1.5} />
            </div>
            <p className="nf-empty-title">No notifications yet</p>
            <p className="nf-empty-sub">We'll notify you about activity on your account.</p>
          </div>
        ) : (
          <div className="nf-list">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`nf-item ${n.read ? "read" : "unread"}`}
                onClick={() => !n.read && markOne(n.id)}
              >
                <div className={`nf-dot ${n.read ? "read" : ""}`} />
                <div className="nf-ico">
                  <Bell size={16} strokeWidth={1.8} />
                </div>
                <div className="nf-body">
                  <p className="nf-msg">{n.message}</p>
                  <span className="nf-time">{timeAgo(n.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
