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
    PENDING:   { bg: 'rgba(251,191,36,0.1)',  col: '#fbbf24', border: 'rgba(251,191,36,0.25)',  label: 'Pending'   },
    CONFIRMED: { bg: 'rgba(34,212,122,0.1)',  col: '#22d47a', border: 'rgba(34,212,122,0.25)',  label: 'Confirmed' },
    REJECTED:  { bg: 'rgba(248,113,113,0.1)', col: '#f87171', border: 'rgba(248,113,113,0.25)', label: 'Rejected'  },
  };
  const s = map[status];
  return (
    <span style={{
      background: s.bg, color: s.col,
      border: `1px solid ${s.border}`,
      padding: '2px 9px', borderRadius: 20,
      fontSize: '0.55rem', fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      fontFamily: 'var(--mono)', whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

export default function DepositPage() {
  const [methods, setMethods]         = useState<DepositMethod[]>([]);
  const [methodsLoading, setML]       = useState(true);
  const [selectedMethod, setSelected] = useState('');
  const [amount, setAmount]           = useState('');
  const [copied, setCopied]           = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [submitErr, setSubmitErr]     = useState('');
  const [history, setHistory]         = useState<Deposit[]>([]);
  const [historyLoading, setHL]       = useState(true);

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

  useEffect(() => { fetchMethods(); fetchHistory(); }, [fetchMethods, fetchHistory]);

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

  const resetForm = () => { setSubmitted(false); setAmount(''); setSubmitErr(''); };
  const active = methods.find(m => m.id === selectedMethod);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:      #0b1623;
          --card:    #0f1e2e;
          --card-2:  #0d1a28;
          --border:  rgba(255,255,255,0.07);
          --border-2:rgba(255,255,255,0.12);
          --orange:  #f97316;
          --orange-d:rgba(249,115,22,0.12);
          --orange-b:rgba(249,115,22,0.25);
          --cyan:    #00c9b1;
          --text:    #e2eaf4;
          --mid:     #7b9ab5;
          --dim:     #4a6a84;
          --green:   #22d47a;
          --red:     #f87171;
          --yellow:  #fbbf24;
          --mono:    'Space Mono', monospace;
          --sans:    'Space Grotesk', sans-serif;
        }
        body { background: var(--bg); font-family: var(--sans); color: var(--text); }

        .dp-wrap { max-width: 480px; margin: 0 auto; padding: 20px 16px 80px; min-height: 100vh; }

        .dp-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.68rem; font-weight: 600; color: var(--dim);
          text-decoration: none; margin-bottom: 24px;
          padding: 7px 14px; background: var(--card);
          border: 1px solid var(--border); border-radius: 8px;
          transition: all 0.15s;
        }
        .dp-back:hover { color: var(--mid); border-color: var(--border-2); }

        .dp-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 12px;
          position: relative;
          overflow: hidden;
        }
        .dp-card-accent {
          position: absolute; top: 0; left: 0; bottom: 0;
          width: 3px; background: var(--orange); border-radius: 3px 0 0 3px;
        }

        .dp-section-lbl {
          font-family: var(--mono); font-size: 0.58rem; font-weight: 700;
          color: var(--dim); text-transform: uppercase;
          letter-spacing: 0.12em; margin-bottom: 14px;
        }

        /* Method pills */
        .dp-pill {
          padding: 8px 18px; border-radius: 20px;
          border: 1px solid var(--border);
          background: var(--card-2);
          font-family: var(--sans); font-size: 0.72rem; font-weight: 600;
          color: var(--mid); cursor: pointer; transition: all 0.15s;
        }
        .dp-pill:hover { border-color: var(--border-2); color: var(--text); }
        .dp-pill.active {
          background: var(--orange-d); border-color: var(--orange-b);
          color: var(--orange);
        }

        /* Address box */
        .dp-address-box {
          background: var(--card-2); border: 1px solid var(--border);
          border-radius: 12px; padding: 16px; margin-bottom: 12px;
        }
        .dp-address-label {
          font-family: var(--mono); font-size: 0.55rem; font-weight: 700;
          color: var(--dim); text-transform: uppercase;
          letter-spacing: 0.1em; margin-bottom: 10px;
        }
        .dp-address-text {
          font-family: var(--mono); font-size: 0.72rem; color: var(--text);
          word-break: break-all; line-height: 1.8; margin-bottom: 14px;
          padding: 10px 12px; background: rgba(255,255,255,0.03);
          border-radius: 8px; border: 1px solid var(--border);
        }
        .dp-copy-btn {
          width: 100%; padding: 10px; border-radius: 8px; border: none;
          font-family: var(--sans); font-size: 0.72rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }

        /* Network tag */
        .dp-network-tag {
          display: inline-flex; align-items: center;
          background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.2);
          border-radius: 6px; padding: 3px 10px; margin-bottom: 14px;
        }
        .dp-network-tag span {
          font-family: var(--mono); font-size: 0.56rem; font-weight: 700;
          color: #38bdf8; letter-spacing: 0.08em; text-transform: uppercase;
        }

        /* Warning note */
        .dp-note {
          display: flex; gap: 10px;
          background: rgba(251,191,36,0.06); border: 1px solid rgba(251,191,36,0.2);
          border-radius: 10px; padding: 12px 14px; margin-top: 4px;
        }
        .dp-note p { font-size: 0.65rem; color: var(--yellow); line-height: 1.6; }

        /* Amount input */
        .dp-amount-row {
          display: flex; align-items: center;
          background: var(--card-2); border: 1px solid var(--border);
          border-radius: 12px; padding: 14px 18px;
          transition: border-color 0.15s;
        }
        .dp-amount-row:focus-within { border-color: var(--orange); }
        .dp-currency { font-family: var(--mono); font-size: 1.1rem; font-weight: 700; color: var(--orange); margin-right: 8px; }
        .dp-input {
          flex: 1; border: none; background: transparent; outline: none;
          font-family: var(--sans); font-size: 1.4rem; font-weight: 700;
          color: var(--text); letter-spacing: -0.02em;
        }
        .dp-input::placeholder { color: var(--dim); }

        /* Quick amounts */
        .dp-quick { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
        .dp-quick-btn {
          background: var(--card-2); border: 1px solid var(--border);
          border-radius: 8px; padding: 6px 16px;
          font-family: var(--mono); font-size: 0.65rem; font-weight: 600;
          color: var(--dim); cursor: pointer; transition: all 0.12s;
        }
        .dp-quick-btn:hover { border-color: var(--orange-b); color: var(--orange); }
        .dp-quick-btn.active { background: var(--orange-d); border-color: var(--orange-b); color: var(--orange); }

        /* Submit */
        .dp-submit {
          width: 100%; background: var(--orange); color: #fff;
          border: none; border-radius: 12px; padding: 15px;
          font-family: var(--sans); font-size: 0.85rem; font-weight: 700;
          cursor: pointer; transition: all 0.15s; margin-top: 16px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 24px rgba(249,115,22,0.25);
          letter-spacing: 0.02em;
        }
        .dp-submit:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
        .dp-submit:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

        /* History rows */
        .dp-history-row {
          display: flex; align-items: center; gap: 12px;
          padding: 13px 0; border-bottom: 1px solid var(--border);
        }
        .dp-history-row:last-child { border-bottom: none; }

        .dp-spin { animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { to { background-position: -200% 0; } }
      `}</style>

      <div className="dp-wrap">

        <Link href="/dashboard/wallet" className="dp-back">
          <ArrowLeft size={13} /> Back
        </Link>

        {/* ── HEADER ── */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', letterSpacing: '0.18em', color: 'var(--orange)', textTransform: 'uppercase', marginBottom: 6 }}>
            Apex · Markets
          </p>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Deposit Funds
          </h1>
          <p style={{ fontSize: '0.72rem', color: 'var(--dim)', fontWeight: 300 }}>
            Send crypto or fiat to your account
          </p>
        </div>

        {/* ── SELECT METHOD ── */}
        <div className="dp-card">
          <div className="dp-card-accent" />
          <p className="dp-section-lbl">Select Method</p>
          {methodsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
              <Loader2 size={20} className="dp-spin" style={{ color: 'var(--dim)' }} />
            </div>
          ) : methods.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: '1.5rem', marginBottom: 8 }}>🔧</p>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>No deposit methods configured</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--dim)' }}>Please contact support.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
            <div className="dp-card-accent" />
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
                  background: copied ? 'rgba(34,212,122,0.1)' : 'rgba(255,255,255,0.05)',
                  color: copied ? 'var(--green)' : 'var(--mid)',
                  border: `1px solid ${copied ? 'rgba(34,212,122,0.2)' : 'var(--border)'}`,
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
            <div className="dp-card-accent" />
            <p className="dp-section-lbl">Confirm Amount Sent</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--dim)', marginBottom: 16, lineHeight: 1.6 }}>
              After sending, enter the USD value below. Your deposit will be reviewed and credited shortly.
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
                  onClick={() => setAmount(q)}>
                  ${q}
                </button>
              ))}
            </div>

            {submitErr && (
              <p style={{ fontSize: '0.65rem', color: 'var(--red)', marginTop: 10, textAlign: 'center' }}>
                {submitErr}
              </p>
            )}

            <button
              className="dp-submit"
              disabled={!amount || Number(amount) <= 0 || submitting}
              onClick={handleSubmit}
            >
              {submitting
                ? <><Loader2 size={16} className="dp-spin" /> Submitting…</>
                : `Confirm $${amount || '0'} Deposit`
              }
            </button>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {submitted && (
          <div className="dp-card">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0 8px', textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(34,212,122,0.1)', border: '2px solid rgba(34,212,122,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                <CheckCircle2 size={28} color="var(--green)" />
              </div>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                Deposit Submitted
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--dim)', marginBottom: 24, lineHeight: 1.7 }}>
                Your deposit of <span style={{ color: 'var(--green)', fontWeight: 600 }}>${fmt(Number(amount))}</span> via {active?.label} is under review.<br />
                Funds will be credited within 1–24 hours.
              </p>
              <button
                onClick={resetForm}
                style={{
                  background: 'var(--orange-d)', border: '1px solid var(--orange-b)',
                  color: 'var(--orange)', borderRadius: 10, padding: '11px 24px',
                  fontFamily: 'var(--sans)', fontSize: '0.78rem', fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Make Another Deposit
              </button>
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        <div className="dp-card" style={{ marginTop: 4 }}>
          <p className="dp-section-lbl">Deposit History</p>
          {historyLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
              <Loader2 size={18} className="dp-spin" style={{ color: 'var(--dim)' }} />
            </div>
          ) : history.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px', gap: 8, color: 'var(--dim)' }}>
              <Clock size={22} strokeWidth={1.5} />
              <p style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', letterSpacing: '0.06em' }}>No deposits yet</p>
            </div>
          ) : (
            <div>
              {history.map(d => (
                <div key={d.id} className="dp-history-row">
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: d.status === 'CONFIRMED' ? 'rgba(34,212,122,0.1)'
                      : d.status === 'REJECTED' ? 'rgba(248,113,113,0.1)'
                      : 'rgba(251,191,36,0.1)',
                    color: d.status === 'CONFIRMED' ? 'var(--green)'
                      : d.status === 'REJECTED' ? 'var(--red)'
                      : 'var(--yellow)',
                  }}>
                    {d.status === 'CONFIRMED' ? <CheckCircle2 size={16} />
                      : d.status === 'REJECTED' ? <XCircle size={16} />
                      : <Clock size={16} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
                      ${fmt(d.amount)} <span style={{ color: 'var(--dim)', fontWeight: 400 }}>{d.currency}</span>
                    </p>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--dim)' }}>
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
