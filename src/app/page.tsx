'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
interface Candle {
  open: number; close: number; high: number; low: number;
}
interface TickerItem {
  sym: string; price: string; chg: string; up: boolean; logo?: string;
}
interface MarketAsset {
  symbol: string; name: string; price: number; changePercent: number; logoUrl?: string;
}
interface Testimonial {
  quote: string; name: string; role: string; color: string;
}
interface Feature {
  n: string; title: string; desc: string;
}

/* ═══════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════ */
const CRYPTO_SET = new Set(['BTC', 'ETH', 'SOL', 'BNB']);

function makeCandles(n = 58): Candle[] {
  let price = 67000;
  return Array.from({ length: n }, () => {
    const drift = (Math.random() - 0.47) * 700;
    const open = price;
    const close = price + drift;
    const high = Math.max(open, close) + Math.random() * 260;
    const low = Math.min(open, close) - Math.random() * 210;
    price = close;
    return { open, close, high, low };
  });
}

const FALLBACK_TICKERS: TickerItem[] = [
  { sym: 'BTC/USD', price: '67,420', chg: '+2.38%', up: true },
  { sym: 'ETH/USD', price: '3,512', chg: '+3.01%', up: true },
  { sym: 'AAPL', price: '189.42', chg: '+1.24%', up: true },
  { sym: 'TSLA', price: '248.10', chg: '−0.87%', up: false },
  { sym: 'EUR/USD', price: '1.0842', chg: '+0.12%', up: true },
  { sym: 'NVDA', price: '875.40', chg: '+4.62%', up: true },
  { sym: 'GOLD', price: '2,318', chg: '−0.23%', up: false },
  { sym: 'S&P 500', price: '5,241', chg: '+0.56%', up: true },
];

const FALLBACK_MARKETS: MarketAsset[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 67420, changePercent: 2.38 },
  { symbol: 'ETH', name: 'Ethereum', price: 3512, changePercent: 3.01 },
  { symbol: 'NVDA', name: 'NVIDIA Corp', price: 875.40, changePercent: 4.62 },
  { symbol: 'GOLD', name: 'Gold Spot', price: 2318.50, changePercent: -0.23 },
  { symbol: 'EUR/USD', name: 'Euro / Dollar', price: 1.0842, changePercent: 0.12 },
  { symbol: 'TSLA', name: 'Tesla Inc', price: 248.10, changePercent: -0.87 },
];

const FEATURES: Feature[] = [
  { n: '01', title: 'Smart Order Routing', desc: 'Real-time splitting across liquidity pools minimises slippage and maximises fill rates on every trade.' },
  { n: '02', title: 'Multi-Asset Dashboard', desc: 'Equities, crypto, FX, and commodities — one unified workspace, live updates, zero context-switching.' },
  { n: '03', title: 'Real-time Risk Engine', desc: 'Automatic margin alerts and drawdown controls so you stay in the game longer, with less friction.' },
  { n: '04', title: 'Institutional-grade API', desc: 'REST + WebSocket access for algorithmic traders. Co-location options with sub-millisecond data feeds.' },
];

const TESTIMONIALS: Testimonial[] = [
  { quote: "The execution speed alone puts Apex ahead of anything I've used. My scalp strategies finally work the way they're supposed to.", name: 'Marcus K.', role: 'Prop Trader, London', color: '5B6BFF' },
  { quote: 'Crypto, equities, and FX in one clean dashboard is genuinely rare. Apex makes it feel obvious in hindsight.', name: 'Sofia N.', role: 'Portfolio Manager, Dubai', color: '00D68A' },
  { quote: 'The API documentation is impeccable. Integrated our quant system in two days — fill rates noticeably better than our old broker.', name: 'Ryo O.', role: 'Quant Developer, Tokyo', color: 'FFB800' },
];

const PARTNERS = ['Bloomberg', 'Refinitiv', 'CME Group', 'Nasdaq', 'ICE', 'S&P Global'];
const TRUST_BADGES = [
  { icon: '🔒', label: 'Bank-grade encryption' },
  { icon: '🛡️', label: 'FCA & CySEC regulated' },
  { icon: '⚡', label: '99.99% uptime SLA' },
  { icon: '💰', label: 'Segregated funds' },
];
const FAQ_ITEMS = [
  { q: 'What markets can I trade on Apex?', a: 'Apex supports 180+ instruments across crypto, equities, FX, commodities, and derivatives. All from a single account with unified margin.' },
  { q: 'How fast are order executions?', a: 'Our average latency is 0.2ms for market orders, with co-location options available for algorithmic traders requiring sub-millisecond fills.' },
  { q: 'Is my capital protected?', a: 'Yes. Client funds are held in segregated accounts with tier-1 banks. We are regulated by the FCA and CySEC, and offer negative balance protection.' },
  { q: 'Do you offer API access?', a: 'Absolutely. We provide REST and WebSocket APIs with comprehensive documentation, SDKs in Python, Node.js, and Go, plus dedicated sandbox environments.' },
];

