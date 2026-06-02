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
  const map: Record<Withdrawal['status'], { bg: string; col: string; label: string }> = {
    PENDING:              { bg: '#fdf3d0', col: '#8a6800', label: 'Pending' },
    PENDING_VERIFICATION: { bg: '#faeaea', col: '#b83232', label: 'Verifying' },
    APPROVED:             { bg: '#e4f2ea', col: '#2e7d4f', label: 'Approved' },
    REJECTED:             { bg: '#faeaea', col: '#b83232', label: 'Rejected' },
  };
  const s = map[status];
  return (
    <span style={{ background: s.bg, color: s.col, padding: '3px 10px', borderRadius: 20,
      fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
      fontFamily: 'var(--mono)' }}>
      {s.label}
    </span>
  );
}

const METHODS = [
  { id: 'bank',   label: 'Bank Transfer',  icon: Building2,   fields: ['Account Name', 'Bank Name', 'Account Number', 'Routing / Sort Code'] },
  { id: 'card',   label: 'Debit Card',     icon: CreditCard,  fields: ['Cardholder Name', 'Card Number (last 4)', 'Expiry'] },
  { id: 'crypto', label: 'Crypto Wallet',  icon: Bitcoin,     fields: ['Wallet Address', 'Network'] },
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
          --bg:#f0ece6;--bg-1:#e8e3db;--bg-2:#ddd7cd;--bg-3:#cbc4b8;
          --card:#eeeae4;--ink:#1c1a17;--ink-2:#2e2b26;--ink-dim:#6b6457;
          --ink-faint:#9e9485;--orange:#e85c0d;--orange-l:#fde8dc;--orange-m:#f5c4a8;
          --green:#2e7d4f;--green-l:#e4f2ea;--red:#b83232;--red-l:#faeaea;
          --gold-l:#fdf3d0;--gold:#8a6800;
          --sans:'DM Sans',system-ui,sans-serif;--mono:'DM Mono','SF Mono',monospace;
          --r:14px;
        }
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:var(--bg);font-family:var(--sans);}
        .wd-wrap{max-width:480px;margin:0 auto;padding:20px 16px 60px;min-height:100vh;}
        .wd-back{display:inline-flex;align-items:center;gap:6px;font-size:0.7rem;font-weight:600;color:var(--ink-dim);text-decoration:none;margin-bottom:20px;padding:6px 12px;background:var(--card);border:1px solid var(--bg-2);border-radius:8px;transition:background 0.12s;}
        .wd-back:hover{background:var(--bg-2);}
        .wd-brand{font-family:var(--mono);font-size:0.58rem;letter-spacing:0.18em;color:var(--orange);text-transform:uppercase;margin-bottom:4px;}
        .wd-title{font-size:1.4rem;font-weight:700;color:var(--ink);letter-spacing:-0.02em;margin-bottom:4px;}
        .wd-sub{font-size:0.72rem;font-weight:300;color:var(--ink-faint);margin-bottom:24px;}
        .wd-balance-card{background:var(--ink);border-radius:var(--r);padding:18px 20px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;}
        .wd-balance-lbl{font-size:0.6rem;font-weight:600;color:rgba(240,236,230,0.5);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px;}
        .wd-balance-val{font-size:1.6rem;font-weight:700;color:#f0ece6;letter-spacing:-0.02em;font-family:var(--mono);}
        .wd-card{background:var(--card);border:1px solid var(--bg-2);border-radius:var(--r);padding:20px;margin-bottom:12px;position:relative;overflow:hidden;}
        .wd-card-stripe{position:absolute;top:0;left:0;bottom:0;width:3px;background:var(--ink);border-radius:3px 0 0 3px;}
        .wd-section-lbl{font-size:0.6rem;font-weight:700;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:14px;}
        .wd-method-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
        .wd-method{background:var(--bg-1);border:1.5px solid var(--bg-2);border-radius:10px;padding:14px 10px;text-align:center;cursor:pointer;transition:all 0.15s;}
        .wd-method:hover{border-color:var(--bg-3);}
        .wd-method.active{border-color:var(--ink);background:#fff;}
        .wd-method-icon{margin-bottom:6px;display:flex;justify-content:center;color:var(--ink-faint);}
        .wd-method.active .wd-method-icon{color:var(--ink);}
        .wd-method-lbl{font-size:0.6rem;font-weight:600;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.06em;}
        .wd-method.active .wd-method-lbl{color:var(--ink);}
        .wd-amount-row{display:flex;align-items:center;background:var(--bg-1);border:1.5px solid var(--bg-2);border-radius:10px;padding:14px 16px;transition:border-color 0.15s;margin-bottom:12px;}
        .wd-amount-row:focus-within{border-color:var(--ink);}
        .wd-currency{font-size:1.2rem;font-weight:600;color:var(--ink-dim);margin-right:8px;}
        .wd-input{flex:1;border:none;background:transparent;outline:none;font-family:var(--sans);font-size:1.4rem;font-weight:700;color:var(--ink);letter-spacing:-0.02em;}
        .wd-input::placeholder{color:var(--bg-3);}
        .wd-quick{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
        .wd-quick-btn{background:var(--card);border:1px solid var(--bg-2);border-radius:8px;padding:6px 14px;font-family:var(--sans);font-size:0.7rem;font-weight:500;color:var(--ink-dim);cursor:pointer;transition:all 0.12s;}
        .wd-quick-btn:hover,.wd-quick-btn.active{background:var(--ink);border-color:var(--ink);color:#fff;}
        .wd-field{margin-bottom:12px;}
        .wd-field-label{display:block;font-size:0.58rem;font-weight:600;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;}
        .wd-field-input{width:100%;background:var(--bg-1);border:1.5px solid var(--bg-2);border-radius:10px;padding:10px 13px;font-family:var(--sans);font-size:0.8rem;color:var(--ink);outline:none;transition:border-color 0.15s;}
        .wd-field-input:focus{border-color:var(--ink);background:#fff;}
        .wd-field-input::placeholder{color:var(--bg-3);}
        .wd-submit{width:100%;background:var(--ink);color:#f0ece6;border:none;border-radius:12px;padding:15px;font-family:var(--sans);font-size:0.85rem;font-weight:700;cursor:pointer;transition:opacity 0.15s;margin-top:4px;display:flex;align-items:center;justify-content:center;gap:8px;}
        .wd-submit:hover{opacity:0.85;}
        .wd-submit:disabled{opacity:0.4;cursor:not-allowed;}
        .wd-err{font-size:0.65rem;color:var(--red);margin-top:8px;text-align:center;}
        .wd-success{display:flex;flex-direction:column;align-items:center;padding:10px 0 6px;text-align:center;}
        .wd-success-ico{width:64px;height:64px;border-radius:50%;background:var(--green-l);border:2px solid var(--green);display:flex;align-items:center;justify-content:center;font-size:1.8rem;margin-bottom:16px;}
        .wd-success-title{font-size:1.1rem;font-weight:700;color:var(--ink);margin-bottom:6px;}
        .wd-success-sub{font-size:0.72rem;font-weight:300;color:var(--ink-faint);margin-bottom:20px;line-height:1.6;}
        .wd-success-btn{background:var(--ink);color:#f0ece6;border:none;border-radius:10px;padding:12px 24px;font-family:var(--sans);font-size:0.78rem;font-weight:600;cursor:pointer;transition:opacity 0.15s;}
        .wd-success-btn:hover{opacity:0.85;}
        .wd-history-row{display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid var(--bg-2);}
        .wd-history-row:last-child{border-bottom:none;}
        .wd-history-ico{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .wd-spin{animation:spin 0.7s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg)}}
        .wd-empty{display:flex;flex-direction:column;align-items:center;padding:24px;gap:8px;color:var(--ink-faint);}
        .wd-empty p{font-size:0.7rem;font-weight:300;}
        .wd-warning{display:flex;gap:8px;background:var(--gold-l);border:1px solid #e8d48a;border-radius:10px;padding:10px 14px;margin-bottom:14px;}
        .wd-warning p{font-size:0.65rem;color:var(--gold);line-height:1.5;}
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
          <div style={{ fontSize: '2rem', opacity: 0.2 }}>↑</div>
        </div>

        {/* METHOD */}
        {!submitted && (
          <div className="wd-card">
            <div className="wd-card-stripe" />
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
            <div className="wd-card-stripe" />
            <p className="wd-section-lbl">Amount & Details</p>

            <div className="wd-warning">
              <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>⚠️</span>
              <p>Withdrawals are reviewed manually and typically processed within 1–3 business days. Minimum withdrawal is $50.</p>
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

            {/* Dynamic fields per method */}
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
              <div className="wd-success-ico">✓</div>
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
                background: w.status === 'APPROVED' ? 'var(--green-l)' : w.status === 'REJECTED' ? 'var(--red-l)' : 'var(--gold-l)',
                color: w.status === 'APPROVED' ? 'var(--green)' : w.status === 'REJECTED' ? 'var(--red)' : 'var(--gold)',
              }}>
                {w.status === 'APPROVED' ? <CheckCircle2 size={16} /> : w.status === 'REJECTED' ? <XCircle size={16} /> : <Clock size={16} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>
                  ${fmt(w.amount)} {w.currency}
                </p>
                <p style={{ fontSize: '0.6rem', color: 'var(--ink-faint)' }}>
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
