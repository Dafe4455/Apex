'use client';

import { useState, useEffect, useMemo } from 'react';

/* ─── Data Generation & Fallbacks ───────────────────────────────── */
function makeCandles(n = 58) {
  let price = 67000;
  return Array.from({ length: n }, () => {
    const drift = (Math.random() - 0.47) * 700;
    const open = price;
    const close = price + drift;
    const high = Math.max(open, close) + Math.random() * 260;
    const low  = Math.min(open, close) - Math.random() * 210;
    price = close;
    return { open, close, high, low };
  });
}

const TICKERS = [
  { sym: 'BTC/USD', price: '67,420', chg: '+2.38%', up: true  },
  { sym: 'ETH/USD', price: '3,512',  chg: '+3.01%', up: true  },
  { sym: 'AAPL',    price: '189.42', chg: '+1.24%', up: true  },
  { sym: 'TSLA',    price: '248.10', chg: '−0.87%', up: false },
  { sym: 'EUR/USD', price: '1.0842', chg: '+0.12%', up: true  },
  { sym: 'NVDA',    price: '875.40', chg: '+4.62%', up: true  },
  { sym: 'GOLD',    price: '2,318',  chg: '−0.23%', up: false },
  { sym: 'S&P 500', price: '5,241',  chg: '+0.56%', up: true  },
];

const MARKETS = [
  { sym: 'BTC',     name: 'Bitcoin',       price: '67,420',   chg: '+2.38%', up: true  },
  { sym: 'ETH',     name: 'Ethereum',      price: '3,512',    chg: '+3.01%', up: true  },
  { sym: 'NVDA',    name: 'NVIDIA Corp',   price: '875.40',   chg: '+4.62%', up: true  },
  { sym: 'GOLD',    name: 'Gold Spot',     price: '2,318.50', chg: '−0.23%', up: false },
  { sym: 'EUR/USD', name: 'Euro / Dollar', price: '1.0842',   chg: '+0.12%', up: true  },
  { sym: 'TSLA',    name: 'Tesla Inc',     price: '248.10',   chg: '−0.87%', up: false },
];

const FEATURES = [
  { n: '01', title: 'Smart Order Routing',        desc: 'Real-time splitting across liquidity pools minimises slippage and maximises fill rates on every trade.' },
  { n: '02', title: 'Multi-Asset Dashboard',      desc: 'Equities, crypto, FX, and commodities — one unified workspace, live updates, zero context-switching.' },
  { n: '03', title: 'Real-time Risk Engine',      desc: 'Automatic margin alerts and drawdown controls so you stay in the game longer, with less friction.' },
  { n: '04', title: 'Institutional-grade API',    desc: 'REST + WebSocket access for algorithmic traders. Co-location options with sub-millisecond data feeds.' },
];

/* ─── Candlestick Chart Component ───────────────────────────────── */
function CandleChart({ candles }: { candles: { open: number; close: number; high: number; low: number }[] }) {
  const W = 1100, H = 200;
  const stride = Math.floor(W / candles.length);
  const bw = Math.max(stride - 4, 4);
  const minP = Math.min(...candles.map(c => c.low));
  const maxP = Math.max(...candles.map(c => c.high));
  const range = maxP - minP || 1;
  const pad = { t: 12, b: 10 };
  const toY = (p: number) => pad.t + ((maxP - p) / range) * (H - pad.t - pad.b);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="none">
      <defs>
        <linearGradient id="cfh" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%"   stopColor="#070B14" stopOpacity="1"/>
          <stop offset="12%"  stopColor="#070B14" stopOpacity="0"/>
          <stop offset="88%"  stopColor="#070B14" stopOpacity="0"/>
          <stop offset="100%" stopColor="#070B14" stopOpacity="1"/>
        </linearGradient>
        <linearGradient id="cfv" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor="#070B14" stopOpacity="0.85"/>
          <stop offset="55%" stopColor="#070B14" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {candles.map((c, i) => {
        const cx  = i * stride + stride / 2;
        const up  = c.close >= c.open;
        const col = up ? '#00D68A' : '#FF5252';
        const bodyT = toY(Math.max(c.open, c.close));
        const bodyB = toY(Math.min(c.open, c.close));
        const bodyH = Math.max(bodyB - bodyT, 1);
        return (
          <g key={i} opacity="0.82">
            <line x1={cx} y1={toY(c.high)} x2={cx} y2={toY(c.low)} stroke={col} strokeWidth="1"/>
            <rect x={i * stride + (stride - bw) / 2} y={bodyT} width={bw} height={bodyH} fill={col}/>
          </g>
        );
      })}
      <rect x="0" y="0" width={W} height={H} fill="url(#cfh)"/>
      <rect x="0" y="0" width={W} height={H} fill="url(#cfv)"/>
    </svg>
  );
}