/* ═══════════════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════════════ */
function fmtPrice(price: number): string {
  const decimals = price < 1 ? 4 : 2;
  return price.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtChange(pct: number): string {
  return `${pct >= 0 ? '+' : '−'}${Math.abs(pct).toFixed(2)}%`;
}
function displaySym(sym: string): string {
  return CRYPTO_SET.has(sym) ? `${sym}/USD` : sym;
}
async function fetchAssets(): Promise<MarketAsset[]> {
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

/* ═══════════════════════════════════════════════════════════════
   ANIMATED COUNTER
   ═══════════════════════════════════════════════════════════════ */
function AnimatedCounter({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 1500;
          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CANDLESTICK CHART
   ═══════════════════════════════════════════════════════════════ */
function CandleChart({ candles }: { candles: Candle[] }) {
  const W = 1100, H = 200;
  const stride = Math.floor(W / candles.length);
  const bw = Math.max(stride - 4, 4);
  const minP = Math.min(...candles.map(c => c.low));
  const maxP = Math.max(...candles.map(c => c.high));
  const range = maxP - minP || 1;
  const pad = { t: 12, b: 10 };
  const toY = (p: number) => pad.t + ((maxP - p) / range) * (H - pad.t - pad.b);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="cfh" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#070B14" stopOpacity="1" />
          <stop offset="12%" stopColor="#070B14" stopOpacity="0" />
          <stop offset="88%" stopColor="#070B14" stopOpacity="0" />
          <stop offset="100%" stopColor="#070B14" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="cfv" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#070B14" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#070B14" stopOpacity="0" />
        </linearGradient>
      </defs>
      {candles.map((c, i) => {
        const cx = i * stride + stride / 2;
        const up = c.close >= c.open;
        const col = up ? '#00D68A' : '#FF5252';
        const bodyT = toY(Math.max(c.open, c.close));
        const bodyB = toY(Math.min(c.open, c.close));
        const bodyH = Math.max(bodyB - bodyT, 1);
        return (
          <g key={i} opacity="0.82">
            <line x1={cx} y1={toY(c.high)} x2={cx} y2={toY(c.low)} stroke={col} strokeWidth="1" />
            <rect x={i * stride + (stride - bw) / 2} y={bodyT} width={bw} height={bodyH} fill={col} rx="1" />
          </g>
        );
      })}
      <rect x="0" y="0" width={W} height={H} fill="url(#cfh)" />
      <rect x="0" y="0" width={W} height={H} fill="url(#cfv)" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCROLL REVEAL HOOK
   ═══════════════════════════════════════════════════════════════ */
function useScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('apv'); io.unobserve(e.target); }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.aprx').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [candles] = useState(makeCandles);
  const [assets, setAssets] = useState<MarketAsset[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await fetchAssets();
        if (active && Array.isArray(data) && data.length) setAssets(data);
      } catch { /* keep fallback */ }
    }
    load();
    const id = setInterval(load, 30000);
    return () => { active = false; clearInterval(id); };
  }, []);

  useScrollReveal();

  const live = assets.length > 0;

  const tickerData: TickerItem[] = live
    ? assets.map((a) => ({
        sym: displaySym(a.symbol),
        price: fmtPrice(a.price),
        chg: fmtChange(a.changePercent),
        up: a.changePercent >= 0,
        logo: a.logoUrl,
      }))
    : FALLBACK_TICKERS;
  const allTickers = [...tickerData, ...tickerData, ...tickerData];

  const marketRows = live ? assets : FALLBACK_MARKETS;

  const btc = assets.find((a) => a.symbol === 'BTC');
  const midPrice = btc ? btc.price : 67420.50;
  const midChange = btc ? btc.changePercent : 2.38;
  const book = useMemo(() => buildBook(midPrice), [midPrice]);

  const toggleFaq = useCallback((i: number) => {
    setOpenFaq((prev) => (prev === i ? null : i));
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <div className="ap-root">
        {/* ═══ NAV ═══ */}
        <nav className={`ap-nav ${scrolled ? 'ap-nav-scrolled' : ''}`}>
          <div className="ap-nav-beam" />
          <a href="/" className="ap-logo" aria-label="Apex Markets home">
            Apex<span>·</span>Markets
          </a>

          <div className="ap-ticker-wrap" aria-hidden="true">
            <div className="ap-ticker-track">
              {allTickers.map((t, i) => (
                <span key={i} className="ap-ticker-item">
                  {t.logo && (
                    <img src={t.logo} alt="" className="ap-tlogo" loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
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
            <li><a href="#faq">FAQ</a></li>
          </ul>

          <div className="ap-nav-auth">
            <a href="/login" className="ap-nav-login">Log In</a>
            <a href="/signup" className="ap-nav-cta">Sign Up</a>
          </div>

          <button className="ap-mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu" aria-expanded={mobileMenuOpen}>
            <span className={mobileMenuOpen ? 'ap-bar open' : 'ap-bar'} />
            <span className={mobileMenuOpen ? 'ap-bar open' : 'ap-bar'} />
            <span className={mobileMenuOpen ? 'ap-bar open' : 'ap-bar'} />
          </button>
        </nav>

        <div className={`ap-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <a href="#platform" onClick={() => setMobileMenuOpen(false)}>Platform</a>
          <a href="#markets" onClick={() => setMobileMenuOpen(false)}>Markets</a>
          <a href="#trust" onClick={() => setMobileMenuOpen(false)}>Trust</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
          <div className="ap-mobile-auth">
            <a href="/login" className="ap-nav-login">Log In</a>
            <a href="/signup" className="ap-nav-cta">Sign Up</a>
          </div>
        </div>

        {/* ═══ HERO ═══ */}
        <section className="ap-hero">
          <div className="ap-hero-grid" aria-hidden="true" />
          <div className="ap-hero-vignette" aria-hidden="true" />
          <div className="ap-hero-chart"><CandleChart candles={candles} /></div>

          <div className="ap-hero-inner">
            <div className="ap-hero-left">
              <div className="ap-hero-badge">
                <span className="ap-live-dot" />
                <span>Since 2019 · FCA &amp; CySEC Regulated</span>
              </div>
              <h1 className="ap-h1">YOUR CAPITAL<br/><em>YOUR CALL</em><br/>AT ALL TIMES</h1>
              <p className="ap-hero-sub">
                Trade equities, crypto, FX, and derivatives from a single platform.
                Regulated, transparent, and built to handle whatever the market throws at you.
              </p>
              <div className="ap-hero-ctas">
                <a href="/signup" className="ap-btn-primary">
                  Start Trading
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <a href="#platform" className="ap-btn-ghost">
                  See the platform
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
              <div className="ap-stats">
                {[
                  { v: '$4.8B', l: 'Daily volume' },
                  { v: '0.2ms', l: 'Avg. latency' },
                  { v: '180+', l: 'Markets' },
                  { v: '99.9%', l: 'Uptime SLA' },
                ].map((s) => (
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
                    <div className="ap-book-pair"><span className="ap-live-dot" />BTC / USD</div>
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
                    <div className="ap-depth"><div className="ap-dfill ap-dask" style={{ width: `${r.pct}%` }} /></div>
                    <span className="ap-bsz">{r.size}</span>
                  </div>
                ))}
                <div className="ap-spread">
                  <span>SPREAD</span><strong>{book.spread}</strong><span>MID</span><strong>{book.mid}</strong>
                </div>
                {book.bids.map((r, i) => (
                  <div className="ap-book-row" key={`bid-${i}`}>
                    <span className="ap-up">{r.price}</span>
                    <div className="ap-depth"><div className="ap-dfill ap-dbid" style={{ width: `${r.pct}%` }} /></div>
                    <span className="ap-bsz">{r.size}</span>
                  </div>
                ))}
                <div className="ap-trade-btns">
                  <button className="ap-tbtn ap-tbuy" type="button">Buy Market</button>
                  <button className="ap-tbtn ap-tsell" type="button">Sell Market</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ TRUST BAR ═══ */}
        <section className="ap-trust-bar" aria-label="Trust indicators">
          <div className="ap-trust-bar-inner">
            {TRUST_BADGES.map((b) => (
              <div className="ap-trust-badge" key={b.label}>
                <span className="ap-trust-icon">{b.icon}</span>
                <span className="ap-trust-label">{b.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ PARTNERS ═══ */}
        <section className="ap-partners">
          <p className="ap-partners-label">Trusted by professionals at</p>
          <div className="ap-partners-track">
            {PARTNERS.map((p) => <span key={p} className="ap-partner-name">{p}</span>)}
          </div>
        </section>

        {/* ═══ PLATFORM ═══ */}
        <section className="ap-section" id="platform">
          <div className="ap-platform aprx">
            <div className="ap-plat-text">
              <p className="ap-label">01 · Platform</p>
              <h2 className="ap-h2">Every edge,<br/>engineered.</h2>
              <p className="ap-body">Six years of iteration toward a single goal — zero friction between your signal and the market.</p>
              <div className="ap-feat-list">
                {FEATURES.map((f) => (
                  <div className="ap-feat-row" key={f.n}>
                    <span className="ap-feat-n">{f.n}</span>
                    <div><div className="ap-feat-t">{f.title}</div><div className="ap-feat-d">{f.desc}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ap-plat-media">
              <img src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=720&auto=format&fit=crop&q=85"
                alt="Professional trading terminal with multiple chart windows" className="ap-plat-img" loading="lazy" />
              <div className="ap-plat-overlay" />
              <div className="ap-plat-badge"><span className="ap-live-dot" /><span>Live execution engine</span></div>
            </div>
          </div>
        </section>

        {/* ═══ MARKETS ═══ */}
        <section className="ap-section ap-mkt-sec" id="markets">
          <div className="ap-mkt-bg">
            <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1400&auto=format&fit=crop&q=70"
              alt="" className="ap-mkt-bg-img" loading="lazy" />
          </div>
          <div className="ap-mkt-inner aprx">
            <p className="ap-label">02 · Markets</p>
            <h2 className="ap-h2">Everything moves.<br/>Capture it.</h2>
            <p className="ap-body" style={{ maxWidth: '380px', marginBottom: '28px' }}>
              180+ instruments across crypto, equities, FX, and commodities.
            </p>
            <div className="ap-mkt-table">
              <div className="ap-mkt-head">
                <span>Symbol</span><span>Name</span><span className="ap-tr">Price</span><span className="ap-tr">Change</span>
              </div>
              {marketRows.map((m) => (
                <div className="ap-mkt-row" key={m.symbol}>
                  <span className="ap-mkt-sym">
                    {m.logoUrl && (
                      <img src={m.logoUrl} alt="" className="ap-mkt-logo" loading="lazy"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    {m.symbol}
                  </span>
                  <span className="ap-mkt-name">{m.name}</span>
                  <span className="ap-mkt-price ap-tr">{fmtPrice(m.price)}</span>
                  <span className={`ap-tr ${m.changePercent >= 0 ? 'ap-up' : 'ap-dn'}`}>{fmtChange(m.changePercent)}</span>
                </div>
              ))}
            </div>
            <a href="/signup" className="ap-ilink">
              View all 180+ instruments
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </section>

        {/* ═══ METRICS ═══ */}
        <section className="ap-section ap-metrics-sec">
          <div className="ap-metrics aprx">
            <div className="ap-metric">
              <span className="ap-metric-v"><AnimatedCounter value={4800} prefix="$" suffix="B+" /></span>
              <span className="ap-metric-l">Volume traded</span>
            </div>
            <div className="ap-metric">
              <span className="ap-metric-v"><AnimatedCounter value={120} suffix="K+" /></span>
              <span className="ap-metric-l">Active traders</span>
            </div>
            <div className="ap-metric">
              <span className="ap-metric-v"><AnimatedCounter value={180} suffix="+" /></span>
              <span className="ap-metric-l">Markets available</span>
            </div>
            <div className="ap-metric">
              <span className="ap-metric-v"><AnimatedCounter value={99} suffix=".99%" /></span>
              <span className="ap-metric-l">Uptime guaranteed</span>
            </div>
          </div>
        </section>

        {/* ═══ TESTIMONIALS ═══ */}
        <section className="ap-section" id="trust">
          <div className="ap-trust-wrap">
            <p className="ap-label aprx">03 · Trust</p>
            <h2 className="ap-h2 aprx" style={{ marginBottom: '44px' }}>What traders say.</h2>
            <div className="ap-testimonials aprx">
              {TESTIMONIALS.map((t, i) => {
                const [r, g, b] = [0, 2, 4].map((o) => parseInt(t.color.slice(o, o + 2), 16));
                return (
                  <div className="ap-testi" key={i}>
                    <div className="ap-testi-bar" style={{ background: `#${t.color}` }} />
                    <p className="ap-testi-q">"{t.quote}"</p>
                    <div className="ap-testi-attr">
                      <div className="ap-avatar" style={{
                        background: `rgba(${r},${g},${b},0.14)`,
                        borderColor: `rgba(${r},${g},${b},0.4)`,
                        color: `#${t.color}`,
                      }}>
                        {t.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div><div className="ap-tname">{t.name}</div><div className="ap-trole">{t.role}</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══ FAQ ═══ */}
        <section className="ap-section ap-faq-sec" id="faq">
          <div className="ap-faq-wrap aprx">
            <p className="ap-label">04 · FAQ</p>
            <h2 className="ap-h2">Common questions.</h2>
            <div className="ap-faq-list">
              {FAQ_ITEMS.map((item, i) => (
                <div className={`ap-faq-item ${openFaq === i ? 'open' : ''}`} key={i}>
                  <button className="ap-faq-q" onClick={() => toggleFaq(i)} aria-expanded={openFaq === i}>
                    <span>{item.q}</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ap-faq-icon" aria-hidden="true">
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div className="ap-faq-a"><p>{item.a}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section className="ap-section ap-begin-sec" id="begin">
          <div className="ap-begin-inner aprx">
            <p className="ap-label">05 · Begin</p>
            <h2 className="ap-h2">Your edge starts here.</h2>
            <p className="ap-body" style={{ marginBottom: '32px' }}>
              Open a funded account in under 5 minutes. No minimums on demo. Live markets from day one.
            </p>
            <div className="ap-cta-form">
              <input className="ap-cta-input" type="email" placeholder="Enter your email address"
                value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email address" />
              <a href="/signup" className="ap-cta-submit">Get Started</a>
            </div>
            <div className="ap-trust-badges">
              {['FCA & CySEC regulated', 'Negative balance protection', '24/5 desk support', 'Spreads from 0.0 pips'].map(
                (b, i) => <span key={b}>{i > 0 && <span className="ap-dot">·</span>}{b}</span>
              )}
            </div>
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="ap-footer">
          <div className="ap-footer-brand">Apex<span>·</span>Markets</div>
          <ul className="ap-footer-links">
            {['Web Terminal', 'API Access', 'Careers', 'Privacy', 'Terms', 'Risk Disclosure'].map((l) => (
              <li key={l}><a href="#">{l}</a></li>
            ))}
          </ul>
          <span className="ap-footer-legal">© 2026 Apex Markets Ltd. CFDs carry risk. Capital at risk.</span>
        </footer>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Fira+Code:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --void:    #0B1118;
  --void-2:  #0F1924;
  --panel:   rgba(255,255,255,0.025);
  --panel-2: rgba(255,255,255,0.04);
  --rim:     rgba(255,255,255,0.06);
  --rim2:    rgba(255,255,255,0.10);
  --rim3:    rgba(255,255,255,0.16);
  --elec:    #49A5B6;
  --elec-lo: rgba(73,165,182,0.12);
  --elec-hi: #5BC8DB;
  --mint:    #00D68A;
  --mint-dk: #00B876;
  --coral:   #FF5252;
  --coral-dk:#E04545;
  --amber:   #FFB800;
  --t1:      #F0F2F8;
  --t2:      #8A95A8;
  --t3:      #3A4558;
  --t4:      #1E293B;
  --sans:    'DM Sans', system-ui, -apple-system, sans-serif;
  --disp:    'Barlow Condensed', sans-serif;
  --mono:    'Fira Code', 'SF Mono', 'Courier New', monospace;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
}

html { scroll-behavior: smooth; }

.ap-root {
  background: var(--void);
  color: var(--t1);
  font-family: var(--sans);
  overflow-x: hidden;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.ap-up  { color: var(--mint); }
.ap-dn  { color: var(--coral); }
.ap-tr  { text-align: right; }
.ap-tc  { text-align: center; }

/* ═══════════════════════════════════════════════════════════════
   NAV
   ═══════════════════════════════════════════════════════════════ */
.ap-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  display: flex; align-items: center; gap: 24px;
  padding: 0 48px; height: 64px;
  background: rgba(11, 17, 24, 0.75);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border-bottom: 1px solid transparent;
  transition: background 0.3s var(--ease-smooth), border-color 0.3s var(--ease-smooth), box-shadow 0.3s var(--ease-smooth);
}
.ap-nav-scrolled {
  background: rgba(11, 17, 24, 0.92);
  border-bottom-color: var(--rim);
  box-shadow: 0 4px 24px rgba(0,0,0,0.3);
}
.ap-nav-beam {
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent 0%, var(--elec) 25%, var(--mint) 50%, var(--elec) 75%, transparent 100%);
  opacity: 0.7;
}
.ap-logo {
  font-family: var(--disp); font-size: 1.1rem; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--t1); text-decoration: none; flex-shrink: 0;
  transition: opacity 0.2s;
}
.ap-logo:hover { opacity: 0.8; }
.ap-logo span { color: var(--elec); margin: 0 2px; }

.ap-ticker-wrap {
  flex: 1; overflow: hidden; height: 100%;
  display: flex; align-items: center;
  -webkit-mask-image: linear-gradient(to right, transparent, #000 10%, #000 90%, transparent);
  mask-image: linear-gradient(to right, transparent, #000 10%, #000 90%, transparent);
}
.ap-ticker-track {
  display: flex; white-space: nowrap;
  animation: apTicker 50s linear infinite;
}
.ap-ticker-item {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 0 22px;
  font-family: var(--mono); font-size: 0.62rem;
  color: var(--t2); border-right: 1px solid var(--rim);
}
.ap-tsym { color: var(--t1); font-weight: 500; letter-spacing: 0.06em; }
.ap-tprice { font-variant-numeric: tabular-nums; }
.ap-tlogo { width: 14px; height: 14px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }

.ap-nav-links {
  display: flex; gap: 32px; list-style: none; flex-shrink: 0;
}
.ap-nav-links a {
  font-family: var(--mono); font-size: 0.63rem;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--t2); text-decoration: none;
  transition: color 0.25s var(--ease-smooth);
  position: relative;
}
.ap-nav-links a::after {
  content: ''; position: absolute; bottom: -4px; left: 0; width: 0; height: 1px;
  background: var(--elec); transition: width 0.25s var(--ease-smooth);
}
.ap-nav-links a:hover { color: var(--t1); }
.ap-nav-links a:hover::after { width: 100%; }

.ap-nav-auth {
  display: flex; align-items: center; gap: 18px; flex-shrink: 0;
}
.ap-nav-login {
  font-family: var(--mono); font-size: 0.63rem;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--t2); text-decoration: none;
  transition: color 0.25s;
  padding: 8px 0;
}
.ap-nav-login:hover { color: var(--t1); }
.ap-nav-cta {
  font-family: var(--mono); font-size: 0.63rem; font-weight: 500;
  letter-spacing: 0.12em; text-transform: uppercase;
  background: var(--elec); color: #fff;
  padding: 10px 20px; text-decoration: none;
  border-radius: 6px;
  transition: all 0.25s var(--ease-smooth);
  position: relative; overflow: hidden;
}
.ap-nav-cta::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%);
  transform: translateX(-100%);
  transition: transform 0.5s var(--ease-smooth);
}
.ap-nav-cta:hover {
  background: var(--elec-hi);
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(73,165,182,0.25);
}
.ap-nav-cta:hover::before { transform: translateX(100%); }

.ap-mobile-toggle {
  display: none; flex-direction: column; gap: 5px;
  background: none; border: none; cursor: pointer; padding: 8px;
}
.ap-bar {
  display: block; width: 22px; height: 1.5px;
  background: var(--t1); border-radius: 1px;
  transition: all 0.3s var(--ease-smooth);
}
.ap-bar.open:nth-child(1) { transform: rotate(45deg) translate(4px, 4px); }
.ap-bar.open:nth-child(2) { opacity: 0; }
.ap-bar.open:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

.ap-mobile-menu {
  position: fixed; top: 64px; left: 0; right: 0;
  background: rgba(11, 17, 24, 0.98);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--rim);
  padding: 24px;
  display: flex; flex-direction: column; gap: 0;
  transform: translateY(-100%);
  opacity: 0; pointer-events: none;
  transition: all 0.35s var(--ease-out);
  z-index: 99;
}
.ap-mobile-menu.open {
  transform: translateY(0);
  opacity: 1; pointer-events: auto;
}
.ap-mobile-menu a {
  font-family: var(--mono); font-size: 0.85rem;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--t2); text-decoration: none;
  padding: 14px 0; border-bottom: 1px solid var(--rim);
  transition: color 0.2s;
}
.ap-mobile-menu a:hover { color: var(--t1); }
.ap-mobile-auth {
  display: flex; gap: 16px; margin-top: 20px;
}

/* ═══════════════════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════════════════ */
.ap-hero {
  position: relative; min-height: 100vh;
  padding-top: 64px; overflow: hidden;
  display: flex; flex-direction: column;
  justify-content: flex-start;
}
.ap-hero-grid {
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px);
  background-size: 64px 64px;
}
.ap-hero-vignette {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse at 50% 0%, transparent 0%, var(--void) 70%);
}
.ap-hero-chart {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 260px; pointer-events: none; opacity: 0.35;
}
.ap-hero-inner {
  position: relative; z-index: 2;
  display: grid; grid-template-columns: 1fr 440px;
  gap: 80px; padding: 100px 60px 64px;
  flex: 1; align-items: center;
  max-width: 1400px; margin: 0 auto; width: 100%;
}

.ap-hero-badge {
  display: inline-flex; align-items: center; gap: 10px;
  font-family: var(--mono); font-size: 0.61rem;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--elec); margin-bottom: 28px;
  padding: 8px 16px; border-radius: 100px;
  background: var(--elec-lo); border: 1px solid rgba(73,165,182,0.15);
  opacity: 0; animation: apFadeUp 0.6s var(--ease-out) 0.1s forwards;
}
.ap-h1 {
  font-family: var(--disp); font-size: clamp(3.2rem, 7vw, 6.5rem);
  font-weight: 800; line-height: 0.92;
  text-transform: uppercase; letter-spacing: 0.01em;
  color: var(--t1); margin-bottom: 28px;
  opacity: 0; animation: apFadeUp 0.7s var(--ease-out) 0.25s forwards;
}
.ap-h1 em {
  font-style: italic; color: var(--elec); font-weight: 700;
  display: inline-block;
}
.ap-hero-sub {
  font-size: 1.02rem; line-height: 1.8;
  color: var(--t2); font-weight: 300; max-width: 440px; margin-bottom: 40px;
  opacity: 0; animation: apFadeUp 0.7s var(--ease-out) 0.4s forwards;
}
.ap-hero-ctas {
  display: flex; align-items: center; gap: 20px; margin-bottom: 52px;
  opacity: 0; animation: apFadeUp 0.7s var(--ease-out) 0.55s forwards;
}
.ap-btn-primary {
  display: inline-flex; align-items: center; gap: 10px;
  background: var(--elec); color: #fff;
  font-family: var(--mono); font-size: 0.72rem; font-weight: 500;
  letter-spacing: 0.1em; text-transform: uppercase;
  padding: 15px 28px; text-decoration: none; border-radius: 8px;
  transition: all 0.3s var(--ease-smooth);
  position: relative; overflow: hidden;
  border: none; cursor: pointer;
}
.ap-btn-primary::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%);
  transform: translateX(-100%);
  transition: transform 0.6s var(--ease-smooth);
}
.ap-btn-primary:hover {
  background: var(--elec-hi);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(73,165,182,0.3);
}
.ap-btn-primary:hover::before { transform: translateX(100%); }
.ap-btn-primary svg { transition: transform 0.25s; }
.ap-btn-primary:hover svg { transform: translateX(3px); }

