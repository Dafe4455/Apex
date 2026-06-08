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
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --navy:        #0b1929;
          --navy-mid:    #0f2235;
          --navy-card:   #132840;
          --navy-border: #1e3a55;
          --navy-hover:  #1a3350;
          --white:       #e8f4f8;
          --white-dim:   #8aafc4;
          --white-faint: #4a6a80;
          --cyan:        #00d4aa;
          --cyan-dim:    rgba(0,212,170,0.12);
          --cyan-glow:   rgba(0,212,170,0.25);
          --green:       #4ade80;
          --red:         #f87171;
          --sans:        'Syne', sans-serif;
          --mono:        'DM Mono', monospace;
        }

        html, body { height: 100%; }

        .login-shell {
          min-height: 100vh;
          background: var(--navy);
          font-family: var(--sans);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        /* Background grid lines like the dashboard's subtle depth */
        .login-shell::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,212,170,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,170,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        /* Ambient glow top-left */
        .login-shell::after {
          content: '';
          position: absolute;
          top: -120px; left: -120px;
          width: 480px; height: 480px;
          background: radial-gradient(circle, rgba(0,212,170,0.08) 0%, transparent 65%);
          pointer-events: none;
        }

        /* ── HEADER / BRAND ── */
        .login-brand {
          font-family: var(--sans);
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--white);
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 40px;
          position: relative;
          z-index: 1;
        }
        .login-brand-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--cyan);
          box-shadow: 0 0 8px var(--cyan);
        }

        /* ── CARD ── */
        .login-card {
          width: 100%;
          max-width: 400px;
          background: var(--navy-mid);
          border: 1px solid var(--navy-border);
          border-radius: 20px;
          padding: 36px 32px;
          position: relative;
          z-index: 1;
          box-shadow: 0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,212,170,0.04);
        }

        /* Live badge — matches dashboard top-right */
        .live-badge {
          position: absolute;
          top: 24px; right: 24px;
          background: rgba(74,222,128,0.12);
          border: 1px solid rgba(74,222,128,0.3);
          border-radius: 999px;
          padding: 4px 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--mono);
          font-size: 0.65rem;
          letter-spacing: 0.08em;
          color: var(--green);
        }
        .live-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 6px var(--green);
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .login-welcome {
          font-size: 0.55rem;
          font-weight: 100;
          color: var(--white-dim);
          letter-spacing: 0.04em;
          margin-bottom: 4px;
        }

        .login-title {
          font-size: 1.5rem;
          font-weight: 400;
          color: var(--white);
          letter-spacing: -0.01em;
          margin-bottom: 28px;
          line-height: 1;
        }

       
        /* ── FORM ── */
        .field {
          margin-bottom: 16px;
        }
        .field-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .field label {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--white-dim);
        }
        .forgot-link {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.06em;
          color: var(--white-faint);
          text-decoration: none;
          transition: color 0.2s;
        }
        .forgot-link:hover { color: var(--cyan); }

        .field input {
          width: 100%;
          background: var(--navy-card);
          border: 1px solid var(--navy-border);
          border-radius: 10px;
          padding: 13px 16px;
          font-family: var(--mono);
          font-size: 0.85rem;
          color: var(--white);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          appearance: none;
        }
        .field input::placeholder { color: var(--white-faint); }
        .field input:focus {
          border-color: var(--cyan);
          box-shadow: 0 0 0 3px var(--cyan-dim);
        }
        .field input.error-input {
          border-color: var(--red);
          box-shadow: 0 0 0 3px rgba(248,113,113,0.1);
        }

        .error-msg {
          background: rgba(248,113,113,0.08);
          border: 1px solid rgba(248,113,113,0.2);
          border-radius: 10px;
          padding: 11px 14px;
          font-family: var(--mono);
          font-size: 0.72rem;
          color: var(--red);
          letter-spacing: 0.04em;
          margin-bottom: 16px;
        }

        .submit-btn {
          width: 100%;
          background: var(--cyan);
          color: var(--navy);
          border: none;
          border-radius: 10px;
          padding: 15px;
          font-family: var(--sans);
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          cursor: pointer;
          transition: opacity 0.2s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 8px;
          box-shadow: 0 4px 24px var(--cyan-glow);
        }
        .submit-btn:hover:not(:disabled) {
          opacity: 0.9;
          box-shadow: 0 6px 32px var(--cyan-glow);
        }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(11,25,41,0.3);
          border-top-color: var(--navy);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── FOOTER ── */
        .login-footer {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .login-signup {
          font-size: 0.8rem;
          color: var(--white-dim);
          font-weight: 400;
        }
        .login-signup a {
          color: var(--cyan);
          text-decoration: none;
          font-weight: 600;
        }
        .login-signup a:hover { text-decoration: underline; }

        .login-trust {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.08em;
          color: var(--white-faint);
          text-align: center;
          line-height: 1.7;
        }
        .trust-pills {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 4px;
        }
        .trust-pill {
          background: var(--navy-card);
          border: 1px solid var(--navy-border);
          border-radius: 999px;
          padding: 3px 10px;
          font-family: var(--mono);
          font-size: 0.58rem;
          letter-spacing: 0.08em;
          color: var(--white-faint);
        }
      `}</style>

      <div className="login-shell">
        {/* Brand */}
        <div className="login-brand">
          APEX
          <span className="login-brand-dot" />
          MARKETS
        </div>

        {/* Card */}
        <div className="login-card">
          <div className="live-badge">
            <span className="live-dot" />
            Live
          </div>

          <p className="login-welcome">Welcome back,</p>
          <h3 className="login-title">Sign in</h3>

         

          <form onSubmit={handleSubmit}>
            {error && <div className="error-msg">{error}</div>}

            <div className="field">
              <div className="field-header">
                <label>Email address</label>
              </div>
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
              <div className="field-header">
                <label>Password</label>
                <Link href="/forgot-password" className="forgot-link">Forgot?</Link>
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
                    <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p className="login-signup">
              No account? <Link href="/signup">Create one free</Link>
            </p>
            <div className="trust-pills">
              <span className="trust-pill">FCA Regulated</span>
              <span className="trust-pill">256-bit SSL</span>
              <span className="trust-pill">SOC 2</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
