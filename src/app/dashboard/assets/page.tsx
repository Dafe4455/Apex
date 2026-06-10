'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, RefreshCw, ChevronRight,
  BarChart2, Clock, Layers
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Position = {
  id: string;
  asset: string;
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPnl: number;
  side: string;
  status: string;
  openedAt: string;
  closedAt: string | null;
};

type Trade = {
  id: string;
  asset: string | null;
  action: string | null;  // ← add this
  amount: number;
  status: string;
  createdAt: string;
};

type AssetsData = {
  portfolioBalance: number;
  realisedPnl: number;
  positions: Position[];
  trades: Trade[];
};

// ── Asset meta (icon colours matching dashboard aesthetic) ────────────────────

const ASSET_META: Record<string, { label: string; bg: string; col: string; icon: string; img?: string }> = {
  BTC:    { label: 'Bitcoin',     bg: '#f7931a22', col: '#f7931a', icon: '₿', img: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
  ETH:    { label: 'Ethereum',    bg: '#627eea22', col: '#627eea', icon: 'Ξ', img: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  SOL:    { label: 'Solana',      bg: '#9945ff22', col: '#9945ff', icon: '◎', img: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
  BNB:    { label: 'BNB',         bg: '#f3ba2f22', col: '#f3ba2f', icon: 'B', img: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
  AAPL:   { label: 'Apple',       bg: '#aaaaaa22', col: '#aaaaaa', icon: '', img: 'https://logo.clearbit.com/apple.com' },
  TSLA:   { label: 'Tesla',       bg: '#e3193722', col: '#e31937', icon: 'T', img: 'https://logo.clearbit.com/tesla.com' },
  NVDA:   { label: 'NVIDIA',      bg: '#76b90022', col: '#76b900', icon: 'N', img: 'https://logo.clearbit.com/nvidia.com' },
  MSFT:   { label: 'Microsoft',   bg: '#00a4ef22', col: '#00a4ef', icon: 'M', img: 'https://logo.clearbit.com/microsoft.com' },
  AMZN:   { label: 'Amazon',      bg: '#ff990022', col: '#ff9900', icon: 'A', img: 'https://logo.clearbit.com/amazon.com' },
  GOOGL:  { label: 'Alphabet',    bg: '#4285f422', col: '#4285f4', icon: 'G', img: 'https://logo.clearbit.com/google.com' },
  USOIL:  { label: 'WTI Crude',   bg: '#64748b22', col: '#94a3b8', icon: '⬡' },
  UKOIL:  { label: 'Brent Crude', bg: '#64748b22', col: '#94a3b8', icon: '⬡' },
  XAUUSD: { label: 'Gold',        bg: '#eab30822', col: '#eab308', icon: '◈' },
  EURUSD: { label: 'EUR/USD',     bg: '#00c9b122', col: '#00c9b1', icon: '€' },
  GBPUSD: { label: 'GBP/USD',     bg: '#00c9b122', col: '#00c9b1', icon: '£' },
  USDJPY: { label: 'USD/JPY',     bg: '#00c9b122', col: '#00c9b1', icon: '¥' },
};

const PRICE_SYMBOL_MAP: Record<string, string> = {
  USOIL: 'USOIL', UKOIL: 'UKOIL', XAUUSD: 'XAUUSD',
  EURUSD: 'EURUSD', GBPUSD: 'GBPUSD', USDJPY: 'USDJPY',
};

function getMeta(symbol: string) {
  return ASSET_META[symbol] ?? { label: symbol, bg: '#ffffff11', col: '#94a3b8', icon: '?' };
}

function fmtUsd(n: number, decimals = 2) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AssetsPage() {
  const [data, setData] = useState<AssetsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<'open' | 'closed' | 'history'>('open');

  // ── fetch portfolio data ──────────────────────────────────────────────────

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/assets');
      if (!res.ok) throw new Error();
      const json: AssetsData = await res.json();
      setData(json);
      fetchLivePrices(json.positions);
    } catch {
      // silent — keep stale data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── live prices for open positions ────────────────────────────────────────

  const fetchLivePrices = async (positions: Position[]) => {
    const openSymbols = Array.from(new Set(
      positions
        .filter(p => p.status === 'OPEN')
        .map(p => p.symbol)
    ));

    for (const sym of openSymbols) {
      const apiSym = PRICE_SYMBOL_MAP[sym] ?? sym.replace('USD', '');
      try {
        const res = await fetch(`/api/price?symbol=${apiSym}`);
        const d = await res.json();
        if (d.price) setLivePrices(prev => ({ ...prev, [sym]: d.price }));
      } catch {}
    }
  };

  // ── derived data ──────────────────────────────────────────────────────────

  const openPositions  = useMemo(() => data?.positions.filter(p => p.status === 'OPEN')  ?? [], [data]);
  const closedPositions = useMemo(() => data?.positions.filter(p => p.status === 'CLOSED') ?? [], [data]);

  // live unrealised P&L: (currentPrice - entryPrice) * qty  (LONG)
  const unrealisedPnl = useMemo(() =>
    openPositions.reduce((sum, p) => {
      const current = livePrices[p.symbol] ?? 0;
      if (!current) return sum + p.currentPnl; // fall back to stored
      const dir = p.side === 'SHORT' ? -1 : 1;
      return sum + dir * (current - p.entryPrice) * p.quantity;
    }, 0),
  [openPositions, livePrices]);

  // group closed positions by asset for summary
  const closedByAsset = useMemo(() => {
    const map: Record<string, { pnl: number; count: number }> = {};
    closedPositions.forEach(p => {
      if (!map[p.symbol]) map[p.symbol] = { pnl: 0, count: 0 };
      map[p.symbol].pnl   += p.currentPnl;
      map[p.symbol].count += 1;
    });
    return map;
  }, [closedPositions]);

  // ── render helpers ────────────────────────────────────────────────────────

  const PnlChip = ({ value }: { value: number }) => (
    <span style={{
      color: value >= 0 ? 'var(--green)' : 'var(--red)',
      background: value >= 0 ? 'rgba(34,212,122,0.08)' : 'rgba(248,113,113,0.08)',
      border: `1px solid ${value >= 0 ? 'rgba(34,212,122,0.2)' : 'rgba(248,113,113,0.2)'}`,
      borderRadius: 6,
      padding: '2px 8px',
      fontFamily: 'var(--mono)',
      fontSize: '0.68rem',
      fontWeight: 700,
    }}>
      {value >= 0 ? '+' : ''}{fmtUsd(value)}
    </span>
  );

  // ── empty state ───────────────────────────────────────────────────────────

  const EmptyState = ({ message, cta }: { message: string; cta?: boolean }) => (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 12, padding: '48px 24px', color: 'var(--text-dim)',
    }}>
      <BarChart2 size={32} strokeWidth={1.2} />
      <p style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', letterSpacing: '0.06em', textAlign: 'center' }}>
        {message}
      </p>
      {cta && (
        <Link href="/dashboard/trade" style={{
          background: 'var(--cyan)', color: 'var(--bg)',
          borderRadius: 8, padding: '9px 20px',
          fontFamily: 'var(--mono)', fontSize: '0.7rem',
          fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(0,201,177,0.2)',
        }}>
          Start Trading
        </Link>
      )}
    </div>
  );

  // ── skeleton ──────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={{ ...styles.skeletonBox, width: 140, height: 20 }} />
          <div style={{ ...styles.skeletonBox, width: 80, height: 13, marginTop: 6 }} />
        </div>
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ ...styles.card, height: 72, ...styles.skeletonBox }} />
      ))}
    </div>
  );

  // ── page ──────────────────────────────────────────────────────────────────

  const totalPnl = (data?.realisedPnl ?? 0) + unrealisedPnl;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:       #0b1623;
          --bg-card:  #0f1e2e;
          --bg-inner: #0d1a28;
          --border:   rgba(255,255,255,0.07);
          --cyan:     #00c9b1;
          --cyan-dim: rgba(0,201,177,0.12);
          --text:     #e2eaf4;
          --text-mid: #7b9ab5;
          --text-dim: #4a6a84;
          --green:    #22d47a;
          --red:      #f87171;
          --mono:     'Space Mono', monospace;
          --sans:     'Space Grotesk', sans-serif;
        }
        body { background: var(--bg); font-family: var(--sans); color: var(--text); }

        .tab-btn {
          background: none; border: none; cursor: pointer;
          font-family: var(--mono); font-size: 0.65rem; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--text-dim); padding: 8px 14px; border-radius: 8px;
          transition: all 0.15s; white-space: nowrap;
        }
        .tab-btn:hover { color: var(--text-mid); }
        .tab-btn.active {
          background: var(--cyan-dim);
          color: var(--cyan);
          border: 1px solid rgba(0,201,177,0.2);
        }

        .pos-row {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 16px; border-bottom: 1px solid var(--border);
          transition: background 0.15s; cursor: default;
        }
        .pos-row:last-child { border-bottom: none; }
        .pos-row:hover { background: rgba(255,255,255,0.02); }

        .trade-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-bottom: 1px solid var(--border);
          transition: background 0.15s;
        }
        .trade-row:last-child { border-bottom: none; }
        .trade-row:hover { background: rgba(255,255,255,0.02); }

        .skeleton-pulse {
          background: linear-gradient(90deg, #0f1e2e 25%, #162030 50%, #0f1e2e 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 6px;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }

        @media (max-width: 480px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>

      <div style={styles.page}>

        {/* ── HEADER ── */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.pageTitle}>My Assets</h1>
            <p style={styles.pageSub}>
              {openPositions.length} open · {closedPositions.length} closed · {data?.trades.length ?? 0} trades
            </p>
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 8, padding: '8px 10px', cursor: 'pointer',
              color: refreshing ? 'var(--cyan)' : 'var(--text-dim)',
              transition: 'all 0.2s',
            }}
          >
            <RefreshCw size={15} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* ── SUMMARY CARDS ── */}
        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>Portfolio Balance</span>
            <span style={styles.summaryValue}>{fmtUsd(data?.portfolioBalance ?? 0)}</span>
          </div>
          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>Unrealised P&L</span>
            <span style={{
              ...styles.summaryValue,
              color: unrealisedPnl >= 0 ? 'var(--green)' : 'var(--red)',
            }}>
              {unrealisedPnl >= 0 ? '+' : ''}{fmtUsd(unrealisedPnl)}
            </span>
          </div>
          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>Realised P&L</span>
            <span style={{
              ...styles.summaryValue,
              color: (data?.realisedPnl ?? 0) >= 0 ? 'var(--green)' : 'var(--red)',
            }}>
              {(data?.realisedPnl ?? 0) >= 0 ? '+' : ''}{fmtUsd(data?.realisedPnl ?? 0)}
            </span>
          </div>
        </div>

        {/* ── TOTAL P&L BANNER ── */}
        <div style={{
          ...styles.card,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px',
          borderLeft: `3px solid ${totalPnl >= 0 ? 'var(--green)' : 'var(--red)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {totalPnl >= 0
              ? <TrendingUp size={18} color="var(--green)" />
              : <TrendingDown size={18} color="var(--red)" />
            }
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', color: 'var(--text-mid)', letterSpacing: '0.1em' }}>
              TOTAL P&L (REALISED + UNREALISED)
            </span>
          </div>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: '1rem', fontWeight: 700,
            color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)',
          }}>
            {totalPnl >= 0 ? '+' : ''}{fmtUsd(totalPnl)}
          </span>
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
          {([
            { key: 'open',    label: 'Open',    icon: <Layers size={12} /> },
            { key: 'closed',  label: 'Closed',  icon: <BarChart2 size={12} /> },
            { key: 'history', label: 'History', icon: <Clock size={12} /> },
          ] as const).map(t => (
            <button
              key={t.key}
              className={`tab-btn${tab === t.key ? ' active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {t.icon} {t.label}
                {t.key === 'open' && openPositions.length > 0 && (
                  <span style={{
                    background: 'var(--cyan)', color: 'var(--bg)',
                    borderRadius: 999, padding: '1px 6px',
                    fontSize: '0.55rem', fontWeight: 700,
                  }}>{openPositions.length}</span>
                )}
              </span>
            </button>
          ))}
        </div>

        {/* ── OPEN POSITIONS ── */}
        {tab === 'open' && (
          <div style={styles.card}>
            {openPositions.length === 0
              ? <EmptyState message="No open positions. Place a trade to get started." cta />
              : openPositions.map(pos => {
                  const meta      = getMeta(pos.symbol);
                  const current   = livePrices[pos.symbol] ?? 0;
                  const dir       = pos.side === 'SHORT' ? -1 : 1;
                  const livePnl   = current
                    ? dir * (current - pos.entryPrice) * pos.quantity
                    : pos.currentPnl;
                  const pnlPct    = pos.entryPrice > 0
                    ? (livePnl / (pos.entryPrice * pos.quantity)) * 100
                    : 0;

                  return (
                    <div className="pos-row" key={pos.id}>
                      {/* Icon */}
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                        background: meta.bg, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '1rem', color: meta.col,
                        fontWeight: 700,
                      }}>
                        {meta.icon}
                      </div>

                      {/* Name + side */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{pos.symbol}</span>
                          <span style={{
                            fontFamily: 'var(--mono)', fontSize: '0.58rem', fontWeight: 700,
                            padding: '1px 6px', borderRadius: 4,
                            background: pos.side === 'LONG' ? 'rgba(34,212,122,0.1)' : 'rgba(248,113,113,0.1)',
                            color: pos.side === 'LONG' ? 'var(--green)' : 'var(--red)',
                            border: `1px solid ${pos.side === 'LONG' ? 'rgba(34,212,122,0.2)' : 'rgba(248,113,113,0.2)'}`,
                          }}>
                            {pos.side}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--text-dim)' }}>
                            Qty: {pos.quantity}
                          </span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--text-dim)' }}>
                            Entry: {fmtUsd(pos.entryPrice)}
                          </span>
                          {current > 0 && (
                            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--text-mid)' }}>
                              Now: {fmtUsd(current)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* P&L */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                        <PnlChip value={livePnl} />
                        <span style={{
                          fontFamily: 'var(--mono)', fontSize: '0.6rem',
                          color: pnlPct >= 0 ? 'var(--green)' : 'var(--red)',
                        }}>
                          {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                        </span>
                      </div>

                      <Link href={`dashboard/trade?asset=${pos.symbol}`} style={{ color: 'var(--text-dim)', flexShrink: 0 }}>
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  );
                })
            }
          </div>
        )}

        {/* ── CLOSED POSITIONS ── */}
        {tab === 'closed' && (
          <div style={styles.card}>
            {closedPositions.length === 0
              ? <EmptyState message="No closed positions yet." />
              : closedPositions.map(pos => {
                  const meta = getMeta(pos.symbol);
                  return (
                    <div className="pos-row" key={pos.id}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                        background: meta.bg, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '1rem', color: meta.col,
                        fontWeight: 700,
                      }}>
                        {meta.icon}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{pos.symbol}</span>
                          <span style={{
                            fontFamily: 'var(--mono)', fontSize: '0.58rem', fontWeight: 700,
                            padding: '1px 6px', borderRadius: 4,
                            background: 'rgba(255,255,255,0.05)', color: 'var(--text-dim)',
                            border: '1px solid rgba(255,255,255,0.08)',
                          }}>
                            {pos.side}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--text-dim)' }}>
                            Entry: {fmtUsd(pos.entryPrice)}
                          </span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--text-dim)' }}>
                            Closed: {fmtDate(pos.closedAt ?? pos.openedAt)}
                          </span>
                        </div>
                      </div>

                      <PnlChip value={pos.currentPnl} />
                    </div>
                  );
                })
            }
          </div>
        )}

        {/* ── TRADE HISTORY ── */}
        {tab === 'history' && (
          <div style={styles.card}>
            {/* header row */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '10px 16px', borderBottom: '1px solid var(--border)',
            }}>
              {['Asset', 'Amount', 'Status', 'Date'].map(h => (
                <span key={h} style={{
                  fontFamily: 'var(--mono)', fontSize: '0.58rem',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'var(--text-dim)', flex: h === 'Asset' ? 1.5 : 1,
                }}>
                  {h}
                </span>
              ))}
            </div>

            {data?.trades.length === 0
              ? <EmptyState message="No trade history yet." cta />
              : data?.trades.map(t => {
                  const sym = t.asset ?? t.action?.split(':')[1] ?? '—';
                  const meta = getMeta(sym);
                  const ok   = t.status === 'COMPLETED';
                  return (
                    <div className="trade-row" key={t.id}>
                      {/* asset */}
                      <div style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                          background: meta.bg, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '0.75rem', color: meta.col,
                          fontWeight: 700,
                        }}>
                          {meta.icon}
                        </div>
                        <div>
                          <p style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', fontWeight: 700 }}>{sym}</p>
                          <p style={{ fontFamily: 'var(--mono)', fontSize: '0.58rem', color: 'var(--text-dim)' }}>
                            {fmtTime(t.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* amount */}
                      <div style={{ flex: 1 }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem' }}>
                          {fmtUsd(t.amount)}
                        </span>
                      </div>

                      {/* status */}
                      <div style={{ flex: 1 }}>
                        <span style={{
                          fontFamily: 'var(--mono)', fontSize: '0.58rem', fontWeight: 700,
                          padding: '2px 7px', borderRadius: 4,
                          background: ok ? 'rgba(34,212,122,0.08)' : 'rgba(248,113,113,0.08)',
                          color: ok ? 'var(--green)' : 'var(--red)',
                          border: `1px solid ${ok ? 'rgba(34,212,122,0.2)' : 'rgba(248,113,113,0.2)'}`,
                        }}>
                          {t.status}
                        </span>
                      </div>

                      {/* date */}
                      <div style={{ flex: 1 }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--text-mid)' }}>
                          {fmtDate(t.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        )}

        {/* bottom padding for nav */}
        <div style={{ height: 80 }} />
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    maxWidth: 600,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerLeft: { display: 'flex', flexDirection: 'column', gap: 2 },
  pageTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '1.45rem',
    fontWeight: 700,
    color: 'var(--text)',
  },
  pageSub: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '0.62rem',
    color: 'var(--text-dim)',
    letterSpacing: '0.08em',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
  },
  summaryCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  summaryLabel: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '0.55rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: 'var(--text-dim)',
  },
  summaryValue: {
    fontFamily: "'Space Mono', monospace",
    fontSize: '0.82rem',
    fontWeight: 700,
    color: 'var(--text)',
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  skeletonBox: {
    background: 'linear-gradient(90deg, #0f1e2e 25%, #162030 50%, #0f1e2e 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
    borderRadius: 10,
  },
};