.ap-btn-ghost {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--mono); font-size: 0.71rem;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--t2); text-decoration: none;
  padding: 14px 0;
  transition: color 0.25s;
  border: none; background: none; cursor: pointer;
}
.ap-btn-ghost:hover { color: var(--t1); }
.ap-btn-ghost svg { transition: transform 0.25s; }
.ap-btn-ghost:hover svg { transform: translateY(2px); }

.ap-stats {
  display: flex; gap: 0;
  border-top: 1px solid var(--rim);
  opacity: 0; animation: apFadeUp 0.7s var(--ease-out) 0.7s forwards;
}
.ap-stat {
  display: flex; flex-direction: column;
  padding: 20px 32px 20px 0;
  border-right: 1px solid var(--rim); margin-right: 32px;
}
.ap-stat:last-child { border-right: none; margin-right: 0; padding-right: 0; }
.ap-stat-v {
  font-family: var(--mono); font-size: 1.1rem; font-weight: 500;
  color: var(--t1); font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}
.ap-stat-l { font-size: 0.7rem; color: var(--t2); margin-top: 6px; letter-spacing: 0.02em; }

/* ═══════════════════════════════════════════════════════════════
   ORDER BOOK
   ═══════════════════════════════════════════════════════════════ */
.ap-hero-right {
  opacity: 0; animation: apFadeIn 1s var(--ease-out) 0.8s forwards;
}
.ap-book {
  background: rgba(11, 17, 24, 0.95);
  border: 1px solid var(--rim2);
  border-radius: 16px;
  backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  padding: 24px;
  box-shadow:
    0 32px 80px rgba(0,0,0,0.5),
    0 0 0 1px rgba(255,255,255,0.03) inset,
    inset 0 1px 0 rgba(255,255,255,0.06);
  transition: transform 0.4s var(--ease-smooth), box-shadow 0.4s var(--ease-smooth);
}
.ap-book:hover {
  transform: translateY(-4px);
  box-shadow:
    0 40px 100px rgba(0,0,0,0.55),
    0 0 0 1px rgba(255,255,255,0.04) inset,
    inset 0 1px 0 rgba(255,255,255,0.08);
}
.ap-book-head {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding-bottom: 16px; margin-bottom: 12px;
  border-bottom: 1px solid var(--rim);
}
.ap-book-pair {
  display: flex; align-items: center; gap: 8px;
  font-family: var(--mono); font-size: 0.6rem;
  letter-spacing: 0.15em; text-transform: uppercase;
  color: var(--t2); margin-bottom: 10px;
}
.ap-live-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--mint); flex-shrink: 0;
  animation: apPulse 2.5s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(0,214,138,0.4);
}
.ap-book-px {
  font-family: var(--mono); font-size: 1.6rem; font-weight: 500;
  color: var(--t1); font-variant-numeric: tabular-nums; letter-spacing: -0.02em;
  line-height: 1.1;
}
.ap-book-chg { font-family: var(--mono); font-size: 0.68rem; margin-top: 6px; }
.ap-book-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
.ap-meta-item { display: flex; flex-direction: column; align-items: flex-end; }
.ap-ml {
  font-family: var(--mono); font-size: 0.5rem;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--t3); margin-bottom: 3px;
}
.ap-mv { font-family: var(--mono); font-size: 0.82rem; color: var(--t1); font-weight: 500; }
.ap-book-cols {
  display: grid; grid-template-columns: 82px 1fr 58px; gap: 8px;
  padding: 4px 0 10px;
  font-family: var(--mono); font-size: 0.5rem;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--t3);
}
.ap-book-row {
  display: grid; grid-template-columns: 82px 1fr 58px;
  align-items: center; gap: 8px; padding: 4px 0;
  font-family: var(--mono); font-size: 0.68rem; font-variant-numeric: tabular-nums;
  transition: background 0.15s;
  border-radius: 4px;
}
.ap-book-row:hover { background: rgba(255,255,255,0.02); }
.ap-depth {
  position: relative; height: 14px;
  background: rgba(255,255,255,0.02);
  border-radius: 2px; overflow: hidden;
}
.ap-dfill { position: absolute; top: 0; height: 100%; opacity: 0.2; border-radius: 2px; transition: width 0.4s var(--ease-smooth); }
.ap-dask  { right: 0; background: var(--coral); }
.ap-dbid  { left: 0;  background: var(--mint); }
.ap-bsz   { text-align: right; color: var(--t3); }
.ap-spread {
  display: flex; justify-content: center; gap: 14px;
  padding: 8px 0; margin: 4px 0;
  border-top: 1px dashed var(--rim); border-bottom: 1px dashed var(--rim);
  font-family: var(--mono); font-size: 0.55rem;
  letter-spacing: 0.1em; text-transform: uppercase; color: var(--t3);
}
.ap-spread strong { color: var(--t1); font-weight: 500; }
.ap-trade-btns {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 18px;
}
.ap-tbtn {
  font-family: var(--mono); font-size: 0.68rem; font-weight: 500;
  letter-spacing: 0.1em; text-transform: uppercase;
  padding: 12px 8px; border: none; cursor: pointer;
  border-radius: 8px; transition: all 0.25s var(--ease-smooth);
}
.ap-tbtn:hover { transform: translateY(-1px); }
.ap-tbuy  { background: var(--mint);  color: #021a0f; }
.ap-tbuy:hover { background: var(--mint-dk); box-shadow: 0 4px 16px rgba(0,214,138,0.25); }
.ap-tsell { background: var(--coral); color: #200808; }
.ap-tsell:hover { background: var(--coral-dk); box-shadow: 0 4px 16px rgba(255,82,82,0.25); }

/* ═══════════════════════════════════════════════════════════════
   TRUST BAR
   ═══════════════════════════════════════════════════════════════ */
.ap-trust-bar {
  background: var(--void-2);
  border-top: 1px solid var(--rim);
  border-bottom: 1px solid var(--rim);
  padding: 20px 60px;
}
.ap-trust-bar-inner {
  max-width: 1200px; margin: 0 auto;
  display: flex; justify-content: center; gap: 48px; flex-wrap: wrap;
}
.ap-trust-badge {
  display: flex; align-items: center; gap: 10px;
  font-size: 0.78rem; color: var(--t2);
}
.ap-trust-icon { font-size: 1.1rem; opacity: 0.7; }
.ap-trust-label { letter-spacing: 0.01em; }

/* ═══════════════════════════════════════════════════════════════
   PARTNERS
   ═══════════════════════════════════════════════════════════════ */
.ap-partners {
  padding: 48px 60px;
  border-bottom: 1px solid var(--rim);
  text-align: center;
}
.ap-partners-label {
  font-family: var(--mono); font-size: 0.58rem;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--t3); margin-bottom: 24px;
}
.ap-partners-track {
  display: flex; justify-content: center; gap: 56px; flex-wrap: wrap;
  align-items: center;
}
.ap-partner-name {
  font-family: var(--disp); font-size: 1.15rem; font-weight: 600;
  color: var(--t3); letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: color 0.3s;
  cursor: default;
}
.ap-partner-name:hover { color: var(--t2); }

/* ═══════════════════════════════════════════════════════════════
   SHARED SECTION
   ═══════════════════════════════════════════════════════════════ */
.ap-section {
  padding: 120px 60px; border-top: 1px solid var(--rim); position: relative;
}
.ap-label {
  font-family: var(--mono); font-size: 0.61rem;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--elec); margin-bottom: 16px;
}
.ap-h2 {
  font-family: var(--disp); font-size: clamp(2rem, 3.8vw, 3.4rem);
  font-weight: 700; line-height: 1.05; text-transform: uppercase;
  letter-spacing: 0.01em; color: var(--t1); margin-bottom: 20px;
}
.ap-body {
  font-size: 0.96rem; line-height: 1.8;
  color: var(--t2); font-weight: 300; max-width: 480px; margin-bottom: 40px;
}

