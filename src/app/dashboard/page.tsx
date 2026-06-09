'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

type Transaction = {
  id: string;
  type: 'Deposit' | 'Withdrawal' | 'Trade';
  asset: string;
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  createdAt: string;
};

type Market = {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  iconBg: string;
  iconCol: string;
  price: number;
  change24h: number;
  volume24h: number;
};

type DepositMethod = {
  id: string;
  label: string;
  icon: string;
  address: string;
  network?: string;
  note?: string;
};

type DashboardData = {
  user: {
    id: string;
    name: string;
    firstName: string;
    email: string;
    portfolioBalance: number;
    portfolioChangePercent: number;
    realisedPnl: number;
    volatility: number;
    riskLabel: string;
    kycStatus: string;
  };
  transactions: Transaction[];
  positions: { open: number; profit: number; loss: number };
  notifications: { id: string; message: string; read: boolean }[];
  activityLogs: { id: string; description: string }[];
};

function fmt(n: number | null | undefined, d = 2) {
  return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function Sparkline({ positive = true, width = 80, height = 28 }) {
  const pts = positive
    ? '0,24 14,17 28,19 42,10 56,13 70,4 80,6'
    : '0,4 14,10 28,8 42,17 56,13 70,21 80,24';
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <polyline points={pts} stroke={positive ? '#4ade80' : '#f87171'}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function Badge({ status }: { status: 'COMPLETED' | 'PENDING' | 'FAILED' }) {
  const map = { COMPLETED: ['#0d3320', '#4ade80'], PENDING: ['#2a2200', '#fbbf24'], FAILED: ['#2a0d0d', '#f87171'] };
  const [bg, col] = map[status] ?? map.COMPLETED;
  return (
    <span style={{
      background: bg, color: col, padding: '2px 8px', borderRadius: 20,
      fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
      fontFamily: 'var(--mono)'
    }}>
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const [time, setTime] = useState('');
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [sheet, setSheet] = useState<'deposit' | null>(null);
  const [copied, setCopied] = useState(false);
  const [method, setMethod] = useState('');
  const [depositMethods, setDepositMethods] = useState<DepositMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/user/dashboard');
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, []);

  const fetchMarkets = useCallback(async () => {
    try {
      const res = await fetch('/api/markets');
      if (res.ok) setMarkets(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchMarkets();
    const id = setInterval(fetchMarkets, 60_000);
    return () => clearInterval(id);
  }, [fetchDashboard, fetchMarkets]);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const openDeposit = async () => {
    setSheet('deposit');
    setMethodsLoading(true);
    try {
      const res = await fetch('/api/admin/deposit-methods');
      if (res.ok) {
        const d = await res.json();
        setDepositMethods(d);
        if (d.length > 0) setMethod(d[0].id);
      }
    } finally { setMethodsLoading(false); }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeSheet = () => { setSheet(null); setCopied(false); };

  const balance      = data?.user.portfolioBalance ?? 0;
  const firstName    = data?.user.firstName        ?? '';
  const userId       = data?.user.id?.slice(-6).toUpperCase() ?? '------';
  const transactions = data?.transactions          ?? [];
  const activityLogs = data?.activityLogs          ?? [];
  const riskLabel    = data?.user.riskLabel        ?? 'Conservative';
  const volatility   = data?.user.volatility       ?? 0;
  const activeMethod = depositMethods.find(m => m.id === method);

  // P&L: current balance minus the very first completed deposit
  const completedDeposits = transactions
    .filter(tx => tx.type === 'Deposit' && tx.status === 'COMPLETED')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const firstDepositAmount = completedDeposits[0]?.amount ?? 0;
  const profit = firstDepositAmount > 0 ? balance - firstDepositAmount : 0;
  const changePercent = firstDepositAmount > 0 ? (profit / firstDepositAmount) * 100 : 0;

  // Positions: count trade-type entries in activityLogs
  const openPositions = activityLogs.filter(log =>
    log.description?.toLowerCase().includes('buy') ||
    log.description?.toLowerCase().includes('sell') ||
    log.description?.toLowerCase().includes('trade')
  ).length;

  const topMovers = [...markets]
    .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
    .slice(0, 4);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a1c2a' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #1a3a50', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        :root {
          --bg:#0a1c2a;
          --bg-1:#071521;
          --bg-3:#0f2336;
          --card:#0d2135;
          --ink:#eef7ff;
          --ink-2:#c8e4f8;
          --ink-dim:#7aaec8;
          --ink-faint:#4e839e;
          --accent:#38bdf8;
          --green:#4ade80;
          --green-l:#0d3320;
          --red:#f87171;
          --gold-l:#2a2200;
          --gold:#fbbf24;
          --sans:'DM Sans',system-ui,sans-serif;
          --mono:'DM Mono','SF Mono',monospace;
          --side:16px;
        }
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:var(--bg);font-family:var(--sans);}

        /* Wrapper — full width, no artificial max-width centering on mobile */
        .dash-wrap{width:100%;max-width:480px;margin:0 auto;background:var(--bg);min-height:100vh;padding-bottom:80px;}

        /* ── HEADER ── */
        .d-header{
          padding:22px var(--side) 12px;
          display:flex;align-items:flex-start;justify-content:space-between;
        }
        .d-greeting{font-size:0.6rem;font-weight:500;color:var(--ink-faint);margin-bottom:2px;text-transform:uppercase;letter-spacing:0.1em;}
        .d-name{font-size:1.9rem;font-weight:700;color:var(--ink);letter-spacing:-0.03em;line-height:1;margin-bottom:5px;}
        .d-uid{font-family:var(--mono);font-size:0.53rem;letter-spacing:0.12em;color:var(--ink-faint);}
        .d-header-right{display:flex;flex-direction:column;align-items:flex-end;gap:5px;padding-top:3px;flex-shrink:0;margin-left:10px;}
        .d-live-chip{display:flex;align-items:center;gap:4px;background:rgba(34,197,94,0.09);border:1px solid rgba(34,197,94,0.18);border-radius:5px;padding:3px 7px;font-family:var(--mono);font-size:0.52rem;font-weight:600;color:#22c55e;}
        .live-dot{width:5px;height:5px;background:#22c55e;border-radius:50%;animation:blink 2s ease-in-out infinite;flex-shrink:0;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.35}}
        .d-clock{font-family:var(--mono);font-size:0.58rem;color:var(--ink-faint);letter-spacing:0.05em;}

        /* ── HERO CARD — bleeds to left/right edges, only top/bottom margin ── */
        .hero-card{
          margin:0 var(--side) 0;
          background:var(--card);
          border-radius:14px;
          padding:18px var(--side) 16px;
          border:1px solid var(--bg-3);
          position:relative;overflow:hidden;
        }
        .hero-card::before{
          content:'';position:absolute;top:-50px;right:-10px;
          width:200px;height:180px;
          background:radial-gradient(circle,rgba(56,189,248,0.06) 0%,transparent 68%);
          pointer-events:none;
        }
        .bal-eyebrow{font-size:0.53rem;font-weight:700;color:var(--ink-faint);letter-spacing:0.13em;text-transform:uppercase;margin-bottom:6px;}
        .bal-amount{
          font-size:2.9rem;font-weight:700;color:var(--ink);
          letter-spacing:-0.03em;line-height:1;margin-bottom:8px;
          display:flex;align-items:flex-start;gap:1px;
        }
        .bal-amount sup{font-size:1rem;font-weight:500;margin-top:9px;color:var(--ink-dim);}
        .bal-amount .cents{font-size:1.1rem;font-weight:400;color:var(--ink-dim);align-self:flex-end;margin-bottom:4px;}
        /* Change row: pnl + period label + sparkline, all left-anchored */
        .bal-meta-row{display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap;}
        .bal-change{font-size:0.72rem;font-weight:600;font-family:var(--mono);}
        .bal-change.pos{color:var(--green);}
        .bal-change.neg{color:var(--red);}
        .bal-period{font-size:0.58rem;font-weight:300;color:var(--ink-faint);}
        /* Actions: tight left-anchored row */
        .bal-actions{display:flex;gap:7px;align-items:center;}
        .btn-dep{
          background:var(--accent);color:#071521;border:none;border-radius:8px;
          padding:9px 15px;font-family:var(--sans);font-size:0.7rem;font-weight:700;
          cursor:pointer;transition:opacity 0.15s;flex-shrink:0;
        }
        .btn-dep:hover{opacity:0.86;}
        .btn-ghost{
          background:var(--bg-3);color:var(--ink-2);border:none;border-radius:8px;
          padding:9px 12px;font-family:var(--sans);font-size:0.7rem;font-weight:600;
          cursor:pointer;transition:background 0.15s;text-decoration:none;
          display:inline-flex;align-items:center;flex-shrink:0;
        }
        .btn-ghost:hover{background:#16324a;}

        /* ── TX DRAWER — same horizontal span as hero card ── */
        .tx-drawer{overflow:hidden;transition:max-height 0.35s ease;margin:0 var(--side);}
        .tx-drawer-inner{
          background:var(--card);border:1px solid var(--bg-3);border-top:none;
          border-radius:0 0 12px 12px;padding:12px var(--side) 10px;
        }
        .tx-drawer-label{font-size:0.53rem;color:var(--ink-faint);margin-bottom:8px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;}

        /* ── STAT ROW — full bleed side padding, no card box ── */
        .stat-row{
          display:flex;align-items:flex-start;
          padding:18px var(--side) 2px;
          gap:0;
        }
        .stat-cell{flex:1;}
        .stat-cell+.stat-cell{padding-left:14px;border-left:1px solid var(--bg-3);}
        .stat-cell:first-child .stat-val{font-size:1.1rem;}
        .stat-lbl{font-size:0.5rem;font-weight:700;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;}
        .stat-val{font-size:0.92rem;font-weight:700;color:var(--ink);line-height:1;margin-bottom:3px;}
        .stat-val.pos{color:var(--green);}
        .stat-val.neg{color:var(--red);}
        .stat-sub{font-size:0.52rem;font-weight:400;color:var(--ink-faint);}

        /* ── DIVIDER — full bleed ── */
        .section-divider{height:1px;background:var(--bg-3);margin:16px 0;}

        /* ── SECTION LABEL — standard side padding ── */
        .section-label{
          font-size:0.53rem;font-weight:700;color:var(--ink-faint);
          text-transform:uppercase;letter-spacing:0.13em;
          padding:0 var(--side) 10px;
          display:flex;align-items:center;gap:7px;
        }
        .section-label-pip{display:inline-block;width:2px;height:10px;background:var(--accent);border-radius:1px;flex-shrink:0;}

        /* ── 2-COL CARDS — bleed to edges with side padding only ── */
        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 var(--side) 8px;}
        .info-card{background:var(--card);border:1px solid var(--bg-3);border-radius:12px;padding:13px;}
        .ic-label{font-size:0.5rem;font-weight:700;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;}
        .movers-item{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
        .movers-item:last-child{margin-bottom:0;}
        .mover-sym{display:flex;align-items:center;gap:6px;font-family:var(--mono);font-size:0.63rem;font-weight:500;color:var(--ink);}
        .mover-ico{width:17px;height:17px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#fff;flex-shrink:0;}
        .mover-chg{font-family:var(--mono);font-size:0.6rem;font-weight:500;}
        .mover-chg.up{color:var(--green);}
        .mover-chg.dn{color:var(--red);}
        .activity-item{font-size:0.58rem;font-weight:400;color:var(--ink-dim);margin-bottom:7px;line-height:1.4;padding-left:8px;border-left:2px solid var(--bg-3);}
        .activity-item:last-child{margin-bottom:0;}

        /* ── MARKETS TABLE — full bleed with side padding ── */
        .asset-section{padding:0 var(--side) 24px;}
        .asset-table-wrap{background:var(--card);border:1px solid var(--bg-3);border-radius:12px;overflow:hidden;}
        .asset-thead{display:grid;grid-template-columns:2fr 1.2fr 1fr 1.4fr;padding:8px 13px;border-bottom:1px solid var(--bg-3);background:var(--bg-1);}
        .asset-th{font-size:0.5rem;font-weight:700;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.08em;}
        .asset-row{display:grid;grid-template-columns:2fr 1.2fr 1fr 1.4fr;align-items:center;padding:10px 13px;border-bottom:1px solid var(--bg-3);transition:background 0.12s;}
        .asset-row:last-child{border-bottom:none;}
        .asset-row:hover{background:rgba(255,255,255,0.02);}
        .asset-name-cell{display:flex;align-items:center;gap:8px;}
        .asset-ico{width:27px;height:27px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff;flex-shrink:0;}
        .asset-sym{font-family:var(--mono);font-size:0.67rem;font-weight:600;color:var(--ink);line-height:1;margin-bottom:1px;}
        .asset-nm{font-size:0.5rem;font-weight:300;color:var(--ink-faint);}
        .asset-price{font-family:var(--mono);font-size:0.63rem;font-weight:500;color:var(--ink);}
        .asset-chg{font-family:var(--mono);font-size:0.58rem;font-weight:600;}
        .asset-chg.up{color:var(--green);}
        .asset-chg.dn{color:var(--red);}
        .trade-btns{display:flex;gap:4px;}
        .btn-buy{background:var(--accent);color:#071521;border:none;border-radius:5px;padding:5px 9px;font-family:var(--sans);font-size:0.57rem;font-weight:700;cursor:pointer;transition:opacity 0.12s;}
        .btn-buy:hover{opacity:0.78;}
        .btn-sell{background:transparent;color:var(--ink-2);border:1px solid var(--bg-3);border-radius:5px;padding:5px 9px;font-family:var(--sans);font-size:0.57rem;font-weight:600;cursor:pointer;transition:background 0.12s;}
        .btn-sell:hover{background:var(--bg-3);}

        /* ── SHEET ── */
        .sheet-overlay{position:fixed;inset:0;background:rgba(4,12,20,0.78);z-index:200;backdrop-filter:blur(3px);animation:fadeIn 0.2s ease;}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .sheet{position:fixed;bottom:0;left:0;right:0;background:#0d2135;border-radius:20px 20px 0 0;border-top:1px solid var(--bg-3);padding:0 var(--side) 40px;z-index:201;animation:slideUp 0.3s cubic-bezier(0.32,0.72,0,1);max-width:480px;margin:0 auto;}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes dspin{to{transform:rotate(360deg)}}
        .sheet-handle{width:32px;height:3px;background:var(--bg-3);border-radius:2px;margin:12px auto 18px;}
        .sheet-title{font-size:1rem;font-weight:700;color:var(--ink);letter-spacing:-0.02em;margin-bottom:4px;}
        .sheet-sub{font-size:0.63rem;font-weight:300;color:var(--ink-faint);margin-bottom:18px;}
        .sheet-full-link{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:12px;background:var(--accent);color:#071521;border-radius:10px;font-family:var(--sans);font-size:0.77rem;font-weight:700;text-decoration:none;transition:opacity 0.15s;margin-top:12px;}
        .sheet-full-link:hover{opacity:0.85;}
      `}</style>

      <div className="dash-wrap">

        {/* HEADER */}
        <div className="d-header">
          <div>
            <p className="d-greeting">Welcome back</p>
            <p className="d-name">{firstName}</p>
            <p className="d-uid">APEX·MKTS / {userId}</p>
          </div>
          <div className="d-header-right">
            <div className="d-live-chip"><span className="live-dot" />Live</div>
            <span className="d-clock">{time}</span>
          </div>
        </div>

        {/* HERO BALANCE */}
        <div className="hero-card">
          <p className="bal-eyebrow">Net Asset Value</p>
          <p className="bal-amount">
            <sup>$</sup>
            {fmt(balance, 0)}
            <span className="cents">.00</span>
          </p>
          <div className="bal-meta-row">
            <span className={`bal-change ${profit >= 0 ? 'pos' : 'neg'}`}>
              {profit >= 0 ? '+' : ''}${fmt(Math.abs(profit))} ({changePercent >= 0 ? '+' : ''}{fmt(changePercent)}%)
            </span>
            <span className="bal-period">Since first deposit</span>
            <Sparkline positive={profit >= 0} width={56} height={22} />
          </div>
          <div className="bal-actions">
            <button className="btn-dep" onClick={openDeposit}>+ Deposit</button>
            <Link href="/dashboard/withdraw" className="btn-ghost">Withdraw</Link>
            <button className="btn-ghost" onClick={() => setBalanceOpen(v => !v)}>
              {balanceOpen ? '↑ Hide' : '📋 History'}
            </button>
          </div>
        </div>

        {/* TX DRAWER */}
        <div className="tx-drawer" style={{ maxHeight: balanceOpen ? 260 : 0 }}>
          <div className="tx-drawer-inner">
            <p className="tx-drawer-label">Recent Transactions</p>
            {transactions.length === 0
              ? <p style={{ fontSize: '0.65rem', color: 'var(--ink-faint)', fontWeight: 300 }}>No transactions yet.</p>
              : transactions.slice(0, 5).map(tx => (
                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--bg-3)', fontSize: '0.67rem' }}>
                  <span style={{ color: tx.type === 'Deposit' ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>{tx.type}</span>
                  <span style={{ fontFamily: 'var(--mono)', color: 'var(--ink)' }}>${fmt(tx.amount, 0)}</span>
                  <Badge status={tx.status} />
                </div>
              ))}
          </div>
        </div>

        {/* STAT ROW */}
        <div className="stat-row">
          <div className="stat-cell">
            <p className="stat-lbl">P &amp; L</p>
            <p className={`stat-val ${profit >= 0 ? 'pos' : 'neg'}`}>{profit >= 0 ? '+' : '-'}${fmt(Math.abs(profit))}</p>
            <p className="stat-sub">vs first deposit</p>
          </div>
          <div className="stat-cell">
            <p className="stat-lbl">Positions</p>
            <p className="stat-val">{openPositions} open</p>
            <p className="stat-sub">From trade history</p>
          </div>
          <div className="stat-cell">
            <p className="stat-lbl">Risk</p>
            <p className="stat-val">{riskLabel}</p>
            <p className="stat-sub">Vol. {fmt(volatility, 1)}%</p>
          </div>
        </div>

        <div className="section-divider" />

        {/* MARKET OVERVIEW */}
        <p className="section-label"><span className="section-label-pip" />Market Overview</p>
        <div className="two-col">
          <div className="info-card">
            <p className="ic-label">Top Movers</p>
            {topMovers.length === 0
              ? <p style={{ fontSize: '0.6rem', color: 'var(--ink-faint)' }}>No data</p>
              : topMovers.map(m => (
                <div key={m.symbol} className="movers-item">
                  <span className="mover-sym">
                    <span className="mover-ico" style={{ background: m.iconBg }}>{m.icon}</span>
                    {m.symbol}
                  </span>
                  <span className={`mover-chg ${m.change24h >= 0 ? 'up' : 'dn'}`}>
                    {m.change24h >= 0 ? '+' : ''}{fmt(m.change24h)}%
                  </span>
                </div>
              ))}
          </div>
          <div className="info-card">
            <p className="ic-label">Recent Activity</p>
            {activityLogs.length === 0
              ? <p style={{ fontSize: '0.6rem', color: 'var(--ink-faint)' }}>No recent activity</p>
              : activityLogs.slice(0, 4).map(a => (
                <p key={a.id} className="activity-item">{a.description}</p>
              ))}
          </div>
        </div>

        <div className="section-divider" />

        {/* MARKETS */}
        <p className="section-label"><span className="section-label-pip" />Markets</p>
        <div className="asset-section">
          <div className="asset-table-wrap">
            <div className="asset-thead">
              <span className="asset-th">Asset</span>
              <span className="asset-th">Price</span>
              <span className="asset-th">24H</span>
              <span className="asset-th">Trade</span>
            </div>
            {markets.length === 0
              ? <div style={{ padding: '20px 13px' }}>
                  <p style={{ fontSize: '0.65rem', color: 'var(--ink-faint)', fontWeight: 300 }}>No market data available.</p>
                </div>
              : markets.map(a => (
                <div key={a.id} className="asset-row">
                  <div className="asset-name-cell">
                    <div className="asset-ico" style={{ background: a.iconBg }}>{a.icon}</div>
                    <div>
                      <div className="asset-sym">{a.symbol}</div>
                      <div className="asset-nm">{a.name}</div>
                    </div>
                  </div>
                  <span className="asset-price">${fmt(a.price)}</span>
                  <span className={`asset-chg ${a.change24h >= 0 ? 'up' : 'dn'}`}>
                    {a.change24h >= 0 ? '+' : ''}{fmt(a.change24h)}%
                  </span>
                  <div className="trade-btns">
                    <button className="btn-buy">Buy</button>
                    <button className="btn-sell">Sell</button>
                  </div>
                </div>
              ))}
          </div>
        </div>

      </div>

      {/* QUICK DEPOSIT SHEET */}
      {sheet === 'deposit' && (
        <>
          <div className="sheet-overlay" onClick={closeSheet} />
          <div className="sheet">
            <div className="sheet-handle" />
            <p className="sheet-title">Quick Deposit</p>
            <p className="sheet-sub">Copy an address and send funds — then confirm on the full deposit page</p>

            {methodsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', gap: 12 }}>
                <div style={{ width: 26, height: 26, border: '2.5px solid var(--bg-3)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'dspin 0.7s linear infinite' }} />
                <p style={{ fontSize: '0.63rem', color: 'var(--ink-faint)' }}>Loading…</p>
              </div>
            ) : depositMethods.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0' }}>
                <p style={{ fontSize: '1.7rem', marginBottom: 10 }}>🔧</p>
                <p style={{ fontSize: '0.73rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>No deposit methods yet</p>
                <p style={{ fontSize: '0.63rem', color: 'var(--ink-faint)', fontWeight: 300 }}>Contact support or check back later.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
                  {depositMethods.map(m => (
                    <button key={m.id} onClick={() => setMethod(m.id)} style={{
                      flexShrink: 0, padding: '6px 13px', borderRadius: 20,
                      border: method === m.id ? 'none' : '1px solid var(--bg-3)',
                      background: method === m.id ? 'var(--accent)' : 'var(--card)',
                      color: method === m.id ? '#071521' : 'var(--ink-dim)',
                      fontFamily: 'var(--sans)', fontSize: '0.68rem', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
                {activeMethod && (
                  <div style={{ background: 'var(--card)', border: '1.5px solid var(--bg-3)', borderRadius: 11, padding: '13px 14px', marginBottom: 10 }}>
                    {activeMethod.network && (
                      <p style={{ fontSize: '0.53rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                        Network: {activeMethod.network}
                      </p>
                    )}
                    <p style={{ fontFamily: 'var(--mono)', fontSize: '0.66rem', color: 'var(--ink)', wordBreak: 'break-all', lineHeight: 1.6, marginBottom: 12 }}>
                      {activeMethod.address}
                    </p>
                    <button onClick={() => copyAddress(activeMethod.address)} style={{
                      width: '100%', padding: '9px', borderRadius: 7, border: 'none',
                      background: copied ? 'var(--green-l)' : 'var(--bg-3)',
                      color: copied ? 'var(--green)' : 'var(--ink-dim)',
                      fontFamily: 'var(--sans)', fontSize: '0.7rem', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                      {copied ? '✓ Copied!' : '📋 Copy Address'}
                    </button>
                  </div>
                )}
                {activeMethod?.note && (
                  <div style={{ display: 'flex', gap: 8, background: 'var(--gold-l)', border: '1px solid #3a2e00', borderRadius: 9, padding: '9px 13px', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.8rem' }}>⚠️</span>
                    <p style={{ fontSize: '0.6rem', color: 'var(--gold)', fontWeight: 400, lineHeight: 1.5 }}>{activeMethod.note}</p>
                  </div>
                )}
              </>
            )}
            <Link href="/dashboard/deposit" className="sheet-full-link" onClick={closeSheet}>
              Full Deposit Page →
            </Link>
          </div>
        </>
      )}
    </>
  );
}
