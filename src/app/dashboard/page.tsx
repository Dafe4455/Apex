'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
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
  url?: string;
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
      <polyline points={pts} stroke={positive ? 'var(--green)' : 'var(--red)'}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function FearGreedGauge({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const getZone = (v: number) => {
    if (v <= 24) return { label: 'Extreme Bear', color: 'var(--red)' };
    if (v <= 44) return { label: 'Fear', color: '#fb923c' };
    if (v <= 55) return { label: 'Neutral', color: 'var(--gold)' };
    if (v <= 74) return { label: 'Positive', color: '#a3e635' };
    return { label: 'Very Positive', color: 'var(--green)' };
  };
  const zone = getZone(clamped);
  const W = 120, H = 68, cx = W / 2, cy = 62, r = 46;
  const segments = [
    { from: 0, to: 25, color: '#f87171' },
    { from: 25, to: 45, color: '#fb923c' },
    { from: 45, to: 55, color: '#fbbf24' },
    { from: 55, to: 75, color: '#a3e635' },
    { from: 75, to: 100, color: '#4ade80' },
  ];
  function polarToCart(angleDeg: number, radius: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(Math.PI - rad), y: cy - radius * Math.sin(Math.PI - rad) };
  }
  function arcPath(fromPct: number, toPct: number, rOuter: number, rInner: number) {
    const a1 = (fromPct / 100) * 180, a2 = (toPct / 100) * 180;
    const p1 = polarToCart(a1, rOuter), p2 = polarToCart(a2, rOuter);
    const p3 = polarToCart(a2, rInner), p4 = polarToCart(a1, rInner);
    const large = a2 - a1 > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 ${large} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rInner} ${rInner} 0 ${large} 0 ${p4.x} ${p4.y} Z`;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <path d={arcPath(0, 100, r, r - 10)} fill="var(--bg-3)" />
        {segments.map((seg, i) => (
          <path key={i} d={arcPath(seg.from, seg.to, r, r - 10)} fill={seg.color} opacity="0.85" />
        ))}
        <g style={{ transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${(clamped / 100) * 180 - 90}deg)`, transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          <line x1={cx} y1={cy} x2={cx} y2={cy - (r - 8)} stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
        </g>
        <circle cx={cx} cy={cy} r="4" fill="var(--ink)" />
        <text x={cx} y={cy - 14} textAnchor="middle" fill={zone.color} style={{ fontFamily: 'DM Mono, monospace', fontSize: '13px', fontWeight: 700 }}>{clamped}</text>
      </svg>
      <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', fontWeight: 700, color: zone.color, letterSpacing: '0.06em', marginTop: -4, textTransform: 'uppercase' }}>{zone.label}</span>
    </div>
  );
}