/* ═══════════════════════════════════════════════════════════════
   PLATFORM
   ═══════════════════════════════════════════════════════════════ */
.ap-platform {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 80px; align-items: center;
  max-width: 1200px; margin: 0 auto;
}
.ap-feat-list { border-top: 1px solid var(--rim); }
.ap-feat-row {
  display: grid; grid-template-columns: 36px 1fr; gap: 18px;
  padding: 22px 0; border-bottom: 1px solid var(--rim);
  transition: padding-left 0.3s var(--ease-smooth), background 0.3s;
  cursor: default; border-radius: 0 8px 8px 0;
}
.ap-feat-row:hover {
  padding-left: 12px;
  background: linear-gradient(90deg, var(--elec-lo), transparent 60%);
}
.ap-feat-n {
  font-family: var(--mono); font-size: 0.58rem;
  color: var(--elec); font-weight: 500; padding-top: 3px;
  letter-spacing: 0.05em;
}
.ap-feat-t { font-size: 0.94rem; font-weight: 500; color: var(--t1); margin-bottom: 6px; letter-spacing: -0.01em; }
.ap-feat-d { font-size: 0.82rem; line-height: 1.7; color: var(--t2); font-weight: 300; }

.ap-plat-media {
  position: relative; border: 1px solid var(--rim); overflow: hidden;
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.4);
  transition: transform 0.5s var(--ease-smooth), box-shadow 0.5s var(--ease-smooth);
}
.ap-plat-media:hover {
  transform: translateY(-6px);
  box-shadow: 0 32px 80px rgba(0,0,0,0.5);
}
.ap-plat-img {
  display: block; width: 100%; aspect-ratio: 4/3;
  object-fit: cover; filter: saturate(0.4) brightness(0.55);
  transition: filter 0.5s var(--ease-smooth);
}
.ap-plat-media:hover .ap-plat-img { filter: saturate(0.5) brightness(0.6); }
.ap-plat-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(73,165,182,0.15) 0%, transparent 55%);
}
.ap-plat-badge {
  position: absolute; bottom: 20px; left: 20px;
  display: flex; align-items: center; gap: 8px;
  background: rgba(11,17,24,0.9); border: 1px solid var(--rim2);
  padding: 10px 16px; border-radius: 8px;
  backdrop-filter: blur(12px);
  font-family: var(--mono); font-size: 0.62rem;
  letter-spacing: 0.1em; text-transform: uppercase; color: var(--t1);
}