/* ─── Helper Formatting Utilities ───────────────────────────────── */
const CRYPTO_SET = new Set(['BTC', 'ETH', 'SOL', 'BNB']);

function fmtPrice(price: number) {
  const decimals = price < 1 ? 4 : 2;
  return price.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtChange(pct: number) {
  return `${pct >= 0 ? '+' : '−'}${Math.abs(pct).toFixed(2)}%`;
}

function displaySym(sym: string) {
  return CRYPTO_SET.has(sym) ? `${sym}/USD` : sym;
}

async function fetchAssets() {
  const res = await fetch('/api/market', { cache: 'no-store' });
  if (!res.ok) throw new Error('market fetch failed');
  return res.json();
}

function buildBook(mid: number) {
  const unit = Math.max(mid * 0.00003, 0.01);
  const level = () => ({ size: (0.25 + Math.random() * 1.1).toFixed(3), pct: Math.round(14 + Math.random() * 38) });
  const asks = Array.from({ length: 5 }, (_, i) => ({ price: fmtPrice(mid + unit * (5 - i)), ...level() }));
  const bids = Array.from({ length: 5 }, (_, i) => ({ price: fmtPrice(mid - unit * (i + 1)), ...level() }));
  return { asks, bids, spread: (unit * 2).toFixed(2), mid: fmtPrice(mid) };
}

/* ─── Main Landing Page Component ────────────────────────────────── */
export default function HomePage() {
  const [candles] = useState(makeCandles);
  const [assets, setAssets] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await fetchAssets();
        if (active && Array.isArray(data) && data.length) setAssets(data);
      } catch {
        // Keeps fallback UI data safely intact
      }
    }
    load();
    const id = setInterval(load, 30000);
    return () => { active = false; clearInterval(id); };
  }, []);

  const live = assets.length > 0;

  const tickerData = live
    ? assets.map(a => ({ sym: displaySym(a.symbol), price: fmtPrice(a.price), chg: fmtChange(a.changePercent), up: a.changePercent >= 0, logo: a.logoUrl }))
    : TICKERS.map(t => ({ ...t, logo: undefined }));
  const allTickers = [...tickerData, ...tickerData, ...tickerData];

  const marketRows = live
    ? assets.map(a => ({ sym: a.symbol, name: a.name, price: fmtPrice(a.price), chg: fmtChange(a.changePercent), up: a.changePercent >= 0, logo: a.logoUrl }))
    : MARKETS.map(m => ({ ...m, logo: undefined }));

  const btc = assets.find(a => a.symbol === 'BTC');
  const midPrice = btc ? btc.price : 67420.50;
  const midChange = btc ? btc.changePercent : 2.38;
  const book = useMemo(() => buildBook(midPrice), [midPrice]);

  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('apv'); io.unobserve(e.target); }
      }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.aprx').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ap-root">

        {/* ── NAV ── */}
        <nav className="ap-nav">
          <div className="ap-nav-beam"/>
          <a href="/" className="ap-logo">Apex<span>·</span>Markets</a>
          <div className="ap-ticker-wrap">
            <div className="ap-ticker-track">
              {allTickers.map((t, i) => (
                <span key={i} className="ap-ticker-item">
                  {t.logo && (
                    <img
                      src={t.logo}
                      alt=""
                      className="ap-tlogo"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <span className="ap-tsym">{t.sym}</span>
                  <span className="ap-tprice">{t.price}</span>
                  <span className={t.up ? 'ap-up' : 'ap-dn'}>{t.chg}</span>
                </span>
              ))}
            </div>
          </div>
          <ul className="ap-nav-links">
            <li><a href="#platform">Platform</a></li>
            <li><a href="#markets">Markets</a></li>
            <li><a href="#begin">Trust</a></li>
          </ul>
          <div className="ap-nav-auth">
            <a href="/login" className="ap-nav-login">Log In</a>
            <a href="/signup" className="ap-nav-cta">Sign Up</a>
          </div>
        </nav>

        {/* ── HERO SECTION ── */}
        <section className="ap-hero">
          <div className="ap-hero-grid"/>
          <div className="ap-hero-chart">
            <CandleChart candles={candles}/>
          </div>
          <div className="ap-hero-inner">
            <div className="ap-hero-left">
              <p className="ap-eyebrow">Since 2019 · FCA &amp; CySEC Regulated</p>
              <h1 className="ap-h1">
                YOUR CAPITAL<br/>
                <em>YOUR CALL</em><br/>
                AT ALL TIMES
              </h1>
              <p className="ap-hero-sub ap-text-base">
                Trade equities, crypto, FX, and derivatives from a single platform. Regulated, transparent, and made to handle whatever the market throws at you.
              </p>
              <div className="ap-hero-ctas">
                <a href="/signup" className="ap-btn-primary">Start Trading →</a>
                <a href="/login" className="ap-btn-ghost">Log In</a>
              </div>
            </div>

            <div className="ap-hero-right">
              <div className="ap-book">
                <div className="ap-book-head">
                  <div>
                    <div className="ap-book-pair"><span className="ap-live-dot"/>BTC / USD</div>
                    <div className="ap-book-px">{book.mid}</div>
                    <div className={`ap-book-chg ${midChange >= 0 ? 'ap-up' : 'ap-dn'}`}>
                      {midChange >= 0 ? '▲' : '▼'} {fmtChange(midChange)} today
                    </div>
                  </div>
                  <div className="ap-book-meta">
                    <div className="ap-meta-item"><span className="ap-ml">Spread</span><span className="ap-mv">{book.spread}</span></div>
                  </div>
                </div>
                <div className="ap-book-cols">
                  <span>PRICE</span><span className="ap-tc">DEPTH</span><span className="ap-tr">SIZE</span>
                </div>
                {book.asks.map((r, i) => (
                  <div className="ap-book-row" key={`ask-${i}`}>
                    <span className="ap-dn">{r.price}</span>
                    <div className="ap-depth"><div className="ap-dfill ap-dask" style={{ width: `${r.pct}%` }}/></div>
                    <span className="ap-bsz">{r.size}</span>
                  </div>
                ))}
                <div className="ap-spread">
                  <span>SPREAD</span><strong>{book.spread}</strong><span>MID</span><strong>{book.mid}</strong>
                </div>
                {book.bids.map((r, i) => (
                  <div className="ap-book-row" key={`bid-${i}`}>
                    <span className="ap-up">{r.price}</span>
                    <div className="ap-depth"><div className="ap-dfill ap-dbid" style={{ width: `${r.pct}%` }}/></div>
                    <span className="ap-bsz">{r.size}</span>
                  </div>
                ))}
                <div className="ap-trade-btns">
                  <button className="ap-tbtn ap-tbuy">Buy Market</button>
                  <button className="ap-tbtn ap-tsell">Sell Market</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── MARKETS SECTION ── */}
        <section className="ap-section ap-mkt-sec" id="markets">
          <div className="ap-mkt-bg">
            <img
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1400&auto=format&fit=crop&q=70"
              alt="Global market data network map"
              className="ap-mkt-bg-img"
            />
          </div>
          <div className="ap-mkt-inner aprx">
            <p className="ap-label">02 · Markets</p>
            <h2 className="ap-h2">Everything moves.<br/>Capture it.</h2>
            <p className="ap-body" style={{ maxWidth: '380px', marginBottom: '28px' }}>
              180+ instruments across crypto, equities, FX, and commodities.
            </p>
            <div className="ap-mkt-table">
              <div className="ap-mkt-head">
                <span>Symbol</span><span>Name</span>
                <span className="ap-tr">Price</span><span className="ap-tr">Change</span>
              </div>
              {marketRows.map(m => (
                <div className="ap-mkt-row" key={m.sym}>
                  <span className="ap-mkt-sym">
                    {m.logo && (
                      <img
                        src={m.logo}
                        alt=""
                        className="ap-mkt-logo"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    {m.sym}
                  </span>
                  <span className="ap-mkt-name">{m.name}</span>
                  <span className="ap-mkt-price ap-tr">{m.price}</span>
                  <span className={`ap-tr ${m.up ? 'ap-up' : 'ap-dn'}`}>{m.chg}</span>
                </div>
              ))}
            </div>
            <a href="/signup" className="ap-ilink">View all 180+ instruments →</a>
          </div>
        </section>

        {/* ── PLATFORM SECTION ── */}
        <section className="ap-section" id="platform">
          <div className="ap-platform aprx">
            <div className="ap-plat-text">
              <p className="ap-label">01 · Platform</p>
              <h2 className="ap-h2">Every edge,<br/>engineered.</h2>
              <p className="ap-body">Six years of iteration toward a single goal — zero friction between your signal and the market.</p>
              <div className="ap-feat-list">
                {FEATURES.map(f => (
                  <div className="ap-feat-row" key={f.n}>
                    <span className="ap-feat-n">{f.n}</span>
                    <div>
                      <div className="ap-feat-t">{f.title}</div>
                      <div className="ap-feat-d">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ap-plat-media">
              <img
                src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=720&auto=format&fit=crop&q=85"
                alt="Professional trading terminal overview layout"
                className="ap-plat-img"
              />
              <div className="ap-plat-overlay"/>
              <div className="ap-plat-badge">
                <span className="ap-live-dot"/><span>Live execution engine</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── CALL TO ACTION SECTION ── */}
        <section className="ap-section ap-begin-sec" id="begin">
          <div className="ap-begin-inner aprx">
            <p className="ap-label">03 · Begin</p>
            <h2 className="ap-h2">Your edge starts here.</h2>
            <p className="ap-body" style={{ marginBottom: '32px' }}>
              Open a funded account in under 5 minutes. No minimums on demo. Live markets from day one.
            </p>
            <div className="ap-cta-form">
              <input className="ap-cta-input" type="email" placeholder="Enter your email address"/>
              <a href="/signup" className="ap-cta-submit">Get Started</a>
            </div>
            <div className="ap-trust-badges">
              {['FCA & CySEC regulated', 'Negative balance protection', '24/5 desk support', 'Spreads from 0.0 pips'].map((b, i) => (
                <span key={b}>{i > 0 && <span className="ap-dot">·</span>}{b}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="ap-footer">
          <div className="ap-footer-brand">Apex<span>·</span>Markets</div>
          <ul className="ap-footer-links">
            {['Web Terminal', 'API Access', 'Careers', 'Privacy', 'Terms', 'Risk Disclosure'].map(l => (
              <li key={l}><a href="#">{l}</a></li>
            ))}
          </ul>
          <span className="ap-footer-legal">© 2026 Apex Markets Ltd. CFDs carry risk. Capital at risk.</span>
        </footer>
      </div>
    </>
  );
}

/* ─── Design System Architecture Styles ────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=Fira+Code:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --void:      #0f2535;
  --void-2:    #060f1a;
  --surface:   rgba(255,255,255,0.035);
  --surface-2: rgba(255,255,255,0.06);
  --surface-3: rgba(255,255,255,0.09);
  
  --rim:        rgba(255,255,255,0.07);
  --rim-strong: rgba(255,255,255,0.16);
  
  --elec:      #4FA3C4;
  --elec-hi:   #6FB8D8;
  --elec-lo:   rgba(79,163,196,0.14);
  
  --mint:      #00D68A;
  --mint-lo:   rgba(0,214,138,0.14);
  --coral:     #FF6B6B;
  --amber:     #FFC02A;
  
  --t1:        #F2F4FF;
  --t2:        #8A93B8;
  --t3:        #3A445C;
  
  --glass:     rgba(6,15,26,0.72);
  
  --sans:      'DM Sans', system-ui, sans-serif;
  --disp:      'Barlow Condensed', sans-serif;
  --mono:      'Fira Code', 'Courier New', monospace;
  
  --glow-elec: 0 0 40px rgba(79,163,196,0.12);
  --glow-mint:  0 0 30px rgba(0,214,138,0.10);
  
  --ease-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-soft: cubic-bezier(0.4, 0, 0.2, 1);
  
  --radius-m:  8px;
}

.ap-root {
  background: var(--void);
  color: var(--t1);
  font-family: var(--sans);
  overflow-x: hidden;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Utilities */
.ap-up  { color: var(--mint); }
.ap-dn  { color: var(--coral); }
.ap-tr  { text-align: right; }
.ap-tc  { text-align: center; }

/* Typography Scale */
.ap-text-xs   { font-size: clamp(0.58rem, 0.6vw + 0.5rem, 0.7rem); line-height: 1.65; }
.ap-text-sm   { font-size: clamp(0.7rem, 0.8vw + 0.5rem, 0.85rem); line-height: 1.6; }
.ap-text-base { font-size: clamp(0.85rem, 1vw + 0.55rem, 0.95rem); line-height: 1.75; }
.ap-text-lg   { font-size: clamp(1rem, 1.2vw + 0.6rem, 1.15rem); line-height: 1.65; }
.ap-text-xl   { font-size: clamp(1.25rem, 1.5vw + 0.7rem, 1.6rem); line-height: 1.2; }

/* NAV Styling */
.ap-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  display: flex; align-items: center; gap: 32px;
  padding: 0 48px; height: 68px;
  background: rgba(7,11,20,0.92);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--rim);
}
.ap-nav-beam {
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, var(--elec) 30%, var(--mint) 70%, transparent);
}
.ap-logo {
  font-family: var(--disp); font-size: 1.2rem; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--t1); text-decoration: none; flex-shrink: 0;
}
.ap-logo span { color: var(--elec); }

.ap-ticker-wrap {
  flex: 1; overflow: hidden; height: 100%;
  display: flex; align-items: center;
  -webkit-mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
  mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
}
.ap-ticker-track {
  display: flex; white-space: nowrap;
  animation: apTicker 50s linear infinite;
}
.ap-ticker-item {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 0 20px;
  font-family: var(--mono); font-size: 0.68rem;
  color: var(--t2); border-right: 1px solid var(--rim);
}
.ap-tsym { color: var(--t1); font-weight: 500; letter-spacing: 0.06em; }
.ap-tprice { font-variant-numeric: tabular-nums; }
.ap-tlogo { width: 14px; height: 14px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }

.ap-nav-links {
  display: flex; gap: 28px; list-style: none; flex-shrink: 0;
}
.ap-nav-links a {
  font-family: var(--mono); font-size: 0.78rem;
  letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--t2); text-decoration: none; transition: color 0.2s;
}
.ap-nav-links a:hover { color: var(--t1); }

/* Unified Auth Component Balance */
.ap-nav-auth {
  display: flex; align-items: center; gap: 12px; flex-shrink: 0;
}
.ap-nav-login {
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--mono); font-size: 0.75rem;
  letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--t1); text-decoration: none;
  padding: 10px 20px; height: 38px;
  border: 1px solid var(--rim-strong); border-radius: var(--radius-m);
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.2s var(--ease-soft);
}
.ap-nav-login:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: var(--t2);
}
.ap-nav-cta {
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--mono); font-size: 0.75rem;
  letter-spacing: 0.08em; text-transform: uppercase;
  background: var(--elec); color: #fff;
  padding: 10px 22px; height: 38px; text-decoration: none;
  border-radius: var(--radius-m);
  box-shadow: 0 2px 8px rgba(79, 163, 196, 0.15);
  transition: all 0.2s var(--ease-soft); flex-shrink: 0;
}
.ap-nav-cta:hover {
  background: var(--elec-hi);
  box-shadow: 0 4px 16px rgba(79, 163, 196, 0.3);
}

