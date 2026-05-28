'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

type Transaction = {
  id: string;
  type: 'Deposit' | 'Withdrawal' | 'Trade';
  asset: string;
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  createdAt: string;
};

type MarketAsset = {
  symbol: string;
  name: string;
  price: number | null;
  changePercent: number | null;
};

function Sparkline({ positive = true }: { positive?: boolean }) {
  const pts = positive
    ? '0,28 10,20 20,24 30,12 40,16 50,4 60,8 72,0'
    : '0,4 10,12 20,8 30,20 40,16 50,28 60,24 72,32';
  return (
    <svg width="80" height="24" viewBox="0 0 72 32" fill="none">
      <polyline points={pts} fill="none"
        stroke={positive ? '#16a34a' : '#c9170a'}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'COMPLETED' || status === 'Completed' ? 'status-completed'
    : status === 'PENDING'  || status === 'Pending'  ? 'status-pending'
    : 'status-failed';
  return <span className={`db-status ${cls}`}>{status}</span>;
}

function MetricCard({
  label, value, sub, delta, positive, children, accent,
}: {
  label: string; value: string; sub?: string;
  delta?: string; positive?: boolean;
  children?: React.ReactNode; accent?: boolean;
}) {
  return (
    <div className={`db-metric-card ${accent ? 'accent' : ''}`}>
      <div className="db-metric-top">
        <span className="db-metric-label">{label}</span>
        {delta && (
          <span className={`db-metric-delta ${positive ? 'positive' : 'negative'}`}>{delta}</span>
        )}
      </div>
      <p className="db-metric-value">{value}</p>
      {sub && <p className="db-metric-sub">{sub}</p>}
      {children}
    </div>
  );
}

function fmt(n: number | null | undefined, decimals = 2) {
  return (n ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [markets, setMarkets]           = useState<MarketAsset[]>([]);
  const [loading, setLoading]           = useState(true);
  const [balanceOpen, setBalanceOpen]   = useState(false);
  const [time, setTime]                 = useState('');

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/market');
        const data = await res.json();
        if (Array.isArray(data)) setMarkets(data);
      } catch {}
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/user/dashboard');
        if (res.ok) {
          const data = await res.json();
          setTransactions(data.transactions ?? []);
        }
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const balance       = 24_850.00;
  const changePercent = 3.42;
  const changePos     = changePercent >= 0;
  const profit        = 842.30;

  const statusClass = (s: string) =>
    s === 'COMPLETED' || s === 'Completed' ? 'status-completed'
    : s === 'PENDING'  || s === 'Pending'  ? 'status-pending'
    : 'status-failed';

  return (
    <>
      <style>{`
        :root {
          --cream: #f5f0e8;
          --cream-dark: #ede7d9;
          --cream-darker: #e0d9cc;
          --ink: #1a1512;
          --ink-mid: #3d352e;
          --ink-light: #7a6e65;
          --red: #c9170a;
          --serif: 'Playfair Display', Georgia, serif;
          --mono: 'DM Mono', monospace;
          --sans: 'Manrope', sans-serif;
        }

        .db-greeting { margin-bottom: 32px; }
        .db-greeting-tag {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--red);
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .db-greeting-tag::before {
          content: '';
          display: inline-block;
          width: 16px; height: 1px;
          background: var(--red);
        }
        .db-greeting-name {
          font-family: var(--serif);
          font-size: 1.8rem;
          font-weight: 900;
          color: var(--ink);
          line-height: 1.1;
        }
        .db-greeting-name em { font-style: italic; color: var(--red); }

        /* ── BALANCE CARD ── */
        .db-balance-card {
          background: var(--ink);
          padding: 32px 36px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: box-shadow 0.2s;
        }
        .db-balance-card:hover { box-shadow: 0 20px 60px rgba(26,21,18,0.15); }
        .db-balance-card::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 200px; height: 200px;
          border: 1px solid rgba(255,255,255,0.03);
          border-radius: 50%;
        }
        .db-balance-card::after {
          content: '';
          position: absolute;
          top: -30px; right: -30px;
          width: 130px; height: 130px;
          border: 1px solid rgba(255,255,255,0.025);
          border-radius: 50%;
        }
        .db-balance-inner { position: relative; z-index: 1; }
        .db-balance-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        .db-balance-label {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #555;
          margin-bottom: 10px;
        }
        .db-balance-amount {
          font-family: var(--serif);
          font-size: clamp(2.2rem, 4vw, 3rem);
          font-weight: 900;
          color: var(--cream);
          line-height: 1;
        }
        .db-balance-change {
          font-family: var(--mono);
          font-size: 0.78rem;
          margin-top: 8px;
          letter-spacing: 0.05em;
        }
        .db-balance-change.pos { color: #4ade80; }
        .db-balance-change.neg { color: #fb7185; }
        .db-balance-actions { display: flex; gap: 10px; }
        .db-balance-btn {
          font-family: var(--mono);
          font-size: 0.68rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 10px 20px;
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
        }
        .db-balance-btn.primary { background: var(--red); color: white; }
        .db-balance-btn.primary:hover { background: #9e1108; }
        .db-balance-btn.ghost {
          background: transparent;
          color: #888;
          border: 1px solid #2a2420;
        }
        .db-balance-btn.ghost:hover { border-color: #444; color: var(--cream); }
        .db-balance-footer {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-top: 16px;
          margin-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .db-balance-meta {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #444;
        }
        .db-live-dot {
          width: 6px; height: 6px;
          background: #4ade80;
          border-radius: 50%;
          animation: dbpulse 2s ease infinite;
        }
        @keyframes dbpulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(0.8); }
        }
        .db-balance-expand {
          overflow: hidden;
          transition: max-height 0.35s ease;
        }

        /* ── METRICS ── */
        .db-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--cream-darker);
          margin-bottom: 24px;
        }
        .db-metric-card {
          background: var(--cream);
          padding: 24px;
          transition: background 0.15s;
          position: relative;
          overflow: hidden;
        }
        .db-metric-card:hover { background: var(--cream-dark); }
        .db-metric-card.accent { background: var(--cream-dark); }
        .db-metric-card.accent::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 2px;
          background: var(--red);
        }
        .db-metric-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .db-metric-label {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-light);
          font-weight: 500;
        }
        .db-metric-delta {
          font-family: var(--mono);
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.04em;
        }
        .db-metric-delta.positive { color: #16a34a; }
        .db-metric-delta.negative { color: var(--red); }
        .db-metric-value {
          font-family: var(--serif);
          font-size: 1.7rem;
          font-weight: 900;
          color: var(--ink);
          line-height: 1;
          margin-bottom: 4px;
        }
        .db-metric-sub {
          font-family: var(--mono);
          font-size: 0.62rem;
          color: var(--ink-light);
          letter-spacing: 0.04em;
        }

        /* ── SECTION HEADER ── */
        .db-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .db-section-title {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink-mid);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .db-section-title::before {
          content: '';
          display: inline-block;
          width: 14px; height: 1px;
          background: var(--red);
        }
        .db-section-link {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--red);
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .db-section-link:hover { opacity: 0.7; }

        /* ── MARKET GRID ── */
        .db-market-section { margin-bottom: 24px; }
        .db-market-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: var(--cream-darker);
        }
        .db-market-card {
          background: var(--cream);
          padding: 18px 20px;
          transition: background 0.15s;
          cursor: pointer;
          text-decoration: none;
          display: block;
        }
        .db-market-card:hover { background: var(--cream-dark); }
        .db-market-sym {
          font-family: var(--mono);
          font-size: 0.72rem;
          font-weight: 500;
          color: var(--ink);
          letter-spacing: 0.08em;
          margin-bottom: 2px;
        }
        .db-market-name {
          font-size: 0.72rem;
          color: var(--ink-light);
          margin-bottom: 12px;
          font-weight: 300;
        }
        .db-market-price {
          font-family: var(--serif);
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 3px;
        }
        .db-market-chg {
          font-family: var(--mono);
          font-size: 0.65rem;
          letter-spacing: 0.04em;
        }
        .db-market-chg.up { color: #16a34a; }
        .db-market-chg.dn { color: var(--red); }

        /* ── QUICK ACTIONS ── */
        .db-quick-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1px;
          background: var(--cream-darker);
          margin-bottom: 24px;
        }
        .db-action-card {
          background: var(--cream);
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          text-decoration: none;
          transition: background 0.15s;
          position: relative;
          overflow: hidden;
        }
        .db-action-card:hover { background: var(--cream-dark); }
        .db-action-card::after {
          content: '→';
          position: absolute;
          right: 20px;
          font-family: var(--mono);
          font-size: 0.9rem;
          color: var(--cream-darker);
          transition: color 0.2s, transform 0.2s;
        }
        .db-action-card:hover::after { color: var(--red); transform: translateX(3px); }
        .db-action-icon {
          width: 40px; height: 40px;
          border: 1px solid var(--cream-darker);
          display: flex; align-items: center; justify-content: center;
          color: var(--red);
          flex-shrink: 0;
          transition: border-color 0.15s, background 0.15s;
        }
        .db-action-card:hover .db-action-icon {
          border-color: var(--red);
          background: rgba(201,23,10,0.06);
        }
        .db-action-label {
          font-family: var(--serif);
          font-size: 1rem;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 2px;
        }
        .db-action-desc {
          font-size: 0.75rem;
          color: var(--ink-light);
          font-weight: 300;
        }

        /* ── TRANSACTIONS ── */
        .db-tx-section { margin-bottom: 24px; }
        .db-tx-table-wrap {
          background: var(--cream);
          border: 1px solid var(--cream-darker);
          overflow-x: auto;
        }
        .db-tx-table {
          width: 100%;
          border-collapse: collapse;
        }
        .db-tx-table th {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--ink-light);
          padding: 14px 20px;
          text-align: left;
          border-bottom: 1px solid var(--cream-darker);
          font-weight: 500;
        }
        .db-tx-table td {
          padding: 14px 20px;
          font-size: 0.82rem;
          color: var(--ink-mid);
          border-bottom: 1px solid var(--cream-darker);
        }
        .db-tx-table tr:last-child td { border-bottom: none; }
        .db-tx-table tr:hover td { background: var(--cream-dark); }
        .db-tx-type {
          font-family: var(--mono);
          font-size: 0.72rem;
          font-weight: 500;
        }
        .db-tx-type.deposit    { color: #16a34a; }
        .db-tx-type.withdrawal { color: var(--red); }
        .db-tx-type.trade      { color: var(--ink-mid); }
        .db-tx-amount {
          font-family: var(--mono);
          font-size: 0.78rem;
          color: var(--ink);
          font-weight: 500;
        }
        .db-tx-asset { font-family: var(--mono); font-size: 0.72rem; color: var(--ink-light); }
        .db-tx-date  { font-family: var(--mono); font-size: 0.68rem; color: var(--ink-light); }

        .db-status {
          font-family: var(--mono);
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 3px 8px;
          border: 1px solid;
        }
        .status-completed { color: #16a34a; background: rgba(22,163,74,0.06);   border-color: rgba(22,163,74,0.2); }
        .status-pending   { color: #d97706; background: rgba(217,119,6,0.06);   border-color: rgba(217,119,6,0.2); }
        .status-failed    { color: var(--red); background: rgba(201,23,10,0.06); border-color: rgba(201,23,10,0.2); }

        .db-loading {
          display: flex; align-items: center; justify-content: center; padding: 60px;
        }
        .db-spinner {
          width: 20px; height: 20px;
          border: 1.5px solid var(--cream-darker);
          border-top-color: var(--red);
          border-radius: 50%;
          animation: dbspin 0.7s linear infinite;
        }
        @keyframes dbspin { to { transform: rotate(360deg); } }
        .db-empty {
          padding: 40px; text-align: center;
          font-family: var(--mono); font-size: 0.72rem;
          letter-spacing: 0.1em; color: var(--ink-light); text-transform: uppercase;
        }

        @media (max-width: 768px) {
          .db-metrics        { grid-template-columns: 1fr 1fr; }
          .db-market-grid    { grid-template-columns: 1fr 1fr; }
          .db-quick-actions  { grid-template-columns: 1fr; }
          .db-balance-top    { flex-direction: column; gap: 16px; }
        }
      `}</style>

      {/* GREETING */}
      <div className="db-greeting">
        <p className="db-greeting-tag">Good day</p>
        <h1 className="db-greeting-name">
          Welcome back, <em>{session?.user?.name?.split(' ')[0] ?? 'Trader'}</em>
        </h1>
      </div>

      {/* BALANCE CARD */}
      <div className="db-balance-card" onClick={() => setBalanceOpen((v) => !v)}>
        <div className="db-balance-inner">
          <div className="db-balance-top">
            <div>
              <p className="db-balance-label">Net Asset Value — USD</p>
              <p className="db-balance-amount">${fmt(balance)}</p>
              <p className={`db-balance-change ${changePos ? 'pos' : 'neg'}`}>
                {changePos ? '▲' : '▼'} {changePos ? '+' : ''}{fmt(changePercent)}% this period
              </p>
            </div>
            <div className="db-balance-actions" onClick={(e) => e.stopPropagation()}>
              <Link href="/dashboard/deposit"  className="db-balance-btn primary">Deposit</Link>
              <Link href="/dashboard/withdraw" className="db-balance-btn ghost">Withdraw</Link>
            </div>
          </div>

          <div className="db-balance-footer">
            <div className="db-live-dot" />
            <span className="db-balance-meta">Pricing live</span>
            <span className="db-balance-meta" style={{ color: '#333' }}>·</span>
            <span className="db-balance-meta">{time}</span>
            <span className="db-balance-meta" style={{ color: '#333' }}>·</span>
            <span className="db-balance-meta">Session active</span>
            <span className="db-balance-meta" style={{ marginLeft: 'auto', color: '#444' }}>
              {balanceOpen ? '↑ Hide' : '↓ Transactions'}
            </span>
          </div>

          {/* Expandable transactions */}
          <div className="db-balance-expand" style={{ maxHeight: balanceOpen ? 400 : 0 }}>
            <div
              style={{ paddingTop: 20, marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <p style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#555', marginBottom: 12 }}>
                Recent Transactions
              </p>
              {transactions.length === 0 ? (
                <p style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: '#444' }}>No transactions yet.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Type', 'Asset', 'Amount', 'Status'].map((h) => (
                        <th key={h} style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#444', paddingBottom: 8, textAlign: 'left', paddingRight: 16 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 5).map((tx) => (
                      <tr key={tx.id}>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: tx.type === 'Deposit' ? '#4ade80' : '#fb7185', paddingBottom: 8, paddingRight: 16 }}>{tx.type}</td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: '#888', paddingBottom: 8, paddingRight: 16 }}>{tx.asset || 'USD'}</td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: '#c8bfb5', paddingBottom: 8, paddingRight: 16 }}>${fmt(tx.amount, 0)}</td>
                        <td style={{ paddingBottom: 8 }}>
                          <span className={`db-status ${statusClass(tx.status)}`}>{tx.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* METRICS */}
      <div className="db-metrics">
        <MetricCard
          label="Realised Profit"
          value={`$${fmt(profit)}`}
          delta={`+${fmt(changePercent)}%`}
          positive={changePos}
          sub="Current period"
          accent
        >
          <div style={{ marginTop: 10 }}><Sparkline positive={changePos} /></div>
        </MetricCard>
        <MetricCard label="Open Positions" value="3" sub="2 profitable · 1 at loss" />
        <MetricCard label="Risk Profile" value="Conservative" sub="Volatility: 0.4%">
          <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
            {[1,2,3,4,5].map((i) => (
              <div key={i} style={{
                height: 2, flex: 1,
                background: i < 3 ? '#16a34a' : 'var(--cream-darker)',
              }} />
            ))}
          </div>
        </MetricCard>
      </div>

      {/* QUICK ACTIONS */}
      <div className="db-quick-actions">
        <Link href="/dashboard/deposit" className="db-action-card">
          <div className="db-action-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2v10M6 9l3 3 3-3M2 14h14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" />
            </svg>
          </div>
          <div>
            <p className="db-action-label">Deposit Funds</p>
            <p className="db-action-desc">Add funds to your trading account</p>
          </div>
        </Link>
        <Link href="/dashboard/trade" className="db-action-card">
          <div className="db-action-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 13l4-5 4 3 5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" strokeLinejoin="miter" />
              <circle cx="14" cy="5" r="2" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </div>
          <div>
            <p className="db-action-label">Start Trading</p>
            <p className="db-action-desc">Access 180+ instruments live</p>
          </div>
        </Link>
      </div>

      {/* MARKET PREVIEW */}
      <div className="db-market-section">
        <div className="db-section-header">
          <p className="db-section-title">Live Markets</p>
          <Link href="/dashboard/markets" className="db-section-link">View all →</Link>
        </div>
        <div className="db-market-grid">
          {markets.length === 0
            ? ['BTC', 'ETH', 'NVDA', 'GOLD'].map((sym) => (
                <div key={sym} className="db-market-card">
                  <div className="db-market-sym">{sym}</div>
                  <div className="db-market-name" style={{ color: 'var(--cream-darker)' }}>Loading...</div>
                  <div className="db-market-price" style={{ color: 'var(--cream-darker)' }}>——</div>
                </div>
              ))
            : markets.slice(0, 4).map((a) => {
                const price = a.price ?? 0;
                const chg   = a.changePercent ?? 0;
                const pos   = chg >= 0;
                return (
                  <Link key={a.symbol} href={`/dashboard/trade?asset=${a.symbol}`} className="db-market-card">
                    <div className="db-market-sym">{a.symbol}</div>
                    <div className="db-market-name">{a.name}</div>
                    <div className="db-market-price">${fmt(price)}</div>
                    <div className={`db-market-chg ${pos ? 'up' : 'dn'}`}>
                      {pos ? '+' : ''}{fmt(chg)}%
                    </div>
                  </Link>
                );
              })}
        </div>
      </div>

      {/* TRANSACTION TABLE */}
      <div className="db-tx-section">
        <div className="db-section-header">
          <p className="db-section-title">Execution History</p>
        </div>
        <div className="db-tx-table-wrap">
          {loading ? (
            <div className="db-loading"><div className="db-spinner" /></div>
          ) : transactions.length === 0 ? (
            <div className="db-empty">No transactions yet</div>
          ) : (
            <table className="db-tx-table">
              <thead>
                <tr>
                  <th>Type</th><th>Asset</th><th>Amount</th><th>Date</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 8).map((tx) => (
                  <tr key={tx.id}>
                    <td><span className={`db-tx-type ${tx.type.toLowerCase()}`}>{tx.type}</span></td>
                    <td><span className="db-tx-asset">{tx.asset || 'USD'}</span></td>
                    <td><span className="db-tx-amount">${fmt(tx.amount, 0)}</span></td>
                    <td>
                      <span className="db-tx-date">
                        {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td><StatusBadge status={tx.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