/* ═══════════════════════════════════════════════════════════════
   MARKETS
   ═══════════════════════════════════════════════════════════════ */
.ap-mkt-sec { overflow: hidden; }
.ap-mkt-bg {
  position: absolute; inset: 0; z-index: 0;
}
.ap-mkt-bg-img {
  width: 100%; height: 100%;
  object-fit: cover; opacity: 0.06; filter: saturate(0) brightness(1.2);
}
.ap-mkt-inner { position: relative; z-index: 1; max-width: 820px; }
.ap-mkt-table {
  background: rgba(11, 21, 27, 0.8); border: 1px solid var(--rim2);
  backdrop-filter: blur(12px); margin-bottom: 24px; overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}
.ap-mkt-head {
  display: grid; grid-template-columns: 90px 1fr 130px 130px;
  padding: 12px 24px; background: rgba(255,255,255,0.03);
  border-bottom: 1px solid var(--rim);
  font-family: var(--mono); font-size: 0.55rem;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--t3);
}
.ap-mkt-row {
  display: grid; grid-template-columns: 90px 1fr 130px 130px;
  padding: 14px 24px; border-bottom: 1px solid var(--rim);
  font-family: var(--mono); font-size: 0.76rem;
  align-items: center; font-variant-numeric: tabular-nums;
  transition: background 0.15s; cursor: default;
}
.ap-mkt-row:last-child { border-bottom: none; }
.ap-mkt-row:hover { background: rgba(255,255,255,0.025); }
.ap-mkt-sym   { font-weight: 500; color: var(--t1); display: flex; align-items: center; gap: 8px; }
.ap-mkt-logo  { width: 18px; height: 18px; border-radius: 50%; object-fit: cover; flex-shrink: 0; background: rgba(255,255,255,0.06); }
.ap-mkt-name  { font-size: 0.72rem; color: var(--t2); }
.ap-mkt-price { color: var(--t1); }
.ap-ilink {
  font-family: var(--mono); font-size: 0.69rem;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--elec); text-decoration: none;
  display: inline-flex; align-items: center; gap: 6px;
  transition: opacity 0.2s;
}
.ap-ilink:hover { opacity: 0.7; }
.ap-ilink svg { transition: transform 0.25s; }
.ap-ilink:hover svg { transform: translateX(3px); }

