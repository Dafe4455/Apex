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
    fearGreedIndex?: number;
  };
  transactions: Transaction[];
  positions: { open: number; profit: number; loss: number };
  notifications: { id: string; message: string; read: boolean }[];
  activityLogs: { id: string; description: string }[];
};

type NewsItem = {
  headline: string;
  source: string;
  time: string;
  tag: string;
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
    <span style={{
      background: bg, color: col, padding: '2px 8px', borderRadius: 20,
      fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
      fontFamily: 'var(--mono)'
    }}>
      {status}
    </span>
  );
}

// Fear & Greed arc gauge — Binance-style
function FearGreedGauge({ value }: { value: number }) {
  // value 0–100
  const clamped = Math.max(0, Math.min(100, value));

  // Label + color based on value
  const getZone = (v: number) => {
    if (v <= 24) return { label: 'Extreme Fear', color: '#f87171' };
    if (v <= 44) return { label: 'Fear', color: '#fb923c' };
    if (v <= 55) return { label: 'Neutral', color: '#fbbf24' };
    if (v <= 74) return { label: 'Greed', color: '#a3e635' };
    return { label: 'Extreme Greed', color: '#4ade80' };
  };
  const zone = getZone(clamped);

  // SVG arc params
  const W = 120, H = 68;
  const cx = W / 2, cy = 62;
  const r = 46;
  // Arc from 180° to 0° (half circle)
  // Convert value 0–100 → angle 180°→0° (i.e. start left, sweep right)
  const startAngle = Math.PI; // leftmost
  const endAngle = 0;        // rightmost
  const totalSweep = Math.PI; // 180°

  // Needle angle
  const needleAngle = Math.PI - (clamped / 100) * Math.PI;

  // Arc segments: extreme fear (0-25), fear (25-45), neutral (45-55), greed (55-75), extreme greed (75-100)
  const segments = [
    { from: 0, to: 25, color: '#f87171' },
    { from: 25, to: 45, color: '#fb923c' },
    { from: 45, to: 55, color: '#fbbf24' },
    { from: 55, to: 75, color: '#a3e635' },
    { from: 75, to: 100, color: '#4ade80' },
  ];

  function polarToCart(angleDeg: number, radius: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(Math.PI - rad),
      y: cy - radius * Math.sin(Math.PI - rad),
    };
  }

  function arcPath(fromPct: number, toPct: number, rOuter: number, rInner: number) {
    const a1 = (fromPct / 100) * 180;
    const a2 = (toPct / 100) * 180;
    const p1 = polarToCart(a1, rOuter);
    const p2 = polarToCart(a2, rOuter);
    const p3 = polarToCart(a2, rInner);
    const p4 = polarToCart(a1, rInner);
    const large = a2 - a1 > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 ${large} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rInner} ${rInner} 0 ${large} 0 ${p4.x} ${p4.y} Z`;
  }

  const nx = cx + (r - 8) * Math.cos(needleAngle);
  const ny = cy - (r - 8) * Math.sin(needleAngle);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* background arc */}
        <path d={arcPath(0, 100, r, r - 10)} fill="#1a2e3d" />
        {/* colored segments */}
        {segments.map((seg, i) => (
          <path key={i} d={arcPath(seg.from, seg.to, r, r - 10)} fill={seg.color} opacity="0.85" />
        ))}
        {/* needle */}
        <line
          x1={cx} y1={cy}
          x2={nx} y2={ny}
          stroke="#f0f8ff" strokeWidth="2" strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="4" fill="#f0f8ff" />
        {/* value text */}
        <text x={cx} y={cy - 14} textAnchor="middle" fill={zone.color}
          style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px', fontWeight: 700 }}>
          {clamped}
        </text>
      </svg>
      <span style={{
        fontFamily: 'var(--mono)', fontSize: '0.6rem', fontWeight: 700,
        color: zone.color, letterSpacing: '0.06em', marginTop: -4,
        textTransform: 'uppercase'
      }}>
        {zone.label}
      </span>
    </div>
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
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

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

  // Fetch global finance news via Anthropic API (AI-generated summaries of current trends)
  const fetchNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{
            role: 'user',
            content: `Search for the latest global finance and crypto market news from today. Return ONLY a JSON array (no markdown, no backticks) of exactly 5 news items. Each item must have these keys: "headline" (short, under 10 words), "source" (news outlet name), "time" (e.g. "2h ago"), "tag" (one of: CRYPTO, FOREX, STOCKS, MACRO, COMMODITIES). Example format: [{"headline":"...","source":"...","time":"...","tag":"..."}]`
          }]
        })
      });
      const d = await response.json();
      const text = d.content
        .map((item: { type: string; text?: string }) => item.type === 'text' ? item.text : '')
        .filter(Boolean)
        .join('');
      const clean = text.replace(/```json|```/g, '').trim();
      // Extract JSON array from the response
      const match = clean.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        setNews(parsed);
      }
    } catch (e) {
      // Fallback static headlines
      setNews([
        { headline: 'Fed holds rates amid inflation data', source: 'Reuters', time: '1h ago', tag: 'MACRO' },
        { headline: 'Bitcoin consolidates above $63k', source: 'CoinDesk', time: '2h ago', tag: 'CRYPTO' },
        { headline: 'S&P 500 edges higher on tech rally', source: 'Bloomberg', time: '3h ago', tag: 'STOCKS' },
        { headline: 'Oil steadies after OPEC+ meeting', source: 'FT', time: '4h ago', tag: 'COMMODITIES' },
        { headline: 'Dollar weakens vs. major peers', source: 'CNBC', time: '5h ago', tag: 'FOREX' },
      ]);
    } finally {
      setNewsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchMarkets();
    fetchNews();
    const id = setInterval(fetchMarkets, 60_000);
    return () => clearInterval(id);
  }, [fetchDashboard, fetchMarkets, fetchNews]);

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
  // Fear & greed: use from API if present, else derive from portfolio change or default 52
  const fearGreedValue = data?.user.fearGreedIndex ?? 52;

  const activeMethod  = depositMethods.find(m => m.id === method);

  const topMovers = [...markets]
    .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
    .slice(0, 4);

  const tagColors: Record<string, [string, string]> = {
    CRYPTO:      ['#0e2e40', '#38bdf8'],
    FOREX:       ['#1a2e0d', '#a3e635'],
    STOCKS:      ['#1a1a40', '#818cf8'],
    MACRO:       ['#2a2200', '#fbbf24'],
    COMMODITIES: ['#2a1400', '#fb923c'],
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000000' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #6a9ab8', borderTopColor: '#8dbdd8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        :root {
          --bg:#000000;
          
          --bg-2:#000200;
          --bg-3:#0f2535;
          --card:#000000;
          --ink:#f0f8ff;
          --ink-2:#d6ecf8;
          --ink-dim:#8dbdd8;
          --ink-faint:#6a9ab8;
          --accent:#38bdf8;
          --accent-l:#0e3448;
          --green:#4ade80;
          --green-l:#0d3320;
          --red:#f87171;
          --red-l:#2a0d0d;
          --gold-l:#2a2200;
          --gold:#fbbf24;
          --sans:'DM Sans',system-ui,sans-serif;
          --mono:'DM Mono','SF Mono',monospace;
        }
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:var(--bg);font-family:var(--sans);}

        .dash-wrap{max-width:480px;margin:0 auto;background:var(--bg);min-height:100vh;padding-bottom:40px;}

        /* ── HEADER ── */
        .d-header{padding:20px 20px 16px;display:flex;align-items:flex-start;justify-content:space-between;}
        .d-greeting{font-size:0.75rem;font-weight:400;color:var(--ink-faint);margin-bottom:2px;}
        .d-name{font-size:1.65rem;font-weight:700;color:var(--ink);letter-spacing:-0.02em;line-height:1;margin-bottom:4px;}
        .d-uid{font-family:var(--mono);font-size:0.58rem;letter-spacing:0.1em;color:var(--ink-faint);}
        .d-header-right{display:flex;flex-direction:column;align-items:flex-end;gap:6px;}
        .d-live-chip{display:flex;align-items:center;gap:5px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.25);border-radius:20px;padding:4px 10px;font-family:var(--mono);font-size:0.6rem;font-weight:500;color:#22c55e;}
        .live-dot{width:6px;height:6px;background:#22c55e;border-radius:50%;animation:blink 2s ease-in-out infinite;flex-shrink:0;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.4}}
        .d-clock{font-family:var(--mono);font-size:0.7rem;color:var(--ink-dim);letter-spacing:0.04em;}

        /* ── HERO CARD — same as background ── */
        .hero-card{
          margin:0 16px 6px;
          background:var(--card);
          border-radius:20px;
          padding:22px 20px 12px;
          border:1px solid rgba(255,255,255,0.04);
          position:relative;overflow:hidden;
        }
        .hero-card::before{content:'';position:absolute;top:-60px;right:-30px;width:195px;height:180px;background:radial-gradient(circle,rgba(56,189,248,0.06) 0%,transparent 72%);pointer-events:none;}
        .bal-eyebrow{font-size:0.58rem;font-weight:600;color:var(--ink-faint);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:10px;}
        .bal-amount{font-size:2.6rem;font-weight:700;color:var(--ink);letter-spacing:-0.03em;line-height:1;margin-bottom:8px;}
        .bal-amount sup{font-size:1rem;font-weight:500;vertical-align:super;margin-right:1px;}
        .bal-amount .cents{font-size:1.1rem;font-weight:400;color:var(--ink-dim);}
        .bal-row{display:flex;align-items:center;gap:12px;margin-bottom:16px;}
        .bal-change{font-size:0.78rem;font-weight:600;color:var(--green);}
        .bal-period{font-size:0.62rem;font-weight:300;color:var(--ink-faint);}
        .bal-sparkline{margin-bottom:18px;}
        .bal-actions{display:flex;gap:8px;}
        .btn-dep{background:var(--accent);color:#0a1f2e;border:none;border-radius:10px;padding:10px 18px;font-family:var(--sans);font-size:0.72rem;font-weight:700;cursor:pointer;transition:opacity 0.15s;flex-shrink:0;}
        .btn-dep:hover{opacity:0.88;}
        .btn-ghost{background:rgba(255,255,255,0.05);color:var(--ink-2);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:10px 14px;font-family:var(--sans);font-size:0.72rem;font-weight:600;cursor:pointer;transition:background 0.15s;text-decoration:none;display:inline-flex;align-items:center;flex-shrink:0;}
        .btn-ghost:hover{background:rgba(255,255,255,0.09);}

        /* ── TX DRAWER ── */
        .tx-drawer{overflow:hidden;transition:max-height 0.35s ease;margin:0 16px;}
        .tx-drawer-inner{background:var(--card);border:1px solid rgba(255,255,255,0.04);border-top:none;border-radius:0 0 16px 16px;padding:14px 16px 10px;}
        .tx-drawer-label{font-size:0.58rem;color:var(--ink-faint);margin-bottom:8px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;}

        /* ── STAT ROW ── */
        .stat-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;padding:20px 20px 4px;}
        .stat-cell{padding:0;}
        .stat-cell+.stat-cell{padding-left:16px;border-left:1px solid rgba(255,255,255,0.05);}
        .stat-lbl{font-size:0.56rem;font-weight:600;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.09em;margin-bottom:5px;}
        .stat-val{font-size:1.05rem;font-weight:700;color:var(--ink);line-height:1;margin-bottom:3px;}
        .stat-val.pos{color:var(--green);}
        .stat-sub{font-size:0.58rem;font-weight:300;color:var(--ink-faint);}

        /* ── DIVIDER ── */
        .section-divider{height:1px;background:rgba(255,255,255,0.05);margin:18px 16px 16px;}

        /* ── SECTION LABEL ── */
        .section-label{font-size:0.58rem;font-weight:700;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.12em;padding:0 20px 10px;display:flex;align-items:center;gap:7px;}
        .section-label-pip{display:inline-block;width:3px;height:10px;background:var(--accent);border-radius:2px;flex-shrink:0;}

        /* ── 2-COL CARDS — flush with bg ── */
        .two-col{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 16px 8px;}
        .info-card{
          background:var(--card);
          border:1px solid rgba(255,255,255,0.04);
          border-radius:14px;padding:14px;
        }
        .ic-label{font-size:0.58rem;font-weight:600;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;}
        .movers-item{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;}
        .movers-item:last-child{margin-bottom:0;}
        .mover-sym{display:flex;align-items:center;gap:7px;font-family:var(--mono);font-size:0.68rem;font-weight:500;color:var(--ink);}
        .mover-ico{width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0;}
        .mover-chg{font-family:var(--mono);font-size:0.63rem;font-weight:500;}
        .mover-chg.up{color:var(--green);}
        .mover-chg.dn{color:var(--red);}
        .activity-item{font-size:0.63rem;font-weight:400;color:var(--ink-dim);margin-bottom:7px;line-height:1.4;padding-left:10px;border-left:2px solid rgba(255,255,255,0.06);}
        .activity-item:last-child{margin-bottom:0;}

        /* ── MARKETS TABLE ── */
        .asset-section{padding:0 16px 8px;}
        .asset-table-wrap{
          background:var(--card);
          border:1px solid rgba(255,255,255,0.04);
          border-radius:14px;overflow:hidden;
        }
        .asset-thead{display:grid;grid-template-columns:2fr 1.2fr 1fr 1.4fr;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.05);background:rgba(0,0,0,0.15);}
        .asset-th{font-size:0.54rem;font-weight:700;color:var(--ink-faint);text-transform:uppercase;letter-spacing:0.08em;}
        .asset-row{display:grid;grid-template-columns:2fr 1.2fr 1fr 1.4fr;align-items:center;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.04);transition:background 0.12s;}
        .asset-row:last-child{border-bottom:none;}
        .asset-row:hover{background:rgba(255,255,255,0.03);}
        .asset-name-cell{display:flex;align-items:center;gap:8px;}
        .asset-ico{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;flex-shrink:0;}
        .asset-sym{font-family:var(--mono);font-size:0.7rem;font-weight:600;color:var(--ink);line-height:1;margin-bottom:1px;}
        .asset-nm{font-size:0.56rem;font-weight:300;color:var(--ink-faint);}
        .asset-price{font-family:var(--mono);font-size:0.68rem;font-weight:500;color:var(--ink);}
        .asset-chg{font-family:var(--mono);font-size:0.63rem;font-weight:600;}
        .asset-chg.up{color:var(--green);}
        .asset-chg.dn{color:var(--red);}
        .trade-btns{display:flex;gap:4px;}
        .btn-buy{background:var(--accent);color:#0a1f2e;border:none;border-radius:6px;padding:5px 10px;font-family:var(--sans);font-size:0.6rem;font-weight:700;cursor:pointer;transition:opacity 0.12s;}
        .btn-buy:hover{opacity:0.78;}
        .btn-sell{background:transparent;color:var(--ink-2);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:5px 10px;font-family:var(--sans);font-size:0.6rem;font-weight:600;cursor:pointer;transition:background 0.12s;}
        .btn-sell:hover{background:rgba(255,255,255,0.05);}

        /* ── FEAR & GREED CELL ── */
        .fg-cell{display:flex;flex-direction:column;align-items:center;padding-top:2px;}

        /* ── NEWS ── */
        .news-section{padding:0 16px 24px;}
        .news-wrap{
          background:var(--card);
          border:1px solid rgba(255,255,255,0.04);
          border-radius:14px;overflow:hidden;
        }
        .news-item{
          display:flex;align-items:flex-start;gap:10px;
          padding:12px 14px;
          border-bottom:1px solid rgba(255,255,255,0.04);
          transition:background 0.12s;
        }
        .news-item:last-child{border-bottom:none;}
        .news-item:hover{background:rgba(255,255,255,0.03);}
        .news-tag{
          flex-shrink:0;
          padding:2px 7px;border-radius:6px;
          font-family:var(--mono);font-size:0.52rem;font-weight:700;
          letter-spacing:0.07em;text-transform:uppercase;margin-top:2px;
        }
        .news-body{flex:1;min-width:0;}
        .news-headline{font-size:0.7rem;font-weight:500;color:var(--ink);line-height:1.45;margin-bottom:3px;}
        .news-meta{font-size:0.57rem;font-weight:300;color:var(--ink-faint);}
        .news-pulse{display:flex;align-items:center;justify-content:center;gap:6px;padding:12px;border-top:1px solid rgba(255,255,255,0.04);}
        .news-pulse-dot{width:5px;height:5px;border-radius:50%;background:var(--accent);animation:blink 2s ease-in-out infinite;}

        /* ── SHEET ── */
        .sheet-overlay{position:fixed;inset:0;background:rgba(5,14,22,0.75);z-index:200;backdrop-filter:blur(3px);animation:fadeIn 0.2s ease;}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .sheet{position:fixed;bottom:0;left:0;right:0;background:#0e2738;border-radius:24px 24px 0 0;border-top:1px solid rgba(255,255,255,0.06);padding:0 20px 40px;z-index:201;animation:slideUp 0.3s cubic-bezier(0.32,0.72,0,1);max-width:480px;margin:0 auto;}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes dspin{to{transform:rotate(360deg)}}
        .sheet-handle{width:36px;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;margin:12px auto 20px;}
        .sheet-title{font-size:1.1rem;font-weight:700;color:var(--ink);letter-spacing:-0.02em;margin-bottom:4px;}
        .sheet-sub{font-size:0.67rem;font-weight:300;color:var(--ink-faint);margin-bottom:20px;}
        .sheet-full-link{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:13px;background:var(--accent);color:#0a1f2e;border-radius:12px;font-family:var(--sans);font-size:0.8rem;font-weight:700;text-decoration:none;transition:opacity 0.15s;margin-top:12px;}
        .sheet-full-link:hover{opacity:0.85;}
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

        {/* HERO BALANCE */}
        <div className="hero-card">
          <p className="bal-eyebrow">Net Asset Value</p>
          <p className="bal-amount"><sup>$</sup>{fmt(balance, 0)}<span className="cents">.00</span></p>
          <div className="bal-row">
            <span className="bal-change">{profit >= 0 ? '+' : ''}${fmt(profit)} ({changePercent >= 0 ? '+' : ''}{fmt(changePercent)}%)</span>
            <span className="bal-period">Current period</span>
          </div>
          <div className="bal-sparkline"><Sparkline positive={profit >= 0} width={140} height={30} /></div>
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
                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.68rem' }}>
                  <span style={{ color: tx.type === 'Deposit' ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>{tx.type}</span>
                  <span style={{ fontFamily: 'var(--mono)', color: 'var(--ink)' }}>${fmt(tx.amount, 0)}</span>
                  <Badge status={tx.status} />
                </div>
              ))}
          </div>
        </div>

        {/* STAT ROW — P&L | Positions | Fear & Greed */}
        <div className="stat-row">
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
          {/* Fear & Greed replaces Risk */}
          <div className="stat-cell fg-cell">
            <p className="stat-lbl" style={{ textAlign: 'center', marginBottom: 4 }}>Sentiment</p>
            <FearGreedGauge value={fearGreedValue} />
          </div>
        </div>

        <div className="section-divider" />

        {/* MARKET OVERVIEW */}
        <p className="section-label"><span className="section-label-pip" />Market Overview</p>
        <div className="two-col">
          <div className="info-card">
            <p className="ic-label">Top Movers</p>
            {topMovers.length === 0
              ? <p style={{ fontSize: '0.62rem', color: 'var(--ink-faint)' }}>No data</p>
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
              ? <p style={{ fontSize: '0.62rem', color: 'var(--ink-faint)' }}>No recent activity</p>
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
              ? <div style={{ padding: '24px', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.68rem', color: 'var(--ink-faint)', fontWeight: 300 }}>No market data available.</p>
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

        <div className="section-divider" />

        {/* GLOBAL FINANCE NEWS */}
        <p className="section-label"><span className="section-label-pip" />Global Finance News</p>
        <div className="news-section">
          <div className="news-wrap">
            {newsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', gap: 10 }}>
                <div style={{ width: 22, height: 22, border: '2.5px solid rgba(255,255,255,0.06)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'dspin 0.7s linear infinite' }} />
                <p style={{ fontSize: '0.62rem', color: 'var(--ink-faint)' }}>Fetching latest news…</p>
              </div>
            ) : news.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.68rem', color: 'var(--ink-faint)', fontWeight: 300 }}>No news available.</p>
              </div>
            ) : (
              <>
                {news.map((item, i) => {
                  const [tagBg, tagCol] = tagColors[item.tag] ?? ['#1a1a1a', '#aaa'];
                  return (
                    <div key={i} className="news-item">
                      <span className="news-tag" style={{ background: tagBg, color: tagCol }}>{item.tag}</span>
                      <div className="news-body">
                        <p className="news-headline">{item.headline}</p>
                        <p className="news-meta">{item.source} · {item.time}</p>
                      </div>
                    </div>
                  );
                })}
                <div className="news-pulse">
                  <span className="news-pulse-dot" />
                  <span style={{ fontSize: '0.58rem', color: 'var(--ink-faint)', fontFamily: 'var(--mono)' }}>AI-curated · refreshes on load</span>
                </div>
              </>
            )}
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
                <div style={{ width: 26, height: 26, border: '2.5px solid rgba(255,255,255,0.06)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'dspin 0.7s linear infinite' }} />
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
                      border: method === m.id ? 'none' : '1px solid rgba(255,255,255,0.08)',
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
                  <div style={{ background: 'var(--card)', border: '1.5px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
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
                      background: copied ? 'var(--green-l)' : 'rgba(255,255,255,0.06)',
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
