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

const CRYPTO_SYMBOLS_MAP: Record<string, string> = {
  BTC: 'BTCUSDT', ETH: 'ETHUSDT', SOL: 'SOLUSDT', BNB: 'BNBUSDT',
};

function fmt(n: number, d = 2) {
  return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
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

export default function MarketsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'ALL' | 'CRYPTO' | 'STOCKS'>('ALL');
  const [sortKey, setSortKey] = useState<'price' | 'changePercent' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchAssets = useCallback(async () => {
    try {
      const res = await fetch('/api/market');
      if (res.ok) setAssets(await res.json());
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
          --bg:#112838;--bg-1:#0e2132;--bg-2:#1a3a50;--bg-3:#245068;
          --card:#172f42;--ink:#e8f4fd;--ink-2:#c8dfed;--ink-dim:#7aaec8;
          --ink-faint:#4d7a96;--accent:#38bdf8;
          --green:#4ade80;--green-d:#0d3320;
          --red:#f87171;--red-d:#2a0d0d;
          --sans:'DM Sans',system-ui,sans-serif;
          --mono:'DM Mono','SF Mono',monospace;
        }
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:var(--bg);font-family:var(--sans);}

        .mkt-wrap { max-width: 900px; padding-bottom: 40px; }

        /* Page title */
        .mkt-title {
          font-size: 1.4rem; font-weight: 700; color: var(--ink);
          letter-spacing: -0.02em; margin-bottom: 2px;
        }
        .mkt-sub {
          font-size: 0.65rem; color: var(--ink-faint);
          font-family: var(--mono); letter-spacing: 0.06em;
        }

        /* Gainers / Losers strip */
        .mover-strip {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 10px; margin-bottom: 16px;
        }
        .mover-strip-card {
          background: var(--card); border: 1px solid var(--bg-2);
          border-radius: 12px; padding: 12px 14px;
        }
        .strip-label {
          font-size: 0.55rem; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; margin-bottom: 8px;
        }
        .strip-label.up { color: var(--green); }
        .strip-label.dn { color: var(--red); }
        .strip-row {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 5px;
        }
        .strip-row:last-child { margin-bottom: 0; }
        .strip-sym {
          font-family: var(--mono); font-size: 0.68rem;
          font-weight: 500; color: var(--ink);
        }
        .strip-chg {
          font-family: var(--mono); font-size: 0.65rem; font-weight: 600;
        }
        .strip-chg.up { color: var(--green); }
        .strip-chg.dn { color: var(--red); }

        /* Controls */
        .mkt-controls {
          display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px;
        }
        .search-box {
          display: flex; align-items: center; gap: 8px;
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
          background: var(--accent); border-color: var(--accent);
          color: #0a1f2e;
        }
        .tab-btn:hover:not(.active) { color: var(--ink-dim); border-color: var(--bg-3); }

        /* Table */
        .mkt-table-wrap {
          background: var(--card); border: 1px solid var(--bg-2);
          border-radius: 14px; overflow: hidden;
        }
        .mkt-thead {
          display: grid;
          grid-template-columns: 2.2fr 1.2fr 1.4fr 1fr 1.2fr 1.5fr;
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
          grid-template-columns: 2.2fr 1.2fr 1.4fr 1fr 1.2fr 1.5fr;
          align-items: center; padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          transition: background 0.12s;
        }
        .mkt-row:last-child { border-bottom: none; }
        .mkt-row:hover { background: rgba(56,189,248,0.03); }

        .asset-cell { display: flex; align-items: center; gap: 10px; }
        .asset-logo {
          width: 34px; height: 34px; border-radius: 50%;
          object-fit: cover; flex-shrink: 0;
          background: var(--bg-2);
        }
        .asset-logo-placeholder {
          width: 34px; height: 34px; border-radius: 50%;
          background: var(--bg-2); display: flex; align-items: center;
          justify-content: center; font-size: 0.65rem; font-weight: 700;
          color: var(--ink-dim); flex-shrink: 0;
        }
        .asset-sym { font-family: var(--mono); font-size: 0.75rem; font-weight: 600; color: var(--ink); }
        .asset-name { font-size: 0.58rem; font-weight: 300; color: var(--ink-faint); margin-top: 1px; }

        .price-cell { font-family: var(--mono); font-size: 0.72rem; font-weight: 500; color: var(--ink); }
        .chg-cell { font-family: var(--mono); font-size: 0.68rem; font-weight: 600; }
        .chg-cell.up { color: var(--green); }
        .chg-cell.dn { color: var(--red); }
        .spark-cell {}

        .trade-cell { display: flex; gap: 5px; }
        .btn-buy {
          background: var(--accent); color: #0a1f2e; border: none;
          border-radius: 7px; padding: 6px 12px;
          font-family: var(--sans); font-size: 0.62rem; font-weight: 700;
          cursor: pointer; transition: opacity 0.12s, transform 0.1s;
        }
        .btn-buy:hover { opacity: 0.85; transform: translateY(-1px); }
        .btn-buy:active { transform: scale(0.97); }
        .btn-sell {
          background: transparent; color: var(--ink-2);
          border: 1px solid var(--bg-3); border-radius: 7px;
          padding: 6px 12px; font-family: var(--sans);
          font-size: 0.62rem; font-weight: 600; cursor: pointer;
          transition: background 0.12s, transform 0.1s;
        }
        .btn-sell:hover { background: var(--red-d); color: var(--red); border-color: var(--red); transform: translateY(-1px); }
        .btn-sell:active { transform: scale(0.97); }

        /* Empty / Loading */
        .mkt-empty {
          padding: 48px 24px; text-align: center;
        }
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

        /* Mobile adjustments */
        @media (max-width: 640px) {
          .mkt-thead { grid-template-columns: 2fr 1.2fr 1fr 1.4fr; }
          .mkt-row   { grid-template-columns: 2fr 1.2fr 1fr 1.4fr; }
          .spark-col { display: none; }
          .vol-col   { display: none; }
        }
      `}</style>

      <div className="mkt-wrap">

        {/* Title */}
        <div style={{ marginBottom: 16 }}>
          <h1 className="mkt-title">Markets</h1>
          <p className="mkt-sub">Live prices · Updates every 30s</p>
        </div>

        {/* Gainers / Losers */}
        {assets.length > 0 && (
          <div className="mover-strip">
            <div className="mover-strip-card">
              <p className="strip-label up">↑ Top Gainers</p>
              {gainers.map(a => (
                <div key={a.symbol} className="strip-row">
                  <span className="strip-sym">{a.symbol}</span>
                  <span className="strip-chg up">+{fmt(a.changePercent)}%</span>
                </div>
              ))}
            </div>
            <div className="mover-strip-card">
              <p className="strip-label dn">↓ Top Losers</p>
              {losers.map(a => (
                <div key={a.symbol} className="strip-row">
                  <span className="strip-sym">{a.symbol}</span>
                  <span className="strip-chg dn">{fmt(a.changePercent)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="mkt-controls">
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
            <span className="mkt-th">Ticker</span>
            <span className={`mkt-th ${sortKey === 'price' ? 'sorted' : ''}`} onClick={() => handleSort('price')}>
              Price <span className="sort-arrow">{sortKey === 'price' ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}</span>
            </span>
            <span className={`mkt-th ${sortKey === 'changePercent' ? 'sorted' : ''}`} onClick={() => handleSort('changePercent')}>
              24h <span className="sort-arrow">{sortKey === 'changePercent' ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}</span>
            </span>
            <span className="mkt-th spark-col">Trend</span>
            <span className="mkt-th">Quick Trade</span>
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
                  ? <img src={a.logoUrl} alt={a.symbol} className="asset-logo" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  : <div className="asset-logo-placeholder">{a.symbol.slice(0, 2)}</div>
                }
                <div>
                  <div className="asset-sym">{a.symbol}</div>
                  <div className="asset-name">{a.name}</div>
                </div>
              </div>
              <span className="asset-sym" style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--ink-dim)' }}>
                {a.symbol}
              </span>
              <span className="price-cell">${fmt(a.price)}</span>
              <span className={`chg-cell ${a.changePercent >= 0 ? 'up' : 'dn'}`}>
                {a.changePercent >= 0 ? '+' : ''}{fmt(a.changePercent)}%
              </span>
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
