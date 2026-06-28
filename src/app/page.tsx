'use client';

import { useState, useEffect, useMemo } from 'react';

/* ─── Data ──────────────────────────────────────────────────────── */
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

const TESTIMONIALS = [
  { quote: 'The execution speed alone puts Apex ahead of anything I\'ve used. My scalp strategies finally work the way they\'re supposed to.', name: 'Marcus K.', role: 'Prop Trader, London',           color: '5B6BFF' },
  { quote: 'Crypto, equities, and FX in one clean dashboard is genuinely rare. Apex makes it feel obvious in hindsight.',                      name: 'Sofia N.', role: 'Portfolio Manager, Dubai',      color: '00D68A' },
  { quote: 'The API documentation is impeccable. Integrated our quant system in two days — fill rates noticeably better than our old broker.', name: 'Ryo O.',    role: 'Quant Developer, Tokyo',        color: 'FFB800' },
];

/* ─── Candlestick Chart ─────────────────────────────────────────── */
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

/* ─── Live Market Data ──────────────────────────────────────────── */
// Symbols returned by the crypto leg of /api/market (vs. plain stock tickers).
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

// /api/market gives us a top-of-book price + 24h change, not real depth, so we
// synthesize a 5-level ladder around the live mid price purely for the visual.
function buildBook(mid: number) {
  const unit = Math.max(mid * 0.00003, 0.01);
  const level = () => ({ size: (0.25 + Math.random() * 1.1).toFixed(3), pct: Math.round(14 + Math.random() * 38) });
  const asks = Array.from({ length: 5 }, (_, i) => ({ price: fmtPrice(mid + unit * (5 - i)), ...level() }));
  const bids = Array.from({ length: 5 }, (_, i) => ({ price: fmtPrice(mid - unit * (i + 1)), ...level() }));
  return { asks, bids, spread: (unit * 2).toFixed(2), mid: fmtPrice(mid) };
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function HomePage() {
  const [candles] = useState(makeCandles);
  const [assets, setAssets] = useState<any[]>([]);

  // Poll our own /api/market route (CoinGecko + Finnhub under the hood) every 30s.
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await fetchAssets();
        if (active && Array.isArray(data) && data.length) setAssets(data);
      } catch {
        // network/API hiccup — keep showing the last known (or fallback) data
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
      <style>{CSS}</style>
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
            <li><a href="#trust">Trust</a></li>
          </ul>
          <div className="ap-nav-auth">
            <a href="/login" className="ap-nav-login">Log In</a>
            <a href="/signup" className="ap-nav-cta">Sign Up</a>
          </div>
        </nav>

        {/* ── HERO ── */}
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
              <p className="ap-hero-sub">
                Trade equities, crypto, FX, and derivatives from a single platform. Regulated, transparent, and made to handle whatever the market throws at you.
              </p>
              <div className="ap-hero-ctas">
                <a href="/signup" className="ap-btn-primary">Start Trading →</a>
                <a href="#platform" className="ap-btn-ghost">See the platform</a>
              </div>
              <div className="ap-stats">
                {[
                  { v: '$4.8B', l: 'Daily volume'  },
                  { v: '0.2ms', l: 'Avg. latency'  },
                  { v: '180+',  l: 'Markets'        },
                  { v: '99.9%', l: 'Uptime SLA'     },
                ].map(s => (
                  <div className="ap-stat" key={s.l}>
                    <span className="ap-stat-v">{s.v}</span>
                    <span className="ap-stat-l">{s.l}</span>
                  </div>
                ))}
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
                    <div className="ap-meta-item"><span className="ap-ml">24h Vol</span><span className="ap-mv">$38.2B</span></div>
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

        {/* ── PLATFORM ── */}
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
                alt="Professional trading terminal with multiple chart windows"
                className="ap-plat-img"
              />
              <div className="ap-plat-overlay"/>
              <div className="ap-plat-badge">
                <span className="ap-live-dot"/><span>Live execution engine</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── MARKETS ── */}
        <section className="ap-section ap-mkt-sec" id="markets">
          <div className="ap-mkt-bg">
            <img
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1400&auto=format&fit=crop&q=70"
              alt="Global satellite view"
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

        {/* ── TRUST ── */}
        <section className="ap-section" id="trust">
          <div className="ap-trust-wrap">
            <p className="ap-label aprx">03 · Trust</p>
            <h2 className="ap-h2 aprx" style={{ marginBottom: '44px' }}>What traders say.</h2>
            <div className="ap-testimonials aprx">
              {TESTIMONIALS.map((t, i) => {
                const [r, g, b] = [0, 2, 4].map(o => parseInt(t.color.slice(o, o + 2), 16));
                return (
                  <div className="ap-testi" key={i}>
                    <div className="ap-testi-bar" style={{ background: `#${t.color}` }}/>
                    <p className="ap-testi-q">"{t.quote}"</p>
                    <div className="ap-testi-attr">
                      <div
                        className="ap-avatar"
                        style={{
                          background: `rgba(${r},${g},${b},0.14)`,
                          borderColor: `rgba(${r},${g},${b},0.4)`,
                          color: `#${t.color}`,
                        }}
                      >
                        {t.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="ap-tname">{t.name}</div>
                        <div className="ap-trole">{t.role}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── BEGIN ── */}
        <section className="ap-section ap-begin-sec" id="begin">
          <div className="ap-begin-inner aprx">
            <p className="ap-label">04 · Begin</p>
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

/* ─── Styles ──────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=Fira+Code:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --void:    #0f2535;
  --panel:   rgba(255,255,255,0.03);
  --rim:     rgba(255,255,255,0.07);
  --rim2:    rgba(255,255,255,0.12);
  --elec:    #49A5B6;
  --elec-lo: rgba(91,107,255,0.12);
  --mint:    #00D68A;
  --coral:   #FF5252;
  --amber:   #FFB800;
  --t1:      #EDF0FF;
  --t2:      #6B7A9B;
  --t3:      #2A3150;
  --sans:    'DM Sans', system-ui, sans-serif;
  --disp:    'Barlow Condensed', sans-serif;
  --mono:    'Fira Code', 'Courier New', monospace;
}

.ap-root {
  background: var(--void);
  color: var(--t1);
  font-family: var(--sans);
  overflow-x: hidden;
  min-height: 100vh;
}

/* ── Utilities ── */
.ap-up  { color: var(--mint); }
.ap-dn  { color: var(--coral); }
.ap-tr  { text-align: right; }
.ap-tc  { text-align: center; }

/* ── NAV ── */
.ap-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  display: flex; align-items: center; gap: 24px;
  padding: 0 48px; height: 58px;
  /* .ap-nav */
background: rgba(var(--void-rgb), 0.92); /* was: rgba(7,11,20,0.9) */
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--rim);
}
.ap-nav-beam {
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, var(--elec) 30%, var(--mint) 70%, transparent);
}
.ap-logo {
  font-family: var(--disp); font-size: 1.05rem; font-weight: 700;
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
  animation: apTicker 44s linear infinite;
}
.ap-ticker-item {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 0 20px;
  font-family: var(--mono); font-size: 0.62rem;
  color: var(--t2); border-right: 1px solid var(--rim);
}
.ap-tsym { color: var(--t1); font-weight: 500; letter-spacing: 0.06em; }
.ap-tprice { font-variant-numeric: tabular-nums; }
.ap-tlogo { width: 14px; height: 14px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }

.ap-nav-links {
  display: flex; gap: 28px; list-style: none; flex-shrink: 0;
}
.ap-nav-links a {
  font-family: var(--mono); font-size: 0.63rem;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--t2); text-decoration: none; transition: color 0.2s;
}
.ap-nav-links a:hover { color: var(--t1); }

.ap-nav-auth {
  display: flex; align-items: center; gap: 18px; flex-shrink: 0;
}
.ap-nav-login {
  font-family: var(--mono); font-size: 0.63rem;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--t2); text-decoration: none; transition: color 0.2s;
}
.ap-nav-login:hover { color: var(--t1); }
.ap-nav-cta {
  font-family: var(--mono); font-size: 0.63rem;
  letter-spacing: 0.1em; text-transform: uppercase;
  background: var(--elec); color: #fff;
  padding: 9px 18px; text-decoration: none;
  transition: background 0.2s; flex-shrink: 0;
}
.ap-nav-cta:hover { background: #7B8BFF; }

/* ── HERO ── */
.ap-hero {
  position: relative; min-height: 100vh;
  padding-top: 58px; overflow: hidden;
  display: flex; flex-direction: column;
  justify-content: flex-start;
}
.ap-hero-grid {
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
  background-size: 56px 56px;
}
.ap-hero-chart {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 230px; pointer-events: none; opacity: 0.42;
}
.ap-hero-inner {
  position: relative; z-index: 2;
  display: grid; grid-template-columns: 1fr 420px;
  gap: 60px; padding: 80px 60px 56px;
  flex: 1; align-items: center;
}

.ap-eyebrow {
  font-family: var(--mono); font-size: 0.61rem;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--elec); margin-bottom: 22px;
  opacity: 0; animation: apFadeUp 0.6s ease 0.1s forwards;
}
.ap-h1 {
  font-family: var(--disp); font-size: clamp(3.6rem, 7.5vw, 7rem);
  font-weight: 800; line-height: 0.92;
  text-transform: uppercase; letter-spacing: 0.01em;
  color: var(--t1); margin-bottom: 28px;
  opacity: 0; animation: apFadeUp 0.7s ease 0.25s forwards;
}
.ap-h1 em { font-style: italic; color: var(--elec); font-weight: 700; }
.ap-hero-sub {
  font-size: 0.97rem; line-height: 1.75;
  color: var(--t2); font-weight: 300; max-width: 420px; margin-bottom: 36px;
  opacity: 0; animation: apFadeUp 0.7s ease 0.4s forwards;
}
.ap-hero-ctas {
  display: flex; align-items: center; gap: 24px; margin-bottom: 44px;
  opacity: 0; animation: apFadeUp 0.7s ease 0.55s forwards;
}
.ap-btn-primary {
  display: inline-block; background: var(--elec); color: #fff;
  font-family: var(--mono); font-size: 0.73rem; font-weight: 500;
  letter-spacing: 0.1em; text-transform: uppercase;
  padding: 14px 28px; text-decoration: none;
  transition: background 0.2s, transform 0.15s;
}
.ap-btn-primary:hover { background: #7B8BFF; transform: translateY(-1px); }
.ap-btn-ghost {
  font-family: var(--mono); font-size: 0.71rem;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--t2); text-decoration: none;
  border-bottom: 1px solid var(--t3); padding-bottom: 2px;
  transition: color 0.2s, border-color 0.2s;
}
.ap-btn-ghost:hover { color: var(--t1); border-color: var(--t2); }

