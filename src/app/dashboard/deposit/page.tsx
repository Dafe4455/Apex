'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, CheckCircle, Loader2, Clock, CheckCircle2, XCircle } from 'lucide-react';

type DepositMethod = {
  id: string;
  label: string;
  icon: string;
  address: string;
  network?: string;
  note?: string;
};

type Deposit = {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  methodLabel?: string;
  createdAt: string;
};

function fmt(n: number | null | undefined, d = 2) {
  return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatusBadge({ status }: { status: 'PENDING' | 'CONFIRMED' | 'REJECTED' }) {
  const map = {
    PENDING:   { bg: '#fdf3d0', col: '#8a6800', icon: '⏳' },
    CONFIRMED: { bg: '#e4f2ea', col: '#2e7d4f', icon: '✓' },
    REJECTED:  { bg: '#faeaea', col: '#b83232', icon: '✕' },
  };
  const s = map[status];
  return (
    <span style={{ background: s.bg, color: s.col, padding: '3px 10px', borderRadius: 20,
      fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
      fontFamily: 'var(--mono)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {s.icon} {status}
    </span>
  );
}

export default function DepositPage() {
  const [methods, setMethods]           = useState<DepositMethod[]>([]);
  const [methodsLoading, setML]         = useState(true);
  const [selectedMethod, setSelected]   = useState('');
  const [amount, setAmount]             = useState('');
  const [copied, setCopied]             = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const [submitErr, setSubmitErr]       = useState('');
  const [history, setHistory]           = useState<Deposit[]>([]);
  const [historyLoading, setHL]         = useState(true);

  const fetchMethods = useCallback(async () => {
    setML(true);
    try {
      const res = await fetch('/api/admin/deposit-methods');
      if (res.ok) {
        const d = await res.json();
        setMethods(d);
        if (d.length > 0) setSelected(d[0].id);
      }
    } finally { setML(false); }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHL(true);
    try {
      const res = await fetch('/api/user/deposits');
      if (res.ok) {
        const d = await res.json();
        setHistory(d.deposits ?? []);
      }
    } finally { setHL(false); }
  }, []);

  useEffect(() => {
    fetchMethods();
    fetchHistory();
  }, [fetchMethods, fetchHistory]);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) return;
    setSubmitting(true); setSubmitErr('');
    try {
      const active = methods.find(m => m.id === selectedMethod);
      const res = await fetch('/api/user/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          currency: 'USD',
          methodId: selectedMethod,
          methodLabel: active?.label,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSubmitErr(d.error ?? 'Failed to submit deposit');
        return;
      }
      setSubmitted(true);
      fetchHistory();
    } catch { setSubmitErr('Network error. Please try again.'); }
    finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setSubmitted(false);
    setAmount('');
    setSubmitErr('');
  };

  const active = methods.find(m => m.id === selectedMethod);

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
        .dp-wrap{max-width:480px;margin:0 auto;padding:20px 16px 60px;min-height:100vh;}
        .dp-back{display:inline-flex;align-items:center;gap:6px;font-size:0.7rem;font-weight:600;color:var(--ink-dim);text-decoration:none;margin-bottom:20px;padding:6px 12px;background:var(--card);border:1px solid var(--bg-2);border-radius:8px;transition:background 0.12s;}
        .dp-back:hover{background:var(--bg-2);}
        .dp-brand{font-family:var(--mono);font-size:0.58rem;letter-spacing:0.18em;color:var(--orange);text-transform:uppercase;margin-bottom:4px;}
        .dp-title{font-size:1.4rem;font-weight:700;color:var(--ink);letter-spacing:-0.02em;margin-bottom:4px;}
        .dp-sub{font-size:0.72rem;font-weight:300;color:var(--ink-faint);margin-bottom:24px;}
        .dp-card{background:var(--card);border:1px solid var(--bg-2);border-radius:var(--r);padding:20px;margin-bottom:12px;position:relative;overflow:hidden;}
        .dp-card-stripe{position:absolute;top:0;left:0;bottom:0;width:3px;background:var(--orange);border-radius:3px 0 0 3px;}
        .dp-section-lbl{font-size:0.6rem;font-weight:700;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;}
        .dp-method-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:0;}
        .dp-pill{padding:7px 16px;border-radius:20px;border:1.5px solid var(--bg-2);background:var(--card);font-family:var(--sans);font-size:0.72rem;font-weight:600;color:var(--ink-dim);cursor:pointer;transition:all 0.15s;}
        .dp-pill:hover{border-color:var(--bg-3);}
        .dp-pill.active{background:var(--orange);border-color:var(--orange);color:#fff;}
        .dp-address-box{background:var(--bg-1);border:1.5px solid var(--bg-2);border-radius:10px;padding:14px;margin-bottom:10px;}
        .dp-address-label{font-size:0.58rem;font-weight:600;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;}
        .dp-address-text{font-family:var(--mono);font-size:0.7rem;color:var(--ink);word-break:break-all;line-height:1.7;margin-bottom:12px;}
        .dp-copy-btn{width:100%;padding:10px;border-radius:8px;border:none;font-family:var(--sans);font-size:0.72rem;font-weight:600;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:6px;}
        .dp-network-tag{display:inline-flex;align-items:center;background:#e4eaf8;border-radius:6px;padding:3px 10px;margin-bottom:10px;}
        .dp-network-tag span{font-size:0.56rem;font-weight:700;color:#1a3d8a;letter-spacing:0.08em;text-transform:uppercase;}
        .dp-note{display:flex;gap:8px;background:var(--gold-l);border:1px solid #e8d48a;border-radius:10px;padding:10px 14px;margin-top:10px;}
        .dp-note p{font-size:0.65rem;color:var(--gold);font-weight:400;line-height:1.5;}
        .dp-amount-row{display:flex;align-items:center;background:var(--bg-1);border:1.5px solid var(--bg-2);border-radius:10px;padding:14px 16px;transition:border-color 0.15s;}
        .dp-amount-row:focus-within{border-color:var(--orange);}
        .dp-currency{font-size:1.2rem;font-weight:600;color:var(--ink-dim);margin-right:8px;}
        .dp-input{flex:1;border:none;background:transparent;outline:none;font-family:var(--sans);font-size:1.4rem;font-weight:700;color:var(--ink);letter-spacing:-0.02em;}
        .dp-input::placeholder{color:var(--bg-3);}
        .dp-quick{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;}
        .dp-quick-btn{background:var(--card);border:1px solid var(--bg-2);border-radius:8px;padding:6px 14px;font-family:var(--sans);font-size:0.7rem;font-weight:500;color:var(--ink-dim);cursor:pointer;transition:all 0.12s;}
        .dp-quick-btn:hover,.dp-quick-btn.active{background:var(--orange);border-color:var(--orange);color:#fff;}
        .dp-submit{width:100%;background:var(--orange);color:#fff;border:none;border-radius:12px;padding:15px;font-family:var(--sans);font-size:0.85rem;font-weight:700;cursor:pointer;transition:opacity 0.15s;margin-top:16px;display:flex;align-items:center;justify-content:center;gap:8px;}
        .dp-submit:hover{opacity:0.88;}
        .dp-submit:disabled{opacity:0.4;cursor:not-allowed;}
        .dp-err{font-size:0.65rem;color:var(--red);margin-top:8px;text-align:center;}
        .dp-success{display:flex;flex-direction:column;align-items:center;padding:10px 0 6px;text-align:center;}
        .dp-success-ico{width:64px;height:64px;border-radius:50%;background:var(--green-l);border:2px solid var(--green);display:flex;align-items:center;justify-content:center;font-size:1.8rem;margin-bottom:16px;}
        .dp-success-title{font-size:1.1rem;font-weight:700;color:var(--ink);margin-bottom:6px;}
        .dp-success-sub{font-size:0.72rem;font-weight:300;color:var(--ink-faint);margin-bottom:20px;line-height:1.6;}
        .dp-success-btn{background:var(--ink);color:#f0ece6;border:none;border-radius:10px;padding:12px 24px;font-family:var(--sans);font-size:0.78rem;font-weight:600;cursor:pointer;transition:opacity 0.15s;}
        .dp-success-btn:hover{opacity:0.85;}
        .dp-history{margin-top:4px;}
        .dp-history-row{display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid var(--bg-2);}
        .dp-history-row:last-child{border-bottom:none;}
        .dp-history-ico{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.8rem;}
        .dp-spin{animation:spin 0.7s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg)}}
        .dp-empty{display:flex;flex-direction:column;align-items:center;padding:24px;gap:8px;color:var(--ink-faint);}
        .dp-empty p{font-size:0.7rem;font-weight:300;}
      `}</style>

      <div className="dp-wrap">
        <Link href="/dashboard" className="dp-back">
          <ArrowLeft size={13} /> Back to Dashboard
        </Link>

        <p className="dp-brand">Apex · Markets</p>
        <h1 className="dp-title">Deposit Funds</h1>
        <p className="dp-sub">Send crypto or fiat to your account</p>

        {/* ── SELECT METHOD ── */}
        <div className="dp-card">
          <div className="dp-card-stripe" />
          <p className="dp-section-lbl">Select Method</p>
          {methodsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
              <Loader2 size={20} className="dp-spin" style={{ color: 'var(--ink-faint)' }} />
            </div>
          ) : methods.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ fontSize: '1.5rem', marginBottom: 8 }}>🔧</p>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>No deposit methods configured</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--ink-faint)', fontWeight: 300 }}>Please contact support.</p>
            </div>
          ) : (
            <div className="dp-method-pills">
              {methods.map(m => (
                <button key={m.id} className={`dp-pill${selectedMethod === m.id ? ' active' : ''}`}
                  onClick={() => setSelected(m.id)}>
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── ADDRESS ── */}
        {active && (
          <div className="dp-card">
            <div className="dp-card-stripe" />
            <p className="dp-section-lbl">Deposit Address</p>

            {active.network && (
              <div className="dp-network-tag">
                <span>Network: {active.network}</span>
              </div>
            )}

            <div className="dp-address-box">
              <p className="dp-address-label">Send {active.label} to this address</p>
              <p className="dp-address-text">{active.address}</p>
              <button
                className="dp-copy-btn"
                onClick={() => copyAddress(active.address)}
                style={{
                  background: copied ? 'var(--green-l)' : 'var(--bg-2)',
                  color: copied ? 'var(--green)' : 'var(--ink-dim)',
                }}
              >
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Address'}
              </button>
            </div>

            {active.note && (
              <div className="dp-note">
                <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>⚠️</span>
                <p>{active.note}</p>
              </div>
            )}
          </div>
        )}

        {/* ── CONFIRM AMOUNT ── */}
        {active && !submitted && (
          <div className="dp-card">
            <div className="dp-card-stripe" />
            <p className="dp-section-lbl">Confirm Amount Sent</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--ink-faint)', marginBottom: 14, lineHeight: 1.5 }}>
              After sending, enter the USD value below and click confirm. Your deposit will be reviewed and credited shortly.
            </p>

            <div className="dp-amount-row">
              <span className="dp-currency">$</span>
              <input
                className="dp-input"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="0"
              />
            </div>

            <div className="dp-quick">
              {['100', '500', '1000', '5000'].map(q => (
                <button key={q} className={`dp-quick-btn${amount === q ? ' active' : ''}`}
                  onClick={() => setAmount(q)}>${q}</button>
              ))}
            </div>

            {submitErr && <p className="dp-err">{submitErr}</p>}

            <button
              className="dp-submit"
              disabled={!amount || Number(amount) <= 0 || submitting}
              onClick={handleSubmit}
            >
              {submitting
                ? <><Loader2 size={16} className="dp-spin" /> Submitting…</>
                : `I've Sent $${amount || '0'} — Confirm Deposit`}
            </button>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {submitted && (
          <div className="dp-card">
            <div className="dp-success">
              <div className="dp-success-ico">✓</div>
              <p className="dp-success-title">Deposit Submitted</p>
              <p className="dp-success-sub">
                Your deposit of <strong>${fmt(Number(amount))}</strong> via {active?.label} has been submitted.<br />
                It will be reviewed and credited to your account within 1–24 hours.
              </p>
              <button className="dp-success-btn" onClick={resetForm}>Make Another Deposit</button>
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        <div className="dp-card" style={{ marginTop: 4 }}>
          <p className="dp-section-lbl">Deposit History</p>
          {historyLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
              <Loader2 size={18} className="dp-spin" style={{ color: 'var(--ink-faint)' }} />
            </div>
          ) : history.length === 0 ? (
            <div className="dp-empty">
              <Clock size={22} style={{ opacity: 0.25 }} />
              <p>No deposits yet</p>
            </div>
          ) : (
            <div className="dp-history">
              {history.map(d => (
                <div key={d.id} className="dp-history-row">
                  <div className="dp-history-ico" style={{
                    background: d.status === 'CONFIRMED' ? 'var(--green-l)' : d.status === 'REJECTED' ? 'var(--red-l)' : 'var(--gold-l)',
                    color: d.status === 'CONFIRMED' ? 'var(--green)' : d.status === 'REJECTED' ? 'var(--red)' : 'var(--gold)',
                  }}>
                    {d.status === 'CONFIRMED' ? <CheckCircle2 size={16} /> : d.status === 'REJECTED' ? <XCircle size={16} /> : <Clock size={16} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>
                      ${fmt(d.amount)} {d.currency}
                    </p>
                    <p style={{ fontSize: '0.6rem', color: 'var(--ink-faint)' }}>
                      {d.methodLabel && `${d.methodLabel} · `}{fmtDate(d.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