/* HERO Styling */
.ap-hero {
  position: relative; min-height: 100vh;
  padding-top: 68px; overflow: hidden;
  display: flex; flex-direction: column;
  justify-content: flex-start;
}
.ap-hero-grid {
  position: absolute; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
  background-size: 56px 56px;
}
.ap-hero-chart {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 230px; pointer-events: none; opacity: 0.42; z-index: 1;
}
.ap-hero-inner {
  position: relative; z-index: 2;
  display: grid; grid-template-columns: 1fr 420px;
  gap: 60px; padding: 80px 60px 56px;
  flex: 1; align-items: center;
}

.ap-hero-inner .ap-eyebrow,
.ap-hero-inner .ap-h1,
.ap-hero-inner .ap-hero-sub,
.ap-hero-inner .ap-hero-ctas,
.ap-hero-inner .ap-hero-right {
  opacity: 0;
  animation: apFadeUp 0.9s var(--ease-expo) forwards;
}
.ap-hero-inner .ap-eyebrow    { animation-delay: 0.1s; }
.ap-hero-inner .ap-h1        { animation-delay: 0.25s; }
.ap-hero-inner .ap-hero-sub  { animation-delay: 0.4s; }
.ap-hero-inner .ap-hero-ctas { animation-delay: 0.55s; }
.ap-hero-inner .ap-hero-right { animation: apFadeIn 1.1s var(--ease-soft) 0.7s forwards; }

