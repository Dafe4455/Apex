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

// Mini sparkline for asset rows
function MiniLine({ positive = true }) {
  const pts = positive
    ? '0,14 10,10 20,11 30,6 40,8 50,3 60,4'
    : '0,3 10,6 20,5 30,10 40,8 50,12 60,14';
  return (
    <svg width="60" height="18" viewBox="0 0 60 18" fill="none">
      <polyline points={pts} stroke={positive ? '#34d399' : '#f87171'}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// Portfolio area chart
function PortfolioChart({ positive = true, width = 320, height = 80 }: { positive?: boolean; width?: number; height?: number }) {
  const pts = positive
    ? `0,${height} 0,${height * 0.7} 40,${height * 0.55} 80,${height * 0.6} 130,${height * 0.35} 180,${height * 0.42} 220,${height * 0.2} ${width},${height * 0.25} ${width},${height}`
    : `0,${height} 0,${height * 0.3} 40,${height * 0.45} 80,${height * 0.4} 130,${height * 0.6} 180,${height * 0.52} 220,${height * 0.75} ${width},${height * 0.7} ${width},${height}`;
  const line = positive
    ? `0,${height * 0.7} 40,${height * 0.55} 80,${height * 0.6} 130,${height * 0.35} 180,${height * 0.42} 220,${height * 0.2} ${width},${height * 0.25}`
    : `0,${height * 0.3} 40,${height * 0.45} 80,${height * 0.4} 130,${height * 0.6} 180,${height * 0.52} 220,${height * 0.75} ${width},${height * 0.7}`;
  const gradId = `grad-${positive ? 'pos' : 'neg'}`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" fill="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={positive ? '#34d399' : '#f87171'} stopOpacity="0.18" />
          <stop offset="100%" stopColor={positive ? '#34d399' : '#f87171'} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={pts} fill={`url(#${gradId})`} />
      <polyline points={line} stroke={positive ? '#34d399' : '#f87171'}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function Badge({ status }: { status: 'COMPLETED' | 'PENDING' | 'FAILED' }) {
  const map = {
    COMPLETED: { bg: 'rgba(52,211,153,0.1)', col: '#34d399' },
    PENDING:   { bg: 'rgba(251,191,36,0.1)',  col: '#fbbf24' },
    FAILED:    { bg: 'rgba(248,113,113,0.1)', col: '#f87171' },
  };
  const s = map[status] ?? map.COMPLETED;
  return (
    <span style={{
      background: s.bg, color: s.col,
      padding: '2px 7px', borderRadius: 20,
      fontSize: '0.52rem', fontWeight: 700,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      fontFamily: 'var(--mono)',
    }}>{status}</span>
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
  const activityLogs  = data?.activityLogs                ?? [];
  const riskLabel     = data?.user.riskLabel              ?? 'Conservative';
  const volatility    = data?.user.volatility             ?? 0;
  const activeMethod  = depositMethods.find(m => m.id === method);
  const isUp          = profit >= 0;

  const topMovers = [...markets]
    .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
    .slice(0, 4);

  // Fake allocation data for the donut
  const allocations = [
    { label: 'BTC', pct: 42, color: '#f7931a' },
    { label: 'ETH', pct: 28, color: '#627eea' },
    { label: 'SOL', pct: 18, color: '#9945ff' },
    { label: 'Other', pct: 12, color: '#2a3f5a' },
  ];

  // Build donut path
  const donutSegments = (() => {
    const cx = 32, cy = 32, r = 24, ir = 16;
    let angle = -90;
    return allocations.map(a => {
      const sweep = (a.pct / 100) * 360;
      const rad1 = (angle * Math.PI) / 180;
      const rad2 = ((angle + sweep) * Math.PI) / 180;
      const x1o = cx + r * Math.cos(rad1), y1o = cy + r * Math.sin(rad1);
      const x2o = cx + r * Math.cos(rad2), y2o = cy + r * Math.sin(rad2);
      const x1i = cx + ir * Math.cos(rad2), y1i = cy + ir * Math.sin(rad2);
      const x2i = cx + ir * Math.cos(rad1), y2i = cy + ir * Math.sin(rad1);
      const lg = sweep > 180 ? 1 : 0;
      const d = `M ${x1o} ${y1o} A ${r} ${r} 0 ${lg} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${ir} ${ir} 0 ${lg} 0 ${x2i} ${y2i} Z`;
      angle += sweep;
      return { ...a, d };
    });
  })();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08111e' }}>
        <div style={{ width: 28, height: 28, border: '2px solid #0d1f35', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&family=DM+Mono:wght@300;400;500&display=swap');

        :root {
          /* Matte deep navy — no blue tint, no shine */
          --bg:      #08111e;
          --bg-1:    #060e19;
          --surface: #0d1a2d;
          --surface-2: #102033;
          --border:  #152336;
          --border-2: #1c2f45;

          /* Text */
          --ink:     #e8f4ff;
          --ink-2:   #b8d4ee;
          --ink-3:   #6a90b0;
          --ink-4:   #3a5570;

          /* Accent */
          --blue:    #38bdf8;
          --green:   #34d399;
          --red:     #f87171;
          --gold:    #fbbf24;

          --sans: 'DM Sans', system-ui, sans-serif;
          --mono: 'DM Mono', 'SF Mono', monospace;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); font-family: var(--sans); -webkit-font-smoothing: antialiased; }

        .wrap { max-width: 480px; margin: 0 auto; background: var(--bg); min-height: 100vh; padding-bottom: 48px; }

        /* ── HEADER ── */
        .hdr { padding: 18px 20px 12px; display: flex; align-items: center; justify-content: space-between; }
        .hdr-left {}
        .hdr-greet { font-size: 0.68rem; color: var(--ink-4); font-weight: 400; margin-bottom: 1px; }
        .hdr-name { font-size: 1.35rem; font-weight: 600; color: var(--ink); letter-spacing: -0.02em; line-height: 1.1; }
        .hdr-right { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
        .live-pill { display: flex; align-items: center; gap: 5px; padding: 3px 9px; background: rgba(52,211,153,0.08); border-radius: 20px; }
        .live-dot { width: 5px; height: 5px; background: #34d399; border-radius: 50%; animation: blink 2s ease-in-out infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .live-text { font-family: var(--mono); font-size: 0.56rem; color: #34d399; letter-spacing: 0.06em; }
        .hdr-clock { font-family: var(--mono); font-size: 0.62rem; color: var(--ink-4); letter-spacing: 0.04em; }

        /* ── HERO CARD ── */
        .hero { margin: 4px 16px 0; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; }

        /* Top section: balance + actions */
        .hero-top { padding: 18px 18px 14px; }
        .hero-eyebrow { font-family: var(--mono); font-size: 0.52rem; color: var(--ink-4); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 6px; }
        .hero-balance { font-size: 2.2rem; font-weight: 600; color: var(--ink); letter-spacing: -0.03em; line-height: 1; }
        .hero-balance sup { font-size: 0.9rem; font-weight: 400; vertical-align: super; color: var(--ink-3); margin-right: 1px; }
        .hero-balance .cents { font-size: 1rem; font-weight: 300; color: var(--ink-3); }
        .hero-change { margin-top: 6px; display: flex; align-items: center; gap: 8px; }
        .hero-change-val { font-family: var(--mono); font-size: 0.72rem; font-weight: 500; color: var(--green); }
        .hero-change-val.neg { color: var(--red); }
        .hero-change-period { font-size: 0.6rem; color: var(--ink-4); font-weight: 300; }

        /* Chart strip */
        .hero-chart { height: 72px; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); overflow: hidden; position: relative; }
        .hero-chart-labels { position: absolute; bottom: 6px; left: 14px; right: 14px; display: flex; justify-content: space-between; pointer-events: none; }
        .hero-chart-label { font-family: var(--mono); font-size: 0.48rem; color: var(--ink-4); letter-spacing: 0.04em; }

        /* Bottom metrics row */
        .hero-metrics { display: grid; grid-template-columns: 1fr 1fr 1fr; }
        .hm-cell { padding: 12px 14px; }
        .hm-cell + .hm-cell { border-left: 1px solid var(--border); }
        .hm-label { font-family: var(--mono); font-size: 0.48rem; color: var(--ink-4); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
        .hm-val { font-size: 0.82rem; font-weight: 600; color: var(--ink); line-height: 1; }
        .hm-val.pos { color: var(--green); }
        .hm-val.neg { color: var(--red); }
        .hm-sub { font-size: 0.55rem; color: var(--ink-4); font-weight: 300; margin-top: 2px; }

        /* Actions */
        .hero-actions { padding: 12px 14px; display: flex; gap: 7px; border-top: 1px solid var(--border); }
        .btn-primary { background: var(--blue); color: #060e19; border: none; border-radius: 9px; padding: 9px 16px; font-family: var(--sans); font-size: 0.7rem; font-weight: 700; cursor: pointer; flex-shrink: 0; transition: opacity 0.15s; }
        .btn-primary:hover { opacity: 0.85; }
        .btn-ghost { background: var(--surface-2); color: var(--ink-2); border: none; border-radius: 9px; padding: 9px 13px; font-family: var(--sans); font-size: 0.7rem; font-weight: 500; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; transition: background 0.15s; }
        .btn-ghost:hover { background: var(--border-2); }

        /* ── TX DRAWER ── */
        .tx-drawer { overflow: hidden; transition: max-height 0.32s ease; margin: 0 16px; }
        .tx-drawer-inner { background: var(--surface); border: 1px solid var(--border); border-top: none; border-radius: 0 0 14px 14px; padding: 12px 14px 10px; }
        .tx-drawer-lbl { font-family: var(--mono); font-size: 0.5rem; color: var(--ink-4); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }

        /* ── SECTION HEADER ── */
        .sec-hdr { display: flex; align-items: center; gap: 7px; padding: 20px 20px 10px; }
        .sec-pip { width: 2px; height: 11px; background: var(--blue); border-radius: 2px; flex-shrink: 0; }
        .sec-title { font-family: var(--mono); font-size: 0.56rem; font-weight: 500; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.12em; }

        /* ── ALLOCATION + ACTIVITY ROW ── */
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 0 16px 4px; }
        .card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 14px; }
        .card-label { font-family: var(--mono); font-size: 0.5rem; color: var(--ink-4); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; }

        /* donut */
        .donut-wrap { display: flex; align-items: center; gap: 10px; }
        .donut-legend { flex: 1; display: flex; flex-direction: column; gap: 5px; }
        .dl-row { display: flex; align-items: center; gap: 5px; }
        .dl-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        .dl-name { font-family: var(--mono); font-size: 0.55rem; color: var(--ink-3); flex: 1; }
        .dl-pct { font-family: var(--mono); font-size: 0.55rem; color: var(--ink-2); font-weight: 500; }

        /* activity */
        .act-item { font-size: 0.6rem; color: var(--ink-3); line-height: 1.45; margin-bottom: 7px; padding-left: 8px; border-left: 1.5px solid var(--border-2); }
        .act-item:last-child { margin-bottom: 0; }

        /* ── DIVIDER ── */
        .divider { height: 1px; background: var(--border); margin: 16px 16px 0; opacity: 0.6; }

        /* ── MARKETS ── */
        .mkt-wrap { padding: 0 16px 24px; }
        .mkt-table { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
        .mkt-thead { display: grid; grid-template-columns: 2fr 1.1fr 0.7fr 1fr 1fr; padding: 8px 12px; background: var(--bg-1); border-bottom: 1px solid var(--border); }
        .mkt-th { font-family: var(--mono); font-size: 0.48rem; font-weight: 500; color: var(--ink-4); text-transform: uppercase; letter-spacing: 0.08em; }
        .mkt-row { display: grid; grid-template-columns: 2fr 1.1fr 0.7fr 1fr 1fr; align-items: center; padding: 11px 12px; border-bottom: 1px solid var(--border); transition: background 0.1s; }
        .mkt-row:last-child { border-bottom: none; }
        .mkt-row:hover { background: rgba(255,255,255,0.015); }
        .mkt-asset { display: flex; align-items: center; gap: 8px; }
        .mkt-ico { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: #fff; flex-shrink: 0; }
        .mkt-sym { font-family: var(--mono); font-size: 0.66rem; font-weight: 500; color: var(--ink); }
        .mkt-name { font-size: 0.52rem; color: var(--ink-4); font-weight: 300; margin-top: 1px; }
        .mkt-price { font-family: var(--mono); font-size: 0.64rem; color: var(--ink-2); }
        .mkt-chg { font-family: var(--mono); font-size: 0.6rem; font-weight: 500; }
        .mkt-chg.up { color: var(--green); }
        .mkt-chg.dn { color: var(--red); }
        .trade-btns { display: flex; gap: 4px; }
        .btn-buy { background: rgba(56,189,248,0.12); color: var(--blue); border: none; border-radius: 6px; padding: 5px 9px; font-family: var(--sans); font-size: 0.58rem; font-weight: 600; cursor: pointer; transition: background 0.12s; }
        .btn-buy:hover { background: rgba(56,189,248,0.2); }
        .btn-sell { background: rgba(248,113,113,0.08); color: var(--red); border: none; border-radius: 6px; padding: 5px 9px; font-family: var(--sans); font-size: 0.58rem; font-weight: 600; cursor: pointer; transition: background 0.12s; }
        .btn-sell:hover { background: rgba(248,113,113,0.15); }

        /* ── SHEET ── */
        .sheet-overlay { position: fixed; inset: 0; background: rgba(3,8,15,0.75); z-index: 200; backdrop-filter: blur(4px); animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .sheet { position: fixed; bottom: 0; left: 0; right: 0; background: #0c1826; border-radius: 22px 22px 0 0; border-top: 1px solid var(--border-2); padding: 0 20px 40px; z-index: 201; animation: slideUp 0.28s cubic-bezier(0.32,0.72,0,1); max-width: 480px; margin: 0 auto; }
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes dspin { to{transform:rotate(360deg)} }
        .sheet-handle { width: 32px; height: 3px; background: var(--border-2); border-radius: 2px; margin: 12px auto 20px; }
        .sheet-title { font-size: 1rem; font-weight: 600; color: var(--ink); letter-spacing: -0.02em; margin-bottom: 4px; }
        .sheet-sub { font-size: 0.62rem; color: var(--ink-4); font-weight: 300; margin-bottom: 20px; }
        .sheet-link { display: flex; align-items: center; justify-content: center; width: 100%; padding: 12px; background: var(--blue); color: #060e19; border-radius: 11px; font-size: 0.75rem; font-weight: 700; text-decoration: none; margin-top: 12px; transition: opacity 0.15s; }
        .sheet-link:hover { opacity: 0.85; }
      `}</style>

      <div className="wrap">

        {/* HEADER */}
        <div className="hdr">
          <div className="hdr-left">
            <p className="hdr-greet">Good morning,</p>
            <p className="hdr-name">{firstName}</p>
          </div>
          <div className="hdr-right">
            <div className="live-pill">
              <span className="live-dot" />
              <span className="live-text">LIVE</span>
            </div>
            <span className="hdr-clock">{time}</span>
          </div>
        </div>

        {/* HERO CARD */}
        <div className="hero">

          {/* Balance */}
          <div className="hero-top">
            <p className="hero-eyebrow">Portfolio Value</p>
            <p className="hero-balance">
              <sup>$</sup>{fmt(balance, 0)}<span className="cents">.{String(Math.round((balance % 1) * 100)).padStart(2, '0')}</span>
            </p>
            <div className="hero-change">
              <span className={`hero-change-val${isUp ? '' : ' neg'}`}>
                {isUp ? '+' : ''}${fmt(Math.abs(profit))} ({isUp ? '+' : ''}{fmt(changePercent)}%)
              </span>
              <span className="hero-change-period">vs last period</span>
            </div>
          </div>

          {/* Chart */}
          <div className="hero-chart">
            <PortfolioChart positive={isUp} width={480} height={72} />
            <div className="hero-chart-labels">
              {['1W', '2W', '3W', '4W', 'NOW'].map(l => (
                <span key={l} className="hero-chart-label">{l}</span>
              ))}
            </div>
          </div>

          {/* Metrics */}
          <div className="hero-metrics">
            <div className="hm-cell">
              <p className="hm-label">P &amp; L</p>
              <p className={`hm-val${isUp ? ' pos' : ' neg'}`}>{isUp ? '+' : ''}${fmt(Math.abs(profit))}</p>
              <p className="hm-sub">Realised</p>
            </div>
            <div className="hm-cell">
              <p className="hm-label">Positions</p>
              <p className="hm-val">{openPositions}</p>
              <p className="hm-sub">{profitPos}W · {lossPos}L</p>
            </div>
            <div className="hm-cell">
              <p className="hm-label">Risk</p>
              <p className="hm-val">{riskLabel}</p>
              <p className="hm-sub">σ {fmt(volatility, 1)}%</p>
            </div>
          </div>

          {/* Actions */}
          <div className="hero-actions">
            <button className="btn-primary" onClick={openDeposit}>+ Deposit</button>
            <Link href="/dashboard/withdraw" className="btn-ghost">Withdraw</Link>
            <button className="btn-ghost" onClick={() => setBalanceOpen(v => !v)}>
              {balanceOpen ? 'Hide' : 'History'}
            </button>
          </div>
        </div>

        {/* TX DRAWER */}
        <div className="tx-drawer" style={{ maxHeight: balanceOpen ? 240 : 0 }}>
          <div className="tx-drawer-inner">
            <p className="tx-drawer-lbl">Recent Transactions</p>
            {transactions.length === 0
              ? <p style={{ fontSize: '0.62rem', color: 'var(--ink-4)', fontWeight: 300 }}>No transactions yet.</p>
              : transactions.slice(0, 5).map(tx => (
                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: '0.65rem' }}>
                  <span style={{ color: tx.type === 'Deposit' ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>{tx.type}</span>
                  <span style={{ fontFamily: 'var(--mono)', color: 'var(--ink-2)' }}>${fmt(tx.amount, 0)}</span>
                  <Badge status={tx.status} />
                </div>
              ))}
          </div>
        </div>

        {/* ALLOCATION + ACTIVITY */}
        <div className="sec-hdr">
          <span className="sec-pip" />
          <span className="sec-title">Overview</span>
        </div>

        <div className="two-col">
          {/* Donut */}
          <div className="card">
            <p className="card-label">Allocation</p>
            <div className="donut-wrap">
              <svg width="64" height="64" viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
                {donutSegments.map(s => (
                  <path key={s.label} d={s.d} fill={s.color} />
                ))}
              </svg>
              <div className="donut-legend">
                {allocations.map(a => (
                  <div key={a.label} className="dl-row">
                    <span className="dl-dot" style={{ background: a.color }} />
                    <span className="dl-name">{a.label}</span>
                    <span className="dl-pct">{a.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="card">
            <p className="card-label">Activity</p>
            {activityLogs.length === 0
              ? <p style={{ fontSize: '0.58rem', color: 'var(--ink-4)' }}>No recent activity</p>
              : activityLogs.slice(0, 4).map(a => (
                <p key={a.id} className="act-item">{a.description}</p>
              ))}
          </div>
        </div>

        {/* MARKETS */}
        <div className="divider" />
        <div className="sec-hdr">
          <span className="sec-pip" />
          <span className="sec-title">Markets</span>
        </div>

        <div className="mkt-wrap">
          <div className="mkt-table">
            <div className="mkt-thead">
              <span className="mkt-th">Asset</span>
              <span className="mkt-th">Price</span>
              <span className="mkt-th">24H</span>
              <span className="mkt-th">7D</span>
              <span className="mkt-th">Trade</span>
            </div>
            {markets.length === 0
              ? <div style={{ padding: '24px', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.65rem', color: 'var(--ink-4)', fontWeight: 300 }}>No market data.</p>
                </div>
              : markets.map(a => (
                <div key={a.id} className="mkt-row">
                  <div className="mkt-asset">
                    <div className="mkt-ico" style={{ background: a.iconBg }}>{a.icon}</div>
                    <div>
                      <div className="mkt-sym">{a.symbol}</div>
                      <div className="mkt-name">{a.name}</div>
                    </div>
                  </div>
                  <span className="mkt-price">${fmt(a.price)}</span>
                  <span className={`mkt-chg ${a.change24h >= 0 ? 'up' : 'dn'}`}>
                    {a.change24h >= 0 ? '+' : ''}{fmt(a.change24h)}%
                  </span>
                  <MiniLine positive={a.change24h >= 0} />
                  <div className="trade-btns">
                    <button className="btn-buy">Buy</button>
                    <button className="btn-sell">Sell</button>
                  </div>
                </div>
              ))}
          </div>
        </div>

      </div>

      {/* DEPOSIT SHEET */}
      {sheet === 'deposit' && (
        <>
          <div className="sheet-overlay" onClick={closeSheet} />
          <div className="sheet">
            <div className="sheet-handle" />
            <p className="sheet-title">Quick Deposit</p>
            <p className="sheet-sub">Copy an address and send funds — confirm on the full deposit page</p>

            {methodsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', gap: 10 }}>
                <div style={{ width: 24, height: 24, border: '2px solid var(--border-2)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'dspin 0.7s linear infinite' }} />
                <p style={{ fontSize: '0.62rem', color: 'var(--ink-4)' }}>Loading…</p>
              </div>
            ) : depositMethods.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>No deposit methods yet</p>
                <p style={{ fontSize: '0.62rem', color: 'var(--ink-4)', fontWeight: 300 }}>Contact support or check back later.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 7, marginBottom: 14, overflowX: 'auto', paddingBottom: 2 }}>
                  {depositMethods.map(m => (
                    <button key={m.id} onClick={() => setMethod(m.id)} style={{
                      flexShrink: 0, padding: '5px 13px', borderRadius: 20,
                      border: 'none',
                      background: method === m.id ? 'var(--blue)' : 'var(--surface-2)',
                      color: method === m.id ? '#060e19' : 'var(--ink-3)',
                      fontFamily: 'var(--sans)', fontSize: '0.68rem', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
                {activeMethod && (
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 11, padding: '13px 14px', marginBottom: 10 }}>
                    {activeMethod.network && (
                      <p style={{ fontFamily: 'var(--mono)', fontSize: '0.52rem', color: 'var(--blue)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7 }}>
                        {activeMethod.network}
                      </p>
                    )}
                    <p style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--ink-2)', wordBreak: 'break-all', lineHeight: 1.6, marginBottom: 11 }}>
                      {activeMethod.address}
                    </p>
                    <button onClick={() => copyAddress(activeMethod.address)} style={{
                      width: '100%', padding: '8px', borderRadius: 8, border: 'none',
                      background: copied ? 'rgba(52,211,153,0.1)' : 'var(--surface-2)',
                      color: copied ? 'var(--green)' : 'var(--ink-3)',
                      fontFamily: 'var(--sans)', fontSize: '0.7rem', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                      {copied ? '✓ Copied' : 'Copy Address'}
                    </button>
                  </div>
                )}
                {activeMethod?.note && (
                  <div style={{ display: 'flex', gap: 7, background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.12)', borderRadius: 9, padding: '9px 12px', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.8rem' }}>⚠️</span>
                    <p style={{ fontSize: '0.6rem', color: 'var(--gold)', lineHeight: 1.5 }}>{activeMethod.note}</p>
                  </div>
                )}
              </>
            )}
            <Link href="/dashboard/deposit" className="sheet-link" onClick={closeSheet}>
              Full Deposit Page →
            </Link>
          </div>
        </>
      )}
    </>
  );
}