/* ═══════════════════════════════════════════════════════════════
   METRICS
   ═══════════════════════════════════════════════════════════════ */
.ap-metrics-sec {
  background: linear-gradient(180deg, var(--void) 0%, var(--void-2) 50%, var(--void) 100%);
  border-top: 1px solid var(--rim);
  border-bottom: 1px solid var(--rim);
}
.ap-metrics {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 40px; max-width: 1000px; margin: 0 auto;
  text-align: center;
}
.ap-metric {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px;
}
.ap-metric-v {
  font-family: var(--mono); font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 500; color: var(--t1);
  font-variant-numeric: tabular-nums;
}
.ap-metric-l {
  font-size: 0.75rem; color: var(--t2); letter-spacing: 0.04em;
}

/* ═══════════════════════════════════════════════════════════════
   TESTIMONIALS
   ═══════════════════════════════════════════════════════════════ */
.ap-trust-wrap { max-width: 1200px; margin: 0 auto; }
.ap-testimonials {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
}
.ap-testi {
  background: var(--panel); border: 1px solid var(--rim);
  padding: 28px 24px 24px; position: relative;
  overflow: hidden; transition: border-color 0.25s, transform 0.3s var(--ease-smooth);
  cursor: default; border-radius: 12px;
}
.ap-testi:hover {
  border-color: var(--rim2);
  transform: translateY(-4px);
}
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