.ap-stats {
  display: flex; border-top: 1px solid var(--rim);
  opacity: 0; animation: apFadeUp 0.7s ease 0.7s forwards;
}
.ap-stat {
  display: flex; flex-direction: column;
  padding: 16px 28px 16px 0;
  border-right: 1px solid var(--rim); margin-right: 28px;
}
.ap-stat:last-child { border-right: none; margin-right: 0; }
.ap-stat-v {
  font-family: var(--mono); font-size: 1.04rem; font-weight: 500;
  color: var(--t1); font-variant-numeric: tabular-nums;
}
.ap-stat-l { font-size: 0.69rem; color: var(--t2); margin-top: 4px; }

/* ── ORDER BOOK ── */
.ap-hero-right {
  opacity: 0; animation: apFadeIn 1s ease 0.8s forwards;
}
.ap-book {
  background: rgba(9,13,24,0.96);
  border: 1px solid var(--rim2);
  backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  padding: 20px 20px 18px;
  box-shadow: 0 28px 64px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05);
}
.ap-book-head {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding-bottom: 14px; margin-bottom: 10px; border-bottom: 1px solid var(--rim);
}
.ap-book-pair {
  display: flex; align-items: center; gap: 8px;
  font-family: var(--mono); font-size: 0.59rem;
  letter-spacing: 0.15em; text-transform: uppercase;
  color: var(--t2); margin-bottom: 8px;
}
.ap-live-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--mint); flex-shrink: 0;
  animation: apPulse 2s ease-in-out infinite;
}
.ap-book-px {
  font-family: var(--mono); font-size: 1.5rem; font-weight: 500;
  color: var(--t1); font-variant-numeric: tabular-nums; letter-spacing: -0.02em;
}
.ap-book-chg { font-family: var(--mono); font-size: 0.65rem; margin-top: 4px; }
.ap-book-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.ap-meta-item { display: flex; flex-direction: column; align-items: flex-end; }
.ap-ml {
  font-family: var(--mono); font-size: 0.51rem;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--t2); margin-bottom: 2px;
}
.ap-mv { font-family: var(--mono); font-size: 0.79rem; color: var(--t1); font-weight: 500; }
.ap-book-cols {
  display: grid; grid-template-columns: 82px 1fr 58px; gap: 8px;
  padding: 3px 0 8px;
  font-family: var(--mono); font-size: 0.51rem;
  letter-spacing: 0.12em; text-transform: uppercase; color: var(--t2);
}
.ap-book-row {
  display: grid; grid-template-columns: 82px 1fr 58px;
  align-items: center; gap: 8px; padding: 3.5px 0;
  font-family: var(--mono); font-size: 0.67rem; font-variant-numeric: tabular-nums;
}
.ap-depth {
  position: relative; height: 13px;
  background: rgba(255,255,255,0.03);
}
.ap-dfill { position: absolute; top: 0; height: 100%; opacity: 0.22; }
.ap-dask  { right: 0; background: var(--coral); }
.ap-dbid  { left: 0;  background: var(--mint); }
.ap-bsz   { text-align: right; color: var(--t2); }
.ap-spread {
  display: flex; justify-content: center; gap: 12px;
  padding: 7px 0; margin: 3px 0;
  border-top: 1px dashed var(--rim); border-bottom: 1px dashed var(--rim);
  font-family: var(--mono); font-size: 0.55rem;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--t2);
}
.ap-spread strong { color: var(--t1); font-weight: 500; }
.ap-trade-btns {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 16px;
}
.ap-tbtn {
  font-family: var(--mono); font-size: 0.68rem; font-weight: 500;
  letter-spacing: 0.1em; text-transform: uppercase;
  padding: 11px 8px; border: none; cursor: pointer; transition: opacity 0.2s;
}
.ap-tbtn:hover { opacity: 0.85; }
.ap-tbuy  { background: var(--mint);  color: #021a0f; }
.ap-tsell { background: var(--coral); color: #200808; }

/* ── SHARED SECTION ── */
.ap-section {
  padding: 96px 60px; border-top: 1px solid var(--rim); position: relative;
}
.ap-label {
  font-family: var(--mono); font-size: 0.61rem;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--elec); margin-bottom: 14px;
}
.ap-h2 {
  font-family: var(--disp); font-size: clamp(2rem, 3.8vw, 3.2rem);
  font-weight: 700; line-height: 1.05; text-transform: uppercase;
  letter-spacing: 0.01em; color: var(--t1); margin-bottom: 16px;
}
.ap-body {
  font-size: 0.93rem; line-height: 1.75;
  color: var(--t2); font-weight: 300; max-width: 480px; margin-bottom: 36px;
}

/* ── PLATFORM ── */
.ap-platform {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 72px; align-items: center;
  max-width: 1200px; margin: 0 auto;
}
.ap-feat-list { border-top: 1px solid var(--rim); }
.ap-feat-row {
  display: grid; grid-template-columns: 32px 1fr; gap: 16px;
  padding: 18px 0; border-bottom: 1px solid var(--rim);
  transition: padding-left 0.2s; cursor: default;
}
.ap-feat-row:hover { padding-left: 6px; }
.ap-feat-n {
  font-family: var(--mono); font-size: 0.57rem;
  color: var(--elec); font-weight: 500; padding-top: 3px;
}
.ap-feat-t { font-size: 0.91rem; font-weight: 500; color: var(--t1); margin-bottom: 5px; }
.ap-feat-d { font-size: 0.79rem; line-height: 1.65; color: var(--t2); font-weight: 300; }

.ap-plat-media {
  position: relative; border: 1px solid var(--rim); overflow: hidden;
}
.ap-plat-img {
  display: block; width: 100%; aspect-ratio: 4/3;
  object-fit: cover; filter: saturate(0.45) brightness(0.6);
}
.ap-plat-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(91,107,255,0.22) 0%, transparent 55%);
}
.ap-plat-badge {
  position: absolute; bottom: 16px; left: 16px;
  display: flex; align-items: center; gap: 8px;
  background: rgba(7,11,20,0.88); border: 1px solid var(--rim2);
  padding: 8px 14px; backdrop-filter: blur(8px);
  font-family: var(--mono); font-size: 0.61rem;
  letter-spacing: 0.1em; text-transform: uppercase; color: var(--t1);
}