.ap-eyebrow {
  font-family: var(--mono); font-size: 0.61rem;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--elec); margin-bottom: 22px;
}
.ap-h1 {
  font-family: var(--disp); font-size: clamp(3.2rem, 6.5vw, 6.8rem);
  font-weight: 800; line-height: 0.9;
  letter-spacing: -0.02em; text-transform: uppercase;
  color: var(--t1); margin-bottom: 24px;
}
.ap-h1 em { font-style: italic; color: var(--elec); font-weight: 700; }
.ap-hero-sub {
  font-size: var(--text-base);
  line-height: 1.75; color: var(--t2); font-weight: 300;
  max-width: 42ch; margin-bottom: 40px;
}
.ap-hero-ctas {
  display: flex; align-items: center; gap: 16px;
}
.ap-btn-primary {
  display: inline-block; background: var(--elec); color: #fff;
  font-family: var(--mono); font-size: 0.78rem; font-weight: 500;
  letter-spacing: 0.08em; text-transform: uppercase;
  padding: 14px 28px; text-decoration: none;
  border-radius: var(--radius-m);
  transition: transform 0.25s var(--ease-soft), box-shadow 0.25s var(--ease-soft), background 0.2s;
}
.ap-btn-primary:hover {
  background: var(--elec-hi);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(79,163,196,0.35);
}
.ap-btn-ghost {
  display: inline-block;
  font-family: var(--mono); font-size: 0.78rem;
  letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--t1); text-decoration: none;
  border: 1px solid var(--rim-strong);
  padding: 13px 28px; border-radius: var(--radius-m);
  background: rgba(255, 255, 255, 0.01);
  transition: all 0.2s var(--ease-soft);
}
.ap-btn-ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--t2);
}