/* ═══════════════════════════════════════════════════════════════
   FAQ
   ═══════════════════════════════════════════════════════════════ */
.ap-faq-sec { background: linear-gradient(135deg, rgba(73,165,182,0.03) 0%, transparent 50%); }
.ap-faq-wrap { max-width: 720px; margin: 0 auto; }
.ap-faq-list { border-top: 1px solid var(--rim); }
.ap-faq-item {
  border-bottom: 1px solid var(--rim);
  overflow: hidden;
}
.ap-faq-q {
  display: flex; justify-content: space-between; align-items: center;
  width: 100%; padding: 20px 0;
  background: none; border: none; cursor: pointer;
  font-family: var(--sans); font-size: 0.92rem; font-weight: 500;
  color: var(--t1); text-align: left;
  transition: color 0.2s;
}
.ap-faq-q:hover { color: var(--elec); }
.ap-faq-icon {
  flex-shrink: 0; margin-left: 16px;
  transition: transform 0.3s var(--ease-smooth);
  color: var(--t3);
}
.ap-faq-item.open .ap-faq-icon { transform: rotate(180deg); color: var(--elec); }
.ap-faq-a {
  max-height: 0; overflow: hidden;
  transition: max-height 0.4s var(--ease-out), opacity 0.3s;
  opacity: 0;
}
.ap-faq-item.open .ap-faq-a {
  max-height: 200px;
  opacity: 1;
}
.ap-faq-a p {
  font-size: 0.85rem; line-height: 1.7;
  color: var(--t2); font-weight: 300;
  padding-bottom: 20px; max-width: 600px;
}

