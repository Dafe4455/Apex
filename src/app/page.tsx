'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function HomePage() {
  // Scroll reveal
  const revealRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Order book data — a deliberate replacement for the generic price-chart hero card.
  const asks = [
    { price: '67,430.10', size: '0.842', pct: 30 },
    { price: '67,427.85', size: '0.615', pct: 22 },
    { price: '67,425.40', size: '1.203', pct: 45 },
    { price: '67,423.15', size: '0.392', pct: 14 },
    { price: '67,421.00', size: '0.558', pct: 20 },
  ];
  const bids = [
    { price: '67,419.80', size: '0.674', pct: 24 },
    { price: '67,417.55', size: '1.488', pct: 53 },
    { price: '67,415.30', size: '0.291', pct: 11 },
    { price: '67,412.90', size: '0.926', pct: 33 },
    { price: '67,410.60', size: '0.512', pct: 19 },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --paper: #f0f7f7;
          --paper-deep: #d8d6cb;
          --paper-text: #1c1a17;
          --paper-text-dim: #6b6a62;
          --line: #c7c4b7;

          --graphite: #1b1815;
          --graphite-deep: #131110;
          --graphite-raised: #221e1a;
          --line-dark: #322d27;
          --on-graphite: #ece8de;
          --on-graphite-dim: #8c867a;

          --brass: #b9893a;
          --brass-deep: #8f6a2b;
          --bid: #7c9c84;
          --ask: #b15c43;

          --display: 'Space Grotesk', sans-serif;
          --body: 'IBM Plex Sans', sans-serif;
          --mono: 'IBM Plex Mono', monospace;
        }

        .lp-root {
          background: var(--paper);
          color: var(--paper-text);
          font-family: var(--body);
          overflow-x: hidden;
        }

        a:focus-visible, button:focus-visible, input:focus-visible {
          outline: 2px solid var(--brass);
          outline-offset: 2px;
        }

        /* faint ledger ruling — ties the hero back to a paper trail rather than a generic dot-grid */
        .lp-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent 35px,
            rgba(28,26,23,0.035) 36px
          );
          pointer-events: none;
          z-index: 1;
        }

        /* ── NAV ── */
        .lp-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 60px;
          background: linear-gradient(to bottom, var(--paper) 55%, transparent);
        }
        .lp-logo {
          font-family: var(--display);
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--paper-text);
          text-transform: uppercase;
          text-decoration: none;
        }
        .lp-logo span { color: var(--brass); }
        .lp-nav-links {
          display: flex;
          gap: 40px;
          list-style: none;
        }
        .lp-nav-links a {
          font-family: var(--mono);
          font-size: 0.7rem;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: var(--paper-text-dim);
          text-decoration: none;
          position: relative;
          transition: color 0.2s;
        }
        .lp-nav-links a::after {
          content: '';
          position: absolute;
          bottom: -3px; left: 0;
          width: 0; height: 1px;
          background: var(--brass);
          transition: width 0.25s ease;
        }
        .lp-nav-links a:hover { color: var(--paper-text); }
        .lp-nav-links a:hover::after { width: 100%; }
        .lp-nav-cta {
          font-family: var(--mono);
          font-size: 0.7rem;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          background: var(--graphite);
          color: var(--on-graphite);
          padding: 10px 22px;
          border: none;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          text-decoration: none;
          display: inline-block;
        }
        .lp-nav-cta:hover { background: var(--brass); color: var(--graphite-deep); }

        /* ── HERO ── */
        .lp-hero {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          padding: 130px 60px 80px;
          position: relative;
          gap: 60px;
        }
        .lp-hero-left { position: relative; z-index: 2; }

        .lp-hero-tag {
          font-family: var(--mono);
          font-size: 0.68rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--brass-deep);
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
          opacity: 0;
          animation: fadeUp 0.7s ease 0.2s forwards;
        }
        .lp-hero-tag::before {
          content: '';
          display: inline-block;
          width: 28px; height: 1px;
          background: var(--brass-deep);
        }
        .lp-h1 {
          font-family: var(--display);
          font-size: clamp(2.7rem, 4.6vw, 4.1rem);
          line-height: 1.08;
          font-weight: 700;
          color: var(--paper-text);
          margin-bottom: 28px;
          letter-spacing: -0.01em;
          opacity: 0;
          animation: fadeUp 0.8s ease 0.35s forwards;
        }
        .lp-h1 em {
          font-style: normal;
          color: inherit;
          text-decoration: underline;
          text-decoration-color: var(--brass);
          text-decoration-thickness: 3px;
          text-underline-offset: 7px;
        }
        .lp-hero-sub {
          font-size: 1rem;
          line-height: 1.7;
          color: var(--paper-text-dim);
          max-width: 440px;
          margin-bottom: 46px;
          font-weight: 300;
          opacity: 0;
          animation: fadeUp 0.8s ease 0.5s forwards;
        }
        .lp-hero-actions {
          display: flex;
          align-items: center;
          gap: 24px;
          opacity: 0;
          animation: fadeUp 0.8s ease 0.65s forwards;
        }
        .lp-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: var(--brass);
          color: var(--graphite-deep);
          font-family: var(--mono);
          font-size: 0.76rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 15px 30px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
        }
        .lp-btn-primary:hover { background: var(--brass-deep); transform: translateY(-1px); }
        .lp-btn-ghost {
          font-family: var(--mono);
          font-size: 0.74rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--paper-text-dim);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          padding-bottom: 2px;
          border-bottom: 1px solid var(--line);
          transition: color 0.2s, border-color 0.2s;
        }
        .lp-btn-ghost:hover { color: var(--brass-deep); border-color: var(--brass-deep); }

        /* ── HERO RIGHT — order book card ── */
        .lp-hero-right {
          position: relative;
          z-index: 2;
          opacity: 0;
          animation: fadeIn 1s ease 0.8s forwards;
        }
        .lp-book-card {
          background: var(--graphite);
          border: 1px solid var(--line-dark);
          padding: 24px 24px 18px;
          box-shadow: 0 30px 60px rgba(19,17,16,0.25);
          position: relative;
        }
        .lp-book-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 18px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--line-dark);
        }
        .lp-book-eyebrow {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: var(--mono);
          font-size: 0.66rem;
          letter-spacing: 0.14em;
          color: var(--on-graphite-dim);
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .lp-live-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--bid);
          animation: pulse 2s ease-in-out infinite;
        }
        .lp-book-price {
          font-family: var(--mono);
          font-size: 1.7rem;
          font-weight: 500;
          color: var(--on-graphite);
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .lp-book-change {
          font-family: var(--mono);
          font-size: 0.7rem;
          color: var(--bid);
          margin-top: 6px;
          letter-spacing: 0.04em;
        }
        .lp-book-controls { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
        .lp-book-controls-label {
          font-family: var(--mono);
          font-size: 0.58rem;
          letter-spacing: 0.1em;
          color: var(--on-graphite-dim);
          text-transform: uppercase;
        }
        .lp-tick-row { display: flex; gap: 5px; }
        .lp-tick-btn {
          font-family: var(--mono);
          font-size: 0.62rem;
          color: #6b665c;
          background: transparent;
          border: 1px solid var(--line-dark);
          padding: 4px 8px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .lp-tick-btn.active { color: var(--on-graphite); border-color: var(--brass); background: rgba(185,137,58,0.12); }

        .lp-book {
          font-family: var(--mono);
          font-size: 0.74rem;
          font-variant-numeric: tabular-nums;
        }
        .lp-book-row {
          display: grid;
          grid-template-columns: 78px 1fr 58px;
          align-items: center;
          gap: 10px;
          padding: 2.5px 0;
        }
        .lp-book-price-ask { color: var(--ask); }
        .lp-book-price-bid { color: var(--bid); }
        .lp-book-size { color: var(--on-graphite-dim); text-align: right; }
        .lp-book-track { position: relative; height: 14px; background: rgba(255,255,255,0.025); }
        .lp-book-fill {
          position: absolute;
          top: 0; height: 100%;
          opacity: 0.3;
        }
        .lp-book-fill.ask { right: 0; background: var(--ask); }
        .lp-book-fill.bid { left: 0; background: var(--bid); }

        .lp-book-spread {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 9px 2px;
          margin: 5px 0;
          border-top: 1px dashed var(--line-dark);
          border-bottom: 1px dashed var(--line-dark);
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--on-graphite-dim);
        }
        .lp-book-spread strong { color: var(--on-graphite); font-weight: 500; }

        .lp-book-footer {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 1px;
          margin-top: 18px;
          background: var(--line-dark);
        }
        .lp-book-stat { background: var(--graphite-raised); padding: 11px 13px; }
        .lp-book-stat-label {
          font-family: var(--mono);
          font-size: 0.58rem;
          letter-spacing: 0.1em;
          color: #6b665c;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .lp-book-stat-val {
          font-family: var(--mono);
          font-size: 0.82rem;
          color: var(--on-graphite);
          font-weight: 500;
        }

        .lp-float-badge {
          position: absolute;
          bottom: -22px; left: -24px;
          background: var(--paper);
          border-left: 3px solid var(--brass);
          padding: 13px 18px;
          box-shadow: 0 14px 28px rgba(19,17,16,0.14);
          opacity: 0;
          animation: fadeUp 0.6s ease 1.6s forwards;
        }
        .lp-float-badge-label {
          font-family: var(--mono);
          font-size: 0.58rem;
          letter-spacing: 0.1em;
          color: var(--paper-text-dim);
          text-transform: uppercase;
        }
        .lp-float-badge-val {
          font-family: var(--mono);
          font-size: 1rem;
          font-weight: 500;
          color: var(--paper-text);
          margin-top: 3px;
          font-variant-numeric: tabular-nums;
        }
        .lp-float-badge-sub {
          font-family: var(--mono);
          font-size: 0.6rem;
          color: var(--bid);
        }

        /* ── TICKER ── */
        .lp-ticker {
          background: var(--graphite-deep);
          padding: 13px 0;
          overflow: hidden;
          position: relative;
          z-index: 2;
        }
        .lp-ticker-inner {
          display: flex;
          animation: scrollTicker 34s linear infinite;
          white-space: nowrap;
        }
        .lp-ticker-item {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 0 34px;
          font-family: var(--mono);
          font-size: 0.7rem;
          letter-spacing: 0.06em;
          color: #6b665c;
          border-right: 1px solid var(--line-dark);
          font-variant-numeric: tabular-nums;
        }
        .lp-ticker-item .sym { color: var(--on-graphite); font-weight: 500; }
        .lp-ticker-item .up { color: var(--bid); }
        .lp-ticker-item .dn { color: var(--ask); }

        /* ── STATS BAND ── */
        .lp-stats-band {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: var(--line);
          position: relative;
          z-index: 2;
        }
        .lp-stat-cell {
          background: var(--paper);
          padding: 38px 34px;
          position: relative;
          overflow: hidden;
          transition: background 0.25s;
        }
        .lp-stat-cell:hover { background: var(--graphite-deep); }
        .lp-stat-n {
          font-family: var(--display);
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--paper-text);
          line-height: 1;
          margin-bottom: 9px;
          font-variant-numeric: tabular-nums;
          transition: color 0.25s;
        }
        .lp-stat-cell:hover .lp-stat-n { color: var(--brass); }
        .lp-stat-label {
          font-family: var(--body);
          font-size: 0.78rem;
          color: var(--paper-text-dim);
          font-weight: 400;
          line-height: 1.5;
          transition: color 0.25s;
        }
        .lp-stat-cell:hover .lp-stat-label { color: var(--on-graphite-dim); }
        .lp-stat-bar {
          position: absolute;
          bottom: 0; left: 0;
          height: 2px;
          background: var(--brass);
          width: 0;
          transition: width 0.7s ease;
        }
        .lp-stat-cell:hover .lp-stat-bar { width: 100%; }

        /* ── FEATURES ── */
        .lp-features { padding: 100px 60px; position: relative; }
        .lp-section-label {
          font-family: var(--mono);
          font-size: 0.68rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--brass-deep);
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .lp-section-label::before {
          content: '';
          display: inline-block;
          width: 24px; height: 1px;
          background: var(--brass-deep);
        }
        .lp-section-title {
          font-family: var(--display);
          font-size: clamp(1.8rem, 3vw, 2.6rem);
          font-weight: 700;
          color: var(--paper-text);
          line-height: 1.15;
          margin-bottom: 16px;
          max-width: 520px;
          letter-spacing: -0.01em;
        }
        .lp-features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: var(--line);
          margin-top: 56px;
        }
        .lp-feature-card {
          background: var(--paper);
          padding: 42px 38px;
          position: relative;
          overflow: hidden;
          transition: background 0.2s;
        }
        .lp-feature-card:hover { background: var(--paper-deep); }
        .lp-feature-card:first-child { grid-row: span 2; }
        .lp-feature-icon {
          width: 42px; height: 42px;
          border: 1px solid var(--line);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 26px;
          color: var(--brass-deep);
          transition: border-color 0.2s, background 0.2s;
        }
        .lp-feature-card:hover .lp-feature-icon {
          border-color: var(--brass);
          background: rgba(185,137,58,0.08);
        }
        .lp-feature-title {
          font-family: var(--display);
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--paper-text);
          margin-bottom: 13px;
          line-height: 1.25;
        }
        .lp-feature-card:first-child .lp-feature-title { font-size: 1.7rem; margin-bottom: 18px; }
        .lp-feature-desc {
          font-size: 0.87rem;
          line-height: 1.75;
          color: var(--paper-text-dim);
          font-weight: 300;
        }
        .lp-feature-tag {
          display: inline-block;
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: var(--brass-deep);
          border: 1px solid rgba(185,137,58,0.35);
          padding: 4px 10px;
          margin-top: 22px;
        }

        /* ── MARQUEE — restyled as a wire crawl, not a poster ── */
        .lp-marquee {
          padding: 30px 0;
          overflow: hidden;
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
        }
        .lp-marquee-inner {
          display: flex;
          animation: scrollMarquee 26s linear infinite;
          white-space: nowrap;
        }
        .lp-marquee-item {
          display: inline-flex;
          align-items: center;
          gap: 28px;
          padding: 0 30px;
          font-family: var(--mono);
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--paper-text-dim);
          user-select: none;
        }
        .lp-marquee-dot { color: var(--brass); flex-shrink: 0; }

        /* ── INSTRUMENTS ── */
        .lp-instruments {
          padding: 100px 60px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }
        .lp-asset-rows {
          display: flex;
          flex-direction: column;
          gap: 1px;
          background: var(--line);
        }
        .lp-asset-row {
          background: var(--paper);
          display: grid;
          grid-template-columns: auto 1fr auto auto;
          align-items: center;
          padding: 15px 20px;
          gap: 16px;
          transition: background 0.15s;
          cursor: default;
        }
        .lp-asset-row:hover { background: var(--paper-deep); }
        .lp-asset-row.header { background: var(--graphite-deep); pointer-events: none; }
        .lp-asset-dot { width: 6px; height: 6px; background: var(--brass); }
        .lp-asset-sym {
          font-family: var(--mono);
          font-size: 0.74rem;
          font-weight: 500;
          color: var(--paper-text);
          letter-spacing: 0.06em;
          min-width: 56px;
        }
        .lp-asset-name { font-size: 0.78rem; color: var(--paper-text-dim); }
        .lp-asset-price { font-family: var(--mono); font-size: 0.8rem; color: var(--paper-text); text-align: right; font-variant-numeric: tabular-nums; }
        .lp-asset-chg { font-family: var(--mono); font-size: 0.72rem; text-align: right; min-width: 56px; font-variant-numeric: tabular-nums; }
        .lp-asset-row.header .lp-asset-sym,
        .lp-asset-row.header .lp-asset-name,
        .lp-asset-row.header .lp-asset-price,
        .lp-asset-row.header .lp-asset-chg { color: #6b665c !important; font-size: 0.62rem; letter-spacing: 0.1em; }
        .lp-asset-row.header .lp-asset-dot { background: #6b665c; }
        .up { color: var(--bid); }
        .dn { color: var(--ask); }

        /* ── TESTIMONIALS ── */
        .lp-testimonials {
          background: var(--graphite-deep);
          padding: 100px 60px;
          position: relative;
          overflow: hidden;
        }
        .lp-testimonial-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1px;
          background: var(--line-dark);
        }
        .lp-tcard {
          background: var(--graphite);
          padding: 38px 34px;
          position: relative;
        }
        .lp-tcard::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 36px; height: 2px;
          background: var(--brass);
        }
        .lp-tcard-quote {
          font-family: var(--body);
          font-style: italic;
          font-size: 0.98rem;
          color: var(--on-graphite-dim);
          line-height: 1.7;
          margin-bottom: 26px;
        }
        .lp-tcard-author { display: flex; align-items: center; gap: 12px; }
        .lp-tcard-avatar {
          width: 34px; height: 34px;
          background: var(--brass);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--mono);
          font-size: 0.66rem;
          font-weight: 600;
          color: var(--graphite-deep);
          flex-shrink: 0;
        }
        .lp-tcard-name {
          font-family: var(--mono);
          font-size: 0.68rem;
          letter-spacing: 0.07em;
          color: var(--on-graphite);
          text-transform: uppercase;
        }
        .lp-tcard-role { font-size: 0.72rem; color: #6b665c; margin-top: 2px; }

        /* ── CTA ── */
        .lp-cta {
          padding: 110px 60px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 80px;
          position: relative;
          border-top: 1px solid var(--line);
        }
        .lp-cta-h2 {
          font-family: var(--display);
          font-size: clamp(1.9rem, 3vw, 2.7rem);
          font-weight: 700;
          color: var(--paper-text);
          line-height: 1.15;
          margin-bottom: 18px;
          letter-spacing: -0.01em;
        }
        .lp-cta-h2 em {
          font-style: normal;
          color: inherit;
          text-decoration: underline;
          text-decoration-color: var(--brass);
          text-decoration-thickness: 3px;
          text-underline-offset: 6px;
        }
        .lp-cta-p {
          font-size: 0.92rem;
          line-height: 1.75;
          color: var(--paper-text-dim);
          font-weight: 300;
          margin-bottom: 34px;
          max-width: 420px;
        }
        .lp-cta-form { display: flex; }
        .lp-cta-input {
          flex: 1;
          background: transparent;
          border: 1px solid var(--line);
          border-right: none;
          padding: 14px 18px;
          font-family: var(--mono);
          font-size: 0.78rem;
          color: var(--paper-text);
          outline: none;
          transition: border-color 0.2s;
        }
        .lp-cta-input::placeholder { color: var(--paper-text-dim); }
        .lp-cta-input:focus { border-color: var(--graphite); }
        .lp-cta-submit {
          background: var(--brass);
          color: var(--graphite-deep);
          border: none;
          padding: 14px 26px;
          font-family: var(--mono);
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s;
        }
        .lp-cta-submit:hover { background: var(--brass-deep); }
        .lp-cta-right { padding: 0 0 0 44px; border-left: 1px solid var(--line); }
        .lp-trust-items { display: flex; flex-direction: column; gap: 18px; }
        .lp-trust-item { display: flex; gap: 14px; align-items: flex-start; }
        .lp-trust-mark {
          color: var(--brass-deep);
          font-family: var(--mono);
          margin-top: 3px;
        }
        .lp-trust-text { font-size: 0.87rem; line-height: 1.6; color: var(--paper-text-dim); font-weight: 300; }
        .lp-trust-text strong { font-weight: 600; color: var(--paper-text); }

        /* ── FOOTER ── */
        .lp-footer { background: var(--graphite-deep); padding: 56px 60px 36px; }
        .lp-footer-top {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 60px;
          padding-bottom: 44px;
          border-bottom: 1px solid var(--line-dark);
          margin-bottom: 30px;
        }
        .lp-footer-brand {
          font-family: var(--display);
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--on-graphite);
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .lp-footer-brand span { color: var(--brass); }
        .lp-footer-desc { font-size: 0.82rem; line-height: 1.7; color: #6b665c; font-weight: 300; }
        .lp-footer-col-title {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #5a564d;
          margin-bottom: 16px;
        }
        .lp-footer-links { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .lp-footer-links a { font-size: 0.8rem; color: #6b665c; text-decoration: none; transition: color 0.2s; }
        .lp-footer-links a:hover { color: var(--on-graphite); }
        .lp-footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.07em;
          color: #5a564d;
        }
        .lp-footer-legal { display: flex; gap: 22px; }
        .lp-footer-legal a { color: #5a564d; text-decoration: none; transition: color 0.2s; }
        .lp-footer-legal a:hover { color: #8c867a; }

        /* ── ANIMATIONS ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pulse {
          0%,100% { opacity: 1; } 50% { opacity: 0.35; }
        }
        @keyframes scrollTicker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scrollMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .reveal.visible { opacity: 1; transform: none; }

        @media (prefers-reduced-motion: reduce) {
          .lp-hero-tag, .lp-h1, .lp-hero-sub, .lp-hero-actions, .lp-hero-right,
          .lp-float-badge, .reveal {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .lp-live-dot, .lp-ticker-inner, .lp-marquee-inner { animation: none !important; }
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .lp-nav { padding: 20px 24px; }
          .lp-nav-links { display: none; }
          .lp-hero { grid-template-columns: 1fr; padding: 100px 24px 60px; }
          .lp-hero-right { display: none; }
          .lp-stats-band { grid-template-columns: 1fr 1fr; }
          .lp-features { padding: 60px 24px; }
          .lp-features-grid { grid-template-columns: 1fr; }
          .lp-feature-card:first-child { grid-row: span 1; }
          .lp-instruments { grid-template-columns: 1fr; padding: 60px 24px; gap: 40px; }
          .lp-testimonial-grid { grid-template-columns: 1fr; }
          .lp-cta { grid-template-columns: 1fr; padding: 60px 24px; }
          .lp-cta-right { border-left: none; border-top: 1px solid var(--line); padding: 32px 0 0; margin-top: 8px; }
          .lp-footer-top { grid-template-columns: 1fr 1fr; gap: 32px; }
          .lp-footer { padding: 40px 24px 32px; }
          .lp-footer-bottom { flex-direction: column; gap: 12px; text-align: center; }
        }
      `}</style>

      <div className="lp-root">

        {/* NAV */}
        <nav className="lp-nav">
          <Link href="/" className="lp-logo">Apex<span>·</span>Markets</Link>
          <ul className="lp-nav-links">
            <li><a href="#markets">Markets</a></li>
            <li><a href="#platform">Platform</a></li>
            <li><a href="#research">Research</a></li>
            <li><a href="#pricing">Pricing</a></li>
          </ul>
          <Link href="/login" className="lp-nav-cta">Open Account</Link>
        </nav>

        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-hero-left">
            <p className="lp-hero-tag">Professional-grade execution</p>
            <h1 className="lp-h1">Trade with<br /><em>surgical</em><br />precision.</h1>
            <p className="lp-hero-sub">Institutional-quality access to equities, derivatives, crypto, and FX — wrapped in an interface built for the serious trader.</p>
            <div className="lp-hero-actions">
              <Link href="/signup" className="lp-btn-primary">
                Start Trading
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" />
                </svg>
              </Link>
              <Link href="/login" className="lp-btn-ghost">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" />
                  <path d="M4.5 6l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
                </svg>
                Sign In
              </Link>
            </div>
          </div>

          <div className="lp-hero-right">
            <div className="lp-book-card">
              <div className="lp-book-header">
                <div>
                  <div className="lp-book-eyebrow">
                    <span className="lp-live-dot" />
                    Order book — BTC/USD
                  </div>
                  <div className="lp-book-price">67,420.50</div>
                  <div className="lp-book-change">▲ +2.38% today</div>
                </div>
                <div className="lp-book-controls">
                  <span className="lp-book-controls-label">Tick size</span>
                  <div className="lp-tick-row">
                    <button className="lp-tick-btn">0.01</button>
                    <button className="lp-tick-btn active">0.1</button>
                    <button className="lp-tick-btn">1</button>
                    <button className="lp-tick-btn">10</button>
                  </div>
                </div>
              </div>

              <div className="lp-book">
                {asks.map((row) => (
                  <div className="lp-book-row" key={row.price}>
                    <span className="lp-book-price-ask">{row.price}</span>
                    <span className="lp-book-track">
                      <span className="lp-book-fill ask" style={{ width: `${row.pct}%` }} />
                    </span>
                    <span className="lp-book-size">{row.size}</span>
                  </div>
                ))}

                <div className="lp-book-spread">
                  <span>Spread <strong>0.50</strong></span>
                  <span>Mid <strong>67,420.50</strong></span>
                </div>

                {bids.map((row) => (
                  <div className="lp-book-row" key={row.price}>
                    <span className="lp-book-price-bid">{row.price}</span>
                    <span className="lp-book-track">
                      <span className="lp-book-fill bid" style={{ width: `${row.pct}%` }} />
                    </span>
                    <span className="lp-book-size">{row.size}</span>
                  </div>
                ))}
              </div>

              <div className="lp-book-footer">
                <div className="lp-book-stat">
                  <div className="lp-book-stat-label">Spread</div>
                  <div className="lp-book-stat-val">0.0007%</div>
                </div>
                <div className="lp-book-stat">
                  <div className="lp-book-stat-label">24h Volume</div>
                  <div className="lp-book-stat-val">$38.2B</div>
                </div>
                <div className="lp-book-stat">
                  <div className="lp-book-stat-label">Depth ±1%</div>
                  <div className="lp-book-stat-val">$14.2M</div>
                </div>
              </div>
            </div>

            <div className="lp-float-badge">
              <div className="lp-float-badge-label">Last fill</div>
              <div className="lp-float-badge-val">67,420.50 · 0.4ms</div>
              <div className="lp-float-badge-sub">+$0.00 slippage</div>
            </div>
          </div>
        </section>

        {/* TICKER */}
        <div className="lp-ticker">
          <div className="lp-ticker-inner">
            {[...Array(2)].map((_, d) =>
              [
                { sym: 'AAPL', price: '189.42', chg: '+1.24%', up: true },
                { sym: 'BTC/USD', price: '67,420', chg: '+2.38%', up: true },
                { sym: 'TSLA', price: '248.10', chg: '−0.87%', up: false },
                { sym: 'EUR/USD', price: '1.0842', chg: '+0.12%', up: true },
                { sym: 'ETH/USD', price: '3,512', chg: '+3.01%', up: true },
                { sym: 'NVDA', price: '875.40', chg: '+4.62%', up: true },
                { sym: 'GOLD', price: '2,318.50', chg: '−0.23%', up: false },
                { sym: 'S&P 500', price: '5,241.33', chg: '+0.56%', up: true },
                { sym: 'WTI OIL', price: '79.14', chg: '−1.10%', up: false },
              ].map((item) => (
                <span key={`${d}-${item.sym}`} className="lp-ticker-item">
                  <span className="sym">{item.sym}</span>
                  {item.price}
                  <span className={item.up ? 'up' : 'dn'}>{item.chg}</span>
                </span>
              ))
            )}
          </div>
        </div>

        {/* STATS */}
        <div className="lp-stats-band">
          {[
            { val: '$4.8B', label: 'Daily trading volume processed' },
            { val: '0.2ms', label: 'Average order execution latency' },
            { val: '180+', label: 'Global markets and instruments available' },
            { val: '99.9%', label: 'Platform uptime guaranteed by SLA' },
          ].map(({ val, label }) => (
            <div key={label} className="lp-stat-cell">
              <div className="lp-stat-n">{val}</div>
              <div className="lp-stat-label">{label}</div>
              <div className="lp-stat-bar" />
            </div>
          ))}
        </div>

        {/* FEATURES */}
        <section className="lp-features" id="platform">
          <div className="reveal">
            <p className="lp-section-label">Built for performance</p>
            <h2 className="lp-section-title">Every edge, engineered.</h2>
          </div>
          <div className="lp-features-grid reveal">
            <div className="lp-feature-card">
              <div className="lp-feature-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M2 10h3l3-6 4 12 3-8 2 2h1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" strokeLinejoin="miter" />
                </svg>
              </div>
              <div className="lp-feature-title">Advanced Order Routing &amp; Smart Execution</div>
              <div className="lp-feature-desc">Our proprietary smart-order router splits and routes your orders across multiple liquidity pools in real time — minimizing slippage and maximizing fill rates on every trade, regardless of market conditions or instrument type.</div>
              <div className="lp-feature-tag">Learn more →</div>
            </div>
            {[
              {
                icon: <path d="M2 2h7v7H2zM11 2h7v7h-7zM2 11h7v7H2zM11 11h7v7h-7z" stroke="currentColor" strokeWidth="1.2" />,
                title: 'Multi-Asset Dashboard',
                desc: 'Monitor your entire portfolio — equities, crypto, FX, and commodities — from a single unified workspace.',
              },
              {
                icon: <><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.2" /><path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" /></>,
                title: 'Real-time Risk Engine',
                desc: 'Automatic position monitoring, margin alerts, and drawdown controls — so you stay in the game longer.',
              },
              {
                icon: <path d="M10 2L2 18h16L10 2zM10 9v4M10 15v.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="miter" strokeLinecap="square" />,
                title: 'Institutional-grade API',
                desc: 'Full REST and WebSocket API access for algorithmic traders. Low-latency data feeds with co-location options.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="lp-feature-card">
                <div className="lp-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">{icon}</svg>
                </div>
                <div className="lp-feature-title">{title}</div>
                <div className="lp-feature-desc">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* MARQUEE */}
        <div className="lp-marquee">
          <div className="lp-marquee-inner">
            {[...Array(2)].map((_, d) =>
              ['Equities', 'Derivatives', 'Cryptocurrency', 'Foreign Exchange', 'Commodities', 'Indices'].map((item) => (
                <span key={`${d}-${item}`} className="lp-marquee-item">
                  {item} <span className="lp-marquee-dot">·</span>
                </span>
              ))
            )}
          </div>
        </div>

        {/* INSTRUMENTS */}
        <section className="lp-instruments" id="markets">
          <div className="reveal">
            <p className="lp-section-label">Live markets</p>
            <h2 className="lp-section-title">Everything moves. Capture it.</h2>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--paper-text-dim)', fontWeight: 300, marginTop: 16, marginBottom: 36, maxWidth: 400 }}>
              Trade across 180+ instruments spanning crypto, equities, FX, and commodities.
            </p>
            <Link href="/signup" className="lp-btn-primary" style={{ display: 'inline-flex' }}>
              Browse All Markets
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" />
              </svg>
            </Link>
          </div>

          <div className="lp-asset-rows reveal">
            <div className="lp-asset-row header">
              <div className="lp-asset-dot" />
              <div className="lp-asset-sym">SYMBOL</div>
              <div className="lp-asset-price">PRICE</div>
              <div className="lp-asset-chg">CHG%</div>
            </div>
            {[
              { sym: 'BTC', name: 'Bitcoin', price: '67,420', chg: '+2.38%', up: true },
              { sym: 'ETH', name: 'Ethereum', price: '3,512', chg: '+3.01%', up: true },
              { sym: 'NVDA', name: 'NVIDIA Corp', price: '875.40', chg: '+4.62%', up: true },
              { sym: 'GOLD', name: 'Gold Spot', price: '2,318.50', chg: '−0.23%', up: false },
              { sym: 'EUR/USD', name: 'Euro / Dollar', price: '1.0842', chg: '+0.12%', up: true },
              { sym: 'TSLA', name: 'Tesla Inc', price: '248.10', chg: '−0.87%', up: false },
            ].map(({ sym, name, price, chg, up }) => (
              <div key={sym} className="lp-asset-row">
                <div className="lp-asset-dot" />
                <div className="lp-asset-sym">{sym}</div>
                <div className="lp-asset-price">{price}</div>
                <div className={`lp-asset-chg ${up ? 'up' : 'dn'}`}>{chg}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="lp-testimonials">
          <div style={{ marginBottom: 48 }} className="reveal">
            <p className="lp-section-label">What traders say</p>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(1.8rem,3vw,2.4rem)', fontWeight: 700, color: 'var(--on-graphite)', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
              Built on trust.<br />Proven in markets.
            </h2>
          </div>
          <div className="lp-testimonial-grid reveal">
            {[
              { initials: 'MK', name: 'Marcus K.', role: 'Prop trader, London', quote: 'The execution speed alone puts Apex Markets ahead of anything else I\'ve used. My scalp strategies work the way they\'re supposed to.' },
              { initials: 'SN', name: 'Sofia N.', role: 'Portfolio manager, Dubai', quote: 'Having crypto, equities, and FX all in one dashboard with a clean interface is rare. Apex makes it feel obvious in hindsight.' },
              { initials: 'RO', name: 'Ryo O.', role: 'Quantitative developer, Tokyo', quote: 'The API documentation is impeccable. Integrated our quant system in two days. Fill rates are noticeably better than our previous broker.' },
            ].map(({ initials, name, role, quote }) => (
              <div key={name} className="lp-tcard">
                <p className="lp-tcard-quote">{quote}</p>
                <div className="lp-tcard-author">
                  <div className="lp-tcard-avatar">{initials}</div>
                  <div>
                    <div className="lp-tcard-name">{name}</div>
                    <div className="lp-tcard-role">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="lp-cta">
          <div className="reveal">
            <p className="lp-section-label">Start today</p>
            <h2 className="lp-cta-h2">Your edge<br />starts <em>here.</em></h2>
            <p className="lp-cta-p">Open a funded account in under 5 minutes. No minimums on demo. Live markets from day one.</p>
            <div className="lp-cta-form">
              <input className="lp-cta-input" type="email" placeholder="Enter your email address" />
              <button className="lp-cta-submit">Get Started</button>
            </div>
            <p style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', color: 'var(--paper-text-dim)', marginTop: 14, letterSpacing: '0.06em' }}>
              Free demo · No credit card · Regulated platform
            </p>
          </div>
          <div className="lp-cta-right reveal">
            <p style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--paper-text-dim)', marginBottom: 26 }}>Why Apex Markets</p>
            <div className="lp-trust-items">
              {[
                { strong: 'FCA & CySEC regulated.', text: ' Your funds are held in segregated client accounts with Tier-1 banking partners.' },
                { strong: 'Negative balance protection.', text: ' You can never lose more than your deposited capital.' },
                { strong: '24/5 professional support.', text: ' Reach a real trading desk specialist in under 2 minutes.' },
                { strong: 'Transparent pricing.', text: ' No hidden fees. Spreads from 0.0 pips. Commission from $2.50/lot.' },
              ].map(({ strong, text }) => (
                <div key={strong} className="lp-trust-item">
                  <span className="lp-trust-mark">—</span>
                  <span className="lp-trust-text"><strong>{strong}</strong>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="lp-footer">
          <div className="lp-footer-top">
            <div>
              <div className="lp-footer-brand">Apex<span>·</span>Markets</div>
              <p className="lp-footer-desc">Professional trading infrastructure for serious market participants. Access global markets with institutional-grade technology.</p>
            </div>
            {[
              { title: 'Platform', links: ['Web Terminal', 'Mobile App', 'API Access', 'TradingView'] },
              { title: 'Markets', links: ['Crypto CFDs', 'Equities', 'Forex', 'Commodities'] },
              { title: 'Company', links: ['About', 'Careers', 'Press', 'Contact'] },
            ].map(({ title, links }) => (
              <div key={title}>
                <p className="lp-footer-col-title">{title}</p>
                <ul className="lp-footer-links">
                  {links.map((l) => <li key={l}><a href="#">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="lp-footer-bottom">
            <span>© 2026 Apex Markets Ltd. All rights reserved.</span>
            <div className="lp-footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Risk Disclosure</a>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
