"use client";

import { useState } from "react";
import Link from "next/link";
import { signupAction } from "@/lib/actions";
import Logo from "@/components/Logo";

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

        /* ── LEFT PANEL (DESKTOP) ── */
        .auth-left {
          width: 460px;
          flex-shrink: 0;
          background: var(--bg-3);
          border-right: 1px solid var(--line-strong);
          padding: 64px 48px;
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
          opacity: 0.5;
        }
        .auth-left::after {
          content: '';
          position: absolute;
          bottom: -40px; right: -40px;
          width: 220px; height: 220px;
          border: 1px solid var(--line);
          border-radius: 50%;
          opacity: 0.5;
        }

        .auth-brand {
          display: flex;
          align-items: center;
          text-decoration: none;
          flex-shrink: 0;
          z-index: 2;
        }

        .auth-panel-body { position: relative; z-index: 1; margin: auto 0; }

        .auth-panel-tag {
          font-family: var(--mono);
          font-size: 0.65rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--accent);
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .auth-panel-tag::before {
          content: '';
          display: inline-block;
          width: 24px; height: 1px;
          background: var(--accent);
        }

        .auth-panel-headline {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 2.6rem;
          font-weight: 900;
          color: var(--ink);
          line-height: 1.15;
          margin-bottom: 24px;
        }
        .auth-panel-headline em {
          font-style: italic;
          color: var(--accent);
        }

        .auth-panel-desc {
          font-size: 0.9rem;
          line-height: 1.8;
          color: var(--ink-dim);
          font-weight: 300;
          margin-bottom: 44px;
        }

        .perks { display: flex; flex-direction: column; gap: 18px; }
        .perk { display: flex; align-items: flex-start; gap: 14px; }
        .perk-icon {
          width: 24px; height: 24px;
          background: var(--surface);
          border: 1px solid var(--line-strong);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
          border-radius: 4px; /* Softened secondary indicators */
        }
        .perk-text {
          font-size: 0.85rem;
          color: var(--ink-dim);
          line-height: 1.5;
          font-weight: 300;
        }
        .perk-text strong {
          color: var(--ink);
          font-weight: 500;
          display: block;
          font-family: var(--mono);
          font-size: 0.72rem;
          letter-spacing: 0.05em;
          margin-bottom: 2px;
          text-transform: uppercase;
        }

        .auth-panel-footer {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.08em;
          color: var(--ink-faint);
          line-height: 1.7;
          z-index: 2;
        }

        /* ── RIGHT PANEL (FORM CONTAINER) ── */
        .auth-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 64px 48px;
          position: relative;
        }
        .auth-right::before {
          content: '';
          position: absolute;
          top: 32px; right: 32px; bottom: 32px; left: 32px;
          border: 1px solid var(--line-strong);
          pointer-events: none;
          opacity: 0.7;
          border-radius: 8px; /* Smooth card perimeter contour */
        }

        .auth-form-wrap { width: 100%; max-width: 400px; position: relative; z-index: 2; }

        .mobile-logo-wrap {
          display: none;
          margin-bottom: 40px;
          justify-content: center;
        }

        .auth-form-tag {
          font-family: var(--mono);
          font-size: 0.65rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .auth-form-tag::before {
          content: '';
          display: inline-block;
          width: 16px; height: 1px;
          background: var(--accent);
        }

        .auth-form-sub {
          font-size: 0.88rem;
          color: var(--ink-dim);
          font-weight: 300;
          margin-bottom: 32px;
        }
        .auth-form-sub a { color: var(--accent); text-decoration: none; font-weight: 500; transition: color 0.2s; }
        .auth-form-sub a:hover { color: var(--ink); text-decoration: underline; }

        .field { margin-bottom: 20px; }

        .field label {
          display: block;
          font-family: var(--mono);
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--ink-dim);
          margin-bottom: 8px;
        }
        .field input {
          width: 100%;
          background: var(--surface);
          border: 1px solid var(--line-strong);
          padding: 14px 16px;
          font-family: var(--mono);
          font-size: 0.88rem;
          color: var(--ink);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          appearance: none;
          border-radius: 6px; /* Softened text element frames */
        }
        .field input::placeholder { color: var(--ink-faint); opacity: 0.8; }
        .field input:focus {
          background: var(--bg);
          border-color: var(--accent);
          box-shadow: 0 0 0 1px var(--accent);
        }
        .field input.error-input { border-color: var(--red); }
        .field input.error-input:focus { box-shadow: 0 0 0 1px var(--red); }

        .password-strength { display: flex; gap: 6px; margin-top: 10px; }
        .strength-bar {
          flex: 1; height: 3px;
          background: var(--line-strong);
          transition: background 0.3s;
          border-radius: 2px;
        }
        .strength-bar.active { background: var(--red); }
        .strength-bar.medium { background: var(--gold); }
        .strength-bar.strong { background: var(--green); }

        .error-msg {
          background: var(--red-l);
          border-left: 3px solid var(--red);
          padding: 12px 16px;
          font-family: var(--mono);
          font-size: 0.75rem;
          color: var(--red);
          letter-spacing: 0.02em;
          margin-bottom: 24px;
          border-radius: 0 6px 6px 0;
        }

        .submit-btn {
          width: 100%;
          background: var(--accent);
          color: var(--bg);
          border: 1px solid var(--accent);
          padding: 16px;
          font-family: var(--mono);
          font-size: 0.8rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, opacity 0.2s, color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 28px;
          border-radius: 6px; /* Cohesive interactive target radius */
        }
        .submit-btn:hover:not(:disabled) { 
          background: transparent;
          color: var(--accent);
        }
        .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .spinner {
          width: 14px; height: 14px;
          border: 1.5px solid rgba(0,0,0,0.15);
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .terms-note {
          margin-top: 24px;
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.05em;
          color: var(--ink-faint);
          text-align: center;
          line-height: 1.6;
        }
        .terms-note a { color: var(--ink-dim); text-decoration: underline; transition: color 0.2s; }
        .terms-note a:hover { color: var(--accent); }

        /* ── RESPONSIVE OVERRIDES ── */
        @media (max-width: 960px) {
          .auth-left { width: 380px; padding: 48px 36px; }
          .auth-panel-headline { font-size: 2.2rem; }
        }

        @media (max-width: 768px) {
          .auth-left { display: none; }
          .auth-right { padding: 40px 24px; }
          .auth-right::before { display: none; }
          .auth-form-wrap { max-width: 100%; }
          .mobile-logo-wrap { display: flex; }
        }
      `}</style>

      <div className="auth-shell">
        {/* Left Side Branding Panel */}
        <div className="auth-left">
          <Link href="/" className="auth-brand">
            <Logo width={150} height={26} />
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
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" style={{ color: "var(--accent)" }} />
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

        {/* Right Side Form Panel */}
        <div className="auth-right">
          <div className="auth-form-wrap">
            {/* Adaptive Mobile Branding Entry */}
            <div className="mobile-logo-wrap">
              <Link href="/">
                <Logo width={185} height={34} />
              </Link>
            </div>

            <p className="auth-form-tag">Create account</p>
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
                      <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
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