/* ═══════════════════════════════════════════════════════════════
   BEGIN / CTA
   ═══════════════════════════════════════════════════════════════ */
.ap-begin-sec {
  background: linear-gradient(135deg, rgba(73,165,182,0.05) 0%, transparent 60%);
  border-top: 1px solid rgba(73,165,182,0.18);
}
.ap-begin-inner { max-width: 520px; }
.ap-cta-form { display: flex; margin-bottom: 22px; }
.ap-cta-input {
  flex: 1; background: rgba(255,255,255,0.04);
  border: 1px solid var(--rim2); border-right: none;
  padding: 14px 18px; border-radius: 8px 0 0 8px;
  font-family: var(--mono); font-size: 0.75rem; color: var(--t1);
  outline: none; transition: border-color 0.2s;
}
.ap-cta-input::placeholder { color: var(--t3); }
.ap-cta-input:focus { border-color: var(--elec); }
.ap-cta-submit {
  background: var(--elec); color: #fff; border: none;
  padding: 14px 26px; border-radius: 0 8px 8px 0;
  font-family: var(--mono); font-size: 0.69rem; font-weight: 500;
  letter-spacing: 0.1em; text-transform: uppercase;
  cursor: pointer; white-space: nowrap;
  transition: background 0.2s;
  display: inline-flex; align-items: center; justify-content: center;
  text-decoration: none;
}
.ap-cta-submit:hover { background: var(--elec-hi); }
.ap-trust-badges {
  display: flex; flex-wrap: wrap; gap: 4px 0;
  font-size: 0.74rem; color: var(--t2); align-items: center;
}
.ap-dot { margin: 0 8px; color: var(--elec); opacity: 0.4; }

/* ═══════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════ */
.ap-footer {
  background: rgba(4,6,12,0.8); border-top: 1px solid var(--rim);
  padding: 28px 60px;
  display: flex; justify-content: space-between;
  align-items: center; flex-wrap: wrap; gap: 16px;
}
.ap-footer-brand {
  font-family: var(--disp); font-size: 0.95rem; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase; color: var(--t1);
}
.ap-footer-brand span { color: var(--elec); }
.ap-footer-links { display: flex; gap: 24px; flex-wrap: wrap; list-style: none; }
.ap-footer-links a {
  font-family: var(--mono); font-size: 0.61rem;
  letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--t2); text-decoration: none; transition: color 0.2s;
}
.ap-footer-links a:hover { color: var(--t1); }
.ap-footer-legal { font-family: var(--mono); font-size: 0.57rem; color: var(--t3); }

/* ═══════════════════════════════════════════════════════════════
   ANIMATIONS
   ═══════════════════════════════════════════════════════════════ */
@keyframes apFadeUp  { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
@keyframes apFadeIn  { from { opacity: 0; } to { opacity: 1; } }
@keyframes apPulse   { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
@keyframes apTicker  { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }

.aprx { opacity: 0; transform: translateY(24px); transition: opacity 0.75s ease, transform 0.75s ease; }
.aprx.apv { opacity: 1; transform: none; }

/* ═══════════════════════════════════════════════════════════════
   RESPONSIVE
   ═══════════════════════════════════════════════════════════════ */
@media (max-width: 1100px) {
  .ap-hero-inner { grid-template-columns: 1fr; gap: 60px; }
  .ap-hero-right { max-width: 440px; margin: 0 auto; width: 100%; }
  .ap-platform { grid-template-columns: 1fr; gap: 48px; }
  .ap-testimonials { grid-template-columns: 1fr; gap: 16px; }
  .ap-metrics { grid-template-columns: repeat(2, 1fr); gap: 32px; }
}
@media (max-width: 900px) {
  .ap-ticker-wrap { display: none; }
  .ap-nav-links { display: none; }
  .ap-mobile-toggle { display: flex; }
  .ap-hero-right { display: none; }
  .ap-plat-img { aspect-ratio: 16/9; }
  .ap-mkt-head, .ap-mkt-row { grid-template-columns: 80px 1fr 100px; }
  .ap-mkt-head span:last-child, .ap-mkt-row span:last-child { display: none; }
}
@media (max-width: 640px) {
  .ap-nav { padding: 0 20px; gap: 16px; }
  .ap-section, .ap-mkt-sec { padding: 80px 24px; }
  .ap-hero-inner { padding: 60px 24px 48px; }
  .ap-trust-bar { padding: 20px 24px; }
  .ap-trust-bar-inner { gap: 20px; }
  .ap-partners { padding: 36px 24px; }
  .ap-partners-track { gap: 28px; }
  .ap-footer { padding: 24px 24px; flex-direction: column; align-items: flex-start; }
  .ap-metrics { grid-template-columns: 1fr 1fr; gap: 24px; }
  .ap-stats { flex-wrap: wrap; gap: 16px 0; }
  .ap-stat { padding: 16px 20px 16px 0; margin-right: 20px; }
}
@media (max-width: 420px) {
  .ap-metrics { grid-template-columns: 1fr; gap: 24px; }
  .ap-hero-ctas { flex-direction: column; align-items: flex-start; gap: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .ap-eyebrow,.ap-h1,.ap-hero-sub,.ap-hero-ctas,.ap-stats,.ap-hero-right,.aprx {
    animation: none !important; opacity: 1 !important; transform: none !important;
  }
  .ap-live-dot,.ap-ticker-track { animation: none !important; }
  .ap-faq-a { transition: none; }
  .ap-faq-item.open .ap-faq-a { max-height: none; }
}
`;
