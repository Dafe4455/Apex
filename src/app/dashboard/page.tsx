'use client';

import { useEffect, useState } from 'react';

/* ─── tiny helpers ─── */
function fmt(n: number | null | undefined, d = 2) { 
  return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

/* ─── Gauge (Risk Profile) ─── */
function Gauge({ value = 0.4 }) {
  const r = 44, cx = 56, cy = 56;
  const circ = Math.PI * r; // half-circle
  const pct = Math.min(Math.max(value / 2, 0), 1); // 0–2% range → 0–1
  const dash = pct * circ;
  return (
    <svg width="112" height="68" viewBox="0 0 112 68">
      {/* track */}
      <path d={`M12,56 A${r},${r} 0 0,1 100,56`} fill="none" stroke="#e2dbd1" strokeWidth="10" strokeLinecap="round" />
      {/* fill */}
      <path d={`M12,56 A${r},${r} 0 0,1 100,56`} fill="none" stroke="#1c1a17" strokeWidth="10"
        strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} />
      {/* needle dot */}
      <circle cx={cx} cy={cy - r} r="4" fill="#1c1a17" />
    </svg>
  );
}

/* ─── Sparkline ─── */
function Sparkline({ positive = true, width = 80, height = 32 }) {
  const pts = positive
    ? '0,28 14,20 28,22 42,12 56,16 70,6 80,8'
    : '0,6 14,12 28,10 42,20 56,16 70,24 80,28';
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <polyline points={pts} stroke={positive ? '#2e7d4f' : '#b83232'}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/* ─── Badge ─── */
function Badge({ status }: { status: 'COMPLETED' | 'PENDING' | 'FAILED' }) {
  const map = { COMPLETED: ['#e4f2ea', '#2e7d4f'], PENDING: ['#fdf3d0', '#8a6800'], FAILED: ['#faeaea', '#b83232'] };
  const [bg, col] = map[status] ?? map.COMPLETED;
  return (
    <span style={{ background: bg, color: col, padding: '2px 8px', borderRadius: 20,
      fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
      fontFamily: 'var(--mono)' }}>
      {status}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const [time, setTime] = useState('');
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [transactions] = useState<Transaction[]>([]);
  const [loading] = useState(false);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const balance = 24_850;
  const changePercent = 3.42;
  const profit = 842.30;
  const firstName = 'James';
  const userId = 'LAC8WC';

  const markets = [
    { symbol: 'BTC', name: 'Bitcoin',  price: 48123.50, change: 2.15,  vol: '1.2B', icon: '₿',  iconBg: '#f7931a', iconCol: '#fff' },
    { symbol: 'ETH', name: 'Ethereum', price: 73600,    change: 2.15,  vol: '1.2B', icon: 'Ξ',  iconBg: '#627eea', iconCol: '#fff' },
    { symbol: 'SOL', name: 'Solana',   price: 50.34,    change: 0.32,  vol: '1.7B', icon: '◎',  iconBg: '#9945ff', iconCol: '#fff' },
    { symbol: 'BNB', name: 'BNB',      price: 1095,     change: -0.07, vol: '1.0B', icon: 'B',  iconBg: '#f0b90b', iconCol: '#fff' },
  ];

  const topMovers = [
    { symbol: 'BTC', change: 2.15,  icon: '₿',  bg: '#f7931a' },
    { symbol: 'ETH', change: 1.60,  icon: 'Ξ',  bg: '#627eea' },
    { symbol: 'SOL', change: -2.50, icon: '◎',  bg: '#9945ff' },
    { symbol: 'BNB', change: -1.32, icon: 'B',  bg: '#f0b90b' },
  ];

  const recentActivity = [
    'Deposit of $500',
    'Buy    Bitcoin',
    'Buy    $2,500',
    'Buy    Bitcoin',
  ];

  const activityLog = [
    '● Deposit of $500',
    '● Deposit of $500 for ETH',
  ];

  const notifications = [
    '● Trade executed for ETH',
    '● Buy ratoer ETH',
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        :root {
          --bg:        #f0ece6;
          --bg-1:      #e8e3db;
          --bg-2:      #ddd7cd;
          --bg-3:      #cbc4b8;
          --white:     #ffffff;
          --card:      #eeeae4;
          --ink:       #1c1a17;
          --ink-2:     #2e2b26;
          --ink-dim:   #6b6457;
          --ink-faint: #9e9485;
          --orange:    #e85c0d;
          --orange-l:  #fde8dc;
          --green:     #2e7d4f;
          --green-l:   #e4f2ea;
          --red:       #b83232;
          --red-l:     #faeaea;
          --gold-l:    #fdf3d0;
          --gold:      #8a6800;
          --sans: 'DM Sans', system-ui, sans-serif;
          --mono: 'DM Mono', 'SF Mono', monospace;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: var(--bg); font-family: var(--sans); }

        .dash-wrap {
          max-width: 480px;
          margin: 0 auto;
          background: var(--bg);
          min-height: 100vh;
          padding-bottom: 40px;
        }

        /* ── TOP NAV BAR ── */
        .top-bar {
          background: #1c1a17;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .top-bar-logo {
          font-family: var(--sans);
          font-size: 0.78rem;
          font-weight: 600;
          color: #f0ece6;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .top-bar-logo span { color: var(--orange); margin: 0 4px; }

        .hamburger {
          display: flex; flex-direction: column; gap: 4px; cursor: pointer;
        }
        .hamburger span {
          display: block; width: 18px; height: 2px;
          background: #f0ece6; border-radius: 1px;
        }

        /* ── HEADER ── */
        .d-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 18px 18px 12px;
        }

        .d-greeting {
          font-size: 0.82rem; font-weight: 400; color: var(--ink-dim);
          margin-bottom: 2px;
        }

        .d-name {
          font-size: 1.7rem; font-weight: 700; color: var(--ink);
          letter-spacing: -0.02em; line-height: 1; margin-bottom: 4px;
        }

        .d-uid {
          font-family: var(--mono); font-size: 0.6rem;
          letter-spacing: 0.1em; color: var(--ink-faint);
        }

        .d-header-right { display: flex; align-items: center; gap: 10px; }

        .d-live-chip {
          display: flex; align-items: center; gap: 5px;
          background: #fff;
          border-radius: 20px; padding: 5px 12px;
          font-family: var(--mono); font-size: 0.62rem; font-weight: 500;
          color: var(--ink);
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }

        .live-dot {
          width: 8px; height: 8px; background: #22c55e;
          border-radius: 50%; animation: blink 2s ease-in-out infinite;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .d-clock {
          font-family: var(--mono); font-size: 0.75rem;
          color: var(--ink-dim); letter-spacing: 0.05em;
        }

        /* ── BALANCE + RISK ROW ── */
        .balance-risk-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          padding: 0 18px 10px;
          align-items: stretch;
        }

        .balance-card {
          background: var(--card);
          border-radius: 16px;
          padding: 18px 18px 14px;
          border: 1px solid var(--bg-2);
        }

        .bal-eyebrow {
          font-size: 0.6rem; font-weight: 600; color: var(--ink-faint);
          letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px;
        }

        .bal-amount {
          font-size: 2.4rem; font-weight: 700; color: var(--ink);
          letter-spacing: -0.03em; line-height: 1; margin-bottom: 6px;
        }

        .bal-amount sup { font-size: 1.1rem; font-weight: 500; vertical-align: super; }
        .bal-amount .cents { font-size: 1.2rem; font-weight: 500; color: var(--ink-dim); }

        .bal-change {
          font-size: 0.8rem; font-weight: 600; color: var(--green); margin-bottom: 2px;
        }

        .bal-period {
          font-size: 0.65rem; font-weight: 300; color: var(--ink-faint); margin-bottom: 12px;
        }

        .sparkline-row { margin-bottom: 14px; }

        .bal-actions { display: flex; gap: 8px; }

        .btn-dep {
          background: var(--orange); color: #fff;
          border: none; border-radius: 8px; padding: 8px 16px;
          font-family: var(--sans); font-size: 0.72rem; font-weight: 600;
          cursor: pointer; transition: opacity 0.15s;
        }
        .btn-dep:hover { opacity: 0.88; }

        .btn-wd {
          background: var(--bg-2); color: var(--ink-2);
          border: none; border-radius: 8px; padding: 8px 16px;
          font-family: var(--sans); font-size: 0.72rem; font-weight: 600;
          cursor: pointer; transition: background 0.15s;
        }
        .btn-wd:hover { background: var(--bg-3); }

        .btn-tx {
          background: transparent; color: var(--ink-faint); border: none;
          font-family: var(--sans); font-size: 0.65rem; cursor: pointer;
          padding: 8px 4px; text-decoration: underline; text-underline-offset: 2px;
        }

        /* Risk card */
        .risk-card {
          background: var(--card);
          border-radius: 16px;
          border: 1px solid var(--bg-2);
          padding: 14px 16px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          min-width: 120px;
          text-align: center;
        }

        .risk-title {
          font-size: 0.62rem; font-weight: 500; color: var(--ink-dim);
          margin-bottom: 6px; letter-spacing: 0.02em;
        }

        .risk-pct {
          font-size: 1.4rem; font-weight: 700; color: var(--ink);
          letter-spacing: -0.02em; margin-top: -4px;
        }

        .risk-label {
          font-size: 0.6rem; font-weight: 400; color: var(--ink-faint); margin-top: 4px;
        }

        /* ── PL/POSITIONS/RISK BAR ── */
        .stat-bar {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0;
          margin: 0 18px 10px;
          background: var(--card);
          border-radius: 12px;
          border: 1px solid var(--bg-2);
          overflow: hidden;
        }

        .stat-cell {
          padding: 12px 14px;
          border-right: 1px solid var(--bg-2);
        }
        .stat-cell:last-child { border-right: none; }

        .stat-lbl {
          font-size: 0.58rem; font-weight: 600; color: var(--ink-faint);
          text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;
        }

        .stat-val {
          font-size: 0.95rem; font-weight: 700; color: var(--ink); line-height: 1;
          margin-bottom: 2px;
        }
        .stat-val.pos { color: var(--green); }

        .stat-sub {
          font-size: 0.58rem; font-weight: 300; color: var(--ink-faint);
        }

        /* ── 4-METRIC GRID ── */
        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding: 0 18px 10px;
        }

        .metric-card {
          background: var(--card);
          border: 1px solid var(--bg-2);
          border-radius: 12px;
          padding: 14px;
        }

        .mc-label {
          font-size: 0.6rem; font-weight: 500; color: var(--ink-faint);
          margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.06em;
        }

        .mc-val {
          font-size: 1.2rem; font-weight: 700; color: var(--ink);
          letter-spacing: -0.02em; line-height: 1; margin-bottom: 2px;
        }

        .mc-sub {
          font-size: 0.6rem; font-weight: 300; color: var(--ink-faint);
        }

        .mc-change {
          font-size: 0.65rem; font-weight: 600; color: var(--green); margin-bottom: 2px;
        }

        /* Top Movers card */
        .movers-card {
          background: var(--card);
          border: 1px solid var(--bg-2);
          border-radius: 12px;
          padding: 14px;
        }

        .movers-item {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 8px;
        }
        .movers-item:last-child { margin-bottom: 0; }

        .mover-sym {
          display: flex; align-items: center; gap: 6px;
          font-family: var(--mono); font-size: 0.7rem; font-weight: 500; color: var(--ink);
        }

        .mover-ico {
          width: 18px; height: 18px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 700; color: #fff;
          flex-shrink: 0;
        }

        .mover-chg {
          font-family: var(--mono); font-size: 0.65rem; font-weight: 500;
        }
        .mover-chg.up { color: var(--green); }
        .mover-chg.dn { color: var(--red); }

        /* Recent Activity card */
        .activity-card {
          background: var(--card);
          border: 1px solid var(--bg-2);
          border-radius: 12px;
          padding: 14px;
        }

        .activity-item {
          font-size: 0.65rem; font-weight: 400; color: var(--ink-dim);
          margin-bottom: 6px; line-height: 1.3;
        }
        .activity-item:last-child { margin-bottom: 0; }

        /* Open / volatility / notif row */
        .bottom-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 8px;
          padding: 0 18px 10px;
        }

        .bm-card {
          background: var(--card);
          border: 1px solid var(--bg-2);
          border-radius: 12px;
          padding: 12px;
        }

        .bm-lbl {
          font-size: 0.58rem; font-weight: 600; color: var(--ink-faint);
          text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px;
        }

        .bm-val {
          font-size: 1rem; font-weight: 700; color: var(--ink);
          letter-spacing: -0.02em; line-height: 1; margin-bottom: 2px;
        }

        .bm-sub {
          font-size: 0.58rem; font-weight: 300; color: var(--ink-faint);
          line-height: 1.3;
        }

        .bm-dot { font-size: 0.6rem; color: var(--green); }
        .bm-dot.red { color: var(--red); }

        /* ── ASSET TABLE ── */
        .asset-section { padding: 0 18px 20px; }

        .section-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 8px;
        }

        .section-title {
          font-size: 0.62rem; font-weight: 700; color: var(--ink-faint);
          text-transform: uppercase; letter-spacing: 0.1em;
          display: flex; align-items: center; gap: 6px;
        }

        .asset-table-wrap {
          background: var(--card);
          border: 1px solid var(--bg-2);
          border-radius: 14px;
          overflow: hidden;
        }

        .asset-thead {
          display: grid;
          grid-template-columns: 2fr 1fr 1.3fr 1fr 1fr 1.4fr;
          padding: 10px 14px;
          border-bottom: 1px solid var(--bg-2);
          background: var(--bg-1);
        }

        .asset-th {
          font-size: 0.55rem; font-weight: 700; color: var(--ink-faint);
          text-transform: uppercase; letter-spacing: 0.08em;
        }

        .asset-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1.3fr 1fr 1fr 1.4fr;
          align-items: center;
          padding: 13px 14px;
          border-bottom: 1px solid var(--bg-2);
          transition: background 0.12s;
        }
        .asset-row:last-child { border-bottom: none; }
        .asset-row:hover { background: var(--bg-1); }

        .asset-name-cell { display: flex; align-items: center; gap: 8px; }

        .asset-ico {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 800; color: #fff;
          flex-shrink: 0;
        }

        .asset-sym {
          font-family: var(--mono); font-size: 0.72rem; font-weight: 600;
          color: var(--ink); line-height: 1; margin-bottom: 1px;
        }

        .asset-nm {
          font-size: 0.58rem; font-weight: 300; color: var(--ink-faint);
        }

        .asset-ticker {
          font-family: var(--mono); font-size: 0.62rem; font-weight: 500;
          color: var(--ink-dim);
        }

        .asset-price {
          font-family: var(--mono); font-size: 0.7rem; font-weight: 500;
          color: var(--ink); font-feature-settings: 'tnum';
        }

        .asset-chg {
          font-family: var(--mono); font-size: 0.65rem; font-weight: 600;
        }
        .asset-chg.up { color: var(--green); }
        .asset-chg.dn { color: var(--red); }

        .asset-vol {
          font-family: var(--mono); font-size: 0.62rem; font-weight: 400; color: var(--ink-dim);
        }

        .trade-btns { display: flex; gap: 4px; }

        .btn-buy {
          background: #1c1a17; color: #fff; border: none;
          border-radius: 6px; padding: 5px 10px;
          font-family: var(--sans); font-size: 0.62rem; font-weight: 600;
          cursor: pointer; transition: opacity 0.12s;
        }
        .btn-buy:hover { opacity: 0.78; }

        .btn-sell {
          background: transparent; color: var(--ink-2);
          border: 1px solid var(--bg-3); border-radius: 6px; padding: 5px 10px;
          font-family: var(--sans); font-size: 0.62rem; font-weight: 600;
          cursor: pointer; transition: background 0.12s;
        }
        .btn-sell:hover { background: var(--bg-2); }

        /* expand drawer */
        .tx-drawer {
          overflow: hidden;
          transition: max-height 0.35s ease;
        }
        .tx-drawer-inner {
          padding: 14px 18px 6px;
          border-top: 1px solid var(--bg-2);
        }
      `}</style>

      <div className="dash-wrap">

        {/* ── TOP NAV ── */}
        <div className="top-bar">
          <div className="hamburger">
            <span /><span /><span />
          </div>
          <div className="top-bar-logo">APEX<span>•</span>MARKETS</div>
          <div style={{ width: 24 }} />
        </div>

        {/* ── HEADER ── */}
        <div className="d-header">
          <div>
            <p className="d-greeting">Welcome back,</p>
            <p className="d-name">{firstName}</p>
            <p className="d-uid">APEX·MKTS / {userId}</p>
          </div>
          <div className="d-header-right">
            <div className="d-live-chip">
              <span className="live-dot" />
              Live
            </div>
            <span className="d-clock">{time}</span>
          </div>
        </div>

        {/* ── BALANCE + RISK ── */}
        <div className="balance-risk-row">
          <div className="balance-card">
            <p className="bal-eyebrow">Net Asset Value</p>
            <p className="bal-amount">
              <sup>$</sup>{fmt(balance, 0)}<span className="cents">.00</span>
            </p>
            <p className="bal-change">+${fmt(profit)} (+{fmt(changePercent)}%)</p>
            <p className="bal-period">Current period</p>
            <div className="sparkline-row">
              <Sparkline positive width={120} height={28} />
            </div>
            <div className="bal-actions">
              <button className="btn-dep">+ Deposit</button>
              <button className="btn-wd">Withdraw</button>
              <button className="btn-tx" onClick={() => setBalanceOpen(v => !v)}>
                {balanceOpen ? '↑ hide' : '↓ transactions'}
              </button>
            </div>
          </div>

          <div className="risk-card">
            <p className="risk-title">Risk Profile</p>
            <Gauge value={0.4} />
            <p className="risk-pct">0.4%</p>
            <p className="risk-label">Conservative</p>
          </div>
        </div>

        {/* Tx drawer */}
        <div className="tx-drawer" style={{ maxHeight: balanceOpen ? 260 : 0, margin: '0 18px' }}>
          <div className="tx-drawer-inner">
            <p style={{ fontSize: '0.6rem', color: 'var(--ink-faint)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Recent Transactions
            </p>
            {transactions.length === 0
              ? <p style={{ fontSize: '0.65rem', color: 'var(--ink-faint)', fontWeight: 300 }}>No transactions yet.</p>
              : transactions.slice(0, 5).map(tx => (
                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--bg-2)', fontSize: '0.68rem' }}>
                  <span style={{ color: tx.type === 'Deposit' ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>{tx.type}</span>
                  <span style={{ fontFamily: 'var(--mono)' }}>${fmt(tx.amount, 0)}</span>
                </div>
              ))}
          </div>
        </div>

        {/* ── P&L / POSITIONS / RISK BAR ── */}
        <div className="stat-bar">
          <div className="stat-cell">
            <p className="stat-lbl">P &amp; L</p>
            <p className="stat-val pos">+${fmt(profit)}</p>
            <p className="stat-sub">Realised</p>
          </div>
          <div className="stat-cell">
            <p className="stat-lbl">Positions</p>
            <p className="stat-val">3 open</p>
            <p className="stat-sub">3 profit · 1 loss</p>
          </div>
          <div className="stat-cell">
            <p className="stat-lbl">Risk</p>
            <p className="stat-val">Conservative</p>
            <p className="stat-sub">Volatility 0.4%</p>
          </div>
        </div>

        {/* ── 4-METRIC GRID ── */}
        <div className="metrics-grid">
          {/* Realised P&L */}
          <div className="metric-card">
            <p className="mc-label">Realised P&L</p>
            <p className="mc-val">${fmt(profit)}</p>
            <p className="mc-change">+{fmt(changePercent)}%</p>
            <p className="mc-sub">Current period</p>
            <div style={{ marginTop: 8 }}><Sparkline positive width={80} height={24} /></div>
          </div>

          {/* Top Movers */}
          <div className="movers-card">
            <p className="mc-label">Top Movers</p>
            {topMovers.map(m => (
              <div key={m.symbol} className="movers-item">
                <span className="mover-sym">
                  <span className="mover-ico" style={{ background: m.bg }}>{m.icon}</span>
                  {m.symbol}
                </span>
                <span className={`mover-chg ${m.change >= 0 ? 'up' : 'dn'}`}>
                  {m.change >= 0 ? '+' : ''}{fmt(m.change)}%
                </span>
              </div>
            ))}
          </div>

          {/* Portfolio Value */}
          <div className="metric-card">
            <p className="mc-label">Portfolio Value</p>
            <p className="mc-val">${fmt(balance)}.00</p>
            <p className="mc-sub">Mark-to-market</p>
          </div>

          {/* Recent Activity */}
          <div className="activity-card">
            <p className="mc-label">Recent Activity</p>
            {recentActivity.map((a, i) => (
              <p key={i} className="activity-item">{a}</p>
            ))}
          </div>
        </div>

        {/* ── BOTTOM METRICS ROW ── */}
        <div className="bottom-metrics">
          <div className="bm-card">
            <p className="bm-lbl">Open Positions</p>
            <p className="bm-val">3</p>
            <p className="bm-sub">2 profit · 1 loss</p>
          </div>

          <div className="bm-card">
            <p className="bm-lbl">Activity</p>
            {activityLog.map((a, i) => (
              <p key={i} className="bm-sub" style={{ marginBottom: 4 }}>
                <span className="bm-dot">●</span> {a.slice(2)}
              </p>
            ))}
          </div>

          <div className="bm-card">
            <p className="bm-lbl">Volatility</p>
            <p className="bm-val">0.4%</p>
            <p className="bm-sub">Conservative</p>
          </div>

          <div className="bm-card">
            <p className="bm-lbl">Notifications</p>
            {notifications.map((n, i) => (
              <p key={i} className="bm-sub" style={{ marginBottom: 4 }}>
                <span className="bm-dot red">●</span> {n.slice(2)}
              </p>
            ))}
          </div>
        </div>

        {/* ── ASSET TABLE ── */}
        <div className="asset-section">
          <div className="section-head">
            <span className="section-title">
              <span style={{ display: 'inline-block', width: 3, height: 12, background: 'var(--orange)', borderRadius: 2 }} />
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

            {markets.map(a => (
              <div key={a.symbol} className="asset-row">
                <div className="asset-name-cell">
                  <div className="asset-ico" style={{ background: a.iconBg }}>{a.icon}</div>
                  <div>
                    <div className="asset-sym">{a.symbol}</div>
                    <div className="asset-nm">{a.name}</div>
                  </div>
                </div>
                <span className="asset-ticker">{a.symbol}</span>
                <span className="asset-price">${fmt(a.price)}</span>
                <span className={`asset-chg ${a.change >= 0 ? 'up' : 'dn'}`}>
                  {a.change >= 0 ? '+' : ''}{fmt(a.change)}%
                </span>
                <span className="asset-vol">${a.vol}</span>
                <div className="trade-btns">
                  <button className="btn-buy">Buy</button>
                  <button className="btn-sell">Sell</button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