/* ORDER BOOK Styling */
.ap-book {
  background: #0f2535;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-m);
  backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  padding: 24px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
.ap-book-head {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding-bottom: 16px; margin-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.ap-book-pair {
  display: flex; align-items: center; gap: 8px;
  font-family: var(--mono); font-size: 0.62rem; font-weight: 500;
  letter-spacing: 0.1em; color: var(--t2); margin-bottom: 4px;
}
.ap-live-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--mint); flex-shrink: 0;
  animation: apPulse 2.4s ease-in-out infinite;
}
.ap-book-px {
  font-family: var(--mono); font-size: 1.6rem; font-weight: 600;
  color: var(--t1); font-variant-numeric: tabular-nums; letter-spacing: -0.02em;
}
.ap-book-chg { font-family: var(--mono); font-size: 0.65rem; margin-top: 4px; font-weight: 500; }
.ap-book-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.ap-meta-item { display: flex; flex-direction: column; align-items: flex-end; }
.ap-ml {
  font-family: var(--mono); font-size: 0.52rem; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--t3); margin-bottom: 2px;
}
.ap-mv { font-family: var(--mono); font-size: 0.75rem; color: var(--t2); font-weight: 500; }

.ap-book-cols {
  display: grid; grid-template-columns: 85px 1fr 65px; gap: 12px;
  padding: 6px 0; font-family: var(--mono); font-size: 0.55rem; font-weight: 500;
  letter-spacing: 0.1em; text-transform: uppercase; color: var(--t3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04); margin-bottom: 6px;
}
.ap-book-row {
  display: grid; grid-template-columns: 85px 1fr 65px; align-items: center; gap: 12px;
  padding: 4.5px 0; font-family: var(--mono); font-size: 0.72rem;
  font-variant-numeric: tabular-nums; transition: background 0.15s ease;
}
.ap-book-row:hover { background: rgba(255, 255, 255, 0.02); }