/* ── MARKETS ── */
.ap-mkt-sec { overflow: hidden; }
.ap-mkt-bg {
  position: absolute; inset: 0; z-index: 0;
}
.ap-mkt-bg-img {
  width: 100%; height: 100%;
  object-fit: cover; opacity: 0.07; filter: saturate(0) brightness(1.2);
}
.ap-mkt-inner { position: relative; z-index: 1; max-width: 820px; }
.ap-mkt-table {
  background: rgba(7,11,20,0.78); border: 1px solid var(--rim2);
  backdrop-filter: blur(8px); margin-bottom: 22px; overflow: hidden;
}
.ap-mkt-head {
  display: grid; grid-template-columns: 80px 1fr 130px 130px;
  padding: 11px 20px; background: rgba(255,255,255,0.03);
  border-bottom: 1px solid var(--rim);
  font-family: var(--mono); font-size: 0.54rem;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--t2);
}
.ap-mkt-row {
  display: grid; grid-template-columns: 80px 1fr 130px 130px;
  padding: 14px 20px; border-bottom: 1px solid var(--rim);
  font-family: var(--mono); font-size: 0.75rem;
  align-items: center; font-variant-numeric: tabular-nums;
  transition: background 0.15s; cursor: default;
}
.ap-mkt-row:last-child { border-bottom: none; }
.ap-mkt-row:hover { background: rgba(255,255,255,0.025); }
.ap-mkt-sym   { font-weight: 500; color: var(--t1); display: flex; align-items: center; gap: 8px; }
.ap-mkt-logo  { width: 18px; height: 18px; border-radius: 50%; object-fit: cover; flex-shrink: 0; background: rgba(255,255,255,0.06); }
.ap-mkt-name  { font-size: 0.71rem; color: var(--t2); }
.ap-mkt-price { color: var(--t1); }
.ap-ilink {
  font-family: var(--mono); font-size: 0.69rem;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--elec); text-decoration: none;
  display: inline-block; transition: opacity 0.2s;
}
.ap-ilink:hover { opacity: 0.7; }

