'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

type Asset = {
  symbol: string;
  name: string;
  logoUrl: string;
  price: number;
  changePercent: number;
};

function fmt(n: number, d = 2) {
  return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fmtPrice(n: number) {
  if (n >= 1000) return '$' + (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return '$' + fmt(n, 2);
}

function MiniSparkline({ positive }: { positive: boolean }) {
  const pts = positive
    ? '0,18 10,14 20,16 30,8 40,11 50,4 60,6'
    : '0,4 10,8 20,6 30,14 40,11 50,17 60,18';
  return (
    <svg width="60" height="22" viewBox="0 0 60 22" fill="none">
      <polyline points={pts} stroke={positive ? '#4ade80' : '#f87171'}
        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function ChangeBadge({ value }: { value: number }) {
  const pos = value >= 0;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 2,
      padding: '2px 6px',
      borderRadius: 5,
      background: pos ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
      border: `1px solid ${pos ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
      fontFamily: 'var(--mono)',
      fontSize: '0.63rem',
      fontWeight: 600,
      color: pos ? '#4ade80' : '#f87171',
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>
      {pos ? '▲' : '▼'} {pos ? '+' : ''}{fmt(value)}%
    </span>
  );
}

export default function MarketsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'ALL' | 'CRYPTO' | 'STOCKS'>('ALL');
  const [sortKey, setSortKey] = useState<'price' | 'changePercent' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAssets = useCallback(async () => {
    try {
      const res = await fetch('/api/market');
      if (res.ok) {
        setAssets(await res.json());
        setLastUpdated(new Date());
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAssets();
    const id = setInterval(fetchAssets, 30_000);
    return () => clearInterval(id);
  }, [fetchAssets]);

  const CRYPTO_SYMS = ['BTC', 'ETH', 'SOL', 'BNB'];
  const STOCK_SYMS  = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL'];

  const filtered = useMemo(() => {
    let list = [...assets];
    if (tab === 'CRYPTO') list = list.filter(a => CRYPTO_SYMS.includes(a.symbol));
    if (tab === 'STOCKS')  list = list.filter(a => STOCK_SYMS.includes(a.symbol));
    if (search) list = list.filter(a =>
      a.symbol.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase())
    );
    if (sortKey) {
      list.sort((a, b) => sortDir === 'desc'
        ? b[sortKey] - a[sortKey]
        : a[sortKey] - b[sortKey]
      );
    }
    return list;
  }, [assets, tab, search, sortKey, sortDir]);

  const handleSort = (key: 'price' | 'changePercent') => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const handleTrade = (asset: Asset, action: 'BUY' | 'SELL') => {
    const tradeSymbol = CRYPTO_SYMS.includes(asset.symbol)
      ? `${asset.symbol}USD`
      : asset.symbol;
    router.push(`/dashboard/trade?asset=${tradeSymbol}&action=${action}`);
  };

  const gainers = [...assets].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3);
  const losers  = [...assets].sort((a, b) => a.changePercent - b.changePercent).slice(0, 3);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        :root {
          --bg:#000000;--bg-1:#000000;--bg-2:#000000;--bg-3:#234d67;
          --card:#000000;--ink:#f0f8ff;--ink-2:#d6ecf8;--ink-dim:#8dbdd8;
          --ink-faint:#4d7a96;--accent:#38bdf8;
          --green:#4ade80;--green-bg:rgba(74,222,128,0.1);--green-border:rgba(74,222,128,0.2);
          --red:#f87171;--red-bg:rgba(248,113,113,0.1);--red-border:rgba(248,113,113,0.2);
          --sans:'DM Sans',system-ui,sans-serif;
          --mono:'DM Mono','SF Mono',monospace;
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); font-family: var(--sans); }

        .mkt-wrap {
          max-width: 900px;
          padding: 16px 16px 80px;
        }

        /* Header */
        .mkt-header { margin-bottom: 20px; }
        .mkt-title {
          font-size: 1.4rem; font-weight: 700; color: var(--ink);
          letter-spacing: -0.02em; margin-bottom: 4px;
        }
        .mkt-header-row {
          display: flex; align-items: center; justify-content: space-between;
        }
        .mkt-sub {
          font-size: 0.6rem; color: var(--ink-faint);
          font-family: var(--mono); letter-spacing: 0.06em;
          display: flex; align-items: center; gap: 6px;
        }
        .live-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--green); animation: blink 2s ease-in-out infinite;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .last-updated {
          font-family: var(--mono); font-size: 0.55rem;
          color: var(--ink-faint); letter-spacing: 0.04em;
        }

        /* Gainers / Losers strip */
        .mover-strip {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 10px; margin-bottom: 18px;
        }
        .mover-strip-card {
          background: var(--card); border: 1px solid var(--bg-2);
          border-radius: 12px; padding: 14px 16px;
        }
        .strip-label {
          font-size: 0.54rem; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; margin-bottom: 10px;
          display: flex; align-items: center; gap: 5px;
        }
        .strip-label.up { color: var(--green); }
        .strip-label.dn { color: var(--red); }
        .strip-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .strip-row:last-child { border-bottom: none; padding-bottom: 0; }
        .strip-sym {
          font-family: var(--mono); font-size: 0.68rem;
          font-weight: 500; color: var(--ink);
        }
        .strip-price {
          font-family: var(--mono); font-size: 0.6rem; color: var(--ink-faint);
        }
        .strip-chg {
          font-family: var(--mono); font-size: 0.65rem; font-weight: 700;
          padding: 2px 6px; border-radius: 4px;
        }
        .strip-chg.up { color: var(--green); background: var(--green-bg); }
        .strip-chg.dn { color: var(--red); background: var(--red-bg); }

        /* Controls */
        .mkt-controls {
          display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px;
        }
        .controls-row {
          display: flex; gap: 10px; align-items: center;
        }
        .search-box {
          flex: 1; display: flex; align-items: center; gap: 8px;
          background: var(--card); border: 1px solid var(--bg-2);
          border-radius: 10px; padding: 9px 14px;
          transition: border-color 0.15s;
        }
        .search-box:focus-within { border-color: var(--accent); }
        .search-box input {
          background: none; border: none; outline: none;
          font-family: var(--mono); font-size: 0.72rem;
          color: var(--ink); width: 100%;
        }
        .search-box input::placeholder { color: var(--ink-faint); }
        .tab-row { display: flex; gap: 6px; }
        .tab-btn {
          padding: 6px 16px; border-radius: 20px; border: 1px solid var(--bg-2);
          background: none; font-family: var(--mono); font-size: 0.6rem;
          font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--ink-faint); cursor: pointer; transition: all 0.15s;
        }
        .tab-btn.active {
          background: var(--accent); border-color: var(--accent); color: #0a1f2e;
        }
        .tab-btn:hover:not(.active) { color: var(--ink-dim); border-color: var(--bg-3); }

        /* Table */
        .mkt-table-wrap {
          background: var(--card); border: 1px solid var(--bg-2);
          border-radius: 14px; overflow: hidden;
        }
        .mkt-thead {
          display: grid;
          grid-template-columns: 2.2fr 1.4fr 1.6fr 1fr 1.8fr;
          padding: 10px 16px;
          border-bottom: 1px solid var(--bg-2);
          background: var(--bg-1);
        }
        .mkt-th {
          font-size: 0.54rem; font-weight: 700; color: var(--ink-faint);
          text-transform: uppercase; letter-spacing: 0.09em;
          display: flex; align-items: center; gap: 4px; cursor: pointer;
          user-select: none; transition: color 0.1s;
        }
        .mkt-th:hover { color: var(--ink-dim); }
        .mkt-th.sorted { color: var(--accent); }
        .sort-arrow { font-size: 0.5rem; opacity: 0.7; }

        .mkt-row {
          display: grid;
          grid-template-columns: 2.2fr 1.4fr 1.6fr 1fr 1.8fr;
          align-items: center; padding: 13px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          transition: background 0.12s;
        }
        .mkt-row:last-child { border-bottom: none; }
        .mkt-row:hover { background: rgba(56,189,248,0.03); }

        .asset-cell { display: flex; align-items: center; gap: 10px; }
        .asset-logo {
          width: 36px; height: 36px; border-radius: 50%;
          object-fit: cover; flex-shrink: 0; background: var(--bg-2);
        }
        .asset-logo-placeholder {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--bg-2); display: flex; align-items: center;
          justify-content: center; font-size: 0.65rem; font-weight: 700;
          color: var(--ink-dim); flex-shrink: 0;
        }
        .asset-sym { font-family: var(--mono); font-size: 0.75rem; font-weight: 600; color: var(--ink); }
        .asset-name { font-size: 0.58rem; font-weight: 300; color: var(--ink-faint); margin-top: 2px; }

        .price-cell {
          font-family: var(--mono); font-size: 0.72rem; padding-right: 6px;
          font-weight: 600; color: var(--ink);
        }

        /* Buy / Sell buttons */
        .trade-cell { display: flex; gap: 6px; }
        .btn-buy {
          background: var(--green-bg);
          color: var(--green);
          border: 1px solid var(--green-border);
          border-radius: 7px; padding: 6px 14px;
          font-family: var(--sans); font-size: 0.62rem; font-weight: 700;
          cursor: pointer; transition: all 0.15s;
          letter-spacing: 0.03em;
        }
        .btn-buy:hover {
          background: var(--green); color: #0a2e14;
          border-color: var(--green); transform: translateY(-1px);
        }
        .btn-buy:active { transform: scale(0.97); }
        .btn-sell {
          background: var(--red-bg);
          color: var(--red);
          border: 1px solid var(--red-border);
          border-radius: 7px; padding: 6px 14px;
          font-family: var(--sans); font-size: 0.62rem; font-weight: 700;
          cursor: pointer; transition: all 0.15s;
          letter-spacing: 0.03em;
        }
        .btn-sell:hover {
          background: var(--red); color: #2a0505;
          border-color: var(--red); transform: translateY(-1px);
        }
        .btn-sell:active { transform: scale(0.97); }

        /* Empty / Loading */
        .mkt-empty { padding: 48px 24px; text-align: center; }
        .mkt-empty p { font-size: 0.7rem; color: var(--ink-faint); font-weight: 300; }
        .spinner {
          width: 28px; height: 28px;
          border: 2.5px solid var(--bg-2);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin: 0 auto 12px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Mobile */
        @media (max-width: 640px) {
          .mkt-wrap { padding: 16px 14px 80px; }
          .mkt-thead { grid-template-columns: 2fr 1.3fr 1.6fr 1.6fr; }
          .mkt-row   { grid-template-columns: 2fr 1.3fr 1.6fr 1.6fr; }
          .spark-col { display: none; }
        }
      `}</style>

      <div className="mkt-wrap">

        {/* Header */}
        <div className="mkt-header">
          <div className="mkt-header-row">
            <h1 className="mkt-title">Markets</h1>
            {lastUpdated && (
              <span className="last-updated">
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
          <div className="mkt-sub">
            <span className="live-dot" />
            Live prices · Refreshes every 30s
          </div>
        </div>

        {/* Gainers / Losers */}
        {assets.length > 0 && (
          <div className="mover-strip">
            <div className="mover-strip-card">
              <p className="strip-label up">↑ Top Gainers</p>
              {gainers.map(a => (
                <div key={a.symbol} className="strip-row">
                  <span className="strip-sym">{a.symbol}</span>
                  <span className="strip-price">${fmt(a.price)}</span>
                  <span className="strip-chg up">+{fmt(a.changePercent)}%</span>
                </div>
              ))}
            </div>
            <div className="mover-strip-card">
              <p className="strip-label dn">↓ Top Losers</p>
              {losers.map(a => (
                <div key={a.symbol} className="strip-row">
                  <span className="strip-sym">{a.symbol}</span>
                  <span className="strip-price">${fmt(a.price)}</span>
                  <span className="strip-chg dn">{fmt(a.changePercent)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="mkt-controls">
          <div className="controls-row">
            <div className="search-box">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="#4d7a96" strokeWidth="1.2" />
                <path d="M9.5 9.5L12 12" stroke="#4d7a96" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <input
                placeholder="Search assets…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="tab-row">
            {(['ALL', 'CRYPTO', 'STOCKS'] as const).map(t => (
              <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="mkt-table-wrap">
          <div className="mkt-thead">
            <span className="mkt-th">Asset</span>
            <span className={`mkt-th ${sortKey === 'price' ? 'sorted' : ''}`} onClick={() => handleSort('price')}>
              Price <span className="sort-arrow">{sortKey === 'price' ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}</span>
            </span>
            <span className={`mkt-th ${sortKey === 'changePercent' ? 'sorted' : ''}`} onClick={() => handleSort('changePercent')}>
              24h Change <span className="sort-arrow">{sortKey === 'changePercent' ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}</span>
            </span>
            <span className="mkt-th spark-col">Trend</span>
            <span className="mkt-th">Trade</span>
          </div>

          {loading ? (
            <div className="mkt-empty">
              <div className="spinner" />
              <p>Loading markets…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="mkt-empty">
              <p>No assets found{search ? ` for "${search}"` : ''}.</p>
            </div>
          ) : filtered.map(a => (
            <div key={a.symbol} className="mkt-row">
              <div className="asset-cell">
                {a.logoUrl
                  ? <img src={a.logoUrl} alt={a.symbol} className="asset-logo"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  : <div className="asset-logo-placeholder">{a.symbol.slice(0, 2)}</div>
                }
                <div>
                  <div className="asset-sym">{a.symbol}</div>
                  <div className="asset-name">{a.name}</div>
                </div>
              </div>
              <span className="price-cell">{fmtPrice(a.price)}</span>
              <span><ChangeBadge value={a.changePercent} /></span>
              <span className="spark-col">
                <MiniSparkline positive={a.changePercent >= 0} />
              </span>
              <div className="trade-cell">
                <button className="btn-buy" onClick={() => handleTrade(a, 'BUY')}>Buy</button>
                <button className="btn-sell" onClick={() => handleTrade(a, 'SELL')}>Sell</button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