.ap-depth { position: relative; height: 5px; background: rgba(255, 255, 255, 0.02); border-radius: 3px; overflow: hidden; }
.ap-dfill { position: absolute; top: 0; height: 100%; border-radius: 3px; opacity: 0.45; }
.ap-dask { right: 0; background: linear-gradient(90deg, transparent, var(--coral)); }
.ap-dbid { left: 0; background: linear-gradient(90deg, var(--mint), transparent); }
.ap-bsz { text-align: right; color: var(--t2); font-weight: 400; }

.ap-spread {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 12px; margin: 10px 0;
  background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 4px; font-family: var(--mono); font-size: 0.6rem;
  letter-spacing: 0.05em; text-transform: uppercase; color: var(--t2);
}
.ap-spread strong { color: var(--t1); font-weight: 500; }

.ap-trade-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px; }
.ap-tbtn {
  font-family: var(--mono); font-size: 0.7rem; font-weight: 600;
  letter-spacing: 0.08em; text-transform: uppercase;
  padding: 12px 14px; border-radius: var(--radius-m); border: 1px solid transparent;
  cursor: pointer; transition: all 0.2s var(--ease-soft);
}
.ap-tbuy { background: rgba(0, 214, 138, 0.08); color: var(--mint); border-color: rgba(0, 214, 138, 0.15); }
.ap-tbuy:hover { background: var(--mint); color: #021a0f; box-shadow: 0 4px 20px rgba(0, 214, 138, 0.25); }
.ap-tsell { background: rgba(255, 107, 107, 0.08); color: var(--coral); border-color: rgba(255, 107, 107, 0.15); }
.ap-tsell:hover { background: var(--coral); color: #200808; box-shadow: 0 4px 20px rgba(255, 107, 107, 0.25); }

/* MARKETS Styling */
.ap-mkt-sec { padding: 40px 60px 80px; border-top: 1px solid var(--rim); position: relative; overflow: hidden; }
.ap-mkt-bg { position: absolute; inset: 0; z-index: 0; opacity: 0.06; }
.ap-mkt-bg-img { width: 100%; height: 100%; object-fit: cover; opacity: 0.07; filter: saturate(0) brightness(1.2); }
.ap-mkt-inner { position: relative; z-index: 1; max-width: 820px; }
.ap-mkt-table { background: rgba(11,21,27,0.78); border: 1px solid var(--rim-strong); backdrop-filter: blur(8px); margin-bottom: 22px; overflow: hidden; border-radius: var(--radius-m); }
.ap-mkt-head {
  display: grid; grid-template-columns: 80px 1fr 130px 130px;
  padding: 11px 20px; background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--rim);
  font-family: var(--mono); font-size: 0.54rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--t2);
}
.ap-mkt-row {
  display: grid; grid-template-columns: 80px 1fr 130px 130px;
  padding: 14px 20px; border-bottom: 1px solid var(--rim);
  font-family: var(--mono); font-size: 0.75rem; align-items: center;
  font-variant-numeric: tabular-nums; transition: background 0.15s ease; cursor: default;
}
.ap-mkt-row:last-child { border-bottom: none; }
.ap-mkt-row:hover { background: rgba(255,255,255,0.025); }
.ap-mkt-sym   { font-weight: 500; color: var(--t1); display: flex; align-items: center; gap: 8px; }
.ap-mkt-logo  { width: 18px; height: 18px; border-radius: 50%; object-fit: cover; flex-shrink: 0; background: rgba(255,255,255,0.06); }
.ap-mkt-name  { font-size: 0.71rem; color: var(--t2); }
.ap-mkt-price { color: var(--t1); }
.ap-ilink {
  font-family: var(--mono); font-size: 0.69rem; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--elec); text-decoration: none;
  display: inline-block; transition: opacity 0.2s;
}
.ap-ilink:hover { opacity: 0.7; }

