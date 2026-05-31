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
  const color = positive ? '#2e7d4f' : '#b83232';
  return (
    <svg width="84" height="22" viewBox="0 0 84 22" fill="none">
      <polyline points={pts} fill="none"
        stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
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

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
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
  const firstName     = session?.user?.name?.split(' ')[0] ?? 'Trader';

  return (
    <>
      <style>{`
        :root {
          --bg:        #f5f0eb;
          --bg-1:      #ede8e1;
          --bg-2:      #e2dbd1;
          --bg-3:      #cec5b8;
          --white:     #ffffff;
          --ink:       #1c1a17;
          --ink-2:     #2e2b26;
          --ink-dim:   #6b6457;
          --ink-faint: #9e9485;
          --charcoal:  #1c1a17;
          --orange:    #e85c0d;
          --orange-2:  #f07030;
          --orange-l:  #fde8dc;
          --orange-m:  #f5c4a8;
          --green:     #2e7d4f;
          --green-l:   #e4f2ea;
          --red:       #b83232;
          --red-l:     #faeaea;
          --gold-l:    #fdf3d0;
          --gold:      #8a6800;
          --blue:      #1a3d8a;
          --blue-l:    #e4eaf8;
          --shadow-xs: 0 1px 3px rgba(28,26,23,0.07);
          --shadow-sm: 0 2px 8px rgba(28,26,23,0.09), 0 1px 2px rgba(28,26,23,0.05);
          --shadow-md: 0 4px 20px rgba(28,26,23,0.12), 0 2px 6px rgba(28,26,23,0.06);
          --r:    10px;
          --r-sm: 8px;
          --sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          --display: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          --mono: 'SF Mono', 'Fira Code', 'Courier New', monospace;
        }

        /* ── HEADER ── */
        .d-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 0 20px;
        }

        .d-header-left { display: flex; flex-direction: column; gap: 5px; }

        .d-greeting {
          font-family: var(--sans);
          font-size: 0.7rem;
          font-weight: 400;
          color: var(--ink-faint);
          letter-spacing: 0.04em;
        }

        .d-name {
          font-family: var(--sans);
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--ink);
          letter-spacing: -0.01em;
          line-height: 1;
        }

        .d-uid {
          font-family: var(--mono);
          font-size: 0.58rem;
          letter-spacing: 0.14em;
          color: var(--ink-faint);
          margin-top: 2px;
        }

        .d-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .d-live-chip {
          display: flex;
          align-items: center;
          gap: 5px;
          background: var(--orange-l);
          border: 1px solid var(--orange-m);
          border-radius: 20px;
          padding: 4px 10px;
          font-family: var(--mono);
          font-size: 0.6rem;
          font-weight: 500;
          letter-spacing: 0.14em;
          color: var(--orange);
        }

        .d-live-dot {
          width: 5px; height: 5px;
          background: var(--orange);
          border-radius: 50%;
          animation: dpulse 2s ease-in-out infinite;
        }

        @keyframes dpulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.5); opacity: 0.5; }
        }

        .d-clock {
          font-family: var(--mono);
          font-size: 0.72rem;
          color: var(--ink-dim);
          letter-spacing: 0.06em;
        }

        /* ── BALANCE CARD ── */
        .d-balance {
          background: var(--white);
          border-radius: var(--r);
          overflow: hidden;
          margin-bottom: 10px;
          box-shadow: var(--shadow-sm);
          border-top: 3px solid var(--orange);
          position: relative;
        }

        .d-balance-body {
          padding: 18px 18px 14px;
        }

        .d-balance-eyebrow {
          font-family: var(--sans);
          font-size: 0.6rem;
          font-weight: 400;
          color: var(--ink-faint);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .d-balance-amount {
          font-family: var(--sans);
          font-size: 2rem;
          font-weight: 700;
          color: var(--ink);
          letter-spacing: -0.02em;
          line-height: 1;
          margin-bottom: 8px;
        }

        .d-balance-amount sup {
          font-size: 1rem;
          font-weight: 500;
          color: var(--ink-dim);
          vertical-align: super;
        }

        .d-balance-amount .cents {
          font-size: 1.1rem;
          color: var(--ink-dim);
          font-weight: 500;
        }

        .d-balance-change {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: var(--green-l);
          border: 1px solid rgba(46,125,79,0.2);
          border-radius: 4px;
          padding: 3px 8px;
          font-family: var(--mono);
          font-size: 0.65rem;
          font-weight: 500;
          color: var(--green);
          margin-bottom: 16px;
        }

        .d-balance-change.neg {
          background: var(--red-l);
          border-color: rgba(184,50,50,0.2);
          color: var(--red);
        }

        .d-balance-change svg { width: 8px; height: 8px; }

        /* 3-stat row */
        .d-balance-stats {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0;
          border-top: 1px solid var(--bg-2);
        }

        .d-bstat {
          padding: 12px 16px;
          border-right: 1px solid var(--bg-2);
          transition: background 0.12s;
        }
        .d-bstat:last-child { border-right: none; }
        .d-bstat:hover { background: var(--bg-1); }

        .d-bstat-label {
          font-family: var(--sans);
          font-size: 0.58rem;
          font-weight: 400;
          color: var(--ink-faint);
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .d-bstat-val {
          font-family: var(--sans);
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--ink);
          line-height: 1;
        }

        .d-bstat-val.pos { color: var(--green); }
        .d-bstat-val.neg { color: var(--red); }

        .d-bstat-sub {
          font-family: var(--sans);
          font-size: 0.58rem;
          color: var(--ink-faint);
          margin-top: 2px;
          font-weight: 300;
        }

        /* action buttons inside balance */
        .d-balance-actions {
          display: flex;
          gap: 8px;
          padding: 0 18px 16px;
        }

        .d-act-btn {
          padding: 7px 14px;
          border-radius: 6px;
          font-family: var(--sans);
          font-size: 0.7rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          text-decoration: none;
          transition: all 0.12s;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .d-act-btn.primary {
          background: var(--orange);
          color: #fff;
        }
        .d-act-btn.primary:hover { background: var(--orange-2); }

        .d-act-btn.ghost {
          background: var(--bg-1);
          color: var(--ink-2);
          border: 1px solid var(--bg-3);
        }
        .d-act-btn.ghost:hover { background: var(--bg-2); }

        .d-act-btn.text {
          background: transparent;
          color: var(--ink-faint);
          font-size: 0.65rem;
          padding: 7px 8px;
        }
        .d-act-btn.text:hover { color: var(--ink-dim); }

        /* expand drawer */
        .d-expand {
          overflow: hidden;
          transition: max-height 0.35s ease;
        }

        .d-expand-inner {
          padding: 14px 18px 16px;
          border-top: 1px solid var(--bg-2);
        }

        .d-expand-title {
          font-family: var(--sans);
          font-size: 0.6rem;
          font-weight: 500;
          color: var(--ink-faint);
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .d-mini-table { width: 100%; border-collapse: collapse; }

        .d-mini-table th {
          font-family: var(--sans);
          font-size: 0.58rem;
          font-weight: 500;
          color: var(--ink-faint);
          padding-bottom: 7px;
          text-align: left;
          padding-right: 16px;
          border-bottom: 1px solid var(--bg-2);
        }

        .d-mini-table td {
          font-family: var(--sans);
          font-size: 0.68rem;
          color: var(--ink-2);
          padding: 7px 16px 7px 0;
          border-bottom: 1px solid var(--bg-2);
        }
        .d-mini-table tr:last-child td { border-bottom: none; }

        .d-mini-table td.dep { color: var(--green); font-weight: 500; }
        .d-mini-table td.wth { color: var(--red);   font-weight: 500; }
        .d-mini-table td.amt { color: var(--ink);   font-weight: 500; }

        /* ── METRICS ROW ── */
        .d-metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 10px;
        }

        .d-metric {
          background: var(--white);
          border-radius: var(--r-sm);
          padding: 16px;
          box-shadow: var(--shadow-xs);
          position: relative;
          overflow: hidden;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .d-metric:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }

        .d-metric.accent-top::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: var(--orange);
        }

        .d-metric-label {
          font-family: var(--sans);
          font-size: 0.62rem;
          font-weight: 400;
          color: var(--ink-faint);
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          letter-spacing: 0.01em;
        }

        .d-metric-delta {
          font-family: var(--mono);
          font-size: 0.58rem;
          font-weight: 500;
        }
        .d-metric-delta.pos { color: var(--green); }
        .d-metric-delta.neg { color: var(--red); }

        .d-metric-val {
          font-family: var(--sans);
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--ink);
          letter-spacing: -0.01em;
          line-height: 1;
          margin-bottom: 3px;
        }

        .d-metric-sub {
          font-family: var(--sans);
          font-size: 0.62rem;
          font-weight: 300;
          color: var(--ink-faint);
        }

        /* ── GRID ── */
        .d-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 10px;
        }

        /* ── PANEL SHARED ── */
        .d-panel {
          background: var(--white);
          border-radius: var(--r-sm);
          box-shadow: var(--shadow-xs);
          overflow: hidden;
        }

        .d-panel-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--bg-2);
        }

        .d-panel-title {
          font-family: var(--sans);
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--ink);
          letter-spacing: 0.01em;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .d-panel-title::before {
          content: '';
          display: inline-block;
          width: 3px; height: 13px;
          background: var(--orange);
          border-radius: 2px;
        }

        .d-panel-link {
          font-family: var(--mono);
          font-size: 0.58rem;
          letter-spacing: 0.1em;
          color: var(--orange);
          text-decoration: none;
          text-transform: uppercase;
        }
        .d-panel-link:hover { opacity: 0.7; }

        /* ── MARKET ROWS ── */
        .d-mkt-row {
          display: flex;
          align-items: center;
          padding: 11px 16px;
          border-bottom: 1px solid var(--bg-2);
          text-decoration: none;
          transition: all 0.12s;
          gap: 10px;
          cursor: pointer;
        }
        .d-mkt-row:last-child { border-bottom: none; }
        .d-mkt-row:hover { background: var(--bg-1); transform: translateX(2px); }

        .d-mkt-icon {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: var(--bg-1);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
          flex-shrink: 0;
          font-weight: 700;
        }

        .d-mkt-info { flex: 1; }

        .d-mkt-sym {
          font-family: var(--mono);
          font-size: 0.72rem;
          font-weight: 500;
          color: var(--ink);
          letter-spacing: 0.06em;
          line-height: 1;
          margin-bottom: 2px;
        }

        .d-mkt-name {
          font-family: var(--sans);
          font-size: 0.6rem;
          font-weight: 300;
          color: var(--ink-faint);
        }

        .d-mkt-right { text-align: right; }

        .d-mkt-price {
          font-family: var(--mono);
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--ink);
          font-feature-settings: 'tnum';
          margin-bottom: 2px;
        }

        .d-mkt-chg {
          font-family: var(--mono);
          font-size: 0.6rem;
          font-weight: 500;
        }
        .d-mkt-chg.up { color: var(--green); }
        .d-mkt-chg.dn { color: var(--red); }

        /* ── QUICK ACTIONS ── */
        .d-action-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          text-decoration: none;
          border-bottom: 1px solid var(--bg-2);
          transition: all 0.12s;
          position: relative;
        }
        .d-action-row:last-child { border-bottom: none; }
        .d-action-row:hover { background: var(--bg-1); transform: translateX(2px); }

        .d-action-row::after {
          content: '→';
          position: absolute;
          right: 16px;
          font-family: var(--sans);
          font-size: 0.9rem;
          color: var(--bg-3);
          transition: all 0.15s;
        }
        .d-action-row:hover::after { color: var(--orange); transform: translateX(3px); }

        .d-action-ico {
          width: 34px; height: 34px;
          border-radius: 8px;
          background: var(--orange-l);
          border: 1px solid var(--orange-m);
          display: flex; align-items: center; justify-content: center;
          color: var(--orange);
          flex-shrink: 0;
          transition: all 0.12s;
        }
        .d-action-row:hover .d-action-ico {
          background: var(--orange);
          border-color: var(--orange);
          color: #fff;
        }

        .d-action-lbl {
          font-family: var(--sans);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--ink);
          margin-bottom: 2px;
        }

        .d-action-desc {
          font-family: var(--sans);
          font-size: 0.6rem;
          font-weight: 300;
          color: var(--ink-faint);
        }

        /* ── TX TABLE ── */
        .d-tx {
          background: var(--white);
          border-radius: var(--r-sm);
          box-shadow: var(--shadow-xs);
          overflow: hidden;
        }

        .d-tx-table { width: 100%; border-collapse: collapse; }

        .d-tx-table th {
          font-family: var(--sans);
          font-size: 0.62rem;
          font-weight: 500;
          color: var(--ink-faint);
          padding: 10px 16px;
          text-align: left;
          border-bottom: 1px solid var(--bg-2);
          background: var(--bg-1);
          letter-spacing: 0.01em;
        }

        .d-tx-table td {
          font-family: var(--sans);
          font-size: 0.72rem;
          color: var(--ink-2);
          padding: 11px 16px;
          border-bottom: 1px solid var(--bg-2);
          font-weight: 400;
        }

        .d-tx-table tr:last-child td { border-bottom: none; }
        .d-tx-table tbody tr:hover td { background: var(--bg-1); }

        .d-tx-dep { color: var(--green) !important; font-weight: 500 !important; }
        .d-tx-wth { color: var(--red)   !important; font-weight: 500 !important; }
        .d-tx-amt {
          font-family: var(--mono) !important;
          color: var(--ink) !important;
          font-weight: 500 !important;
          font-size: 0.7rem !important;
          font-feature-settings: 'tnum';
        }
        .d-tx-date {
          font-family: var(--mono) !important;
          font-size: 0.62rem !important;
          color: var(--ink-faint) !important;
        }

        /* badge */
        .d-badge {
          font-family: var(--mono);
          font-size: 0.5rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 20px;
          display: inline-block;
        }
        .d-badge.ok  { background: var(--green-l); color: var(--green); }
        .d-badge.pnd { background: var(--gold-l);  color: var(--gold);  }
        .d-badge.err { background: var(--red-l);   color: var(--red);   }

        /* loading / empty */
        .d-loading {
          display: flex; align-items: center; justify-content: center;
          padding: 40px;
        }
        .d-spinner {
          width: 18px; height: 18px;
          border: 2px solid var(--bg-2);
          border-top-color: var(--orange);
          border-radius: 50%;
          animation: dspin 0.7s linear infinite;
        }
        @keyframes dspin { to { transform: rotate(360deg); } }

        .d-empty {
          padding: 32px 16px; text-align: center;
          font-family: var(--sans); font-size: 0.7rem;
          font-weight: 300; color: var(--ink-faint);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 640px) {
          .d-metrics { grid-template-columns: 1fr 1fr; }
          .d-grid    { grid-template-columns: 1fr; }
          .d-balance-amount { font-size: 2.2rem; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <div className="d-header">
        <div className="d-header-left">
          <span className="d-greeting">Welcome back</span>
          <span className="d-name">{firstName}</span>
          <span className="d-uid">
            APEX·MKTS&nbsp;/&nbsp;{session?.user?.id?.slice(-6).toUpperCase() ?? 'XXXXXX'}
          </span>
        </div>
        <div className="d-header-right">
          <div className="d-live-chip">
            <span className="d-live-dot" />
            Live
          </div>
          <span className="d-clock">{time}</span>
        </div>
      </div>

      {/* ── BALANCE CARD ── */}
      <div className="d-balance" style={{ marginBottom: 10 }}>
        <div className="d-balance-body">
          <p className="d-balance-eyebrow">Net Asset Value — USD</p>
          <p className="d-balance-amount">
            <sup>$</sup>24,850<span className="cents">.00</span>
          </p>
          <div className={`d-balance-change${changePos ? '' : ' neg'}`}>
            <svg viewBox="0 0 9 9" fill="none">
              <path d={changePos ? 'M1.5 6.5L4.5 2.5L7.5 6.5' : 'M1.5 2.5L4.5 6.5L7.5 2.5'}
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {changePos ? '+' : ''}{fmt(changePercent)}% this period
          </div>
        </div>

        {/* action buttons */}
        <div className="d-balance-actions">
          <Link href="/dashboard/deposit"  className="d-act-btn primary">+ Deposit</Link>
          <Link href="/dashboard/withdraw" className="d-act-btn ghost">Withdraw</Link>
          <button
            className="d-act-btn text"
            onClick={() => setBalanceOpen(v => !v)}
          >
            {balanceOpen ? '↑ hide' : '↓ transactions'}
          </button>
        </div>

        {/* 3-stat bar */}
        <div className="d-balance-stats">
          <div className="d-bstat">
            <p className="d-bstat-label">P &amp; L</p>
            <p className={`d-bstat-val ${changePos ? 'pos' : 'neg'}`}>
              +${fmt(profit)}
            </p>
            <p className="d-bstat-sub">Realised</p>
          </div>
          <div className="d-bstat">
            <p className="d-bstat-label">Positions</p>
            <p className="d-bstat-val">3 open</p>
            <p className="d-bstat-sub">2 profit · 1 loss</p>
          </div>
          <div className="d-bstat">
            <p className="d-bstat-label">Risk</p>
            <p className="d-bstat-val">Conservative</p>
            <p className="d-bstat-sub">Volatility 0.4%</p>
          </div>
        </div>

        {/* expand */}
        <div className="d-expand" style={{ maxHeight: balanceOpen ? 320 : 0 }}>
          <div className="d-expand-inner">
            <p className="d-expand-title">Recent Transactions</p>
            {transactions.length === 0 ? (
              <p style={{ fontFamily: 'var(--sans)', fontSize: '0.65rem',
                fontWeight: 300, color: 'var(--ink-faint)' }}>
                No transactions yet.
              </p>
            ) : (
              <table className="d-mini-table">
                <thead>
                  <tr>{['Type','Asset','Amount','Status'].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 5).map(tx => (
                    <tr key={tx.id}>
                      <td className={tx.type === 'Deposit' ? 'dep' : 'wth'}>{tx.type}</td>
                      <td>{tx.asset || 'USD'}</td>
                      <td className="amt">${fmt(tx.amount, 0)}</td>
                      <td>
                        <span className={`d-badge ${tx.status === 'COMPLETED' ? 'ok' : tx.status === 'PENDING' ? 'pnd' : 'err'}`}>
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
      <div className="d-metrics">
        {[
          { label: 'Realised P&L',    val: `$${fmt(profit)}`,   sub: 'Current period',    delta: `+${fmt(changePercent)}%`, pos: true,  accent: true },
          { label: 'Portfolio Value', val: `$${fmt(balance)}`,  sub: 'Mark-to-market',    delta: null,                       pos: true,  accent: false },
          { label: 'Open Positions',  val: '3',                  sub: '2 profit · 1 loss', delta: null,                       pos: true,  accent: false },
          { label: 'Volatility',      val: '0.4%',               sub: 'Conservative',      delta: null,                       pos: true,  accent: false },
        ].map(({ label, val, sub, delta, pos, accent }) => (
          <div key={label} className={`d-metric ${accent ? 'accent-top' : ''}`}>
            <div className="d-metric-label">
              {label}
              {delta && <span className={`d-metric-delta ${pos ? 'pos' : 'neg'}`}>{delta}</span>}
            </div>
            <p className="d-metric-val">{val}</p>
            <p className="d-metric-sub">{sub}</p>
            {accent && <div style={{ marginTop: 10 }}><Sparkline positive={pos} /></div>}
          </div>
        ))}
      </div>

      {/* ── GRID: MARKETS + ACTIONS ── */}
      <div className="d-grid">

        {/* Markets */}
        <div className="d-panel">
          <div className="d-panel-head">
            <span className="d-panel-title">Live Markets</span>
            <Link href="/dashboard/markets" className="d-panel-link">All →</Link>
          </div>
          {markets.length === 0
            ? ['BTC','ETH','NVDA','TSLA'].map(sym => (
                <div key={sym} className="d-mkt-row" style={{ cursor: 'default' }}>
                  <div className="d-mkt-icon" style={{ opacity: 0.3 }}>·</div>
                  <div className="d-mkt-info">
                    <div className="d-mkt-sym">{sym}</div>
                    <div className="d-mkt-name" style={{ color: 'var(--bg-3)' }}>Loading…</div>
                  </div>
                  <div className="d-mkt-right">
                    <div className="d-mkt-price" style={{ color: 'var(--bg-3)' }}>——</div>
                  </div>
                </div>
              ))
            : markets.slice(0, 6).map(a => {
                const price = a.price ?? 0;
                const chg   = a.changePercent ?? 0;
                const up    = chg >= 0;
                const icons: Record<string, string> = {
                  BTC: '₿', ETH: 'Ξ', SOL: '◎', BNB: 'B', NVDA: 'N', TSLA: 'T', AAPL: '',
                };
                return (
                  <Link key={a.symbol} href={`/dashboard/trade?asset=${a.symbol}`} className="d-mkt-row">
                    <div className="d-mkt-icon">{icons[a.symbol] ?? a.symbol[0]}</div>
                    <div className="d-mkt-info">
                      <div className="d-mkt-sym">{a.symbol}</div>
                      <div className="d-mkt-name">{a.name}</div>
                    </div>
                    <div className="d-mkt-right">
                      <div className="d-mkt-price">${fmt(price)}</div>
                      <div className={`d-mkt-chg ${up ? 'up' : 'dn'}`}>
                        {up ? '+' : ''}{fmt(chg)}%
                      </div>
                    </div>
                  </Link>
                );
              })}
        </div>

        {/* Actions */}
        <div className="d-panel">
          <div className="d-panel-head">
            <span className="d-panel-title">Quick Actions</span>
          </div>
          {[
            {
              href: '/dashboard/deposit',
              label: 'Deposit Funds',
              desc: 'Add funds to account',
              icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 7l3 3 3-3M1 11h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
            },
            {
              href: '/dashboard/withdraw',
              label: 'Withdraw',
              desc: 'Transfer to bank',
              icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 9V1M4 3l3-3 3 3M1 11h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
            },
            {
              href: '/dashboard/trade',
              label: 'New Trade',
              desc: '180+ instruments',
              icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 10l3-4 3 2 4-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="11" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.2"/></svg>,
            },
            {
              href: '/dashboard/markets',
              label: 'Markets',
              desc: 'Browse all assets',
              icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>,
            },
          ].map(({ href, label, desc, icon }) => (
            <Link key={href} href={href} className="d-action-row">
              <div className="d-action-ico">{icon}</div>
              <div>
                <p className="d-action-lbl">{label}</p>
                <p className="d-action-desc">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── TX TABLE ── */}
      <div className="d-tx">
        <div className="d-panel-head">
          <span className="d-panel-title">Execution History</span>
        </div>
        {loading ? (
          <div className="d-loading"><div className="d-spinner" /></div>
        ) : transactions.length === 0 ? (
          <div className="d-empty">No transactions yet</div>
        ) : (
          <table className="d-tx-table">
            <thead>
              <tr>
                <th>Type</th><th>Asset</th><th>Amount</th><th>Date</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 8).map(tx => (
                <tr key={tx.id}>
                  <td className={tx.type === 'Deposit' ? 'd-tx-dep' : tx.type === 'Withdrawal' ? 'd-tx-wth' : ''}>
                    {tx.type}
                  </td>
                  <td>{tx.asset || 'USD'}</td>
                  <td className="d-tx-amt">${fmt(tx.amount, 0)}</td>
                  <td className="d-tx-date">
                    {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td>
                    <span className={`d-badge ${tx.status === 'COMPLETED' ? 'ok' : tx.status === 'PENDING' ? 'pnd' : 'err'}`}>
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
