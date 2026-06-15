"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { User, Lock, Trash2, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

type Section = "profile" | "security" | "danger";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [active, setActive] = useState<Section>("profile");

  // Profile
  const [name, setName]   = useState(session?.user?.name ?? "");
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Security
  const [current, setCurrent] = useState("");
  const [next, setNext]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [secMsg, setSecMsg]   = useState<{ ok: boolean; text: string } | null>(null);
  const [secLoading, setSecLoading] = useState(false);

  // Danger
  const [dangerConfirm, setDangerConfirm] = useState("");
  const [dangerMsg, setDangerMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [dangerLoading, setDangerLoading] = useState(false);

  const saveProfile = async () => {
    if (!name.trim() || !email.trim()) return;
    setProfileLoading(true);
    setProfileMsg(null);
    const res  = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();
    if (res.ok) {
      await update({ name, email });
      setProfileMsg({ ok: true, text: "Profile updated successfully." });
    } else {
      setProfileMsg({ ok: false, text: data.error });
    }
    setProfileLoading(false);
  };

  const savePassword = async () => {
    if (next !== confirm) { setSecMsg({ ok: false, text: "Passwords do not match." }); return; }
    if (next.length < 8)  { setSecMsg({ ok: false, text: "Password must be at least 8 characters." }); return; }
    setSecLoading(true);
    setSecMsg(null);
    const res  = await fetch("/api/settings/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, next }),
    });
    const data = await res.json();
    if (res.ok) {
      setCurrent(""); setNext(""); setConfirm("");
      setSecMsg({ ok: true, text: "Password changed successfully." });
    } else {
      setSecMsg({ ok: false, text: data.error });
    }
    setSecLoading(false);
  };

  const requestClosure = async () => {
    if (dangerConfirm !== "DELETE") return;
    setDangerLoading(true);
    setDangerMsg(null);
    const res = await fetch("/api/settings/danger", { method: "POST" });
    if (res.ok) {
      setDangerMsg({ ok: true, text: "Closure request submitted. Our team will contact you within 24 hours." });
    } else {
      setDangerMsg({ ok: false, text: "Something went wrong. Please try again." });
    }
    setDangerLoading(false);
    setDangerConfirm("");
  };

  const NAV: { id: Section; label: string; icon: typeof User }[] = [
    { id: "profile",  label: "Profile",       icon: User },
    { id: "security", label: "Security",       icon: Lock },
    { id: "danger",   label: "Danger Zone",    icon: Trash2 },
  ];

  return (
    <>
      <style>{`
        .st-wrap {
          max-width: 760px; margin: 0 auto;
          padding: 16px 16px 80px;
          font-family: var(--sans);
        }
        .st-brand {
          font-family: var(--mono); font-size: 0.58rem;
          letter-spacing: 0.18em; color: var(--accent);
          text-transform: uppercase; margin-bottom: 4px;
        }
        .st-title {
          font-size: 1.4rem; font-weight: 700; color: var(--ink);
          letter-spacing: -0.02em; margin-bottom: 20px;
        }

        .st-layout { display: flex; gap: 16px; }

        /* Sidebar nav */
        .st-nav {
          width: 180px; flex-shrink: 0;
          display: flex; flex-direction: column; gap: 4px;
        }
        .st-nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 10px;
          font-size: 0.78rem; font-weight: 500; color: var(--ink-dim);
          cursor: pointer; border: 1px solid transparent;
          background: none; width: 100%; text-align: left;
          transition: all 0.15s;
        }
        .st-nav-item:hover { background: var(--surface); color: var(--ink); }
        .st-nav-item.active {
          background: var(--surface); color: var(--ink);
          border-color: var(--line-strong);
        }
        .st-nav-item.danger { color: var(--red); }
        .st-nav-item.danger:hover { background: var(--red-l); }
        .st-nav-item.danger.active { background: var(--red-l); border-color: var(--red); }

        /* Panel */
        .st-panel {
          flex: 1; min-width: 0;
          background: var(--card); border: 1px solid var(--line-strong);
          border-radius: 14px; padding: 24px;
        }
        .st-panel-title {
          font-size: 0.9rem; font-weight: 700; color: var(--ink);
          margin-bottom: 4px;
        }
        .st-panel-sub {
          font-size: 0.7rem; color: var(--ink-faint); margin-bottom: 24px;
        }
        .st-divider {
          height: 1px; background: var(--line-strong); margin: 20px 0;
        }

        /* Fields */
        .st-field { margin-bottom: 16px; }
        .st-field label {
          display: block; font-family: var(--mono);
          font-size: 0.62rem; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--ink-dim);
          margin-bottom: 8px;
        }
        .st-field input {
          width: 100%; background: var(--surface);
          border: 1px solid var(--line-strong); border-radius: 10px;
          padding: 12px 14px; font-family: var(--mono);
          font-size: 0.85rem; color: var(--ink); outline: none;
          transition: border-color 0.2s;
        }
        .st-field input::placeholder { color: var(--ink-faint); }
        .st-field input:focus { border-color: var(--accent); }

        /* Feedback */
        .st-msg {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px; border-radius: 10px;
          font-family: var(--mono); font-size: 0.7rem;
          letter-spacing: 0.03em; margin-bottom: 16px;
        }
        .st-msg.ok  { background: var(--green-l); color: var(--green); border: 1px solid var(--green); }
        .st-msg.err { background: var(--red-l);   color: var(--red);   border: 1px solid var(--red); }

        /* Button */
        .st-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--accent); color: var(--bg);
          border: none; border-radius: 10px;
          padding: 12px 20px; font-family: var(--mono);
          font-size: 0.75rem; letter-spacing: 0.1em;
          text-transform: uppercase; cursor: pointer;
          transition: opacity 0.15s;
        }
        .st-btn:hover:not(:disabled) { opacity: 0.85; }
        .st-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .st-btn.danger {
          background: var(--red); color: white;
        }

        /* Danger zone */
        .st-danger-box {
          background: var(--red-l); border: 1px solid var(--red);
          border-radius: 12px; padding: 18px;
        }
        .st-danger-title {
          font-size: 0.82rem; font-weight: 700; color: var(--red);
          margin-bottom: 6px;
        }
        .st-danger-desc {
          font-size: 0.72rem; color: var(--ink-dim);
          line-height: 1.6; margin-bottom: 16px;
        }
        .st-danger-label {
          font-family: var(--mono); font-size: 0.65rem;
          color: var(--ink-dim); margin-bottom: 8px; display: block;
        }

        @media (max-width: 600px) {
          .st-layout { flex-direction: column; }
          .st-nav { width: 100%; flex-direction: row; overflow-x: auto; }
          .st-nav-item { white-space: nowrap; }
        }
      `}</style>

      <div className="st-wrap">
        <p className="st-brand">Apex · Markets</p>
        <h1 className="st-title">Settings</h1>

        <div className="st-layout">
          {/* Nav */}
          <nav className="st-nav">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`st-nav-item ${id === "danger" ? "danger" : ""} ${active === id ? "active" : ""}`}
                onClick={() => setActive(id)}
              >
                <Icon size={14} strokeWidth={2} />
                {label}
              </button>
            ))}
          </nav>

          {/* Panel */}
          <div className="st-panel">

            {/* ── Profile ── */}
            {active === "profile" && (
              <>
                <p className="st-panel-title">Profile</p>
                <p className="st-panel-sub">Update your name and email address.</p>
                {profileMsg && (
                  <div className={`st-msg ${profileMsg.ok ? "ok" : "err"}`}>
                    {profileMsg.ok ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                    {profileMsg.text}
                  </div>
                )}
                <div className="st-field">
                  <label>Full name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="st-field">
                  <label>Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <button className="st-btn" onClick={saveProfile} disabled={profileLoading}>
                  {profileLoading ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : null}
                  Save changes
                </button>
              </>
            )}

            {/* ── Security ── */}
            {active === "security" && (
              <>
                <p className="st-panel-title">Change Password</p>
                <p className="st-panel-sub">Use a strong password you don't use elsewhere.</p>
                {secMsg && (
                  <div className={`st-msg ${secMsg.ok ? "ok" : "err"}`}>
                    {secMsg.ok ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                    {secMsg.text}
                  </div>
                )}
                <div className="st-field">
                  <label>Current password</label>
                  <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="••••••••" />
                </div>
                <div className="st-field">
                  <label>New password</label>
                  <input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Min. 8 characters" />
                </div>
                <div className="st-field">
                  <label>Confirm new password</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat new password"
                    style={{ borderColor: confirm && confirm !== next ? "var(--red)" : undefined }}
                  />
                </div>
                <button className="st-btn" onClick={savePassword} disabled={secLoading || !current || !next || !confirm}>
                  {secLoading ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : null}
                  Update password
                </button>
              </>
            )}

            {/* ── Danger ── */}
            {active === "danger" && (
              <>
                <p className="st-panel-title">Danger Zone</p>
                <p className="st-panel-sub">Irreversible actions. Proceed with caution.</p>
                <div className="st-danger-box">
                  <p className="st-danger-title">Close Account</p>
                  <p className="st-danger-desc">
                    Requesting account closure will flag your account for review. Our team will contact you within 24 hours to confirm. All open positions and funds must be settled before closure is completed.
                  </p>
                  {dangerMsg && (
                    <div className={`st-msg ${dangerMsg.ok ? "ok" : "err"}`}>
                      {dangerMsg.ok ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                      {dangerMsg.text}
                    </div>
                  )}
                  <span className="st-danger-label">Type DELETE to confirm</span>
                  <div className="st-field">
                    <input
                      type="text"
                      value={dangerConfirm}
                      onChange={(e) => setDangerConfirm(e.target.value)}
                      placeholder="DELETE"
                    />
                  </div>
                  <button
                    className="st-btn danger"
                    onClick={requestClosure}
                    disabled={dangerConfirm !== "DELETE" || dangerLoading}
                  >
                    {dangerLoading ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : <Trash2 size={13} />}
                    Request account closure
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
     }