/* GLOBAL SECTIONS Styling */
.ap-section { padding: 96px 60px; border-top: 1px solid var(--rim); position: relative; }
.ap-label { font-family: var(--mono); font-size: 0.61rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--elec); margin-bottom: 14px; }
.ap-h2 { font-family: var(--disp); font-size: clamp(1.9rem, 3.2vw, 2.8rem); font-weight: 700; line-height: 1.05; letter-spacing: -0.01em; text-transform: uppercase; color: var(--t1); margin-bottom: 16px; }
.ap-body { font-size: var(--text-base); line-height: 1.75; color: var(--t2); font-weight: 300; max-width: 44ch; margin-bottom: 36px; }

/* PLATFORM Content Styling */
.ap-platform { display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: center; max-width: 1200px; margin: 0 auto; }
.ap-feat-list { border-top: 1px solid var(--rim); }
.ap-feat-row {
  display: grid; grid-template-columns: 32px 1fr; gap: 16px;
  padding: 18px 0; border-bottom: 1px solid var(--rim);
  transition: padding-left 0.25s var(--ease-soft), background 0.25s var(--ease-soft); cursor: default;
}
.ap-feat-row:hover { padding-left: 6px; background: linear-gradient(90deg, var(--elec-lo), transparent); border-left: 2px solid var(--elec); }
.ap-feat-n { font-family: var(--mono); font-size: 0.57rem; color: var(--elec); font-weight: 500; padding-top: 3px; }
.ap-feat-t { font-size: 0.91rem; font-weight: 500; color: var(--t1); margin-bottom: 5px; }
.ap-feat-d { font-size: 0.79rem; line-height: 1.65; color: var(--t2); font-weight: 300; }

.ap-plat-media { position: relative; border: 1px solid var(--rim); overflow: hidden; border-radius: var(--radius-m); }
.ap-plat-img { display: block; width: 100%; aspect-ratio: 4/3; object-fit: cover; filter: saturate(0.45) brightness(0.6); }
.ap-plat-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(79,163,196,0.22) 0%, transparent 55%); }
.ap-plat-badge {
  position: absolute; bottom: 16px; left: 16px; display: flex; align-items: center; gap: 8px;
  background: rgba(7,11,20,0.88); border: 1px solid var(--rim-strong); padding: 8px 14px;
  backdrop-filter: blur(8px); font-family: var(--mono); font-size: 0.61rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--t1); border-radius: 4px;
}