// ── News Modal ──────────────────────────────────────────────────────────────
function NewsModal({ item, onClose }: { item: NewsItem; onClose: () => void }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);

  const tagColors: Record<string, [string, string]> = {
    CRYPTO: ['var(--accent-l)', 'var(--accent)'],
    FOREX: ['var(--green-l)', '#a3e635'],
    STOCKS: ['var(--bg-3)', '#818cf8'],
    MACRO: ['var(--gold-l)', 'var(--gold)'],
    COMMODITIES: ['var(--red-l)', '#fb923c'],
  };
  const [tagBg, tagCol] = tagColors[item.tag] ?? ['var(--surface)', 'var(--ink-dim)'];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setSummary('');
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 1000,
            tools: [{ type: 'web_search_20250305', name: 'web_search' }],
            messages: [{
              role: 'user',
              content: `Search for this financial news story and give a concise 3-sentence summary suitable for a trading app: "${item.headline}" from ${item.source}. Focus on: what happened, why it matters to markets, and any key numbers or quotes. Write in plain, direct financial language. No bullet points, just prose.`
            }]
          })
        });
        const d = await res.json();
        const text = d.content
          .map((c: { type: string; text?: string }) => c.type === 'text' ? c.text : '')
          .filter(Boolean)
          .join('');
        if (!cancelled) setSummary(text.trim());
      } catch {
        if (!cancelled) setSummary('Unable to load summary. Please check back shortly.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [item.headline, item.source]);

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet news-modal-sheet">
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span className="news-tag" style={{ background: tagBg, color: tagCol, padding: '3px 9px', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: '0.54rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{item.tag}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--ink-faint)' }}>{item.source} · {item.time}</span>
        </div>
        <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.4, letterSpacing: '-0.01em', marginBottom: 18 }}>{item.headline}</p>
        <div style={{ borderTop: '1px solid var(--line-strong)', paddingTop: 16 }}>
          <p style={{ fontSize: '0.56rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'var(--mono)' }}>AI Summary</p>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 18, height: 18, border: '2px solid var(--line-strong)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'dspin 0.7s linear infinite', flexShrink: 0 }} />
              <p style={{ fontSize: '0.68rem', color: 'var(--ink-faint)' }}>Researching story…</p>
            </div>
          ) : (
            <p style={{ fontSize: '0.75rem', color: 'var(--ink-dim)', lineHeight: 1.65, fontWeight: 300 }}>{summary}</p>
          )}
        </div>
        <button onClick={onClose} style={{ marginTop: 22, width: '100%', padding: '13px', background: 'var(--surface)', border: '1px solid var(--line-strong)', borderRadius: 12, fontFamily: 'var(--sans)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-dim)', cursor: 'pointer' }}>
          Close
        </button>
      </div>
    </>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [time, setTime] = useState('');
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
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

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

  const fetchNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
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
      const match = clean.match(/\[[\s\S]*\]/);
      if (match) setNews(JSON.parse(match[0]));
    } catch {
      setNews([
        { headline: 'Fed holds rates amid inflation data', source: 'Reuters', time: '1h ago', tag: 'MACRO' },
        { headline: 'Bitcoin consolidates above $63k', source: 'CoinDesk', time: '2h ago', tag: 'CRYPTO' },
        { headline: 'S&P 500 edges higher on tech rally', source: 'Bloomberg', time: '3h ago', tag: 'STOCKS' },
        { headline: 'Oil steadies after OPEC+ meeting', source: 'FT', time: '4h ago', tag: 'COMMODITIES' },
        { headline: 'Dollar weakens vs. major peers', source: 'CNBC', time: '5h ago', tag: 'FOREX' },
      ]);
    } finally { setNewsLoading(false); }
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

  const balance = data?.user.portfolioBalance ?? 0;
  const firstName = data?.user.firstName ?? '';
  const userId = data?.user.id?.slice(-6).toUpperCase() ?? '------';
  const openPositions = data?.positions.open ?? 0;
  const profitPos = data?.positions.profit ?? 0;
  const lossPos = data?.positions.loss ?? 0;
  const activityLogs = data?.activityLogs ?? [];
  const profit = data?.user.realisedPnl ?? 0;
  const changePercent = data?.user.portfolioChangePercent ?? 0;
  const isProfitable = profit >= 0;

  const fearGreedValue = useMemo(() => {
    const weights: Record<string, number> = { BTC: 0.4, ETH: 0.3, SOL: 0.2, BNB: 0.1 };
    let weightedSum = 0, totalWeight = 0;
    for (const [sym, w] of Object.entries(weights)) {
      const asset = markets.find(m => m.symbol === sym);
      if (asset) { weightedSum += asset.change24h * w; totalWeight += w; }
    }
    if (totalWeight === 0) return data?.user.fearGreedIndex ?? 52;
    const avg = weightedSum / totalWeight;
    const clamped = Math.max(-5, Math.min(5, avg));
    return Math.round(((clamped + 5) / 10) * 100);
  }, [markets, data?.user.fearGreedIndex]);

  const activeMethod = depositMethods.find(m => m.id === method);

  // Split into gainers and losers
  const sorted = [...markets].sort((a, b) => b.change24h - a.change24h);
  const topGainers = sorted.filter(m => m.change24h >= 0).slice(0, 3);
  const topLosers = [...markets].sort((a, b) => a.change24h - b.change24h).filter(m => m.change24h < 0).slice(0, 3);

  const tagColors: Record<string, [string, string]> = {
    CRYPTO: ['var(--accent-l)', 'var(--accent)'],
    FOREX: ['var(--green-l)', '#a3e635'],
    STOCKS: ['var(--bg-3)', '#818cf8'],
    MACRO: ['var(--gold-l)', 'var(--gold)'],
    COMMODITIES: ['var(--red-l)', '#fb923c'],
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--line-strong)', borderTopColor: 'var(--ink-dim)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); font-family: var(--sans); }

        .dash-wrap { max-width: 480px; margin: 0 auto; background: var(--bg); min-height: 100vh; padding-bottom: 40px; transition: background 0.2s ease; }

        .d-header { padding: 20px 20px 16px; display: flex; align-items: flex-start; justify-content: space-between; }
        .d-greeting { font-size: 0.75rem; font-weight: 400; color: var(--ink-faint); margin-bottom: 2px; }
        .d-name { font-size: 1.65rem; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; line-height: 1; margin-bottom: 4px; }
        .d-uid { font-family: var(--mono); font-size: 0.58rem; letter-spacing: 0.1em; color: var(--ink-faint); }
        .d-header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
        .d-live-chip { display: flex; align-items: center; gap: 5px; background: var(--green-l); border: 1px solid var(--green); border-radius: 20px; padding: 4px 10px; font-family: var(--mono); font-size: 0.6rem; font-weight: 500; color: var(--green); opacity: 0.85; }
        .live-dot { width: 6px; height: 6px; background: var(--green); border-radius: 50%; animation: blink 2s ease-in-out infinite; flex-shrink: 0; }
        @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
        .d-clock { font-family: var(--mono); font-size: 0.7rem; color: var(--ink-dim); letter-spacing: 0.04em; }

        .hero-card { margin: 0 16px 6px; background: var(--card); border-radius: 20px; padding: 22px 20px 12px; border: 1px solid var(--line-strong); position: relative; overflow: hidden; transition: background 0.2s ease, border-color 0.2s ease; }
        .hero-card::before { content: ''; position: absolute; top: -60px; right: -30px; width: 195px; height: 180px; background: radial-gradient(circle, var(--accent-l) 0%, transparent 72%); pointer-events: none; }
        .bal-eyebrow { font-size: 0.58rem; font-weight: 600; color: var(--ink-faint); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 10px; }
        .bal-amount { font-size: 2.6rem; font-weight: 700; color: var(--ink); letter-spacing: -0.03em; line-height: 1; margin-bottom: 8px; }
        .bal-amount sup { font-size: 1rem; font-weight: 500; vertical-align: super; margin-right: 1px; }
        .bal-amount .cents { font-size: 1.1rem; font-weight: 400; color: var(--ink-dim); }
        .bal-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .bal-change { font-size: 0.78rem; font-weight: 600; }
        .bal-change.pos { color: var(--green); }
        .bal-change.neg { color: var(--red); }
        .bal-period { font-size: 0.62rem; font-weight: 300; color: var(--ink-faint); }
        .bal-sparkline { margin-bottom: 18px; }
        .bal-actions { display: flex; gap: 8px; }
        .btn-dep { background: var(--accent); color: #0a1f2e; border: none; border-radius: 10px; padding: 10px 18px; font-family: var(--sans); font-size: 0.72rem; font-weight: 700; cursor: pointer; transition: opacity 0.15s; flex-shrink: 0; }
        .btn-dep:hover { opacity: 0.88; }
        .btn-ghost { background: var(--surface); color: var(--ink-2); border: 1px solid var(--line-strong); border-radius: 10px; padding: 10px 14px; font-family: var(--sans); font-size: 0.72rem; font-weight: 600; cursor: pointer; transition: background 0.15s; text-decoration: none; display: inline-flex; align-items: center; flex-shrink: 0; }
        .btn-ghost:hover { background: var(--surface-hover); }

        .stat-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0; padding: 20px 20px 4px; }
        .stat-cell { padding: 0; }
        .stat-cell + .stat-cell { padding-left: 16px; border-left: 1px solid var(--line-strong); }
        .stat-lbl { font-size: 0.56rem; font-weight: 600; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.09em; margin-bottom: 5px; }
        .stat-val { font-size: 1.05rem; font-weight: 700; color: var(--ink); line-height: 1; margin-bottom: 3px; }
        .stat-val.pos { color: var(--green); }
        .stat-val.neg { color: var(--red); }
        .stat-sub { font-size: 0.58rem; font-weight: 300; color: var(--ink-faint); }

        .section-divider { height: 1px; background: var(--line-strong); margin: 18px 16px 16px; }
        .section-label { font-size: 0.58rem; font-weight: 700; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.12em; padding: 0 20px 10px; display: flex; align-items: center; justify-content: space-between; gap: 7px; }
        .section-label-pip { display: inline-block; width: 3px; height: 10px; background: var(--accent); border-radius: 2px; flex-shrink: 0; }
        .section-label-left { display: flex; align-items: center; gap: 7px; }
        .section-view-all { font-family: var(--mono); font-size: 0.56rem; font-weight: 700; color: var(--accent); text-decoration: none; letter-spacing: 0.08em; text-transform: uppercase; flex-shrink: 0; }
        .section-view-all:hover { opacity: 0.8; }

        /* ── SPLIT MOVERS GRID ── */
        .movers-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 0 16px 8px; }
        .movers-card { background: var(--card); border: 1px solid var(--line-strong); border-radius: 14px; padding: 14px 12px; }
        .movers-card-header { display: flex; align-items: center; gap: 6px; margin-bottom: 12px; }
        .movers-card-title { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
        .movers-card-title.gainers { color: var(--green); }
        .movers-card-title.losers { color: var(--red); }
        .movers-arrow { font-size: 0.65rem; }
        .mover-row { display: flex; align-items: center; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid var(--line); }
        .mover-row:last-child { border-bottom: none; padding-bottom: 0; }
        .mover-left { display: flex; align-items: center; gap: 7px; }
        .mover-ico { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; color: #fff; flex-shrink: 0; }
        .mover-sym-text { font-family: var(--mono); font-size: 0.68rem; font-weight: 600; color: var(--ink); }
        .mover-price { font-family: var(--mono); font-size: 0.56rem; color: var(--ink-faint); }
        .mover-chg { font-family: var(--mono); font-size: 0.68rem; font-weight: 700; }
        .mover-chg.up { color: var(--green); }
        .mover-chg.dn { color: var(--red); }
        .movers-empty { font-size: 0.6rem; color: var(--ink-faint); padding: 8px 0; }

        .full-card { margin: 0 16px 8px; background: var(--card); border: 1px solid var(--line-strong); border-radius: 14px; padding: 16px; transition: background 0.2s ease; }
        .activity-item { font-size: 0.68rem; font-weight: 400; color: var(--ink-dim); padding: 8px 0 8px 10px; border-bottom: 1px solid var(--line); border-left: 2px solid var(--line-strong); line-height: 1.45; }
        .activity-item:last-child { border-bottom: none; padding-bottom: 0; }

        .fg-cell { display: flex; flex-direction: column; align-items: center; padding-top: 2px; }

        /* ── NEWS ── */
        .news-section { padding: 0 16px 24px; }
        .news-wrap { background: var(--card); border: 1px solid var(--line-strong); border-radius: 14px; overflow: hidden; }
        .news-item { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-bottom: 1px solid var(--line); transition: background 0.12s; cursor: pointer; }
        .news-item:last-child { border-bottom: none; }
        .news-item:hover { background: var(--surface-hover); }
        .news-item:active { background: var(--surface); }
        .news-tag { flex-shrink: 0; padding: 2px 7px; border-radius: 6px; font-family: var(--mono); font-size: 0.52rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; margin-top: 2px; }
        .news-body { flex: 1; min-width: 0; }
        .news-headline { font-size: 0.7rem; font-weight: 500; color: var(--ink); line-height: 1.45; margin-bottom: 3px; }
        .news-meta { font-size: 0.57rem; font-weight: 300; color: var(--ink-faint); }
        .news-chevron { font-size: 0.65rem; color: var(--ink-faint); align-self: center; flex-shrink: 0; margin-left: 2px; }
        .news-pulse { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 12px; border-top: 1px solid var(--line); }
        .news-pulse-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); animation: blink 2s ease-in-out infinite; }

        /* ── QUICK TRADE TABLE ── */
        .qt-table { background: var(--card); border: 1px solid var(--line-strong); border-radius: 14px; overflow: hidden; }
        .qt-thead { display: grid; grid-template-columns: 2fr 1.1fr 1.1fr 1.4fr; padding: 9px 14px; background: var(--surface); border-bottom: 1px solid var(--line-strong); }
        .qt-th { font-size: 0.52rem; font-weight: 700; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.08em; }
        .qt-row { display: grid; grid-template-columns: 2fr 1.1fr 1.1fr 1.4fr; align-items: center; padding: 11px 14px; border-bottom: 1px solid var(--line); transition: background 0.12s; }
        .qt-row:last-child { border-bottom: none; }
        .qt-row:hover { background: var(--surface-hover); }
        .qt-asset-cell { display: flex; align-items: center; gap: 8px; }
        .qt-ico { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: #fff; flex-shrink: 0; }
        .qt-sym { font-family: var(--mono); font-size: 0.7rem; font-weight: 600; color: var(--ink); line-height: 1.2; }
        .qt-name { font-size: 0.54rem; font-weight: 300; color: var(--ink-faint); }
        .qt-price { font-family: var(--mono); font-size: 0.66rem; font-weight: 500; color: var(--ink); text-align: right; }
        .qt-chg { text-align: right; }
        .qt-chg-badge { display: inline-block; padding: 2px 6px; border-radius: 6px; font-family: var(--mono); font-size: 0.6rem; font-weight: 700; }
        .qt-chg.up .qt-chg-badge { background: var(--red-l); color: var(--red); }
        .qt-chg.dn .qt-chg-badge { background: var(--red-l); color: var(--red); }
        .qt-chg.up .qt-chg-badge { background: var(--green-l); color: var(--green); }
        .qt-btns { display: flex; gap: 5px; justify-content: flex-end; }
        .qt-buy { background: var(--accent); color: #0a1f2e; border: none; border-radius: 8px; padding: 6px 11px; font-family: var(--sans); font-size: 0.62rem; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; transition: opacity 0.12s; }
        .qt-buy:hover { opacity: 0.82; }
        .qt-sell { background: transparent; color: var(--red); border: 1px solid var(--red); border-radius: 8px; padding: 6px 11px; font-family: var(--sans); font-size: 0.62rem; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; transition: background 0.12s, color 0.12s; opacity: 0.85; }
        .qt-sell:hover { background: var(--red-l); }

        /* ── SHEETS / MODALS ── */
        .sheet-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 70; backdrop-filter: blur(4px); animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .sheet { position: fixed; bottom: 0; left: 0; right: 0; background: var(--card); border-radius: 24px 24px 0 0; border-top: 1px solid var(--line-strong); padding: 0 20px 40px; z-index: 201; animation: slideUp 0.3s cubic-bezier(0.32,0.72,0,1); max-width: 480px; margin: 0 auto; transition: background 0.2s ease; }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes dspin { to { transform: rotate(360deg) } }
        .sheet-handle { width: 36px; height: 4px; background: var(--line-strong); border-radius: 2px; margin: 12px auto 20px; }
        .sheet-title { font-size: 1.1rem; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; margin-bottom: 4px; }
        .sheet-sub { font-size: 0.67rem; font-weight: 300; color: var(--ink-faint); margin-bottom: 20px; }
        .sheet-full-link { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 13px; background: var(--accent); color: #0a1f2e; border-radius: 12px; font-family: var(--sans); font-size: 0.8rem; font-weight: 700; text-decoration: none; transition: opacity 0.15s; margin-top: 12px; }
        .sheet-full-link:hover { opacity: 0.85; }
        .news-modal-sheet { padding-bottom: 44px; }

        .method-pill { flex-shrink: 0; padding: 6px 14px; border-radius: 20px; font-family: var(--sans); font-size: 0.7rem; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .method-pill.active { background: var(--accent); color: #0a1f2e; border: none; }
        .method-pill.inactive { background: var(--card-adm); color: var(--ink-dim); border: 1px solid var(--line-strong); }

        .addr-box { background: var(--card-adm); border: 1.5px solid var(--line-strong); border-radius: 12px; padding: 14px 16px; margin-bottom: 12px; }
        .addr-network { font-size: 0.56rem; font-weight: 700; color: var(--accent); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px; }
        .addr-text { font-family: var(--mono); font-size: 0.68rem; color: var(--ink); word-break: break-all; line-height: 1.6; margin-bottom: 12px; }
        .copy-btn { width: 100%; padding: 9px; border-radius: 8px; border: none; font-family: var(--sans); font-size: 0.72rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .copy-btn.idle { background: var(--surface); color: var(--ink-dim); }
        .copy-btn.done { background: var(--green-l); color: var(--green); }
        .note-box { display: flex; gap: 8px; background: var(--gold-l); border: 1px solid var(--gold); border-radius: 10px; padding: 10px 14px; margin-bottom: 4px; opacity: 0.85; }
        .note-text { font-size: 0.62rem; color: var(--gold); font-weight: 400; line-height: 1.5; }
      `}</style>

      <div className="dash-wrap">
        {/* Header */}
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

        {/* Hero Balance Card */}
        <div className="hero-card">
          <p className="bal-eyebrow">Net Asset Value</p>
          <p className="bal-amount"><sup>$</sup>{fmt(balance, 0)}<span className="cents">.00</span></p>
          <div className="bal-row">
            <span className={`bal-change ${isProfitable ? 'pos' : 'neg'}`}>
              {isProfitable ? '+' : ''}{fmt(profit)} ({isProfitable ? '+' : ''}{fmt(changePercent)}%)
            </span>
            <span className="bal-period">. </span>
          </div>
          <div className="bal-sparkline"><Sparkline positive={isProfitable} width={140} height={30} /></div>
          <div className="bal-actions">
            <button className="btn-dep" onClick={openDeposit}>+ Deposit</button>
            <Link href="/dashboard/withdraw" className="btn-ghost">Withdraw</Link>
            <Link href="/dashboard/history" className="btn-ghost">📋 History</Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="stat-row">
          <div className="stat-cell">
            <p className="stat-lbl">P &amp; L</p>
            <p className={`stat-val ${isProfitable ? 'pos' : 'neg'}`}>{isProfitable ? '+' : ''}{fmt(profit)}</p>
            <p className="stat-sub">Realised</p>
          </div>
          <div className="stat-cell">
            <p className="stat-lbl">Positions</p>
            <p className="stat-val">{openPositions} open</p>
            <p className="stat-sub">{profitPos} profit · {lossPos} loss</p>
          </div>
          <div className="stat-cell fg-cell">
            <p className="stat-lbl" style={{ textAlign: 'center', marginBottom: 4 }}>Sentiment</p>
            <FearGreedGauge value={fearGreedValue} />
          </div>
        </div>

        <div className="section-divider" />

        {/* ── SPLIT MOVERS ── */}
        <p className="section-label">
          <span className="section-label-left"><span className="section-label-pip" />Market Movers</span>
          <Link href="/dashboard/markets" className="section-view-all">View all →</Link>
        </p>

        <div className="movers-grid">
          {/* Gainers */}
          <div className="movers-card">
            <div className="movers-card-header">
              <span className="movers-arrow" style={{ color: 'var(--green)' }}>↑</span>
              <span className="movers-card-title gainers">Top Gainers</span>
            </div>
            {topGainers.length === 0
              ? <p className="movers-empty">No data</p>
              : topGainers.map(m => (
                <div key={m.symbol} className="mover-row">
                  <div className="mover-left">
                    <span className="mover-ico" style={{ background: m.iconBg }}>{m.icon}</span>
                    <div>
                      <div className="mover-sym-text">{m.symbol}</div>
                      <div className="mover-price">${fmt(m.price, m.price > 100 ? 0 : 2)}</div>
                    </div>
                  </div>
                  <span className="mover-chg up">+{fmt(m.change24h)}%</span>
                </div>
              ))}
          </div>

          {/* Losers */}
          <div className="movers-card">
            <div className="movers-card-header">
              <span className="movers-arrow" style={{ color: 'var(--red)' }}>↓</span>
              <span className="movers-card-title losers">Top Losers</span>
            </div>
            {topLosers.length === 0
              ? <p className="movers-empty">No data</p>
              : topLosers.map(m => (
                <div key={m.symbol} className="mover-row">
                  <div className="mover-left">
                    <span className="mover-ico" style={{ background: m.iconBg }}>{m.icon}</span>
                    <div>
                      <div className="mover-sym-text">{m.symbol}</div>
                      <div className="mover-price">${fmt(m.price, m.price > 100 ? 0 : 2)}</div>
                    </div>
                  </div>
                  <span className="mover-chg dn">{fmt(m.change24h)}%</span>
                </div>
              ))}
          </div>
        </div>

        {/* ── QUICK TRADE ASSET LIST ── */}
        <p className="section-label" style={{ marginTop: 6 }}>
          <span className="section-label-left"><span className="section-label-pip" />Quick Trade</span>
          <Link href="/dashboard/markets" className="section-view-all">All markets →</Link>
        </p>
        <div style={{ margin: '0 16px 8px' }}>
          <div className="qt-table">
            <div className="qt-thead">
              <span className="qt-th">Asset</span>
              <span className="qt-th" style={{ textAlign: 'right' }}>Price</span>
              <span className="qt-th" style={{ textAlign: 'right' }}>24H</span>
              <span className="qt-th" style={{ textAlign: 'right' }}>Trade</span>
            </div>
            {markets.slice(0, 5).map(m => (
              <div key={m.symbol} className="qt-row">
                <div className="qt-asset-cell">
                  <span className="qt-ico" style={{ background: m.iconBg }}>{m.icon}</span>
                  <div>
                    <div className="qt-sym">{m.symbol}</div>
                    <div className="qt-name">{m.name}</div>
                  </div>
                </div>
                <div className="qt-price">${fmt(m.price, m.price > 100 ? 0 : 2)}</div>
                <div className={`qt-chg ${m.change24h >= 0 ? 'up' : 'dn'}`}>
                  <span className="qt-chg-badge">{m.change24h >= 0 ? '▲' : '▼'} {Math.abs(m.change24h).toFixed(2)}%</span>
                </div>
                <div className="qt-btns">
                  <Link href={`/dashboard/trade?asset=${m.symbol}&side=buy`} className="qt-buy">Buy</Link>
                  <Link href={`/dashboard/trade?asset=${m.symbol}&side=sell`} className="qt-sell">Sell</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section-divider" />

        {/* Recent Activity */}
        <p className="section-label">
          <span className="section-label-left"><span className="section-label-pip" />Recent Activity</span>
          <Link href="/dashboard/history" className="section-view-all">View all →</Link>
        </p>
        <div className="full-card">
          {activityLogs.length === 0
            ? <p style={{ fontSize: '0.62rem', color: 'var(--ink-faint)' }}>No recent activity</p>
            : activityLogs.slice(0, 5).map(a => (
              <p key={a.id} className="activity-item">{a.description}</p>
            ))}
        </div>

        <div className="section-divider" />

        {/* ── NEWS ── */}
        <p className="section-label"><span className="section-label-left"><span className="section-label-pip" />Global Finance News</span></p>
        <div className="news-section">
          <div className="news-wrap">
            {newsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', gap: 10 }}>
                <div style={{ width: 22, height: 22, border: '2.5px solid var(--line-strong)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'dspin 0.7s linear infinite' }} />
                <p style={{ fontSize: '0.62rem', color: 'var(--ink-faint)' }}>Fetching latest news…</p>
              </div>
            ) : news.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.68rem', color: 'var(--ink-faint)', fontWeight: 300 }}>No news available.</p>
              </div>
            ) : (
              <>
                {news.map((item, i) => {
                  const [tagBg, tagCol] = tagColors[item.tag] ?? ['var(--surface)', 'var(--ink-dim)'];
                  return (
                    <div key={i} className="news-item" onClick={() => setSelectedNews(item)}>
                      <span className="news-tag" style={{ background: tagBg, color: tagCol }}>{item.tag}</span>
                      <div className="news-body">
                        <p className="news-headline">{item.headline}</p>
                        <p className="news-meta">{item.source} · {item.time}</p>
                      </div>
                      <span className="news-chevron">›</span>
                    </div>
                  );
                })}
                <div className="news-pulse">
                  <span className="news-pulse-dot" />
                  <span style={{ fontSize: '0.58rem', color: 'var(--ink-faint)', fontFamily: 'var(--mono)' }}>AI-curated · tap to read</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Deposit Sheet */}
      {sheet === 'deposit' && (
        <>
          <div className="sheet-overlay" onClick={closeSheet} />
          <div className="sheet">
            <div className="sheet-handle" />
            <p className="sheet-title">Quick Deposit</p>
            <p className="sheet-sub">Copy an address and make instant deposit</p>
            {methodsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 0', gap: 12 }}>
                <div style={{ width: 26, height: 26, border: '2.5px solid var(--line-strong)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'dspin 0.7s linear infinite' }} />
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
                    <button key={m.id} onClick={() => setMethod(m.id)} className={`method-pill ${method === m.id ? 'active' : 'inactive'}`}>
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
                {activeMethod && (
                  <div className="addr-box">
                    {activeMethod.network && <p className="addr-network">Network: {activeMethod.network}</p>}
                    <p className="addr-text">{activeMethod.address}</p>
                    <button onClick={() => copyAddress(activeMethod.address)} className={`copy-btn ${copied ? 'done' : 'idle'}`}>
                      {copied ? '✓ Copied!' : '📋 Copy Address'}
                    </button>
                  </div>
                )}
                {activeMethod?.note && (
                  <div className="note-box">
                    <span style={{ fontSize: '0.85rem' }}>⚠️</span>
                    <p className="note-text">{activeMethod.note}</p>
                  </div>
                )}
              </>
            )}
            <Link href="/dashboard/deposit" className="sheet-full-link" onClick={closeSheet}>Confirm→</Link>
          </div>
        </>
      )}

      {/* News Modal */}
      {selectedNews && <NewsModal item={selectedNews} onClose={() => setSelectedNews(null)} />}
    </>
  );
}
