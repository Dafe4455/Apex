'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Clock, CheckCircle2, XCircle, Building2, CreditCard, Bitcoin } from 'lucide-react';

type Withdrawal = {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';
  note?: string;
  createdAt: string;
};

function fmt(n: number | null | undefined, d = 2) {
  return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatusBadge({ status }: { status: Withdrawal['status'] }) {
  const map: Record<Withdrawal['status'], { bg: string; col: string; border: string; label: string }> = {
    PENDING:              { bg: 'rgba(251,191,36,0.1)',  col: '#fbbf24', border: 'rgba(251,191,36,0.25)',  label: 'Pending' },
    PENDING_VERIFICATION: { bg: 'rgba(251,191,36,0.1)',  col: '#fbbf24', border: 'rgba(251,191,36,0.25)',  label: 'Verifying' },
    APPROVED:             { bg: 'rgba(74,222,128,0.1)',  col: '#4ade80', border: 'rgba(74,222,128,0.25)',  label: 'Approved' },
    REJECTED:             { bg: 'rgba(248,113,113,0.1)', col: '#f87171', border: 'rgba(248,113,113,0.25)', label: 'Rejected' },
  };
  const s = map[status];
  return (
    <span style={{
      background: s.bg, color: s.col, border: `1px solid ${s.border}`,
      padding: '3px 10px', borderRadius: 20,
      fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em',
      textTransform: 'uppercase', fontFamily: 'var(--mono)',
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

const METHODS = [
  { id: 'bank',   label: 'Bank',   icon: Building2,  fields: ['Account Name', 'Bank Name', 'Account Number', 'Routing / Sort Code'] },
  { id: 'card',   label: 'Card',   icon: CreditCard, fields: ['Cardholder Name', 'Card Number (last 4)', 'Expiry'] },
  { id: 'crypto', label: 'Crypto', icon: Bitcoin,    fields: ['Wallet Address', 'Network'] },
];

export default function WithdrawPage() {
  const [method, setMethod]         = useState('bank');
  const [amount, setAmount]         = useState('');
  const [note, setNote]             = useState('');
  const [details, setDetails]       = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [submitErr, setSubmitErr]   = useState('');
  const [history, setHistory]       = useState<Withdrawal[]>([]);
  const [historyLoading, setHL]     = useState(true);
  const [balance, setBalance]       = useState<number>(0);

  const fetchHistory = useCallback(async () => {
    setHL(true);
    try {
      const res = await fetch('/api/user/withdrawals');
      if (res.ok) {
        const d = await res.json();
        setHistory(d.withdrawals ?? []);
      }
    } finally { setHL(false); }
  }, []);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/user/dashboard');
      if (res.ok) {
        const d = await res.json();
        setBalance(d.user?.portfolioBalance ?? 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchHistory();
    fetchBalance();
  }, [fetchHistory, fetchBalance]);

  const activeMethod = METHODS.find(m => m.id === method)!;

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) return;
    setSubmitting(true); setSubmitErr('');
    try {
      const res = await fetch('/api/user/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          currency: 'USD',
          method,
          details,
          note: note || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSubmitErr(d.error ?? 'Failed to submit withdrawal');
        return;
      }
      setSubmitted(true);
      fetchHistory();
      fetchBalance();
    } catch { setSubmitErr('Network error. Please try again.'); }
    finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setSubmitted(false);
    setAmount('');
    setNote('');
    setDetails({});
    setSubmitErr('');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        :root {
          --bg: #0f2535;
          --bg-1: #0b1e2c;
          --bg-2: #1a3a50;
          --bg-3: #234d67;
          --card: #132f45;
          --ink: #f0f8ff;
          --ink-2: #d6ecf8;
          --ink-dim: #8dbdd8;
          --ink-faint: #4d7a96;
          --accent: #38bdf8;
          --accent-dim: rgba(56,189,248,0.12);
          --accent-border: rgba(56,189,248,0.25);
          --green: #4ade80;
          --green-bg: rgba(74,222,128,0.1);
          --green-border: rgba(74,222,128,0.2);
          --red: #f87171;
          --red-bg: rgba(248,113,113,0.1);
          --red-border: rgba(248,113,113,0.2);
          --yellow: #fbbf24;
          --yellow-bg: rgba(251,191,36,0.1);
          --yellow-border: rgba(251,191,36,0.2);
          --sans: 'DM Sans', system-ui, sans-serif;
          --mono: 'DM Mono', 'SF Mono', monospace;
          --r: 14px;
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); font-family: var(--sans); }

        .wd-wrap {
          max-width: 480px;
          margin: 0 auto;
          padding: 16px 16px 80px;
          min-height: 100vh;
        }

        /* Back link */
        .wd-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.7rem; font-weight: 600; color: var(--ink-dim);
          text-decoration: none; margin-bottom: 20px;
          padding: 6px 12px;
          background: var(--card); border: 1px solid var(--bg-2);
          border-radius: 8px; transition: background 0.12s, border-color 0.12s;
        }
        .wd-back:hover { background: var(--bg-2); border-color: var(--bg-3); }

        /* Header */
        .wd-brand {
          font-family: var(--mono); font-size: 0.58rem;
          letter-spacing: 0.18em; color: var(--accent);
          text-transform: uppercase; margin-bottom: 4px;
        }
        .wd-title {
          font-size: 1.4rem; font-weight: 700; color: var(--ink);
          letter-spacing: -0.02em; margin-bottom: 4px;
        }
        .wd-sub {
          font-size: 0.72rem; font-weight: 300;
          color: var(--ink-faint); margin-bottom: 24px;
        }

        /* Balance card */
        .wd-balance-card {
          background: linear-gradient(135deg, #0d2d45 0%, #0b2038 100%);
          border: 1px solid var(--bg-2);
          border-radius: var(--r); padding: 20px;
          margin-bottom: 12px;
          display: flex; align-items: center; justify-content: space-between;
          position: relative; overflow: hidden;
        }
        .wd-balance-card::before {
          content: '';
          position: absolute; top: -30px; right: -30px;
          width: 120px; height: 120px; border-radius: 50%;
          background: rgba(56,189,248,0.05);
          pointer-events: none;
        }
        .wd-balance-lbl {
          font-size: 0.58rem; font-weight: 600;
          color: var(--ink-faint); letter-spacing: 0.1em;
          text-transform: uppercase; margin-bottom: 6px;
          font-family: var(--mono);
        }
        .wd-balance-val {
          font-size: 1.8rem; font-weight: 700; color: var(--ink);
          letter-spacing: -0.03em; font-family: var(--mono);
        }
        .wd-balance-arrow {
          width: 44px; height: 44px; border-radius: 50%;
          background: var(--accent-dim); border: 1px solid var(--accent-border);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent); flex-shrink: 0;
        }

        /* Cards */
        .wd-card {
          background: var(--card); border: 1px solid var(--bg-2);
          border-radius: var(--r); padding: 20px; margin-bottom: 12px;
        }
        .wd-section-lbl {
          font-size: 0.58rem; font-weight: 700; color: var(--ink-faint);
          text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 14px;
          font-family: var(--mono);
        }

        /* Method selector */
        .wd-method-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
        .wd-method {
          background: var(--bg-1); border: 1.5px solid var(--bg-2);
          border-radius: 10px; padding: 14px 10px;
          text-align: center; cursor: pointer; transition: all 0.15s;
        }
        .wd-method:hover { border-color: var(--bg-3); }
        .wd-method.active {
          border-color: var(--accent); background: var(--accent-dim);
        }
        .wd-method-icon {
          margin-bottom: 6px; display: flex;
          justify-content: center; color: var(--ink-faint);
        }
        .wd-method.active .wd-method-icon { color: var(--accent); }
        .wd-method-lbl {
          font-size: 0.6rem; font-weight: 600;
          color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.06em;
        }
        .wd-method.active .wd-method-lbl { color: var(--accent); }

        /* Warning */
        .wd-warning {
          display: flex; gap: 8px;
          background: var(--yellow-bg); border: 1px solid var(--yellow-border);
          border-radius: 10px; padding: 10px 14px; margin-bottom: 14px;
        }
        .wd-warning p { font-size: 0.65rem; color: var(--yellow); line-height: 1.6; }

        /* Amount input */
        .wd-amount-row {
          display: flex; align-items: center;
          background: var(--bg-1); border: 1.5px solid var(--bg-2);
          border-radius: 10px; padding: 14px 16px;
          transition: border-color 0.15s; margin-bottom: 12px;
        }
        .wd-amount-row:focus-within { border-color: var(--accent); }
        .wd-currency {
          font-size: 1.2rem; font-weight: 600;
          color: var(--ink-faint); margin-right: 8px;
        }
        .wd-input {
          flex: 1; border: none; background: transparent; outline: none;
          font-family: var(--mono); font-size: 1.4rem;
          font-weight: 700; color: var(--ink); letter-spacing: -0.02em;
        }
        .wd-input::placeholder { color: var(--bg-3); }

        /* Quick amounts */
        .wd-quick { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
        .wd-quick-btn {
          background: var(--bg-1); border: 1px solid var(--bg-2);
          border-radius: 8px; padding: 5px 14px;
          font-family: var(--mono); font-size: 0.65rem; font-weight: 500;
          color: var(--ink-dim); cursor: pointer; transition: all 0.12s;
        }
        .wd-quick-btn:hover, .wd-quick-btn.active {
          background: var(--accent-dim); border-color: var(--accent); color: var(--accent);
        }

        /* Fields */
        .wd-field { margin-bottom: 12px; }
        .wd-field-label {
          display: block; font-size: 0.58rem; font-weight: 600;
          color: var(--ink-faint); text-transform: uppercase;
          letter-spacing: 0.08em; margin-bottom: 6px; font-family: var(--mono);
        }
        .wd-field-input {
          width: 100%; background: var(--bg-1); border: 1.5px solid var(--bg-2);
          border-radius: 10px; padding: 10px 13px;
          font-family: var(--sans); font-size: 0.8rem;
          color: var(--ink); outline: none; transition: border-color 0.15s;
        }
        .wd-field-input:focus { border-color: var(--accent); background: var(--bg-2); }
        .wd-field-input::placeholder { color: var(--ink-faint); }

        /* Submit */
        .wd-submit {
          width: 100%; background: var(--accent); color: #0a1f2e;
          border: none; border-radius: 12px; padding: 15px;
          font-family: var(--sans); font-size: 0.85rem; font-weight: 700;
          cursor: pointer; transition: opacity 0.15s, transform 0.1s;
          margin-top: 4px; display: flex; align-items: center;
          justify-content: center; gap: 8px;
        }
        .wd-submit:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .wd-submit:active:not(:disabled) { transform: scale(0.98); }
        .wd-submit:disabled { opacity: 0.35; cursor: not-allowed; }
        .wd-err {
          font-size: 0.65rem; color: var(--red);
          margin-top: 8px; text-align: center;
        }

        /* Success */
        .wd-success {
          display: flex; flex-direction: column;
          align-items: center; padding: 10px 0 6px; text-align: center;
        }
        .wd-success-ico {
          width: 64px; height: 64px; border-radius: 50%;
          background: var(--green-bg); border: 1px solid var(--green-border);
          display: flex; align-items: center; justify-content: center;
          color: var(--green); margin-bottom: 16px;
        }
        .wd-success-title {
          font-size: 1.1rem; font-weight: 700; color: var(--ink); margin-bottom: 6px;
        }
        .wd-success-sub {
          font-size: 0.72rem; font-weight: 300; color: var(--ink-faint);
          margin-bottom: 20px; line-height: 1.7;
        }
        .wd-success-sub strong { color: var(--ink); font-weight: 600; }
        .wd-success-btn {
          background: var(--accent); color: #0a1f2e;
          border: none; border-radius: 10px; padding: 12px 28px;
          font-family: var(--sans); font-size: 0.78rem; font-weight: 700;
          cursor: pointer; transition: opacity 0.15s;
        }
        .wd-success-btn:hover { opacity: 0.88; }

        /* History */
        .wd-history-row {
          display: flex; align-items: center; gap: 12px;
          padding: 13px 0; border-bottom: 1px solid var(--bg-2);
        }
        .wd-history-row:last-child { border-bottom: none; padding-bottom: 0; }
        .wd-history-ico {
          width: 34px; height: 34px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .wd-spin { animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .wd-empty {
          display: flex; flex-direction: column;
          align-items: center; padding: 24px; gap: 8px; color: var(--ink-faint);
        }
        .wd-empty p { font-size: 0.7rem; font-weight: 300; }
      `}</style>

      <div className="wd-wrap">
        <Link href="/dashboard" className="wd-back">
          <ArrowLeft size={13} /> Back to Dashboard
        </Link>

        <p className="wd-brand">Apex · Markets</p>
        <h1 className="wd-title">Withdraw Funds</h1>
        <p className="wd-sub">Transfer funds to your bank, card, or wallet</p>

        {/* BALANCE */}
        <div className="wd-balance-card">
          <div>
            <p className="wd-balance-lbl">Available Balance</p>
            <p className="wd-balance-val">${fmt(balance)}</p>
          </div>
          <div className="wd-balance-arrow">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 14V4M9 4L4.5 8.5M9 4L13.5 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* METHOD */}
        {!submitted && (
          <div className="wd-card">
            <p className="wd-section-lbl">Withdrawal Method</p>
            <div className="wd-method-grid">
              {METHODS.map(m => {
                const Icon = m.icon;
                return (
                  <div key={m.id} className={`wd-method${method === m.id ? ' active' : ''}`}
                    onClick={() => { setMethod(m.id); setDetails({}); }}>
                    <div className="wd-method-icon"><Icon size={20} strokeWidth={1.5} /></div>
                    <p className="wd-method-lbl">{m.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AMOUNT + DETAILS */}
        {!submitted && (
          <div className="wd-card">
            <p className="wd-section-lbl">Amount & Details</p>

            <div className="wd-warning">
              <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>⚠️</span>
              <p>Withdrawals are typically processed instantly. Minimum withdrawal is $500.</p>
            </div>

            <div className="wd-amount-row">
              <span className="wd-currency">$</span>
              <input className="wd-input" type="number" placeholder="0.00"
                value={amount} onChange={e => setAmount(e.target.value)} min="0" />
            </div>

            <div className="wd-quick">
              {['100', '500', '1000', '5000'].map(q => (
                <button key={q} className={`wd-quick-btn${amount === q ? ' active' : ''}`}
                  onClick={() => setAmount(q)}>${q}</button>
              ))}
            </div>

            {activeMethod.fields.map(field => (
              <div key={field} className="wd-field">
                <label className="wd-field-label">{field}</label>
                <input className="wd-field-input" placeholder={`Enter ${field.toLowerCase()}`}
                  value={details[field] ?? ''}
                  onChange={e => setDetails(prev => ({ ...prev, [field]: e.target.value }))} />
              </div>
            ))}

            <div className="wd-field">
              <label className="wd-field-label">Note (optional)</label>
              <input className="wd-field-input" placeholder="Any additional instructions"
                value={note} onChange={e => setNote(e.target.value)} />
            </div>

            {submitErr && <p className="wd-err">{submitErr}</p>}

            <button
              className="wd-submit"
              disabled={!amount || Number(amount) <= 0 || submitting}
              onClick={handleSubmit}
            >
              {submitting
                ? <><Loader2 size={16} className="wd-spin" /> Submitting…</>
                : `Request Withdrawal of $${amount || '0'}`}
            </button>
          </div>
        )}

        {/* SUCCESS */}
        {submitted && (
          <div className="wd-card">
            <div className="wd-success">
              <div className="wd-success-ico">
                <CheckCircle2 size={28} />
              </div>
              <p className="wd-success-title">Withdrawal Requested</p>
              <p className="wd-success-sub">
                Your withdrawal of <strong>${fmt(Number(amount))}</strong> via {activeMethod.label} has been submitted.<br />
                It will be reviewed and processed within 1–3 business days.
              </p>
              <button className="wd-success-btn" onClick={resetForm}>Make Another Request</button>
            </div>
          </div>
        )}

        {/* HISTORY */}
        <div className="wd-card" style={{ marginTop: 4 }}>
          <p className="wd-section-lbl">Withdrawal History</p>
          {historyLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
              <Loader2 size={18} className="wd-spin" style={{ color: 'var(--ink-faint)' }} />
            </div>
          ) : history.length === 0 ? (
            <div className="wd-empty">
              <Clock size={22} style={{ opacity: 0.25 }} />
              <p>No withdrawals yet</p>
            </div>
          ) : history.map(w => (
            <div key={w.id} className="wd-history-row">
              <div className="wd-history-ico" style={{
                background: w.status === 'APPROVED' ? 'var(--green-bg)' : w.status === 'REJECTED' ? 'var(--red-bg)' : 'var(--yellow-bg)',
                color: w.status === 'APPROVED' ? 'var(--green)' : w.status === 'REJECTED' ? 'var(--red)' : 'var(--yellow)',
                border: `1px solid ${w.status === 'APPROVED' ? 'var(--green-border)' : w.status === 'REJECTED' ? 'var(--red-border)' : 'var(--yellow-border)'}`,
              }}>
                {w.status === 'APPROVED' ? <CheckCircle2 size={16} /> : w.status === 'REJECTED' ? <XCircle size={16} /> : <Clock size={16} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>
                  ${fmt(w.amount)} {w.currency}
                </p>
                <p style={{ fontSize: '0.6rem', color: 'var(--ink-faint)', fontFamily: 'var(--mono)' }}>
                  {fmtDate(w.createdAt)}{w.note ? ` · "${w.note}"` : ''}
                </p>
              </div>
              <StatusBadge status={w.status} />
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
