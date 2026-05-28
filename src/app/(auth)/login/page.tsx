"use client";

import { useState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/actions";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await loginAction(form);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=DM+Mono:wght@400;500&family=Manrope:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --cream: #f5f0e8;
          --cream-dark: #ede7d9;
          --cream-darker: #e0d9cc;
          --ink: #1a1512;
          --ink-mid: #3d352e;
          --ink-light: #7a6e65;
          --red: #c9170a;
          --red-dark: #9e1108;
          --serif: 'Playfair Display', Georgia, serif;
          --mono: 'DM Mono', monospace;
          --sans: 'Manrope', sans-serif;
        }

        .auth-shell {
          min-height: 100vh;
          background: var(--cream);
          font-family: var(--sans);
          display: flex;
        }

        /* ── LEFT PANEL ── */
        .auth-left {
          width: 420px;
          flex-shrink: 0;
          background: var(--ink);
          padding: 48px 44px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }

        .auth-left::before {
          content: '';
          position: absolute;
          bottom: -80px; right: -80px;
          width: 320px; height: 320px;
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 50%;
        }
        .auth-left::after {
          content: '';
          position: absolute;
          bottom: -40px; right: -40px;
          width: 220px; height: 220px;
          border: 1px solid rgba(255,255,255,0.03);
          border-radius: 50%;
        }

        .auth-brand {
          font-family: var(--serif);
          font-size: 1.4rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--cream);
        }
        .auth-brand span { color: var(--red); }

        .auth-panel-body { position: relative; z-index: 1; }

        .auth-panel-tag {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--red);
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
        }
        .auth-panel-tag::before {
          content: '';
          display: inline-block;
          width: 20px; height: 1px;
          background: var(--red);
        }

        .auth-panel-headline {
          font-family: var(--serif);
          font-size: 2.4rem;
          font-weight: 900;
          color: var(--cream);
          line-height: 1.1;
          margin-bottom: 20px;
        }
        .auth-panel-headline em {
          font-style: italic;
          color: var(--red);
        }

        .auth-panel-desc {
          font-size: 0.85rem;
          line-height: 1.75;
          color: #666;
          font-weight: 300;
          margin-bottom: 36px;
        }

        .auth-panel-stats {
          display: flex;
          flex-direction: column;
          gap: 1px;
          background: #2a2420;
        }
        .auth-stat {
          background: #1e1916;
          padding: 14px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .auth-stat-label {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.1em;
          color: #555;
          text-transform: uppercase;
        }
        .auth-stat-val {
          font-family: var(--mono);
          font-size: 0.82rem;
          color: #c8bfb5;
        }
        .auth-stat-val.up { color: #4ade80; }

        .auth-panel-footer {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.08em;
          color: #333;
          line-height: 1.6;
        }

        /* ── RIGHT PANEL ── */
        .auth-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          position: relative;
        }

        .auth-right::before {
          content: '';
          position: absolute;
          top: 40px; right: 40px; bottom: 40px; left: 40px;
          border: 1px solid var(--cream-darker);
          pointer-events: none;
        }

        .auth-form-wrap {
          width: 100%;
          max-width: 400px;
        }

        .auth-form-tag {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--red);
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .auth-form-tag::before {
          content: '';
          display: inline-block;
          width: 18px; height: 1px;
          background: var(--red);
        }

        .auth-form-title {
          font-family: var(--serif);
          font-size: 2.2rem;
          font-weight: 900;
          color: var(--ink);
          line-height: 1.1;
          margin-bottom: 8px;
        }

        .auth-form-sub {
          font-size: 0.85rem;
          color: var(--ink-light);
          font-weight: 300;
          margin-bottom: 40px;
        }
        .auth-form-sub a {
          color: var(--red);
          text-decoration: none;
          font-weight: 500;
        }
        .auth-form-sub a:hover { text-decoration: underline; }

        .field {
          margin-bottom: 20px;
        }
        .field label {
          display: block;
          font-family: var(--mono);
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--ink-mid);
          margin-bottom: 8px;
        }
        .field input {
          width: 100%;
          background: transparent;
          border: 1px solid var(--cream-darker);
          padding: 13px 16px;
          font-family: var(--mono);
          font-size: 0.85rem;
          color: var(--ink);
          outline: none;
          transition: border-color 0.2s;
          appearance: none;
        }
        .field input::placeholder { color: var(--ink-light); opacity: 0.6; }
        .field input:focus { border-color: var(--ink); }
        .field input.error-input { border-color: var(--red); }

        .field-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .field-row label {
          margin-bottom: 0;
          font-family: var(--mono);
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--ink-mid);
        }
        .forgot-link {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.08em;
          color: var(--ink-light);
          text-decoration: none;
          transition: color 0.2s;
        }
        .forgot-link:hover { color: var(--red); }

        .error-msg {
          background: rgba(201,23,10,0.06);
          border-left: 2px solid var(--red);
          padding: 11px 14px;
          font-family: var(--mono);
          font-size: 0.72rem;
          color: var(--red);
          letter-spacing: 0.04em;
          margin-bottom: 20px;
        }

        .submit-btn {
          width: 100%;
          background: var(--red);
          color: white;
          border: none;
          padding: 15px;
          font-family: var(--mono);
          font-size: 0.78rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 8px;
        }
        .submit-btn:hover:not(:disabled) { background: var(--red-dark); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .spinner {
          width: 14px; height: 14px;
          border: 1.5px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: var(--cream-darker);
        }
        .divider-text {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.12em;
          color: var(--ink-light);
          text-transform: uppercase;
        }

        .auth-footer-note {
          margin-top: 28px;
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.06em;
          color: var(--ink-light);
          text-align: center;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .auth-left { display: none; }
          .auth-right { padding: 32px 24px; }
          .auth-right::before { inset: 20px; }
        }
      `}</style>

      <div className="auth-left">
        <div className="auth-brand">Apex<span>•</span>Markets</div>

        <div className="auth-panel-body">
          <p className="auth-panel-tag">Live markets</p>
          <h2 className="auth-panel-headline">
            Your edge<br />starts <em>now.</em>
          </h2>
          <p className="auth-panel-desc">
            Access global markets with institutional-grade execution. Equities, crypto, FX, and commodities — all in one terminal.
          </p>

          <div className="auth-panel-stats">
            <div className="auth-stat">
              <span className="auth-stat-label">BTC / USD</span>
              <span className="auth-stat-val up">67,420 ▲ +2.38%</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-label">NVDA</span>
              <span className="auth-stat-val up">875.40 ▲ +4.62%</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-label">EUR / USD</span>
              <span className="auth-stat-val">1.0842 +0.12%</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-label">Gold Spot</span>
              <span className="auth-stat-val" style={{ color: "#f87171" }}>2,318.50 ▼ −0.23%</span>
            </div>
          </div>
        </div>

        <p className="auth-panel-footer">
          © 2026 Apex Markets Ltd.<br />
          FCA Regulated · Funds Segregated · 99.9% Uptime
        </p>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <p className="auth-form-tag">Secure login</p>
          <h1 className="auth-form-title">Welcome back.</h1>
          <p className="auth-form-sub">
            No account?{" "}
            <Link href="/signup">Create one free</Link>
          </p>

          <form onSubmit={handleSubmit}>
            {error && <div className="error-msg">{error}</div>}

            <div className="field">
              <label>Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={error ? "error-input" : ""}
                required
                autoComplete="email"
              />
            </div>

            <div className="field">
              <div className="field-row">
                <label>Password</label>
                <Link href="/forgot-password" className="forgot-link">Forgot password?</Link>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={error ? "error-input" : ""}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="auth-footer-note">
            Protected by 256-bit encryption · SOC 2 compliant
          </p>
        </div>
      </div>
    </>
  );
}
