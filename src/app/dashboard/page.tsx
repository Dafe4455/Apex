'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/* ── Types ── */
type Transaction = {
  id: string;
  type: 'Deposit' | 'Withdrawal' | 'Trade';
  asset: string;
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  createdAt: string;
};

type Market = {
  symbol: string;
  name: string;
  logoUrl: string;
  price: number;
  changePercent: number;
};

type DepositMethod = {
  id: string;
  label: string;
  icon: string;
  address: string;
  network?: string;
  note?: string;
};

type AllocationItem = {
  asset: string;
  symbol: string;
  value: number;
  percent: number;
  color: string;
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
  activityLogs: { id: string; description: string; detail: string; time: string; type: string }[];
  portfolioAllocation: AllocationItem[];
  portfolioHistory: number[];
};

type NewsItem = {
  headline: string;
  summary: string;
  source: string;
  time: string;
  tag: string;
  url: string;
};

/* ── Helpers ── */
function fmt(n: number | null | undefined, d = 2) {
  return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

/* ── Sparkline (real data) ── */
function Sparkline({ data, positive = true, width = 140, height = 30 }: {
  data?: number[];
  positive?: boolean;
  width?: number;
  height?: number;
}) {
  if (!data || data.length < 2) {
    const pts = positive
      ? '0,24 20,18 40,20 60,12 80,14 100,8 120,10 140,6'
      : '0,6 20,10 40,8 60,16 80,14 100,20 120,18 140,24';
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
        <polyline points={pts} stroke={positive ? 'var(--green)' : 'var(--red)'}
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    );
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = i * stepX;
    const y = height - 4 - ((v - min) / range) * (height - 8);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <polyline points={pts} stroke={positive ? 'var(--green)' : 'var(--red)'}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/* ── Badge ── */
function Badge({ status }: { status: 'COMPLETED' | 'PENDING' | 'FAILED' }) {
  const map: Record<string, [string, string]> = {
    COMPLETED: ['var(--green-l)', 'var(--green)'],
    PENDING:   ['var(--gold-l)',  'var(--gold)'],
    FAILED:    ['var(--red-l)',   'var(--red)'],
  };
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

/* ── Fear & Greed Gauge ── */
function FearGreedGauge({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const getZone = (v: number) => {
    if (v <= 24) return { label: 'Extreme Bear', color: 'var(--red)' };
    if (v <= 44) return { label: 'Fear',         color: '#fb923c' };
    if (v <= 55) return { label: 'Neutral',      color: 'var(--gold)' };
    if (v <= 74) return { label: 'Positive',     color: '#a3e635' };
    return             { label: 'Very Positive', color: 'var(--green)' };
  };
  const zone = getZone(clamped);
  const W = 120, H = 68, cx = W / 2, cy = 62, r = 46;

  const polarToCart = (angleDeg: number, radius: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(Math.PI - rad),
      y: cy - radius * Math.sin(Math.PI - rad),
    };
  };

  const arcPath = (fromPct: number, toPct: number, rOuter: number, rInner: number) => {
    const a1 = (fromPct / 100) * 180;
    const a2 = (toPct  / 100) * 180;
    const p1 = polarToCart(a1, rOuter);
    const p2 = polarToCart(a2, rOuter);
    const p3 = polarToCart(a2, rInner);
    const p4 = polarToCart(a1, rInner);
    const large = a2 - a1 > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 ${large} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rInner} ${rInner} 0 ${large} 0 ${p4.x} ${p4.y} Z`;
  };

  const segments = [
    { from: 0,  to: 25,  color: '#f87171' },
    { from: 25, to: 45,  color: '#fb923c' },
    { from: 45, to: 55,  color: '#fbbf24' },
    { from: 55, to: 75,  color: '#a3e635' },
    { from: 75, to: 100, color: '#4ade80' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <path d={arcPath(0, 100, r, r - 10)} fill="var(--bg-3)" />
        {segments.map((seg, i) => (
          <path key={i} d={arcPath(seg.from, seg.to, r, r - 10)} fill={seg.color} opacity="0.85" />
        ))}
        <g style={{
          transformOrigin: `${cx}px ${cy}px`,
          transform: `rotate(${(clamped / 100) * 180 - 90}deg)`,
          transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          <line x1={cx} y1={cy} x2={cx} y2={cy - (r - 8)}
            stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
        </g>
        <circle cx={cx} cy={cy} r="4" fill="var(--ink)" />
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

/* ── Allocation Donut (NEW) ── */
function AllocationDonut({ data }: { data: AllocationItem[] }) {
  const size = 140;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--bg-3)" strokeWidth={stroke} />
        {data.map((item, i) => {
          const dash = (item.percent / 100) * circumference;
          const seg = (
            <circle
              key={i}
              cx={size/2} cy={size/2} r={radius}
              fill="none" stroke={item.color}
              strokeWidth={hovered === i ? stroke + 2 : stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              style={{ transition: 'all 0.2s', cursor: 'pointer', opacity: hovered !== null && hovered !== i ? 0.4 : 1 }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          );
          offset += dash;
          return seg;
        })}
        <text x={size/2} y={size/2 - 4} textAnchor="middle" fill="var(--ink)"
          style={{ fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 700 }}>
          {hovered !== null ? `${data[hovered].percent}%` : '100%'}
        </text>
        <text x={size/2} y={size/2 + 12} textAnchor="middle" fill="var(--ink-dim)"
          style={{ fontFamily: 'var(--sans)', fontSize: '9px', fontWeight: 400 }}>
          {hovered !== null ? data[hovered].symbol : 'Allocated'}
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {data.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            opacity: hovered !== null && hovered !== i ? 0.4 : 1,
            transition: 'opacity 0.2s',
            cursor: 'pointer'
          }}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}>
            <span style={{ width: 8, height: 8, borderRadius: 3, background: item.color, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--ink)', fontWeight: 600, flex: 1 }}>{item.symbol}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--ink-dim)' }}>${fmt(item.value, 0)}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--ink-faint)', minWidth: 32, textAlign: 'right' }}>{item.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Price Flash (NEW) ── */
function PriceFlash({ value, prevValue, children }: { value: number; prevValue?: number; children: React.ReactNode }) {
  const [flash, setFlash] = useState<'up' | 'dn' | null>(null);
  const prevRef = useRef<number | undefined>(prevValue);

  useEffect(() => {
    if (prevRef.current !== undefined && value !== prevRef.current) {
      setFlash(value > prevRef.current ? 'up' : 'dn');
      const t = setTimeout(() => setFlash(null), 800);
      return () => clearTimeout(t);
    }
    prevRef.current = value;
  }, [value]);

  return (
    <span style={{
      transition: 'background 0.3s, color 0.3s',
      background: flash === 'up' ? 'var(--green-l)' : flash === 'dn' ? 'var(--red-l)' : 'transparent',
      color: flash === 'up' ? 'var(--green)' : flash === 'dn' ? 'var(--red)' : undefined,
      borderRadius: 4,
      padding: flash ? '1px 4px' : '1px 0',
      display: 'inline-block'
    }}>
      {children}
    </span>
  );
}

/* ── Notification Bell (NEW) ── */
function NotificationBell({ notifications, onOpen }: {
  notifications: { id: string; message: string; read: boolean }[];
  onOpen: () => void;
}) {
  const unread = notifications.filter(n => !n.read).length;
  return (
    <button onClick={onOpen} style={{
      position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
      padding: 6, color: 'var(--ink-dim)', display: 'flex', alignItems: 'center'
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
      </svg>
      {unread > 0 && (
        <span style={{
          position: 'absolute', top: 2, right: 2,
          width: 8, height: 8, borderRadius: '50%', background: 'var(--red)',
          border: '2px solid var(--bg)'
        }} />
      )}
    </button>
  );
}

/* ── Notification Panel (NEW) ── */
function NotificationPanel({ notifications, onClose, onMarkRead }: {
  notifications: { id: string; message: string; read: boolean }[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
}) {
  return (
    <>
      <div className="notif-overlay" onClick={onClose} />
      <div className="notif-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>Notifications</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--ink-dim)', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
        </div>
        {notifications.length === 0 ? (
          <p style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', textAlign: 'center', padding: '40px 0' }}>No notifications</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifications.map(n => (
              <div key={n.id} onClick={() => onMarkRead(n.id)} style={{
                padding: '12px 14px', borderRadius: 10,
                background: n.read ? 'transparent' : 'var(--surface)',
                border: '1px solid var(--line)',
                cursor: 'pointer', transition: 'background 0.15s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
                  <span style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--ink)', lineHeight: 1.4 }}>{n.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ── Risk Badge (NEW) ── */
function RiskBadge({ label }: { label: string }) {
  const colors: Record<string, [string, string]> = {
    Conservative: ['var(--green-l)', 'var(--green)'],
    Moderate: ['var(--gold-l)', 'var(--gold)'],
    Aggressive: ['var(--red-l)', 'var(--red)'],
  };
  const [bg, col] = colors[label] ?? colors.Moderate;
  return (
    <span style={{
      background: bg, color: col, padding: '3px 10px', borderRadius: 20,
      fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
      fontFamily: 'var(--mono)', display: 'inline-flex', alignItems: 'center', gap: 4
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: col }} />
      {label} Risk
    </span>
  );
}

/* ── Main Page ── */
export default function DashboardPage() {
  const router = useRouter();
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
  const [expandedNewsIdx, setExpandedNewsIdx] = useState<number | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const prevPrices = useRef<Record<string, number>>({});

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/user/dashboard');
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, []);

  const fetchMarkets = useCallback(async () => {
    try {
      const res = await fetch('/api/market');
      if (res.ok) {
        const newMarkets: Market[] = await res.json();
        // Track previous prices for flash animation
        newMarkets.forEach(m => {
          prevPrices.current[m.symbol] = markets.find(pm => pm.symbol === m.symbol)?.price ?? m.price;
        });
        setMarkets(newMarkets);
      }
    } catch {}
  }, [markets]);

  const fetchNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const res = await fetch('/api/news');
      if (!res.ok) throw new Error('news fetch failed');
      const data = await res.json();
      setNews(data.news ?? []);
    } catch {
      setNews([]);
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboard(), fetchMarkets(), fetchNews()]);
    setRefreshing(false);
  }, [fetchDashboard, fetchMarkets, fetchNews]);

  const markNotifRead = (id: string) => {
    setData(prev => prev ? ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }) : null);
  };

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
  const openPositions = data?.positions.open       ?? 0;
  const profitPos    = data?.positions.profit      ?? 0;
  const lossPos      = data?.positions.loss        ?? 0;
  const activityLogs = data?.activityLogs          ?? [];
  const profit        = data?.user.realisedPnl            ?? 0;
  const changePercent = data?.user.portfolioChangePercent ?? 0;
  const isProfitable  = profit >= 0;
  const riskLabel     = data?.user.riskLabel ?? 'Moderate';
  const portfolioHistory = data?.portfolioHistory ?? [];
  const allocation   = data?.portfolioAllocation ?? [];

  const fearGreedValue = useMemo(() => {
    const weights: Record<string, number> = { BTC: 0.4, ETH: 0.3, SOL: 0.2, BNB: 0.1 };
    let weightedSum = 0, totalWeight = 0;
    for (const [sym, w] of Object.entries(weights)) {
      const asset = markets.find(m => m.symbol === sym);
      if (asset) { weightedSum += asset.changePercent * w; totalWeight += w; }
    }
    if (totalWeight === 0) return data?.user.fearGreedIndex ?? 52;
    const avg = weightedSum / totalWeight;
    const clamped = Math.max(-5, Math.min(5, avg));
    return Math.round(((clamped + 5) / 10) * 100);
  }, [markets, data?.user.fearGreedIndex]);

  const activeMethod = depositMethods.find(m => m.id === method);

  const topGainers = [...markets]
    .filter(m => m.changePercent >= 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 3);

  const topLosers = [...markets]
    .filter(m => m.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 3);

  const QUICK_TRADE_SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB'];
  const CRYPTO_SYMS = ['BTC', 'ETH', 'SOL', 'BNB'];

  const quickTradeAssets = QUICK_TRADE_SYMBOLS
    .map(sym => markets.find(m => m.symbol === sym))
    .filter((m): m is Market => Boolean(m));

  const handleQuickTrade = (symbol: string, action: 'BUY' | 'SELL') => {
    const tradeSymbol = CRYPTO_SYMS.includes(symbol) ? `${symbol}USD` : symbol;
    router.push(`/dashboard/trade?asset=${tradeSymbol}&action=${action}`);
  };

  const tagColors: Record<string, [string, string]> = {
    CRYPTO:      ['var(--accent-l)', 'var(--accent)'],
    FOREX:       ['var(--green-l)',  '#a3e635'],
    STOCKS:      ['var(--bg-3)',     '#818cf8'],
    MACRO:       ['var(--gold-l)',   'var(--gold)'],
    COMMODITIES: ['var(--red-l)',    '#fb923c'],
  };

  const activityIcons: Record<string, string> = {
    trade: '⚡',
    withdrawal: '↓',
    deposit: '↑',
    kyc: '✓',
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--line-strong)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <p style={{ fontSize: '0.7rem', color: 'var(--ink-faint)' }}>Loading your portfolio…</p>
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

        .dash-wrap {
          max-width: 480px; margin: 0 auto;
          background: var(--bg);
          min-height: 100vh; padding-bottom: 40px;
          transition: background 0.2s ease;
        }

        @media (min-width: 1024px) {
          .dash-wrap { max-width: 1280px; }
          .d-header { padding: 32px 24px 20px; }
          .d-name { font-size: 2.1rem; }
          .hero-card { padding: 28px 28px 16px; }
          .bal-amount { font-size: 3.4rem; }
          .dash-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 400px;
            gap: 8px 24px;
            align-items: start;
          }
          .dash-side {
            position: sticky;
            top: 24px;
            max-height: calc(100vh - 48px);
            overflow-y: auto;
          }
          .dash-side::-webkit-scrollbar { width: 4px; }
          .dash-side::-webkit-scrollbar-track { background: transparent; }
          .dash-side::-webkit-scrollbar-thumb { background: var(--line-strong); border-radius: 2px; }
        }

        .d-header { padding: 20px 20px 16px; display: flex; align-items: flex-start; justify-content: space-between; }
        .d-greeting { font-size: 0.75rem; font-weight: 400; color: var(--ink-faint); margin-bottom: 2px; }
        .d-name { font-size: 1.65rem; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; line-height: 1; margin-bottom: 4px; }
        .d-uid { font-family: var(--mono); font-size: 0.58rem; letter-spacing: 0.1em; color: var(--ink-faint); }
        .d-header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
        .d-live-chip {
          display: flex; align-items: center; gap: 5px;
          background: var(--green-l);
          border: 1px solid var(--green);
          border-radius: 20px; padding: 4px 10px;
          font-family: var(--mono); font-size: 0.6rem; font-weight: 500;
          color: var(--green); opacity: 0.85;
        }
        .live-dot { width: 6px; height: 6px; background: var(--green); border-radius: 50%; animation: blink 2s ease-in-out infinite; flex-shrink: 0; }
        @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
        .d-clock { font-family: var(--mono); font-size: 0.7rem; color: var(--ink-dim); letter-spacing: 0.04em; }

        .hero-card {
          margin: 0 16px 6px;
          background: var(--card);
          border-radius: 20px; padding: 22px 20px 12px;
          border: 1px solid var(--line-strong);
          position: relative; overflow: hidden;
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .hero-card::before {
          content: ''; position: absolute; top: -60px; right: -30px;
          width: 195px; height: 180px;
          background: radial-gradient(circle, var(--accent-l) 0%, transparent 72%);
          pointer-events: none;
        }
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
        .btn-dep {
          background: var(--accent); color: #0a1f2e; border: none; border-radius: 10px;
          padding: 10px 18px; font-family: var(--sans); font-size: 0.72rem; font-weight: 700;
          cursor: pointer; transition: opacity 0.15s; flex-shrink: 0;
        }
        .btn-dep:hover { opacity: 0.88; }
        .btn-ghost {
          background: var(--surface); color: var(--ink-2);
          border: 1px solid var(--line-strong); border-radius: 10px;
          padding: 10px 14px; font-family: var(--sans); font-size: 0.72rem; font-weight: 600;
          cursor: pointer; transition: background 0.15s; text-decoration: none;
          display: inline-flex; align-items: center; flex-shrink: 0;
        }
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
        .section-label {
          font-size: 0.58rem; font-weight: 700; color: var(--ink-faint);
          text-transform: uppercase; letter-spacing: 0.12em;
          padding: 0 20px 10px; display: flex; align-items: center; justify-content: space-between; gap: 7px;
        }
        .section-label-pip { display: inline-block; width: 3px; height: 10px; background: var(--accent); border-radius: 2px; flex-shrink: 0; }
        .section-label-left { display: flex; align-items: center; gap: 7px; }
        .section-view-all {
          font-family: var(--mono); font-size: 0.56rem; font-weight: 700;
          color: var(--accent); text-decoration: none; letter-spacing: 0.08em;
          text-transform: uppercase; flex-shrink: 0;
        }
        .section-view-all:hover { opacity: 0.8; }

        .full-card {
          margin: 0 16px 8px;
          background: var(--card);
          border: 1px solid var(--line-strong);
          border-radius: 14px; padding: 16px;
          transition: background 0.2s ease;
        }
        .fc-label { font-size: 0.58rem; font-weight: 600; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }

        .movers-split { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 0 16px 8px; }
        .movers-card {
          background: var(--card);
          border: 1px solid var(--line-strong);
          border-radius: 14px; padding: 14px;
          min-width: 0; overflow: hidden;
        }
        .movers-card-title {
          display: flex; align-items: center; gap: 5px;
          font-family: var(--mono); font-size: 0.6rem; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          margin-bottom: 12px;
        }
        .movers-card-title.gainers { color: var(--green); }
        .movers-card-title.losers  { color: var(--red); }
        .movers-split-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 7px 0; border-bottom: 1px solid var(--line); gap: 6px;
        }
        .movers-split-item:last-child { border-bottom: none; padding-bottom: 0; }
        .movers-split-sym { font-family: var(--mono); font-size: 0.66rem; font-weight: 600; color: var(--ink); flex-shrink: 0; }
        .movers-split-price { font-family: var(--mono); font-size: 0.58rem; color: var(--ink-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1 1 auto; min-width: 0; }
        .movers-split-chg {
          font-family: var(--mono); font-size: 0.62rem; font-weight: 700;
          padding: 2px 7px; border-radius: 6px; flex-shrink: 0; white-space: nowrap;
        }
        .movers-split-chg.up { background: var(--green-l); color: var(--green); }
        .movers-split-chg.dn { background: var(--red-l);   color: var(--red);   }
        .movers-empty { font-size: 0.6rem; color: var(--ink-faint); padding: 4px 0; }

        .qt-card {
          margin: 0 16px 8px;
          background: var(--card);
          border: 1px solid var(--line-strong);
          border-radius: 14px; overflow: hidden;
        }
        .qt-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; padding: 12px 14px;
          border-bottom: 1px solid var(--line);
          transition: background 0.12s;
        }
        .qt-row:last-child { border-bottom: none; }
        .qt-row:hover { background: var(--surface-hover); }
        .qt-asset { display: flex; align-items: center; gap: 10px; min-width: 0; flex-shrink: 1; }
        .qt-ico {
          width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; color: var(--ink-dim);
          background: var(--surface); font-family: var(--mono);
        }
        .qt-ico-img {
          width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
          object-fit: cover; background: var(--surface);
        }
        .qt-meta { min-width: 0; }
        .qt-sym { font-family: var(--mono); font-size: 0.72rem; font-weight: 600; color: var(--ink); line-height: 1.3; }
        .qt-price { font-family: var(--mono); font-size: 0.6rem; color: var(--ink-faint); }
        .qt-chg { font-family: var(--mono); font-size: 0.62rem; font-weight: 600; flex-shrink: 0; }
        .qt-chg.up { color: var(--green); }
        .qt-chg.dn { color: var(--red); }
        .qt-btns { display: flex; gap: 4px; flex-shrink: 0; }
        .btn-buy {
          background: var(--accent); color: #0a1f2e; border: none; border-radius: 6px;
          padding: 5px 10px; font-family: var(--sans); font-size: 0.6rem; font-weight: 700;
          cursor: pointer; transition: opacity 0.12s;
        }
        .btn-buy:hover { opacity: 0.78; }
        .btn-sell {
          background: transparent; color: var(--ink-2);
          border: 1px solid var(--line-strong); border-radius: 6px;
          padding: 5px 10px; font-family: var(--sans); font-size: 0.6rem; font-weight: 600;
          cursor: pointer; transition: background 0.12s;
        }
        .btn-sell:hover { background: var(--surface-hover); }

        .fg-cell { display: flex; flex-direction: column; align-items: center; padding-top: 2px; }

        .activity-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 0; border-bottom: 1px solid var(--line);
        }
        .activity-item:last-child { border-bottom: none; padding-bottom: 0; }
        .activity-icon {
          width: 26px; height: 26px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; flex-shrink: 0;
        }
        .activity-icon.trade { background: var(--accent-l); color: var(--accent); }
        .activity-icon.withdrawal { background: var(--red-l); color: var(--red); }
        .activity-icon.deposit { background: var(--green-l); color: var(--green); }
        .activity-icon.kyc { background: var(--gold-l); color: var(--gold); }
        .activity-content { flex: 1; min-width: 0; }
        .activity-desc { font-size: 0.68rem; font-weight: 500; color: var(--ink); line-height: 1.3; margin-bottom: 1px; }
        .activity-detail { font-size: 0.6rem; font-weight: 400; color: var(--ink-dim); font-family: var(--mono); margin-bottom: 2px; }
        .activity-time { font-size: 0.55rem; font-weight: 300; color: var(--ink-faint); }

        .news-section { padding: 0 16px 24px; }
        .news-wrap {
          background: var(--card);
          border: 1px solid var(--line-strong);
          border-radius: 14px; overflow: hidden;
        }
        .news-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 12px 14px;
          border-bottom: 1px solid var(--line);
          transition: background 0.12s;
          cursor: pointer;
        }
        .news-entry:last-child .news-item { border-bottom: none; }
        .news-entry:last-child .news-expand { border-bottom: none; }
        .news-item:hover { background: var(--surface-hover); }
        .news-tag {
          flex-shrink: 0; padding: 2px 7px; border-radius: 6px;
          font-family: var(--mono); font-size: 0.52rem; font-weight: 700;
          letter-spacing: 0.07em; text-transform: uppercase; margin-top: 2px;
        }
        .news-body { flex: 1; min-width: 0; }
        .news-headline { font-size: 0.7rem; font-weight: 500; color: var(--ink); line-height: 1.45; margin-bottom: 3px; }
        .news-meta { font-size: 0.57rem; font-weight: 300; color: var(--ink-faint); }
        .news-expand {
          padding: 0 14px 14px 14px;
          border-bottom: 1px solid var(--line);
          background: var(--surface);
        }
        .news-summary {
          font-size: 0.66rem; font-weight: 300; color: var(--ink-dim);
          line-height: 1.55; margin-bottom: 8px; padding-top: 2px;
        }
        .news-summary-empty { color: var(--ink-faint); font-style: italic; }
        .news-readmore {
          display: inline-flex; font-family: var(--mono); font-size: 0.6rem;
          font-weight: 700; color: var(--accent); text-decoration: none;
          letter-spacing: 0.04em;
        }
        .news-readmore:hover { opacity: 0.8; }
        .news-pulse {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 12px; border-top: 1px solid var(--line);
        }
        .news-pulse-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); animation: blink 2s ease-in-out infinite; }

        .refresh-btn { background: none; border: none; color: var(--ink-dim); cursor: pointer; padding: 4px; display: flex; align-items: center; transition: color 0.15s; }
        .refresh-btn:hover { color: var(--accent); }
        .refresh-btn.spinning svg { animation: spin 0.7s linear infinite; }

        .notif-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5); z-index: 90;
          animation: fadeIn 0.2s ease;
        }
        .notif-panel {
          position: fixed; top: 0; right: 0; bottom: 0;
          width: 320px; max-width: 85vw;
          background: var(--card);
          border-left: 1px solid var(--line-strong);
          z-index: 100; padding: 20px;
          overflow-y: auto;
          animation: slideInRight 0.25s cubic-bezier(0.32,0.72,0,1);
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes dspin { to { transform: rotate(360deg); } }

        .sheet-overlay {
          position: fixed; inset: 0;
          background: var(--card);
          z-index: 70; backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease;
        }
        .sheet {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: var(--card);
          border-radius: 24px 24px 0 0;
          border-top: 1px solid var(--line-strong);
          padding: 0 20px 40px; z-index: 201;
          animation: slideUp 0.3s cubic-bezier(0.32,0.72,0,1);
          max-width: 480px; margin: 0 auto;
          transition: background 0.2s ease;
        }
        .sheet-handle { width: 36px; height: 4px; background: var(--line-strong); border-radius: 2px; margin: 12px auto 20px; }
        .sheet-title { font-size: 1.1rem; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; margin-bottom: 4px; }
        .sheet-sub { font-size: 0.67rem; font-weight: 300; color: var(--ink-faint); margin-bottom: 20px; }
        .sheet-full-link {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          width: 100%; padding: 13px;
          background: var(--accent); color: #0a1f2e;
          border-radius: 12px; font-family: var(--sans); font-size: 0.8rem; font-weight: 700;
          text-decoration: none; transition: opacity 0.15s; margin-top: 12px;
        }
        .sheet-full-link:hover { opacity: 0.85; }

        .method-pill {
          flex-shrink: 0; padding: 6px 14px; border-radius: 20px;
          font-family: var(--sans); font-size: 0.7rem; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
        }
        .method-pill.active { background: var(--accent); color: #0a1f2e; border: none; }
        .method-pill.inactive {
          background: var(--card-adm); color: var(--ink-dim);
          border: 1px solid var(--line-strong);
        }

        .addr-box {
          background: var(--card-adm);
          border: 1.5px solid var(--line-strong);
          border-radius: 12px; padding: 14px 16px; margin-bottom: 12px;
        }
        .addr-network {
          font-size: 0.56rem; font-weight: 700; color: var(--accent);
          letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px;
        }
        .addr-text {
          font-family: var(--mono); font-size: 0.68rem; color: var(--ink);
          word-break: break-all; line-height: 1.6; margin-bottom: 12px;
        }
        .copy-btn {
          width: 100%; padding: 9px; border-radius: 8px; border: none;
          font-family: var(--sans); font-size: 0.72rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .copy-btn.idle { background: var(--surface); color: var(--ink-dim); }
        .copy-btn.done { background: var(--green-l); color: var(--green); }

        .note-box {
          display: flex; gap: 8px;
          background: var(--gold-l);
          border: 1px solid var(--gold);
          border-radius: 10px; padding: 10px 14px; margin-bottom: 4px;
          opacity: 0.85;
        }
        .note-text { font-size: 0.62rem; color: var(--gold); font-weight: 400; line-height: 1.5; }
      `}</style>

      <div className="dash-wrap">

        {/* ── Header ── */}
        <div className="d-header">
          <div>
            <p className="d-greeting">Welcome back,</p>
            <p className="d-name">{firstName}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <p className="d-uid">APEX·MKTS / {userId}</p>
              <RiskBadge label={riskLabel} />
            </div>
          </div>
          <div className="d-header-right">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={onRefresh} className={`refresh-btn ${refreshing ? 'spinning' : ''}`} title="Refresh data">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
                </svg>
              </button>
              <NotificationBell notifications={data?.notifications ?? []} onOpen={() => setNotifOpen(true)} />
            </div>
            <div className="d-live-chip"><span className="live-dot" />Live</div>
            <span className="d-clock">{time}</span>
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="dash-grid">
          <div className="dash-main">

            {/* Hero Card */}
            <div className="hero-card">
              <p className="bal-eyebrow">Net Asset Value</p>
              <p className="bal-amount">
                <sup>$</sup>{fmt(balance, 0)}
                <span className="cents">.{((balance % 1) * 100).toFixed(0).padStart(2, '0')}</span>
              </p>
              <div className="bal-row">
                <span className={`bal-change ${isProfitable ? 'pos' : 'neg'}`}>
                  {isProfitable ? '+' : ''}{fmt(profit)} ({isProfitable ? '+' : ''}{fmt(changePercent)}%)
                </span>
                <span className="bal-period">All time</span>
              </div>
              <div className="bal-sparkline">
                <Sparkline data={portfolioHistory} positive={isProfitable} width={140} height={30} />
              </div>
              <div className="bal-actions">
                <button className="btn-dep" onClick={openDeposit}>+ Deposit</button>
                <Link href="/dashboard/withdraw" className="btn-ghost">Withdraw</Link>
                <Link href="/dashboard/history" className="btn-ghost">📋 History</Link>
              </div>
            </div>

            {/* Stats */}
            <div className="stat-row">
              <div className="stat-cell">
                <p className="stat-lbl">P &amp; L</p>
                <p className={`stat-val ${isProfitable ? 'pos' : 'neg'}`}>
                  {isProfitable ? '+' : ''}{fmt(profit)}
                </p>
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

            {/* Top Movers */}
            <p className="section-label">
              <span className="section-label-left"><span className="section-label-pip" />Top Movers</span>
              <Link href="/dashboard/markets" className="section-view-all">View all →</Link>
            </p>
            <div className="movers-split">
              <div className="movers-card">
                <p className="movers-card-title gainers">↑ Top Gainers</p>
                {topGainers.length === 0
                  ? <p className="movers-empty">{markets.length === 0 ? 'No data' : 'Markets are down across the board'}</p>
                  : topGainers.map(m => (
                    <div key={m.symbol} className="movers-split-item">
                      <span className="movers-split-sym">{m.symbol}</span>
                      <span className="movers-split-price">${fmt(m.price)}</span>
                      <span className="movers-split-chg up">+{fmt(m.changePercent)}%</span>
                    </div>
                  ))}
              </div>
              <div className="movers-card">
                <p className="movers-card-title losers">↓ Top Losers</p>
                {topLosers.length === 0
                  ? <p className="movers-empty">{markets.length === 0 ? 'No data' : 'Markets are up across the board'}</p>
                  : topLosers.map(m => (
                    <div key={m.symbol} className="movers-split-item">
                      <span className="movers-split-sym">{m.symbol}</span>
                      <span className="movers-split-price">${fmt(m.price)}</span>
                      <span className="movers-split-chg dn">{fmt(m.changePercent)}%</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Quick Trade */}
            <p className="section-label">
              <span className="section-label-left"><span className="section-label-pip" />Quick Trade</span>
              <Link href="/dashboard/markets" className="section-view-all">View all →</Link>
            </p>
            <div className="qt-card">
              {quickTradeAssets.length === 0
                ? <p style={{ fontSize: '0.62rem', color: 'var(--ink-faint)', padding: '14px' }}>No data</p>
                : quickTradeAssets.map(a => (
                  <div key={a.symbol} className="qt-row">
                    <div className="qt-asset">
                      {a.logoUrl
                        ? <img src={a.logoUrl} alt={a.symbol} className="qt-ico-img"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        : <div className="qt-ico">{a.symbol.slice(0, 2)}</div>
                      }
                      <div className="qt-meta">
                        <div className="qt-sym">{a.symbol}</div>
                        <div className="qt-price">
                          <PriceFlash value={a.price} prevValue={prevPrices.current[a.symbol]}>
                            ${fmt(a.price)}
                          </PriceFlash>
                        </div>
                      </div>
                    </div>
                    <span className={`qt-chg ${a.changePercent >= 0 ? 'up' : 'dn'}`}>
                      {a.changePercent >= 0 ? '+' : ''}{fmt(a.changePercent)}%
                    </span>
                    <div className="qt-btns">
                      <button className="btn-buy" onClick={() => handleQuickTrade(a.symbol, 'BUY')}>Buy</button>
                      <button className="btn-sell" onClick={() => handleQuickTrade(a.symbol, 'SELL')}>Sell</button>
                    </div>
                  </div>
                ))}
            </div>

          </div>

          <div className="dash-side">

            {/* Portfolio Allocation (NEW) */}
            <p className="section-label">
              <span className="section-label-left"><span className="section-label-pip" />Allocation</span>
            </p>
            <div className="full-card">
              {allocation.length === 0 ? (
                <p style={{ fontSize: '0.62rem', color: 'var(--ink-faint)', textAlign: 'center', padding: '20px 0' }}>
                  No allocation data available
                </p>
              ) : (
                <AllocationDonut data={allocation} />
              )}
            </div>

            <div className="section-divider" />

            {/* Recent Activity (UPGRADED) */}
            <p className="section-label">
              <span className="section-label-left"><span className="section-label-pip" />Recent Activity</span>
              <Link href="/dashboard/history" className="section-view-all">View all →</Link>
            </p>
            <div className="full-card">
              {activityLogs.length === 0
                ? <p style={{ fontSize: '0.62rem', color: 'var(--ink-faint)' }}>No recent activity</p>
                : activityLogs.slice(0, 5).map(a => (
                  <div key={a.id} className="activity-item">
                    <div className={`activity-icon ${a.type}`}>{activityIcons[a.type] || '•'}</div>
                    <div className="activity-content">
                      <p className="activity-desc">{a.description}</p>
                      <p className="activity-detail">{a.detail}</p>
                      <p className="activity-time">{a.time}</p>
                    </div>
                  </div>
                ))}
            </div>

            <div className="section-divider" />

            {/* News */}
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
                    <button onClick={fetchNews} style={{ marginTop: 12, fontSize: '0.62rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Retry
                    </button>
                  </div>
                ) : (
                  <>
                    {news.map((item, i) => {
                      const [tagBg, tagCol] = tagColors[item.tag] ?? ['var(--surface)', 'var(--ink-dim)'];
                      const isExpanded = expandedNewsIdx === i;
                      return (
                        <div key={i} className="news-entry">
                          <div className="news-item" onClick={() => setExpandedNewsIdx(isExpanded ? null : i)}>
                            <span className="news-tag" style={{ background: tagBg, color: tagCol }}>{item.tag}</span>
                            <div className="news-body">
                              <p className="news-headline">{item.headline}</p>
                              <p className="news-meta">{item.source} · {item.time}</p>
                            </div>
                            <span style={{ color: 'var(--ink-faint)', fontSize: '0.7rem', flexShrink: 0, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', marginTop: 2 }}>▾</span>
                          </div>
                          {isExpanded && (
                            <div className="news-expand">
                              {item.summary
                                ? <p className="news-summary">{item.summary}</p>
                                : <p className="news-summary news-summary-empty">No summary available.</p>
                              }
                              {item.url && (
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="news-readmore">Read full article →</a>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div className="news-pulse">
                      <span className="news-pulse-dot" />
                      <span style={{ fontSize: '0.58rem', color: 'var(--ink-faint)', fontFamily: 'var(--mono)' }}>Live · CryptoCompare &amp; BBC Business</span>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Notification Panel */}
      {notifOpen && (
        <NotificationPanel
          notifications={data?.notifications ?? []}
          onClose={() => setNotifOpen(false)}
          onMarkRead={markNotifRead}
        />
      )}

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
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`method-pill ${method === m.id ? 'active' : 'inactive'}`}
                    >
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
                {activeMethod && (
                  <div className="addr-box">
                    {activeMethod.network && (
                      <p className="addr-network">Network: {activeMethod.network}</p>
                    )}
                    <p className="addr-text">{activeMethod.address}</p>
                    <button
                      onClick={() => copyAddress(activeMethod.address)}
                      className={`copy-btn ${copied ? 'done' : 'idle'}`}
                    >
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
            <Link href="/dashboard/deposit" className="sheet-full-link" onClick={closeSheet}>
              Confirm→
            </Link>
          </div>
        </>
      )}
    </>
  );
}