/* ── TRUST ── */
.ap-trust-wrap { max-width: 1200px; margin: 0 auto; }
.ap-testimonials {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
}
.ap-testi {
  background: var(--panel); border: 1px solid var(--rim);
  padding: 28px 24px 24px; position: relative;
  overflow: hidden; transition: border-color 0.25s; cursor: default;
}
.ap-testi:hover { border-color: var(--rim2); }
.ap-testi-bar {
  position: absolute; top: 0; left: 0; width: 3px; height: 100%; opacity: 0.75;
}
.ap-testi-q {
  font-size: 0.86rem; line-height: 1.72;
  color: var(--t2); font-style: italic; font-weight: 300; margin-bottom: 22px;
}
.ap-testi-attr { display: flex; align-items: center; gap: 12px; }
.ap-avatar {
  width: 38px; height: 38px; border-radius: 50%;
  border: 1px solid; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--mono); font-size: 0.6rem; font-weight: 500;
  letter-spacing: 0.04em;
}
.ap-tname  { font-family: var(--mono); font-size: 0.69rem; font-weight: 500; color: var(--t1); }
.ap-trole  { font-size: 0.69rem; color: var(--t2); margin-top: 2px; }

/* ── BEGIN ── */
.ap-begin-sec {
  background: linear-gradient(135deg, rgba(91,107,255,0.05) 0%, transparent 60%);
  border-top: 1px solid rgba(91,107,255,0.18);
}
.ap-begin-inner { max-width: 520px; }
.ap-cta-form { display: flex; margin-bottom: 22px; }
.ap-cta-input {
  flex: 1; background: rgba(255,255,255,0.04);
  border: 1px solid var(--rim2); border-right: none;
  padding: 13px 17px;
  font-family: var(--mono); font-size: 0.75rem; color: var(--t1);
  outline: none; transition: border-color 0.2s;
}
.ap-cta-input::placeholder { color: var(--t2); }
.ap-cta-input:focus { border-color: var(--elec); }
.ap-cta-submit {
  background: var(--elec); color: #fff; border: none;
  padding: 13px 24px;
  font-family: var(--mono); font-size: 0.69rem; font-weight: 500;
  letter-spacing: 0.1em; text-transform: uppercase;
  cursor: pointer; white-space: nowrap; transition: background 0.2s;
  display: inline-flex; align-items: center; justify-content: center;
  text-decoration: none;
}
.ap-cta-submit:hover { background: #7B8BFF; }
.ap-trust-badges {
  display: flex; flex-wrap: wrap; gap: 4px 0;
  font-size: 0.74rem; color: var(--t2); align-items: center;
}
.ap-dot { margin: 0 8px; color: var(--elec); opacity: 0.4; }

/* ── FOOTER ── */
.ap-footer {
  background: rgba(4,6,12,0.8); border-top: 1px solid var(--rim);
  padding: 24px 60px;
  display: flex; justify-content: space-between;
  align-items: center; flex-wrap: wrap; gap: 16px;
}
.ap-footer-brand {
  font-family: var(--disp); font-size: 0.92rem; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase; color: var(--t1);
}
.ap-footer-brand span { color: var(--elec); }
.ap-footer-links { display: flex; gap: 22px; flex-wrap: wrap; list-style: none; }
.ap-footer-links a {
  font-family: var(--mono); font-size: 0.61rem;
  letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--t2); text-decoration: none; transition: color 0.2s;
}
.ap-footer-links a:hover { color: var(--t1); }
.ap-footer-legal { font-family: var(--mono); font-size: 0.57rem; color: var(--t3); }

