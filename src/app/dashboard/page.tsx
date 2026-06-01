'use client';

import { useEffect, useState, useCallback } from 'react';

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
  positions: {
    open: number;
    profit: number;
    loss: number;
  };
  notifications: { id: string; message: string; read: boolean }[];
  activityLogs:  { id: string; description: string }[];
};

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
  const [time, setTime]               = useState('');
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [sheet, setSheet]             = useState<'deposit' | 'withdraw' | null>(null);
  const [amount, setAmount]           = useState('');
  const [method, setMethod]           = useState('');
  const [submitted, setSubmitted]     = useState(false);
  const [copied, setCopied]           = useState(false);

  // ── Real data state ──
  const [data, setData]               = useState<DashboardData | null>(null);
  const [markets, setMarkets]         = useState<Market[]>([]);
  const [loading, setLoading]         = useState(true);
  const [depositMethods, setDepositMethods] = useState<any[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(false);

  // ── Fetch dashboard data ──
  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/user/dashboard');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch markets ──
  const fetchMarkets = useCallback(async () => {
    try {
      const res = await fetch('/api/markets');
      if (res.ok) setMarkets(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchMarkets();
    // Refresh markets every 60s
    const id = setInterval(fetchMarkets, 60_000);
    return () => clearInterval(id);
  }, [fetchDashboard, fetchMarkets]);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const closeSheet = () => { setSheet(null); setAmount(''); setSubmitted(false); setCopied(false); };

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

  // ── Derived values from real data ──
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

  // Top movers from live market data
  const topMovers = [...markets]
    .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
    .slice(0, 4);

  if (loading) {
    return (
    
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
          background: var(--bg-2); color: var(--ink-dim); border: 1px solid var(--bg-3);
          font-family: var(--sans); font-size: 0.72rem; font-weight: 600; cursor: pointer;
          padding: 8px 14px; border-radius: 8px; transition: background 0.15s;
        }
        .btn-tx:hover { background: var(--bg-3); }

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
        /* ── BOTTOM SHEET ── */
        .sheet-overlay {
          position: fixed; inset: 0; background: rgba(28,26,23,0.5);
          z-index: 200; backdrop-filter: blur(2px);
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .sheet {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: #f0ece6; border-radius: 24px 24px 0 0;
          padding: 0 20px 40px; z-index: 201;
          animation: slideUp 0.3s cubic-bezier(0.32,0.72,0,1);
          max-width: 480px; margin: 0 auto;
        }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes dspin { to { transform: rotate(360deg); } }

        .sheet-handle {
          width: 36px; height: 4px; background: var(--bg-3);
          border-radius: 2px; margin: 12px auto 20px;
        }

        .sheet-title {
          font-size: 1.1rem; font-weight: 700; color: var(--ink);
          letter-spacing: -0.02em; margin-bottom: 4px;
        }

        .sheet-sub {
          font-size: 0.68rem; font-weight: 300; color: var(--ink-faint);
          margin-bottom: 24px;
        }

        .sheet-label {
          font-size: 0.6rem; font-weight: 600; color: var(--ink-faint);
          text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;
        }

        .sheet-amount-row {
          display: flex; align-items: center;
          background: var(--card); border: 1.5px solid var(--bg-2);
          border-radius: 12px; padding: 14px 16px; margin-bottom: 16px;
          transition: border-color 0.15s;
        }
        .sheet-amount-row:focus-within { border-color: var(--orange); }

        .sheet-currency {
          font-size: 1.2rem; font-weight: 600; color: var(--ink-dim);
          margin-right: 8px;
        }

        .sheet-input {
          flex: 1; border: none; background: transparent; outline: none;
          font-family: var(--sans); font-size: 1.4rem; font-weight: 700;
          color: var(--ink); letter-spacing: -0.02em;
        }
        .sheet-input::placeholder { color: var(--bg-3); }

        .sheet-quick {
          display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;
        }

        .sheet-quick-btn {
          background: var(--card); border: 1px solid var(--bg-2);
          border-radius: 8px; padding: 6px 14px;
          font-family: var(--sans); font-size: 0.7rem; font-weight: 500;
          color: var(--ink-dim); cursor: pointer; transition: all 0.12s;
        }
        .sheet-quick-btn:hover, .sheet-quick-btn.active {
          background: var(--orange); border-color: var(--orange); color: #fff;
        }

        .sheet-methods {
          display: grid; grid-template-columns: 1fr 1fr 1fr;
          gap: 8px; margin-bottom: 24px;
        }

        .sheet-method {
          background: var(--card); border: 1.5px solid var(--bg-2);
          border-radius: 10px; padding: 10px 8px; text-align: center;
          cursor: pointer; transition: all 0.12s;
        }
        .sheet-method.active { border-color: var(--orange); background: var(--orange-l); }

        .sheet-method-icon { font-size: 1.2rem; margin-bottom: 4px; }

        .sheet-method-lbl {
          font-size: 0.58rem; font-weight: 600; color: var(--ink-dim);
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .sheet-method.active .sheet-method-lbl { color: var(--orange); }

        .sheet-submit {
          width: 100%; background: var(--orange); color: #fff; border: none;
          border-radius: 12px; padding: 15px;
          font-family: var(--sans); font-size: 0.85rem; font-weight: 700;
          cursor: pointer; transition: opacity 0.15s; letter-spacing: 0.01em;
        }
        .sheet-submit:hover { opacity: 0.88; }
        .sheet-submit:disabled { opacity: 0.4; cursor: not-allowed; }

        .sheet-submit.withdraw {
          background: var(--ink);
        }

        .sheet-success {
          display: flex; flex-direction: column; align-items: center;
          padding: 20px 0 10px; text-align: center;
        }

        .sheet-success-ico {
          width: 60px; height: 60px; border-radius: 50%;
          background: var(--green-l); border: 2px solid var(--green);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.6rem; margin-bottom: 16px;
        }

        .sheet-success-title {
          font-size: 1.1rem; font-weight: 700; color: var(--ink);
          margin-bottom: 6px;
        }

        .sheet-success-sub {
          font-size: 0.72rem; font-weight: 300; color: var(--ink-faint);
          margin-bottom: 24px;
        }
      `}</style>

      <div className="dash-wrap">

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

        {/* ── BALANCE ── */}
        <div style={{ padding: '0 18px 10px' }}>
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
              <button className="btn-dep" onClick={openDeposit}>+ Deposit</button>
              <button className="btn-wd" onClick={() => setSheet('withdraw')}>Withdraw</button>
              <button className="btn-tx" onClick={() => setBalanceOpen(v => !v)}>
                {balanceOpen ? '↑ Hide' : '📋 History'}
              </button>
            </div>
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

      {/* ── BOTTOM SHEETS ── */}
      {sheet && (
        <>
          <div className="sheet-overlay" onClick={closeSheet} />
          <div className="sheet">
            <div className="sheet-handle" />

            {submitted ? (
              <div className="sheet-success">
                <div className="sheet-success-ico">✓</div>
                <p className="sheet-success-title">
                  {sheet === 'deposit' ? 'Deposit Submitted' : 'Withdrawal Submitted'}
                </p>
                <p className="sheet-success-sub">
                  ${amount} will be {sheet === 'deposit' ? 'credited to' : 'debited from'} your account shortly.
                </p>
                <button className="sheet-submit" onClick={closeSheet}>Done</button>
              </div>
            ) : sheet === 'deposit' ? (
              <>
                <p className="sheet-title">Deposit Funds</p>
                <p className="sheet-sub">Send funds to one of the addresses below</p>

                {methodsLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 12 }}>
                    <div style={{ width: 28, height: 28, border: '2.5px solid var(--bg-2)', borderTopColor: 'var(--orange)', borderRadius: '50%', animation: 'dspin 0.7s linear infinite' }} />
                    <p style={{ fontSize: '0.68rem', color: 'var(--ink-faint)', fontWeight: 300 }}>Loading deposit methods…</p>
                  </div>
                ) : depositMethods.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <p style={{ fontSize: '2rem', marginBottom: 12 }}>🔧</p>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>No deposit methods available</p>
                    <p style={{ fontSize: '0.68rem', fontWeight: 300, color: 'var(--ink-faint)' }}>The admin has not configured any deposit addresses yet. Please check back later or contact support.</p>
                  </div>
                ) : (
                  <>
                    {/* Method tabs */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
                      {depositMethods.map(m => (
                        <button
                          key={m.id}
                          onClick={() => setMethod(m.id)}
                          style={{
                            flexShrink: 0, padding: '7px 14px', borderRadius: 20,
                            border: method === m.id ? 'none' : '1px solid var(--bg-2)',
                            background: method === m.id ? 'var(--orange)' : 'var(--card)',
                            color: method === m.id ? '#fff' : 'var(--ink-dim)',
                            fontFamily: 'var(--sans)', fontSize: '0.7rem', fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.15s',
                          }}
                        >
                          {m.icon} {m.label}
                        </button>
                      ))}
                    </div>

                    {/* Active method address card */}
                    {depositMethods.filter(m2 => m2.id === method).map(m2 => (
                      <div key={m2.id}>
                        {m2.network && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--blue-l, #e4eaf8)', borderRadius: 6, padding: '3px 10px', marginBottom: 12 }}>
                            <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#1a3d8a', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Network: {m2.network}</span>
                          </div>
                        )}

                        <p style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Deposit Address</p>

                        <div style={{ background: 'var(--card)', border: '1.5px solid var(--bg-2)', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
                          <p style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--ink)', wordBreak: 'break-all', lineHeight: 1.6, marginBottom: 12 }}>{m2.address}</p>
                          <button
                            onClick={() => copyAddress(m2.address)}
                            style={{
                              width: '100%', padding: '9px', borderRadius: 8, border: 'none',
                              background: copied ? 'var(--green-l)' : 'var(--bg-2)',
                              color: copied ? 'var(--green)' : 'var(--ink-dim)',
                              fontFamily: 'var(--sans)', fontSize: '0.72rem', fontWeight: 600,
                              cursor: 'pointer', transition: 'all 0.2s',
                            }}
                          >
                            {copied ? '✓ Copied!' : '📋 Copy Address'}
                          </button>
                        </div>

                        {m2.note && (
                          <div style={{ display: 'flex', gap: 8, background: 'var(--gold-l)', border: '1px solid #e8d48a', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
                            <span style={{ fontSize: '0.9rem' }}>⚠️</span>
                            <p style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 400, lineHeight: 1.5 }}>{m2.note}</p>
                          </div>
                        )}

                        <p style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Amount Sent (USD)</p>
                        <div className="sheet-amount-row" style={{ marginBottom: 20 }}>
                          <span className="sheet-currency">$</span>
                          <input className="sheet-input" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                        </div>

                        <div className="sheet-quick" style={{ marginBottom: 20 }}>
                          {['100', '500', '1000', '5000'].map(q => (
                            <button key={q} className={`sheet-quick-btn${amount === q ? ' active' : ''}`} onClick={() => setAmount(q)}>${q}</button>
                          ))}
                        </div>

                        <button className="sheet-submit" disabled={!amount || Number(amount) <= 0} onClick={() => setSubmitted(true)}>
                          I've Sent ${amount || '0'}
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </>
            ) : (
              <>
                <p className="sheet-title">Withdraw Funds</p>
                <p className="sheet-sub">Transfer funds to your bank account</p>

                <p className="sheet-label">Amount (USD)</p>
                <div className="sheet-amount-row">
                  <span className="sheet-currency">$</span>
                  <input className="sheet-input" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>

                <div className="sheet-quick">
                  {['100', '500', '1000', '5000'].map(q => (
                    <button key={q} className={`sheet-quick-btn${amount === q ? ' active' : ''}`} onClick={() => setAmount(q)}>${q}</button>
                  ))}
                </div>

                <p className="sheet-label" style={{ marginTop: 16 }}>Withdrawal Method</p>
                <div className="sheet-methods">
                  {[
                    { id: 'bank', icon: '🏦', label: 'Bank' },
                    { id: 'card', icon: '💳', label: 'Card' },
                    { id: 'crypto', icon: '₿', label: 'Crypto' },
                  ].map(m => (
                    <div key={m.id} className={`sheet-method${method === m.id ? ' active' : ''}`} onClick={() => setMethod(m.id)}>
                      <div className="sheet-method-icon">{m.icon}</div>
                      <div className="sheet-method-lbl">{m.label}</div>
                    </div>
                  ))}
                </div>

                <button className="sheet-submit withdraw" disabled={!amount || Number(amount) <= 0} onClick={() => setSubmitted(true)}>
                  Withdraw ${amount || '0'}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