/* BEGIN SECTION Styling */
.ap-begin-sec { background: linear-gradient(135deg, rgba(79,163,196,0.05) 0%, transparent 60%); border-top: 1px solid rgba(79,163,196,0.18); }
.ap-begin-inner { max-width: 520px; }
.ap-cta-form { display: flex; margin-bottom: 22px; }
.ap-cta-input {
  flex: 1; background: rgba(255,255,255,0.04); border: 1px solid var(--rim-strong); border-right: none;
  padding: 13px 17px; font-family: var(--mono); font-size: 0.75rem; color: var(--t1); outline: none; transition: border-color 0.2s;
  border-top-left-radius: var(--radius-m); border-bottom-left-radius: var(--radius-m);
}
.ap-cta-input::placeholder { color: var(--t2); }
.ap-cta-input:focus { border-color: var(--elec); }
.ap-cta-submit {
  background: var(--elec); color: #fff; border: none; padding: 13px 24px;
  font-family: var(--mono); font-size: 0.69rem; font-weight: 500; letter-spacing: 0.1em;
  text-transform: uppercase; cursor: pointer; white-space: nowrap; transition: background 0.2s;
  display: inline-flex; align-items: center; justify-content: center; text-decoration: none;
  border-top-right-radius: var(--radius-m); border-bottom-right-radius: var(--radius-m);
}
.ap-cta-submit:hover { background: var(--elec-hi); }
.ap-trust-badges { display: flex; flex-wrap: wrap; gap: 4px 0; font-size: 0.74rem; color: var(--t2); align-items: center; }
.ap-dot { margin: 0 8px; color: var(--elec); opacity: 0.4; }

/* FOOTER Styling */
.ap-footer { background: rgba(4,6,12,0.8); border-top: 1px solid var(--rim); padding: 24px 60px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
.ap-footer-brand { font-family: var(--disp); font-size: 0.92rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--t1); }
.ap-footer-brand span { color: var(--elec); }
.ap-footer-links { display: flex; gap: 22px; flex-wrap: wrap; list-style: none; }
.ap-footer-links a { font-family: var(--mono); font-size: 0.61rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--t2); text-decoration: none; transition: color 0.2s; }
.ap-footer-links a:hover { color: var(--t1); }
.ap-footer-legal { font-family: var(--mono); font-size: 0.57rem; color: var(--t3); }

/* KEYFRAMES ANIMATIONS */
@keyframes apFadeUp { from { opacity: 0; transform: translateY(22px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes apFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes apPulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(0,214,138,0.35); }
  45%      { opacity: 0.9; box-shadow: 0 0 0 4px rgba(0,214,138,0); }
  50%      { opacity: 1; box-shadow: 0 0 0 0 rgba(0,214,138,0); }
}
@keyframes apTicker { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }

.aprx { opacity: 0; transform: translateY(28px); transition: opacity 0.9s var(--ease-expo), transform 0.9s var(--ease-expo); }
.aprx.apv { opacity: 1; transform: translateY(0); }

/* RESPONSIVE MEDIA QUERIES */
@media (max-width: 1000px) {
  .ap-ticker-wrap { display: none; }
  .ap-hero { min-height: auto; padding-top: 68px; }
  .ap-hero-inner { grid-template-columns: 1fr; align-items: start; gap: 48px; padding: 60px 24px 120px; }
  .ap-hero-right { display: block; width: 100%; max-width: 440px; margin: 0 auto; }
  .ap-platform { grid-template-columns: 1fr; gap: 40px; }
  .ap-plat-img { aspect-ratio: 16/9; }
  .ap-mkt-head, .ap-mkt-row { grid-template-columns: 70px 1fr 100px; }
  .ap-mkt-head span:last-child, .ap-mkt-row span:last-child { display: none; }
}
@media (max-width: 640px) {
  .ap-nav { padding: 0 20px; gap: 16px; }
  .ap-nav-links { display: none; }
  .ap-section, .ap-mkt-sec { padding: 64px 24px; }
  .ap-hero-inner { padding: 56px 24px 100px; }
  .ap-footer { padding: 20px 24px; flex-direction: column; align-items: flex-start; }
}
@media (prefers-reduced-motion: reduce) {
  .ap-eyebrow, .ap-h1, .ap-hero-sub, .ap-hero-ctas, .ap-hero-right, .aprx { animation: none !important; opacity: 1 !important; transform: none !important; }
  .ap-live-dot, .ap-ticker-track { animation: none !important; }
  .ap-feat-row:hover { padding-left: 0 !important; }
}
`;
