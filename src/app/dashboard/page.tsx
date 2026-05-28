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

function fmt(n: number | null | undefined, decimals = 2) {
  return (n ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function Sparkline({ positive = true }: { positive?: boolean }) {
  const pts = positive
    ? '0,22 12,16 24,18 36,8 48,12 60,4 72,6 84,0'
    : '0,0 12,6 24,4 36,14 48,10 60,18 72,16 84,22';
  return (
    <svg width="84" height="22" viewBox="0 0 84 22" fill="none">
      <polyline points={pts} fill="none"
        stroke={positive ? '#16a34a' : '#c9170a'}
        strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [markets, setMarkets]           = useState<MarketAsset[]>([]);
  const [loading, setLoading]           = useState(true);
  const [balanceOpen, setBalanceOpen]   = useState(false);
  const [time, setTime]                 = useState('');
  const [tick, setTick]                 = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setTick((t) => t + 1);
    }, 1000);
    setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
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
  const firstName     = session?.user?.name?.split(' ')[0] ?? 'TRADER';

  return (
    <>
      <style>{`
        :root {
          --cr:  #f5f0e8;
          --crd: #ede7d9;
          --crx: #e0d9cc;
          --ink: #1a1512;
          --inm: #3d352e;
          --inl: #7a6e65;
          --red: #c9170a;
          --redd:#9e1108;
          --mono:'DM Mono', 'Courier New', monospace;
          --sans:'Manrope', system-ui, sans-serif;
        }

        /* ── HEADER ROW ── */
        .t-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--crx);
          margin-bottom: 20px;
        }
        .t-header-left { display: flex; flex-direction: column; gap: 4px; }
        .t-uid {
          font-family: var(--mono);
          font-size: 0.58rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--inl);
        }
        .t-uid span { color: var(--red); }
        .t-name {
          font-family: var(--mono);
          font-size: 1rem;
          font-weight: 500;
          color: var(--ink);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .t-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .t-clock {
          font-family: var(--mono);
          font-size: 0.7rem;
          color: var(--inl);
          letter-spacing: 0.08em;
          min-width: 72px;
          text-align: right;
        }
        .t-live-pill {
          font-family: var(--mono);
          font-size: 0.55rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #16a34a;
          background: rgba(22,163,74,0.08);
          border: 1px solid rgba(22,163,74,0.2);
          padding: 3px 8px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .t-live-dot {
          width: 5px; height: 5px;
          background: #16a34a;
          border-radius: 50%;
          animation: tpulse 2s ease infinite;
        }
        @keyframes tpulse {
          0%,100% { opacity: 1; } 50% { opacity: 0.3; }
        }

        /* ── BALANCE PANEL ── */
        .t-balance {
          background: var(--ink);
          padding: 0;
          margin-bottom: 1px;
          position: relative;
          overflow: hidden;
        }
        .t-balance-top {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 0;
        }
        .t-balance-main {
          padding: 20px 24px;
          border-right: 1px solid rgba(255,255,255,0.05);
        }
        .t-balance-side {
          padding: 20px 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 130px;
        }
        .t-row-label {
          font-family: var(--mono);
          font-size: 0.55rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #444;
          margin-bottom: 6px;
        }
        .t-balance-val {
          font-family: var(--mono);
          font-size: 1.9rem;
          font-weight: 500;
          color: #f0ebe3;
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .t-balance-chg {
          font-family: var(--mono);
          font-size: 0.68rem;
          margin-top: 6px;
          letter-spacing: 0.04em;
        }
        .t-balance-chg.pos { color: #4ade80; }
        .t-balance-chg.neg { color: #fb7185; }
        .t-side-stat { margin-bottom: 12px; }
        .t-side-val {
          font-family: var(--mono);
          font-size: 0.85rem;
          font-weight: 500;
          color: #c8bfb5;
          letter-spacing: 0.02em;
        }
        .t-balance-actions {
          display: flex;
          gap: 1px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .t-bal-btn {
          flex: 1;
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 11px 0;
          text-align: center;
          text-decoration: none;
          transition: background 0.15s;
          cursor: pointer;
          border: none;
          background: transparent;
        }
        .t-bal-btn.primary { color: #f0ebe3; background: rgba(201,23,10,0.2); }
        .t-bal-btn.primary:hover { background: var(--red); }
        .t-bal-btn.ghost { color: #666; }
        .t-bal-btn.ghost:hover { color: #c8bfb5; background: rgba(255,255,255,0.04); }
        .t-bal-btn.expand { color: #444; font-size: 0.55rem; }
        .t-bal-btn.expand:hover { color: #888; background: rgba(255,255,255,0.03); }

        /* expand */
        .t-expand {
          overflow: hidden;
          transition: max-height 0.3s ease;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .t-expand-inner { padding: 16px 24px 20px; }
        .t-mini-table { width: 100%; border-collapse: collapse; }
        .t-mini-table th {
          font-family: var(--mono);
          font-size: 0.52rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #333;
          padding-bottom: 8px;
          text-align: left;
          padding-right: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .t-mini-table td {
          font-family: var(--mono);
          font-size: 0.68rem;
          color: #888;
          padding: 7px 16px 7px 0;
          border-bottom: 1px solid rgba(255,255,255,0.02);
        }
        .t-mini-table td.dep  { color: #4ade80; }
        .t-mini-table td.wth  { color: #fb7185; }
        .t-mini-table td.amt  { color: #c8bfb5; }

        /* ── METRICS ROW ── */
        .t-metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: var(--crx);
          margin-bottom: 1px;
        }
        .t-metric {
          background: var(--cr);
          padding: 14px 16px;
          position: relative;
        }
        .t-metric.red-top::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: var(--red);
        }
        .t-metric-label {
          font-family: var(--mono);
          font-size: 0.52rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--inl);
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .t-metric-delta {
          font-family: var(--mono);
          font-size: 0.55rem;
          letter-spacing: 0.04em;
        }
        .t-metric-delta.pos { color: #16a34a; }
        .t-metric-delta.neg { color: var(--red); }
        .t-metric-val {
          font-family: var(--mono);
          font-size: 1.1rem;
          font-weight: 500;
          color: var(--ink);
          letter-spacing: -0.01em;
          line-height: 1;
          margin-bottom: 4px;
        }
        .t-metric-sub {
          font-family: var(--mono);
          font-size: 0.55rem;
          color: var(--inl);
          letter-spacing: 0.04em;
        }

        /* ── GRID LAYOUT ── */
        .t-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: var(--crx);
          margin-bottom: 1px;
        }

        /* ── MARKET PANEL ── */
        .t-panel {
          background: var(--cr);
        }
        .t-panel-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          border-bottom: 1px solid var(--crx);
        }
        .t-panel-title {
          font-family: var(--mono);
          font-size: 0.55rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--inl);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .t-panel-title::before {
          content: '';
          display: inline-block;
          width: 10px; height: 1px;
          background: var(--red);
        }
        .t-panel-link {
          font-family: var(--mono);
          font-size: 0.52rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--red);
          text-decoration: none;
        }
        .t-panel-link:hover { opacity: 0.7; }

        .t-mkt-row {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          padding: 10px 16px;
          border-bottom: 1px solid var(--crx);
          text-decoration: none;
          transition: background 0.1s;
          cursor: pointer;
        }
        .t-mkt-row:last-child { border-bottom: none; }
        .t-mkt-row:hover { background: var(--crd); }
        .t-mkt-sym {
          font-family: var(--mono);
          font-size: 0.68rem;
          font-weight: 500;
          color: var(--ink);
          letter-spacing: 0.06em;
        }
        .t-mkt-name {
          font-family: var(--mono);
          font-size: 0.55rem;
          color: var(--inl);
          margin-top: 1px;
          letter-spacing: 0.04em;
        }
        .t-mkt-right { text-align: right; }
        .t-mkt-price {
          font-family: var(--mono);
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--ink);
          letter-spacing: 0.02em;
        }
        .t-mkt-chg {
          font-family: var(--mono);
          font-size: 0.58rem;
          margin-top: 1px;
          letter-spacing: 0.04em;
        }
        .t-mkt-chg.up { color: #16a34a; }
        .t-mkt-chg.dn { color: var(--red); }

        /* ── ACTIONS PANEL ── */
        .t-actions { display: flex; flex-direction: column; }
        .t-action-row {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          text-decoration: none;
          border-bottom: 1px solid var(--crx);
          transition: background 0.1s;
          position: relative;
        }
        .t-action-row:last-child { border-bottom: none; }
        .t-action-row:hover { background: var(--crd); }
        .t-action-row::after {
          content: '→';
          position: absolute;
          right: 16px;
          font-family: var(--mono);
          font-size: 0.8rem;
          color: var(--crx);
          transition: color 0.15s, transform 0.15s;
        }
        .t-action-row:hover::after { color: var(--red); transform: translateX(3px); }
        .t-action-ico {
          width: 32px; height: 32px;
          border: 1px solid var(--crx);
          display: flex; align-items: center; justify-content: center;
          color: var(--red);
          flex-shrink: 0;
          transition: border-color 0.15s;
        }
        .t-action-row:hover .t-action-ico { border-color: var(--red); }
        .t-action-lbl {
          font-family: var(--mono);
          font-size: 0.68rem;
          font-weight: 500;
          color: var(--ink);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .t-action-desc {
          font-family: var(--mono);
          font-size: 0.55rem;
          color: var(--inl);
          letter-spacing: 0.04em;
        }

        /* ── TX TABLE ── */
        .t-tx { background: var(--cr); }
        .t-tx-table { width: 100%; border-collapse: collapse; }
        .t-tx-table th {
          font-family: var(--mono);
          font-size: 0.52rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--inl);
          padding: 10px 16px;
          text-align: left;
          border-bottom: 1px solid var(--crx);
          font-weight: 400;
        }
        .t-tx-table td {
          font-family: var(--mono);
          font-size: 0.68rem;
          color: var(--inm);
          padding: 10px 16px;
          border-bottom: 1px solid var(--crx);
          letter-spacing: 0.02em;
        }
        .t-tx-table tr:last-child td { border-bottom: none; }
        .t-tx-table tr:hover td { background: var(--crd); }
        .t-tx-dep  { color: #16a34a !important; }
        .t-tx-wth  { color: var(--red) !important; }
        .t-tx-amt  { color: var(--ink) !important; font-weight: 500; }

        .t-badge {
          font-family: var(--mono);
          font-size: 0.5rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 2px 6px;
          border: 1px solid;
        }
        .t-badge.ok  { color: #16a34a; border-color: rgba(22,163,74,0.3);  background: rgba(22,163,74,0.06);  }
        .t-badge.pnd { color: #d97706; border-color: rgba(217,119,6,0.3);  background: rgba(217,119,6,0.06);  }
        .t-badge.err { color: var(--red); border-color: rgba(201,23,10,0.3); background: rgba(201,23,10,0.06); }

        .t-loading { display: flex; align-items: center; justify-content: center; padding: 40px; }
        .t-spinner {
          width: 16px; height: 16px;
          border: 1.5px solid var(--crx);
          border-top-color: var(--red);
          border-radius: 50%;
          animation: tspin 0.7s linear infinite;
        }
        @keyframes tspin { to { transform: rotate(360deg); } }
        .t-empty {
          padding: 32px 16px; text-align: center;
          font-family: var(--mono); font-size: 0.6rem;
          letter-spacing: 0.12em; color: var(--inl); text-transform: uppercase;
        }

        @media (max-width: 640px) {
          .t-metrics { grid-template-columns: 1fr 1fr; }
          .t-grid    { grid-template-columns: 1fr; }
          .t-balance-top { grid-template-columns: 1fr; }
          .t-balance-side { display: none; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <div className="t-header">
        <div className="t-header-left">
          <span className="t-uid">
            APEX<span>•</span>MKTS / {session?.user?.id?.slice(-6).toUpperCase() ?? 'XXXXXX'}
          </span>
          <span className="t-name">{firstName}</span>
        </div>
        <div className="t-header-right">
          <span className="t-live-pill"><span className="t-live-dot" />Live</span>
          <span className="t-clock">{time}</span>
        </div>
      </div>

      {/* ── BALANCE ── */}
      <div className="t-balance" style={{ marginBottom: 1 }}>
        <div className="t-balance-top">
          <div className="t-balance-main">
            <p className="t-row-label">Net Asset Value — USD</p>
            <p className="t-balance-val">${fmt(balance)}</p>
            <p className={`t-balance-chg ${changePos ? 'pos' : 'neg'}`}>
              {changePos ? '▲ +' : '▼ '}{fmt(changePercent)}% · this period
            </p>
          </div>
          <div className="t-balance-side">
            <div className="t-side-stat">
              <p className="t-row-label">Profit / Loss</p>
              <p className="t-side-val">${fmt(profit)}</p>
            </div>
            <div className="t-side-stat">
              <p className="t-row-label">Positions</p>
              <p className="t-side-val">3 open</p>
            </div>
            <div className="t-side-stat">
              <p className="t-row-label">Risk</p>
              <p className="t-side-val">Conservative</p>
            </div>
          </div>
        </div>

        <div className="t-balance-actions">
          <Link href="/dashboard/deposit"  className="t-bal-btn primary">+ Deposit</Link>
          <Link href="/dashboard/withdraw" className="t-bal-btn ghost">Withdraw</Link>
          <button
            className="t-bal-btn expand"
            onClick={() => setBalanceOpen((v) => !v)}
          >
            {balanceOpen ? '↑ hide' : '↓ transactions'}
          </button>
        </div>

        <div className="t-expand" style={{ maxHeight: balanceOpen ? 320 : 0 }}>
          <div className="t-expand-inner">
            <p className="t-row-label" style={{ marginBottom: 10 }}>Recent Transactions</p>
            {transactions.length === 0 ? (
              <p style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: '#444' }}>No transactions yet.</p>
            ) : (
              <table className="t-mini-table">
                <thead>
                  <tr>
                    {['Type', 'Asset', 'Amount', 'Status'].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 5).map((tx) => (
                    <tr key={tx.id}>
                      <td className={tx.type === 'Deposit' ? 'dep' : 'wth'}>{tx.type}</td>
                      <td>{tx.asset || 'USD'}</td>
                      <td className="amt">${fmt(tx.amount, 0)}</td>
                      <td>
                        <span className={`t-badge ${tx.status === 'COMPLETED' ? 'ok' : tx.status === 'PENDING' ? 'pnd' : 'err'}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── METRICS ── */}
      <div className="t-metrics" style={{ marginBottom: 1 }}>
        {[
          { label: 'Realised P&L', val: `$${fmt(profit)}`, sub: 'Current period', delta: `+${fmt(changePercent)}%`, pos: true, red: true },
          { label: 'Portfolio Value', val: `$${fmt(balance)}`, sub: 'Mark-to-market', delta: null, pos: true, red: false },
          { label: 'Open Positions', val: '3', sub: '2 profit · 1 loss', delta: null, pos: true, red: false },
          { label: 'Volatility', val: '0.4%', sub: 'Conservative risk', delta: null, pos: true, red: false },
        ].map(({ label, val, sub, delta, pos, red }) => (
          <div key={label} className={`t-metric ${red ? 'red-top' : ''}`}>
            <div className="t-metric-label">
              {label}
              {delta && <span className={`t-metric-delta ${pos ? 'pos' : 'neg'}`}>{delta}</span>}
            </div>
            <p className="t-metric-val">{val}</p>
            <p className="t-metric-sub">{sub}</p>
            {red && <div style={{ marginTop: 8 }}><Sparkline positive={pos} /></div>}
          </div>
        ))}
      </div>

      {/* ── GRID: MARKETS + ACTIONS ── */}
      <div className="t-grid" style={{ marginBottom: 1 }}>

        {/* Markets */}
        <div className="t-panel">
          <div className="t-panel-head">
            <span className="t-panel-title">Live Markets</span>
            <Link href="/dashboard/markets" className="t-panel-link">All markets →</Link>
          </div>
          {markets.length === 0
            ? ['BTC', 'ETH', 'NVDA', 'TSLA'].map((sym) => (
                <div key={sym} className="t-mkt-row" style={{ cursor: 'default' }}>
                  <div>
                    <div className="t-mkt-sym">{sym}</div>
                    <div className="t-mkt-name" style={{ color: 'var(--crx)' }}>loading...</div>
                  </div>
                  <div className="t-mkt-right">
                    <div className="t-mkt-price" style={{ color: 'var(--crx)' }}>——</div>
                  </div>
                </div>
              ))
            : markets.slice(0, 6).map((a) => {
                const price = a.price ?? 0;
                const chg   = a.changePercent ?? 0;
                const pos   = chg >= 0;
                return (
                  <Link key={a.symbol} href={`/dashboard/trade?asset=${a.symbol}`} className="t-mkt-row">
                    <div>
                      <div className="t-mkt-sym">{a.symbol}</div>
                      <div className="t-mkt-name">{a.name}</div>
                    </div>
                    <div className="t-mkt-right">
                      <div className="t-mkt-price">${fmt(price)}</div>
                      <div className={`t-mkt-chg ${pos ? 'up' : 'dn'}`}>
                        {pos ? '+' : ''}{fmt(chg)}%
                      </div>
                    </div>
                  </Link>
                );
              })}
        </div>

        {/* Actions */}
        <div className="t-panel">
          <div className="t-panel-head">
            <span className="t-panel-title">Quick Actions</span>
          </div>
          <div className="t-actions">
            {[
              {
                href: '/dashboard/deposit',
                label: 'Deposit Funds',
                desc: 'Add funds to account',
                icon: (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v8M4 7l3 3 3-3M1 11h12" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" />
                  </svg>
                ),
              },
              {
                href: '/dashboard/withdraw',
                label: 'Withdraw',
                desc: 'Transfer to bank',
                icon: (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 9V1M4 3l3-3 3 3M1 11h12" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" />
                  </svg>
                ),
              },
              {
                href: '/dashboard/trade',
                label: 'New Trade',
                desc: '180+ instruments',
                icon: (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 10l3-4 3 2 4-6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="square" strokeLinejoin="miter" />
                    <circle cx="11" cy="4" r="2" stroke="currentColor" strokeWidth="1.1" />
                  </svg>
                ),
              },
              {
                href: '/dashboard/markets',
                label: 'Markets',
                desc: 'Browse all assets',
                icon: (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1.1" />
                    <rect x="8" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1.1" />
                    <rect x="1" y="8" width="5" height="5" stroke="currentColor" strokeWidth="1.1" />
                    <rect x="8" y="8" width="5" height="5" stroke="currentColor" strokeWidth="1.1" />
                  </svg>
                ),
              },
            ].map(({ href, label, desc, icon }) => (
              <Link key={href} href={href} className="t-action-row">
                <div className="t-action-ico">{icon}</div>
                <div>
                  <p className="t-action-lbl">{label}</p>
                  <p className="t-action-desc">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── TX TABLE ── */}
      <div className="t-tx">
        <div className="t-panel-head">
          <span className="t-panel-title">Execution History</span>
        </div>
        {loading ? (
          <div className="t-loading"><div className="t-spinner" /></div>
        ) : transactions.length === 0 ? (
          <div className="t-empty">No transactions yet</div>
        ) : (
          <table className="t-tx-table">
            <thead>
              <tr>
                <th>Type</th><th>Asset</th><th>Amount</th><th>Date</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 8).map((tx) => (
                <tr key={tx.id}>
                  <td className={tx.type === 'Deposit' ? 't-tx-dep' : tx.type === 'Withdrawal' ? 't-tx-wth' : ''}>{tx.type}</td>
                  <td>{tx.asset || 'USD'}</td>
                  <td className="t-tx-amt">${fmt(tx.amount, 0)}</td>
                  <td>{new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>
                    <span className={`t-badge ${tx.status === 'COMPLETED' ? 'ok' : tx.status === 'PENDING' ? 'pnd' : 'err'}`}>
  {tx.status}
</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
