"use client";

import { useState } from "react";
import Link from "next/link";
import { signupAction } from "@/lib/actions";
import Logo from "@/components/Logo"; // 1. Imported the clean standalone brand layout

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const result = await signupAction({
      name: form.name,
      email: form.email,
      password: form.password,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        .auth-shell {
          min-height: 100vh;
          background: var(--bg);
          font-family: var(--sans);
          display: flex;
        }

        /* ── LEFT PANEL ── */
        .auth-left {
          width: 420px;
          flex-shrink: 0;
          background: var(--bg-3);
          border-right: 1px solid var(--line-strong);
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
          border: 1px solid var(--line-strong);
          border-radius: 50%;
        }
        .auth-left::after {
          content: '';
          position: absolute;
          bottom: -40px; right: -40px;
          width: 220px; height: 220px;
          border: 1px solid var(--line);
          border-radius: 50%;
        }

        /* 2. Adjusted brand wrapper for handling custom SVG logo structure */
        .auth-brand {
          display: flex;
          align-items: center;
          text-decoration: none;
          flex-shrink: 0;
        }

        .auth-panel-body { position: relative; z-index: 1; }

        .auth-panel-tag {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--accent);
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
        }
        .auth-panel-tag::before {
          content: '';
          display: inline-block;
          width: 20px; height: 1px;
          background: var(--accent);
        }

        .auth-panel-headline {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 2.2rem;
          font-weight: 900;
          color: var(--ink);
          line-height: 1.1;
          margin-bottom: 20px;
        }
        .auth-panel-headline em {
          font-style: italic;
          color: var(--accent);
        }

        .auth-panel-desc {
          font-size: 0.85rem;
          line-height: 1.75;
          color: var(--ink-dim);
          font-weight: 300;
          margin-bottom: 36px;
        }

        .perks { display: flex; flex-direction: column; gap: 14px; }
        .perk { display: flex; align-items: flex-start; gap: 12px; }
        .perk-icon {
          width: 24px; height: 24px;
          background: var(--surface);
          border: 1px solid var(--line-strong);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .perk-text {
          font-size: 0.82rem;
          color: var(--ink-dim);
          line-height: 1.5;
          font-weight: 300;
        }
        .perk-text strong {
          color: var(--ink-2);
          font-weight: 500;
          display: block;
          font-family: var(--mono);
          font-size: 0.72rem;
          letter-spacing: 0.06em;
          margin-bottom: 2px;
        }

        .auth-panel-footer {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.08em;
          color: var(--ink-faint);
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
          border: 1px solid var(--line-strong);
          pointer-events: none;
        }

        .auth-form-wrap { width: 100%; max-width: 420px; }

        .auth-form-tag {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .auth-form-tag::before {
          content: '';
          display: inline-block;
          width: 18px; height: 1px;
          background: var(--accent);
        }

        .auth-form-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 2.2rem;
          font-weight: 900;
          color: var(--ink);
          line-height: 1.1;
          margin-bottom: 8px;
        }

        .auth-form-sub {
          font-size: 0.85rem;
          color: var(--ink-dim);
          font-weight: 300;
          margin-bottom: 32px;
        }
        .auth-form-sub a { color: var(--accent); text-decoration: none; font-weight: 500; }
        .auth-form-sub a:hover { text-decoration: underline; }

        .field { margin-bottom: 16px; }

        .field label {
          display: block;
          font-family: var(--mono);
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--ink-2);
          margin-bottom: 8px;
        }
        .field input {
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--line-strong);
          padding: 13px 16px;
          font-family: var(--mono);
          font-size: 0.85rem;
          color: var(--ink);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          appearance: none;
        }
        .field input::placeholder { color: var(--ink-faint); }
        .field input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(56,189,248,0.1);
        }
        .field input.error-input { border-color: var(--red); }

        .password-strength { display: flex; gap: 4px; margin-top: 8px; }
        .strength-bar {
          flex: 1; height: 2px;
          background: var(--line-strong);
          transition: background 0.3s;
        }
        .strength-bar.active { background: var(--red); }
        .strength-bar.medium { background: var(--gold); }
        .strength-bar.strong { background: var(--green); }

        .error-msg {
          background: var(--red-l);
          border-left: 2px solid var(--red);
          padding: 11px 14px;
          font-family: var(--mono);
          font-size: 0.72rem;
          color: var(--red);
          letter-spacing: 0.04em;
          margin-bottom: 16px;
        }

        /* Kept sharp/square aesthetic unique to signup CTA */
        .submit-btn {
          width: 100%;
          background: var(--accent);
          color: var(--bg);
          border: none;
          padding: 15px;
          font-family: var(--mono);
          font-size: 0.78rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 8px;
        }
        .submit-btn:hover:not(:disabled) { opacity: 0.85; }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .spinner {
          width: 14px; height: 14px;
          border: 1.5px solid rgba(0,0,0,0.2);
          border-top-color: var(--bg);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .terms-note {
          margin-top: 16px;
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.05em;
          color: var(--ink-faint);
          text-align: center;
          line-height: 1.6;
        }
        .terms-note a { color: var(--ink-dim); text-decoration: underline; }

        @media (max-width: 768px) {
          .auth-left { display: none; }
          .auth-right { padding: 32px 24px; }
          .auth-right::before { inset: 20px; }
        }
      `}</style>

      <div className="auth-shell">
        <div className="auth-left">
          {/* 3. Replaced string header path with dynamic Logo routing */}
          <Link href="/" className="auth-brand">
            <Logo width={160} height={28} />
          </Link>

          <div className="auth-panel-body">
            <p className="auth-panel-tag">Get started</p>
            <h2 className="auth-panel-headline">
              Join <em>180,000+</em><br />active traders.
            </h2>
            <p className="auth-panel-desc">
              Everything you need to trade professionally — from day one.
            </p>

            <div className="perks">
              {[
                { title: "Free demo account", desc: "$100,000 virtual funds. No risk, real markets." },
                { title: "180+ instruments", desc: "Crypto, equities, FX, commodities." },
                { title: "0.2ms execution", desc: "Institutional-grade order routing." },
                { title: "FCA regulated", desc: "Segregated client funds. Always protected." },
              ].map((p) => (
                <div className="perk" key={p.title}>
                  <div className="perk-icon">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" style={{ color: "var(--accent)" }} />
                    </svg>
                  </div>
                  <div className="perk-text">
                    <strong>{p.title}</strong>
                    {p.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="auth-panel-footer">
            © 2026 Apex Markets Ltd.<br />
            FCA Regulated · Funds Segregated · 99.9% Uptime
          </p>
        </div>

        <div className="auth-right">
          <div className="auth-form-wrap">
            <p className="auth-form-tag">Create account</p>
            <h1 className="auth-form-title">Start trading.</h1>
            <p className="auth-form-sub">
              Already have an account?{" "}
              <Link href="/login">Sign in</Link>
            </p>

            <form onSubmit={handleSubmit}>
              {error && <div className="error-msg">{error}</div>}

              <div className="field">
                <label>Full name</label>
                <input
                  type="text"
                  placeholder="John Smith"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoComplete="name"
                />
              </div>

              <div className="field">
                <label>Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="new-password"
                />
                <div className="password-strength">
                  {[1, 2, 3, 4].map((i) => {
                    const len = form.password.length;
                    const cls =
                      len === 0 ? "" :
                      len < 6 ? (i === 1 ? "active" : "") :
                      len < 10 ? (i <= 2 ? "medium" : "") :
                      len < 14 ? (i <= 3 ? "strong" : "") :
                      "strong";
                    return <div key={i} className={`strength-bar ${cls}`} />;
                  })}
                </div>
              </div>

              <div className="field">
                <label>Confirm password</label>
                <input
                  type="password"
                  placeholder="Repeat password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  required
                  autoComplete="new-password"
                  className={form.confirm && form.confirm !== form.password ? "error-input" : ""}
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <><span className="spinner" />Creating account...</>
                ) : (
                  <>
                    Create Account
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="terms-note">
              By creating an account you agree to our{" "}
              <a href="#">Terms of Service</a> and{" "}
              <a href="#">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