/* ── ANIMATIONS ── */
@keyframes apFadeUp  { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
@keyframes apFadeIn  { from { opacity: 0; } to { opacity: 1; } }
@keyframes apPulse   { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
@keyframes apTicker  { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }

.aprx { opacity: 0; transform: translateY(24px); transition: opacity 0.75s ease, transform 0.75s ease; }
.aprx.apv { opacity: 1; transform: none; }

/* ── RESPONSIVE ── */
@media (max-width: 1000px) {
  .ap-ticker-wrap { display: none; }
  .ap-hero-inner  { grid-template-columns: 1fr; align-items: start; }
  .ap-hero-right  { display: none; }
  .ap-platform    { grid-template-columns: 1fr; gap: 40px; }
  .ap-plat-img    { aspect-ratio: 16/9; }
  .ap-testimonials{ grid-template-columns: 1fr; gap: 14px; }
  .ap-mkt-head, .ap-mkt-row { grid-template-columns: 70px 1fr 100px; }
  .ap-mkt-head span:last-child, .ap-mkt-row span:last-child { display: none; }
}
@media (max-width: 640px) {
  .ap-nav    { padding: 0 20px; gap: 16px; }
  .ap-nav-links { display: none; }
  .ap-section, .ap-mkt-sec { padding: 64px 24px; }
  .ap-hero-inner { padding: 56px 24px 40px; }
  .ap-footer { padding: 20px 24px; flex-direction: column; align-items: flex-start; }
}
@media (prefers-reduced-motion: reduce) {
  .ap-eyebrow,.ap-h1,.ap-hero-sub,.ap-hero-ctas,.ap-stats,.ap-hero-right,.aprx {
    animation: none !important; opacity: 1 !important; transform: none !important;
  }
  .ap-live-dot,.ap-ticker-track { animation: none !important; }
}
`;
