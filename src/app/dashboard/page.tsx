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

function Sparkline({ positive = true, width = 80, height = 32 }) {
  const pts = positive
    ? '0,28 14,20 28,22 42,12 56,16 70,6 80,8'
    : '0,6 14,12 28,10 42,20 56,16 70,24 80,28';
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
    <span style={{ background: bg, color: col, padding: '2px 8px', borderRadius: 20,
      fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
      fontFamily: 'var(--mono)' }}>
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

  const balance       = data?.user.portfolioBalance       ?? 0;
  const changePercent = data?.user.portfolioChangePercent ?? 0;
  const profit        = data?.user.realisedPnl            ?? 0;
  const firstName     = data?.user.firstName              ?? '';
  const userId        = data?.user.id?.slice(-6).toUpperCase() ?? '------';
  const transactions  = data?.transactions                ?? [];
  const openPositions = data?.positions.open              ?? 0;
  const profitPos     = data?.positions.profit            ?? 0;
  const lossPos       = data?.positions.loss              ?? 0;
  const notifications = data?.notifications               ?? [];
  const activityLogs  = data?.activityLogs                ?? [];
  const riskLabel     = data?.user.riskLabel              ?? 'Conservative';
  const volatility    = data?.user.volatility             ?? 0;
  const activeMethod  = depositMethods.find(m => m.id === method);

  const topMovers = [...markets]
    .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
    .slice(0, 4);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#112838' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #1e3d52', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        :root {
          --bg:#112838;--bg-1:#0e2132;--bg-2:#1a3a50;--bg-3:#245068;
          --card:#172f42;--ink:#e8f4fd;--ink-2:#c8dfed;--ink-dim:#7aaec8;
          --ink-faint:#4d7a96;--accent:#38bdf8;--accent-l:#0c2d3f;
          --green:#4ade80;--green-l:#0d3320;--red:#f87171;--red-l:#2a0d0d;
          --gold-l:#2a2200;--gold:#fbbf24;
          --sans:'DM Sans',system-ui,sans-serif;--mono:'DM Mono','SF Mono',monospace;
        }
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:var(--bg);font-family:var(--sans);}
        .dash-wrap{max-width:480px;margin:0 auto;background:var(--bg);min-height:100vh;padding-bottom:40px;}
        .d-header{display:flex;align-items:flex-start;justify-content:space-between;padding:18px 18px 12px;}
        .d-greeting{font-size:0.82rem;font-weight:400;color:var(--ink-dim);margin-bottom:2px;}
        .d-name{font-size:1.7rem;font-weight:700;color:var(--ink);letter-spacing:-0.02em;line-height:1;margin-bottom:4px;}
        .d-uid{font-family:var(--mono);font-size:0.6rem;letter-spacing:0.1em;color:var(--ink-faint);}
        .d-header-right{display:flex;align-items:center;gap:10px;}
        .d-live-chip{display:flex;align-items:center;gap:5px;background:var(--card);border:1px solid var(--bg-2);border-radius:20px;padding:5px 12px;font-family:var(--mono);font-size:0.62rem;font-weight:500;color:var(--ink);box-shadow:0 1px 4px rgba(0,0,0,0.3);}
        .live-dot{width:8px;height:8px;background:#22c55e;border-radius:50%;animation:blink 2s ease-in-out infinite;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.4}}
        .d-clock{font-family:var(--mono);font-size:0.75rem;color:var(--ink-dim);letter-spacing:0.05em;}
        .balance-card{background:var(--card);border-radius:16px;padding:18px 18px 14px;border:1px solid var(--bg-2);}
        .bal-eyebrow{font-size:0.6rem;font-weight:600;color:var(--ink-faint);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;}
        .bal-amount{font-size:2.4rem;font-weight:700;color:var(--ink);letter-spacing:-0.03em;line-height:1;margin-bottom:6px;}
        .bal-amount sup{font-size:1.1rem;font-weight:500;vertical-align:super;}
        .bal-amount .cents{font-size:1.2rem;font-weight:500;color:var(--ink-dim);}
        .bal-change{font-size:0.8rem;font-weight:600;color:var(--green);margin-bottom:2px;}
        .bal-period{font-size:0.65rem;font-weight:300;color:var(--ink-faint);margin-bottom:12px;}
        .sparkline-row{margin-bottom:14px;}
        .bal-actions{display:flex;gap:8px;}
        .btn-dep{background:var(--accent);color:#0a1f2e;border:none;border-radius:8px;padding:8px 16px;font-family:var(--sans);font-size:0.72rem;font-weight:700;cursor:pointer;transition:opacity 0.15s;}
        .btn-dep:hover{opacity:0.88;}
        .btn-wd{background:var(--bg-2);color:var(--ink-2);border:none;border-radius:8px;padding:8px 16px;font-family:var(--sans);font-size:0.72rem;font-weight:600;cursor:pointer;transition:background 0.15s;text-decoration:none;display:inline-flex;align-items:center;}
        .btn-wd:hover{background:var(--bg-3);}
        .btn-tx{background:var(--bg-2);color:var(--ink-dim);border:1px solid var(--bg-3);font-family:var(--sans);font-size:0.72rem;font-weight:600;cursor:pointer;padding:8px 14px;border-radius:8px;transition:background 0.15s;}
        .btn-tx:hover{background:var(--bg-3);}
        .tx-drawer{overflow:hidden;transition:max-height 0.35s ease;}
        .tx-drawer-inner{padding:14px 18px 6px;border-top:1px solid var(--bg-2);}
        .stat-bar{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;margin:0 18px 10px;background:var(--card);border-radius:12px;border:1px solid var(--bg-2);overflow:hidden;}
        .stat-cell{padding:12px 14px;border-right:1px solid var(--bg-2);}
        .stat-cell:last-child{border-right:none;}
        .stat-lbl{font-size:0.58rem;font-weight:600;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;}
        .stat-val{font-size:0.95rem;font-weight:700;color:var(--ink);line-height:1;margin-bottom:2px;}
        .stat-val.pos{color:var(--green);}
        .stat-sub{font-size:0.58rem;font-weight:300;color:var(--ink-faint);}
        .metrics-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 18px 10px;}
        .metric-card,.movers-card,.activity-card{background:var(--card);border:1px solid var(--bg-2);border-radius:12px;padding:14px;}
        .mc-label{font-size:0.6rem;font-weight:500;color:var(--ink-faint);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.06em;}
        .mc-val{font-size:1.2rem;font-weight:700;color:var(--ink);letter-spacing:-0.02em;line-height:1;margin-bottom:2px;}
        .mc-sub{font-size:0.6rem;font-weight:300;color:var(--ink-faint);}
        .mc-change{font-size:0.65rem;font-weight:600;color:var(--green);margin-bottom:2px;}
        .movers-item{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
        .movers-item:last-child{margin-bottom:0;}
        .mover-sym{display:flex;align-items:center;gap:6px;font-family:var(--mono);font-size:0.7rem;font-weight:500;color:var(--ink);}
        .mover-ico{width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0;}
        .mover-chg{font-family:var(--mono);font-size:0.65rem;font-weight:500;}
        .mover-chg.up{color:var(--green);}
        .mover-chg.dn{color:var(--red);}
        .activity-item{font-size:0.65rem;font-weight:400;color:var(--ink-dim);margin-bottom:6px;line-height:1.3;}
        .activity-item:last-child{margin-bottom:0;}
        .bottom-metrics{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;padding:0 18px 10px;}
        .bm-card{background:var(--card);border:1px solid var(--bg-2);border-radius:12px;padding:12px;}
        .bm-lbl{font-size:0.58rem;font-weight:600;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;}
        .bm-val{font-size:1rem;font-weight:700;color:var(--ink);letter-spacing:-0.02em;line-height:1;margin-bottom:2px;}
        .bm-sub{font-size:0.58rem;font-weight:300;color:var(--ink-faint);line-height:1.3;}
        .bm-dot{font-size:0.6rem;color:var(--green);}
        .bm-dot.red{color:var(--red);}
        .asset-section{padding:0 18px 20px;}
        .section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
        .section-title{font-size:0.62rem;font-weight:700;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.1em;display:flex;align-items:center;gap:6px;}
        .asset-table-wrap{background:var(--card);border:1px solid var(--bg-2);border-radius:14px;overflow:hidden;}
        .asset-thead{display:grid;grid-template-columns:2fr 1fr 1.3fr 1fr 1fr 1.4fr;padding:10px 14px;border-bottom:1px solid var(--bg-2);background:var(--bg-1);}
        .asset-th{font-size:0.55rem;font-weight:700;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.08em;}
        .asset-row{display:grid;grid-template-columns:2fr 1fr 1.3fr 1fr 1fr 1.4fr;align-items:center;padding:13px 14px;border-bottom:1px solid var(--bg-2);transition:background 0.12s;}
        .asset-row:last-child{border-bottom:none;}
        .asset-row:hover{background:var(--bg-1);}
        .asset-name-cell{display:flex;align-items:center;gap:8px;}
        .asset-ico{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#fff;flex-shrink:0;}
        .asset-sym{font-family:var(--mono);font-size:0.72rem;font-weight:600;color:var(--ink);line-height:1;margin-bottom:1px;}
        .asset-nm{font-size:0.58rem;font-weight:300;color:var(--ink-faint);}
        .asset-ticker{font-family:var(--mono);font-size:0.62rem;font-weight:500;color:var(--ink-dim);}
        .asset-price{font-family:var(--mono);font-size:0.7rem;font-weight:500;color:var(--ink);font-feature-settings:'tnum';}
        .asset-chg{font-family:var(--mono);font-size:0.65rem;font-weight:600;}
        .asset-chg.up{color:var(--green);}
        .asset-chg.dn{color:var(--red);}
        .asset-vol{font-family:var(--mono);font-size:0.62rem;font-weight:400;color:var(--ink-dim);}
        .trade-btns{display:flex;gap:4px;}
        .btn-buy{background:var(--accent);color:#0a1f2e;border:none;border-radius:6px;padding:5px 10px;font-family:var(--sans);font-size:0.62rem;font-weight:700;cursor:pointer;transition:opacity 0.12s;}
        .btn-buy:hover{opacity:0.78;}
        .btn-sell{background:transparent;color:var(--ink-2);border:1px solid var(--bg-3);border-radius:6px;padding:5px 10px;font-family:var(--sans);font-size:0.62rem;font-weight:600;cursor:pointer;transition:background 0.12s;}
        .btn-sell:hover{background:var(--bg-2);}
        .sheet-overlay{position:fixed;inset:0;background:rgba(8,18,26,0.7);z-index:200;backdrop-filter:blur(2px);animation:fadeIn 0.2s ease;}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .sheet{position:fixed;bottom:0;left:0;right:0;background:#112838;border-radius:24px 24px 0 0;padding:0 20px 40px;z-index:201;animation:slideUp 0.3s cubic-bezier(0.32,0.72,0,1);max-width:480px;margin:0 auto;}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes dspin{to{transform:rotate(360deg)}}
        .sheet-handle{width:36px;height:4px;background:var(--bg-3);border-radius:2px;margin:12px auto 20px;}
        .sheet-title{font-size:1.1rem;font-weight:700;color:var(--ink);letter-spacing:-0.02em;margin-bottom:4px;}
        .sheet-sub{font-size:0.68rem;font-weight:300;color:var(--ink-faint);margin-bottom:20px;}
        .sheet-full-link{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:13px;background:var(--accent);color:#0a1f2e;border-radius:12px;font-family:var(--sans);font-size:0.8rem;font-weight:700;text-decoration:none;transition:opacity 0.15s;margin-top:12px;}
        .sheet-full-link:hover{opacity:0.85;}
        .sheet-full-link.dark{background:var(--bg-2);}
      `}</style>

      <div className="dash-wrap">

        {/* HEADER */}
        <div className="d-header">
          <div>
            <p className="d-greeting">Welcome back,</p>
            <p className="d-name">{firstName}</p>
            <p className="d-uid">APEX·MKTS / {userId}</p>
          </div>
          <div className="d-header-right">
            <div className="d-live-chip"><span className="live-dot" />Live</div>
            <span className="d-clock">{time}</span>
          </div>
        </div>

        {/* BALANCE */}
        <div style={{ padding: '0 18px 10px' }}>
          <div className="balance-card">
            <p className="bal-eyebrow">Net Asset Value</p>
            <p className="bal-amount"><sup>$</sup>{fmt(balance, 0)}<span className="cents">.00</span></p>
            <p className="bal-change">{profit >= 0 ? '+' : ''}${fmt(profit)} ({changePercent >= 0 ? '+' : ''}{fmt(changePercent)}%)</p>
            <p className="bal-period">Current period</p>
            <div className="sparkline-row"><Sparkline positive={profit >= 0} width={120} height={28} /></div>
            <div className="bal-actions">
              <button className="btn-dep" onClick={openDeposit}>+ Deposit</button>
              <Link href="/dashboard/withdraw" className="btn-wd">Withdraw</Link>
              <button className="btn-tx" onClick={() => setBalanceOpen(v => !v)}>
                {balanceOpen ? '↑ Hide' : '📋 History'}
              </button>
            </div>
          </div>
        </div>

        {/* TX DRAWER */}
        <div className="tx-drawer" style={{ maxHeight: balanceOpen ? 260 : 0, margin: '0 18px' }}>
          <div className="tx-drawer-inner">
            <p style={{ fontSize: '0.6rem', color: 'var(--ink-faint)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Recent Transactions</p>
            {transactions.length === 0
              ? <p style={{ fontSize: '0.65rem', color: 'var(--ink-faint)', fontWeight: 300 }}>No transactions yet.</p>
              : transactions.slice(0, 5).map(tx => (
                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--bg-2)', fontSize: '0.68rem' }}>
                  <span style={{ color: tx.type === 'Deposit' ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>{tx.type}</span>
                  <span style={{ fontFamily: 'var(--mono)', color: 'var(--ink)' }}>${fmt(tx.amount, 0)}</span>
                  <Badge status={tx.status} />
                </div>
              ))}
          </div>
        </div>

        {/* STAT BAR */}
        <div className="stat-bar">
          <div className="stat-cell">
            <p className="stat-lbl">P &amp; L</p>
            <p className="stat-val pos">{profit >= 0 ? '+' : ''}${fmt(profit)}</p>
            <p className="stat-sub">Realised</p>
          </div>
          <div className="stat-cell">
            <p className="stat-lbl">Positions</p>
            <p className="stat-val">{openPositions} open</p>
            <p className="stat-sub">{profitPos} profit · {lossPos} loss</p>
          </div>
          <div className="stat-cell">
            <p className="stat-lbl">Risk</p>
            <p className="stat-val">{riskLabel}</p>
            <p className="stat-sub">Volatility {fmt(volatility, 1)}%</p>
          </div>
        </div>

        {/* 4-METRIC GRID */}
        <div className="metrics-grid">
          <div className="metric-card">
            <p className="mc-label">Realised P&L</p>
            <p className="mc-val">${fmt(profit)}</p>
            <p className="mc-change">{changePercent >= 0 ? '+' : ''}{fmt(changePercent)}%</p>
            <p className="mc-sub">Current period</p>
            <div style={{ marginTop: 8 }}><Sparkline positive={profit >= 0} width={80} height={24} /></div>
          </div>
          <div className="movers-card">
            <p className="mc-label">Top Movers</p>
            {topMovers.length === 0
              ? <p style={{ fontSize: '0.62rem', color: 'var(--ink-faint)', fontWeight: 300 }}>No data</p>
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
          <div className="metric-card">
            <p className="mc-label">Portfolio Value</p>
            <p className="mc-val">${fmt(balance, 2)}</p>
            <p className="mc-sub">Mark-to-market</p>
          </div>
          <div className="activity-card">
            <p className="mc-label">Recent Activity</p>
            {activityLogs.length === 0
              ? <p className="activity-item" style={{ color: 'var(--ink-faint)' }}>No recent activity</p>
              : activityLogs.slice(0, 4).map(a => (
                <p key={a.id} className="activity-item">{a.description}</p>
              ))}
          </div>
        </div>

        {/* BOTTOM METRICS */}
        <div className="bottom-metrics">
          <div className="bm-card">
            <p className="bm-lbl">Open Positions</p>
            <p className="bm-val">{openPositions}</p>
            <p className="bm-sub">{profitPos} profit · {lossPos} loss</p>
          </div>
          <div className="bm-card">
            <p className="bm-lbl">Activity</p>
            {activityLogs.length === 0
              ? <p className="bm-sub">No activity</p>
              : activityLogs.slice(0, 2).map(a => (
                <p key={a.id} className="bm-sub" style={{ marginBottom: 4 }}>
                  <span className="bm-dot">●</span> {a.description}
                </p>
              ))}
          </div>
          <div className="bm-card">
            <p className="bm-lbl">Volatility</p>
            <p className="bm-val">{fmt(volatility, 1)}%</p>
            <p className="bm-sub">{riskLabel}</p>
          </div>
          <div className="bm-card">
            <p className="bm-lbl">Notifications</p>
            {notifications.length === 0
              ? <p className="bm-sub">None</p>
              : notifications.slice(0, 2).map(n => (
                <p key={n.id} className="bm-sub" style={{ marginBottom: 4 }}>
                  <span className="bm-dot red">●</span> {n.message}
                </p>
              ))}
          </div>
        </div>

        {/* MARKETS */}
        <div className="asset-section">
          <div className="section-head">
            <span className="section-title">
              <span style={{ display: 'inline-block', width: 3, height: 12, background: 'var(--accent)', borderRadius: 2 }} />
              Markets
            </span>
          </div>
          <div className="asset-table-wrap">
            <div className="asset-thead">
              <span className="asset-th">Asset</span>
              <span className="asset-th">Ticker</span>
              <span className="asset-th">Current Price</span>
              <span className="asset-th">24H Change</span>
              <span className="asset-th">Volume</span>
              <span className="asset-th">Quick Trade</span>
            </div>
            {markets.length === 0
              ? <div style={{ padding: '24px', textAlign: 'center' }}><p style={{ fontSize: '0.68rem', color: 'var(--ink-faint)', fontWeight: 300 }}>No market data available.</p></div>
              : markets.map(a => (
                <div key={a.id} className="asset-row">
                  <div className="asset-name-cell">
                    <div className="asset-ico" style={{ background: a.iconBg }}>{a.icon}</div>
                    <div>
                      <div className="asset-sym">{a.symbol}</div>
                      <div className="asset-nm">{a.name}</div>
                    </div>
                  </div>
                  <span className="asset-ticker">{a.symbol}</span>
                  <span className="asset-price">${fmt(a.price)}</span>
                  <span className={`asset-chg ${a.change24h >= 0 ? 'up' : 'dn'}`}>
                    {a.change24h >= 0 ? '+' : ''}{fmt(a.change24h)}%
                  </span>
                  <span className="asset-vol">${fmt(a.volume24h / 1_000_000_000, 1)}B</span>
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 0', gap: 12 }}>
                <div style={{ width: 26, height: 26, border: '2.5px solid var(--bg-2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'dspin 0.7s linear infinite' }} />
                <p style={{ fontSize: '0.65rem', color: 'var(--ink-faint)' }}>Loading…</p>
              </div>
            ) : depositMethods.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <p style={{ fontSize: '1.8rem', marginBottom: 10 }}>🔧</p>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>No deposit methods yet</p>
                <p style={{ fontSize: '0.65rem', color: 'var(--ink-faint)', fontWeight: 300 }}>Contact support or check back later.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
                  {depositMethods.map(m => (
                    <button key={m.id} onClick={() => setMethod(m.id)} style={{
                      flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                      border: method === m.id ? 'none' : '1px solid var(--bg-2)',
                      background: method === m.id ? 'var(--accent)' : 'var(--card)',
                      color: method === m.id ? '#0a1f2e' : 'var(--ink-dim)',
                      fontFamily: 'var(--sans)', fontSize: '0.7rem', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>

                {activeMethod && (
                  <div style={{ background: 'var(--card)', border: '1.5px solid var(--bg-2)', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
                    {activeMethod.network && (
                      <p style={{ fontSize: '0.56rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                        Network: {activeMethod.network}
                      </p>
                    )}
                    <p style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', color: 'var(--ink)', wordBreak: 'break-all', lineHeight: 1.6, marginBottom: 12 }}>
                      {activeMethod.address}
                    </p>
                    <button onClick={() => copyAddress(activeMethod.address)} style={{
                      width: '100%', padding: '9px', borderRadius: 8, border: 'none',
                      background: copied ? 'var(--green-l)' : 'var(--bg-2)',
                      color: copied ? 'var(--green)' : 'var(--ink-dim)',
                      fontFamily: 'var(--sans)', fontSize: '0.72rem', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                      {copied ? '✓ Copied!' : '📋 Copy Address'}
                    </button>
                  </div>
                )}

                {activeMethod?.note && (
                  <div style={{ display: 'flex', gap: 8, background: 'var(--gold-l)', border: '1px solid #3a2e00', borderRadius: 10, padding: '10px 14px', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.85rem' }}>⚠️</span>
                    <p style={{ fontSize: '0.62rem', color: 'var(--gold)', fontWeight: 400, lineHeight: 1.5 }}>{activeMethod.note}</p>
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
